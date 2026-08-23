```typescript
/**
 * Retries an asynchronous function until it succeeds or the attempt limit is reached.
 *
 * If a call throws an error, the function waits before the next attempt.
 * The delay increases exponentially with random jitter.
 * If all attempts fail, the function throws the final error.
 *
 * @param fn - Asynchronous function to execute.
 * @param attempts - Maximum execution attempts. Default is 3.
 * @param baseMs - Base delay in milliseconds. Default is 100.
 * @returns A promise that resolves to the value returned by fn.
 * @throws The error from the final attempt if all attempts fail.
 */
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        // Wait interval increases exponentially with an added random delay of 0 to baseMs.
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastErr;
}
```
