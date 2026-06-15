# Token Ledger 0.1.0 Release

This page lists the current downloadable Windows build for Token Ledger.

## Download For Windows

Choose one option:

| File | Best For | Size |
| --- | --- | ---: |
| [token-ledger-0.1.0-windows-x64-portable.zip](release-packages/token-ledger-0.1.0-windows-x64-portable.zip) | Best portable download, no installer | 7,914,912 bytes |
| [token-ledger-0.1.0-x64-setup.exe](token-ledger-build/token-ledger-0.1.0-x64-setup.exe) | Most Windows users | 5,502,958 bytes |
| [token-ledger-0.1.0-x64.msi](token-ledger-build/token-ledger-0.1.0-x64.msi) | Windows installer deployment | 7,917,568 bytes |
| [token-ledger.exe](token-ledger-build/token-ledger.exe) | Portable/manual run | 22,621,546 bytes |

For most portable users, download the zip package instead of downloading the exe and DLL separately.

All checksums are also available in [token-ledger-0.1.0-windows-x64-checksums-sha256.txt](release-packages/token-ledger-0.1.0-windows-x64-checksums-sha256.txt).

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
- Flat vector app icon.
- Windows installer and portable executable.

## Checksums

Use SHA-256 to verify downloaded files:

| File | SHA-256 |
| --- | --- |
| `token-ledger-0.1.0-windows-x64-portable.zip` | `976DA7307BB3EF788D44076C8F3189510CA574D7105D5C189249B517CFBDBB50` |
| `token-ledger.exe` | `0EC67E680BF61D2178832F37A12BC029EEE3F287B8ABB6B03B9147952B9B77F8` |
| `token-ledger-0.1.0-x64-setup.exe` | `A25DB9F0FDBC69094FC2AC1DE4F853C572376D466C1BCE6E3E430F2D484A1C75` |
| `token-ledger-0.1.0-x64.msi` | `B0BB79BF65A8D8AAF73FB5B25EFBBCDFB1C2A662E75FFEA73CE017DEC30F8F70` |
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
