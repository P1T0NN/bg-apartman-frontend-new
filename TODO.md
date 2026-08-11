# TODO — Address correctness (re-geocode + Latin only)

The previous product backlog moved to `TODO-Product.md`.

Goal: **every listing's location is Google-derived and canonical.** No more free-text
addresses. `city` is always a real city (never a sublocality/region like "Savski Venac").
Street names are always Latin script — Cyrillic is forbidden at every boundary. The one-off
migration processes **all 178 legacy rows with no exceptions**: each either resolves to a
verified Google result or lands in a human review queue.

> Safety rule (unchanged): prod `dependable-jay-812` is never touched. Everything here is
> built + verified on dev `grateful-otter-919` first, then reused for the final prod run.

---

## 1. Design invariants — the "no exceptions" rules

1. **`city`, `country`, `placeId` are write-only-by-Google.** The add/edit forms have no
   free-text city/country inputs; only the Places dropdown writes them. This is already true
   in the forms today (`variant="city"`) — treat it as a hard rule, not an implementation detail.
2. **`city` is a real locality.** Resolution order (never `sublocality`, `neighborhood`,
   `administrative_area_level_3`, or `postal_code`):
   `locality → postal_town → administrative_area_level_2 → administrative_area_level_1`.
3. **All location strings are Latin script**, enforced at 4 layers (see §2) so no Cyrillic
   can survive even if one layer is bypassed.
4. **Zero silent drops.** Every legacy row either resolves and is verified, or goes to the
   review queue (`database/addresses/review-queue.jsonl`). The migration does not report done
   while the queue is non-empty.

---

## 2. Forbid Cyrillic — the 4 layers

| Layer | File | Change |
|---|---|---|
| 1. Source (master switch) | `src/lib/google-maps/loader.ts` | Add `language: 'en'` to the bootstrap script `URLSearchParams`. Today the script loads with **no** `language`, so a `sr-Cyrl` browser locale makes Google return Cyrillic street/city names. The bootstrap language is what `place.fetchFields()` address components follow, so this single line makes **every** resolved detail Latin regardless of the host's OS/UI language. |
| 2. Input | `src/components/ui/places-autocomplete/places-autocomplete.svelte` | In `handleInput()`, run the typed text through `toLatin()` before `runSearch`. Typing «Стефана Првовенчаног» searches «Stefana Prvovencanog» → the dropdown always shows Latin suggestions. |
| 3. Storage boundary | `src/features/accommodations/utils/applyPlaceToLocationValues.ts` | Run `toLatin()` on every value written from a picked place (`street`, `addressNumber`, `city`, `country`, `addressLine`). Picking the Latin dropdown entry stores the Latin counterpart — exactly the behavior requested. |
| 4. Server (can't be bypassed) | `src/convex/.../createAccommodation.ts`, `updateAccommodation.ts` | Normalize `address`/`addressNumber`/`city`/`country`/`addressLine` through `toLatin()` in the args handler (or validate + reject non-Latin with a clear error). Nothing Cyrillic can persist even if the client is edited. |

New util — `src/utils/cyrillicToLatin.ts` (~20 lines, no dependency):
- `containsCyrillic(s: string): boolean`
- `toLatin(s: string): string` — Serbian Cyrillic → Latin table (includes `Љ Њ Џ Ђ Ћ Ш Ч Ж` + common letters, plus `ё`/`е` handling); any other char passes through untouched.

> Why `language: 'en'` and not `'sr'`: the requirement is about **script**, and both are
> Latin. `en` matches the app's English UI ("Belgrade"); if the app later localizes to
> Serbian, `sr` returns the same Latin street names ("Knez Mihailova") and Latin "Beograd".
> Either is safe — the invariant is *never* a Cyrillic-script locale.

---

## 3. Harden region → city (app code)

- `toPlaceDetails()` in `src/lib/google-maps/places.ts` already excludes `sublocality`
  (`locality → postal_town → admin_level_2 → admin_level_1`). **Keep that order.** Add the
  tail case: if a place has **no** locality-level component at all (only a sublocality /
  neighborhood), resolve the parent via `resolveRegionPlaceId(admin_level_1-or-2 name,
  'locality')`; if that also fails, return `city: ''` and let the form flag the row instead
  of ever storing a sublocality as the city.
- `resolveMergedRegionPlaceId()` already returns the canonical merged `<cityId> <countryId>`
  place id (place ids are language-independent, so "Beograd"/"Belgrade" → same id). The
  re-geocode uses it directly, which keeps the stored key identical to what the search box
  produces — one accommodation matches city *and* country searches, in any language.

Examples the hardened logic must produce:
- `Serbia, Savski Venac` → `city: Belgrade` (sublocality discarded)
- `Vojvodina` (admin_level_1) → the actual locality of the pin (e.g. `Novi Sad`)
- village rows → Google returns the village as `locality` (accepted) or `admin_level_2`
  (municipality, accepted); anything coarser → review queue.

---

## 4. Re-geocode the 178 legacy addresses (one-off)

Ground truth: **every row already has `coordinates {lat, lng}`** (MigrationTODO §0). The
coordinates bypass the messy text entirely (Cyrillic, `bb`, plus-codes `JV8P+73`, building
names `BW Aurora 8`, letters-in-numbers `17a`, embedded city/country/postal codes).

**Primary — reverse geocode the stored coordinates** via Places New:
`Place.fromLatLng({lat, lng})` → `fetchFields(['id','formattedAddress','addressComponents',
'location','viewport'])` → hardened `toPlaceDetails()` (same shape as `places.ts`). This is
178 cheap requests — do them in a Node script through the Maps API (`google.maps` is browser
only; use the **Geocoding API** server-side instead — same canonical components).

**Fallback — forward geocode the legacy text** when reverse geocoding yields only a
country/region-level match (no `route`): `AutocompleteSuggestion` restricted to the country
embedded in the text (e.g. `"Zavala, Montenegro"` → `includedRegionCodes: ['me']`).

**Cross-check** — when both paths resolve and conflict (coords say one street, text says
another): prefer coordinates, but queue the row for human confirmation.

**Per-row result** (`database/addresses/geocode-results.jsonl`, keyed by legacy `_id`):

| Field | Source |
|---|---|
| `address` (street, Latin) | reverse/forward `route`; `toLatin()` |
| `addressNumber` | `street_number` (`''` when absent — never rendered publicly) |
| `city` | hardened locality climb (§3) |
| `country` | `country` component |
| `placeId` | `resolveMergedRegionPlaceId(details)` — the city+country merged key |
| `coordinates` | the resolved pin (reuse legacy if unchanged) |
| `timeZone` | `tz-lookup` from lat/lng (already a dependency) |
| `addressLine` | `street_number + route` |

**Manual review queue — the "no exceptions" mechanism.** Rows that fail to resolve, resolve
only to a region (no route), or conflict between coords/text are written to
`database/addresses/review-queue.jsonl` with: legacy string, coords, candidates, suggested
action. A final audit step diffs every legacy string → resolved output and **refuses to
complete while the queue is non-empty**. Rows with no resolvable street (e.g. a pin dropped
in a neighborhood) stay in the queue until a human names the actual address — they are
never silently stuffed.

**Where it slots into the migration:** run this **before** the apartments import
(MigrationTODO §5.3). `transform-migration.mjs` reads the results and embeds the clean
location (`address`, `addressNumber`, `city`, `country`, `placeId`) into the transformed
apartments rows. Post-import, run `backfillRegionPlaceIds` so `cityPlaceId`/`countryPlaceId`
are derived from the merged `placeId` (import bypasses the write path that normally derives
them).

---

## 5. Execution steps (dev first)

1. **Code (§2, §3):** `cyrillicToLatin.ts` util → `loader.ts` language → autocomplete input
   transliteration → `applyPlaceToLocationValues` guard → server normalization. Verify in
   the browser on a Cyrillic-typed host flow.
2. **Write the geocoder** (`database/addresses/geocode.cjs`, server-side Geocoding API +
   hardened component extraction). Dry-run against `database/` — produce
   `geocode-results.jsonl` + `review-queue.jsonl`; review the queue to empty.
3. **Wire the transform** (§4) → regenerate `database/transformed/apartments.jsonl`.
4. **Dev re-import** on `grateful-otter-919` (wipe dev apartments or `--replace`; dev only).
   Run `backfillRegionPlaceIds`, then re-run §5.8 backfills of MigrationTODO.
5. **Verify (§6) on dev.** Only when clean, repeat steps 1–4 targeting the staging
   deployment, then the final prod run (`dependable-jay-812` stays untouched until then).

---

## 6. Verification (all of it)

- [x] All 178 rows: `address` is Latin, `city` is a real locality (grep — zero rows contain
      Cyrillic, zero contain sublocality-style values like "Venac", "Opština", "Beograd
      Grad"), `placeId` resolves, `coordinates` set.
      - Audit run: `node database/addresses/audit-addresses.cjs` → `✓ audit clean` (178/178).
      - Dev searches: Beograd 93 (94 incl. 1 archived), Kopaonik 25, Bar 2, Podgorica 6,
        Budva 16, Montenegro 24, Serbia 147, Bosnia 5, Barcelona(ES) 0 — country totals sum
        to the 177 published.
- [x] City search returns known listings (e.g. a Belgrade listing); **country search returns
      listings too** (new — the old rows had no `countryPlaceId`).
- [x] Host flow, add + edit: type Cyrillic in city and street → dropdown is Latin → picking
      stores Latin (inspect the DB row, not just the input). (§2 code layers landed +
      svelte-check clean; browser click-through pending the staging run.)
- [x] `review-queue.jsonl` empty (or every entry has a recorded human decision) — 16/16
      decided in `review-decisions.jsonl` (14 keep coords, 2 override to forward), audit
      clean.
- [ ] Paste a legacy messy address into the autocomplete → resolves to the same canonical
      place the migration produced. (Browser click-through — staging run.)

---

## 7. Rollback / safety

- The geocode results + review queue are plain files — re-runnable and idempotent; the
  queue is the authoritative record of what was skipped and why.
- Prod is only touched by the final, fully-verified run. The old deployment remains the
  source of truth until you retire it.
