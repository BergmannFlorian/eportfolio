/**
 * Content only shown on the CV: heading, name and city, certificates, social links.
 * The address, the birthdate and the references are private: never read nor written here.
 */

import {
	EDIT_LIMITS as MAX,
	SOCIAL_NETWORK,
	type CertificateEdit,
	type EditSections,
	type SocialEdit
} from '#lib/content/edit.js';
import { locales } from '#lib/paraglide/runtime.js';
import { writeQuery, writeTransaction } from '#lib/server/db/index.js';
import {
	EditError,
	httpUrl,
	isoDate,
	items,
	localized,
	localizedText,
	personId,
	record,
	text,
	type Row,
	type SectionHandler
} from './shared.js';

const cv: SectionHandler<EditSections['cv']> = {
	async read() {
		const pid = await personId();
		const [[person], rows] = await Promise.all([
			writeQuery<{ name: string; postal_code: string | null; city: string | null }>(
				'SELECT name, postal_code, city FROM person WHERE id = ?',
				[pid]
			),
			writeQuery<Row>('SELECT locale, cv_title FROM person_i18n WHERE person_id = ?', [pid])
		]);
		return {
			name: person.name,
			postalCode: person.postal_code ?? '',
			city: person.city ?? '',
			cvTitle: localized(rows, 'cv_title')
		};
	},
	parse(body) {
		const input = record(body, 'body');
		return {
			name: text(input.name, MAX.personName, 'name', true),
			postalCode: text(input.postalCode ?? '', MAX.postalCode, 'postalCode'),
			city: text(input.city ?? '', MAX.city, 'city'),
			cvTitle: localizedText(input.cvTitle, MAX.cvTitle, 'cvTitle')
		};
	},
	async write(data) {
		const pid = await personId();
		await writeTransaction(async (tx) => {
			await tx.query('UPDATE person SET name = ?, postal_code = ?, city = ? WHERE id = ?', [
				data.name,
				data.postalCode || null,
				data.city || null,
				pid
			]);
			for (const locale of locales) {
				// person_i18n rows hold the bio too: only touch the CV title
				await tx.query(
					`INSERT INTO person_i18n (person_id, locale, cv_title) VALUES (?, ?, ?)
					ON DUPLICATE KEY UPDATE cv_title = VALUES(cv_title)`,
					[pid, locale, data.cvTitle[locale] || null]
				);
			}
		});
		return null;
	}
};

const certificates: SectionHandler<EditSections['certificates']> = {
	async read() {
		const rows = await writeQuery<{ title: string; issuer: string | null; issued_on: string; url: string | null }>(
			'SELECT title, issuer, issued_on, url FROM certificate WHERE person_id = ? ORDER BY issued_on, id',
			[await personId()]
		);
		return {
			items: rows.map((row) => ({
				title: row.title,
				issuer: row.issuer ?? '',
				issuedOn: row.issued_on,
				url: row.url ?? ''
			}))
		};
	},
	parse(body) {
		return {
			items: items(body).map(
				(item, i): CertificateEdit => ({
					title: text(item.title, MAX.certificateTitle, `items[${i}].title`, true),
					issuer: text(item.issuer ?? '', MAX.issuer, `items[${i}].issuer`),
					issuedOn: isoDate(item.issuedOn, `items[${i}].issuedOn`),
					url: httpUrl(item.url, MAX.url, `items[${i}].url`)
				})
			)
		};
	},
	async write(data) {
		const pid = await personId();
		await writeTransaction(async (tx) => {
			await tx.query('DELETE FROM certificate WHERE person_id = ?', [pid]);
			for (const item of data.items) {
				await tx.query('INSERT INTO certificate (person_id, title, issuer, issued_on, url) VALUES (?, ?, ?, ?, ?)', [
					pid,
					item.title,
					item.issuer || null,
					item.issuedOn,
					item.url || null
				]);
			}
		});
		return null;
	}
};

const socials: SectionHandler<EditSections['socials']> = {
	async read() {
		const rows = await writeQuery<{ network: string; url: string }>(
			'SELECT network, url FROM social_link WHERE person_id = ? ORDER BY position, id',
			[await personId()]
		);
		return { items: rows.map((row) => ({ network: row.network, url: row.url })) };
	},
	parse(body) {
		return {
			items: items(body).map((item, i): SocialEdit => {
				const network = text(item.network, 50, `items[${i}].network`, true).toLowerCase();
				if (!SOCIAL_NETWORK.test(network)) throw new EditError(`items[${i}].network: invalid`);
				return { network, url: httpUrl(item.url, MAX.url, `items[${i}].url`, true) };
			})
		};
	},
	async write(data) {
		const pid = await personId();
		await writeTransaction(async (tx) => {
			await tx.query('DELETE FROM social_link WHERE person_id = ?', [pid]);
			for (const [i, item] of data.items.entries()) {
				await tx.query('INSERT INTO social_link (person_id, network, url, position) VALUES (?, ?, ?, ?)', [
					pid,
					item.network,
					item.url,
					i + 1
				]);
			}
		});
		return null;
	}
};

export const cvSections = { cv, certificates, socials };
