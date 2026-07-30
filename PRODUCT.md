# Product

## Register

product

## Users

Three roles share one application, and they never share a screen.

**Guests** are people who need a place to stay in Belgrade — a night, a week, a season. They arrive from search or a shared link, usually on a phone, often mid-plan with a tab open next to a flight booking. They are not logged in when they arrive and should not have to be. The job: find a place that fits the dates and the budget, understand exactly what it costs, and confirm it without a conversation. After booking, they come back for one reason only: to check a detail of a stay they already have (`/guest/my-bookings`, `/guest/dashboard`, `/guest/favorites`).

**Hosts** are small owners, usually one to a handful of apartments, not a management company. They work on a laptop, in bursts, between other jobs. The job: get a listing published without a 40-field form fight, then see what is booked, what is arriving, and what needs an answer (`/host/dashboard`, `/host/my-accommodations`, `/host/reservations`, `/host/add-accommodation`).

**Admins** are the operators — currently the Belgrade team itself. The job: moderate users and reports quickly and get back out (`/admin/users`, `/report`).

The interface is bilingual: English and Serbian (`messages/en.json`, `messages/sr.json`). Neither is a translation afterthought; a Serbian guest and an English guest are equally native users.

## Product Purpose

BGApartman is a direct booking platform for handpicked apartments, run by a small Belgrade team rather than a marketplace. It exists because the alternatives put three things between a guest and a bed: opaque final prices, a required conversation, and an account. This product removes all three.

Success is measured in completed bookings per session and in what does *not* happen: no support email asking what the real total is, no host giving up halfway through a listing form, no guest bouncing to a competitor because the calendar was ambiguous.

The booking lifecycle is automatic (hourly cron handles check-in, check-out, and pending expiry). The interface must never imply a human is standing by to advance a state that the system already advances on its own.

## Brand Personality

**Fast, direct, no-nonsense.**

Voice is plain and finished. Say the number, say the date, say what happens next. Second person, present tense, no hedging. "Booked. You'll get the address by email." not "Your reservation request has been successfully submitted and is now being processed."

Warmth exists, but it comes from being specific and local ("We're based in Belgrade. If anything comes up during your stay, a real person answers."), never from adjectives about ourselves. No exclamation marks, no emoji in product UI, no "Oops!" error copy.

The emotional target is **confidence, not delight**. A guest should feel that the number on the screen is the number they will pay, and that pressing the button ends the task.

## Anti-references

**Generic SaaS landing.** No gradient-blob hero. No row of three identical icon-heading-paragraph cards. No big-number stat strip. No purple-on-white. If the landing page could be re-skinned into a project management tool by swapping the nouns, it has failed.

**Overstyled / trendy.** No glassmorphism, no neon, no dark-mode-first developer-tool aesthetic, no scroll-jacking or animation that the content did not ask for. Motion earns its place by clarifying state, or it is deleted.

Also refused, downstream of the two above: urgency theatre ("3 people are viewing this!"), fake scarcity, decorative gradient text, and any pattern whose job is to look modern rather than to answer a question.

## Design Principles

**The price is the product.** The total a guest will pay is the single most important element on any booking surface, and it is never assembled from footnotes. Any change to dates, guests, or options updates the total in place, immediately, before anything else moves.

**Density is respect.** Controls are compact (32px), rows are tight, and screens carry real information instead of air. A host scanning ten reservations should see ten reservations, not three cards and a scrollbar. This is deliberate and it is the opposite of the marketplace default.

**No dead ends.** Every empty state, error, and expired-booking screen names what happened and offers the one action that resolves it. The codebase already treats `empty/`, `error/`, and `loading/` as first-class component folders — that structure is the principle, not scaffolding.

**Say it once.** Copy states a thing at the moment it matters and never restates it. No heading repeated as a subheading, no tooltip explaining a label that should have been clearer.

**Guests before accounts.** Search, browse, and understand pricing work fully logged out. Authentication appears at the moment it is structurally required, never as a gate on curiosity.

## Accessibility & Inclusion

Target: **WCAG 2.2 AA**, non-negotiable on public booking flows.

- Body text meets 4.5:1; large display text meets 3:1. The amber primary is a *background* for dark text, never dark-on-light body copy.
- Every booking, listing, and auth flow completes on keyboard alone. Focus is always visible: the project uses a 3px `ring-ring/50` focus ring, and it is never removed.
- Date range selection, the single most failure-prone control here, must be operable and announced without relying on hover or color alone.
- Status (pending, confirmed, cancelled, expired) is never communicated by color alone — always color plus text.
- `prefers-reduced-motion` disables entrance animation and any transition longer than a state change.
- Interfaces must survive 200% zoom and 320px width without horizontal scroll.
- Both locales (`en`, `sr`) get real strings. Serbian is longer than English on average; layouts must not break on a 30% text expansion.
