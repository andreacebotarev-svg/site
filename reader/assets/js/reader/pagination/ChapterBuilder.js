/**
 * ChapterBuilder - Groups pages into chapters (5 pages per chapter)
 * Creates hierarchical navigation structure
 *
 * Features:
 * - Fixed chapter size (5 pages)
 * - Chapter metadata calculation
 * - Reading time estimates
 * - Chapter title generation
 */

import { logger } from '../../utils/logger.js';

export class ChapterBuilder {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.stats = {
      totalChapters: 0,
      totalPages: 0,
      avgPagesPerChapter: 0,
      chapterSizeDistribution: {}
    };

    this.logger.info('ChapterBuilder initialized');
  }

  /**
   * Build chapters from pages array
   * @param {Page[]} pages - Array of pages from PaginatorEngine
   * @param {number} pagesPerChapter - Target pages per chapter (default: 5)
   * @returns {Chapter[]} - Array of chapter objects
   */
  buildChapters(pages, pagesPerChapter = 5) {
    this.logger.time('chapter-building');

    if (!pages || pages.length === 0) {
      this.logger.warn('No pages provided for chapter building');
      return [];
    }

    const chapters = [];
    let globalPageIndex = 0;

    // Group pages into chapters
    for (let i = 0; i < pages.length; i += pagesPerChapter) {
      const chapterPages = pages.slice(i, i + pagesPerChapter);
      const chapter = this.createChapter(chapterPages, chapters.length, globalPageIndex);
      chapters.push(chapter);

      globalPageIndex += chapterPages.length;
    }

    this.updateStats(chapters, pages);
    this.logger.timeEnd('chapter-building');

    this.logger.info('Chapter building completed', {
      totalChapters: chapters.length,
      totalPages: pages.length,
      avgPagesPerChapter: Math.round(pages.length / chapters.length * 10) / 10
    });

    return chapters;
  }

  /**
   * Create chapter object from page group
   * @param {Page[]} chapterPages
   * @param {number} chapterIndex
   * @param {number} startPageIndex
   * @returns {Chapter}
   */
  createChapter(chapterPages, chapterIndex, startPageIndex) {
    // Update page chapter indices
    chapterPages.forEach((page, pageIndex) => {
      page.chapterIndex = chapterIndex;
      page.index = pageIndex; // Local page index within chapter (0-4)
    });

    // Calculate chapter statistics
    const totalWordCount = chapterPages.reduce((sum, page) => sum + page.wordCount, 0);
    const estimatedMinutes = chapterPages.reduce((sum, page) => sum + page.estimatedMinutes, 0);

    // Generate chapter title
    const title = this.generateChapterTitle(chapterIndex + 1, chapterPages);

    return {
      id: `chapter-${chapterIndex}`,
      index: chapterIndex,
      title,
      pages: chapterPages,
      totalWordCount,
      estimatedMinutes,
      startPageIndex,
      endPageIndex: startPageIndex + chapterPages.length - 1,
      pageCount: chapterPages.length,
      isPartial: chapterPages.length < 5 // Last chapter may have fewer pages
    };
  }

  /**
   * Generate chapter title based on content
   * @param {number} chapterNumber
   * @param {Page[]} chapterPages
   * @returns {string}
   */
  generateChapterTitle(chapterNumber, chapterPages) {
    // Try to find a title paragraph in the first few pages
    for (let i = 0; i < Math.min(3, chapterPages.length); i++) {
      const page = chapterPages[i];
      const titlePara = page.paragraphs.find(p => p.type === 'title' || p.title);
      if (titlePara) {
        // Use the title, but limit length
        const title = titlePara.title || titlePara.text;
        return title.length > 50 ? title.substring(0, 47) + '...' : title;
      }
    }

    // Fallback to generic title
    return `Chapter ${chapterNumber}`;
  }

  /**
   * Calculate chapter reading statistics
   * @param {Chapter} chapter
   * @returns {Object}
   */
  calculateChapterStats(chapter) {
    const pageStats = chapter.pages.map(page => ({
      paragraphs: page.paragraphs.length,
      words: page.wordCount,
      minutes: page.estimatedMinutes
    }));

    return {
      totalPages: chapter.pageCount,
      totalWords: chapter.totalWordCount,
      totalMinutes: chapter.estimatedMinutes,
      avgWordsPerPage: Math.round(chapter.totalWordCount / chapter.pageCount),
      avgMinutesPerPage: Math.round(chapter.estimatedMinutes / chapter.pageCount),
      pageBreakdown: pageStats
    };
  }

  /**
   * Find page by global index
   * @param {Chapter[]} chapters
   * @param {number} globalPageIndex
   * @returns {Object|null} - { chapter, page, localPageIndex }
   */
  findPageByGlobalIndex(chapters, globalPageIndex) {
    for (const chapter of chapters) {
      if (globalPageIndex >= chapter.startPageIndex &&
          globalPageIndex <= chapter.endPageIndex) {
        const localPageIndex = globalPageIndex - chapter.startPageIndex;
        return {
          chapter,
          page: chapter.pages[localPageIndex],
          localPageIndex
        };
      }
    }
    return null;
  }

  /**
   * Get navigation info for current position
   * @param {Chapter[]} chapters
   * @param {number} currentChapter
   * @param {number} currentPage
   * @returns {Object}
   */
  getNavigationInfo(chapters, currentChapter, currentPage) {
    const chapter = chapters[currentChapter];
    if (!chapter) return null;

    const currentPageGlobal = chapter.startPageIndex + currentPage;
    const totalPages = chapters.reduce((sum, ch) => sum + ch.pages.length, 0);

    return {
      current: {
        chapter: currentChapter,
        page: currentPage,
        globalPage: currentPageGlobal
      },
      total: {
        chapters: chapters.length,
        pages: totalPages
      },
      progress: {
        percentage: Math.round((currentPageGlobal + 1) / totalPages * 100),
        chapterProgress: Math.round((currentPage + 1) / chapter.pageCount * 100)
      },
      navigation: {
        hasPrevChapter: currentChapter > 0,
        hasNextChapter: currentChapter < chapters.length - 1,
        hasPrevPage: currentPage > 0 || currentChapter > 0,
        hasNextPage: currentPage < chapter.pageCount - 1 || currentChapter < chapters.length - 1
      }
    };
  }

  /**
   * Update internal statistics
   * @param {Chapter[]} chapters
   * @param {Page[]} originalPages
   */
  updateStats(chapters, originalPages) {
    this.stats.totalChapters = chapters.length;
    this.stats.totalPages = originalPages.length;

    if (chapters.length > 0) {
      this.stats.avgPagesPerChapter =
        Math.round((originalPages.length / chapters.length) * 10) / 10;
    }

    // Chapter size distribution
    this.stats.chapterSizeDistribution = {};
    chapters.forEach(chapter => {
      const size = chapter.pageCount;
      this.stats.chapterSizeDistribution[size] =
        (this.stats.chapterSizeDistribution[size] || 0) + 1;
    });
  }

  /**
   * Get chapter building statistics
   * @returns {Object}
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Validate chapter structure
   * @param {Chapter[]} chapters
   * @returns {boolean}
   */
  validateChapters(chapters) {
    try {
      let expectedPageIndex = 0;

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];

        // Check chapter index
        if (chapter.index !== i) {
          throw new Error(`Chapter index mismatch: expected ${i}, got ${chapter.index}`);
        }

        // Check page indices
        if (chapter.startPageIndex !== expectedPageIndex) {
          throw new Error(`Chapter startPageIndex mismatch: expected ${expectedPageIndex}, got ${chapter.startPageIndex}`);
        }

        // Check page count
        if (chapter.pageCount !== chapter.pages.length) {
          throw new Error(`Chapter page count mismatch: ${chapter.pageCount} vs ${chapter.pages.length}`);
        }

        expectedPageIndex += chapter.pageCount;
      }

      return true;
    } catch (error) {
      this.logger.error('Chapter validation failed', error);
      return false;
    }
  }
}
