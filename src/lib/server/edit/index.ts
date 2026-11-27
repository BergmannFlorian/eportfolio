/**
 * Content editor (signed-in owner), used by /admin/content/<section>.
 * Every section reads through and writes with the write account (DB_WRITE_USER).
 */

import type { EditSection, EditSections } from '#lib/content/edit.js';
import { cvSections } from './cv.js';
import { experienceSections } from './experiences.js';
import { profileSections } from './profile.js';
import { projectSections } from './projects.js';
import { EditError, type SectionHandler } from './shared.js';
import { skillSections } from './skills.js';

export { EditError };

const sections: { [S in EditSection]: SectionHandler<EditSections[S]> } = {
	...profileSections,
	...projectSections,
	...skillSections,
	...experienceSections,
	...cvSections
};

/** Current content of a section, every locale as stored. `id`: project id (project section). */
export function readSection<S extends EditSection>(section: S, id: number | null = null): Promise<EditSections[S]> {
	return sections[section].read(id);
}

/** Checks and normalizes (trims) the data sent by the editor; throws EditError. */
export function parseSection<S extends EditSection>(section: S, body: unknown): EditSections[S] {
	return sections[section].parse(body);
}

/** Saves a section validated by parseSection, all or nothing. Returns the id of a created project. */
export function writeSection<S extends EditSection>(
	section: S,
	data: EditSections[S],
	id: number | null = null
): Promise<number | null> {
	return sections[section].write(data, id);
}

/** Deletes one row of a section editing single items (an experience). */
export async function removeFromSection(section: EditSection, id: number): Promise<void> {
	const handler: SectionHandler<unknown> = sections[section];
	if (!handler.remove) throw new EditError(`${section}: cannot delete`, 405);
	await handler.remove(id);
}
