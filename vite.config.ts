import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true,
			strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
			// French without prefix (/), English under /en
			urlPatterns: [
				{
					pattern: '/:path(.*)?',
					localized: [
						['en', '/en/:path(.*)?'],
						['fr', '/:path(.*)?']
					]
				}
			],
			// The JSON API picks its locale from ?lang / Accept-Language, not from the URL
			routeStrategies: [{ match: '/api/:path(.*)?', exclude: true }]
		}),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Node server (Infomaniak): `npm start` → node build/index.js
			// Environment variables to set on the server: ORIGIN (public URL) and PORT.
			adapter: adapter({ out: 'build' })
		})
	]
});
