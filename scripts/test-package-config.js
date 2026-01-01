#!/usr/bin/env node

/**
 * Test script to verify electron-builder configuration
 * Validates the build configuration without actually building
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing package configuration...\n');

// Load package.json
const packageJson = require('../package.json');

// Validate build configuration exists
if (!packageJson.build) {
  console.error('❌ No build configuration found in package.json');
  process.exit(1);
}

const buildConfig = packageJson.build;

console.log('📋 Build Configuration:');
console.log(`  App ID: ${buildConfig.appId}`);
console.log(`  Product Name: ${buildConfig.productName}`);
console.log(`  Output Directory: ${buildConfig.directories?.output || 'release'}`);
console.log();

// Check files configuration
console.log('📦 Files to include:');
if (buildConfig.files) {
  buildConfig.files.forEach(file => {
    console.log(`  - ${file}`);
  });
} else {
  console.warn('  ⚠️  No files configuration found');
}
console.log();

// Check extra resources
console.log('📁 Extra Resources:');
if (buildConfig.extraResources) {
  buildConfig.extraResources.forEach(resource => {
    if (typeof resource === 'string') {
      console.log(`  - ${resource}`);
    } else {
      console.log(`  - ${resource.from} → ${resource.to}`);
    }
  });
} else {
  console.warn('  ⚠️  No extra resources configured');
}
console.log();

// Check platform configurations
console.log('🖥️  Platform Targets:');

if (buildConfig.win) {
  console.log('  Windows:');
  const targets = buildConfig.win.target || [];
  targets.forEach(target => {
    const targetName = typeof target === 'string' ? target : target.target;
    const arch = typeof target === 'object' ? target.arch?.join(', ') : 'default';
    console.log(`    - ${targetName} (${arch})`);
  });
}

if (buildConfig.mac) {
  console.log('  macOS:');
  const targets = buildConfig.mac.target || [];
  targets.forEach(target => {
    const targetName = typeof target === 'string' ? target : target.target;
    const arch = typeof target === 'object' ? target.arch?.join(', ') : 'default';
    console.log(`    - ${targetName} (${arch})`);
  });
}

if (buildConfig.linux) {
  console.log('  Linux:');
  const targets = buildConfig.linux.target || [];
  targets.forEach(target => {
    const targetName = typeof target === 'string' ? target : target.target;
    const arch = typeof target === 'object' ? target.arch?.join(', ') : 'default';
    console.log(`    - ${targetName} (${arch})`);
  });
}
console.log();

// Validate that content directories exist
console.log('✅ Validation:');
const contentChecks = [
  { path: 'content/lessons', name: 'Lessons directory' },
  { path: 'content/exercises', name: 'Exercises directory' },
  { path: 'content/microservices', name: 'Microservices directory' }
];

let allValid = true;
contentChecks.forEach(({ path: checkPath, name }) => {
  if (fs.existsSync(checkPath)) {
    console.log(`  ✓ ${name} exists`);
  } else {
    console.log(`  ✗ ${name} missing`);
    allValid = false;
  }
});

// Check if dist directory exists (should be built before packaging)
if (fs.existsSync('dist')) {
  console.log('  ✓ Build output (dist) exists');
} else {
  console.log('  ⚠️  Build output (dist) not found - run "npm run build" first');
}

console.log();

if (allValid) {
  console.log('✅ Package configuration is valid!');
  console.log('\nTo build packages, run:');
  console.log('  npm run package        - Build for current platform');
  console.log('  npm run package:win    - Build for Windows');
  console.log('  npm run package:mac    - Build for macOS');
  console.log('  npm run package:linux  - Build for Linux');
  console.log('  npm run package:all    - Build for all platforms');
} else {
  console.log('❌ Some validation checks failed');
  process.exit(1);
}
