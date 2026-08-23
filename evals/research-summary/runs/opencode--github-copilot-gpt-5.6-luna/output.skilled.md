## SSE vs. WebSockets

For a metrics dashboard that only receives updates, Server-Sent Events (SSE) is usually the simpler choice. The browser opens a long-lived HTTP request with `EventSource`, and the server sends `text/event-stream` messages as metrics change. SSE includes automatic reconnection, event IDs for resuming after a disconnect, and straightforward compatibility with HTTP authentication, reverse proxies, and standard observability tools.

SSE is limited to server-to-client delivery and text payloads. Browsers also impose low per-origin connection limits under HTTP/1.1, so multiple dashboard streams may require connection consolidation. HTTP/2 removes much of that limitation when the proxy and server support it. The server still needs heartbeat comments or events to prevent idle timeouts in proxies and load balancers.

WebSockets provide a persistent, bidirectional connection. They suit dashboards that also need client-to-server actions, such as subscriptions, interactive filters, acknowledgements, or collaborative controls. They support binary frames and typically reduce framing overhead for high-frequency or compact data. The costs are a separate protocol upgrade path, more explicit reconnect and heartbeat handling, and closer attention to proxy, load-balancer, authentication, and connection-draining behavior. Horizontal scaling may require connection affinity or a shared pub/sub layer, although the same concern applies to long-lived SSE connections.

Choose SSE when updates are one-way, textual, and naturally represented as events. Choose WebSockets when the browser must send messages over the same live channel or when binary throughput and bidirectional communication justify the added operational code.
