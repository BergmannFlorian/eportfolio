import { fail, redirect, type Cookies } from '@sveltejs/kit';
import {
	LOCK_MINUTES,
	PENDING_SECONDS,
	SESSION_COOKIE,
	SESSION_SECONDS,
	checkCode,
	checkPassword,
	deleteSession
} from '#lib/server/auth/index.js';
import { localizeHref } from '#lib/paraglide/runtime.js';
import type { Actions, PageServerLoad } from './$types';

function setSessionCookie(cookies: Cookies, token: string, maxAge: number) {
	// `secure` defaults to true (except on http://localhost in dev)
	cookies.set(SESSION_COOKIE, token, { path: '/', httpOnly: true, sameSite: 'lax', maxAge });
}

// Editing happens on the site pages, so a signed-in owner goes back home
export const load: PageServerLoad = ({ locals }) => {
	if (locals.admin?.stage === 'full') redirect(303, localizeHref('/'));
	return {
		step: locals.admin?.stage === 'pending' ? ('code' as const) : ('password' as const),
		lockMinutes: LOCK_MINUTES
	};
};

export const actions: Actions = {
	password: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		const result = await checkPassword(email, String(form.get('password') ?? ''));
		if (!result.ok) return fail(result.reason === 'locked' ? 429 : 400, { error: result.reason, email });
		setSessionCookie(cookies, result.token, PENDING_SECONDS);
		redirect(303, localizeHref('/admin/login'));
	},

	code: async ({ request, cookies }) => {
		const token = cookies.get(SESSION_COOKIE);
		const code = String((await request.formData()).get('code') ?? '');
		const result = token ? await checkCode(token, code) : ({ ok: false, reason: 'expired' } as const);
		if (!result.ok) {
			// Locked or expired: back to step 1
			if (result.reason !== 'invalid') cookies.delete(SESSION_COOKIE, { path: '/' });
			return fail(result.reason === 'locked' ? 429 : 400, { error: result.reason });
		}
		setSessionCookie(cookies, result.token, SESSION_SECONDS);
		redirect(303, localizeHref('/'));
	},

	restart: async ({ cookies }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (token) await deleteSession(token);
		cookies.delete(SESSION_COOKIE, { path: '/' });
		redirect(303, localizeHref('/admin/login'));
	}
};
