#!/usr/bin/env node

/**
 * Build Configuration Verification Script
 * Verifies that all platforms are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Multi-Platform Build Configuration\n');
console.log('='.repeat(60));

let allChecks = true;

// Check package.json
console.log('\n📦 Checking package.json...');
const packageJson = require('../package.json');

const requiredScripts = {
    'package:linux': 'npm run build && electron-builder --linux',
    'package:mac': 'npm run build && electron-builder --mac',
    'package:win': 'npm run build && electron-builder --win',
};

for (const [script, expected] of Object.entries(requiredScripts)) {
    if (packageJson.scripts[script] === expected) {
        console.log(`  ✅ ${script}`);
    } else {
        console.log(`  ❌ ${script} - Missing or incorrect`);
        allChecks = false;
    }
}

// Check electron-builder config
console.log('\n⚙️  Checking electron-builder configuration...');

const platforms = ['win', 'mac', 'linux'];
for (const platform of platforms) {
    if (packageJson.build[platform]) {
        console.log(`  ✅ ${platform} configuration exists`);
        if (packageJson.build[platform].target) {
            console.log(`     Targets: ${JSON.stringify(packageJson.build[platform].target)}`);
        }
    } else {
        console.log(`  ❌ ${platform} configuration missing`);
        allChecks = false;
    }
}

// Check icons
console.log('\n🎨 Checking platform icons...');

const icons = {
    'Windows': 'build/icon.ico',
    'macOS': 'build/icon.icns',
    'Linux': 'build/icons/256x256.png',
};

for (const [platform, iconPath] of Object.entries(icons)) {
    const fullPath = path.join(__dirname, '..', iconPath);
    if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`  ✅ ${platform}: ${iconPath} (${stats.size} bytes)`);
    } else {
        console.log(`  ❌ ${platform}: ${iconPath} - Not found`);
        allChecks = false;
    }
}

// Check GitHub Actions workflow
console.log('\n🔄 Checking GitHub Actions workflow...');

const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'build.yml');
if (fs.existsSync(workflowPath)) {
    const workflow = fs.readFileSync(workflowPath, 'utf8');
    
    if (workflow.includes('ubuntu-latest')) {
        console.log('  ✅ Linux build configured (ubuntu-latest)');
    } else {
        console.log('  ❌ Linux build not configured');
        allChecks = false;
    }
    
    if (workflow.includes('macos-latest')) {
        console.log('  ✅ macOS build configured (macos-latest)');
    } else {
        console.log('  ❌ macOS build not configured');
        allChecks = false;
    }
    
    if (workflow.includes('windows-latest')) {
        console.log('  ✅ Windows build configured (windows-latest)');
    } else {
        console.log('  ❌ Windows build not configured');
        allChecks = false;
    }
} else {
    console.log('  ❌ GitHub Actions workflow not found');
    allChecks = false;
}

// Check build output
console.log('\n📂 Checking existing build artifacts...');

const releaseDir = path.join(__dirname, '..', 'release');
if (fs.existsSync(releaseDir)) {
    const files = fs.readdirSync(releaseDir);
    
    const artifacts = {
        'Linux AppImage': files.find(f => f.endsWith('.AppImage')),
        'Linux Debian': files.find(f => f.endsWith('.deb')),
        'macOS DMG': files.find(f => f.endsWith('.dmg')),
        'Windows EXE': files.find(f => f.endsWith('.exe')),
    };
    
    for (const [type, file] of Object.entries(artifacts)) {
        if (file) {
            const stats = fs.statSync(path.join(releaseDir, file));
            const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
            console.log(`  ✅ ${type}: ${file} (${sizeMB} MB)`);
        } else {
            console.log(`  ⚪ ${type}: Not built yet`);
        }
    }
} else {
    console.log('  ⚪ No release directory yet (run npm run package)');
}

// Summary
console.log('\n' + '='.repeat(60));
if (allChecks) {
    console.log('✅ All configuration checks passed!');
    console.log('\n🚀 Ready to build for all platforms via GitHub Actions');
    console.log('\nNext steps:');
    console.log('  1. git tag v0.1.1');
    console.log('  2. git push origin v0.1.1');
    console.log('  3. Check: https://github.com/YOUR_USERNAME/kubernetes-training/actions');
} else {
    console.log('❌ Some configuration checks failed');
    console.log('\nPlease fix the issues above before building');
    process.exit(1);
}

console.log('\n' + '='.repeat(60));
