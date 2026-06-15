# GitHub Actions

Token Ledger uses GitHub Actions to check contributions and produce Windows package artifacts.

## CI Workflow

Workflow: `.github/workflows/ci.yml`

Triggers:

- Every push.
- Every pull request.

Jobs:

- `verify` runs frontend tests, TypeScript/Vite build, and Rust scanner tests.
- `package-windows` builds the Tauri Windows app after `verify` passes.

## Checks Run

The verification job runs:

```powershell
npm ci
npm test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml --release usage::tests -- --nocapture
```

## Package Artifacts

Every successful workflow run uploads one artifact named `token-ledger-windows-x64-package`.

The artifact contains:

- Portable zip package.
- Windows setup installer.
- Windows MSI installer.
- SHA-256 checksum manifest.

These artifacts are useful for testing PR builds before publishing a formal GitHub Release.

## Release Flow

For public releases:

1. Merge the tested branch.
2. Run or review the latest successful GitHub Actions package artifact.
3. Create a GitHub Release.
4. Attach the portable zip, setup exe, MSI, and checksum manifest.
5. Copy the release notes from `release.md`.

## Failure Notes

If CI fails:

- Frontend test failures usually point to `src/usage-model.test.ts`.
- TypeScript or Vite failures usually point to dashboard imports, component props, or package metadata.
- Rust scanner failures usually point to `src-tauri/src/usage.rs`.
- Package failures usually point to Tauri bundling, Windows installer generation, or missing expected output files.
