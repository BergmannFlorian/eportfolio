import type { ApiIndex } from '#lib/api/types.js';
import { apiJson } from '#lib/server/api/index.js';
import type { RequestHandler } from './$types';

const index: ApiIndex = {
	name: 'Florian Bergmann — portfolio API',
	version: 'v1',
	locales: ['fr', 'en'],
	defaultLocale: 'fr',
	endpoints: [
		{ path: '/api/v1/profile', description: 'Contact, bio, facts, spoken languages and hobbies' },
		{
			path: '/api/v1/experiences',
			description: 'Jobs and education with tasks and skills',
			query: { kind: 'job | education' }
		},
		{
			path: '/api/v1/projects',
			description: 'Projects with tasks and details',
			query: { featured: 'true | false' }
		},
		{ path: '/api/v1/skills', description: 'Skills by category with a recency level' },
		{ path: '/api/v1/certificates', description: 'Certifications' },
		{ path: '/api/v1/cv', description: 'Full public CV in one call (same data as the /cv page)' }
	]
};

// Every endpoint also accepts ?lang=fr|en (default: Accept-Language, then fr).
export const GET: RequestHandler = () => apiJson(index);
