// Injection tokens for the ports owned by this module.
//
// The application layer depends only on ports (interfaces). Because interfaces
// are erased at runtime, tsyringe needs explicit tokens to resolve them.
// Symbols are used instead of strings so tokens cannot collide across modules.
export const USER_REPOSITORY = Symbol('UserRepositoryPort');

export const IN_MEMORY_USER_REPOSITORY = Symbol('InMemoryUserRepository');

export const PASSWORD_HASHER = Symbol('PasswordHasher');