import { getLocale } from '#lib/paraglide/runtime.js';
import { getHiddenJourney, getHomeContent } from '#lib/server/content/index.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const locale = getLocale();
	const signedIn = locals.admin?.stage === 'full';
	return {
		home: await getHomeContent(locale),
		// Experiences hidden from the Journey section, shown to the owner to edit them
		hiddenJourney: signedIn ? await getHiddenJourney(locale) : []
	};
};
