# Release Process

This document describes how to cut a release for Maphop. Follow every step in order.

---

## 1. Pre-release checks

- All intended changes are committed on `main`.
- `CHANGELOG.md` `[Unreleased]` section contains all changes for this release.
- `doc/spec/product-spec.md` is up-to-date with any shipped behavior or architecture changes.
- The app builds cleanly: `npm run build`

---

## 2. Decide the version number

Maphop uses [Semantic Versioning](https://semver.org/) with a `MAJOR.MINOR.PATCH` scheme:

| Change type | Version segment |
|-------------|----------------|
| Breaking change or major UX overhaul | MAJOR |
| New feature, new page, new capability | MINOR |
| Bug fix, security patch, dependency update | PATCH |

---

## 3. Update files

### 3a. CHANGELOG.md

Move the `[Unreleased]` section to a new dated release heading and leave `[Unreleased]` empty for future work:

```markdown
## [Unreleased]

## [X.Y.Z] - YYYY-MM-DD

### Added
...

### Changed
...

### Fixed
...
```

### 3b. package.json

Update the `"version"` field:

```bash
# Example: bump patch
npm version patch --no-git-tag-version

# Or edit manually
```

### 3c. product-spec.md

Update the `**Version:**` and `**Last Updated:**` fields at the top of `doc/spec/product-spec.md` if there are spec changes in this release.

---

## 4. Commit the release

Stage only the release bookkeeping files (never stage `.env`, `dist/`, or secrets):

```bash
git add CHANGELOG.md package.json doc/spec/product-spec.md
git commit -m "chore: release v1.0.2"
```

---

## 5. Tag the release

```bash
git tag -a v1.0.2 -m "Release v1.0.2"
```

---

## 6. Push branch and tag

```bash
git push origin main
git push origin v1.0.2
```

---

## 7. Create the GitHub release

Use the `gh` CLI. The `--latest` flag marks this as the latest release.

```bash
gh release create v1.0.2 \
  --title "v1.0.2" \
  --notes "$(sed -n '/^## \[1\.0\.2\]/,/^## \[/{ /^## \[1\.0\.2\]/d; /^## \[/d; p }' CHANGELOG.md)" \
  --latest
```

> **Tip:** The `sed` command extracts only the body of the matching changelog section to use as release notes. Adjust the version pattern for each release.

Or provide notes manually:

```bash
gh release create v1.0.2 \
  --title "v1.0.2 — Security hardening, PWA install, follow mode" \
  --notes-file /dev/stdin \
  --latest <<'EOF'
See CHANGELOG.md for the full list of changes.
EOF
```

---

## 8. Verify

```bash
gh release view v1.0.2
```

Confirm:
- Tag matches the version in `package.json`
- Release is marked **Latest**
- Release notes are correct

---

## Quick reference (copy-paste for next release)

```bash
VERSION=1.0.3        # <- set this

# 1. Edit CHANGELOG.md, package.json, product-spec.md
# 2. Commit
git add CHANGELOG.md package.json doc/spec/product-spec.md
git commit -m "chore: release v${VERSION}"

# 3. Tag and push
git tag -a "v${VERSION}" -m "Release v${VERSION}"
git push origin main
git push origin "v${VERSION}"

# 4. GitHub release
gh release create "v${VERSION}" \
  --title "v${VERSION}" \
  --generate-notes \
  --latest
```

`--generate-notes` uses GitHub's auto-generated notes from PR/commit history as a fallback if you prefer that over pasting the changelog.
