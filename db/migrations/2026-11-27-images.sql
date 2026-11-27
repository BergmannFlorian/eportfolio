-- Uploaded images: portrait, project images, organization logos.
-- Files live in UPLOADS_DIR (REMOTE_PATH/uploads in production) and are served at /media/<file>.
-- Run once on an existing database (db/schema.sql already contains these columns).

ALTER TABLE person ADD COLUMN photo_file VARCHAR(64) NULL AFTER photo_url;
ALTER TABLE person_i18n ADD COLUMN photo_alt VARCHAR(255) NULL AFTER cv_title;

ALTER TABLE project ADD COLUMN image_file VARCHAR(64) NULL AFTER image;

CREATE TABLE IF NOT EXISTS project_i18n (
	project_id INT UNSIGNED NOT NULL,
	locale     VARCHAR(5)   NOT NULL,
	image_alt  VARCHAR(255) NULL,
	PRIMARY KEY (project_id, locale),
	CONSTRAINT fk_project_i18n_project FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE,
	CONSTRAINT fk_project_i18n_locale  FOREIGN KEY (locale) REFERENCES locale (code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE organization ADD COLUMN logo_file VARCHAR(64) NULL AFTER website;
