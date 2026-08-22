---
runner: opencode
model: github-copilot/mai-code-1-flash-picker
variant: skilled
recorded: 2026-08-22T10:17:34.314Z
ms: 8624
skills: [no-slop-writing]
---

For a metrics dashboard that only needs server-to-browser updates, Server-Sent Events are usually the simpler default. They run over a normal HTTP connection, so they fit existing load balancers, reverse proxies, auth layers, and monitoring tools more naturally than WebSockets. Browsers also handle reconnects and event IDs for you, which is useful for dashboards that may briefly lose connectivity. SSE is also a good fit when the data is text-based and one-way: you publish a stream of metric updates from the server and the browser consumes them. The tradeoff is that SSE is limited to text payloads and to server-to-client direction, so it is less flexible if you later need browser-to-server commands or binary data.

WebSockets are the better choice when you need bidirectional traffic, lower-latency message exchange, or binary payloads. They support full-duplex communication and can be more efficient for high-frequency, message-oriented workloads because they avoid the extra HTTP-style framing that SSE uses. The cost is more complexity: you must manage the handshake, framing, ping/pong, reconnection logic, and your own application protocol. They are also less convenient in environments that are already built around HTTP-based infrastructure.

For a dashboard whose main job is to push updates from server to browser, SSE usually wins on simplicity and operational fit. Choose WebSockets if you expect the app to grow into a two-way protocol or need binary data.
