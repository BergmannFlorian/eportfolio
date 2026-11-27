import { mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { writeQuery } from '#lib/server/db/index.js';
import {
	deleteMedia,
	detectMediaType,
	isMediaFile,
	listMedia,
	mediaExists,
	mediaUrl,
	readMedia,
	saveMedia
} from './storage.js';
import { mediaUsages, readSlot, writeSlot } from './targets.js';

const bytes = (text: string) => new TextEncoder().encode(text);
const WEBP = new Uint8Array([...bytes('RIFF'), 0, 0, 0, 0, ...bytes('WEBPVP8 '), 0, 0]);
const PNG = new Uint8Array([0x89, ...bytes('PNG\r\n\x1a\n'), 0, 0]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);

describe('detectMediaType', () => {
	it('recognizes the content, not the name', () => {
		expect(detectMediaType(WEBP)).toBe('webp');
		expect(detectMediaType(PNG)).toBe('png');
		expect(detectMediaType(JPEG)).toBe('jpg');
		expect(detectMediaType(bytes('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'))).toBe('svg');
		expect(detectMediaType(bytes('<?xml version="1.0"?>\n<svg viewBox="0 0 1 1"></svg>'))).toBe('svg');
		expect(detectMediaType(bytes('GIF89a'))).toBeNull();
		expect(detectMediaType(bytes('<html><body>hi</body></html>'))).toBeNull();
	});

	it('refuses SVG with active content', () => {
		expect(detectMediaType(bytes('<svg><script>alert(1)</script></svg>'))).toBeNull();
		expect(detectMediaType(bytes('<svg onload="alert(1)"></svg>'))).toBeNull();
		expect(detectMediaType(bytes('<svg><a href="javascript:alert(1)"/></svg>'))).toBeNull();
		expect(detectMediaType(bytes('<svg><foreignObject></foreignObject></svg>'))).toBeNull();
	});
});

describe('file names', () => {
	it('only accepts generated names', () => {
		expect(isMediaFile('0123456789abcdef0123456789abcdef.webp')).toBe(true);
		expect(isMediaFile('../etc/passwd')).toBe(false);
		expect(isMediaFile('0123456789abcdef0123456789abcdef.html')).toBe(false);
		expect(mediaUrl('fedcba9876543210fedcba9876543210.svg')).toBe('/media/fedcba9876543210fedcba9876543210.svg');
		expect(mediaUrl('breitling')).toBeNull();
		expect(mediaUrl(null)).toBeNull();
	});
});

describe('storage', () => {
	let dir: string;
	const previous = process.env.UPLOADS_DIR;

	beforeAll(async () => {
		dir = await mkdtemp(join(tmpdir(), 'eportfolio-uploads-'));
		process.env.UPLOADS_DIR = dir;
	});

	afterAll(async () => {
		process.env.UPLOADS_DIR = previous;
		await rm(dir, { recursive: true, force: true });
	});

	it('saves, reads and deletes a file under a random name', async () => {
		const file = await saveMedia(WEBP, 'webp');
		expect(isMediaFile(file)).toBe(true);
		expect(new Uint8Array((await readMedia(file))!)).toEqual(WEBP);
		await deleteMedia(file);
		expect(await readMedia(file)).toBeNull();
		// Deleting twice, or an invalid name, is harmless
		await deleteMedia(file);
		await deleteMedia('../../secret');
	});

	it('lists the stored files, most recent first, ignoring other names', async () => {
		const older = await saveMedia(PNG, 'png');
		await utimes(join(dir, older), new Date(2020, 0, 1), new Date(2020, 0, 1));
		const newer = await saveMedia(WEBP, 'webp');
		await writeFile(join(dir, 'notes.txt'), 'x');
		expect(await listMedia()).toEqual([
			expect.objectContaining({ file: newer, type: 'webp', size: WEBP.length }),
			expect.objectContaining({ file: older, type: 'png', size: PNG.length })
		]);
		expect(await mediaExists(newer)).toBe(true);
		expect(await mediaExists('notes.txt')).toBe(false);
		await deleteMedia(older);
		await deleteMedia(newer);
	});
});

describe('mediaUsages', () => {
	it('tells which slots show each file', async () => {
		const usages = await mediaUsages();
		expect(usages.get('0123456789abcdef0123456789abcdef.webp')).toEqual([{ target: 'portrait', name: null }]);
		expect(usages.get('abcdefabcdefabcdefabcdefabcdefab.webp')).toEqual([{ target: 'project', name: 'Acme Shop' }]);
		expect(usages.get('fedcba9876543210fedcba9876543210.svg')).toEqual([{ target: 'logo', name: 'Acme SA' }]);
	});
});

describe('image slots', () => {
	it('writes and clears a project image with its descriptions', async () => {
		const file = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp';
		await writeSlot('project', 3, file, { fr: ' Capture ', en: 'Screenshot' });
		expect(await readSlot('project', 3)).toEqual({ file, alt: { fr: 'Capture', en: 'Screenshot' } });

		await writeSlot('project', 3, null, {});
		expect(await readSlot('project', 3)).toEqual({ file: null, alt: { fr: '', en: '' } });
	});

	it('keeps the bio when the portrait description changes', async () => {
		const [before] = await writeQuery<{ bio: string }>("SELECT bio FROM person_i18n WHERE person_id = 1 AND locale = 'fr'");
		const portrait = await readSlot('portrait', null);
		await writeSlot('portrait', null, portrait!.file, { fr: 'Nouvelle description', en: 'New description' });
		const [after] = await writeQuery<{ bio: string; photo_alt: string }>(
			"SELECT bio, photo_alt FROM person_i18n WHERE person_id = 1 AND locale = 'fr'"
		);
		expect(after).toEqual({ bio: before.bio, photo_alt: 'Nouvelle description' });
		// Restore the fixture for the other test files
		await writeSlot('portrait', null, portrait!.file, { fr: 'Portrait de Jane', en: '' });
	});

	it('returns null for an unknown target id', async () => {
		expect(await readSlot('logo', 999)).toBeNull();
		expect(await readSlot('project', null)).toBeNull();
	});
});
