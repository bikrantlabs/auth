# Auth Service — API Endpoints

All endpoints are prefixed with `/v1` (e.g. `/v1/auth/login`). Version prefix is included from day one to allow breaking changes later without affecting all consumers simultaneously.

---

## 1. Core Authentication

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| POST | `/auth/register` | No | Create account with email/password |
| POST | `/auth/login` | No | Login with email/password → returns access + refresh token, or `mfaRequired: true` |
| POST | `/auth/logout` | Yes (refresh token) | Revoke current session's refresh token |
| POST | `/auth/logout-all` | Yes | Revoke all sessions for this user (logout everywhere) |
| POST | `/auth/refresh` | No (refresh token in body/cookie) | Exchange refresh token for new access + refresh token (rotation) |

**`/auth/login` response shape:**

```json
// Normal login
{ "accessToken": "...", "refreshToken": "...", "user": {...} }

// MFA-enabled account
{ "mfaRequired": true, "mfaToken": "short-lived-token", "availableFactors": ["totp", "backup_code"] }
```

The `mfaToken` (not a full session) is passed to `/mfa/verify` to complete login. This keeps MFA orthogonal to whichever provider authenticated the first factor.

---

## 2. Email Verification

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| POST | `/auth/verify-email` | No | Consume verification token, mark email verified |
| POST | `/auth/resend-verification` | No (rate-limited by email) | Resend verification email |

---

## 3. Password Management

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| POST | `/auth/forgot-password` | No (rate-limited) | Send reset email; always return 200 regardless of whether email exists, to avoid user enumeration |
| POST | `/auth/reset-password` | No | Consume reset token + new password |
| POST | `/auth/change-password` | Yes | Change password while logged in (requires current password) |

---

## 4. MFA

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| POST | `/mfa/totp/enroll` | Yes | Generate TOTP secret + QR code |
| POST | `/mfa/totp/confirm` | Yes | Confirm enrollment by verifying first code |
| POST | `/mfa/totp/disable` | Yes (+ password/current MFA) | Remove TOTP factor |
| POST | `/mfa/backup-codes/generate` | Yes | Generate/regenerate one-time backup codes |
| POST | `/mfa/verify` | No (uses `mfaToken` from login) | Complete login by verifying second factor → returns real access/refresh tokens |
| GET | `/mfa/factors` | Yes | List enrolled factors for current user |

`/mfa/verify` takes `{ mfaToken, factorType, code }` — this is where `IMfaProvider` strategy dispatch happens (`TotpProvider` vs `BackupCodeProvider`), invisible to the route itself.

---

## 5. OAuth / Social Login

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| GET | `/oauth/:provider/authorize` | No | Redirects to provider's consent screen (e.g. `/oauth/google/authorize`) |
| GET | `/oauth/:provider/callback` | No | Provider redirects here with code; exchanges for tokens, creates/logs in user |
| POST | `/oauth/:provider/link` | Yes | Link a new provider to an already-logged-in account |
| DELETE | `/oauth/:provider/unlink` | Yes | Unlink a provider (block if it's the only auth method left) |
| GET | `/oauth/providers` | Yes | List providers linked to current user |

The `:provider` param is what makes this extensible — adding a new provider (e.g. GitHub) means no new routes, just a new registered strategy in `ProviderRegistry`.

---

## 6. Session Management

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| GET | `/sessions` | Yes | List active sessions/devices for current user |
| DELETE | `/sessions/:sessionId` | Yes | Revoke one specific session |

---

## 7. Token Verification (for other services)

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| GET | `/.well-known/jwks.json` | No | Public keys for stateless JWT verification |
| POST | `/introspect` | Service-to-service (API key) | Stateful check — is this token/session revoked? Used sparingly, not per-request |

---

## 8. Current User

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| GET | `/me` | Yes | Return current user's identity claims (id, email, roles, verified, mfaEnabled) |
| PATCH | `/me` | Yes | Update own email/name (triggers re-verification if email changes) |
| DELETE | `/me` | Yes (+ password confirm) | Delete own account (cascades: revoke sessions, publish `user.deleted` event) |

---

## 9. Admin (RBAC Management)

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| GET | `/admin/users` | Admin | List/search users |
| GET | `/admin/users/:id` | Admin | Get user detail |
| PATCH | `/admin/users/:id/roles` | Admin | Assign/remove roles |
| POST | `/admin/users/:id/disable` | Admin | Suspend account |
| DELETE | `/admin/users/:id` | Admin | Force-delete a user |
| GET | `/admin/audit-logs` | Admin | Query security event log |

---

## Cross-Cutting Conventions

**Rate limiting** — apply heavily to: `/auth/login`, `/auth/forgot-password`, `/auth/resend-verification`, `/mfa/verify`. These are the brute-force / enumeration targets.

**Refresh token delivery** — prefer `httpOnly` secure cookie over JSON body for browser clients (XSS protection), but support returning it in the JSON body too for non-browser consumers (mobile apps, service-to-service). Make this configurable per-client.

**Versioning** — prefix everything with `/v1/` now. Costs nothing today, saves pain later when a response shape needs to change for one consuming app but not others.

## Folder Structure
```
src/
├── domain/
│   ├── entities/
│   │   ├── User.ts
│   │   ├── Session.ts
│   │   ├── Credential.ts              # local password credential
│   │   ├── ProviderAccount.ts         # linked OAuth account
│   │   ├── MfaFactor.ts
│   │   ├── Role.ts / Permission.ts
│   │   ├── AuditLog.ts
│   │   └── SigningKey.ts              # kid, publicKey, privateKey, createdAt, expiresAt
│   ├── ports/                         # interfaces — the contracts everything else honors
│   │   ├── IUserRepository.ts
│   │   ├── ISessionRepository.ts
│   │   ├── IAuditLogRepository.ts
│   │   ├── IAuthProvider.ts
│   │   ├── IOAuthProvider.ts
│   │   ├── IMfaProvider.ts
│   │   ├── IPasswordHasher.ts
│   │   ├── ITokenService.ts
│   │   ├── IKeyStore.ts               # abstracts where signing keys live (file, KMS, Vault, DB)
│   │   ├── INotifier.ts               # email/SMS sending
│   │   └── IEventPublisher.ts         # outbound domain events (user.registered, user.deleted, etc.)
│   └── errors/
│       ├── InvalidCredentialsError.ts
│       ├── MfaRequiredError.ts
│       └── TokenReuseDetectedError.ts
│
├── application/                       # use cases — pure orchestration, no I/O details
│   ├── auth/
│   │   ├── RegisterUserUseCase.ts
│   │   ├── LoginUseCase.ts
│   │   ├── LogoutUseCase.ts
│   │   ├── RefreshTokenUseCase.ts
│   │   ├── VerifyEmailUseCase.ts
│   │   ├── ForgotPasswordUseCase.ts
│   │   ├── ResetPasswordUseCase.ts
│   │   └── ChangePasswordUseCase.ts
│   ├── oauth/
│   │   ├── InitiateOAuthUseCase.ts
│   │   ├── HandleOAuthCallbackUseCase.ts
│   │   └── LinkProviderUseCase.ts
│   ├── mfa/
│   │   ├── EnrollMfaUseCase.ts
│   │   ├── VerifyMfaUseCase.ts
│   │   └── GenerateBackupCodesUseCase.ts
│   ├── session/
│   │   ├── ListSessionsUseCase.ts
│   │   └── RevokeSessionUseCase.ts
│   ├── user/
│   │   ├── GetCurrentUserUseCase.ts
│   │   ├── UpdateCurrentUserUseCase.ts
│   │   └── DeleteCurrentUserUseCase.ts
│   ├── token/
│   │   ├── GetJwksUseCase.ts
│   │   └── IntrospectTokenUseCase.ts
│   └── authorization/
│       ├── AssignRoleUseCase.ts
│       ├── ListUsersUseCase.ts
│       ├── DisableUserUseCase.ts
│       ├── DeleteUserByAdminUseCase.ts
│       └── QueryAuditLogsUseCase.ts
│
├── infrastructure/                    # concrete implementations of ports
│   ├── persistence/
│   │   ├── prisma/                    # or mongoose/, typeorm/
│   │   │   ├── PrismaUserRepository.ts
│   │   │   ├── PrismaSessionRepository.ts
│   │   │   ├── PrismaAuditLogRepository.ts
│   │   │   └── PrismaKeyStore.ts      # or FileKeyStore.ts / VaultKeyStore.ts as alternate impl
│   │   └── redis/
│   │       └── RedisSessionStore.ts
│   ├── auth-providers/
│   │   ├── LocalAuthProvider.ts
│   │   ├── BaseOAuthProvider.ts       # template method: shared PKCE/state logic
│   │   ├── GoogleAuthProvider.ts
│   │   ├── GithubAuthProvider.ts
│   │   └── ProviderRegistry.ts        # factory: get('google') -> GoogleAuthProvider
│   ├── mfa-providers/
│   │   ├── TotpProvider.ts
│   │   ├── SmsOtpProvider.ts
│   │   └── BackupCodeProvider.ts
│   ├── security/
│   │   ├── Argon2PasswordHasher.ts
│   │   ├── JwtTokenService.ts         # sign/verify, refresh rotation logic
│   │   └── KeyRotationScheduler.ts    # rotates signing key, keeps old key in JWKS during grace window
│   ├── notifications/
│   │   ├── SendgridEmailNotifier.ts
│   │   └── templates/
│   └── events/
│       ├── RedisEventPublisher.ts     # publishes to Redis Pub/Sub
│       └── listeners/
│           ├── SendVerificationEmailListener.ts
│           ├── AuditLogListener.ts
│           └── SendPasswordChangedEmailListener.ts
│
├── presentation/
│   └── http/
│       ├── controllers/
│       │   ├── AuthController.ts
│       │   ├── OAuthController.ts
│       │   ├── MfaController.ts
│       │   ├── SessionController.ts
│       │   ├── UserController.ts      # handles /me
│       │   ├── TokenController.ts     # handles /.well-known/jwks.json + /introspect
│       │   └── AdminController.ts
│       ├── middlewares/
│       │   ├── authenticate.ts        # verifies access token
│       │   ├── requireMfa.ts
│       │   ├── authorize.ts           # permission/role check
│       │   ├── rateLimiter.ts
│       │   └── requireServiceApiKey.ts # protects /introspect (service-to-service, not user-facing)
│       ├── validators/                # zod schemas per route
│       └── routes/
│           ├── auth.routes.ts
│           ├── oauth.routes.ts
│           ├── mfa.routes.ts
│           ├── session.routes.ts
│           ├── user.routes.ts
│           ├── token.routes.ts
│           └── admin.routes.ts
│
├── config/
│   ├── env.ts                         # validated env (zod)
│   └── container.ts                   # DI wiring — the ONLY place concrete classes meet interfaces
│
└── shared/
    ├── logger.ts
    └── result.ts                      # Result<T, E> pattern for use cases instead of throwing everywhere
```
#### Note
`/introspect` needs a different auth mechanism than everything else — it's called by other services, not end users, so it can't require a user JWT (chicken-and-egg). That's why `requireServiceApiKey.ts` is new: a simple shared-secret or per-service API key check, separate from `authenticate.ts`. Worth deciding now: static API key in env var per consuming service, or something more formal like mutual TLS — for your scale, a static per-service key (`SOCIAL_SCHEDULER_API_KEY=...`) checked against a small allowlist in config is enough, and keeps this from becoming its own OAuth-client-credentials rabbit hole.

Everything else (`domain/, use case pattern, DI wiring in `config/container.ts`) stays exactly as designed — this is additive, not a redesign.