import { hkdfSync } from "node:crypto";
import { env } from "@/config/env";

/**
 * Single-secret key derivation (shared/crypto).
 *
 * One high-entropy SERVER_SECRET lives in env; every consumer gets its own
 * purpose-scoped 32-byte key via HKDF-SHA256. Rotating a purpose means
 * bumping its `:vN` suffix — other purposes stay valid.
 *
 * Never use `env.SERVER_SECRET` directly for hashing/signing — always go
 * through one of the derived keys below.
 */
const master = Buffer.from(env.SERVER_SECRET, "base64");

const deriveKey = (purpose: string): Buffer =>
  Buffer.from(hkdfSync("sha256", master, Buffer.alloc(0), purpose, 32));

/** Hashing redis lookup keys for emails (so redis never stores raw PII). */
export const emailKey = deriveKey("email-hash:v1");

/** HMAC key for hashing 6-digit verification codes before caching. */
export const verificationCodeKey = deriveKey("verification-code-hash:v1");

/** HMAC key for hashing auth/password-reset tokens before storing. */
export const passwordKey = deriveKey("password-token-hash:v1");

/** HMAC key for signing short-lived access tokens. */
export const accessTokenKey = deriveKey("access-token-sign:v1");

/** HMAC key for signing long-lived refresh tokens. */
export const refreshTokenKey = deriveKey("refresh-token-sign:v1");
