# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-05-11

### Added
- **Vanilla Breeze compatibility.** Theming surface is now exposed via a stable
  `--bc-*` namespace, mirroring the `--cb-*` (code-block) and
  `--browser-window-*` conventions used by sibling components. Tokens set on the
  host (or any ancestor — they inherit through the Shadow DOM) override the
  per-theme defaults, so VB's `external-components.css` token bridge can map
  semantic tokens (`--color-surface`, `--color-text`, `--color-warning`, …) onto
  the component with no per-page CSS.
- `docs/vanilla-breeze-bridge.css` — reference snippet for the
  `browser-console { … }` block that gets added to vanilla-breeze's
  `src/utils/external-components.css`.

### Changed
- **BREAKING:** All CSS custom properties are now prefixed `--bc-*`. Internal
  per-theme defaults live behind `--_bc-*` and are not part of the public API.
  - `--bg-primary` → `--bc-bg-primary`
  - `--bg-secondary` → `--bc-bg-secondary`
  - `--bg-tertiary` → `--bc-bg-tertiary`
  - `--bg-hover` → `--bc-bg-hover`
  - `--bg-warn` → `--bc-bg-warn`
  - `--bg-error` → `--bc-bg-error`
  - `--border-color` → `--bc-border-color`
  - `--text-primary` → `--bc-text-primary`
  - `--text-secondary` → `--bc-text-secondary`
  - `--color-log` / `--color-info` / `--color-warn` / `--color-error` /
    `--color-debug` / `--color-table` / `--color-time` → `--bc-color-*`
  - `--value-string` / `--value-number` / `--value-boolean` / `--value-null` /
    `--value-function` / `--value-date` / `--value-regexp` / `--value-element`
    → `--bc-value-*`
  - `--btn-bg` / `--btn-border` / `--btn-hover` / `--btn-active` → `--bc-btn-*`
  - `--table-border` / `--table-header-bg` / `--table-row-hover` →
    `--bc-table-*`
  - `--scrollbar-track` / `--scrollbar-thumb` / `--scrollbar-thumb-hover` →
    `--bc-scrollbar-*`
- Removed legacy aliases `--accent-color`, `--log-color`, `--info-color`,
  `--warn-color`, `--error-color`, `--debug-color` (these were documented in
  JSDoc but unused by the component; folded into the explicit `--bc-color-*`
  set).
- Internal default tokens (`--_bc-*`) are no longer overridable — set the public
  `--bc-*` tokens instead.

### Migration

```css
/* Before (1.0.x) */
browser-console {
  --bg-primary: #0d1117;
  --text-primary: #c9d1d9;
  --color-error: #f85149;
}

/* After (1.1.x) */
browser-console {
  --bc-bg-primary: #0d1117;
  --bc-text-primary: #c9d1d9;
  --bc-color-error: #f85149;
}
```

Consumers using the dark/light defaults via the `theme` attribute need no
changes — only callers that overrode CSS custom properties.

## [1.0.0] - 2024-12-29

### Added

#### Console Methods
- `console.group()` / `console.groupEnd()` - Collapsible log groups with visual indentation
- `console.groupCollapsed()` - Creates a collapsed group (click to expand)
- `console.trace()` - Displays stack trace with expandable view
- `console.count()` / `console.countReset()` - Labeled counters with running totals
- `console.dir()` - Object inspection with expanded view
- `console.timeLog()` - Logs elapsed time without stopping the timer

#### Data Types
- BigInt formatting with `n` suffix
- Map instances with key-value pair display
- Set instances with value display
- Symbol keys in objects with proper formatting

#### Features
- Text search/filter with debounced input
- Copy logs to clipboard as plain text
- Expansion state preservation during filter changes
- Improved circular reference detection (shared across log arguments)

#### Accessibility
- ARIA landmarks (`region`, `toolbar`, `log`)
- Keyboard navigation for expand/collapse (Enter, Space)
- Button groups with proper labeling
- Focus management for interactive elements

#### Documentation
- CSS custom properties documentation
- Installation options (npm, CDN, direct download)
- Updated TypeScript definitions with new methods/properties

### Changed
- `escapeHtml()` now uses string replacement instead of DOM manipulation (performance improvement)
- Circular reference detection now uses shared WeakSet across all arguments in a log entry

### Fixed
- Expansion states no longer lost when filtering logs
- Circular references now properly detected when same object appears in multiple arguments

## [0.1.0] - 2024-01-01

### Added
- Initial release
- Basic console method support: log, info, warn, error, debug
- `console.table()` with HTML table rendering
- `console.time()` / `console.timeEnd()` timer tracking
- Light and dark themes
- Filter by log level
- Expandable objects and arrays
- Syntax highlighting for different data types
- Shadow DOM encapsulation
- Zero dependencies
