import { apiJson, handleApi, resolveLocale } from '#lib/server/api/index.js';
import { getCV } from '#lib/server/content/index.js';
import type { RequestHandler } from './$types';

// Same payload as the /cv page loader: dates stay in the "DD.MM.YYYY" format
// and skills reference the catalog by index; `levels` holds the rated skills.
export const GET: RequestHandler = ({ url, request }) =>
	handleApi(async () => {
		const locale = resolveLocale(url, request);
		return apiJson(await getCV(locale), locale);
	});
