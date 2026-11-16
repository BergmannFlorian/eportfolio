import {
	THEME_STORAGE_KEY,
	isThemeId,
	systemThemes,
	themeIds,
	type ThemeId,
	type ThemePreference
} from './themes.js';

const darkQuery = '(prefers-color-scheme: dark)';

function readStored(): ThemePreference {
	try {
		const value = localStorage.getItem(THEME_STORAGE_KEY);
		if (isThemeId(value)) return value;
	} catch {
		// stockage indisponible (navigation privée, cookies bloqués…)
	}
	return 'system';
}

function writeStored(preference: ThemePreference) {
	try {
		if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
		else localStorage.setItem(THEME_STORAGE_KEY, preference);
	} catch {
		// ignoré : le choix vaut pour la session en cours
	}
}

function resolve(preference: ThemePreference): ThemeId {
	if (preference !== 'system') return preference;
	return systemThemes[matchMedia(darkQuery).matches ? 'dark' : 'light'];
}

class ThemeState {
	preference = $state<ThemePreference>('system');
	#started = false;

	/** À appeler une fois côté client (onMount du layout). */
	start() {
		if (this.#started) return;
		this.#started = true;
		this.preference = readStored();
		this.#apply();
		matchMedia(darkQuery).addEventListener('change', () => {
			if (this.preference === 'system') this.#apply();
		});
	}

	set(preference: ThemePreference) {
		this.preference = preference;
		writeStored(preference);
		this.#apply();
	}

	#apply() {
		document.documentElement.dataset.theme = resolve(this.preference);
	}
}

export const theme = new ThemeState();

/**
 * Script inline exécuté avant le premier rendu pour éviter un flash de thème.
 * Il reprend la logique de `resolve()` sans dépendance.
 */
export function themeInitScript(): string {
	const config = JSON.stringify({ key: THEME_STORAGE_KEY, ids: themeIds, system: systemThemes });
	return (
		`(function(){var c=${config},t=null;` +
		`try{t=localStorage.getItem(c.key)}catch(e){}` +
		`if(c.ids.indexOf(t)<0)t=c.system[matchMedia('${darkQuery}').matches?'dark':'light'];` +
		`document.documentElement.dataset.theme=t})()`
	);
}
