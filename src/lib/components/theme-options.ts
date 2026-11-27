import { m } from '#lib/paraglide/messages.js';
import { themes, type ThemePreference } from '#lib/theme/themes.js';

/** "System" followed by every registered theme, with their labels. */
export function themeOptions(): { value: ThemePreference; label: string }[] {
	return [
		{ value: 'system', label: m.theme_system() },
		...themes.map((t) => ({ value: t.id, label: t.label() }))
	];
}
