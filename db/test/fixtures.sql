-- Fictitious data for the automated tests (loaded after db/schema.sql).
-- Every table is covered; the private values (address, birthdate, references)
-- are used by the privacy tests to check they never reach a response.

SET NAMES utf8mb4;

INSERT INTO person (id, name, email, address, postal_code, city, birthdate, photo_url) VALUES
	(1, 'Jane Doe', 'jane@example.com', 'Rue Secrète 42', '1000', 'Lausanne', '1990-05-15', NULL);

INSERT INTO person_i18n (person_id, locale, headline, bio, about, cv_title) VALUES
	(1, 'fr', 'Développeuse test', 'Bio en français.', 'À propos en français.', 'Titre du CV'),
	(1, 'en', 'Test developer', 'Bio in English.', 'About in English.', 'CV title');

INSERT INTO social_link (id, person_id, network, url, position) VALUES
	(1, 1, 'linkedin', 'https://linkedin.com/in/jane-doe', 1);

INSERT INTO reference (id, person_id, name, job_title, company, phone) VALUES
	(1, 1, 'Robert Secret', 'Manager', 'Acme SA', '+41000000000');

INSERT INTO fact (id, person_id, icon, on_site, on_cv, position) VALUES
	(1, 1, NULL, 1, 0, 1),
	(2, 1, 'solar:card-2-outline', 1, 1, 2),
	(3, 1, 'solar:ufo-outline', 0, 1, 3);

INSERT INTO fact_i18n (fact_id, locale, label, value) VALUES
	(1, 'fr', 'Domicile', 'Lausanne'),
	(1, 'en', 'Location', 'Lausanne'),
	(2, 'fr', 'Nationalité', 'Suisse'),
	(2, 'en', 'Nationality', 'Swiss'),
	-- No English row: falls back to French
	(3, 'fr', 'Voiture', 'Permis B');

INSERT INTO language (code) VALUES ('fr'), ('en');

INSERT INTO language_i18n (language_code, locale, name) VALUES
	('fr', 'fr', 'Français'), ('fr', 'en', 'French'),
	('en', 'fr', 'Anglais'), ('en', 'en', 'English');

INSERT INTO person_language (id, person_id, language_code, cefr, percent, position) VALUES
	(1, 1, 'fr', 'native', 100, 1),
	(2, 1, 'en', 'B2', 70, 2);

INSERT INTO person_language_i18n (person_language_id, locale, level_label) VALUES
	(1, 'fr', 'Langue maternelle'), (1, 'en', 'Native'),
	(2, 'fr', 'Courant (B2)'), (2, 'en', 'Fluent (B2)');

INSERT INTO hobby (id, person_id, position) VALUES (1, 1, 1), (2, 1, 2);

INSERT INTO hobby_i18n (hobby_id, locale, name, reason) VALUES
	(1, 'fr', 'Cuisine', 'Rigueur'), (1, 'en', 'Cooking', 'Rigour'),
	(2, 'fr', 'Lecture', 'Concentration'), (2, 'en', 'Reading', 'Focus');

INSERT INTO certificate (id, person_id, title, issuer, issued_on, url) VALUES
	(1, 1, 'Test Certificate', 'Example Org', '2024-03-14', 'https://example.com/cert');

INSERT INTO skill_category_i18n (skill_category_id, locale, name) VALUES
	(1, 'fr', 'Langages'), (1, 'en', 'Languages'),
	(2, 'fr', 'Frameworks'), (2, 'en', 'Frameworks'),
	(3, 'fr', 'Outils'), (3, 'en', 'Tools'),
	(4, 'fr', 'Métier'), (4, 'en', 'Business');

INSERT INTO skill (id, category_id, name, in_stack, on_site, position) VALUES
	(1, 1, 'TypeScript', 1, 1, 1),
	(2, 1, 'SQL', 0, 1, 2),
	(3, 1, 'Cobol', 0, 0, 3),
	(4, 2, 'SvelteKit', 1, 1, 1),
	(5, 3, 'Git', 0, 1, 1);

INSERT INTO organization (id, name, website) VALUES
	(1, 'Acme SA', 'https://acme.example.com'),
	(2, 'École Test', NULL),
	(3, 'Old Corp', NULL);

-- Ongoing job (end_date NULL), finished job, education
INSERT INTO experience (id, person_id, organization_id, kind, category, start_date, end_date, on_site, position) VALUES
	(1, 1, 1, 'job', 'dev', '2023-01-01', NULL, 1, 1),
	(2, 1, 3, 'job', 'old', '2010-02-01', '2012-06-30', 0, 2),
	(3, 1, 2, 'education', 'dev', '2019-09-01', '2022-07-31', 1, 1);

INSERT INTO experience_i18n (experience_id, locale, title, degree) VALUES
	(1, 'fr', 'Développeuse web', NULL), (1, 'en', 'Web developer', NULL),
	(2, 'fr', 'Employée', NULL), (2, 'en', 'Employee', NULL),
	(3, 'fr', 'Diplôme test', 'Informatique'), (3, 'en', 'Test diploma', 'Computer science');

INSERT INTO experience_task (id, experience_id, position) VALUES (1, 1, 1), (2, 1, 2), (3, 3, 1);

INSERT INTO experience_task_i18n (experience_task_id, locale, text) VALUES
	(1, 'fr', 'Développer des API'), (1, 'en', 'Build APIs'),
	(2, 'fr', 'Maintenir des sites'), (2, 'en', 'Maintain websites'),
	(3, 'fr', 'Projet de diplôme'), (3, 'en', 'Diploma project');

INSERT INTO experience_skill (experience_id, skill_id) VALUES
	(1, 1), (1, 4), (1, 5), (2, 3), (3, 1), (3, 2);

-- Featured client project, non-featured project, featured personal project (no experience)
INSERT INTO project (id, experience_id, name, url, image, featured, position) VALUES
	(1, 1, 'Acme Shop', 'https://www.acme-shop.example.com', 'acme', 1, 1),
	(2, 3, 'School App', NULL, NULL, 0, 1),
	(3, NULL, 'Side Project', 'https://side.example.com', NULL, 1, 2);

-- Personal projects page details: a script with every field, an app with none
UPDATE project SET kind = 'script', year = 2024, status = 'archived', hosting = 'GitHub', snippet = '$ side --help' WHERE id = 3;
INSERT INTO project (id, experience_id, name, url, image, featured, kind, position) VALUES
	(4, NULL, 'Tiny App', NULL, NULL, 0, 'app', 3);

INSERT INTO project_item (id, project_id, kind, position) VALUES
	(1, 1, 'task', 1), (2, 1, 'detail', 1), (3, 2, 'detail', 1), (4, 3, 'task', 1), (5, 3, 'detail', 1);

INSERT INTO project_item_i18n (project_item_id, locale, text) VALUES
	(1, 'fr', 'Développement'), (1, 'en', 'Development'),
	(2, 'fr', 'SvelteKit, TypeScript'), (2, 'en', 'SvelteKit, TypeScript'),
	(3, 'fr', 'Application interne'), (3, 'en', 'Internal app'),
	(4, 'fr', 'Application de test'), (4, 'en', 'Test app'),
	(5, 'fr', 'Point clé'), (5, 'en', 'Highlight');

INSERT INTO project_skill (project_id, skill_id) VALUES (1, 4), (3, 4), (3, 1);
