# General System Design Rule — Live Subscriptions Are Default

> Status: **standing rule** (decided 2026-07-23). Applies to this project and is written to be
> portable to any future project, with or without Convex. Backend-agnostic: "subscription"
> below means any live data channel (Convex `useQuery`, GraphQL subscriptions, Firebase
> listeners, Supabase realtime, raw WebSockets, SSE, polling loops).

## The rule

**Every data read is a live subscription by default. A read becomes one-shot only when a
subscription is impossible or pointless — the route loaders (which can't subscribe) and
server-only reads that never change under the viewer.**

A live subscription re-runs whenever a write touches its read set, so another user's write, a
cron advancing a status, or your own mutation made on the same screen all show up without a
manual refetch. The cost is server-side read-set tracking and push traffic for as long as the
component is mounted — noise at this platform's concurrency (peaks in the low hundreds), and
the one-shot dual path it replaced (`convexOneShotQuery`, `safeQuery`, `realtime`/`onReady`)
was more expensive to maintain than the subscriptions it saved. If the platform ever reaches
thousands of concurrent viewers, the plan is a Postgres migration, not a revival of one-shot
reads.

## The decision test

Ask one question per piece of data:

> **"Can this data change while the user is looking at this screen, in a way they must see
> without acting?"**

- **YES (the default) → live subscription.** Subscribe with `useQuery`. Another user writes
  it, a background process advances it, or the same screen both displays and mutates it —
  the subscription re-runs on the write, no manual refetch.
- **NO → one-shot.** Only reach for a one-shot read when a subscription is impossible (a
  route loader) or the data genuinely cannot change under the viewer (build-time config).

### Worked examples (from this project)

| Data                                                          | Verdict                      | Why                                                                                                     |
| ------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| Category options in the add/edit-product form                 | **Subscription**             | The option set can change (edited elsewhere) while the form sits open — live keeps the dropdown honest. |
| Slug→name lookup for a table column                           | **Subscription**             | Live by default; the lookup set changes on another page.                                                |
| The admin orders table                                        | **Subscription**             | New orders arrive from _other people_ while the admin is watching.                                      |
| The cart sidebar                                              | **Subscription**             | The same screen mutates it (add/remove) and server-side pruning can change it.                          |
| A products table on the page where products are edited inline | **Subscription**             | Display and mutation share the screen.                                                                  |
| Static-ish config, feature lists, country lists               | **One-shot** (or build-time) | Changes require a deploy or an admin action elsewhere.                                                  |

## Companion rules

1. **Fetch the shape you need, not the row.** A lookup endpoint returns the minimal
   projection (`{ slug, name }`), not full documents. Smaller payload, no accidental coupling
   to fields the consumer never reads.
2. **Whole-set reads get a whole-set endpoint.** If a consumer needs _all_ rows of a small set
   (a `<select>`, a lookup map), give it a dedicated non-paginated query with a known-small
   bound — do not loop a paginated API to drain pages, and never silently render page 1 as if
   it were the whole set. (Paginated UI lists keep pagination + visible pager controls.)
3. **Fetch where the data is used.** No layout-level fetching + global store mirror for feature
   data — that makes every page pay for one page's need. Lift a fetch to a layout only for
   data genuinely read on ~every page (in this project: auth/session only).
4. **Dedupe repeated fetch logic into a feature-scoped hook/helper** once ≥2 call sites are
   identical — the hook wraps `useQuery`; DRY is not a license to duplicate subscriptions.
5. **When in doubt, subscribe.** Downgrading a live read to one-shot later is a small, local
   change. The subscription is the default; the one-shot read is the exception that has to
   justify itself.

## Why this matters (cost model)

Per unnecessary subscription you pay, continuously:

- **Server:** the backend tracks the query's read set to know when to invalidate it; every
  write to an overlapping range triggers re-execution and a push.
- **Network:** an entry on the WebSocket/live channel, invalidation pushes, reconnect replay.
- **Client:** reactive graph bookkeeping, re-renders on every push, memory for the mirror.
- **Billing:** realtime backends (Convex included) bill function re-executions — idle
  subscriptions to hot tables re-run on every write someone else makes.

A live subscription's standing cost is real but bounded; at this platform's concurrency it is
noise. The one-shot dual path it replaced (`convexOneShotQuery` + `safeQuery` + `realtime`
prop + `refetch` plumbing) cost more in maintenance than the subscriptions it saved — that is
why the default flipped. Route-loader reads keep the one-shot cost model exactly as written:
one execution, once, typically cache-served.

---

## § DATA-LOADING MECHANISM — WHEN TO USE WHAT FOR MAXIMUM PERFORMANCE & SPEED

> Status: **standing rule** (added 2026-07-23). Companion to the realtime rule above. Where
> the realtime rule decides **WHAT** kind of read a piece of data gets (one-shot vs
> subscription), this section decides **HOW and WHERE** you actually wire that read for the
> fastest possible perceived and real performance. Our app is **hybrid**: it is SPA-leaning,
> but **some routes use a server loader (`+page.server.ts`) and some do not** — so the
> mechanism choice includes _which loader file_ the read goes in. Source framework:
> turtledev.io, "SvelteKit SPA — when to use load functions and onMount", reconciled with our
> project and extended to cover server loaders.

### The three orthogonal decisions

Every data wire-up is really three questions, answered in order. Answering an earlier one does
**not** answer a later one:

1. **WHAT** (realtime rule, above): one-shot or subscription?
2. **WHERE** (this section): does the read go in a **route loader**
   (`+page.ts` / `+page.server.ts` / `+layout.ts`) or in the **component lifecycle**
   (`onMount` / `$effect`)? One-shot reads are almost always fastest in a loader; subscriptions
   and lifecycle work belong in the component.
3. **WHICH FILE + HOW** (this section): if it's a loader, is it a **universal** loader
   (`+page.ts`) or a **server** loader (`+page.server.ts`)? And is the promise **streamed**
   (returned un-awaited) or **awaited** (blocking)?

The realtime verdict, the universal-vs-server choice, and the streamed-vs-awaited choice are
independent knobs. The rest of this section is the detail.

### The performance principle (why the loader wins)

The goal is a small, fixed budget: **start the request as early as possible, and paint
something the instant navigation begins.** Two facts drive every rule below:

- **The route loader starts earlier than the component.** SvelteKit begins running `+page.ts`
  as soon as navigation is _decided_ — before the page component is instantiated. `onMount`, by
  contrast, only fires _after_ the component has been created and mounted. Fetching in
  `onMount` therefore inserts a guaranteed waterfall: mount → _then_ fetch → _then_ render.
  The loader collapses that to: fetch (already in flight) → render.
- **The loader is what preloading hooks into.** `data-sveltekit-preload-data` (hover/tap
  intent) can only prefetch data that lives in a loader. Data fetched in `onMount` cannot be
  preloaded, so it can never be "already settled by the time the user clicks." This is the
  single biggest free speed win in the app, and it is loader-only.

**Consequence:** in an SPA, "no SSR" does _not_ mean "fetch in the component." The loader still
runs (in the browser), still starts before the component, and still enables preloading — so a
read that CANNOT subscribe (route-loader-only, secret/DB-bound, build-time config) belongs in
the loader, not `onMount`. Live reads belong in the component via `useQuery`.

### Which loader file — universal `+page.ts` vs server `+page.server.ts`

Once a read is going in a loader (step 2), pick the file. We use **both**, per route, on
purpose. The default is the **universal** loader; a **server** loader is opt-in and must earn
its place, for the same reason a subscription must — it costs a mandatory server round-trip.

**Universal loader (`+page.ts`) — the default.**

- Runs in the browser on client-side navigation (and on the server too during SSR, but we lean
  SPA). On an in-app navigation it goes **straight from the browser to the data source** — one
  hop.
- With a separate backend (Convex, our API), this is the fast path: browser → backend directly,
  **no SvelteKit server middleman**. For most of our pages this is what you want.
- Can return **anything** — promises (so it streams, Pattern A), class instances, functions —
  because the value never has to be serialized across the wire.
- Use it whenever the read needs only things safe in the browser: public endpoints, the public
  API, `PUBLIC_*` env, the client SDK.

**Server loader (`+page.server.ts`) — opt-in, when the read must run server-side.**

Reach for it **only** when at least one is true:

- The read needs a **secret**: private env / API key / service credential that must never reach
  the browser bundle.
- It does **direct DB / server-only access** (a driver or SDK that must not run client-side), or
  uses server-only Node libraries.
- It must read/write **server-side cookies, headers, or the session** during load.
- You want to **hide the query shape or origin** from the client entirely.

**The performance cost of a server loader:** on every _client-side_ navigation SvelteKit must
make a round-trip to our own server to run `+page.server.ts` before the page can render — an
extra hop the universal loader does not pay when it talks to the backend directly. It also
constrains the return value to **serializable data** (devalue: no class instances, no
functions; promises can still be streamed). So a server loader is the right call for
secret/DB-bound reads, and the wrong default for a public read that a universal loader could
fetch directly.

**Combine them when a page needs both.** `+page.server.ts` can return the secret/DB-bound part;
`+page.ts` runs after it, receives that via its `data` argument, and augments with public,
non-serializable, or streamed reads. Don't push a public read into the server loader just
because a sibling read on the same page needs the server.

Both files support **streaming and awaiting** (Patterns A/B below) and both are **preloadable** —
those choices are independent of universal-vs-server.

Quick test:

> **"Does this read need a secret, direct DB access, or server-only cookies/session?"**
> **YES → `+page.server.ts`. NO → `+page.ts`** (default; one hop to the backend, can stream
> anything).

### The three patterns

Patterns A and B are about **streamed vs awaited**, and apply to **either** loader file
(`+page.ts` or `+page.server.ts`). Pattern C is the component-lifecycle escape hatch.

#### Pattern A — `+page.ts` **streamed** (return the promise, don't `await`) → THE DEFAULT

Use for **content you consume, not edit**: lists, tables, dashboards, search results, detail
views without inline editing. This is the default for most pages in the app.

Return the promise from the loader instead of awaiting it. The page shell renders immediately;
the data resolves into an `{#await}` block:

```ts
// +page.ts
export const load = ({ fetch }) => {
	return { todos: getTodos(fetch) }; // NOT awaited — streams
};
```

```svelte
{#await data.todos}
	<TodosSkeleton />
{:then todos}
	{#each todos as todo}...{/each}
{:catch}
	<p>Could not load todos.</p>
{/await}
```

Why it is the fast default:

- **Instant navigation.** The shell paints before the request finishes — the user sees layout +
  skeleton immediately, never a blank or stale screen.
- **Pending / resolved / error for free.** `{#await}` gives all three branches with no manual
  `loading`/`error` flags.
- **Preload on intent.** With `data-sveltekit-preload-data` on links, the fetch starts on hover;
  it is often already settled by the time the click lands.
- **Cheap refresh after mutations.** `invalidate('app:todos')` re-runs the loader and re-renders
  — no manual cache patching.
- **Param changes auto-refetch.** `/todos/1` → `/todos/2` re-runs the loader with the new param
  and cancels the in-flight prior request automatically.

#### Pattern B — `+page.ts` **awaited** (block on the promise) → SINGLE-ENTITY EDIT FORMS

Use for **edit pages for one record** where you need dirty-state detection: profile/account
settings, a single-record edit page, onboarding forms prefilled with current values.

Await inside the loader so `data` holds the concrete server value, not a promise:

```ts
// +page.ts
export const load = async () => {
	return { profile: await getProfile().then((r) => r.data) };
};
```

Why awaited here and not streamed:

- **Cheap dirty detection.** Because `data.profile` is the real server truth (a stable
  reference), you diff the live form state against it directly to know if there are unsaved
  changes — and warn before navigation. Streaming would hand you a promise, forcing an
  `$effect` to await and re-seed form state, and you'd lose that cheap reference.
- **No manual snapshot.** You don't hand-manage an `original` copy on every save the way you
  would if you fetched in `onMount`.
- **Trade-off:** awaited blocks navigation until the data arrives. That's acceptable for a
  single small record. If the fetch is slow, show a skeleton from the **parent layout** using
  the `navigating` store matched against the target route ID — do not switch to streaming just
  to hide latency.

#### Pattern C — `onMount` (and `$effect`) → LIFECYCLE, NOT ONE-SHOT DATA

Use **only** when the work outlives a single fetch — i.e. it needs the component to be alive:

- **Subscriptions** (this is where the realtime rule's "YES → subscription" lands): WebSocket /
  SSE / Convex `useQuery` / Firebase listeners. The channel must open on mount and, critically,
  **tear down on unmount** — a loader has no unmount hook, so a subscription started there
  leaks.
- **Polling timers** (`setInterval` refresh) — must be cleared on unmount.
- **Progress-driven UI**: XHR/file-upload progress events updating reactive state.
- **Browser/device APIs** that need the DOM or a live element: `IntersectionObserver`, media
  queries, geolocation, canvas, focus management.

`onMount` and loaders are **not mutually exclusive** — the common shape is a dashboard whose
initial data streams from the loader (Pattern A) while `onMount` layers a WebSocket on top for
live updates. Load the first paint from the loader; let `onMount` own the ongoing channel.

Do **not** use `onMount` merely to fetch one-shot data "because it's familiar" — that forfeits
the earlier start and the preloading win for nothing.

### Decision matrix

| Data / scenario                                         | Realtime verdict | Where                  | Loader file                                          | Streamed / awaited                            |
| ------------------------------------------------------- | ---------------- | ---------------------- | ---------------------------------------------------- | --------------------------------------------- |
| List, table, dashboard, search results, detail view     | **Subscription** | Component              | n/a                                                  | `useQuery` (the default everywhere)           |
| Single-record edit form (profile, settings, onboarding) | **Subscription** | Component              | n/a (secret/DB reads still need a server loader)     | `useQuery` — loads the record live            |
| Small lookup / `<select>` options / slug→name map       | **Subscription** | Component              | n/a                                                  | `useQuery` — live by default                  |
| Session / auth needed on ~every page                    | **Subscription** | Component              | n/a (unless httpOnly-cookie/secret → server loader)  | `useQuery` in the root layout — gates the app |
| Read needing a secret / private env / direct DB access  | One-shot         | Loader                 | **`+page.server.ts`** (required)                     | Streamed or awaited per Pattern A/B           |
| Public read from our backend / Convex (most pages)      | **Subscription** | Component              | n/a                                                  | `useQuery` — live by default                  |
| Admin orders table, cart sidebar, inline-edit table     | Subscription     | Component              | n/a                                                  | `onMount` / `useQuery`                        |
| Chat, notifications, live presence                      | Subscription     | Component              | n/a                                                  | `onMount` (open + teardown)                   |
| Polling refresh, upload progress, device/DOM APIs       | Lifecycle        | Component              | n/a                                                  | `onMount`                                     |
| Initial paint + live updates on one screen              | Both             | Loader **+** component | loader (`+page.ts`/`.server.ts`) streams first paint | Streamed **+** `onMount` channel              |

### Speed checklist (run per page)

1. **Can this read subscribe?** If yes, `useQuery` in the component (the default). If it's a
   route-loader / server-only read that can't subscribe, put it in the **loader**, not `onMount`.
2. **Which loader file?** Needs a secret / direct DB / server-only cookies → **`+page.server.ts`**.
   Otherwise → **`+page.ts`** (default; one hop straight to the backend, no server round-trip).
3. **Editing one record?** → **awaited** loader (Pattern B) for cheap dirty state. Otherwise →
   **streamed** loader (Pattern A) so the shell paints instantly. (Applies to either file.)
4. **Enable preloading.** Ensure links use `data-sveltekit-preload-data` (hover intent) so
   loader data is in flight before the click. Works for both loader files.
5. **No waterfalls in the loader.** Fire independent requests in parallel (`Promise.all` /
   return multiple promises), never `await` one just to start the next.
6. **Fetch where used, minimal projection, whole-set endpoint for selects** — unchanged from
   the companion rules above; they apply to the loader too.
7. **Subscriptions and timers live in `onMount` and MUST tear down on unmount.**

### § FOR LLMs / AI ASSISTANTS — READ BEFORE WIRING A PAGE'S DATA

1. **Default = live subscription.** Wire the read with `useQuery` in the component. Only when
   the read cannot subscribe (route loader, secret/DB-bound, build-time config) does it become
   one-shot.
2. **One-shot ⇒ route loader by default, streamed.** The remaining one-shot reads belong in a
   loader returning an un-awaited promise rendered through `{#await}`. Do NOT fetch one-shot
   data in `onMount` — that adds a mount→fetch waterfall and forfeits preloading. If you write
   a one-shot fetch in `onMount`, justify in a code comment why the loader was unsuitable
   (almost never true).
3. **Pick the loader file explicitly — do not default to `+page.server.ts`.** Use **`+page.ts`
   (universal)** unless the read needs a **secret / private env, direct DB or server-only
   access, or server-side cookies/session** — only then use **`+page.server.ts`**. A server
   loader forces an extra browser→our-server round-trip on every client navigation and
   restricts the return to serializable data; a universal loader talks to our backend/Convex in
   one hop. If you choose `+page.server.ts`, state in a comment which of the three triggers
   applies. When both are needed on one page, put the secret/DB part in `+page.server.ts` and
   let `+page.ts` augment via its `data` arg — don't move a public read to the server loader.
4. **Await in the loader ONLY for single-entity edit forms** that need dirty-state detection.
   Everywhere else, stream. (Universal or server — the await/stream choice is independent of the
   file.)
5. **`onMount` is for lifecycle, not fetching:** subscriptions, polling, progress, device/DOM
   APIs — anything that must set up on mount and **tear down on unmount**. A subscription in a
   loader leaks; never put one there.
6. **Combine, don't choose, when a screen needs both:** stream the first paint from the loader
   AND open the live channel in `onMount`.
7. **Never introduce a loader waterfall.** Start independent requests in parallel.
8. **When uncertain, say so in your summary,** e.g. "one-shot, streamed via universal `+page.ts`
   per GeneralSystemDesignRule.md; say the word if this needs a server loader for a secret,
   awaited dirty-state, or a live channel."

Mental checklist to run on every page wire-up:
`can it subscribe? → useQuery in the component (default) | can't subscribe (route loader / server-only)? → universal +page.ts by default, +page.server.ts only for secret/DB/cookies; stream by default | always: preload links, parallel requests, minimal projection, fetch where used.`

---

## § LIST & PAGINATION MECHANISMS — WHICH ONE, AND WHAT IT COSTS

> Status: **standing rule** (added 2026-08-04). Third companion section. The realtime rule
> decides **WHAT**, the data-loading section decides **HOW/WHERE** — this one decides **which
> list primitive** you reach for once you know you are rendering a collection.

### The one thing that is true of all of them

**Every mechanism filters and paginates on the server.** None of them ships a table to the
browser and narrows it there. "Component filters" names _where the filter state lives_ (component
state vs the URL) — not where filtering happens. There is no client-side filtering anywhere in
this project, and adding some would be a bug, not a shortcut.

So the choice is never "server vs client filtering". It is three independent axes:

| Axis                | Options                                            | Consequence                                                                                                        |
| ------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **State location**  | URL vs component state                             | Is this view linkable, shareable, crawlable, back-button-correct?                                                  |
| **Transport**       | loader (one-shot HTTP) vs subscription (WebSocket) | Does it update live? Live is the default; loaders are the one-shot exception.                                      |
| **Pagination mode** | `offset` vs `cursor`                               | Page numbers + exact total (O(matching rows) scan, or O(log n) with an aggregate) — or O(page) reads with neither. |

### The mechanisms

| Mechanism              | Component                                    | State         | Transport               | Mode              | Use for                                                                                                    |
| ---------------------- | -------------------------------------------- | ------------- | ----------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| **URL-driven list**    | `DataList`/`DataTable` + `pageHref` + loader | URL           | one-shot (loader)       | `offset`          | Public/SEO listings with page numbers; any view worth linking, sharing, crawling                           |
| **URL-driven scroll**  | `usePaginatedQuery` + `infiniteScroll`       | URL (filters) | subscription (per page) | `cursor`          | `/search` — filters are linkable, results are endless and unbounded (`AccommodationsSystemDesign.md` §9.1) |
| **State-driven table** | `ConvexDataTable`                            | component     | subscription            | `cursor`/`offset` | Admin, host and guest tables                                                                               |
| **State-driven list**  | `ConvexDataList`                             | component     | subscription            | `cursor`/`offset` | Non-tabular collections (saved places)                                                                     |
| **Presentational**     | `DataTable` / `DataList` / `PaginatedData`   | caller's      | none — renders props    | caller's          | You already have the rows and only need the chrome                                                         |

There is no separate URL-driven component: the SAME `DataList` / `DataTable` the admin screens
use becomes URL-driven the moment you pass `pageHref` (and `sortHref` on a table). In that mode
they issue **no queries at all** — they render what the loader already fetched and emit real
`<a href>` links, `page` goes read-only because the loader owns it, and the paginator gains
numbered pages (first and last always linked, middle elided). That is the whole point: a crawler
follows them, middle-click and "open in new tab" work, and the page still navigates with
JavaScript disabled.

### The decision test

Ask in this order; the first "yes" wins:

1. **"Must this view have an address?"** — must a user be able to link, bookmark, share or
   crawl _this exact filtered page_? → **URL-driven list.** This is the only mechanism whose
   state survives a reload. It is also the only one that is crawlable.
2. **"Do rows change under the viewer while they watch?"** (the realtime rule) → a **Convex
   component** (they are all live now). If the answer is no AND the surface needs a canonical
   address, the URL-driven loader list (row 1) already covers it.
3. **"Are page numbers meaningful?"** → table/list with a paginator. If the collection is a
   feed where page numbers mean nothing (a timeline, a map's markers), accumulate instead of
   replacing (see `infinite-scroll.svelte.ts`).

**These compose badly on purpose.** There is no "URL-driven infinite scroll" and no
"URL-driven subscription": infinite scroll has no page to name, and the loader owns the page and
re-runs on navigation while a subscription pushes rows the URL never asked for.

### Per-mechanism notes

**URL-driven list** — the only mechanism with canonical URLs, and the only one that owes you
redirects. The loader owns the page number and the filters; changing a filter must drop the page
(a page 7 may not exist under the new filter), `?page=1` must never be emitted (one address per
page), and a non-canonical or out-of-range `page` must redirect rather than render duplicate or
empty content a crawler will index.

**`listUrlState.ts` is the primitive every one of these rules lives in**
(`@/shared/features/pagination/utils/`): `listHref` (patch the URL, drop position params on a
filter change, never emit `?page=1`, preserve params it doesn't own), `readPage`, `readSort` /
`sortHref` (allow-list bound, so `?sort=passwordHash:asc` can never reach a query), the
`?cs=` cursor trail (`pushCursorHref` / `popCursorHref` / `cursorPage`, capped at
`PAGINATION_DATA.MAX_CURSOR_STACK`) and `hasActiveFilters`. It is a pure URL codec — no `$app`,
no `@sveltejs/kit`, no DOM — which is why it sits in `shared/` and Convex can transitively
import it. Domain codecs layer ON it rather than re-deriving it: a search-params module owns
what a filter IS (which params exist, how each validates, how they couple) and delegates what a
list URL DOES to `listUrlState`, so no control has to know that filtering resets the page.

**State-driven table/list** — no URL noise, simplest state. Each costs one open subscription
per viewer that re-executes on every write touching its read set. That is the standing default;
it is what makes a write on the same screen show up without a manual refetch.

### All Convex components are live

Both `ConvexDataTable` and `ConvexDataList` hold a live subscription — there is no one-shot
mode, no `realtime` prop, no `refetch`. The old dual path (`src/utils/convexOneShot.svelte.ts`,
`safeQuery`, `onReady` plumbing) was deleted: one subscription path is simpler than two, and
the performance difference only matters at concurrency this platform will never see.

Data that cannot subscribe (route loaders, server-only reads) is the one-shot exception and
goes in the loader per the data-loading section above.

Every list surface in this project is a live subscription:

| Surface                   | Transport    | Why it's live                                                    |
| ------------------------- | ------------ | ---------------------------------------------------------------- |
| Admin tables, host tables | subscription | Another party writes them, or a cron advances statuses, mid-view |
| `/guest/favorites`        | subscription | Unfavouriting re-runs the list; the layout feeds the id set live |
| Saved-listing id set      | subscription | Layout's `fetchMyFavoriteIdsSafe`; own writes confirm the set    |

**Seeing your own writes is automatic.** A live list re-runs on the mutation's own write, so a
bulk delete on the same screen drops the rows without a manual `refetch()` — that plumbing was
deleted with the one-shot path. `favoritesClass` keeps the same property: the layout feeds the
saved-id set as a union, and `toggleFavorite`'s mutation confirms each optimistic flip.

### Hard limits — read before committing to one

These are ceilings, not bugs. Each one will eventually surface in a real project.

1. **Plain `offset` mode reads every matching row, up to a cap — wire an aggregate to remove
   the bound.** The scan form materializes the matched set to compute an exact `totalCount`
   and slice the page — O(matching rows), capped at `PAGINATION_DATA.OFFSET_SCAN_LIMIT`
   (10,000). **Past the cap the query stops counting rather than throwing**: it returns
   `totalCount: null`, page numbers disappear, prev/next keeps working, nothing 500s. Filters
   count: a well-filtered query over a huge table is fine; the unfiltered "browse everything"
   page is what loses its numbers first.
   _When a surface genuinely needs exact totals + page jumps at unbounded scale:_ use
   `fetchOptimized`'s **`aggregate` mode** (`@convex-dev/aggregate`; see
   `pagination/fetchOptimized/README § Aggregate mode` and `convex/functions.ts`) — exact
   `totalCount` and O(log n) jumps to any page, at the cost of one counter per surface kept in
   sync by the write-path triggers (`convex/functions.ts`). Check the cheaper rungs first: add
   a filter, or accept cursor mode.
2. **Every write to an aggregated table must go through `convex/functions.ts`.** The raw
   `mutation` / `internalMutation` from `_generated/server` bypass the triggers, and ONE
   bypassed write drifts the counter permanently — a wrong number rendered with confidence.
   Queries and actions are unaffected (no `ctx.db` writes); keep importing those from
   `_generated/server`. See also § TABLE COUNTS VS ANALYTICS below.
3. **Search can never have page numbers or a total.** Convex search indexes are paginate-only.
   A searchable listing degrades to prev/next while searching. Platform constraint, not
   something the factory can hide.
4. **Cursor pagination carries its history in the URL, and that history is bounded.**
   `pushCursorHref` / `popCursorHref` keep a trail of cursors in `?cs=`, which is what makes
   "previous" a real link that survives reload and sharing — a continuation cursor only points
   forward, so without the trail there is no inverse. The trail is capped at
   `PAGINATION_DATA.MAX_CURSOR_STACK` (10) because cursors are ~200 chars each; past 10 hops the
   oldest entry is dropped, so "previous" stops short of the true first page and `cursorPage`
   under-reports. Deep-paging a search beyond 10 pages is the signal to add filters, not more
   stack.
5. **Every filter combination needs an index.** Two facets need a composite; three
   independently-optional facets need more. Indexes cost write throughput. Filtering without an
   index is deliberately impossible in `fetchOptimized`.
   **Writing a bespoke filtered/paginated query outside `fetchOptimized`** (a component table,
   an exotic source)? Copy the reference implementation:
   `src/convex/auth/component/userQueries.ts` (`listUsersPaginated`) + the recipe in its
   `schema.ts` — three index-bounded paths (search index with facets as `filterFields` | one
   `by_<facets…>` index per combination | sort index), with optional-field facets served as a
   union of their stored representations (`NOT_BANNED_VALUES`). `.filter()` / `.filterWith()`
   over an unbounded set is the wall this project already hit once — never again. The one
   sanctioned `filterWith` is `fetchOptimized`'s union dedupe (bounded by duplicates scanned).
6. **Sorting must be servable by the index the filters chose.** Convex appends `_creationTime`
   to every index, so flipping its direction always works, while sorting by any other column
   needs an index ordered by it — which usually cannot also bound your facets. Offering an
   unindexable sort means either a table scan or rows in an order the index never produced.
   This is why `/admin/users` falls back to creation order when a facet is active.
7. **Page size is clamped server-side.** `resolvePaginationOpts` bounds `numItems` to
   `[1, PAGINATION_DATA.HARD_MAX_PAGE_SIZE]` (100). Convex endpoints are a public API — a
   hand-crafted request must not be able to demand a 50,000-row page. Per-request only: every
   row stays reachable across pages.
8. **`ConvexDataTable`'s built-in `searchable` / `bind:search` are component state.** They do
   **not** sync to the URL. On a URL-driven surface put the search term in the URL and let the
   loader read it, or the search silently won't be addressable.
9. **A route assumes one paginated list per URL.** Two URL-driven lists on the same route would
   fight over `?page`. Give them distinct param names if you ever need two.
10. **Public list endpoints are effectively unmetered.** Convex queries can only `check` a rate
    limit (no writes in queries) and anonymous callers have no trustworthy key. Registry entries
    for public list queries are advisory only; the real ceiling is structural — every request is
    one indexed, server-clamped page of public data. A genuinely metered public list needs to be
    fronted by a SvelteKit server route that limits by IP.

### What this is ready for

Ready today, verified: admin/host/guest tables and search are all live subscriptions; server-side
filtering and pagination everywhere; index-bounded filtered queries including the better-auth
component's `user` table. The only one-shot reads left are route-loaders and server-only reads,
which cannot subscribe.

Also ready, with wiring: exact totals + page jumps above 10k matched rows — `aggregate` mode
needs one counter registered per surface plus a one-time backfill. And the URL-driven
`pageHref` / `sortHref` mode on `DataTable` / `DataList`, which turns the paginator and sortable
headers into real anchors for a server-rendered route — `listUrlState.ts` is in place, no surface
uses it yet.

Not ready without extra work: sorting by a column no index can order under the active filters
(limit 6); any list long enough to need virtualization.

---

## § FOR LLMs / AI ASSISTANTS — READ THIS BEFORE WIRING DATA

You are biased toward one-shot reads if you learned pre-subscription patterns. In this
codebase — and any project citing this document — that default is **inverted**:

1. **DEFAULT = live subscription via `useQuery`.** Reach for the reactive primitive first,
   in the component. A one-shot read is the exception, justified only when the read cannot
   subscribe (route loader, secret/DB-bound) or is build-time config.
2. **When a read CANNOT subscribe** (a route loader, a server-only read), put it in the
   **loader**, not `onMount`, and state in a comment why the loader was required.
3. **Never render one page of a paginated API as the full set.** Either the UI has pager
   controls wired to the cursor/offset, or the consumer calls a dedicated non-paginated
   whole-set endpoint. Silently truncated lists are bugs, not simplifications.
4. **Do not lift feature fetches into layouts or global stores** to "share" them. Subscribe
   in the page/component that uses the data. Shared _logic_ goes in a feature-scoped hook
   that wraps `useQuery`. The only layout-level live data is session/auth-class information
   needed by effectively every page — plus the one favorites-id subscription feeding the
   shared set.
5. **Minimal projection.** New lookup endpoints return only the fields consumers use.
6. **When uncertain, subscribe and say so** in your summary, e.g. "live `useQuery` per
   GeneralSystemDesignRule.md; say the word if this can't hold a subscription and needs to
   move to a route loader."

7. **Rendering a collection? Also apply § LIST & PAGINATION MECHANISMS.** Pick by the decision
   test there (address needed? → URL-driven loader list; otherwise → the live Convex component).
   Never filter a collection in the browser. Before choosing
   `offset` (page numbers + totals), state in a comment either why the matched set stays
   bounded (the scan form reads every matching row and degrades past the 10k cap) or that the
   surface has an `aggregate` wired (unbounded-safe; requires the counter + triggers + backfill
   from `convex/functions.ts`).

8. **NEVER write `.filter()` / `.filterWith()` against an unbounded table** — not in
   `fetchOptimized` (it won't let you), and not in bespoke queries either. Lists go through
   `fetchOptimized`; a query that can't (component tables, exotic sources) copies the
   three-path pattern from `src/convex/auth/component/userQueries.ts` (hard limit 5 above).
   If you believe a post-index filter is justified, the set it filters must be provably
   bounded (a page, a per-user collection) and the comment must say what bounds it.
   The audit is one grep — run it after touching any backend query, and expect exactly one
   sanctioned hit (`fetchOptimized`'s union dedupe):
   `grep -rn "filterWith" src/convex --include=*.ts`
   Any new hit is either the wall coming back or a bounded case missing its justification
   comment.

9. **Writing a mutation? Import `mutation` / `internalMutation` from `@/convex/functions`,
   never from `_generated/server`.** The raw builders bypass the aggregate triggers and one
   bypassed write drifts a counter permanently. Queries and actions keep using
   `_generated/server` — they have no `ctx.db` writes.

Checklist to run mentally on every data wire-up:
`can it subscribe? → useQuery in the component (the default) | can't (route loader/server-only)?
→ one-shot in the loader, streamed, minimal shape, whole-set endpoint if a select/lookup needs
all rows | collection? → §LIST mechanism by address/live/page-numbers, server-side filtering
always.`

---

## § DYNAMIC IMPORTS / CODE-SPLITTING — WHEN TO LAZY-LOAD FOR INITIAL PERFORMANCE

> Status: **standing rule** (added 2026-07-24). Same philosophy as the realtime rule:
> **lazy-loading is opt-in, not default.** Framework-aware but portable: any router that
> code-splits per route (SvelteKit, Next, Nuxt, TanStack Router) gives you the first and
> biggest split for free — everything below is about the _second_ split, inside a route.

### What you already get for free

**SvelteKit code-splits per route.** Every `+page.svelte` (with everything it statically
imports) is its own chunk, downloaded only when that route is visited. An admin page's
dialog, table, and form never reach a shopper's browser, no matter how big they are. This
free split is why most components should just be imported statically — the route boundary
already did the work.

**Consequence:** a component only _candidates_ for a dynamic import when the route-level
split isn't enough — i.e. it is heavy **relative to the route it lives in** and most visits
to that route never use it.

### The decision test

A component earns `await import(...)` only when **ALL FOUR** are true:

1. **Heavy.** It (or a dependency it drags in) is genuinely large: rich-text editor,
   charting library, map SDK, PDF/video renderer, image cropper, QR/barcode scanner,
   diagramming, syntax highlighter. Rule of thumb: the chunk is tens of KB min+gz or more.
   A dialog made of Buttons and Inputs is NOT heavy — the primitives are already in the
   shared bundle; its incremental cost is a few KB.
2. **Interaction-gated.** It renders only after a deliberate user action (open editor,
   expand preview, start scan) — not on first paint, not above the fold, not "usually
   opened right away".
3. **The saving reaches real users.** The route is public / high-traffic. On an admin-only
   route the audience is a handful of staff who visit daily with a warm cache — route
   splitting already protected everyone else, so shaving the admin chunk buys ~nothing.
4. **Nothing needs it mounted before the interaction.** Critically: **native declarative
   triggers require their target to already be in the DOM.** A `<button commandfor={id}>`
   (dialog invoker) or `popovertarget` cannot open a component that hasn't been mounted
   yet — lazy-loading such a target silently breaks the button. Same for anchors of CSS
   anchor-positioning and any `bind:`/id contract established at page mount.

Any test fails → **static import.** When in doubt, static: an unnecessary static import
costs a few KB inside an already-split route chunk; an unnecessary dynamic import costs
first-interaction latency (spinner flash on click), a second network round-trip, an extra
error state to handle, and it silently opts out of the route preloader (which prefetches
the route's static chunks on hover — a dynamic import only starts loading at the click).

### Worked examples (from this project)

| Component                                                             | Verdict     | Why                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `AdminUpsellsCustomizeDialog` on `/admin/upsells`                     | **Static**  | Fails 1 (Buttons/Inputs, already-shared deps), fails 3 (admin-only route), fails 4 (opened by native `NativeDialogTrigger` → must be mounted). |
| Hero carousel (embla) on `/`                                          | **Static**  | Fails 2 — above the fold, needed for first paint.                                                                                              |
| Cart sidebar / upsell dialog on shop pages                            | **Static**  | Fails 1 — small components; the route chunk already carries them cheaply.                                                                      |
| A future rich-text editor for product descriptions                    | **Dynamic** | Heavy (editor libs are 100KB+), behind an edit click… but note test 3: admin-only, so even this one is optional.                               |
| A future map / store-locator behind a "Ver mapa" tab on a public page | **Dynamic** | Heavy SDK, interaction-gated, public traffic, JS-opened. Textbook case.                                                                        |
| Chart library on the admin dashboard                                  | **Static**  | Charts ARE the page (fails 2), admin-only (fails 3). Route splitting already contains it.                                                      |

### How to do it (when a candidate passes)

Load on interaction, render through `{#await}`, keep the trigger JS-controlled:

```svelte
<script lang="ts">
	let editorPromise = $state<Promise<typeof import('./heavy-editor.svelte')> | null>(null);
	const openEditor = () => (editorPromise ??= import('./heavy-editor.svelte'));
</script>

<Button onclick={openEditor}>Editar descripción</Button>

{#if editorPromise}
	{#await editorPromise}
		<Skeleton class="h-40 w-full" />
	{:then { default: HeavyEditor }}
		<HeavyEditor />
	{:catch}
		<p class="text-sm text-destructive">No se pudo cargar el editor. Inténtalo de nuevo.</p>
	{/await}
{/if}
```

Rules of the pattern: cache the promise (`??=`) so re-opens don't refetch; always render
the pending skeleton and the `{:catch}` (a dynamic chunk is a network request that can
fail); optionally warm it on hover/focus of the trigger (`onmouseenter={openEditor}`) to
hide the latency. Never `await import()` at module top level — that just recreates a static
import with extra steps.

### Measure, don't guess

Before adding a dynamic import, prove the weight: `bunx vite-bundle-visualizer` (or
`rollup-plugin-visualizer`) on the build, and look at the actual route chunk. If the
component you want to split is a few KB inside its route chunk, the split is complexity
with no payoff. Re-check after: the win should be visible in the route's initial chunk size.

### § FOR LLMs / AI ASSISTANTS — READ BEFORE ADDING A DYNAMIC IMPORT

1. **Default = static import.** SvelteKit already code-splits per route; do not add
   `await import(...)` unless the four-part test above passes, and say which tests pass in
   a code comment on the import.
2. **Never lazy-load the target of a native declarative trigger** (`commandfor`,
   `popovertarget`, anchor-positioning anchors). Those need the element mounted before the
   click; lazy-loading it makes the button silently do nothing (test 4).
3. **Admin-only routes almost never qualify** (test 3) — the route split already protected
   real users; staff have warm caches. Don't churn admin code into dynamic imports for
   vanity bundle numbers.
4. **"Dialog/modal" is not a heuristic for lazy.** Interaction-gated (test 2) is necessary
   but not sufficient — a dialog of design-system primitives is a few KB (fails test 1).
   The heuristic is the _dependency_: editor / chart / map / PDF / scanner SDKs.
5. **When a candidate passes:** cache the promise, skeleton in `{#await}`, handle
   `{:catch}`, consider hover-warming, and keep the trigger JS-controlled.
6. **When uncertain, import statically and say so** in your summary, e.g. "imported
   statically per GeneralSystemDesignRule.md § dynamic imports; say the word if this should
   be lazy — it fails test N." Do not silently add the dynamic import.

Mental checklist before any `await import(...)`:
`heavy dep? + interaction-gated? + public traffic? + not a native-trigger target? → all
four yes: lazy (cached promise, skeleton, catch) | any no: static import, route splitting
already has you covered.`

---

## § TABLE COUNTS VS ANALYTICS — TWO ENGINES, STRICT SPLIT

> Status: **standing rule** (added 2026-07-27). We run two counting-adjacent components and
> they are NOT interchangeable. `@convex-dev/aggregate` answers **"how many rows are X right
> now"**. `@piton-/analytics-convex` answers **everything else about what happened**: events,
> funnels, revenue, time series, per-scope stats.

### The rule

**`@convex-dev/aggregate` is for counts of current table state — and ONLY that. All other
analytics (events, revenue, series, "how many happened today") belong to
`@piton-/analytics-convex`. Never `.collect().length` a table to count it, and never bend the
analytics component into a row counter.**

The two answer different questions and fail in each other's territory:

- An aggregate mirrors the table. Rows that get deleted, patched to another status, or
  archived move the count — that's the point. It can never tell you "5 bookings were created
  today" once one of them is cancelled: table state has no memory.
- An analytics event is an immutable fact with a timestamp. `booking.created` fired today is
  true forever, whatever the row's status is now. But summing events can never reliably tell
  you "how many rows are pending right now" — you'd be replaying a ledger to reconstruct
  state the table already has.

### The decision test

> **"Is the number a property of table rows as they are NOW, or of things that HAPPENED?"**

- **NOW → `@convex-dev/aggregate`** (`aggregateX.count(ctx, …)`, O(log n)).
- **HAPPENED → `@piton-/analytics-convex`** (event counts, sums, series).

### Worked examples (from this project)

| Number                                             | Engine        | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Published listings                                 | **aggregate** | Current rows with `status = 'published'`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Pending booking requests open                      | **aggregate** | Current rows in `pending`; moves when the cron advances them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Check-ins today (confirmed, `checkInDate = today`) | **aggregate** | Still current state — a date-bounded count of rows as they are.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Total reports                                      | **aggregate** | Row count, plain.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Bookings **created** today                         | **analytics** | An event count — stays 5 even if 2 get cancelled later.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Revenue this month / 12-month series               | **analytics** | Sums over events in time buckets.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Occupancy % for a month                            | **analytics** | The interesting one — it looks like a NOW-question ("how many of my nights are booked") but is not answerable as one. "Nights in July" is a function of (booking, window): a stay clipped to a month boundary, not a scalar on the row, so an aggregate's `sumValue` cannot express it. Solved by moving the clip to WRITE time — `booking.nights_booked` is emitted once per month a stay touches, dated into that month (`occurredAt`), and the tile reads `nightsBooked − nightsReleased`. See § when a NOW-question has to become a HAPPENED-question. |
| Signups today / users total                        | **analytics** | `user.signed_up` events. (Also: the BA user table lives in the auth component — our triggers can't see its writes, so an aggregate on it would drift. Analytics is not just preferred here, it's the only correct option.)                                                                                                                                                                                                                                                                                                                                 |

### How it's wired in this project

- Counters live in `src/convex/functions.ts`, declared in one `defineCounters()` call from
  `@piton-/analytics-convex/counters` (the library owns `@convex-dev/aggregate` as an
  optional peer, so this app doesn't depend on it directly): `counters.reports` (plain
  count), `counters.apartments` (namespace = status, key = `hostId`), `counters.hostEarnings`
  (namespace = `hostId`, key = earning status, sums `net`), `counters.bookings` (namespace =
  status, key = `checkInDate`). One component instance per table in `convex.config.ts`.
- Reads: `counters.x.count(ctx, namespace)` / `.sum(ctx, namespace)` for a whole namespace;
  a bounded read (key range inside one namespace) drops to `counters.x.aggregate.count(ctx,
{ namespace, bounds })`, which is the raw `TableAggregate`.
- **The key is how one tree serves two scopes.** `counters.apartments` answers the admin's
  platform-wide `count(ns 'pending_review', bounds {})` AND the host dashboard's
  `count(ns 'published', bounds [hostId, hostId])` — no second component, no doubled write
  cost. Reach for a `hostId`/`ownerId` sort key before provisioning a per-owner aggregate.
- **`counters.bookings` is provisioned, and its history is the rule.** It shipped once, was
  read by nothing, and cost a tree write on every booking mutation (create, confirm,
  check-in, check-out, cancel, cron expiry — bookings are the hottest table here), so it was
  removed. It came back on 2026-07-31 **with** its consumer, the admin dashboard's pulse row
  (`AdminDashboardPageSystemDesign.md` §3). Provision a counter with the page that reads it,
  never before: component instance + one `counter(...)` entry + one backfill run — and read
  the re-provisioning warning on `backfillCounters`, because a component keeps its data
  across removal and re-adding.
- **Sync is automatic via triggers — with one obligation:** `src/convex/functions.ts` exports
  trigger-wrapped `mutation` / `internalMutation`. Every write to an aggregated table MUST use
  those constructors, never the raw ones from `_generated/server`. The auth wrappers
  (`authMutation`, `zAuthMutation`, `adminMutation`, …) already build on them, so most
  endpoints are covered for free; the rule bites on raw `mutation(...)` / `internalMutation(...)`
  call sites (public forms, crons).
- Backfill for pre-existing rows: `functions:backfillCounters` (idempotent, paginated,
  run once per table — already run on dev).
- Counting a **new** table = component instance in `convex.config.ts` + one `counter(...)`
  entry in the `defineCounters()` call in `functions.ts` (which registers the trigger for
  you) + one backfill run.

### When a NOW-question has to become a HAPPENED-question

Sometimes the split above gives an answer the engines cannot honour. The test is mechanical:

> **Is the number a scalar sitting on the row, or a function of (row, window)?**

An aggregate's `sumValue` reads ONE field off ONE document. If your number needs the row
_and_ the question's window to compute — occupancy needs `nightsWithinWindow(stay, month)` —
no aggregate can serve it, however NOW-ish it feels. The options are only:

1. **Scan the rows at read time.** Correct and self-healing, but scales with the table.
   Fine while bounded (the today strip does this, capped at one day).
2. **Clip at WRITE time and emit an event per bucket.** The clip happens once, into a rollup
   the read side just sums. This is what occupancy does: `nightsByMonth` splits a stay at
   confirm, one `booking.nights_booked` per month with `occurredAt` dated INTO that month, and
   the reversal twin `booking.nights_released` on cancel — the same `gmv` / `gmvCancelled`
   shape.
3. **Materialize a table + cron.** Only when neither of the above fits. Occupancy did not
   need this, and reaching for it first is the common mistake.

**The obligation option 2 creates.** An event ledger does not self-heal. A scan recomputes
from current rows, so an edited booking is automatically right; a ledger is only as correct
as the events written into it. Any mutation that changes an input to the split — a confirmed
booking's DATES, its host — must emit the reversal for the old value and a fresh event for
the new one, or the number drifts permanently with nothing to detect it. Take option 2 only
when the write sites are few and enumerable (occupancy has six), and note them in the
helper's doc comment so the next edit site knows it has joined a contract.

### § FOR LLMs / AI ASSISTANTS — READ BEFORE COUNTING ANYTHING

1. **Never count by reading rows.** `.collect().length`, draining `.paginate`, or a capped
   `.take(N + 1)` as a count workaround — all replaced by `aggregateX.count(ctx, …)`. If the
   aggregate for that table doesn't exist, add it (four steps above), don't scan.
2. **Never use `@piton-/analytics-convex` for current-state counts**, and never use an
   aggregate for "happened today/this month" questions. Run the NOW-vs-HAPPENED test; put the
   verdict in a code comment when it's not obvious.
3. **Writes to aggregated tables go through `@/convex/functions`** — importing `mutation` /
   `internalMutation` from `_generated/server` in a file that writes `reports`, `apartments`,
   or `bookings` is a bug (silent count drift), even if it typechecks.
4. **The BA auth component's tables cannot be aggregated** (triggers don't see component
   writes). User counts come from analytics events.
5. **When uncertain, say so in your summary**, e.g. "counted via aggregate per
   GeneralSystemDesignRule.md § table counts; say the word if this is really a
   happened-question for analytics."

Mental checklist before writing any count:
`property of rows NOW? → aggregate.count() (and the write path uses @/convex/functions) |
something that HAPPENED? → analytics event query | neither engine fits? → you're probably
asking two questions; split them.`

---

## § BACKEND RETURNS DATA, FRONTEND RENDERS DISPLAY — NO SERVER-COMPOSED TEXT

> Status: **standing rule** (added 2026-07-24). Backend-agnostic. Exists so i18n can later be
> added ENTIRELY client-side: the backend never bundles translation machinery, and no display
> string is baked server-side where a locale can't reach it.

### The rule

**Convex (any backend) returns raw data fields. The frontend is the only place display
strings are composed, formatted, or fabricated.**

- **Raw field passthrough is fine and unavoidable** — `product.name`, `variant.label`,
  `category.name` are _content_ stored in the DB; returning them verbatim is returning data.
- **Composition is display work** — concatenating `` `${product.name} · ${variant.label}` ``,
  fabricating a readable name from a ref (`titleCase('boards-1-M')`), pluralizing, or
  formatting money/dates for humans. None of that belongs in a query result.
- **UI copy never comes from the backend** — errors and toasts travel as **message keys**
  (`{ key: 'UpsellsMessages.RULE_CREATED' }`), translated client-side
  (`translateFromBackend`). Never return a human-readable sentence from a mutation/query.

### How it's wired in this project

- The wire shape is **`TranslatableMessage`** (`src/shared/types/types.ts`):
  `{ key: string; params?: Record<string, string | number | boolean> }`. Every mutation returns
  `ConvexMutationResult` — `{ success, message: TranslatableMessage, data? }` — and errors throw
  `ConvexError` whose `data.message` is the same shape.
- The **single client-side seam** is `translateFromBackend`
  (`src/utils/translateFromBackend.ts`): looks the key up in `BACKEND_MESSAGES`
  (`src/utils/messages.ts`), interpolates `params`, falls back to the key literal when missing
  (visible-in-dev debugging for free). `safeMutation` / `safeAction` route errors through it
  automatically via `hasTranslatableMessage` — call sites just
  `toast(translateFromBackend(result.message))`.
- Zod schemas shared with Convex follow the same convention: `message:` values are **keys**,
  resolved at display time (`zodFieldErrors.ts`) — never a catalog lookup inside a schema that
  Convex imports.
- Convex must NEVER import `translateFromBackend`, `messages.ts`, or any display util. The
  backend knows keys as opaque strings, nothing more. (The UI is English-only today; the
  transactional emails keep their own server-side catalog — see the exceptions below.)

### The DX recipe — why keys never become a pain (library-agnostic)

The whole pattern is one type + one function, and only the function knows which i18n library
you use:

1. **One wire type.** `{ key, params }`. The backend composes nothing — a key names the
   sentence, `params` carries the raw values (`{ count: 3 }`, `{ email }`). Pluralization,
   interpolation, dates, currency all happen client-side where the locale lives.
2. **One translation seam.** A single `translateFromBackend(message)` function is the only
   place backend keys meet the catalog. Today it reads a plain English object; swapping in
   Paraglide (`m[key](params)`), or i18next (`i18next.t(key, params)`) → you rewrite
   ~5 lines in one file; zero backend files, zero call sites change.
3. **Auto-translation at the boundary, not per call site.** The mutation/error helpers
   (`safeMutation`, form components, `DataTable`) already pipe `message` through the seam, so
   the everyday DX is: return `{ key: 'X.Y' }` from Convex, add `X.Y` to `BACKEND_MESSAGES`,
   done. No page-level plumbing per feature.
4. **Missing key ≠ crash.** The seam falls back to rendering the key literal
   (`AdminReportsPage.resolved`) — instantly recognizable in dev, harmless in prod.
5. **Backend never drags the bundle.** Because Convex only ever emits strings, no message
   catalog, runtime, or locale data ships server-side — the i18n cost stays in the client
   bundle where the route splitter already manages it.

Cost of the discipline: naming a key instead of typing a sentence. That's the whole trade,
and it's what makes locale #2 (and #3) a catalog-only change.

### The three deliberate exceptions

1. **Stored snapshots** — an order line's `name` is composed once at WRITE time
   (`calculateOrderPrice.snapshotLineName`) and frozen into the order, like an invoice. That
   is storage of a fact, not display; historical documents don't re-translate.
2. **Emails** (`src/convex/emails/**`) — rendered server-side by nature; you cannot send an
   email from the client. Future email i18n keys off the _recipient's_ locale server-side —
   a separate concern from UI i18n, deliberately not shared with it.
3. **Non-display strings** — search text blobs (`buildOrderSearchText`), slugs, refs, order
   numbers, audit payloads. Machine-facing, not shown as prose.

### § FOR LLMs / AI ASSISTANTS — READ BEFORE RETURNING ANYTHING FROM CONVEX

1. **Never concatenate display strings in a Convex query/mutation result.** Return the raw
   fields (`title`, `email`, amounts, dates as numbers) and let the consumer compose. If you
   write `` `${a} · ${b}` ``, `titleCase(...)`, or number/date formatting inside `src/convex/**`
   and it flows to the client, it is a bug — unless it is one of the three exceptions above,
   named in a code comment.
2. **Never return raw human-readable messages.** Mutations return `ConvexMutationResult` —
   `{ success, message: { key, params? } }` — and errors throw `ConvexError` with the same
   `message` shape. Every new user-facing string = a new key in `src/utils/messages.ts`,
   resolved client-side via `translateFromBackend`.
3. **Never import `translateFromBackend`, `messages.ts`, or any display/i18n util from
   `src/convex/**`.** Zod schemas shared with Convex use key strings as `message:` values, not
   catalog lookups.
4. **Route new UI through the existing seams** (`safeMutation`/`safeAction`, mutation form,
   `DataTable`) instead of hand-translating per call site — they already resolve
   `TranslatableMessage`.
5. **When uncertain, return the rawest shape and say so** in your summary, e.g. "returned raw
   fields per GeneralSystemDesignRule.md § backend returns data; frontend composes."

Mental checklist for every Convex return value:
`is every string either a verbatim DB field, an id/ref/slug, or a message KEY? → good |
composed/fabricated/pluralized/formatted for humans? → move it to the frontend (or name the
exception: snapshot / email / machine-facing).`
