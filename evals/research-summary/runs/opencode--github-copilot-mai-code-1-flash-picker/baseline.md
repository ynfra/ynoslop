---
runner: opencode
model: github-copilot/mai-code-1-flash-picker
variant: baseline
recorded: 2026-08-22T10:17:25.686Z
ms: 12687
skills: [no-slop-writing]
---

For a metrics dashboard that only needs updates flowing from server to browser, SSE is usually the more practical default. It is a simple, HTTP-based streaming mechanism: you open a regular GET request, the server keeps it open, and sends a stream of messages as text/event-stream. That makes it easy to implement, easy to debug, and naturally supports features you often want in dashboards such as automatic reconnection, event IDs, and retry behavior. It also fits the “push updates only” model well because the protocol is one-way and stateless from the client’s point of view, so the server can treat each browser connection as a simple long-lived stream. In many backend stacks, SSE is also easier to proxy, load-balance, and integrate with existing HTTP infrastructure.

WebSockets are the better choice when you need more than one-way streaming. They give you a full-duplex connection, so the browser and server can both send messages, which is useful if the dashboard also needs commands back to the server, live controls, or more complex interaction. They are also more flexible for high-frequency, low-latency messaging and can carry binary data, which can matter for some real-time systems. The tradeoff is complexity: you need a more stateful connection model, more careful lifecycle management, heartbeats, backpressure handling, and usually more operational care around proxies, timeouts, and reconnect logic. So if the requirement is simply “server pushes metrics to the browser,” SSE usually wins on simplicity and maintainability, while WebSockets are worth it when the app needs bidirectional communication or a more general real-time transport.
