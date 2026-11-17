import { ApiHttpError, apiJson, handleApi, resolveLocale } from '#lib/server/api/index.js';
import { getProjects } from '#lib/server/content/index.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, request }) =>
	handleApi(async () => {
		const locale = resolveLocale(url, request);
		const featured = url.searchParams.get('featured');
		if (featured !== null && featured !== 'true' && featured !== 'false') {
			throw new ApiHttpError(400, `Unsupported featured "${featured}". Use true or false.`);
		}
		return apiJson(await getProjects(locale, featured === 'true'), locale);
	});
