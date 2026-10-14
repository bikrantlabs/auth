import { InvalidEmailError } from '../exceptions/errors';

/**
 * Here, I have to convert email into value object having it's own validating rules.
 * This prevents bad email from ever entering into business rules.
 */
export class Email {
  private readonly _value: string;

  constructor(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (!Email.isValid(trimmed)) {
      throw new InvalidEmailError(trimmed);
    }
    this._value = trimmed;
  }

  get value(): string {
    return this._value;
  }

  private static isValid(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
