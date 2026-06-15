# About Token Ledger

Token Ledger is a local-first desktop app for understanding Codex token usage across sessions, projects, days, and models.

It is built for developers, AI-heavy teams, and power users who want a clearer view of where their token volume goes without uploading their local session history to another service.

## What It Does

Token Ledger scans local Codex session records and turns token-count events into a dashboard:

- Daily token usage.
- Per-project usage.
- Per-session usage.
- Per-model usage.
- Input token counts.
- Cached input token counts.
- Output token counts.
- Reasoning output token counts.
- Estimated API and Codex credit cost.
- CSV exports for filtered session data.

The app is meant to help answer practical questions:

- Which project used the most tokens this week?
- Which sessions were the largest?
- Which models are being used?
- How much cached input is being reused?
- What is the estimated cost impact?

## Local-First Design

Token Ledger is designed around local ownership of usage data:

- It reads Codex session files from your machine.
- It stores its own local cache for faster reloads.
- It does not edit Codex session files.
- It does not upload session data to a hosted service.
- It does not require an account.

The app may display sensitive project names, file paths, or session titles from your own machine. Review screenshots and exports before sharing them.

## Why It Is Read-Only

Codex session files are the source of truth. Token Ledger should never corrupt or rewrite them. The scanner treats source files as read-only and keeps import state in a separate app database.

This keeps the app useful for reporting while reducing the risk of damaging existing Codex history.

## Current Release

The current packaged release is `0.1.0` for Windows x64. See `release.md` for downloads, checksums, and install options.

## Status

Token Ledger is early community software. The core scanner, dashboard, reports, and Windows package are working, but model naming, pricing snapshots, cross-platform packaging, and session format coverage will improve over time.

## Community Goals

The project is open for community contributions:

- Better parser coverage for old and new Codex session formats.
- More accurate model mapping.
- Updated pricing snapshots.
- Additional reports and export formats.
- Linux and macOS release builds.
- Better accessibility and keyboard workflows.
- Documentation, screenshots, and onboarding improvements.

See `contributing.md` for contribution guidance.
