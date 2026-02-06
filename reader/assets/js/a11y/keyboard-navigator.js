/**
 * Keyboard Navigation Helper
 * Provides keyboard shortcuts for accessibility
 */
export class KeyboardNavigator {
  constructor(router) {
    this.router = router;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.init();
  }
  
  init() {
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  handleKeyDown(e) {
    // Don't interfere with input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return;
    }
    
    // Navigation shortcuts
    if (e.altKey || e.metaKey) {
      switch (e.key) {
        case '1':
          e.preventDefault();
          window.location.hash = '#/library';
          break;
        case '2':
          e.preventDefault();
          window.location.hash = '#/flashcards';
          break;
        case '3':
          e.preventDefault();
          window.location.hash = '#/statistics';
          break;
      }
    }
    
    // Escape to go back
    if (e.key === 'Escape') {
      const currentHash = window.location.hash;
      if (currentHash && currentHash !== '#/library') {
        window.location.hash = '#/library';
      }
    }
  }
  
  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}

