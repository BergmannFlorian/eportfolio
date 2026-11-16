import { apiJson, handleApi, resolveLocale } from '#lib/server/api/index.js';
import { getSkills } from '#lib/server/content/index.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, request }) =>
	handleApi(() => {
		const locale = resolveLocale(url, request);
		return apiJson(getSkills(locale), locale);
	});
