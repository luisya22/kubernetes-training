#!/usr/bin/env node

/**
 * Simple Icon Creator
 * Creates minimal placeholder icons for all platforms
 * This allows builds to work without ImageMagick
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '../build');

console.log('🎨 Creating simple placeholder icons...\n');

// Create a 256x256 PNG (minimal valid PNG at required size)
// PNG with 256x256 dimensions, 8-bit RGBA
const create256PNG = () => {
    const width = 256;
    const height = 256;
    
    // PNG signature
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    // IHDR chunk (image header)
    const ihdr = Buffer.alloc(25);
    ihdr.writeUInt32BE(13, 0); // chunk length
    ihdr.write('IHDR', 4);
    ihdr.writeUInt32BE(width, 8);
    ihdr.writeUInt32BE(height, 12);
    ihdr.writeUInt8(8, 16); // bit depth
    ihdr.writeUInt8(6, 17); // color type (RGBA)
    ihdr.writeUInt8(0, 18); // compression
    ihdr.writeUInt8(0, 19); // filter
    ihdr.writeUInt8(0, 20); // interlace
    
    // Calculate CRC for IHDR
    const crc = require('zlib').crc32(ihdr.slice(4, 21));
    ihdr.writeUInt32BE(crc, 21);
    
    // IDAT chunk (image data - all transparent)
    const idat = Buffer.from([
        0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54,
        0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05,
        0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4
    ]);
    
    // IEND chunk
    const iend = Buffer.from([
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
        0xAE, 0x42, 0x60, 0x82
    ]);
    
    return Buffer.concat([signature, ihdr, idat, iend]);
};

// Create 256x256 PNG for Linux
const pngPath = path.join(BUILD_DIR, 'icons', '256x256.png');
fs.writeFileSync(pngPath, create256PNG());
console.log('✅ Created:', pngPath);

// Create Windows .ico (256x256 icon)
const create256ICO = () => {
    const size = 256;
    const bpp = 32; // bits per pixel
    const imageSize = size * size * 4; // RGBA
    
    // ICO header
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // type (1 = icon)
    header.writeUInt16LE(1, 4); // number of images
    
    // Image directory entry
    const dirEntry = Buffer.alloc(16);
    dirEntry.writeUInt8(0, 0); // width (0 = 256)
    dirEntry.writeUInt8(0, 1); // height (0 = 256)
    dirEntry.writeUInt8(0, 2); // color palette
    dirEntry.writeUInt8(0, 3); // reserved
    dirEntry.writeUInt16LE(1, 4); // color planes
    dirEntry.writeUInt16LE(bpp, 6); // bits per pixel
    dirEntry.writeUInt32LE(40 + imageSize, 8); // image size
    dirEntry.writeUInt32LE(22, 12); // image offset
    
    // BMP header (BITMAPINFOHEADER)
    const bmpHeader = Buffer.alloc(40);
    bmpHeader.writeUInt32LE(40, 0); // header size
    bmpHeader.writeInt32LE(size, 4); // width
    bmpHeader.writeInt32LE(size * 2, 8); // height (doubled for icon)
    bmpHeader.writeUInt16LE(1, 12); // planes
    bmpHeader.writeUInt16LE(bpp, 14); // bits per pixel
    bmpHeader.writeUInt32LE(0, 16); // compression
    bmpHeader.writeUInt32LE(imageSize, 20); // image size
    
    // Image data (all transparent)
    const imageData = Buffer.alloc(imageSize, 0);
    
    return Buffer.concat([header, dirEntry, bmpHeader, imageData]);
};

const icoPath = path.join(BUILD_DIR, 'icon.ico');
fs.writeFileSync(icoPath, create256ICO());
console.log('✅ Created:', icoPath);

// For macOS, we'll create a minimal ICNS file
// ICNS format is more complex, so we'll create a basic one
const minimalICNS = Buffer.from([
    0x69, 0x63, 0x6E, 0x73, // 'icns' magic
    0x00, 0x00, 0x00, 0x08  // file size (just header)
]);

const icnsPath = path.join(BUILD_DIR, 'icon.icns');
fs.writeFileSync(icnsPath, minimalICNS);
console.log('✅ Created:', icnsPath);

console.log('\n✨ Placeholder icons created!');
console.log('\n⚠️  Note: These are minimal placeholders for testing.');
console.log('   For production, replace with proper branded icons.');
console.log('\n📦 Ready to build for:');
console.log('   - Windows (.exe)');
console.log('   - macOS (.dmg)');
console.log('   - Linux (.AppImage, .deb)');
