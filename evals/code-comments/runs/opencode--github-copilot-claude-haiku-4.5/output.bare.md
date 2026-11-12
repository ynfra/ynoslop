```typescript
/**
 * Retries an async function with exponential backoff and jitter.
 * @param fn - The async function to retry
 * @param attempts - Number of attempts (default: 3)
 * @param baseMs - Base delay in milliseconds (default: 100)
 * @returns The result of the function if successful
 * @throws The last error if all attempts fail
 */
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;
  // Attempt to execute the function up to 'attempts' times
  for (let i = 0; i < attempts; i++) {
    try {
      // Execute the function and return immediately on success
      return await fn();
    } catch (err) {
      // Store the error for potential re-throw
      lastErr = err;
      // If there are remaining attempts, wait before retrying
      if (i < attempts - 1) {
        // Calculate exponential backoff with jitter: baseMs * 2^i + random(0, baseMs)
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        // Wait for the calculated delay before the next attempt
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  // If all attempts exhausted, throw the last error encountered
  throw lastErr;
}
```
