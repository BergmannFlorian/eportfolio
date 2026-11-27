import { beforeEach, describe, expect, it } from 'vitest';
import { writeQuery } from '#lib/server/db/index.js';
import { MAX_ATTEMPTS, checkCode, checkPassword, deleteSession, getSession } from './index.js';
import { hashPassword, verifyPassword } from './password.js';
import { base32Decode, base32Encode, codeAt, timeStep, verifyCode } from './totp.js';

// RFC 6238 test secret: ASCII "12345678901234567890"
const RFC_SECRET = base32Encode(Buffer.from('12345678901234567890'));

describe('password', () => {
	it('verifies the right password only', async () => {
		const hash = await hashPassword('correct horse battery staple');
		expect(hash).toMatch(/^scrypt\$32768\$8\$1\$/);
		expect(await verifyPassword('correct horse battery staple', hash)).toBe(true);
		expect(await verifyPassword('wrong password', hash)).toBe(false);
	});

	it('uses a new salt for each hash', async () => {
		expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
	});

	it('rejects a malformed stored hash without throwing', async () => {
		expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
		expect(await verifyPassword('x', 'scrypt$1$1$1$$')).toBe(false);
	});
});

describe('totp', () => {
	it('round-trips base32', () => {
		const bytes = Buffer.from([0, 1, 2, 250, 251, 252, 253, 254, 255]);
		expect(base32Decode(base32Encode(bytes))).toEqual(bytes);
		expect(RFC_SECRET).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
	});

	it('matches the RFC 6238 SHA-1 test vectors', () => {
		expect(codeAt(RFC_SECRET, timeStep(59_000), 8)).toBe('94287082');
		expect(codeAt(RFC_SECRET, timeStep(1_111_111_109_000), 8)).toBe('07081804');
		expect(codeAt(RFC_SECRET, timeStep(1_234_567_890_000), 8)).toBe('89005924');
	});

	it('accepts one step of clock drift and refuses replays', () => {
		const now = 1_700_000_000_000;
		const step = timeStep(now);
		expect(verifyCode(RFC_SECRET, codeAt(RFC_SECRET, step), null, now)).toBe(step);
		expect(verifyCode(RFC_SECRET, codeAt(RFC_SECRET, step - 1), null, now)).toBe(step - 1);
		expect(verifyCode(RFC_SECRET, codeAt(RFC_SECRET, step - 2), null, now)).toBeNull();
		// Already used step
		expect(verifyCode(RFC_SECRET, codeAt(RFC_SECRET, step), step, now)).toBeNull();
		expect(verifyCode(RFC_SECRET, 'abcdef', null, now)).toBeNull();
	});
});

describe('login flow', () => {
	const email = 'admin@example.com';
	const password = 'a long test password';

	beforeEach(async () => {
		await writeQuery('DELETE FROM admin_user');
		await writeQuery('INSERT INTO admin_user (email, password_hash, totp_secret) VALUES (?, ?, ?)', [
			email,
			await hashPassword(password),
			RFC_SECRET
		]);
	});

	const currentCode = () => codeAt(RFC_SECRET, timeStep());

	it('logs in with the password, then the code', async () => {
		const pending = await checkPassword(' Admin@Example.com ', password);
		expect(pending.ok).toBe(true);
		if (!pending.ok) return;
		expect(await getSession(pending.token)).toMatchObject({ email, stage: 'pending' });

		const full = await checkCode(pending.token, currentCode());
		expect(full.ok).toBe(true);
		if (!full.ok) return;
		expect(await getSession(full.token)).toMatchObject({ email, stage: 'full' });
		// The pending session is consumed
		expect(await getSession(pending.token)).toBeNull();

		await deleteSession(full.token);
		expect(await getSession(full.token)).toBeNull();
	});

	it('gives the same error for an unknown email and a wrong password', async () => {
		expect(await checkPassword('nobody@example.com', password)).toEqual({ ok: false, reason: 'invalid' });
		expect(await checkPassword(email, 'wrong')).toEqual({ ok: false, reason: 'invalid' });
	});

	it('refuses a wrong code, a replayed code and an unknown session', async () => {
		const first = await checkPassword(email, password);
		if (!first.ok) throw new Error('password step failed');
		expect(await checkCode(first.token, '000000')).toEqual({ ok: false, reason: 'invalid' });
		const code = currentCode();
		expect((await checkCode(first.token, code)).ok).toBe(true);

		const second = await checkPassword(email, password);
		if (!second.ok) throw new Error('password step failed');
		expect(await checkCode(second.token, code)).toEqual({ ok: false, reason: 'invalid' });
		expect(await checkCode('unknown-token', code)).toEqual({ ok: false, reason: 'expired' });
	});

	it(`locks the account after ${MAX_ATTEMPTS} failures`, async () => {
		for (let i = 1; i < MAX_ATTEMPTS; i++) {
			expect(await checkPassword(email, 'wrong')).toEqual({ ok: false, reason: 'invalid' });
		}
		expect(await checkPassword(email, 'wrong')).toEqual({ ok: false, reason: 'locked' });
		// Even the right password is refused while locked
		expect(await checkPassword(email, password)).toEqual({ ok: false, reason: 'locked' });
	});

	it('counts wrong codes towards the lock and drops the pending session', async () => {
		const pending = await checkPassword(email, password);
		if (!pending.ok) throw new Error('password step failed');
		for (let i = 1; i < MAX_ATTEMPTS; i++) {
			expect(await checkCode(pending.token, '000000')).toEqual({ ok: false, reason: 'invalid' });
		}
		expect(await checkCode(pending.token, '000000')).toEqual({ ok: false, reason: 'locked' });
		expect(await getSession(pending.token)).toBeNull();
	});

	it('stores only a hash of the session token', async () => {
		const pending = await checkPassword(email, password);
		if (!pending.ok) throw new Error('password step failed');
		const rows = await writeQuery<{ id: string }>('SELECT id FROM admin_session');
		expect(rows.map((row) => row.id)).not.toContain(pending.token);
		expect(rows[0].id).toMatch(/^[0-9a-f]{64}$/);
	});
});
