/** Image library of the editor: GET /admin/media/library (signed in only). */

export interface LibraryImage {
	file: string;
	/** /media/<file> */
	url: string;
	type: 'webp' | 'png' | 'jpg' | 'svg';
	size: number;
	/** Slots showing this file; empty when unused (it can then be deleted) */
	usedBy: { target: 'portrait' | 'project' | 'logo'; name: string | null }[];
}
