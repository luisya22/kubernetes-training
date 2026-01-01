# Build Quick Reference

## 🚀 Quick Commands

```bash
# First time setup
npm install
npm run icons

# Build for current platform
npm run dist

# Create a release (triggers GitHub Actions)
git tag v0.2.0
git push origin v0.2.0
```

## 📦 What Gets Built

| Platform | Output Files | Size |
|----------|-------------|------|
| **Windows** | `Kubernetes Training-Setup-0.1.0.exe` | ~150MB |
| **macOS Intel** | `Kubernetes Training-0.1.0-x64.dmg` | ~150MB |
| **macOS Apple Silicon** | `Kubernetes Training-0.1.0-arm64.dmg` | ~150MB |
| **Linux AppImage** | `Kubernetes Training-0.1.0-x64.AppImage` | ~150MB |
| **Linux Debian** | `Kubernetes Training-0.1.0-x64.deb` | ~150MB |

## 🔧 Build Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript + webpack |
| `npm run package` | Build + package for current OS |
| `npm run package:win` | Windows installer only |
| `npm run package:mac` | macOS DMG only |
| `npm run package:linux` | Linux AppImage + deb |
| `npm run package:all` | All platforms (macOS/Linux only) |
| `npm run dist` | Smart build script with checks |
| `npm run icons` | Generate platform icons |

## 🤖 GitHub Actions

### Automatic Builds

**On every push to main:**
- ✅ Builds all platforms
- ✅ Uploads artifacts
- ❌ No release created

**On pull request:**
- ✅ Runs tests
- ❌ No builds

**On tag push (v*):**
- ✅ Builds all platforms
- ✅ Creates GitHub release
- ✅ Attaches installers

### Create a Release

```bash
# Method 1: Using npm version
npm version patch        # 0.1.0 → 0.1.1
npm version minor        # 0.1.0 → 0.2.0
npm version major        # 0.1.0 → 1.0.0
git push origin main
git push origin --tags

# Method 2: Manual tag
git tag v0.2.0
git push origin v0.2.0
```

## 📁 Directory Structure

```
kubernetes-training/
├── build/                    # Build resources
│   ├── icon.ico             # Windows icon
│   ├── icon.icns            # macOS icon
│   └── icons/
│       └── 256x256.png      # Linux icon
├── dist/                     # Compiled code
│   ├── main/                # Main process
│   └── renderer/            # Renderer process
├── release/                  # Final installers
│   ├── *.exe                # Windows
│   ├── *.dmg                # macOS
│   ├── *.AppImage           # Linux
│   └── *.deb                # Debian
└── scripts/
    ├── build-all.js         # Build automation
    └── generate-icons.js    # Icon generation
```

## ⚠️ Platform Limitations

| Build On | Can Build For |
|----------|---------------|
| **Windows** | Windows only |
| **macOS** | macOS + Linux |
| **Linux** | Linux + macOS (limited) |

**Solution:** Use GitHub Actions for cross-platform builds!

## 🎨 Icons Required

Before building, ensure these exist:

- ✅ `build/icon.ico` (Windows)
- ✅ `build/icon.icns` (macOS)
- ✅ `build/icons/256x256.png` (Linux)

Generate with: `npm run icons`

## 🐛 Common Issues

### Build fails with "icon not found"
```bash
npm run icons
```

### "Cannot build for X platform"
Use GitHub Actions or build on the target platform.

### Release not created on GitHub
- Tag must start with `v` (e.g., `v0.1.0`)
- Check GitHub Actions logs
- Verify permissions in repository settings

### Installers too large
- Normal for Electron apps (includes Chromium + Node.js)
- Typical size: 100-200MB per platform

## 📊 Build Times

| Platform | Local Build | GitHub Actions |
|----------|-------------|----------------|
| Windows | 3-5 min | 5-7 min |
| macOS | 3-5 min | 5-7 min |
| Linux | 2-4 min | 4-6 min |
| **All** | N/A | 10-15 min (parallel) |

## 🔗 Useful Links

- **Releases:** `https://github.com/YOUR_USERNAME/kubernetes-training/releases`
- **Actions:** `https://github.com/YOUR_USERNAME/kubernetes-training/actions`
- **electron-builder:** https://www.electron.build/
- **Full docs:** See `docs/building-for-all-platforms.md`

## 💡 Pro Tips

1. **Always test locally first:** `npm run dist`
2. **Use semantic versioning:** `v0.1.0`, `v0.2.0`, `v1.0.0`
3. **Draft releases:** Edit on GitHub before publishing
4. **Changelog:** GitHub Actions auto-generates release notes
5. **Artifacts:** Available for 90 days even without release

## 🎯 Typical Workflow

```bash
# 1. Develop and test
npm run dev

# 2. Test build locally
npm run dist

# 3. Commit changes
git add .
git commit -m "Add new feature"
git push

# 4. Create release
npm version minor
git push origin main --tags

# 5. Wait for GitHub Actions
# 6. Download from releases page
# 7. Test installers
# 8. Publish release
```

---

**Need more details?** See `docs/building-for-all-platforms.md`
