# 🚀 Building for All Platforms - Quick Guide

## ✅ Status: Ready for Multi-Platform Builds

Your app is configured to build for:
- ✅ **Linux** (AppImage + Debian) - Already built locally
- ✅ **macOS** (DMG for Intel + Apple Silicon) - Ready via GitHub Actions
- ✅ **Windows** (NSIS installer) - Ready via GitHub Actions

## 🎯 Quick Start

### Verify Configuration
```bash
npm run verify
```

### Build Locally (Current Platform)
```bash
# Linux
npm run package:linux

# macOS (on Mac only)
npm run package:mac

# Windows (on Windows only)
npm run package:win
```

### Build All Platforms (GitHub Actions)
```bash
# Create and push a tag
git tag v0.1.1
git push origin v0.1.1

# Monitor at: https://github.com/YOUR_USERNAME/kubernetes-training/actions
```

## 📦 Expected Output

### Linux (Built Locally ✅)
- `Kubernetes Training-0.1.0-x86_64.AppImage` (109 MB)
- `Kubernetes Training-0.1.0-amd64.deb` (75 MB)

### macOS (GitHub Actions)
- `Kubernetes Training-0.1.1-x64.dmg` (~150 MB) - Intel
- `Kubernetes Training-0.1.1-arm64.dmg` (~150 MB) - Apple Silicon

### Windows (GitHub Actions)
- `Kubernetes Training-Setup-0.1.1.exe` (~150 MB)

## 🔍 How It Works

### Linux Build (Local)
1. ✅ Icons: `build/icons/256x256.png`
2. ✅ Config: `package.json` → `build.linux`
3. ✅ Command: `npm run package:linux`
4. ✅ Output: AppImage + deb in `release/`

### macOS Build (GitHub Actions)
1. ✅ Icons: `build/icon.icns`
2. ✅ Config: `package.json` → `build.mac`
3. ✅ Runner: `macos-latest`
4. ✅ Output: DMG for both architectures

### Windows Build (GitHub Actions)
1. ✅ Icons: `build/icon.ico` (256x256)
2. ✅ Config: `package.json` → `build.win`
3. ✅ Runner: `windows-latest`
4. ✅ Output: NSIS installer

## 🔄 GitHub Actions Workflow

File: `.github/workflows/build.yml`

**Triggers:**
- Push to main branch
- Push tags (v*)
- Pull requests
- Manual workflow dispatch

**Matrix Build:**
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
```

**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (`npm ci`)
4. Build application (`npm run build`)
5. Package application (`npm run package`)
6. Upload artifacts (90 days retention)
7. Create release (on tags)

## 📊 Platform Comparison

| Platform | Local Build | GitHub Actions | Icon Format | Output Format |
|----------|-------------|----------------|-------------|---------------|
| **Linux** | ✅ Yes | ✅ Yes | PNG (256x256) | AppImage, deb |
| **macOS** | ❌ Mac only | ✅ Yes | ICNS | DMG (x64, arm64) |
| **Windows** | ❌ Win only | ✅ Yes | ICO (256x256) | EXE (NSIS) |

## 🎨 Icons

Current icons are minimal placeholders. For production:

1. Create a 1024x1024 PNG logo
2. Convert to platform formats:
   - Windows: https://convertio.co/png-ico/
   - macOS: https://cloudconvert.com/png-to-icns/
   - Linux: Resize to 256x256

Or use ImageMagick:
```bash
bash build/create-placeholder-icons.sh
```

## 🐛 Troubleshooting

### macOS Build Fails Locally
**Error:** `Cannot find module 'dmg-license'`
**Solution:** This is expected on Linux. Use GitHub Actions for macOS builds.

### Windows Build Fails Locally
**Error:** `wine is required`
**Solution:** This is expected on Linux. Use GitHub Actions for Windows builds.

### Icon Too Small
**Error:** `image must be at least 256x256`
**Solution:** Run `node scripts/create-simple-icons.js` to regenerate icons.

## 📝 Commands Reference

```bash
# Verification
npm run verify              # Verify all platform configs
npm run check               # Check build setup

# Building
npm run build               # Build source code
npm run package             # Package for current platform
npm run package:linux       # Linux only
npm run package:mac         # macOS only
npm run package:win         # Windows only
npm run package:all         # All platforms (limited)

# Icons
npm run icons               # Generate icons
node scripts/create-simple-icons.js  # Create placeholder icons

# Development
npm run dev                 # Start dev server
npm start                   # Run built app
```

## 🎯 Next Steps

### 1. Test GitHub Actions (Recommended)
```bash
git tag v0.1.1-test
git push origin v0.1.1-test
```

### 2. Create Production Release
```bash
git tag v0.1.1
git push origin v0.1.1
```

### 3. Download Installers
After GitHub Actions completes:
- Go to: https://github.com/YOUR_USERNAME/kubernetes-training/releases
- Download installers for all platforms
- Test on each platform

## ✨ Success!

All three platforms are configured and ready to build via GitHub Actions!

**What's Working:**
- ✅ Linux builds locally
- ✅ macOS configured for GitHub Actions
- ✅ Windows configured for GitHub Actions
- ✅ Icons present for all platforms
- ✅ GitHub Actions workflow ready
- ✅ Release automation configured

**Push a tag to trigger the multi-platform build!**
