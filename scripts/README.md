# Build Scripts

Helper scripts for building and packaging the Kubernetes Training App.

## Available Scripts

### check-build-setup.js
Verifies that your environment is ready for building.

```bash
npm run check
```

**Checks:**
- Node.js version (18+)
- npm installation
- Dependencies installed
- electron-builder available
- Icon files (optional)
- Build configuration
- GitHub Actions setup

### build-all.js
Smart build script that handles compilation and packaging.

```bash
# Build for current platform
npm run dist

# Build for specific platform
node scripts/build-all.js windows
node scripts/build-all.js macos
node scripts/build-all.js linux

# Build for all platforms (macOS/Linux only)
node scripts/build-all.js all
```

**Features:**
- Platform compatibility checks
- Icon verification
- Automatic compilation
- Progress indicators
- Output file listing

### generate-icons.js
Generates platform-specific icons from a source PNG.

```bash
npm run icons
```

**Requirements:**
- Source PNG: `build/icons/256x256.png` (or larger)
- `png-to-ico` package (installed automatically)

**Generates:**
- Windows `.ico` file
- Instructions for macOS `.icns`
- Verifies Linux PNG icons

### create-placeholder-icon.js
Creates a simple Kubernetes-themed SVG icon for development.

```bash
node scripts/create-placeholder-icon.js
```

**Output:**
- `build/icon.svg` - Kubernetes wheel design
- Instructions for converting to PNG/ICO/ICNS

### pre-build-check.js
Pre-build validation (runs automatically before `npm run build`).

**Checks:**
- Source files exist
- TypeScript configuration valid
- Content directory present

## Usage Examples

### First Time Setup
```bash
# Install dependencies
npm install

# Check everything is ready
npm run check

# Create placeholder icon (optional)
node scripts/create-placeholder-icon.js

# Build the app
npm run dist
```

### Regular Development
```bash
# After making changes
npm run build        # Compile only
npm run package      # Compile + package
npm run dist         # Smart build with checks
```

### Creating a Release
```bash
# Test build locally first
npm run check
npm run dist

# Create and push tag
git tag v0.2.0
git push origin v0.2.0

# GitHub Actions will build for all platforms
```

## Script Details

### build-all.js Flow
1. Check icons (warnings only)
2. Run `npm run build` (webpack compilation)
3. Run `electron-builder` for target platform(s)
4. List generated installers

### check-build-setup.js Flow
1. Verify Node.js/npm versions
2. Check dependencies installed
3. Verify electron-builder available
4. Check icon files (optional)
5. Verify build directories
6. Check package.json configuration
7. Display platform info
8. Check GitHub Actions setup

### generate-icons.js Flow
1. Verify source PNG exists
2. Generate Windows `.ico` using `png-to-ico`
3. Provide instructions for macOS `.icns`
4. Verify Linux icons directory

## Troubleshooting

### "Command not found"
Make sure scripts are executable:
```bash
chmod +x scripts/*.js
```

### "Module not found"
Install dependencies:
```bash
npm install
```

### "Icon generation failed"
The source PNG might be invalid. Create a new one:
```bash
node scripts/create-placeholder-icon.js
# Then convert the SVG to PNG using an online tool
```

### "Cannot build for X platform"
- Windows can only build Windows installers
- macOS/Linux can build for themselves
- Use GitHub Actions for cross-platform builds

## Adding New Scripts

When adding new build scripts:

1. **Add to package.json:**
   ```json
   "scripts": {
     "my-script": "node scripts/my-script.js"
   }
   ```

2. **Make executable:**
   ```bash
   chmod +x scripts/my-script.js
   ```

3. **Add shebang:**
   ```javascript
   #!/usr/bin/env node
   ```

4. **Document here** in this README

## Related Documentation

- **Quick Start:** `BUILDING.md`
- **Quick Reference:** `BUILD_QUICK_REFERENCE.md`
- **Detailed Guide:** `docs/building-for-all-platforms.md`
- **GitHub Actions:** `.github/workflows/build.yml`
