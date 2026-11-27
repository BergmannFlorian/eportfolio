/**
 * Uploaded files on disk, served at /media/<file>.
 *
 * - Directory: UPLOADS_DIR, default "uploads" in the working directory
 *   (REMOTE_PATH/uploads in production, outside app/, so deployments keep it).
 * - Names are random (32 hex chars) + extension: no user input reaches the file system,
 *   and a replaced image gets a new URL, so it can be cached forever.
 * - Formats: WebP (the browser converts photos before sending; PNG or JPEG when it
 *   cannot encode WebP, e.g. older Safari) and SVG (logos only).
 */

import { randomBytes } from 'node:crypto';
import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export type MediaType = 'webp' | 'png' | 'jpg' | 'svg';

const FILE_NAME = /^[0-9a-f]{32}\.(webp|png|jpg|svg)$/;

export const MEDIA_TYPES: Record<MediaType, string> = {
	webp: 'image/webp',
	png: 'image/png',
	jpg: 'image/jpeg',
	svg: 'image/svg+xml'
};

/** Largest accepted file, after the browser resized it */
export const MAX_MEDIA_BYTES = 3 * 1024 * 1024;

export function uploadsDir(): string {
	return resolve(process.env.UPLOADS_DIR || 'uploads');
}

export function isMediaFile(file: string | null | undefined): file is string {
	return !!file && FILE_NAME.test(file);
}

/** Public URL of a stored file, or null for an empty or unexpected value. */
export function mediaUrl(file: string | null | undefined): string | null {
	return isMediaFile(file) ? `/media/${file}` : null;
}

/** Recognizes the content itself (not the declared type). Returns null if not allowed. */
export function detectMediaType(bytes: Uint8Array): MediaType | null {
	const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
	if (bytes.length > 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp';
	if (bytes.length > 8 && bytes[0] === 0x89 && ascii(1, 4) === 'PNG') return 'png';
	if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';

	const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes.subarray(0, 4096)).trimStart();
	if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE[^>]*>\s*)?<svg[\s>]/i.test(text)) {
		// Served with a sandboxing CSP anyway; refuse obvious active content too
		const full = new TextDecoder().decode(bytes);
		if (/<script|javascript:|\son[a-z]+\s*=|<foreignObject/i.test(full)) return null;
		return 'svg';
	}
	return null;
}

export async function saveMedia(bytes: Uint8Array, type: MediaType): Promise<string> {
	const file = `${randomBytes(16).toString('hex')}.${type}`;
	await mkdir(uploadsDir(), { recursive: true });
	await writeFile(join(uploadsDir(), file), bytes, { flag: 'wx' });
	return file;
}

export async function readMedia(file: string): Promise<Buffer | null> {
	if (!isMediaFile(file)) return null;
	try {
		return await readFile(join(uploadsDir(), file));
	} catch {
		return null;
	}
}

export interface StoredMedia {
	file: string;
	type: MediaType;
	size: number;
	/** Last change, ms since epoch */
	modified: number;
}

/** Every stored file, most recent first (the image library of the editor). */
export async function listMedia(): Promise<StoredMedia[]> {
	let names: string[];
	try {
		names = await readdir(uploadsDir());
	} catch {
		return [];
	}
	const files = await Promise.all(
		names.filter(isMediaFile).map(async (file): Promise<StoredMedia | null> => {
			try {
				const info = await stat(join(uploadsDir(), file));
				if (!info.isFile()) return null;
				return { file, type: mediaType(file), size: info.size, modified: info.mtimeMs };
			} catch {
				return null;
			}
		})
	);
	return files.filter((entry) => entry !== null).sort((a, b) => b.modified - a.modified);
}

export async function mediaExists(file: string): Promise<boolean> {
	if (!isMediaFile(file)) return false;
	try {
		return (await stat(join(uploadsDir(), file))).isFile();
	} catch {
		return false;
	}
}

/** Type of a stored file, from its generated extension. */
export function mediaType(file: string): MediaType {
	return file.slice(file.lastIndexOf('.') + 1) as MediaType;
}

/** Removes a file; missing files are ignored (the database is the source of truth). */
export async function deleteMedia(file: string | null | undefined): Promise<void> {
	if (!isMediaFile(file)) return;
	try {
		await unlink(join(uploadsDir(), file));
	} catch {
		// already gone
	}
}
