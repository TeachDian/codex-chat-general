# Reporting Problems And Pull Requests

This guide explains how to report problems, request features, and submit pull requests for Token Ledger.

## Reporting A Problem

Open a bug report when the app crashes, shows wrong totals, misses sessions, imports a session incorrectly, or has a broken interface.

Include:

- Token Ledger version or commit.
- Operating system.
- Whether you used the portable executable, installer, or dev mode.
- What you expected to happen.
- What actually happened.
- Steps to reproduce the problem.
- Screenshots if they help.
- A sanitized sample session file only if it is safe to share.

Do not include:

- API keys.
- Private prompts.
- Customer data.
- Proprietary source code.
- Sensitive file paths unless they are needed and sanitized.

## Reporting Parser Problems

Parser issues are especially useful when a Codex session exists but Token Ledger skips it or counts it incorrectly.

Helpful details:

- The model name shown in the session.
- Whether the session has input, output, cached, or reasoning token fields.
- The scanner status counts shown in Settings.
- A short sanitized JSONL excerpt with only the relevant token-count event, if safe.

## Requesting Features

Open a feature request when you want a new chart, export format, filter, platform package, pricing source, or workflow.

Good feature requests explain:

- The workflow you are trying to improve.
- Why the current app does not handle it.
- What a useful result would look like.
- Any examples from other tools.

## Submitting A Pull Request

1. Fork or branch from the current default branch.
2. Keep your change focused on one problem.
3. Add tests for parser and aggregation changes.
4. Update README or docs when behavior changes.
5. Run the recommended checks.
6. Open a PR and fill out the template.

Recommended checks:

```powershell
npm test
npm run build
```

Rust scanner checks:

```powershell
cargo test --manifest-path src-tauri\Cargo.toml --release usage::tests -- --nocapture
```

## Good First Contributions

- Improve documentation wording.
- Add screenshots to the README.
- Add parser tests for sanitized session examples.
- Improve empty states.
- Improve keyboard navigation.
- Update model pricing snapshots.
- Add export columns requested by users.

## Maintainer Review

Maintainers should review for:

- Read-only safety.
- Correct token math.
- Parser compatibility with old and new sessions.
- Privacy-sensitive output.
- Tests for non-trivial logic.
- Clear user-facing wording.
