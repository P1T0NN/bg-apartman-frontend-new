// SVELTEKIT IMPORTS
import { browser } from '$app/environment';
import { SvelteSet } from 'svelte/reactivity';

// CONFIG
import { LOCAL_STORAGE_KEYS } from '@/shared/config';

/**
 * Client-only favorites store backed entirely by `localStorage`.
 *
 * No backend: favorites live on the device, work for signed-out and signed-in users
 * alike, and never hit Convex. The reactive {@link SvelteSet} drives every heart icon;
 * {@link hydrate} loads the persisted ids after mount (called once from the root layout
 * to avoid an SSR/CSR markup mismatch), and {@link toggle} mutates the set + persists.
 */
class FavoritesClass {
	/** Reactive set of saved apartment ids. Read via {@link isFavorite}. */
	ids = new SvelteSet<string>();
	private hydrated = false;

	isFavorite(apartmentId: string): boolean {
		return this.ids.has(apartmentId);
	}

	/** Load persisted ids into the reactive set. Idempotent; only runs once, client-side. */
	hydrate() {
		if (this.hydrated || !browser) return;
		this.hydrated = true;
		this.ids.clear();
		for (const id of this.read()) this.ids.add(id);
	}

	/** Toggle a favorite, persist to localStorage, and return the new saved state. */
	toggle(apartmentId: string): boolean {
		const willSave = !this.ids.has(apartmentId);
		if (willSave) this.ids.add(apartmentId);
		else this.ids.delete(apartmentId);
		this.persist();
		return willSave;
	}

	private read(): string[] {
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

	private persist() {
		if (!browser) return;
		localStorage.setItem(LOCAL_STORAGE_KEYS.GUEST_FAVORITES, JSON.stringify([...this.ids]));
	}
}

export const favoritesClass = new FavoritesClass();
