```typescript
/**
 * Retries an asynchronous function with exponential backoff and randomized jitter.
 * 
 * @param fn - The asynchronous function to attempt.
 * @param attempts - Total number of allowed execution attempts.
 * @param baseMs - The base delay in milliseconds for exponential backoff.
 * @returns A promise that resolves with the value of the successful attempt.
 */
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      // Run the asynchronous function and return the result immediately if it succeeds
      return await fn();
    } catch (err) {
      lastErr = err;
      // Only delay if there are subsequent attempts remaining
      if (i < attempts - 1) {
        // Calculate delay using exponential backoff plus randomized jitter to prevent thundering herd issues
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  // Exhausted all attempts, throw the final encountered error
  throw lastErr;
}
```
