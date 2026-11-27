/**
 * Profile texts edited from the home page: hero, about, facts, spoken languages, hobbies.
 * Lists are replaced as a whole: their ids are not referenced anywhere else. Private
 * columns (address, birthdate, references) are never read nor written here.
 */

import {
	EDIT_LIMITS as MAX,
	LANGUAGE_CODE,
	type EditSections,
	type FactEdit,
	type HobbyEdit,
	type LanguageEdit,
	type Localized
} from '#lib/content/edit.js';
import { locales } from '#lib/paraglide/runtime.js';
import { writeQuery, writeTransaction, type Transaction } from '#lib/server/db/index.js';
import {
	EditError,
	bool,
	byParent,
	insertTranslations,
	integer,
	items,
	localized,
	localizedText,
	personId,
	record,
	text,
	type Row,
	type SectionHandler
} from './shared.js';

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

/** Runs the writes of a person section in one transaction */
async function forPerson(work: (tx: Transaction, pid: number) => Promise<void>): Promise<null> {
	const pid = await personId();
	await writeTransaction((tx) => work(tx, pid));
	return null;
}

const hero: SectionHandler<EditSections['hero']> = {
	async read() {
		const pid = await personId();
		const [[person], rows] = await Promise.all([
			writeQuery<{ email: string }>('SELECT email FROM person WHERE id = ?', [pid]),
			writeQuery<Row>('SELECT locale, headline, bio FROM person_i18n WHERE person_id = ?', [pid])
		]);
		return { email: person.email, headline: localized(rows, 'headline'), bio: localized(rows, 'bio') };
	},
	parse(body) {
		const input = record(body, 'body');
		const email = text(input.email, MAX.email, 'email', true);
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new EditError('email: invalid');
		return {
			email,
			headline: localizedText(input.headline, MAX.headline, 'headline'),
			bio: localizedText(input.bio, MAX.bio, 'bio')
		};
	},
	write: (data) =>
		forPerson(async (tx, pid) => {
			await tx.query('UPDATE person SET email = ? WHERE id = ?', [data.email, pid]);
			await updatePersonTexts(tx, pid, { headline: data.headline, bio: data.bio });
		})
};

const about: SectionHandler<EditSections['about']> = {
	async read() {
		const rows = await writeQuery<Row>('SELECT locale, about FROM person_i18n WHERE person_id = ?', [await personId()]);
		return { about: localized(rows, 'about') };
	},
	parse(body) {
		return { about: localizedText(record(body, 'body').about, MAX.about, 'about') };
	},
	write: (data) => forPerson((tx, pid) => updatePersonTexts(tx, pid, { about: data.about }))
};

const facts: SectionHandler<EditSections['facts']> = {
	async read() {
		const pid = await personId();
		const [rows, i18nRows] = await Promise.all([
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
		const i18n = byParent(i18nRows, 'fact_id');
		return {
			items: rows.map((fact) => ({
				icon: fact.icon ?? '',
				onSite: Number(fact.on_site) === 1,
				onCv: Number(fact.on_cv) === 1,
				label: localized(i18n.get(fact.id) ?? [], 'label'),
				value: localized(i18n.get(fact.id) ?? [], 'value')
			}))
		};
	},
	parse(body) {
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
	write: (data) =>
		forPerson(async (tx, pid) => {
			await tx.query('DELETE FROM fact WHERE person_id = ?', [pid]);
			for (const [i, fact] of data.items.entries()) {
				const id = await tx.insert(
					'INSERT INTO fact (person_id, icon, on_site, on_cv, position) VALUES (?, ?, ?, ?, ?)',
					[pid, fact.icon || null, fact.onSite, fact.onCv, i + 1]
				);
				await insertTranslations(tx, 'fact_i18n', 'fact_id', id, { label: fact.label, value: fact.value });
			}
		})
};

const languages: SectionHandler<EditSections['languages']> = {
	async read() {
		const pid = await personId();
		const [rows, levels, names] = await Promise.all([
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
			items: rows.map((language) => ({
				code: language.code,
				name: localized(namesByCode.get(language.code) ?? [], 'name'),
				cefr: language.cefr,
				percent: Number(language.percent),
				level: localized(levelsById.get(language.id) ?? [], 'level_label')
			}))
		};
	},
	parse(body) {
		const parsed = items(body).map((item, i): LanguageEdit => {
			const code = text(item.code, MAX.languageCode, `items[${i}].code`, true).toLowerCase();
			if (!LANGUAGE_CODE.test(code)) throw new EditError(`items[${i}].code: invalid`);
			return {
				code,
				name: localizedText(item.name, MAX.languageName, `items[${i}].name`),
				cefr: text(item.cefr, MAX.cefr, `items[${i}].cefr`, true),
				percent: integer(item.percent, `items[${i}].percent`, 0, 100),
				level: localizedText(item.level, MAX.level, `items[${i}].level`)
			};
		});
		if (new Set(parsed.map((language) => language.code)).size !== parsed.length) {
			throw new EditError('items: each language once');
		}
		return { items: parsed };
	},
	write: (data) =>
		forPerson(async (tx, pid) => {
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
				await insertTranslations(tx, 'person_language_i18n', 'person_language_id', id, {
					level_label: language.level
				});
			}
		})
};

const hobbies: SectionHandler<EditSections['hobbies']> = {
	async read() {
		const pid = await personId();
		const [rows, i18nRows] = await Promise.all([
			writeQuery<{ id: number }>('SELECT id FROM hobby WHERE person_id = ? ORDER BY position, id', [pid]),
			writeQuery<Row>(
				`SELECT t.hobby_id, t.locale, t.name, t.reason FROM hobby_i18n t
				JOIN hobby h ON h.id = t.hobby_id WHERE h.person_id = ?`,
				[pid]
			)
		]);
		const i18n = byParent(i18nRows, 'hobby_id');
		return {
			items: rows.map((hobby) => ({
				name: localized(i18n.get(hobby.id) ?? [], 'name'),
				reason: localized(i18n.get(hobby.id) ?? [], 'reason')
			}))
		};
	},
	parse(body) {
		return {
			items: items(body).map((item, i): HobbyEdit => ({
				name: localizedText(item.name, MAX.hobbyName, `items[${i}].name`),
				reason: localizedText(item.reason, MAX.hobbyReason, `items[${i}].reason`, false)
			}))
		};
	},
	write: (data) =>
		forPerson(async (tx, pid) => {
			await tx.query('DELETE FROM hobby WHERE person_id = ?', [pid]);
			for (const [i, hobby] of data.items.entries()) {
				const id = await tx.insert('INSERT INTO hobby (person_id, position) VALUES (?, ?)', [pid, i + 1]);
				await insertTranslations(tx, 'hobby_i18n', 'hobby_id', id, { name: hobby.name, reason: hobby.reason });
			}
		})
};

export const profileSections = { hero, about, facts, languages, hobbies };
