import { createHmac } from "node:crypto";
import { env } from "@/config/env";
import type { CacheService } from "@/shared/cache/cache.port";
import { cacheKeys } from "@/shared/cache/redis";
import { emailKey } from "@/shared/crypto/derived-keys";
import type { VerificationTokenRepositoryPort } from "../../../application/ports/outbound/verification-token-repository.port";
import { Email } from "../../../domain/value-objects/email.vo";

/**
 * Redis-backed VerificationTokenRepository.
 * Stores only the HMAC of the 6-digit code under a hashed-email key —
 * the plaintext code is emailed to the user, never persisted.
 */
export class VerificationTokenRepositoryImpl implements VerificationTokenRepositoryPort {
  constructor(private readonly cache: CacheService) {}

  private static lookupKey(email: Email): string {
    const emailHash = createHmac("sha256", emailKey)
      .update(email.value)
      .digest("hex");
    return cacheKeys.emailVerification(emailHash);
  }

  async createToken(token: string, email: Email): Promise<void> {
    await this.cache.set(
      VerificationTokenRepositoryImpl.lookupKey(email),
      token,
      env.VERIFICATION_CODE_EXPIRY_SECONDS,
    );
  }

  async getToken(email: Email): Promise<string> {
    const stored = await this.cache.get<string>(
      VerificationTokenRepositoryImpl.lookupKey(email),
    );
    if (!stored) {
      throw new Error("Verification token not found or expired.");
    }
    return stored;
  }
}
