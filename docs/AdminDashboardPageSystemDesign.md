# Admin Dashboard Page — System Design

> Route: `/(protected)/admin/dashboard` · Audience: the Belgrade team (a handful of staff)
> Status: design approved for implementation. Companion to `GeneralSystemDesignRule.md` — every
> data decision below cites its verdict.

## 1. Purpose — what this page is for

The admin dashboard answers exactly three questions, in this order:

1. **"Does anything need me?"** — new reports from the public `/report` form (the only inbox
   admins have today).
2. **"Is the platform alive right now?"** — today's pulse: signups, new bookings, check-ins.
3. **"Is it trending the right way?"** — 12-month bookings/revenue, headline totals.

Everything else is deliberately excluded. Browsing users is `/admin/users` (exists). Moderating
individual bookings is the host's job (host dashboard + hourly lifecycle cron: the system
advances states, no manual admin buttons). A "recent signups" table would duplicate
`/admin/users` one click away — cut.

**Cognitive-load budget:** three bands, one scroll max on a laptop, zero decisions required to
read it. The page is a status check that takes under ten seconds when nothing needs attention.

## 2. Layout

Matches the existing admin shell (`p-4 md:p-6`, sidebar inset, no `Section` component — the
serif and marketing rhythm stay outside the app shell per DESIGN.md).

```
┌────────────────────────────────────────────────────────────┐
│ Dashboard                                                  │  header (h1 + one-line desc)
│ Platform overview and things that need your attention.     │
├────────────────────────────────────────────────────────────┤
│ NEEDS ATTENTION                                   [n new]  │  Band 1 — reports queue
│ ┌ bug   "Search breaks when…"        2h ago   reply ↗ ┐    │  ≤5 rows, newest first
│ ┌ idea  "Add map view for…"          1d ago           ┐    │  hidden entirely when empty*
│ └──────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────┤
│ TODAY                                                      │  Band 2 — pulse row
│ 3 new signups · 5 bookings created · 7 check-ins ·         │  one line of facts,
│ 2 pending requests open                                    │  not four cards
├────────────────────────────────────────────────────────────┤
│ PLATFORM                                                   │  Band 3 — trend
│ ┌ StatCards: users total · published listings ·        ┐   │  4 compact stat cards
│ │            bookings (this month) · revenue (this mo) │   │  (reuse host pattern)
│ └───────────────────────────────────────────────────────┘  │
│ ┌ 12-month chart: bookings count + revenue EUR         ┐   │  one chart, two series
│ └───────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

\* Band 1 renders nothing when there are zero unhandled reports — an empty "all clear" box is
noise. The "does anything need me?" answer is then the band's absence.

### Band 1 — Needs attention (reports queue)

- Latest **5** reports, newest first. Row = category badge + message excerpt (single line,
  truncated) + relative time + `mailto:` action when the reporter left an email.
- Category badges are **color + text**, never color alone: `bug` = destructive tint, `idea` =
  info tint, `other` = muted. Same tinted-badge treatment as booking status badges.
- Count chip in the band header: `{n} new` — exact count from `aggregateReports.count()`
  (O(log n), no table read); the display may still abbreviate large values client-side.
- No "mark as handled" mutation in v1 — reports have no `status` field. Out of scope (§8).
  When a `/admin/reports` page exists later, the band header links to it.

### Band 2 — Today (pulse row)

One sentence-shaped row of four facts, `tabular-nums`, separated by middots. Not stat cards —
these are ephemeral numbers an admin glances at, and four cards would visually outrank Band 1.

- **New signups today** (UTC day, same `todayIsoUtc()` convention as host dashboard)
- **Bookings created today** (any status — it measures demand, not money)
- **Check-ins today** (platform-wide, `status = 'confirmed'` + `checkInDate = today`)
- **Pending requests open** (platform-wide count of `status = 'pending'`, capped display)

Zero-value facts still render ("0 new signups") — a pulse row with missing entries reads as
broken, not as calm.

### Band 3 — Platform (totals + trend)

- **Four stat cards**, reusing the host dashboard stat-card component style: users total,
  published listings, bookings this month, revenue this month (EUR, tabular-nums). Labels are
  nouns, values are numbers, no sparkline decoration, no delta arrows in v1 (deltas need a
  comparison-period decision — out of scope).
- **One chart**: trailing 12 months, bar = bookings count, line = revenue EUR. Reuse the
  revenue chart composition (`layerchart` via the shared `chart-container` — **keep the
  rAF-defer**; chart mounts during client-side nav livelock Svelte deriveds without it).
- Chart empty state: one line of copy when the platform has no earning bookings yet.

## 3. Data contract

One aggregated query returns everything the page renders — mirror of
`fetchHostDashboardPageSafe`. Shape:

```ts
type AdminDashboardPage = {
	reportsQueue: {
		items: Array<{
			_id: Id<'reports'>;
			category: 'bug' | 'idea' | 'other';
			message: string; // full message; client truncates for display
			email: string | null;
			_creationTime: number;
		}>; // ≤ 5, newest first
		total: number; // exact, via aggregateReports.count()
	};
	today: {
		signups: number;
		bookingsCreated: number;
		checkIns: number;
		pendingOpen: number; // exact, via aggregateBookings.count()
	};
	platform: {
		usersTotal: number;
		publishedListings: number;
		bookingsThisMonth: number;
		revenueThisMonth: number; // EUR, earning statuses only (same set as host stats)
		series: Array<{ month: string; bookings: number; revenue: number }>; // 12 entries
	};
};
```

Raw data only — no composed display strings, no formatted money/dates (per
`GeneralSystemDesignRule.md` § backend returns data). The client formats EUR, relative times,
and truncation. Errors travel as message keys through the existing `*Safe` ConvexError pattern.

### Where each number comes from (no unbounded scans)

Split per `GeneralSystemDesignRule.md` § table counts: **NOW-questions** (current row state)
come from the `@convex-dev/aggregate` instances in `src/convex/aggregates.ts`;
**HAPPENED-questions** (events, revenue, series) come from `@piton-/analytics-convex`.

| Value                                                      | Engine           | Read                                                                                                     |
| ---------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| `reportsQueue.items`                                       | table read       | `reports.order('desc').take(5)` — the rows themselves, not a count                                       |
| `reportsQueue.total`                                       | **aggregate**    | `aggregateReports.count(ctx)` (client caps the display)                                                  |
| `today.signups`                                            | **analytics**    | `user.signed_up` count for today — happened-question                                                     |
| `today.bookingsCreated`                                    | **analytics**    | `booking.created` count for today — stays 5 even if 2 cancel later                                       |
| `today.checkIns`                                           | **aggregate** ⚠️ | `aggregateBookings.count(ns 'confirmed', bounds checkInDate = today)` — see note below                   |
| `today.pendingOpen`                                        | **aggregate** ⚠️ | `aggregateBookings.count(ns 'pending')` — see note below                                                 |
| `platform.usersTotal`                                      | **analytics**    | `user.signed_up` all-time — BA component table can't be aggregated (triggers don't see component writes) |
| `platform.publishedListings`                               | **aggregate**    | `aggregateApartments.count(ns 'published')`                                                              |
| `platform.bookingsThisMonth`, `revenueThisMonth`, `series` | **analytics**    | `booking.*` monthly aggregates — same mechanism as the host analytics 12-month read                      |

> ⚠️ **`aggregateBookings` is not provisioned yet — building this page must provision it.**
> It shipped early, was read by nothing (this page is still an empty stub), and cost a tree
> write on every booking mutation, so it was removed rather than left to bill for an unbuilt
> surface. The design above is unchanged and correct; it just has a prerequisite. Re-add per
> `GeneralSystemDesignRule.md` § how it's wired: component instance in `convex.config.ts`
> (`name: 'aggregateBookings'`, namespace = status, key = `checkInDate`) + `TableAggregate`
> in `aggregates.ts` + `triggers.register('bookings', …)` in `functions.ts` + a `bookings`
> case in `backfillAggregates`/`clearAggregate` + one backfill run per deployment.

No schema changes needed: the aggregates replace the platform-wide status index this design
originally required, and `pendingCapped` disappears from the contract (aggregate counts are
exact and O(log n) — cap the _display_, not the read). The `capped` field on `reportsQueue`
likewise goes away.

If the analytics component turns out not to expose one of the assumed event aggregates, the
fallback is a capped index read — never a table scan; flag it in the PR instead of silently
scanning.

## 4. Query design & realtime verdict

Per `GeneralSystemDesignRule.md`, run the test per piece of data: _"can this change while the
admin is looking, without them acting?"_

- Reports arrive from the public form, bookings and signups from other people, while the admin
  watches. **YES → subscription** (the rule's own worked example: "the admin orders table —
  new orders arrive from other people while the admin is watching").
- Verdict: **one `useQuery` subscription** to a single aggregated query, opened in the page
  component (subscriptions cannot live in a loader — they'd leak). This is exactly the host
  dashboard's wiring; no `+page.ts` loader for this route.

```
src/convex/pages/admin/dashboard/
  queries/fetchAdminDashboardPageSafe.ts   // requireAdmin + one aggregated read
  types/adminDashboardTypes.ts
```

- Gate with `requireAdmin` (existing middleware). The route is additionally gated by the
  `(protected)/admin` layout server guard — the query re-checks anyway; UI gating is not
  security.
- One subscription, not five: N parallel `useQuery`s would quintuple the invalidation traffic
  for zero UX gain, and the page renders as one unit.
- The whole read is cheap by construction (capped takes + pre-aggregated analytics), so the
  subscription re-running on writes is affordable.

## 5. Component structure

Follows the established `pages/(protected)/…` convention, host dashboard as the template:

```
src/shared/components/pages/(protected)/admin/dashboard/
  admin-dashboard-header.svelte              // h1 + description (users-page header pattern)
  admin-dashboard-reports-queue.svelte       // Band 1 (renders null when empty)
  admin-dashboard-today-overview.svelte      // Band 2
  admin-dashboard-stat-cards.svelte          // Band 3a
  admin-dashboard-trend-chart.svelte         // Band 3b (wraps shared chart-container)
  empty/admin-dashboard-chart-empty.svelte   // no earning bookings yet
  error/admin-dashboard-page-error.svelte    // whole-page error (host pattern)
  loading/admin-dashboard-page-loading.svelte// skeleton mirroring the three bands
```

Page component (`+page.svelte`) stays a thin composition, same branch order as host:
`error → loading → content`. There is no whole-page empty state: a live platform always has
Band 2 and Band 3 to show (zeros are content); only the chart and Band 1 have per-section
empty behavior.

`+page.svelte` skeleton:

```svelte
const dashboard = useQuery(api.pages.admin.dashboard.queries
  .fetchAdminDashboardPageSafe.fetchAdminDashboardPageSafe, () => ({}));
```

`SvelteHead` with `AdminDashboardPage.SEO.*` keys and `noIndex` (all protected pages are
noIndex).

## 6. States

| State               | Treatment                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Loading             | `loading/` skeleton: header renders immediately (static), three skeleton bands below. No spinner.              |
| Error               | `error/` full-page error with retry (re-uses `refresh-query-button`). Message via key, translated client-side. |
| Reports queue empty | Band 1 not rendered at all.                                                                                    |
| Chart empty         | `empty/` chart placeholder with one line of copy — no CTA (nothing an admin can do to create bookings).        |
| Zero pulse values   | Render the zeros.                                                                                              |

## 7. Cross-cutting requirements

- **i18n**: every string is a Paraglide key under `AdminDashboardPage.*`, added to **both**
  `messages/en.json` and `messages/sr.json` in the same commit. Layouts must survive Serbian
  ~30% expansion (the pulse row wraps to two lines on narrow screens, it does not truncate).
- **Numbers**: `tabular-nums` on every count and EUR value. EUR formatted client-side with the
  existing money formatting used by host stat cards (consistency beats `Intl` re-decisions).
- **Dates/times**: relative time for report rows ("2h ago") with an absolute timestamp in
  `title`/`aria-label`; UTC-day boundaries identical to the host dashboard (`todayIsoUtc()`).
- **A11y (WCAG 2.2 AA)**: badges are color+text; the reports queue is a `<ul>` with real links
  (`mailto:`), keyboard reachable; the chart carries a text summary (`aria-label` with the
  current month's values) since the SVG itself is not the accessible surface; focus ring
  untouched.
- **Density**: 32px controls, compact rows, `gap-6` between bands inside the standard
  `flex flex-col gap-6 p-4 md:p-6` section wrapper — identical envelope to host dashboard and
  admin users.
- **Chart import**: static, not dynamic — per `GeneralSystemDesignRule.md` § dynamic imports,
  the chart IS the page (fails test 2) and the route is admin-only (fails test 3). Route
  splitting already contains it.
- **Sidebar**: while touching this area, replace the placeholder nav icons in
  `admin/+layout.svelte` (`Frame`/`PieChart`) with `LayoutDashboard` and `Users` — two-line
  change, do it in the same PR.

## 8. Explicitly out of scope (and why)

- **Report handling workflow** (mark resolved, assign, reply-in-app): needs a `status` field
  and a `/admin/reports` page. The dashboard band is read-only until that exists.
- **Recent signups / recent bookings tables**: duplicate `/admin/users` and host surfaces one
  click away; tables on a dashboard invite management work the dashboard isn't for.
- **Delta indicators on stat cards** ("+12% vs last month"): require a comparison-period
  decision and double the aggregate reads; add only if someone actually asks "compared to
  what?".
- **Newsletter / audit-log widgets**: no admin action attaches to them; audit logs are off by
  default (`FEATURES.AUDIT_LOGS`).
- **Date-range filters on the chart**: fixed trailing-12-months answers the trend question;
  filters belong on the hosts' analytics surface, not on the status check.

## 9. Implementation order

1. ~~Index~~ Done already: aggregates set up (`aggregates.ts`, `functions.ts`, backfilled).
2. Convex query + types (`fetchAdminDashboardPageSafe`) with `requireAdmin`.
3. i18n keys (en + sr).
4. Components (header → queue → pulse → stats → chart → states).
5. Page composition + sidebar icon fix.
6. Verify: both locales, dark mode, 320px width, keyboard-only pass, chart behind client-side
   navigation (the rAF-defer check).
