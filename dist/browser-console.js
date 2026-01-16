var x = Object.defineProperty;
var $ = (b, e, t) => e in b ? x(b, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : b[e] = t;
var g = (b, e, t) => $(b, typeof e != "symbol" ? e + "" : e, t);
const l = class l extends HTMLElement {
  /**
   * Creates a new BrowserConsole instance
   * @constructor
   */
  constructor() {
    super(), this.attachShadow({ mode: "open" }), this.logs = [], this.originalConsole = {}, this.filter = null, this.maxLogs = l.MAX_LOGS_DEFAULT, this.timers = {}, this.counters = {}, this.theme = "dark", this.searchQuery = "", this.groupDepth = 0, this.groupStack = [], this.render();
  }
  connectedCallback() {
    const e = this.getAttribute("auto-hook") !== "false", t = this.getAttribute("theme") || "dark", a = this.getAttribute("max-logs");
    this.theme = t, a && (this.maxLogs = parseInt(a, 10) || l.MAX_LOGS_DEFAULT), e && this.hookConsole(), this.updateTheme();
  }
  static get observedAttributes() {
    return ["theme", "max-logs"];
  }
  attributeChangedCallback(e, t, a) {
    e === "theme" && t !== a && (this.theme = a || "dark", this.updateTheme()), e === "max-logs" && t !== a && (this.maxLogs = parseInt(a, 10) || l.MAX_LOGS_DEFAULT);
  }
  /**
   * Update theme
   */
  updateTheme() {
    const e = this.shadowRoot.querySelector(".console-feed");
    e && (e.dataset.theme = this.theme);
    const t = this.shadowRoot.querySelector(".theme-icon");
    t && (t.textContent = this.theme === "dark" ? "☀️" : "🌙");
  }
  /**
   * Set theme programmatically
   */
  setTheme(e) {
    this.theme = e, this.setAttribute("theme", e);
  }
  disconnectedCallback() {
    this.unhookConsole();
  }
  /**
   * Hook into console methods to capture logs
   */
  hookConsole() {
    [
      "log",
      "info",
      "warn",
      "error",
      "debug",
      "table",
      "clear",
      "time",
      "timeEnd",
      "timeLog",
      "count",
      "countReset",
      "assert",
      "group",
      "groupCollapsed",
      "groupEnd",
      "trace",
      "dir"
    ].forEach((t) => {
      this.originalConsole[t] = console[t], console[t] = (...a) => {
        var o;
        if ((o = this.originalConsole[t]) == null || o.apply(console, a), t === "group" || t === "groupCollapsed") {
          const r = a[0] || "console.group", s = `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          this.groupStack.push({ label: r, collapsed: t === "groupCollapsed", id: s }), this.groupDepth++, this.addLog({
            method: "group",
            data: [r],
            timestamp: /* @__PURE__ */ new Date(),
            groupDepth: this.groupDepth,
            collapsed: t === "groupCollapsed",
            groupId: s
          });
          return;
        }
        if (t === "groupEnd") {
          this.groupDepth > 0 && (this.groupStack.pop(), this.groupDepth--);
          return;
        }
        if (t === "trace") {
          const r = new Error().stack.split(`
`).slice(2).join(`
`);
          this.addLog({
            method: "trace",
            data: a.length ? a : ["console.trace"],
            timestamp: /* @__PURE__ */ new Date(),
            stack: r,
            groupDepth: this.groupDepth
          });
          return;
        }
        if (t === "dir") {
          this.addLog({
            method: "dir",
            data: a,
            timestamp: /* @__PURE__ */ new Date(),
            groupDepth: this.groupDepth
          });
          return;
        }
        if (t === "time") {
          const r = a[0] || "default";
          this.timers[r] = performance.now();
          return;
        }
        if (t === "timeEnd") {
          const r = a[0] || "default";
          if (this.timers[r] !== void 0) {
            const s = performance.now() - this.timers[r];
            delete this.timers[r], this.addLog({
              method: "time",
              data: [r, s],
              timestamp: /* @__PURE__ */ new Date(),
              groupDepth: this.groupDepth
            });
          }
          return;
        }
        if (t === "timeLog") {
          const r = a[0] || "default";
          if (this.timers[r] !== void 0) {
            const s = performance.now() - this.timers[r], n = a.slice(1);
            this.addLog({
              method: "time",
              data: [r, s, ...n],
              timestamp: /* @__PURE__ */ new Date(),
              groupDepth: this.groupDepth
            });
          }
          return;
        }
        if (t === "count") {
          const r = a[0] || "default";
          this.counters[r] = (this.counters[r] || 0) + 1, this.addLog({
            method: "count",
            data: [r, this.counters[r]],
            timestamp: /* @__PURE__ */ new Date(),
            groupDepth: this.groupDepth
          });
          return;
        }
        if (t === "countReset") {
          const r = a[0] || "default";
          delete this.counters[r];
          return;
        }
        this.addLog({
          method: t,
          data: a,
          timestamp: /* @__PURE__ */ new Date(),
          groupDepth: this.groupDepth
        });
      };
    });
  }
  /**
   * Restore original console methods
   */
  unhookConsole() {
    Object.keys(this.originalConsole).forEach((e) => {
      console[e] = this.originalConsole[e];
    }), this.originalConsole = {};
  }
  /**
   * Add a log entry
   */
  addLog(e) {
    if (e.method === "clear") {
      this.clearLogs();
      return;
    }
    this.logs.push(e), this.logs.length > this.maxLogs && this.logs.shift(), (!this.filter || this.filter === e.method) && this.appendLog(e);
  }
  /**
   * Append a single log to the view (Incremental Rendering)
   */
  appendLog(e) {
    const t = this.shadowRoot.querySelector(".console-logs");
    if (!t) return;
    const a = this.renderLog(e, this.logs.length - 1);
    t.insertAdjacentHTML("beforeend", a), t.children.length > this.maxLogs && t.firstElementChild.remove(), t.scrollTop = t.scrollHeight;
  }
  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [], this.renderLogs();
  }
  /**
   * Format a value as plain text for clipboard
   * @param {*} value - Value to format
   * @param {number} depth - Current nesting depth
   * @returns {string} Plain text representation
   */
  formatValuePlainText(e, t = 0) {
    return e === null ? "null" : e === void 0 ? "undefined" : typeof e == "string" ? `"${e}"` : typeof e == "number" || typeof e == "boolean" ? String(e) : typeof e == "bigint" ? `${e}n` : typeof e == "symbol" ? e.toString() : typeof e == "function" ? e.toString().slice(0, 50) + (e.toString().length > 50 ? "..." : "") : Array.isArray(e) ? t > 2 ? `Array(${e.length})` : `[${e.map((a) => this.formatValuePlainText(a, t + 1)).join(", ")}]` : e instanceof Date ? e.toISOString() : e instanceof Error ? e.toString() : e instanceof Map ? `Map(${e.size})` : e instanceof Set ? `Set(${e.size})` : typeof e == "object" ? t > 2 ? "{...}" : `{${Object.entries(e).map(([o, r]) => `${o}: ${this.formatValuePlainText(r, t + 1)}`).join(", ")}}` : String(e);
  }
  /**
   * Format logs for clipboard as plain text
   * @returns {string} Plain text representation of visible logs
   */
  formatLogsForClipboard() {
    return this.logs.filter((t) => this.matchesFilters(t)).map((t) => {
      const a = this.formatTimestamp(t.timestamp), o = t.method.toUpperCase(), r = t.data.map((s) => this.formatValuePlainText(s)).join(" ");
      return `[${a}] [${o}] ${r}`;
    }).join(`
`);
  }
  /**
   * Copy visible logs to clipboard
   */
  async copyLogs() {
    const e = this.formatLogsForClipboard(), a = this.shadowRoot.querySelector(".copy-btn").querySelector(".copy-icon"), o = a.textContent;
    try {
      await navigator.clipboard.writeText(e), a.textContent = "✓", setTimeout(() => {
        a.textContent = o;
      }, 1500);
    } catch (r) {
      console.error("Failed to copy logs:", r), a.textContent = "✗", setTimeout(() => {
        a.textContent = o;
      }, 1500);
    }
  }
  /**
   * Set filter for log methods
   * @param {string|null} filter - Log method to filter by, or null for all
   */
  setFilter(e) {
    this.filter = e, this.renderLogs();
  }
  /**
   * Set search query for text filtering
   * @param {string} query - Search text to filter logs by
   */
  setSearchQuery(e) {
    this.searchQuery = e.toLowerCase(), this.renderLogs();
  }
  /**
   * Check if a log entry matches current filters
   * @param {Object} log - Log entry to check
   * @returns {boolean} True if log matches all active filters
   */
  matchesFilters(e) {
    return !(this.filter && e.method !== this.filter || this.searchQuery && !JSON.stringify(e.data).toLowerCase().includes(this.searchQuery));
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
    `, this.shadowRoot.querySelector(".clear-btn").addEventListener("click", () => this.clearLogs()), this.shadowRoot.querySelector(".copy-btn").addEventListener("click", () => this.copyLogs()), this.shadowRoot.querySelector(".theme-btn").addEventListener("click", () => {
      this.setTheme(this.theme === "dark" ? "light" : "dark");
    }), this.shadowRoot.querySelectorAll(".filter-btn").forEach((a) => {
      a.addEventListener("click", (o) => {
        this.shadowRoot.querySelectorAll(".filter-btn").forEach((s) => {
          s.classList.remove("active"), s.setAttribute("aria-pressed", "false");
        }), o.target.classList.add("active"), o.target.setAttribute("aria-pressed", "true");
        const r = o.target.dataset.filter;
        this.setFilter(r === "all" ? null : r);
      });
    });
    let e;
    this.shadowRoot.querySelector(".search-input").addEventListener("input", (a) => {
      clearTimeout(e), e = setTimeout(() => {
        this.setSearchQuery(a.target.value);
      }, 150);
    });
    const t = this.shadowRoot.querySelector(".console-logs");
    t.addEventListener("click", (a) => this.handleLogClick(a)), t.addEventListener("keydown", (a) => this.handleLogKeydown(a));
  }
  /**
   * Get current expansion states from DOM
   * @returns {Map<string, boolean>} Map of element IDs to expanded state
   */
  getExpansionStates() {
    const e = /* @__PURE__ */ new Map();
    return this.shadowRoot.querySelectorAll(".expandable-header").forEach((a) => {
      const o = a.dataset.target, r = a.getAttribute("aria-expanded") === "true";
      o && e.set(o, r);
    }), e;
  }
  /**
   * Restore expansion states after render
   * @param {Map<string, boolean>} states - Previously saved expansion states
   */
  restoreExpansionStates(e) {
    e.forEach((t, a) => {
      if (t) {
        const o = this.shadowRoot.getElementById(a), r = this.shadowRoot.querySelector(`[data-target="${a}"]`);
        if (o && r) {
          o.style.display = "block", r.setAttribute("aria-expanded", "true");
          const s = r.querySelector(".expand-icon");
          s && (s.textContent = "▼");
        }
      }
    });
  }
  /**
   * Render all logs with expansion state preservation
   */
  renderLogs() {
    const e = this.shadowRoot.querySelector(".console-logs"), t = this.getExpansionStates(), a = this.logs.filter((o) => this.matchesFilters(o));
    e.innerHTML = a.map((o, r) => this.renderLog(o, r)).join(""), this.restoreExpansionStates(t);
  }
  /**
   * Render a single log entry
   */
  renderLog(e, t) {
    const a = this.formatTimestamp(e.timestamp), o = `log-${e.method}`, r = e.groupDepth ? `padding-left: ${e.groupDepth * 20}px;` : "";
    if (e.method === "group") {
      const s = e.groupId || `group_${t}`, n = e.collapsed;
      return `
        <div class="log-entry log-group" data-index="${t}" style="${r}">
          <span class="log-timestamp">${a}</span>
          <span class="log-method">[GROUP]</span>
          <span class="log-content">
            <span class="expandable-header group-header" data-target="${s}" role="button" tabindex="0" aria-expanded="${!n}" aria-controls="${s}">
              <span class="expand-icon" aria-hidden="true">${n ? "▶" : "▼"}</span>
              ${this.escapeHtml(e.data[0])}
            </span>
          </span>
        </div>
      `;
    }
    if (e.method === "trace") {
      const s = e.stack ? `<pre class="stack-trace">${this.escapeHtml(e.stack)}</pre>` : "";
      return `
        <div class="log-entry log-trace" data-index="${t}" style="${r}">
          <span class="log-timestamp">${a}</span>
          <span class="log-method">[TRACE]</span>
          <div class="log-content">
            <div>${this.formatLogData(e.data, e.method, t)}</div>
            ${s}
          </div>
        </div>
      `;
    }
    if (e.method === "count") {
      const [s, n] = e.data;
      return `
        <div class="log-entry log-count" data-index="${t}" style="${r}">
          <span class="log-timestamp">${a}</span>
          <span class="log-method">[COUNT]</span>
          <span class="log-content">
            <span class="value-string">${this.escapeHtml(s)}</span>:
            <span class="value-number">${n}</span>
          </span>
        </div>
      `;
    }
    if (e.method === "dir") {
      const s = /* @__PURE__ */ new WeakSet(), n = e.data.map((i, u) => this.formatValue(i, 0, !0, s, `${t}_${u}`)).join(" ");
      return `
        <div class="log-entry log-dir" data-index="${t}" style="${r}">
          <span class="log-timestamp">${a}</span>
          <span class="log-method">[DIR]</span>
          <span class="log-content">${n}</span>
        </div>
      `;
    }
    if (e.method === "table") {
      const s = this.formatTable(e.data[0]);
      return `
        <div class="log-entry ${o}" data-index="${t}" style="${r}">
          <span class="log-timestamp">${a}</span>
          <span class="log-method">[TABLE]</span>
          <div class="log-content">${s}</div>
        </div>
      `;
    }
    if (e.method === "time" && e.data.length >= 2) {
      const [s, n, ...i] = e.data, u = i.length ? ` ${this.formatLogData(i, "log", t)}` : "";
      return `
        <div class="log-entry ${o}" data-index="${t}" style="${r}">
          <span class="log-timestamp">${a}</span>
          <span class="log-method">[TIMER]</span>
          <span class="log-content">
            <span class="value-string">${this.escapeHtml(s)}</span>:
            <span class="value-number">${n.toFixed(2)}ms</span>${u}
          </span>
        </div>
      `;
    }
    return `
      <div class="log-entry ${o}" data-index="${t}" style="${r}">
        <span class="log-timestamp">${a}</span>
        <span class="log-method">[${e.method.toUpperCase()}]</span>
        <span class="log-content">${this.formatLogData(e.data, e.method, t)}</span>
      </div>
    `;
  }
  /**
   * Format timestamp
   */
  formatTimestamp(e) {
    return e.toLocaleTimeString("en-US", {
      hour12: !1,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3
    });
  }
  /**
   * Format log data for display
   * @param {Array} data - Array of values to format
   * @param {string} method - Console method name
   * @param {number} logIndex - Index of the log entry for stable IDs
   * @returns {string} Formatted HTML string
   */
  formatLogData(e, t, a) {
    const o = /* @__PURE__ */ new WeakSet();
    return e.map((r, s) => this.formatValue(r, 0, !1, o, `${a}_${s}`)).join(" ");
  }
  /**
   * Format table data
   */
  formatTable(e) {
    if (!e)
      return '<span class="value-undefined">undefined</span>';
    if (Array.isArray(e) && e.length > 0) {
      if (e.every((a) => typeof a == "object" && a !== null)) {
        const a = [...new Set(e.flatMap((o) => Object.keys(o)))];
        return `
          <div class="table-wrapper">
            <table class="console-table">
              <thead>
                <tr>
                  <th>(index)</th>
                  ${a.map((o) => `<th>${this.escapeHtml(o)}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${e.map(
          (o, r) => `
                  <tr>
                    <td class="table-index">${r}</td>
                    ${a.map((s) => `<td>${this.formatValue(o[s], 0, !1)}</td>`).join("")}
                  </tr>
                `
        ).join("")}
              </tbody>
            </table>
          </div>
        `;
      }
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
              ${e.map(
        (a, o) => `
                <tr>
                  <td class="table-index">${o}</td>
                  <td>${this.formatValue(a, 0, !1)}</td>
                </tr>
              `
      ).join("")}
            </tbody>
          </table>
        </div>
      `;
    }
    return typeof e == "object" && e !== null ? `
        <div class="table-wrapper">
          <table class="console-table">
            <thead>
              <tr>
                <th>(index)</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(e).map(
      (a) => `
                <tr>
                  <td class="table-index">${this.escapeHtml(a)}</td>
                  <td>${this.formatValue(e[a], 0, !1)}</td>
                </tr>
              `
    ).join("")}
            </tbody>
          </table>
        </div>
      ` : this.formatValue(e, 0, !1);
  }
  /**
   * Format a single value
   * @param {*} value - Value to format
   * @param {number} depth - Current nesting depth
   * @param {boolean} expanded - Whether to show expanded view
   * @param {WeakSet} visited - Set of visited objects for circular detection
   * @param {string} path - Stable path for generating element IDs
   */
  formatValue(e, t = 0, a = !1, o = /* @__PURE__ */ new WeakSet(), r = "0") {
    switch (this.getType(e)) {
      case "string":
        return `<span class="value-string">"${this.escapeHtml(e)}"</span>`;
      case "number":
        return `<span class="value-number">${e}</span>`;
      case "bigint":
        return `<span class="value-number">${e}n</span>`;
      case "boolean":
        return `<span class="value-boolean">${e}</span>`;
      case "null":
        return '<span class="value-null">null</span>';
      case "undefined":
        return '<span class="value-undefined">undefined</span>';
      case "symbol":
        return `<span class="value-symbol">${this.escapeHtml(e.toString())}</span>`;
      case "function": {
        const n = e.toString(), i = n.length > l.FUNCTION_PREVIEW_LENGTH ? n.substring(0, l.FUNCTION_PREVIEW_LENGTH) + "..." : n;
        return `<span class="value-function">${this.escapeHtml(i)}</span>`;
      }
      case "map": {
        if (o.has(e))
          return '<span class="value-object">[Circular]</span>';
        if (t > l.MAX_DEPTH)
          return `<span class="value-object">Map(${e.size})</span>`;
        o.add(e);
        const n = this.formatMap(e, t, o, r);
        return o.delete(e), n;
      }
      case "set": {
        if (o.has(e))
          return '<span class="value-array">[Circular]</span>';
        if (t > l.MAX_DEPTH)
          return `<span class="value-array">Set(${e.size})</span>`;
        o.add(e);
        const n = this.formatSet(e, t, o, r);
        return o.delete(e), n;
      }
      case "array": {
        if (o.has(e))
          return '<span class="value-array">[Circular]</span>';
        if (t > l.MAX_DEPTH)
          return `<span class="value-array">[Array(${e.length})]</span>`;
        o.add(e);
        const n = this.formatArray(e, t, a, o, r);
        return o.delete(e), n;
      }
      case "object": {
        if (e instanceof Error)
          return `<span class="value-error">${this.escapeHtml(e.toString())}</span>`;
        if (e instanceof Date)
          return `<span class="value-date">${e.toISOString()}</span>`;
        if (e instanceof RegExp)
          return `<span class="value-regexp">${this.escapeHtml(e.toString())}</span>`;
        if (o.has(e))
          return '<span class="value-object">[Circular]</span>';
        if (t > l.MAX_DEPTH)
          return '<span class="value-object">{Object}</span>';
        o.add(e);
        const n = this.formatObject(e, t, a, o, r);
        return o.delete(e), n;
      }
      case "element":
        return this.formatElement(e);
      default:
        return `<span class="value-default">${this.escapeHtml(String(e))}</span>`;
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
  formatArray(e, t, a, o, r) {
    if (e.length === 0)
      return '<span class="value-array">[]</span>';
    const s = `arr_${r}`, n = e.slice(0, l.PREVIEW_ITEMS).map((p, c) => this.formatValue(p, t + 1, !1, o, `${r}_${c}`)).join(", "), i = e.length > l.PREVIEW_ITEMS ? `, ... ${e.length - l.PREVIEW_ITEMS} more` : "", u = e.map((p, c) => {
      const h = this.formatValue(p, t + 1, !1, o, `${r}_${c}`);
      return `<div class="object-property">
        <span class="property-key">${c}:</span>
        <span class="property-value">${h}</span>
      </div>`;
    }).join("");
    return `
      <div class="expandable-container">
        <span class="expandable-header" data-target="${s}" role="button" tabindex="0" aria-expanded="false" aria-controls="${s}">
          <span class="expand-icon" aria-hidden="true">▶</span>
          <span class="value-array"><span class="type-label">Array(${e.length})</span> [${n}${i}]</span>
        </span>
        <div class="expandable-content" id="${s}" style="display: none;" role="region">
          ${u}
        </div>
      </div>`;
  }
  /**
   * Format an object
   * @param {Object} obj - Object to format
   * @param {number} depth - Current nesting depth
   * @param {boolean} expanded - Whether to show expanded view
   * @param {WeakSet} visited - Set of visited objects for circular detection
   * @param {string} path - Stable path for generating element IDs
   */
  formatObject(e, t, a, o, r) {
    var f;
    const s = Reflect.ownKeys(e);
    if (s.length === 0)
      return '<span class="value-object">{}</span>';
    const n = `obj_${r}`, i = (d) => typeof d == "symbol" ? `<span class="value-symbol">${this.escapeHtml(d.toString())}</span>` : this.escapeHtml(String(d)), u = s.slice(0, l.PREVIEW_ITEMS).map((d, m) => {
      const y = this.formatValue(e[d], t + 1, !1, o, `${r}_p${m}`);
      return `${i(d)}: ${y}`;
    }).join(", "), p = s.length > l.PREVIEW_ITEMS ? `, ... ${s.length - l.PREVIEW_ITEMS} more` : "", c = s.map((d, m) => {
      const y = this.formatValue(e[d], t + 1, !1, o, `${r}_p${m}`);
      return `<div class="object-property">
        <span class="property-key">${i(d)}:</span>
        <span class="property-value">${y}</span>
      </div>`;
    }).join(""), h = ((f = e.constructor) == null ? void 0 : f.name) || "Object";
    return `
      <div class="expandable-container">
        <span class="expandable-header" data-target="${n}" role="button" tabindex="0" aria-expanded="false" aria-controls="${n}">
          <span class="expand-icon" aria-hidden="true">▶</span>
          <span class="value-object"><span class="type-label">${h}</span> {${u}${p}}</span>
        </span>
        <div class="expandable-content" id="${n}" style="display: none;" role="region">
          ${c}
        </div>
      </div>`;
  }
  /**
   * Format a DOM element
   */
  formatElement(e) {
    const t = e.tagName.toLowerCase(), a = e.id ? `#${e.id}` : "", o = e.className ? `.${e.className.split(" ").join(".")}` : "";
    return `<span class="value-element">&lt;${t}${a}${o}&gt;</span>`;
  }
  /**
   * Format a Map
   * @param {Map} map - Map to format
   * @param {number} depth - Current nesting depth
   * @param {WeakSet} visited - Set of visited objects for circular detection
   * @param {string} path - Stable path for generating element IDs
   */
  formatMap(e, t, a, o) {
    if (e.size === 0)
      return '<span class="value-object">Map(0) {}</span>';
    const r = `map_${o}`, s = [...e.entries()], n = s.slice(0, l.PREVIEW_ITEMS).map(([p, c], h) => {
      const f = this.formatValue(p, t + 1, !1, a, `${o}_k${h}`), d = this.formatValue(c, t + 1, !1, a, `${o}_v${h}`);
      return `${f} => ${d}`;
    }).join(", "), i = e.size > l.PREVIEW_ITEMS ? `, ... ${e.size - l.PREVIEW_ITEMS} more` : "", u = s.map(([p, c], h) => {
      const f = this.formatValue(p, t + 1, !1, a, `${o}_k${h}`), d = this.formatValue(c, t + 1, !1, a, `${o}_v${h}`);
      return `<div class="object-property">
        <span class="property-key">${f} =></span>
        <span class="property-value">${d}</span>
      </div>`;
    }).join("");
    return `
      <div class="expandable-container">
        <span class="expandable-header" data-target="${r}" role="button" tabindex="0" aria-expanded="false" aria-controls="${r}">
          <span class="expand-icon" aria-hidden="true">▶</span>
          <span class="value-object"><span class="type-label">Map(${e.size})</span> {${n}${i}}</span>
        </span>
        <div class="expandable-content" id="${r}" style="display: none;" role="region">
          ${u}
        </div>
      </div>`;
  }
  /**
   * Format a Set
   * @param {Set} set - Set to format
   * @param {number} depth - Current nesting depth
   * @param {WeakSet} visited - Set of visited objects for circular detection
   * @param {string} path - Stable path for generating element IDs
   */
  formatSet(e, t, a, o) {
    if (e.size === 0)
      return '<span class="value-array">Set(0) {}</span>';
    const r = `set_${o}`, s = [...e.values()], n = s.slice(0, l.PREVIEW_ITEMS).map((p, c) => this.formatValue(p, t + 1, !1, a, `${o}_${c}`)).join(", "), i = e.size > l.PREVIEW_ITEMS ? `, ... ${e.size - l.PREVIEW_ITEMS} more` : "", u = s.map((p, c) => `<div class="object-property">
        <span class="property-value">${this.formatValue(p, t + 1, !1, a, `${o}_${c}`)}</span>
      </div>`).join("");
    return `
      <div class="expandable-container">
        <span class="expandable-header" data-target="${r}" role="button" tabindex="0" aria-expanded="false" aria-controls="${r}">
          <span class="expand-icon" aria-hidden="true">▶</span>
          <span class="value-array"><span class="type-label">Set(${e.size})</span> {${n}${i}}</span>
        </span>
        <div class="expandable-content" id="${r}" style="display: none;" role="region">
          ${u}
        </div>
      </div>`;
  }
  /**
   * Get the type of a value
   * @param {*} value - Value to check
   * @returns {string} Type name
   */
  getType(e) {
    return e === null ? "null" : e === void 0 ? "undefined" : Array.isArray(e) ? "array" : e instanceof HTMLElement ? "element" : e instanceof Map ? "map" : e instanceof Set ? "set" : typeof e == "bigint" ? "bigint" : typeof e == "symbol" ? "symbol" : typeof e;
  }
  /**
   * Escape HTML for safe display
   * @param {string} text - Text to escape
   * @returns {string} Escaped HTML string
   */
  escapeHtml(e) {
    const t = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return String(e).replace(/[&<>"']/g, (a) => t[a]);
  }
  /**
   * Toggle expand/collapse state of an expandable header
   * @param {HTMLElement} header - The expandable header element
   */
  toggleExpand(e) {
    const t = e.dataset.target, a = this.shadowRoot.getElementById(t), o = e.querySelector(".expand-icon");
    a && (a.style.display !== "none" ? (a.style.display = "none", e.setAttribute("aria-expanded", "false"), o && (o.textContent = "▶")) : (a.style.display = "block", e.setAttribute("aria-expanded", "true"), o && (o.textContent = "▼")));
  }
  /**
   * Handle clicks on log entries (delegated)
   */
  handleLogClick(e) {
    const t = e.target.closest(".expandable-header");
    t && (e.stopPropagation(), this.toggleExpand(t));
  }
  /**
   * Handle keyboard events on log entries (delegated)
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleLogKeydown(e) {
    const t = e.target.closest(".expandable-header");
    t && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), e.stopPropagation(), this.toggleExpand(t));
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

      /* ===== DARK THEME ===== */
      .console-feed[data-theme="dark"] {
        --bg-primary: #1e1e1e;
        --bg-secondary: #252526;
        --bg-tertiary: #2a2a2a;
        --bg-hover: #2a2a2a;
        --border-color: #3e3e42;
        --text-primary: #d4d4d4;
        --text-secondary: #6a6a6a;

        --color-log: #3794ff;
        --color-info: #75beff;
        --color-warn: #ffcc00;
        --color-error: #f48771;
        --color-debug: #b267e6;
        --color-table: #4ec9b0;
        --color-time: #4ec9b0;

        --bg-warn: #332b00;
        --bg-error: #342020;

        --value-string: #ce9178;
        --value-number: #b5cea8;
        --value-boolean: #569cd6;
        --value-null: #6a6a6a;
        --value-function: #dcdcaa;
        --value-date: #4fc1ff;
        --value-regexp: #d16969;
        --value-element: #4ec9b0;

        --btn-bg: #3e3e42;
        --btn-border: #555;
        --btn-hover: #505050;
        --btn-active: #0e639c;

        --table-border: #3e3e42;
        --table-header-bg: #2d2d30;
        --table-row-hover: #2a2a2a;

        --scrollbar-track: #1e1e1e;
        --scrollbar-thumb: #424242;
        --scrollbar-thumb-hover: #4e4e4e;
      }

      /* ===== LIGHT THEME ===== */
      .console-feed[data-theme="light"] {
        --bg-primary: #ffffff;
        --bg-secondary: #f3f3f3;
        --bg-tertiary: #f8f8f8;
        --bg-hover: #f0f0f0;
        --border-color: #e0e0e0;
        --text-primary: #333333;
        --text-secondary: #999999;

        --color-log: #0066cc;
        --color-info: #0078d4;
        --color-warn: #ff8c00;
        --color-error: #e81123;
        --color-debug: #8b5cf6;
        --color-table: #00a67e;
        --color-time: #00a67e;

        --bg-warn: #fff9e6;
        --bg-error: #ffe6e6;

        --value-string: #a31515;
        --value-number: #098658;
        --value-boolean: #0000ff;
        --value-null: #999999;
        --value-function: #795e26;
        --value-date: #0078d4;
        --value-regexp: #e81123;
        --value-element: #00a67e;

        --btn-bg: #e8e8e8;
        --btn-border: #cccccc;
        --btn-hover: #d8d8d8;
        --btn-active: #0066cc;

        --table-border: #e0e0e0;
        --table-header-bg: #f3f3f3;
        --table-row-hover: #f8f8f8;

        --scrollbar-track: #f0f0f0;
        --scrollbar-thumb: #c0c0c0;
        --scrollbar-thumb-hover: #a0a0a0;
      }

      .console-feed {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--bg-primary);
        color: var(--text-primary);
        transition: background 0.2s, color 0.2s;
      }

      .console-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        gap: 8px;
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
      }

      .console-search {
        display: flex;
        flex: 1;
        max-width: 200px;
      }

      .search-input {
        width: 100%;
        padding: 4px 8px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 3px;
        color: var(--text-primary);
        font-family: inherit;
        font-size: 11px;
      }

      .search-input::placeholder {
        color: var(--text-secondary);
      }

      .search-input:focus {
        outline: 2px solid var(--btn-active);
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
        background: var(--btn-bg);
        color: var(--text-primary);
        border: 1px solid var(--btn-border);
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
        background: var(--btn-hover);
      }

      .filter-btn.active {
        background: var(--btn-active);
        border-color: var(--btn-active);
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
        background: var(--bg-hover);
      }

      .log-timestamp {
        color: var(--text-secondary);
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
        border-left-color: var(--color-log);
      }

      .log-log .log-method {
        color: var(--color-log);
      }

      .log-info {
        border-left-color: var(--color-info);
      }

      .log-info .log-method {
        color: var(--color-info);
      }

      .log-warn {
        border-left-color: var(--color-warn);
        background: var(--bg-warn);
      }

      .log-warn .log-method {
        color: var(--color-warn);
      }

      .log-error {
        border-left-color: var(--color-error);
        background: var(--bg-error);
      }

      .log-error .log-method {
        color: var(--color-error);
      }

      .log-debug {
        border-left-color: var(--color-debug);
      }

      .log-debug .log-method {
        color: var(--color-debug);
      }

      .log-table {
        border-left-color: var(--color-table);
      }

      .log-table .log-method {
        color: var(--color-table);
      }

      .log-time {
        border-left-color: var(--color-time);
      }

      .log-time .log-method {
        color: var(--color-time);
      }

      .log-group {
        border-left-color: var(--color-log);
      }

      .log-group .log-method {
        color: var(--text-secondary);
      }

      .group-header {
        cursor: pointer;
        font-weight: 600;
      }

      .group-header:hover {
        text-decoration: underline;
      }

      .log-trace {
        border-left-color: var(--color-debug);
      }

      .log-trace .log-method {
        color: var(--color-debug);
      }

      .stack-trace {
        margin-top: 4px;
        padding: 8px;
        background: var(--bg-tertiary);
        border-radius: 4px;
        font-size: 10px;
        color: var(--text-secondary);
        overflow-x: auto;
        white-space: pre;
        font-family: inherit;
      }

      .log-count {
        border-left-color: var(--color-info);
      }

      .log-count .log-method {
        color: var(--color-info);
      }

      .log-dir {
        border-left-color: var(--color-log);
      }

      .log-dir .log-method {
        color: var(--text-secondary);
      }

      /* Value type styles */
      .value-string {
        color: var(--value-string);
      }

      .value-number {
        color: var(--value-number);
      }

      .value-boolean {
        color: var(--value-boolean);
      }

      .value-null, .value-undefined {
        color: var(--value-null);
        font-style: italic;
      }

      .value-function {
        color: var(--value-function);
      }

      .value-array, .value-object {
        color: var(--text-primary);
      }

      .value-error {
        color: var(--color-error);
      }

      .value-date {
        color: var(--value-date);
      }

      .value-regexp {
        color: var(--value-regexp);
      }

      .value-element {
        color: var(--value-element);
      }

      .value-symbol {
        color: var(--value-regexp);
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
        outline: 2px solid var(--btn-active);
        outline-offset: 1px;
      }

      .expandable-header:focus:not(:focus-visible) {
        outline: none;
      }

      .expandable-header:focus-visible {
        outline: 2px solid var(--btn-active);
        outline-offset: 1px;
      }

      .filter-btn:focus-visible,
      .clear-btn:focus-visible,
      .theme-btn:focus-visible,
      .copy-btn:focus-visible {
        outline: 2px solid var(--btn-active);
        outline-offset: 2px;
      }

      .expand-icon {
        display: inline-block;
        width: 12px;
        color: var(--text-secondary);
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
        color: var(--color-log);
        margin-right: 8px;
      }

      .property-value {
        color: var(--text-primary);
      }

      .type-label {
        color: var(--text-secondary);
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
        background: var(--bg-primary);
      }

      .console-table th,
      .console-table td {
        border: 1px solid var(--table-border);
        padding: 4px 8px;
        text-align: left;
      }

      .console-table th {
        background: var(--table-header-bg);
        font-weight: bold;
        color: var(--text-primary);
        position: sticky;
        top: 0;
      }

      .console-table tr:hover {
        background: var(--table-row-hover);
      }

      .console-table .table-index {
        color: var(--text-secondary);
        font-weight: bold;
      }

      /* Scrollbar styles */
      .console-logs::-webkit-scrollbar {
        width: 10px;
      }

      .console-logs::-webkit-scrollbar-track {
        background: var(--scrollbar-track);
      }

      .console-logs::-webkit-scrollbar-thumb {
        background: var(--scrollbar-thumb);
        border-radius: 5px;
      }

      .console-logs::-webkit-scrollbar-thumb:hover {
        background: var(--scrollbar-thumb-hover);
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
    `;
  }
};
/** @type {number} Default maximum number of logs to retain */
g(l, "MAX_LOGS_DEFAULT", 1e3), /** @type {number} Maximum depth for nested object expansion */
g(l, "MAX_DEPTH", 2), /** @type {number} Number of items to show in array/object preview */
g(l, "PREVIEW_ITEMS", 3), /** @type {number} Maximum length for function preview string */
g(l, "FUNCTION_PREVIEW_LENGTH", 50);
let v = l;
customElements.define("browser-console", v);
export {
  v as BrowserConsole,
  v as default
};
