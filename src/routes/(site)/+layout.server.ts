import { getLocale } from '#lib/paraglide/runtime.js';
import { getSiteContact } from '#lib/server/content/index.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => ({
	contact: await getSiteContact(getLocale()),
	// Only a flag reaches the browser, never the session or the email
	signedIn: locals.admin?.stage === 'full'
});
