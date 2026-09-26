# Handoff Hub

Cross-AI context handoff and private project memory.

## Current GitHub integration

The deployed GitHub operator supports `balaadithya123/handoff-hub` through the Hub-owned GitHub integration. The repository allowlist is controlled by `GITHUB_ALLOWED_REPOS`; when that production variable is absent, the server defaults to `balaadithya123/handoff-hub` so the core repository remains operable. Set the production variable explicitly to the same repository for a fully explicit deployment configuration.
