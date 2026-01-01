# Building the Kubernetes Training App

## ⚡ Quick Start

```bash
# Check if everything is ready
npm run check

# Build for your current platform
npm run dist
```

Your installer will be in the `release/` directory!

## 🚀 Creating a Release (Recommended)

The easiest way to build for all platforms is using GitHub Actions:

```bash
# Create and push a version tag
git tag v0.2.0
git push origin v0.2.0
```

GitHub Actions will automatically:
- ✅ Build for Windows, macOS (Intel + Apple Silicon), and Linux
- ✅ Create installers for all platforms
- ✅ Create a GitHub release with all files attached
- ✅ Generate release notes

Download the installers from: `https://github.com/YOUR_USERNAME/kubernetes-training/releases`

## 📦 Local Building

### Prerequisites
- Node.js 18+
- npm

### Build Commands

```bash
# Install dependencies (first time)
npm install

# Check build setup
npm run check

# Build application
npm run build

# Create installer for current platform
npm run package

# Or use the smart build script
npm run dist
```

### Platform-Specific Builds

```bash
npm run package:win      # Windows only
npm run package:mac      # macOS only
npm run package:linux    # Linux only
npm run package:all      # All platforms (macOS/Linux hosts only)
```

## 🎨 Icons (Optional)

The app will build with default Electron icons. To add custom icons:

1. **Create a high-resolution icon** (1024x1024 PNG)
2. **Convert to platform formats:**
   - Windows: `.ico` → https://convertio.co/png-ico/
   - macOS: `.icns` → https://cloudconvert.com/png-to-icns/
   - Linux: `.png` (256x256)

3. **Place icons:**
   - `build/icon.ico` (Windows)
   - `build/icon.icns` (macOS)
   - `build/icons/256x256.png` (Linux)

Or use the helper: `node scripts/create-placeholder-icon.js`

## 🐛 Troubleshooting

### Build fails
```bash
# Clean and rebuild
rm -rf dist/ release/
npm run build
npm run package
```

### Missing dependencies
```bash
npm install
```

### Icons missing (non-critical)
The app will build with default icons. Add custom icons later.

### Platform limitations
- **Windows:** Can only build Windows installers
- **macOS/Linux:** Can build for macOS and Linux
- **Solution:** Use GitHub Actions for all platforms

## 📊 Output Files

After building, check `release/` directory:

| Platform | File | Size |
|----------|------|------|
| Windows | `Kubernetes Training-Setup-0.1.0.exe` | ~150MB |
| macOS Intel | `Kubernetes Training-0.1.0-x64.dmg` | ~150MB |
| macOS Apple Silicon | `Kubernetes Training-0.1.0-arm64.dmg` | ~150MB |
| Linux AppImage | `Kubernetes Training-0.1.0-x64.AppImage` | ~150MB |
| Linux Debian | `Kubernetes Training-0.1.0-x64.deb` | ~150MB |

## 🔧 Advanced

### Custom Build Options

Edit `package.json` under the `build` key:

```json
{
  "build": {
    "appId": "com.kubernetes.training",
    "productName": "Kubernetes Training",
    "directories": {
      "output": "release"
    }
  }
}
```

### Code Signing

For production releases, add code signing:

**macOS:**
```json
"mac": {
  "identity": "Developer ID Application: Your Name"
}
```

**Windows:**
```json
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "password"
}
```

## 📚 More Documentation

- **Quick Reference:** `BUILD_QUICK_REFERENCE.md`
- **Detailed Guide:** `docs/building-for-all-platforms.md`
- **electron-builder:** https://www.electron.build/

## 💡 Tips

1. **Always test locally first** before pushing tags
2. **Use semantic versioning:** v0.1.0, v0.2.0, v1.0.0
3. **GitHub Actions is free** for public repositories
4. **Artifacts are kept for 90 days** even without creating a release
5. **Draft releases** can be edited before publishing

## 🎯 Typical Workflow

```bash
# 1. Develop
npm run dev

# 2. Test build locally
npm run check
npm run dist

# 3. Commit and push
git add .
git commit -m "Ready for release"
git push

# 4. Create release tag
git tag v0.2.0
git push origin v0.2.0

# 5. Wait for GitHub Actions (10-15 minutes)
# 6. Download from releases page
# 7. Test installers
# 8. Publish release on GitHub
```

---

**Need help?** Check the documentation or open an issue!
