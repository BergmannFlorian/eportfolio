import type { Reroute } from '@sveltejs/kit/hooks';
import { deLocalizeUrl } from '#lib/paraglide/runtime.js';

// The JSON API and uploaded images are not localized: never map /en/api/… or /en/media/… onto them
const isUnlocalized = (pathname: string) =>
	['/api', '/media'].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const reroute: Reroute = ({ url }) => {
	if (isUnlocalized(url.pathname)) return url.pathname;
	const pathname = deLocalizeUrl(url).pathname;
	return isUnlocalized(pathname) ? url.pathname : pathname;
};
