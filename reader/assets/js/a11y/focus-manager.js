/**
 * @fileoverview Advanced Focus Management for keyboard navigation and accessibility
 * @module FocusManager
 */

import { logger } from '../utils/logger.js';

/**
 * Focus Manager for advanced keyboard navigation and focus trapping
 * @class FocusManager
 */
export class FocusManager {
  constructor() {
    this.logger = logger.createChild('FocusManager');
    this.focusHistory = [];
    this.modalStack = [];
    this.focusTrapActive = false;
    
    // Focusable elements selector
    this.focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    
    this.logger.info('Focus manager initialized');
  }
  
  /**
   * Set focus to element
   * @param {HTMLElement|string} element - Element or selector
   * @param {Object} [options] - Options
   */
  setFocus(element, options = {}) {
    const el = typeof element === 'string' 
      ? document.querySelector(element)
      : element;
    
    if (!el) {
      this.logger.warn('Focus target not found', { element });
      return false;
    }
    
    // Save current focus to history
    if (document.activeElement && document.activeElement !== document.body) {
      this.focusHistory.push(document.activeElement);
    }
    
    // Set focus
    el.focus(options);
    
    // Scroll into view if needed
    if (options.scroll !== false) {
      el.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center'
      });
    }
    
    this.logger.debug('Focus set', { element: el.tagName });
    return true;
  }
  
  /**
   * Restore previous focus
   */
  restoreFocus() {
    if (this.focusHistory.length === 0) return false;
    
    const previousElement = this.focusHistory.pop();
    if (previousElement && document.body.contains(previousElement)) {
      previousElement.focus();
      this.logger.debug('Focus restored');
      return true;
    }
    
    return false;
  }
  
  /**
   * Trap focus within container (for modals, dialogs)
   * @param {HTMLElement} container - Container element
   */
  trapFocus(container) {
    if (!container) {
      this.logger.warn('Focus trap container not provided');
      return;
    }
    
    const focusableElements = container.querySelectorAll(this.focusableSelector);
    if (focusableElements.length === 0) {
      this.logger.warn('No focusable elements in container');
      return;
    }
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // Set initial focus
    firstElement.focus();
    
    // Store cleanup function
    const cleanup = () => {
      container.removeEventListener('keydown', handleKeyDown);
      this.focusTrapActive = false;
    };
    
    this.modalStack.push({ container, cleanup });
    this.focusTrapActive = true;
    
    this.logger.debug('Focus trap activated', { 
      focusableCount: focusableElements.length 
    });
    
    return cleanup;
  }
  
  /**
   * Release focus trap
   */
  releaseFocusTrap() {
    if (this.modalStack.length === 0) return;
    
    const { cleanup } = this.modalStack.pop();
    cleanup();
    
    // Restore focus to previous modal or page
    if (this.modalStack.length > 0) {
      const { container } = this.modalStack[this.modalStack.length - 1];
      this.setFocus(container);
    } else {
      this.restoreFocus();
    }
    
    this.logger.debug('Focus trap released');
  }
  
  /**
   * Get all focusable elements in container
   * @param {HTMLElement} [container=document] - Container element
   * @returns {HTMLElement[]} Focusable elements
   */
  getFocusableElements(container = document) {
    return Array.from(container.querySelectorAll(this.focusableSelector))
      .filter(el => {
        // Check if element is visible
        return el.offsetWidth > 0 && 
               el.offsetHeight > 0 && 
               !el.hasAttribute('hidden') &&
               getComputedStyle(el).visibility !== 'hidden';
      });
  }
  
  /**
   * Navigate to next focusable element
   * @param {boolean} [reverse=false] - Navigate backwards
   */
  navigateToNext(reverse = false) {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);
    
    let nextIndex;
    if (reverse) {
      nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
    }
    
    const nextElement = focusableElements[nextIndex];
    if (nextElement) {
      this.setFocus(nextElement);
    }
  }
  
  /**
   * Check if element is focused
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} Is focused
   */
  isFocused(element) {
    return document.activeElement === element;
  }
  
  /**
   * Make element focusable
   * @param {HTMLElement} element - Element
   */
  makeFocusable(element) {
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
  }
  
  /**
   * Make element unfocusable
   * @param {HTMLElement} element - Element
   */
  makeUnfocusable(element) {
    element.setAttribute('tabindex', '-1');
  }
  
  /**
   * Clear focus history
   */
  clearHistory() {
    this.focusHistory = [];
    this.logger.debug('Focus history cleared');
  }
  
  /**
   * Cleanup all focus traps and reset
   */
  reset() {
    while (this.modalStack.length > 0) {
      this.releaseFocusTrap();
    }
    this.clearHistory();
    this.logger.info('Focus manager reset');
  }
}

// Singleton instance
export const focusManager = new FocusManager();

