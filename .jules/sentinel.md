## 2026-10-17 - Path Traversal Prevention in GitHub Integration
**Vulnerability:** Unsanitized file paths containing relative path components (`..` / `.`) allowed URL path traversal when constructing GitHub REST API endpoints.
**Learning:** `path.split('/').map(encodeURIComponent).join('/')` does not prevent `..` path segments because `encodeURIComponent('..')` returns `'..'`.
**Prevention:** Always normalize and validate path segments against `..` or `.` before constructing URLs or passing paths to external API endpoints.
