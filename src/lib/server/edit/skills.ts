/**
 * Skill catalog edited from the home page ("Stack" band and "Skills" section) and its
 * structure: categories can be added, renamed, reordered and removed once empty; both
 * categories and skills choose whether they appear on the CV. Category codes stay stable
 * (the API exposes them); a new category gets one from its French name. Skills keep their
 * ids, referenced by projects and experiences; deleting one also removes it from them
 * (ON DELETE CASCADE).
 */

import { EDIT_LIMITS as MAX, type EditSections, type SkillCategoryEdit, type SkillEdit } from '#lib/content/edit.js';
import { locales } from '#lib/paraglide/runtime.js';
import { getSkillLevels } from '#lib/server/content/index.js';
import { writeQuery, writeTransaction, type Transaction } from '#lib/server/db/index.js';
import {
	EditError,
	bool,
	byParent,
	integer,
	list,
	localized,
	localizedText,
	record,
	text,
	type Row,
	type SectionHandler
} from './shared.js';

const MAX_ID = 2 ** 32 - 1;
const MAX_CATEGORIES = 20;

/** Unused category code from a name: "Bibliothèques" → "bibliotheques" (20 chars at most) */
async function newCode(tx: Transaction, name: string): Promise<string> {
	const base =
		name
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 16) || 'category';
	const taken = new Set((await tx.query<{ code: string }>('SELECT code FROM skill_category')).map((row) => row.code));
	let code = base;
	for (let i = 2; taken.has(code); i++) code = `${base}-${i}`;
	return code;
}

const skills: SectionHandler<EditSections['skills']> = {
	async read() {
		const [categories, names, rows, levels] = await Promise.all([
			writeQuery<{ id: number; code: string; on_cv: number }>(
				'SELECT id, code, on_cv FROM skill_category ORDER BY position, id'
			),
			writeQuery<Row>('SELECT skill_category_id, locale, name FROM skill_category_i18n'),
			writeQuery<{
				id: number;
				category_id: number;
				name: string;
				in_stack: number;
				on_site: number;
				on_cv: number;
				uses: number;
			}>(
				`SELECT s.id, s.category_id, s.name, s.in_stack, s.on_site, s.on_cv,
					(SELECT COUNT(*) FROM project_skill ps WHERE ps.skill_id = s.id)
					+ (SELECT COUNT(*) FROM experience_skill es WHERE es.skill_id = s.id) AS uses
				FROM skill s ORDER BY s.position, s.id`
			),
			// Same levels as the CV, to group the cards of the editor
			getSkillLevels()
		]);
		const namesById = byParent(names, 'skill_category_id');
		return {
			categories: categories.map(
				(category): SkillCategoryEdit => ({
					id: category.id,
					code: category.code,
					name: localized(namesById.get(category.id) ?? [], 'name'),
					onCv: Number(category.on_cv) === 1,
					skills: rows
						.filter((skill) => skill.category_id === category.id)
						.map((skill) => ({
							id: skill.id,
							name: skill.name,
							inStack: Number(skill.in_stack) === 1,
							onSite: Number(skill.on_site) === 1,
							onCv: Number(skill.on_cv) === 1,
							uses: Number(skill.uses),
							level: levels.get(skill.id)?.level ?? null,
							personalOnly: levels.get(skill.id)?.personalOnly ?? false
						}))
				})
			)
		};
	},

	parse(body) {
		const categories = list(record(body, 'body').categories, 'categories', MAX_CATEGORIES).map(
			(value, c): SkillCategoryEdit => {
				const category = record(value, `categories[${c}]`);
				const parsed = list(category.skills, `categories[${c}].skills`, MAX.skills).map((entry, s): SkillEdit => {
					const skill = record(entry, `categories[${c}].skills[${s}]`);
					const what = `categories[${c}].skills[${s}]`;
					return {
						id: skill.id === null ? null : integer(skill.id, `${what}.id`, 1, MAX_ID),
						name: text(skill.name, MAX.skillName, `${what}.name`, true),
						inStack: bool(skill.inStack, `${what}.inStack`),
						onSite: bool(skill.onSite, `${what}.onSite`),
						onCv: bool(skill.onCv, `${what}.onCv`),
						uses: 0,
						level: null,
						personalOnly: false
					};
				});
				// The database compares names without case (utf8mb4_unicode_ci)
				const lower = parsed.map((skill) => skill.name.toLowerCase());
				if (new Set(lower).size !== lower.length) throw new EditError(`categories[${c}]: duplicate skill name`);
				return {
					id: category.id === null ? null : integer(category.id, `categories[${c}].id`, 1, MAX_ID),
					code: '',
					name: localizedText(category.name, MAX.categoryName, `categories[${c}].name`),
					onCv: bool(category.onCv, `categories[${c}].onCv`),
					skills: parsed
				};
			}
		);
		const categoryIds = categories.map((category) => category.id).filter((id) => id !== null);
		if (new Set(categoryIds).size !== categoryIds.length) throw new EditError('categories: duplicate id');
		const ids = categories.flatMap((category) => category.skills.map((skill) => skill.id)).filter((id) => id !== null);
		if (new Set(ids).size !== ids.length) throw new EditError('skills: duplicate id');
		return { categories };
	},

	async write(data) {
		await writeTransaction(async (tx) => {
			const existingCategories = new Set(
				(await tx.query<{ id: number }>('SELECT id FROM skill_category FOR UPDATE')).map((row) => Number(row.id))
			);
			const keptCategories = data.categories.map((category) => category.id).filter((id) => id !== null);
			if (keptCategories.some((id) => !existingCategories.has(id))) throw new EditError('categories: unknown category');

			const existingSkills = new Set(
				(await tx.query<{ id: number }>('SELECT id FROM skill FOR UPDATE')).map((row) => Number(row.id))
			);
			const kept = data.categories.flatMap((category) => category.skills.map((skill) => skill.id)).filter((id) => id !== null);
			if (kept.some((id) => !existingSkills.has(id))) throw new EditError('skills: unknown skill');
			const removed = [...existingSkills].filter((id) => !kept.includes(id));
			if (removed.length > 0) {
				await tx.query(`DELETE FROM skill WHERE id IN (${removed.map(() => '?').join(', ')})`, removed);
			}
			// Temporary unique names first: renaming or moving skills must not collide
			// with (category, name) rows updated later in the loop
			if (kept.length > 0) {
				await tx.query(
					`UPDATE skill SET name = CONCAT('\u0001', id) WHERE id IN (${kept.map(() => '?').join(', ')})`,
					kept
				);
			}

			for (const [c, category] of data.categories.entries()) {
				let categoryId: number;
				if (category.id === null) {
					categoryId = await tx.insert('INSERT INTO skill_category (code, on_cv, position) VALUES (?, ?, ?)', [
						await newCode(tx, category.name.fr ?? ''),
						category.onCv,
						c + 1
					]);
				} else {
					categoryId = category.id;
					await tx.query('UPDATE skill_category SET on_cv = ?, position = ? WHERE id = ?', [
						category.onCv,
						c + 1,
						categoryId
					]);
				}
				for (const locale of locales) {
					const name = category.name[locale];
					if (name) {
						await tx.query(
							`INSERT INTO skill_category_i18n (skill_category_id, locale, name) VALUES (?, ?, ?)
							ON DUPLICATE KEY UPDATE name = VALUES(name)`,
							[categoryId, locale, name]
						);
					} else {
						// No translation: falls back to French
						await tx.query('DELETE FROM skill_category_i18n WHERE skill_category_id = ? AND locale = ?', [
							categoryId,
							locale
						]);
					}
				}
				for (const [i, skill] of category.skills.entries()) {
					const values = [categoryId, skill.name, skill.inStack, skill.onSite, skill.onCv, i + 1];
					if (skill.id === null) {
						await tx.query(
							'INSERT INTO skill (category_id, name, in_stack, on_site, on_cv, position) VALUES (?, ?, ?, ?, ?, ?)',
							values
						);
					} else {
						await tx.query(
							'UPDATE skill SET category_id = ?, name = ?, in_stack = ?, on_site = ?, on_cv = ?, position = ? WHERE id = ?',
							[...values, skill.id]
						);
					}
				}
			}

			// Categories left out are deleted; their skills were moved or deleted above
			const removedCategories = [...existingCategories].filter((id) => !keptCategories.includes(id));
			if (removedCategories.length > 0) {
				const [{ count }] = await tx.query<{ count: number }>(
					`SELECT COUNT(*) AS count FROM skill WHERE category_id IN (${removedCategories.map(() => '?').join(', ')})`,
					removedCategories
				);
				if (Number(count) > 0) throw new EditError('categories: a removed category still has skills');
				await tx.query(
					`DELETE FROM skill_category WHERE id IN (${removedCategories.map(() => '?').join(', ')})`,
					removedCategories
				);
			}
		});
		return null;
	}
};

export const skillSections = { skills };
