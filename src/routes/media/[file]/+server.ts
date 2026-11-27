import { error } from '@sveltejs/kit';
import { MEDIA_TYPES, isMediaFile, mediaType, readMedia } from '#lib/server/media/storage.js';
import type { RequestHandler } from './$types';

// Uploaded images. A file never changes under its name: cache forever.
export const GET: RequestHandler = async ({ params }) => {
	if (!isMediaFile(params.file)) error(404, 'Not found');
	const bytes = await readMedia(params.file);
	if (!bytes) error(404, 'Not found');

	const type = MEDIA_TYPES[mediaType(params.file)];
	return new Response(new Uint8Array(bytes), {
		headers: {
			'Content-Type': type,
			'Content-Length': String(bytes.length),
			'Cache-Control': 'public, max-age=31536000, immutable',
			'X-Content-Type-Options': 'nosniff',
			// An SVG opened directly can never run scripts or load anything
			'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox"
		}
	});
};
