#!/usr/bin/env node

/**
 * Build script for browser-console
 * Creates a minified version of the component
 *
 * Usage: node build.js
 *
 * For better minification, install terser:
 *   npm install --save-dev terser
 *   Then this script will use it automatically
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputFile = join(__dirname, 'browser-console.js');
const outputFile = join(__dirname, 'browser-console.min.js');

async function build() {
  console.log('Building browser-console...');

  const source = readFileSync(inputFile, 'utf8');
  let minified;

  try {
    // Try to use terser if available
    const terser = await import('terser');
    const result = await terser.minify(source, {
      compress: {
        drop_console: false,
        passes: 2
      },
      mangle: {
        reserved: ['BrowserConsole']
      },
      format: {
        comments: false
      }
    });

    if (result.error) {
      throw result.error;
    }

    minified = result.code;
    console.log('Minified with terser');
  } catch (e) {
    // Fallback to basic minification
    console.log('Terser not available, using basic minification');
    console.log('  (Install terser for better compression: npm install --save-dev terser)');

    minified = source
      // Remove multi-line comments (but keep important ones)
      .replace(/\/\*(?!\*\/)[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '')
      // Remove single-line comments
      .replace(/\/\/[^\n]*/g, '')
      // Remove leading/trailing whitespace from lines
      .replace(/^\s+|\s+$/gm, '')
      // Collapse multiple spaces to single space
      .replace(/\s{2,}/g, ' ')
      // Remove newlines
      .replace(/\n/g, '')
      // Add back necessary newlines for template literals
      .replace(/`([^`]*)`/g, (match) => match)
      // Clean up spaces around operators
      .replace(/\s*([{}();,:])\s*/g, '$1')
      .replace(/\s*=>\s*/g, '=>')
      .replace(/\s*=\s*/g, '=');
  }

  // Add banner
  const banner = '/* browser-console v1.0.0 | MIT License | https://github.com/ProfPowell/browser-console */\n';

  writeFileSync(outputFile, banner + minified);

  const originalSize = Buffer.byteLength(source, 'utf8');
  const minifiedSize = Buffer.byteLength(minified, 'utf8');
  const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);

  console.log(`\nOutput: ${outputFile}`);
  console.log(`Original: ${(originalSize / 1024).toFixed(2)} KB`);
  console.log(`Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
  console.log(`Savings: ${savings}%`);
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
