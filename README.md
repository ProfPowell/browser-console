# Browser Console

A lightweight, vanilla JavaScript web component for capturing and displaying console logs with syntax highlighting and type-aware formatting.

## Installation

### npm

```bash
npm install @profpowell/browser-console
```

```javascript
// ES Module import
import '@profpowell/browser-console';

// Or import the class directly
import { BrowserConsole } from '@profpowell/browser-console';
```

### CDN

```html
<!-- From unpkg -->
<script type="module" src="https://unpkg.com/@profpowell/browser-console"></script>

<!-- Or from jsDelivr -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@profpowell/browser-console"></script>
```

### Direct Download

Download `browser-console.min.js` from the [releases page](https://github.com/ProfPowell/browser-console/releases) and include it in your project:

```html
<script type="module" src="browser-console.min.js"></script>
```

## Features

- **Zero Dependencies** - Pure vanilla JavaScript, no frameworks required
- **Syntax Highlighting** - Beautiful color-coded output for different data types
- **Type-Aware Formatting** - Smart rendering of strings, numbers, BigInt, objects, arrays, Map, Set, Symbol, and more
- **Console Method Support** - Captures log, info, warn, error, debug, table, time/timeEnd/timeLog, group/groupEnd, trace, count, dir
- **Table Rendering** - Proper HTML table rendering for console.table() with full support for arrays and objects
- **Timer Tracking** - Automatically tracks and displays console.time/timeEnd/timeLog durations
- **Light & Dark Themes** - Switch between light and dark themes with a single click
- **Better Object Expansion** - Click to fully expand/collapse complex objects and arrays with structured view
- **Filter by Level** - Filter logs by method type (log, info, warn, error)
- **Text Search** - Filter logs by searching text content
- **Copy to Clipboard** - Export all logs or filtered logs as plain text
- **Console Groups** - Collapsible console.group/groupCollapsed with visual indentation
- **Stack Traces** - console.trace displays full stack trace with expandable view
- **Performance** - Efficient rendering with configurable log limits
- **Accessible** - ARIA landmarks, keyboard navigation, screen reader support
- **Easy Integration** - Just add the custom element to your HTML
- **CSS Customizable** - Full theming via CSS custom properties

## Quick Start

### 1. Include the Component

```html
<!DOCTYPE html>
<html>
<head>
  <title>Browser Console Demo</title>
</head>
<body>
  <browser-console></browser-console>

  <script src="browser-console.js"></script>
  <script>
    console.log('Hello, World!');
    console.warn('This is a warning');
    console.error('This is an error');
  </script>
</body>
</html>
```

### 2. Style the Container

```css
browser-console {
  display: block;
  width: 100%;
  height: 400px;
}
```

That's it! The component will automatically hook into console methods and display all logs.

## Usage

### Basic Usage

```html
<browser-console></browser-console>
```

The component automatically hooks into all console methods when connected to the DOM.

### Theme Selection

```html
<!-- Dark theme (default) -->
<browser-console theme="dark"></browser-console>

<!-- Light theme -->
<browser-console theme="light"></browser-console>
```

### Disable Auto-Hook

```html
<browser-console auto-hook="false"></browser-console>
```

### Manual Control

```javascript
const feed = document.querySelector('browser-console');

// Hook console methods
feed.hookConsole();

// Unhook console methods
feed.unhookConsole();

// Clear all logs
feed.clearLogs();

// Change theme programmatically
feed.setTheme('light'); // or 'dark'

// Set filter (null, 'log', 'info', 'warn', 'error')
feed.setFilter('error');

// Manually add a log
feed.addLog({
  method: 'log',
  data: ['Custom message', { foo: 'bar' }],
  timestamp: new Date()
});
```

## Supported Console Methods

The component intercepts and displays the following console methods:

- `console.log()` - Standard logging
- `console.info()` - Informational messages
- `console.warn()` - Warning messages
- `console.error()` - Error messages
- `console.debug()` - Debug messages
- `console.table()` - Renders data as proper HTML tables (arrays, objects, array of objects)
- `console.time()` / `console.timeEnd()` - Tracks and displays execution time with millisecond precision
- `console.timeLog()` - Logs elapsed time without stopping the timer
- `console.group()` / `console.groupEnd()` - Collapsible log groups with visual indentation
- `console.groupCollapsed()` - Creates a collapsed group (click to expand)
- `console.trace()` - Displays stack trace with expandable view
- `console.count()` / `console.countReset()` - Labeled counters with running totals
- `console.dir()` - Object inspection with expanded view
- `console.clear()` - Clears the console
- `console.assert()` - Assertions (captured but basic display)

## Supported Data Types

The component provides intelligent formatting for:

- **Primitives**: strings, numbers, booleans, null, undefined
- **BigInt**: Large integer values with `n` suffix
- **Symbol**: Symbol descriptions with proper formatting
- **Objects**: Plain objects with expandable properties
- **Arrays**: Arrays with expandable elements
- **Map**: Map instances with key-value pair display
- **Set**: Set instances with value display
- **Functions**: Function definitions with preview
- **Dates**: ISO formatted dates
- **RegExp**: Regular expression patterns
- **Errors**: Error objects with stack traces
- **DOM Elements**: HTML elements with tag, id, and class display

## Features in Detail

### Syntax Highlighting

Different data types are color-coded for easy identification:
- Strings: orange
- Numbers: light green
- Booleans: blue
- null/undefined: gray italic
- Functions: yellow
- Objects/Arrays: white
- Errors: red
- Dates: cyan
- RegExp: dark red
- DOM Elements: teal

### Log Level Styling

Different console methods have distinct visual styles:
- `log`: Blue accent
- `info`: Light blue accent
- `warn`: Yellow accent with warning background
- `error`: Red accent with error background
- `debug`: Purple accent

### Table Rendering (NEW)

The component now renders `console.table()` calls as proper HTML tables:

- **Array of Objects**: Displays with column headers for each property
- **Simple Arrays**: Shows index and value columns
- **Plain Objects**: Renders key-value pairs in table format
- Styled tables with hover effects and proper borders
- Supports both light and dark themes

```javascript
console.table([
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'User' }
]);
```

### Timer Tracking (NEW)

Automatically tracks performance timings with `console.time()` and `console.timeEnd()`:

- Tracks multiple named timers simultaneously
- Displays duration in milliseconds with 2 decimal precision
- Uses `performance.now()` for high-precision timing
- Formatted with special timer icon and color

```javascript
console.time('my-operation');
// ... some code ...
console.timeEnd('my-operation'); // Shows: my-operation: 123.45ms
```

### Themes (NEW)

Switch between light and dark themes:

- **Dark Theme**: Developer-friendly with VS Code-inspired colors (default)
- **Light Theme**: Clean, bright theme for daytime use
- Click the ☀️ button in the console header to toggle
- Set programmatically with `setTheme('light')` or `setTheme('dark')`
- Set via attribute: `<browser-console theme="light"></browser-console>`
- Smooth transitions between themes

### Object & Array Expansion (NEW)

Enhanced expandable view for objects and arrays:

- Click the ▶ icon to expand and view all properties
- Shows type label (e.g., "Array(5)", "Object")
- Properly formatted property list when expanded
- Nested expandable items for deep object inspection
- Unique IDs for each expandable section

### Filtering

Click the filter buttons in the header to show only specific log levels:
- All
- Log
- Info
- Warn
- Error

### Performance

- Configurable maximum log entries (default: 1000)
- Efficient re-rendering on log additions
- Automatic cleanup of old logs
- Limited depth for nested objects to prevent performance issues

## API Reference

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `auto-hook` | boolean | true | Automatically hook console methods on mount |
| `theme` | 'dark' \| 'light' | 'dark' | Color theme for the console display |

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `logs` | Array | [] | Array of captured log entries |
| `filter` | String \| null | null | Current filter ('log', 'info', 'warn', 'error', or null for all) |
| `maxLogs` | Number | 1000 | Maximum number of logs to keep |
| `theme` | String | 'dark' | Current theme ('light' or 'dark') |
| `timers` | Object | {} | Internal timer tracking for console.time/timeEnd |
| `counters` | Object | {} | Counter tracking for console.count |
| `searchQuery` | String | '' | Current search filter text |
| `groupDepth` | Number | 0 | Current nesting depth for console.group |
| `groupStack` | Array | [] | Stack of open groups |

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `hookConsole()` | - | Hook into console methods to capture logs |
| `unhookConsole()` | - | Restore original console methods |
| `addLog(log)` | log: {method, data, timestamp} | Manually add a log entry |
| `clearLogs()` | - | Clear all captured logs |
| `setFilter(filter)` | filter: String \| null | Set the current filter |
| `setTheme(theme)` | theme: 'light' \| 'dark' | Change the color theme |
| `setSearchQuery(query)` | query: String | Filter logs by search text |
| `copyLogs()` | - | Copy all visible logs to clipboard (async) |
| `getExpansionStates()` | - | Get Map of current expand/collapse states |
| `restoreExpansionStates(states)` | states: Map | Restore expand/collapse states |

### Events

The component doesn't emit custom events currently, but you can extend it to do so.

## Examples

### Example 1: Different Data Types

```javascript
console.log('String:', 'Hello World');
console.log('Number:', 42, 3.14);
console.log('Boolean:', true, false);
console.log('Null:', null);
console.log('Undefined:', undefined);
console.log('Array:', [1, 2, 3, 4, 5]);
console.log('Object:', { name: 'John', age: 30 });
```

### Example 2: Complex Objects

```javascript
const user = {
  name: 'Jane Smith',
  profile: {
    age: 28,
    location: {
      city: 'San Francisco',
      state: 'CA'
    }
  },
  hobbies: ['coding', 'reading']
};

console.log(user);
```

### Example 3: Error Handling

```javascript
try {
  throw new Error('Something went wrong!');
} catch (error) {
  console.error('Caught error:', error);
}
```

### Example 4: Timer Tracking (NEW)

```javascript
// Start a timer
console.time('data-processing');

// Simulate some work
const data = Array.from({ length: 1000 }, (_, i) => i * 2);
const sum = data.reduce((a, b) => a + b, 0);

// End timer - displays duration
console.timeEnd('data-processing'); // Output: data-processing: 2.35ms

// Multiple simultaneous timers
console.time('timer-1');
console.time('timer-2');
setTimeout(() => console.timeEnd('timer-1'), 100);
setTimeout(() => console.timeEnd('timer-2'), 200);
```

### Example 5: Table Data (ENHANCED)

```javascript
const users = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'User' },
  { id: 3, name: 'Charlie', role: 'Moderator' }
];

console.table(users);
```

## Browser Support

This component uses:
- Custom Elements (Web Components)
- Shadow DOM
- ES6+ JavaScript features

Supported browsers:
- Chrome 54+
- Firefox 63+
- Safari 10.1+
- Edge 79+

## Customization

### Styling the Host Element

```css
browser-console {
  display: block;
  height: 400px;
  border: 2px solid #333;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```

### CSS Custom Properties

The component supports extensive theming via CSS custom properties. Override these in your stylesheet to customize colors:

#### Background Colors
| Property | Description |
|----------|-------------|
| `--bg-primary` | Main background color |
| `--bg-secondary` | Header/toolbar background |
| `--bg-tertiary` | Search input, code blocks |
| `--bg-hover` | Hover state background |
| `--bg-warn` | Warning log background |
| `--bg-error` | Error log background |

#### Text Colors
| Property | Description |
|----------|-------------|
| `--text-primary` | Main text color |
| `--text-secondary` | Timestamps, labels |
| `--border-color` | Borders and dividers |

#### Log Level Colors
| Property | Description |
|----------|-------------|
| `--color-log` | Log level accent |
| `--color-info` | Info level accent |
| `--color-warn` | Warning level accent |
| `--color-error` | Error level accent |
| `--color-debug` | Debug level accent |
| `--color-table` | Table method accent |
| `--color-time` | Timer method accent |

#### Value Type Colors
| Property | Description |
|----------|-------------|
| `--value-string` | String values |
| `--value-number` | Number/BigInt values |
| `--value-boolean` | Boolean values |
| `--value-null` | null/undefined values |
| `--value-function` | Function values |
| `--value-date` | Date values |
| `--value-regexp` | RegExp values |
| `--value-element` | DOM element values |

#### UI Element Colors
| Property | Description |
|----------|-------------|
| `--btn-bg` | Button background |
| `--btn-border` | Button border |
| `--btn-hover` | Button hover state |
| `--btn-active` | Active/pressed button |
| `--table-border` | Table borders |
| `--table-header-bg` | Table header background |
| `--table-row-hover` | Table row hover |
| `--scrollbar-track` | Scrollbar track |
| `--scrollbar-thumb` | Scrollbar thumb |
| `--scrollbar-thumb-hover` | Scrollbar thumb hover |

#### Example: Custom Dark Theme

```css
browser-console {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --text-primary: #c9d1d9;
  --color-log: #58a6ff;
  --color-error: #f85149;
  --value-string: #a5d6ff;
  --value-number: #79c0ff;
}
```

## Demo

Open `index.html` in your browser to see the interactive demo with various test cases and examples.