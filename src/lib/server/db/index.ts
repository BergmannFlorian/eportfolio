import mariadb, { type Pool } from 'mariadb';

/**
 * MariaDB connection pools, configured from DB_* environment variables:
 * - dev / tests: loaded from .env (and .env.test) by vite.config.ts
 * - production: loaded from REMOTE_PATH/.env by deploy/launcher.js
 *
 * Two accounts on the same database:
 * - `query`: DB_USER / DB_PASSWORD, read-only, for the public content (site, CV, API)
 * - `writeQuery`: DB_WRITE_USER / DB_WRITE_PASSWORD, for the administration
 *   (login, sessions, editing). Falls back to DB_USER when unset (local Docker, tests).
 */

const REQUIRED = ['DB_HOST', 'DB_USER', 'DB_NAME'] as const;

type Access = 'read' | 'write';

const pools: Record<Access, Pool | null> = { read: null, write: null };

function createPool(access: Access): Pool {
	const missing = REQUIRED.filter((key) => !process.env[key]);
	if (missing.length) {
		throw new Error(`Missing database configuration: ${missing.join(', ')} (see .env.example)`);
	}
	const writeUser = access === 'write' ? process.env.DB_WRITE_USER : undefined;
	return mariadb.createPool({
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT || 3306),
		user: writeUser || process.env.DB_USER,
		password: (writeUser ? process.env.DB_WRITE_PASSWORD : process.env.DB_PASSWORD) ?? '',
		database: process.env.DB_NAME,
		// The admin needs few connections
		connectionLimit: access === 'write' ? 2 : Number(process.env.DB_CONNECTION_LIMIT || 5),
		connectTimeout: 3_000,
		acquireTimeout: 5_000,
		// DATE columns as 'YYYY-MM-DD' strings, counts as plain numbers
		dateStrings: true,
		bigIntAsNumber: true
	});
}

async function run<T>(access: Access, sql: string, params: unknown[]): Promise<T[]> {
	pools[access] ??= createPool(access);
	const rows = await pools[access].query(sql, params);
	return rows as T[];
}

/** Read-only account: public content. */
export function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
	return run<T>('read', sql, params);
}

/** Write account: administration only (login, sessions, content editing). */
export function writeQuery<T>(sql: string, params: unknown[] = []): Promise<T[]> {
	return run<T>('write', sql, params);
}

export interface Transaction {
	query<T>(sql: string, params?: unknown[]): Promise<T[]>;
	/** Runs an INSERT and returns the new AUTO_INCREMENT id */
	insert(sql: string, params?: unknown[]): Promise<number>;
}

/**
 * Write account, all statements in one transaction: committed when `work` resolves,
 * rolled back when it throws (the error is rethrown).
 */
export async function writeTransaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
	pools.write ??= createPool('write');
	const connection = await pools.write.getConnection();
	try {
		await connection.beginTransaction();
		const result = await work({
			query: async <R>(sql: string, params: unknown[] = []) => (await connection.query(sql, params)) as R[],
			insert: async (sql, params = []) => Number(((await connection.query(sql, params)) as { insertId: number }).insertId)
		});
		await connection.commit();
		return result;
	} catch (error) {
		await connection.rollback().catch(() => {});
		throw error;
	} finally {
		await connection.release();
	}
}

/** Closes the pools; the next query opens new ones with the current environment (used by tests). */
export async function resetPool(): Promise<void> {
	const current = Object.values(pools);
	pools.read = null;
	pools.write = null;
	await Promise.all(current.map((pool) => pool?.end()));
}
