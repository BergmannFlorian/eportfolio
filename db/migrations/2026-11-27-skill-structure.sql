-- Skill structure editing: categories can be added, renamed, reordered and removed from
-- the site, and both categories and skills choose whether they appear on the CV.
-- The CV used to show only the langs, libs and tools categories: business starts hidden.
-- Run once on an existing database (db/schema.sql already contains these columns).

ALTER TABLE skill_category ADD COLUMN on_cv BOOLEAN NOT NULL DEFAULT TRUE AFTER code;
UPDATE skill_category SET on_cv = FALSE WHERE code = 'librairies';
ALTER TABLE skill ADD COLUMN on_cv BOOLEAN NOT NULL DEFAULT TRUE AFTER on_site;
