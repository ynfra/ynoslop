---
runner: opencode
model: github-copilot/mai-code-1-flash-picker
variant: baseline
recorded: 2026-08-22T10:07:03.748Z
ms: 11597
skills: [no-slop-writing]
---

```ts
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  // Track the last error so it can be rethrown if all attempts fail.
  let lastErr: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      // Attempt the operation and return immediately on success.
      return await fn();
    } catch (err) {
      // Save the error and retry if another attempt remains.
      lastErr = err;

      if (i < attempts - 1) {
        // Apply exponential backoff with a small random jitter to reduce retry collisions.
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Re-throw the last error after all retries have been exhausted.
  throw lastErr;
}
```
