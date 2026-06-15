# Token Ledger 0.1.0 Portable Package

This folder contains the portable Windows x64 build of Token Ledger.

## Run

Double-click `token-ledger.exe`.

Keep `token-ledger.exe` and `WebView2Loader.dll` in the same folder. The DLL name is required by WebView2 and should not be renamed.

## What It Does

Token Ledger scans local Codex session records and shows token usage by day, project, model, and session. It tracks input tokens, cached input tokens, output tokens, reasoning output tokens, and estimated costs.

## Privacy

Token Ledger is local-first. It reads Codex session files from your machine and stores its own local cache. It does not edit Codex session files and does not upload session data to a server.

## Requirements

- Windows x64.
- Microsoft Edge WebView2 Runtime.
- Local Codex session records on the machine.

## Included Documents

- `readme.md` - project overview.
- `license.md` - MIT License.
- `about.md` - app background and goals.
