#!/bin/bash

# This script creates placeholder icons for development/testing
# For production, replace with proper branded icons

echo "Creating placeholder icons for development..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Placeholder icons will not be created."
    echo "Install ImageMagick or create icons manually following build/README.md"
    exit 0
fi

# Create a simple colored square as base image
convert -size 1024x1024 xc:#4A90E2 -gravity center \
    -pointsize 200 -fill white -annotate +0+0 "K8s" \
    build/base-icon.png

# Create Windows ICO
convert build/base-icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico

# Create macOS ICNS (requires iconutil on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    mkdir -p build/icon.iconset
    sips -z 16 16     build/base-icon.png --out build/icon.iconset/icon_16x16.png
    sips -z 32 32     build/base-icon.png --out build/icon.iconset/icon_16x16@2x.png
    sips -z 32 32     build/base-icon.png --out build/icon.iconset/icon_32x32.png
    sips -z 64 64     build/base-icon.png --out build/icon.iconset/icon_32x32@2x.png
    sips -z 128 128   build/base-icon.png --out build/icon.iconset/icon_128x128.png
    sips -z 256 256   build/base-icon.png --out build/icon.iconset/icon_128x128@2x.png
    sips -z 256 256   build/base-icon.png --out build/icon.iconset/icon_256x256.png
    sips -z 512 512   build/base-icon.png --out build/icon.iconset/icon_256x256@2x.png
    sips -z 512 512   build/base-icon.png --out build/icon.iconset/icon_512x512.png
    sips -z 1024 1024 build/base-icon.png --out build/icon.iconset/icon_512x512@2x.png
    iconutil -c icns build/icon.iconset -o build/icon.icns
    rm -rf build/icon.iconset
fi

# Create Linux PNG icons
mkdir -p build/icons
for size in 16 32 48 64 128 256 512; do
    convert build/base-icon.png -resize ${size}x${size} build/icons/${size}x${size}.png
done

# Clean up base image
rm build/base-icon.png

echo "Placeholder icons created successfully!"
echo "For production, replace these with proper branded icons."
