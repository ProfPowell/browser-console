#!/usr/bin/env node

/**
 * Documentation generator for browser-console
 * Parses custom-elements.json and generates docs/index.html
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const manifestPath = join(rootDir, 'custom-elements.json');
const outputPath = join(rootDir, 'docs', 'index.html');

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateDocs() {
  if (!existsSync(manifestPath)) {
    console.error('custom-elements.json not found. Run "npm run analyze" first.');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  let elementContent = '';

  for (const mod of manifest.modules || []) {
    for (const declaration of mod.declarations || []) {
      if (declaration.customElement) {
        elementContent += generateElementDocs(declaration);
      }
    }
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Browser Console - API Reference</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
    }

    header hgroup h1 {
      color: #333;
      margin-bottom: 10px;
    }

    header hgroup p {
      color: #666;
      font-size: 16px;
    }

    header nav a {
      display: inline-block;
      padding: 10px 20px;
      background: #0066cc;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-size: 14px;
      transition: background 0.2s;
    }

    header nav a:hover {
      background: #0052a3;
    }

    main {
      background: white;
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    h2 {
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #0066cc;
    }

    h3 {
      color: #444;
      margin: 25px 0 15px;
      font-size: 18px;
    }

    h4 {
      color: #555;
      margin: 20px 0 10px;
      font-size: 15px;
      font-family: 'Consolas', 'Monaco', monospace;
    }

    p {
      margin-bottom: 15px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 14px;
    }

    th, td {
      text-align: left;
      padding: 12px 15px;
      border-bottom: 1px solid #e0e0e0;
    }

    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #333;
    }

    tr:hover {
      background: #f8f9fa;
    }

    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      color: #d14;
    }

    pre {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 20px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 14px;
      line-height: 1.5;
      margin: 15px 0;
    }

    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }

    .tag-name {
      color: #569cd6;
    }

    .attr-name {
      color: #9cdcfe;
    }

    .attr-value {
      color: #ce9178;
    }

    nav[aria-label="Table of contents"] {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 25px;
    }

    nav[aria-label="Table of contents"] h3 {
      margin-top: 0;
      margin-bottom: 10px;
    }

    nav[aria-label="Table of contents"] ul {
      list-style: none;
      columns: 2;
    }

    nav[aria-label="Table of contents"] li {
      margin: 5px 0;
    }

    nav[aria-label="Table of contents"] a {
      color: #0066cc;
      text-decoration: none;
    }

    nav[aria-label="Table of contents"] a:hover {
      text-decoration: underline;
    }

    pre.method-signature {
      font-family: 'Consolas', 'Monaco', monospace;
      background: #f4f4f4;
      color: #333;
      padding: 10px 15px;
      border-radius: 4px;
      border-left: 3px solid #0066cc;
    }

    footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
    }

    footer a {
      color: #0066cc;
    }

    @media (max-width: 768px) {
      nav[aria-label="Table of contents"] ul {
        columns: 1;
      }
    }
  </style>
</head>
<body>
  <header>
    <hgroup>
      <h1>Browser Console API Reference</h1>
      <p>Complete documentation for the &lt;browser-console&gt; web component</p>
    </hgroup>
    <nav>
      <a href="../examples/">View Live Demo</a>
    </nav>
  </header>

  <main>
    <nav aria-label="Table of contents">
      <h3>Contents</h3>
      <ul>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#usage">Basic Usage</a></li>
        <li><a href="#attributes">Attributes</a></li>
        <li><a href="#properties">Properties</a></li>
        <li><a href="#methods">Methods</a></li>
        <li><a href="#css-properties">CSS Custom Properties</a></li>
        <li><a href="#css-parts">CSS Parts</a></li>
        <li><a href="#events">Events</a></li>
      </ul>
    </nav>

    <section id="installation">
      <h3>Installation</h3>
      <p><strong>npm:</strong></p>
      <pre><code>npm install @profpowell/browser-console</code></pre>
      <p><strong>CDN:</strong></p>
      <pre><code>&lt;script type="module" src="https://unpkg.com/@profpowell/browser-console"&gt;&lt;/script&gt;</code></pre>
    </section>

    <section id="usage">
      <h3>Basic Usage</h3>
      <pre><code><span class="tag-name">&lt;browser-console</span> <span class="attr-name">theme</span>=<span class="attr-value">"dark"</span> <span class="attr-name">max-logs</span>=<span class="attr-value">"500"</span><span class="tag-name">&gt;&lt;/browser-console&gt;</span></code></pre>
      <p>The component automatically hooks into console methods and displays all logs with syntax highlighting.</p>
    </section>

${elementContent}
  </main>

  <footer>
    <p>Auto-generated from <a href="../custom-elements.json">custom-elements.json</a></p>
  </footer>
</body>
</html>`;

  writeFileSync(outputPath, html);
  console.log(`Generated: ${outputPath}`);
}

function generateElementDocs(element) {
  let html = '';

  // Attributes
  const attrs = element.attributes || [];
  if (attrs.length > 0) {
    html += `
      <section id="attributes">
        <h3>Attributes</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
${attrs.map(attr => `            <tr>
              <td><code>${escapeHtml(attr.name)}</code></td>
              <td><code>${escapeHtml(attr.type?.text || 'string')}</code></td>
              <td><code>${escapeHtml(attr.default || '-')}</code></td>
              <td>${escapeHtml(attr.description || '')}</td>
            </tr>`).join('\n')}
          </tbody>
        </table>
      </section>
`;
  }

  // Properties
  const props = (element.members || []).filter(m => m.kind === 'field' && !m.static);
  if (props.length > 0) {
    html += `
      <section id="properties">
        <h3>Properties</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
${props.map(prop => `            <tr>
              <td><code>${escapeHtml(prop.name)}</code></td>
              <td><code>${escapeHtml(prop.type?.text || 'unknown')}</code></td>
              <td>${escapeHtml(prop.description || '')}</td>
            </tr>`).join('\n')}
          </tbody>
        </table>
      </section>
`;
  }

  // Methods
  const methods = (element.members || []).filter(m => m.kind === 'method' && !m.static);
  if (methods.length > 0) {
    html += `
      <section id="methods">
        <h3>Methods</h3>
${methods.map(method => {
  const params = (method.parameters || [])
    .map(p => `${p.name}: ${p.type?.text || 'unknown'}`)
    .join(', ');
  const returnType = method.return?.type?.text || 'void';
  return `        <h4>${escapeHtml(method.name)}()</h4>
        <pre class="method-signature"><code>${escapeHtml(method.name)}(${escapeHtml(params)}): ${escapeHtml(returnType)}</code></pre>
        ${method.description ? `<p>${escapeHtml(method.description)}</p>` : ''}
`;
}).join('\n')}
      </section>
`;
  }

  // CSS Custom Properties
  const cssProps = element.cssProperties || [];
  if (cssProps.length > 0) {
    html += `
      <section id="css-properties">
        <h3>CSS Custom Properties</h3>
        <p>Use these to customize the appearance:</p>
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
${cssProps.map(prop => `            <tr>
              <td><code>${escapeHtml(prop.name)}</code></td>
              <td><code>${escapeHtml(prop.default || '-')}</code></td>
              <td>${escapeHtml(prop.description || '')}</td>
            </tr>`).join('\n')}
          </tbody>
        </table>
      </section>
`;
  }

  // CSS Parts
  const cssParts = element.cssParts || [];
  if (cssParts.length > 0) {
    html += `
      <section id="css-parts">
        <h3>CSS Parts</h3>
        <p>Style internal elements using <code>::part()</code>:</p>
        <table>
          <thead>
            <tr>
              <th>Part</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
${cssParts.map(part => `            <tr>
              <td><code>${escapeHtml(part.name)}</code></td>
              <td>${escapeHtml(part.description || '')}</td>
            </tr>`).join('\n')}
          </tbody>
        </table>
      </section>
`;
  }

  // Events
  const events = element.events || [];
  if (events.length > 0) {
    html += `
      <section id="events">
        <h3>Events</h3>
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
${events.map(event => `            <tr>
              <td><code>${escapeHtml(event.name)}</code></td>
              <td>${escapeHtml(event.description || '')}</td>
            </tr>`).join('\n')}
          </tbody>
        </table>
      </section>
`;
  }

  return html;
}

generateDocs();
