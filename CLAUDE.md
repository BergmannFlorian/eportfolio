# eportfolio

Personal portfolio and CV of the owner, live at https://bergmann-florian.ch. Talk to the owner in **French**; write code, comments, commit messages and docs in **English**.

## Stack

- SvelteKit 3 + Svelte 5 (runes everywhere), TypeScript, Vite 8, `@sveltejs/adapter-node`.
- Tailwind CSS v4 (`@tailwindcss/vite`, configured in `src/app.css`, no `tailwind.config`).
- i18n: Paraglide JS (`project.inlang/`, texts in `messages/fr.json` / `messages/en.json`). French at `/`, English under `/en`.
- Content: MariaDB through the `mariadb` driver. Tests: Vitest against a real test database.
- Self-hosted fonts (`@fontsource-variable/*`), no external CDN.

## Layout

- `src/routes/(site)/`: home page (sections in `src/lib/components/`, data from `+page.server.ts`) and `projets/`, the personal projects page (`/projets`, `/en/projects`: translated slugs are declared in `urlPatterns` in `vite.config.ts`).
- `src/routes/cv/`: printable CV page, ported from an older project (own components in `cv/components/`, helpers in `src/lib/cv/`).
- `src/routes/api/v1/`: public read-only JSON API (`+server.ts`), meant for a future mobile app. Documented in the README; response types in `src/lib/api/types.ts`.
- `src/lib/server/db/`: connection pools. `query` uses the read-only account (`DB_USER`) for public content; `writeQuery` uses `DB_WRITE_USER` and is for the administration only. `src/lib/server/content/`: every DB query and the derived shapes for the home page, `/cv` and the API (60 s cache per locale).
- `src/routes/admin/`: owner login (password + TOTP) and logout; editing happens on the site pages, which get a `signedIn` flag from `(site)/+layout.server.ts`. Guarded in `src/hooks.server.ts`; logic in `src/lib/server/auth/`. The account is created with `npm run admin:create` (`scripts/create-admin.ts`, run by Node directly: `password.ts` and `totp.ts` must keep importing node built-ins only).
- Content editing: one dialog per block on the pages (`src/lib/components/edit/`, lazy-loaded when signed in) → `GET`/`POST`/`DELETE /admin/content/<section>` (JSON) (`?id=` for one project or experience) → `src/lib/server/edit/` (a `SectionHandler` per section, registered in `index.ts`; validation, one transaction per section, French required, empty translations stored as NULL). Shared types and limits in `src/lib/content/edit.ts`; add a section there, as a handler and as a `<Name>Editor.svelte`. Done so far: home page profile texts, facts, languages, hobbies, projects (per card + order dialog), skills and their categories (ids and category codes kept: projects, experiences and the API rely on them; `on_cv` on categories and skills drives the CV skills table), journey (per experience, `DELETE` refused with 409 when projects are attached; positions follow the dates), and on `/cv` a toolbar for the CV heading, name and city, certificates, links (plus facts, languages, hobbies).
- Images: chosen in `ImagePicker.svelte` (upload or library), inside `ImageEditor.svelte` (portrait, logos) or the project editor (project images), sent by `src/lib/media/send-image.ts` to `POST /admin/media`, stored in `UPLOADS_DIR` (git-ignored `uploads/`), served by `src/routes/media/`. Logic in `src/lib/server/media/`. `/media` is not localized (like `/api`).
- `src/lib/theme/`: multi-theme system. See below.
- `db/schema.sql`: schema. `db/migrations/`: ALTER scripts to run once on the production database when the schema changes. `db/seed.sql`: real content, **never committed**. `db/test/`: fixtures and the Vitest global setup.
- `deploy/`: launcher and package.json uploaded to the server. `design/`: git-ignored design exports.

## Conventions

- Imports use the `#lib/*` alias with explicit `.js` extensions (`#lib/server/db/index.js`).
- SvelteKit 3 types: `Handle` and `Reroute` come from `@sveltejs/kit/hooks`.
- Paraglide message functions: `m.key(inputs, { locale })`. UI labels live in `messages/*.json`; **content** (bio, jobs, projects, skills…) lives in the database, with `*_i18n` tables falling back to `fr`.
- Styling uses semantic tokens (`bg-bg`, `text-fg-muted`, `border-border`, `bg-accent`…) mapped to CSS variables in `@theme inline`. Never hard-code colors in components. Tailwind v4 forbids `@apply` of custom classes, so inline the utilities instead.
- Themes: one `src/lib/theme/themes/<id>.css` per theme (`[data-theme='<id>']`), imported in `src/app.css` and registered in `src/lib/theme/themes.ts` (see the comment there). An inline script (built in `theme.svelte.ts`, injected by `src/routes/+layout.svelte`) sets the theme before paint.
- `/api` is excluded from Paraglide localization: the API takes `?lang=` or `Accept-Language`.

## Privacy

The database holds private data: address, birthdate and references (names, phones). Never select address or references. The birthdate is only used to compute the age server-side. None of these may reach the browser, the API, a commit or a log. The same goes for `admin_user` (password hash, TOTP secret) and session tokens: only `src/lib/server/auth/` reads them. `db/seed.sql` and `.env` are git-ignored. Check `git ls-files db` before pushing.

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
- `REMOTE_PATH/.env` holds the production `DB_*` values (read-only `DB_USER`, write `DB_WRITE_USER`) and `ORIGIN`. It is created by hand and survives deployments.
- Commit or push only when the owner asks. The usual request is "commit and push on master and deploy".
