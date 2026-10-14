// adapters/outbound/crypto/sha256-token-hasher.ts
import { createHmac, timingSafeEqual } from "node:crypto";
import { TokenHasher } from "../../../application/ports/outbound/token-hasher.port";
import { VerificationToken } from "../../../domain/value-objects/verification-token.vo";

export class HmacTokenHasher implements TokenHasher {
  constructor(private readonly secret: string | Buffer) {
    if (!secret || secret.length === 0) {
      throw new Error("HmacTokenHasher requires a secret");
    }
  }

  private compute(token: VerificationToken): string {
    return createHmac("sha256", this.secret).update(token.value).digest("hex");
  }

  hash(token: VerificationToken): string {
    return this.compute(token);
  }

  matches(token: VerificationToken, hash: string): boolean {
    const expected = Buffer.from(this.compute(token), "hex");
    let actual: Buffer;

    try {
      actual = Buffer.from(hash, "hex");
    } catch {
      return false;
    }

    if (expected.length !== actual.length) {
      return false;
    }
    return timingSafeEqual(expected, actual);
  }
}
