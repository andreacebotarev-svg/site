/**
 * ContentPager - Main orchestrator for mathematical content pagination v4.0
 * Creates hierarchical structure: Book → Chapters → Pages → Paragraphs
 *
 * Features:
 * - Mathematical paragraph packing (4-6 paragraphs per page)
 * - Chapter grouping (5 pages per chapter)
 * - Intelligent caching with TTL
 * - Progress-aware pagination
 * - URL state synchronization
 */

import { logger } from '../../utils/logger.js';
import { PaginatorEngine } from './PaginatorEngine.js';
import { ChapterBuilder } from './ChapterBuilder.js';
import { PaginationCache } from './PaginationCache.js';

export class ContentPager {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.paginatorEngine = new PaginatorEngine(options);
    this.chapterBuilder = new ChapterBuilder(options);
    this.cache = new PaginationCache();

    // Default configuration
    this.config = {
      paragraphsPerPage: {
        min: 4,
        max: 6,
        preferred: 5
      },
      pagesPerChapter: 5,
      wordsPerMinute: 200,
      cacheEnabled: true,
      cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
      ...options.config
    };

    this.logger.info('ContentPager initialized', { config: this.config });
  }

  /**
   * Main pagination method - converts raw paragraphs to structured content
   * @param {Paragraph[]} paragraphs - Raw paragraphs from book parser
   * @param {string} bookId - Book identifier
   * @param {Object} options - Additional options
   * @returns {Promise<PagedBook>} - Structured paginated content
   */
  async paginate(paragraphs, bookId, options = {}) {
    this.logger.time('pagination-total');

    try {
      // Preprocessing
      const cleanedParagraphs = this.preprocessParagraphs(paragraphs);
      this.logger.debug('Paragraphs preprocessed', {
        original: paragraphs.length,
        cleaned: cleanedParagraphs.length
      });

      // Check cache first
      if (this.config.cacheEnabled && !options.force) {
        const cached = this.cache.get(bookId, this.config);
        if (cached) {
          this.logger.info('Using cached pagination result');
          return cached;
        }
      }

      // Step 1: Split paragraphs into pages
      this.logger.time('paragraph-paging');
      const pages = this.paginatorEngine.paginateParagraphs(
        cleanedParagraphs,
        this.config.paragraphsPerPage
      );
      this.logger.timeEnd('paragraph-paging');

      this.logger.debug('Pages created', {
        pageCount: pages.length,
        avgParagraphsPerPage: pages.reduce((sum, p) => sum + p.paragraphs.length, 0) / pages.length
      });

      // Step 2: Group pages into chapters
      this.logger.time('chapter-building');
      const chapters = this.chapterBuilder.buildChapters(pages, this.config.pagesPerChapter);
      this.logger.timeEnd('chapter-building');

      this.logger.debug('Chapters built', {
        chapterCount: chapters.length,
        avgPagesPerChapter: chapters.reduce((sum, c) => sum + c.pages.length, 0) / chapters.length
      });

      // Step 3: Create final structure
      const pagedBook = this.createPagedBook(bookId, chapters, cleanedParagraphs);

      // Step 4: Cache result
      if (this.config.cacheEnabled) {
        this.cache.set(bookId, this.config, pagedBook);
        this.logger.debug('Pagination result cached');
      }

      this.logger.timeEnd('pagination-total');
      this.logger.info('Content pagination completed', {
        bookId,
        totalPages: pagedBook.totalPages,
        totalChapters: pagedBook.totalChapters,
        totalWords: pagedBook.totalWords,
        avgWordsPerPage: Math.round(pagedBook.totalWords / pagedBook.totalPages)
      });

      return pagedBook;

    } catch (error) {
      this.logger.error('Content pagination failed', error);
      throw new Error(`Pagination failed: ${error.message}`);
    }
  }

  /**
   * Preprocess paragraphs - filter empty, normalize structure
   * @param {Paragraph[]} paragraphs
   * @returns {Paragraph[]} - Cleaned paragraphs
   */
  /**
   * Helper to strip HTML tags for text estimation
   * IMPROVED: Replace tags with spaces to prevent word merging
   */
  stripHtml(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, ' ') // Replace tags with space to prevent word merging
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')     // Collapse multiple spaces
      .trim();
  }

  /**
   * Preprocess paragraphs - filter empty, normalize structure
   * FIXED: Allows paragraphs with HTML content even if text is empty
   */
  preprocessParagraphs(paragraphs) {
    return paragraphs
      .filter(para => {
        if (!para) return false;
        // Check text OR html content
        const contentText = (para.text?.trim()) || this.stripHtml(para.html || '');
        return contentText.length > 0;
      })
      .map(para => {
        // Use text if available, otherwise extract from HTML for word counting
        const contentText = para.text?.trim() || this.stripHtml(para.html || '');

        return {
          text: contentText, // Now guaranteed to have content
          type: para.type || 'regular',
          title: para.title?.trim(),
          html: para.html, // Preserve original HTML for renderer
          wordCount: this.estimateWordCount(contentText)
        };
      });
  }

  /**
   * Estimate word count for paragraph
   * @param {string} text
   * @returns {number}
   */
  estimateWordCount(text) {
    if (!text) return 0;
    // Simple estimation: split by whitespace and filter empty
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Create final PagedBook structure
   * @param {string} bookId
   * @param {Chapter[]} chapters
   * @param {Paragraph[]} originalParagraphs
   * @returns {PagedBook}
   */
  createPagedBook(bookId, chapters, originalParagraphs) {
    const totalPages = chapters.reduce((sum, ch) => sum + ch.pages.length, 0);
    const totalWords = chapters.reduce((sum, ch) =>
      sum + ch.pages.reduce((pageSum, page) => pageSum + page.wordCount, 0), 0
    );

    // Calculate reading time estimates
    const totalMinutes = totalWords / this.config.wordsPerMinute;

    return {
      bookId,
      chapters,
      totalPages,
      totalChapters: chapters.length,
      totalParagraphs: originalParagraphs.length,
      totalWords,
      estimatedReadingTime: Math.round(totalMinutes),
      metadata: {
        paginatedAt: Date.now(),
        config: { ...this.config },
        version: '4.0.0',
        algorithm: 'greedy-paragraph-packing'
      }
    };
  }

  /**
   * Get pagination statistics
   * @returns {Object} - Statistics object
   */
  getStats() {
    return {
      config: this.config,
      cacheStats: this.cache.getStats(),
      engineStats: this.paginatorEngine.getStats(),
      chapterStats: this.chapterBuilder.getStats()
    };
  }

  /**
   * Clear cache for specific book
   * @param {string} bookId
   */
  clearCache(bookId) {
    this.cache.clear(bookId);
    this.logger.info('Cache cleared for book', { bookId });
  }

  /**
   * Update configuration
   * @param {Object} newConfig
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Configuration updated', { config: this.config });
  }
}
