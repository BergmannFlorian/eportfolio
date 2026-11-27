import { error, json } from '@sveltejs/kit';
import type { LibraryImage } from '#lib/media/library.js';
import { deleteMedia, isMediaFile, listMedia, mediaUrl } from '#lib/server/media/storage.js';
import { mediaUsages } from '#lib/server/media/targets.js';
import type { RequestHandler } from './$types';

// Every uploaded file, to reuse one in another slot or delete the unused ones.
// Behind the admin session like the rest of /admin (src/hooks.server.ts).

export const GET: RequestHandler = async () => {
	const [files, usages] = await Promise.all([listMedia(), mediaUsages()]);
	const images: LibraryImage[] = files.map(({ file, type, size }) => ({
		file,
		url: mediaUrl(file)!,
		type,
		size,
		usedBy: usages.get(file) ?? []
	}));
	return json(images, { headers: { 'Cache-Control': 'no-store' } });
};

/** Deletes an unused file: ?file=<name>. A file still shown somewhere is refused (409). */
export const DELETE: RequestHandler = async ({ url }) => {
	const file = url.searchParams.get('file');
	if (!isMediaFile(file)) error(400, 'Invalid file');
	if ((await mediaUsages()).has(file)) error(409, 'File in use');
	await deleteMedia(file);
	return json({ ok: true });
};
