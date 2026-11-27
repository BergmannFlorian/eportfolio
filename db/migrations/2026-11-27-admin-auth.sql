-- Admin login (password + TOTP) and sessions.
-- Run once on an existing database (db/schema.sql already contains these tables).

CREATE TABLE IF NOT EXISTS admin_user (
	id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
	email           VARCHAR(255) NOT NULL,
	-- "scrypt$N$r$p$salt$hash" (base64url), see src/lib/server/auth/password.ts
	password_hash   VARCHAR(255) NOT NULL,
	-- Base32 TOTP secret (RFC 6238)
	totp_secret     VARCHAR(64) NOT NULL,
	-- Last accepted TOTP time step, so a code cannot be replayed
	totp_last_step  BIGINT NULL,
	failed_attempts INT UNSIGNED NOT NULL DEFAULT 0,
	locked_until    DATETIME NULL,
	created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE KEY uq_admin_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_session (
	-- SHA-256 of the cookie token: a leaked table cannot be used to log in
	id         CHAR(64) NOT NULL,
	user_id    INT UNSIGNED NOT NULL,
	-- pending = password checked, waiting for the TOTP code
	stage      ENUM('pending', 'full') NOT NULL,
	expires_at DATETIME NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	KEY idx_admin_session_user (user_id),
	KEY idx_admin_session_expires (expires_at),
	CONSTRAINT fk_admin_session_user FOREIGN KEY (user_id) REFERENCES admin_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
