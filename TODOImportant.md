# TODOImportant

Deliberate ceilings that are **correct today and wrong at some future scale**. Each one is a
decision that was made consciously, with a known trigger for revisiting it. None of these is a
bug; all of them will become one if nobody looks at this file.

The rule they share: an unbounded read in Convex does not degrade gracefully. It works fine,
then it trips the per-query limit (16,384 documents / 8 MiB) and the page fails outright. So
every unbounded read was replaced with a bound — and where the bound changes what a user sees,
it is written down here instead of being buried in a comment.

---

## 1. Admin list tables scan-cap at 10,000 rows

**Where:** `OPERATIONAL_LIMITS.ADMIN_LIST_SCAN_LIMIT` in `src/shared/config.ts`, applied in

- `src/convex/tables/bookings/queries/listBookingsAdmin.ts` (`/admin/bookings`)
- `src/convex/tables/reports/queries/listReportsSafe.ts` (`/admin/reports`)
- `src/convex/tables/accommodations/queries/listAccommodationsAdmin.ts` (`/admin/accommodations`)

### What it does

Each of these previously did `.collect()` over an entire table on its default, no-filter path —
the state the page loads in — and held it as a **live subscription**, so it re-ran on every
write to that table. They now `.take(10_000)` and log a warning when the cap is reached.

### Why a cap and not the proper fix

The proper fix is cursor pagination (`.paginate()`), and it is **not a drop-in**. These tables
paginate by _offset_: the query pulls the matched set, filters and sorts it in memory, slices
one page out, and reports `totalCount: all.length`. Three things depend on having the whole
matched set in hand:

1. **The exact result count.** Cursor mode cannot produce it. `listAuditLogs` already lives
   with this and returns `totalCount: null`.
2. **The numbered pager.** Offset pagination gives "page 4 of 27". Cursor pagination gives
   next/prev only.
3. **Search and sort semantics.** Title search on `/admin/accommodations` and the
   `sortColumn: 'total'` sort on bookings are in-memory passes over the whole matched set.
   Under cursor pagination they would silently become _page-local_ — you would be searching
   the current page, not the table. Restoring real behaviour needs a Convex **search index**
   (`apartments` already has one; `fetchMyAccommodations` uses it correctly and is the model).

So the cap is not laziness — it is refusing to change three visible behaviours without a
decision. What the cap buys is that the failure mode is now _truncation plus a server log_
instead of _the admin page stops loading at all_.

### What breaks at the cap

Past 10,000 matched rows: the table shows the first 10,000, `totalCount` becomes a floor
rather than a true count, and the server logs
`[listBookingsAdmin] scan cap reached — the table is truncated and totalCount is a floor`.
No user-facing error. **Nobody finds out unless someone reads the logs.**

### Trigger to act

Any of:

- a `scan cap reached` warning appears in Convex logs;
- `bookings` or `reports` passes ~5,000 rows (half the cap — act before, not after);
- an admin reports a wrong count or a missing row.

`reports` will hit this first. It is written by `createReport`, a **public unauthenticated
mutation**, so its growth rate is set by the internet rather than by business volume.

### When you do it

Decide the UI question first — is the admin table allowed to lose its exact count and its
numbered pager? If yes, cursor pagination is straightforward. If no, you need a counter
(aggregate component) for the total _and_ a search index for the filters, and the pager stays.
Do not raise the cap as a substitute; that just moves the cliff and keeps the silence.

---

## 1b. Public search — FIXED, but read the deploy note

Kept here because it was the worst bug in the codebase and the fix has a hard ordering
requirement.

**What it was:** `fetchSearchAccommodationsSafe` read the first 200 published listings via
`by_status` (creation order, so the **oldest**) and then matched the region in memory. The cap
was applied _before_ the filter. So at 201+ published listings the newest were in no search
result, ever — and a city whose listings all fell outside that sample returned **zero results
while matching listings existed**. Silent, and it broke the platform's core feature at a
listing count Belgrade reaches easily.

**Why it was written that way:** `placeId` was stored merged as `"<cityId> <countryId>"` and
matched with `.split(' ').includes(picked)`. That is not index-expressible, so the query could
not use `fetchOptimized` (which refuses post-scan filtering by design) and fell back to
sample-then-filter. The data model was the root cause, not the query.

**The fix:** `cityPlaceId` / `countryPlaceId` are now their own columns, derived server-side by
`splitRegionPlaceId` on every write, indexed as `by_status_city` / `by_status_country`. A
region search is two exact index reads, unioned — it reads that region's listings and nothing
else, so catalogue size no longer affects what search returns. Language independence is
unchanged: it still matches on Google place ids, so "Beograd" and "Belgrade" are one id.

⚠️ **Deploy order matters.** Search matches on the split columns, so a row that has only the
old merged `placeId` matches nothing and disappears from region search. Run the backfill after
deploying the schema and **before** users hit the new query:

```bash
bunx convex run tables/accommodations/crons/backfillRegionPlaceIds:backfillRegionPlaceIds
```

It is idempotent and self-scheduling. It logs `skippedNoPlaceId` — any listing counted there
has no region id at all and is unsearchable by region; investigate rather than ignore.

**Still capped:** the _unscoped browse_ (`/search` with no region picked) keeps
`SEARCH_SCAN_LIMIT` (200), because there is no index to bound "show me anything" to. That is
acceptable — every listing remains reachable by searching its region — and it now logs when
hit. **Trigger:** if browse-everything needs to be complete, that pane needs real pagination,
which also forces the map's every-marker requirement to change.

**Note:** the list's infinite scroll is client-side only — it slices an array the server sent
in full. It is not, and never was, a server-side bound.

---

## 2. Registered-user count caps at 10,000

**Where:** `USER_COUNT_CAP` in `src/convex/auth/component/userQueries.ts` (`countUsers`),
surfaced as `usersTotalCapped` on the admin dashboard.

Was `(await ctx.db.query('user').collect()).length` — a full scan of the Better Auth `user`
table. Worse than it looks: it sits inside `fetchAdminDashboardPageSafe`, a subscription whose
read set spans the whole platform, so it re-ran on **every rollup write anywhere**, not once
per page view. Cost was signups × platform event rate.

Now `.take(CAP + 1)`, exact below the cap, `"10,000+"` above it.

**Why not exact:** the `user` table is component-local, so the app's aggregate triggers never
see its writes and an O(log n) aggregate is unavailable.

**Upgrade path:** a counter row maintained by a Better Auth
`databaseHooks.user.create.after` / `delete.after` hook. Worth doing only if an exact figure
past 10,000 users actually matters to anyone.

**Trigger:** the dashboard starts reading "10,000+" and someone cares.

---

## 3. `MAX_STAY_NIGHTS` is load-bearing, not a product preference

**Where:** `PROJECT_SETTINGS.MAX_STAY_NIGHTS` (365) in `src/shared/config.ts`.

This is the one entry here that is a **correctness invariant, not a scale ceiling**, and the
one most likely to be broken by someone acting reasonably.

Every availability read bounds its index scan to stays _starting_ within `MAX_STAY_NIGHTS`
before the window it cares about:

- `hasAvailabilityConflict` (the hot path — public `/search` fans it out 200× per dated query)
- `findOverlappingPendingBookings`
- `blockApartmentDates`
- `fetchApartmentCalendarSafe`, `fetchAccommodationBySlugForBookSafe`
- `deleteAccommodation`
- `fetchHostDashboardStats` (the in-house slice)

**A stay longer than this ceiling would fall outside those ranges, would not be read, and its
nights would be silently double-bookable.** That is why `createBookingSchema` enforces it —
the bound is only sound because the data cannot violate it.

**If you raise the product limit, raise the constant in the same commit.**
`src/shared/features/booking/utils/availabilityBounds.check.ts` asserts the two stay in step;
run it with `bun src/shared/features/booking/utils/availabilityBounds.check.ts`.

---

## 4. Host calendar shows a rolling year of history

**Where:** `fetchApartmentCalendarSafe`.

Previously read every booking _and every block_ a listing ever had, on a subscription that
re-runs on every write to that listing. Blocks are stored **one row per night**, so a host who
closes a month each year accumulates dead rows permanently.

Now windowed to `today − MAX_STAY_NIGHTS` and forward without limit. Forward is open because
that is a calendar's actual job; a year back covers every in-progress stay plus recent context.

**Behaviour change:** navigating to a month more than a year in the past shows an empty
calendar. **Trigger:** a host asks where their old bookings went — at which point the fix is
month-windowed args keyed to the visible month, not removing the bound.

---

## 5. Orphan-file sweeps refuse to run on oversized datasets

**Where:** `cleanupOrphanDataR2`, `cleanupOrphanDataConvexStorage`.

These delete rows with no file and files with no row. Deleting one side requires a **complete**
snapshot of the other — against a partial snapshot, every unread item looks like an orphan.
The R2 sweep previously had exactly this bug and would delete live rows once the bucket passed
5,000 objects.

Both sides are now bounded and both bounds are checked before anything is deleted. Past the
limits the sweep does **nothing** and logs `cleanup SKIPPED`. That is the correct failure — the
alternative is data loss — but it does mean orphans accumulate silently once you outgrow it.

**Trigger:** a `cleanup SKIPPED` line in the logs. **Fix:** convert to a self-scheduling
paginated sweep; `backfillListingMonetization` in `listingFeeSweepCron.ts` is the working
pattern to copy.

---

## 6. `/sitemap.xml` caps at 5,000 listings

**Where:** `OPERATIONAL_LIMITS.SITEMAP_MAX_URLS`, used by `fetchSitemapAccommodations`.

Convex has no column projection, so listing the sitemap means reading whole apartment
documents (images, description, amenities) for two fields. Cached an hour at the edge, so it
runs roughly daily in practice.

Past the cap, newer listings are simply **not in the sitemap** — they stay discoverable via
internal links, but lose the direct signal. The protocol limit is 50,000 URLs per file.

**Trigger:** the published catalogue nears 5,000. **Fix:** a sitemap _index_ with paginated
child sitemaps — not a bigger `.take()`, which would eventually trip the per-query limit and
take the sitemap down entirely.

---

## Also outstanding (tracked elsewhere, listed so this file is the one place to look)

- **Audit-log retention backfill.** `auditLogs.retentionUntil` is stamped at write time now.
  Rows written before that column existed have no deadline and are **kept forever**. Backfill
  before this matters.
- **Convex schema deploy.** Seven indexes and three columns were added
  (`by_apartment_status_checkin`, `by_status_checkin`, `by_status_expiry`,
  `by_transfers_active`, `by_retention_until`, `by_status_city`, `by_status_country`;
  `auditLogs.retentionUntil`, `apartments.cityPlaceId`, `apartments.countryPlaceId`). Queries
  referencing them fail until `convex deploy` builds them — deploy the schema before the
  frontend, then run `backfillRegionPlaceIds` (see 1b) before search traffic arrives.
- **Dev seeders don't set `placeId`.** `seedMonetization` / `seedMockBookings` insert
  apartments with no region id, so seeded listings never appear in a region search. This was
  true before the search change too — it is not a regression — but it will make the fix look
  broken while testing against seeded data. Search by no region, or add a placeId to the seeds.
- **`@sveltejs/adapter-vercel` is not pinned.** The build currently ends with "Could not detect
  a supported production environment" and `adapter-auto` installs the real adapter mid-build,
  which is non-hermetic and fails in offline CI.
- **Legal pages do not exist.** No `/terms`, `/privacy`, `/cookies`, and the footer's only
  Legal link points at the homepage. Launch blocker for an EU-facing platform taking payments.
  Same category: Google Maps loads with no cookie-consent gate.
