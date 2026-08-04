# The Problem

A description of a class of defect, for an LLM to reason about and solve. It states what goes
wrong, why it goes wrong, every shape it takes, why it survives review, and which of its
"obvious" remedies conflict with each other. It deliberately prescribes nothing.

The context is a Convex + TypeScript codebase, but the mechanism section is what makes the
problem specific; the rest recurs on any database.

---

## The problem in one sentence

Queries are written whose cost and, worse, whose **results** depend on how much data exists —
and nothing in development, code review, or type checking reveals it, because the defect is
indistinguishable from correct code until the data grows.

---

## Why it is not an ordinary performance bug

Three properties, and each one defeats a normal safeguard.

**It does not degrade — it cliffs.** There is no slow period that warns anyone. The query is
fast, then fast, then it crosses a hard platform limit (Convex: 16,384 documents or 8 MiB read
per query) and the feature fails outright. Ordinary performance work is reactive: you notice
slowness and investigate. Here there is nothing to notice until there is an outage.

**It frequently changes results, not just speed.** This is the part that makes it a
correctness defect wearing a performance defect's clothes. When a read limit is applied before
a filter, the limit silently changes _what the query returns_. Users are shown a confidently
wrong answer — an empty result set where matching data exists, a list permanently missing its
newest entries. No error, no spinner, no empty-state that admits truncation.

**Nobody is watching where it lives.** The worst instances are in scheduled jobs and live
subscriptions — code that runs on a timer or on every write, without a human ever looking at
its output. A scheduled job with this defect burns money every hour of every day whether or
not anyone uses the product, and reveals nothing about itself through normal usage.

---

## The mechanism: why this is easy to write here

The defect is not carelessness. It is the natural output of reasonable assumptions carried
over from other databases, meeting a set of platform behaviours that invalidate them.

- **Filtering does not reduce reading.** In Convex, `.filter()` runs _after_ documents are
  fetched. It changes what the caller sees and nothing about what was read or paid for. A
  query with a filter and no index reads the entire table. Everywhere else, "filter" implies
  "narrow"; here it does not.
- **Only an index bounds a read.** So the practical alternative to an index is not "somewhat
  slower" — it is a full table scan. This inverts the usual cost/benefit intuition about
  whether an index is worth adding.
- **Index ranges are constrained in ways filters are not.** A range must match a prefix of the
  index's fields, and at most one field in a query may be a range (`>`/`>=`/`<`/`<=`). Two
  independent range conditions can never both be served by one index, no matter how the fields
  are ordered. So some perfectly reasonable product requirements have no single-index
  expression at all.
- **Creation time is the hidden default ordering.** It is implicitly appended to every index.
  A limit taken without explicit ordering therefore silently means _the N oldest rows_ — the
  precise opposite of what almost every caller intends.
- **Pagination is cursor-based.** There is no jump-to-page-N without walking the pages before
  it, which quietly makes some UI shapes far more expensive than they appear.
- **Aggregates and rollups exist as separate systems.** Counting or summing through the normal
  query path means reading every row to produce one number, which reads as reasonable code.

None of these are obscure. All of them are invisible in a code review that is checking whether
the logic is right, because the logic _is_ right.

---

## The shapes it takes

The same underlying defect, in the forms it actually appears in.

**A limit applied before the filter.** A query reads the first N rows matching a broad
condition, then narrows them in memory by the thing the user actually asked for. This is the
most damaging form, because the limit changes the answer. Past N rows of the broad condition,
data outside the sample is unreachable by any query — permanently invisible, not merely slow to
find. If the in-memory criterion is selective, the query returns nothing while matching data
exists.

```ts
// The user asked for one city. The read is bounded by something else entirely.
const rows = await ctx.db
	.query('listings')
	.withIndex('by_status', (q) => q.eq('status', 'published'))
	.take(200);
const matching = rows.filter((l) => l.cityId === wantedCity);
```

**Post-fetch filtering mistaken for a bounded read.** `.filter()` used where an index was
needed. Reads the whole table; looks like it reads a slice.

**A range bounded on only one side.** `.lt(end)` with no lower bound, or `.gte(start)` with no
upper bound. This is the most common form and the hardest to see, because there _is_ a range on
it — it reads as bounded. The open end grows forever.

**A range that constrains only the index prefix.** Scoped to a parent entity but not to a time
window, so it reads that entity's entire history to answer a question about one month of it.

**Reading rows to produce a scalar.** Collecting a table to take `.length`, or to reduce it to
a sum, or to answer a yes/no question that a single row would settle.

**A scheduled job whose limit is also its starvation point.** A job takes the first N rows of a
status bucket in creation order and processes what is due among them. Two defects at once: it
re-reads every not-yet-due row on every run forever, and once the bucket exceeds N, rows past
the limit are _never processed at all_. Nothing errors. In a billing sweep that is silent
permanent revenue loss; in a state machine, records that never advance.

**An expensive read inside a live subscription.** A subscription re-executes on every write
touching its read set, so its cost multiplies by the system's write rate rather than by page
views. A subscription whose read set spans a whole table re-runs on every write to that table.
One user idling on such a page can trigger thousands of executions an hour.

**Client-side slicing mistaken for pagination.** The server sends everything; the client
reveals it gradually. This solves a rendering problem and contributes nothing to bounding the
query, but it presents as pagination to anyone reading the UI code, and it is what allows an
unbounded read to sit unnoticed behind a feature that appears to page.

**A data model that makes a filter unindexable.** Several values packed into one field and
matched by string surgery, or a criterion that cannot be expressed as an index range. This is
the root cause of the first shape rather than a separate problem: a developer correctly
concludes "this cannot be indexed," then incorrectly concludes "so I will filter in memory."
The defect is in the schema; it merely surfaces in the query.

**A bound justified by an unenforced assumption.** A read narrowed by domain reasoning — "only
records starting within N days of this window can be relevant" — where nothing prevents data
from violating N. This is worse than an unbounded read, because it looks correct and silently
misses records forever.

**Reconciliation against a partial snapshot.** A job that deletes items on one side having no
counterpart on the other — orphaned files, unreferenced rows. If either side is read
incompletely, every unread item appears to be an orphan and is destroyed. Unlike every other
shape here, this one is irreversible: it deletes live data rather than merely reading too much
or answering wrongly.

**Quadratic joins and repeated point lookups.** Two fetched sets joined by rescanning one
inside a loop over the other, or a per-row lookup issued once per row without deduplication.
Bounded only by whatever bounded the sets, and invisible while those are small.

**Caps that announce nothing.** Any of the above, capped, where the cap is neither logged nor
surfaced. A truncated view that presents as complete is a wrong answer delivered with
confidence, and it will be discovered by a user rather than by the team.

---

## Why the obvious remedies conflict

Part of the problem is that the individually correct responses are mutually exclusive, so
this cannot be solved by uniformly applying one rule.

- **Bounding a read can require a domain limit that does not exist.** Making a range
  two-sided sometimes means inventing a ceiling and enforcing it at the write path — a product
  constraint introduced to serve a query, which has to be true of all existing data too.
- **Offset pagination needs the whole matched set; that is the thing being eliminated.** Yet
  cursor pagination cannot produce an exact result count, cannot jump to a numbered page, and
  turns any in-memory search or sort into a _page-local_ one — so a user searching the table
  would silently be searching only the current page. Converting is a change to what the product
  does, not an internal refactor.
- **Some features genuinely require the complete set.** A map rendering every marker cannot be
  paginated without redesigning the interaction. Where that requirement is real, the fetch is
  legitimately unbounded and the problem moves to the requirement itself.
- **Indexes are not universally the answer.** An index still reads the matching rows, so for
  counts and totals it will read thousands of documents to produce one number. Different
  questions need different mechanisms, and choosing the wrong one is its own defect.
- **Every index costs writes.** Adding one per query is its own kind of wrong, especially on
  high-write tables, and prefix behaviour means some indexes are redundant with ones that
  already exist.
- **Fixing a bound often changes user-visible behaviour** — exact counts become approximate,
  history windows shorten, previously-reachable records stop appearing. The technically correct
  fix is sometimes a product decision in disguise.

---

## Why it survives review

- The code is not wrong in any way a reviewer is looking for. Logic, types, and tests all pass.
- Development datasets are two to five orders of magnitude smaller than the failure threshold.
- Type checking cannot express "this read grows over time."
- The dangerous forms live in code paths nobody watches — cron handlers and subscriptions.
- Several forms are actively camouflaged: a one-sided range looks bounded, client-side slicing
  looks like pagination, `.filter()` looks like it narrows a read, and a limit reads as a
  performance safeguard rather than as something that changes results.
- The most damaging form is _written by competent developers reasoning correctly_ from a
  schema constraint they did not recognise as changeable.
- Where a cap exists, it is usually silent, so even after the threshold is crossed there is no
  signal — the product simply starts being subtly wrong.

---

## What is at stake, in order

1. **Irreversible data loss** — reconciliation jobs deleting live records they merely failed to
   read.
2. **Silently wrong answers** — searches returning nothing while matching data exists; records
   permanently unreachable; counts that are floors presented as totals.
3. **Work that silently stops happening** — scheduled jobs starving past their limit, so
   billing, expiry, and state transitions quietly cease for part of the data.
4. **Hard failure** — features that work until a platform limit is crossed, then stop entirely,
   with no prior degradation.
5. **Cost that compounds without traffic** — scheduled and subscription-driven reads whose
   spend scales with accumulated data and system write rate rather than with usage.
