/**
 * BrowserConsole Web Component
 * A vanilla JavaScript web component for capturing and displaying console logs
 */

export interface LogEntry {
  method: 'log' | 'info' | 'warn' | 'error' | 'debug' | 'table' | 'time' | 'clear' | 'count' | 'assert';
  data: unknown[];
  timestamp: Date;
}

export type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug' | 'table' | 'clear' | 'time' | 'timeEnd' | 'count' | 'assert';

export type Theme = 'dark' | 'light';

export type Filter = 'log' | 'info' | 'warn' | 'error' | null;

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

  /** Current theme */
  theme: Theme;

  constructor();

  /** Lifecycle callback when element is added to DOM */
  connectedCallback(): void;

  /** Lifecycle callback when element is removed from DOM */
  disconnectedCallback(): void;

  /** Observed attributes for the component */
  static readonly observedAttributes: string[];

  /** Lifecycle callback when observed attribute changes */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;

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
}

export default BrowserConsole;

// Extend HTMLElementTagNameMap for proper typing with document.querySelector
declare global {
  interface HTMLElementTagNameMap {
    'browser-console': BrowserConsole;
  }
}
