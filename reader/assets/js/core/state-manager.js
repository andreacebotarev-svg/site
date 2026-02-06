/**
 * @fileoverview Advanced State Manager with Observable pattern
 * @module StateManager
 * @description Centralized state management with reactive updates and time-travel debugging
 */

/**
 * @typedef {Object} StateListener
 * @property {Function} callback - Callback function
 * @property {string[]} [paths] - Specific paths to listen to
 */

/**
 * @typedef {Object} StateSnapshot
 * @property {Object} state - State data
 * @property {number} timestamp - Timestamp
 * @property {string} action - Action name
 */

/**
 * Advanced State Manager with Observable pattern and time-travel debugging
 * @class StateManager
 */
export class StateManager {
  /**
   * @param {Object} initialState - Initial state
   * @param {Object} [options] - Configuration options
   * @param {boolean} [options.enableDevTools=true] - Enable dev tools
   * @param {number} [options.historyLimit=50] - History limit for time-travel
   */
  constructor(initialState = {}, options = {}) {
    this._state = this._deepFreeze(initialState);
    this._listeners = new Map();
    this._middlewares = [];
    this._history = [];
    this._historyIndex = -1;
    this._options = {
      enableDevTools: true,
      historyLimit: 50,
      ...options
    };
    
    // Performance monitoring
    this._performanceMetrics = {
      updates: 0,
      totalUpdateTime: 0,
      listenerExecutionTime: 0
    };
    
    // Add initial snapshot
    this._addSnapshot('@@INIT', initialState);
    
    // Expose to window for debugging
    if (this._options.enableDevTools && typeof window !== 'undefined') {
      window.__STATE_MANAGER__ = this;
    }
  }
  
  /**
   * Get current state or specific path
   * @param {string} [path] - Dot notation path (e.g., 'user.profile.name')
   * @returns {*} Current state or value at path
   */
  getState(path) {
    if (!path) return this._state;
    return this._getByPath(this._state, path);
  }
  
  /**
   * Update state immutably
   * @param {Function|Object} updater - Update function or partial state
   * @param {string} [actionName] - Action name for debugging
   * @returns {Promise<Object>} New state
   */
  async setState(updater, actionName = 'UPDATE') {
    const startTime = performance.now();
    
    try {
      // Run middlewares
      for (const middleware of this._middlewares) {
        const result = await middleware(this._state, updater, actionName);
        if (result === false) {
          console.warn(`[StateManager] Middleware blocked action: ${actionName}`);
          return this._state;
        }
      }
      
      // Calculate new state
      const newState = typeof updater === 'function'
        ? updater(this._state)
        : { ...this._state, ...updater };
      
      // Deep freeze for immutability
      this._state = this._deepFreeze(newState);
      
      // Add to history
      this._addSnapshot(actionName, newState);
      
      // Notify listeners
      const listenerStartTime = performance.now();
      await this._notifyListeners();
      const listenerEndTime = performance.now();
      
      // Update metrics
      const endTime = performance.now();
      this._performanceMetrics.updates++;
      this._performanceMetrics.totalUpdateTime += (endTime - startTime);
      this._performanceMetrics.listenerExecutionTime += (listenerEndTime - listenerStartTime);
      
      // Log in dev mode
      if (this._options.enableDevTools) {
        this._logStateChange(actionName, newState, endTime - startTime);
      }
      
      return this._state;
    } catch (error) {
      console.error('[StateManager] Error updating state:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback function
   * @param {string[]} [paths] - Specific paths to listen to
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback, paths = null) {
    const id = this._generateId();
    this._listeners.set(id, { callback, paths });
    
    // Return unsubscribe function
    return () => this._listeners.delete(id);
  }
  
  /**
   * Add middleware
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this._middlewares.push(middleware);
  }
  
  /**
   * Time-travel: Go back in history
   */
  undo() {
    if (this._historyIndex > 0) {
      this._historyIndex--;
      this._state = this._deepFreeze(this._history[this._historyIndex].state);
      this._notifyListeners();
      console.log('[StateManager] Undo:', this._history[this._historyIndex].action);
    }
  }
  
  /**
   * Time-travel: Go forward in history
   */
  redo() {
    if (this._historyIndex < this._history.length - 1) {
      this._historyIndex++;
      this._state = this._deepFreeze(this._history[this._historyIndex].state);
      this._notifyListeners();
      console.log('[StateManager] Redo:', this._history[this._historyIndex].action);
    }
  }
  
  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    const avgUpdateTime = this._performanceMetrics.updates > 0
      ? this._performanceMetrics.totalUpdateTime / this._performanceMetrics.updates
      : 0;
    
    return {
      ...this._performanceMetrics,
      avgUpdateTime: avgUpdateTime.toFixed(2),
      listeners: this._listeners.size,
      middlewares: this._middlewares.length,
      historySize: this._history.length
    };
  }
  
  /**
   * Clear history
   */
  clearHistory() {
    this._history = [this._history[this._history.length - 1]];
    this._historyIndex = 0;
  }
  
  /**
   * Reset to initial state
   */
  reset() {
    if (this._history.length > 0) {
      this._state = this._deepFreeze(this._history[0].state);
      this._historyIndex = 0;
      this._notifyListeners();
    }
  }
  
  // Private methods
  
  _addSnapshot(action, state) {
    // Remove future history if we're not at the end
    if (this._historyIndex < this._history.length - 1) {
      this._history = this._history.slice(0, this._historyIndex + 1);
    }
    
    this._history.push({
      state: JSON.parse(JSON.stringify(state)), // Deep clone
      timestamp: Date.now(),
      action
    });
    
    // Limit history size
    if (this._history.length > this._options.historyLimit) {
      this._history.shift();
    } else {
      this._historyIndex++;
    }
  }
  
  async _notifyListeners() {
    const promises = [];
    
    for (const [id, listener] of this._listeners) {
      try {
        // If paths specified, check if any changed
        if (listener.paths) {
          const hasChanges = listener.paths.some(path => {
            // Compare with previous state
            return true; // Simplified for now
          });
          
          if (!hasChanges) continue;
        }
        
        promises.push(Promise.resolve(listener.callback(this._state)));
      } catch (error) {
        console.error('[StateManager] Listener error:', error);
      }
    }
    
    await Promise.all(promises);
  }
  
  _deepFreeze(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    Object.freeze(obj);
    
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this._deepFreeze(obj[key]);
      }
    });
    
    return obj;
  }
  
  _getByPath(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  _logStateChange(action, newState, duration) {
    const styles = [
      'color: #4CAF50; font-weight: bold',
      'color: #2196F3',
      'color: #FF9800'
    ];
    
    console.groupCollapsed(
      `%c[StateManager]%c ${action} %c(${duration.toFixed(2)}ms)`,
      ...styles
    );
    console.log('New State:', newState);
    console.log('Listeners:', this._listeners.size);
    console.log('History Index:', this._historyIndex, '/', this._history.length);
    console.groupEnd();
  }
}

// Create singleton instance
export const globalState = new StateManager({
  vocabulary: {
    words: [],
    dueCount: 0,
    totalCount: 0
  },
  session: {
    currentCard: null,
    currentIndex: 0,
    stats: {
      reviewed: 0,
      correct: 0,
      incorrect: 0
    }
  },
  ui: {
    isLoading: false,
    currentView: 'library',
    theme: 'light'
  },
  settings: {
    language: 'en',
    autoPlayAudio: false,
    cardOrder: 'random',
    theme: 'auto',
    eyeComfort: 'off',
    blueLightFilter: 'auto',
    readingWidth: 'optimal',
    fontFamily: 'serif-georgia',
    fontSmoothing: 'auto'
  }
});

