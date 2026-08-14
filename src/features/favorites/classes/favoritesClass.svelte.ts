// SVELTEKIT IMPORTS
import { browser } from '$app/environment';

// LIBRARIES
import { SvelteSet } from 'svelte/reactivity';
import { api } from '@/convex/_generated/api';

// CONFIG
import { LOCAL_STORAGE_KEYS } from '@/shared/config';

// UTILS
import { safeMutation } from '@/utils/convexHelpers';

// TYPES
import type { ConvexClient } from 'convex/browser';
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Favorites store — the ONE place that knows where a user's saved listings live.
 *
 * Two backings, one API. Signed out, hearts persist in `localStorage` (a visitor can save
 * before they have an account). Signed in, the `favorites` table is the truth. Callers never
 * learn which: every consumer — the heart on a card, the dashboard's count, the favorites page
 * — reads {@link ids} / {@link isFavorite} and calls {@link toggle}, exactly as they did when
 * this was localStorage-only.
 *
 * ## One live feed, no query per card
 * "Is this listing saved?" is asked once per rendered card — as a query that would be 30
 * subscriptions on a search page. It is instead one reactive set, fed by the root layout's
 * live `fetchMyFavoriteIdsSafe` subscription ({@link setServerIds}) and kept correct after
 * that by the writes themselves: `toggleFavorite` returns the state the row ended in, so the
 * class never has to ask again (GeneralSystemDesignRule.md § seeing your own writes). Mounting
 * a heart costs nothing.
 *
 * The feed is unioned into the set rather than replacing it, so a save made in another tab
 * shows up on the next feed while an in-flight optimistic toggle is never clobbered. A
 * cross-device *removal* reflects on the next feed the same way.
 *
 * ## Writes are optimistic
 * {@link toggle} flips the set and returns the new state synchronously — the heart never waits
 * on a round trip. The mutation runs behind it and its return value is applied as the truth; a
 * failure undoes the flip (and `safeMutation` has already toasted why).
 */
class FavoritesClass {
	/** Reactive set of saved apartment ids. Read via {@link isFavorite}. */
	ids = new SvelteSet<string>();

	/** `null` until the root layout connects one. Absent = local mode, whatever the auth state. */
	private client: ConvexClient | null = null;
	/** Which backing {@link toggle} writes to. Flipped by {@link syncAuth}. */
	private backing: 'local' | 'server' = 'local';
	private hydrated = false;

	isFavorite(apartmentId: string): boolean {
		return this.ids.has(apartmentId);
	}

	/**
	 * Load `localStorage` ids into the set. Idempotent, client-only, and a no-op once the
	 * server backing has taken over — kept so an anonymous visitor's hearts work with no
	 * layout involvement at all.
	 */
	hydrate() {
		if (this.hydrated || !browser || this.backing === 'server') return;
		this.hydrated = true;
		for (const id of this.readLocal()) this.ids.add(id);
	}

	/** Hand the class the app's Convex client (root layout). Required for server writes. */
	connect(client: ConvexClient) {
		this.client = client;
	}

	/**
	 * React to the session state (root layout `$effect`).
	 *
	 * Signing in flips the backing immediately — before the merge resolves, so a click in that
	 * window is written to the account instead of to localStorage where the load would bury it
	 * — then folds whatever this device saved anonymously into the account. The saved-id set
	 * itself is fed by the layout's live subscription, not fetched here.
	 *
	 * Signing out hands the set back to localStorage: the previous account's saves must not
	 * stay on screen.
	 */
	syncAuth(signedIn: boolean) {
		if (!browser) return;

		if (!signedIn) {
			if (this.backing === 'server') {
				this.backing = 'local';
				this.hydrated = false;
				this.ids.clear();
				this.hydrate();
			}
			return;
		}

		this.backing = 'server';
		// Merge this device's anonymous saves into the account (idempotent — clears the
		// localStorage key on success). The layout's live feed unioning into {@link setServerIds}
		// keeps the set correct after that; there is no one-shot fetch here anymore.
		void this.mergeLocal();
	}

	/**
	 * Toggle a favorite and return the state it is now in. Synchronous by design: the caller
	 * toasts and re-renders immediately, and the write settles behind it.
	 */
	toggle(apartmentId: string): boolean {
		const willSave = !this.ids.has(apartmentId);

		if (willSave) this.ids.add(apartmentId);
		else this.ids.delete(apartmentId);

		if (this.backing === 'server' && this.client) {
			void this.persistToServer(apartmentId as Id<'apartments'>, willSave);
		} else {
			this.persistLocal();
		}

		return willSave;
	}

	/** Fire the toggle mutation; apply its answer, or undo the optimistic flip if it failed. */
	private async persistToServer(apartmentId: Id<'apartments'>, willSave: boolean) {
		const client = this.client;
		if (!client) return;

		const result = await safeMutation(
			client,
			api.tables.favorites.mutations.toggleFavorite.toggleFavorite,
			{
				apartmentId
			}
		);

		// `null` = the error was already toasted, so put the heart back where it was.
		if (result === null) {
			if (willSave) this.ids.delete(apartmentId);
			else this.ids.add(apartmentId);
			return;
		}

		// Otherwise the server's answer is the truth — including `saved: false` on a save, which
		// is how a listing deleted out from under the card reports itself.
		if (result.saved) this.ids.add(apartmentId);
		else this.ids.delete(apartmentId);
	}

	/**
	 * Union a freshly-fetched server set into the reactive ids. Called by the root layout's live
	 * `fetchMyFavoriteIdsSafe` subscription on every change.
	 *
	 * Union, not replace — deliberately. The first feed lands right after {@link syncAuth}
	 * merged this device's anonymous saves into the account, so a replace would have to wait on
	 * that merge; and an optimistic toggle made while a feed is in flight is never clobbered,
	 * because the mutation that follows it is the authority. Guarded on the server backing so a
	 * stale feed can't re-add the previous account's ids after a sign-out. Accepted consequence
	 * (same as always): a cross-device removal reflects on the next feed.
	 */
	setServerIds(ids: string[]) {
		if (this.backing !== 'server') return;
		for (const id of ids) this.ids.add(id);
	}

	/**
	 * Fold `localStorage` ids into the account and clear the local copy, so a later sign-in as
	 * someone else can't inherit them. Returns false only when the call failed — a failed merge
	 * must stay mergeable rather than silently losing the visitor's saves.
	 */
	private async mergeLocal(): Promise<boolean> {
		const client = this.client;
		if (!client) return false;

		const local = this.readLocal();
		if (local.length === 0) return true;

		const result = await safeMutation(
			client,
			api.tables.favorites.mutations.mergeFavorites.mergeFavorites,
			{
				apartmentIds: local as Id<'apartments'>[]
			}
		);
		if (result === null) return false;

		localStorage.removeItem(LOCAL_STORAGE_KEYS.GUEST_FAVORITES);
		return true;
	}

	private readLocal(): string[] {
		if (!browser) return [];
		try {
			const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.GUEST_FAVORITES);
			if (!raw) return [];
			const parsed: unknown = JSON.parse(raw);
			return Array.isArray(parsed)
				? parsed.filter((id): id is string => typeof id === 'string')
				: [];
		} catch {
			return [];
		}
	}

	private persistLocal() {
		if (!browser) return;
		localStorage.setItem(LOCAL_STORAGE_KEYS.GUEST_FAVORITES, JSON.stringify([...this.ids]));
	}
}

export const favoritesClass = new FavoritesClass();
