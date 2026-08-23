Server-Sent Events (SSE) vs. WebSockets for one-way server→client push:

**Server-Sent Events**
- Built on plain HTTP, so it works over standard infrastructure — proxies, load balancers, and CDNs handle it without special configuration, and it reuses your existing HTTP auth (cookies, headers) with no separate handshake.
- Automatic reconnection with `Last-Event-ID` is built into the browser `EventSource` API, so you get resumable streams for free.
- Text-only (UTF-8) protocol — fine for JSON metrics payloads, but no binary support.
- One-directional by design: the client can't send data back over the same connection (it would need a separate HTTP request for that, which is irrelevant here since you only need server→client).
- Browsers cap concurrent HTTP/1.1 connections per origin (6), which can bite you if a user has many tabs open — though this is largely moot with HTTP/2, which multiplexes SSE streams over one connection.
- Simpler server-side implementation: it's just a long-lived HTTP response with `text/event-stream`, so it fits naturally into most web frameworks without a separate protocol stack.

**WebSockets**
- Full-duplex — the client can also send data back over the same connection, but you don't need that for a dashboard, so this is unused overhead.
- Requires an upgrade handshake and a dedicated protocol on top of TCP; more moving parts through proxies/load balancers (sticky sessions, WS-aware config) and slightly more operational complexity.
- No built-in reconnection or message-ID replay — you have to implement reconnect/backoff and any "catch up on missed data" logic yourself.
- Supports binary frames, useful if you ever need to push compact binary formats instead of JSON/text.
- Generally more library/tooling overhead client-side and server-side (framing, ping/pong keepalives) compared to SSE's plain HTTP model.

**Recommendation for your case**
Since you only need server-to-client updates, SSE is the better default: less protocol complexity, native reconnection/resume, and full compatibility with normal HTTP infrastructure. Reach for WebSockets only if you anticipate needing bidirectional communication later (e.g., letting the dashboard send commands or filters back to the server over the same channel) or if you need binary framing for performance-sensitive high-frequency data — neither of which seems to apply to a metrics dashboard.
