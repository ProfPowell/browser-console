# Browser Console

A lightweight, vanilla JavaScript web component for capturing and displaying console logs with syntax highlighting and type-aware formatting.

## Installation

### npm

```bash
npm install browser-console
```

```javascript
// ES Module import
import 'browser-console';

// Or import the class directly
import { BrowserConsole } from 'browser-console';
```

### CDN

```html
<!-- From unpkg -->
<script type="module" src="https://unpkg.com/browser-console"></script>

<!-- Or from jsDelivr -->
<script type="module" src="https://cdn.jsdelivr.net/npm/browser-console"></script>
```

### Direct Download

Download `browser-console.js` and include it in your project:

```html
<script type="module" src="browser-console.js"></script>
```

## Features

- ✨ **Zero Dependencies** - Pure vanilla JavaScript, no frameworks required
- 🎨 **Syntax Highlighting** - Beautiful color-coded output for different data types
- 🔍 **Type-Aware Formatting** - Smart rendering of strings, numbers, objects, arrays, functions, and more
- 🎯 **Console Method Support** - Captures log, info, warn, error, debug, table, time/timeEnd, and more
- 📊 **Table Rendering** - Proper HTML table rendering for console.table() with full support for arrays and objects
- ⏱️ **Timer Tracking** - Automatically tracks and displays console.time/timeEnd durations
- 🌓 **Light & Dark Themes** - Switch between light and dark themes with a single click
- 📦 **Better Object Expansion** - Click to fully expand/collapse complex objects and arrays with structured view
- 🔧 **Filter by Level** - Filter logs by method type (log, info, warn, error)
- 🚀 **Performance** - Efficient rendering with configurable log limits
- 🎛️ **Easy Integration** - Just add the custom element to your HTML

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
- `console.table()` - **NEW:** Renders data as proper HTML tables (arrays, objects, array of objects)
- `console.time()` / `console.timeEnd()` - **NEW:** Tracks and displays execution time with millisecond precision
- `console.clear()` - Clears the console
- `console.count()` - Count operations (captured but basic display)
- `console.assert()` - Assertions (captured but basic display)

## Supported Data Types

The component provides intelligent formatting for:

- **Primitives**: strings, numbers, booleans, null, undefined
- **Objects**: Plain objects with expandable properties
- **Arrays**: Arrays with expandable elements
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

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `hookConsole()` | - | Hook into console methods to capture logs |
| `unhookConsole()` | - | Restore original console methods |
| `addLog(log)` | log: {method, data, timestamp} | Manually add a log entry |
| `clearLogs()` | - | Clear all captured logs |
| `setFilter(filter)` | filter: String \| null | Set the current filter |
| `setTheme(theme)` | theme: 'light' \| 'dark' | Change the color theme |

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

### Styling

The component uses Shadow DOM, so you can't directly style internal elements with external CSS. However, you can:

1. Fork the component and modify the `getStyles()` method
2. Use CSS custom properties (if implemented)
3. Style the host element:

```css
browser-console {
  border: 2px solid #333;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```

## Demo

Open `index.html` in your browser to see the interactive demo with various test cases and examples.