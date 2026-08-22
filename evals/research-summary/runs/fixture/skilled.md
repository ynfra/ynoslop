---
runner: fixture
model: -
variant: skilled
recorded: 2026-08-21T00:00:00.000Z
---

For a dashboard that only pushes server-to-client, SSE is the better default.

SSE is plain HTTP: one long-lived GET returning `text/event-stream`. It passes
through proxies, load balancers, and corporate firewalls that mangle WebSocket
upgrades, and it works with ordinary HTTP middleware — auth headers, gzip,
HTTP/2 multiplexing. The browser's `EventSource` reconnects automatically and
resends the `Last-Event-ID` header, so resuming after a dropped connection
costs you one `id:` field per message instead of custom reconnect code. The
two real limits: it is text-only (binary must be base64-encoded), and over
HTTP/1.1 a browser caps you at 6 connections per origin — a problem if users
open many tabs, gone entirely on HTTP/2.

WebSockets give you a bidirectional binary channel after an HTTP upgrade
handshake. That buys nothing here — the dashboard never sends data up — and
costs you: no automatic reconnection or resume (you write heartbeats and
backoff yourself or pull in a library), and some proxies still drop or time
out upgraded connections, which typically forces a fallback layer anyway.

Choose WebSockets when you later need client-to-server messages at high
frequency (live filtering that can't be a normal request, collaborative
editing) or binary frames. For one-way metrics updates, SSE does the same job
with meaningfully less code to own.
