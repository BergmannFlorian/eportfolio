// Vitest global setup: rebuilds the test database before the test run.
// DB_* variables come from .env.test (or the CI environment), see vite.config.ts.

import { readFileSync } from 'node:fs';
import mariadb from 'mariadb';

export default async function setup() {
	const database = process.env.DB_NAME ?? '';
	// Safety net: this drops every table of the target database
	if (!database.endsWith('_test')) {
		throw new Error(`Refusing to reset "${database}": the test database name must end with "_test"`);
	}

	const connection = await mariadb.createConnection({
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT || 3306),
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD ?? '',
		multipleStatements: true
	});

	try {
		await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
		await connection.query(`USE \`${database}\``);

		const tables: { name: string }[] = await connection.query(
			'SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ?',
			[database]
		);
		await connection.query('SET FOREIGN_KEY_CHECKS = 0');
		for (const { name } of tables) await connection.query(`DROP TABLE \`${name}\``);
		await connection.query('SET FOREIGN_KEY_CHECKS = 1');

		await connection.query(readFileSync('db/schema.sql', 'utf8'));
		await connection.query(readFileSync('db/test/fixtures.sql', 'utf8'));
	} finally {
		await connection.end();
	}
}
