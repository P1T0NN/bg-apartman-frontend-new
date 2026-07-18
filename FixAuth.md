# FixAuth — Robust Better Auth + Convex session wiring (SvelteKit)

This documents the exact pattern that makes **normal Better Auth** (email/password,
Google, OTP) behave correctly with Convex in SvelteKit: no unauthenticated flash on
first paint, no infinite skeletons when the Convex JWT refreshes, no spurious 401s /
query errors on tab refocus and sign-out.

> Scope: this is **plain Better Auth only**. It does NOT cover the secondary
> guest-JWT auth in this repo (`src/features/guests/**`) — other projects don't have
> that, so ignore it.

There are two separate problems and two separate mechanisms. Keep them straight:

1. **"`/get-session` firing when I switch tabs"** → a Better Auth *client option*.
2. **"Infinite skeletons / query errors when the JWT changes"** → an SSR-seed + query-gating
   pattern, plus the timing guards that live inside `@mmailaender/convex-better-auth-svelte`.

---

## 1. Stop `/get-session` from refetching on tab focus

Better Auth's client refetches `/get-session` every time the tab becomes visible
again (`document.visibilitychange` → `WindowFocusManager`), rate-limited to once per
5s. It's on by default. That refetch is what churns the session atom, which re-runs
`convexClient.setAuth`, which can flash auth state.

It's controlled by `sessionOptions.refetchOnWindowFocus` on **`createAuthClient`**
(type `RevalidateOptions` in `@better-auth/core`):

```ts
// auth-client.ts
export const authClient = createAuthClient({
  plugins: [convexClient() /* , emailOTPClient(), ... */],
  sessionOptions: {
    refetchOnWindowFocus: false, // <-- stop /get-session on tab refocus
    // refetchInterval: 0,        // (default) no polling
    // refetchWhenOffline: false, // (default)
  },
});
```

Set `refetchOnWindowFocus: false` if you want the tab-switch refetch gone entirely.
This is the single knob — there is no other place it's configured.

> Note: even with it left ON (`true`), the pattern in §2/§3 tolerates the refetch
> without flashing, because `fetchAccessToken` waits for the session to *settle*
> before deciding anything (see §4). Turning it off just removes the network churn.

---

## 2. Server: seed auth state and prefetch the user during SSR

The flash-on-first-paint and the "infinite skeleton" both come from the client not
knowing, at hydration time, whether the user is authenticated. Fix it by handing the
answer down from the server.

### `hooks.server.ts` — expose the Convex token to SSR

```ts
import { getToken } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { withServerConvexToken } from '@mmailaender/convex-svelte/sveltekit/server';

const convexAuthHandle: Handle = ({ event, resolve }) => {
  const token = getToken(event.cookies);          // Better Auth cookie -> Convex JWT
  event.locals.token = token;
  return withServerConvexToken(token, () => resolve(event)); // SSR Convex calls are authed
};
```

### `+layout.server.ts` (root) — return `authState` + prefetched user

```ts
import { api } from '@/convex/_generated/api';
import {
  createConvexHttpClient,
  getAuthState,
} from '@mmailaender/convex-better-auth-svelte/sveltekit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
  const authState = getAuthState();               // { isAuthenticated } from the cookie
  if (!authState.isAuthenticated) {
    return { authState, currentUser: null };
  }

  const client = createConvexHttpClient();        // carries the SSR token
  try {
    const currentUser = await client.query(api.<your>.getCurrentUser, {});
    return { authState, currentUser };
  } catch (error) {
    // Never 500 the whole app because the prefetch failed — degrade to null and let
    // the client re-fetch. This is important: a throw here is a blank page.
    console.error('[+layout.server] getCurrentUser failed:', error);
    return { authState, currentUser: null };
  }
};
```

Two things this buys you:
- `authState.isAuthenticated` lets the client render the *correct* auth state on the
  first frame (no logged-out flash).
- `currentUser` becomes `initialData` for the client query, so the very first render
  already has the user — no skeleton at all on a hard reload.

---

## 3. Client: seed the auth client, gate the query, share one subscription

### Root `+layout.svelte`

```svelte
<script lang="ts">
  import { createSvelteAuthClient, useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
  import { useQuery } from '@mmailaender/convex-svelte';
  import { authClient } from '@/features/auth/lib/auth-client';
  import { api } from '@/convex/_generated/api';
  import { authClass, type CurrentUser } from '@/features/auth/classes/authClass.svelte';

  let { children, data } = $props();

  // Seed isAuthenticated from SSR so there is no unauthenticated flash on first paint.
  createSvelteAuthClient({
    authClient,
    getServerState: () => data.authState,
  });

  // MUST be after createSvelteAuthClient — it reads the context that call sets up.
  const auth = useAuth();

  // Gate the Convex query on auth.isAuthenticated:
  //  - 'skip' while unauthenticated  -> the query never runs without a token,
  //    so you never get a 401 / "not authenticated" query error.
  //  - initialData from SSR          -> first render already has the user (no skeleton).
  //  - keepPreviousData: true        -> during a JWT refresh the old data stays on
  //                                     screen instead of dropping to a skeleton.
  const currentUserResponse = useQuery(
    api.<your>.getCurrentUser,
    () => (auth.isAuthenticated ? {} : 'skip'),
    () => ({
      initialData: data.currentUser ?? undefined,
      keepPreviousData: true,
    }),
  );

  // Push the live query into one shared store so components read a single subscription
  // instead of each re-running useQuery (which multiplies skeleton churn).
  $effect(() => {
    if (!auth.isAuthenticated) {
      authClass.syncFromCurrentUserQuery(null, false); // definitively signed out, not loading
      return;
    }
    const user = currentUserResponse.data as CurrentUser | null | undefined;
    authClass.syncFromCurrentUserQuery(user, currentUserResponse.isLoading);
  });
</script>
```

### Shared store `authClass.svelte.ts`

```ts
import { api } from '@/convex/_generated/api';
import type { FunctionReturnType } from 'convex/server';

export type CurrentUser = NonNullable<
  FunctionReturnType<typeof api.<your>.getCurrentUser>
>;

class AuthClass {
  /** undefined = not yet synced; null = signed out; else the user. */
  currentUser = $state<CurrentUser | null | undefined>(undefined);
  /** true while getCurrentUser is in flight (not skipped). */
  userLoading = $state(true);

  syncFromCurrentUserQuery(user: CurrentUser | null | undefined, loading: boolean) {
    this.currentUser = user;
    this.userLoading = loading;
  }
}

export const authClass = new AuthClass();
```

Components read `authClass.currentUser` / `authClass.userLoading` — they never call
`useQuery(getCurrentUser)` themselves. One subscription, one source of truth.

### `auth-client.ts`

```ts
import { createAuthClient } from 'better-auth/svelte';
import { convexClient } from '@convex-dev/better-auth/client/plugins';

export const authClient = createAuthClient({
  plugins: [convexClient() /* , emailOTPClient() */],
  sessionOptions: { refetchOnWindowFocus: false }, // see §1
});
```

---

## 4. Why this avoids the infinite skeleton on JWT change (the timing part)

The subtle timing lives inside `@mmailaender/convex-better-auth-svelte` — you don't
write it, but you must not fight it, so here's what it does and why the pattern above
cooperates with it:

- Convex calls `fetchAccessToken({ forceRefreshToken })` whenever the JWT needs
  refreshing. Better Auth toggles its `$sessionSignal` on **three** different events:
  sign-out, tab refocus, and cross-tab broadcast. Naively returning `null` when a
  signal is mid-flight would make Convex's `AuthenticationManager` fire
  `onChange(false)` → every query pauses → **infinite skeleton**.
- Instead, `fetchAccessToken` **awaits the session settling promise**, then re-checks:
  session survived → fetch a fresh token and proceed (tab refocus / JWT refresh);
  session actually cleared → return `null` (real sign-out, no 401).
- There's also a ~150ms "transient guard" and a ~50ms navigation-pending timer that
  hold `isLoading = true` through the brief `{ data: null, isPending: false }` blip
  Better Auth emits during client-side navigation, so a nav doesn't flash logged-out.

Your side of the contract — this is what actually prevents the failure modes:

1. **Gate the query on `auth.isAuthenticated`** (`'skip'` otherwise). `isAuthenticated`
   only becomes true once the session has *settled*, so the query never runs against a
   missing/stale token → no query error.
2. **`keepPreviousData: true`** so a JWT refresh (which momentarily re-runs the query)
   keeps the last user on screen instead of dropping to a skeleton.
3. **`initialData` from SSR** so the first client render is already populated.
4. **Explicit `(null, false)` on sign-out** in the `$effect` — hand consumers a
   definitive "signed out, not loading" so nothing waits forever.
5. **`getServerState` seed** so `isAuthenticated` is correct on frame one.

Ordering rules that bite if you get them wrong:
- `createSvelteAuthClient` **before** `useAuth()`.
- `useAuth()` reactive `isAuthenticated` **drives** the `useQuery` skip arg — pass it as
  a getter `() => (...)`, not a snapshot.

---

## Checklist to replicate in another project

- [ ] `createAuthClient({ sessionOptions: { refetchOnWindowFocus: false } })` if you
      want no tab-focus `/get-session`. (Optional — the pattern tolerates it either way.)
- [ ] `hooks.server.ts`: `getToken(cookies)` → `withServerConvexToken(token, resolve)`.
- [ ] Root `+layout.server.ts`: return `{ authState: getAuthState(), currentUser }`,
      prefetch `currentUser` only when authed, **try/catch → null** (never throw).
- [ ] Root `+layout.svelte`: `createSvelteAuthClient({ authClient, getServerState: () => data.authState })`,
      then `const auth = useAuth()`.
- [ ] `useQuery(getCurrentUser, () => auth.isAuthenticated ? {} : 'skip', () => ({ initialData: data.currentUser ?? undefined, keepPreviousData: true }))`.
- [ ] `$effect`: on `!isAuthenticated` push `(null, false)`; else push
      `(response.data, response.isLoading)` into a shared store.
- [ ] Components read the shared store, never re-subscribe to `getCurrentUser`.

---

## Prompt to hand another LLM

> You are wiring **Better Auth + Convex in a SvelteKit app** and need to eliminate
> three bugs: (a) a logged-out flash on first paint, (b) infinite skeletons / paused
> queries when the Convex JWT refreshes or the user switches tabs, and (c) spurious
> 401 / "not authenticated" query errors during sign-out and navigation. This project
> uses plain Better Auth (email/password + social/OTP) with
> `@mmailaender/convex-better-auth-svelte` and `@mmailaender/convex-svelte`. There is
> NO secondary/guest auth — do not add any tab/visibility event listeners of your own.
>
> Implement exactly this pattern:
>
> 1. **Disable the tab-focus session refetch (optional but preferred).** In the
>    `createAuthClient(...)` config, set `sessionOptions: { refetchOnWindowFocus: false }`.
>    This is the only knob controlling whether `/get-session` refetches when the tab
>    regains focus (default is `true`, rate-limited to 5s).
>
> 2. **Seed auth state from the server.** In `hooks.server.ts`, read the Convex token
>    with `getToken(event.cookies)`, stash it on `event.locals.token`, and wrap
>    `resolve` in `withServerConvexToken(token, () => resolve(event))`. In the root
>    `+layout.server.ts`, return `{ authState: getAuthState(), currentUser }`: if
>    `authState.isAuthenticated`, prefetch the current-user query via
>    `createConvexHttpClient()` inside a **try/catch that returns `currentUser: null`
>    on failure** (never throw — a throw blanks the page); otherwise return
>    `currentUser: null`.
>
> 3. **Wire the client in the root `+layout.svelte`.** Call
>    `createSvelteAuthClient({ authClient, getServerState: () => data.authState })`
>    FIRST, then `const auth = useAuth()` (order matters — `useAuth` reads context that
>    `createSvelteAuthClient` sets). Create the query with:
>    ```ts
>    const currentUserResponse = useQuery(
>      api.<path>.getCurrentUser,
>      () => (auth.isAuthenticated ? {} : 'skip'),
>      () => ({ initialData: data.currentUser ?? undefined, keepPreviousData: true }),
>    );
>    ```
>    The skip arg MUST be a getter reading `auth.isAuthenticated` so it reacts. Skipping
>    while unauthenticated is what prevents the 401/query-error; `initialData` kills the
>    first-load skeleton; `keepPreviousData` keeps the user on screen through JWT
>    refreshes instead of dropping to a skeleton.
>
> 4. **Fan out through one shared store.** Add a small `$state` class with
>    `currentUser` and `userLoading` plus a `syncFromCurrentUserQuery(user, loading)`
>    method. In a root `$effect`: if `!auth.isAuthenticated`, call
>    `sync(null, false)` (definitive signed-out, not loading); else
>    `sync(currentUserResponse.data, currentUserResponse.isLoading)`. Every component
>    reads this store instead of re-subscribing to the query.
>
> Do not add `visibilitychange`/`focus`/`pageshow` listeners, do not manually call
> `convexClient.setAuth`, and do not return `null` early from any token fetch — the
> `@mmailaender/convex-better-auth-svelte` library already awaits the Better Auth
> session-settling promise before deciding, and manual intervention re-introduces the
> auth flash. Your only job is the SSR seed + the query gating + the shared store above.
