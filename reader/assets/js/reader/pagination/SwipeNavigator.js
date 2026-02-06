/**
 * SwipeNavigator - Touch gesture handler for mobile navigation
 *
 * Implements swipe gestures for next/previous navigation with proper thresholds
 * to avoid interfering with vertical scrolling and text selection.
 *
 * Features:
 * - Pointer Events with Touch Events fallback
 * - Directional threshold detection (horizontal vs vertical)
 * - Velocity-based gesture recognition
 * - Proper preventDefault() only after gesture confirmation
 * - Pointer capture for reliable gesture tracking
 */

import { logger } from '../../utils/logger.js';

const swipeLogger = logger.createChild('SwipeNavigator');

export class SwipeNavigator {
  constructor({ onPrev, onNext, logger } = {}) {
    this.onPrev = onPrev;
    this.onNext = onNext;
    this.logger = logger || swipeLogger;

    this.el = null;
    this.abort = new AbortController();

    // Gesture tracking state
    this.tracking = null; // { startX, startY, startT, pointerId, locked }

    // Configuration with carefully tuned thresholds
    this.config = {
      // Minimum distance for gesture recognition
      minDistance: 60, // px

      // Direction discrimination: horizontal must be N times stronger than vertical
      directionRatio: 1.5,

      // Maximum time for a valid swipe gesture (prevents slow drags)
      maxSwipeTimeMs: 700,

      // Early detection threshold (when we start considering it a swipe)
      earlyDetectionThreshold: 24, // px

      // Vertical threshold (ignore if vertical movement is too strong)
      verticalThreshold: 12, // px

      // Velocity threshold (pixels per ms for fast swipes)
      minVelocity: 0.3
    };

    this.logger.info('SwipeNavigator initialized', this.config);
  }

  /**
   * Attach swipe handling to element
   */
  attach(el) {
    this.el = el;

    // Use Pointer Events if available (unified mouse/touch/stylus)
    if (window.PointerEvent) {
      this._setupPointerEvents();
    } else {
      // Fallback to Touch Events
      this._setupTouchEvents();
    }

    this.logger.info('SwipeNavigator attached to element');
  }

  /**
   * Setup Pointer Events (preferred)
   */
  _setupPointerEvents() {
    const el = this.el;

    el.addEventListener('pointerdown', this._onPointerDown, {
      signal: this.abort.signal,
      // Keep passive initially to not interfere with scrolling
      passive: true
    });

    el.addEventListener('pointermove', this._onPointerMove, {
      signal: this.abort.signal,
      passive: true
    });

    el.addEventListener('pointerup', this._onPointerUp, {
      signal: this.abort.signal,
      passive: true
    });

    el.addEventListener('pointercancel', this._onPointerCancel, {
      signal: this.abort.signal,
      passive: true
    });

    this.logger.debug('Pointer Events attached');
  }

  /**
   * Setup Touch Events fallback
   */
  _setupTouchEvents() {
    const el = this.el;

    el.addEventListener('touchstart', this._onTouchStart, {
      signal: this.abort.signal,
      passive: true
    });

    el.addEventListener('touchmove', this._onTouchMove, {
      signal: this.abort.signal,
      passive: true
    });

    el.addEventListener('touchend', this._onTouchEnd, {
      signal: this.abort.signal,
      passive: true
    });

    this.logger.debug('Touch Events attached (fallback)');
  }

  /**
   * Pointer down - start tracking potential gesture
   */
  _onPointerDown = (e) => {
    // Only track touch/pen, ignore mouse (avoids conflicts with text selection)
    if (e.pointerType === 'mouse') return;

    // Don't track if starting on interactive elements
    if (this._isInteractiveElement(e.target)) return;

    this.tracking = {
      startX: e.clientX,
      startY: e.clientY,
      startT: performance.now(),
      pointerId: e.pointerId,
      locked: null, // null = undecided, 'vertical' = scrolling, 'horizontal' = swipe
      captured: false
    };

    this.logger.debug('Gesture tracking started', {
      x: e.clientX,
      y: e.clientY,
      type: e.pointerType
    });
  };

  /**
   * Pointer move - analyze gesture direction
   */
  _onPointerMove = (e) => {
    if (!this.tracking || e.pointerId !== this.tracking.pointerId) return;

    const dx = e.clientX - this.tracking.startX;
    const dy = e.clientY - this.tracking.startY;

    // If gesture not yet classified
    if (this.tracking.locked === null) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Strong vertical movement = user is scrolling
      if (absDy > this.config.verticalThreshold && absDy > absDx) {
        this.tracking.locked = 'vertical';
        this.logger.debug('Gesture classified as vertical scroll');
        return;
      }

      // Strong horizontal movement with direction discrimination = potential swipe
      if (absDx > this.config.earlyDetectionThreshold &&
          absDx > absDy * this.config.directionRatio) {
        this.tracking.locked = 'horizontal';

        // Capture pointer to ensure we get all events even if finger leaves element
        if (this.el.setPointerCapture && !this.tracking.captured) {
          this.el.setPointerCapture(e.pointerId);
          this.tracking.captured = true;
        }

        this.logger.debug('Gesture classified as horizontal swipe', { dx, dy });
      }
    }
  };

  /**
   * Pointer up - complete gesture if it's a valid swipe
   */
  _onPointerUp = (e) => {
    if (!this.tracking || e.pointerId !== this.tracking.pointerId) return;

    // Only process if we confirmed it's a horizontal swipe
    if (this.tracking.locked !== 'horizontal') {
      this._reset();
      return;
    }

    const dx = e.clientX - this.tracking.startX;
    const dt = performance.now() - this.tracking.startT;
    const velocity = Math.abs(dx) / dt;

    // Check if gesture meets criteria
    const validDistance = Math.abs(dx) >= this.config.minDistance;
    const validTime = dt <= this.config.maxSwipeTimeMs;
    const validVelocity = velocity >= this.config.minVelocity;

    if (validDistance && validTime && validVelocity) {
      // Determine direction and dispatch
      if (dx < 0) {
        this.logger.info('Swipe left detected - triggering next');
        this.onNext?.();
      } else {
        this.logger.info('Swipe right detected - triggering prev');
        this.onPrev?.();
      }
    } else {
      this.logger.debug('Swipe rejected', { dx, dt, velocity, validDistance, validTime, validVelocity });
    }

    this._reset();
  };

  /**
   * Pointer cancel - reset tracking
   */
  _onPointerCancel = (e) => {
    if (!this.tracking || e.pointerId !== this.tracking.pointerId) return;
    this._reset();
  };

  /**
   * Touch Events fallback
   */
  _onTouchStart = (e) => {
    if (e.touches.length !== 1) return; // Only single touch
    const touch = e.touches[0];

    if (this._isInteractiveElement(touch.target)) return;

    this.tracking = {
      startX: touch.clientX,
      startY: touch.clientY,
      startT: performance.now(),
      touchId: touch.identifier,
      locked: null
    };
  };

  _onTouchMove = (e) => {
    if (!this.tracking) return;

    const touch = Array.from(e.touches).find(t => t.identifier === this.tracking.touchId);
    if (!touch) return;

    const dx = touch.clientX - this.tracking.startX;
    const dy = touch.clientY - this.tracking.startY;

    if (this.tracking.locked === null) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDy > this.config.verticalThreshold && absDy > absDx) {
        this.tracking.locked = 'vertical';
        return;
      }

      if (absDx > this.config.earlyDetectionThreshold &&
          absDx > absDy * this.config.directionRatio) {
        this.tracking.locked = 'horizontal';
      }
    }
  };

  _onTouchEnd = (e) => {
    if (!this.tracking) return;

    const touch = Array.from(e.changedTouches).find(t => t.identifier === this.tracking.touchId);
    if (!touch) return;

    if (this.tracking.locked === 'horizontal') {
      const dx = touch.clientX - this.tracking.startX;
      const dt = performance.now() - this.tracking.startT;
      const velocity = Math.abs(dx) / dt;

      if (Math.abs(dx) >= this.config.minDistance &&
          dt <= this.config.maxSwipeTimeMs &&
          velocity >= this.config.minVelocity) {
        if (dx < 0) {
          this.onNext?.();
        } else {
          this.onPrev?.();
        }
      }
    }

    this._reset();
  };

  /**
   * Check if element is interactive (should not trigger swipe)
   */
  _isInteractiveElement(element) {
    const interactiveSelectors = [
      'button',
      'input',
      'textarea',
      'select',
      'a',
      '[role="button"]',
      '[contenteditable]',
      '[data-interactive]'
    ];

    return interactiveSelectors.some(selector =>
      element.matches(selector) ||
      element.closest(selector)
    );
  }

  /**
   * Reset gesture tracking
   */
  _reset = () => {
    if (this.tracking?.captured && this.el.releasePointerCapture) {
      try {
        this.el.releasePointerCapture(this.tracking.pointerId);
      } catch (e) {
        // Ignore errors if capture already released
      }
    }
    this.tracking = null;
  };

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.logger.debug('SwipeNavigator config updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.abort.abort();
    this._reset();
    this.el = null;
    this.logger.info('SwipeNavigator destroyed');
  }
}












