/** Helpers of the content editor: reading i18n rows, validating the editor data, writing translations. */

import { EDIT_LIMITS, type Localized } from '#lib/content/edit.js';
import { baseLocale, locales } from '#lib/paraglide/runtime.js';
import { writeQuery, type Transaction } from '#lib/server/db/index.js';

/** Invalid data sent by the editor, answered with `status` (400; 404, 405 or 409 for a refused deletion). */
export class EditError extends Error {
	constructor(
		message: string,
		readonly status: 400 | 404 | 405 | 409 = 400
	) {
		super(message);
	}
}

/**
 * One editable section: read (every locale as stored), parse (validate and trim the
 * editor data, throws EditError), write (one transaction, returns the id of a created row).
 * `id` selects a row for sections editing one item (a project), null otherwise.
 */
export interface SectionHandler<T> {
	read(id: number | null): Promise<T>;
	parse(body: unknown): T;
	write(data: T, id: number | null): Promise<number | null>;
	/** Deletes one row (sections editing one item) */
	remove?(id: number): Promise<void>;
}

/** Skill choices of the project and experience editors, in the catalog order */
export async function skillOptions(): Promise<{ id: number; name: string; category: string }[]> {
	const rows = await writeQuery<{ id: number; name: string; category: string | null }>(
		`SELECT s.id, s.name, COALESCE(t.name, c.code) AS category
		FROM skill s
		JOIN skill_category c ON c.id = s.category_id
		LEFT JOIN skill_category_i18n t ON t.skill_category_id = c.id AND t.locale = ?
		ORDER BY c.position, c.id, s.position, s.id`,
		[baseLocale]
	);
	return rows.map((skill) => ({ id: skill.id, name: skill.name, category: skill.category ?? '' }));
}

/** Throws unless every id exists in `table` */
export async function checkIds(
	tx: Transaction,
	table: 'experience' | 'skill' | 'organization',
	ids: number[],
	what: string
): Promise<void> {
	if (ids.length === 0) return;
	const [{ count }] = await tx.query<{ count: number }>(
		`SELECT COUNT(*) AS count FROM ${table} WHERE id IN (${ids.map(() => '?').join(', ')})`,
		ids
	);
	if (Number(count) !== ids.length) throw new EditError(`${what}: unknown id`);
}

/** Ids of a list of skills (technologies of a project, skills of an experience) */
export function skillIdList(value: unknown, what: string): number[] {
	return [...new Set(list(value, what, EDIT_LIMITS.skills).map((id, i) => integer(id, `${what}[${i}]`, 1, 2 ** 32 - 1)))];
}

export type Row = Record<string, unknown> & { locale: string };

export const emptyLocalized = (): Localized => Object.fromEntries(locales.map((locale) => [locale, '']));

/** One column of i18n rows, per locale */
export function localized(rows: Row[], column: string): Localized {
	const out = emptyLocalized();
	for (const row of rows) if (row.locale in out) out[row.locale] = (row[column] as string | null) ?? '';
	return out;
}

/** i18n rows grouped by their parent id */
export function byParent(rows: Row[], key: string): Map<unknown, Row[]> {
	const groups = new Map<unknown, Row[]>();
	for (const row of rows) groups.set(row[key], [...(groups.get(row[key]) ?? []), row]);
	return groups;
}

export async function personId(): Promise<number> {
	const [row] = await writeQuery<{ id: number }>('SELECT id FROM person ORDER BY id LIMIT 1');
	if (!row) throw new EditError('No person');
	return row.id;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function record(value: unknown, what: string): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new EditError(`${what}: object expected`);
	return value as Record<string, unknown>;
}

export function text(value: unknown, max: number, what: string, required = false): string {
	if (typeof value !== 'string') throw new EditError(`${what}: text expected`);
	const trimmed = value.trim();
	if (trimmed.length > max) throw new EditError(`${what}: ${max} characters at most`);
	if (required && !trimmed) throw new EditError(`${what}: required`);
	return trimmed;
}

/** One text per locale; the base locale (fr) is required when `required` */
export function localizedText(value: unknown, max: number, what: string, required = true): Localized {
	const input = record(value, what);
	return Object.fromEntries(
		locales.map((locale) => [locale, text(input[locale] ?? '', max, `${what}.${locale}`, required && locale === baseLocale)])
	);
}

export function list(value: unknown, what: string, max: number = EDIT_LIMITS.items): unknown[] {
	if (!Array.isArray(value)) throw new EditError(`${what}: list expected`);
	if (value.length > max) throw new EditError(`${what}: ${max} at most`);
	return value;
}

/** The `items` list of a list section, each one an object */
export function items(body: unknown, max: number = EDIT_LIMITS.items): Record<string, unknown>[] {
	return list(record(body, 'body').items, 'items', max).map((item, i) => record(item, `items[${i}]`));
}

/** A real calendar date as YYYY-MM-DD */
export function isoDate(value: unknown, what: string): string {
	const raw = text(value, 10, what, true);
	const parsed = new Date(`${raw}T00:00:00Z`);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) {
		throw new EditError(`${what}: YYYY-MM-DD expected`);
	}
	return raw;
}

/** An http(s) URL, or '' when not required */
export function httpUrl(value: unknown, max: number, what: string, required = false): string {
	const url = text(value ?? '', max, what, required);
	if (!url) return url;
	let protocol = '';
	try {
		protocol = new URL(url).protocol;
	} catch {
		// handled below
	}
	if (protocol !== 'https:' && protocol !== 'http:') throw new EditError(`${what}: invalid`);
	return url;
}

export function bool(value: unknown, what: string): boolean {
	if (typeof value !== 'boolean') throw new EditError(`${what}: boolean expected`);
	return value;
}

export function integer(value: unknown, what: string, min: number, max: number): number {
	if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
		throw new EditError(`${what}: integer ${min}-${max} expected`);
	}
	return value;
}

// ─── Writing ─────────────────────────────────────────────────────────────────

/** Inserts the translations of a row, one per locale with at least one text ('' → NULL) */
export async function insertTranslations(
	tx: Transaction,
	table: string,
	parent: string,
	id: number,
	columns: Record<string, Localized>
): Promise<void> {
	const names = Object.keys(columns);
	for (const locale of locales) {
		const values = names.map((name) => columns[name][locale] || null);
		if (values.every((value) => value === null)) continue;
		await tx.query(
			`INSERT INTO ${table} (${parent}, locale, ${names.join(', ')}) VALUES (?, ?, ${names.map(() => '?').join(', ')})`,
			[id, locale, ...values]
		);
	}
}
