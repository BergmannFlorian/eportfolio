import { getLocale } from '#lib/paraglide/runtime.js';
import { getSiteContact } from '#lib/server/content/index.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => ({
	contact: await getSiteContact(getLocale())
});
