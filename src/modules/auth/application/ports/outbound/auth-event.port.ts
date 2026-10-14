export interface UserRegisteredEvent {
  userId: string;
  email: string;
  occuredAt: Date;
}
export interface AuthEventPort {
  emitUserRegistered(event: UserRegisteredEvent): Promise<void>;
  // TODO: Add events here.
}
