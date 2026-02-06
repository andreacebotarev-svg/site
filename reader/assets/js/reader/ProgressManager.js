/**
 * ProgressManager - Centralized reading progress management
 * Handles saving, loading, and synchronization of reading progress
 */
export class ProgressManager {
  constructor(options = {}) {
    this.logger = options.logger || console;

    this.bookId = null;
    this.saveTimeout = null;
    this.lastSavedProgress = null;

    // Progress data - supports both v3.x and v4.0 formats
    this.currentProgress = {
      // v4.0 format (preferred)
      version: '4.0',
      chapter: 0,
      page: 0,
      bookId: null,

      // v3.x format (legacy compatibility)
      page_v3: 0,
      totalPages_v3: 0,
      scrollTop: 0,
      scrollHeight: 0,

      // Metadata
      timestamp: Date.now(),
      mode: 'pages' // 'scroll', 'pages', 'css-columns'
    };

    this.options = {
      autoSave: true,
      saveDelay: 1000, // ms
      enableLocalStorage: true,
      enableSessionStorage: false,
      ...options
    };

    this.logger.info('ProgressManager initialized');
  }

  /**
   * Set book ID for progress tracking
   */
  setBookId(bookId) {
    this.bookId = bookId;
    this.loadProgress();
    this.logger.debug('Book ID set for progress tracking', { bookId });
  }

  /**
   * Update current progress
   */
  updateProgress(progress) {
    this.currentProgress = {
      ...this.currentProgress,
      ...progress,
      timestamp: Date.now()
    };

    if (this.options.autoSave) {
      this.scheduleSave();
    }

    this.logger.debug('Progress updated', progress);
  }

  /**
   * Update progress for v4.0 pagination (chapter/page format)
   */
  updateV4Progress(chapter, page, bookId = null) {
    this.currentProgress = {
      ...this.currentProgress,
      version: '4.0',
      chapter: chapter,
      page: page,
      bookId: bookId || this.bookId,
      timestamp: Date.now()
    };

    if (this.options.autoSave) {
      this.scheduleSave();
    }

    this.logger.debug('V4.0 progress updated', { chapter, page, bookId });
  }

  /**
   * Get current progress in v4.0 format
   */
  getV4Progress() {
    // If we have v4.0 data, return it
    if (this.currentProgress.version === '4.0') {
      return {
        chapter: this.currentProgress.chapter,
        page: this.currentProgress.page,
        bookId: this.currentProgress.bookId
      };
    }

    // Try to convert from v3.x format (approximate)
    // This is a fallback for users with old progress data
    const v3Progress = this.currentProgress.page_v3;
    const totalPages = this.currentProgress.totalPages_v3;

    if (totalPages > 0) {
      // Rough estimation: assume 5 pages per chapter
      const pagesPerChapter = 5;
      const estimatedChapter = Math.floor(v3Progress / pagesPerChapter);
      const estimatedPage = v3Progress % pagesPerChapter;

      this.logger.warn('Converting v3.x progress to v4.0 format (approximate)', {
        v3Page: v3Progress,
        estimatedChapter,
        estimatedPage
      });

      return {
        chapter: estimatedChapter,
        page: estimatedPage,
        bookId: this.bookId
      };
    }

    // Default fallback
    return {
      chapter: 0,
      page: 0,
      bookId: this.bookId
    };
  }

  /**
   * Schedule progress save with debouncing
   */
  scheduleSave() {
    if (!this.bookId) return;

    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveProgress();
    }, this.options.saveDelay);
  }

  /**
   * Save progress immediately
   */
  async saveProgress() {
    if (!this.bookId) return;

    clearTimeout(this.saveTimeout);

    try {
      // Avoid saving identical progress
      const progressKey = JSON.stringify(this.currentProgress);
      if (this.lastSavedProgress === progressKey) {
        return;
      }
      this.lastSavedProgress = progressKey;

      // Save to localStorage
      if (this.options.enableLocalStorage) {
        await this.saveToLocalStorage();
      }

      // Save to sessionStorage as backup
      if (this.options.enableSessionStorage) {
        await this.saveToSessionStorage();
      }

      this.logger.debug('Progress saved', this.currentProgress);

    } catch (error) {
      this.logger.error('Failed to save progress', error);
    }
  }

  /**
   * Save to localStorage
   */
  async saveToLocalStorage() {
    const key = `reader_progress_${this.bookId}`;
    const data = JSON.stringify(this.currentProgress);
    localStorage.setItem(key, data);
  }

  /**
   * Save to sessionStorage
   */
  async saveToSessionStorage() {
    const key = `reader_progress_session_${this.bookId}`;
    const data = JSON.stringify(this.currentProgress);
    sessionStorage.setItem(key, data);
  }

  /**
   * Load progress from storage
   */
  loadProgress() {
    if (!this.bookId) return null;

    try {
      // Try localStorage first
      let progress = null;
      if (this.options.enableLocalStorage) {
        progress = this.loadFromLocalStorage();
      }

      // Fallback to sessionStorage
      if (!progress && this.options.enableSessionStorage) {
        progress = this.loadFromSessionStorage();
      }

      if (progress) {
        this.currentProgress = {
          ...this.currentProgress,
          ...progress
        };
        this.logger.info('Progress loaded', progress);
        return progress;
      }
    } catch (error) {
      this.logger.error('Failed to load progress', error);
    }

    return null;
  }

  /**
   * Load from localStorage
   */
  loadFromLocalStorage() {
    const key = `reader_progress_${this.bookId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Load from sessionStorage
   */
  loadFromSessionStorage() {
    const key = `reader_progress_session_${this.bookId}`;
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get current progress
   */
  getCurrentProgress() {
    return { ...this.currentProgress };
  }

  /**
   * Get progress percentage (0-1)
   */
  getProgressPercentage() {
    const { page, totalPages, scrollTop, scrollHeight } = this.currentProgress;

    if (this.currentProgress.mode === 'pages' && totalPages > 0) {
      return (page + 1) / totalPages;
    }

    if (this.currentProgress.mode === 'scroll' && scrollHeight > 0) {
      return scrollTop / scrollHeight;
    }

    return 0;
  }

  /**
   * Check if progress has been made
   */
  hasProgress() {
    return this.currentProgress.page > 0 || this.currentProgress.scrollTop > 0;
  }

  /**
   * Clear progress for current book
   */
  clearProgress() {
    if (!this.bookId) return;

    try {
      // Clear localStorage
      if (this.options.enableLocalStorage) {
        const key = `reader_progress_${this.bookId}`;
        localStorage.removeItem(key);
      }

      // Clear sessionStorage
      if (this.options.enableSessionStorage) {
        const key = `reader_progress_session_${this.bookId}`;
        sessionStorage.removeItem(key);
      }

      // Reset current progress
      this.currentProgress = {
        page: 0,
        totalPages: 0,
        scrollTop: 0,
        scrollHeight: 0,
        timestamp: Date.now(),
        mode: 'scroll'
      };

      this.lastSavedProgress = null;
      clearTimeout(this.saveTimeout);

      this.logger.info('Progress cleared', { bookId: this.bookId });

    } catch (error) {
      this.logger.error('Failed to clear progress', error);
    }
  }

  /**
   * Export progress data
   */
  exportProgress() {
    return {
      bookId: this.bookId,
      progress: this.currentProgress,
      metadata: {
        exportedAt: Date.now(),
        hasProgress: this.hasProgress(),
        progressPercentage: this.getProgressPercentage()
      }
    };
  }

  /**
   * Import progress data
   */
  importProgress(data) {
    if (!data || !data.progress) return false;

    try {
      this.currentProgress = {
        ...this.currentProgress,
        ...data.progress
      };

      this.saveProgress();
      this.logger.info('Progress imported', data);
      return true;

    } catch (error) {
      this.logger.error('Failed to import progress', error);
      return false;
    }
  }

  /**
   * Get reading statistics
   */
  getStats() {
    return {
      bookId: this.bookId,
      currentPage: this.currentProgress.page,
      totalPages: this.currentProgress.totalPages,
      progressPercentage: this.getProgressPercentage(),
      hasProgress: this.hasProgress(),
      lastSaved: this.currentProgress.timestamp,
      mode: this.currentProgress.mode
    };
  }

  /**
   * Setup auto-save on visibility change
   */
  setupAutoSave() {
    if (!this.options.autoSave) return;

    this.visibilityHandler = () => {
      if (document.hidden) {
        // Save immediately when page becomes hidden
        this.saveProgress();
      }
    };

    this.beforeUnloadHandler = () => {
      // Save immediately before page unload
      this.saveProgress();
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    this.logger.debug('Auto-save setup completed');
  }

  /**
   * Destroy progress manager
   */
  destroy() {
    // Save any pending progress
    if (this.hasProgress()) {
      this.saveProgress();
    }

    // Remove event listeners
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }

    // Clear timeouts
    clearTimeout(this.saveTimeout);

    // Clear references
    this.bookId = null;
    this.lastSavedProgress = null;

    this.logger.info('ProgressManager destroyed');
  }
}
