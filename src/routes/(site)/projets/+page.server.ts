import { getLocale } from '#lib/paraglide/runtime.js';
import { getPersonalProjects } from '#lib/server/content/index.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	projects: await getPersonalProjects(getLocale())
});
