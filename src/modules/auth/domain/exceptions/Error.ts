import { DomainError } from './DomainError.js';

export class InvalidEmailError extends DomainError {
  constructor(value: string) {
    super(`Invalid email: ${value}`);
  }
}
export class WeakPasswordError extends DomainError {
  constructor() {
    super(`The password is too weak.`);
  }
}
export class EmptyPasswordHashError extends DomainError {
  constructor() {
    super(`The password hash cannot be empty.`);
  }
}

export class LongPasswordError extends DomainError {
  constructor() {
    super('Password cannot be greater than 128 characters.');
  }
}
