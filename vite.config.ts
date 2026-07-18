import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { BOTID_CHALLENGE_PATH, BOTID_PROXY_PREFIX } from './src/shared/config/botidProxy.ts';

export default defineConfig({
	// BotID client loads same-origin challenge/proxy scripts. Vite dev has no
	// vercel.json rewrites, so proxy them to Vercel's bot-protection API.
	server: {
		proxy: {
			[BOTID_CHALLENGE_PATH]: {
				target: 'https://api.vercel.com',
				changeOrigin: true,
				secure: true,
				rewrite: () => '/bot-protection/v1/challenge'
			},
			[BOTID_PROXY_PREFIX]: {
				target: 'https://api.vercel.com',
				changeOrigin: true,
				secure: true,
				rewrite: (path) => `/bot-protection/v1/proxy${path.slice(BOTID_PROXY_PREFIX.length)}`
			}
		}
	},
	preview: {
		port: 5173
	},
	// layerchart → @dagrejs/dagre ships ESM-only; if left external, Node SSR loads
	// dagre.esm.js as CJS and throws "Unexpected token 'export'".
	// @googlemaps/markerclusterer is the mirror case: it's CJS, so Node SSR can't
	// resolve its named exports (MarkerClusterer/SuperClusterAlgorithm). Bundling it
	// runs Vite's CJS interop, which exposes those names correctly.
	ssr: {
		noExternal: ['layerchart', '@dagrejs/dagre', '@googlemaps/markerclusterer']
	},
	plugins: [
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/shared/lib/paraglide',
			strategy: ['url', 'cookie', 'baseLocale'],
			routeStrategies: [{ match: '/api/:path(.*)?', exclude: true }],
			urlPatterns: [
				{
					pattern: ':protocol://:domain(.*)::port?/:path(.*)?',
					localized: [
						['sr', ':protocol://:domain(.*)::port?/sr/:path(.*)?'],
						['en', ':protocol://:domain(.*)::port?/:path(.*)?']
					]
				}
			]
		}),
		tailwindcss(),
		sveltekit()
	]
});
