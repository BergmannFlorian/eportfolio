import type { Handle } from '@sveltejs/kit/hooks';
import { SESSION_COOKIE, getSession } from '#lib/server/auth/index.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { deLocalizeUrl, localizeHref } from '#lib/paraglide/runtime.js';

const isAdmin = (pathname: string) => pathname === '/admin' || pathname.startsWith('/admin/');
// Reachable without a full session (the login itself, and logout with an expired session)
const PUBLIC_ADMIN = new Set(['/admin/login', '/admin/logout']);

// Localized URL routing (/en/…) is handled by `reroute` in src/hooks.ts;
// here we set the request locale and the document lang attribute.
export const handle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, async ({ locale }) => {
		const pathname = deLocalizeUrl(event.url).pathname;

		// Only requests carrying the cookie (i.e. the owner) touch the session table
		const token = event.cookies.get(SESSION_COOKIE);
		event.locals.admin = token ? await getSession(token) : null;

		// Guard in the hook (not in a layout load) so form actions are covered too
		if (isAdmin(pathname) && !PUBLIC_ADMIN.has(pathname) && event.locals.admin?.stage !== 'full') {
			return new Response(null, {
				status: 303,
				headers: { Location: localizeHref('/admin/login'), 'Cache-Control': 'no-store' }
			});
		}

		const response = await resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
		if (isAdmin(pathname)) response.headers.set('X-Robots-Tag', 'noindex, nofollow');
		// Admin pages and any page rendered for a signed-in owner must never be cached
		if (isAdmin(pathname) || event.locals.admin) response.headers.set('Cache-Control', 'no-store');
		return response;
	});
