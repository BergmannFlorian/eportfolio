/**
 * Password hashing with scrypt (node:crypto, no dependency).
 * Stored format: "scrypt$N$r$p$salt$hash", salt and hash in base64url.
 *
 * Only imports node built-ins so scripts/create-admin.ts can run it directly with Node.
 */

import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
// scrypt needs 128 * N * r bytes (32 MiB here); Node's default limit is 32 MiB
const MAX_MEMORY = 64 * 1024 * 1024;

function derive(password: string, salt: Buffer, options: ScryptOptions, length: number): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		scrypt(password.normalize('NFKC'), salt, length, options, (error, key) =>
			error ? reject(error) : resolve(key)
		);
	});
}

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(SALT_LENGTH);
	const key = await derive(password, salt, { N, r: R, p: P, maxmem: MAX_MEMORY }, KEY_LENGTH);
	return ['scrypt', N, R, P, salt.toString('base64url'), key.toString('base64url')].join('$');
}

/** Constant-time check; false (never an exception) for a malformed stored hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [algorithm, n, r, p, salt, hash] = stored.split('$');
	if (algorithm !== 'scrypt' || !salt || !hash) return false;
	const expected = Buffer.from(hash, 'base64url');
	try {
		const key = await derive(
			password,
			Buffer.from(salt, 'base64url'),
			{ N: Number(n), r: Number(r), p: Number(p), maxmem: MAX_MEMORY },
			expected.length
		);
		return timingSafeEqual(key, expected);
	} catch {
		return false;
	}
}
