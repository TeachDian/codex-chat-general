# Token Ledger

Token Ledger is a local-first desktop app for tracking Codex token usage across sessions, projects, days, and models. It is built with Tauri, React, TypeScript, and Rust so it can run as a small native desktop app while keeping your usage data on your device.

The app is designed for people who want a clear breakdown of how much token volume their Codex work is using: input tokens, output tokens, cached input tokens, reasoning output tokens, session totals, daily totals, project totals, and model-level cost estimates.

Token Ledger is not affiliated with OpenAI. It reads local Codex session data from your machine and presents it in a dashboard.

## Why This Exists

Codex sessions can span many projects and models. The raw session data is useful, but it is not easy to scan by day, project, model, or session without a dedicated tool. Token Ledger turns those local records into a readable dashboard that helps you understand usage patterns, compare projects, and estimate cost impact.

## Project Pages

- [About Token Ledger](about.md)
- [Release and downloads](release.md)
- [Contributing guide](contributing.md)
- [Reporting problems and pull requests](docs/reporting-problems-and-pull-requests.md)
- [Security policy](security.md)

## Features

- Local desktop app built with Tauri, React, TypeScript, and Rust.
- Read-only Codex session scanning. The scanner reads source session files and stores its own local cache; it does not modify Codex sessions.
- Incremental imports. Previously scanned files are cached, and unchanged files are skipped on later refreshes.
- Offline history support. Sessions created while the app was closed are picked up on the next scan.
- Project breakdowns for every detected Codex workspace.
- Session picker for all sessions, one project, one model, or one selected session.
- Daily usage report with exact whole-token values.
- Model breakdown for GPT/Codex model usage when model data is present in the session file.
- Input, output, cached input, reasoning output, and total token counts.
- Estimated API and Codex credit costs from the app pricing snapshot.
- Tooltip charts for daily usage and model share.
- CSV export for filtered session data.
- Copyable usage summary.
- Settings/status panel with Codex home, local database path, parsed file count, unchanged file count, skipped file count, and last imported time.
- Flat vector-style app icon for taskbar, shortcut, installer, and repository assets.
- Root build folder with a ready-to-run Windows executable and installers.

## What Token Ledger Tracks

Token Ledger reads local Codex session records and extracts:

- Session id and title.
- Project path and project name.
- Model name when present.
- Session start and update timestamps.
- Input tokens.
- Cached input tokens.
- Output tokens.
- Reasoning output tokens.
- Total tokens.
- Per-event token updates inside a session.
- Source file path for traceability.

The app keeps the source files read-only. Its own local database is used for fast reloads and incremental refreshes.

## Privacy And Safety

Token Ledger is local-first:

- It does not require a cloud account.
- It does not send your session data to a server.
- It does not edit Codex session files.
- It keeps a local app database for cached imports.
- The source path for each session is shown so you can audit what was read.

The dashboard can still display sensitive project names or file paths from your local Codex sessions. Be careful when sharing screenshots or exports.

## Pricing Notes

Token Ledger includes a pricing snapshot for estimating model costs. Pricing changes over time, so treat cost output as an estimate unless you have verified the active rates for your account and model.

Token counts come from local Codex session records. Cost estimates are calculated from those counts and the app's pricing table.

## Download And Run

This repository currently includes Windows build artifacts in `token-ledger-build`.

For the public download page, see [Token Ledger 0.1.0 Release](release.md).

Useful files:

- `release-packages/token-ledger-0.1.0-windows-x64-portable.zip` - recommended portable download package.
- `token-ledger-build/token-ledger.exe` - portable app executable.
- `token-ledger-build/token-ledger-0.1.0-x64-setup.exe` - Windows setup installer.
- `token-ledger-build/token-ledger-0.1.0-x64.msi` - Windows MSI installer.
- `release-packages/token-ledger-0.1.0-windows-x64-checksums-sha256.txt` - SHA-256 checksum manifest.
- `open-token-ledger.cmd` - convenience launcher for the local build.
- `assets/token-ledger-flat-icon.svg` - editable vector app icon source.

On Windows, you can run:

```powershell
.\open-token-ledger.cmd
```

## Development

Prerequisites:

- Node.js.
- Rust.
- Tauri build prerequisites for your operating system.
- WebView2 Runtime on Windows.

Install dependencies:

```powershell
npm install
```

Run the web dev server:

```powershell
npm run dev
```

Run the Tauri app in development:

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

On this Windows setup, the GNU target was used for the native build:

```powershell
npm run tauri build -- --target x86_64-pc-windows-gnu
```

## Project Structure

- `src/` - React dashboard, charts, filters, tables, and usage model logic.
- `src-tauri/` - Tauri app shell and Rust session scanner.
- `assets/` - source app icon assets.
- `public/` - frontend public assets.
- `token-ledger-build/` - generated Windows executable and installers.
- `docs/` - community and contribution guides.
- `.github/` - GitHub issue and pull request templates.

## Community

Token Ledger is intended to be community driven. Useful contributions include:

- Parser improvements for new Codex session formats.
- Better model detection.
- Updated pricing snapshots.
- More export formats.
- Better reports and charts.
- Cross-platform packaging.
- Accessibility improvements.
- Documentation improvements.
- Bug reports with safe sample data.

Start with `contributing.md` and `docs/reporting-problems-and-pull-requests.md`.

## Search Keywords

Codex token tracker, ChatGPT token tracker, OpenAI token usage dashboard, AI token usage tracker, local token usage analytics, Codex usage monitor, GPT token counter, LLM token tracker, cached token tracker, prompt token dashboard, AI cost estimator, OpenAI cost tracker, Tauri token tracker, desktop token analytics, local-first AI usage dashboard, project token reports, session token reports, daily token reports, model token breakdown, Codex session analyzer.

## License

Token Ledger is released under the MIT License. You can use it, copy it, modify it, distribute it, use it commercially, sell services around it, or build paid products from it, as long as you keep the license notice. See `license.md`.
