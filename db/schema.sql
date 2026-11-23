-- eportfolio — database schema (MariaDB 10.5+)
--
-- Conventions
--   * Displayed text lives in `<table>_i18n` tables keyed by (parent id, locale).
--     Proper names, URLs and dates stay in the parent table.
--   * Columns marked PRIVATE must never reach the browser: getPublicCV()
--     (src/lib/server/cv/index.ts) strips or transforms them.
--   * `position` sets display order; `on_site`, `on_cv`, `featured`, `in_stack`
--     choose where an item is shown.
--   * Child rows are deleted with their parent (ON DELETE CASCADE); shared
--     lookups (locale, language, organization, skill_category) are protected
--     (ON DELETE RESTRICT).
--
-- The script only creates missing tables; it never drops existing data.

SET NAMES utf8mb4;

-- ─── Locales ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS locale (
	code        VARCHAR(5)   NOT NULL,              -- 'fr', 'en'
	name        VARCHAR(50)  NOT NULL,
	PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Profile ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS person (
	id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
	name        VARCHAR(255) NOT NULL,
	email       VARCHAR(255) NOT NULL,
	address     VARCHAR(255) NULL,                  -- PRIVATE
	postal_code VARCHAR(10)  NULL,
	city        VARCHAR(255) NULL,
	birthdate   DATE         NULL,                  -- PRIVATE (only the computed age is public)
	photo_url   VARCHAR(500) NULL,
	PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS person_i18n (
	person_id   INT UNSIGNED NOT NULL,
	locale      VARCHAR(5)   NOT NULL,
	headline    VARCHAR(255) NULL,                  -- hero eyebrow
	bio         TEXT         NULL,                  -- hero lead paragraph
	about       TEXT         NULL,                  -- "About" section
	cv_title    VARCHAR(255) NULL,                  -- CV heading (may contain line breaks)
	PRIMARY KEY (person_id, locale),
	CONSTRAINT fk_person_i18n_person FOREIGN KEY (person_id) REFERENCES person (id) ON DELETE CASCADE,
	CONSTRAINT fk_person_i18n_locale FOREIGN KEY (locale) REFERENCES locale (code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS social_link (
	id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
	person_id   INT UNSIGNED NOT NULL,
	network     VARCHAR(50)  NOT NULL,              -- 'linkedin', 'github'
	url         VARCHAR(500) NOT NULL,
	position    SMALLINT     NOT NULL DEFAULT 0,
	PRIMARY KEY (id),
	KEY idx_social_link_person (person_id, position),
	CONSTRAINT fk_social_link_person FOREIGN KEY (person_id) REFERENCES person (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PRIVATE: third-party contact details, shown as "available on request" only.
CREATE TABLE IF NOT EXISTS reference (
	id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
	person_id   INT UNSIGNED NOT NULL,
	name        VARCHAR(255) NOT NULL,
	job_title   VARCHAR(255) NULL,
	company     VARCHAR(255) NULL,
	phone       VARCHAR(50)  NULL,
	PRIMARY KEY (id),
	KEY idx_reference_person (person_id),
	CONSTRAINT fk_reference_person FOREIGN KEY (person_id) REFERENCES person (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- "At a glance" facts on the site and the extra lines of the CV sidebar.
CREATE TABLE IF NOT EXISTS fact (
	id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
	person_id   INT UNSIGNED NOT NULL,
	icon        VARCHAR(100) NULL,                  -- Iconify name, e.g. 'solar:card-2-outline'
	on_site     BOOLEAN      NOT NULL DEFAULT TRUE,
	on_cv       BOOLEAN      NOT NULL DEFAULT TRUE,
	position    SMALLINT     NOT NULL DEFAULT 0,
	PRIMARY KEY (id),
	KEY idx_fact_person (person_id, position),
	CONSTRAINT fk_fact_person FOREIGN KEY (person_id) REFERENCES person (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fact_i18n (
	fact_id     INT UNSIGNED NOT NULL,
	locale      VARCHAR(5)   NOT NULL,
	label       VARCHAR(100) NOT NULL,              -- 'Nationalité'
	value       VARCHAR(255) NOT NULL,              -- 'Suisse'
	PRIMARY KEY (fact_id, locale),
	CONSTRAINT fk_fact_i18n_fact   FOREIGN KEY (fact_id) REFERENCES fact (id) ON DELETE CASCADE,
	CONSTRAINT fk_fact_i18n_locale FOREIGN KEY (locale) REFERENCES locale (code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Spoken languages (distinct from `locale`, the languages the site is published in).
CREATE TABLE IF NOT EXISTS language (
	code        VARCHAR(5)   NOT NULL,              -- 'fr', 'en', 'de'
	PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS language_i18n (
	language_code VARCHAR(5)  NOT NULL,
	locale        VARCHAR(5)  NOT NULL,
	name          VARCHAR(100) NOT NULL,            -- 'Allemand' / 'German'
	PRIMARY KEY (language_code, locale),
	CONSTRAINT fk_language_i18n_language FOREIGN KEY (language_code) REFERENCES language (code) ON DELETE CASCADE,
	CONSTRAINT fk_language_i18n_locale   FOREIGN KEY (locale) REFERENCES locale (code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS person_language (
	id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
	person_id     INT UNSIGNED NOT NULL,
	language_code VARCHAR(5)   NOT NULL,
	cefr          VARCHAR(10)  NOT NULL,            -- 'native', 'C1', 'B1', 'A2'…
	percent       TINYINT UNSIGNED NOT NULL DEFAULT 0, -- level bar on the site
	position      SMALLINT     NOT NULL DEFAULT 0,
	PRIMARY KEY (id),
	UNIQUE KEY uq_person_language (person_id, language_code),
	CONSTRAINT chk_person_language_percent CHECK (percent <= 100),
	CONSTRAINT fk_person_language_person   FOREIGN KEY (person_id) REFERENCES person (id) ON DELETE CASCADE,
	CONSTRAINT fk_person_language_language FOREIGN KEY (language_code) REFERENCES language (code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS person_language_i18n (
	person_language_id INT UNSIGNED NOT NULL,
	locale             VARCHAR(5)   NOT NULL,
	level_label        VARCHAR(100) NOT NULL,       -- 'Scolaire (A2)'
	PRIMARY KEY (person_language_id, locale),
	CONSTRAINT fk_person_language_i18n_parent FOREIGN KEY (person_language_id) REFERENCES person_language (id) ON DELETE CASCADE,
	CONSTRAINT fk_person_language_i18n_locale FOREIGN KEY (locale) REFERENCES locale (code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hobby (
	id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
	person_id   INT UNSIGNED NOT NULL,
	position    SMALLINT     NOT NULL DEFAULT 0,
	PRIMARY KEY (id),
	KEY idx_hobby_person (person_id, position),
	CONSTRAINT fk_hobby_person FOREIGN KEY (person_id) REFERENCES person (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hobby_i18n (
	hobby_id    INT UNSIGNED NOT NULL,
	locale      VARCHAR(5)   NOT NULL,
	name        VARCHAR(100) NOT NULL,              -- 'Cuisine'
	reason      VARCHAR(255) NULL,                  -- 'Rigueur et précision'
	PRIMARY KEY (hobby_id, locale),
	CONSTRAINT fk_hobby_i18n_hobby  FOREIGN KEY (hobby_id) REFERENCES hobby (id) ON DELETE CASCADE,
	CONSTRAINT fk_hobby_i18n_locale FOREIGN KEY (locale) REFERENCES locale (code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS certificate (
	id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
	person_id   INT UNSIGNED NOT NULL,
	title       VARCHAR(255) NOT NULL,              -- certificate names are kept in their original language
	issuer      VARCHAR(255) NULL,
	issued_on   DATE         NOT NULL,
	url         VARCHAR(500) NULL,
	PRIMARY KEY (id),
	KEY idx_certificate_person (person_id, issued_on),
	CONSTRAINT fk_certificate_person FOREIGN KEY (person_id) REFERENCES person (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Experience (jobs and education) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organization (
	id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
	name        VARCHAR(255) NOT NULL,              -- 'IOMEDIA SA', 'CPNV'
	website     VARCHAR(500) NULL,
	PRIMARY KEY (id),
	UNIQUE KEY uq_organization_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS experience (
	id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
	person_id       INT UNSIGNED NOT NULL,
	organization_id INT UNSIGNED NULL,              -- NULL for e.g. a language stay
	kind            ENUM('job', 'education', 'other') NOT NULL,
	category        VARCHAR(20)  NOT NULL DEFAULT 'dev', -- 'dev', 'old'
	start_date      DATE         NOT NULL,
	end_date        DATE         NULL,              -- NULL while ongoing
	on_site         BOOLEAN      NOT NULL DEFAULT FALSE, -- listed in the home page "Experience" section
	position        SMALLINT     NOT NULL DEFAULT 0,
	PRIMARY KEY (id),
	KEY idx_experience_person (person_id, kind, start_date),
	CONSTRAINT chk_experience_dates CHECK (end_date IS NULL OR end_date >= start_date),
	CONSTRAINT fk_experience_person       FOREIGN KEY (person_id) REFERENCES person (id) ON DELETE CASCADE,
	CONSTRAINT fk_experience_organization FOREIGN KEY (organization_id) REFERENCES organization (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS experience_i18n (
	experience_id INT UNSIGNED NOT NULL,
	locale        VARCHAR(5)   NOT NULL,
	title         VARCHAR(255) NOT NULL,            -- 'Développeur web', 'Diplôme ES'
	degree        VARCHAR(255) NULL,                -- education only
	PRIMARY KEY (experience_id, locale),
	CONSTRAINT fk_experience_i18n_experience FOREIGN KEY (experience_id) REFERENCES experience (id) ON DELETE CASCADE,
	CONSTRAINT fk_experience_i18n_locale     FOREIGN KEY (locale) REFERENCES locale (code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS experience_task (
	id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
	experience_id INT UNSIGNED NOT NULL,
	position      SMALLINT     NOT NULL DEFAULT 0,
	PRIMARY KEY (id),
	KEY idx_experience_task_experience (experience_id, position),
	CONSTRAINT fk_experience_task_experience FOREIGN KEY (experience_id) REFERENCES experience (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS experience_task_i18n (
	experience_task_id INT UNSIGNED NOT NULL,
	locale             VARCHAR(5)   NOT NULL,
	text               TEXT         NOT NULL,
	PRIMARY KEY (experience_task_id, locale),
	CONSTRAINT fk_experience_task_i18n_task   FOREIGN KEY (experience_task_id) REFERENCES experience_task (id) ON DELETE CASCADE,
	CONSTRAINT fk_experience_task_i18n_locale FOREIGN KEY (locale) REFERENCES locale (code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project (
	id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
	experience_id INT UNSIGNED NULL,                -- NULL for a personal project
	name          VARCHAR(255) NOT NULL,            -- 'Breitling'
	url           VARCHAR(500) NULL,
	image         VARCHAR(255) NULL,
	featured      BOOLEAN      NOT NULL DEFAULT FALSE, -- home page "Work" grid
	-- Details shown on the personal projects page (all optional)
	kind          ENUM('website', 'script', 'app') NULL,
	year          SMALLINT     NULL,
	status        ENUM('online', 'in_progress', 'archived') NULL,
	hosting       VARCHAR(100) NULL,                -- 'Infomaniak'
	snippet       TEXT         NULL,                -- usage example, e.g. a shell command
	position      SMALLINT     NOT NULL DEFAULT 0,
	PRIMARY KEY (id),
	KEY idx_project_experience (experience_id, position),
	KEY idx_project_featured (featured, position),
	CONSTRAINT fk_project_experience FOREIGN KEY (experience_id) REFERENCES experience (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Project bullet points: `task` = what I did, `detail` = context or tech used.
CREATE TABLE IF NOT EXISTS project_item (
	id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
	project_id  INT UNSIGNED NOT NULL,
	kind        ENUM('task', 'detail') NOT NULL,
	position    SMALLINT     NOT NULL DEFAULT 0,
	PRIMARY KEY (id),
	KEY idx_project_item_project (project_id, kind, position),
	CONSTRAINT fk_project_item_project FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_item_i18n (
	project_item_id INT UNSIGNED NOT NULL,
	locale          VARCHAR(5)   NOT NULL,
	text            TEXT         NOT NULL,
	PRIMARY KEY (project_item_id, locale),
	CONSTRAINT fk_project_item_i18n_item   FOREIGN KEY (project_item_id) REFERENCES project_item (id) ON DELETE CASCADE,
	CONSTRAINT fk_project_item_i18n_locale FOREIGN KEY (locale) REFERENCES locale (code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Skills ──────────────────────────────────────────────────────────────────
-- The CV level (top / mid / bottom) is computed from the end dates of linked
-- experiences, so it is not stored.

CREATE TABLE IF NOT EXISTS skill_category (
	id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
	code        VARCHAR(20)  NOT NULL,              -- 'langs', 'libs', 'tools', 'business'
	position    SMALLINT     NOT NULL DEFAULT 0,
	PRIMARY KEY (id),
	UNIQUE KEY uq_skill_category_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS skill_category_i18n (
	skill_category_id INT UNSIGNED NOT NULL,
	locale            VARCHAR(5)   NOT NULL,
	name              VARCHAR(100) NOT NULL,        -- 'Langages' / 'Languages'
	PRIMARY KEY (skill_category_id, locale),
	CONSTRAINT fk_skill_category_i18n_category FOREIGN KEY (skill_category_id) REFERENCES skill_category (id) ON DELETE CASCADE,
	CONSTRAINT fk_skill_category_i18n_locale   FOREIGN KEY (locale) REFERENCES locale (code) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS skill (
	id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
	category_id INT UNSIGNED NOT NULL,
	name        VARCHAR(100) NOT NULL,              -- 'Docker' (not translated)
	in_stack    BOOLEAN      NOT NULL DEFAULT FALSE, -- home page "Stack" band
	on_site     BOOLEAN      NOT NULL DEFAULT FALSE, -- home page "Skills" chips
	position    SMALLINT     NOT NULL DEFAULT 0,
	PRIMARY KEY (id),
	UNIQUE KEY uq_skill_category_name (category_id, name),
	CONSTRAINT fk_skill_category FOREIGN KEY (category_id) REFERENCES skill_category (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS experience_skill (
	experience_id INT UNSIGNED NOT NULL,
	skill_id      INT UNSIGNED NOT NULL,
	PRIMARY KEY (experience_id, skill_id),
	KEY idx_experience_skill_skill (skill_id),
	CONSTRAINT fk_experience_skill_experience FOREIGN KEY (experience_id) REFERENCES experience (id) ON DELETE CASCADE,
	CONSTRAINT fk_experience_skill_skill      FOREIGN KEY (skill_id) REFERENCES skill (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_skill (
	project_id  INT UNSIGNED NOT NULL,
	skill_id    INT UNSIGNED NOT NULL,
	PRIMARY KEY (project_id, skill_id),
	KEY idx_project_skill_skill (skill_id),
	CONSTRAINT fk_project_skill_project FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE,
	CONSTRAINT fk_project_skill_skill   FOREIGN KEY (skill_id) REFERENCES skill (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Base data ───────────────────────────────────────────────────────────────

INSERT IGNORE INTO locale (code, name) VALUES
	('fr', 'Français'),
	('en', 'English');

INSERT IGNORE INTO skill_category (code, position) VALUES
	('langs', 1),
	('libs', 2),
	('tools', 3),
	('business', 4);
