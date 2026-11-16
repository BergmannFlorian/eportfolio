import { getLocale } from '#lib/paraglide/runtime.js';
import { getPublicCV, skills } from '#lib/server/cv/index.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	cv: getPublicCV(getLocale()),
	skills
});
