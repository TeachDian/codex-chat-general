# Security Policy

Token Ledger reads local Codex session files and stores a local cache. Security and privacy reports are welcome.

## Supported Versions

The active branch and latest published build are supported.

## Reporting A Vulnerability

If you find a security or privacy issue, please open a GitHub issue only when it is safe to describe publicly. If the report includes sensitive details, contact the maintainer privately first or share only a minimal public description.

Useful report details:

- Operating system.
- Token Ledger version or commit.
- What data may be exposed or modified.
- Steps to reproduce.
- Whether the issue requires a crafted session file.
- Any suggested fix.

## Security Expectations

- Token Ledger must not modify Codex session files.
- Token Ledger should not transmit local session data to a remote service.
- Exports and screenshots may contain private project names or file paths, so users should review them before sharing.
- Parser changes should handle malformed files without crashing.
