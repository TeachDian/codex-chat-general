# Token Ledger 0.1.0 Release

This page lists the current downloadable Windows build for Token Ledger.

## Download For Windows

Choose one option:

| File | Best For | Size |
| --- | --- | ---: |
| [token-ledger-0.1.0-windows-x64-portable.zip](release-packages/token-ledger-0.1.0-windows-x64-portable.zip) | Best portable download, no installer | 7,915,240 bytes |
| [token-ledger-0.1.0-x64-setup.exe](token-ledger-build/token-ledger-0.1.0-x64-setup.exe) | Most Windows users | 5,499,904 bytes |
| [token-ledger-0.1.0-x64.msi](token-ledger-build/token-ledger-0.1.0-x64.msi) | Windows installer deployment | 7,913,472 bytes |
| [token-ledger.exe](token-ledger-build/token-ledger.exe) | Portable/manual run | 22,620,830 bytes |

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
| `token-ledger-0.1.0-windows-x64-portable.zip` | `482ECDDFEB652C423311B04DC8BCDAA272F8A8AE0398F5431485552FF9559971` |
| `token-ledger.exe` | `7026C128DFB3213D0685CAEFA1EE4774B0B59B0297B1DABF9ED733B42EDBF364` |
| `token-ledger-0.1.0-x64-setup.exe` | `ADC197EBB2A2307B166CB760A302247050EBF9DBBF5AA5847CE9B74A945923B5` |
| `token-ledger-0.1.0-x64.msi` | `3F4E9A370C62F2B4DE5DD199C911108A54C78DD685649DFC60AB423AC9B26D7E` |
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
