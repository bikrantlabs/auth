export interface PasswordHasher {
  // Async on purpose: hashing is deliberately slow CPU work. A sync signature
  // forces scryptSync, which blocks the event loop for every registration.
  hash(password: string): Promise<string>;
  verify(password: string, hashedPassword: string): Promise<boolean>;
}