# Building and Packaging Guide

This guide explains how to build and package the Kubernetes Training Application for distribution across Windows, macOS, and Linux platforms.

## Prerequisites

### All Platforms
- Node.js 18+ and npm
- Git

### Platform-Specific Requirements

#### Windows
- Windows 10 or later
- No additional requirements (NSIS is bundled with electron-builder)

#### macOS
- macOS 10.13 or later
- Xcode Command Line Tools: `xcode-select --install`
- For code signing (optional): Apple Developer account

#### Linux
- Ubuntu 18.04+ or equivalent
- Required packages:
  ```bash
  sudo apt-get install -y build-essential libssl-dev
  ```

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd kubernetes-training-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Create placeholder icons for testing:
   ```bash
   ./build/create-placeholder-icons.sh
   ```

## Building the Application

### Development Build

Build the application for development/testing:

```bash
npm run build
```

This compiles both the main process and renderer process code into the `dist/` directory.

### Production Build

Build and package for the current platform:

```bash
npm run package
```

### Platform-Specific Builds

Build for a specific platform:

```bash
# Windows
npm run package:win

# macOS
npm run package:mac

# Linux
npm run package:linux
```

### Build for All Platforms

Build installers for all platforms (requires appropriate OS or CI/CD):

```bash
npm run package:all
```

**Note:** Cross-platform building has limitations:
- Windows builds can only be created on Windows
- macOS builds can only be created on macOS
- Linux builds can be created on Linux or macOS

## Output

Built installers are placed in the `release/` directory:

### Windows
- `Kubernetes Training-Setup-{version}.exe` - NSIS installer

### macOS
- `Kubernetes Training-{version}-x64.dmg` - Intel Macs
- `Kubernetes Training-{version}-arm64.dmg` - Apple Silicon Macs

### Linux
- `Kubernetes Training-{version}-x64.AppImage` - Universal Linux binary
- `Kubernetes Training-{version}-x64.deb` - Debian/Ubuntu package

## Bundled Content

The application bundles the following content:

### Lesson Content
- All lesson JSON files from `content/lessons/`
- Beginner, intermediate, and advanced lessons
- Code examples and diagrams

### Exercise Definitions
- All exercise JSON files from `content/exercises/`
- Validation criteria and step-by-step instructions

### Sample Microservices
- `hello-service` (Node.js)
- `counter-service` (Python + Redis)
- `api-gateway` (Go)
- `data-processor` (Java)

Each microservice includes:
- Complete source code
- Dockerfile
- Kubernetes manifests
- metadata.json with descriptions

## Testing the Build

### Before Packaging

1. Run all tests:
   ```bash
   npm test
   ```

2. Test the application in development mode:
   ```bash
   npm run dev
   ```

### After Packaging

1. Install the packaged application on the target platform
2. Verify the application launches successfully
3. Check that all content is accessible:
   - Lessons load correctly
   - Exercises display properly
   - Sample microservices are available
4. Test core functionality:
   - Progress tracking
   - Validation engine
   - Docker and Kubernetes integration

## Configuration

### electron-builder Configuration

The build configuration is in `package.json` under the `build` key. Key settings:

- **appId**: `com.kubernetes.training`
- **productName**: `Kubernetes Training`
- **files**: Specifies which files to include
- **extraResources**: Bundles the content directory
- **Platform-specific settings**: Icons, installers, and metadata

### Customization

To customize the build:

1. **Change app name**: Update `productName` in `package.json`
2. **Add/remove files**: Modify the `files` array
3. **Change installer type**: Update platform-specific `target` arrays
4. **Add code signing**: Configure signing certificates in build config

## Code Signing (Optional)

### Windows
1. Obtain a code signing certificate
2. Configure in `package.json`:
   ```json
   "win": {
     "certificateFile": "path/to/cert.pfx",
     "certificatePassword": "password"
   }
   ```

### macOS
1. Enroll in Apple Developer Program
2. Create signing certificates in Xcode
3. Configure in `package.json`:
   ```json
   "mac": {
     "identity": "Developer ID Application: Your Name (TEAM_ID)"
   }
   ```

### Linux
Linux packages typically don't require code signing, but you can sign .deb packages using `dpkg-sig`.

## Troubleshooting

### Build Fails with "Cannot find module"
- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and `package-lock.json`, then reinstall

### Icons Not Found
- Ensure icon files exist in the `build/` directory
- Run `./build/create-placeholder-icons.sh` to create test icons
- Check paths in `package.json` build configuration

### Large Bundle Size
- The application includes all content and dependencies
- Expected size: 150-300 MB depending on platform
- This is normal for Electron applications with bundled content

### Platform-Specific Issues

**Windows:**
- Ensure NSIS installer can write to Program Files
- Disable antivirus temporarily if build hangs

**macOS:**
- If notarization fails, ensure you have valid Apple Developer credentials
- For local testing, unsigned builds work fine

**Linux:**
- AppImage requires FUSE to run on some systems
- Use .deb package for Debian/Ubuntu systems

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install
      - run: npm test
      - run: npm run package
      
      - uses: actions/upload-artifact@v3
        with:
          name: installers-${{ matrix.os }}
          path: release/*
```

## Distribution

### Direct Distribution
- Upload installers to your website or file hosting
- Provide download links for each platform

### App Stores
- **Microsoft Store**: Package as MSIX (requires additional configuration)
- **Mac App Store**: Requires Apple Developer account and additional setup
- **Snap Store**: Create snap package for Linux

### Auto-Updates
To enable auto-updates, configure electron-updater:
1. Set up a release server
2. Add update configuration to `package.json`
3. Implement update checking in the main process

## Release Checklist

Before releasing a new version:

- [ ] Update version in `package.json`
- [ ] Run all tests: `npm test`
- [ ] Update CHANGELOG.md
- [ ] Create proper branded icons (replace placeholders)
- [ ] Build for all target platforms
- [ ] Test installers on clean systems
- [ ] Verify all content is bundled correctly
- [ ] Test core functionality on each platform
- [ ] Create release notes
- [ ] Tag the release in Git
- [ ] Upload installers to distribution channels

## Support

For build issues:
- Check electron-builder documentation: https://www.electron.build/
- Review Electron packaging guide: https://www.electronjs.org/docs/latest/tutorial/application-distribution
- Check platform-specific requirements

## License

Ensure all bundled content and dependencies comply with their respective licenses.
