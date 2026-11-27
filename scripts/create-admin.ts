/**
 * Creates (or resets) the admin account: `npm run admin:create [email]`.
 *
 * Asks for the password, generates a TOTP secret, shows it as a QR code to scan
 * with an authenticator app, checks one code, then prints the SQL to run on the
 * database (phpMyAdmin in production). It can also apply it to the local Docker
 * database from .env.
 *
 * Runs with Node's built-in TypeScript support: it only imports modules without
 * path aliases (password.ts and totp.ts use node built-ins only).
 */

import { existsSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import QRCode from 'qrcode';
import { hashPassword } from '../src/lib/server/auth/password.ts';
import { generateSecret, otpauthUri, verifyCode } from '../src/lib/server/auth/totp.ts';

const ISSUER = 'bergmann-florian.ch';
const MIN_PASSWORD_LENGTH = 12;

// Without a terminal (piped input), one shared reader so no line is lost between questions
let pipedLines: AsyncIterator<string> | null = null;

async function readPipedLine(question: string): Promise<string> {
	stdout.write(question + ' ');
	pipedLines ??= createInterface({ input: stdin })[Symbol.asyncIterator]();
	const line = await pipedLines.next();
	stdout.write('\n');
	if (line.done) throw new Error('No more input');
	return line.value;
}

/** Reads a line without echoing it (visible when there is no terminal). */
function askHidden(question: string): Promise<string> {
	if (!stdin.isTTY) return readPipedLine(question);
	stdout.write(question + ' ');
	return new Promise((resolve) => {
		let value = '';
		stdin.setRawMode(true);
		stdin.resume();
		stdin.setEncoding('utf8');
		const onData = (chunk: string) => {
			for (const char of chunk) {
				if (char === '\r' || char === '\n') {
					stdin.setRawMode(false);
					stdin.pause();
					stdin.off('data', onData);
					stdout.write('\n');
					resolve(value);
					return;
				}
				if (char === '\u0003') process.exit(130); // Ctrl+C
				if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
				else value += char;
			}
		};
		stdin.on('data', onData);
	});
}

async function ask(question: string): Promise<string> {
	if (!stdin.isTTY) return (await readPipedLine(question)).trim();
	const rl = createInterface({ input: stdin, output: stdout });
	try {
		return (await rl.question(question + ' ')).trim();
	} finally {
		rl.close();
	}
}

const sqlString = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;

async function main() {
	const email = (process.argv[2] ?? (await ask('Admin email:'))).trim().toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email address');

	const password = await askHidden(`Password (${MIN_PASSWORD_LENGTH}+ characters):`);
	if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`The password needs at least ${MIN_PASSWORD_LENGTH} characters`);
	if ((await askHidden('Repeat the password:')) !== password) throw new Error('The passwords do not match');

	const secret = generateSecret();
	const uri = otpauthUri(secret, email, ISSUER);
	console.log('\nScan this QR code with your authenticator app (Aegis, Google Authenticator, 1Password…):\n');
	console.log(await QRCode.toString(uri, { type: 'terminal', small: true }));
	console.log(`Or enter this key by hand: ${secret}\n`);

	for (let attempt = 1; ; attempt++) {
		const code = await ask('Enter the 6-digit code shown by the app to check it:');
		if (verifyCode(secret, code, null) !== null) break;
		if (attempt === 3) throw new Error('Wrong code three times: check the time on your phone and start again');
		console.log('Wrong code, try again.');
	}

	const sql = `INSERT INTO admin_user (email, password_hash, totp_secret)
VALUES (${sqlString(email)}, ${sqlString(await hashPassword(password))}, ${sqlString(secret)})
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), totp_secret = VALUES(totp_secret),
	totp_last_step = NULL, failed_attempts = 0, locked_until = NULL;
DELETE s FROM admin_session s JOIN admin_user u ON u.id = s.user_id WHERE u.email = ${sqlString(email)};`;

	console.log('\nSQL to run on the database (phpMyAdmin in production). Keep it private: it contains the 2FA key.\n');
	console.log(sql + '\n');

	if (existsSync('.env') && (await ask('Apply it to the local database from .env now? [y/N]')).toLowerCase() === 'y') {
		process.loadEnvFile('.env');
		const { default: mariadb } = await import('mariadb');
		const connection = await mariadb.createConnection({
			host: process.env.DB_HOST,
			port: Number(process.env.DB_PORT || 3306),
			user: process.env.DB_WRITE_USER || process.env.DB_USER,
			password: (process.env.DB_WRITE_USER ? process.env.DB_WRITE_PASSWORD : process.env.DB_PASSWORD) ?? '',
			database: process.env.DB_NAME,
			multipleStatements: true
		});
		try {
			await connection.query(sql);
			console.log(`Admin account saved in ${process.env.DB_NAME} on ${process.env.DB_HOST}.`);
		} finally {
			await connection.end();
		}
	}
}

main().catch((error: unknown) => {
	console.error(`\n${error instanceof Error ? error.message : error}`);
	process.exit(1);
});
