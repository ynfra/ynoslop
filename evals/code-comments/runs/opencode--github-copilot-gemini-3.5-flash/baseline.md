---
runner: opencode
model: github-copilot/gemini-3.5-flash
variant: baseline
recorded: 2026-08-22T10:06:32.034Z
ms: 25800
skills: [no-slop-writing]
---

```ts
/**
 * Retries an asynchronous function with exponential backoff and random jitter.
 *
 * @param fn - The asynchronous function to attempt.
 * @param attempts - Maximum number of execution attempts.
 * @param baseMs - Base delay in milliseconds for the backoff calculation.
 * @returns Resolves with the successful result of `fn`.
 * @throws The error thrown by the last attempt if all attempts fail.
 */
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // Wait before the next attempt, unless this was the final attempt.
      if (i < attempts - 1) {
        // Backoff scale is baseMs * 2^i, with up to baseMs of added jitter to prevent lockstep.
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastErr;
}
```
