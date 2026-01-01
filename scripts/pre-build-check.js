#!/usr/bin/env node

/**
 * Pre-build verification script
 * Checks that all required files and content are present before packaging
 */

const fs = require('fs');
const path = require('path');

const errors = [];
const warnings = [];

console.log('🔍 Running pre-build checks...\n');

// Check required directories
const requiredDirs = [
  'content/lessons',
  'content/exercises',
  'content/microservices',
  'dist/main',
  'dist/renderer'
];

console.log('📁 Checking required directories...');
requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    errors.push(`Missing required directory: ${dir}`);
  } else {
    console.log(`  ✓ ${dir}`);
  }
});

// Check that dist files exist
console.log('\n📦 Checking build output...');
const requiredDistFiles = [
  'dist/main/main.js',
  'dist/renderer/index.html'
];

requiredDistFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    errors.push(`Missing build file: ${file}. Run 'npm run build' first.`);
  } else {
    console.log(`  ✓ ${file}`);
  }
});

// Check content files
console.log('\n📚 Checking content files...');

const lessonsDir = 'content/lessons';
if (fs.existsSync(lessonsDir)) {
  const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json'));
  console.log(`  ✓ Found ${lessonFiles.length} lesson files`);
  if (lessonFiles.length === 0) {
    warnings.push('No lesson files found in content/lessons/');
  }
}

const exercisesDir = 'content/exercises';
if (fs.existsSync(exercisesDir)) {
  const exerciseFiles = fs.readdirSync(exercisesDir).filter(f => f.endsWith('.json'));
  console.log(`  ✓ Found ${exerciseFiles.length} exercise files`);
  if (exerciseFiles.length === 0) {
    warnings.push('No exercise files found in content/exercises/');
  }
}

const microservicesDir = 'content/microservices';
if (fs.existsSync(microservicesDir)) {
  const microservices = fs.readdirSync(microservicesDir)
    .filter(f => fs.statSync(path.join(microservicesDir, f)).isDirectory() && f !== '.gitkeep');
  console.log(`  ✓ Found ${microservices.length} microservices`);
  
  // Check each microservice has required files
  microservices.forEach(service => {
    const servicePath = path.join(microservicesDir, service);
    const hasDockerfile = fs.existsSync(path.join(servicePath, 'Dockerfile'));
    const hasMetadata = fs.existsSync(path.join(servicePath, 'metadata.json'));
    const hasManifests = fs.existsSync(path.join(servicePath, 'manifests'));
    
    if (!hasDockerfile) {
      warnings.push(`Microservice ${service} missing Dockerfile`);
    }
    if (!hasMetadata) {
      warnings.push(`Microservice ${service} missing metadata.json`);
    }
    if (!hasManifests) {
      warnings.push(`Microservice ${service} missing manifests directory`);
    }
  });
}

// Check package.json
console.log('\n📋 Checking package.json...');
const packageJson = require('../package.json');

if (!packageJson.name) {
  errors.push('package.json missing name field');
}
if (!packageJson.version) {
  errors.push('package.json missing version field');
}
if (!packageJson.main) {
  errors.push('package.json missing main field');
}
if (!packageJson.build) {
  errors.push('package.json missing build configuration');
} else {
  console.log(`  ✓ App: ${packageJson.build.productName || packageJson.name}`);
  console.log(`  ✓ Version: ${packageJson.version}`);
  console.log(`  ✓ AppId: ${packageJson.build.appId}`);
}

// Check for icons (warnings only, not errors)
console.log('\n🎨 Checking icons...');
const iconChecks = [
  { path: 'build/icon.ico', platform: 'Windows' },
  { path: 'build/icon.icns', platform: 'macOS' },
  { path: 'build/icons/256x256.png', platform: 'Linux' }
];

iconChecks.forEach(({ path: iconPath, platform }) => {
  if (fs.existsSync(iconPath)) {
    console.log(`  ✓ ${platform} icon found`);
  } else {
    warnings.push(`${platform} icon not found at ${iconPath}. Using default icon.`);
  }
});

// Check dependencies
console.log('\n📦 Checking dependencies...');
const requiredDeps = [
  '@kubernetes/client-node',
  'dockerode',
  'electron',
  'react',
  'react-dom'
];

const missingDeps = requiredDeps.filter(dep => {
  const hasInDeps = packageJson.dependencies && packageJson.dependencies[dep];
  const hasInDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
  return !hasInDeps && !hasInDevDeps;
});

if (missingDeps.length > 0) {
  errors.push(`Missing required dependencies: ${missingDeps.join(', ')}`);
} else {
  console.log(`  ✓ All required dependencies present`);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Pre-build Check Summary\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Ready to build.');
  process.exit(0);
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach(warning => console.log(`  - ${warning}`));
  console.log();
}

if (errors.length > 0) {
  console.log('❌ Errors:');
  errors.forEach(error => console.log(`  - ${error}`));
  console.log();
  console.log('Please fix the errors above before building.');
  process.exit(1);
}

if (warnings.length > 0 && errors.length === 0) {
  console.log('⚠️  Build can proceed but there are warnings to address.');
  process.exit(0);
}
