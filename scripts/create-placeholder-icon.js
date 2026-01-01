#!/usr/bin/env node

/**
 * Creates a simple placeholder icon for development
 * For production, replace with a proper branded icon
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Creating placeholder icon...\n');

// Simple SVG icon (Kubernetes-themed)
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="256" height="256" fill="#326CE5" rx="32"/>
  
  <!-- Kubernetes wheel (simplified) -->
  <g transform="translate(128, 128)">
    <!-- Center circle -->
    <circle cx="0" cy="0" r="20" fill="white"/>
    
    <!-- Spokes -->
    <line x1="0" y1="-60" x2="0" y2="-25" stroke="white" stroke-width="8" stroke-linecap="round"/>
    <line x1="52" y1="-30" x2="21" y2="-12" stroke="white" stroke-width="8" stroke-linecap="round"/>
    <line x1="52" y1="30" x2="21" y2="12" stroke="white" stroke-width="8" stroke-linecap="round"/>
    <line x1="0" y1="60" x2="0" y2="25" stroke="white" stroke-width="8" stroke-linecap="round"/>
    <line x1="-52" y1="30" x2="-21" y2="12" stroke="white" stroke-width="8" stroke-linecap="round"/>
    <line x1="-52" y1="-30" x2="-21" y2="-12" stroke="white" stroke-width="8" stroke-linecap="round"/>
    
    <!-- Outer circles -->
    <circle cx="0" cy="-60" r="12" fill="white"/>
    <circle cx="52" cy="-30" r="12" fill="white"/>
    <circle cx="52" cy="30" r="12" fill="white"/>
    <circle cx="0" cy="60" r="12" fill="white"/>
    <circle cx="-52" cy="30" r="12" fill="white"/>
    <circle cx="-52" cy="-30" r="12" fill="white"/>
  </g>
  
  <!-- Text -->
  <text x="128" y="220" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
        text-anchor="middle" fill="white">K8s Training</text>
</svg>`;

// Save SVG
const svgPath = path.join(__dirname, '../build/icon.svg');
fs.writeFileSync(svgPath, svgIcon);
console.log('✅ Created SVG icon:', svgPath);

console.log('\n📝 Next steps:');
console.log('   1. Convert SVG to PNG using an online tool:');
console.log('      - https://svgtopng.com/');
console.log('      - Export as 1024x1024 PNG');
console.log('      - Save to: build/icons/1024x1024.png');
console.log('');
console.log('   2. Generate platform icons:');
console.log('      - Windows .ico: https://convertio.co/png-ico/');
console.log('      - macOS .icns: https://cloudconvert.com/png-to-icns');
console.log('      - Linux: Resize PNG to 256x256');
console.log('');
console.log('   3. Or use electron-icon-builder:');
console.log('      npm install -g electron-icon-builder');
console.log('      electron-icon-builder --input=build/icons/1024x1024.png --output=build');
console.log('');
console.log('⚠️  For now, GitHub Actions will build without custom icons.');
console.log('   The app will use default Electron icons until you add proper ones.');
