/**
 * PaginationController (V4 PURE)
 * Manages mathematical pagination ONLY.
 * Removes all legacy complexity.
 * Handles: Paging logic, State persistence, URL synchronization.
 */
import { ProgressManager } from './ProgressManager.js';
import { InteractionLayer } from './InteractionLayer.js';
import { NavigationBar } from './pagination/NavigationBar.js';
import { SwipePager } from './pagination/SwipePager.js';

export class PaginationController {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.container = null;
    this.bookId = null;

    // Core Components
    this.contentPager = null; // The Mathematician (calculates pages)
    this.urlNavigator = null; // The Navigator (syncs URL)
    this.pageRenderer = null; // The Artist (draws DOM)
    this.interactionLayer = null; // The Interaction Manager
    this.navigationBar = null; // The Navigation UI (single source of truth)

    // Mobile Navigation
    this.swipePager = null; // Swipe gesture handler

    // Data Models
    this.pagedBook = null;    // Structure: { chapters: [ { pages: [] } ] }
    this.progressManager = null; // Saves/Loads progress

    this.options = {
      usePaginationV4: true, // Always true now
      ...options
    };

    // State
    this.busy = false; // Prevent double-clicks during navigation
  }

  /**
   * Initialize with container
   */
  initialize(container) {
    this.container = container;
    this.logger.info('PaginationController (V4 Pure) initialized');
  }

  /**
   * Main Entry Point: Setup pagination for content
   */
  async setupPagination(contentElement, bookId, options = {}) {
    this.bookId = bookId;
    const { paragraphs } = options;

    if (!paragraphs || paragraphs.length === 0) {
      this.logger.error('No paragraphs provided for pagination');
      return;
    }

    this.logger.info('Setting up V4 Pagination', { bookId, paragraphs: paragraphs.length });

    try {
      // 1. Initialize Helpers
      await this.loadDependencies();

      // 2. Активируем слушатели на главном контейнере
      this.interactionLayer.attach(contentElement);

      this.progressManager = new ProgressManager({ logger: this.logger });
      this.progressManager.setBookId(bookId);

      // 3. Создаем Renderer и отдаем ему Layer
      this.pageRenderer = new this.PageRendererClass(contentElement, {
        logger: this.logger,
        interactionLayer: this.interactionLayer
      });

      // 3. Calculate Pages (Heavy Math)
      this.pagedBook = await this.contentPager.paginate(paragraphs, bookId);

      // 4. Setup URL Navigator
      this.urlNavigator = new this.URLNavigatorClass(
        (state) => this.handleNavigationStateChange(state),
        { logger: this.logger }
      );

      // 5. Setup UI Controls (Buttons)
      this.setupNavigationControls();

      // 6. INITIAL NAVIGATION (The Critical Logic)
      await this.performInitialNavigation();

    } catch (error) {
      this.logger.error('CRITICAL: Pagination setup failed', error);
      this.renderErrorState(contentElement, error);
    }
  }

  /**
   * Smart Initial Navigation
   * Priority: URL Params -> Saved Progress -> Start of Book
   */
  async performInitialNavigation() {
    const urlState = this.urlNavigator.parseURL();

    // Check if URL has valid coordinates
    const hasUrlParams = urlState.bookId === this.bookId && (urlState.chapter > 0 || urlState.page > 0);

    if (hasUrlParams) {
      this.logger.info('Navigating from URL', urlState);
      const valid = this.urlNavigator.validateState(urlState, this.pagedBook);
      this.urlNavigator.navigateTo(valid.chapter, valid.page, { immediate: true });
    } else {
      // No URL params? Check storage!
      this.logger.info('No URL params, checking saved progress...');
      const saved = await this.progressManager.loadProgress(); // Load saved progress

      // Fallback logic for legacy progress manager returning percentages
      // Note: Ideal fix is to update ProgressManager, but here we handle "page-based" return if available
      if (saved && typeof saved.chapter === 'number') {
         this.logger.info('Restoring saved progress', saved);
         this.urlNavigator.navigateTo(saved.chapter, saved.page || 0, { immediate: true });
      } else {
         this.logger.info('Starting from beginning');
         this.urlNavigator.navigateTo(0, 0, { immediate: true });
      }
    }
  }

  /**
   * Lazy load dependencies
   */
  async loadDependencies() {
    // Import all V4 modules
    const [PagerMod, NavMod, RenderMod, InteractMod] = await Promise.all([
      import('./pagination/ContentPager.js'),
      import('./pagination/URLNavigator.js'),
      import('./pagination/PageRenderer.js'),
      import('./InteractionLayer.js')
    ]);

    this.contentPager = new PagerMod.ContentPager({
      logger: this.logger,
      config: { paragraphsPerPage: { preferred: 5 } }
    });

    // 1. Создаем Layer (Ядро)
    this.interactionLayer = new InteractMod.InteractionLayer({
      logger: this.logger,
      vocabularyStorage: this.options.vocabularyStorage,
      wordPopover: this.options.getWordPopover ? this.options.getWordPopover() : null
    });

    this.URLNavigatorClass = NavMod.URLNavigator;
    this.PageRendererClass = RenderMod.PageRenderer;
  }

  /**
   * Handle State Change (triggered by URLNavigator)
   * This is the ONLY place where rendering happens.
   */
  async handleNavigationStateChange(state) {
    if (!this.pagedBook || !this.pageRenderer) return;

    try {
      const { chapter: chIdx, page: pgIdx } = state;
      const chapter = this.pagedBook.chapters[chIdx];

      if (!chapter) throw new Error(`Chapter ${chIdx} not found`);
      const page = chapter.pages[pgIdx];
      if (!page) throw new Error(`Page ${pgIdx} in Chapter ${chIdx} not found`);

      // 1. Render Logic
      await this.pageRenderer.renderPage(page, chapter, { animate: true });

      // 2. Save Progress (Auto-save)
      this.progressManager.updateProgress({
        chapter: chIdx,
        page: pgIdx
      });

    } catch (err) {
      this.logger.error('Render failed during navigation', err);
    } finally {
      // 3. Always clear busy state and update navigation
      this.busy = false;
      this.renderNav();

      // Verify system integrity (development only)
      if (typeof window !== 'undefined' && window.checkNavigationInvariants) {
        setTimeout(() => window.checkNavigationInvariants(), 100);
      }
    }
  }

  /**
   * Handle Actions (Buttons, Keys, Swipes)
   */
  handlePageAction(action) {
    if (!this.urlNavigator || !this.pagedBook) return;

    // Use IMMEDIATE mode for buttons to prevent "freeze" feel
    const opts = { immediate: true };

    switch (action) {
      case 'next': this.urlNavigator.navigateNextPage(this.pagedBook, opts); break;
      case 'prev': this.urlNavigator.navigatePrevPage(this.pagedBook, opts); break;
      case 'home': this.urlNavigator.navigateTo(0, 0, opts); break;
      case 'end':
        const lastCh = this.pagedBook.totalChapters - 1;
        const lastPg = this.pagedBook.chapters[lastCh].pages.length - 1;
        this.urlNavigator.navigateTo(lastCh, lastPg, opts);
        break;
    }
  }

  /**
   * Single action dispatcher - prevents race conditions and ensures consistent state
   */
  dispatch(action) {
    if (!this.urlNavigator || !this.pagedBook) {
      this.logger.warn('Navigation dispatch ignored - components not ready');
      return;
    }

    if (this.busy) {
      this.logger.debug('Navigation dispatch ignored - busy');
      return;
    }

    // Set busy state immediately to prevent double-clicks
    this.busy = true;
    this.renderNav();

    const opts = { immediate: true };

    try {
      switch (action) {
        case 'prev':
          this.urlNavigator.navigatePrevPage(this.pagedBook, opts);
          break;
        case 'next':
          this.urlNavigator.navigateNextPage(this.pagedBook, opts);
          break;
        case 'home':
          this.urlNavigator.navigateTo(0, 0, opts);
          break;
        case 'end':
          const lastCh = this.pagedBook.totalChapters - 1;
          const lastPg = this.pagedBook.chapters[lastCh].pages.length - 1;
          this.urlNavigator.navigateTo(lastCh, lastPg, opts);
          break;
        default:
          this.logger.warn('Unknown navigation action:', action);
          this.busy = false;
          this.renderNav();
      }
    } catch (error) {
      this.logger.error('Navigation dispatch failed:', error);
      this.busy = false;
      this.renderNav();
      throw error; // Re-throw to let caller handle
    }
  }

  /**
   * Render navigation UI with current state
   */
  /**
   * Render navigation UI with current state
   */
  renderNav(override = {}) {
    if (!this.navigationBar) {
      this.logger.debug('renderNav: no navigationBar');
      return;
    }

    try {
      const busy = override.busy ?? this.busy ?? false;

      // If we don't have book data yet, show loading state
      if (!this.pagedBook || !this.urlNavigator) {
        this.logger.debug('renderNav: no pagedBook or urlNavigator, showing loading');
        this.navigationBar.render({
          busy,
          chapter: { index: 0, total: 1, pageIndex: 0, pageCount: 1 },
          global: { index: 0, total: 1 },
          navigation: { hasPrev: false, hasNext: false }
        });
        return;
      }

      const ctx = this.urlNavigator.getNavigationContext(this.pagedBook);
      const chapter = this.pagedBook.chapters[ctx.current.chapter];

      this.logger.debug('renderNav: updating navigation', {
        busy,
        chapter: ctx.current.chapter,
        page: ctx.current.page,
        hasPrev: ctx.navigation.hasPrevPage,
        hasNext: ctx.navigation.hasNextPage,
        totalChapters: this.pagedBook.totalChapters,
        totalPages: this.pagedBook.totalPages
      });

      this.navigationBar.render({
        busy,
        chapter: {
          index: ctx.current.chapter,
          total: this.pagedBook.totalChapters,
          pageIndex: ctx.current.page,
          pageCount: chapter ? chapter.pages.length : 0
        },
        global: {
          index: ctx.current.globalPage,
          total: this.pagedBook.totalPages
        },
        navigation: {
          hasPrev: ctx.navigation.hasPrevPage,
          hasNext: ctx.navigation.hasNextPage
        }
      });
    } catch (error) {
      this.logger.error('Failed to render navigation:', error);
    }
  }

  // ==========================================
  // UI CONTROLS (Unified)
  // ==========================================

  setupNavigationControls() {
    // Create or reuse navigation container
    let navRoot = this.container.querySelector('.pagination-nav');
    if (!navRoot) {
      navRoot = document.createElement('div');
      navRoot.className = 'pagination-nav';
      this.container.appendChild(navRoot);
    }

    // Destroy existing navigation bar to prevent conflicts
    this.navigationBar?.destroy();

    // Create new unified NavigationBar
    this.navigationBar = new NavigationBar(navRoot, {
      logger: this.logger,
      onAction: (action) => this.dispatch(action)
    });

    this.logger.info('NavigationBar initialized');

    // Setup swipe navigation for mobile
    this._setupSwipeNavigation();

    // Verify system integrity after setup
    if (typeof window !== 'undefined' && window.checkNavigationInvariants) {
      setTimeout(() => {
        const invariants = window.checkNavigationInvariants();
        if (!invariants.overall) {
          this.logger.error('вќЊ Navigation invariants failed after setup', invariants);
        }
      }, 100);
    }
  }

  /**
   * Setup swipe navigation for mobile devices
   */
  _setupSwipeNavigation() {
    // Destroy existing swipe pager
    this.swipePager?.destroy();

    // Create swipe pager for mobile navigation
    this.swipePager = new SwipePager({
      onPrev: () => this.dispatch('prev'),
      onNext: () => this.dispatch('next'),
      logger: this.logger
    });

    // Attach to content area (not navigation buttons)
    const contentArea = this.container.querySelector('#reading-content') ||
                       this.container.querySelector('.reader-content') ||
                       this.container.querySelector('.book-content') ||
                       this.container;

    if (contentArea) {
      this.swipePager.attach(contentArea);
      this.logger.info('SwipePager attached to content area', contentArea.className || contentArea.id);
    } else {
      this.logger.warn('Could not find content area for SwipePager');
    }
  }


  // ==========================================
  // PUBLIC API (For external callers)
  // ==========================================

  nextPage() { this.handlePageAction('next'); }
  previousPage() { this.handlePageAction('prev'); }

  // Clean shutdown
  destroy() {
    this.urlNavigator?.destroy();
    this.pageRenderer?.destroy();
    this.navigationBar?.destroy();
    this.swipePager?.destroy();
    this.container = null;
    this.logger.info('PaginationController (V4) destroyed');
  }

  // API compatibility mock (always returns true now)
  isUsingV4() { return true; }

  // API stats
  getStats() {
    return {
      version: '4.0-pure',
      chapters: this.pagedBook?.totalChapters || 0,
      pages: this.pagedBook?.totalPages || 0
    };
  }

  /**
   * Render error state when pagination fails
   */
  renderErrorState(contentElement, error) {
    contentElement.innerHTML = `
      <div class="pagination-error">
        <h3>вљ пёЏ Pagination Error</h3>
        <p>Failed to load book content. Please try refreshing the page.</p>
        <details>
          <summary>Error Details</summary>
          <pre>${error.message}</pre>
        </details>
      </div>
    `;
  }

  /**
   * Determine where to start reading based on priority
   */
  async determineStartState() {
    // Priority 1: URL parameters
    const urlState = this.urlNavigator.parseURL();
    if (urlState.bookId === this.bookId && urlState.chapter !== undefined && urlState.page !== undefined) {
      this.logger.debug('ReadingController: Using URL state', urlState);
      return { chapter: urlState.chapter, page: urlState.page };
    }

    // Priority 2: Saved progress
    const savedState = await this.stateManager.loadProgress(this.bookId);
    if (savedState) {
      this.logger.debug('ReadingController: Using saved progress', savedState);
      // Update URL to reflect saved state
      this.urlNavigator.updateURL(savedState, { replace: true });
      return savedState;
    }

    // Priority 3: Start from beginning
    const defaultState = { chapter: 0, page: 0 };
    this.logger.debug('ReadingController: Starting from beginning', defaultState);
    return defaultState;
  }

  /**
   * Setup new v4.0 mathematical pagination system
   */
  async setupPaginationV4(contentElement, paragraphs, bookId) {
    this.logger.info('Setting up Pagination v4.0', { bookId, paragraphCount: paragraphs.length });

    try {
      // Lazy load v4.0 components
      await this.loadV4Components();

      // Paginate content using mathematical algorithm
      this.pagedBook = await this.contentPager.paginate(paragraphs, bookId);

      this.logger.info('Content paginated successfully', {
        chapters: this.pagedBook.totalChapters,
        pages: this.pagedBook.totalPages,
        words: this.pagedBook.totalWords
      });

      // Setup URL navigation
      this.urlNavigator = new (await import('./pagination/URLNavigator.js')).URLNavigator(
        (state) => this.handleV4Navigation(state),
        { logger: this.logger }
      );

      // Setup page renderer
      this.pageRenderer = new (await import('./pagination/PageRenderer.js')).PageRenderer(
        contentElement,
        {
          logger: this.logger,
          bookId: this.bookId
        }
      );

      // Set navigation callback
      this.pageRenderer.setNavigationCallback((action) => this.handleV4PageAction(action));

      // Setup UI controls
      this.setupModeSwitcher();
      this.setupNavigationControls();

      // Restore progress from URL or saved state
      await this.restoreV4Progress();

      this.logger.info('Pagination v4.0 setup completed');

    } catch (error) {
      this.logger.error('Failed to setup Pagination v4.0', error);
      throw error;
    }
  }


  /**
   * Get reading statistics
   */
  getStats() {
    if (!this.pagedBook) return { version: '4.0', status: 'not-initialized' };

    return {
      version: '4.0',
      bookId: this.bookId,
      currentChapter: this.currentState.chapter,
      currentPage: this.currentState.page,
      totalChapters: this.pagedBook.totalChapters,
      totalPages: this.pagedBook.totalPages,
      totalWords: this.pagedBook.totalWords
    };
  }

  /**
   * Destroy reading session
   */
  destroy() {
    // Cleanup event listeners
    if (this.navControls) {
      const prevBtn = this.navControls.querySelector('.pagination-prev');
      const nextBtn = this.navControls.querySelector('.pagination-next');

      if (prevBtn) prevBtn.removeEventListener('click', this.previousPage);
      if (nextBtn) nextBtn.removeEventListener('click', this.nextPage);
    }

    // Reset state
    this.bookId = null;
    this.pagedBook = null;
    this.currentState = { chapter: 0, page: 0 };

    this.logger.info('PaginationController: Session destroyed');
  }




  /**
   * Clean shutdown
   */
  destroy() {
    this.urlNavigator?.destroy();
    this.pageRenderer?.destroy();
    this.navigationBar?.destroy();
    this.swipePager?.destroy();
    this.container = null;
    this.logger.info('PaginationController (V4) destroyed');
  }

  // API compatibility mock (always returns true now)
  isUsingV4() { return true; }

  // API stats
  getStats() {
    return {
      version: '4.0-pure',
      chapters: this.pagedBook?.totalChapters || 0,
      pages: this.pagedBook?.totalPages || 0
    };
  }
}
