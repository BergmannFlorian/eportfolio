import { error, json } from '@sveltejs/kit';
import { EDIT_SECTIONS, type EditSection } from '#lib/content/edit.js';
import { clearContentCache } from '#lib/server/content/index.js';
import { EditError, parseSection, readSection, removeFromSection, writeSection } from '#lib/server/edit/index.js';
import type { RequestHandler } from './$types';

// Content editor of the site pages: GET the current content of a section, POST it back,
// DELETE one item. ?id= selects the item of the sections editing one at a time
// (project, experience; none on POST: a new one).
// Behind the admin session (src/hooks.server.ts). JSON only: a cross-site page cannot
// send it without a CORS preflight, which this route never answers.

function section(name: string): EditSection {
	if (!EDIT_SECTIONS.includes(name as EditSection)) error(404, 'Unknown section');
	return name as EditSection;
}

function rowId(url: URL): number | null {
	const raw = url.searchParams.get('id');
	if (raw === null) return null;
	const id = Number(raw);
	if (!Number.isInteger(id) || id <= 0) error(400, 'Invalid id');
	return id;
}

/** EditError → its HTTP status, anything else is rethrown (500) */
async function run<T>(work: () => Promise<T>, status?: 404): Promise<T> {
	try {
		return await work();
	} catch (cause) {
		if (cause instanceof EditError) error(status ?? cause.status, cause.message);
		throw cause;
	}
}

export const GET: RequestHandler = async ({ params, url }) => {
	const name = section(params.section);
	const id = rowId(url);
	const data = await run(() => readSection(name, id), 404);
	return json(data, { headers: { 'Cache-Control': 'no-store' } });
};

export const POST: RequestHandler = async ({ params, request, url }) => {
	const name = section(params.section);
	const id = rowId(url);
	if (!request.headers.get('content-type')?.startsWith('application/json')) error(415, 'JSON expected');
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	const created = await run(() => writeSection(name, parseSection(name, body), id));
	clearContentCache();
	return json({ ok: true, id: created });
};

export const DELETE: RequestHandler = async ({ params, url }) => {
	const name = section(params.section);
	const id = rowId(url);
	if (id === null) error(400, 'Missing id');
	await run(() => removeFromSection(name, id));
	clearContentCache();
	return json({ ok: true });
};
