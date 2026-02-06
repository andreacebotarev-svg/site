/**
 * ReadingStateCoordinator - Single source of truth for reading position
 * Manages state synchronization: URL ↔ Storage ↔ UI
 * Handles initial state determination and runtime updates
 */
export class ReadingStateCoordinator {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.storageKey = 'reading_progress_v4';
    this.urlNavigator = options.urlNavigator;
    this.progressManager = options.progressManager;

    // Current reading state
    this.currentState = { chapter: 0, page: 0 };
    this.bookId = null;
  }

  /**
   * Initialize for a specific book
   */
  setBook(bookId) {
    this.bookId = bookId;
    this.progressManager?.setBookId(bookId);
  }

  /**
   * Determine initial reading position with strict priority
   * Priority: URL Params → Saved Progress → Start of Book (0,0)
   */
  async determineInitialState() {
    this.logger.debug('ReadingStateCoordinator: Determining initial state');

    // Priority 1: URL parameters (most specific)
    const urlState = this.urlNavigator.parseURL();
    const hasValidUrlParams = urlState.bookId === this.bookId &&
                             (urlState.chapter > 0 || urlState.page > 0);

    if (hasValidUrlParams) {
      this.currentState = {
        chapter: urlState.chapter,
        page: urlState.page
      };
      this.logger.info('ReadingStateCoordinator: Using URL state', this.currentState);
      return this.currentState;
    }

    // Priority 2: Saved progress from storage
    const savedProgress = await this.progressManager.loadProgress();
    if (savedProgress && this.isValidProgress(savedProgress)) {
      this.currentState = {
        chapter: savedProgress.chapter || 0,
        page: savedProgress.page || 0
      };

      // Sync URL to reflect loaded state
      this.urlNavigator.updateURL(this.currentState, { replace: true });

      this.logger.info('ReadingStateCoordinator: Using saved progress', this.currentState);
      return this.currentState;
    }

    // Priority 3: Start from beginning
    this.currentState = { chapter: 0, page: 0 };

    // Ensure URL reflects starting position
    this.urlNavigator.updateURL(this.currentState, { replace: true });

    this.logger.info('ReadingStateCoordinator: Starting from beginning', this.currentState);
    return this.currentState;
  }

  /**
   * Update current state and sync all sources
   */
  async updateState(newState, options = {}) {
    // Validate state
    if (!this.isValidState(newState)) {
      this.logger.warn('ReadingStateCoordinator: Invalid state update', newState);
      return;
    }

    // Update internal state
    this.currentState = { ...newState };

    // Sync URL (unless disabled)
    if (!options.skipUrlUpdate) {
      this.urlNavigator.updateURL(this.currentState, { immediate: true });
    }

    // Sync storage (unless disabled)
    if (!options.skipStorageUpdate) {
      this.progressManager.updateProgress({
        chapter: this.currentState.chapter,
        page: this.currentState.page
      });
    }

    this.logger.debug('ReadingStateCoordinator: State updated', this.currentState);
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return { ...this.currentState };
  }

  /**
   * Validate progress data format
   */
  isValidProgress(progress) {
    return progress &&
           typeof progress.chapter === 'number' &&
           typeof progress.page === 'number' &&
           progress.chapter >= 0 &&
           progress.page >= 0;
  }

  /**
   * Validate state object
   */
  isValidState(state) {
    return state &&
           typeof state.chapter === 'number' &&
           typeof state.page === 'number' &&
           state.chapter >= 0 &&
           state.page >= 0;
  }

  /**
   * Parse integer parameter from URL with fallback
   */
  parseIntParam(value, fallback = 0) {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Parse current URL to extract reading state
   */
  parseURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      const bookId = params.get('bookId');

      if (!bookId) {
        return { hasParams: false };
      }

      return {
        hasParams: true,
        bookId: bookId,
        chapter: this.parseIntParam(params.get('chapter'), 0),
        page: this.parseIntParam(params.get('page'), 0)
      };
    } catch (error) {
      this.logger.warn('ReadingStateManager: URL parsing failed', error);
      return { hasParams: false };
    }
  }

  /**
   * Load saved progress from storage
   */
  async loadProgress(bookId) {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;

      const progress = JSON.parse(data);
      if (progress.bookId === bookId && progress.version === '4.0') {
        return {
          chapter: progress.chapter || 0,
          page: progress.page || 0
        };
      }

      return null;
    } catch (error) {
      this.logger.error('ReadingStateManager: Failed to load progress', error);
      return null;
    }
  }

  /**
   * Save current progress to storage
   */
  async saveProgress(bookId, state) {
    try {
      const progress = {
        version: '4.0',
        bookId: bookId,
        chapter: state.chapter,
        page: state.page,
        timestamp: Date.now()
      };

      localStorage.setItem(this.storageKey, JSON.stringify(progress));
      this.logger.debug('ReadingStateManager: Progress saved', progress);
    } catch (error) {
      this.logger.error('ReadingStateManager: Failed to save progress', error);
    }
  }

  /**
   * Update URL with current state
   */
  updateURL(state, options = {}) {
    try {
      const url = new URL(window.location);

      if (state.bookId) url.searchParams.set('bookId', state.bookId);
      url.searchParams.set('chapter', state.chapter.toString());
      url.searchParams.set('page', state.page.toString());

      if (options.replace) {
        window.history.replaceState(null, '', url.toString());
      } else {
        window.history.pushState(null, '', url.toString());
      }

      this.logger.debug('ReadingStateManager: URL updated', {
        url: url.toString(),
        replace: options.replace
      });
    } catch (error) {
      this.logger.error('ReadingStateManager: Failed to update URL', error);
    }
  }

  /**
   * Validate state against book structure
   */
  validateState(state, pagedBook) {
    if (!pagedBook || !pagedBook.chapters) {
      return { chapter: 0, page: 0 };
    }

    let chapter = Math.max(0, Math.min(state.chapter || 0, pagedBook.chapters.length - 1));
    const selectedChapter = pagedBook.chapters[chapter];

    if (!selectedChapter) {
      return { chapter: 0, page: 0 };
    }

    let page = Math.max(0, Math.min(state.page || 0, selectedChapter.pages.length - 1));

    return { chapter, page };
  }
}

// Legacy alias for backward compatibility
export const ReadingStateManager = ReadingStateCoordinator;
