-- Personal projects page: optional details on each project.
-- Run once on an existing database (db/schema.sql already contains these columns).
ALTER TABLE project
	ADD COLUMN kind    ENUM('website', 'script', 'app') NULL AFTER featured,
	ADD COLUMN year    SMALLINT NULL AFTER kind,
	ADD COLUMN status  ENUM('online', 'in_progress', 'archived') NULL AFTER year,
	ADD COLUMN hosting VARCHAR(100) NULL AFTER status,
	ADD COLUMN snippet TEXT NULL AFTER hosting;
