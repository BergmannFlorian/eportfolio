import { m } from '#lib/paraglide/messages.js';

/**
 * Theme registry.
 *
 * To add a theme:
 * 1. create `src/lib/theme/themes/<id>.css` with a `[data-theme='<id>'] { … }` block
 *    defining every variable (use light.css as a starting point);
 * 2. import it in `src/app.css`;
 * 3. add an entry below and its label in `messages/*.json`.
 */
export const themes = [
	{ id: 'light', label: () => m.theme_light(), scheme: 'light' },
	{ id: 'dark', label: () => m.theme_dark(), scheme: 'dark' }
] as const satisfies readonly ThemeDefinition[];

interface ThemeDefinition {
	id: string;
	label: () => string;
	scheme: 'light' | 'dark';
}

export type ThemeId = (typeof themes)[number]['id'];
export type ThemePreference = 'system' | ThemeId;

/** Theme applied when the preference is "System", based on the OS setting. */
export const systemThemes: Record<'light' | 'dark', ThemeId> = {
	light: 'light',
	dark: 'dark'
};

export const THEME_STORAGE_KEY = 'theme';

export const themeIds: readonly string[] = themes.map((t) => t.id);

export function isThemeId(value: unknown): value is ThemeId {
	return typeof value === 'string' && themeIds.includes(value);
}
