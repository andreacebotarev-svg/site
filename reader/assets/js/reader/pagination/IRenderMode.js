/**
 * IRenderMode - Interface contract for Reader rendering modes
 *
 * Defines the contract that all rendering modes (Paged, Scroll, etc.) must implement
 * to ensure consistent behavior and seamless mode switching.
 */

/**
 * @interface IRenderMode
 *
 * Contract for rendering modes in the Reader system.
 * Each mode handles content display and navigation differently.
 */
export class IRenderMode {
  /**
   * Mount the rendering mode into a container
   * @param {HTMLElement} container - DOM element to render into
   * @param {Object} options - Mode-specific options
   */
  async mount(container, options = {}) {
    throw new Error('IRenderMode: mount() must be implemented');
  }

  /**
   * Render content with initial state
   * @param {Object} content - Content to render (paragraphs, chapters, etc.)
   * @param {Object} initialState - Initial reading state
   * @param {Object} options - Rendering options
   */
  async render(content, initialState, options = {}) {
    throw new Error('IRenderMode: render() must be implemented');
  }

  /**
   * Get current reading locator for persistence
   * @returns {Object} Locator object (chapter, page, scrollPosition, etc.)
   */
  getCurrentLocator() {
    throw new Error('IRenderMode: getCurrentLocator() must be implemented');
  }

  /**
   * Navigate to next logical unit (page/section/anchor)
   * @param {Object} options - Navigation options
   * @returns {boolean} true if navigation succeeded
   */
  async goNext(options = {}) {
    throw new Error('IRenderMode: goNext() must be implemented');
  }

  /**
   * Navigate to previous logical unit
   * @param {Object} options - Navigation options
   * @returns {boolean} true if navigation succeeded
   */
  async goPrev(options = {}) {
    throw new Error('IRenderMode: goPrev() must be implemented');
  }

  /**
   * Navigate to specific locator
   * @param {Object} locator - Target locator
   * @param {Object} options - Navigation options
   * @returns {boolean} true if navigation succeeded
   */
  async goTo(locator, options = {}) {
    throw new Error('IRenderMode: goTo() must be implemented');
  }

  /**
   * Check if navigation in given direction is possible
   * @param {string} direction - 'next' or 'prev'
   * @returns {boolean} true if navigation is possible
   */
  canNavigate(direction) {
    throw new Error('IRenderMode: canNavigate() must be implemented');
  }

  /**
   * Get current navigation context for UI updates
   * @returns {Object} Navigation context
   */
  getNavigationContext() {
    throw new Error('IRenderMode: getNavigationContext() must be implemented');
  }

  /**
   * Clean up resources and event listeners
   */
  destroy() {
    throw new Error('IRenderMode: destroy() must be implemented');
  }
}

/**
 * Standard locator formats for different modes
 */
export const LocatorFormats = {
  /**
   * Paged mode locator
   */
  PAGED: {
    chapter: 'number', // Chapter index
    page: 'number'     // Page index within chapter
  },

  /**
   * Scroll mode locator
   */
  SCROLL: {
    anchorId: 'string',    // DOM element ID of current anchor
    offset: 'number',      // Scroll offset within anchor (0-1)
    chapter: 'number'      // Chapter index for context
  }
};

/**
 * Navigation actions that work across all modes
 */
export const NavigationActions = {
  NEXT: 'next',
  PREV: 'prev',
  HOME: 'home',
  END: 'end',
  GOTO: 'goto'
};












