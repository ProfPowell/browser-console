# Browser Console API Reference

> Auto-generated from [custom-elements.json](../custom-elements.json)

## `<browser-console>`

BrowserConsole Web Component
A vanilla JavaScript web component for capturing and displaying console logs
with syntax highlighting, type-aware formatting, and accessibility support.

### Attributes

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `string` | `dark` | Color theme ('dark' or 'light') |
| `max-logs` | `number` | `1000` | Maximum number of logs to retain |
| `auto-hook` | `string` | `true` | Whether to automatically hook console methods |

### Properties

| Name | Type | Description |
|------|------|-------------|
| `logs` | `Array` | Array of captured log entries |
| `originalConsole` | `Object<string, Function>` | Original console methods for restoration |
| `filter` | `string|null` | Current log filter (null shows all) |
| `maxLogs` | `number` | Maximum logs to retain |
| `timers` | `Object<string, number>` | Timer tracking for console.time/timeEnd |
| `counters` | `Object<string, number>` | Counter tracking for console.count |
| `theme` | `string` | Current theme ('dark' or 'light') |
| `searchQuery` | `string` | Current search/filter query |
| `groupDepth` | `number` | Current console.group nesting depth |
| `groupStack` | `Array<{label: string, collapsed: boolean, id: string}>` | Stack of open groups |

### Methods

#### `updateTheme(): void`

Update theme

#### `setTheme(theme: unknown): void`

Set theme programmatically

#### `hookConsole(): void`

Hook into console methods to capture logs

#### `unhookConsole(): void`

Restore original console methods

#### `addLog(log: unknown): void`

Add a log entry

#### `appendLog(log: unknown): void`

Append a single log to the view (Incremental Rendering)

#### `clearLogs(): void`

Clear all logs

#### `formatValuePlainText(value: *, depth: number): string`

Format a value as plain text for clipboard

#### `formatLogsForClipboard(): string`

Format logs for clipboard as plain text

#### `copyLogs(): void`

Copy visible logs to clipboard

#### `setFilter(filter: string|null): void`

Set filter for log methods

#### `setSearchQuery(query: string): void`

Set search query for text filtering

#### `matchesFilters(log: Object): boolean`

Check if a log entry matches current filters

#### `render(): void`

Initial render of the component structure

#### `getExpansionStates(): Map<string, boolean>`

Get current expansion states from DOM

#### `restoreExpansionStates(states: Map<string, boolean>): void`

Restore expansion states after render

#### `renderLogs(): void`

Render all logs with expansion state preservation

#### `renderLog(log: unknown, index: unknown): void`

Render a single log entry

#### `formatTimestamp(date: unknown): void`

Format timestamp

#### `formatLogData(data: Array, method: string, logIndex: number): string`

Format log data for display

#### `formatTable(data: unknown): void`

Format table data

#### `formatValue(value: *, depth: number, expanded: boolean, visited: WeakSet, path: string): void`

Format a single value

#### `formatArray(arr: Array, depth: number, expanded: boolean, visited: WeakSet, path: string): void`

Format an array

#### `formatObject(obj: Object, depth: number, expanded: boolean, visited: WeakSet, path: string): void`

Format an object

#### `formatElement(element: unknown): void`

Format a DOM element

#### `formatMap(map: Map, depth: number, visited: WeakSet, path: string): void`

Format a Map

#### `formatSet(set: Set, depth: number, visited: WeakSet, path: string): void`

Format a Set

#### `getType(value: *): string`

Get the type of a value

#### `escapeHtml(text: string): string`

Escape HTML for safe display

#### `toggleExpand(header: HTMLElement): void`

Toggle expand/collapse state of an expandable header

#### `handleLogClick(e: unknown): void`

Handle clicks on log entries (delegated)

#### `handleLogKeydown(e: KeyboardEvent): void`

Handle keyboard events on log entries (delegated)

#### `getStyles(): void`

Get component styles

### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--bg-primary` | `#1e1e1e` | Primary background color |
| `--bg-secondary` | `#252526` | Secondary background color (header) |
| `--bg-hover` | `#2a2d2e` | Hover state background |
| `--text-primary` | `#d4d4d4` | Primary text color |
| `--text-secondary` | `#808080` | Secondary text color (timestamps) |
| `--border-color` | `#3c3c3c` | Border color |
| `--accent-color` | `#0078d4` | Accent color for active states |
| `--log-color` | `#d4d4d4` | console.log text color |
| `--info-color` | `#3794ff` | console.info text color |
| `--warn-color` | `#cca700` | console.warn text color |
| `--error-color` | `#f14c4c` | console.error text color |
| `--debug-color` | `#b5cea8` | console.debug text color |

### CSS Parts

| Part | Description |
|------|-------------|
| `header` | The console header containing filters and actions |
| `logs` | The scrollable log entries container |
| `filter-button` | Filter buttons (All, Log, Info, Warn, Error) |
| `action-button` | Action buttons (theme toggle, copy, clear) |
| `log-entry` | Individual log entry row |

### Events

| Event | Description |
|-------|-------------|
| `log` | Dispatched when a new log entry is added |
| `clear` | Dispatched when console is cleared |
| `theme-change` | Dispatched when theme changes |

### Usage

```html
<browser-console></browser-console>
```
