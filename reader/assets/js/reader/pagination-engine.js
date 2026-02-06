/**
 * PaginationEngine - True book-like pagination with transform-based transitions
 * Implements double-buffered page system for smooth animations
 */
export class PaginationEngine {
  constructor(options = {}) {
    this.options = {
      pageHeight: options.pageHeight || this.calculateOptimalPageHeight(),
      ...options
    };

    // Core pagination data
    this.pages = [];
    this.currentIndex = 0;

    // DOM elements
    this.readerViewer = null;
    this.pageElements = [];

    // Intersection observer for tracking current page
    this.intersectionObserver = null;
    this.isRestoring = false; // Flag to prevent interference during progress restoration

    // Progress tracking
    this.bookId = null;
    this.saveTimeout = null;
    this.lastSavedProgress = null;

    // DOM restoration tracking
    this.originalParent = null;
    this.placeholder = null;
    this.isContentHidden = false;

    // Navigation tracking
    this.isNavigating = false;

    // Performance metrics
    this.metrics = {};

    // Animation state for interruptible transitions
    this.isAnimating = false;
    this.currentAnimationCleanup = null;

    // Resize handling
    this._onResize = this._debounce(this._onResize.bind(this), 300);

    console.log('PaginationEngine created with scroll-snap approach');
  }

  /**
   * Mount pagination system with scroll-snap rendering
   * Sets up vertical page stack in reader-viewer
   */
  mount({ readerViewerEl }) {
    this.readerViewer = readerViewerEl;
    this.pageHost = readerViewerEl; // For measuring text dimensions

    // Setup intersection observer for tracking current page
    this.setupIntersectionObserver();

    // Resize handling
    window.addEventListener('resize', this._onResize);

    console.log('PaginationEngine mounted with scroll-snap system');
  }

  /**
   * Setup intersection observer to track current page
   */
  setupIntersectionObserver() {
    const options = {
      root: this.readerViewer,
      rootMargin: '0px 0px -20% 0px', // Smaller margin for more precise detection
      threshold: [0.3, 0.6, 0.8] // Multiple thresholds for better control
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      // Skip updates during progress restoration or navigation to avoid interference
      if (this.isRestoring || this.isNavigating) return;

      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          // Only consider page active when 60%+ is visible (more stable)
          const pageIndex = parseInt(entry.target.dataset.pageIndex);
          if (pageIndex !== this.currentIndex) {
            this.currentIndex = pageIndex;
            this.scheduleProgressSave();
            console.log(`Current page changed to: ${pageIndex + 1} (${(entry.intersectionRatio * 100).toFixed(1)}% visible)`);
          }
        }
      });
    }, options);
  }

  /**
   * Render vertical stack of pages in reader-viewer
   */
  renderPagesStack() {
    if (!this.readerViewer || !this.pages || this.pages.length === 0) return;

    // Hide original content
    const originalContent = this.readerViewer.querySelector('#reading-content');
    if (originalContent) {
      originalContent.style.display = 'none';
      this.isContentHidden = true;
    }

    // Clear existing pages
    this.pageElements.forEach(el => {
      if (el && el.parentNode) {
        this.intersectionObserver.unobserve(el);
        el.remove();
      }
    });
    this.pageElements = [];

    // Create page elements
    this.pages.forEach((pageBlocks, index) => {
      const pageEl = document.createElement('div');
      pageEl.className = 'page';
      pageEl.dataset.pageIndex = index;

      // Add page indicator
      const indicator = document.createElement('div');
      indicator.className = 'page-indicator';
      indicator.textContent = `Страница ${index + 1} из ${this.pages.length}`;
      pageEl.appendChild(indicator);

      // Add content blocks
      const contentContainer = document.createElement('div');
      contentContainer.className = 'page-content';

      pageBlocks.forEach(block => {
        if (block && block.cloneNode) {
          contentContainer.appendChild(block.cloneNode(true));
        }
      });

      pageEl.appendChild(contentContainer);
      this.readerViewer.appendChild(pageEl);
      this.pageElements.push(pageEl);

      // Observe for intersection
      this.intersectionObserver.observe(pageEl);
    });

    console.log(`Rendered ${this.pages.length} pages in scroll-snap stack`);
  }

  /**
   * Navigate to specific page by scrolling
   * @param {number} pageIndex - Page to navigate to
   * @param {object} options - Navigation options
   * @param {boolean} options.instant - Use 'auto' behavior (no animation)
   */
  goToPage(pageIndex, { instant = false } = {}) {
    if (!this.pageElements[pageIndex]) return;

    // Set navigation flag to prevent immediate auto-save
    this.isNavigating = true;

    // 🔧 DISCONNECT observer на время прокрутки - unobserve всех элементов
    const wasObserving = !!this.intersectionObserver;
    if (wasObserving) {
      this.pageElements.forEach(el => {
        this.intersectionObserver.unobserve(el);
      });
    }

    const targetPage = this.pageElements[pageIndex];
    targetPage.scrollIntoView({
      behavior: instant ? 'auto' : 'smooth',  // Без анимации при restore
      block: 'end'
    });

    this.currentIndex = pageIndex;

    // 🔧 RECONNECT после завершения scroll - observe всех элементов обратно
    if (wasObserving) {
      const reconnect = () => {
        this.pageElements.forEach(el => {
          this.intersectionObserver.observe(el);
        });

        // Clear navigation flag after reconnect
        setTimeout(() => {
          this.isNavigating = false;
        }, 100);
      };

      if (instant) {
        requestAnimationFrame(reconnect);
      } else {
        // Для smooth scroll ждём окончания анимации
        setTimeout(reconnect, 500);
      }
    }

    // Only schedule save if not currently restoring (to avoid conflicts)
    if (!this.isRestoring) {
      this.scheduleProgressSave();
    }
  }

  /**
   * Start progress restoration (prevents IntersectionObserver interference)
   */
  startProgressRestoration() {
    this.isRestoring = true;
  }

  /**
   * End progress restoration (re-enables IntersectionObserver)
   */
  endProgressRestoration() {
    this.isRestoring = false;
  }

  /**
   * Handle wheel events for page navigation
   */
  _onWheel(e) {
    e.preventDefault();

    // Anti-jitter for trackpads
    const now = performance.now();
    if (now - this.lastNavTs < 180) return;

    const dy = e.deltaY;
    if (Math.abs(dy) < 8) return;

    this.lastNavTs = now;
    const newIndex = dy > 0 ? this.currentIndex + 1 : this.currentIndex - 1;
    this.goToPage(Math.max(0, Math.min(newIndex, this.pages.length - 1)));
  }

  /**
   * Setup swipe gesture detection
   */
  setupSwipe(el) {
    const thresholdPx = 60;       // Minimum distance
    const minVelocity = 0.55;     // px/ms (Hammer-like)
    const maxOffAxis = 80;        // Tolerance for Y movement

    const getPoint = (t) => ({ x: t.clientX, y: t.clientY });

    el.addEventListener("touchstart", (e) => {
      if (!e.touches || e.touches.length !== 1) return;

      const p = getPoint(e.touches[0]);
      this._touch = {
        startX: p.x,
        startY: p.y,
        lastX: p.x,
        lastY: p.y,
        startTs: performance.now(),
        moved: false
      };
    }, { passive: true });

    el.addEventListener("touchmove", (e) => {
      if (!this._touch || !e.touches || e.touches.length !== 1) return;

      const p = getPoint(e.touches[0]);
      const dx = p.x - this._touch.startX;
      const dy = p.y - this._touch.startY;

      // Block scroll if this is a horizontal gesture
      if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
      }

      this._touch.lastX = p.x;
      this._touch.lastY = p.y;
      this._touch.moved = true;
    }, { passive: false });

    el.addEventListener("touchend", () => {
      if (!this._touch) return;

      const dt = Math.max(1, performance.now() - this._touch.startTs);
      const dx = this._touch.lastX - this._touch.startX;
      const dy = this._touch.lastY - this._touch.startY;
      const vx = dx / dt; // px/ms velocity

      const isHorizontal = Math.abs(dx) > Math.abs(dy) && Math.abs(dy) <= maxOffAxis;
      const passed = Math.abs(dx) >= thresholdPx || Math.abs(vx) >= minVelocity;

      if (this._touch.moved && isHorizontal && passed) {
        // Swipe left => next page
        const newIndex = dx < 0 ? this.currentIndex + 1 : this.currentIndex - 1;
        this.goToPage(Math.max(0, Math.min(newIndex, this.pages.length - 1)));
      }

      this._touch = null;
    }, { passive: true });
  }

  /**
   * Paginate existing content blocks
   * Contract: analyze and organize blocks without immediate DOM changes
   */
  async paginate(contentContainer) {
    const startTime = performance.now();

    // Find atomic content blocks (paragraphs, lists, images, etc.)
    this.originalBlocks = this.collectContentBlocks(contentContainer);

    if (this.originalBlocks.length === 0) {
      console.warn('No content blocks found for pagination');
      return 0;
    }

    // Create pages by distributing blocks with batched measurements
    this.pages = await this.distributeBlocksIntoPages(this.originalBlocks);

    this.metrics.paginationTime = performance.now() - startTime;
    console.log(`Pagination completed: ${this.pages.length} pages from ${this.originalBlocks.length} blocks in ${this.metrics.paginationTime.toFixed(2)}ms`);

    return this.pages.length;
  }

  /**
   * Show specific page
   * Contract: display page content safely
   * FIXED: Hide original content, show pagination UI
   */
  showPage(index, { direction = 1, immediate = false } = {}) {
    if (!this.pages || this.pages.length === 0) return;

    const clamped = Math.max(0, Math.min(index, this.pages.length - 1));
    if (clamped === this.currentIndex && !immediate) return;

    // Interrupt current animation if any (allows fast navigation)
    if (this.isAnimating && !immediate) {
      if (this.currentAnimationCleanup) {
        this.currentAnimationCleanup();
        this.currentAnimationCleanup = null;
      }
      this.isAnimating = false;
      // Continue with new page render instead of returning
    }

    const fromIndex = this.currentIndex;
    this.currentIndex = clamped;

    const current = this.activePage;
    const next = (current === this.pageA) ? this.pageB : this.pageA;

    // Build next page DOM
    next.classList.remove("page-enter-animation");
    next.style.transform = `translate3d(${direction > 0 ? 100 : -100}%, 0, 0)`;
    next.innerHTML = "";
    next.appendChild(this._buildPageNode(clamped));

    // Page indicator
    const indicator = document.createElement("div");
    indicator.className = "page-indicator";
    indicator.textContent = `Страница ${clamped + 1} из ${this.pages.length}`;
    next.appendChild(indicator);

    if (immediate) {
      current.style.transform = "translate3d(0,0,0)";
      next.style.transform = "translate3d(0,0,0)";
      this.activePage = next;
      this.announcePageChange(clamped);
      this.scheduleProgressSave();
      return;
    }

    // Animate via transform only
    this.isAnimating = true;

    // Set up animation cleanup function
    this.currentAnimationCleanup = () => {
      // Immediately stop animation and complete transition
      next.removeEventListener("transitionend", onDone);
      current.classList.remove("page-enter-animation");
      next.classList.remove("page-enter-animation");
      current.style.transform = `translate3d(${direction > 0 ? 100 : -100}%, 0, 0)`;
      next.style.transform = "translate3d(0, 0, 0)";
      current.innerHTML = "";
      this.activePage = next;
      this.isAnimating = false;
      this.currentAnimationCleanup = null;
    };

    requestAnimationFrame(() => {
      current.classList.add("page-enter-animation");
      next.classList.add("page-enter-animation");

      // Move current out, next in
      current.style.transform = `translate3d(${direction > 0 ? -100 : 100}%, 0, 0)`;
      next.style.transform = "translate3d(0, 0, 0)";

      const onDone = () => {
        next.removeEventListener("transitionend", onDone);
        // Move old page off-screen
        current.classList.remove("page-enter-animation");
        current.style.transform = `translate3d(${direction > 0 ? 100 : -100}%, 0, 0)`;
        current.innerHTML = "";
        this.activePage = next;
        this.isAnimating = false;
        this.currentAnimationCleanup = null;
        this.announcePageChange(clamped);
        this.scheduleProgressSave();
      };

      next.addEventListener("transitionend", onDone, { once: true });
    });

    console.log(`Page transition: ${fromIndex + 1} -> ${clamped + 1}`);
  }

  /**
   * Build page content node from page data
   */
  _buildPageNode(pageIndex) {
    const data = this.pages[pageIndex];

    // HTML string
    if (typeof data === "string") {
      const wrap = document.createElement("div");
      wrap.className = "pagination-page-content";
      wrap.innerHTML = data;
      return wrap;
    }

    // DOM Node
    if (data && typeof data === "object" && data.nodeType) {
      return data.cloneNode(true);
    }

    // DocumentFragment-like
    if (data && typeof data === "object" && data.cloneNode) {
      return data.cloneNode(true);
    }

    // Fallback
    const empty = document.createElement("div");
    empty.textContent = "";
    return empty;
  }

  /**
   * Unmount pagination system
   */
  unmount() {
    // Disconnect observers
    window.removeEventListener('resize', this._onResize);
    this.intersectionObserver?.disconnect();

    // Clear page elements
    this.pageElements.forEach(el => {
      if (el && el.parentNode) {
        el.remove();
      }
    });
    this.pageElements = [];

    // Show original content
    if (this.readerViewer && this.isContentHidden) {
      const originalContent = this.readerViewer.querySelector('#reading-content');
      if (originalContent) {
        originalContent.style.display = '';
        this.isContentHidden = false;
      }
    }
  }

  /**
   * Get current snap type from CSS
   */
  getCurrentSnapType() {
    if (!this.readerViewer) return 'mandatory';
    const computedStyle = getComputedStyle(this.readerViewer);
    const snapType = computedStyle.scrollSnapType;
    if (snapType.includes('mandatory')) return 'mandatory';
    if (snapType.includes('proximity')) return 'proximity';
    return 'none';
  }

  /**
   * Set snap type (changes UX mode)
   */
  setSnapType(type) {
    if (!this.readerViewer) return;
    this.readerViewer.style.scrollSnapType = `y ${type}`;
  }

  /**
   * Debounce utility for resize handling
   */
  _debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Handle window resize with pagination recalculation
   */
  async _onResize() {
    if (!this.pages || this.pages.length === 0 || this.isRestoring) return;

    // Remember current progress as percentage
    const progress = this.currentIndex / Math.max(1, this.pages.length - 1);

    // Repaginate content (this will update this.pages)
    const contentContainer = document.querySelector('#reading-content');
    if (contentContainer) {
      await this.paginate(contentContainer);

      // Re-render pages stack
      this.renderPagesStack();

      // Restore position based on progress percentage
      const newIndex = Math.min(
        Math.floor(progress * this.pages.length),
        this.pages.length - 1
      );

      this.goToPage(newIndex);
      console.log(`Resize handled: restored to page ${newIndex + 1}/${this.pages.length}`);
    }
  }

  /**
   * Find current reading position for mode synchronization
   */
  findCurrentReadingPosition() {
    if (!this.activePage) return null;

    // Get the first meaningful element on current page
    const content = this.activePage.querySelector('.pagination-page-content');
    if (!content) return null;

    // Find first paragraph or heading
    const firstElement = content.querySelector('p, h1, h2, h3, h4, h5, h6, .reading-paragraph');
    if (!firstElement) return null;

    // Return element identifier (could be id, data-attribute, or text snippet)
    return {
      element: firstElement,
      id: firstElement.id || null,
      text: firstElement.textContent?.substring(0, 100) || '',
      tagName: firstElement.tagName.toLowerCase()
    };
  }

  /**
   * Destroy pagination and restore original layout
   * Contract: cleanup completely
   * FIXED: Deterministic DOM restoration
   */
  destroy() {
    if (!this.isMounted) return;

    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clear any pending resize timeouts
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    // Restore content visibility if it was hidden during pagination
    if (this.isContentHidden && this.rootEl) {
      this.rootEl.style.display = '';
      this.isContentHidden = false;
    }

    // Deterministic restoration: put blocks back in original order
    if (this.originalBlocks && this.originalBlocks.length > 0) {
      // Clear page host first (remove page number indicator)
      this.pageHost.innerHTML = '';

      // Restore blocks to original container in correct order
      this.originalBlocks.forEach(block => {
        if (block.parentNode) {
          block.parentNode.removeChild(block);
        }
        this.rootEl.appendChild(block);
      });

      console.log(`Restored ${this.originalBlocks.length} blocks to original container`);
    }

    // Remove pagination DOM using stored references
    if (this.paginationWrapper && this.paginationWrapper.parentNode) {
      this.paginationWrapper.parentNode.removeChild(this.paginationWrapper);
    }

    // Restore placeholder position
    if (this.placeholder && this.placeholder.parentNode) {
      // Placeholder cleanup - it's no longer needed
      this.placeholder.parentNode.removeChild(this.placeholder);
    }

    // Clean up accessibility elements
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }

    // Clear references
    this.paginationWrapper = null;
    this.pageHost = null;
    this.navContainer = null;
    this.liveRegion = null;
    this.originalBlocks = null;
    this.placeholder = null;

    this.isMounted = false;
    console.log('PaginationEngine destroyed with deterministic restoration');
  }

  /**
   * Announce page change to screen readers
   */
  announcePageChange(pageIndex) {
    if (this.liveRegion) {
      const pageNumber = pageIndex + 1;
      const totalPages = this.pages.length;
      const announcement = `Page ${pageNumber} of ${totalPages}`;

      // Clear and set new announcement
      this.liveRegion.textContent = '';
      setTimeout(() => {
        this.liveRegion.textContent = announcement;
      }, 100);
    }
  }

  /**
   * Setup keyboard navigation for accessibility
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Only handle when pagination is active and not in form inputs
      if (!this.isMounted ||
          e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.contentEditable === 'true') {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          this.prevPage();
          break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ': // Spacebar
          e.preventDefault();
          this.nextPage();
          break;
        case 'Home':
          e.preventDefault();
          this.showPage(0);
          break;
        case 'End':
          e.preventDefault();
          this.showPage(this.pages.length - 1);
          break;
      }
    });
  }

  // ===== PRIVATE METHODS =====

  collectContentBlocks(contentContainer) {
    // FIXED: Recursively collect content blocks to handle nested containers
    // Don't break lists (li) or containers (ul/ol) - treat them as atomic units
    const collectBlocks = (container) => {
      const blocks = [];

      for (const child of container.children) {
        const tag = child.tagName.toLowerCase();
        const className = child.className || '';

        // Check if this is a content block
        const isContentBlock = ['p', 'ul', 'ol', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag) ||
                              className.includes('image-container') ||
                              className.includes('fact') ||
                              child.style?.backgroundColor; // Styled blocks

        // Check if this is a wrapper container that should be traversed
        const isWrapperContainer = ['div', 'section', 'article'].includes(tag) &&
                                  !className.includes('pagination') &&
                                  !className.includes('page') &&
                                  !child.id?.includes('pagination');

        if (isContentBlock) {
          blocks.push(child);
        } else if (isWrapperContainer && child.children.length > 0) {
          // Recursively collect from wrapper containers
          blocks.push(...collectBlocks(child));
        }
        // Skip non-content, non-wrapper elements
      }

      return blocks;
    };

    const contentBlocks = collectBlocks(contentContainer);
    console.log(`Collected ${contentBlocks.length} atomic content blocks from recursive search`);
    return contentBlocks;
  }

  /**
   * Try to fragment a block if it doesn't fit entirely on the page
   * FIXED: Address orphans/widows by allowing text fragmentation within paragraphs
   */
  tryFragmentBlock(block, availableHeight) {
    const blockHeight = this.measureBlockHeight(block);

    // If block fits entirely, return it as-is
    if (blockHeight <= availableHeight) {
      return { fragments: [block], remainingHeight: availableHeight - blockHeight };
    }

    // Only fragment paragraphs (for now) - preserve structure for other elements
    const tag = block.tagName.toLowerCase();
    if (tag !== 'p' || !block.textContent || block.textContent.trim().length === 0) {
      return { fragments: [], remainingHeight: availableHeight }; // Block doesn't fit, skip it
    }

    // Try to split paragraph into fragments that fit
    const fragments = this.splitParagraphIntoFragments(block, availableHeight);

    if (fragments.length === 0) {
      return { fragments: [], remainingHeight: availableHeight }; // Couldn't split
    }

    return {
      fragments: fragments,
      remainingHeight: 0 // Used all available height
    };
  }

  /**
   * Split a paragraph into fragments that fit within available height
   */
  splitParagraphIntoFragments(paragraph, availableHeight) {
    const fragments = [];
    const text = paragraph.textContent;
    const words = text.split(/\s+/);

    // Binary search to find how many words fit
    let low = 0;
    let high = words.length;
    let bestFit = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const testText = words.slice(0, mid).join(' ');

      if (this.measureTextHeight(testText, paragraph) <= availableHeight) {
        bestFit = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (bestFit === 0) return []; // Can't fit even one word

    // Create first fragment
    const firstText = words.slice(0, bestFit).join(' ');
    const firstFragment = paragraph.cloneNode(false); // Clone without children
    firstFragment.textContent = firstText;
    fragments.push(firstFragment);

    // Create remaining fragment if there's text left
    if (bestFit < words.length) {
      const remainingText = words.slice(bestFit).join(' ');
      const remainingFragment = paragraph.cloneNode(false);
      remainingFragment.textContent = remainingText;

      // Store remaining fragment for next page (this is simplified)
      // In real implementation, we'd need to track remaining content
      this.pendingFragments = this.pendingFragments || [];
      this.pendingFragments.push(remainingFragment);
    }

    return fragments;
  }

  /**
   * Measure height of text with same styling as element
   */
  measureTextHeight(text, element) {
    const measureElement = document.createElement('div');
    measureElement.style.cssText = `
      position: absolute;
      visibility: hidden;
      width: ${this.pageHost.offsetWidth || 800}px;
      font-size: var(--fs-body, 16px);
      line-height: var(--line-height-relaxed, 1.6);
      padding: var(--space-6, 24px);
      box-sizing: border-box;
      font-family: inherit;
    `;

    measureElement.textContent = text;
    document.body.appendChild(measureElement);
    const height = measureElement.offsetHeight;
    document.body.removeChild(measureElement);

    return height;
  }

  async distributeBlocksIntoPages(blocks) {
    const pages = [];
    let currentPageBlocks = [];
    let currentHeight = 0;
    const maxHeight = this.options.pageHeight;

    // Initialize pending fragments array
    this.pendingFragments = this.pendingFragments || [];

    // Process blocks with fragmentation support
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockHeight = await this.measureBlockHeightAsync(block);

      // Check if block fits entirely
      if (currentHeight + blockHeight <= maxHeight) {
        currentPageBlocks.push(block);
        currentHeight += blockHeight;
      } else {
        // Block doesn't fit - try to fragment it
        const availableHeight = maxHeight - currentHeight;

        if (availableHeight > 30) { // Only fragment if we have meaningful space (>30px)
          const result = await this.tryFragmentBlockAsync(block, availableHeight);

          if (result.fragments.length > 0) {
            // Add fragments to current page
            currentPageBlocks.push(...result.fragments);

            // If we used all available height, start new page
            if (result.remainingHeight === 0) {
              pages.push(currentPageBlocks);
              currentPageBlocks = [];
              currentHeight = 0;
            } else {
              currentHeight = maxHeight - result.remainingHeight;
            }
          } else {
            // Couldn't fragment - start new page if current has content
            if (currentPageBlocks.length > 0) {
              pages.push(currentPageBlocks);
              currentPageBlocks = [];
              currentHeight = 0;
            }

            // Try to fit block on next page
            if (blockHeight <= maxHeight) {
              currentPageBlocks.push(block);
              currentHeight += blockHeight;
            } else {
              // Block is too big even for empty page - skip it (shouldn't happen with paragraphs)
              console.warn('Block too large for page, skipping:', block);
            }
          }
        } else {
          // Not enough space for meaningful fragment - start new page
          if (currentPageBlocks.length > 0) {
            pages.push(currentPageBlocks);
            currentPageBlocks = [];
            currentHeight = 0;
          }

          // Add block to new page
          currentPageBlocks.push(block);
          currentHeight += blockHeight;
        }
      }

      // Check if page is full
      if (currentHeight >= maxHeight * 0.95) { // 95% full threshold
        pages.push(currentPageBlocks);
        currentPageBlocks = [];
        currentHeight = 0;
      }
    }

    // Add remaining blocks
    if (currentPageBlocks.length > 0) {
      pages.push(currentPageBlocks);
    }

    // Handle any pending fragments (simplified - just add to last page)
    if (this.pendingFragments && this.pendingFragments.length > 0) {
      if (pages.length === 0) {
        pages.push([]);
      }
      pages[pages.length - 1].push(...this.pendingFragments);
      this.pendingFragments = [];
    }

    return pages;
  }

  /**
   * Async version of tryFragmentBlock using requestAnimationFrame
   */
  async tryFragmentBlockAsync(block, availableHeight) {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const result = this.tryFragmentBlock(block, availableHeight);
        resolve(result);
      });
    });
  }

  /**
   * Async version of measureBlockHeight
   */
  async measureBlockHeightAsync(block) {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const height = this.measureBlockHeight(block);
        resolve(height);
      });
    });
  }

  /**
   * Batch measure multiple blocks to avoid layout thrashing
   * Uses fastdom-like approach with read/write separation
   */
  async batchMeasureBlocks(blocks) {
    const measurements = new Array(blocks.length);

    // Process in chunks to avoid blocking the main thread
    const chunkSize = 10;
    for (let i = 0; i < blocks.length; i += chunkSize) {
      const chunk = blocks.slice(i, i + chunkSize);

      // Measure chunk in one batch
      await this.measureBlocksChunk(chunk, measurements, i);

      // Yield control to browser between chunks
      if (i + chunkSize < blocks.length) {
        await this.yieldToBrowser();
      }
    }

    return measurements;
  }

  /**
   * Measure a chunk of blocks in one DOM operation
   */
  async measureBlocksChunk(blocks, results, offset) {
    return new Promise((resolve) => {
      // Use requestAnimationFrame to ensure DOM is ready for measurement
      requestAnimationFrame(() => {
        const measureContainer = this.createMeasureContainer();

        // Clone and append all blocks in one operation
        const clones = blocks.map(block => block.cloneNode(true));
        clones.forEach(clone => measureContainer.appendChild(clone));

        // Force layout calculation
        measureContainer.offsetHeight;

        // Read measurements in one pass
        clones.forEach((clone, index) => {
          results[offset + index] = clone.offsetHeight;
        });

        // Cleanup
        if (measureContainer.parentNode) {
          measureContainer.parentNode.removeChild(measureContainer);
        }

        resolve();
      });
    });
  }

  /**
   * Create measurement container with proper styles
   */
  createMeasureContainer() {
    const measureContainer = document.createElement('div');
    measureContainer.style.cssText = `
      position: absolute;
      visibility: hidden;
      top: -9999px;
      left: -9999px;
      width: ${this.pageHost ? this.pageHost.offsetWidth : 800}px;
      max-width: var(--reader-max-width, 800px);
      font-size: var(--fs-body, 16px);
      line-height: var(--line-height-relaxed, 1.6);
      padding: var(--space-6, 24px);
      box-sizing: border-box;
      font-family: inherit;
    `;

    document.body.appendChild(measureContainer);
    return measureContainer;
  }

  /**
   * Yield control to browser to prevent blocking
   */
  yieldToBrowser() {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 0);
      });
    });
  }

  /**
   * Check if element already has interactive words processed
   */
  hasInteractiveWordsProcessed(element) {
    // Check if element or its children already have interactive word spans
    return element.querySelector('.interactive-word') !== null;
  }

  /**
   * Safely clean existing interactive words to prevent duplication
   */
  cleanInteractiveWords(element) {
    const interactiveWords = element.querySelectorAll('.interactive-word');
    interactiveWords.forEach(word => {
      const textNode = document.createTextNode(word.textContent);
      word.parentNode.replaceChild(textNode, word);
    });
  }

  /**
   * Add visual page number indicator at bottom of page
   * FIXED: Visual boundary indicator for page navigation
   */
  addPageNumberIndicator(pageIndex) {
    // Remove existing indicator if any
    const existingIndicator = this.pageHost.querySelector('.page-number-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Create page number indicator
    const indicator = document.createElement('div');
    indicator.className = 'page-number-indicator';
    indicator.textContent = `Page ${pageIndex + 1} of ${this.pages.length}`;
    indicator.style.cssText = `
      position: absolute;
      bottom: 0.5rem;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      pointer-events: none;
      z-index: 10;
    `;

    this.pageHost.appendChild(indicator);
  }

  /**
   * Add page transition animation for smooth navigation
   */
  addPageTransitionAnimation(pageIndex) {
    // Remove existing animation classes
    this.pageHost.classList.remove('page-enter-right', 'page-enter-left');

    // Add appropriate animation based on navigation direction
    if (this.lastPageIndex !== undefined) {
      if (pageIndex > this.lastPageIndex) {
        this.pageHost.classList.add('page-enter-right');
      } else if (pageIndex < this.lastPageIndex) {
        this.pageHost.classList.add('page-enter-left');
      }
    }

    this.lastPageIndex = pageIndex;

    // Remove animation class after animation completes
    setTimeout(() => {
      this.pageHost.classList.remove('page-enter-right', 'page-enter-left');
    }, 250);
  }

  /**
   * Search across all book content (works in pagination mode)
   * FIXED: Custom search that finds text across all pages, not just visible DOM
   */
  searchBook(query, caseSensitive = false) {
    if (!query || query.trim().length === 0) return [];

    const results = [];
    const searchTerm = caseSensitive ? query : query.toLowerCase();

    // Search through all original blocks
    this.originalBlocks.forEach((block, blockIndex) => {
      const text = block.textContent || '';
      const searchText = caseSensitive ? text : text.toLowerCase();

      let startIndex = 0;
      let index;

      while ((index = searchText.indexOf(searchTerm, startIndex)) !== -1) {
        // Find which page contains this block
        const pageIndex = this.findPageForBlock(block);

        results.push({
          pageIndex,
          blockIndex,
          textOffset: index,
          matchText: text.substr(index, searchTerm.length),
          context: this.getSearchContext(text, index, searchTerm.length)
        });

        startIndex = index + 1;
      }
    });

    console.log(`Search "${query}" found ${results.length} matches across ${this.pages.length} pages`);
    return results;
  }

  /**
   * Navigate to search result
   */
  goToSearchResult(result) {
    if (!result || typeof result.pageIndex !== 'number') return false;

    this.showPage(result.pageIndex);

    // Try to highlight the found text (basic implementation)
    setTimeout(() => {
      this.highlightSearchResult(result);
    }, 100);

    return true;
  }

  /**
   * Highlight search result on current page
   */
  highlightSearchResult(result) {
    // Remove existing highlights
    const existingHighlights = this.pageHost.querySelectorAll('.search-highlight');
    existingHighlights.forEach(el => {
      const textNode = document.createTextNode(el.textContent);
      el.parentNode.replaceChild(textNode, el);
    });

    // Find and highlight the text
    const walker = document.createTreeWalker(
      this.pageHost,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    let textOffset = 0;

    while (node = walker.nextNode()) {
      const nodeText = node.textContent;
      const nodeLength = nodeText.length;

      if (textOffset <= result.textOffset && result.textOffset < textOffset + nodeLength) {
        // Found the node containing the search result
        const localOffset = result.textOffset - textOffset;
        const beforeText = nodeText.substring(0, localOffset);
        const matchText = nodeText.substring(localOffset, localOffset + result.matchText.length);
        const afterText = nodeText.substring(localOffset + result.matchText.length);

        // Create highlight element
        const fragment = document.createDocumentFragment();
        if (beforeText) fragment.appendChild(document.createTextNode(beforeText));

        const highlight = document.createElement('mark');
        highlight.className = 'search-highlight';
        highlight.textContent = matchText;
        highlight.style.cssText = 'background-color: #ffeb3b; padding: 2px 0;';
        fragment.appendChild(highlight);

        if (afterText) fragment.appendChild(document.createTextNode(afterText));

        node.parentNode.replaceChild(fragment, node);
        break;
      }

      textOffset += nodeLength;
    }
  }

  /**
   * Get context around search match
   */
  getSearchContext(fullText, matchStart, matchLength, contextLength = 50) {
    const start = Math.max(0, matchStart - contextLength);
    const end = Math.min(fullText.length, matchStart + matchLength + contextLength);
    return fullText.substring(start, end);
  }

  /**
   * Find which page contains a specific block
   */
  findPageForBlock(targetBlock) {
    for (let pageIndex = 0; pageIndex < this.pages.length; pageIndex++) {
      const pageBlocks = this.pages[pageIndex];
      if (pageBlocks.includes(targetBlock)) {
        return pageIndex;
      }
    }
    return 0;
  }

  /**
   * Setup scroll event interception to convert scroll into page navigation
   * FIXED: Convert mouse wheel/touch scroll into page flipping
   * Supports: mouse wheel, horizontal swipes, vertical swipes
   */
  setupScrollInterception() {
    // Intercept wheel events (mouse scroll)
    this.pageHost.addEventListener('wheel', (e) => {
      e.preventDefault(); // Block native scrolling
      e.stopPropagation();

      const deltaY = e.deltaY;
      if (Math.abs(deltaY) < 10) return; // Ignore tiny movements

      if (deltaY > 0) {
        this.nextPage();
      } else {
        this.prevPage();
      }
    }, { passive: false });

    // Intercept touch events (mobile swipe) - FIXED: Support horizontal and vertical swipes
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    this.pageHost.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    this.pageHost.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchDuration = Date.now() - touchStartTime;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Determine swipe direction and strength
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Only intercept quick swipes (not slow drags)
      if (touchDuration < 500) { // Increased from 300ms for better UX
        // Horizontal swipe (stronger than vertical)
        if (absDeltaX > absDeltaY && absDeltaX > 50) {
          e.preventDefault();
          if (deltaX < 0) {
            this.nextPage(); // Swipe left -> Next page
          } else {
            this.prevPage(); // Swipe right -> Previous page
          }
        }
        // Vertical swipe (fallback for book-like navigation)
        else if (absDeltaY > absDeltaX && absDeltaY > 50) {
          e.preventDefault();
          if (deltaY < 0) {
            this.nextPage(); // Swipe up -> Next page
          } else {
            this.prevPage(); // Swipe down -> Previous page
          }
        }
      }
    }, { passive: false });

    console.log('Scroll interception setup: wheel and touch events');
  }

  /**
   * Setup keyboard shortcuts (Ctrl+F for search)
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+F or Cmd+F - intercept browser search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        this.showSearchDialog();
      }

      // Escape - hide search
      if (e.key === 'Escape') {
        this.hideSearchDialog();
      }
    });
  }

  /**
   * Show custom search dialog
   */
  showSearchDialog() {
    // Remove existing dialog
    this.hideSearchDialog();

    const dialog = document.createElement('div');
    dialog.className = 'pagination-search-dialog';
    dialog.innerHTML = `
      <div class="search-overlay" style="
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); z-index: 10000; display: flex;
        align-items: center; justify-content: center;">
        <div class="search-box" style="
          background: white; padding: 20px; border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3); min-width: 400px;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Search in Book</h3>
          <input type="text" id="search-input" placeholder="Enter search term..."
                 style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <div style="margin-top: 10px; text-align: right;">
            <button id="search-prev" style="margin-right: 5px;">Previous</button>
            <button id="search-next">Next</button>
            <button id="search-close" style="margin-left: 10px;">Close</button>
          </div>
          <div id="search-results" style="margin-top: 10px; font-size: 14px; color: #666;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
    this.searchDialog = dialog;

    // Focus input
    const input = dialog.querySelector('#search-input');
    input.focus();

    // Setup event handlers
    this.setupSearchDialogEvents();

    console.log('Search dialog shown');
  }

  /**
   * Hide search dialog
   */
  hideSearchDialog() {
    if (this.searchDialog) {
      document.body.removeChild(this.searchDialog);
      this.searchDialog = null;
    }
    this.currentSearchResults = null;
    this.currentSearchIndex = -1;
  }

  /**
   * Setup search dialog event handlers
   */
  setupSearchDialogEvents() {
    const input = this.searchDialog.querySelector('#search-input');
    const nextBtn = this.searchDialog.querySelector('#search-next');
    const prevBtn = this.searchDialog.querySelector('#search-prev');
    const closeBtn = this.searchDialog.querySelector('#search-close');
    const resultsDiv = this.searchDialog.querySelector('#search-results');

    let searchTimeout;

    input.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = input.value.trim();
        if (query.length > 0) {
          this.currentSearchResults = this.searchBook(query);
          this.currentSearchIndex = this.currentSearchResults.length > 0 ? 0 : -1;
          this.updateSearchResults(resultsDiv);
          if (this.currentSearchResults.length > 0) {
            this.goToSearchResult(this.currentSearchResults[0]);
          }
        } else {
          this.currentSearchResults = null;
          this.currentSearchIndex = -1;
          resultsDiv.textContent = '';
        }
      }, 300);
    });

    nextBtn.addEventListener('click', () => {
      if (this.currentSearchResults && this.currentSearchResults.length > 0) {
        this.currentSearchIndex = (this.currentSearchIndex + 1) % this.currentSearchResults.length;
        this.goToSearchResult(this.currentSearchResults[this.currentSearchIndex]);
        this.updateSearchResults(resultsDiv);
      }
    });

    prevBtn.addEventListener('click', () => {
      if (this.currentSearchResults && this.currentSearchResults.length > 0) {
        this.currentSearchIndex = this.currentSearchIndex <= 0 ?
          this.currentSearchResults.length - 1 : this.currentSearchIndex - 1;
        this.goToSearchResult(this.currentSearchResults[this.currentSearchIndex]);
        this.updateSearchResults(resultsDiv);
      }
    });

    closeBtn.addEventListener('click', () => this.hideSearchDialog());

    // Close on overlay click
    this.searchDialog.querySelector('.search-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hideSearchDialog();
      }
    });
  }

  /**
   * Update search results display
   */
  updateSearchResults(resultsDiv) {
    if (!this.currentSearchResults) {
      resultsDiv.textContent = '';
      return;
    }

    const total = this.currentSearchResults.length;
    const current = this.currentSearchIndex + 1;

    resultsDiv.textContent = `${current} of ${total} matches`;
  }

  /**
   * Setup scroll event interception to convert scroll into page navigation
   * FIXED: Convert mouse wheel/touch scroll into page flipping
   * Supports: mouse wheel, horizontal swipes, vertical swipes
   */
  setupResizeObserver() {
    if (!window.ResizeObserver) {
      console.warn('ResizeObserver not supported, resize handling disabled');
      return;
    }

    // Track last known dimensions to detect micro-changes and prevent loops
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.resizeInProgress = false;
    this.resizeStabilityCounter = 0;

    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;

      // Filter out micro-changes (< 1px) to prevent jitter from rounding errors
      const widthChanged = Math.abs(width - this.lastWidth) >= 1;
      const heightChanged = Math.abs(height - this.lastHeight) >= 1;

      if (!widthChanged && !heightChanged) {
        // Reset stability counter when dimensions stabilize
        this.resizeStabilityCounter++;
        return;
      }

      // Prevent recursive calls during pagination recalculation
      if (this.resizeInProgress) {
        console.log('ResizeObserver: Ignoring recursive resize during pagination recalculation');
        this.resizeStabilityCounter = 0;
        return;
      }

      // Reset stability counter on actual changes
      this.resizeStabilityCounter = 0;

      // Clear existing timeout
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }

      // Longer debounce to ensure resize is complete and prevent loops
      this.resizeTimeout = setTimeout(() => {
        // Double-check dimensions haven't changed during debounce
        const currentRect = this.rootEl.getBoundingClientRect();
        if (Math.abs(currentRect.width - width) < 1 && Math.abs(currentRect.height - height) < 1) {
          this.handleResizeSafely(width, height);
        }
      }, 750); // Increased from 250ms to 750ms for stability
    });

    // Observe the root container
    this.resizeObserver.observe(this.rootEl);
    console.log('ResizeObserver setup with loop prevention and micro-change filtering');
  }

  /**
   * Handle container resize safely - prevent infinite loops
   * FIXED: Stabilization and loop prevention
   */
  async handleResizeSafely(newWidth, newHeight) {
    if (!this.isMounted || this.resizeInProgress) return;

    this.resizeInProgress = true;

    try {
      console.log(`Container resized to ${newWidth}x${newHeight}, recalculating pagination...`);

      const oldPageHeight = this.options.pageHeight;
      const newPageHeight = this.calculateOptimalPageHeight();

      // Update tracked dimensions
      this.lastWidth = newWidth;
      this.lastHeight = newHeight;

      // Only recalculate if height changed significantly (> 10px)
      if (Math.abs(newPageHeight - oldPageHeight) < 10) {
        console.log('Height change too small, skipping recalculation');
        return;
      }

      this.options.pageHeight = newPageHeight;

      // Remember current position by anchor index
      const currentAnchorIndex = this.findCurrentAnchorIndex();

      // Recalculate pagination with stability check
      const newPages = await this.distributeBlocksIntoPages(this.originalBlocks);

      // Verify that pagination is stable (doesn't immediately cause another resize)
      await this.verifyPaginationStability();

      this.pages = newPages;

      // Find which page contains the anchor
      const newPageIndex = this.findPageForAnchor(currentAnchorIndex);

      console.log(`Pagination recalculated: ${newPages.length} pages, anchor ${currentAnchorIndex} -> page ${newPageIndex}`);

      // Show the appropriate page
      this.showPage(Math.min(newPageIndex, newPages.length - 1));

    } catch (error) {
      console.error('Failed to handle resize:', error);
    } finally {
      // Reset flag after a delay to prevent immediate re-triggering
      setTimeout(() => {
        this.resizeInProgress = false;
      }, 100);
    }
  }

  /**
   * Verify pagination stability to prevent infinite loops
   */
  async verifyPaginationStability() {
    return new Promise((resolve) => {
      // Wait one frame to see if resize triggers again
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!this.resizeInProgress) {
            resolve();
          } else {
            console.warn('Pagination stability check failed - possible loop');
            resolve(); // Continue anyway to avoid hanging
          }
        }, 50);
      });
    });
  }

  /**
   * Find current anchor index for repositioning
   */
  findCurrentAnchorIndex() {
    if (this.pages.length === 0 || this.currentPage >= this.pages.length) {
      return 0;
    }

    const currentPageBlocks = this.pages[this.currentPage];
    const firstBlock = currentPageBlocks[0];
    return firstBlock ? this.originalBlocks.indexOf(firstBlock) : 0;
  }

  /**
   * Legacy single block measurement (for compatibility)
   */
  measureBlockHeight(block) {
    // Create measuring container with same constraints as reader
    const measureContainer = this.createMeasureContainer();

    const clone = block.cloneNode(true);
    measureContainer.appendChild(clone);

    const height = measureContainer.offsetHeight;

    // Cleanup
    if (measureContainer.parentNode) {
      measureContainer.parentNode.removeChild(measureContainer);
    }

    return height;
  }

  calculateOptimalPageHeight() {
    const viewportHeight = window.innerHeight;
    const headerHeight = 120; // header + mode switcher
    const navHeight = 80; // pagination nav
    const margins = 80; // various margins/padding

    return Math.max(400, viewportHeight - headerHeight - navHeight - margins);
  }

  attachNavigationEvents() {
    const prevBtn = this.navContainer.querySelector('.pagination-prev');
    const nextBtn = this.navContainer.querySelector('.pagination-next');

    prevBtn.addEventListener('click', () => this.prevPage());
    nextBtn.addEventListener('click', () => this.nextPage());
  }

  updateNavigation() {
    const prevBtn = this.navContainer.querySelector('.pagination-prev');
    const nextBtn = this.navContainer.querySelector('.pagination-next');
    const info = this.navContainer.querySelector('.pagination-info');

    prevBtn.disabled = this.currentPage === 0;
    nextBtn.disabled = this.currentPage === this.pages.length - 1;
    info.textContent = `Page ${this.currentPage + 1} of ${this.pages.length}`;
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.showPage(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.pages.length - 1) {
      this.showPage(this.currentPage + 1);
    }
  }

  reinitializePageInteractions() {
    // FIXED: No TreeWalker calls - rely on existing interactive words
    // Since interactive words are already created in scroll mode and we're just moving DOM nodes,
    // we don't need to re-run TreeWalker. Event delegation on document.body handles clicks.

    setTimeout(() => {
      const wordCount = this.pageHost.querySelectorAll('.interactive-word').length;
      console.log(`Page ${this.currentPage} has ${wordCount} interactive words (moved from scroll mode)`);

      if (wordCount === 0) {
        console.warn('No interactive words found on page - TreeWalker may need to be run');
        // As fallback, could call makeElementInteractive, but this should be avoided
      }
    }, 100);
  }

  findContentContainer() {
    // Find the original content container
    return this.rootEl.querySelector('#reading-content, .book-content, .reader-text');
  }

  /**
   * Set book ID for progress tracking
   */
  setBookId(bookId) {
    this.bookId = bookId;
  }

  /**
   * Schedule progress save with throttling
   */
  scheduleProgressSave() {
    if (!this.bookId) return;

    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Throttle saves to once per second max
    this.saveTimeout = setTimeout(() => {
      this.saveProgress();
    }, 1000);
  }

  /**
   * Save current reading progress
   * FIXED: Anchor-based progress instead of pageIndex
   */
  async saveProgress() {
    if (!this.bookId || this.pages.length === 0) return;

    // Create anchor: last block of current page + its position in original content
    // This gives better progress indication than first block
    const currentPageBlocks = this.pages[this.currentIndex];
    const lastBlock = currentPageBlocks?.[currentPageBlocks.length - 1];
    const anchorIndex = lastBlock ? this.originalBlocks.indexOf(lastBlock) : 0;

    const progress = {
      mode: 'snap', // Unified mode for scroll-snap pagination
      snapType: this.getCurrentSnapType(), // mandatory/proximity/none
      anchorIndex: anchorIndex, // Position of first block in original content
      totalBlocks: this.originalBlocks.length,
      timestamp: Date.now()
    };

    // Avoid saving identical progress
    const progressKey = JSON.stringify(progress);
    if (this.lastSavedProgress === progressKey) {
      return;
    }
    this.lastSavedProgress = progressKey;

    try {
      const { bookService } = await import('../services/book-service.js');
      await bookService.saveReadingProgress(this.bookId, progress);
      console.log(`Progress saved: anchor block ${anchorIndex} of ${this.originalBlocks.length}`);
    } catch (error) {
      console.warn('Failed to save reading progress:', error);
    }
  }

  /**
   * Load and restore reading progress
   * FIXED: Anchor-based restoration
   */
  async loadProgress() {
    if (!this.bookId) return 0;

    this.isRestoring = true; // 🔧 Флаг включить

    try {
      const { bookService } = await import('../services/book-service.js');
      const progress = await bookService.getReadingProgress(this.bookId);

      if (progress && (progress.mode === 'pages' || progress.mode === 'scroll' || progress.mode === 'snap') && typeof progress.anchorIndex === 'number') {
        // Find which page contains the anchor block
        const targetPageIndex = this.findPageForAnchor(progress.anchorIndex);
        const safePageIndex = Math.min(targetPageIndex, Math.max(0, this.pages.length - 1));

        // Restore snap type if available
        if (progress.snapType && progress.mode === 'snap') {
          this.setSnapType(progress.snapType);
        }

        console.log(`Progress loaded: anchor ${progress.anchorIndex} -> page ${safePageIndex + 1}, mode: ${progress.mode}`);
        return safePageIndex;
      }
    } catch (error) {
      console.warn('Failed to load reading progress:', error);
    } finally {
      // 🔧 Выключить флаг через 1 сек
      setTimeout(() => {
        this.isRestoring = false;
      }, 1000);
    }

    return 0; // Default to first page
  }

  /**
   * Find page index for a given anchor block index
   */
  findPageForAnchor(anchorIndex) {
    for (let pageIndex = 0; pageIndex < this.pages.length; pageIndex++) {
      const pageBlocks = this.pages[pageIndex];
      const firstBlock = pageBlocks[0];
      const lastBlock = pageBlocks[pageBlocks.length - 1];
      const firstBlockIndex = this.originalBlocks.indexOf(firstBlock);
      const lastBlockIndex = this.originalBlocks.indexOf(lastBlock);

      // Check if anchorIndex falls within this page's block range
      if (firstBlockIndex <= anchorIndex && anchorIndex <= lastBlockIndex) {
        return pageIndex;
      }
    }

    return 0; // Default to first page
  }

  /**
   * Setup automatic progress saving on visibility changes
   */
  setupAutoSave() {
    // Save progress when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveProgressImmediately();
      }
    });

    // Save progress before page unload
    window.addEventListener('beforeunload', () => {
      this.saveProgressImmediately();
    });

    console.log('Auto-save setup completed');
  }

  /**
   * Save progress immediately (for critical moments)
   */
  async saveProgressImmediately() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    await this.saveProgress();
  }

  // Performance metrics
  getMetrics() {
    return { ...this.metrics };
  }
}
