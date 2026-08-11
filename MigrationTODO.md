# Migration TODO — Production data → current schema

Careful, step-by-step plan to move the production Convex snapshot (`database/`) into the
current app's schema **without breaking production**. Read all of §0–§5 before touching a
deployment.

---

## §0 Ground truth — what the export actually is

The snapshot was taken from the **older** production deployment. The current schema has
since diverged. Verified facts from the export (run `node database/migration-audit.cjs` to
re-confirm; expected values below):

| Table (production) | Rows | Migrate? | Where it goes |
|---|---|---|---|
| `users` | 254 (250 `user`, **4 `admin`**) | ✅ | betterAuth component → `user` table |
| `authAccounts` | 203 (all Google) | ✅ | betterAuth component → `account` table |
| `apartments` | 178 (177 `published`, 1 `archived`) | ✅ | main → `apartments` |
| `bookings` | 186 (37 `confirmed`, 149 `cancelled`) | ✅ | main → `bookings` |
| `blockedDates` | 71 → **29 manual expand to 59** | ⚠️ | main → `apartmentBlocks` |
| `newsletter` | 48 (0 dupes) | ✅ | main → `newsletter` |
| `auditLogs` | 0 | ❌ nothing to move | — |
| `storageUrlCache` | 2340 | ❌ ephemeral cache, not in schema | — |
| `authSessions` | 418 | ❌ | sessions die when `AUTH_SECRET` rotates |
| `authRefreshTokens` | 3173 | ❌ | same reason |
| `authVerifiers` / `authVerificationCodes` / `authRateLimits` | 211 / 0 / 0 | ❌ | ephemeral auth state |
| `_components/crons`, `_components/rateLimiter`, `_components/resend` | — | ❌ | version-sensitive component internals; re-provisioned fresh |

**Referential integrity (verified, 0 gaps):** every `apartments.hostId`, `bookings.hostId`,
`bookings.apartmentId`, `blockedDates.apartmentId`, `authAccounts.userId` resolves to an
exported parent row. **One exception:** `bookings.guestId` on a single booking points at a
user that no longer exists → set it to `null` during transform (the booking still has
`guestEmail`).

**Coverage (verified):** every apartment has coordinates and 5–46 images
(2,162 unique image `storageId`s). `newsletter` has no duplicate emails.

### What changes between old and new (the crux)

1. **Auth moved into a better-auth Convex component.** Old: `users` + `auth*` tables in the
   main namespace. New: `user` / `account` / `session` tables live inside the `betterAuth`
   component. `apartments.hostId`, `bookings.hostId`, `bookings.guestId` are **plain
   strings** equal to the user `_id` — they keep working **only if** the migrated component
   user rows keep their old `_id`s (see §4 Risk A).
2. **Images moved from Convex file storage to Cloudflare R2.** Old `images[]` =
   `{order, storageId}` into Convex storage. New `apartmentImage` = `{key, url, order}`
   pointing at R2. The snapshot does **not** contain the actual blobs (§2).
3. **`blockedDates` → `apartmentBlocks`.** The 42 booking-derived rows (`reason:"Booked"`)
   are **dropped**: 37 are backed by `confirmed` bookings (which already block availability in
   the new design) and **5 are orphaned** — their bookings no longer exist in the export, so
   keeping the blocks would wrongly close nights forever. The 29 manual blocks migrate but
   **must be expanded** — see §5.5 for the endDate-convention trap.
4. **Enums tightened / renamed.** `bookings.paymentStatus` is `"pending"` in every old row
   but the new enum has no `pending` → maps to `"on_arrival"` (correct terminal state for
   cash). All `status` / `type` / `paymentMethod` values already match.
5. **New required fields** with no old equivalent: `bookings.platformFee` (→ `0`),
   `bookings.apartmentSlug` (→ derive from the apartment), `bookings.policy` (→ snapshot
   `BOOKING_POLICY`), `users.emailVerified` / `createdAt` / `updatedAt`.
6. **Legacy fields dropped** (no column in the new schema, no reader): `users.discountUsages`,
   `apartments.monthlyDiscount` (40 rows), `apartments.beds`, `apartments.postalCode` (95),
   `apartments.coverImageIndex`, `apartments.country` (none), `bookings.pricePerNight` (32),
   `images[].thumbnailStorageId`.

---

## §1 Lock these decisions first

Do not start until each line has a yes/no (defaults marked **→ recommended**):

- [ ] **`monthlyDiscount`** (40 listings): **→ drop** (no pricing code supports it; the 7+
  `weeklyDiscount` is kept and maps directly). If you want to keep monthly rates, that's a
  schema + pricing change — do it *before* the migration, not during.
- [ ] **`apartments.paymentMethod`**: **→ `'cash'`** for every migrated listing (faithful:
  all 186 historical bookings were cash). Alternative: leave `undefined` (schema-valid, but
  guests get no online option until hosts set it).
- [ ] **Monetization for migrated listings**: **→ run `backfillListingMonetization`
  post-import** (gives every listing `monetization: 'listing_fee'` + a fresh 3-month
  period). This is the sanctioned backfill and prevents the listing-fee cron from ever
  touching them. Without it, listings sit `unpaid` (safe, but hosts see no plan).
- [ ] **`addressNumber`**: old rows store the full address in `address` (incl. number). **→
  leave `addressNumber` unset**; the UI renders `address` as-is.
- [ ] **Past confirmed bookings**: the hourly lifecycle cron will auto-transition any
  `confirmed` booking whose `checkInDate` has passed → `checked_in` → `checked_out`. That is
  correct behavior for history. **→ accept** (or pause crons during the window; note past
  stays may still receive check-in/out emails).
- [ ] **`countryPlaceId`** is absent on all old rows → country searches won't match migrated
  listings. City search works (`cityPlaceId` is preserved). **→ accept** for now.
- [ ] **AUTH_SECRET**: we are **not** migrating sessions/refresh tokens, so every user
  re-logs-in. Changing the secret is safe. Keep the same Google OAuth client ids.

---

## §2 Prerequisites (do before importing anything)

- [x] **R2 objects for the image `storageId`s.** **DONE for the dev run — 2,340/2,340
  public URLs verified 200.** The snapshot has no blobs, but they were pulled live from the
  old deployment's Convex storage (read-only `ctx.storage.getUrl` → GET) and PUT to the R2
  bucket **keyed by their old `storageId`**, then **re-keyed into per-accommodation
  folders**: every apartment-owned blob moved to `<apartmentId>/<storageId>` (an S3
  CopyObject+DeleteObject — byte-identical, content-type preserved), so
  `apartmentImage = { key: ${_id}/${storageId}, url: ${R2_PUBLIC_BASE_URL}/${_id}/${storageId},
  order }`. `_id` is preserved through `convex import`, so the folder name equals the
  apartment's real id. The 178 cache-only ids (avatars / orphaned listing images) have no
  apartment and stay flat at the bucket root. Nothing in prod was written or deleted.
  Run the same tooling against a NEW target (dev already done):
  ```
  node database/_list-storage.cjs                 # rebuild database/_storage-ids.txt
  node database/r2-tools/_download-blobs.cjs      # mint signed URLs (read-only) + download → r2-staging/
  node database/r2-tools/_upload-r2.cjs           # S3 PUT each blob keyed by storageId
  node database/r2-tools/_rekey-r2.cjs            # move each apartment blob → <apartmentId>/<storageId>
  node database/r2-tools/_rekey-transformed.cjs   # folder-prefix transformed/*.jsonl keys/urls
  node database/r2-tools/_verify-folder.cjs       # HEAD every folder URL → OK 2162/2162
  node database/r2-tools/_verify-r2.cjs           # HEAD every flat URL (ownerless only now) → 200
  ```
  (tools in `database/` + `database/r2-tools/`, AWS SDK installed there; creds read from
  `.env.local`). ⚠️ If this isn't done for a NEW target, migrated listings render **broken
  images**. There is no fallback: the new `apartmentImage` schema has no `storageId`.
- [ ] **Convex CLI** (`npx convex`) with access to both deployments. Verify
  `npx convex import --help` shows `--component` (needed for the auth tables).
- [ ] **Staging deployment** that mirrors production config (same env vars, same
  `AUTH_SECRET` decision, same R2 bucket) for the dry-run in §6 step 0.
- [ ] **New deployment exported** (`npx convex export`) BEFORE step 1 — your restore point.
- [ ] `R2_PUBLIC_BASE_URL` set on the target deployment (apartments import writes `url`s
  from it — actually done in the transform script, so the script needs it as an env var).
- [ ] Confirm the target deployment already has the **current schema deployed** (all tables
  in §0's "where it goes" column must exist before `convex import`).

---

## §3 Migration order (referential integrity)

Import in exactly this order — each step's foreign keys must already exist:

1. **users → component `user`** (the 4 admins ride along — do not lose `role: 'admin'`).
2. **authAccounts → component `account`** (links Google sign-in to the same user rows).
3. **apartments → main `apartments`** (`hostId` → user, `images` → R2).
4. **uploadedFilesR2 rows** (one per image key) — keeps the orphan cron from deleting the
   just-migrated R2 objects (see §4 Risk B).
5. **bookings → main `bookings`** (`apartmentId` → apartment, `apartmentSlug` derived).
6. **blockedDates (manual only) → `apartmentBlocks`** (expanded to single-night rows, §5.5).
7. **newsletter → `newsletter`**.
8. **Post-import backfills**: `clearCounter`+`backfillCounters` for `apartments`/`bookings`
   FIRST, then `backfillListingMonetization` (see §5.8 — order matters).

`reports`, `favorites`, `bookingEarnings`, `hostPayoutAccounts`, `auditLogs` start empty by
design.

---

## §4 The two risks — verify before mass-importing

### Risk A — do preserved user `_id`s survive the component import?

`apartments.hostId` / `bookings.hostId` / `guestId` are strings equal to old `users._id`s
(`k17…`). Everything downstream (`getAnyUserById`, host dashboards, ownership) depends on
those strings matching the new component `user` rows.

`convex import` preserves `_id`/`_creationTime` when present — **but the target here is a
component table named `user` (singular), not the old main `users`.** Confirm the imported
rows keep their `k17…` ids.

**Verify (staging, before step 1 on prod):**
```bash
npx convex import --deployment <staging> --component betterAuth user database/transformed/user.jsonl
# then query: does user _id === "k17006fewqhfx28984zsp7h8yn83p9bt" still exist?
bunx convex run --deployment <staging> tables/users/userQueries:listUsersPaginated --json  # or any user query
```
If ids are preserved → proceed. If the component rejects preserved ids (error) or rewrites
them → **fallback**: import users without `_id`, then run a **remap script** that (a) reads
old `users` and new `user` rows keyed by email, (b) rewrites `apartments.hostId`,
`bookings.hostId`, `bookings.guestId` to the new ids. Do this remap **before** step 3/5.

### Risk B — orphan cron deletes migrated R2 images

The R2 `onSyncMetadata`/orphan sweep deletes any R2 object with **no `uploadedFilesR2`
row**. Right after apartments import, the image objects have rows only if we add them.
Create one `uploadedFilesR2` row per image key **before** the cron next runs:
`{ ownerId: apartment.hostId, key: storageId, url: r2PublicUrl(storageId) }` (2,162 rows).

---

## §5 Field transforms (exact)

Write these as a `node database/transform-migration.mjs` producing `database/transformed/*.jsonl`.
Rules: **drop every field not listed** (the new schema validates strictly), preserve
`_id` and `_creationTime` everywhere, add required fields.

### 5.1 users → component `user`
```
emailVerified: true          (all Google; old rows lack it)
createdAt / updatedAt: _creationTime
role: role                   (preserve 'admin'!)
isSuperhost: false
name, email, image: keep
discountUsages: DROP
```

### 5.2 authAccounts → component `account`
```
accountId: providerAccountId
providerId: provider         ('google')
userId: userId               (must equal a migrated user _id)
createdAt / updatedAt: _creationTime
(no accessToken/refreshToken — better-auth refills on next Google login)
```

### 5.3 apartments → apartments
Keep as-is: `hostId, title, slug, description, type, address, city, cityPlaceId,
coordinates, bedrooms, bathrooms, maxGuests, squareMeters, pricePerNight, cleaningFee,
weekendPremium, weeklyDiscount, currency, instantBooking, sameDayReservation,
singleDayReservation, petsAllowed, smokingAllowed, partiesAllowed, minReservationDays,
checkInTime, checkOutTime, quietHoursStart?, quietHoursEnd?, amenities, houseRules?,
status, isFeatured, updatedAt, paymentOrderId?`
```
addressNumber: omit          (old address is the full string)
country / placeId / countryPlaceId / timeZone / maxReservationDays: omit
discountAmount: omit          (no old rows have it → no crossed-out prices after migration)
paymentMethod: 'cash'         (decision §1)
monthlyDiscount, beds, postalCode, coverImageIndex: DROP
images: reorder so images[coverImageIndex] is FIRST, then map each
        { order: <new index>, key: `${_id}/${storageId}`,
          url: `${R2_PUBLIC_BASE_URL}/${_id}/${storageId}` }   (alt omitted; folder = apartment `_id`, see §2)
monetization / paidAt / paymentAmount / apartmentSubscriptionExpiryDate / feeReminderSentAt: omit
        (run backfillListingMonetization in §5.8 instead)
moderatedAt / moderatedBy / moderationReason / expiredReason: omit
```

### 5.4 bookings → bookings
Keep as-is: `bookingCode, apartmentId, hostId, guestId?, guestFirstName, guestLastName,
guestEmail, guestPhone, specialRequests?, checkInDate, checkOutDate, numberOfAdults,
numberOfChildren, numberOfNights, subtotal, cleaningFee, total, currency, status,
cancelledAt?, cancelledBy?, cancelReason?, updatedAt`
```
apartmentSlug: REQUIRED — derive from the apartment row (lookup by apartmentId → slug)
platformFee: 0
policy: { freeCancelDays: 7, hostResponseHours: 48 }     (BOOKING_POLICY values)
paymentStatus: 'on_arrival'   (was 'pending' in every row)
guestId: set to null on the ONE row pointing at a missing user
pricePerNight: DROP
paymentRef / paymentDeadlineAt / paymentFlag / pendingExpiresAt / lateCancellation /
archivedAt / stayConfirmationRequestedAt / stayConfirmedAt: omit
```

### 5.5 blockedDates → apartmentBlocks
```
DROP all 42 rows WITH bookingId (37 booking-backed + 5 orphaned — see §0).

The 29 manual rows (no bookingId) → EXPAND into one apartmentBlocks row per night.

⚠️ endDate convention trap (verified in the audit): the old data has TWO conventions.
  - Booking-derived rows: endDate EXCLUSIVE (endDate === booking.checkOutDate). Dropped anyway.
  - Manual rows: endDate INCLUSIVE of the last night — a single night is stored as [X, X].
The current apartmentBlocks schema stores ONE row per night with exclusive endDate and its
availability read keys on startDate only, so importing manual rows verbatim would silently
lose the last night of every multi-night block. Expand each manual [startDate, endDate]
(inclusive) into one row per night d: { apartmentId, startDate: d, endDate: addOneDay(d) }.

Result: 29 rows → 59 single-night apartmentBlocks rows.
```

### 5.6 newsletter → newsletter
```
Keep: email (+ _id, _creationTime — _creationTime is the subscribe timestamp)
subscribedAt: DROP
```

### 5.7 uploadedFilesR2 (image keep-alive)
```
One row per image key: { ownerId: apartment.hostId, key: `${_id}/${storageId}`, url: r2PublicUrl(`${_id}/${storageId}`) }
```

### 5.8 Post-import backfills

⚠️ **ORDER MATTERS — learned on the dev dry-run.** `convex import` writes bypass the
aggregate-counter triggers, so the counter trees are empty/stale right after import. ANY app
write to a managed table through the wrapped `ctx.db` (a patch, a cron) then fires the
aggregate hook, which tries to move a missing tree key and throws `DELETE_MISSING_KEY` —
e.g. `backfillListingMonetization` crashed on the first patch until the counters were rebuilt.
So: **rebuild the counter trees FIRST, then run anything that writes to `apartments` /
`bookings`** (including `backfillListingMonetization` and the booking-lifecycle cron).

```bash
# 1) Wipe then rebuild the aggregate counter trees from imported rows.
#    clearCounter first: a dev deployment may hold a stale tree from before the wipe, and a
#    backfill onto a resurrected tree would count everything twice.
bunx convex run functions:clearCounter "{counter:'apartments'}"
bunx convex run functions:backfillCounters "{counter:'apartments'}"
bunx convex run functions:clearCounter "{counter:'bookings'}"
bunx convex run functions:backfillCounters "{counter:'bookings'}"
# (reports / hostEarnings start empty — only needed if the dev tree held stale rows:
#  clearCounter + backfillCounters are still safe no-ops when empty)

# 2) ONLY now: give every listing a monetization choice + fresh 3-month period.
bunx convex run tables/accommodations/crons/listingFeeSweepCron:backfillListingMonetization
```

---

## §6 Execution steps

**Step 0 — dry-run on staging.** Repeat §1–§5 on the staging deployment first. Run every
check in §7 against staging. Only when staging is clean, do prod.

**Step 1 — transform.** `node database/transform-migration.mjs` (reads
`database/*/documents.jsonl`, writes `database/transformed/*.jsonl`). Validate output:
exactly 254 user, 203 account, 178 apartments, 186 bookings, 59 apartmentBlocks, 48
newsletter, 2,162 uploadedFilesR2. No source field left behind (diff keys per row against
§5 lists).

**Step 2 — users.**
```bash
npx convex import --deployment <target> --component betterAuth user database/transformed/user.jsonl
```
Verify Risk A (ids preserved) immediately.

**Step 3 — accounts.**
```bash
npx convex import --deployment <target> --component betterAuth account database/transformed/account.jsonl
```

**Step 4 — apartments.**
```bash
npx convex import --deployment <target> apartments database/transformed/apartments.jsonl
```
Verify images resolve (`image.url` reachable), `hostId` resolves to a user.

**Step 5 — uploadedFilesR2 rows.**
```bash
npx convex import --deployment <target> uploadedFilesR2 database/transformed/uploadedFilesR2.jsonl
```

**Step 6 — bookings.** `npx convex import --deployment <target> bookings database/transformed/bookings.jsonl`

**Step 7 — apartmentBlocks.** `npx convex import --deployment <target> apartmentBlocks database/transformed/apartmentBlocks.jsonl`

**Step 8 — newsletter.** `npx convex import --deployment <target> newsletter database/transformed/newsletter.jsonl`

**Step 9 — backfills** (§5.8), then **Step 10 — full §7 verification.**

---

## §7 Verification checklist (all of it, on prod, before declaring done)

Counts (query each table, compare to §0):
- [ ] `users` 254, `accounts` 203 (component), `apartments` 178, `bookings` 186,
      `apartmentBlocks` 59, `newsletter` 48.
- [ ] 4 users have `role === 'admin'`; each admin's Google account exists in `account`.
- [ ] A random sample: `apartments.hostId` → `getAnyUserById` returns a real user;
      `bookings.apartmentId` → real apartment; `bookings.apartmentSlug` matches it.
- [ ] Block expansion spot-check: a manual `[start, end]` range from §5.5 became a row per
      night (`endDate === startDate + 1`), and its last night is present.
- [ ] City search returns known listings (e.g. a Belgrade listing). Country search returns
      nothing (expected — no `countryPlaceId`).
- [ ] A published listing's `images[0].url` loads in the browser.
- [ ] **24h after the cron runs**: 0 `published` listings flipped to `expired` by the
      listing-fee sweep (should be inert post-backfill). Past `confirmed` bookings
      auto-transitioned to `checked_out` (expected).
- [ ] Login as a migrated Google user → lands on the same account; host dashboard shows the
      host's listings. Login as an admin → admin panel loads.
- [ ] `backfillCounters` counts match raw rows (admin dashboard numbers sane).

---

## §8 Rollback

- The target deployment was exported in §2 (restore point). Re-importing is additive and
  idempotent **only if** you skip rows whose `_id` already exists — otherwise `convex
  import` errors on duplicates. If you must re-run, wipe the migrated tables first or use a
  fresh deployment.
- The old production deployment is untouched until you decide to retire it — it remains the
  source of truth throughout.
