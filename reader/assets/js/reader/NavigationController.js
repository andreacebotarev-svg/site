/**
 * NavigationController - Handles navigation UI and controls
 * Manages prev/next buttons, page indicators, and navigation events
 */
export class NavigationController {
  constructor(options = {}) {
    this.logger = options.logger || console;

    this.container = null;
    this.paginator = null;

    // UI elements
    this.navContainer = null;
    this.prevButton = null;
    this.nextButton = null;
    this.pageIndicator = null;

    // Event handlers
    this.prevHandler = () => this.handlePrev();
    this.nextHandler = () => this.handleNext();

    this.options = {
      showPageIndicator: true,
      enableKeyboardNav: true,
      enableSwipeNav: false,
      ...options
    };

    this.logger.info('NavigationController created');
  }

  /**
   * Initialize with container and paginator
   */
  initialize(container, paginator) {
    this.container = container;
    this.paginator = paginator;

    this.createNavigationUI();
    this.setupEventListeners();

    if (this.options.enableSwipeNav) {
      this.setupSwipeGestures();
    }

    this.updateNavigationState();
    this.logger.info('NavigationController initialized');
  }

  /**
   * Create navigation UI elements
   */
  createNavigationUI() {
    // Create navigation container
    this.navContainer = document.createElement('div');
    this.navContainer.className = 'reading-navigation';
    this.navContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 12px 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;

    // Previous button
    this.prevButton = document.createElement('button');
    this.prevButton.className = 'nav-button nav-prev';
    this.prevButton.innerHTML = '←';
    this.prevButton.style.cssText = `
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: var(--apple-blue, #007AFF);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 600;
      transition: all 0.2s ease;
      flex-shrink: 0;
    `;

    // Page indicator
    if (this.options.showPageIndicator) {
      this.pageIndicator = document.createElement('div');
      this.pageIndicator.className = 'page-indicator';
      this.pageIndicator.style.cssText = `
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary, #333);
        min-width: 80px;
        text-align: center;
        user-select: none;
      `;
      this.pageIndicator.textContent = 'Page 1 of 1';
    }

    // Next button
    this.nextButton = document.createElement('button');
    this.nextButton.className = 'nav-button nav-next';
    this.nextButton.innerHTML = '→';
    this.nextButton.style.cssText = this.prevButton.style.cssText;

    // Assemble navigation
    this.navContainer.appendChild(this.prevButton);
    if (this.pageIndicator) {
      this.navContainer.appendChild(this.pageIndicator);
    }
    this.navContainer.appendChild(this.nextButton);

    // Add to container
    this.container.appendChild(this.navContainer);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Button clicks
    this.prevButton?.addEventListener('click', this.prevHandler);
    this.nextButton?.addEventListener('click', this.nextHandler);

    // Button hover effects
    [this.prevButton, this.nextButton].forEach(button => {
      if (!button) return;

      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 4px 12px rgba(0, 122, 255, 0.3)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = 'none';
      });

      button.addEventListener('mousedown', () => {
        button.style.transform = 'scale(0.95)';
      });

      button.addEventListener('mouseup', () => {
        button.style.transform = 'scale(1.05)';
      });
    });

    // Keyboard navigation
    if (this.options.enableKeyboardNav) {
      this.keyboardHandler = (event) => {
        // Only handle if navigation is visible and focused
        if (!this.navContainer?.offsetParent) return;

        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            this.handlePrev();
            break;
          case 'ArrowRight':
            event.preventDefault();
            this.handleNext();
            break;
        }
      };

      document.addEventListener('keydown', this.keyboardHandler);
    }

    this.logger.debug('Event listeners setup');
  }

  /**
   * Setup swipe gesture recognition
   */
  setupSwipeGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const thresholdPx = 60;
    const minVelocity = 0.55;
    const maxOffAxis = 80;

    const getPoint = (touch) => ({ x: touch.clientX, y: touch.clientY });

    this.touchStartHandler = (event) => {
      if (event.touches.length !== 1) return;

      const touch = event.touches[0];
      const point = getPoint(touch);
      touchStartX = point.x;
      touchStartY = point.y;
      touchStartTime = Date.now();
    };

    this.touchMoveHandler = (event) => {
      if (event.touches.length !== 1) return;

      const touch = event.touches[0];
      const point = getPoint(touch);
      const deltaX = point.x - touchStartX;
      const deltaY = point.y - touchStartY;

      // Prevent scroll if this looks like a horizontal swipe
      if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
        event.preventDefault();
      }
    };

    this.touchEndHandler = (event) => {
      const touchEndTime = Date.now();
      const duration = touchEndTime - touchStartTime;

      if (duration > 500) return; // Too slow, not a swipe

      const touch = event.changedTouches[0];
      const point = getPoint(touch);
      const deltaX = point.x - touchStartX;
      const deltaY = point.y - touchStartY;
      const velocity = Math.abs(deltaX) / duration;

      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaY) <= maxOffAxis;
      const passedThreshold = Math.abs(deltaX) >= thresholdPx || velocity >= minVelocity;

      if (isHorizontal && passedThreshold) {
        event.preventDefault();

        if (deltaX < 0) {
          // Swipe left - next page
          this.handleNext();
        } else {
          // Swipe right - previous page
          this.handlePrev();
        }
      }
    };

    // Add touch event listeners
    this.container.addEventListener('touchstart', this.touchStartHandler, { passive: true });
    this.container.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
    this.container.addEventListener('touchend', this.touchEndHandler, { passive: true });

    this.logger.debug('Swipe gestures setup');
  }

  /**
   * Handle previous page navigation
   */
  async handlePrev() {
    if (this.paginator) {
      await this.paginator.prevPage();
      this.updateNavigationState();
    }
  }

  /**
   * Handle next page navigation
   */
  async handleNext() {
    if (this.paginator) {
      await this.paginator.nextPage();
      this.updateNavigationState();
    }
  }

  /**
   * Update navigation state (enable/disable buttons, update indicator)
   */
  updateNavigationState() {
    if (!this.paginator) return;

    const info = this.paginator.getCurrentPageInfo();

    // Update buttons
    if (this.prevButton) {
      this.prevButton.disabled = !info.hasPrev;
      this.prevButton.style.opacity = info.hasPrev ? '1' : '0.5';
    }

    if (this.nextButton) {
      this.nextButton.disabled = !info.hasNext;
      this.nextButton.style.opacity = info.hasNext ? '1' : '0.5';
    }

    // Update page indicator
    if (this.pageIndicator) {
      this.pageIndicator.textContent = `Page ${info.index + 1} of ${info.total}`;
    }
  }

  /**
   * Show/hide navigation
   */
  setVisible(visible) {
    if (this.navContainer) {
      this.navContainer.style.display = visible ? 'flex' : 'none';
    }
  }

  /**
   * Get navigation statistics
   */
  getStats() {
    return {
      visible: this.navContainer?.style.display !== 'none',
      hasPaginator: !!this.paginator,
      keyboardNav: this.options.enableKeyboardNav,
      swipeNav: this.options.enableSwipeNav
    };
  }

  /**
   * Destroy navigation controller
   */
  destroy() {
    // Remove event listeners
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
    }

    if (this.touchStartHandler) {
      this.container?.removeEventListener('touchstart', this.touchStartHandler);
      this.container?.removeEventListener('touchmove', this.touchMoveHandler);
      this.container?.removeEventListener('touchend', this.touchEndHandler);
    }

    // Remove UI elements
    if (this.navContainer && this.navContainer.parentNode) {
      this.navContainer.parentNode.removeChild(this.navContainer);
    }

    // Clear references
    this.container = null;
    this.paginator = null;
    this.navContainer = null;
    this.prevButton = null;
    this.nextButton = null;
    this.pageIndicator = null;

    this.logger.info('NavigationController destroyed');
  }
}
