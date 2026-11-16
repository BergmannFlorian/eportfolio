import { ApiHttpError, apiJson, handleApi, resolveLocale } from '#lib/server/api/index.js';
import { getExperiences } from '#lib/server/content/index.js';
import type { RequestHandler } from './$types';

const kinds = ['job', 'education'] as const;

export const GET: RequestHandler = ({ url, request }) =>
	handleApi(() => {
		const locale = resolveLocale(url, request);
		const kind = url.searchParams.get('kind');
		if (kind !== null && !kinds.includes(kind as (typeof kinds)[number])) {
			throw new ApiHttpError(400, `Unsupported kind "${kind}". Use one of: ${kinds.join(', ')}.`);
		}
		return apiJson(getExperiences(locale, (kind ?? undefined) as (typeof kinds)[number] | undefined), locale);
	});
