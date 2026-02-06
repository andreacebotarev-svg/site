/**
 * ScrollModeAdapter - Continuous scroll rendering mode
 *
 * Implements IRenderMode for continuous text flow reading.
 * Features:
 * - Single continuous scroll through content
 * - Anchor-based navigation (paragraphs/headings as navigation points)
 * - IntersectionObserver for progress tracking
 * - Smooth scrolling between anchors
 */

import { IRenderMode, LocatorFormats } from './IRenderMode.js';
import { logger } from '../../utils/logger.js';

const scrollLogger = logger.createChild('ScrollMode');

export class ScrollModeAdapter extends IRenderMode {
  constructor(options = {}) {
    super();
    this.logger = options.logger || scrollLogger;
    this.container = null;
    this.content = null;

    // Anchors and navigation
    this.anchors = []; // Array of { id, element, locator }
    this.currentAnchorIndex = 0;
    this.intersectionObserver = null;

    // Progress tracking
    this.progressDebounceTimer = null;
    this.lastSavedLocator = null;

    // Configuration
    this.config = {
      anchorSelector: 'p, h1, h2, h3, h4, h5, h6, .chapter-title',
      progressDebounceMs: 500,
      scrollBehavior: 'smooth',
      scrollOffset: 100, // px from top when scrolling to anchor
      ...options
    };

    this.logger.info('ScrollModeAdapter initialized', this.config);
  }

  /**
   * Mount the scroll mode into container
   */
  async mount(container, options = {}) {
    this.container = container;
    this.logger.info('ScrollModeAdapter mounted');
  }

  /**
   * Render content in continuous scroll mode
   */
  async render(content, initialState, options = {}) {
    if (!this.container) {
      throw new Error('ScrollModeAdapter: not mounted');
    }

    this.content = content;
    this.logger.info('Rendering scroll mode', {
      paragraphs: content.paragraphs?.length || 0,
      chapters: content.chapters?.length || 0
    });

    // Clear existing content
    this.container.innerHTML = '';

    // Create scrollable content wrapper
    const scrollWrapper = document.createElement('div');
    scrollWrapper.className = 'scroll-mode-content';
    scrollWrapper.style.cssText = `
      height: 100%;
      overflow-y: auto;
      padding: 20px;
      line-height: 1.6;
    `;

    // Render content as continuous flow
    await this._renderContent(scrollWrapper, content);

    // Setup anchors and navigation
    await this._setupAnchors(scrollWrapper);
    this._setupIntersectionObserver();

    this.container.appendChild(scrollWrapper);

    // Navigate to initial position
    if (initialState && initialState.anchorId) {
      await this.goTo(initialState, { instant: true });
    } else {
      // Default to top
      scrollWrapper.scrollTop = 0;
    }

    this.logger.info('Scroll mode rendered successfully');
  }

  /**
   * Render content as continuous HTML flow
   */
  async _renderContent(container, content) {
    // Handle different content formats
    if (content.chapters && Array.isArray(content.chapters)) {
      // Render by chapters
      for (let chapterIndex = 0; chapterIndex < content.chapters.length; chapterIndex++) {
        const chapter = content.chapters[chapterIndex];

        // Chapter title
        if (chapter.title) {
          const titleEl = document.createElement('h2');
          titleEl.className = 'chapter-title';
          titleEl.id = `chapter-${chapterIndex}`;
          titleEl.textContent = chapter.title;
          container.appendChild(titleEl);
        }

        // Chapter content
        if (chapter.paragraphs && Array.isArray(chapter.paragraphs)) {
          for (let paraIndex = 0; paraIndex < chapter.paragraphs.length; paraIndex++) {
            const paragraph = chapter.paragraphs[paraIndex];
            const paraEl = document.createElement('p');
            paraEl.id = `ch${chapterIndex}-p${paraIndex}`;
            paraEl.innerHTML = paragraph.content || paragraph;
            container.appendChild(paraEl);
          }
        }
      }
    } else if (content.paragraphs && Array.isArray(content.paragraphs)) {
      // Render flat paragraph list
      content.paragraphs.forEach((paragraph, index) => {
        const paraEl = document.createElement('p');
        paraEl.id = `para-${index}`;
        paraEl.innerHTML = paragraph.content || paragraph;
        container.appendChild(paraEl);
      });
    }
  }

  /**
   * Setup navigation anchors
   */
  async _setupAnchors(container) {
    this.anchors = [];

    // Find all anchor elements
    const anchorElements = container.querySelectorAll(this.config.anchorSelector);

    anchorElements.forEach((element, index) => {
      const locator = this._elementToLocator(element);

      this.anchors.push({
        id: element.id || `anchor-${index}`,
        element,
        locator,
        index
      });

      // Mark as anchor for styling
      element.classList.add('scroll-anchor');
    });

    this.logger.info(`Setup ${this.anchors.length} navigation anchors`);
  }

  /**
   * Setup intersection observer for progress tracking
   */
  _setupIntersectionObserver() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        // Find the most visible anchor
        let maxVisible = 0;
        let currentAnchor = null;

        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > maxVisible) {
            maxVisible = entry.intersectionRatio;
            currentAnchor = entry.target;
          }
        });

        if (currentAnchor) {
          const anchor = this.anchors.find(a => a.element === currentAnchor);
          if (anchor) {
            this.currentAnchorIndex = anchor.index;
            this._debounceSaveProgress(anchor.locator);
          }
        }
      },
      {
        root: this.container.querySelector('.scroll-mode-content'),
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: '-50px 0px -50px 0px'
      }
    );

    // Observe all anchors
    this.anchors.forEach(anchor => {
      this.intersectionObserver.observe(anchor.element);
    });
  }

  /**
   * Convert DOM element to locator
   */
  _elementToLocator(element) {
    const id = element.id;

    if (!id) return { anchorId: 'unknown', offset: 0 };

    // Parse chapter and paragraph from ID
    const chapterMatch = id.match(/ch(\d+)/);
    const paraMatch = id.match(/p(\d+)/);

    return {
      anchorId: id,
      chapter: chapterMatch ? parseInt(chapterMatch[1], 10) : 0,
      paragraph: paraMatch ? parseInt(paraMatch[1], 10) : 0,
      offset: 0 // Could be calculated based on scroll position within element
    };
  }

  /**
   * Debounced progress saving
   */
  _debounceSaveProgress(locator) {
    // Avoid saving the same position repeatedly
    if (this.lastSavedLocator &&
        this.lastSavedLocator.anchorId === locator.anchorId &&
        Math.abs((this.lastSavedLocator.offset || 0) - (locator.offset || 0)) < 0.1) {
      return;
    }

    this.lastSavedLocator = { ...locator };

    if (this.progressDebounceTimer) {
      clearTimeout(this.progressDebounceTimer);
    }

    this.progressDebounceTimer = setTimeout(() => {
      // Emit progress update event
      if (this.onProgressUpdate) {
        this.onProgressUpdate(locator);
      }
      this.logger.debug('Scroll progress saved', locator);
    }, this.config.progressDebounceMs);
  }

  /**
   * Get current reading locator
   */
  getCurrentLocator() {
    if (this.anchors.length === 0) {
      return { anchorId: 'start', offset: 0, chapter: 0 };
    }

    const currentAnchor = this.anchors[this.currentAnchorIndex];
    if (!currentAnchor) {
      return { anchorId: 'unknown', offset: 0, chapter: 0 };
    }

    return currentAnchor.locator;
  }

  /**
   * Navigate to next anchor
   */
  async goNext(options = {}) {
    if (this.currentAnchorIndex >= this.anchors.length - 1) {
      return false; // At end
    }

    const nextIndex = this.currentAnchorIndex + 1;
    const nextAnchor = this.anchors[nextIndex];

    if (!nextAnchor) return false;

    await this._scrollToAnchor(nextAnchor, options);
    this.currentAnchorIndex = nextIndex;

    return true;
  }

  /**
   * Navigate to previous anchor
   */
  async goPrev(options = {}) {
    if (this.currentAnchorIndex <= 0) {
      return false; // At beginning
    }

    const prevIndex = this.currentAnchorIndex - 1;
    const prevAnchor = this.anchors[prevIndex];

    if (!prevAnchor) return false;

    await this._scrollToAnchor(prevAnchor, options);
    this.currentAnchorIndex = prevIndex;

    return true;
  }

  /**
   * Navigate to specific locator
   */
  async goTo(locator, options = {}) {
    const targetAnchor = this.anchors.find(anchor =>
      anchor.locator.anchorId === locator.anchorId ||
      (anchor.locator.chapter === locator.chapter &&
       anchor.locator.paragraph === locator.paragraph)
    );

    if (!targetAnchor) {
      this.logger.warn('ScrollModeAdapter: target anchor not found', locator);
      return false;
    }

    await this._scrollToAnchor(targetAnchor, options);
    this.currentAnchorIndex = targetAnchor.index;

    return true;
  }

  /**
   * Scroll to specific anchor
   */
  async _scrollToAnchor(anchor, options = {}) {
    const scrollContainer = this.container.querySelector('.scroll-mode-content');
    if (!scrollContainer) return;

    const element = anchor.element;
    const elementRect = element.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();

    const relativeTop = elementRect.top - containerRect.top;
    const targetScrollTop = scrollContainer.scrollTop + relativeTop - this.config.scrollOffset;

    if (options.instant) {
      scrollContainer.scrollTop = targetScrollTop;
    } else {
      scrollContainer.scrollTo({
        top: targetScrollTop,
        behavior: this.config.scrollBehavior
      });
    }
  }

  /**
   * Check if navigation is possible
   */
  canNavigate(direction) {
    switch (direction) {
      case 'next':
        return this.currentAnchorIndex < this.anchors.length - 1;
      case 'prev':
        return this.currentAnchorIndex > 0;
      default:
        return false;
    }
  }

  /**
   * Get navigation context for UI
   */
  getNavigationContext() {
    const currentLocator = this.getCurrentLocator();

    return {
      mode: 'scroll',
      current: {
        anchorId: currentLocator.anchorId,
        chapter: currentLocator.chapter || 0,
        paragraph: currentLocator.paragraph || 0
      },
      total: {
        anchors: this.anchors.length,
        chapters: this.content?.chapters?.length || 1
      },
      navigation: {
        hasPrev: this.canNavigate('prev'),
        hasNext: this.canNavigate('next'),
        atStart: this.currentAnchorIndex === 0,
        atEnd: this.currentAnchorIndex >= this.anchors.length - 1
      }
    };
  }

  /**
   * Set progress update callback
   */
  setProgressCallback(callback) {
    this.onProgressUpdate = callback;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.progressDebounceTimer) {
      clearTimeout(this.progressDebounceTimer);
    }

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    this.anchors = [];
    this.container = null;
    this.content = null;

    this.logger.info('ScrollModeAdapter destroyed');
  }
}












