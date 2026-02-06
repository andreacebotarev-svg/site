/**
 * SearchController - Handles text search within book content
 * Provides search dialog, result highlighting, and navigation
 */
export class SearchController {
  constructor(options = {}) {
    this.logger = options.logger || console;

    this.container = null;
    this.searchDialog = null;
    this.currentResults = [];
    this.currentResultIndex = -1;
    this.searchQuery = '';

    // Event handlers
    this.searchHandler = null;
    this.navigateHandler = null;

    this.options = {
      enableKeyboardShortcut: true,
      maxResults: 100,
      caseSensitive: false,
      ...options
    };

    this.logger.info('SearchController created');
  }

  /**
   * Initialize with container
   */
  initialize(container) {
    this.container = container;

    if (this.options.enableKeyboardShortcut) {
      this.setupKeyboardShortcut();
    }

    this.logger.info('SearchController initialized');
  }

  /**
   * Setup keyboard shortcut (Ctrl+F / Cmd+F)
   */
  setupKeyboardShortcut() {
    this.keyboardHandler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        this.showSearchDialog();
      }
    };

    document.addEventListener('keydown', this.keyboardHandler);
    this.logger.debug('Keyboard shortcut setup (Ctrl+F)');
  }

  /**
   * Show search dialog
   */
  showSearchDialog() {
    // Remove existing dialog
    this.hideSearchDialog();

    // Create dialog
    this.searchDialog = this.createSearchDialog();
    document.body.appendChild(this.searchDialog);

    // Focus input
    const input = this.searchDialog.querySelector('#search-input');
    if (input) {
      input.focus();
    }

    // Prevent background scroll
    document.body.style.overflow = 'hidden';

    this.logger.debug('Search dialog shown');
  }

  /**
   * Hide search dialog
   */
  hideSearchDialog() {
    if (this.searchDialog) {
      document.body.removeChild(this.searchDialog);
      this.searchDialog = null;
    }

    // Restore scroll
    document.body.style.overflow = '';

    // Clear results
    this.clearSearchResults();

    this.logger.debug('Search dialog hidden');
  }

  /**
   * Create search dialog element
   */
  createSearchDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'search-dialog';
    dialog.style.cssText = `
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    `;

    dialog.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 16px 0; color: var(--text-primary, #333); font-size: 18px; font-weight: 600;">
          Search in Book
        </h3>
        <div style="position: relative;">
          <input
            type="text"
            id="search-input"
            placeholder="Enter search term..."
            style="
              width: 100%;
              padding: 12px 16px;
              border: 2px solid #e1e5e9;
              border-radius: 8px;
              font-size: 16px;
              outline: none;
              transition: border-color 0.2s;
              box-sizing: border-box;
            "
          >
          <div id="search-spinner" style="display: none; position: absolute; right: 12px; top: 50%; transform: translateY(-50%);">
            <div style="
              width: 20px;
              height: 20px;
              border: 2px solid #f3f3f3;
              border-top: 2px solid var(--apple-blue, #007AFF);
              border-radius: 50%;
              animation: spin 1s linear infinite;
            "></div>
          </div>
        </div>
      </div>

      <div id="search-results" style="margin-bottom: 20px; max-height: 300px; overflow-y: auto;"></div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div id="search-stats" style="font-size: 14px; color: var(--text-secondary, #666);">
          No search performed
        </div>
        <div>
          <button id="search-prev" class="search-nav-btn" style="margin-right: 8px;">Previous</button>
          <button id="search-next" class="search-nav-btn">Next</button>
          <button id="search-close" style="margin-left: 16px; padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
        </div>
      </div>
    `;

    // Setup event listeners
    this.setupDialogEvents(dialog);

    overlay.appendChild(dialog);

    // Close on overlay click
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        this.hideSearchDialog();
      }
    });

    return overlay;
  }

  /**
   * Setup dialog event listeners
   */
  setupDialogEvents(dialog) {
    const input = dialog.querySelector('#search-input');
    const prevBtn = dialog.querySelector('#search-prev');
    const nextBtn = dialog.querySelector('#search-next');
    const closeBtn = dialog.querySelector('#search-close');

    let searchTimeout;

    // Search input
    input.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      const query = input.value.trim();

      if (query.length > 0) {
        searchTimeout = setTimeout(() => {
          this.performSearch(query);
        }, 300);
      } else {
        this.clearSearchResults();
      }
    });

    // Navigation buttons
    prevBtn.addEventListener('click', () => this.navigateToPreviousResult());
    nextBtn.addEventListener('click', () => this.navigateToNextResult());

    // Close button
    closeBtn.addEventListener('click', () => this.hideSearchDialog());

    // Keyboard navigation
    dialog.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'Escape':
          this.hideSearchDialog();
          break;
        case 'Enter':
          if (event.shiftKey) {
            this.navigateToPreviousResult();
          } else {
            this.navigateToNextResult();
          }
          break;
      }
    });
  }

  /**
   * Perform search
   */
  async performSearch(query) {
    if (!query || query.length < 2) return;

    this.searchQuery = query;

    // Show spinner
    this.setSpinnerVisible(true);

    try {
      // Search in content
      this.currentResults = await this.searchInContent(query);
      this.currentResultIndex = this.currentResults.length > 0 ? 0 : -1;

      // Update UI
      this.updateSearchResults();
      this.updateSearchStats();

      // Navigate to first result
      if (this.currentResults.length > 0) {
        this.navigateToResult(0);
      }

    } catch (error) {
      this.logger.error('Search failed', error);
      this.showSearchError('Search failed: ' + error.message);
    } finally {
      this.setSpinnerVisible(false);
    }
  }

  /**
   * Search in book content
   */
  async searchInContent(query) {
    const results = [];
    const contentElement = this.container?.querySelector('#reading-content');

    if (!contentElement) return results;

    // Get all text nodes
    const textNodes = this.getTextNodes(contentElement);
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    for (const node of textNodes) {
      const text = node.textContent;
      const matches = [...text.matchAll(searchRegex)];

      for (const match of matches) {
        const result = {
          node,
          match: match[0],
          index: match.index,
          context: this.getContext(text, match.index, match[0].length),
          element: node.parentElement
        };

        results.push(result);

        if (results.length >= this.options.maxResults) {
          break;
        }
      }

      if (results.length >= this.options.maxResults) {
        break;
      }
    }

    this.logger.info(`Search completed: ${results.length} results for "${query}"`);
    return results;
  }

  /**
   * Get text nodes from element
   */
  getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip empty nodes and nodes in non-content elements
          if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;

          const parent = node.parentElement;
          if (parent?.closest('.search-highlight, .interactive-word')) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    return textNodes;
  }

  /**
   * Get context around match
   */
  getContext(text, matchIndex, matchLength, contextLength = 50) {
    const start = Math.max(0, matchIndex - contextLength);
    const end = Math.min(text.length, matchIndex + matchLength + contextLength);
    return text.substring(start, end);
  }

  /**
   * Navigate to specific result
   */
  navigateToResult(index) {
    if (index < 0 || index >= this.currentResults.length) return;

    const result = this.currentResults[index];
    this.currentResultIndex = index;

    // Scroll to result
    if (result.element) {
      result.element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Highlight result temporarily
      this.highlightResult(result);
    }

    this.updateResultNavigation();
    this.logger.debug(`Navigated to search result ${index + 1}`);
  }

  /**
   * Navigate to next result
   */
  navigateToNextResult() {
    const nextIndex = this.currentResultIndex + 1;
    if (nextIndex < this.currentResults.length) {
      this.navigateToResult(nextIndex);
    }
  }

  /**
   * Navigate to previous result
   */
  navigateToPreviousResult() {
    const prevIndex = this.currentResultIndex - 1;
    if (prevIndex >= 0) {
      this.navigateToResult(prevIndex);
    }
  }

  /**
   * Highlight search result
   */
  highlightResult(result) {
    // Remove existing highlights
    this.clearHighlights();

    // Create highlight
    const range = document.createRange();
    const textNode = result.node;
    const start = result.index;
    const length = result.match.length;

    range.setStart(textNode, start);
    range.setEnd(textNode, start + length);

    const highlight = document.createElement('mark');
    highlight.className = 'search-highlight';
    highlight.style.cssText = `
      background-color: #ffeb3b;
      padding: 2px 0;
      border-radius: 2px;
      animation: highlight-pulse 2s ease-out;
    `;

    try {
      range.surroundContents(highlight);

      // Remove highlight after animation
      setTimeout(() => {
        if (highlight.parentNode) {
          const text = document.createTextNode(highlight.textContent);
          highlight.parentNode.replaceChild(text, highlight);
        }
      }, 2000);

    } catch (error) {
      // Fallback: just scroll to element
      this.logger.warn('Could not highlight result', error);
    }
  }

  /**
   * Clear search highlights
   */
  clearHighlights() {
    const highlights = this.container?.querySelectorAll('.search-highlight');
    highlights?.forEach(highlight => {
      const text = document.createTextNode(highlight.textContent);
      highlight.parentNode.replaceChild(text, highlight);
    });
  }

  /**
   * Update search results UI
   */
  updateSearchResults() {
    const resultsContainer = this.searchDialog?.querySelector('#search-results');
    if (!resultsContainer) return;

    if (this.currentResults.length === 0) {
      resultsContainer.innerHTML = '<p style="color: #666; margin: 0;">No results found</p>';
      return;
    }

    const resultsHtml = this.currentResults.map((result, index) => `
      <div class="search-result ${index === this.currentResultIndex ? 'active' : ''}"
           style="
             padding: 8px 12px;
             margin-bottom: 4px;
             border-radius: 6px;
             cursor: pointer;
             transition: background-color 0.2s;
             ${index === this.currentResultIndex ? 'background: #e3f2fd;' : 'background: #f8f9fa;'}
           "
           onclick="this.navigateToResult(${index})">
        <div style="font-weight: 500; color: #333; margin-bottom: 4px;">
          "${result.match}"
        </div>
        <div style="font-size: 14px; color: #666;">
          ${this.escapeHtml(result.context)}
        </div>
      </div>
    `).join('');

    resultsContainer.innerHTML = resultsHtml;
  }

  /**
   * Update search statistics
   */
  updateSearchStats() {
    const statsElement = this.searchDialog?.querySelector('#search-stats');
    if (!statsElement) return;

    if (this.currentResults.length === 0) {
      statsElement.textContent = 'No results';
    } else {
      statsElement.textContent = `${this.currentResultIndex + 1} of ${this.currentResults.length} results`;
    }
  }

  /**
   * Update result navigation buttons
   */
  updateResultNavigation() {
    const prevBtn = this.searchDialog?.querySelector('#search-prev');
    const nextBtn = this.searchDialog?.querySelector('#search-next');

    if (prevBtn) {
      prevBtn.disabled = this.currentResultIndex <= 0;
    }

    if (nextBtn) {
      nextBtn.disabled = this.currentResultIndex >= this.currentResults.length - 1;
    }
  }

  /**
   * Show search error
   */
  showSearchError(message) {
    const resultsContainer = this.searchDialog?.querySelector('#search-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = `<p style="color: #dc3545; margin: 0;">${this.escapeHtml(message)}</p>`;
    }
  }

  /**
   * Set spinner visibility
   */
  setSpinnerVisible(visible) {
    const spinner = this.searchDialog?.querySelector('#search-spinner');
    if (spinner) {
      spinner.style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Clear search results
   */
  clearSearchResults() {
    this.currentResults = [];
    this.currentResultIndex = -1;
    this.searchQuery = '';
    this.clearHighlights();
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
   * Get search statistics
   */
  getStats() {
    return {
      query: this.searchQuery,
      resultCount: this.currentResults.length,
      currentResult: this.currentResultIndex,
      isActive: !!this.searchDialog
    };
  }

  /**
   * Destroy search controller
   */
  destroy() {
    this.hideSearchDialog();

    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
    }

    this.container = null;
    this.logger.info('SearchController destroyed');
  }
}

// Add CSS for search highlights
const searchStyles = `
  @keyframes highlight-pulse {
    0% { background-color: #ffeb3b; }
    50% { background-color: #ffd700; }
    100% { background-color: #ffeb3b; }
  }

  .search-result.active {
    background-color: #e3f2fd !important;
    border-left: 3px solid var(--apple-blue, #007AFF);
  }

  .search-result:hover {
    background-color: #f0f0f0 !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = searchStyles;
  document.head.appendChild(style);
}
