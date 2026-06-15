# Token Ledger 0.1.0 Release Page

This is the repository release page for Token Ledger `0.1.0`. It lists the current downloadable Windows build, checksums, install notes, and source links.

GitHub Releases are not currently published from automation. The release assets are committed in this repository so users can download them directly without depending on GitHub Actions artifacts.

## Download For Windows

Choose one option:

| File | Best For | Size |
| --- | --- | ---: |
| [token-ledger-0.1.0-windows-x64-portable.zip](release-packages/token-ledger-0.1.0-windows-x64-portable.zip) | Best portable download, no installer | 7,332,550 bytes |
| [token-ledger-0.1.0-x64-setup.exe](token-ledger-build/token-ledger-0.1.0-x64-setup.exe) | Most Windows users | 5,209,615 bytes |
| [token-ledger-0.1.0-x64.msi](token-ledger-build/token-ledger-0.1.0-x64.msi) | Windows installer deployment | 7,602,176 bytes |
| [token-ledger.exe](token-ledger-build/token-ledger.exe) | Portable/manual run | 22,333,056 bytes |

For most portable users, download the zip package instead of downloading the exe and DLL separately.

All checksums are also available in [token-ledger-0.1.0-windows-x64-checksums-sha256.txt](release-packages/token-ledger-0.1.0-windows-x64-checksums-sha256.txt).

## Release Tag

Release tag: `v0.1.0`

Source branch: `main`

## Recommended Install

For most users:

1. Download `token-ledger-0.1.0-x64-setup.exe`.
2. Run the installer.
3. Open Token Ledger from the Start menu or desktop shortcut.
4. Let the app scan local Codex session data.

For managed Windows environments, use the MSI package.

## Portable Run

If you do not want to install:

1. Download `token-ledger-0.1.0-windows-x64-portable.zip`.
2. Extract the zip.
3. Open the extracted folder.
4. Run `token-ledger.exe`.

The app requires Microsoft Edge WebView2 Runtime, which is already installed on most modern Windows machines.

## What Is Included

This release includes:

- Local read-only Codex session scanning.
- Incremental source-file cache.
- Daily, project, model, and session token reports.
- Input, output, cached input, reasoning output, and total token counts.
- Estimated API and Codex credit costs.
- Tooltip charts.
- CSV export.
- Simple black-and-white flat app icon.
- Windows installer and portable executable.

## Checksums

Use SHA-256 to verify downloaded files:

| File | SHA-256 |
| --- | --- |
| `token-ledger-0.1.0-windows-x64-portable.zip` | `478E393F84C7B87677A15C07203D8B1A609FB14F1539487D4444FF4E11CE8661` |
| `token-ledger.exe` | `914F461EA8B79DE38FC695FAD5B3EB4F4361292FE8043EC4C06AF5D813864931` |
| `token-ledger-0.1.0-x64-setup.exe` | `F3F1C962D07E2A85B99D9B99A9AE198DDA10FD2E35F2FA3524F510BA1DE5582F` |
| `token-ledger-0.1.0-x64.msi` | `BB77085537E1CC76FC567D5154F3F8D2FD4C1E9E1212614CCF2C6A387FB58FFF` |
| `WebView2Loader.dll` | `8427B1FC58EC707813E5C0A51EB5D69397BB333250A7B891BE4D3B123F1E0F1C` |

On Windows, verify a file with:

```powershell
Get-FileHash -Algorithm SHA256 .\token-ledger-0.1.0-x64-setup.exe
```

## Known Notes

- This release is Windows x64 only.
- The app is not code-signed yet, so Windows SmartScreen may show a warning.
- Pricing is an estimate from the app's pricing snapshot and may differ from current account billing.
- Token Ledger is not affiliated with OpenAI.

## Source

The source code, license, and contribution docs are in this repository. Token Ledger is released under the MIT License.

## Publishing Notes

This repository does not run automatic GitHub Actions packaging. Maintainers should build and verify release artifacts locally, update this page, then tag the release commit.
