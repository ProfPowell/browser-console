#!/usr/bin/env node

/**
 * Build script for browser-console
 * Creates a minified version of the component with source map
 *
 * Usage: node build.js
 *
 * For better minification, install terser:
 *   npm install --save-dev terser
 *   Then this script will use it automatically
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const inputFile = join(rootDir, 'src', 'browser-console.js');
const distDir = join(rootDir, 'dist');
const outputFile = join(distDir, 'browser-console.min.js');
const mapFile = join(distDir, 'browser-console.min.js.map');
const distSourceFile = join(distDir, 'browser-console.js');
const distTypesFile = join(distDir, 'browser-console.d.ts');

// Read version from package.json
function getVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

async function build() {
  console.log('Building browser-console...');

  // Ensure dist directory exists
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
    console.log('Created dist/ directory');
  }

  const source = readFileSync(inputFile, 'utf8');
  const version = getVersion();
  let minified;
  let sourceMap = null;

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
      },
      sourceMap: {
        filename: 'browser-console.min.js',
        url: 'browser-console.min.js.map'
      }
    });

    if (result.error) {
      throw result.error;
    }

    minified = result.code;
    sourceMap = result.map;
    console.log('Minified with terser (with source map)');
  } catch (e) {
    // Fallback to basic minification (no source map)
    console.log('Terser not available, using basic minification');
    console.log('  (Install terser for better compression and source maps: npm install --save-dev terser)');

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

  // Add banner with dynamic version
  const banner = `/*! browser-console v${version} | MIT License | https://github.com/ProfPowell/browser-console */\n`;

  writeFileSync(outputFile, banner + minified);

  // Write source map if available
  if (sourceMap) {
    writeFileSync(mapFile, sourceMap);
    console.log(`Source map: ${mapFile}`);
  }

  // Copy unminified source to dist/
  copyFileSync(inputFile, distSourceFile);
  console.log(`Copied source: ${distSourceFile}`);

  // Copy TypeScript definitions to dist/
  const typesFile = join(rootDir, 'src', 'browser-console.d.ts');
  if (existsSync(typesFile)) {
    copyFileSync(typesFile, distTypesFile);
    console.log(`Copied types: ${distTypesFile}`);
  }

  const originalSize = Buffer.byteLength(source, 'utf8');
  const minifiedSize = Buffer.byteLength(minified, 'utf8');
  const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);

  console.log(`\nOutput: ${outputFile}`);
  console.log(`Version: ${version}`);
  console.log(`Original: ${(originalSize / 1024).toFixed(2)} KB`);
  console.log(`Minified: ${(minifiedSize / 1024).toFixed(2)} KB`);
  console.log(`Savings: ${savings}%`);
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
