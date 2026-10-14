import { DomainError } from '../../domain/exceptions/DomainError.js';

export class UserAlreadyExistsError extends DomainError {
  constructor(_email: string) {
    super(`Email is already registered!`);
  }
}
