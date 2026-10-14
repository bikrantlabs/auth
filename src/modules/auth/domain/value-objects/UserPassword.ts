import {
  EmptyPasswordHashError,
  LongPasswordError,
  WeakPasswordError,
} from '../exceptions/Error.js';

// Plaintext: short-lived, validated, never persisted
export class PlainPassword {
  constructor(private readonly _value: string) {
    // typeof first: _value.length throws a TypeError on undefined/null, which
    // would escape as a 500 instead of a validation failure.
    if (typeof _value !== 'string' || _value.length < 8) {
      throw new WeakPasswordError();
    }
    if (_value.length > 128) {
      throw new LongPasswordError();
    }
  }

  get value(): string {
    return this._value;
  }
}

// Hash: what the User owns and the DB stores
export class PasswordHash {
  constructor(private readonly _value: string) {
    if (!_value) {
      throw new EmptyPasswordHashError();
    }
  }

  get value(): string {
    return this._value;
  }
}
