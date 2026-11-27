/**
 * Browser-side image preparation, before the upload: center crop to the slot ratio,
 * downscale, encode as WebP (PNG/JPEG when the browser cannot encode WebP).
 * The server stores what it receives, so it needs no image library.
 */

export type ImageSlotKind = 'portrait' | 'project' | 'logo';

export interface ImageFormat {
	/** width / height, or null to keep the whole image (logos) */
	ratio: number | null;
	maxWidth: number;
	maxHeight: number;
}

export const IMAGE_FORMATS: Record<ImageSlotKind, ImageFormat> = {
	portrait: { ratio: 4 / 5, maxWidth: 960, maxHeight: 1200 },
	project: { ratio: 16 / 10, maxWidth: 1600, maxHeight: 1000 },
	logo: { ratio: null, maxWidth: 256, maxHeight: 256 }
};

/** Largest file accepted from the user, before processing */
export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

export interface PreparedImage {
	blob: Blob;
	width: number;
	height: number;
	sourceWidth: number;
	sourceHeight: number;
}

function encode(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
	return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function prepareImage(file: File, kind: ImageSlotKind): Promise<PreparedImage> {
	// SVG logos are sent as they are (vector, already small)
	if (kind === 'logo' && file.type === 'image/svg+xml') {
		return { blob: file, width: 0, height: 0, sourceWidth: 0, sourceHeight: 0 };
	}

	const bitmap = await createImageBitmap(file);
	const sourceWidth = bitmap.width;
	const sourceHeight = bitmap.height;
	const format = IMAGE_FORMATS[kind];
	let sx = 0;
	let sy = 0;
	let sw = bitmap.width;
	let sh = bitmap.height;
	if (format.ratio !== null) {
		if (sw / sh > format.ratio) {
			sw = Math.round(sh * format.ratio);
			sx = Math.round((bitmap.width - sw) / 2);
		} else {
			sh = Math.round(sw / format.ratio);
			sy = Math.round((bitmap.height - sh) / 2);
		}
	}
	const scale = Math.min(1, format.maxWidth / sw, format.maxHeight / sh);
	const width = Math.max(1, Math.round(sw * scale));
	const height = Math.max(1, Math.round(sh * scale));

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Canvas unavailable');
	context.imageSmoothingQuality = 'high';
	context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
	bitmap.close();

	let blob = await encode(canvas, 'image/webp', 0.85);
	if (!blob || blob.type !== 'image/webp') {
		// Logos may need transparency: PNG; photos: JPEG
		blob = kind === 'logo' ? await encode(canvas, 'image/png') : await encode(canvas, 'image/jpeg', 0.85);
	}
	if (!blob) throw new Error('Encoding failed');
	return { blob, width, height, sourceWidth, sourceHeight };
}

/** "3,4 Mo" / "3.4 MB" */
export function formatBytes(bytes: number, locale: string): string {
	const units = ['B', 'kB', 'MB'];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	const label = locale === 'fr' ? ['o', 'ko', 'Mo'][unit] : units[unit];
	return `${value.toLocaleString(locale, { maximumFractionDigits: unit === 0 ? 0 : 1 })} ${label}`;
}
