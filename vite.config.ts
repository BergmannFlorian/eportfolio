/// <reference types="vitest/config" />
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode, command }) => {
	// Database settings for the dev server and the tests: DB_* from .env
	// (+ .env.test in test mode). Variables already set (e.g. in CI) win.
	for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), 'DB_'))) {
		process.env[key] ??= value;
	}

	return {
		plugins: [
			tailwindcss(),
			paraglideVitePlugin({
				project: './project.inlang',
				outdir: './src/lib/paraglide',
				emitTsDeclarations: true,
				strategy: ['url', 'cookie', 'preferredLanguage', 'baseLocale'],
				// French without prefix (/), English under /en
				urlPatterns: [
					// Translated slugs first: the generic pattern below catches everything
					{
						pattern: '/projets',
						localized: [
							['en', '/en/projects'],
							['fr', '/projets']
						]
					},
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

				// Node server (Infomaniak), started through deploy/launcher.js.
				// Environment variables on the server: ORIGIN, PORT and DB_* (see .env.example).
				adapter: adapter({ out: 'build' })
			})
		],
		// Bundle the DB driver into the server build so the deployment needs no
		// node_modules (SFTP uploads files one by one). Dev and tests keep it external.
		ssr: command === 'build' ? { noExternal: ['mariadb'] } : undefined,
		test: {
			// Recreates the test database (db/schema.sql + db/test/fixtures.sql) once per run
			globalSetup: ['./db/test/setup.ts'],
			include: ['src/**/*.test.ts'],
			testTimeout: 20_000
		}
	};
});
