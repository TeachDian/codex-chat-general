# Token Ledger

Token Ledger is a local-first desktop app for tracking Codex token usage across local sessions, projects, days, and models. It reads Codex session records from your device, keeps those source files read-only, and turns the usage data into a dashboard with exact whole-token counts and estimated costs.

It is built with Tauri, React, TypeScript, and Rust so the app can run as a small native desktop tool while keeping your Codex history on your machine.

Token Ledger is unofficial and is not affiliated with OpenAI. It is a community project for developers and teams who want clearer visibility into local Codex usage.

## Quick Links

- [About Token Ledger](about.md)
- [Release and downloads](release.md)
- [Contributing guide](contributing.md)
- [Reporting problems and pull requests](docs/reporting-problems-and-pull-requests.md)
- [GitHub Actions and packaging](docs/github-actions.md)
- [Security policy](security.md)
- [License](license.md)

## What This App Is About

Codex can create many local sessions across different projects and models. The raw records are useful, but they are not easy to read when you want to answer questions like:

- How many tokens did I use today?
- Which project used the most tokens this week?
- Which sessions were the largest?
- Which model generated the most usage?
- How many input, output, cached input, and reasoning output tokens were recorded?
- What is the estimated cost based on a pricing snapshot?

Token Ledger turns those local records into searchable, filterable reports. The goal is to make Codex usage easier to understand without uploading private session history to another service.

## Features

- Local desktop app powered by Tauri, React, TypeScript, and Rust.
- Read-only Codex session scanning. Source session files are never rewritten.
- Incremental imports. Previously scanned unchanged files are skipped for faster reloads.
- Offline history support. Sessions created while Token Ledger was closed are picked up on the next scan.
- Dashboard summaries for all usage, selected projects, selected sessions, selected models, and daily activity.
- Project, session, model, and day breakdowns.
- Exact whole-token totals for input, cached input, output, reasoning output, and combined tokens.
- Estimated API and Codex credit cost reporting from the app pricing snapshot.
- Session picker for all sessions, project-scoped sessions, and single-session review.
- Tooltip charts for daily usage and model share.
- CSV export for filtered session data.
- Copyable usage summary.
- Settings/status panel with Codex home, local database path, parsed file count, unchanged file count, skipped file count, and last imported time.
- Boot loading skeleton so the app does not look stuck while it scans and loads cached data.
- Simple black-and-white flat vector icon for the app, taskbar, shortcut, and installer.
- Windows portable package and installer artifacts.
- GitHub issue templates, pull request template, and CI workflow for community contributions.

## How It Works

Token Ledger has a simple local data flow:

```text
local codex session files -> read-only scanner -> token ledger app database -> dashboard reports
```

The scanner reads local Codex session records and extracts token-count events when they are present. Token Ledger stores its own import cache and usage database so future launches can load quickly and only update records that changed or were newly created.

The app tracks:

- Session id and title.
- Project path and project name.
- Model name when present in the session data.
- Session start and update timestamps.
- Input tokens.
- Cached input tokens.
- Output tokens.
- Reasoning output tokens.
- Total tokens.
- Per-event token updates inside a session.
- Source file path for traceability.

Token Ledger does not modify Codex session files. If a session format changes or a record cannot be parsed, the source file stays untouched and the app reports scanner status counts in Settings.

## Privacy And Safety

Token Ledger is local-first by design:

- No cloud account is required.
- No hosted service is required.
- Session data is not uploaded by the app.
- Codex session files are opened for reading, not editing.
- Imported data is stored in a local app database for speed.

The dashboard can still show sensitive local information such as project names, session titles, file paths, and prompt-derived titles. Review screenshots, logs, and exports before sharing them publicly.

## Pricing And Accuracy

Token counts are read from local Codex session records and are displayed as whole numbers. Token Ledger does not round token totals.

Cost values are estimates. They are calculated from the counts Token Ledger can read and the pricing snapshot bundled with the app. Model pricing can change over time and may differ by account, plan, product surface, or billing rules, so use the cost report as a planning estimate instead of an official bill.

## Download And Run

The current packaged build is `0.1.0` for Windows x64. See [release.md](release.md) for the download table, checksums, install notes, and known release notes.

Recommended download:

- [token-ledger-0.1.0-windows-x64-portable.zip](release-packages/token-ledger-0.1.0-windows-x64-portable.zip)

Other available Windows artifacts:

- [token-ledger.exe](token-ledger-build/token-ledger.exe)
- [token-ledger-0.1.0-x64-setup.exe](token-ledger-build/token-ledger-0.1.0-x64-setup.exe)
- [token-ledger-0.1.0-x64.msi](token-ledger-build/token-ledger-0.1.0-x64.msi)
- [sha-256 checksums](release-packages/token-ledger-0.1.0-windows-x64-checksums-sha256.txt)

For a local checkout on Windows, you can also run:

```powershell
.\open-token-ledger.cmd
```

Windows may show a SmartScreen warning because the app is not code-signed yet.

## Development Setup

Prerequisites:

- Node.js.
- Rust.
- Tauri build prerequisites for your operating system.
- Microsoft Edge WebView2 Runtime on Windows.

Install dependencies:

```powershell
npm install
```

Run the web app:

```powershell
npm run dev
```

Run the Tauri desktop app in development:

```powershell
npm run tauri dev
```

Run tests:

```powershell
npm test
```

Build the frontend:

```powershell
npm run build
```

Build the desktop app:

```powershell
npm run tauri build
```

On the current Windows package, the GNU target was used for the native build:

```powershell
npm run tauri build -- --target x86_64-pc-windows-gnu
```

## Project Structure

- `src/` - React dashboard, charts, filters, tables, and usage model logic.
- `src-tauri/` - Tauri app shell and Rust session scanner.
- `assets/` - editable icon and source app assets.
- `public/` - frontend public assets.
- `token-ledger-build/` - generated Windows executable and installer artifacts.
- `release-packages/` - portable package and checksum manifest.
- `docs/` - community, contribution, and GitHub Actions documentation.
- `.github/` - issue templates, pull request template, and CI workflow.

## Community And Contributions

Token Ledger is intended to be a community-driven tool. Contributions are welcome for bug fixes, parser coverage, pricing updates, new reports, documentation, packaging, accessibility, and performance.

Good first contributions:

- Improve README or release documentation.
- Add screenshots or short usage examples.
- Improve empty states and loading states.
- Add parser tests for sanitized session examples.
- Improve keyboard navigation and accessibility.
- Add Linux or macOS packaging notes.
- Update model pricing snapshots with clear source notes.

Before opening an issue or pull request:

1. Read [contributing.md](contributing.md).
2. Read [docs/reporting-problems-and-pull-requests.md](docs/reporting-problems-and-pull-requests.md).
3. Remove private prompts, secrets, customer data, proprietary code, and sensitive paths from screenshots or sample files.
4. Run the relevant checks for your change.

Recommended checks:

```powershell
npm test
npm run build
```

If you change the Rust scanner, also run:

```powershell
cargo test --manifest-path src-tauri\Cargo.toml --release usage::tests -- --nocapture
```

GitHub Actions runs the main checks on pushes and pull requests. See [docs/github-actions.md](docs/github-actions.md).

## Roadmap Ideas

Useful future work includes:

- Broader parser coverage for old and new Codex session formats.
- Better model normalization and pricing metadata.
- More chart types and report views.
- More export formats.
- Cross-platform release packages for macOS and Linux.
- Optional signed installers.
- More automated regression tests for scanner edge cases.
- Public sample fixtures with private data removed.

## Search Keywords

Codex token tracker, ChatGPT token tracker, OpenAI token usage dashboard, AI token usage tracker, local token usage analytics, Codex usage monitor, GPT token counter, LLM token tracker, cached token tracker, prompt token dashboard, AI cost estimator, OpenAI cost tracker, Tauri token tracker, desktop token analytics, local-first AI usage dashboard, project token reports, session token reports, daily token reports, model token breakdown, Codex session analyzer.

Package keywords are also defined in [package.json](package.json) for npm and repository search metadata.

## License

Token Ledger is released under the MIT License. You can use it, copy it, modify it, distribute it, use it commercially, sell services around it, or build paid products from it, as long as the license notice is kept. See [license.md](license.md).
