# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser Console is a zero-dependency, vanilla JavaScript web component (`<browser-console>`) that captures and displays browser console output with syntax highlighting and type-aware formatting. It intercepts console methods and renders logs in a styled Shadow DOM interface.

## Development

This is a simple static web project with no build tools or package manager:

- **Run locally**: Open `index.html` in a browser
- **No build step**: Pure vanilla JS, no transpilation needed
- **No dependencies**: No npm/yarn required

## Architecture

### Single Component Design

The entire component is in `browser-console.js` as a single `BrowserConsole` class extending `HTMLElement`. Key responsibilities:

- **Console hooking** (`hookConsole()`): Overrides `console.log/info/warn/error/debug/table/time/timeEnd/clear` methods, stores originals in `this.originalConsole`, captures calls to `this.logs` array
- **Value formatting** (`formatValue()`): Recursive type detection and HTML rendering with expandable containers for objects/arrays (depth-limited to 2 levels)
- **Table rendering** (`formatTable()`): Handles `console.table()` for arrays-of-objects, simple arrays, and plain objects
- **Theming**: CSS variables in `:root` with `[data-theme="light/dark"]` selectors, switchable via `setTheme()` or attribute

### Shadow DOM Structure

```
browser-console (host)
└── .console-feed (themed container)
    ├── .console-header (filters + actions)
    │   ├── .console-filters (All/Log/Info/Warn/Error buttons)
    │   └── .console-actions (theme toggle + clear)
    └── .console-logs (scrollable log entries)
```

### Data Flow

1. `hookConsole()` wraps native console methods
2. Each console call triggers `addLog()` which pushes to `this.logs` array
3. `renderLogs()` regenerates all visible HTML from logs array
4. `attachLogListeners()` adds expand/collapse handlers for objects/arrays

## Key Implementation Details

- Timers tracked in `this.timers` object using `performance.now()` for precision
- Log entries limited by `this.maxLogs` (default 1000), oldest removed first
- HTML escaping via temp div's `textContent`/`innerHTML` conversion
- Expandable items use random IDs (`obj_xxx`/`arr_xxx`) for targeting
