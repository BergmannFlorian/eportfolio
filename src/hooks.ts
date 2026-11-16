import type { Reroute } from '@sveltejs/kit/hooks';
import { deLocalizeUrl } from '#lib/paraglide/runtime.js';

const isApi = (pathname: string) => pathname === '/api' || pathname.startsWith('/api/');

export const reroute: Reroute = ({ url }) => {
	// The JSON API is not localized: never map /en/api/… onto /api/…
	if (isApi(url.pathname)) return url.pathname;
	const pathname = deLocalizeUrl(url).pathname;
	return isApi(pathname) ? url.pathname : pathname;
};
