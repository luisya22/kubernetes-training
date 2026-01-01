#!/usr/bin/env node

/**
 * Build Script for Multi-Platform Electron App
 * Handles building and packaging for Windows, macOS, and Linux
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const platforms = args.length > 0 ? args : ['current'];

console.log('🚀 Kubernetes Training App - Build Script');
console.log('==========================================\n');

// Detect current platform
const currentPlatform = process.platform;
const platformMap = {
    'win32': 'Windows',
    'darwin': 'macOS',
    'linux': 'Linux'
};

console.log(`📍 Current platform: ${platformMap[currentPlatform] || currentPlatform}\n`);

// Build the application first
function buildApp() {
    console.log('🔨 Building application...');
    try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ Build complete\n');
    } catch (error) {
        console.error('❌ Build failed');
        process.exit(1);
    }
}

// Package for specific platform
function packagePlatform(platform) {
    const commands = {
        'windows': 'npm run package:win',
        'macos': 'npm run package:mac',
        'linux': 'npm run package:linux',
        'all': 'npm run package:all',
        'current': 'npm run package'
    };

    const command = commands[platform];
    if (!command) {
        console.error(`❌ Unknown platform: ${platform}`);
        console.log('Available platforms: windows, macos, linux, all, current');
        return false;
    }

    console.log(`📦 Packaging for ${platform}...`);
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${platform} package complete\n`);
        return true;
    } catch (error) {
        console.error(`❌ ${platform} packaging failed`);
        return false;
    }
}

// Check if icons exist
function checkIcons() {
    const buildDir = path.join(__dirname, '../build');
    const requiredIcons = {
        'Windows': path.join(buildDir, 'icon.ico'),
        'macOS': path.join(buildDir, 'icon.icns'),
        'Linux': path.join(buildDir, 'icons/256x256.png')
    };

    console.log('🎨 Checking icons...');
    let allExist = true;

    for (const [platform, iconPath] of Object.entries(requiredIcons)) {
        if (fs.existsSync(iconPath)) {
            console.log(`  ✅ ${platform}: ${path.basename(iconPath)}`);
        } else {
            console.log(`  ⚠️  ${platform}: ${path.basename(iconPath)} missing`);
            allExist = false;
        }
    }

    if (!allExist) {
        console.log('\n💡 Run: node scripts/generate-icons.js');
    }
    console.log('');
}

// Platform compatibility check
function checkPlatformCompatibility(targetPlatform) {
    // Windows can only build for Windows
    if (currentPlatform === 'win32' && targetPlatform !== 'windows' && targetPlatform !== 'current') {
        console.warn(`⚠️  Warning: Building for ${targetPlatform} on Windows may not work`);
        console.log('   Use GitHub Actions for cross-platform builds\n');
        return false;
    }
    return true;
}

// Main execution
(async () => {
    checkIcons();
    buildApp();

    let success = true;
    for (const platform of platforms) {
        if (platform === 'all') {
            if (currentPlatform === 'win32') {
                console.log('⚠️  Cannot build for all platforms on Windows');
                console.log('   Use GitHub Actions or build on macOS/Linux\n');
                success = false;
                break;
            }
        }

        checkPlatformCompatibility(platform);
        if (!packagePlatform(platform)) {
            success = false;
        }
    }

    if (success) {
        console.log('✨ All builds completed successfully!');
        console.log('\n📂 Output directory: release/');
        
        // List generated files
        const releaseDir = path.join(__dirname, '../release');
        if (fs.existsSync(releaseDir)) {
            const files = fs.readdirSync(releaseDir)
                .filter(f => !f.includes('unpacked') && !f.includes('mac'))
                .filter(f => f.endsWith('.exe') || f.endsWith('.dmg') || 
                           f.endsWith('.AppImage') || f.endsWith('.deb'));
            
            if (files.length > 0) {
                console.log('\n📦 Generated installers:');
                files.forEach(f => console.log(`   - ${f}`));
            }
        }
    } else {
        console.log('❌ Some builds failed');
        process.exit(1);
    }
})();
