/**
 * Spoken language levels (CEFR) and the length of the level bar on the home page.
 * The bar follows the level: the editor only asks for the level.
 */

export const CEFR_LEVELS = ['native', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1'] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

const BAR: Record<CefrLevel, number> = { native: 100, C2: 90, C1: 80, B2: 70, B1: 55, A2: 30, A1: 15 };

export function isCefrLevel(value: string): value is CefrLevel {
	return (CEFR_LEVELS as readonly string[]).includes(value);
}

/** "Technique (B1)" → "Technique": the level is added from the CEFR code, never typed */
export function stripCefr(label: string): string {
	return label.replace(/\s*\((?:native|[ABC][12])\)\s*$/i, '').trim();
}

/**
 * Level shown on the site and the CV: the optional label followed by the CEFR code,
 * "Technique (B1)", "B1"; a native language shows its label or `native` ("Langue maternelle").
 */
export function levelText(level: string, label: string, native: string): string {
	const text = stripCefr(label);
	const cefr = normalizeCefr(level);
	if (cefr === 'native') return text || native;
	if (!cefr) return text || level;
	return text ? `${text} (${cefr})` : cefr;
}

/** 'Native', 'b2' → 'native', 'B2'; null outside the scale */
export function normalizeCefr(value: string): CefrLevel | null {
	const trimmed = value.trim();
	const level = trimmed.toLowerCase() === 'native' ? 'native' : trimmed.toUpperCase();
	return isCefrLevel(level) ? level : null;
}

/** Bar length in percent; `fallback` for a level outside the scale (older data) */
export function cefrPercent(level: string, fallback = 0): number {
	return isCefrLevel(level) ? BAR[level] : fallback;
}
