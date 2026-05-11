var x = Object.defineProperty;
var _ = (f, e, t) => e in f ? x(f, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : f[e] = t;
var g = (f, e, t) => _(f, typeof e != "symbol" ? e + "" : e, t);
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
        var r;
        if ((r = this.originalConsole[t]) == null || r.apply(console, a), t === "group" || t === "groupCollapsed") {
          const o = a[0] || "console.group", s = `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          this.groupStack.push({ label: o, collapsed: t === "groupCollapsed", id: s }), this.groupDepth++, this.addLog({
            method: "group",
            data: [o],
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
          const o = new Error().stack.split(`
`).slice(2).join(`
`);
          this.addLog({
            method: "trace",
            data: a.length ? a : ["console.trace"],
            timestamp: /* @__PURE__ */ new Date(),
            stack: o,
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
          const o = a[0] || "default";
          this.timers[o] = performance.now();
          return;
        }
        if (t === "timeEnd") {
          const o = a[0] || "default";
          if (this.timers[o] !== void 0) {
            const s = performance.now() - this.timers[o];
            delete this.timers[o], this.addLog({
              method: "time",
              data: [o, s],
              timestamp: /* @__PURE__ */ new Date(),
              groupDepth: this.groupDepth
            });
          }
          return;
        }
        if (t === "timeLog") {
          const o = a[0] || "default";
          if (this.timers[o] !== void 0) {
            const s = performance.now() - this.timers[o], n = a.slice(1);
            this.addLog({
              method: "time",
              data: [o, s, ...n],
              timestamp: /* @__PURE__ */ new Date(),
              groupDepth: this.groupDepth
            });
          }
          return;
        }
        if (t === "count") {
          const o = a[0] || "default";
          this.counters[o] = (this.counters[o] || 0) + 1, this.addLog({
            method: "count",
            data: [o, this.counters[o]],
            timestamp: /* @__PURE__ */ new Date(),
            groupDepth: this.groupDepth
          });
          return;
        }
        if (t === "countReset") {
          const o = a[0] || "default";
          delete this.counters[o];
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
    return e === null ? "null" : e === void 0 ? "undefined" : typeof e == "string" ? `"${e}"` : typeof e == "number" || typeof e == "boolean" ? String(e) : typeof e == "bigint" ? `${e}n` : typeof e == "symbol" ? e.toString() : typeof e == "function" ? e.toString().slice(0, 50) + (e.toString().length > 50 ? "..." : "") : Array.isArray(e) ? t > 2 ? `Array(${e.length})` : `[${e.map((a) => this.formatValuePlainText(a, t + 1)).join(", ")}]` : e instanceof Date ? e.toISOString() : e instanceof Error ? e.toString() : e instanceof Map ? `Map(${e.size})` : e instanceof Set ? `Set(${e.size})` : typeof e == "object" ? t > 2 ? "{...}" : `{${Object.entries(e).map(([r, o]) => `${r}: ${this.formatValuePlainText(o, t + 1)}`).join(", ")}}` : String(e);
  }
  /**
   * Format logs for clipboard as plain text
   * @returns {string} Plain text representation of visible logs
   */
  formatLogsForClipboard() {
    return this.logs.filter((t) => this.matchesFilters(t)).map((t) => {
      const a = this.formatTimestamp(t.timestamp), r = t.method.toUpperCase(), o = t.data.map((s) => this.formatValuePlainText(s)).join(" ");
      return `[${a}] [${r}] ${o}`;
    }).join(`
`);
  }
  /**
   * Copy visible logs to clipboard
   */
  async copyLogs() {
    const e = this.formatLogsForClipboard(), a = this.shadowRoot.querySelector(".copy-btn").querySelector(".copy-icon"), r = a.textContent;
    try {
      await navigator.clipboard.writeText(e), a.textContent = "✓", setTimeout(() => {
        a.textContent = r;
      }, 1500);
    } catch (o) {
      console.error("Failed to copy logs:", o), a.textContent = "✗", setTimeout(() => {
        a.textContent = r;
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
      a.addEventListener("click", (r) => {
        this.shadowRoot.querySelectorAll(".filter-btn").forEach((s) => {
          s.classList.remove("active"), s.setAttribute("aria-pressed", "false");
        }), r.target.classList.add("active"), r.target.setAttribute("aria-pressed", "true");
        const o = r.target.dataset.filter;
        this.setFilter(o === "all" ? null : o);
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
      const r = a.dataset.target, o = a.getAttribute("aria-expanded") === "true";
      r && e.set(r, o);
    }), e;
  }
  /**
   * Restore expansion states after render
   * @param {Map<string, boolean>} states - Previously saved expansion states
   */
  restoreExpansionStates(e) {
    e.forEach((t, a) => {
      if (t) {
        const r = this.shadowRoot.getElementById(a), o = this.shadowRoot.querySelector(`[data-target="${a}"]`);
        if (r && o) {
          r.style.display = "block", o.setAttribute("aria-expanded", "true");
          const s = o.querySelector(".expand-icon");
          s && (s.textContent = "▼");
        }
      }
    });
  }
  /**
   * Render all logs with expansion state preservation
   */
  renderLogs() {
    const e = this.shadowRoot.querySelector(".console-logs"), t = this.getExpansionStates(), a = this.logs.filter((r) => this.matchesFilters(r));
    e.innerHTML = a.map((r, o) => this.renderLog(r, o)).join(""), this.restoreExpansionStates(t);
  }
  /**
   * Render a single log entry
   */
  renderLog(e, t) {
    const a = this.formatTimestamp(e.timestamp), r = `log-${e.method}`, o = e.groupDepth ? `padding-left: ${e.groupDepth * 20}px;` : "";
    if (e.method === "group") {
      const s = e.groupId || `group_${t}`, n = e.collapsed;
      return `
        <div class="log-entry log-group" data-index="${t}" style="${o}">
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
        <div class="log-entry log-trace" data-index="${t}" style="${o}">
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
        <div class="log-entry log-count" data-index="${t}" style="${o}">
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
      const s = /* @__PURE__ */ new WeakSet(), n = e.data.map((c, p) => this.formatValue(c, 0, !0, s, `${t}_${p}`)).join(" ");
      return `
        <div class="log-entry log-dir" data-index="${t}" style="${o}">
          <span class="log-timestamp">${a}</span>
          <span class="log-method">[DIR]</span>
          <span class="log-content">${n}</span>
        </div>
      `;
    }
    if (e.method === "table") {
      const s = this.formatTable(e.data[0]);
      return `
        <div class="log-entry ${r}" data-index="${t}" style="${o}">
          <span class="log-timestamp">${a}</span>
          <span class="log-method">[TABLE]</span>
          <div class="log-content">${s}</div>
        </div>
      `;
    }
    if (e.method === "time" && e.data.length >= 2) {
      const [s, n, ...c] = e.data, p = c.length ? ` ${this.formatLogData(c, "log", t)}` : "";
      return `
        <div class="log-entry ${r}" data-index="${t}" style="${o}">
          <span class="log-timestamp">${a}</span>
          <span class="log-method">[TIMER]</span>
          <span class="log-content">
            <span class="value-string">${this.escapeHtml(s)}</span>:
            <span class="value-number">${n.toFixed(2)}ms</span>${p}
          </span>
        </div>
      `;
    }
    return `
      <div class="log-entry ${r}" data-index="${t}" style="${o}">
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
    const r = /* @__PURE__ */ new WeakSet();
    return e.map((o, s) => this.formatValue(o, 0, !1, r, `${a}_${s}`)).join(" ");
  }
  /**
   * Format table data
   */
  formatTable(e) {
    if (!e)
      return '<span class="value-undefined">undefined</span>';
    if (Array.isArray(e) && e.length > 0) {
      if (e.every((a) => typeof a == "object" && a !== null)) {
        const a = [...new Set(e.flatMap((r) => Object.keys(r)))];
        return `
          <div class="table-wrapper">
            <table class="console-table">
              <thead>
                <tr>
                  <th>(index)</th>
                  ${a.map((r) => `<th>${this.escapeHtml(r)}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${e.map(
          (r, o) => `
                  <tr>
                    <td class="table-index">${o}</td>
                    ${a.map((s) => `<td>${this.formatValue(r[s], 0, !1)}</td>`).join("")}
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
        (a, r) => `
                <tr>
                  <td class="table-index">${r}</td>
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
  formatValue(e, t = 0, a = !1, r = /* @__PURE__ */ new WeakSet(), o = "0") {
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
        const n = e.toString(), c = n.length > l.FUNCTION_PREVIEW_LENGTH ? n.substring(0, l.FUNCTION_PREVIEW_LENGTH) + "..." : n;
        return `<span class="value-function">${this.escapeHtml(c)}</span>`;
      }
      case "map": {
        if (r.has(e))
          return '<span class="value-object">[Circular]</span>';
        if (t > l.MAX_DEPTH)
          return `<span class="value-object">Map(${e.size})</span>`;
        r.add(e);
        const n = this.formatMap(e, t, r, o);
        return r.delete(e), n;
      }
      case "set": {
        if (r.has(e))
          return '<span class="value-array">[Circular]</span>';
        if (t > l.MAX_DEPTH)
          return `<span class="value-array">Set(${e.size})</span>`;
        r.add(e);
        const n = this.formatSet(e, t, r, o);
        return r.delete(e), n;
      }
      case "array": {
        if (r.has(e))
          return '<span class="value-array">[Circular]</span>';
        if (t > l.MAX_DEPTH)
          return `<span class="value-array">[Array(${e.length})]</span>`;
        r.add(e);
        const n = this.formatArray(e, t, a, r, o);
        return r.delete(e), n;
      }
      case "object": {
        if (e instanceof Error)
          return `<span class="value-error">${this.escapeHtml(e.toString())}</span>`;
        if (e instanceof Date)
          return `<span class="value-date">${e.toISOString()}</span>`;
        if (e instanceof RegExp)
          return `<span class="value-regexp">${this.escapeHtml(e.toString())}</span>`;
        if (r.has(e))
          return '<span class="value-object">[Circular]</span>';
        if (t > l.MAX_DEPTH)
          return '<span class="value-object">{Object}</span>';
        r.add(e);
        const n = this.formatObject(e, t, a, r, o);
        return r.delete(e), n;
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
  formatArray(e, t, a, r, o) {
    if (e.length === 0)
      return '<span class="value-array">[]</span>';
    const s = `arr_${o}`, n = e.slice(0, l.PREVIEW_ITEMS).map((b, i) => this.formatValue(b, t + 1, !1, r, `${o}_${i}`)).join(", "), c = e.length > l.PREVIEW_ITEMS ? `, ... ${e.length - l.PREVIEW_ITEMS} more` : "", p = e.map((b, i) => {
      const u = this.formatValue(b, t + 1, !1, r, `${o}_${i}`);
      return `<div class="object-property">
        <span class="property-key">${i}:</span>
        <span class="property-value">${u}</span>
      </div>`;
    }).join("");
    return `
      <div class="expandable-container">
        <span class="expandable-header" data-target="${s}" role="button" tabindex="0" aria-expanded="false" aria-controls="${s}">
          <span class="expand-icon" aria-hidden="true">▶</span>
          <span class="value-array"><span class="type-label">Array(${e.length})</span> [${n}${c}]</span>
        </span>
        <div class="expandable-content" id="${s}" style="display: none;" role="region">
          ${p}
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
  formatObject(e, t, a, r, o) {
    var h;
    const s = Reflect.ownKeys(e);
    if (s.length === 0)
      return '<span class="value-object">{}</span>';
    const n = `obj_${o}`, c = (d) => typeof d == "symbol" ? `<span class="value-symbol">${this.escapeHtml(d.toString())}</span>` : this.escapeHtml(String(d)), p = s.slice(0, l.PREVIEW_ITEMS).map((d, m) => {
      const v = this.formatValue(e[d], t + 1, !1, r, `${o}_p${m}`);
      return `${c(d)}: ${v}`;
    }).join(", "), b = s.length > l.PREVIEW_ITEMS ? `, ... ${s.length - l.PREVIEW_ITEMS} more` : "", i = s.map((d, m) => {
      const v = this.formatValue(e[d], t + 1, !1, r, `${o}_p${m}`);
      return `<div class="object-property">
        <span class="property-key">${c(d)}:</span>
        <span class="property-value">${v}</span>
      </div>`;
    }).join(""), u = ((h = e.constructor) == null ? void 0 : h.name) || "Object";
    return `
      <div class="expandable-container">
        <span class="expandable-header" data-target="${n}" role="button" tabindex="0" aria-expanded="false" aria-controls="${n}">
          <span class="expand-icon" aria-hidden="true">▶</span>
          <span class="value-object"><span class="type-label">${u}</span> {${p}${b}}</span>
        </span>
        <div class="expandable-content" id="${n}" style="display: none;" role="region">
          ${i}
        </div>
      </div>`;
  }
  /**
   * Format a DOM element
   */
  formatElement(e) {
    const t = e.tagName.toLowerCase(), a = e.id ? `#${e.id}` : "", r = e.className ? `.${e.className.split(" ").join(".")}` : "";
    return `<span class="value-element">&lt;${t}${a}${r}&gt;</span>`;
  }
  /**
   * Format a Map
   * @param {Map} map - Map to format
   * @param {number} depth - Current nesting depth
   * @param {WeakSet} visited - Set of visited objects for circular detection
   * @param {string} path - Stable path for generating element IDs
   */
  formatMap(e, t, a, r) {
    if (e.size === 0)
      return '<span class="value-object">Map(0) {}</span>';
    const o = `map_${r}`, s = [...e.entries()], n = s.slice(0, l.PREVIEW_ITEMS).map(([b, i], u) => {
      const h = this.formatValue(b, t + 1, !1, a, `${r}_k${u}`), d = this.formatValue(i, t + 1, !1, a, `${r}_v${u}`);
      return `${h} => ${d}`;
    }).join(", "), c = e.size > l.PREVIEW_ITEMS ? `, ... ${e.size - l.PREVIEW_ITEMS} more` : "", p = s.map(([b, i], u) => {
      const h = this.formatValue(b, t + 1, !1, a, `${r}_k${u}`), d = this.formatValue(i, t + 1, !1, a, `${r}_v${u}`);
      return `<div class="object-property">
        <span class="property-key">${h} =></span>
        <span class="property-value">${d}</span>
      </div>`;
    }).join("");
    return `
      <div class="expandable-container">
        <span class="expandable-header" data-target="${o}" role="button" tabindex="0" aria-expanded="false" aria-controls="${o}">
          <span class="expand-icon" aria-hidden="true">▶</span>
          <span class="value-object"><span class="type-label">Map(${e.size})</span> {${n}${c}}</span>
        </span>
        <div class="expandable-content" id="${o}" style="display: none;" role="region">
          ${p}
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
  formatSet(e, t, a, r) {
    if (e.size === 0)
      return '<span class="value-array">Set(0) {}</span>';
    const o = `set_${r}`, s = [...e.values()], n = s.slice(0, l.PREVIEW_ITEMS).map((b, i) => this.formatValue(b, t + 1, !1, a, `${r}_${i}`)).join(", "), c = e.size > l.PREVIEW_ITEMS ? `, ... ${e.size - l.PREVIEW_ITEMS} more` : "", p = s.map((b, i) => `<div class="object-property">
        <span class="property-value">${this.formatValue(b, t + 1, !1, a, `${r}_${i}`)}</span>
      </div>`).join("");
    return `
      <div class="expandable-container">
        <span class="expandable-header" data-target="${o}" role="button" tabindex="0" aria-expanded="false" aria-controls="${o}">
          <span class="expand-icon" aria-hidden="true">▶</span>
          <span class="value-array"><span class="type-label">Set(${e.size})</span> {${n}${c}}</span>
        </span>
        <div class="expandable-content" id="${o}" style="display: none;" role="region">
          ${p}
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
    const t = e.dataset.target, a = this.shadowRoot.getElementById(t), r = e.querySelector(".expand-icon");
    a && (a.style.display !== "none" ? (a.style.display = "none", e.setAttribute("aria-expanded", "false"), r && (r.textContent = "▶")) : (a.style.display = "block", e.setAttribute("aria-expanded", "true"), r && (r.textContent = "▼")));
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
    `;
  }
};
/** @type {number} Default maximum number of logs to retain */
g(l, "MAX_LOGS_DEFAULT", 1e3), /** @type {number} Maximum depth for nested object expansion */
g(l, "MAX_DEPTH", 2), /** @type {number} Number of items to show in array/object preview */
g(l, "PREVIEW_ITEMS", 3), /** @type {number} Maximum length for function preview string */
g(l, "FUNCTION_PREVIEW_LENGTH", 50);
let y = l;
customElements.define("browser-console", y);
export {
  y as BrowserConsole,
  y as default
};
