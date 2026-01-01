#!/usr/bin/env node

/**
 * Icon Generation Script
 * Generates platform-specific icons from a source PNG
 * 
 * Requirements:
 * - npm install --save-dev png-to-ico (for Windows .ico)
 * - For macOS .icns: Use online converter or install iconutil (macOS only)
 */

const fs = require('fs');
const path = require('path');

const SOURCE_ICON = path.join(__dirname, '../build/icons/256x256.png');
const BUILD_DIR = path.join(__dirname, '../build');

console.log('🎨 Icon Generation Script');
console.log('========================\n');

// Check if source icon exists
if (!fs.existsSync(SOURCE_ICON)) {
    console.error('❌ Source icon not found:', SOURCE_ICON);
    console.log('\n📝 Please create a 256x256 PNG icon at:', SOURCE_ICON);
    process.exit(1);
}

console.log('✅ Source icon found:', SOURCE_ICON);

// Generate Windows .ico
async function generateWindowsIcon() {
    try {
        const pngToIco = require('png-to-ico');
        const icoPath = path.join(BUILD_DIR, 'icon.ico');
        
        console.log('🪟 Generating Windows .ico...');
        const icoBuffer = await pngToIco(SOURCE_ICON);
        fs.writeFileSync(icoPath, icoBuffer);
        console.log('✅ Windows icon created:', icoPath);
    } catch (error) {
        console.warn('⚠️  Could not generate .ico file:', error.message);
        console.log('   Install with: npm install --save-dev png-to-ico');
    }
}

// Instructions for macOS .icns
function generateMacIcon() {
    const icnsPath = path.join(BUILD_DIR, 'icon.icns');
    
    if (fs.existsSync(icnsPath)) {
        console.log('✅ macOS icon already exists:', icnsPath);
        return;
    }
    
    console.log('\n🍎 macOS .icns generation:');
    console.log('   Option 1: Use online converter (recommended)');
    console.log('   - Visit: https://cloudconvert.com/png-to-icns');
    console.log('   - Upload:', SOURCE_ICON);
    console.log('   - Download and save to:', icnsPath);
    console.log('\n   Option 2: Use iconutil (macOS only)');
    console.log('   - Create iconset with multiple sizes');
    console.log('   - Run: iconutil -c icns icon.iconset');
}

// Check Linux icons
function checkLinuxIcons() {
    const iconsDir = path.join(BUILD_DIR, 'icons');
    
    if (fs.existsSync(iconsDir) && fs.readdirSync(iconsDir).length > 0) {
        console.log('✅ Linux icons directory exists:', iconsDir);
    } else {
        console.log('\n🐧 Linux icons:');
        console.log('   Current 256x256.png is sufficient for AppImage/deb');
        console.log('   For better quality, add multiple sizes: 16x16, 32x32, 48x48, 128x128, 256x256, 512x512');
    }
}

// Run generation
(async () => {
    await generateWindowsIcon();
    generateMacIcon();
    checkLinuxIcons();
    
    console.log('\n✨ Icon generation complete!');
    console.log('\n📦 Your build configuration is ready for:');
    console.log('   - Windows: NSIS installer (.exe)');
    console.log('   - macOS: DMG installer (Intel + Apple Silicon)');
    console.log('   - Linux: AppImage + Debian package');
})();
