/**
 * @fileoverview Performance Monitoring and Optimization utilities
 * @module PerformanceMonitor
 */

import { logger } from './logger.js';

/**
 * Performance Monitor for tracking and optimizing application performance
 * @class PerformanceMonitor
 */
export class PerformanceMonitor {
  constructor() {
    this.logger = logger.createChild('Performance');
    this.metrics = new Map();
    this.marks = new Map();
    this.observers = [];
    
    // Initialize performance observers if available
    if ('PerformanceObserver' in window) {
      this._initObservers();
    }
    
    this.logger.info('Performance monitor initialized');
  }
  
  /**
   * Start timing a task
   * @param {string} name - Task name
   */
  mark(name) {
    const markName = `${name}-start`;
    performance.mark(markName);
    this.marks.set(name, Date.now());
  }
  
  /**
   * End timing and record measure
   * @param {string} name - Task name
   * @returns {number} Duration in milliseconds
   */
  measure(name) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    
    performance.mark(endMark);
    
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      const duration = measure.duration;
      
      // Store metric
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name).push(duration);
      
      // Log if slow
      if (duration > 100) {
        this.logger.warn('Slow operation detected', { 
          name, 
          duration: `${duration.toFixed(2)}ms` 
        });
      }
      
      // Cleanup
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);
      this.marks.delete(name);
      
      return duration;
    } catch (error) {
      this.logger.error('Measure failed', error, name);
      return 0;
    }
  }
  
  /**
   * Get statistics for a metric
   * @param {string} name - Metric name
   * @returns {Object} Statistics
   */
  getStats(name) {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      name,
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
  
  /**
   * Get all metrics
   * @returns {Object} All metrics statistics
   */
  getAllStats() {
    const stats = {};
    for (const name of this.metrics.keys()) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }
  
  /**
   * Monitor a function execution
   * @param {string} name - Function name
   * @param {Function} fn - Function to monitor
   * @returns {Function} Wrapped function
   */
  monitor(name, fn) {
    return async (...args) => {
      this.mark(name);
      try {
        const result = await fn(...args);
        return result;
      } finally {
        this.measure(name);
      }
    };
  }
  
  /**
   * Debounce function with performance tracking
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @param {string} [name] - Optional name for tracking
   * @returns {Function} Debounced function
   */
  debounce(fn, delay, name) {
    let timeoutId;
    let callCount = 0;
    
    return (...args) => {
      callCount++;
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        if (name) this.mark(name);
        await fn(...args);
        if (name) {
          const duration = this.measure(name);
          this.logger.debug('Debounced function executed', { 
            name, 
            callCount, 
            duration: `${duration.toFixed(2)}ms` 
          });
        }
        callCount = 0;
      }, delay);
    };
  }
  
  /**
   * Throttle function with performance tracking
   * @param {Function} fn - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @param {string} [name] - Optional name for tracking
   * @returns {Function} Throttled function
   */
  throttle(fn, limit, name) {
    let inThrottle;
    let lastResult;
    
    return async (...args) => {
      if (!inThrottle) {
        if (name) this.mark(name);
        lastResult = await fn(...args);
        if (name) {
          const duration = this.measure(name);
          this.logger.debug('Throttled function executed', { 
            name, 
            duration: `${duration.toFixed(2)}ms` 
          });
        }
        
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
      return lastResult;
    };
  }
  
  /**
   * Measure memory usage (if available)
   * @returns {Object|null} Memory info
   */
  getMemoryInfo() {
    if (performance.memory) {
      return {
        usedJSHeapSize: this._formatBytes(performance.memory.usedJSHeapSize),
        totalJSHeapSize: this._formatBytes(performance.memory.totalJSHeapSize),
        jsHeapSizeLimit: this._formatBytes(performance.memory.jsHeapSizeLimit),
        usage: `${((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2)}%`
      };
    }
    return null;
  }
  
  /**
   * Get page load metrics
   * @returns {Object} Load metrics
   */
  getPageLoadMetrics() {
    const [navigation] = performance.getEntriesByType('navigation');
    if (!navigation) return null;
    
    return {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      load: navigation.loadEventEnd - navigation.loadEventStart,
      total: navigation.loadEventEnd - navigation.fetchStart
    };
  }
  
  /**
   * Generate performance report
   * @returns {string} HTML report
   */
  generateReport() {
    const stats = this.getAllStats();
    const memory = this.getMemoryInfo();
    const loadMetrics = this.getPageLoadMetrics();
    
    let report = '# Performance Report\n\n';
    
    // Metrics
    report += '## Metrics\n\n';
    Object.values(stats).forEach(stat => {
      if (stat) {
        report += `### ${stat.name}\n`;
        report += `- Count: ${stat.count}\n`;
        report += `- Average: ${stat.avg.toFixed(2)}ms\n`;
        report += `- Median: ${stat.median.toFixed(2)}ms\n`;
        report += `- Min: ${stat.min.toFixed(2)}ms\n`;
        report += `- Max: ${stat.max.toFixed(2)}ms\n`;
        report += `- P95: ${stat.p95.toFixed(2)}ms\n\n`;
      }
    });
    
    // Memory
    if (memory) {
      report += '## Memory\n\n';
      report += `- Used: ${memory.usedJSHeapSize}\n`;
      report += `- Total: ${memory.totalJSHeapSize}\n`;
      report += `- Limit: ${memory.jsHeapSizeLimit}\n`;
      report += `- Usage: ${memory.usage}\n\n`;
    }
    
    // Load metrics
    if (loadMetrics) {
      report += '## Page Load\n\n';
      report += `- DNS: ${loadMetrics.dns.toFixed(2)}ms\n`;
      report += `- TCP: ${loadMetrics.tcp.toFixed(2)}ms\n`;
      report += `- Request: ${loadMetrics.request.toFixed(2)}ms\n`;
      report += `- Response: ${loadMetrics.response.toFixed(2)}ms\n`;
      report += `- DOM: ${loadMetrics.dom.toFixed(2)}ms\n`;
      report += `- Total: ${loadMetrics.total.toFixed(2)}ms\n\n`;
    }
    
    return report;
  }
  
  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    this.marks.clear();
    performance.clearMarks();
    performance.clearMeasures();
    this.logger.info('Performance metrics cleared');
  }
  
  // Private methods
  
  _initObservers() {
    try {
      // Long Tasks Observer - only log tasks > 100ms
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 100) { // Only log significant long tasks
            this.logger.warn('Long task detected', {
              duration: `${entry.duration.toFixed(2)}ms`,
              startTime: entry.startTime
            });
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
      
      // Layout Shift Observer
      const layoutShiftObserver = new PerformanceObserver((list) => {
        let cls = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
        if (cls > 0.1) {
          this.logger.warn('Layout shift detected', { cls });
        }
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(layoutShiftObserver);
      
    } catch (error) {
      this.logger.error('Failed to initialize observers', error);
    }
  }
  
  _formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
  
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.clear();
    this.logger.info('Performance monitor destroyed');
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

