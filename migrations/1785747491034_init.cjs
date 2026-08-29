/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    `);
  pgm.sql(`
      CREATE TABLE auth_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    `);
  pgm.sql(`
    CREATE TABLE auth_refresh_tokens (
      id TEXT PRIMARY KEY,
      auth_id UUID NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      revoked_at TIMESTAMP,
      auth_agent TEXT,
      ip_address TEXT,

      CONSTRAINT fk_auth_users
        FOREIGN KEY(auth_id)
        REFERENCES auth_users(id)
        ON DELETE CASCADE
    );
    `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS refresh_tokens;
    `);
  pgm.sql(`
    DROP TABLE IF EXISTS auth;
    `);
  pgm.sql(`
    DROP EXTENSION IF EXISTS pgcrypto;
    `);
};
