Server-Sent Events (SSE) is the optimal choice for a unidirectional metrics dashboard because it runs over standard HTTP/1.1 or HTTP/2 without the protocol overhead or custom reconnection logic of WebSockets. SSE transports data as a `text/event-stream` format over a single, long-lived HTTP connection.

## Server-Sent Events Tradeoffs

SSE is unidirectional, sending data only from server to client. The browser `EventSource` API handles reconnection automatically, using a default delay of 3000 milliseconds if the connection drops. Because SSE is standard HTTP, it works through existing reverse proxies, firewalls, and load balancers without special configuration. It supports HTTP/2 multiplexing. This allows a browser to share a single TCP connection for up to 100 concurrent streams, bypassing the HTTP/1.1 limit of 6 connections per domain. SSE is restricted to UTF-8 text payloads, which requires base64 encoding for binary data.

## WebSockets Tradeoffs

WebSockets support bidirectional communication using a custom framing protocol defined in RFC 6455. The protocol starts with an HTTP Upgrade request, then switches to a TCP socket. This eliminates HTTP header overhead on subsequent frames, reducing framing overhead to 2 to 14 bytes per message. WebSockets support both UTF-8 text and raw binary frames. However, the protocol does not provide native reconnection or heartbeat mechanisms. Developers must implement custom ping-pong frames to detect dead connections and write reconnection loops in the client. Many enterprise firewalls and proxies block the WebSocket Upgrade handshake, and infrastructure like Cloudflare terminates idle WebSocket connections after 100 seconds.
