/**
 * Image slots that the owner can edit: the portrait, a project image, an organization logo.
 * A stored file can fill several slots (picked from the library of the editor).
 * Uses the write account (DB_WRITE_USER); public pages read the same columns through
 * src/lib/server/content/.
 */

import { locales } from '#lib/paraglide/runtime.js';
import { writeQuery } from '#lib/server/db/index.js';

export type ImageTarget = 'portrait' | 'project' | 'logo';

export const IMAGE_TARGETS: readonly ImageTarget[] = ['portrait', 'project', 'logo'];

/** Logos are described by the organization name: no description to store */
export const HAS_ALT: Record<ImageTarget, boolean> = { portrait: true, project: true, logo: false };

export interface ImageSlot {
	file: string | null;
	/** Description per locale (empty when unset) */
	alt: Record<string, string>;
}

const emptyAlt = () => Object.fromEntries(locales.map((locale) => [locale, ''])) as Record<string, string>;

async function personId(): Promise<number | null> {
	const [row] = await writeQuery<{ id: number }>('SELECT id FROM person ORDER BY id LIMIT 1');
	return row?.id ?? null;
}

/** Current file and descriptions, or null when the target does not exist. */
export async function readSlot(target: ImageTarget, id: number | null): Promise<ImageSlot | null> {
	const alt = emptyAlt();
	if (target === 'portrait') {
		const pid = await personId();
		if (pid === null) return null;
		const [row] = await writeQuery<{ photo_file: string | null }>('SELECT photo_file FROM person WHERE id = ?', [pid]);
		for (const r of await writeQuery<{ locale: string; photo_alt: string | null }>(
			'SELECT locale, photo_alt FROM person_i18n WHERE person_id = ?',
			[pid]
		)) {
			alt[r.locale] = r.photo_alt ?? '';
		}
		return { file: row?.photo_file ?? null, alt };
	}
	if (id === null) return null;
	if (target === 'project') {
		const [row] = await writeQuery<{ image_file: string | null }>('SELECT image_file FROM project WHERE id = ?', [id]);
		if (!row) return null;
		for (const r of await writeQuery<{ locale: string; image_alt: string | null }>(
			'SELECT locale, image_alt FROM project_i18n WHERE project_id = ?',
			[id]
		)) {
			alt[r.locale] = r.image_alt ?? '';
		}
		return { file: row.image_file, alt };
	}
	const [row] = await writeQuery<{ logo_file: string | null }>('SELECT logo_file FROM organization WHERE id = ?', [id]);
	return row ? { file: row.logo_file, alt } : null;
}

export interface MediaUsage {
	target: ImageTarget;
	/** Project or organization name, null for the portrait */
	name: string | null;
}

/** Where each stored file is used, keyed by file name. */
export async function mediaUsages(): Promise<Map<string, MediaUsage[]>> {
	const rows = await writeQuery<{ file: string; target: ImageTarget; name: string | null }>(
		`SELECT photo_file AS file, 'portrait' AS target, NULL AS name FROM person WHERE photo_file IS NOT NULL
		UNION ALL SELECT image_file, 'project', name FROM project WHERE image_file IS NOT NULL
		UNION ALL SELECT logo_file, 'logo', name FROM organization WHERE logo_file IS NOT NULL`
	);
	const usages = new Map<string, MediaUsage[]>();
	for (const row of rows) {
		usages.set(row.file, [...(usages.get(row.file) ?? []), { target: row.target, name: row.name }]);
	}
	return usages;
}

/** Stores the file name (null to remove) and, for portrait and projects, the descriptions. */
export async function writeSlot(
	target: ImageTarget,
	id: number | null,
	file: string | null,
	alt: Record<string, string>
): Promise<void> {
	const clean = (locale: string) => (alt[locale] ?? '').trim().slice(0, 255) || null;
	if (target === 'portrait') {
		const pid = await personId();
		if (pid === null) return;
		await writeQuery('UPDATE person SET photo_file = ? WHERE id = ?', [file, pid]);
		for (const locale of locales) {
			// person_i18n rows hold the bio too: only touch the description
			await writeQuery(
				`INSERT INTO person_i18n (person_id, locale, photo_alt) VALUES (?, ?, ?)
				ON DUPLICATE KEY UPDATE photo_alt = VALUES(photo_alt)`,
				[pid, locale, file ? clean(locale) : null]
			);
		}
		return;
	}
	if (target === 'project') {
		await writeQuery('UPDATE project SET image_file = ? WHERE id = ?', [file, id]);
		for (const locale of locales) {
			await writeQuery(
				`INSERT INTO project_i18n (project_id, locale, image_alt) VALUES (?, ?, ?)
				ON DUPLICATE KEY UPDATE image_alt = VALUES(image_alt)`,
				[id, locale, file ? clean(locale) : null]
			);
		}
		return;
	}
	await writeQuery('UPDATE organization SET logo_file = ? WHERE id = ?', [file, id]);
}

