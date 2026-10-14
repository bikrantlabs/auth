import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { PasswordHasher } from "../application/ports/services/PasswordHasher.js";

const scryptAsync = promisify(scrypt);

const SALT_BYTES = 16;
const KEY_BYTES = 64;

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const derived = (await scryptAsync(password, salt, KEY_BYTES)) as Buffer;

    return `${salt.toString("hex")}:${derived.toString("hex")}`;
  }

  async verify(password: string, hashedPassword: string): Promise<boolean> {
    const [saltHex, keyHex] = hashedPassword.split(":");

    if (!saltHex || !keyHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(keyHex, "hex");
    const derived = (await scryptAsync(
      password,
      salt,
      expected.length,
    )) as Buffer;

    // timingSafeEqual throws when the buffers differ in length, so check first.
    return (
      derived.length === expected.length && timingSafeEqual(derived, expected)
    );
  }
}
