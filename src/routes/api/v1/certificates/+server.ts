import { apiJson, handleApi, resolveLocale } from '#lib/server/api/index.js';
import { getCertificates } from '#lib/server/content/index.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, request }) =>
	handleApi(async () => {
		const locale = resolveLocale(url, request);
		return apiJson(await getCertificates(locale), locale);
	});
