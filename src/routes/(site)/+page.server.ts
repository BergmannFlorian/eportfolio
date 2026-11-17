import { getLocale } from '#lib/paraglide/runtime.js';
import { getHomeContent } from '#lib/server/content/index.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	home: await getHomeContent(getLocale())
});
