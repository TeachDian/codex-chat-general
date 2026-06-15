# Local Verification

Token Ledger does not run GitHub Actions automatically on pushes or pull requests. The project is kept friendly to repositories that do not have Actions minutes available.

Contributors and maintainers should run checks locally before pushing or asking for review.

## Standard Checks

Run these for most changes:

```powershell
npm test
npm run build
```

## Rust Scanner Checks

Run this when the scanner, token parsing, session import, or Rust code changes:

```powershell
cargo test --manifest-path src-tauri\Cargo.toml --release usage::tests -- --nocapture
```

## Desktop Package Checks

Run this when packaging, icons, installer settings, Tauri config, or release artifacts change:

```powershell
npm run tauri build
```

On the current Windows release package, the GNU target was used:

```powershell
npm run tauri build -- --target x86_64-pc-windows-gnu
```

## Release Package Checklist

Before publishing a release package:

1. Run the standard checks.
2. Run Rust scanner checks if parser logic changed.
3. Build the desktop package.
4. Verify the portable zip, setup exe, MSI, and checksum manifest.
5. Update `release.md` with file sizes, checksums, install notes, and known notes.
6. Tag the release commit.

## Current Policy

- No automatic GitHub Actions checks.
- No automatic packaging jobs.
- Direct pushes are checked locally first.
- Pull requests should include the commands the contributor ran.
