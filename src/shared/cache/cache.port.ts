export interface CacheService {
  /**
   * Store a value with optional TTL (seconds).
   * Serialises to JSON — works for any serialisable value.
   */
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;

  /**
   * Retrieve and deserialise a value. Returns null if key doesn't exist.
   */
  get<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  /**
   * Increment a counter. Used for rate limiting.
   * Returns the new value after increment.
   */
  increment(key: string, ttlSeconds?: number): Promise<number>;
  /**
   * Atomically set multiple values. Used for token rotation (invalidate old, set new).
   */
  mset(
    entries: { key: string; value: unknown; ttlSeconds?: number }[],
  ): Promise<void>;
}
