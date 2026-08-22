---
runner: opencode
model: github-copilot/gemini-3.5-flash
variant: skilled
recorded: 2026-08-22T10:17:12.992Z
ms: 27007
skills: [no-slop-writing]
---

# SSE vs. WebSockets for Unidirectional Metrics

For unidirectional server-to-client updates, Server-Sent Events (SSE) is simpler to implement than WebSockets because it runs over standard HTTP without protocol upgrades.

## Server-Sent Events (SSE)

SSE transmits text data as a continuous stream of standard HTTP responses. The browser EventSource API handles reconnections automatically with a default 3-second delay.

On HTTP/1.1 connections, browsers limit concurrent SSE streams to 6 per domain. If a user opens 7 dashboard tabs, the 7th tab will stall. Running the backend on HTTP/2 removes this constraint because HTTP/2 multiplexes streams over a single TCP connection.

SSE is limited to UTF-8 text. To send binary metrics, you must encode them into formats like Base64, increasing payload size by 33%. Proxies and corporate firewalls rarely block SSE because it operates on standard HTTP ports 80 and 443.

## WebSockets

WebSockets starts with an HTTP GET request containing an `Upgrade: websocket` header, transitioning the connection to a persistent full-duplex TCP socket. This transition bypasses standard HTTP message framing.

The protocol has no built-in reconnection mechanism. You must write custom client-side retry logic and server-side connection tracking. To detect dead connections, you must implement a heartbeat using WebSocket ping and pong frames, as TCP silent drops can occur without alerting either peer.

WebSockets supports both text and raw binary frames, such as ArrayBuffer. This eliminates the 33% encoding overhead of binary data. Some corporate firewalls and reverse proxies block WebSocket connections on port 80, which requires you to encrypt the traffic via WebSockets Secure (WSS) on port 443 to ensure packet delivery.
