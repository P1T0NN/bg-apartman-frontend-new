import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		alias: {
			'@/*': './src/*'
		},
		// SvelteKit's CSRF origin check is on by default. Add extra allowed
		// origins here only if needed (e.g. multi-domain setups). An empty list
		// (or omitting `csrf` entirely) keeps the default same-origin policy.
		csrf: {
			trustedOrigins: []
		},
		experimental: {
			remoteFunctions: true
		},
		// CSP: SvelteKit emits hashes for its own inline scripts/styles in 'auto'
		// mode, so we don't need 'unsafe-inline' / 'unsafe-eval' for script-src.
		// 'unsafe-inline' stays on style-src for Tailwind/inline styles.
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': [
					'self',
					'blob:',
					'https://va.vercel-scripts.com',
					'https://umami-sable-iota.vercel.app',
					// Google Maps JS SDK (Places autocomplete)
					'https://maps.googleapis.com',
					'https://maps.gstatic.com'
				],
				'worker-src': ['self', 'blob:'],
				// Google Maps injects <link> stylesheets for its control fonts (Roboto,
				// Google Sans) from fonts.googleapis.com, with the woff2 files on gstatic.
				'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
				'img-src': ['self', 'data:', 'https:', 'blob:'],
				'font-src': ['self', 'data:', 'https://fonts.gstatic.com'],
				'connect-src': [
					'self',
					'https://accounts.google.com',
					'https://oauth2.googleapis.com',
					'https://www.googleapis.com',
					'https://*.convex.cloud',
					'wss://*.convex.cloud',
					// Vercel Analytics + Speed Insights telemetry endpoint
					'https://va.vercel-scripts.com',
					// Cloudflare R2 — direct browser PUT to signed upload URLs and GET on public objects
					'https://*.r2.cloudflarestorage.com',
					'https://*.r2.dev',
					// Umami analytics
					'https://umami-sable-iota.vercel.app',
					// Google Places API (New) — autocomplete + place details requests
					'https://maps.googleapis.com',
					'https://places.googleapis.com'
				],
				// Keyless Google Maps embed on the accommodation "Where you'll be" iframe
				// frames maps.google.com (which can redirect to www.google.com/maps).
				'frame-src': [
					'self',
					'https://accounts.google.com',
					'https://maps.google.com',
					'https://www.google.com'
				],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'frame-ancestors': ['none'],
				'upgrade-insecure-requests': true
			}
		}
	},
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};

export default config;
