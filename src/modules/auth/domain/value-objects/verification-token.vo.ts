import { randomInt } from "node:crypto";
import { InvalidVerificationTokenError } from "../exceptions/errors";

export class VerificationToken {
  private constructor(private readonly raw: string) {}

  /** Generate a fresh 6-digit token. */
  static create(): VerificationToken {
    const raw = randomInt(0, 1_000_000).toString().padStart(6, "0");
    return new VerificationToken(raw);
  }

  /** Wrap a user-supplied token after validating its shape. */
  static fromInput(input: string): VerificationToken {
    const raw = input.trim();
    if (!/^\d{6}$/.test(raw)) {
      throw new InvalidVerificationTokenError();
    }
    return new VerificationToken(raw);
  }

  /** Plaintext — expose only transiently (to send, to hash). */
  get value(): string {
    return this.raw;
  }

  /** Constant-time-ish comparison helper (optional). */
  equals(other: VerificationToken): boolean {
    return this.raw === other.raw;
  }
}
