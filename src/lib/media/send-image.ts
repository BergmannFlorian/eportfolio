/** Saving an image slot through POST /admin/media (signed in), from the image editors. */

import { locales } from '#lib/paraglide/runtime.js';
import type { ImageSlotKind } from './prepare-image.js';

/** Image chosen in ImagePicker: a prepared upload, or a file of the library */
export type ImageChoice = { blob: Blob } | { existing: string };

export interface ImageSave {
	target: ImageSlotKind;
	/** Project or organization id (none for the portrait) */
	id: number | null;
	action: 'save' | 'remove';
	/** New image; none to only change the descriptions */
	choice?: ImageChoice | null;
	/** Description per locale (not for logos) */
	alt?: Record<string, string> | null;
}

export async function sendImage({ target, id, action, choice, alt }: ImageSave): Promise<void> {
	const body = new FormData();
	body.set('target', target);
	if (id !== null) body.set('id', String(id));
	body.set('action', action);
	if (action === 'save') {
		if (choice && 'blob' in choice) body.set('file', choice.blob, 'image');
		else if (choice) body.set('existing', choice.existing);
		if (alt) for (const locale of locales) body.set(`alt_${locale}`, alt[locale] ?? '');
	}
	const response = await fetch('/admin/media', { method: 'POST', body });
	if (!response.ok) throw new Error(`Image ${action} failed: ${response.status}`);
}
