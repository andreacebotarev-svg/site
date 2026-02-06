/**
 * @fileoverview Modal Manager - Centralized modal dialog system
 */

class ModalManager {
  constructor() {
    this.container = null;
    this.activeModal = null;
    this.init();
  }

  init() {
    // Container is created on demand or we can attach to body
    // We'll create a container for modals if it doesn't exist
  }

  /**
   * Show a modal
   * @param {Object} options 
   * @param {string} options.title
   * @param {string|HTMLElement} options.content
   * @param {Function} [options.onClose]
   * @param {Array} [options.actions]
   */
  show(options) {
    const { title, content, onClose, actions = [] } = options;

    // Create overlay and modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <h2 id="modal-title" class="modal-title">${this.escapeHtml(title)}</h2>
      <button class="modal-close" aria-label="Close modal">×</button>
    `;

    // Content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'modal-content';
    if (typeof content === 'string') {
      contentDiv.innerHTML = content; // Allow HTML string
    } else if (content instanceof HTMLElement) {
      contentDiv.appendChild(content);
    }

    // Actions
    let actionsDiv = null;
    if (actions.length > 0) {
      actionsDiv = document.createElement('div');
      actionsDiv.className = 'modal-actions flex justify-end gap-2 mt-4';
      actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = `btn btn-${action.variant || 'secondary'}`;
        btn.textContent = action.label;
        btn.onclick = () => {
          action.onClick?.();
          if (action.dismissOnClick !== false) this.close();
        };
        actionsDiv.appendChild(btn);
      });
    }

    // Assemble
    modal.appendChild(header);
    modal.appendChild(contentDiv);
    if (actionsDiv) modal.appendChild(actionsDiv);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);
    this.activeModal = overlay;

    // Events
    const closeBtn = header.querySelector('.modal-close');
    closeBtn.onclick = () => this.close();
    overlay.onclick = (e) => {
      if (e.target === overlay) this.close();
    };

    // Focus trap could be implemented here
    closeBtn.focus();

    this.onClose = onClose;
  }

  close() {
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
      if (this.onClose) this.onClose();
      this.onClose = null;
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export const modalManager = new ModalManager();

