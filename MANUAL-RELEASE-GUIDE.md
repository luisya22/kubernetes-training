# Manual Release Upload Guide

Since the automated build has icon issues, here's how to manually build and upload releases.

## Current Status

✅ **Release v0.1.0 is created**: https://github.com/luisya22/kubernetes-training/releases/tag/v0.1.0  
✅ **Download page is live**: https://luisya22.github.io/kubernetes-training/  
⚠️ **Installers need to be added manually**

## Option 1: Skip Installers for Now

The release is live and functional as a source code release. Users can:

```bash
git clone https://github.com/luisya22/kubernetes-training.git
cd kubernetes-training
npm install
npm run build
npm start
```

Your download page will show "Unable to load download links" until installers are added.

## Option 2: Build and Upload Installers Later

When you're ready to add installers:

### Step 1: Fix Icon Issue

Install ImageMagick to generate icons:

```bash
sudo apt install imagemagick
```

Then create a simple icon:

```bash
mkdir -p build/icons
convert -size 256x256 xc:'#667eea' -gravity center -pointsize 72 -fill white -annotate +0+0 'K8s' build/icons/256x256.png
```

### Step 2: Build Installers

```bash
# Build for Linux (on your Linux machine)
npm run package:linux

# This creates:
# - release/Kubernetes Training-0.1.0-x86_64.AppImage
# - release/Kubernetes Training-0.1.0-amd64.deb (if deb target is configured)
```

### Step 3: Upload to GitHub Release

1. Go to: https://github.com/luisya22/kubernetes-training/releases/tag/v0.1.0
2. Click **"Edit release"**
3. Drag and drop the installer files from `release/` folder
4. Click **"Update release"**

### Step 4: Download Page Auto-Updates

Once you upload the installers, your download page will automatically detect them and show download buttons!

## Option 3: Use GitHub Actions (Fix the Build)

To fix the automated build, you need to:

1. **Add icons to the repository** (in `build/` folder)
2. **Commit and push**
3. **Recreate the tag**

The build workflow will then work automatically.

## For Now

Your release is live and functional! The download page shows the release exists, it just doesn't have installer files yet. This is perfectly fine for:

- Source code distribution
- Developer testing
- Early access releases

You can add installers later when you have time to fix the icon issue.

## Quick Commands

```bash
# Check release exists
curl -s https://api.github.com/repos/luisya22/kubernetes-training/releases/latest | grep tag_name

# View your download page
xdg-open https://luisya22.github.io/kubernetes-training/

# View your release page
xdg-open https://github.com/luisya22/kubernetes-training/releases/tag/v0.1.0
```

## Summary

✅ Release v0.1.0 is **LIVE**  
✅ Download page is **LIVE**  
⏳ Installers can be added **LATER**  

You're all set! The infrastructure is working, you just need to add the installer files when you're ready.
