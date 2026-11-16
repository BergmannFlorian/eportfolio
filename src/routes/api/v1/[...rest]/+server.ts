import { apiError } from '#lib/server/api/index.js';
import type { RequestHandler } from './$types';

// Unknown API paths answer with a JSON 404 instead of the HTML error page.
export const GET: RequestHandler = ({ url }) =>
	apiError(404, `No endpoint at ${url.pathname}. See /api/v1 for the list.`);
