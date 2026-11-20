# eportfolio

Personal portfolio and CV of the owner, live at https://bergmann-florian.ch. Talk to the owner in **French**; write code, comments, commit messages and docs in **English**.

## Stack

- SvelteKit 3 + Svelte 5 (runes everywhere), TypeScript, Vite 8, `@sveltejs/adapter-node`.
- Tailwind CSS v4 (`@tailwindcss/vite`, configured in `src/app.css`, no `tailwind.config`).
- i18n: Paraglide JS (`project.inlang/`, texts in `messages/fr.json` / `messages/en.json`). French at `/`, English under `/en`.
- Content: MariaDB through the `mariadb` driver. Tests: Vitest against a real test database.
- Self-hosted fonts (`@fontsource-variable/*`), no external CDN.

## Layout

- `src/routes/(site)/`: home page (sections in `src/lib/components/`, data from `+page.server.ts`).
- `src/routes/cv/`: printable CV page, ported from an older project (own components in `cv/components/`, helpers in `src/lib/cv/`).
- `src/routes/api/v1/`: public read-only JSON API (`+server.ts`), meant for a future mobile app. Documented in the README; response types in `src/lib/api/types.ts`.
- `src/lib/server/db/`: connection pool. `src/lib/server/content/`: every DB query and the derived shapes for the home page, `/cv` and the API (60 s cache per locale).
- `src/lib/theme/`: multi-theme system. See below.
- `db/schema.sql`: schema. `db/seed.sql`: real content, **never committed**. `db/test/`: fixtures and the Vitest global setup.
- `deploy/`: launcher and package.json uploaded to the server. `design/`: git-ignored design exports.

## Conventions

- Imports use the `#lib/*` alias with explicit `.js` extensions (`#lib/server/db/index.js`).
- SvelteKit 3 types: `Handle` and `Reroute` come from `@sveltejs/kit/hooks`.
- Paraglide message functions: `m.key(inputs, { locale })`. UI labels live in `messages/*.json`; **content** (bio, jobs, projects, skills…) lives in the database, with `*_i18n` tables falling back to `fr`.
- Styling uses semantic tokens (`bg-bg`, `text-fg-muted`, `border-border`, `bg-accent`…) mapped to CSS variables in `@theme inline`. Never hard-code colors in components. Tailwind v4 forbids `@apply` of custom classes, so inline the utilities instead.
- Themes: one `src/lib/theme/themes/<id>.css` per theme (`[data-theme='<id>']`), imported in `src/app.css` and registered in `src/lib/theme/themes.ts` (see the comment there). An inline script (built in `theme.svelte.ts`, injected by `src/routes/+layout.svelte`) sets the theme before paint.
- `/api` is excluded from Paraglide localization: the API takes `?lang=` or `Accept-Language`.

## Privacy

The database holds private data: address, birthdate and references (names, phones). Never select address or references. The birthdate is only used to compute the age server-side. None of these may reach the browser, the API, a commit or a log. `db/seed.sql` and `.env` are git-ignored. Check `git ls-files db` before pushing.

## Development

```sh
npm run db:up    # local MariaDB in Docker (compose.yaml), loads schema + seed.sql (or fixtures)
npm run dev      # needs .env pointing to it (see .env.example)
npm test         # Vitest, recreates the eportfolio_test database in the same container
npm run check    # svelte-check
npm run db:reset # reload the database after changing schema.sql or seed.sql
```

The Infomaniak database is only reachable from Infomaniak's network. Locally, always use Docker.

## Deployment

- Branches: `master` (main), `develop`, `deploy`. Pushing to `deploy` runs `.github/workflows/deploy.yml`: tests with a MariaDB service, build, SFTP upload to Infomaniak, then restart via the `.deploy-version` marker.
- Server layout: `index.js` (launcher), `package.json`, `app/` (adapter-node build). The `mariadb` driver is bundled into the build (`ssr.noExternal`), so there is no `node_modules` to upload.
- `REMOTE_PATH/.env` holds the production `DB_*` values and `ORIGIN`. It is created by hand and survives deployments.
- Commit or push only when the owner asks. The usual request is "commit and push on master and deploy".
