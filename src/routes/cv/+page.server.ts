import QRCode from 'qrcode';
import { getLocale, localizeHref } from '#lib/paraglide/runtime.js';
import { getCV } from '#lib/server/content/index.js';
import type { PageServerLoad } from './$types';

/** Inline SVG QR code; modules use currentColor and the background is left to the container. */
async function qrSvg(text: string): Promise<string> {
	const svg = await QRCode.toString(text, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
	return svg.replace(/<path fill="#ffffff"[^>]*\/>/, '').replace('stroke="#000000"', 'stroke="currentColor"');
}

export const load: PageServerLoad = async ({ url }) => {
	const { cv, levels } = await getCV(getLocale());
	// Home page in the CV's language, e.g. https://bergmann-florian.ch/en
	const siteUrl = new URL(localizeHref('/'), url.origin).href.replace(/\/$/, '');
	return {
		cv,
		levels,
		site: { url: siteUrl, label: siteUrl.replace(/^https?:\/\//, ''), qr: await qrSvg(siteUrl) }
	};
};
