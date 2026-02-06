/**
 * HAPTIC FEEDBACK ENGINE
 * Professional Android-style haptic patterns with device detection.
 * Material Design 3 compliant vibration timings.
 */

class HapticFeedback {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      useAdvancedPatterns: config.useAdvancedPatterns ?? true,
      intensityScale: config.intensityScale ?? 1.0, // 0.5-1.5 multiplier
      ...config
    };

    // Device capabilities detection
    this._capabilities = this._detectCapabilities();
    this._isDestroyed = false;
    this._lastVibration = 0; // Debounce timestamp
    this._minInterval = 50; // Min ms between vibrations

    // Material Design 3 haptic patterns (Android-like)
    this._patterns = {
      // Light feedback (10-25ms)
      light: [10],
      tick: [5],
      
      // Standard feedback (30-50ms)
      success: [30],
      select: [20],
      
      // Medium feedback (50-80ms)
      impact: [50],
      notification: [40, 30, 40],
      
      // Heavy feedback (80-150ms)
      error: [100],
      warning: [80, 50, 80],
      
      // Complex patterns (multi-tap)
      milestone: [30, 50, 30, 50, 30, 50], // Triple tap celebration
      streak: [20, 30, 20, 30, 20],        // Double tap + hold
      combo: [15, 20, 15, 20, 15, 20, 15], // Rapid burst
      
      // Contextual patterns
      buttonPress: [5],                     // Minimal tactile
      swipe: [10],                          // Quick confirmation
      longPress: [50, 30],                  // Hold confirmation
      doubleClick: [20, 30, 20],           // Click-click
      
      // Game-specific
      levelUp: [50, 100, 50, 100],         // Power-up feeling
      powerDown: [150],                     // Fail state
      timeWarning: [30, 50, 30],           // Urgency pulse
    };

    // Apply intensity scaling
    if (this.config.intensityScale !== 1.0) {
      this._scalePatterns(this.config.intensityScale);
    }

    window.debugEffects && window.debugEffects('haptic_init', this._capabilities);
  }

  /**
   * Detect device haptic capabilities
   */
  _detectCapabilities() {
    const capabilities = {
      supported: 'vibrate' in navigator,
      platform: this._detectPlatform(),
      hasVibrationAPI: false,
      hasHapticEngine: false
    };

    // Check for modern Vibration API
    if (capabilities.supported) {
      try {
        navigator.vibrate(0); // Test call
        capabilities.hasVibrationAPI = true;
      } catch (e) {
        capabilities.supported = false;
      }
    }

    // Detect iPhone Haptic Engine (iOS 13+)
    if (capabilities.platform === 'ios' && window.webkit) {
      capabilities.hasHapticEngine = typeof window.webkit.messageHandlers !== 'undefined';
    }

    // Android Vibrator service (implicit)
    if (capabilities.platform === 'android') {
      capabilities.hasHapticEngine = capabilities.hasVibrationAPI;
    }

    return capabilities;
  }

  /**
   * Platform detection for optimized patterns
   */
  _detectPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) return 'android';
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/windows phone/.test(ua)) return 'windows';
    return 'unknown';
  }

  /**
   * Scale all patterns by intensity multiplier
   */
  _scalePatterns(scale) {
    Object.keys(this._patterns).forEach(key => {
      this._patterns[key] = this._patterns[key].map(duration => 
        Math.round(duration * scale)
      );
    });
  }

  /**
   * Main vibration method with debouncing and platform optimization
   */
  vibrate(pattern, options = {}) {
    if (!this._canVibrate()) return false;

    const now = Date.now();
    const force = options.force ?? false;

    // Debounce rapid calls (unless forced)
    if (!force && (now - this._lastVibration) < this._minInterval) {
      window.debugEffects && window.debugEffects('haptic_debounced', { pattern });
      return false;
    }

    try {
      let vibrationPattern = this._resolvePattern(pattern);
      
      // Platform-specific optimizations
      vibrationPattern = this._optimizeForPlatform(vibrationPattern);

      // Execute vibration
      const success = navigator.vibrate(vibrationPattern);
      
      if (success) {
        this._lastVibration = now;
        window.debugEffects && window.debugEffects('haptic', { 
          pattern: vibrationPattern, 
          platform: this._capabilities.platform 
        });
      }

      return success;
    } catch (e) {
      window.debugEffects && window.debugEffects('haptic_error', { error: e.message });
      return false;
    }
  }

  /**
   * Resolve pattern from string or array
   */
  _resolvePattern(pattern) {
    if (typeof pattern === 'string') {
      return this._patterns[pattern] || [30]; // Default fallback
    }
    if (Array.isArray(pattern)) {
      return pattern;
    }
    if (typeof pattern === 'number') {
      return [pattern];
    }
    return [30];
  }

  /**
   * Platform-specific pattern optimization
   */
  _optimizeForPlatform(pattern) {
    switch (this._capabilities.platform) {
      case 'android':
        // Android handles complex patterns well
        return pattern;
      
      case 'ios':
        // iOS ignores pattern complexity, use single vibration
        // Sum total duration and cap at 100ms
        const totalDuration = pattern.reduce((sum, val) => sum + val, 0);
        return [Math.min(totalDuration, 100)];
      
      case 'windows':
        // Windows Phone uses single vibrations
        return [pattern[0] || 30];
      
      default:
        return pattern;
    }
  }

  /**
   * Check if vibration is possible
   */
  _canVibrate() {
    return (
      this.config.enabled &&
      !this._isDestroyed &&
      this._capabilities.supported &&
      document.visibilityState === 'visible' // Don't vibrate in background
    );
  }

  /**
   * Convenience methods for common actions
   */
  light() { return this.vibrate('light'); }
  success() { return this.vibrate('success'); }
  error() { return this.vibrate('error'); }
  impact() { return this.vibrate('impact'); }
  notification() { return this.vibrate('notification'); }
  milestone() { return this.vibrate('milestone'); }
  warning() { return this.vibrate('warning'); }
  tick() { return this.vibrate('tick'); }

  /**
   * Custom pattern builder for dynamic effects
   */
  createPattern(config) {
    const { type = 'pulse', count = 1, duration = 30, pause = 20 } = config;
    
    const pattern = [];
    for (let i = 0; i < count; i++) {
      pattern.push(duration);
      if (i < count - 1) pattern.push(pause);
    }
    
    return pattern;
  }

  /**
   * Play custom pattern sequence
   */
  playSequence(patterns, interval = 200) {
    if (!Array.isArray(patterns)) return;
    
    patterns.forEach((pattern, index) => {
      setTimeout(() => {
        this.vibrate(pattern, { force: true });
      }, index * interval);
    });
  }

  /**
   * Cancel any ongoing vibration
   */
  cancel() {
    if (this._capabilities.supported) {
      try {
        navigator.vibrate(0);
        window.debugEffects && window.debugEffects('haptic_cancelled');
      } catch (e) {
        // Silent fail
      }
    }
  }

  /**
   * Test if haptics are working (for debugging)
   */
  test() {
    if (!this._canVibrate()) {
      console.log('[Haptic] Not available:', this._capabilities);
      return false;
    }
    
    console.log('[Haptic] Testing patterns...');
    const testPatterns = ['light', 'success', 'error', 'milestone'];
    
    testPatterns.forEach((pattern, i) => {
      setTimeout(() => {
        console.log(`[Haptic] Testing: ${pattern}`);
        this.vibrate(pattern, { force: true });
      }, i * 800);
    });
    
    return true;
  }

  /**
   * Get current configuration and capabilities
   */
  getInfo() {
    return {
      enabled: this.config.enabled,
      capabilities: this._capabilities,
      patterns: Object.keys(this._patterns),
      intensityScale: this.config.intensityScale
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    this._isDestroyed = true;
    this.cancel();
    window.debugEffects && window.debugEffects('haptic_destroyed');
  }
}

if (typeof window !== 'undefined') {
  window.HapticFeedback = HapticFeedback;
}
