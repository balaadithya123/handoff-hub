## 2025-05-18 - Permissive CORS Wildcard Fallback
**Vulnerability:** Fallback ternary `origin && allowedOrigin(origin) ? origin : '*'` set `Access-Control-Allow-Origin: *` when `allowedOrigin(origin)` returned `false` for untrusted origins.
**Learning:** Ternary fallback expressions for CORS origins must guard setting the header altogether when origin is untrusted rather than defaulting to wildcard `'*'`.
**Prevention:** Only set `Access-Control-Allow-Origin` inside `if (allowedOrigin(origin))`.
