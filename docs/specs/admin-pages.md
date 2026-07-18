# Spec: Admin Pages (`/admin/*`)

> Implementation spec for an LLM/developer session. Already built and NOT in scope
> to redo: `/admin/users` (DataTable with server-side filter/sort/search via
> `listUsers`) and `/admin/users/[id]`. The admin layout + role gating exist
> (`(protected)/admin/+layout.server.ts`, better-auth `admin` plugin,
> `requireAdmin` / `adminMutation` / `adminAction` in
> `src/convex/auth/middleware/authMiddleware.ts`). `/admin/dashboard` is an empty
> file — build it.

## 1. Product goal

Admin = the operator of the platform. Their recurring jobs, in frequency order:

1. **Moderate new accommodations** (`pending_review` → `published`/`suspended`) — the
   platform's growth bottleneck; must be fast and pleasant.
2. **Support lookups** — "guest emails about booking BK7X9M2P4Q" → find it in
   seconds, see everything, act if needed.
3. **Manage users** — ban/unban, role changes (users pages exist; add actions).
4. **Pulse check** — is the platform growing, anything stuck?

Build exactly four things: a dashboard, a accommodations moderation page, a bookings
support page, and actions on the existing user detail page. Nothing speculative
(no CMS, no settings pages, no feature flags UI).

## 2. Shared UX rules

- **Every list page is the existing `convex-data-table`** (see `/admin/users` as
  the reference implementation): server-driven `queryArgs` filters, `bind:search`,
  sortable columns, `hideBelow` responsive columns, row → detail navigation.
  Do not hand-roll tables.
- **Sidebar navigation** (existing `app-sidebar`/`sidebar` components):
  Dashboard, Accommodations, Bookings, Users. The Accommodations item shows a count badge of
  `pending_review` accommodations — computed with a `.take(51)` bounded count query
  rendered as "50+" when it hits the bound (never `.collect()` a table to count it).
- **Destructive/moderation actions always take a reason** (textarea in an
  `alert-dialog`) and always end in a toast from the `MutationResult` envelope.
- Register every new route in `ADMIN_PAGE_ENDPOINTS`
  (`src/shared/routeEndpoints.ts`) and link via `localizeHref`.

## 3. Pages

### 3.1 `/admin/dashboard`

Header + three regions, same visual language as the host dashboard spec
(tiles with context lines, one chart, one action queue):

1. **Review queue (the action zone).** Card list of up to 5 oldest
   `pending_review` apartments: cover thumbnail (`images[0]`), title, host name,
   city, submitted date (`_creationTime`). Buttons: **Review** (→ detail, primary)
   and inline **Approve**. "View all N" → `/admin/accommodations?status=pending_review`.
   Renders only when non-empty; when empty show one quiet line "No accommodations waiting
   for review."
2. **KPI tiles (4):** New users this month (+Δ vs last), Published accommodations
   (+N pending as context), Bookings this month (+Δ), GMV this month (€ sum of
   confirmed/checked_in/checked_out booking `total`s, +Δ).
3. **Trend chart:** existing `AreaChartInteractive`, monthly series (12 months) of
   bookings count + GMV, toggleable. Optionally a second series source later from
   `@piton-/analytics-convex` visitor data — out of scope for v1.

### 3.2 `/admin/accommodations` — accommodation moderation

- DataTable of `apartments`: thumbnail+title (custom cell like users' `nameCell`),
  host (link to `/admin/users/[id]`), city, type, price, status badge, submitted
  date. Filters: status (default **pending_review** — the page opens on the work),
  type. Search: title. Sort: `_creationTime`, price.
- Row click → `/admin/accommodations/[id]`: full accommodation preview —
  photo grid (reuse the tile from
  `src/features/uploadFile/components/upload-file-multiple/upload-file-item-multiple.svelte`
  in read-only fashion or a simple grid), all fields grouped like the public page,
  host card, and the accommodation's booking count.
- **Actions** (buttons on detail + overflow menu in table rows):
  - **Approve** → `status: 'published'` + email host (the create-accommodation
    email template already has a `live` flag — reuse/extend it).
  - **Reject / Suspend** → `status: 'suspended'` + required reason → email host
    with reason (new template, en + sr, same pattern as existing booking emails).
  - **Archive** → `status: 'archived'` (no email).
  - Store moderation metadata on the apartment: `moderatedAt`, `moderatedBy`,
    `moderationReason` (optional fields — additive schema change, no migration).

### 3.3 `/admin/bookings` — support tool

- DataTable of all bookings: booking code (monospace, with the existing
  `copy-button`), guest name+email, accommodation title, host, dates, total, status
  badge, payment status. Filters: status, payment status, date range
  (check-in). Search: booking code OR guest email (a `searchField` toggle exactly
  like `/admin/users`).
- Row click opens the existing booking detail sheet
  (`src/features/bookings/components/bookings-table/bookings-detail-sheet.svelte`)
  — extend it for admin context rather than building a new one.
- **One admin action: Cancel booking** (required reason; sets
  `cancelledBy: 'system'`, `cancelReason`; sends the existing cancellation emails
  to guest and host). No admin confirm/decline (that's the host's job) and no
  check-in/out controls (cron-owned).

### 3.4 `/admin/users/[id]` — add actions + context (page exists)

- Actions card: **Ban / Unban** (reason required; better-auth admin plugin API),
  **Change role** (`user`/`admin`, with an "are you sure" dialog).
- Context tabs (existing `tabs` component): the user's **Accommodations** (as host) and
  **Bookings** (as guest) — small tables reusing the queries/indexes from 3.2/3.3
  scoped by `hostId`/`guestId`.

## 4. Data layer (Convex)

### 4.1 Conventions (all pre-existing — follow them)

- Queries: `src/convex/tables/<table>/queries/`, `fetchOptimized` for tables
  (offset strategy, server-side `where` on an index — copy
  `listUsers`/`fetchHostBookingsSafe`), lean enriched payloads.
- Mutations: `adminMutation('<rateLimitName>')` wrapper; register each name in
  `src/convex/rateLimits/registry.ts`; args as a shared Zod schema
  (zAuthMutation pattern — one schema serves the form and the mutation, no
  duplicated `v.*` block); return the `MutationResult` envelope with i18n keys;
  write an audit entry via `logAudit` for every moderation action (approve,
  suspend, cancel, ban, role change).
- Emails: Resend templates in the existing email structure, en + sr, locale from
  the mutation's `locale` arg (see the create-accommodation email flow).
- Backend-origin message keys go in `src/convex/i18n/messages/{en,sr}.json`;
  frontend strings in `messages/{en,sr}.json` under `AdminDashboardPage`,
  `AdminAccommodationsPage`, `AdminBookingsPage` namespaces.

### 4.2 New queries

| Query                         | Backing index                                             | Notes                                                                                          |
| ----------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `listAccommodationsAdmin`     | `apartments.by_status` (+ filter for type/search)         | fetchOptimized offset, like `listUsers`                                                        |
| `fetchAccommodationAdminById` | `db.get`                                                  | full doc + host user + booking count (`.take(101)` → "100+")                                   |
| `listBookingsAdmin`           | `bookings.by_status`, `by_booking_code`, `by_guest_email` | pick index by which filter/search is active; fall back to full-order scan only with pagination |
| `fetchAdminStatsSafe`         | `by_status` ranges + `_creationTime` ranges               | tiles + 12-month series in one payload, bucketed in JS                                         |
| `countPendingReviewSafe`      | `apartments.by_status` `.take(51)`                        | sidebar badge; returns `{ count, capped }`                                                     |

### 4.3 Performance & future-proofing

- Counting rule everywhere: **bounded `.take(N+1)`, display "N+"**. Never
  `.collect()` to count. This is the whole counting strategy for v1.
- `fetchAdminStatsSafe` scans month-bounded ranges — fine into the tens of
  thousands of rows. **Upgrade path (do NOT build now):** a `platformDailyStats`
  rollup table maintained by a daily cron; the query becomes a 365-row read. Leave
  a `// ponytail:` comment naming this at the aggregation site.
- Booking search by code/email is already indexed (`by_booking_code`,
  `by_guest_email`); route search through those indexes, not filters.
- All moderation writes are single-doc patches — no fan-out to denormalize
  (search reads `apartments.status` directly, so publish/suspend is instantly
  consistent).

## 5. Acceptance checklist

- [ ] `bun run check` and `bun run lint` pass.
- [ ] Every admin mutation: `adminMutation` wrapper + rate-limit registry entry +
      `logAudit` call + `MutationResult` envelope + shared Zod args schema.
- [ ] Approve/suspend send host emails in the host's locale (en + sr templates).
- [ ] Moderation and cancel flows require a reason; reason lands in the email and
      the audit log.
- [ ] Sidebar badge caps at "50+"; no unbounded counts anywhere.
- [ ] `/admin/accommodations` opens pre-filtered to `pending_review`.
- [ ] Bookings page finds a booking by code in one search.
- [ ] All list pages are `convex-data-table` with server-side filters (no
      client-side filtering of full tables).
- [ ] All strings en + sr; routes registered in `ADMIN_PAGE_ENDPOINTS`.
- [ ] No check-in/check-out or host-only actions exposed to admin.
