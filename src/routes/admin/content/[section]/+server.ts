import { error, json } from '@sveltejs/kit';
import { EDIT_SECTIONS, type EditSection } from '#lib/content/edit.js';
import { clearContentCache } from '#lib/server/content/index.js';
import { EditError, parseSection, readSection, writeSection } from '#lib/server/edit/profile.js';
import type { RequestHandler } from './$types';

// Content editor of the site pages: GET the current content of a section, POST it back.
// Behind the admin session (src/hooks.server.ts). JSON only: a cross-site page cannot
// send it without a CORS preflight, which this route never answers.

function section(name: string): EditSection {
	if (!EDIT_SECTIONS.includes(name as EditSection)) error(404, 'Unknown section');
	return name as EditSection;
}

export const GET: RequestHandler = async ({ params }) => {
	return json(await readSection(section(params.section)), { headers: { 'Cache-Control': 'no-store' } });
};

export const POST: RequestHandler = async ({ params, request }) => {
	const name = section(params.section);
	if (!request.headers.get('content-type')?.startsWith('application/json')) error(415, 'JSON expected');
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON');
	}
	try {
		await writeSection(name, parseSection(name, body));
	} catch (cause) {
		if (cause instanceof EditError) error(400, cause.message);
		throw cause;
	}
	clearContentCache();
	return json({ ok: true });
};
