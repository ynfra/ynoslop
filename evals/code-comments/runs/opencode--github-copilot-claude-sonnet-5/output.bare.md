```ts
/**
 * Retries an async function up to a fixed number of attempts, using
 * exponential backoff with jitter between retries.
 *
 * @param fn - The async function to invoke on each attempt.
 * @param attempts - Maximum number of attempts before giving up (default 3).
 * @param baseMs - Base delay in milliseconds used to compute backoff (default 100).
 * @returns The resolved value of `fn` on the first successful attempt.
 * @throws The last error encountered if all attempts fail.
 */
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  // Holds the most recent error so it can be rethrown if every attempt fails
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      // Attempt to run the function; return immediately on success
      return await fn();
    } catch (err) {
      // Remember the error in case this was the last attempt
      lastErr = err;
      if (i < attempts - 1) {
        // Exponential backoff (baseMs * 2^i) plus random jitter to avoid
        // thundering-herd retries when multiple callers fail simultaneously
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  // All attempts exhausted; propagate the last error to the caller
  throw lastErr;
}
```
