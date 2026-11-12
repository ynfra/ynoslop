For a metrics dashboard with only server-to-client updates, Server-Sent Events (SSE) are the closer fit, but the decision hinges on a few concrete constraints.

**Direction and protocol.** SSE is one-way: the server pushes, the browser receives, over a normal HTTP response that stays open with `Content-Type: text/event-stream`. WebSockets are bidirectional over a single TCP connection after an HTTP `Upgrade` handshake, giving you a full-duplex channel you don't need here. If the client only sends the occasional request (change a time range, acknowledge an alert), a plain `fetch` or `POST` alongside an SSE stream covers it.

**Reconnection.** SSE reconnects automatically. The browser's `EventSource` retries on drop and sends a `Last-Event-ID` header so the server can resume from the last event it saw, if you assign IDs. WebSockets have no built-in reconnect or replay; you write the retry loop, backoff, and gap-recovery yourself. For a dashboard that must survive laptop sleep and flaky Wi-Fi, this is SSE's main advantage.

**Data format.** SSE carries UTF-8 text only. Metrics are almost always JSON or numbers, so this rarely matters, but binary payloads must be base64-encoded, which adds about 33% overhead. WebSockets carry text or binary frames natively.

**Connection limits.** Over HTTP/1.1, a browser allows only 6 concurrent connections per domain, and each open `EventSource` consumes one. A user with several dashboard tabs can exhaust the pool and stall other requests to that origin. Over HTTP/2 or HTTP/3 the streams are multiplexed on one connection (default `SETTINGS_MAX_CONCURRENT_STREAMS` is typically 100+), so serve SSE over HTTP/2 to avoid this. WebSockets don't count against the per-domain HTTP limit.

**Infrastructure.** SSE is ordinary HTTP: proxies, load balancers, and CDNs handle it without special configuration, though you must disable response buffering (for example `X-Accel-Buffering: no` on nginx) or events queue up instead of streaming. WebSockets need explicit `Upgrade` handling; some corporate proxies and older load balancers drop or mishandle the upgrade.

**Client API.** `EventSource` is a dozen lines and handles parsing, events, and reconnect. WebSocket client code is also small but leaves reconnection and message framing to you.

Pick SSE. The traffic is one-directional, JSON-shaped, and benefits from automatic reconnect with `Last-Event-ID` resume. Serve it over HTTP/2 to sidestep the 6-connection limit, and disable proxy buffering. Choose WebSockets only if the dashboard grows a genuine interactive channel (live queries, collaborative controls) or needs binary frames, at which point the duplex connection and manual reconnect logic start to pay for themselves.
