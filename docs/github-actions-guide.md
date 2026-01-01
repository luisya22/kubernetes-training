# GitHub Actions Build Guide

Complete guide to the automated multi-platform build system using GitHub Actions.

## 🎯 Overview

The GitHub Actions workflow automatically builds your Kubernetes Training App for Windows, macOS, and Linux whenever you push code or create a release.

## 🔄 Workflow Triggers

The workflow runs on three different events:

### 1. Pull Requests
```yaml
on:
  pull_request:
    branches:
      - main
```
**What happens:**
- ✅ Runs tests only
- ❌ No builds created
- ❌ No artifacts uploaded

**Purpose:** Validate code changes before merging

### 2. Push to Main Branch
```yaml
on:
  push:
    branches:
      - main
```
**What happens:**
- ✅ Builds for all platforms
- ✅ Uploads nightly artifacts (30 days retention)
- ❌ No release created

**Purpose:** Keep nightly builds available for testing

### 3. Tag Push (Release)
```yaml
on:
  push:
    tags:
      - 'v*'
```
**What happens:**
- ✅ Builds for all platforms
- ✅ Creates GitHub release
- ✅ Attaches installers to release
- ✅ Generates release notes

**Purpose:** Create official releases

### 4. Manual Release
```yaml
on:
  release:
    types:
      - published
      - created
```
**What happens:**
- ✅ Builds for all platforms
- ✅ Attaches installers to existing release

**Purpose:** Support manual release creation via GitHub UI

## 🏗️ Build Matrix

The workflow builds on three operating systems in parallel:

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
```

| OS | Builds | Time | Artifacts |
|----|--------|------|-----------|
| **ubuntu-latest** | Linux AppImage, .deb | ~5-7 min | 2 files |
| **macos-latest** | macOS DMG (Intel + ARM) | ~5-7 min | 2 files |
| **windows-latest** | Windows NSIS installer | ~5-7 min | 1 file |

**Total time:** ~7-10 minutes (parallel execution)

## 📋 Jobs Breakdown

### Job 1: Test
```yaml
test:
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
```

**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (`npm ci`)
4. Run tests (`npm test`)

**When:** Only on pull requests

### Job 2: Build
```yaml
build:
  runs-on: ${{ matrix.os }}
  strategy:
    matrix:
      os: [ubuntu-latest, macos-latest, windows-latest]
```

**Steps:**
1. Checkout code
2. Setup Node.js 18 with npm cache
3. Install dependencies (`npm ci`)
4. Build application (`npm run build`)
5. Package application (`npm run package`)
6. List generated files
7. Upload platform-specific artifacts

**When:** On all events (push, PR, tag, release)

**Artifacts uploaded:**
- Linux: `*.AppImage`, `*.deb` (90 days)
- macOS: `*.dmg` (90 days)
- Windows: `*.exe` (90 days)

### Job 3: Release
```yaml
release:
  needs: build
  runs-on: ubuntu-latest
  if: startsWith(github.ref, 'refs/tags/v') || github.event_name == 'release'
```

**Steps:**
1. Checkout code
2. Download all artifacts from build job
3. Display artifact structure
4. Prepare release files
5. Create GitHub release with installers

**When:** Only on tag push or release event

**Permissions:** Requires `contents: write`

### Job 4: Nightly
```yaml
nightly:
  needs: build
  runs-on: ubuntu-latest
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

**Steps:**
1. Download all artifacts
2. Upload as nightly build (30 days retention)
3. Comment on commit with artifact link

**When:** Only on push to main branch

## 🚀 Usage Examples

### Create a Release

**Method 1: Using Git Tags**
```bash
# Create and push a tag
git tag v0.2.0
git push origin v0.2.0

# GitHub Actions will:
# 1. Build for all platforms
# 2. Create a release
# 3. Attach installers
```

**Method 2: Using npm version**
```bash
# Bump version and create tag
npm version patch  # 0.1.0 → 0.1.1
npm version minor  # 0.1.0 → 0.2.0
npm version major  # 0.1.0 → 1.0.0

# Push changes and tag
git push origin main --tags
```

**Method 3: GitHub UI**
```
1. Go to: https://github.com/YOUR_USERNAME/kubernetes-training/releases
2. Click "Draft a new release"
3. Create a new tag (e.g., v0.2.0)
4. Click "Publish release"
5. GitHub Actions will build and attach installers
```

### Get Nightly Builds

```bash
# Push to main
git push origin main

# Artifacts available at:
# https://github.com/YOUR_USERNAME/kubernetes-training/actions
```

**Access nightly builds:**
1. Go to Actions tab
2. Click on the latest workflow run
3. Scroll to "Artifacts" section
4. Download `kubernetes-training-nightly-{sha}`

### Test Pull Requests

```bash
# Create a PR
git checkout -b feature-branch
git push origin feature-branch

# Create PR on GitHub
# Tests will run automatically
```

## 🔧 Configuration

### Secrets Required

The workflow uses `GITHUB_TOKEN` which is automatically provided by GitHub Actions. No additional secrets needed!

**Optional:** For private repositories or advanced features, you can add:
- `GH_TOKEN`: Personal access token for electron-builder

### Customizing the Workflow

**Change Node.js version:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change to 20
```

**Add more platforms:**
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest, macos-13]  # Add older macOS
```

**Change artifact retention:**
```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    retention-days: 60  # Change from 90 to 60
```

**Make release a draft:**
```yaml
- name: Create Release
  uses: softprops/action-gh-release@v1
  with:
    draft: true  # Change from false to true
```

## 📊 Monitoring

### Check Build Status

**Via GitHub UI:**
1. Go to: `https://github.com/YOUR_USERNAME/kubernetes-training/actions`
2. Click on a workflow run
3. View logs for each job

**Via Badge:**
Add to README.md:
```markdown
![Build Status](https://github.com/YOUR_USERNAME/kubernetes-training/workflows/Build%20Kubernetes%20Training%20App/badge.svg)
```

### View Artifacts

**From Actions tab:**
1. Go to Actions
2. Click on a workflow run
3. Scroll to "Artifacts" section
4. Download artifacts

**From Release:**
1. Go to Releases
2. Click on a release
3. Download installers from "Assets" section

## 🐛 Troubleshooting

### Build Fails on Specific Platform

**Check logs:**
```
1. Go to Actions tab
2. Click on failed workflow
3. Click on failed job (e.g., "Build on windows-latest")
4. Expand failed step
5. Read error message
```

**Common issues:**

**Linux build fails:**
- Missing author email in package.json ✅ Fixed
- Missing dependencies in package.json

**macOS build fails:**
- Code signing issues (optional for open source)
- Missing icon files (optional)

**Windows build fails:**
- Icon format issues (optional)
- Path length issues (use shorter paths)

### Release Not Created

**Check:**
- Tag must start with `v` (e.g., `v0.1.0`)
- Workflow must have `contents: write` permission ✅ Configured
- Build job must succeed first

**Fix:**
```bash
# Delete and recreate tag
git tag -d v0.1.0
git push origin :refs/tags/v0.1.0
git tag v0.1.0
git push origin v0.1.0
```

### Artifacts Not Uploaded

**Check:**
- Build must succeed
- Files must exist in `release/` directory
- File patterns must match (*.exe, *.dmg, etc.)

**Debug:**
Add this step to workflow:
```yaml
- name: Debug files
  run: |
    ls -R release/
    find release/ -type f
```

### Nightly Build Not Created

**Check:**
- Must push to `main` branch (not a tag)
- Build job must succeed
- Artifacts must be uploaded

## 📈 Performance Optimization

### Cache Dependencies

Already configured:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    cache: 'npm'  # Caches node_modules
```

### Parallel Builds

Already configured via matrix strategy - all platforms build simultaneously.

### Skip Unnecessary Builds

**Skip CI for docs:**
```bash
git commit -m "Update README [skip ci]"
```

**Skip specific jobs:**
```yaml
if: "!contains(github.event.head_commit.message, '[skip build]')"
```

## 🔐 Security

### Permissions

Minimal permissions configured:
```yaml
permissions:
  contents: write  # Only for release job
```

### Secrets

- `GITHUB_TOKEN`: Auto-provided, scoped to repository
- No custom secrets required
- No credentials stored

### Dependencies

- Uses official GitHub Actions
- Dependencies installed via `npm ci` (uses package-lock.json)
- No third-party scripts executed

## 📚 Resources

- **Workflow file:** `.github/workflows/build.yml`
- **GitHub Actions docs:** https://docs.github.com/en/actions
- **electron-builder docs:** https://www.electron.build/
- **softprops/action-gh-release:** https://github.com/softprops/action-gh-release

## 💡 Tips

1. **Test locally first:** Always run `npm run dist` before pushing tags
2. **Use semantic versioning:** v0.1.0, v0.2.0, v1.0.0
3. **Check Actions tab:** Monitor builds in real-time
4. **Download artifacts:** Test installers before publishing release
5. **Edit releases:** Releases can be edited after creation
6. **Use draft releases:** Set `draft: true` for manual review
7. **Nightly builds:** Use for testing latest changes
8. **Artifact retention:** 90 days for releases, 30 days for nightly

## 🎯 Next Steps

1. **Test the workflow:**
   ```bash
   git commit -m "Test workflow" --allow-empty
   git push
   ```

2. **Create your first release:**
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

3. **Monitor the build:**
   - Go to Actions tab
   - Watch the workflow run
   - Download artifacts when complete

4. **Publish the release:**
   - Go to Releases tab
   - Edit the release if needed
   - Publish to make it public

---

**Your GitHub Actions workflow is ready!** Just push a tag to create a multi-platform release. 🚀
