import { VerificationToken } from "@/modules/auth/domain/value-objects/verification-token.vo";

export interface TokenHasher {
  hash(token: VerificationToken): string;
  matches(token: VerificationToken, hash: string): boolean;
}
