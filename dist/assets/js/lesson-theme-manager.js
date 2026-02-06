/**
 * ThemeManager - Manages theme switching and persistence
 * 
 * Supports three themes: 'default', 'kids', 'dark'
 * Saves user preference to localStorage
 * Handles CSS lazy loading and smooth transitions
 * 
 * @class ThemeManager
 */
class ThemeManager {
  /**
   * Creates an instance of ThemeManager
   */
  constructor() {
    this.currentTheme = 'default';
    this.availableThemes = ['default', 'kids', 'dark'];
    this.storageKey = 'lesson_theme';
    this.autoDetect = true; // Auto-detect system theme preference
    this.themeChangeCallbacks = [];
    
    console.log('[ThemeManager] Initialized with available themes:', this.availableThemes);
  }
  
  /**
   * Initialize theme manager
   * Loads saved theme or detects system preference
   * 
   * @returns {Promise<void>}
   */
  async init() {
    try {
      console.log('[ThemeManager] Initializing...');
      
      // Try to load saved theme from localStorage
      const savedTheme = this.loadSavedTheme();
      
      if (savedTheme && this.isValidTheme(savedTheme)) {
        console.log('[ThemeManager] Found saved theme:', savedTheme);
        await this.switchTheme(savedTheme, false); // false = don't save again
      } else if (this.autoDetect) {
        // No saved theme - detect system preference
        const systemTheme = this.detectSystemTheme();
        console.log('[ThemeManager] No saved theme, using system preference:', systemTheme);
        await this.switchTheme(systemTheme, true);
      } else {
        // Fallback to default
        console.log('[ThemeManager] Using default theme');
        await this.switchTheme('default', true);
      }
      
      // Listen for system theme changes
      this.setupSystemThemeListener();
      
      console.log('[ThemeManager] ✅ Initialization complete');
    } catch (error) {
      console.error('[ThemeManager] ❌ Initialization failed:', error);
      // Fallback to default theme on error
      await this.applyTheme('default');
    }
  }
  
  /**
   * Switch to a different theme
   * 
   * @param {string} themeName - Name of the theme to switch to
   * @param {boolean} shouldSave - Whether to save the preference (default: true)
   * @returns {Promise<void>}
   */
  async switchTheme(themeName, shouldSave = true) {
    try {
      // Validate theme name
      if (!this.isValidTheme(themeName)) {
        console.warn('[ThemeManager] Invalid theme name:', themeName, '- falling back to default');
        themeName = 'default';
      }
      
      // Don't switch if already on this theme
      if (this.currentTheme === themeName) {
        console.log('[ThemeManager] Already on theme:', themeName);
        return;
      }
      
      console.log('[ThemeManager] Switching theme:', this.currentTheme, '→', themeName);
      
      // Add smooth transition
      this.enableTransition();
      
      // Load theme CSS if needed
      await this.loadThemeCSS(themeName);
      
      // Apply the theme
      await this.applyTheme(themeName);
      
      // Save preference if requested
      if (shouldSave) {
        this.saveTheme(themeName);
      }
      
      // Update current theme
      this.currentTheme = themeName;
      
      // Remove transition after animation completes
      setTimeout(() => this.disableTransition(), 300);
      
      // Announce theme change for accessibility
      this.announceThemeChange(themeName);
      
      // Notify callbacks
      this.notifyThemeChange(themeName);
      
      console.log('[ThemeManager] ✅ Theme switched successfully');
    } catch (error) {
      console.error('[ThemeManager] ❌ Failed to switch theme:', error);
      throw error;
    }
  }
  
  /**
   * Apply theme by setting data-theme attribute on body
   * 
   * @param {string} themeName - Theme name to apply
   * @returns {Promise<void>}
   */
  async applyTheme(themeName) {
    try {
      // Set data-theme attribute on both html and body for maximum compatibility
      document.documentElement.setAttribute('data-theme', themeName);
      document.body.setAttribute('data-theme', themeName);
      
      console.log('[ThemeManager] Applied theme attribute:', themeName);
    } catch (error) {
      console.error('[ThemeManager] Failed to apply theme:', error);
      throw error;
    }
  }
  
  /**
   * Load theme-specific CSS file
   * Uses lazy loading - only loads non-default themes
   * 
   * @param {string} themeName - Theme name
   * @returns {Promise<void>}
   */
  async loadThemeCSS(themeName) {
    try {
      // Default theme uses existing CSS, no need to load
      if (themeName === 'default') {
        // Remove any previously loaded theme CSS
        const oldLink = document.querySelector('link[data-theme-css]');
        if (oldLink) {
          oldLink.remove();
          console.log('[ThemeManager] Removed theme CSS link');
        }
        return;
      }
      
      // Check if this theme CSS is already loaded
      const existingLink = document.querySelector(`link[data-theme-css="${themeName}"]`);
      if (existingLink) {
        console.log('[ThemeManager] Theme CSS already loaded:', themeName);
        return;
      }
      
      // Remove old theme CSS
      const oldLink = document.querySelector('link[data-theme-css]');
      if (oldLink) {
        oldLink.remove();
      }
      
      // Create new link element for theme CSS
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `assets/css/lesson-theme-${themeName}.css`;
        link.setAttribute('data-theme-css', themeName);
        
        link.onload = () => {
          console.log('[ThemeManager] ✅ Theme CSS loaded:', themeName);
          resolve();
        };
        
        link.onerror = () => {
          console.warn('[ThemeManager] ⚠️ Failed to load theme CSS:', themeName);
          // Don't reject - theme can still work with just data-theme attribute
          resolve();
        };
        
        document.head.appendChild(link);
      });
    } catch (error) {
      console.error('[ThemeManager] Error loading theme CSS:', error);
      // Don't throw - allow theme to work even if CSS fails to load
    }
  }
  
  /**
   * Save theme preference to localStorage
   * 
   * @param {string} themeName - Theme name to save
   */
  saveTheme(themeName) {
    try {
      localStorage.setItem(this.storageKey, themeName);
      console.log('[ThemeManager] Saved theme preference:', themeName);
    } catch (error) {
      console.error('[ThemeManager] Failed to save theme:', error);
    }
  }
  
  /**
   * Load saved theme from localStorage
   * 
   * @returns {string|null} Saved theme name or null
   */
  loadSavedTheme() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved;
    } catch (error) {
      console.error('[ThemeManager] Failed to load saved theme:', error);
      return null;
    }
  }
  
  /**
   * Detect system theme preference
   * 
   * @returns {string} 'dark' or 'default'
   */
  detectSystemTheme() {
    try {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'default';
    } catch (error) {
      console.error('[ThemeManager] Failed to detect system theme:', error);
      return 'default';
    }
  }
  
  /**
   * Setup listener for system theme changes
   */
  setupSystemThemeListener() {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      mediaQuery.addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually selected a theme
        const savedTheme = this.loadSavedTheme();
        if (!savedTheme && this.autoDetect) {
          const newTheme = e.matches ? 'dark' : 'default';
          console.log('[ThemeManager] System theme changed:', newTheme);
          this.switchTheme(newTheme, false); // Don't save auto-detected theme
        }
      });
      
      console.log('[ThemeManager] System theme listener active');
    } catch (error) {
      console.error('[ThemeManager] Failed to setup system theme listener:', error);
    }
  }
  
  /**
   * Validate theme name
   * 
   * @param {string} themeName - Theme name to validate
   * @returns {boolean} True if valid
   */
  isValidTheme(themeName) {
    return this.availableThemes.includes(themeName);
  }
  
  /**
   * Enable smooth transition for theme change
   */
  enableTransition() {
    try {
      document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    } catch (error) {
      console.error('[ThemeManager] Failed to enable transition:', error);
    }
  }
  
  /**
   * Disable transition after theme change
   */
  disableTransition() {
    try {
      document.body.style.transition = '';
    } catch (error) {
      console.error('[ThemeManager] Failed to disable transition:', error);
    }
  }
  
  /**
   * Announce theme change for screen readers
   * 
   * @param {string} themeName - Theme name
   */
  announceThemeChange(themeName) {
    try {
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.overflow = 'hidden';
      
      const themeLabels = {
        'default': 'Classic',
        'kids': 'Kids Mode',
        'dark': 'Dark Mode'
      };
      
      announcement.textContent = `Theme changed to ${themeLabels[themeName] || themeName}`;
      document.body.appendChild(announcement);
      
      // Remove after announcement
      setTimeout(() => {
        if (announcement.parentNode) {
          announcement.remove();
        }
      }, 1000);
    } catch (error) {
      console.error('[ThemeManager] Failed to announce theme change:', error);
    }
  }
  
  /**
   * Register callback for theme changes
   * 
   * @param {Function} callback - Function to call when theme changes
   */
  onThemeChange(callback) {
    if (typeof callback === 'function') {
      this.themeChangeCallbacks.push(callback);
    }
  }
  
  /**
   * Notify all registered callbacks of theme change
   * 
   * @param {string} themeName - New theme name
   */
  notifyThemeChange(themeName) {
    this.themeChangeCallbacks.forEach(callback => {
      try {
        callback(themeName);
      } catch (error) {
        console.error('[ThemeManager] Error in theme change callback:', error);
      }
    });
  }
  
  /**
   * Get current theme name
   * 
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  /**
   * Get available themes
   * 
   * @returns {string[]} Array of available theme names
   */
  getAvailableThemes() {
    return [...this.availableThemes];
  }
}

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}