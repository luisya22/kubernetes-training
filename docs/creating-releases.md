# Creating GitHub Releases

This guide explains how to create downloadable releases for the Kubernetes Training Application.

## Quick Start

### Option 1: Using the Release Script (Recommended)

```bash
# Create a new release (e.g., version 1.0.0)
./scripts/create-release.sh 1.0.0
```

This script will:
1. Update `package.json` with the new version
2. Commit the version bump
3. Create a git tag (e.g., `v1.0.0`)
4. Push everything to GitHub
5. Trigger the automated build and release process

### Option 2: Manual Process

```bash
# 1. Update version in package.json
npm version 1.0.0 --no-git-tag-version

# 2. Commit the version bump
git add package.json package-lock.json
git commit -m "chore: bump version to 1.0.0"

# 3. Create a tag
git tag v1.0.0

# 4. Push to GitHub
git push origin main
git push origin v1.0.0
```

## What Happens Next?

Once you push a tag starting with `v`, GitHub Actions automatically:

1. **Runs Tests** - Ensures code quality
2. **Builds for All Platforms**:
   - Windows (x64)
   - macOS (Intel x64 + Apple Silicon arm64)
   - Linux (x64 AppImage + deb)
3. **Creates Release** - Publishes installers to GitHub Releases

## Monitoring the Build

1. Go to your repository on GitHub
2. Click the **"Actions"** tab
3. You'll see the "Build and Package" workflow running
4. Wait for all jobs to complete (usually 10-20 minutes)

## Accessing Your Release

Once the workflow completes:

1. Go to your repository on GitHub
2. Click **"Releases"** in the right sidebar
3. Your new release will be published with all installers attached

**Release URL format:**
```
https://github.com/YOUR-USERNAME/YOUR-REPO-NAME/releases
```

## Download Links

Users can download installers directly:

### Windows
- `Kubernetes-Training-Setup-1.0.0.exe` (NSIS installer)
- Double-click to install

### macOS
- `Kubernetes-Training-1.0.0-x64.dmg` (Intel Macs)
- `Kubernetes-Training-1.0.0-arm64.dmg` (Apple Silicon)
- Open DMG and drag to Applications folder

### Linux
- `Kubernetes-Training-1.0.0-x64.AppImage` (Universal, no installation needed)
- `Kubernetes-Training-1.0.0-x64.deb` (Debian/Ubuntu)

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes

Examples:
```bash
./scripts/create-release.sh 1.0.0    # First stable release
./scripts/create-release.sh 1.0.1    # Bug fix
./scripts/create-release.sh 1.1.0    # New features
./scripts/create-release.sh 2.0.0    # Breaking changes
```

## Pre-releases

For beta or release candidate versions:

```bash
# Create a pre-release tag
git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1
```

Then manually mark it as "pre-release" in the GitHub UI.

## Troubleshooting

### Build Fails

1. Check the Actions tab for error logs
2. Common issues:
   - Tests failing → Fix tests and push again
   - Missing dependencies → Update `package.json`
   - Build errors → Test locally with `npm run package`

### Release Not Created

- Ensure tag starts with `v` (e.g., `v1.0.0`, not `1.0.0`)
- Check that GitHub Actions has write permissions
- Verify `GITHUB_TOKEN` is available (it's automatic)

### Missing Installers

- Check that all three OS builds completed successfully
- Look for artifact upload errors in the workflow logs
- Verify file paths in `.github/workflows/build.yml`

## Customizing Release Notes

Edit `.github/workflows/build.yml` to customize the release description:

```yaml
body: |
  ## Your custom release notes here
  
  ### What's New
  - Feature 1
  - Feature 2
  
  ### Bug Fixes
  - Fix 1
  - Fix 2
```

## Deleting a Release

If you need to delete a release:

```bash
# Delete the tag locally
git tag -d v1.0.0

# Delete the tag on GitHub
git push origin :refs/tags/v1.0.0

# Then delete the release from GitHub UI
```

## Best Practices

1. **Test Before Release**: Always run `npm test` and `npm run package` locally first
2. **Update Changelog**: Keep a CHANGELOG.md file updated
3. **Write Release Notes**: Explain what's new and what changed
4. **Version Bump**: Use the release script to avoid mistakes
5. **Tag Format**: Always use `v` prefix (v1.0.0, not 1.0.0)

## Example Workflow

```bash
# 1. Finish your features
git add .
git commit -m "feat: add new exercise validation"

# 2. Run tests locally
npm test

# 3. Test packaging locally
npm run package

# 4. Create release
./scripts/create-release.sh 1.1.0

# 5. Wait for GitHub Actions to complete

# 6. Share the release link with users
```

## Sharing Your Release

Once published, share the release page:

```
🎉 Kubernetes Training v1.0.0 is now available!

Download: https://github.com/YOUR-USERNAME/YOUR-REPO-NAME/releases/latest

Available for Windows, macOS, and Linux.
```

## Automatic Updates (Future Enhancement)

To add automatic update checking, consider:
- [electron-updater](https://www.electron.build/auto-update)
- Requires code signing certificates
- Users get notified of new versions automatically
