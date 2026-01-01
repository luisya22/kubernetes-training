# Build Resources

This directory contains resources needed for building the application installers.

## Icon Requirements

### Windows (icon.ico)
- Format: ICO file
- Recommended sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- Place at: `build/icon.ico`

### macOS (icon.icns)
- Format: ICNS file
- Recommended sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
- Place at: `build/icon.icns`

### Linux (PNG icons)
- Format: PNG files
- Required sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512
- Place in: `build/icons/` directory
- Naming: `16x16.png`, `32x32.png`, etc.

## Creating Icons

You can create icons from a single high-resolution PNG (1024x1024) using tools like:
- **electron-icon-builder**: `npm install -g electron-icon-builder`
- **icon-gen**: `npm install -g icon-gen`
- Online tools: https://www.electronjs.org/docs/latest/tutorial/application-distribution#icon-requirements

## Placeholder Icons

For development/testing purposes, placeholder icons are acceptable. For production releases, create proper branded icons following the guidelines above.
