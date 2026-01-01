#!/usr/bin/env node

/**
 * Script to generate PDF from kubectl cheat sheet markdown
 * 
 * This is optional - users can view the markdown directly or use
 * external tools to convert to PDF if needed.
 * 
 * To use this script, you would need to install:
 * npm install --save-dev markdown-pdf
 * 
 * Then run: node scripts/generate-cheat-sheet-pdf.js
 */

const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../content/resources/kubectl-cheat-sheet.md');
const outputFile = path.join(__dirname, '../content/resources/kubectl-cheat-sheet.pdf');

console.log('kubectl Cheat Sheet PDF Generator');
console.log('==================================\n');

if (!fs.existsSync(inputFile)) {
  console.error('Error: kubectl-cheat-sheet.md not found!');
  process.exit(1);
}

console.log('Input file:', inputFile);
console.log('Output file:', outputFile);
console.log('\nNote: To generate PDF, you can use external tools like:');
console.log('  - pandoc: pandoc kubectl-cheat-sheet.md -o kubectl-cheat-sheet.pdf');
console.log('  - Online converters: https://www.markdowntopdf.com/');
console.log('  - VS Code extensions: Markdown PDF');
console.log('\nFor now, users can view the markdown file directly in their preferred viewer.');
