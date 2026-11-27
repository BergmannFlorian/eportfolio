/**
 * Skill catalog edited from the home page ("Stack" band and "Skills" section).
 * Categories are a fixed set (the CV groups skills by their codes): only their names
 * change. Skills keep their ids, referenced by projects and experiences; deleting
 * one also removes it from them (ON DELETE CASCADE).
 */

import { EDIT_LIMITS as MAX, type EditSections, type SkillCategoryEdit, type SkillEdit } from '#lib/content/edit.js';
import { locales } from '#lib/paraglide/runtime.js';
import { writeQuery, writeTransaction } from '#lib/server/db/index.js';
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

const skills: SectionHandler<EditSections['skills']> = {
	async read() {
		const [categories, names, rows] = await Promise.all([
			writeQuery<{ id: number }>('SELECT id FROM skill_category ORDER BY position, id'),
			writeQuery<Row>('SELECT skill_category_id, locale, name FROM skill_category_i18n'),
			writeQuery<{ id: number; category_id: number; name: string; in_stack: number; on_site: number; uses: number }>(
				`SELECT s.id, s.category_id, s.name, s.in_stack, s.on_site,
					(SELECT COUNT(*) FROM project_skill ps WHERE ps.skill_id = s.id)
					+ (SELECT COUNT(*) FROM experience_skill es WHERE es.skill_id = s.id) AS uses
				FROM skill s ORDER BY s.position, s.id`
			)
		]);
		const namesById = byParent(names, 'skill_category_id');
		return {
			categories: categories.map(
				(category): SkillCategoryEdit => ({
					id: category.id,
					name: localized(namesById.get(category.id) ?? [], 'name'),
					skills: rows
						.filter((skill) => skill.category_id === category.id)
						.map((skill) => ({
							id: skill.id,
							name: skill.name,
							inStack: Number(skill.in_stack) === 1,
							onSite: Number(skill.on_site) === 1,
							uses: Number(skill.uses)
						}))
				})
			)
		};
	},

	parse(body) {
		const categories = list(record(body, 'body').categories, 'categories', 20).map((value, c): SkillCategoryEdit => {
			const category = record(value, `categories[${c}]`);
			const parsed = list(category.skills, `categories[${c}].skills`, MAX.skills).map((entry, s): SkillEdit => {
				const skill = record(entry, `categories[${c}].skills[${s}]`);
				const what = `categories[${c}].skills[${s}]`;
				return {
					id: skill.id === null ? null : integer(skill.id, `${what}.id`, 1, MAX_ID),
					name: text(skill.name, MAX.skillName, `${what}.name`, true),
					inStack: bool(skill.inStack, `${what}.inStack`),
					onSite: bool(skill.onSite, `${what}.onSite`),
					uses: 0
				};
			});
			// The database compares names without case (utf8mb4_unicode_ci)
			const lower = parsed.map((skill) => skill.name.toLowerCase());
			if (new Set(lower).size !== lower.length) throw new EditError(`categories[${c}]: duplicate skill name`);
			return {
				id: integer(category.id, `categories[${c}].id`, 1, MAX_ID),
				name: localizedText(category.name, MAX.categoryName, `categories[${c}].name`),
				skills: parsed
			};
		});
		const ids = categories.flatMap((category) => category.skills.map((skill) => skill.id)).filter((id) => id !== null);
		if (new Set(ids).size !== ids.length) throw new EditError('skills: duplicate id');
		return { categories };
	},

	async write(data) {
		await writeTransaction(async (tx) => {
			const existingCategories = (await tx.query<{ id: number }>('SELECT id FROM skill_category FOR UPDATE')).map((row) =>
				Number(row.id)
			);
			const sent = data.categories.map((category) => category.id);
			if (sent.length !== existingCategories.length || sent.some((id) => !existingCategories.includes(id))) {
				throw new EditError('categories: every category, once');
			}

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

			for (const category of data.categories) {
				for (const locale of locales) {
					const name = category.name[locale];
					if (name) {
						await tx.query(
							`INSERT INTO skill_category_i18n (skill_category_id, locale, name) VALUES (?, ?, ?)
							ON DUPLICATE KEY UPDATE name = VALUES(name)`,
							[category.id, locale, name]
						);
					} else {
						// No translation: falls back to French
						await tx.query('DELETE FROM skill_category_i18n WHERE skill_category_id = ? AND locale = ?', [
							category.id,
							locale
						]);
					}
				}
				for (const [i, skill] of category.skills.entries()) {
					const values = [category.id, skill.name, skill.inStack, skill.onSite, i + 1];
					if (skill.id === null) {
						await tx.query(
							'INSERT INTO skill (category_id, name, in_stack, on_site, position) VALUES (?, ?, ?, ?, ?)',
							values
						);
					} else {
						await tx.query(
							'UPDATE skill SET category_id = ?, name = ?, in_stack = ?, on_site = ?, position = ? WHERE id = ?',
							[...values, skill.id]
						);
					}
				}
			}
		});
		return null;
	}
};

export const skillSections = { skills };
