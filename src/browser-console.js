/**
 * BrowserConsole Web Component
 * A vanilla JavaScript web component for capturing and displaying console logs
 * with syntax highlighting, type-aware formatting, and accessibility support.
 *
 * @element browser-console
 * @tagname browser-console
 *
 * @attr {string} [theme=dark] - Color theme ('dark' or 'light')
 * @attr {string} [auto-hook=true] - Whether to automatically hook console methods
 * @attr {number} [max-logs=1000] - Maximum number of logs to retain
 *
 * @prop {Array} logs - Array of captured log entries
 * @prop {string} theme - Current theme ('dark' or 'light')
 * @prop {number} maxLogs - Maximum logs to retain
 * @prop {string} searchQuery - Current search/filter query
 * @prop {number} groupDepth - Current console.group nesting depth
 *
 * @csspart header - The console header containing filters and actions
 * @csspart logs - The scrollable log entries container
 * @csspart filter-button - Filter buttons (All, Log, Info, Warn, Error)
 * @csspart action-button - Action buttons (theme toggle, copy, clear)
 * @csspart log-entry - Individual log entry row
 *
 * Theming uses the `--bc-*` namespace. Defaults vary by `theme` attribute
 * ("dark" | "light"); set any token on the host or an ancestor (e.g. via
 * Vanilla Breeze) to override.
 *
 * @cssprop [--bc-bg-primary] - Console background
 * @cssprop [--bc-bg-secondary] - Header / chrome background
 * @cssprop [--bc-bg-tertiary] - Inputs and stack-trace background
 * @cssprop [--bc-bg-hover] - Log row hover background
 * @cssprop [--bc-border-color] - Borders and dividers
 * @cssprop [--bc-text-primary] - Primary text
 * @cssprop [--bc-text-secondary] - Muted text (timestamps, type labels)
 * @cssprop [--bc-color-log] - console.log accent color
 * @cssprop [--bc-color-info] - console.info accent color
 * @cssprop [--bc-color-warn] - console.warn accent color
 * @cssprop [--bc-color-error] - console.error accent color
 * @cssprop [--bc-color-debug] - console.debug accent color
 * @cssprop [--bc-color-table] - console.table accent color
 * @cssprop [--bc-color-time] - console.time accent color
 * @cssprop [--bc-bg-warn] - Warn row background tint
 * @cssprop [--bc-bg-error] - Error row background tint
 * @cssprop [--bc-value-string] - String literal color
 * @cssprop [--bc-value-number] - Number literal color
 * @cssprop [--bc-value-boolean] - Boolean literal color
 * @cssprop [--bc-value-null] - null/undefined color
 * @cssprop [--bc-value-function] - Function value color
 * @cssprop [--bc-value-date] - Date value color
 * @cssprop [--bc-value-regexp] - RegExp / Symbol value color
 * @cssprop [--bc-value-element] - DOM element value color
 * @cssprop [--bc-btn-bg] - Button background
 * @cssprop [--bc-btn-border] - Button border color
 * @cssprop [--bc-btn-hover] - Button hover background
 * @cssprop [--bc-btn-active] - Active button / focus outline color
 * @cssprop [--bc-table-border] - Table cell border color
 * @cssprop [--bc-table-header-bg] - Table header background
 * @cssprop [--bc-table-row-hover] - Table row hover background
 * @cssprop [--bc-scrollbar-track] - Scrollbar track color
 * @cssprop [--bc-scrollbar-thumb] - Scrollbar thumb color
 * @cssprop [--bc-scrollbar-thumb-hover] - Scrollbar thumb hover color
 *
 * @fires log - Dispatched when a new log entry is added
 * @fires clear - Dispatched when console is cleared
 * @fires theme-change - Dispatched when theme changes
 *
 * @example
 * // HTML usage
 * <browser-console auto-hook="true" theme="dark" max-logs="1000"></browser-console>
 *
 * @example
 * // JavaScript usage
 * const console = document.querySelector('browser-console');
 * console.setTheme('light');
 * console.clearLogs();
 */
class BrowserConsole extends HTMLElement {
  /** @type {number} Default maximum number of logs to retain */
  static MAX_LOGS_DEFAULT = 1000

  /** @type {number} Maximum depth for nested object expansion */
  static MAX_DEPTH = 2

  /** @type {number} Number of items to show in array/object preview */
  static PREVIEW_ITEMS = 3

  /** @type {number} Maximum length for function preview string */
  static FUNCTION_PREVIEW_LENGTH = 50

  /**
   * Creates a new BrowserConsole instance
   * @constructor
   */
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })

    /** @type {Array<{method: string, data: unknown[], timestamp: Date}>} */
    this.logs = []

    /** @type {Object<string, Function>} Original console methods for restoration */
    this.originalConsole = {}

    /** @type {string|null} Current log filter (null shows all) */
    this.filter = null

    /** @type {number} Maximum number of logs to retain */
    this.maxLogs = BrowserConsole.MAX_LOGS_DEFAULT

    /** @type {Object<string, number>} Timer tracking for console.time/timeEnd */
    this.timers = {}

    /** @type {Object<string, number>} Counter tracking for console.count */
    this.counters = {}

    /** @type {'dark'|'light'} Current theme */
    this.theme = 'dark'

    /** @type {string} Current search query for filtering logs */
    this.searchQuery = ''

    /** @type {number} Current group nesting depth */
    this.groupDepth = 0

    /** @type {Array<{label: string, collapsed: boolean, id: string}>} Stack of open groups */
    this.groupStack = []

    this.render()
  }

  connectedCallback() {
    const autoHook = this.getAttribute('auto-hook') !== 'false'
    const theme = this.getAttribute('theme') || 'dark'
    const maxLogs = this.getAttribute('max-logs')

    this.theme = theme
    if (maxLogs) {
      this.maxLogs = parseInt(maxLogs, 10) || BrowserConsole.MAX_LOGS_DEFAULT
    }

    if (autoHook) {
      this.hookConsole()
    }

    this.updateTheme()
  }

  static get observedAttributes() {
    return ['theme', 'max-logs']
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'theme' && oldValue !== newValue) {
      this.theme = newValue || 'dark'
      this.updateTheme()
    }
    if (name === 'max-logs' && oldValue !== newValue) {
      this.maxLogs = parseInt(newValue, 10) || BrowserConsole.MAX_LOGS_DEFAULT
    }
  }

  /**
   * Update theme
   */
  updateTheme() {
    const feed = this.shadowRoot.querySelector('.console-feed')
    if (feed) {
      feed.dataset.theme = this.theme
    }
    // Update theme icon: show sun in dark mode (click for light), moon in light mode (click for dark)
    const themeIcon = this.shadowRoot.querySelector('.theme-icon')
    if (themeIcon) {
      themeIcon.textContent = this.theme === 'dark' ? '☀️' : '🌙'
    }
  }

  /**
   * Set theme programmatically
   */
  setTheme(theme) {
    this.theme = theme
    this.setAttribute('theme', theme)
  }

  disconnectedCallback() {
    this.unhookConsole()
  }

  /**
   * Hook into console methods to capture logs
   */
  hookConsole() {
    const methods = [
      'log',
      'info',
      'warn',
      'error',
      'debug',
      'table',
      'clear',
      'time',
      'timeEnd',
      'timeLog',
      'count',
      'countReset',
      'assert',
      'group',
      'groupCollapsed',
      'groupEnd',
      'trace',
      'dir'
    ]

    methods.forEach((method) => {
      this.originalConsole[method] = console[method]
      console[method] = (...args) => {
        // Call original console method
        this.originalConsole[method]?.apply(console, args)

        // Handle group methods
        if (method === 'group' || method === 'groupCollapsed') {
          const label = args[0] || 'console.group'
          const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
          this.groupStack.push({ label, collapsed: method === 'groupCollapsed', id: groupId })
          this.groupDepth++
          this.addLog({
            method: 'group',
            data: [label],
            timestamp: new Date(),
            groupDepth: this.groupDepth,
            collapsed: method === 'groupCollapsed',
            groupId
          })
          return
        }

        if (method === 'groupEnd') {
          if (this.groupDepth > 0) {
            this.groupStack.pop()
            this.groupDepth--
          }
          return
        }

        // Handle trace
        if (method === 'trace') {
          const stack = new Error().stack
            .split('\n')
            .slice(2) // Remove Error and console.trace lines
            .join('\n')
          this.addLog({
            method: 'trace',
            data: args.length ? args : ['console.trace'],
            timestamp: new Date(),
            stack,
            groupDepth: this.groupDepth
          })
          return
        }

        // Handle dir (same as log but marked for expanded view)
        if (method === 'dir') {
          this.addLog({
            method: 'dir',
            data: args,
            timestamp: new Date(),
            groupDepth: this.groupDepth
          })
          return
        }

        // Special handling for time/timeEnd/timeLog
        if (method === 'time') {
          const label = args[0] || 'default'
          this.timers[label] = performance.now()
          return
        }

        if (method === 'timeEnd') {
          const label = args[0] || 'default'
          if (this.timers[label] !== undefined) {
            const duration = performance.now() - this.timers[label]
            delete this.timers[label]
            this.addLog({
              method: 'time',
              data: [label, duration],
              timestamp: new Date(),
              groupDepth: this.groupDepth
            })
          }
          return
        }

        if (method === 'timeLog') {
          const label = args[0] || 'default'
          if (this.timers[label] !== undefined) {
            const duration = performance.now() - this.timers[label]
            const extraArgs = args.slice(1)
            this.addLog({
              method: 'time',
              data: [label, duration, ...extraArgs],
              timestamp: new Date(),
              groupDepth: this.groupDepth
            })
          }
          return
        }

        // Handle count
        if (method === 'count') {
          const label = args[0] || 'default'
          this.counters[label] = (this.counters[label] || 0) + 1
          this.addLog({
            method: 'count',
            data: [label, this.counters[label]],
            timestamp: new Date(),
            groupDepth: this.groupDepth
          })
          return
        }

        // Handle countReset
        if (method === 'countReset') {
          const label = args[0] || 'default'
          delete this.counters[label]
          return
        }

        // Capture the log with current group depth
        this.addLog({
          method,
          data: args,
          timestamp: new Date(),
          groupDepth: this.groupDepth
        })
      }
    })
  }

  /**
   * Restore original console methods
   */
  unhookConsole() {
    Object.keys(this.originalConsole).forEach((method) => {
      console[method] = this.originalConsole[method]
    })
    this.originalConsole = {}
  }

  /**
   * Add a log entry
   */
  addLog(log) {
    if (log.method === 'clear') {
      this.clearLogs()
      return
    }

    this.logs.push(log)

    // Limit number of logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Only append if it matches current filter or no filter
    if (!this.filter || this.filter === log.method) {
      this.appendLog(log)
    }
  }

  /**
   * Append a single log to the view (Incremental Rendering)
   */
  appendLog(log) {
    const logsContainer = this.shadowRoot.querySelector('.console-logs')
    if (!logsContainer) return

    // Render the log HTML
    const html = this.renderLog(log, this.logs.length - 1)

    // Insert HTML directly
    logsContainer.insertAdjacentHTML('beforeend', html)

    // Prune DOM if needed
    // We use a slightly higher limit for DOM to be safe, or exact maxLogs
    if (logsContainer.children.length > this.maxLogs) {
      logsContainer.firstElementChild.remove()
    }

    // Auto-scroll
    logsContainer.scrollTop = logsContainer.scrollHeight
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = []
    this.renderLogs()
  }

  /**
   * Format a value as plain text for clipboard
   * @param {*} value - Value to format
   * @param {number} depth - Current nesting depth
   * @returns {string} Plain text representation
   */
  formatValuePlainText(value, depth = 0) {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return `"${value}"`
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (typeof value === 'bigint') return `${value}n`
    if (typeof value === 'symbol') return value.toString()
    if (typeof value === 'function') {
      const preview = value.toString().slice(0, 50)
      return preview + (value.toString().length > 50 ? '...' : '')
    }
    if (Array.isArray(value)) {
      if (depth > 2) return `Array(${value.length})`
      return `[${value.map((v) => this.formatValuePlainText(v, depth + 1)).join(', ')}]`
    }
    if (value instanceof Date) return value.toISOString()
    if (value instanceof Error) return value.toString()
    if (value instanceof Map) return `Map(${value.size})`
    if (value instanceof Set) return `Set(${value.size})`
    if (typeof value === 'object') {
      if (depth > 2) return '{...}'
      const entries = Object.entries(value)
        .map(([k, v]) => `${k}: ${this.formatValuePlainText(v, depth + 1)}`)
        .join(', ')
      return `{${entries}}`
    }
    return String(value)
  }

  /**
   * Format logs for clipboard as plain text
   * @returns {string} Plain text representation of visible logs
   */
  formatLogsForClipboard() {
    const filteredLogs = this.logs.filter((log) => this.matchesFilters(log))

    return filteredLogs
      .map((log) => {
        const timestamp = this.formatTimestamp(log.timestamp)
        const method = log.method.toUpperCase()
        const data = log.data.map((item) => this.formatValuePlainText(item)).join(' ')
        return `[${timestamp}] [${method}] ${data}`
      })
      .join('\n')
  }

  /**
   * Copy visible logs to clipboard
   */
  async copyLogs() {
    const text = this.formatLogsForClipboard()
    const copyBtn = this.shadowRoot.querySelector('.copy-btn')
    const iconSpan = copyBtn.querySelector('.copy-icon')
    const originalIcon = iconSpan.textContent

    try {
      await navigator.clipboard.writeText(text)
      // Show success feedback
      iconSpan.textContent = '✓'
      setTimeout(() => {
        iconSpan.textContent = originalIcon
      }, 1500)
    } catch (err) {
      // Fallback for older browsers or permission denied
      console.error('Failed to copy logs:', err)
      iconSpan.textContent = '✗'
      setTimeout(() => {
        iconSpan.textContent = originalIcon
      }, 1500)
    }
  }

  /**
   * Set filter for log methods
   * @param {string|null} filter - Log method to filter by, or null for all
   */
  setFilter(filter) {
    this.filter = filter
    this.renderLogs()
  }

  /**
   * Set search query for text filtering
   * @param {string} query - Search text to filter logs by
   */
  setSearchQuery(query) {
    this.searchQuery = query.toLowerCase()
    this.renderLogs()
  }

  /**
   * Check if a log entry matches current filters
   * @param {Object} log - Log entry to check
   * @returns {boolean} True if log matches all active filters
   */
  matchesFilters(log) {
    // Check method filter
    if (this.filter && log.method !== this.filter) {
      return false
    }

    // Check text search
    if (this.searchQuery) {
      const logText = JSON.stringify(log.data).toLowerCase()
      if (!logText.includes(this.searchQuery)) {
        return false
      }
    }

    return true
  }

  /**
   * Initial render of the component structure
   */
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        ${this.getStyles()}
      </style>
      <div class="console-feed" data-theme="${this.theme}" role="region" aria-label="Console output">
        <div class="console-header" role="toolbar" aria-label="Console controls">
          <div class="console-search" role="search">
            <input
              type="search"
              class="search-input"
              placeholder="Filter logs..."
              aria-label="Search logs"
            />
          </div>
          <div class="console-filters" role="group" aria-label="Filter by log type">
            <button class="filter-btn active" data-filter="all" aria-pressed="true">All</button>
            <button class="filter-btn" data-filter="log" aria-pressed="false">Log</button>
            <button class="filter-btn" data-filter="info" aria-pressed="false">Info</button>
            <button class="filter-btn" data-filter="warn" aria-pressed="false">Warn</button>
            <button class="filter-btn" data-filter="error" aria-pressed="false">Error</button>
          </div>
          <div class="console-actions" role="group" aria-label="Console actions">
            <button class="copy-btn" title="Copy logs" aria-label="Copy all logs to clipboard">
              <span class="copy-icon" aria-hidden="true">📋</span>
            </button>
            <button class="theme-btn" title="Toggle theme" aria-label="Toggle light/dark theme">
              <span class="theme-icon" aria-hidden="true">☀️</span>
            </button>
            <button class="clear-btn" title="Clear console" aria-label="Clear all logs">
              <span class="clear-icon" aria-hidden="true">🗑️</span>
            </button>
          </div>
        </div>
        <div class="console-logs" role="log" aria-live="polite" aria-label="Console log entries"></div>
      </div>
    `

    // Attach event listeners
    this.shadowRoot.querySelector('.clear-btn').addEventListener('click', () => this.clearLogs())

    this.shadowRoot.querySelector('.copy-btn').addEventListener('click', () => this.copyLogs())

    this.shadowRoot.querySelector('.theme-btn').addEventListener('click', () => {
      this.setTheme(this.theme === 'dark' ? 'light' : 'dark')
    })

    this.shadowRoot.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.shadowRoot.querySelectorAll('.filter-btn').forEach((b) => {
          b.classList.remove('active')
          b.setAttribute('aria-pressed', 'false')
        })
        e.target.classList.add('active')
        e.target.setAttribute('aria-pressed', 'true')
        const filter = e.target.dataset.filter
        this.setFilter(filter === 'all' ? null : filter)
      })
    })

    // Search input listener with debounce
    let searchTimeout
    this.shadowRoot.querySelector('.search-input').addEventListener('input', (e) => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        this.setSearchQuery(e.target.value)
      }, 150)
    })

    // Delegated event listeners for logs (click and keyboard)
    const logsContainer = this.shadowRoot.querySelector('.console-logs')
    logsContainer.addEventListener('click', (e) => this.handleLogClick(e))
    logsContainer.addEventListener('keydown', (e) => this.handleLogKeydown(e))
  }

  /**
   * Get current expansion states from DOM
   * @returns {Map<string, boolean>} Map of element IDs to expanded state
   */
  getExpansionStates() {
    const states = new Map()
    const headers = this.shadowRoot.querySelectorAll('.expandable-header')
    headers.forEach((header) => {
      const targetId = header.dataset.target
      const isExpanded = header.getAttribute('aria-expanded') === 'true'
      if (targetId) {
        states.set(targetId, isExpanded)
      }
    })
    return states
  }

  /**
   * Restore expansion states after render
   * @param {Map<string, boolean>} states - Previously saved expansion states
   */
  restoreExpansionStates(states) {
    states.forEach((isExpanded, targetId) => {
      if (isExpanded) {
        const content = this.shadowRoot.getElementById(targetId)
        const header = this.shadowRoot.querySelector(`[data-target="${targetId}"]`)
        if (content && header) {
          content.style.display = 'block'
          header.setAttribute('aria-expanded', 'true')
          const icon = header.querySelector('.expand-icon')
          if (icon) {
            icon.textContent = '\u25BC' // Down arrow
          }
        }
      }
    })
  }

  /**
   * Render all logs with expansion state preservation
   */
  renderLogs() {
    const logsContainer = this.shadowRoot.querySelector('.console-logs')

    // Save expansion states before re-render
    const states = this.getExpansionStates()

    // Filter logs by both method and search query
    const filteredLogs = this.logs.filter((log) => this.matchesFilters(log))

    logsContainer.innerHTML = filteredLogs.map((log, index) => this.renderLog(log, index)).join('')

    // Restore expansion states after re-render
    this.restoreExpansionStates(states)
  }

  /**
   * Render a single log entry
   */
  renderLog(log, index) {
    const timestamp = this.formatTimestamp(log.timestamp)
    const methodClass = `log-${log.method}`
    const indentStyle = log.groupDepth ? `padding-left: ${log.groupDepth * 20}px;` : ''

    // Handle group rendering (collapsible)
    if (log.method === 'group') {
      const groupId = log.groupId || `group_${index}`
      const isCollapsed = log.collapsed
      return `
        <div class="log-entry log-group" data-index="${index}" style="${indentStyle}">
          <span class="log-timestamp">${timestamp}</span>
          <span class="log-method">[GROUP]</span>
          <span class="log-content">
            <span class="expandable-header group-header" data-target="${groupId}" role="button" tabindex="0" aria-expanded="${!isCollapsed}" aria-controls="${groupId}">
              <span class="expand-icon" aria-hidden="true">${isCollapsed ? '\u25B6' : '\u25BC'}</span>
              ${this.escapeHtml(log.data[0])}
            </span>
          </span>
        </div>
      `
    }

    // Handle trace rendering
    if (log.method === 'trace') {
      const traceContent = log.stack
        ? `<pre class="stack-trace">${this.escapeHtml(log.stack)}</pre>`
        : ''
      return `
        <div class="log-entry log-trace" data-index="${index}" style="${indentStyle}">
          <span class="log-timestamp">${timestamp}</span>
          <span class="log-method">[TRACE]</span>
          <div class="log-content">
            <div>${this.formatLogData(log.data, log.method, index)}</div>
            ${traceContent}
          </div>
        </div>
      `
    }

    // Handle count rendering
    if (log.method === 'count') {
      const [label, count] = log.data
      return `
        <div class="log-entry log-count" data-index="${index}" style="${indentStyle}">
          <span class="log-timestamp">${timestamp}</span>
          <span class="log-method">[COUNT]</span>
          <span class="log-content">
            <span class="value-string">${this.escapeHtml(label)}</span>:
            <span class="value-number">${count}</span>
          </span>
        </div>
      `
    }

    // Handle dir rendering (expanded objects)
    if (log.method === 'dir') {
      const visited = new WeakSet()
      const content = log.data
        .map((item, argIndex) => this.formatValue(item, 0, true, visited, `${index}_${argIndex}`))
        .join(' ')
      return `
        <div class="log-entry log-dir" data-index="${index}" style="${indentStyle}">
          <span class="log-timestamp">${timestamp}</span>
          <span class="log-method">[DIR]</span>
          <span class="log-content">${content}</span>
        </div>
      `
    }

    // Handle table rendering
    if (log.method === 'table') {
      const tableHtml = this.formatTable(log.data[0])
      return `
        <div class="log-entry ${methodClass}" data-index="${index}" style="${indentStyle}">
          <span class="log-timestamp">${timestamp}</span>
          <span class="log-method">[TABLE]</span>
          <div class="log-content">${tableHtml}</div>
        </div>
      `
    }

    // Handle time tracking (supports extra args from timeLog)
    if (log.method === 'time' && log.data.length >= 2) {
      const [label, duration, ...extraArgs] = log.data
      const extraContent = extraArgs.length ? ` ${this.formatLogData(extraArgs, 'log', index)}` : ''
      return `
        <div class="log-entry ${methodClass}" data-index="${index}" style="${indentStyle}">
          <span class="log-timestamp">${timestamp}</span>
          <span class="log-method">[TIMER]</span>
          <span class="log-content">
            <span class="value-string">${this.escapeHtml(label)}</span>:
            <span class="value-number">${duration.toFixed(2)}ms</span>${extraContent}
          </span>
        </div>
      `
    }

    return `
      <div class="log-entry ${methodClass}" data-index="${index}" style="${indentStyle}">
        <span class="log-timestamp">${timestamp}</span>
        <span class="log-method">[${log.method.toUpperCase()}]</span>
        <span class="log-content">${this.formatLogData(log.data, log.method, index)}</span>
      </div>
    `
  }

  /**
   * Format timestamp
   */
  formatTimestamp(date) {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  /**
   * Format log data for display
   * @param {Array} data - Array of values to format
   * @param {string} method - Console method name
   * @param {number} logIndex - Index of the log entry for stable IDs
   * @returns {string} Formatted HTML string
   */
  formatLogData(data, method, logIndex) {
    // Share a single WeakSet across all arguments to detect circular refs
    const visited = new WeakSet()
    return data
      .map((item, argIndex) => this.formatValue(item, 0, false, visited, `${logIndex}_${argIndex}`))
      .join(' ')
  }

  /**
   * Format table data
   */
  formatTable(data) {
    if (!data) {
      return '<span class="value-undefined">undefined</span>'
    }

    // Handle array of objects
    if (Array.isArray(data) && data.length > 0) {
      const isObjectArray = data.every((item) => typeof item === 'object' && item !== null)

      if (isObjectArray) {
        // Get all unique keys
        const keys = [...new Set(data.flatMap((obj) => Object.keys(obj)))]

        return `
          <div class="table-wrapper">
            <table class="console-table">
              <thead>
                <tr>
                  <th>(index)</th>
                  ${keys.map((key) => `<th>${this.escapeHtml(key)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data
                  .map(
                    (row, index) => `
                  <tr>
                    <td class="table-index">${index}</td>
                    ${keys.map((key) => `<td>${this.formatValue(row[key], 0, false)}</td>`).join('')}
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        `
      }

      // Simple array
      return `
        <div class="table-wrapper">
          <table class="console-table">
            <thead>
              <tr>
                <th>(index)</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (value, index) => `
                <tr>
                  <td class="table-index">${index}</td>
                  <td>${this.formatValue(value, 0, false)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
    }

    // Handle plain object
    if (typeof data === 'object' && data !== null) {
      const keys = Object.keys(data)

      return `
        <div class="table-wrapper">
          <table class="console-table">
            <thead>
              <tr>
                <th>(index)</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${keys
                .map(
                  (key) => `
                <tr>
                  <td class="table-index">${this.escapeHtml(key)}</td>
                  <td>${this.formatValue(data[key], 0, false)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
    }

    return this.formatValue(data, 0, false)
  }

  /**
   * Format a single value
   * @param {*} value - Value to format
   * @param {number} depth - Current nesting depth
   * @param {boolean} expanded - Whether to show expanded view
   * @param {WeakSet} visited - Set of visited objects for circular detection
   * @param {string} path - Stable path for generating element IDs
   */
  formatValue(value, depth = 0, expanded = false, visited = new WeakSet(), path = '0') {
    const type = this.getType(value)

    switch (type) {
      case 'string':
        return `<span class="value-string">"${this.escapeHtml(value)}"</span>`

      case 'number':
        return `<span class="value-number">${value}</span>`

      case 'bigint':
        return `<span class="value-number">${value}n</span>`

      case 'boolean':
        return `<span class="value-boolean">${value}</span>`

      case 'null':
        return `<span class="value-null">null</span>`

      case 'undefined':
        return `<span class="value-undefined">undefined</span>`

      case 'symbol':
        return `<span class="value-symbol">${this.escapeHtml(value.toString())}</span>`

      case 'function': {
        const fnStr = value.toString()
        const fnPreview =
          fnStr.length > BrowserConsole.FUNCTION_PREVIEW_LENGTH
            ? fnStr.substring(0, BrowserConsole.FUNCTION_PREVIEW_LENGTH) + '...'
            : fnStr
        return `<span class="value-function">${this.escapeHtml(fnPreview)}</span>`
      }

      case 'map': {
        if (visited.has(value)) {
          return `<span class="value-object">[Circular]</span>`
        }
        if (depth > BrowserConsole.MAX_DEPTH) {
          return `<span class="value-object">Map(${value.size})</span>`
        }
        visited.add(value)
        const mapResult = this.formatMap(value, depth, visited, path)
        visited.delete(value)
        return mapResult
      }

      case 'set': {
        if (visited.has(value)) {
          return `<span class="value-array">[Circular]</span>`
        }
        if (depth > BrowserConsole.MAX_DEPTH) {
          return `<span class="value-array">Set(${value.size})</span>`
        }
        visited.add(value)
        const setResult = this.formatSet(value, depth, visited, path)
        visited.delete(value)
        return setResult
      }

      case 'array': {
        if (visited.has(value)) {
          return `<span class="value-array">[Circular]</span>`
        }
        if (depth > BrowserConsole.MAX_DEPTH) {
          return `<span class="value-array">[Array(${value.length})]</span>`
        }
        visited.add(value)
        const arrResult = this.formatArray(value, depth, expanded, visited, path)
        visited.delete(value)
        return arrResult
      }

      case 'object': {
        if (value instanceof Error) {
          return `<span class="value-error">${this.escapeHtml(value.toString())}</span>`
        }
        if (value instanceof Date) {
          return `<span class="value-date">${value.toISOString()}</span>`
        }
        if (value instanceof RegExp) {
          return `<span class="value-regexp">${this.escapeHtml(value.toString())}</span>`
        }
        if (visited.has(value)) {
          return `<span class="value-object">[Circular]</span>`
        }
        if (depth > BrowserConsole.MAX_DEPTH) {
          return `<span class="value-object">{Object}</span>`
        }
        visited.add(value)
        const objResult = this.formatObject(value, depth, expanded, visited, path)
        visited.delete(value)
        return objResult
      }

      case 'element':
        return this.formatElement(value)

      default:
        return `<span class="value-default">${this.escapeHtml(String(value))}</span>`
    }
  }

  /**
   * Format an array
   * @param {Array} arr - Array to format
   * @param {number} depth - Current nesting depth
   * @param {boolean} expanded - Whether to show expanded view
   * @param {WeakSet} visited - Set of visited objects for circular detection
   * @param {string} path - Stable path for generating element IDs
   */
  formatArray(arr, depth, expanded, visited, path) {
    if (arr.length === 0) {
      return `<span class="value-array">[]</span>`
    }

    const id = `arr_${path}`

    // Create preview (first 3 items)
    const preview = arr
      .slice(0, BrowserConsole.PREVIEW_ITEMS)
      .map((item, i) => this.formatValue(item, depth + 1, false, visited, `${path}_${i}`))
      .join(', ')
    const suffix =
      arr.length > BrowserConsole.PREVIEW_ITEMS
        ? `, ... ${arr.length - BrowserConsole.PREVIEW_ITEMS} more`
        : ''

    // Create full expanded view
    const fullContent = arr
      .map((item, index) => {
        const value = this.formatValue(item, depth + 1, false, visited, `${path}_${index}`)
        return `<div class="object-property">
        <span class="property-key">${index}:</span>
        <span class="property-value">${value}</span>
      </div>`
      })
      .join('')

    return `
      <div class="expandable-container">
        <span class="expandable-header" data-target="${id}" role="button" tabindex="0" aria-expanded="false" aria-controls="${id}">
          <span class="expand-icon" aria-hidden="true">▶</span>
          <span class="value-array"><span class="type-label">Array(${arr.length})</span> [${preview}${suffix}]</span>
        </span>
        <div class="expandable-content" id="${id}" style="display: none;" role="region">
          ${fullContent}
        </div>
      </div>`
  }

  /**
   * Format an object
   * @param {Object} obj - Object to format
   * @param {number} depth - Current nesting depth
   * @param {boolean} expanded - Whether to show expanded view
   * @param {WeakSet} visited - Set of visited objects for circular detection
   * @param {string} path - Stable path for generating element IDs
   */
  formatObject(obj, depth, expanded, visited, path) {
    // Use Reflect.ownKeys to include Symbol keys
    const keys = Reflect.ownKeys(obj)

    if (keys.length === 0) {
      return `<span class="value-object">{}</span>`
    }

    const id = `obj_${path}`

    // Format key for display (handles Symbols)
    const formatKey = (key) => {
      if (typeof key === 'symbol') {
        return `<span class="value-symbol">${this.escapeHtml(key.toString())}</span>`
      }
      return this.escapeHtml(String(key))
    }

    // Create preview (first 3 properties)
    const preview = keys
      .slice(0, BrowserConsole.PREVIEW_ITEMS)
      .map((key, i) => {
        const value = this.formatValue(obj[key], depth + 1, false, visited, `${path}_p${i}`)
        return `${formatKey(key)}: ${value}`
      })
      .join(', ')

    const suffix =
      keys.length > BrowserConsole.PREVIEW_ITEMS
        ? `, ... ${keys.length - BrowserConsole.PREVIEW_ITEMS} more`
        : ''

    // Create full expanded view
    const fullContent = keys
      .map((key, i) => {
        const value = this.formatValue(obj[key], depth + 1, false, visited, `${path}_p${i}`)
        return `<div class="object-property">
        <span class="property-key">${formatKey(key)}:</span>
        <span class="property-value">${value}</span>
      </div>`
      })
      .join('')

    const constructorName = obj.constructor?.name || 'Object'

    return `
      <div class="expandable-container">
        <span class="expandable-header" data-target="${id}" role="button" tabindex="0" aria-expanded="false" aria-controls="${id}">
          <span class="expand-icon" aria-hidden="true">▶</span>
          <span class="value-object"><span class="type-label">${constructorName}</span> {${preview}${suffix}}</span>
        </span>
        <div class="expandable-content" id="${id}" style="display: none;" role="region">
          ${fullContent}
        </div>
      </div>`
  }

  /**
   * Format a DOM element
   */
  formatElement(element) {
    const tagName = element.tagName.toLowerCase()
    const id = element.id ? `#${element.id}` : ''
    const classes = element.className ? `.${element.className.split(' ').join('.')}` : ''

    return `<span class="value-element">&lt;${tagName}${id}${classes}&gt;</span>`
  }

  /**
   * Format a Map
   * @param {Map} map - Map to format
   * @param {number} depth - Current nesting depth
   * @param {WeakSet} visited - Set of visited objects for circular detection
   * @param {string} path - Stable path for generating element IDs
   */
  formatMap(map, depth, visited, path) {
    if (map.size === 0) {
      return `<span class="value-object">Map(0) {}</span>`
    }

    const id = `map_${path}`
    const entries = [...map.entries()]

    // Create preview (first 3 entries)
    const preview = entries
      .slice(0, BrowserConsole.PREVIEW_ITEMS)
      .map(([key, val], i) => {
        const keyStr = this.formatValue(key, depth + 1, false, visited, `${path}_k${i}`)
        const valStr = this.formatValue(val, depth + 1, false, visited, `${path}_v${i}`)
        return `${keyStr} => ${valStr}`
      })
      .join(', ')
    const suffix =
      map.size > BrowserConsole.PREVIEW_ITEMS
        ? `, ... ${map.size - BrowserConsole.PREVIEW_ITEMS} more`
        : ''

    // Create full expanded view
    const fullContent = entries
      .map(([key, val], i) => {
        const keyStr = this.formatValue(key, depth + 1, false, visited, `${path}_k${i}`)
        const valStr = this.formatValue(val, depth + 1, false, visited, `${path}_v${i}`)
        return `<div class="object-property">
        <span class="property-key">${keyStr} =></span>
        <span class="property-value">${valStr}</span>
      </div>`
      })
      .join('')

    return `
      <div class="expandable-container">
        <span class="expandable-header" data-target="${id}" role="button" tabindex="0" aria-expanded="false" aria-controls="${id}">
          <span class="expand-icon" aria-hidden="true">▶</span>
          <span class="value-object"><span class="type-label">Map(${map.size})</span> {${preview}${suffix}}</span>
        </span>
        <div class="expandable-content" id="${id}" style="display: none;" role="region">
          ${fullContent}
        </div>
      </div>`
  }

  /**
   * Format a Set
   * @param {Set} set - Set to format
   * @param {number} depth - Current nesting depth
   * @param {WeakSet} visited - Set of visited objects for circular detection
   * @param {string} path - Stable path for generating element IDs
   */
  formatSet(set, depth, visited, path) {
    if (set.size === 0) {
      return `<span class="value-array">Set(0) {}</span>`
    }

    const id = `set_${path}`
    const values = [...set.values()]

    // Create preview (first 3 values)
    const preview = values
      .slice(0, BrowserConsole.PREVIEW_ITEMS)
      .map((val, i) => this.formatValue(val, depth + 1, false, visited, `${path}_${i}`))
      .join(', ')
    const suffix =
      set.size > BrowserConsole.PREVIEW_ITEMS
        ? `, ... ${set.size - BrowserConsole.PREVIEW_ITEMS} more`
        : ''

    // Create full expanded view
    const fullContent = values
      .map((val, i) => {
        const valStr = this.formatValue(val, depth + 1, false, visited, `${path}_${i}`)
        return `<div class="object-property">
        <span class="property-value">${valStr}</span>
      </div>`
      })
      .join('')

    return `
      <div class="expandable-container">
        <span class="expandable-header" data-target="${id}" role="button" tabindex="0" aria-expanded="false" aria-controls="${id}">
          <span class="expand-icon" aria-hidden="true">▶</span>
          <span class="value-array"><span class="type-label">Set(${set.size})</span> {${preview}${suffix}}</span>
        </span>
        <div class="expandable-content" id="${id}" style="display: none;" role="region">
          ${fullContent}
        </div>
      </div>`
  }

  /**
   * Get the type of a value
   * @param {*} value - Value to check
   * @returns {string} Type name
   */
  getType(value) {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (Array.isArray(value)) return 'array'
    if (value instanceof HTMLElement) return 'element'
    if (value instanceof Map) return 'map'
    if (value instanceof Set) return 'set'
    if (typeof value === 'bigint') return 'bigint'
    if (typeof value === 'symbol') return 'symbol'
    return typeof value
  }

  /**
   * Escape HTML for safe display
   * @param {string} text - Text to escape
   * @returns {string} Escaped HTML string
   */
  escapeHtml(text) {
    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return String(text).replace(/[&<>"']/g, (char) => htmlEntities[char])
  }

  /**
   * Toggle expand/collapse state of an expandable header
   * @param {HTMLElement} header - The expandable header element
   */
  toggleExpand(header) {
    const targetId = header.dataset.target
    const content = this.shadowRoot.getElementById(targetId)
    const icon = header.querySelector('.expand-icon')

    if (content) {
      const isExpanded = content.style.display !== 'none'

      if (isExpanded) {
        content.style.display = 'none'
        header.setAttribute('aria-expanded', 'false')
        if (icon) icon.textContent = '▶'
      } else {
        content.style.display = 'block'
        header.setAttribute('aria-expanded', 'true')
        if (icon) icon.textContent = '▼'
      }
    }
  }

  /**
   * Handle clicks on log entries (delegated)
   */
  handleLogClick(e) {
    const header = e.target.closest('.expandable-header')
    if (!header) return

    e.stopPropagation()
    this.toggleExpand(header)
  }

  /**
   * Handle keyboard events on log entries (delegated)
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleLogKeydown(e) {
    const header = e.target.closest('.expandable-header')
    if (!header) return

    // Toggle on Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      this.toggleExpand(header)
    }
  }

  /**
   * Get component styles
   */
  getStyles() {
    return `
      :host {
        display: block;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        height: 100%;
      }

      /*
       * Theming contract:
       *   --bc-*  = public override surface (set on host or ancestor, e.g. via Vanilla Breeze)
       *   --_bc-* = internal per-theme defaults — NOT a public API
       * Usage: var(--bc-foo, var(--_bc-foo))
       */

      /* ===== DARK THEME ===== */
      .console-feed[data-theme="dark"] {
        --_bc-bg-primary: #1e1e1e;
        --_bc-bg-secondary: #252526;
        --_bc-bg-tertiary: #2a2a2a;
        --_bc-bg-hover: #2a2a2a;
        --_bc-border-color: #3e3e42;
        --_bc-text-primary: #d4d4d4;
        --_bc-text-secondary: #6a6a6a;

        --_bc-color-log: #3794ff;
        --_bc-color-info: #75beff;
        --_bc-color-warn: #ffcc00;
        --_bc-color-error: #f48771;
        --_bc-color-debug: #b267e6;
        --_bc-color-table: #4ec9b0;
        --_bc-color-time: #4ec9b0;

        --_bc-bg-warn: #332b00;
        --_bc-bg-error: #342020;

        --_bc-value-string: #ce9178;
        --_bc-value-number: #b5cea8;
        --_bc-value-boolean: #569cd6;
        --_bc-value-null: #6a6a6a;
        --_bc-value-function: #dcdcaa;
        --_bc-value-date: #4fc1ff;
        --_bc-value-regexp: #d16969;
        --_bc-value-element: #4ec9b0;

        --_bc-btn-bg: #3e3e42;
        --_bc-btn-border: #555;
        --_bc-btn-hover: #505050;
        --_bc-btn-active: #0e639c;

        --_bc-table-border: #3e3e42;
        --_bc-table-header-bg: #2d2d30;
        --_bc-table-row-hover: #2a2a2a;

        --_bc-scrollbar-track: #1e1e1e;
        --_bc-scrollbar-thumb: #424242;
        --_bc-scrollbar-thumb-hover: #4e4e4e;
      }

      /* ===== LIGHT THEME ===== */
      .console-feed[data-theme="light"] {
        --_bc-bg-primary: #ffffff;
        --_bc-bg-secondary: #f3f3f3;
        --_bc-bg-tertiary: #f8f8f8;
        --_bc-bg-hover: #f0f0f0;
        --_bc-border-color: #e0e0e0;
        --_bc-text-primary: #333333;
        --_bc-text-secondary: #999999;

        --_bc-color-log: #0066cc;
        --_bc-color-info: #0078d4;
        --_bc-color-warn: #ff8c00;
        --_bc-color-error: #e81123;
        --_bc-color-debug: #8b5cf6;
        --_bc-color-table: #00a67e;
        --_bc-color-time: #00a67e;

        --_bc-bg-warn: #fff9e6;
        --_bc-bg-error: #ffe6e6;

        --_bc-value-string: #a31515;
        --_bc-value-number: #098658;
        --_bc-value-boolean: #0000ff;
        --_bc-value-null: #999999;
        --_bc-value-function: #795e26;
        --_bc-value-date: #0078d4;
        --_bc-value-regexp: #e81123;
        --_bc-value-element: #00a67e;

        --_bc-btn-bg: #e8e8e8;
        --_bc-btn-border: #cccccc;
        --_bc-btn-hover: #d8d8d8;
        --_bc-btn-active: #0066cc;

        --_bc-table-border: #e0e0e0;
        --_bc-table-header-bg: #f3f3f3;
        --_bc-table-row-hover: #f8f8f8;

        --_bc-scrollbar-track: #f0f0f0;
        --_bc-scrollbar-thumb: #c0c0c0;
        --_bc-scrollbar-thumb-hover: #a0a0a0;
      }

      .console-feed {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--bc-bg-primary, var(--_bc-bg-primary));
        color: var(--bc-text-primary, var(--_bc-text-primary));
        transition: background 0.2s, color 0.2s;
      }

      .console-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        gap: 8px;
        background: var(--bc-bg-secondary, var(--_bc-bg-secondary));
        border-bottom: 1px solid var(--bc-border-color, var(--_bc-border-color));
      }

      .console-search {
        display: flex;
        flex: 1;
        max-width: 200px;
      }

      .search-input {
        width: 100%;
        padding: 4px 8px;
        background: var(--bc-bg-tertiary, var(--_bc-bg-tertiary));
        border: 1px solid var(--bc-border-color, var(--_bc-border-color));
        border-radius: 3px;
        color: var(--bc-text-primary, var(--_bc-text-primary));
        font-family: inherit;
        font-size: 11px;
      }

      .search-input::placeholder {
        color: var(--bc-text-secondary, var(--_bc-text-secondary));
      }

      .search-input:focus {
        outline: 2px solid var(--bc-btn-active, var(--_bc-btn-active));
        outline-offset: -1px;
      }

      .console-filters {
        display: flex;
        gap: 4px;
      }

      .console-actions {
        display: flex;
        gap: 4px;
        align-items: center;
      }

      .filter-btn, .clear-btn, .theme-btn, .copy-btn {
        padding: 4px 12px;
        background: var(--bc-btn-bg, var(--_bc-btn-bg));
        color: var(--bc-text-primary, var(--_bc-text-primary));
        border: 1px solid var(--bc-btn-border, var(--_bc-btn-border));
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
        font-family: inherit;
        transition: background 0.2s;
      }

      .theme-btn, .copy-btn, .clear-btn {
        padding: 4px 8px;
        font-size: 14px;
      }

      .filter-btn:hover, .clear-btn:hover, .theme-btn:hover, .copy-btn:hover {
        background: var(--bc-btn-hover, var(--_bc-btn-hover));
      }

      .filter-btn.active {
        background: var(--bc-btn-active, var(--_bc-btn-active));
        border-color: var(--bc-btn-active, var(--_bc-btn-active));
        color: white;
      }

      .console-logs {
        flex: 1;
        overflow-y: auto;
        padding: 4px;
      }

      .log-entry {
        padding: 2px 4px;
        margin: 1px 0;
        display: flex;
        gap: 8px;
        align-items: flex-start;
        border-left: 3px solid transparent;
      }

      .log-entry:hover {
        background: var(--bc-bg-hover, var(--_bc-bg-hover));
      }

      .log-timestamp {
        color: var(--bc-text-secondary, var(--_bc-text-secondary));
        font-size: 10px;
        white-space: nowrap;
      }

      .log-method {
        font-weight: bold;
        white-space: nowrap;
        min-width: 60px;
      }

      .log-content {
        flex: 1;
        word-break: break-word;
      }

      .log-log {
        border-left-color: var(--bc-color-log, var(--_bc-color-log));
      }

      .log-log .log-method {
        color: var(--bc-color-log, var(--_bc-color-log));
      }

      .log-info {
        border-left-color: var(--bc-color-info, var(--_bc-color-info));
      }

      .log-info .log-method {
        color: var(--bc-color-info, var(--_bc-color-info));
      }

      .log-warn {
        border-left-color: var(--bc-color-warn, var(--_bc-color-warn));
        background: var(--bc-bg-warn, var(--_bc-bg-warn));
      }

      .log-warn .log-method {
        color: var(--bc-color-warn, var(--_bc-color-warn));
      }

      .log-error {
        border-left-color: var(--bc-color-error, var(--_bc-color-error));
        background: var(--bc-bg-error, var(--_bc-bg-error));
      }

      .log-error .log-method {
        color: var(--bc-color-error, var(--_bc-color-error));
      }

      .log-debug {
        border-left-color: var(--bc-color-debug, var(--_bc-color-debug));
      }

      .log-debug .log-method {
        color: var(--bc-color-debug, var(--_bc-color-debug));
      }

      .log-table {
        border-left-color: var(--bc-color-table, var(--_bc-color-table));
      }

      .log-table .log-method {
        color: var(--bc-color-table, var(--_bc-color-table));
      }

      .log-time {
        border-left-color: var(--bc-color-time, var(--_bc-color-time));
      }

      .log-time .log-method {
        color: var(--bc-color-time, var(--_bc-color-time));
      }

      .log-group {
        border-left-color: var(--bc-color-log, var(--_bc-color-log));
      }

      .log-group .log-method {
        color: var(--bc-text-secondary, var(--_bc-text-secondary));
      }

      .group-header {
        cursor: pointer;
        font-weight: 600;
      }

      .group-header:hover {
        text-decoration: underline;
      }

      .log-trace {
        border-left-color: var(--bc-color-debug, var(--_bc-color-debug));
      }

      .log-trace .log-method {
        color: var(--bc-color-debug, var(--_bc-color-debug));
      }

      .stack-trace {
        margin-top: 4px;
        padding: 8px;
        background: var(--bc-bg-tertiary, var(--_bc-bg-tertiary));
        border-radius: 4px;
        font-size: 10px;
        color: var(--bc-text-secondary, var(--_bc-text-secondary));
        overflow-x: auto;
        white-space: pre;
        font-family: inherit;
      }

      .log-count {
        border-left-color: var(--bc-color-info, var(--_bc-color-info));
      }

      .log-count .log-method {
        color: var(--bc-color-info, var(--_bc-color-info));
      }

      .log-dir {
        border-left-color: var(--bc-color-log, var(--_bc-color-log));
      }

      .log-dir .log-method {
        color: var(--bc-text-secondary, var(--_bc-text-secondary));
      }

      /* Value type styles */
      .value-string {
        color: var(--bc-value-string, var(--_bc-value-string));
      }

      .value-number {
        color: var(--bc-value-number, var(--_bc-value-number));
      }

      .value-boolean {
        color: var(--bc-value-boolean, var(--_bc-value-boolean));
      }

      .value-null, .value-undefined {
        color: var(--bc-value-null, var(--_bc-value-null));
        font-style: italic;
      }

      .value-function {
        color: var(--bc-value-function, var(--_bc-value-function));
      }

      .value-array, .value-object {
        color: var(--bc-text-primary, var(--_bc-text-primary));
      }

      .value-error {
        color: var(--bc-color-error, var(--_bc-color-error));
      }

      .value-date {
        color: var(--bc-value-date, var(--_bc-value-date));
      }

      .value-regexp {
        color: var(--bc-value-regexp, var(--_bc-value-regexp));
      }

      .value-element {
        color: var(--bc-value-element, var(--_bc-value-element));
      }

      .value-symbol {
        color: var(--bc-value-regexp, var(--_bc-value-regexp));
        font-style: italic;
      }

      /* Expandable objects/arrays */
      .expandable-container {
        display: inline-block;
      }

      .expandable-header {
        cursor: pointer;
        user-select: none;
        border-radius: 2px;
      }

      .expandable-header:hover {
        opacity: 0.8;
      }

      /* Focus styles for accessibility */
      .expandable-header:focus {
        outline: 2px solid var(--bc-btn-active, var(--_bc-btn-active));
        outline-offset: 1px;
      }

      .expandable-header:focus:not(:focus-visible) {
        outline: none;
      }

      .expandable-header:focus-visible {
        outline: 2px solid var(--bc-btn-active, var(--_bc-btn-active));
        outline-offset: 1px;
      }

      .filter-btn:focus-visible,
      .clear-btn:focus-visible,
      .theme-btn:focus-visible,
      .copy-btn:focus-visible {
        outline: 2px solid var(--bc-btn-active, var(--_bc-btn-active));
        outline-offset: 2px;
      }

      .expand-icon {
        display: inline-block;
        width: 12px;
        color: var(--bc-text-secondary, var(--_bc-text-secondary));
        font-size: 10px;
        transition: transform 0.1s;
      }

      .expandable-content {
        padding-left: 20px;
        margin-top: 4px;
      }

      .object-property {
        padding: 2px 0;
        line-height: 1.4;
      }

      .property-key {
        color: var(--bc-color-log, var(--_bc-color-log));
        margin-right: 8px;
      }

      .property-value {
        color: var(--bc-text-primary, var(--_bc-text-primary));
      }

      .type-label {
        color: var(--bc-text-secondary, var(--_bc-text-secondary));
        font-style: italic;
        margin-right: 4px;
      }

      /* Table styles */
      .table-wrapper {
        margin: 4px 0;
        overflow-x: auto;
      }

      .console-table {
        border-collapse: collapse;
        font-size: 11px;
        min-width: 200px;
        background: var(--bc-bg-primary, var(--_bc-bg-primary));
      }

      .console-table th,
      .console-table td {
        border: 1px solid var(--bc-table-border, var(--_bc-table-border));
        padding: 4px 8px;
        text-align: left;
      }

      .console-table th {
        background: var(--bc-table-header-bg, var(--_bc-table-header-bg));
        font-weight: bold;
        color: var(--bc-text-primary, var(--_bc-text-primary));
        position: sticky;
        top: 0;
      }

      .console-table tr:hover {
        background: var(--bc-table-row-hover, var(--_bc-table-row-hover));
      }

      .console-table .table-index {
        color: var(--bc-text-secondary, var(--_bc-text-secondary));
        font-weight: bold;
      }

      /* Scrollbar styles */
      .console-logs::-webkit-scrollbar {
        width: 10px;
      }

      .console-logs::-webkit-scrollbar-track {
        background: var(--bc-scrollbar-track, var(--_bc-scrollbar-track));
      }

      .console-logs::-webkit-scrollbar-thumb {
        background: var(--bc-scrollbar-thumb, var(--_bc-scrollbar-thumb));
        border-radius: 5px;
      }

      .console-logs::-webkit-scrollbar-thumb:hover {
        background: var(--bc-scrollbar-thumb-hover, var(--_bc-scrollbar-thumb-hover));
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .console-feed,
        .filter-btn,
        .clear-btn,
        .theme-btn,
        .expand-icon {
          transition: none;
        }
      }
    `
  }
}

// Register the custom element
customElements.define('browser-console', BrowserConsole)

// Export for ES modules
export { BrowserConsole }
export default BrowserConsole
