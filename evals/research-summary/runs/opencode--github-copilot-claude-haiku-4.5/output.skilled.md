# Server-Sent Events vs WebSockets for server-to-client updates

**Server-Sent Events (SSE)** is simpler to implement and debug. It uses a single HTTP connection, works through most proxies and firewalls without configuration, and integrates with existing HTTP infrastructure (caching, compression, authentication). The browser reconnects automatically on network failure. SSE works over HTTP/1.1 and HTTP/2.

**WebSockets** requires a protocol upgrade but gives you a bidirectional channel. If your dashboard ever needs client-to-server communication—filtering metrics, requesting specific data, or controlling what updates to receive—WebSockets avoids the overhead of a second connection. The initial handshake is heavier, but per-message overhead is lower once established.

For a metrics dashboard with only server-to-client updates, SSE is the better choice. You avoid the complexity of handling bidirectional state and connection lifecycle management. Reconnection is automatic. The one drawback: some corporate proxies strip streaming responses or have tight timeouts; if your users hit that, you'd need to add periodic keep-alives or fall back to polling. But this is rare with modern infrastructure.

Choose WebSockets if you later add interactive filtering, drill-down controls, or dynamic subscription changes. Otherwise, SSE's simplicity and compatibility win.
