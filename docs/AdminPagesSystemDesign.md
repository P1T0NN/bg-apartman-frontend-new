# Admin Pages — System Design

> Scope: the complete `/admin/**` page inventory. Audience for the pages: a **non-developer
> operator** (the Belgrade team) whose job is to check what is happening on the platform and
> intervene when something needs a human. Audience for this document: the LLM/developer
> implementing it — file paths, existing backend functions, and per-page contracts are exact.
> Companions: `AdminDashboardPageSystemDesign.md` (the dashboard page in full detail),
> `GeneralSystemDesignRule.md` (data rules — cited per decision).

## 0. The operating principle

An admin here is not a data analyst and not a developer. Every page must answer one plain
question, and the set of pages must mirror the set of things that can actually go wrong on
this platform. That yields exactly **five pages** (two already exist):

| Route                            | Question it answers                                 | Status                                                   |
| -------------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| `/admin/dashboard`               | "Is anything wrong / what's happening?"             | exists — designed in `AdminDashboardPageSystemDesign.md` |
| `/admin/accommodations`          | "Which listings need review, and what is live?"     | **new**                                                  |
| `/admin/bookings`                | "What happened with this booking?" (support lookup) | **new**                                                  |
| `/admin/reports`                 | "What are people telling us?"                       | **new**                                                  |
| `/admin/users` (+ `/users/[id]`) | "Who is this person, and do I need to act on them?" | exists — keep as-is                                      |

Nothing else. §6 lists what was considered and rejected, with reasons — do not add pages
beyond this set without a real operator need behind them.

**Why these five map to reality:** the platform has exactly four streams a human must watch —
listings entering moderation (`pending_review` is a schema state, so review is mandatory work),
bookings that guests/hosts will email about, public feedback from `/report`, and user conduct.
Plus one place to see it all at a glance. One stream, one page, one question.

## 1. Navigation & information architecture

Sidebar (`src/routes/(protected)/admin/+layout.svelte`, `navItems`), top to bottom — ordered
by "how often does an admin act here":

```
Dashboard          LayoutDashboard icon
Accommodations     Building2        + badge: pending_review count
Bookings           CalendarDays
Reports            MessageSquareWarning + badge: new count
Users              Users
```

- **Badges are the wayfinding system.** A non-developer admin should never have to open a
  page to learn whether it needs them. Exactly two badges: listings awaiting review, unread
  reports. Both are NOW-questions → `@convex-dev/aggregate` counts (per
  `GeneralSystemDesignRule.md` § table counts): `aggregateApartments.count(ns
'pending_review')` and `aggregateReports.count(ns 'new')` (reports namespace: see §4).
- One combined query `fetchAdminSidebarBadgesSafe` returning both counts, subscribed via
  `useQuery` **in the admin layout**. Realtime verdict: **subscription** — hosts submit
  listings and the public files reports while the admin works; the badge must move. This does
  not violate the "no layout-level feature fetches" rule: the badges are rendered _by the
  layout itself_ (nav chrome), not mirrored into pages.
- Badge display: number when 1–99, `99+` above. Badge hidden at zero — absence means done,
  same convention as the dashboard's Band 1.
- Existing `countPendingReviewSafe`
  (`src/convex/tables/accommodations/queries/countPendingReviewSafe.ts`) predates the
  aggregates — fold it into `fetchAdminSidebarBadgesSafe` using the aggregate and delete the
  capped `.take(51)` workaround.
- Add the new routes to `ADMIN_PAGE_ENDPOINTS` in `src/shared/constants.ts`.

Every page uses the same envelope as `/admin/users`: `flex flex-col gap-4 p-4 md:p-6`,
header = `h1` + one-line description, then the content. No hero, no cards-for-decoration.
All pages `noIndex` via `SvelteHead`.

## 2. `/admin/accommodations` — listings & moderation

**Question: "Which listings need my review, and what is live on the platform?"**

This is the one admin page with a mandatory workflow: every host listing is born
`pending_review` (`createAccommodation` hardcodes it) and only an admin can make it
`published` or `suspended`. If this page doesn't exist, listings go live via the Convex
dashboard — not acceptable in production.

### Layout

Two zones, one page (no tabs — tabs hide the queue, and the queue is the job):

1. **Review queue** (top, only when non-empty — dashboard Band-1 convention): rows of
   listings in `pending_review`, oldest first (they've waited longest). Row: cover thumbnail,
   title, host name, city, price/night, submitted relative-time, and two actions: **Publish**
   and **Open** (the public `/accommodation/[slug]` page in a new tab — admins review the
   listing as guests will see it; no separate admin preview surface to build and maintain).
2. **All listings table** (`DataTable` / `convex-data-table`, same as `/admin/users`):
   columns Title, Host, City, Type, Price, Status (color + text badge), Created. Filters:
   status, type; search by title; sort by created/price. This maps 1:1 onto the existing
   query args — build no new backend for it.

### Actions (all existing backend, wire only)

- **Publish / Suspend / Archive** → `moderateApartmentStatus`
  (`src/convex/tables/accommodations/mutations/updateAccommodation.ts`, `zAdminMutation`).
  It already sends the host emails (published/suspended), stamps
  `moderatedAt/moderatedBy/moderationReason`, and writes the audit entry.
- **Suspend requires a reason** — the mutation enforces it; the UI collects it in a small
  inline form (native popover/sheet, not a modal-first flow) with a textarea. The reason
  reaches the host's email: the copy near the field must say so ("The host will receive this
  explanation."). That one sentence prevents careless reasons.
- Publish from the queue row is one click + confirm. Confirmation dialogs state the
  consequence in plain words: "This listing goes live and the host is notified by email."
- No inline editing of listing content. Admins moderate; hosts edit. If a listing has a typo,
  the admin suspends with a reason or contacts the host. (Editing on behalf exists in the
  host flow for admins — that's where it stays.)
- **Scope note — two more one-click actions live on the table rows** (both mutations exist,
  audit-logged; this page is their sanctioned home):
  - **Feature / unfeature** → `setApartmentFeatured` — drives the homepage strip
    (`AccommodationsSystemDesign.md` §7/§13.8). Never host-facing, never purchasable.
  - **Record fee payment** (`listing_fee` mode only) → `stampListingFeePayment` — an admin
    records a bank-transfer renewal until the provider adapter is live
    (`AccommodationsSystemDesign.md` §8). Takes the bank reference; the audit entry is the
    money trail. Hidden entirely outside `listing_fee` mode.

### Data

- Table: existing `listBookingsAdmin`-style paginated query — `listAccommodationsAdmin`
  (`src/convex/tables/accommodations/queries/listAccommodationsAdmin.ts`), already
  `requireAdmin`-gated with status/type/host/search/sort args. `DataTable` subscribes
  (rule's worked example: new rows arrive from hosts while the admin watches → subscription).
- Review queue: same query with `status: 'pending_review'` fixed, or a dedicated tiny query
  ordered oldest-first — implementer's choice; keep it one subscription if `DataTable`
  already provides the data (filter client-side only if the queue and table share the same
  page of data — otherwise a second small query is fine).

### States

- Queue empty → zone absent.
- Table empty (no listings at all) → empty state, no CTA (admins don't create listings).
- Loading → skeleton table (existing `DataTable` pattern). Error → page error + retry.

## 3. `/admin/bookings` — booking oversight

**Question: "A guest or host emailed about booking BK7X9M2P4Q — what happened, and do I need
to intervene?"**

This page is a **support lookup tool**, not a management console. The booking lifecycle is
automatic (hourly cron: check-in/out, pending expiry — never build manual state-advance
buttons). The admin's only write here is the emergency brake.

### Layout

Single `DataTable`, filters above (users-page pattern):

- **Search**: booking code or guest email — the two things a support email will contain.
  Maps to existing `searchField: 'code' | 'email'`.
- **Filters**: status, payment status, check-in date range (`checkInFrom/To`), and
  **flagged** (`paymentFlag` present — the money operations that failed and need a human,
  `PaymentsSystemDesign.md` §4/§6; the reconciliation cron keeps re-surfacing them here).
  All existing args of `listBookingsAdmin`.
- **Columns**: Code, Guest (name + email), Accommodation (title, links to public page), Host,
  Check-in → Check-out, Total (EUR, `tabular-nums`), Payment (color+text), Status
  (color+text). Responsive: hide Host and Payment below `md`, dates below `lg` (users-page
  `hideBelow` convention).
- **Row expansion** (native accordion / details row, no navigation, no modal): full detail —
  guests count, nights, price breakdown (subtotal/cleaning/service fee when present/total,
  from the booking's snapshot), special requests, phone, cancellation info
  (`cancelledBy/At/Reason`) and the payment flag's meaning when present. A support question
  is answered in-place; a `/admin/bookings/[id]` detail route is deliberately NOT built
  (nothing on it would exceed one expanded row).

### Actions

- **Cancel booking** → existing `cancelBookingAdmin`
  (`src/convex/tables/bookings/mutations/cancelBookingAdmin.ts`, `zAdminMutation`) — reason
  required, guest + host emails sent, audit-logged. Only offered on non-terminal statuses
  (`isTerminalBookingStatus` util exists — reuse it). Confirm dialog states consequences:
  "Both guest and host will be notified by email. This cannot be undone."
- **Clear a payment flag** — after finishing a failed money operation by hand (refund in the
  provider dashboard, transfer retry), the admin clears the row's `paymentFlag` so the
  reconciliation cron and the flagged filter stop re-surfacing it
  (`PaymentsSystemDesign.md` §4/§6's "a human finishes it"). The admin cancel itself already
  performs refunds/releases through the adapter automatically — this action is only for the
  flagged leftovers.
- Nothing else. No edit, no manual check-in, and no ad-hoc refund button — every refund path
  is a row in `PaymentsSystemDesign.md` §4's closed matrix, reached through cancel or a flag.

### Data & states

- Realtime verdict: **subscription** via `DataTable` (bookings land while the admin watches —
  the rule's admin-orders example verbatim).
- Empty (no bookings match filters) → "No bookings match." + clear-filters action. Loading /
  error: `DataTable` defaults.

## 4. `/admin/reports` — feedback inbox

**Question: "What are people telling us, and what have we not yet looked at?"**

The dashboard's Band 1 shows the newest five; this page is the full inbox it links to. It is
the only new page that needs schema work.

### Schema & backend additions (the only new backend in this document)

1. **`reports.status`**: `v.optional(v.union(v.literal('new'), v.literal('resolved')))` —
   `undefined` means `'new'` (existing rows need no migration). Index `by_status`. ⚠️ An
   index match is EXACT, so `eq('status', 'new')` cannot see legacy rows that stored
   nothing: the `'new'` read is two slices (`'new'` + `undefined`) merged, which is the
   query-layer twin of the aggregate's `?? 'new'`. New rows stamp the field explicitly.
2. **`aggregateReports` gains a namespace**: `(doc) => doc.status ?? 'new'`. ⚠️ Changing an
   aggregate's namespace invalidates its stored tree, so after deploying run the ritual —
   `aggregates:clearAggregate {table:'reports'}` then
   `aggregates:backfillAggregates {table:'reports'}`. The dashboard's "needs attention"
   count and the sidebar badge then read `count(ns 'new')`.
3. **`listReportsSafe`** (new, `requireAdmin`): paginated, filter by status + category,
   newest first.
4. **`setReportStatus`** (new, `adminMutation`): flips `new ⇄ resolved`. Reversible by
   design, so no confirmation dialog is needed — undo beats confirm for non-destructive
   actions (lower cognitive load than a dialog per click).

### Layout

An inbox, not a table — reports are prose, and prose dies in table cells:

- **Two views via a segmented control** (default **New**, second **All**): the admin's job is
  draining New to zero; All exists for "what did someone say last month".
- Row: category badge (bug = destructive tint, idea = info tint, other = muted — always
  color + text), full message (wrapped, not truncated — messages are short free-text; if one
  runs long, clamp at ~6 lines with an inline expand), relative time, reporter email as a
  `mailto:` link when present ("Reply"), and **Resolve** (or **Reopen** in All view).
- Resolve is optimistic: the row leaves the New view immediately; a toast with "Undo" covers
  slips.

### Data & states

- Realtime verdict: **subscription** — the public files reports while the admin reads (same
  justification as the dashboard).
- New view empty → "Nothing new. All caught up." (this is the one place an explicit all-clear
  earns its space — the admin navigated here to check). All view empty → "No reports yet."
- No pagination gymnastics in v1: paginated query with a visible "load more" (never render
  page 1 as the full set — rule §3).

## 5. `/admin/users` & `/admin/users/[id]` — keep as-is

Already built and correct for the operator need: searchable/filterable user table, and a
detail page with the conduct actions (`setUserRole`, `banUser`/`unbanUser`, `revokeSession`,
`revokeAllSessions`, `deleteUser` — all `adminMutation`-gated and audited).

Two small additions while in the area, both on the detail page:

- **Link out to the user's platform activity**: "View bookings" → `/admin/bookings`
  pre-filtered by guest (the `guestId` arg exists on `listBookingsAdmin`); "View listings" →
  `/admin/accommodations` filtered by `hostId`. Cross-links are how a non-developer admin
  answers "what has this person done here?" without learning the data model. Filter state
  arrives via URL search params (nuqs-svelte is already a dependency).
- Nothing else changes.

## 6. Considered and rejected

- **`/admin/analytics`** — the dashboard's 12-month chart + stat cards already answer the
  trend question at operator depth, and per-listing performance depth is the HOST's
  question, answered on `/host/analytics` (`HostSystemDesign.md` §2b). Deeper slicing is a
  developer activity in the analytics component, not an admin page. Revisit only when an
  operator asks a specific recurring question the dashboard can't answer.
- **`/admin/newsletter`** — a list of email addresses with no action attached. Export lives
  in the Convex dashboard on the rare day it's needed.
- **`/admin/audit-log`** — `FEATURES.AUDIT_LOGS` is off by default; the log is a forensic
  tool for developers, not an operator surface.
- **`/admin/settings` / feature flags** — flags live in code (`src/shared/config.ts`) by
  design; a toggle page invites production accidents by non-developers.
- **`/admin/bookings/[id]` detail route** — row expansion carries everything a support answer
  needs; a route would duplicate it for zero gain.
- **Admin listing editor** — moderation and authorship stay separated (see §2).
- **Bulk actions everywhere** — single-item confirm flows only. This platform's volumes are
  human-scale; bulk tooling is power-user surface area a non-developer doesn't need and can
  hurt themselves with. The one exception already exists (`createDeleteMutation` machinery)
  and stays developer-facing.

## 7. Cross-cutting requirements (all pages)

- **Auth**: every query `requireAdmin`, every mutation `adminMutation`/`zAdminMutation`.
  Layout gating is UX, not security — the functions re-check.
- **Writes to `apartments`/`bookings`/`reports`** go through constructors from
  `@/convex/functions` (aggregate triggers — `GeneralSystemDesignRule.md` § table counts).
  All mutations named above already comply; `setReportStatus` (new) must too.
- **i18n**: the UI is **English-only today** — Paraglide was removed from the project, so
  admin page copy is plain strings like every other page
  (`GeneralSystemDesignRule.md` § backend returns data). What still holds, and is what makes
  a future locale a catalog-only change: backend messages travel as KEYS
  (`{ key: 'GenericMessages.X' }`) resolved through `translateFromBackend`, and the
  transactional emails keep their own server-side `src/convex/i18n` catalog (en + sr in the
  same commit). Never return a human-readable sentence from a Convex function.
- **Status display**: color + text everywhere, never color alone. Reuse one shared
  status-badge treatment across bookings/listings/reports rather than three bespoke ones.
- **Destructive/consequential actions**: confirm dialog naming the concrete consequence
  (who gets emailed, what cannot be undone). Reversible actions (resolve report) skip the
  dialog and offer undo instead.
- **Density**: DESIGN.md front-desk rules — 32px controls, tight rows, hairline separation,
  `tabular-nums` on codes, counts, money, dates.
- **A11y (WCAG 2.2 AA)**: tables keyboard-navigable, row expansion is a real disclosure
  (`aria-expanded`), focus ring untouched, filters operable without pointer.
- **URL state for filters** (nuqs-svelte): filtered views must be shareable/bookmarkable —
  "look at this booking" between two admins is a link, not a set of instructions.
- **Empty/error/loading** as first-class component folders (`empty/`, `error/`, `loading/`)
  per the established convention.

## 8. Implementation order

1. **Sidebar**: nav items + icons + `fetchAdminSidebarBadgesSafe` (aggregate-backed, absorbs
   `countPendingReviewSafe`). Ship first — it makes the remaining work visible.
2. **`/admin/accommodations`**: highest operational value (listings are blocked on review).
   Backend exists; UI only.
3. **`/admin/bookings`**: backend exists; UI only.
4. **`/admin/reports`**: schema field + aggregate namespace change (+ re-backfill) + two new
   functions + inbox UI.
5. **`/admin/users/[id]` cross-links**: last; two links + URL-param filter wiring.

Each step is independently shippable in that order.
