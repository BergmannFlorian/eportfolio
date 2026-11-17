import type { ApiError } from '#lib/api/types.js';
import { baseLocale, isLocale, locales, type Locale } from '#lib/paraglide/runtime.js';

/** Thrown by `resolveLocale` and converted to a JSON error by `handleApi`. */
export class ApiHttpError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
	}
}

/**
 * Locale of an API request: `?lang=` first, then the Accept-Language header,
 * then the site's base locale. An unsupported `?lang=` is a client error.
 */
export function resolveLocale(url: URL, request: Request): Locale {
	const requested = url.searchParams.get('lang');
	if (requested !== null) {
		if (isLocale(requested)) return requested;
		throw new ApiHttpError(400, `Unsupported lang "${requested}". Use one of: ${locales.join(', ')}.`);
	}

	const header = request.headers.get('accept-language') ?? '';
	const preferred = header
		.split(',')
		.map((part) => {
			const [tag, ...params] = part.trim().split(';');
			const q = params.find((p) => p.trim().startsWith('q='));
			return { lang: tag.toLowerCase().split('-')[0], q: q ? Number(q.trim().slice(2)) : 1 };
		})
		.filter((entry) => entry.lang && !Number.isNaN(entry.q))
		.sort((a, b) => b.q - a.q)
		.find((entry) => isLocale(entry.lang));

	return preferred ? (preferred.lang as Locale) : baseLocale;
}

const baseHeaders = {
	'content-type': 'application/json; charset=utf-8',
	// Public, read-only data: any origin may read it (useful for a future web client)
	'access-control-allow-origin': '*',
	vary: 'Accept-Language'
};

export function apiJson(data: unknown, locale?: Locale, status = 200): Response {
	const headers: Record<string, string> = {
		...baseHeaders,
		'cache-control': status === 200 ? 'public, max-age=300' : 'no-store'
	};
	if (locale) headers['content-language'] = locale;
	return new Response(JSON.stringify(data), { status, headers });
}

export function apiError(status: number, message: string): Response {
	const body: ApiError = { error: { status, message } };
	return apiJson(body, undefined, status);
}

/**
 * Wraps an endpoint: thrown `ApiHttpError`s become JSON error responses, any
 * other failure (e.g. the database is unreachable) a JSON 500.
 */
export async function handleApi(run: () => Response | Promise<Response>): Promise<Response> {
	try {
		return await run();
	} catch (error) {
		if (error instanceof ApiHttpError) return apiError(error.status, error.message);
		console.error(error);
		return apiError(500, 'Internal server error');
	}
}
