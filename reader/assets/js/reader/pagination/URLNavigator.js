/**
 * URLNavigator - Bidirectional URL ↔ State synchronization
 * Enables deep linking and browser history integration
 *
 * Features:
 * - URL parsing: ?bookId=X&chapter=Y&page=Z
 * - State updates with debouncing
 * - Browser history management
 * - Popstate event handling
 * - URL validation and normalization
 */

import { logger } from '../../utils/logger.js';

export class URLNavigator {
  constructor(onStateChange, options = {}) {
    this.logger = options.logger || console;
    this.onStateChange = onStateChange;

    this.updateDebounceTimer = null;
    this.UPDATE_DELAY = options.updateDelay || 300; // ms
    this.isUpdating = false; // Prevent recursive updates

    // Setup history listener
    this.setupHistoryListener();

    this.logger.info('URLNavigator initialized');
  }

  /**
   * Parse current URL into navigation state
   * @returns {URLState}
   */
  parseURL() {
    try {
      const params = new URLSearchParams(window.location.search);

      return {
        bookId: params.get('bookId') || null,
        chapter: this.parseIntParam(params.get('chapter'), 0),
        page: this.parseIntParam(params.get('page'), 0)
      };
    } catch (error) {
      this.logger.warn('URL parsing failed, using defaults', error);
      return {
        bookId: null,
        chapter: 0,
        page: 0
      };
    }
  }

  /**
   * Safely parse integer parameter
   * @param {string|null} value
   * @param {number} defaultValue
   * @returns {number}
   */
  parseIntParam(value, defaultValue) {
    if (value === null || value === '') return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) || parsed < 0 ? defaultValue : parsed;
  }

  /**
   * Update URL from state (debounced)
   * @param {URLState} state
   * @param {Object} options - { immediate: boolean }
   */
  updateURL(state, options = {}) {
    if (this.isUpdating) return; // Prevent recursive updates

    clearTimeout(this.updateDebounceTimer);

    if (options.immediate) {
      this._performURLUpdate(state);
    } else {
      this.updateDebounceTimer = setTimeout(() => {
        this._performURLUpdate(state);
      }, this.UPDATE_DELAY);
    }
  }

  /**
   * Internal: perform actual URL update
   * @param {URLState} state
   */
  _performURLUpdate(state) {
    try {
      this.isUpdating = true;

      const url = new URL(window.location);
      const params = url.searchParams;

      // Update parameters
      if (state.bookId) {
        params.set('bookId', state.bookId);
      } else {
        params.delete('bookId');
      }

      params.set('chapter', state.chapter.toString());
      params.set('page', state.page.toString());

      // Use replaceState to avoid polluting browser history
      // This creates a single history entry for the entire reading session
      window.history.replaceState(
        {
          ...state,
          timestamp: Date.now(),
          source: 'url-navigator'
        },
        '',
        url.toString()
      );

      this.logger.debug('URL updated', {
        bookId: state.bookId,
        chapter: state.chapter,
        page: state.page,
        url: url.toString()
      });

    } catch (error) {
      this.logger.error('URL update failed', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Navigate to specific chapter and page
   * @param {number} chapter
   * @param {number} page
   * @param {Object} options
   */
  navigateTo(chapter, page, options = {}) {
    const currentState = this.parseURL();
    const newState = {
      ...currentState,
      chapter: Math.max(0, chapter),
      page: Math.max(0, page)
    };

    this.logger.debug('URLNavigator.navigateTo', { chapter, page, options, currentState, newState });

    this.updateURL(newState, options);
    this.logger.debug('URLNavigator: calling onStateChange', newState);
    this.onStateChange(newState);
  }

  /**
   * Navigate to next page
   * @param {PagedBook} pagedBook - Current book structure
   */
  navigateNextPage(pagedBook, options = {}) {
    const currentState = this.parseURL();
    const { chapter, page } = currentState;

    if (!pagedBook || !pagedBook.chapters) return;

    const currentChapter = pagedBook.chapters[chapter];
    if (!currentChapter) return;

    if (page < currentChapter.pages.length - 1) {
      // Next page in current chapter
      this.navigateTo(chapter, page + 1, options);
    } else if (chapter < pagedBook.chapters.length - 1) {
      // First page of next chapter
      this.navigateTo(chapter + 1, 0, options);
    }
  }

  /**
   * Navigate to previous page
   * @param {PagedBook} pagedBook - Current book structure
   */
  navigatePrevPage(pagedBook, options = {}) {
    const currentState = this.parseURL();
    const { chapter, page } = currentState;

    if (page > 0) {
      // Previous page in current chapter
      this.navigateTo(chapter, page - 1, options);
    } else if (chapter > 0) {
      // Last page of previous chapter
      const prevChapter = pagedBook.chapters[chapter - 1];
      if (prevChapter) {
        this.navigateTo(chapter - 1, prevChapter.pages.length - 1, options);
      }
    }
  }

  /**
   * Navigate to next chapter
   * @param {PagedBook} pagedBook - Current book structure
   */
  navigateNextChapter(pagedBook) {
    const currentState = this.parseURL();
    const { chapter } = currentState;

    if (chapter < pagedBook.chapters.length - 1) {
      this.navigateTo(chapter + 1, 0);
    }
  }

  /**
   * Navigate to previous chapter
   * @param {PagedBook} pagedBook - Current book structure
   */
  navigatePrevChapter(pagedBook) {
    const currentState = this.parseURL();
    const { chapter } = currentState;

    if (chapter > 0) {
      this.navigateTo(chapter - 1, 0);
    }
  }

  /**
   * Jump to specific page by global index
   * @param {PagedBook} pagedBook
   * @param {number} globalPageIndex
   */
  jumpToPage(pagedBook, globalPageIndex) {
    for (let chapterIndex = 0; chapterIndex < pagedBook.chapters.length; chapterIndex++) {
      const chapter = pagedBook.chapters[chapterIndex];
      if (globalPageIndex >= chapter.startPageIndex &&
          globalPageIndex <= chapter.endPageIndex) {
        const localPageIndex = globalPageIndex - chapter.startPageIndex;
        this.navigateTo(chapterIndex, localPageIndex, { immediate: true });
        return;
      }
    }

    this.logger.warn('Page index out of bounds', { globalPageIndex, totalPages: pagedBook.totalPages });
  }

  /**
   * Get navigation context for current position
   * @param {PagedBook} pagedBook
   * @returns {Object}
   */
  getNavigationContext(pagedBook) {
    const currentState = this.parseURL();

    if (!pagedBook || !pagedBook.chapters) {
      return {
        current: currentState,
        total: { chapters: 0, pages: 0 },
        navigation: {
          hasPrevPage: false,
          hasNextPage: false,
          hasPrevChapter: false,
          hasNextChapter: false
        }
      };
    }

    const chapter = pagedBook.chapters[currentState.chapter];
    if (!chapter) {
      return {
        current: currentState,
        total: { chapters: pagedBook.totalChapters, pages: pagedBook.totalPages },
        navigation: {
          hasPrevPage: false,
          hasNextPage: false,
          hasPrevChapter: false,
          hasNextChapter: false
        }
      };
    }

    const currentGlobalPage = chapter.startPageIndex + currentState.page;

    return {
      current: {
        ...currentState,
        globalPage: currentGlobalPage
      },
      total: {
        chapters: pagedBook.totalChapters,
        pages: pagedBook.totalPages
      },
      progress: {
        percentage: Math.round((currentGlobalPage + 1) / pagedBook.totalPages * 100),
        chapterProgress: Math.round((currentState.page + 1) / chapter.pageCount * 100)
      },
      navigation: {
        hasPrevPage: currentState.page > 0 || currentState.chapter > 0,
        hasNextPage: currentState.page < chapter.pageCount - 1 ||
                    currentState.chapter < pagedBook.chapters.length - 1,
        hasPrevChapter: currentState.chapter > 0,
        hasNextChapter: currentState.chapter < pagedBook.chapters.length - 1
      }
    };
  }

  /**
   * Setup browser back/forward button handling
   */
  setupHistoryListener() {
    window.addEventListener('popstate', (event) => {
      // Only handle our state changes
      if (event.state && event.state.source === 'url-navigator') {
        this.logger.debug('History navigation detected', event.state);
        this.onStateChange(event.state);
      }
    });

    this.logger.debug('History listener setup');
  }

  /**
   * Validate URL state against book structure
   * @param {URLState} state
   * @param {PagedBook} pagedBook
   * @returns {URLState} - Corrected state
   */
  validateState(state, pagedBook) {
    if (!pagedBook || !pagedBook.chapters) {
      return { bookId: state.bookId, chapter: 0, page: 0 };
    }

    let chapter = Math.max(0, Math.min(state.chapter, pagedBook.chapters.length - 1));
    const selectedChapter = pagedBook.chapters[chapter];

    if (!selectedChapter) {
      return { bookId: state.bookId, chapter: 0, page: 0 };
    }

    let page = Math.max(0, Math.min(state.page, selectedChapter.pages.length - 1));

    return {
      bookId: state.bookId,
      chapter,
      page
    };
  }

  /**
   * Create shareable URL for current position
   * @returns {string}
   */
  createShareableURL() {
    return window.location.href;
  }

  /**
   * Reset navigation (go to beginning)
   */
  reset() {
    this.navigateTo(0, 0, { immediate: true });
  }

  /**
   * Destroy navigator and cleanup
   */
  destroy() {
    clearTimeout(this.updateDebounceTimer);
    this.logger.info('URLNavigator destroyed');
  }
}
