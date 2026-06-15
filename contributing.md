# Contributing To Token Ledger

Thanks for helping make Token Ledger better. This project is intended to be community driven, practical, and friendly to small focused contributions.

## Ways To Contribute

- Report bugs or broken parsing behavior.
- Request new dashboard or report features.
- Improve model and pricing detection.
- Add tests for session parsing and usage calculations.
- Improve accessibility, performance, or packaging.
- Update documentation.
- Share safe sample session data with private details removed.

## Before Opening An Issue

1. Search existing issues first.
2. Check the latest branch or release if possible.
3. Remove secrets, private prompts, customer names, tokens, and sensitive paths from any logs or screenshots.
4. Include enough detail for someone else to reproduce the problem.

Use the issue templates when possible:

- Bug report for broken behavior.
- Feature request for new ideas.
- Session parser report when a Codex session file is not imported correctly.

## Local Setup

```powershell
npm install
npm test
npm run build
```

For Tauri development:

```powershell
npm run tauri dev
```

For a production desktop build:

```powershell
npm run tauri build
```

## Pull Request Workflow

1. Create a branch from the current default branch.
2. Keep the change focused.
3. Use kebab-case for new folders and filenames unless a platform requires a specific name.
4. Add or update tests when parser, pricing, filtering, aggregation, or export logic changes.
5. Update documentation when behavior changes.
6. Run the relevant checks before opening a PR.
7. Fill out the pull request template.
8. Include the checks you ran in the PR description.

## Recommended Checks

Run these before submitting a PR:

```powershell
npm test
npm run build
```

If you changed Rust scanner logic:

```powershell
cargo test --manifest-path src-tauri\Cargo.toml --release usage::tests -- --nocapture
```

If you changed packaging or icons, also run a Tauri build for your platform.

This repository does not run automatic GitHub Actions checks. See `docs/local-verification.md` for the local verification policy.

## Coding Guidelines

- Keep scanner reads read-only. Do not write back to Codex session files.
- Prefer exact whole-token values. Do not round token counts.
- Keep UI labels short and useful.
- Keep cost values clearly marked as estimates.
- Keep new source files in kebab-case.
- Avoid committing private session data.
- Avoid broad refactors unless they directly support the change.

## Commit And PR Style

Use short, direct commit messages:

```text
fix session parser timestamp handling
add csv export for model usage
update pricing snapshot
```

PRs should explain:

- What changed.
- Why it changed.
- How it was tested.
- Any privacy, parsing, or compatibility risks.

## Community Standards

Be direct, respectful, and useful. Assume people are contributing in good faith. Keep comments focused on the issue, the code, and the user impact.
