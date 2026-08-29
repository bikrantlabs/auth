export class Credential {
  constructor(
    private readonly _userId: string,
    private readonly _passwordHash: string,
  ) {}

  //   Add Getters and Setters
  get userId(): string {
    return this._userId;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }
}
