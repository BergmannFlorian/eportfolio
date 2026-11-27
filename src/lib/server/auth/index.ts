/**
 * Admin authentication: email + password, then a TOTP code.
 *
 * - One account (created with `npm run admin:create`, no sign-up page).
 * - Sessions live in admin_session; the cookie holds a random token and the
 *   table only its SHA-256, so a database leak does not give a session.
 * - After the password, a short "pending" session waits for the TOTP code.
 * - MAX_ATTEMPTS wrong passwords or codes lock the account for LOCK_MINUTES.
 *   The error never says which field was wrong, nor whether the email exists.
 * - Expiry is computed by MariaDB (NOW()) to avoid time zone mismatches.
 * - Uses the write account (DB_WRITE_USER): the public read-only account never sees these tables.
 */

import { createHash, randomBytes } from 'node:crypto';
import { writeQuery } from '#lib/server/db/index.js';
import { hashPassword, verifyPassword } from './password.js';
import { verifyCode } from './totp.js';

export const SESSION_COOKIE = 'admin_session';
export const PENDING_SECONDS = 5 * 60;
export const SESSION_SECONDS = 8 * 60 * 60;
export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export interface AdminSession {
	userId: number;
	email: string;
	stage: 'pending' | 'full';
}

export type LoginFailure = 'invalid' | 'locked' | 'expired';
export type LoginResult = { ok: true; token: string } | { ok: false; reason: LoginFailure };

const digest = (token: string) => createHash('sha256').update(token).digest('hex');

// Hash checked when the email is unknown, so the response time does not reveal it
let dummyHash: Promise<string> | null = null;

async function createSession(userId: number, stage: AdminSession['stage']): Promise<string> {
	const token = randomBytes(32).toString('base64url');
	const seconds = stage === 'pending' ? PENDING_SECONDS : SESSION_SECONDS;
	await writeQuery(
		'INSERT INTO admin_session (id, user_id, stage, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))',
		[digest(token), userId, stage, seconds]
	);
	return token;
}

/** Counts a failure; locks the account when it reaches MAX_ATTEMPTS. Returns true if now locked. */
async function registerFailure(userId: number): Promise<boolean> {
	// MariaDB applies SET assignments left to right: locked_until reads the old counter
	await writeQuery(
		`UPDATE admin_user SET
			locked_until = IF(failed_attempts + 1 >= ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), locked_until),
			failed_attempts = IF(failed_attempts + 1 >= ?, 0, failed_attempts + 1)
		WHERE id = ?`,
		[MAX_ATTEMPTS, LOCK_MINUTES, MAX_ATTEMPTS, userId]
	);
	const [row] = await writeQuery<{ locked: number }>(
		'SELECT COALESCE(locked_until > NOW(), 0) AS locked FROM admin_user WHERE id = ?',
		[userId]
	);
	return Number(row?.locked) === 1;
}

/** Step 1: email + password. On success, returns a pending session token. */
export async function checkPassword(email: string, password: string): Promise<LoginResult> {
	await writeQuery('DELETE FROM admin_session WHERE expires_at <= NOW()');
	const [user] = await writeQuery<{ id: number; password_hash: string; locked: number }>(
		`SELECT id, password_hash, COALESCE(locked_until > NOW(), 0) AS locked
		FROM admin_user WHERE email = ?`,
		[email.trim().toLowerCase()]
	);
	if (!user) {
		dummyHash ??= hashPassword(randomBytes(16).toString('hex'));
		await verifyPassword(password, await dummyHash);
		return { ok: false, reason: 'invalid' };
	}
	if (Number(user.locked) === 1) return { ok: false, reason: 'locked' };
	if (!(await verifyPassword(password, user.password_hash))) {
		return { ok: false, reason: (await registerFailure(user.id)) ? 'locked' : 'invalid' };
	}
	return { ok: true, token: await createSession(user.id, 'pending') };
}

/** Step 2: TOTP code for a pending session. On success, returns a full session token. */
export async function checkCode(pendingToken: string, code: string, now = Date.now()): Promise<LoginResult> {
	const [row] = await writeQuery<{ user_id: number; totp_secret: string; totp_last_step: number | null; locked: number }>(
		`SELECT s.user_id, u.totp_secret, u.totp_last_step, COALESCE(u.locked_until > NOW(), 0) AS locked
		FROM admin_session s JOIN admin_user u ON u.id = s.user_id
		WHERE s.id = ? AND s.stage = 'pending' AND s.expires_at > NOW()`,
		[digest(pendingToken)]
	);
	if (!row) return { ok: false, reason: 'expired' };

	const fail = async (reason: LoginFailure): Promise<LoginResult> => {
		if (reason === 'locked') await deleteSession(pendingToken);
		return { ok: false, reason };
	};
	if (Number(row.locked) === 1) return fail('locked');

	const step = verifyCode(row.totp_secret, code, row.totp_last_step === null ? null : Number(row.totp_last_step), now);
	if (step === null) return fail((await registerFailure(row.user_id)) ? 'locked' : 'invalid');

	await writeQuery(
		'UPDATE admin_user SET totp_last_step = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?',
		[step, row.user_id]
	);
	await deleteSession(pendingToken);
	return { ok: true, token: await createSession(row.user_id, 'full') };
}

export async function getSession(token: string): Promise<AdminSession | null> {
	const [row] = await writeQuery<{ user_id: number; email: string; stage: AdminSession['stage'] }>(
		`SELECT s.user_id, u.email, s.stage
		FROM admin_session s JOIN admin_user u ON u.id = s.user_id
		WHERE s.id = ? AND s.expires_at > NOW()`,
		[digest(token)]
	);
	return row ? { userId: row.user_id, email: row.email, stage: row.stage } : null;
}

export async function deleteSession(token: string): Promise<void> {
	await writeQuery('DELETE FROM admin_session WHERE id = ?', [digest(token)]);
}
