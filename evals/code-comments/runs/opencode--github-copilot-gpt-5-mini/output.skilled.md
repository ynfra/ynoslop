```ts
/**
 * Retry an async function with exponential backoff and jitter.
 *
 * @template T
 * @param fn - Function that returns a Promise<T>. Will be called up to `attempts` times.
 * @param attempts - Total number of attempts. Default 3. Must be >= 1 or the function will throw the last error (possibly undefined).
 * @param baseMs - Base delay in milliseconds for backoff. Default 100.
 * @returns The value returned by a successful call to `fn`.
 * @throws The last error thrown by `fn` if all attempts fail.
 *
 * Behavior details:
 * - Calls `fn()` and returns immediately on success.
 * - On failure, stores the error and, if more attempts remain, waits before retrying.
 * - Wait time before retry i (0-based) is: baseMs * 2**i + U(0, baseMs), where U(0, baseMs) is uniform jitter.
 * - No delay is applied after the final attempt.
 * - This function does not support cancellation. If you need cancellation, wrap `fn` with an AbortSignal-aware implementation.
 */
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        // Exponential backoff plus jitter.
        // baseMs * 2**i grows the delay exponentially per retry.
        // Math.random() * baseMs adds up to baseMs milliseconds of uniform jitter.
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastErr;
}
```
