import { redirect } from '@sveltejs/kit';
import { localizeHref } from '#lib/paraglide/runtime.js';
import type { RequestHandler } from './$types';

// Editing happens on the site pages: once signed in (checked in hooks.server.ts), go home
export const GET: RequestHandler = () => redirect(303, localizeHref('/'));
