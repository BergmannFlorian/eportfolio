# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@1.4.0 create --template minimal --types ts --install npm eportfolio
```

## Adding features

Add features to your project with `sv add`:

```sh
npx sv add
```

For example, to add Tailwind CSS:

```sh
npx sv add tailwindcss
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Database

All content (home page, `/cv`, API) is read from MariaDB through [`src/lib/server/content/`](src/lib/server/content/) (in-memory cache of 60 s per locale).

- Schema: [`db/schema.sql`](db/schema.sql). Content import: `db/seed.sql` (not committed: contains private data).
- Schema changes for an existing database (production): one script per change in [`db/migrations/`](db/migrations/), to run once.
- Connection: copy [`.env.example`](.env.example) to `.env` and fill in `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (plus `DB_WRITE_USER` / `DB_WRITE_PASSWORD` in production, see [Database accounts](#database-accounts)). The dev server and the tests load it through `vite.config.ts`.

### Local database (Docker)

The Infomaniak database is only reachable from their network, so development uses a local MariaDB described in [`compose.yaml`](compose.yaml) (requires [Docker Desktop](https://www.docker.com/products/docker-desktop/)). The default values of `.env.example` point to it.

```sh
npm run db:up     # start MariaDB on 127.0.0.1:3306 (root / test)
npm run db:down   # stop it (data is kept in the db-data volume)
npm run db:reset  # drop the volume and reload schema + data
```

On the first start, [`db/docker/init.sh`](db/docker/init.sh) loads `db/schema.sql` into the `eportfolio` database, then `db/seed.sql` if present, otherwise the fictitious data of `db/test/fixtures.sql`. Run `npm run db:reset` after changing one of these files.
- Private columns (address, birthdate, references) are never selected, except the birthdate turned into an age.

## Tests

`npm test` runs Vitest against a **test database** described in [`.env.test`](.env.test) (override locally in `.env.test.local`). Locally, the Docker database (`npm run db:up`) serves both: the tests use their own `eportfolio_test` database in the same container. Before the run, [`db/test/setup.ts`](db/test/setup.ts) drops every table of that database (its name must end with `_test`), then loads `db/schema.sql` and the fictitious data of [`db/test/fixtures.sql`](db/test/fixtures.sql).

- [`src/routes/api/v1/api.test.ts`](src/routes/api/v1/api.test.ts): status codes, headers, locale resolution and fallback, filters, stable ids, links between resources, absence of private data, JSON 500 when the database is down.
- [`src/lib/server/content/content.test.ts`](src/lib/server/content/content.test.ts): home page data and the CV page format.
- [`src/lib/server/content/skills.test.ts`](src/lib/server/content/skills.test.ts): skill recency levels.
- [`src/lib/server/auth/auth.test.ts`](src/lib/server/auth/auth.test.ts): password hashing, TOTP (RFC 6238 vectors, drift, replay), login flow, lockout, hashed session ids.

The deploy workflow starts a MariaDB service and runs the tests before building.

## Deployment

Pushing to the `deploy` branch runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): it builds with `@sveltejs/adapter-node` and uploads to the Infomaniak Node.js hosting over SFTP.

```
REMOTE_PATH/
  index.js         launcher, started by Infomaniak with `node index.js` (deploy/launcher.js)
  package.json     minimal ESM package (deploy/package.json)
  app/             adapter-node build
  .deploy-version  marker written by the workflow after the upload
  .env             DB_*, ORIGIN, PORT — created by hand, kept across deployments
```

Infomaniak has no API to restart a Node.js site, so `index.js` is a small launcher: it runs `app/index.js` as a child process, restarts it when `.deploy-version` changes (last workflow step), and restarts it if it crashes. It passes the variables of `REMOTE_PATH/.env` to the server (variables set in the Infomaniak Manager win); the file is read at every restart and is not removed by deployments (hidden files are kept).

## Administration

Owner login, reached from the "Edit" button of the site header. Content is edited directly on the site pages, so after signing in you go back to the home page, where the button becomes "Sign out" (`POST /admin/logout`). `/admin` pages are sent with `X-Robots-Tag: noindex`; every page rendered for a signed-in owner gets `Cache-Control: no-store`.

- **Login** (`/admin/login`): email + password, then a 6-digit TOTP code from an authenticator app (RFC 6238). Code: [`src/lib/server/auth/`](src/lib/server/auth/).
- **Passwords**: scrypt (`node:crypto`), stored as `scrypt$N$r$p$salt$hash`. An unknown email takes as long as a wrong password, and both get the same message.
- **Sessions**: random token in an `httpOnly`, `SameSite=Lax`, `Secure` cookie; `admin_session` only stores its SHA-256. After the password, a 5-minute pending session waits for the code; a full session lasts 8 hours.
- **Lockout**: 5 wrong passwords or codes lock the account for 15 minutes. A TOTP code cannot be reused (`totp_last_step`).
- **Access control**: `src/hooks.server.ts` loads the session when the cookie is present (`locals.admin`; the site layout only passes a `signedIn` flag to the browser) and redirects every other `/admin` request without a full session to the login, form actions included. SvelteKit's origin check blocks cross-site form posts in production.

### Create or reset the account

```sh
npm run admin:create            # asks for the email and password
npm run admin:create you@example.com
```

The script generates the 2FA key, shows it as a QR code to scan, checks a code from the app, then prints the SQL to run in phpMyAdmin. It can also apply it to the local database from `.env`. Running it again for the same email replaces the password and the 2FA key and closes open sessions. The SQL contains the 2FA key: do not save it in the repository.

The tables come from [`db/migrations/2026-11-27-admin-auth.sql`](db/migrations/2026-11-27-admin-auth.sql) on an existing database (already in `db/schema.sql`).

### Content editing

Signed in, each editable block of the home page gets an "Edit" button that opens a dialog with the French and English fields side by side. So far: header (email, eyebrow, introduction), "About" text, facts, spoken languages, hobbies and projects; the same data feeds the CV and the API.

- **Projects**: each card (home page, `/projets`) edits its project: name, link, experience (none for a personal project), home page selection, description, technologies and the details of the Projects page. "Add a project" creates one at the end; "Order and selection" reorders every project (positions 1…n), selects the home page ones and deletes projects (their image stays in the library).

- **Translations**: French is required; an English field left empty falls back to the French text, field by field (the `*_i18n` columns of these lists are nullable, see [`db/migrations/2026-11-27-optional-translations.sql`](db/migrations/2026-11-27-optional-translations.sql)).
- **Lists** (facts, languages, hobbies): add, remove and reorder; saving replaces the whole list in one transaction. A language name is shared by everyone speaking it (`language_i18n`).
- **Code**: dialogs in [`src/lib/components/edit/`](src/lib/components/edit/), loaded only for the owner; `GET`/`POST /admin/content/<section>` (JSON only) in [`src/routes/admin/content/`](src/routes/admin/content/); validation and writes in [`src/lib/server/edit/`](src/lib/server/edit/); shared types and limits in `src/lib/content/edit.ts`.

### Images

Signed in, the owner edits images directly on the pages: the portrait (home page and CV) and organization logos (Journey section) through their own dialog, project images inside the project dialog (shown on the home works and personal projects cards and on `/projets`). The CV only shows the portrait.

- **Upload**: `ImagePicker.svelte` (used by `ImageEditor.svelte` and the project editor) crops and resizes the picture in the browser and encodes it as WebP (PNG/JPEG when the browser cannot encode WebP). Formats: portrait 4:5 (960×1200 max), project 16:10 (1600×1000 max), logo uncropped (256 px max, SVG kept as is). `src/lib/media/send-image.ts` posts it to `POST /admin/media` (`src/routes/admin/media/`), behind the admin session; the project dialog does so right after saving the project (a new project gets its id first).
- **Storage**: files in `UPLOADS_DIR` (`./uploads` locally, git-ignored; `REMOTE_PATH/uploads` in production, outside `app/`, so deployments keep them), under random names. The database stores the file name (`person.photo_file`, `project.image_file`, `organization.logo_file`) and the descriptions (`person_i18n.photo_alt`, `project_i18n.image_alt`). Code: [`src/lib/server/media/`](src/lib/server/media/).
- **Library**: the dialog can also reuse a file already uploaded (`GET /admin/media/library` lists every file with the slots showing it). Replaced or removed images stay in the library; only unused files can be deleted from there (`DELETE /admin/media/library?file=…`, 409 when in use).
- **Serving**: `GET /media/<file>` with `Cache-Control: immutable` (a replaced image gets a new name) and a CSP that sandboxes SVG files. The server checks the actual content (WebP, PNG, JPEG, SVG without scripts) and accepts 3 MB at most; `deploy/launcher.js` raises adapter-node's `BODY_SIZE_LIMIT` to 4M.
- **Works cards** (client and personal): the image is a grayscale background under a veil of the card color; the veil opacity is `--work-veil-opacity` (90%) in `src/app.css`.

Migration: [`db/migrations/2026-11-27-images.sql`](db/migrations/2026-11-27-images.sql).

### Database accounts

The site uses two MariaDB accounts ([`src/lib/server/db/`](src/lib/server/db/)):

- `DB_USER` / `DB_PASSWORD`: read-only (`SELECT`), for the public content: pages, CV, API (`query`).
- `DB_WRITE_USER` / `DB_WRITE_PASSWORD`: `SELECT`, `INSERT`, `UPDATE`, `DELETE` on the whole database (the hosting has no per-table grants), no schema changes; for the administration only (`writeQuery`). Without it (local Docker, tests), the administration uses `DB_USER`.

Schema changes are never applied by the site: run the scripts of `db/migrations/` by hand (phpMyAdmin) before deploying the code that needs them.

The read-only account does not need the `admin_*` tables at all.

## API

Public, read-only JSON API served by the same Node server, under `/api/v1`. All endpoints answer `GET` only.

| Endpoint | Query | Returns |
| --- | --- | --- |
| `/api/v1` | | API index: version, locales, endpoint list |
| `/api/v1/profile` | | Contact, age, bio, about, `photo` (uploaded portrait `{ url, alt }` or null), social links, facts, spoken languages, hobbies |
| `/api/v1/experiences` | `kind=job\|education` | Jobs and education with ISO dates, tasks, skills, linked project ids and `organizationLogo` |
| `/api/v1/projects` | `featured=true\|false` | Projects sorted by `position` (display order, 1 = first), with tasks, details, technologies, `kind` (`website`, `script`, `app`), `year`, `status`, `hosting`, `snippet`, `image` and `imageAlt` (`featured` = shown on the home page; personal projects have `experienceId: null`) |
| `/api/v1/skills` | | Skills by category with a recency level (`top` < 2 years, `mid`, `bottom` > 5 years; computed from experiences and personal projects, `personalOnly` when only used in personal projects) and the "Stack" list |
| `/api/v1/certificates` | | Certifications with ISO dates |
| `/api/v1/cv` | | Full public CV in one call (same data as the `/cv` page) |

**Locale** — every endpoint accepts `?lang=fr|en`. Without it, the `Accept-Language` header is used, then `fr`. The chosen locale is returned in the `Content-Language` header. The API is not localized by URL: `/en/api/…` does not exist.

**Errors** — JSON body `{ "error": { "status": 400, "message": "…" } }`: `400` for an unsupported `lang` or filter value, `404` for an unknown path.

**Headers** — `Cache-Control: public, max-age=300`, `Access-Control-Allow-Origin: *`, `Vary: Accept-Language`.

**Images** — `photo.url`, `organizationLogo` and `image` are paths relative to the site (`/media/<file>`, e.g. `https://bergmann-florian.ch/media/…`), or `null`. Files never change under a given name.

**Privacy** — private CV fields (address, birthdate, references) are never returned; the age is computed server-side.

```sh
curl "https://bergmann-florian.ch/api/v1/profile?lang=en"
curl -H "Accept-Language: en" "https://bergmann-florian.ch/api/v1/experiences?kind=job"
```

Tests: see [Tests](#tests).

Response types: [`src/lib/api/types.ts`](src/lib/api/types.ts). Data access: [`src/lib/server/content/`](src/lib/server/content/) (MariaDB, see [Database](#database)).
