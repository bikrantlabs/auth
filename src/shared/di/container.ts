import "reflect-metadata";
import { EventEmitter } from "node:events";
import { container } from "tsyringe";
import type { Pool } from "pg";
import type { RedisClientType } from "redis";
import { LOGGER, type LoggerPort } from "@/shared/logging/logger.port";
import { PinoLogger, logger } from "@/shared/logging/pino.logger";
import { PG_POOL, pool } from "@/shared/database/postgres";
import { REDIS_CLIENT, getRedis } from "@/shared/cache/redis";
import type { CacheService } from "@/shared/cache/cache.port";
import { RedisCacheService } from "@/shared/cache/redis-cache.service";
import { verificationCodeKey } from "@/shared/crypto/derived-keys";
import type { UserRepositoryPort } from "@/modules/auth/application/ports/outbound/user-repository.port";
import type { PasswordHasher } from "@/modules/auth/application/ports/outbound/password-hasher.port";
import type { AuthEventPort } from "@/modules/auth/application/ports/outbound/auth-event.port";
import type { JobQueuePort } from "@/shared/queue/queue.port";
import type { WorkerHandle } from "@/shared/queue/worker";
import type { EmailSenderPort } from "@/shared/email/email-sender.port";
import type { TokenHasher } from "@/modules/auth/application/ports/outbound/token-hasher.port";
import type { VerificationTokenRepositoryPort } from "@/modules/auth/application/ports/outbound/verification-token-repository.port";
import type { ScheduleVerificationEmailUseCase } from "@/modules/auth/application/ports/inbound/schedule-verification-email.usecase";
import type { SendVerificationEmailUseCase } from "@/modules/auth/application/ports/inbound/send-verification-email.usecase";
import {
  AUTH_EVENTS,
  CACHE_SERVICE,
  EMAIL_SENDER,
  EVENT_EMITTER,
  PASSWORD_HASHER,
  TOKEN_HASHER,
  USER_REPOSITORY,
  VERIFICATION_EMAIL_QUEUE,
  VERIFICATION_EMAIL_WORKER,
  VERIFICATION_TOKEN_REPOSITORY,
} from "@/modules/auth/application/ports/tokens";
import {
  VERIFICATION_EMAIL_QUEUE_NAME,
  type VerificationEmailJob,
} from "@/modules/auth/application/verification-email.job";
import { BullMqQueue, createQueue } from "@/shared/queue/bullmq-queue.adapter";
import { UserRepositoryImpl } from "@/modules/auth/adapters/outbound/persistence/user-repository.impl";
import { ScryptPasswordHasher } from "@/modules/auth/adapters/outbound/crypto/scrypt-password-hasher.impl";
import { NodeAuthEventEmitter } from "@/modules/auth/adapters/outbound/events/node-auth-event.emitter";
import { UserRegisteredEmailListener } from "@/modules/auth/adapters/inbound/user-registered.listener";
import { createVerificationEmailWorker } from "@/modules/auth/adapters/inbound/verification-email.worker";
import { HmacTokenHasher } from "@/modules/auth/adapters/outbound/crypto/hmac-token-hasher.impl";
import { VerificationTokenRepositoryImpl } from "@/modules/auth/adapters/outbound/persistence/verification-token-repository.impl";
import { SmtpEmailSender } from "@/shared/email/smtp-email.sender";
import { RegisterUserUseCase } from "@/modules/auth/application/register-user.use-case";
import { ScheduleVerificationEmailService } from "@/modules/auth/application/schedule-verification-email.service";
import { SendVerificationEmailService } from "@/modules/auth/application/send-verification-email.service";

/**
 * Composition root. The ONLY place that knows concrete classes.
 * Domain + application depend on ports; this file wires ports → adapters.
 * Call once at startup (server.ts) and in tests (with overrides).
 */
export function registerDependencies(): void {
  // Shared
  container.registerInstance(LOGGER, logger);
  container.registerInstance(PG_POOL, pool);
  container.register<RedisClientType>(REDIS_CLIENT, {
    useFactory: () => getRedis(),
  });
  container.register<CacheService>(CACHE_SERVICE, {
    useClass: RedisCacheService,
  });

  // One process-local bus shared by the emitter (outbound) and the
  // listener (inbound). BullMQ carries jobs across processes; this bus
  // is only for in-process domain events.
  container.registerInstance<EventEmitter>(EVENT_EMITTER, new EventEmitter());

  // Auth module — outbound adapters (driven by application)
  container.register<PasswordHasher>(PASSWORD_HASHER, {
    useClass: ScryptPasswordHasher,
  });
  // Factory so the pg Pool instance is injected, not constructed by tsyringe
  container.register<UserRepositoryPort>(USER_REPOSITORY, {
    useFactory: (c) => new UserRepositoryImpl(c.resolve<Pool>(PG_POOL)),
  });
  container.register<AuthEventPort>(AUTH_EVENTS, {
    useFactory: (c) =>
      new NodeAuthEventEmitter(c.resolve<EventEmitter>(EVENT_EMITTER)),
  });
  // Generic queue adapter parameterized with auth's job type + queue name
  container.register<JobQueuePort<VerificationEmailJob>>(VERIFICATION_EMAIL_QUEUE, {
    useFactory: () =>
      new BullMqQueue(createQueue<VerificationEmailJob>(VERIFICATION_EMAIL_QUEUE_NAME)),
  });
  container.register<TokenHasher>(TOKEN_HASHER, {
    useFactory: () => new HmacTokenHasher(verificationCodeKey),
  });
  container.register<VerificationTokenRepositoryPort>(
    VERIFICATION_TOKEN_REPOSITORY,
    {
      useFactory: (c) =>
        new VerificationTokenRepositoryImpl(
          c.resolve<CacheService>(CACHE_SERVICE),
        ),
    },
  );
  container.register<EmailSenderPort>(EMAIL_SENDER, {
    useFactory: () => new SmtpEmailSender(),
  });

  // Use cases
  container.register(RegisterUserUseCase, {
    useFactory: (c) =>
      new RegisterUserUseCase(
        c.resolve<UserRepositoryPort>(USER_REPOSITORY),
        c.resolve<PasswordHasher>(PASSWORD_HASHER),
        c.resolve<LoggerPort>(LOGGER),
        c.resolve<AuthEventPort>(AUTH_EVENTS),
      ),
  });
  container.register<ScheduleVerificationEmailUseCase>(
    ScheduleVerificationEmailService,
    {
      useFactory: (c) =>
        new ScheduleVerificationEmailService(
          c.resolve<JobQueuePort<VerificationEmailJob>>(VERIFICATION_EMAIL_QUEUE),
        ),
    },
  );
  container.register<SendVerificationEmailUseCase>(SendVerificationEmailService, {
    useFactory: (c) =>
      new SendVerificationEmailService(
        c.resolve<EmailSenderPort>(EMAIL_SENDER),
        c.resolve<TokenHasher>(TOKEN_HASHER),
        c.resolve<VerificationTokenRepositoryPort>(VERIFICATION_TOKEN_REPOSITORY),
      ),
  });

  // Inbound adapters (drive the application). The listener subscribes on
  // construction; resolving it wires it to the shared bus.
  container.register(UserRegisteredEmailListener, {
    useFactory: (c) =>
      new UserRegisteredEmailListener(
        c.resolve<EventEmitter>(EVENT_EMITTER),
        c.resolve<ScheduleVerificationEmailUseCase>(
          ScheduleVerificationEmailService,
        ),
        c.resolve<LoggerPort>(LOGGER),
      ),
  });
  container.register<WorkerHandle>(VERIFICATION_EMAIL_WORKER, {
    useFactory: (c) =>
      createVerificationEmailWorker(
        c.resolve<SendVerificationEmailUseCase>(SendVerificationEmailService),
        c.resolve<LoggerPort>(LOGGER),
      ),
  });

  // Ensure the concrete classes themselves are resolvable
  container.register(ScryptPasswordHasher, { useClass: ScryptPasswordHasher });
  container.register(SmtpEmailSender, {
    useFactory: () => new SmtpEmailSender(),
  });
  container.register(HmacTokenHasher, {
    useFactory: () => new HmacTokenHasher(verificationCodeKey),
  });
  container.register(VerificationTokenRepositoryImpl, {
    useFactory: (c) =>
      new VerificationTokenRepositoryImpl(c.resolve<CacheService>(CACHE_SERVICE)),
  });
  container.register(RedisCacheService, { useClass: RedisCacheService });
  container.register(PinoLogger, { useValue: logger });
}

export { container };
