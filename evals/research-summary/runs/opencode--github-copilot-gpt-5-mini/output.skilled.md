Choose Server-Sent Events (SSE) when your dashboard only needs server-to-client updates and you want minimal server complexity.  
SSE is an HTTP long-lived text/event-stream response.  
Modern browsers automatically reconnect and can send Last-Event-ID so the server can resume missed events.  
SSE transports text only; it has no binary frames.  
WebSockets upgrade an HTTP request to a persistent full-duplex TCP connection and support binary frames.  
WebSockets require a dedicated ws server endpoint or library and explicit client reconnect logic.  
Both approaches consume one TCP connection per client, so scaling constraints (file descriptors, event-loop model, connection brokers) are similar and you will likely need a pub/sub like Redis or NATS for many clients.  
For update rates in the tens of events per second per client, SSE’s streaming is adequate; for hundreds of small messages per second or large binary payloads, WebSockets reduce framing and CPU overhead.  
A common operational failure is intermediate proxies or load balancers closing idle long-lived connections; default ALB/ELB idle timeouts are 60 seconds, so configure keepalives or send periodic comments (SSE) or pings (WebSocket).  
SSE gives built-in ordering and resume semantics via event IDs; WebSocket resume and ordering require you to add sequence numbers and server-side state.  
Authentication and encryption are equivalent in practice: use HTTPS/WSS and the same token or cookie-based schemes, but remember CORS and cookie rules apply to the WebSocket handshake.  
For a metrics dashboard that only pushes updates, SSE is the simpler, lower-maintenance choice; choose WebSockets only if you need binary payloads, very high per-client message rates, or true bidirectional interaction.
