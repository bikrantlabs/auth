import pino from "pino";
import { env } from "@/config/env";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",

  // In production ship JSON to your log aggregator (Datadog, Loki, etc.)
  // In dev, pretty-print for readability
  transport:
    env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  // Redact sensitive fields from logs — never log passwords or tokens
  redact: {
    paths: [
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "req.headers.authorization",
    ],
    censor: "[REDACTED]",
  },
});

// Child loggers give you module-level context in every log line
export function createLogger(module: string) {
  return logger.child({ module });
}
