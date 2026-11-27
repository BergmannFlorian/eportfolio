/**
 * Time-based one-time passwords (RFC 6238: HMAC-SHA1, 6 digits, 30 s steps),
 * compatible with Google Authenticator, Aegis, 1Password…
 *
 * Only imports node built-ins so scripts/create-admin.ts can run it directly with Node.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const STEP_SECONDS = 30;
const DIGITS = 6;
/** Accepted clock drift, in steps on each side */
const WINDOW = 1;
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(bytes: Buffer): string {
	let bits = 0;
	let value = 0;
	let output = '';
	for (const byte of bytes) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			output += BASE32[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}
	if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
	return output;
}

export function base32Decode(text: string): Buffer {
	const clean = text.toUpperCase().replace(/[\s=]/g, '');
	let bits = 0;
	let value = 0;
	const bytes: number[] = [];
	for (const char of clean) {
		const index = BASE32.indexOf(char);
		if (index === -1) throw new Error('Invalid base32 character');
		value = (value << 5) | index;
		bits += 5;
		if (bits >= 8) {
			bytes.push((value >>> (bits - 8)) & 255);
			bits -= 8;
		}
	}
	return Buffer.from(bytes);
}

/** New random secret (160 bits, the RFC 4226 recommendation), base32-encoded. */
export function generateSecret(): string {
	return base32Encode(randomBytes(20));
}

export function timeStep(now = Date.now()): number {
	return Math.floor(now / 1000 / STEP_SECONDS);
}

/** Code for a given time step (HOTP, RFC 4226). */
export function codeAt(secret: string, step: number, digits = DIGITS): string {
	const counter = Buffer.alloc(8);
	counter.writeBigUInt64BE(BigInt(step));
	const hmac = createHmac('sha1', base32Decode(secret)).update(counter).digest();
	const offset = hmac[hmac.length - 1] & 15;
	const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
	return String(binary % 10 ** digits).padStart(digits, '0');
}

/**
 * Checks a code against the current step ± WINDOW. Returns the matched step, or
 * null when the code is wrong or belongs to a step at or before `lastStep` (replay).
 */
export function verifyCode(
	secret: string,
	code: string,
	lastStep: number | null,
	now = Date.now()
): number | null {
	const input = code.replace(/\s/g, '');
	if (!/^\d{6}$/.test(input)) return null;
	const current = timeStep(now);
	for (let step = current - WINDOW; step <= current + WINDOW; step++) {
		if (lastStep !== null && step <= lastStep) continue;
		if (timingSafeEqual(Buffer.from(codeAt(secret, step)), Buffer.from(input))) return step;
	}
	return null;
}

/** otpauth:// URI to scan with an authenticator app. */
export function otpauthUri(secret: string, account: string, issuer: string): string {
	const label = encodeURIComponent(`${issuer}:${account}`);
	const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: String(DIGITS), period: String(STEP_SECONDS) });
	return `otpauth://totp/${label}?${params}`;
}
