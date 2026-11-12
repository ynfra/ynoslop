```typescript
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      // Store the error to rethrow if all attempts fail
      lastErr = err;
      if (i < attempts - 1) {
        // Exponential backoff with jitter: delay = baseMs * 2^i + random(0, baseMs)
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  // Rethrow the last error after all attempts are exhausted
  throw lastErr;
}
```
