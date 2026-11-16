import { m } from '#lib/paraglide/messages.js';

/**
 * Registre des thèmes.
 *
 * Pour ajouter un thème :
 * 1. créer `src/lib/theme/themes/<id>.css` avec un bloc `[data-theme='<id>'] { … }`
 *    qui définit toutes les variables (copier light.css comme base) ;
 * 2. l'importer dans `src/app.css` ;
 * 3. ajouter une entrée ci-dessous et son libellé dans `messages/*.json`.
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

/** Thème appliqué quand la préférence est « Système », selon le réglage de l'OS. */
export const systemThemes: Record<'light' | 'dark', ThemeId> = {
	light: 'light',
	dark: 'dark'
};

export const THEME_STORAGE_KEY = 'theme';

export const themeIds: readonly string[] = themes.map((t) => t.id);

export function isThemeId(value: unknown): value is ThemeId {
	return typeof value === 'string' && themeIds.includes(value);
}
