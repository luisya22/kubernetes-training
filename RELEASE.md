# 🚀 Quick Release Guide

## Create a New Release

```bash
./scripts/create-release.sh 1.0.0
```

That's it! GitHub Actions will automatically:
- ✅ Run tests
- ✅ Build for Windows, macOS, and Linux
- ✅ Create installers
- ✅ Publish to GitHub Releases

## View Your Releases

```
https://github.com/YOUR-USERNAME/YOUR-REPO-NAME/releases
```

## What Gets Built

- **Windows**: `Kubernetes-Training-Setup-1.0.0.exe`
- **macOS**: `Kubernetes-Training-1.0.0-x64.dmg` (Intel) + `arm64.dmg` (Apple Silicon)
- **Linux**: `Kubernetes-Training-1.0.0-x64.AppImage` + `.deb`

## Version Numbers

- `1.0.0` → `1.0.1` = Bug fixes
- `1.0.0` → `1.1.0` = New features
- `1.0.0` → `2.0.0` = Breaking changes

## Full Documentation

See [docs/creating-releases.md](docs/creating-releases.md) for detailed instructions.
