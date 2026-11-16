import { ageFrom } from '#lib/cv/helpers.js';
import type { CV, PublicCV, SkillCatalog } from '#lib/cv/types.js';
import en from './en.json';
import fr from './fr.json';
import skillsData from './skills.json';

// Données du CV : lues uniquement côté serveur (src/lib/server ne peut pas être
// importé côté client). Seule la version publique est envoyée au navigateur.
const sources: Record<string, CV> = { fr: fr as CV, en: en as CV };

export const skills: SkillCatalog = skillsData;

export function getPublicCV(locale: string): PublicCV {
	const cv = sources[locale] ?? sources.fr;
	const { references: _references, contact, ...infos } = cv.infos;
	return {
		...cv,
		infos: {
			...infos,
			contact: {
				name: contact.name,
				email: contact.email,
				city: contact.city,
				age: ageFrom(contact.age)
			}
		}
	};
}
