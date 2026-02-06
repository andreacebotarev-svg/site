/**
 * ReaderUIController - Manages UI elements and user interactions
 * Handles loading states, error states, and UI coordination
 */
export class ReaderUIController {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.container = null;

    this.options = {
      enableLoadingStates: true,
      enableErrorBoundaries: true,
      ...options
    };

    // UI state
    this.currentState = 'idle'; // 'idle', 'loading', 'error', 'ready'
    this.loadingElement = null;
    this.errorElement = null;
  }

  /**
   * Initialize with container
   */
  initialize(container) {
    this.container = container;
    this.logger.info('ReaderUIController initialized');
  }

  /**
   * Show loading state
   */
  showLoading(message = 'Loading...') {
    this.setState('loading');

    if (!this.loadingElement) {
      this.loadingElement = this.createLoadingElement();
      this.container.appendChild(this.loadingElement);
    }

    const messageElement = this.loadingElement.querySelector('.loading-message');
    if (messageElement) {
      messageElement.textContent = message;
    }

    this.loadingElement.style.display = 'flex';
    this.logger.debug('Loading state shown', { message });
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.style.display = 'none';
    }

    this.setState('ready');
    this.logger.debug('Loading state hidden');
  }

  /**
   * Show error state
   */
  showError(error, options = {}) {
    this.setState('error');

    const errorMessage = this.formatErrorMessage(error);
    const { showRetry = true, retryAction = null } = options;

    if (!this.errorElement) {
      this.errorElement = this.createErrorElement();
      this.container.appendChild(this.errorElement);
    }

    const messageElement = this.errorElement.querySelector('.error-message');
    const retryButton = this.errorElement.querySelector('.retry-button');

    if (messageElement) {
      messageElement.textContent = errorMessage;
    }

    if (retryButton) {
      if (showRetry && retryAction) {
        retryButton.style.display = 'inline-block';
        retryButton.onclick = () => {
          this.hideError();
          retryAction();
        };
      } else {
        retryButton.style.display = 'none';
      }
    }

    this.errorElement.style.display = 'flex';
    this.logger.error('Error state shown', { error: errorMessage });
  }

  /**
   * Hide error state
   */
  hideError() {
    if (this.errorElement) {
      this.errorElement.style.display = 'none';
    }

    this.setState('ready');
    this.logger.debug('Error state hidden');
  }

  /**
   * Show no book selected state
   */
  showNoBookSelected() {
    this.setState('idle');

    const noBookElement = this.createNoBookElement();
    this.container.innerHTML = '';
    this.container.appendChild(noBookElement);

    this.logger.debug('No book selected state shown');
  }

  /**
   * Show book not found state
   */
  showBookNotFound(bookId) {
    this.setState('error');

    const notFoundElement = this.createBookNotFoundElement(bookId);
    this.container.innerHTML = '';
    this.container.appendChild(notFoundElement);

    this.logger.warn('Book not found state shown', { bookId });
  }

  /**
   * Render book content
   */
  renderBookContent(bookData, contentHtml) {
    this.setState('ready');

    // Clear container
    this.clearContent();

    // Create book header
    const headerHtml = this.createBookHeader(bookData.book);

    // Combine content
    const fullContent = `
      <div style="max-width: var(--reader-max-width, 800px); margin: 0 auto; padding: 24px;">
        ${headerHtml}
        ${contentHtml}
      </div>
    `;

    this.container.innerHTML = fullContent;
    this.logger.info('Book content rendered', {
      bookId: bookData.book.id,
      title: bookData.book.title
    });
  }

  /**
   * Create book header HTML
   */
  createBookHeader(book) {
    return `
      <div style="margin-bottom: 32px;">
        <div style="margin-bottom: 16px;">
          <a href="#/library" class="btn btn-secondary" style="margin-bottom: 12px; display: inline-block;">
            ← Back to Library
          </a>
        </div>
        <h1 style="font-size: 32px; margin-bottom: 8px; color: var(--text-primary, #1c1c1e); font-weight: 700;">
          ${this.escapeHtml(book.title || 'Untitled')}
        </h1>
        <p style="font-size: 18px; color: var(--text-secondary, #666); font-weight: 500;">
          ${this.escapeHtml(book.author || 'Unknown Author')}
        </p>
        ${book.description ? `
          <p style="font-size: 16px; color: var(--text-tertiary, #888); margin-top: 8px; font-style: italic; line-height: 1.5;">
            ${this.escapeHtml(book.description)}
          </p>
        ` : ''}
      </div>
    `;
  }

  /**
   * Create loading element
   */
  createLoadingElement() {
    const element = document.createElement('div');
    element.className = 'loading-container';
    element.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: var(--bg-primary, white);
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      z-index: 1000;
    `;

    element.innerHTML = `
      <div class="spinner" style="
        width: 40px;
        height: 40px;
        border: 3px solid rgba(0,122,255,0.2);
        border-top-color: var(--apple-blue, #007AFF);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <div class="loading-message" style="
        font-size: 16px;
        color: var(--text-secondary, #666);
        font-weight: 500;
      ">Loading...</div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;

    return element;
  }

  /**
   * Create error element
   */
  createErrorElement() {
    const element = document.createElement('div');
    element.className = 'error-container';
    element.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: var(--bg-primary, white);
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      z-index: 1000;
      max-width: 400px;
      text-align: center;
    `;

    element.innerHTML = `
      <div style="font-size: 48px; color: #dc3545;">⚠️</div>
      <h2 style="margin: 0; color: var(--text-primary, #333); font-size: 24px;">
        Something went wrong
      </h2>
      <p class="error-message" style="
        margin: 8px 0;
        color: var(--text-secondary, #666);
        line-height: 1.5;
      "></p>
      <div>
        <button class="retry-button btn btn-primary" style="margin-right: 8px;">
          Try Again
        </button>
        <button class="btn btn-secondary" onclick="window.location.href='#/library'">
          Back to Library
        </button>
      </div>
    `;

    return element;
  }

  /**
   * Create no book selected element
   */
  createNoBookElement() {
    const element = document.createElement('div');
    element.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      text-align: center;
      gap: 24px;
    `;

    element.innerHTML = `
      <div style="font-size: 64px;">📚</div>
      <div>
        <h2 style="margin: 0 0 8px 0; color: var(--text-primary, #333);">
          No Book Selected
        </h2>
        <p style="margin: 0; color: var(--text-secondary, #666);">
          Choose a book from the library to start reading
        </p>
      </div>
      <a href="#/library" class="btn btn-primary">
        Browse Library
      </a>
    `;

    return element;
  }

  /**
   * Create book not found element
   */
  createBookNotFoundElement(bookId) {
    const element = document.createElement('div');
    element.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      text-align: center;
      gap: 24px;
    `;

    element.innerHTML = `
      <div style="font-size: 64px;">🔍</div>
      <div>
        <h2 style="margin: 0 0 8px 0; color: var(--text-primary, #333);">
          Book Not Found
        </h2>
        <p style="margin: 0; color: var(--text-secondary, #666);">
          The requested book (ID: ${bookId}) could not be found
        </p>
      </div>
      <a href="#/library" class="btn btn-primary">
        Back to Library
      </a>
    `;

    return element;
  }

  /**
   * Format error message for display
   */
  formatErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message || 'An unexpected error occurred';
    }

    return 'An unexpected error occurred';
  }

  /**
   * Set current UI state
   */
  setState(state) {
    this.currentState = state;
    this.logger.debug('UI state changed', { state });
  }

  /**
   * Get current UI state
   */
  getState() {
    return this.currentState;
  }

  /**
   * Clear content area
   */
  clearContent() {
    // Hide loading and error states
    this.hideLoading();
    this.hideError();

    // Clear main content
    this.container.innerHTML = '';
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info', duration = 3000) {
    // Use global toast manager if available
    if (window.toastManager) {
      window.toastManager.show(message, type, duration);
      return;
    }

    // Fallback: simple console log
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  /**
   * Update progress indicator
   */
  updateProgressIndicator(progress) {
    // Find or create progress indicator
    let progressElement = this.container.querySelector('.reading-progress');
    if (!progressElement) {
      progressElement = document.createElement('div');
      progressElement.className = 'reading-progress';
      progressElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: rgba(0,122,255,0.2);
        z-index: 100;
      `;

      const bar = document.createElement('div');
      bar.className = 'progress-bar';
      bar.style.cssText = `
        height: 100%;
        background: var(--apple-blue, #007AFF);
        width: 0%;
        transition: width 0.3s ease;
      `;
      progressElement.appendChild(bar);

      this.container.appendChild(progressElement);
    }

    const bar = progressElement.querySelector('.progress-bar');
    if (bar) {
      bar.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
    }
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clear UI state without destroying the controller
   */
  clear() {
    this.clearContent();
    // Keep container reference for reuse
    this.logger.debug('ReaderUIController cleared');
  }

  /**
   * Destroy controller and cleanup
   */
  destroy() {
    this.clearContent();
    this.container = null;
    this.loadingElement = null;
    this.errorElement = null;
    this.logger.info('ReaderUIController destroyed');
  }
}
