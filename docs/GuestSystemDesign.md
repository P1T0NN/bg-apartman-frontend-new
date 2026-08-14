# Guest System — System Design

> Status: **target design** (written 2026-07-27). The guest-facing half of the platform —
> identity, the booking journey, the reservation surface, and the guest area — as it SHOULD
> be. §11 lists the exact delta from current code; everything not listed is already correct.
>
> This document owns **no lifecycle**. Booking states, windows, and transitions belong to
> `BookingSystemDesign.md`; listing visibility to `AccommodationsSystemDesign.md`; operator
> surfaces to `AdminPagesSystemDesign.md`; data rules to `GeneralSystemDesignRule.md`. This
> document owns what the GUEST experiences: who they are to the system, what they see, what
> they can do, and how every screen loads. Where another document already decided something,
> this one cites it — if a statement here ever contradicts a cited document, the cited
> document wins and this one has a bug.

## 0. Operating principles

1. **No account required, ever, to book.** An email address and a link are the identity
   floor. Every gate ("sign up to continue") is a booking the host never got. Accounts are
   an upgrade guests choose for convenience — never a toll booth.
2. **The link IS the guest.** For account-less guests, the booking `_id` (unguessable) is
   the capability: whoever holds the reservation link is the guest, with full guest powers
   over that one booking and visibility into nothing else. Same model as a boarding pass.
3. **The guest never sees the machine.** Statuses, crons, capability tokens, and policy
   snapshots are internals. The guest sees plain answers: "Requested — the host has until
   Friday to respond", "Confirmed — see you June 25", "Cancelled — here's why". Every
   status maps to one sentence and at most one action.
4. **One booking, one page.** `/reservations/[id]` is the single surface where a booking is
   viewed and acted on — linked from every email, every list row, every dashboard card.
   Guest questions are answered by sending one link, never instructions.

## 1. Guest identity

### The three guest shapes (one system, no branches downstream)

| Shape                          | Who they are to the system                                  | Access to their bookings                              |
| ------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------- |
| **Anonymous**                  | `guestId` unset; `guestEmail/Name/Phone` on the booking row | Reservation link (email) + self-serve recovery (§3)   |
| **Signed-in**                  | `guestId` stamped at booking creation                       | Same links, PLUS the `/guest/**` area aggregates them |
| **Anonymous → signs up later** | Past bookings claimed by verified email (below)             | Bookings appear in `/guest/**` after the claim        |

### The claim — how anonymous bookings join an account

`claimMyBookings` (small idempotent mutation): for the signed-in user's **verified** email,
patch `guestId` onto every booking where `guestEmail` matches (via `by_guest_email`) and
`guestId` is unset. Triggered once after signup/login (fire-and-forget from the auth flow —
never blocks it).

- **Verified email is the proof of ownership.** An unverified account claims nothing —
  otherwise registering someone else's email would harvest their booking history.
- Claim is additive-only: it never moves a booking away from an account, and re-running is
  a no-op. Queries never do read-time email unions — `by_guest` reads stay one-index simple
  because the claim happened at write time.

### Capability semantics (decided, not accidental)

- The reservation link grants **view + the guest actions** (§4) for that one booking. Yes,
  a link holder can cancel — the link is the guest (§0.2). This is the same trust model as
  every airline/hotel "manage my booking" URL.
- The public reservation projection is **minimal** (`GeneralSystemDesignRule.md` § minimal
  projection): code, dates, party size, status, payment method, total, listing title/slug,
  host first name. It deliberately excludes the guest's phone and special requests — a
  leaked link exposes a trip, never a contact dossier.
- Mutations on the capability path are rate-limited (existing middleware) — the id space is
  unguessable, but the door still has a lock.

## 2. The booking journey

```
search (/, /search) → listing (/accommodation/[slug]) → book (/accommodation/[slug]/book)
      → createBooking → /reservations/[id]   (the page they keep forever)
```

- **The form collects in this order**: dates + party (validated against listing rules,
  `AccommodationsSystemDesign.md` §6) → contact details (prefilled from the account when
  signed in) → payment method (only what the listing accepts; `online` only once the
  adapter exists — `PaymentsSystemDesign.md` §8) → review + commit.
- **The price panel is a server-shaped quote**: composed by the shared `calculatePrice`
  seam (`AccommodationsSystemDesign.md` §5) — nightly breakdown, cleaning fee, and the
  `platformFee` line when `booking_fee` mode is on (§8 there; the guest sees the fee before
  committing, never on the receipt first). The mutation reprices server-side and never
  trusts the client's numbers; the UI quote and the stored snapshot agree because they are
  the same function.
- **The commit button says what happens next**, per listing mode
  (`BookingSystemDesign.md` §1): request-to-book → "Request to book — the host has 48h to
  respond. You won't pay until confirmed." Instant → "Book now — instantly confirmed."
  No shared euphemism between the two; the difference IS the information.
- **After submit**: navigate to `/reservations/[id]`. The form never double-submits
  (disabled in flight), and the backend backstops it: `createBooking` rejects a duplicate
  open request — same listing, same dates, same email, status `pending` (§11 delta). The
  confirmation email carries the same link (§5).

## 3. `/reservations/[id]` — the reservation page

The one page per booking (§0.4). Public, capability-accessed, works signed out.

### Status → what the guest sees (all eight, no gaps)

| Status          | Headline sentence (copy owns the tone)                | Action shown (per shared guards — see §4)  |
| --------------- | ----------------------------------------------------- | ------------------------------------------ |
| `pending`       | Requested — host responds by {deadline}               | Withdraw request                           |
| `confirmed`     | Confirmed — {checkInDate} at {listing}                | Cancel (copy varies by window, §4)         |
| `checked_in`    | You're checked in — enjoy your stay                   | — (host/phone contact info shown)          |
| `checked_out`   | Stay complete — hope you enjoyed {city}               | Book again (link to listing, if published) |
| `declined`      | The host couldn't take this one — {reason}            | Browse other stays                         |
| `auto_declined` | The host didn't respond in time / dates were taken    | Browse other stays                         |
| `withdrawn`     | You withdrew this request                             | Browse other stays                         |
| `cancelled`     | Cancelled by {you/the host/support} — {reason if any} | — (refund status line when online-paid)    |

- Payment line always present: "Pay {total} in cash at the property" or the online payment
  state in guest words (`awaiting` → "finalising your payment…" — the dumb-redirect landing
  state that flips live when the webhook lands, `PaymentsSystemDesign.md` §3;
  `authorized` → "card held, charged only if confirmed"; `released` → "the hold was
  released — you were not charged"; `paid`/`refunded` → plain) —
  `BookingSystemDesign.md` §5 states, guest vocabulary here.
- **Stay-confirmation banner** (`BookingSystemDesign.md` §11): when the host asks "still
  coming?", the live page shows a one-click "Yes, I'm coming" banner; answering re-locks
  the host's cash cancel and quietly shows a ✓ after. Ignoring it for 24h is what lets a
  cash host cancel — the banner copy points guests whose plans changed at the actions
  below instead.
- **Realtime verdict: subscription** — already decided in `BookingSystemDesign.md` §9:
  guests sit on this page waiting for the host, and the cron can flip state mid-view. The
  one guest surface that earns a live channel.

### Link recovery — `/reservations` (index)

The self-serve "I lost my email" page: a two-field form (booking code + email) → resolves
to the reservation page on an exact match, generic failure otherwise (no oracle for "this
code exists"). Rate-limited. This removes the only support ticket the capability model
would otherwise generate. (The route exists today as an empty file — §11.)

## 4. Guest actions — consuming the booking policy

The windows, consequences, and refund mapping are `BookingSystemDesign.md` §4 — **not
restated here**. What this document owns is how they surface:

- **Buttons render through the same shared guards the backend enforces**
  (`guestMayPerform` — invariant I5 there). A guest never sees a button that will be
  rejected; a rejected mutation means the state moved underneath them, and the page (live,
  §3) already shows the new truth.
- **Confirm dialogs name the concrete consequence**, sourced from the booking's own policy
  snapshot — on-time: "Free cancellation — {n} days before check-in."; online inside the
  window: "Less than {freeCancelDays} days before check-in — this is a late cancellation
  and your payment won't be refunded." The guest decides informed; the system records
  (`lateCancellation`) without moralizing. **Cash inside the window has no dialog at all** —
  the button doesn't render (`BookingSystemDesign.md` §4: the window is closed), and the
  no-action rule below takes over.
- **Withdraw is friction-free** (no reason field, gentle confirm) — it's a non-event by
  design (`BookingSystemDesign.md` §2) and the UX must not dramatize it.
- **No action shown → the page says who to contact instead** (host name + the listing's
  contact surface for day-of issues; support for everything else). Absence of a button is
  never a dead end.

## 5. Notifications — the guest's inbox thread

The transition table is `BookingSystemDesign.md` §8. Guest-side rules on top:

- **Every guest email carries the reservation link** as its primary action. The email is a
  notification; the page is the truth (§0.4). Emails never embed state that can rot —
  "see your reservation" beats restating details that a later transition invalidates.
- Emails go to `guestEmail` on the booking — identical for all three guest shapes (§1).
- No marketing in transactional mail. The newsletter is a separate, opted-in stream.

## 6. The guest area — `/guest/**` (account holders)

The signed-in convenience layer over the same bookings (§1). Sidebar: Dashboard,
My bookings, Saved; secondary: Browse stays, Become a host / Switch to hosting (+ Admin
Page for admins).

| Page                 | Job (one question)              | Content                                                                                                                                                                            |
| -------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/guest/dashboard`   | "What's my travel situation?"   | Next trip card (countdown, address, host), pending requests strip, recent stays, shortcuts. Empty state = friendly push to browse — a new guest's dashboard sells the search page. |
| `/guest/my-bookings` | "All my trips, past and future" | Status-filterable list, every row → its reservation page. Actions inline via the same shared guards (§4) — the list is a launcher, the reservation page is the actor.              |
| `/guest/favorites`   | "Places I'm considering"        | Resolves the saved ids (below) to listing cards; unpublished ones drop out silently at resolve time (a saved listing that got suspended simply isn't shown — never an error).      |

### Favorites — account-synced, with the anonymous path intact (revised 2026-08-09)

The deferred upgrade below was taken: favorites are a `favorites` table (`userId` +
`apartmentId`, nothing else), and they follow the guest across devices.

What did NOT change is the reason favorites were local in the first place — saving must
work **before** you have an account. So there are two backings behind one API:

| Visitor    | Backing                           | Notes                                                  |
| ---------- | --------------------------------- | ------------------------------------------------------ |
| Signed out | `localStorage`, exactly as before | No account requirement, no query, no row.              |
| Signed in  | `favorites` table                 | ONE live id feed in the layout feeds `favoritesClass`. |

Rules that make it cheap and honest:

- **One id feed, not one query per card.** `fetchMyFavoriteIdsSafe` returns ids only and is a
  live subscription in the root layout; every heart reads the shared reactive set. A search page
  with 30 cards costs zero further queries. Writes stay authoritative without asking again: an
  optimistic `toggleFavorite` settles on the mutation's answer, and the feed UNIONS into the
  class, so neither path clobbers the other (`GeneralSystemDesignRule.md` § seeing your own
  writes). `getCurrentUser` and this feed are the layout's two live channels. Accepted
  consequence: a removal on another device reflects on the next load — a union never un-sets an
  id — the same trade `/guest/favorites` already makes.
- **The read is the cap.** It `.take(FAVORITES_DATA.MAX_PER_USER)`, so the hot-path payload
  is bounded no matter how many rows a user accumulates — `toggleFavorite` deliberately does
  NOT count the set first (that would be a 200-row read per heart click).
- **Writes are optimistic.** The heart flips immediately and `toggle()` returns that state
  synchronously; the mutation settles behind it and its return value is applied as the truth
  (including `saved: false` on a save — how a listing deleted under the card reports itself).
  A failed call undoes the flip.
- **Signing in merges the device's saves** (`mergeFavorites`, bounded to
  `FAVORITES_DATA.MAX_MERGE`), then clears `localStorage` so it can't be re-merged into a
  different account later. Same shape as `claimMyBookings` for anonymous bookings.
- **Cascades:** deleting a listing removes its favorite rows in the same transaction, and
  deleting a user removes theirs.

## 7. Data-loading verdicts (per `GeneralSystemDesignRule.md` — decided here)

| Surface                    | Verdict                        | Justification                                                                                                                                                                            |
| -------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Booking form (`/book`)     | **Subscription**               | Already decided — `BookingSystemDesign.md` §9. Live read keyed on the slug; availability truth is still the mutation's re-check.                                                         |
| `/reservations/[id]`       | **Subscription**               | Already decided — `BookingSystemDesign.md` §9. The waiting page.                                                                                                                         |
| `/reservations` (recovery) | No load — it's a form          | Resolves on submit; nothing to fetch first.                                                                                                                                              |
| `/guest/dashboard`         | **Subscription**               | One composed page query (`fetchGuestDashboardPageSafe`), status-sliced via `by_guest_status_checkin` — never a whole-history scan. Live so a cron status flip reflects without a reload. |
| `/guest/my-bookings`       | **Subscription** via DataTable | A live, paged view of the guest's own bookings — pager controls visible (rule §3 — never page 1 as the full set).                                                                        |
| `/guest/favorites`         | **Subscription**               | Saved ids are a live feed in the layout → one whole-set resolve query on it, bounded by `FAVORITES_DATA.MAX_PER_USER`; a removed favorite drops off live.                                |

Guest surfaces never lift fetches into the layout (rule: fetch where used), with ONE stated
exception besides auth/session: the saved-listing id set (§6). It is lifted precisely because
it is not "used" in one place — a heart can mount 30 times on one page, and "fetch where used"
would mean 30 reads for one boolean each. One id-only feed replaces all of them, and it is a
live subscription — the layout keeps exactly two: `getCurrentUser` and the saved-ids feed.

## 8. Cross-document consistency map

What this document consumes, so a change THERE is checked HERE:

| Consumed decision                                | Source                                | Guest-side dependency                                                    |
| ------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------ |
| Eight statuses, five terminal, windows & refunds | `BookingSystemDesign.md` §2, §4       | §3 status table, §4 dialogs — a ninth status breaks §3's "no gaps" claim |
| Shared pure guards (I5)                          | `BookingSystemDesign.md` §2           | §4 button rendering                                                      |
| `published` = only bookable status (A1)          | `AccommodationsSystemDesign.md` §1    | §2 create-time rejection, §6 favorites drop-out                          |
| Price composition + `platformFee` visibility     | `AccommodationsSystemDesign.md` §5/§8 | §2 quote panel line items                                                |
| Payment states & guest vocabulary                | `BookingSystemDesign.md` §5           | §3 payment line                                                          |
| Email transition table                           | `BookingSystemDesign.md` §8           | §5 (this doc adds the always-link rule only)                             |
| Admin support lookup by code/email               | `AdminPagesSystemDesign.md` §3        | §3 recovery page failure path ("contact us" → admin finds it)            |

## 9. Defined behaviors (the no-surprises ledger)

| Situation                                                       | Defined behavior                                                                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Anonymous guest signs up later with the booking's email         | Bookings appear in `/guest/**` after verified-email claim (§1). Unverified → nothing.                                                 |
| Two people share one email history (family address)             | Whoever verifies the email owns the claim — email ownership IS the identity model, accepted plainly.                                  |
| Reservation link forwarded/leaked                               | Holder sees the minimal projection and can act as the guest (§1 capability semantics). Deliberate.                                    |
| Guest loses the email/link                                      | Self-serve recovery by code+email (§3); failing that, support resolves via admin lookup.                                              |
| Guest books the same dates twice (double-click, back-button)    | In-flight disable + server duplicate-request guard (§2). Second submit returns the existing request.                                  |
| Listing suspended/expired while guest is mid-form               | `createBooking` rejects (A1); form surfaces "no longer available" — never a half-created booking.                                     |
| Listing edited (price) while guest browses                      | Quote at submit time is authoritative; the mutation reprices server-side (§2).                                                        |
| Booking's listing later deleted                                 | Reservation page renders from booking-stored data, listing link dead (`AccommodationsSystemDesign.md` §4).                            |
| Status flips while guest stares at the reservation page         | Live page (§3) — the whole reason it's a subscription.                                                                                |
| Host tries to cancel an online booking inside 7 days            | Impossible — the paid stay is ironclad (`BookingSystemDesign.md` §4); only the guest or the admin brake can end it.                   |
| Guest cancels on the free/late boundary day                     | The booking's policy **snapshot** decides, computed in the property timezone — never live config (`BookingSystemDesign.md` §0.3, §3). |
| Signed-in guest books with a DIFFERENT email than their account | `guestId` stamps anyway (they were signed in); the email on the booking gets the notifications. Both views work.                      |
| Favorites on a new device                                       | Present once signed in (§6). Empty only while signed out — that device's hearts are local until the next sign-in merges them.         |
| Saved listing becomes unavailable                               | Drops out of the favorites resolve silently (§6).                                                                                     |
| Guest with zero bookings opens `/guest/**`                      | Designed empty states that route to search — never a blank table.                                                                     |

## 10. Considered and rejected (or deferred)

- **Requiring accounts to book** — rejected permanently (§0.1). The conversion cost is
  real and the capability model makes accounts genuinely optional, not nagged-optional.
- **Magic-link / OTP "claim this booking into an account" from the reservation page** —
  deferred. The email-verified claim (§1) covers the real case; an in-page upsell is
  growth machinery to add when account value (sync, history) is proven, not before.
- **In-app guest↔host messaging** — rejected for now. Email + phone (shown post-confirm)
  is the channel both sides already use; a message center is an inbox to moderate and a
  realtime cost (`GeneralSystemDesignRule.md` § cost model) for a duplicate of it.
- ~~**Backend-synced favorites**~~ — shipped 2026-08-09 (§6).
- **Reviews & ratings** — deferred; sits with the reputation cluster
  (`BookingSystemDesign.md` §11), entering guest UX only when that exists.
- **Trip extras (itineraries, multi-listing carts, group booking)** — rejected; this is a
  single-stay platform and every one of these is a second product.
- **Guest-side booking alterations UI** — nothing to build: alterations are rejected at
  the system level (`BookingSystemDesign.md` §11); the guest path is cancel-and-rebook and
  the UX honestly says so in the cancel dialog when the window is free.

## 11. Delta from the current implementation

1. **`claimMyBookings` mutation** (§1) + its fire-and-forget hook in the auth flow. Today
   an anonymous booking never joins a later account.
2. **`/reservations` recovery page** (§3) — the route exists as an empty file; build the
   code+email form → redirect. Rate-limit the resolve.
3. **`createBooking` duplicate-request guard** (§2/§9) — reject same listing+dates+email
   open `pending`; return the existing reservation link in the response.
4. **Reservation page: cover all eight statuses** (§3) — audit current copy against the
   table (the `withdrawn` status is new with the booking re-implementation; `expired`
   listings affect the "Book again" link).
5. **Cancel dialog consequence copy from the policy snapshot** (§4) — lands with
   `BookingSystemDesign.md` §12.3's window change; ship together.
6. **My-bookings inline actions through shared guards** (§4) — verify no inline `{#if}`
   duplicates a guard; wire the same components the reservation page uses.
7. Nothing changes for: guest dashboard query shape,
   capability access model, sidebar structure.

Order: 3 (server guard, standalone) → 1 (claim) → 2 (recovery page) → 4–6 (ship with the
booking-system re-implementation pass, same PR window). Each independently shippable.

## § FOR LLMs / AI ASSISTANTS — READ BEFORE TOUCHING GUEST-FACING CODE

1. **Never gate booking behind an account.** If a flow you're building wants `ctx.userId`
   to create or view a booking, the design is being violated — capability first (§0.2).
2. **One page per booking.** New guest surfaces link to `/reservations/[id]`; they do not
   re-render booking detail elsewhere. Lists launch; the reservation page acts.
3. **Buttons come from the shared guards** (`guestMayPerform`), never from inline status
   checks — and consequence copy comes from the booking's policy snapshot, never live
   config (§4).
4. **Keep the public projection minimal** (§1). Adding a field to `fetchBookingById`'s
   return is a privacy decision — name it in the PR, don't slip it in for UI convenience.
5. **Status coverage is closed**: every guest display must handle all eight statuses (§3
   table). A new status upstream (there shouldn't be one — `BookingSystemDesign.md` §7)
   fails loudly here, by design.
6. **Data loading per §7** — guest surfaces subscribe in their own components (booking form,
   dashboard, my-bookings, favorites, the reservation page). The saved-listing id set (§6) is
   the ONE layout-level feed beside `getCurrentUser`, lifted so 30 hearts cost zero extra
   reads. Do not add live channels without the general rule's written justification.
7. **Favorites have two backings, one API** (§6). Read `favoritesClass.ids` /
   `isFavorite()` and call `toggle()` — never query the `favorites` table from a component,
   and never assume a signed-out visitor has no favorites.
