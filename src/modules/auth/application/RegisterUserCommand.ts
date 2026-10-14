import { Email } from '../domain/value-objects/Email.js';
import { PlainPassword } from '../domain/value-objects/UserPassword.js';

export class RegisterUserCommand {
  private readonly _email: Email;
  private readonly _password: PlainPassword;

  // Note: We don't have to force checking on valid email and password, since invalid email/password is
  // automatically rejected during their creation.
  constructor(email: Email, password: PlainPassword) {
    this._email = email;
    this._password = password;
  }

  get email() {
    return this._email;
  }

  get password() {
    return this._password;
  }
}
