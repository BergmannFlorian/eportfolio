import { getLocale } from '#lib/paraglide/runtime.js';
import { getCV } from '#lib/server/content/index.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { cv, levels } = await getCV(getLocale());
	return { cv, levels };
};
