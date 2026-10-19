## 2026-10-19 - Path Traversal in Local Store State Path Generation
**Vulnerability:** Unsanitized `userId` passed to `localFile` in `src/store.js` allowed directory traversal outside `/tmp` when constructed with relative path sequences like `../`.
**Learning:** Interpolating user identifiers directly into file system paths allows path traversal attacks if the identifier contains path separators or traversal characters.
**Prevention:** Sanitize user identifiers with `replace(/[^a-zA-Z0-9_-]/g, '_')` or validate against allowlist before interpolating into file paths.
