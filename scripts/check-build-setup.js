#!/usr/bin/env node

/**
 * Build Setup Checker
 * Verifies that everything is ready for building
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Kubernetes Training App - Build Setup Check');
console.log('==============================================\n');

let allGood = true;

// Check Node.js version
function checkNodeVersion() {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);
    
    if (major >= 18) {
        console.log(`✅ Node.js version: ${version}`);
    } else {
        console.log(`❌ Node.js version: ${version} (need 18+)`);
        allGood = false;
    }
}

// Check npm
function checkNpm() {
    try {
        const version = execSync('npm --version', { encoding: 'utf8' }).trim();
        console.log(`✅ npm version: ${version}`);
    } catch (error) {
        console.log('❌ npm not found');
        allGood = false;
    }
}

// Check dependencies installed
function checkDependencies() {
    const nodeModules = path.join(__dirname, '../node_modules');
    if (fs.existsSync(nodeModules)) {
        console.log('✅ Dependencies installed');
    } else {
        console.log('❌ Dependencies not installed (run: npm install)');
        allGood = false;
    }
}

// Check electron-builder
function checkElectronBuilder() {
    const ebPath = path.join(__dirname, '../node_modules/.bin/electron-builder');
    if (fs.existsSync(ebPath) || fs.existsSync(ebPath + '.cmd')) {
        console.log('✅ electron-builder installed');
    } else {
        console.log('❌ electron-builder not found');
        allGood = false;
    }
}

// Check icons
function checkIcons() {
    console.log('\n📁 Icon Files:');
    
    const icons = {
        'Windows (.ico)': path.join(__dirname, '../build/icon.ico'),
        'macOS (.icns)': path.join(__dirname, '../build/icon.icns'),
        'Linux (PNG)': path.join(__dirname, '../build/icons/256x256.png')
    };
    
    let missingIcons = [];
    
    for (const [name, iconPath] of Object.entries(icons)) {
        if (fs.existsSync(iconPath)) {
            const stats = fs.statSync(iconPath);
            const size = (stats.size / 1024).toFixed(1);
            console.log(`   ✅ ${name}: ${size} KB`);
        } else {
            console.log(`   ⚠️  ${name}: Missing (will use default)`);
            missingIcons.push(name);
        }
    }
    
    if (missingIcons.length > 0) {
        console.log('\n   💡 Add custom icons: node scripts/create-placeholder-icon.js');
        console.log('   ℹ️  Builds will work with default Electron icons');
    }
}

// Check build directory
function checkBuildDir() {
    const buildDir = path.join(__dirname, '../build');
    if (fs.existsSync(buildDir)) {
        console.log('\n✅ Build directory exists');
    } else {
        console.log('\n❌ Build directory missing');
        allGood = false;
    }
}

// Check dist directory (compiled code)
function checkDistDir() {
    const distDir = path.join(__dirname, '../dist');
    const mainExists = fs.existsSync(path.join(distDir, 'main/main.js'));
    const rendererExists = fs.existsSync(path.join(distDir, 'renderer/index.html'));
    
    if (mainExists && rendererExists) {
        console.log('✅ Compiled code exists (dist/)');
    } else {
        console.log('⚠️  Compiled code not found (run: npm run build)');
        console.log('   This is OK if you haven\'t built yet');
    }
}

// Check content directory
function checkContent() {
    const contentDir = path.join(__dirname, '../content');
    if (fs.existsSync(contentDir)) {
        const lessons = fs.existsSync(path.join(contentDir, 'lessons'));
        const exercises = fs.existsSync(path.join(contentDir, 'exercises'));
        
        if (lessons && exercises) {
            console.log('✅ Content directory complete');
        } else {
            console.log('⚠️  Content directory incomplete');
        }
    } else {
        console.log('❌ Content directory missing');
        allGood = false;
    }
}

// Check package.json build config
function checkPackageJson() {
    const pkgPath = path.join(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    if (pkg.build) {
        console.log('\n✅ Build configuration found in package.json');
        console.log(`   App ID: ${pkg.build.appId}`);
        console.log(`   Product: ${pkg.build.productName}`);
        console.log(`   Output: ${pkg.build.directories?.output || 'release'}`);
    } else {
        console.log('\n❌ Build configuration missing in package.json');
        allGood = false;
    }
}

// Platform info
function showPlatformInfo() {
    const platform = process.platform;
    const platformNames = {
        'win32': 'Windows',
        'darwin': 'macOS',
        'linux': 'Linux'
    };
    
    console.log(`\n🖥️  Platform: ${platformNames[platform] || platform}`);
    
    const canBuild = {
        'win32': ['Windows'],
        'darwin': ['macOS', 'Linux'],
        'linux': ['Linux', 'macOS (limited)']
    };
    
    console.log(`   Can build for: ${canBuild[platform]?.join(', ') || 'Unknown'}`);
    console.log('   For all platforms: Use GitHub Actions');
}

// GitHub Actions check
function checkGitHubActions() {
    const workflowPath = path.join(__dirname, '../.github/workflows/build.yml');
    if (fs.existsSync(workflowPath)) {
        console.log('\n✅ GitHub Actions workflow configured');
        console.log('   Push a tag to trigger: git tag v0.1.0 && git push origin v0.1.0');
    } else {
        console.log('\n⚠️  GitHub Actions workflow not found');
    }
}

// Run all checks
(async () => {
    checkNodeVersion();
    checkNpm();
    checkDependencies();
    checkElectronBuilder();
    checkIcons();
    checkBuildDir();
    checkDistDir();
    checkContent();
    checkPackageJson();
    showPlatformInfo();
    checkGitHubActions();
    
    console.log('\n' + '='.repeat(46));
    
    if (allGood) {
        console.log('✅ All checks passed! Ready to build.');
        console.log('\n📦 Next steps:');
        console.log('   1. npm run build      # Compile the app');
        console.log('   2. npm run dist       # Create installer');
        console.log('   3. Check release/ directory for output');
    } else {
        console.log('❌ Some checks failed. Fix issues above.');
        console.log('\n🔧 Common fixes:');
        console.log('   - npm install         # Install dependencies');
        console.log('   - npm run icons       # Generate icons');
        console.log('   - npm run build       # Compile code');
    }
    
    console.log('\n📚 Documentation:');
    console.log('   - BUILD_QUICK_REFERENCE.md');
    console.log('   - docs/building-for-all-platforms.md');
    
    process.exit(allGood ? 0 : 1);
})();
