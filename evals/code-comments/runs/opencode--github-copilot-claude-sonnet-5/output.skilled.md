```ts
/**
 * Runs `fn`, retrying on failure with exponential backoff plus jitter.
 *
 * @param fn - Async operation to attempt.
 * @param attempts - Max total tries, including the first. Default 3.
 * @param baseMs - Base delay in ms for backoff. Default 100.
 * @returns The resolved value of `fn` on the first successful attempt.
 * @throws The error from the last attempt if all attempts fail.
 */
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // Skip the delay after the final attempt; there's nothing to wait for.
      if (i < attempts - 1) {
        // Exponential backoff (baseMs * 2^i) plus up to baseMs of jitter,
        // e.g. with baseMs=100: ~100-200ms, ~200-300ms, ~400-500ms.
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  // All attempts exhausted; rethrow the most recent error.
  throw lastErr;
}
```
