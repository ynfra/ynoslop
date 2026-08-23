```ts
/**
 * Retry an asynchronous function with exponential backoff and jitter.
 *
 * Calls `fn()` up to `attempts` times. If a call throws, the function will wait
 * for an exponentially increasing delay (baseMs * 2^attemptIndex) plus a small
 * random jitter (0..baseMs) before trying again. If all attempts fail, the
 * last thrown error is re-thrown.
 *
 * This is useful for transient failures (network issues, rate limits, etc.).
 *
 * @template T - the resolved type of the provided async function
 * @param fn - a zero-argument function that returns a Promise<T>
 * @param attempts - maximum number of attempts (default: 3)
 * @param baseMs - base delay in milliseconds used for backoff and jitter (default: 100)
 * @returns a Promise that resolves to the successful result of `fn()` or rejects with the last error
 */
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  // Keep track of the latest error to re-throw if all attempts fail.
  let lastErr: unknown;

  // Try up to `attempts` times.
  for (let i = 0; i < attempts; i++) {
    try {
      // Attempt the operation; if it succeeds, return immediately.
      return await fn();
    } catch (err) {
      // Save the error to throw later if this was the last attempt.
      lastErr = err;

      // If there are more attempts remaining, wait with exponential backoff + jitter.
      if (i < attempts - 1) {
        // Exponential backoff: baseMs * 2^i
        // Jitter: add up to baseMs milliseconds to avoid thundering-herd effects.
        const delay = baseMs * 2 ** i + Math.random() * baseMs;

        // Pause before the next retry.
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts exhausted — re-throw the last observed error.
  throw lastErr;
}
```
