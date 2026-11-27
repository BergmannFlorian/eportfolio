import { error, json } from '@sveltejs/kit';
import { EDIT_SECTIONS, type EditSection } from '#lib/content/edit.js';
import { clearContentCache } from '#lib/server/content/index.js';
import { EditError, parseSection, readSection, writeSection } from '#lib/server/edit/index.js';
import type { RequestHandler } from './$types';

// Content editor of the site pages: GET the current content of a section, POST it back.
// ?id=<project id> selects the project of the "project" section (none: a new project).
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

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		return json(await readSection(section(params.section), rowId(url)), {
			headers: { 'Cache-Control': 'no-store' }
		});
	} catch (cause) {
		if (cause instanceof EditError) error(404, cause.message);
		throw cause;
	}
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
	let created: number | null;
	try {
		created = await writeSection(name, parseSection(name, body), id);
	} catch (cause) {
		if (cause instanceof EditError) error(400, cause.message);
		throw cause;
	}
	clearContentCache();
	return json({ ok: true, id: created });
};
