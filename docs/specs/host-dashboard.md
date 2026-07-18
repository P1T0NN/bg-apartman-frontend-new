# Spec: Host Dashboard (`/host/dashboard`)

> Implementation spec for an LLM/developer session. The current page
> (`src/routes/(protected)/host/dashboard/+page.svelte`) renders demo charts from
> `demo-chart-data` — replace it entirely.

## 1. Product goal

A host opens this page to answer, in order:

1. **"Do I need to do anything right now?"** → pending booking requests (they expire in 48h).
2. **"What's happening today?"** → today's check-ins / check-outs / who's staying.
3. **"How is my business doing?"** → occupancy, revenue, upcoming bookings.

Everything on the page serves one of those three questions. Nothing else goes on it.
The feeling to hit: _the dashboard already did the thinking; I just glance and act._

## 2. UX principles (non-negotiable)

- **One primary action zone.** The action queue (pending requests) is the only place
  with buttons that change data. Everything below it is glanceable/read-only with
  links out to detail pages.
- **Tiles answer questions, they don't just show numbers.** Every stat tile has:
  big number, one-line label, and a small comparison ("+2 vs last month") or context
  ("of 3 accommodations"). No number without context.
- **Zero cognitive load ordering.** Vertical order = urgency order: act → today →
  trends. On mobile this exact order stacks single-column; the action queue is never
  below the fold on first paint if it has items.
- **Empty states do the onboarding.** Every region has a designed empty state (see §4).
  An empty dashboard must still look intentional, not broken.
- **Skeletons mirror the final layout** (use the existing `skeleton` component),
  so nothing jumps when data lands. Convex queries are reactive — after first load,
  updates stream in live with no refresh affordances needed.
- **No manual check-in/check-out controls anywhere.** The booking lifecycle cron
  handles `checked_in`/`checked_out` transitions and pending expiry automatically.
  The dashboard only _displays_ these states.

## 3. Page layout (top → bottom)

Header: `h1` "Dashboard" + subtitle with today's date, same header pattern as
`/admin/users` (`text-2xl font-semibold tracking-tight` + muted description).

### 3.1 Action queue — "Needs your response" (only renders when non-empty)

- Card list (not a table) of `status === 'pending'` bookings, sorted by
  `pendingExpiresAt` ascending (most urgent first). Cap at 5 with a "View all N
  requests" link to `/host/reservations`.
- Each row: guest name, accommodation title + cover thumbnail (`images[0]`), dates
  (`checkInDate → checkOutDate`, use the installed `little-date` for compact ranges),
  guests count, `total` in EUR, and an **expiry chip**: "Expires in 31h" — amber when
  < 24h, red when < 6h. Compute from `pendingExpiresAt - Date.now()`.
- Actions per row: **Confirm** (primary) and **Decline** (ghost/destructive).
  Reuse the existing confirm/decline dialogs + mutations from the host reservations
  page (`src/shared/components/pages/(protected)/host/reservations/`,
  `src/features/bookings/`) — do not duplicate that logic; extract/share if needed.
- The whole strip has a subtly emphasized container (e.g. `border-primary/30
bg-primary/[0.03]`) so it reads as "this is the part that talks back".

### 3.2 Today strip

Three compact cards in a row (stack on mobile): **Check-ins today**, **Check-outs
today**, **Currently hosting**. Each shows count + up to 3 guest name/accommodation lines,
overflow as "+N more" linking to reservations. Read-only. If all three are zero,
collapse the strip to a single quiet line: "No arrivals or departures today."

### 3.3 Stat tiles (exactly 4)

| Tile                   | Value                            | Context line              |
| ---------------------- | -------------------------------- | ------------------------- |
| Occupancy (this month) | % of accommodation-nights booked | "+x pts vs last month"    |
| Revenue (this month)   | € sum                            | "+€x vs last month"       |
| Upcoming check-ins     | count, next 7 days               | "next: {date}"            |
| Active accommodations  | published count                  | "N pending review" if any |

Definitions (encode in the query, not the UI):

- **Occupancy** = booked nights in month ÷ (published accommodations × days in month).
  Booked nights = nights of bookings with status in
  `confirmed | checked_in | checked_out` overlapping the month (clip stay to month
  boundaries).
- **Revenue** = sum of `total` for bookings with status in
  `confirmed | checked_in | checked_out` whose `checkInDate` falls in the month.
  (Attribution by check-in date; simple and consistent. Declined/cancelled excluded.)

### 3.4 Revenue chart

One chart, not three. Reuse `AreaChartInteractive`
(`src/shared/components/ui/custom-charts/area-chart-interactive.svelte`) with a
monthly series of the last 12 months: `{ month, revenue, bookings }`. Toggle between
Revenue and Bookings via the chart config (like the existing interactive charts do).
If total bookings ever < 3, hide the chart region entirely (a flatline chart of
nothing is noise) and let the tiles carry the story.

### 3.5 Per-accommodation breakdown (only when host has ≥ 2 published accommodations)

Small table (existing `table` component, client-side, no pagination — hosts have a
handful of accommodations): cover thumbnail, title, status badge, occupancy this month,
revenue this month, next check-in date. Row links to the accommodation's edit page.
With one accommodation this table is pure duplication of the tiles — skip it.

### 3.6 Empty states

- **No accommodations at all**: replace the entire dashboard body with a single centered
  hero card: "List your first place" + CTA to `/host/add-accommodation` + one line
  of copy. Nothing else.
- **Accommodations but zero bookings ever**: tiles render with zeros, chart hidden, action
  queue hidden; add one dismissible-feel card: "Share your accommodation to get your first
  booking" with a link/copy-link (reuse `share-button` component).

## 4. Data layer (Convex)

### 4.1 New index

Add to `bookings` in `src/convex/schema.ts` (mirrors the existing guest one):

```ts
.index('by_host_status_checkin', ['hostId', 'status', 'checkInDate'])
```

This makes every dashboard slice an index range read: pending queue
(`eq(hostId).eq(status,'pending')`), today's check-ins
(`eq(hostId).eq(status,'confirmed').eq(checkInDate, today)`), upcoming 7 days
(`gte/lte` on `checkInDate`), etc.

### 4.2 Queries — three, not one

Follow the existing conventions: files under
`src/convex/tables/bookings/queries/`, `Safe` suffix, auth via `getAuthUserId`,
`ConvexError` with i18n-key payloads, lean payloads (reuse
`resolveApartmentSummary` / `bookingToBookingSafe` shapes — never ship whole docs).

1. **`fetchHostActionQueueSafe`** — pending bookings for the host, sorted by
   `pendingExpiresAt`, `.take(6)` (6 so the UI knows if "view all" is needed
   beyond 5). Enriched with apartment summary.
2. **`fetchHostTodaySafe`** — three `.take()` slices off the new index for today's
   date string: confirmed check-ins today, checked_in check-outs today
   (`checkOutDate === today` needs a filter over the checked_in slice — that slice
   is tiny), currently `checked_in`.
3. **`fetchHostStatsSafe`** — tiles + 12-month series in one payload:
   `{ tiles: {...}, series: [{ month, revenue, bookings }] }`. Implementation: one
   index read of the host's bookings in the trailing 12 months (range on
   `checkInDate` via `by_host_status_checkin` per relevant status, or `by_host`
   - filter — host volumes are hundreds/year, this is fine), bucket in JS.
     Occupancy denominator from `apartments.by_host` (published only).

Three queries instead of one so each region loads/streams independently and a
slow stats computation never blocks the action queue (the part that matters).

### 4.3 Performance & future-proofing

- Everything above is index-bounded; no full-table scans. This is correct up to
  thousands of bookings per host.
- **Documented upgrade path — do NOT build now:** if a host's trailing-12-months
  read gets heavy (>~5k bookings), add a `hostMonthlyStats` rollup table
  `(hostId, month, revenue, bookings, bookedNights)` maintained incrementally by
  the existing booking lifecycle cron and mutation write paths, and have
  `fetchHostStatsSafe` read 12 rows instead. Leave a `// ponytail:` comment at the
  aggregation site naming this path.
- Do not add `@convex-dev/aggregate` or any counter infra for v1.

## 5. i18n

Every visible string is a Paraglide key, added to **both** `messages/en.json` and
`messages/sr.json`, under a `HostDashboardPage` namespace. Dates/currency via
`Intl` with the active locale; EUR only (`currency: 'EUR'` is a schema literal).
Any message key produced inside Convex must live in
`src/convex/i18n/messages/{en,sr}.json` per the existing convention.

## 6. Acceptance checklist

- [ ] `bun run check` and `bun run lint` pass.
- [ ] Action queue confirm/decline uses the same mutations/dialogs as
      `/host/reservations` (no duplicated logic) and its i18n emails still send.
- [ ] No manual check-in/check-out buttons exist anywhere on the page.
- [ ] All 4 tiles show comparison/context lines, not bare numbers.
- [ ] Both empty states render (test with a fresh host account).
- [ ] Every region has a skeleton matching its final geometry.
- [ ] Mobile: single column, action queue first, no horizontal scroll.
- [ ] All strings in en + sr; no hardcoded English in components.
- [ ] New index added; every query justified by an index (no `.collect()` scans).
