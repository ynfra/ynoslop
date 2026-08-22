---
runner: opencode
model: github-copilot/claude-sonnet-5
variant: baseline
recorded: 2026-08-22T10:05:31.454Z
ms: 5606
skills: [no-slop-writing]
---

```ts
// Retries an async function with exponential backoff plus jitter.
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown; // Stores the most recent error to rethrow if all attempts fail
  for (let i = 0; i < attempts; i++) {
    try {
      // Attempt to run the function; return immediately on success
      return await fn();
    } catch (err) {
      // Save the error in case this was the last attempt
      lastErr = err;
      if (i < attempts - 1) {
        // Exponential backoff: baseMs * 2^i, plus random jitter up to baseMs
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  // All attempts exhausted; throw the last encountered error
  throw lastErr;
}
```
