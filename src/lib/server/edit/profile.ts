/**
 * Profile texts edited from the home page: hero, about, facts, spoken languages, hobbies.
 * Reads every locale as stored (no fallback) and writes through the write account,
 * one transaction per section. Lists are replaced as a whole: their ids are not
 * referenced anywhere else. Private columns (address, birthdate, references) are never
 * read nor written here.
 */

import {
	EDIT_LIMITS as MAX,
	LANGUAGE_CODE,
	type EditSection,
	type EditSections,
	type FactEdit,
	type HobbyEdit,
	type LanguageEdit,
	type Localized
} from '#lib/content/edit.js';
import { baseLocale, locales } from '#lib/paraglide/runtime.js';
import { writeQuery, writeTransaction, type Transaction } from '#lib/server/db/index.js';

/** Invalid data sent by the editor (answered with a 400). */
export class EditError extends Error {}

type Row = Record<string, unknown> & { locale: string };

const emptyLocalized = (): Localized => Object.fromEntries(locales.map((locale) => [locale, '']));

/** One column of i18n rows, per locale */
function localized(rows: Row[], column: string): Localized {
	const out = emptyLocalized();
	for (const row of rows) if (row.locale in out) out[row.locale] = (row[column] as string | null) ?? '';
	return out;
}

/** i18n rows grouped by their parent id */
function byParent(rows: Row[], key: string): Map<unknown, Row[]> {
	const groups = new Map<unknown, Row[]>();
	for (const row of rows) groups.set(row[key], [...(groups.get(row[key]) ?? []), row]);
	return groups;
}

async function personId(): Promise<number> {
	const [row] = await writeQuery<{ id: number }>('SELECT id FROM person ORDER BY id LIMIT 1');
	if (!row) throw new EditError('No person');
	return row.id;
}

// ─── Reading ─────────────────────────────────────────────────────────────────

async function readHero(pid: number): Promise<EditSections['hero']> {
	const [[person], rows] = await Promise.all([
		writeQuery<{ email: string }>('SELECT email FROM person WHERE id = ?', [pid]),
		writeQuery<Row>('SELECT locale, headline, bio FROM person_i18n WHERE person_id = ?', [pid])
	]);
	return { email: person.email, headline: localized(rows, 'headline'), bio: localized(rows, 'bio') };
}

async function readAbout(pid: number): Promise<EditSections['about']> {
	const rows = await writeQuery<Row>('SELECT locale, about FROM person_i18n WHERE person_id = ?', [pid]);
	return { about: localized(rows, 'about') };
}

async function readFacts(pid: number): Promise<EditSections['facts']> {
	const [facts, rows] = await Promise.all([
		writeQuery<{ id: number; icon: string | null; on_site: number; on_cv: number }>(
			'SELECT id, icon, on_site, on_cv FROM fact WHERE person_id = ? ORDER BY position, id',
			[pid]
		),
		writeQuery<Row>(
			`SELECT t.fact_id, t.locale, t.label, t.value FROM fact_i18n t
			JOIN fact f ON f.id = t.fact_id WHERE f.person_id = ?`,
			[pid]
		)
	]);
	const i18n = byParent(rows, 'fact_id');
	return {
		items: facts.map((fact) => ({
			icon: fact.icon ?? '',
			onSite: Number(fact.on_site) === 1,
			onCv: Number(fact.on_cv) === 1,
			label: localized(i18n.get(fact.id) ?? [], 'label'),
			value: localized(i18n.get(fact.id) ?? [], 'value')
		}))
	};
}

async function readLanguages(pid: number): Promise<EditSections['languages']> {
	const [languages, levels, names] = await Promise.all([
		writeQuery<{ id: number; code: string; cefr: string; percent: number }>(
			`SELECT id, language_code AS code, cefr, percent FROM person_language
			WHERE person_id = ? ORDER BY position, id`,
			[pid]
		),
		writeQuery<Row>(
			`SELECT t.person_language_id, t.locale, t.level_label FROM person_language_i18n t
			JOIN person_language pl ON pl.id = t.person_language_id WHERE pl.person_id = ?`,
			[pid]
		),
		writeQuery<Row>('SELECT language_code, locale, name FROM language_i18n')
	]);
	const levelsById = byParent(levels, 'person_language_id');
	const namesByCode = byParent(names, 'language_code');
	return {
		items: languages.map((language) => ({
			code: language.code,
			name: localized(namesByCode.get(language.code) ?? [], 'name'),
			cefr: language.cefr,
			percent: Number(language.percent),
			level: localized(levelsById.get(language.id) ?? [], 'level_label')
		}))
	};
}

async function readHobbies(pid: number): Promise<EditSections['hobbies']> {
	const [hobbies, rows] = await Promise.all([
		writeQuery<{ id: number }>('SELECT id FROM hobby WHERE person_id = ? ORDER BY position, id', [pid]),
		writeQuery<Row>(
			`SELECT t.hobby_id, t.locale, t.name, t.reason FROM hobby_i18n t
			JOIN hobby h ON h.id = t.hobby_id WHERE h.person_id = ?`,
			[pid]
		)
	]);
	const i18n = byParent(rows, 'hobby_id');
	return {
		items: hobbies.map((hobby) => ({
			name: localized(i18n.get(hobby.id) ?? [], 'name'),
			reason: localized(i18n.get(hobby.id) ?? [], 'reason')
		}))
	};
}

/** Current content of a section, every locale as stored. */
export async function readSection<S extends EditSection>(section: S): Promise<EditSections[S]> {
	const pid = await personId();
	const readers: { [K in EditSection]: (pid: number) => Promise<EditSections[K]> } = {
		hero: readHero,
		about: readAbout,
		facts: readFacts,
		languages: readLanguages,
		hobbies: readHobbies
	};
	return readers[section](pid);
}

// ─── Validation ──────────────────────────────────────────────────────────────

function record(value: unknown, what: string): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new EditError(`${what}: object expected`);
	return value as Record<string, unknown>;
}

function text(value: unknown, max: number, what: string, required = false): string {
	if (typeof value !== 'string') throw new EditError(`${what}: text expected`);
	const trimmed = value.trim();
	if (trimmed.length > max) throw new EditError(`${what}: ${max} characters at most`);
	if (required && !trimmed) throw new EditError(`${what}: required`);
	return trimmed;
}

/** One text per locale; the base locale (fr) is required when `required` */
function localizedText(value: unknown, max: number, what: string, required = true): Localized {
	const input = record(value, what);
	return Object.fromEntries(
		locales.map((locale) => [locale, text(input[locale] ?? '', max, `${what}.${locale}`, required && locale === baseLocale)])
	);
}

function items(value: unknown): Record<string, unknown>[] {
	const list = record(value, 'body').items;
	if (!Array.isArray(list)) throw new EditError('items: list expected');
	if (list.length > MAX.items) throw new EditError(`items: ${MAX.items} at most`);
	return list.map((item, i) => record(item, `items[${i}]`));
}

function bool(value: unknown, what: string): boolean {
	if (typeof value !== 'boolean') throw new EditError(`${what}: boolean expected`);
	return value;
}

const parsers: { [K in EditSection]: (body: unknown) => EditSections[K] } = {
	hero(body) {
		const input = record(body, 'body');
		const email = text(input.email, MAX.email, 'email', true);
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new EditError('email: invalid');
		return {
			email,
			headline: localizedText(input.headline, MAX.headline, 'headline'),
			bio: localizedText(input.bio, MAX.bio, 'bio')
		};
	},
	about(body) {
		return { about: localizedText(record(body, 'body').about, MAX.about, 'about') };
	},
	facts(body) {
		return {
			items: items(body).map((item, i): FactEdit => {
				const icon = text(item.icon ?? '', 100, `items[${i}].icon`);
				if (icon && !/^[a-z0-9-]+:[a-z0-9-]+$/.test(icon)) throw new EditError(`items[${i}].icon: invalid`);
				return {
					icon,
					onSite: bool(item.onSite, `items[${i}].onSite`),
					onCv: bool(item.onCv, `items[${i}].onCv`),
					label: localizedText(item.label, MAX.factLabel, `items[${i}].label`),
					value: localizedText(item.value, MAX.factValue, `items[${i}].value`)
				};
			})
		};
	},
	languages(body) {
		const parsed = items(body).map((item, i): LanguageEdit => {
			const code = text(item.code, MAX.languageCode, `items[${i}].code`, true).toLowerCase();
			if (!LANGUAGE_CODE.test(code)) throw new EditError(`items[${i}].code: invalid`);
			const percent = item.percent;
			if (typeof percent !== 'number' || !Number.isInteger(percent) || percent < 0 || percent > 100) {
				throw new EditError(`items[${i}].percent: 0-100 expected`);
			}
			return {
				code,
				name: localizedText(item.name, MAX.languageName, `items[${i}].name`),
				cefr: text(item.cefr, MAX.cefr, `items[${i}].cefr`, true),
				percent,
				level: localizedText(item.level, MAX.level, `items[${i}].level`)
			};
		});
		if (new Set(parsed.map((language) => language.code)).size !== parsed.length) {
			throw new EditError('items: each language once');
		}
		return { items: parsed };
	},
	hobbies(body) {
		return {
			items: items(body).map((item, i): HobbyEdit => ({
				name: localizedText(item.name, MAX.hobbyName, `items[${i}].name`),
				reason: localizedText(item.reason, MAX.hobbyReason, `items[${i}].reason`, false)
			}))
		};
	}
};

/** Checks and normalizes (trims) the data sent by the editor; throws EditError. */
export function parseSection<S extends EditSection>(section: S, body: unknown): EditSections[S] {
	return parsers[section](body);
}

// ─── Writing ─────────────────────────────────────────────────────────────────

/** Inserts the translations of a row, one per locale with at least one text ('' → NULL) */
async function insertTranslations(
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

/** Updates some person_i18n columns, leaving the others (bio, CV title…) untouched */
async function updatePersonTexts(tx: Transaction, pid: number, columns: Record<string, Localized>): Promise<void> {
	const names = Object.keys(columns);
	for (const locale of locales) {
		await tx.query(
			`INSERT INTO person_i18n (person_id, locale, ${names.join(', ')}) VALUES (?, ?, ${names.map(() => '?').join(', ')})
			ON DUPLICATE KEY UPDATE ${names.map((name) => `${name} = VALUES(${name})`).join(', ')}`,
			[pid, locale, ...names.map((name) => columns[name][locale] || null)]
		);
	}
}

const writers: { [K in EditSection]: (tx: Transaction, pid: number, data: EditSections[K]) => Promise<void> } = {
	async hero(tx, pid, data) {
		await tx.query('UPDATE person SET email = ? WHERE id = ?', [data.email, pid]);
		await updatePersonTexts(tx, pid, { headline: data.headline, bio: data.bio });
	},
	async about(tx, pid, data) {
		await updatePersonTexts(tx, pid, { about: data.about });
	},
	async facts(tx, pid, data) {
		await tx.query('DELETE FROM fact WHERE person_id = ?', [pid]);
		for (const [i, fact] of data.items.entries()) {
			const id = await tx.insert(
				'INSERT INTO fact (person_id, icon, on_site, on_cv, position) VALUES (?, ?, ?, ?, ?)',
				[pid, fact.icon || null, fact.onSite, fact.onCv, i + 1]
			);
			await insertTranslations(tx, 'fact_i18n', 'fact_id', id, { label: fact.label, value: fact.value });
		}
	},
	async languages(tx, pid, data) {
		await tx.query('DELETE FROM person_language WHERE person_id = ?', [pid]);
		for (const [i, language] of data.items.entries()) {
			await tx.query('INSERT IGNORE INTO language (code) VALUES (?)', [language.code]);
			// Names belong to the language itself
			for (const locale of locales) {
				await tx.query(
					`INSERT INTO language_i18n (language_code, locale, name) VALUES (?, ?, ?)
					ON DUPLICATE KEY UPDATE name = VALUES(name)`,
					[language.code, locale, language.name[locale] || null]
				);
			}
			const id = await tx.insert(
				'INSERT INTO person_language (person_id, language_code, cefr, percent, position) VALUES (?, ?, ?, ?, ?)',
				[pid, language.code, language.cefr, language.percent, i + 1]
			);
			await insertTranslations(tx, 'person_language_i18n', 'person_language_id', id, { level_label: language.level });
		}
	},
	async hobbies(tx, pid, data) {
		await tx.query('DELETE FROM hobby WHERE person_id = ?', [pid]);
		for (const [i, hobby] of data.items.entries()) {
			const id = await tx.insert('INSERT INTO hobby (person_id, position) VALUES (?, ?)', [pid, i + 1]);
			await insertTranslations(tx, 'hobby_i18n', 'hobby_id', id, { name: hobby.name, reason: hobby.reason });
		}
	}
};

/** Saves a section validated by parseSection, all or nothing. */
export async function writeSection<S extends EditSection>(section: S, data: EditSections[S]): Promise<void> {
	const pid = await personId();
	await writeTransaction((tx) => writers[section](tx, pid, data));
}
