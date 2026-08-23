### Server-Sent Events (SSE) vs. WebSockets for Unidirectional Metrics

#### Server-Sent Events (SSE)
*   **Protocol & Transport:** Runs over standard HTTP/1.1 (via chunked transfer encoding) or multiplexed over HTTP/2 and HTTP/3. It uses standard HTTP ports (80/443), making it highly compatible with existing reverse proxies, load balancers, firewalls, and API gateways without custom configuration.
*   **Directionality:** Unidirectional (server-to-client). This is a perfect architectural fit for a metrics dashboard that only consumes data.
*   **Built-in Resilience:** The browser's native `EventSource` API handles reconnection attempts, backoff, and connection tracking (via the `Last-Event-ID` header) automatically.
*   **Data Format:** Restricted to UTF-8 text (typically JSON). Binary data must be Base64-encoded, which adds a minor overhead.
*   **Limitations:** Under HTTP/1.1, browsers limit connections to 6 per domain (though this is resolved when multiplexing over HTTP/2 or HTTP/3).

#### WebSockets
*   **Protocol & Transport:** Starts as an HTTP request and upgrades to a custom, full-duplex TCP-based protocol (`ws://` or `wss://`). 
*   **Infrastructure Overhead:** Often requires explicit WebSocket routing configuration on reverse proxies (e.g., Nginx, Envoy) and load balancers. Some restrictive corporate firewalls and proxies block or prematurely terminate WebSocket connections.
*   **Directionality:** Bidirectional (full-duplex). For a read-only metrics dashboard, this is unnecessary overhead.
*   **Reliability Implementation:** No built-in reconnection or heartbeat mechanism. You must implement custom ping/pong keep-alives and reconnection backoff logic on both the client and server.
*   **Data Format:** Supports both UTF-8 text and raw binary formats natively.

#### Recommendation
**Choose Server-Sent Events.** Since your requirements are strictly unidirectional, SSE offers simpler backend implementation, native reconnection resilience, and works seamlessly with your existing HTTP/2 or HTTP/3 infrastructure without custom proxy or load-balancer configurations. Use WebSockets only if you expect the dashboard to require low-latency bidirectional interactions in the future.
