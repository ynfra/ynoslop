---
runner: opencode
model: github-copilot/gemini-3.5-flash
variant: skilled
recorded: 2026-08-22T10:06:52.147Z
ms: 20109
skills: [no-slop-writing]
---

```typescript
/**
 * Executes an asynchronous function, retrying on failure.
 * 
 * By default, this makes up to 3 attempts with a 100 ms base delay.
 * If all attempts fail, it throws the last encountered error.
 */
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        // Calculates exponential delay (baseMs * 2^i) and adds up to baseMs of random jitter.
        // Jitter spreads retry requests over time to avoid thundering herd collisions.
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastErr;
}
```
