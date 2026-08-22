---
runner: opencode
model: github-copilot/claude-sonnet-5
variant: skilled
recorded: 2026-08-22T10:05:38.535Z
ms: 7079
skills: [no-slop-writing]
---

```ts
/**
 * Retries an async function on failure with exponential backoff plus jitter.
 *
 * @param fn - Function to invoke. Called at most `attempts` times.
 * @param attempts - Max total calls, including the first. Default 3.
 * @param baseMs - Base delay in ms for backoff. Default 100.
 * @returns The resolved value of `fn` on the first successful call.
 * @throws The error from the last failed attempt if all attempts fail.
 */
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      // Record the failure so it can be rethrown if this was the last attempt.
      lastErr = err;
      if (i < attempts - 1) {
        // Backoff grows as baseMs * 2^i (100, 200, 400, ... ms), plus up to
        // baseMs ms of random jitter to avoid synchronized retries across callers.
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  // All attempts exhausted: surface the most recent error.
  throw lastErr;
}
```
