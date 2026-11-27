-- Content editing: a translation may leave any field empty, it then falls back to French
-- (the queries already read COALESCE(locale, fr) column by column). French stays required,
-- checked by the editor (src/lib/server/edit/).
-- Run once on an existing database (db/schema.sql already contains these changes).

ALTER TABLE fact_i18n MODIFY label VARCHAR(100) NULL, MODIFY value VARCHAR(255) NULL;
ALTER TABLE language_i18n MODIFY name VARCHAR(100) NULL;
ALTER TABLE person_language_i18n MODIFY level_label VARCHAR(100) NULL;
ALTER TABLE hobby_i18n MODIFY name VARCHAR(100) NULL;
