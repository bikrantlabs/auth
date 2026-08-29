export class User {
  constructor(
    private readonly _id: string,
    private readonly _email: string,
    private readonly _emailVerified: boolean,
    private readonly _isActive: boolean,
  ) {}

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  canLogin(): boolean {
    return this.emailVerified && this.isActive;
  }
  //   TODO: Add more methods and properties as needed for User entity
}
