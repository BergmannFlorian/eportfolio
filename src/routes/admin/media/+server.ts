import { error, json } from '@sveltejs/kit';
import { locales } from '#lib/paraglide/runtime.js';
import { clearContentCache } from '#lib/server/content/index.js';
import { MAX_MEDIA_BYTES, detectMediaType, mediaExists, mediaType, saveMedia } from '#lib/server/media/storage.js';
import { HAS_ALT, IMAGE_TARGETS, readSlot, writeSlot, type ImageTarget } from '#lib/server/media/targets.js';
import type { RequestHandler } from './$types';

// Image editor of the site pages. Only reachable with a full admin session
// (src/hooks.server.ts); cross-site posts are refused by SvelteKit's origin check.

function parseTarget(target: string | null, rawId: string | null): { target: ImageTarget; id: number | null } {
	if (!target || !IMAGE_TARGETS.includes(target as ImageTarget)) error(400, 'Unknown target');
	if (target === 'portrait') return { target, id: null };
	const id = Number(rawId);
	if (!Number.isInteger(id) || id <= 0) error(400, 'Invalid id');
	return { target: target as ImageTarget, id };
}

/** Current file and descriptions, to fill the editor. */
export const GET: RequestHandler = async ({ url }) => {
	const { target, id } = parseTarget(url.searchParams.get('target'), url.searchParams.get('id'));
	const slot = await readSlot(target, id);
	if (!slot) error(404, 'Not found');
	return json(
		{ hasImage: slot.file !== null, file: slot.file, alt: slot.alt },
		{ headers: { 'Cache-Control': 'no-store' } }
	);
};

/**
 * Multipart form: target, id, action ("save" | "remove"), alt_<locale>, and the image:
 * either a new upload (file) or a file of the library (existing). Neither when only the
 * descriptions change. Replaced or removed files stay in the library
 * (deleted from there: ./library).
 */
export const POST: RequestHandler = async ({ request }) => {
	const form = await request.formData();
	const { target, id } = parseTarget(form.get('target') as string | null, form.get('id') as string | null);
	const slot = await readSlot(target, id);
	if (!slot) error(404, 'Not found');

	if (form.get('action') === 'remove') {
		await writeSlot(target, id, null, {});
		clearContentCache();
		return json({ ok: true });
	}

	const alt = HAS_ALT[target]
		? Object.fromEntries(locales.map((locale) => [locale, String(form.get(`alt_${locale}`) ?? '')]))
		: {};

	const upload = form.get('file');
	const existing = form.get('existing');
	let file = slot.file;
	if (upload instanceof File && upload.size > 0) {
		if (upload.size > MAX_MEDIA_BYTES) error(413, 'File too large');
		const bytes = new Uint8Array(await upload.arrayBuffer());
		const type = detectMediaType(bytes);
		// Photos arrive resized by the browser (WebP, or PNG/JPEG as fallback); SVG only for logos
		if (!type || (type === 'svg' && target !== 'logo')) error(415, 'Unsupported image');
		file = await saveMedia(bytes, type);
	} else if (typeof existing === 'string' && existing !== '') {
		if (!(await mediaExists(existing))) error(404, 'Unknown file');
		if (mediaType(existing) === 'svg' && target !== 'logo') error(415, 'Unsupported image');
		file = existing;
	}
	if (!file) error(400, 'No image');

	await writeSlot(target, id, file, alt);
	clearContentCache();
	return json({ ok: true });
};
