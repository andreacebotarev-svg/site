/**
 * @fileoverview Advanced logging system with levels, contexts, and persistence
 * @module Logger
 */

/**
 * Log levels
 * @enum {number}
 */
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

/**
 * @typedef {Object} LogEntry
 * @property {number} timestamp - Timestamp
 * @property {string} level - Log level
 * @property {string} message - Log message
 * @property {string} [context] - Context/module name
 * @property {*} [data] - Additional data
 * @property {string} [stack] - Error stack trace
 */

/**
 * Advanced Logger with levels, contexts, and persistence
 * @class Logger
 */
export class Logger {
  /**
   * @param {Object} [options] - Logger options
   * @param {number} [options.level=LogLevel.INFO] - Minimum log level
   * @param {boolean} [options.persist=true] - Persist logs to localStorage
   * @param {number} [options.maxLogs=1000] - Maximum logs to keep
   * @param {boolean} [options.enableConsole=true] - Enable console output
   */
  constructor(options = {}) {
    this.options = {
      level: LogLevel.INFO,
      persist: true,
      maxLogs: 1000,
      enableConsole: true,
      ...options
    };
    
    this.logs = [];
    this.storageKey = 'reader_logs';
    
    // Load persisted logs
    if (this.options.persist) {
      this._loadLogs();
    }
    
    // Expose to window for debugging
    if (typeof window !== 'undefined') {
      window.__LOGGER__ = this;
    }
  }
  
  /**
   * Log debug message
   * @param {string} message - Message
   * @param {*} [data] - Additional data
   * @param {string} [context] - Context
   */
  debug(message, data, context) {
    this._log(LogLevel.DEBUG, message, data, context);
  }
  
  /**
   * Log info message
   * @param {string} message - Message
   * @param {*} [data] - Additional data
   * @param {string} [context] - Context
   */
  info(message, data, context) {
    this._log(LogLevel.INFO, message, data, context);
  }
  
  /**
   * Log warning message
   * @param {string} message - Message
   * @param {*} [data] - Additional data
   * @param {string} [context] - Context
   */
  warn(message, data, context) {
    this._log(LogLevel.WARN, message, data, context);
  }
  
  /**
   * Log error message
   * @param {string} message - Message
   * @param {Error|*} [error] - Error object or data
   * @param {string} [context] - Context
   */
  error(message, error, context) {
    const stack = error instanceof Error ? error.stack : undefined;
    this._log(LogLevel.ERROR, message, error, context, stack);
  }
  
  /**
   * Log fatal error message
   * @param {string} message - Message
   * @param {Error|*} [error] - Error object or data
   * @param {string} [context] - Context
   */
  fatal(message, error, context) {
    const stack = error instanceof Error ? error.stack : undefined;
    this._log(LogLevel.FATAL, message, error, context, stack);
  }

  /**
   * Start timing a operation
   * @param {string} label - Timer label
   * @param {string} [context] - Optional context
   */
  time(label, context) {
    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark(`${label}-start`);
        this.debug(`Timer started: ${label}`, null, context);
      } catch (error) {
        this.warn(`Failed to start timer: ${label}`, error, context);
      }
    } else if (typeof console !== 'undefined' && console.time) {
      console.time(label);
    }
  }

  /**
   * End timing a operation
   * @param {string} label - Timer label
   * @param {string} [context] - Optional context
   */
  timeEnd(label, context) {
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      try {
        performance.mark(`${label}-end`);
        const measure = performance.measure(label, `${label}-start`, `${label}-end`);
        const duration = measure.duration;
        this.debug(`Timer ended: ${label}`, { duration: `${duration.toFixed(2)}ms` }, context);
      } catch (error) {
        this.warn(`Failed to end timer: ${label}`, error, context);
      }
    } else if (typeof console !== 'undefined' && console.timeEnd) {
      console.timeEnd(label);
    }
  }

  /**
   * Create a child logger with context
   * @param {string} context - Context name
   * @returns {Object} Child logger
   */
  createChild(context) {
    return {
      debug: (msg, data) => this.debug(msg, data, context),
      info: (msg, data) => this.info(msg, data, context),
      warn: (msg, data) => this.warn(msg, data, context),
      error: (msg, error) => this.error(msg, error, context),
      fatal: (msg, error) => this.fatal(msg, error, context),
      time: (label) => this.time(label, context),
      timeEnd: (label) => this.timeEnd(label, context)
    };
  }
  
  /**
   * Get all logs
   * @param {Object} [filter] - Filter options
   * @returns {LogEntry[]} Filtered logs
   */
  getLogs(filter = {}) {
    let filtered = [...this.logs];
    
    if (filter.level !== undefined) {
      filtered = filtered.filter(log => log.level >= filter.level);
    }
    
    if (filter.context) {
      filtered = filtered.filter(log => log.context === filter.context);
    }
    
    if (filter.since) {
      filtered = filtered.filter(log => log.timestamp >= filter.since);
    }
    
    return filtered;
  }
  
  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
    if (this.options.persist) {
      this._saveLogs();
    }
  }
  
  /**
   * Export logs as JSON
   * @returns {string} JSON string
   */
  export() {
    return JSON.stringify(this.logs, null, 2);
  }
  
  /**
   * Get statistics
   * @returns {Object} Log statistics
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {},
      byContext: {},
      oldest: null,
      newest: null
    };
    
    Object.keys(LogLevel).forEach(level => {
      const levelNum = LogLevel[level];
      stats.byLevel[level] = this.logs.filter(log => log.level === levelNum).length;
    });
    
    this.logs.forEach(log => {
      if (log.context) {
        stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
      }
    });
    
    if (this.logs.length > 0) {
      stats.oldest = new Date(this.logs[0].timestamp);
      stats.newest = new Date(this.logs[this.logs.length - 1].timestamp);
    }
    
    return stats;
  }
  
  // Private methods
  
  _log(level, message, data, context, stack) {
    if (level < this.options.level) return;
    
    const entry = {
      timestamp: Date.now(),
      level,
      levelName: this._getLevelName(level),
      message,
      context,
      data,
      stack
    };
    
    // Add to logs
    this.logs.push(entry);
    
    // Trim if needed
    if (this.logs.length > this.options.maxLogs) {
      this.logs.shift();
    }
    
    // Persist
    if (this.options.persist) {
      this._saveLogs();
    }
    
    // Console output
    if (this.options.enableConsole) {
      this._consoleOutput(entry);
    }
  }
  
  _consoleOutput(entry) {
    const prefix = entry.context ? `[${entry.context}]` : '';
    const timestamp = new Date(entry.timestamp).toISOString();
    const message = `${timestamp} ${prefix} ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.data, entry.stack);
        break;
    }
  }
  
  _getLevelName(level) {
    return Object.keys(LogLevel).find(key => LogLevel[key] === level) || 'UNKNOWN';
  }
  
  _saveLogs() {
    try {
      // Only save recent logs to avoid localStorage quota
      const recentLogs = this.logs.slice(-100);
      localStorage.setItem(this.storageKey, JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }
  
  _loadLogs() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }
}

// Create singleton instance
export const logger = new Logger({
  level: LogLevel.DEBUG,
  persist: true,
  enableConsole: true
});

// Export LogLevel for external use
export { LogLevel };

