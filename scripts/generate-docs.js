#!/usr/bin/env node

/**
 * Documentation generator for browser-console
 * Parses custom-elements.json and generates docs/api.md
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const manifestPath = join(rootDir, 'custom-elements.json');
const outputPath = join(rootDir, 'docs', 'api.md');

function generateDocs() {
  if (!existsSync(manifestPath)) {
    console.error('custom-elements.json not found. Run "npm run analyze" first.');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const lines = [];

  lines.push('# Browser Console API Reference');
  lines.push('');
  lines.push('> Auto-generated from [custom-elements.json](../custom-elements.json)');
  lines.push('');

  for (const mod of manifest.modules || []) {
    for (const declaration of mod.declarations || []) {
      if (declaration.customElement) {
        generateElementDocs(declaration, lines);
      }
    }
  }

  writeFileSync(outputPath, lines.join('\n'));
  console.log(`Generated: ${outputPath}`);
}

function generateElementDocs(element, lines) {
  lines.push(`## \`<${element.tagName}>\``);
  lines.push('');

  if (element.description) {
    lines.push(element.description);
    lines.push('');
  }

  // Attributes
  const attrs = element.attributes || [];
  if (attrs.length > 0) {
    lines.push('### Attributes');
    lines.push('');
    lines.push('| Name | Type | Default | Description |');
    lines.push('|------|------|---------|-------------|');
    for (const attr of attrs) {
      const type = attr.type?.text || 'string';
      const defaultVal = attr.default || '-';
      const desc = attr.description || '';
      lines.push(`| \`${attr.name}\` | \`${type}\` | \`${defaultVal}\` | ${desc} |`);
    }
    lines.push('');
  }

  // Properties
  const props = (element.members || []).filter(m => m.kind === 'field' && !m.static);
  if (props.length > 0) {
    lines.push('### Properties');
    lines.push('');
    lines.push('| Name | Type | Description |');
    lines.push('|------|------|-------------|');
    for (const prop of props) {
      const type = prop.type?.text || 'unknown';
      const desc = prop.description || '';
      lines.push(`| \`${prop.name}\` | \`${type}\` | ${desc} |`);
    }
    lines.push('');
  }

  // Methods
  const methods = (element.members || []).filter(m => m.kind === 'method' && !m.static);
  if (methods.length > 0) {
    lines.push('### Methods');
    lines.push('');
    for (const method of methods) {
      const params = (method.parameters || [])
        .map(p => `${p.name}: ${p.type?.text || 'unknown'}`)
        .join(', ');
      const returnType = method.return?.type?.text || 'void';
      lines.push(`#### \`${method.name}(${params}): ${returnType}\``);
      if (method.description) {
        lines.push('');
        lines.push(method.description);
      }
      lines.push('');
    }
  }

  // CSS Custom Properties
  const cssProps = element.cssProperties || [];
  if (cssProps.length > 0) {
    lines.push('### CSS Custom Properties');
    lines.push('');
    lines.push('| Property | Default | Description |');
    lines.push('|----------|---------|-------------|');
    for (const prop of cssProps) {
      const defaultVal = prop.default || '-';
      const desc = prop.description || '';
      lines.push(`| \`${prop.name}\` | \`${defaultVal}\` | ${desc} |`);
    }
    lines.push('');
  }

  // CSS Parts
  const cssParts = element.cssParts || [];
  if (cssParts.length > 0) {
    lines.push('### CSS Parts');
    lines.push('');
    lines.push('| Part | Description |');
    lines.push('|------|-------------|');
    for (const part of cssParts) {
      const desc = part.description || '';
      lines.push(`| \`${part.name}\` | ${desc} |`);
    }
    lines.push('');
  }

  // Events
  const events = element.events || [];
  if (events.length > 0) {
    lines.push('### Events');
    lines.push('');
    lines.push('| Event | Description |');
    lines.push('|-------|-------------|');
    for (const event of events) {
      const desc = event.description || '';
      lines.push(`| \`${event.name}\` | ${desc} |`);
    }
    lines.push('');
  }

  // Usage examples
  lines.push('### Usage');
  lines.push('');
  lines.push('```html');
  lines.push(`<${element.tagName}></${element.tagName}>`);
  lines.push('```');
  lines.push('');
}

generateDocs();
