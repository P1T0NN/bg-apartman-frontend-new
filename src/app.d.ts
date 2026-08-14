// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			token: string | undefined;
		}
		interface PageData {
			/** Shown in app shells (e.g. `SiteHeader`) when set by a route `load`. */
			pageTitle?: string;
			/** Active UI locale, resolved in the root layout load. */
			locale?: string;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
