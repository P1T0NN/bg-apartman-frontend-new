// SVELTEKIT IMPORTS
import { browser } from '$app/environment';

// LIBRARIES
import { SvelteSet } from 'svelte/reactivity';
import { api } from '@/convex/_generated/api';

// CONFIG
import { LOCAL_STORAGE_KEYS } from '@/shared/config';

// UTILS
import { safeMutation, safeQuery } from '@/utils/convexHelpers';

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
 * ## No subscription, and no query per card
 * "Is this listing saved?" is asked once per rendered card — as a query that would be 30
 * subscriptions on a search page. It is instead one reactive set, filled by ONE fetch when a
 * session appears ({@link syncAuth}) and kept correct after that by the writes themselves:
 * `toggleFavorite` returns the state the row ended in, so the class never has to ask again
 * (GeneralSystemDesignRule.md § seeing your own writes). Mounting a heart costs nothing, and
 * the layout pays for no second live channel — `getCurrentUser` remains its only one.
 *
 * Accepted consequence: a save made in ANOTHER tab or on another device isn't reflected until
 * the next load. Same trade `/guest/favorites` already makes — a saved-places list does not
 * move under the viewer.
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
	private loaded = false;

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
	 * Signing in flips the backing immediately — before the fetch resolves, so a click in that
	 * window is written to the account instead of to localStorage where the load would bury it
	 * — then merges whatever this device saved anonymously and fetches the account's set ONCE.
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
				this.loaded = false;
				this.ids.clear();
				this.hydrate();
			}
			return;
		}

		this.backing = 'server';
		void this.loadOnce();
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
	 * Merge this device's anonymous saves, then read the account's set. Once per session.
	 *
	 * Merge BEFORE the read, so the fetched set already contains them — one round trip each, in
	 * the only order that doesn't need a third. The result is UNIONED into the set rather than
	 * replacing it: an id toggled while this was in flight has its own mutation as the
	 * authority, and this fetch was issued before that landed.
	 */
	private async loadOnce() {
		if (this.loaded || !this.client) return;
		this.loaded = true;

		// A failed call leaves `loaded` false so the next auth tick (or navigation) retries,
		// rather than stranding the user on a half-loaded set for the session.
		if (!(await this.mergeLocal())) {
			this.loaded = false;
			return;
		}

		const serverIds = await safeQuery(
			this.client,
			api.tables.favorites.queries.fetchMyFavoriteIdsSafe.fetchMyFavoriteIdsSafe,
			{}
		);
		if (serverIds === null) {
			this.loaded = false;
			return;
		}

		for (const id of serverIds) this.ids.add(id);
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
