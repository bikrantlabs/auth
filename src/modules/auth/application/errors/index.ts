import { DomainError } from '../../domain/exceptions/domain-error';

export class UserAlreadyExistsError extends DomainError {
  constructor(_email: string) {
    super(`Email is already registered!`);
  }
}
