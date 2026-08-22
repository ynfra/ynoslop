---
runner: fixture
model: -
variant: baseline
recorded: 2026-08-21T00:00:00.000Z
---

```ts
/**
 * 🔁 A powerful and robust utility function that seamlessly handles retrying
 * asynchronous operations with a comprehensive exponential backoff strategy!
 *
 * In today's distributed systems landscape, transient failures are more common
 * than ever. This elegant helper leverages the time-tested exponential backoff
 * pattern to gracefully handle those failures, dramatically improving the
 * resilience and reliability of your application.
 *
 * It's important to note that this function is fully generic, meaning it works
 * seamlessly with any Promise-returning function you throw at it — whether
 * you're calling a REST API or querying a database!
 *
 * @template T - The generic type parameter representing the type of the value
 *               that the promise returned by `fn` will ultimately resolve to.
 * @param {() => Promise<T>} fn - The function to call.
 * @param {number} attempts - The number of attempts. Defaults to 3.
 * @param {number} baseMs - The base milliseconds. Defaults to 100.
 * @returns {Promise<T>} A promise that resolves to a value of type T.
 * @throws Throws an error.
 *
 * @example
 * // Basic usage
 * const data = await retry(() => fetch(url).then((r) => r.json()));
 */
export async function retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 100): Promise<T> {
  // Declare a variable to hold the last error
  let lastErr: unknown;
  // Loop over attempts
  for (let i = 0; i < attempts; i++) {
    // Begin a try block
    try {
      // Await the function and return the result
      return await fn();
      // Catch any error that may occur
    } catch (err) {
      // Assign the error to lastErr
      lastErr = err;
      // Check whether i is less than attempts minus 1
      if (i < attempts - 1) {
        // Calculate the delay by multiplying baseMs by 2 to the power of i and
        // then adding a random number multiplied by baseMs
        const delay = baseMs * 2 ** i + Math.random() * baseMs;
        // Create a new promise and wait for the timeout to resolve
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  // Throw the last error
  throw lastErr;
}
```
