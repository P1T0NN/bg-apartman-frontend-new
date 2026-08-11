# TODO

## Fast follows (in rough order of effort/value)

1. [ ] **Sitemap.xml + structured data** — generate `sitemap.xml` (static pages + published accommodation slugs), add `ld+json` (`VacationRental` schema) to the accommodation detail page, and disallow `/guest` + `/host` in `robots.txt`. Big SEO lever for this category.
2. [ ] **Delete `/sidebar` scratch route** — demo route, ships to production.
3. [ ] **Hide "Unpaid" badge on my-accommodations** — `paidAt` / `paymentOrderId` / `apartmentSubscriptionExpiryDate` are scaffolded but never written; the badge renders a state that can't change. Hide until the listing-payment model is real (or wire the model).
4. [ ] **Server-persisted favorites** — localStorage-only today, so logged-in users lose favorites across devices. `src/convex/tables/favorites/` dir already exists (empty); sync on login, keep localStorage for anonymous guests.
5. [ ] **Cookie consent** — Google Maps loads unconditionally; needed for EU guests (GDPR). Minimal banner + defer Maps until accepted.
6. [ ] **Reviews & ratings** — the trust engine; cards show "New" forever. Own focused session: `reviews` table (booking-gated: only checked-out guests can review), host reply, aggregate rating/count denormalized onto `apartments`, card + detail page UI.

## Backlog

- [ ] **Admin Pages** — spec: `docs/specs/admin-pages.md`. Backend queries/mutations + `admin/+layout.server.ts` gate already exist; no UI routes yet.

## Deliberately deferred (decided, don't re-litigate)

- **No booking modification** — guests cannot change dates or rebook; cancel is the only guest action. This is intentional product policy.
- **No online payment processor** — cash-on-arrival works end to end; `online` is stored on bookings but nothing charges. Revisit when a bank/processor is chosen (apartment `paymentOrderId` fields are scaffolded for it).
- **sr.json completion** — Serbian UI translations are partial (~7/52 namespaces) and marketing sections are hardcoded English. Finish before promoting the `sr` locale.
- **Legal pages** — terms/privacy/cookie routes don't exist; footer "Terms of service" links to home. Required before public launch.

## Done (recent)

- [x] Landing page (hero search, featured [live query + loading/empty/error states], become-host, why-us, testimonials, newsletter signup)
- [x] Contact page wired to `sendContactFormEmail` remote command (BotID-guarded, Resend)
- [x] Report page (`/report`) + `reports` table + `createReport`
- [x] Newsletter table + `subscribeToNewsletter`
- [x] **Double-booking guard** — `hasOverlappingBooking` via `by_apartment_dates`, enforced in `createBooking`
- [x] **Date availability in search** — `fetchSearchAccommodationsSafe` excludes apartments with overlapping active bookings
- [x] Root `+error.svelte` (404 + generic error, report link)
- [x] Payment methods: apartments accept `cash | online | both`; book page shows only accepted methods; server validates guest's choice
- [x] Header scroll-spy nav + active pill; footer redesign; host dashboard, decline/confirm/cancel flows, lifecycle cron (earlier)
