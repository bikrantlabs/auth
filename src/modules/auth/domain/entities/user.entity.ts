import { Email } from '../value-objects/email.vo';
import crypto from 'node:crypto';
import { PasswordHash } from '../value-objects/user-password.vo';
export class User {
  private constructor(
    private readonly _id: string,
    private readonly _email: Email,
    private _password: PasswordHash,
    private _emailVerified: boolean,
    private _isActive: boolean,
  ) {}

  static instantiate(email: Email, password: PasswordHash): User {
    // Here it may seem like we have entities depending on runtime/platform dependency, but I won't bother wrapping it in the port. Because it's the runtime, not the external system like external network, infrastructure, package, or I/O.
    const id = crypto.randomUUID();

    return new User(id, email, password, false, true);
  }

  // Rebuild the user object from database record
  static reconstitute(
    id: string,
    email: Email,
    password: PasswordHash,
    emailVerified: boolean,
    isActive: boolean,
  ): User {
    return new User(id, email, password, emailVerified, isActive);
  }

  get id(): string {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get password(): PasswordHash {
    return this._password;
  }
  verifyEmail() {
    this._emailVerified = true;
  }

  deactivate() {
    this._isActive = false;
  }

  canLogin(): boolean {
    return this.emailVerified && this.isActive;
  }

  changePassword(newPassword: PasswordHash) {
    this._password = newPassword;
  }
  //   TODO: Add more methods and properties as needed for User entity
}
