## SSE vs WebSockets for a metrics dashboard

For a metrics dashboard with **only server-to-client updates**, SSE is usually the better fit. Here's why, with the tradeoffs laid out.

### Server-Sent Events (SSE)

**Strengths**
- **Purpose-built for one-way push.** Your use case (server → browser) is exactly what SSE does. No unused bidirectional machinery.
- **Runs over plain HTTP.** It's just a long-lived `text/event-stream` response. Works cleanly through proxies, load balancers, and firewalls that already understand HTTP. No protocol upgrade to misconfigure.
- **Automatic reconnection is built in.** The browser's `EventSource` reconnects on drop and, via `Last-Event-ID`, lets the server resume from where the client left off — valuable for a metrics feed you don't want to gap.
- **Trivial client code.** `new EventSource(url)` plus an `onmessage` handler. No framing, no ping/pong to hand-roll.
- **Standard HTTP auth/tooling.** Cookies, bearer headers, gzip, and normal observability all apply.

**Weaknesses**
- **Text/UTF-8 only.** No native binary frames. Fine for JSON metrics, awkward for binary payloads.
- **Browser connection limit over HTTP/1.1.** ~6 connections per domain. Multiple SSE streams per tab can exhaust that — largely solved by serving over HTTP/2.
- **Uni-directional by design.** If you later need client → server messages, you fall back to regular HTTP requests (which is fine, but it's a separate channel).
- **Header quirk:** custom headers can't be set on `EventSource` directly; auth often rides on cookies or a query param.

### WebSockets

**Strengths**
- **Full duplex.** Genuine two-way, low-overhead messaging — the right tool if the client ever needs to push commands, subscriptions, or acks in real time.
- **Binary support.** Native binary frames for compact or high-throughput payloads.
- **Very low per-message overhead** once the connection is established.

**Weaknesses**
- **Overkill for one-way data.** You take on duplex complexity you won't use.
- **Requires an HTTP upgrade handshake** to the `ws://`/`wss://` protocol, which some proxies, corporate firewalls, and load balancers handle poorly without extra config.
- **You own the reliability logic.** Reconnection, backoff, heartbeats/ping-pong, and message-resume are all manual.
- **Heavier operationally.** Stateful long-lived sockets, separate scaling and monitoring story from your normal HTTP stack.

### Recommendation

Use **SSE**. Your requirement is exactly its sweet spot: server-to-client JSON updates over standard HTTP, with free reconnection and resume. Reach for WebSockets only if you anticipate real bidirectional needs (interactive controls, client-driven subscriptions) or must push binary data. If you go SSE, serve it over **HTTP/2** to sidestep the per-domain connection limit.
