// Injection tokens for the ports owned by this module.
//
// The application layer depends only on ports (interfaces). Because interfaces
// are erased at runtime, tsyringe needs explicit tokens to resolve them.
// Symbols are used instead of strings so tokens cannot collide across modules.
export const USER_REPOSITORY = Symbol('UserRepositoryPort');

export const IN_MEMORY_USER_REPOSITORY = Symbol('InMemoryUserRepository');

export const PASSWORD_HASHER = Symbol('PasswordHasher');

export const AUTH_EVENTS = Symbol('AuthEventPort');

export const EVENT_EMITTER = Symbol('EventEmitter');

export const VERIFICATION_EMAIL_QUEUE = Symbol('JobQueuePort<VerificationEmailJob>');

export const VERIFICATION_EMAIL_WORKER = Symbol('VerificationEmailWorker');

export const TOKEN_HASHER = Symbol('TokenHasher');

export const VERIFICATION_TOKEN_REPOSITORY = Symbol('VerificationTokenRepositoryPort');

export const EMAIL_SENDER = Symbol('EmailSenderPort');

export const CACHE_SERVICE = Symbol('CacheService');