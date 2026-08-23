For a metrics dashboard that only pushes updates from the server to the browser, prefer Server-Sent Events (SSE).

SSE uses a long-lived HTTP response with `Content-Type: text/event-stream`. The browser's `EventSource` API parses named events and reconnects after a connection loss. Each event can include an `id`; the browser sends it back as `Last-Event-ID` on reconnect, so the server can resume from a known point if it retains a replay buffer.

WebSockets start as an HTTP upgrade, then switch to a bidirectional message protocol. They fit interactive clients that need frequent browser-to-server messages: chat, collaborative editing, multiplayer state, terminal sessions, or client-side commands. A metrics dashboard does not need that channel.

SSE has useful operational properties for this case. It passes through HTTP-aware infrastructure more naturally than WebSockets, works with normal HTTP authentication and cookies, and supports reconnection without application code. It is text-only, but JSON metrics updates are already text. The server should send periodic comment lines such as `: ping\n\n` if proxies or load balancers close idle connections.

WebSockets require the application to define reconnect behavior, message ordering after reconnect, resubscription, and any replay protocol. They also need WebSocket support in every proxy, load balancer, CDN, and ingress between browser and server. A dropped socket has no built-in equivalent of SSE event IDs.

SSE constraints matter. `EventSource` does not allow arbitrary request headers, so bearer-token authentication generally needs a cookie, a query parameter with its security drawbacks, or a fetch-based streaming client instead. Under HTTP/1.1, browsers commonly limit an origin to six concurrent connections, making many independent SSE streams a poor fit. HTTP/2 multiplexes streams and avoids that limit in normal deployments. SSE is also server-to-client only; adding client commands later means separate HTTP endpoints.

Use one SSE endpoint per dashboard session and send compact, coalesced updates at a fixed cadence. Use WebSockets only if the dashboard needs low-latency client messages or binary payloads.
