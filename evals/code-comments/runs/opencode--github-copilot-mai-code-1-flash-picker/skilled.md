---
runner: opencode
model: github-copilot/mai-code-1-flash-picker
variant: skilled
recorded: 2026-08-22T10:07:10.441Z
ms: 6691
skills: [no-slop-writing]
---

```ts
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  // Track the most recent error so it can be rethrown if every attempt fails.
  let lastErr: unknown;

  // Try the operation once per allowed attempt.
  for (let i = 0; i < attempts; i++) {
    try {
      // Return immediately when the operation succeeds.
      return await fn();
    } catch (err) {
      // Save the error and retry with backoff unless this was the final attempt.
      lastErr = err;
      if (i < attempts - 1) {
        // Increase the delay exponentially and add a small random jitter.
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Re-throw the last error after all attempts have been exhausted.
  throw lastErr;
}
```
