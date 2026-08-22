---
runner: opencode
model: github-copilot/gemini-3.5-flash
variant: baseline
recorded: 2026-08-22T10:16:45.981Z
ms: 9572
skills: [no-slop-writing]
---

For a unidirectional metrics dashboard, choosing between Server-Sent Events (SSE) and WebSockets (WS) comes down to operational complexity versus future bidirectional needs. 

### Server-Sent Events (SSE)
SSE is built specifically for one-way server-to-client streaming over standard HTTP.

*   **Pros:**
    *   **Native HTTP Integration:** Runs over standard HTTP/1.1 or HTTP/2, utilizing existing load balancers, firewalls, and proxy setups without special configuration.
    *   **HTTP/2 Multiplexing:** Over HTTP/2, a single TCP connection can multiplex hundreds of SSE streams, bypassing the 6-connection-per-domain browser limit of HTTP/1.1.
    *   **Built-in Resilience:** The native browser API (`EventSource`) automatically handles reconnection, connection state tracking, and event ID resumption out-of-the-box.
    *   **Simpler Server Implementation:** Uses simple, readable text-based framing (`text/event-stream`), making it easy to implement and debug using standard HTTP tools.
*   **Cons:**
    *   **Strictly Unidirectional:** No native mechanism to send client-to-server messages on the same connection.
    *   **Text-Only Transport:** UTF-8 encoded text streams only (binary must be Base64-encoded).

### WebSockets (WS)
WebSockets provides a full-duplex, independent TCP-based protocol.

*   **Pros:**
    *   **Bidirectional & Full-Duplex:** Low-latency, two-way communication on a single persistent connection.
    *   **Binary Data Support:** Native transport for binary payloads, which can reduce serialization/deserialization overhead.
*   **Cons:**
    *   **Operational & Infrastructure Overhead:** Requires upgrading the HTTP connection (`HTTP 101 Switching Protocols`). Load balancers, reverse proxies (like Nginx), and corporate firewalls must be explicitly configured to support long-lived TCP upgrades.
    *   **No Built-in Reconnection:** Reconnection logic, backoff, and state recovery must be manually implemented on both client and server.
    *   **Resource Intensive:** Lacks native HTTP/2 multiplexing, meaning each browser tab requires a dedicated, distinct TCP connection.

### Recommendation
For a metrics dashboard with **only server-to-client updates**, **SSE is the superior choice**. It eliminates the protocol negotiation, proxy traversing issues, and manual reconnection logic of WebSockets while integrating natively into your existing HTTP/2 infrastructure. Use WebSockets only if you foresee a future requirement for high-frequency, low-latency upstream client control messages.
