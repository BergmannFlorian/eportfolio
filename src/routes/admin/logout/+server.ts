import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, deleteSession } from '#lib/server/auth/index.js';
import { localizeHref } from '#lib/paraglide/runtime.js';
import type { RequestHandler } from './$types';

// Logout form of the site header. POST only; SvelteKit's origin check blocks cross-site posts.
export const POST: RequestHandler = async ({ cookies }) => {
	const token = cookies.get(SESSION_COOKIE);
	if (token) await deleteSession(token);
	cookies.delete(SESSION_COOKIE, { path: '/' });
	redirect(303, localizeHref('/'));
};
