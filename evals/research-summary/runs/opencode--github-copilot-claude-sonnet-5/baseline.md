---
runner: opencode
model: github-copilot/claude-sonnet-5
variant: baseline
recorded: 2026-08-22T10:15:22.965Z
ms: 15116
skills: [no-slop-writing]
---

## SSE vs WebSockets for a metrics dashboard (server → client only)

For a use case that's purely server-to-client (e.g., pushing metric updates to a dashboard), **Server-Sent Events (SSE) is generally the better default**, with WebSockets justified mainly if you anticipate needing bidirectional communication later.

**Protocol & infrastructure simplicity**
SSE runs over plain HTTP/1.1 (or HTTP/2), so it works transparently through existing reverse proxies, load balancers, and corporate firewalls without special configuration. WebSockets require an HTTP upgrade handshake and persistent full-duplex connections, which some older proxies, CDNs, or restrictive network setups mishandle — you often need extra config (e.g., `proxy_pass` upgrade headers in nginx) to make them work reliably.

**Reconnection & reliability**
SSE has automatic reconnection built into the browser's `EventSource` API, including a `Last-Event-ID` mechanism so the server can resume/replay missed events. WebSockets have no native reconnection logic — you must hand-roll reconnect/backoff and re-sync state yourself, which is easy to get subtly wrong.

**Resource usage & scaling**
Both hold long-lived connections, so server-side concurrency limits (file descriptors, memory per connection) apply either way. SSE connections are simpler (one-directional HTTP stream), so many server frameworks and load balancers handle them slightly more cheaply and predictably at scale than full-duplex WebSocket state machines.

**Browser support & tooling**
`EventSource` is natively supported in all modern browsers with minimal client code. WebSockets need a bit more client-side plumbing (manual message parsing, connection state handling), though libraries abstract most of this.

**Data format & flexibility**
SSE is text-based (UTF-8) and event-oriented — fine for JSON metric payloads, but not suited for binary data. WebSockets support both text and binary frames, giving more flexibility if you ever need to push binary blobs (e.g., compressed payloads, protobufs) efficiently.

**Bidirectionality**
This is the real differentiator. SSE is strictly server → client; any client-to-server communication needs a separate regular HTTP request/response. WebSockets are full-duplex, letting the client send messages over the same connection — useful for real-time chat, collaborative editing, or command/control channels, but unnecessary overhead if the dashboard only ever *receives* updates.

**Recommendation:** For a metrics dashboard with one-way updates, SSE is the pragmatic choice — simpler to deploy behind existing infra, built-in reconnection/resume, and no need to manage a bidirectional protocol you won't use. Reach for WebSockets only if you expect future requirements like client-initiated commands, sub-100ms latency needs beyond what chunked HTTP gives you, or binary streaming.
