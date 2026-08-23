## Recommendation

Use Server-Sent Events (SSE) for a metrics dashboard that only sends updates from server to browser. SSE matches the one-way data flow and includes reconnection behavior without a separate client protocol.

SSE sends UTF-8 text over a long-lived HTTP response using `text/event-stream`. The browser’s `EventSource` API reconnects automatically and can send `Last-Event-ID`, allowing the server to resume after a dropped connection. SSE works through standard HTTP infrastructure, though reverse proxies must disable response buffering and use sufficiently long idle timeouts. Sending periodic comment lines prevents intermediaries from closing an otherwise idle stream.

WebSockets establish a persistent, bidirectional connection after an HTTP upgrade. They support text and binary frames and are appropriate when the browser must send frequent messages over the same connection. For a one-way dashboard, that adds protocol handling: reconnect logic, heartbeat messages, missed-update recovery, and connection state must be implemented by the application or a library.

SSE has several constraints. Native `EventSource` accepts a URL and cookies but does not support arbitrary request headers, which complicates bearer-token authentication. A fetch-based SSE client avoids that restriction. SSE is text-only, so binary metrics require encoding or a different transport. Under HTTP/1.1, browsers commonly limit each origin to about six concurrent connections across tabs. HTTP/2 multiplexing removes that practical bottleneck when the server and proxy support it.

WebSockets avoid the `EventSource` header restriction and handle binary data directly. They also give explicit control over framing and backpressure. Their HTTP upgrade can require separate proxy configuration, and some gateways apply different timeout or observability rules to upgraded connections.

For periodic JSON metric snapshots or events, SSE is the smaller implementation. Choose WebSockets if the dashboard later requires high-frequency client commands, binary payloads, or one shared bidirectional protocol.
