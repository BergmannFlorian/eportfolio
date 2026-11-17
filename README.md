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
- Connection: copy [`.env.example`](.env.example) to `.env` and fill in `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. The dev server and the tests load it through `vite.config.ts`.
- Private columns (address, birthdate, references) are never selected, except the birthdate turned into an age.

## Tests

`npm test` runs Vitest against a **test database** described in [`.env.test`](.env.test) (override locally in `.env.test.local`). Before the run, [`db/test/setup.ts`](db/test/setup.ts) drops every table of that database (its name must end with `_test`), then loads `db/schema.sql` and the fictitious data of [`db/test/fixtures.sql`](db/test/fixtures.sql).

- [`src/routes/api/v1/api.test.ts`](src/routes/api/v1/api.test.ts): status codes, headers, locale resolution and fallback, filters, stable ids, links between resources, absence of private data, JSON 500 when the database is down.
- [`src/lib/server/content/content.test.ts`](src/lib/server/content/content.test.ts): home page data and the CV page format.

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

## API

Public, read-only JSON API served by the same Node server, under `/api/v1`. All endpoints answer `GET` only.

| Endpoint | Query | Returns |
| --- | --- | --- |
| `/api/v1` | | API index: version, locales, endpoint list |
| `/api/v1/profile` | | Contact, age, bio, about, social links, facts, spoken languages, hobbies |
| `/api/v1/experiences` | `kind=job\|education` | Jobs and education with ISO dates, tasks, skills and linked project ids |
| `/api/v1/projects` | `featured=true\|false` | Projects with tasks and details (`featured` = home page "Work" grid) |
| `/api/v1/skills` | | Skills by category with a recency level (`top`, `mid`, `bottom`) and the "Stack" list |
| `/api/v1/certificates` | | Certifications with ISO dates |
| `/api/v1/cv` | | Full public CV in one call (same data as the `/cv` page) |

**Locale** — every endpoint accepts `?lang=fr|en`. Without it, the `Accept-Language` header is used, then `fr`. The chosen locale is returned in the `Content-Language` header. The API is not localized by URL: `/en/api/…` does not exist.

**Errors** — JSON body `{ "error": { "status": 400, "message": "…" } }`: `400` for an unsupported `lang` or filter value, `404` for an unknown path.

**Headers** — `Cache-Control: public, max-age=300`, `Access-Control-Allow-Origin: *`, `Vary: Accept-Language`.

**Privacy** — private CV fields (address, birthdate, references) are never returned; the age is computed server-side.

```sh
curl "https://bergmann-florian.ch/api/v1/profile?lang=en"
curl -H "Accept-Language: en" "https://bergmann-florian.ch/api/v1/experiences?kind=job"
```

Tests: see [Tests](#tests).

Response types: [`src/lib/api/types.ts`](src/lib/api/types.ts). Data access: [`src/lib/server/content/`](src/lib/server/content/) (MariaDB, see [Database](#database)).
