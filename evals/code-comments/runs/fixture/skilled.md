---
runner: fixture
model: -
variant: skilled
recorded: 2026-08-21T00:00:00.000Z
---

```ts
/**
 * Retry `fn` up to `attempts` times with exponential backoff.
 * Delay before attempt i+1 is baseMs·2^i plus up to baseMs of random
 * jitter, so simultaneous callers don't retry in lockstep.
 * Rethrows the error from the final attempt.
 */
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // No sleep after the final failure — it would only delay the throw.
      if (i < attempts - 1) {
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastErr;
}
```
