/**
 * @fileoverview Toast Manager - Centralized notification system
 * Supports multiple toasts, auto-dismiss, actions, progress tracking
 */

class ToastManager {
  constructor() {
    this.toasts = new Map();
    this.container = null;
    this.init();
  }

  init() {
    // Create container
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Notifications');
    this.container.setAttribute('aria-live', 'polite');
    document.body.appendChild(this.container);
  }

  /**
   * Show toast notification
   * @param {Object} options - Toast options
   * @param {string} options.title - Toast title
   * @param {string} options.message - Toast message
   * @param {string} [options.type='info'] - Toast type (success, error, warning, info)
   * @param {number} [options.duration=5000] - Auto-dismiss duration (0 = no auto-dismiss)
   * @param {Array} [options.actions] - Action buttons
   * @param {Function} [options.onClose] - Callback on close
   * @returns {string} Toast ID
   */
  show(options) {
    const {
      title,
      message,
      type = 'info',
      duration = 5000,
      actions = [],
      onClose
    } = options;

    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create toast element
    const toast = this.createToastElement(id, { title, message, type, actions, duration });
    
    // Add to container
    this.container.appendChild(toast);
    
    // Store reference
    this.toasts.set(id, {
      element: toast,
      timer: null,
      onClose
    });

    // Auto-dismiss
    if (duration > 0) {
      const timer = setTimeout(() => this.dismiss(id), duration);
      this.toasts.get(id).timer = timer;
    }

    // Limit to 5 toasts
    if (this.toasts.size > 5) {
      const oldestId = Array.from(this.toasts.keys())[0];
      this.dismiss(oldestId);
    }

    return id;
  }

  /**
   * Create toast DOM element (Safe DOM Architecture)
   */
  createToastElement(id, { title, message, type, actions, duration }) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('data-toast-id', id);

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    // Safe DOM construction - create elements programmatically

    // Icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'toast-icon';
    iconDiv.textContent = icons[type];

    // Content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'toast-content';

    // Title (if provided)
    if (title) {
      const titleDiv = document.createElement('div');
      titleDiv.className = 'toast-title';
      titleDiv.textContent = title; // Safe text insertion
      contentDiv.appendChild(titleDiv);
    }

    // Message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'toast-message';
    messageDiv.textContent = message; // Safe text insertion
    contentDiv.appendChild(messageDiv);

    // Actions (if provided)
    if (actions.length > 0) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'toast-actions';

      actions.forEach((action, i) => {
        const button = document.createElement('button');
        button.className = `toast-btn toast-btn-${action.variant || 'secondary'}`;
        button.setAttribute('data-action-index', i);
        button.textContent = action.label; // Safe text insertion
        actionsDiv.appendChild(button);
      });

      contentDiv.appendChild(actionsDiv);
    }

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.textContent = '×';

    // Progress bar (if duration > 0)
    let progressDiv = null;
    if (duration > 0) {
      progressDiv = document.createElement('div');
      progressDiv.className = 'toast-progress';

      const progressFill = document.createElement('div');
      progressFill.className = 'toast-progress-fill';
      progressFill.style.width = '100%';
      progressFill.style.transition = `width ${duration}ms linear`;

      progressDiv.appendChild(progressFill);
    }

    // Assemble toast
    toast.appendChild(iconDiv);
    toast.appendChild(contentDiv);
    toast.appendChild(closeBtn);
    if (progressDiv) {
      toast.appendChild(progressDiv);
    }

    // Close button event
    closeBtn.addEventListener('click', () => this.dismiss(id));

    // Action buttons
    actions.forEach((action, i) => {
      const btn = toast.querySelector(`[data-action-index="${i}"]`);
      btn.addEventListener('click', () => {
        action.onClick?.();
        if (action.dismissOnClick !== false) {
          this.dismiss(id);
        }
      });
    });

    // Start progress animation
    if (duration > 0) {
      requestAnimationFrame(() => {
        const fill = toast.querySelector('.toast-progress-fill');
        if (fill) fill.style.width = '0%';
      });
    }

    return toast;
  }

  /**
   * Dismiss toast
   */
  dismiss(id) {
    const toast = this.toasts.get(id);
    if (!toast) return;

    // Clear timer
    if (toast.timer) {
      clearTimeout(toast.timer);
    }

    // Animate out
    toast.element.classList.add('leaving');
    
    setTimeout(() => {
      toast.element.remove();
      this.toasts.delete(id);
      toast.onClose?.();
    }, 300);
  }

  /**
   * Convenience methods
   */
  success(message, options = {}) {
    return this.show({ message, type: 'success', ...options });
  }

  error(message, options = {}) {
    return this.show({ message, type: 'error', duration: 0, ...options });
  }

  warning(message, options = {}) {
    return this.show({ message, type: 'warning', ...options });
  }

  info(message, options = {}) {
    return this.show({ message, type: 'info', ...options });
  }

  /**
   * Dismiss all toasts
   */
  dismissAll() {
    Array.from(this.toasts.keys()).forEach(id => this.dismiss(id));
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Singleton instance
export const toastManager = new ToastManager();

// Global shortcuts
window.toast = toastManager;

