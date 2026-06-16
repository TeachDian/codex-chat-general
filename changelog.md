# Changelog

All notable changes to Token Ledger are tracked here.

## Unreleased

### Added

- 1D report range for short-window usage review.
- Report breakdown panel for cache rate, output share, reasoning share, average tokens per session, peak day, top model, top project, and latest session.
- Sortable, filterable, paginated, scroll-safe tables for sessions, projects, model costs, and daily costs.

## 0.1.0 - 2026-06-15

First public Windows x64 release.

### Added

- Local-first Tauri desktop app for Codex token usage tracking.
- Read-only scanner for local Codex session records.
- Incremental import cache for faster reloads and offline session pickup.
- Dashboard filters for projects, sessions, models, and date ranges.
- Daily, project, session, and model usage breakdowns.
- Whole-number token totals for input, cached input, output, reasoning output, and combined usage.
- Estimated API and Codex credit cost summaries from the bundled pricing snapshot.
- Tooltip charts, model share reporting, daily cost table, and model cost table.
- CSV export and copyable usage summary.
- Settings/status panel with Codex home, local database path, scanned file counts, skipped file counts, and last import time.
- Boot loading skeleton for a clearer startup state.
- Flat black-and-white app icon for app, taskbar, shortcut, and installer use.
- Windows x64 portable package, setup installer, MSI installer, and checksum manifest.
- README, release page, contribution guide, issue templates, pull request template, local verification docs, security policy, and MIT license.

### Notes

- This release is Windows x64 only.
- The app is not code-signed yet, so Windows SmartScreen may show a warning.
- Cost values are estimates from the bundled pricing snapshot and may differ from actual billing.
- Token Ledger is unofficial and is not affiliated with OpenAI.
