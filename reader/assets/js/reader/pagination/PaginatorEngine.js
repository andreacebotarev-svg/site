/**
 * PaginatorEngine - Mathematical paragraph-to-page algorithm
 * Implements greedy bin packing with intelligent constraints
 *
 * Algorithm: Greedy Paragraph Packing
 * - Target: 4-6 paragraphs per page
 * - Constraints: Titles start new pages, respect min/max bounds
 * - Optimization: Balance content density and reading flow
 */

import { logger } from '../../utils/logger.js';

export class PaginatorEngine {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.stats = {
      totalPages: 0,
      totalParagraphs: 0,
      avgParagraphsPerPage: 0,
      pageSizeDistribution: {}
    };

    this.logger.info('PaginatorEngine initialized');
  }

  /**
   * Main pagination algorithm - greedy paragraph packing
   * @param {Paragraph[]} paragraphs - Preprocessed paragraphs
   * @param {Object} constraints - { min, max, preferred }
   * @returns {Page[]} - Array of page objects
   */
  paginateParagraphs(paragraphs, constraints) {
    this.logger.time('paragraph-pagination');

    const pages = [];
    const { min, max, preferred } = constraints;
    const WORD_TARGET = 300; // Optimal words per page

    let currentPageParagraphs = [];
    let currentPageWordCount = 0;
    let globalPageIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];

      // Pass currentPageWordCount to decision logic
      const shouldStartNewPage = this.shouldStartNewPage(
        paragraph,
        currentPageParagraphs,
        currentPageWordCount, // <--- PASSED HERE
        { ...constraints, wordTarget: WORD_TARGET }
      );

      if (shouldStartNewPage && currentPageParagraphs.length > 0) {
        // Close current page and start new one
        const page = this.createPage(
          currentPageParagraphs,
          globalPageIndex,
          currentPageWordCount
        );
        pages.push(page);

        currentPageParagraphs = [paragraph];
        currentPageWordCount = paragraph.wordCount;
        globalPageIndex++;
      } else {
        // Add to current page
        currentPageParagraphs.push(paragraph);
        currentPageWordCount += paragraph.wordCount;
      }
    }

    // Handle last page
    if (currentPageParagraphs.length > 0) {
      const page = this.createPage(
        currentPageParagraphs,
        globalPageIndex,
        currentPageWordCount
      );
      pages.push(page);
    }

    this.updateStats(pages, paragraphs);
    this.logger.timeEnd('paragraph-pagination');

    this.logger.info('Paragraph pagination completed', {
      totalPages: pages.length,
      totalParagraphs: paragraphs.length,
      avgParagraphsPerPage: Math.round(paragraphs.length / pages.length * 10) / 10
    });

    return pages;
  }

  /**
   * Determine if paragraph should start a new page
   * @param {Paragraph} paragraph - Current paragraph
   * @param {Paragraph[]} currentPage - Current page paragraphs
   * @param {number} currentWordCount - Current page word count
   * @param {Object} constraints - Size constraints
   * @returns {boolean}
   */
  shouldStartNewPage(paragraph, currentPage, currentWordCount, constraints) {
    const { min, max, preferred, wordTarget } = constraints;

    // Rule 1: Empty page check
    if (currentPage.length === 0) return false;

    // Rule 2: Title always breaks
    if (paragraph.type === 'title') return true;

    // Rule 3: Image always breaks if page has decent content already
    if (paragraph.type === 'image' && currentPage.length > 1) return true;

    // Rule 4: HARD LIMITS (Paragraph Count)
    if (currentPage.length >= max) return true;

    // Rule 5: WORD DENSITY CHECK (The Fix 🚀)
    // If we have enough words, we can break even if paragraph count is low (but > min)
    if (currentPage.length >= min && currentWordCount >= wordTarget) {
      return true;
    }

    // Rule 6: PREFERRED LIMIT (Soft Cap)
    // Only break at preferred count if we also have a "decent" amount of words (e.g. 50% of target)
    if (currentPage.length >= preferred) {
      if (currentWordCount > (wordTarget * 0.5)) return true;
      // Otherwise keep adding short paragraphs to fill the page
    }

    return false;
  }

  /**
   * Create page object from paragraphs
   * @param {Paragraph[]} paragraphs
   * @param {number} globalIndex
   * @param {number} wordCount
   * @returns {Page}
   */
  createPage(paragraphs, globalIndex, wordCount) {
    const estimatedMinutes = Math.round(wordCount / 200); // 200 words per minute

    return {
      id: `page-${globalIndex}`,
      index: globalIndex,
      paragraphs: [...paragraphs],
      wordCount,
      estimatedMinutes: Math.max(1, estimatedMinutes), // At least 1 minute
      chapterIndex: 0, // Will be set by ChapterBuilder
      globalPageIndex: globalIndex
    };
  }

  /**
   * Handle edge cases in pagination
   * @param {Paragraph[]} paragraphs
   * @param {Object} constraints
   * @returns {Page[]}
   */
  handleEdgeCases(paragraphs, constraints) {
    // Case 1: Empty input
    if (!paragraphs || paragraphs.length === 0) {
      return [];
    }

    // Case 2: Very small content (< min paragraphs)
    if (paragraphs.length < constraints.min) {
      return [this.createPage(paragraphs, 0,
        paragraphs.reduce((sum, p) => sum + p.wordCount, 0))];
    }

    // Case 3: Single very long paragraph
    if (paragraphs.length === 1 && paragraphs[0].wordCount > 1000) {
      // Could implement paragraph splitting here in the future
      this.logger.warn('Very long paragraph detected, consider splitting');
    }

    return null; // No edge case, proceed normally
  }

  /**
   * Update internal statistics
   * @param {Page[]} pages
   * @param {Paragraph[]} originalParagraphs
   */
  updateStats(pages, originalParagraphs) {
    this.stats.totalPages = pages.length;
    this.stats.totalParagraphs = originalParagraphs.length;

    if (pages.length > 0) {
      this.stats.avgParagraphsPerPage =
        Math.round((originalParagraphs.length / pages.length) * 10) / 10;
    }

    // Page size distribution
    this.stats.pageSizeDistribution = {};
    pages.forEach(page => {
      const size = page.paragraphs.length;
      this.stats.pageSizeDistribution[size] =
        (this.stats.pageSizeDistribution[size] || 0) + 1;
    });
  }

  /**
   * Get pagination statistics
   * @returns {Object}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Validate pagination result
   * @param {Page[]} pages
   * @param {Paragraph[]} originalParagraphs
   * @param {Object} constraints
   * @returns {boolean}
   */
  validateResult(pages, originalParagraphs, constraints) {
    try {
      // Check total paragraphs match
      const totalParagraphs = pages.reduce((sum, page) => sum + page.paragraphs.length, 0);
      if (totalParagraphs !== originalParagraphs.length) {
        throw new Error(`Paragraph count mismatch: ${totalParagraphs} vs ${originalParagraphs.length}`);
      }

      // Check page size constraints
      for (const page of pages) {
        const size = page.paragraphs.length;
        if (size < constraints.min || size > constraints.max) {
          this.logger.warn(`Page size violation: ${size} paragraphs (min: ${constraints.min}, max: ${constraints.max})`);
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Pagination validation failed', error);
      return false;
    }
  }
}
