---
runner: opencode
model: github-copilot/claude-sonnet-5
variant: skilled
recorded: 2026-08-22T10:15:39.724Z
ms: 16756
skills: [no-slop-writing]
---

For a metrics dashboard with one-way server-to-client updates, SSE is the better default. WebSockets earn their complexity only if you need client-to-server messages beyond initial subscription setup.

**Protocol and transport.** SSE runs over plain HTTP/1.1 or HTTP/2, using `text/event-stream` responses that stay open and stream `data:` lines. WebSockets upgrade the connection via `Connection: Upgrade`, switching to a separate framed binary protocol (RFC 6455) after the handshake. This matters for anything sitting between browser and server: corporate proxies, load balancers, and older HTTP/1.0 intermediaries handle SSE without special configuration because it's still HTTP. WebSocket upgrades fail silently behind some proxies that strip the `Upgrade` header, and load balancers need explicit sticky-session or WebSocket-aware configuration (e.g., nginx's `proxy_set_header Upgrade $http_upgrade`).

**Reconnection.** Browsers reconnect SSE automatically via `EventSource`, and the server can send a `Last-Event-ID` header on reconnect so the client resumes from where it left off, provided your server tracks event IDs. WebSockets have no built-in reconnection; you write your own backoff logic and re-establish subscription state manually after every drop, including on tab wake from sleep or network switches.

**Connection limits.** Browsers cap concurrent HTTP/1.1 connections per origin at 6 (Chrome, Firefox). Each open `EventSource` counts against that limit, so if your dashboard opens several SSE streams to the same origin, you can starve other requests. HTTP/2 removes this ceiling by multiplexing streams over one TCP connection — worth confirming your server and reverse proxy actually negotiate HTTP/2 for the SSE endpoint, not just HTTP/1.1 with keep-alive. WebSockets don't share this per-origin cap since each is its own TCP connection outside the HTTP request-count model.

**Message direction and framing.** SSE is server-to-client only; the client can't send data on the same connection, so any client command (change refresh rate, filter metrics) needs a separate HTTP request. WebSockets are full-duplex from the start. For a dashboard where the client only occasionally calls a REST endpoint to adjust filters and otherwise just listens, that asymmetry costs you nothing.

**Payload format.** SSE is text-based UTF-8; binary payloads must be base64-encoded, adding ~33% overhead. Metrics as JSON text are a non-issue here. WebSockets support native binary frames, relevant if you later push protobuf or MessagePack.

**Server resource cost.** Both hold one connection per client, so neither scales differently in that respect. The difference is on the framing/parsing side: WebSocket frame parsing is a bit more CPU work per message; SSE is closer to writing a plain string, which lowers server-side complexity for a Node/Go/Python service just pushing a metrics snapshot every few seconds.

**Recommendation.** Use SSE. You get automatic reconnection, `Last-Event-ID` resume, HTTP/2 multiplexing without a special server, and no proxy configuration. Move to WebSockets only if you later need the client to send high-frequency control messages (e.g., interactive drill-down queries) rather than occasional REST calls.
