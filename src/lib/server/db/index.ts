import mariadb, { type Pool } from 'mariadb';

/**
 * MariaDB connection pool, configured from DB_* environment variables:
 * - dev / tests: loaded from .env (and .env.test) by vite.config.ts
 * - production: loaded from REMOTE_PATH/.env by deploy/launcher.js
 */

const REQUIRED = ['DB_HOST', 'DB_USER', 'DB_NAME'] as const;

let pool: Pool | null = null;

function createPool(): Pool {
	const missing = REQUIRED.filter((key) => !process.env[key]);
	if (missing.length) {
		throw new Error(`Missing database configuration: ${missing.join(', ')} (see .env.example)`);
	}
	return mariadb.createPool({
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT || 3306),
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD ?? '',
		database: process.env.DB_NAME,
		connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
		connectTimeout: 3_000,
		acquireTimeout: 5_000,
		// DATE columns as 'YYYY-MM-DD' strings, counts as plain numbers
		dateStrings: true,
		bigIntAsNumber: true
	});
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
	pool ??= createPool();
	const rows = await pool.query(sql, params);
	return rows as T[];
}

/** Closes the pool; the next query opens a new one with the current environment (used by tests). */
export async function resetPool(): Promise<void> {
	const current = pool;
	pool = null;
	await current?.end();
}
