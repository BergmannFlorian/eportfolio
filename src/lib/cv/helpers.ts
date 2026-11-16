import { getLocale } from '#lib/paraglide/runtime.js';

const dateLocales: Record<string, string> = { fr: 'fr-FR', en: 'en-GB' };

/** Parses a "DD.MM.YYYY" date into a Date. */
export function getDate(date: string): Date {
	const [day, month, year] = date.split('.').map(Number);
	return new Date(year, month - 1, day);
}

export function dateFormat(
	date: string,
	options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' }
): string {
	return getDate(date).toLocaleDateString(dateLocales[getLocale()] ?? 'fr-FR', options);
}

/** "Jan - Jun 2021" within the same year, otherwise "2019 - 2021". */
export function shortDate(start: string, end: string): string {
	const startDate = getDate(start);
	const endDate = getDate(end);
	if (startDate.getFullYear() === endDate.getFullYear()) {
		return `${dateFormat(start, { month: 'short' })} - ${dateFormat(end, { month: 'short', year: 'numeric' })}`;
	}
	return `${startDate.getFullYear()} - ${endDate.getFullYear()}`;
}

/** Age in completed years as of today. */
export function ageFrom(birthdate: string, now = new Date()): number {
	const birth = getDate(birthdate);
	let age = now.getFullYear() - birth.getFullYear();
	const hadBirthday =
		now.getMonth() > birth.getMonth() ||
		(now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
	if (!hadBirthday) age--;
	return age;
}
