/**
 * BrowserConsole Web Component
 * A vanilla JavaScript web component for capturing and displaying console logs
 * @module browser-console
 */

export interface LogEntry {
  method: 'log' | 'info' | 'warn' | 'error' | 'debug' | 'table' | 'time' | 'clear' | 'count' | 'assert' | 'group' | 'trace' | 'dir';
  data: unknown[];
  timestamp: Date;
  /** Current group nesting depth when log was created */
  groupDepth?: number;
  /** Whether this group starts collapsed (for group method) */
  collapsed?: boolean;
  /** Unique ID for group (for group method) */
  groupId?: string;
  /** Stack trace string (for trace method) */
  stack?: string;
}

export type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'table' | 'clear' | 'time' | 'timeEnd' | 'timeLog' | 'count' | 'countReset' | 'assert' | 'group' | 'groupCollapsed' | 'groupEnd' | 'trace' | 'dir';

/** Group stack entry for tracking nested console.group calls */
export interface GroupStackEntry {
  label: string;
  collapsed: boolean;
  id: string;
}

export type Theme = 'dark' | 'light';

export type Filter = 'log' | 'info' | 'warn' | 'error' | null;

export type ValueType =
  | 'null'
  | 'undefined'
  | 'string'
  | 'number'
  | 'bigint'
  | 'boolean'
  | 'symbol'
  | 'function'
  | 'array'
  | 'object'
  | 'map'
  | 'set'
  | 'element';

/**
 * BrowserConsole Web Component
 * Captures and displays browser console output with syntax highlighting
 */
export class BrowserConsole extends HTMLElement {
  /** Array of captured log entries */
  logs: LogEntry[];

  /** Storage for original console methods */
  originalConsole: Partial<Record<ConsoleMethod, (...args: unknown[]) => void>>;

  /** Current log filter (null shows all) */
  filter: Filter;

  /** Maximum number of logs to retain (default: 1000) */
  maxLogs: number;

  /** Timer tracking for console.time/timeEnd */
  timers: Record<string, number>;

  /** Counter tracking for console.count */
  counters: Record<string, number>;

  /** Current theme */
  theme: Theme;

  /** Current search query for filtering logs */
  searchQuery: string;

  /** Current group nesting depth */
  groupDepth: number;

  /** Stack of open groups */
  groupStack: GroupStackEntry[];

  constructor();

  // ========== Lifecycle Methods ==========

  /** Lifecycle callback when element is added to DOM */
  connectedCallback(): void;

  /** Lifecycle callback when element is removed from DOM */
  disconnectedCallback(): void;

  /** Observed attributes for the component */
  static readonly observedAttributes: string[];

  /** Lifecycle callback when observed attribute changes */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;

  // ========== Public API ==========

  /** Hook into console methods to capture logs */
  hookConsole(): void;

  /** Restore original console methods */
  unhookConsole(): void;

  /** Add a log entry */
  addLog(log: LogEntry): void;

  /** Clear all logs */
  clearLogs(): void;

  /** Set filter for log methods */
  setFilter(filter: Filter): void;

  /** Set theme programmatically */
  setTheme(theme: Theme): void;

  /** Update theme based on current theme property */
  updateTheme(): void;

  /** Set search query and filter logs */
  setSearchQuery(query: string): void;

  /** Check if a log matches current filters (level and search) */
  matchesFilters(log: LogEntry): boolean;

  /** Copy all visible logs to clipboard */
  copyLogs(): Promise<void>;

  /** Format logs as plain text for clipboard */
  formatLogsForClipboard(): string;

  /** Format a single value as plain text */
  formatValuePlainText(value: unknown): string;

  /** Get current expansion states for all expandable items */
  getExpansionStates(): Map<string, boolean>;

  /** Restore expansion states after re-render */
  restoreExpansionStates(states: Map<string, boolean>): void;

  // ========== Rendering Methods ==========

  /** Initial render of the component structure */
  render(): void;

  /** Render all logs (full re-render) */
  renderLogs(): void;

  /** Render a single log entry to HTML string */
  renderLog(log: LogEntry, index: number): string;

  /** Append a single log to the view (incremental rendering) */
  appendLog(log: LogEntry): void;

  /** Get component CSS styles */
  getStyles(): string;

  // ========== Formatting Methods ==========

  /** Format log data for display */
  formatLogData(data: unknown[], method: string, logIndex: number): string;

  /** Format a single value with type-aware rendering */
  formatValue(
    value: unknown,
    depth?: number,
    expanded?: boolean,
    visited?: WeakSet<object>,
    path?: string
  ): string;

  /** Format an array with expandable view */
  formatArray(
    arr: unknown[],
    depth: number,
    expanded: boolean,
    visited: WeakSet<object>,
    path: string
  ): string;

  /** Format an object with expandable view */
  formatObject(
    obj: object,
    depth: number,
    expanded: boolean,
    visited: WeakSet<object>,
    path: string
  ): string;

  /** Format a Map with expandable view */
  formatMap(
    map: Map<unknown, unknown>,
    depth: number,
    visited: WeakSet<object>,
    path: string
  ): string;

  /** Format a Set with expandable view */
  formatSet(
    set: Set<unknown>,
    depth: number,
    visited: WeakSet<object>,
    path: string
  ): string;

  /** Format a DOM element */
  formatElement(element: HTMLElement): string;

  /** Format table data for console.table() */
  formatTable(data: unknown): string;

  /** Format timestamp for display */
  formatTimestamp(date: Date): string;

  // ========== Utility Methods ==========

  /** Get the type of a value */
  getType(value: unknown): ValueType;

  /** Escape HTML for safe display */
  escapeHtml(text: string): string;

  // ========== Event Handlers ==========

  /** Toggle expand/collapse state of an expandable header */
  toggleExpand(header: HTMLElement): void;

  /** Handle clicks on log entries (delegated) */
  handleLogClick(e: MouseEvent): void;

  /** Handle keyboard events on log entries (delegated) */
  handleLogKeydown(e: KeyboardEvent): void;
}

export default BrowserConsole;

// Extend HTMLElementTagNameMap for proper typing with document.querySelector
declare global {
  interface HTMLElementTagNameMap {
    'browser-console': BrowserConsole;
  }
}
