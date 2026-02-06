/**
 * Pagination System v4.0 - Comprehensive Test Suite
 * Tests the new mathematical content chunking system
 */

import { ContentPager } from '../assets/js/reader/pagination/ContentPager.js';
import { PaginatorEngine } from '../assets/js/reader/pagination/PaginatorEngine.js';
import { ChapterBuilder } from '../assets/js/reader/pagination/ChapterBuilder.js';
import { PaginationCache } from '../assets/js/reader/pagination/PaginationCache.js';
import { URLNavigator } from '../assets/js/reader/pagination/URLNavigator.js';
import { PageRenderer } from '../assets/js/reader/pagination/PageRenderer.js';

// Mock logger for tests
const mockLogger = {
  info: () => {},
  debug: () => {},
  warn: () => {},
  error: () => {},
  time: () => {},
  timeEnd: () => {}
};

// Test data generators
function generateTestParagraphs(count = 25, options = {}) {
  const { includeTitles = true, includeFacts = true } = options;

  const paragraphs = [];
  let titleCount = 0;
  let factCount = 0;

  for (let i = 0; i < count; i++) {
    let type = 'regular';
    let title = null;
    let wordCount = 20 + Math.floor(Math.random() * 30); // 20-50 words

    // Add some variety
    if (includeTitles && Math.random() < 0.1 && titleCount < 3) {
      type = 'title';
      title = `Chapter ${titleCount + 1}`;
      wordCount = 5;
      titleCount++;
    } else if (includeFacts && Math.random() < 0.15 && factCount < 2) {
      type = 'fact';
      title = `Interesting Fact ${factCount + 1}`;
      wordCount = 35;
      factCount++;
    }

    paragraphs.push({
      text: `This is paragraph ${i + 1} with approximately ${wordCount} words of content. `.repeat(Math.ceil(wordCount / 10)),
      type,
      title,
      wordCount
    });
  }

  return paragraphs;
}

function generateTestPage(paragraphCount = 5) {
  const paragraphs = generateTestParagraphs(paragraphCount);
  const wordCount = paragraphs.reduce((sum, p) => sum + p.wordCount, 0);

  return {
    id: `test-page-${Date.now()}`,
    index: 0,
    paragraphs,
    wordCount,
    estimatedMinutes: Math.round(wordCount / 200),
    chapterIndex: 0,
    globalPageIndex: 0
  };
}

function generateTestChapter(pageCount = 5) {
  const pages = [];
  let wordCount = 0;

  for (let i = 0; i < pageCount; i++) {
    const page = generateTestPage(5);
    page.index = i;
    page.globalPageIndex = i;
    pages.push(page);
    wordCount += page.wordCount;
  }

  return {
    id: `test-chapter-${Date.now()}`,
    index: 0,
    title: 'Test Chapter',
    pages,
    totalWordCount: wordCount,
    estimatedMinutes: Math.round(wordCount / 200),
    startPageIndex: 0,
    endPageIndex: pageCount - 1,
    pageCount,
    isPartial: false
  };
}

// Test suites
describe('Pagination System v4.0', () => {

  describe('PaginatorEngine', () => {
    let engine;

    beforeEach(() => {
      engine = new PaginatorEngine({ logger: mockLogger });
    });

    test('should create pages with 4-6 paragraphs', () => {
      const paragraphs = generateTestParagraphs(25);
      const pages = engine.paginateParagraphs(paragraphs, { min: 4, max: 6, preferred: 5 });

      expect(pages.length).toBeGreaterThan(0);

      pages.forEach(page => {
        expect(page.paragraphs.length).toBeGreaterThanOrEqual(4);
        expect(page.paragraphs.length).toBeLessThanOrEqual(6);
        expect(page.wordCount).toBeGreaterThan(0);
        expect(page.estimatedMinutes).toBeGreaterThan(0);
      });
    });

    test('should start new page on title paragraphs', () => {
      const paragraphs = [
        { text: 'Regular paragraph 1', type: 'regular', wordCount: 20 },
        { text: 'Regular paragraph 2', type: 'regular', wordCount: 20 },
        { text: 'Chapter Title', type: 'title', title: 'Chapter 1', wordCount: 5 },
        { text: 'After title paragraph', type: 'regular', wordCount: 20 }
      ];

      const pages = engine.paginateParagraphs(paragraphs, { min: 2, max: 4, preferred: 3 });

      // Title should start new page
      const titlePage = pages.find(p => p.paragraphs.some(para => para.type === 'title'));
      expect(titlePage).toBeDefined();
      expect(titlePage.paragraphs[0].type).toBe('title');
    });

    test('should handle tiny books (< 4 paragraphs)', () => {
      const paragraphs = [
        { text: 'Only paragraph', type: 'regular', wordCount: 10 }
      ];

      const pages = engine.paginateParagraphs(paragraphs, { min: 4, max: 6, preferred: 5 });
      expect(pages.length).toBe(1);
      expect(pages[0].paragraphs.length).toBe(1);
    });

    test('should validate pagination results', () => {
      const paragraphs = generateTestParagraphs(20);
      const pages = engine.paginateParagraphs(paragraphs, { min: 4, max: 6, preferred: 5 });

      const isValid = engine.validateResult(pages, paragraphs, { min: 4, max: 6, preferred: 5 });
      expect(isValid).toBe(true);
    });
  });

  describe('ChapterBuilder', () => {
    let builder;

    beforeEach(() => {
      builder = new ChapterBuilder({ logger: mockLogger });
    });

    test('should create chapters with 5 pages', () => {
      const pages = [];
      for (let i = 0; i < 23; i++) {
        pages.push({
          ...generateTestPage(),
          index: i,
          globalPageIndex: i
        });
      }

      const chapters = builder.buildChapters(pages, 5);

      expect(chapters.length).toBe(5); // 23 pages / 5 = 4 full chapters + 1 partial

      // First 4 chapters should have 5 pages each
      chapters.slice(0, 4).forEach(chapter => {
        expect(chapter.pages.length).toBe(5);
        expect(chapter.pageCount).toBe(5);
      });

      // Last chapter should have 3 pages
      expect(chapters[4].pages.length).toBe(3);
      expect(chapters[4].isPartial).toBe(true);
    });

    test('should generate chapter titles from content', () => {
      const pages = [generateTestPage()];
      pages[0].paragraphs[0] = {
        text: 'Chapter One: Beginning',
        type: 'title',
        title: 'Chapter One',
        wordCount: 5
      };

      const chapters = builder.buildChapters(pages, 5);
      expect(chapters[0].title).toBe('Chapter One');
    });

    test('should calculate chapter statistics', () => {
      const chapter = generateTestChapter(3);
      const stats = builder.calculateChapterStats(chapter);

      expect(stats.totalPages).toBe(3);
      expect(stats.totalWords).toBe(chapter.totalWordCount);
      expect(stats.avgWordsPerPage).toBeGreaterThan(0);
    });

    test('should find page by global index', () => {
      const chapters = [
        generateTestChapter(5), // pages 0-4
        generateTestChapter(5)  // pages 5-9
      ];
      chapters[1].startPageIndex = 5;
      chapters[1].endPageIndex = 9;

      const result = builder.findPageByGlobalIndex(chapters, 7);
      expect(result).toBeDefined();
      expect(result.chapter.index).toBe(1);
      expect(result.page.index).toBe(2); // 7 - 5 = 2
    });
  });

  describe('ContentPager', () => {
    let pager;

    beforeEach(() => {
      pager = new ContentPager({
        logger: mockLogger,
        config: {
          paragraphsPerPage: { min: 4, max: 6, preferred: 5 },
          pagesPerChapter: 5,
          wordsPerMinute: 200
        }
      });
    });

    test('should paginate paragraphs into structured book', async () => {
      const paragraphs = generateTestParagraphs(50);
      const pagedBook = await pager.paginate(paragraphs, 'test-book');

      expect(pagedBook).toBeDefined();
      expect(pagedBook.bookId).toBe('test-book');
      expect(pagedBook.chapters.length).toBeGreaterThan(0);
      expect(pagedBook.totalPages).toBeGreaterThan(0);
      expect(pagedBook.totalWords).toBeGreaterThan(0);
      expect(pagedBook.metadata.version).toBe('4.0.0');
    });

    test('should use cache for repeated pagination', async () => {
      const paragraphs = generateTestParagraphs(25);

      // First call
      const result1 = await pager.paginate(paragraphs, 'cached-book');
      expect(result1).toBeDefined();

      // Second call should use cache
      const result2 = await pager.paginate(paragraphs, 'cached-book');
      expect(result2).toBe(result1); // Same object reference from cache
    });

    test('should handle force refresh', async () => {
      const paragraphs = generateTestParagraphs(25);

      // Cache result
      await pager.paginate(paragraphs, 'force-book');

      // Force refresh
      const result = await pager.paginate(paragraphs, 'force-book', { force: true });
      expect(result).toBeDefined();
    });

    test('should preprocess paragraphs correctly', () => {
      const rawParagraphs = [
        { text: 'Valid paragraph', type: 'regular' },
        { text: '', type: 'regular' }, // Empty
        { text: '   ', type: 'regular' }, // Whitespace only
        { text: 'Another valid', type: 'regular' }
      ];

      const processed = pager.preprocessParagraphs(rawParagraphs);
      expect(processed.length).toBe(2);
      expect(processed[0].text).toBe('Valid paragraph');
      expect(processed[1].text).toBe('Another valid');
    });
  });

  describe('PaginationCache', () => {
    let cache;

    beforeEach(() => {
      cache = new PaginationCache({
        logger: mockLogger,
        ttl: 1000, // 1 second for testing
        maxEntries: 5
      });
    });

    test('should store and retrieve cached data', () => {
      const testData = { test: 'data' };
      const config = { paragraphsPerPage: { min: 4, max: 6, preferred: 5 } };

      cache.set('test-book', config, testData);
      const retrieved = cache.get('test-book', config);

      expect(retrieved).toEqual(testData);
    });

    test('should expire old entries', async () => {
      const testData = { test: 'data' };
      const config = { paragraphsPerPage: { min: 4, max: 6, preferred: 5 } };

      cache.set('test-book', config, testData);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      const retrieved = cache.get('test-book', config);
      expect(retrieved).toBeNull();
    });

    test('should enforce max entries limit', () => {
      const config = { paragraphsPerPage: { min: 4, max: 6, preferred: 5 } };

      // Add 6 entries (max is 5)
      for (let i = 0; i < 6; i++) {
        cache.set(`book-${i}`, config, { data: i });
      }

      const stats = cache.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(5);
    });

    test('should clear cache for specific book', () => {
      const config = { paragraphsPerPage: { min: 4, max: 6, preferred: 5 } };

      cache.set('book1', config, { data: 1 });
      cache.set('book2', config, { data: 2 });

      cache.clear('book1');

      expect(cache.get('book1', config)).toBeNull();
      expect(cache.get('book2', config)).not.toBeNull();
    });
  });

  describe('URLNavigator', () => {
    let navigator;
    let mockOnStateChange;

    beforeEach(() => {
      mockOnStateChange = jest.fn();
      navigator = new URLNavigator(mockOnStateChange, {
        logger: mockLogger,
        updateDelay: 0 // No delay for testing
      });
    });

    test('should parse URL parameters', () => {
      // Mock window.location.search
      delete window.location;
      window.location = {
        search: '?bookId=test-book&chapter=2&page=3'
      };

      const state = navigator.parseURL();
      expect(state.bookId).toBe('test-book');
      expect(state.chapter).toBe(2);
      expect(state.page).toBe(3);
    });

    test('should handle missing URL parameters', () => {
      window.location = { search: '' };

      const state = navigator.parseURL();
      expect(state.bookId).toBeNull();
      expect(state.chapter).toBe(0);
      expect(state.page).toBe(0);
    });

    test('should navigate to specific position', () => {
      navigator.navigateTo(1, 2);

      expect(mockOnStateChange).toHaveBeenCalledWith({
        bookId: null,
        chapter: 1,
        page: 2
      });
    });

    test('should validate state against book structure', () => {
      const pagedBook = {
        chapters: [
          { pages: [{}, {}] }, // Chapter 0: 2 pages
          { pages: [{}, {}, {}] } // Chapter 1: 3 pages
        ]
      };

      // Valid state
      const validState = navigator.validateState({ chapter: 1, page: 2 }, pagedBook);
      expect(validState.chapter).toBe(1);
      expect(validState.page).toBe(2);

      // Invalid chapter
      const correctedState = navigator.validateState({ chapter: 5, page: 0 }, pagedBook);
      expect(correctedState.chapter).toBe(1); // Last valid chapter
      expect(correctedState.page).toBe(0);
    });

    afterEach(() => {
      navigator.destroy();
    });
  });

  describe('PageRenderer', () => {
    let renderer;
    let container;

    beforeEach(() => {
      container = document.createElement('div');
      renderer = new PageRenderer(container, { logger: mockLogger });
    });

    test('should render page HTML', () => {
      const page = generateTestPage();
      const chapter = generateTestChapter();

      renderer.renderPage(page, chapter, { animate: false });

      expect(container.innerHTML).toContain('page');
      expect(container.innerHTML).toContain(page.paragraphs[0].text);
      expect(container.innerHTML).toContain('Chapter 1, Page 1/5');
    });

    test('should handle different paragraph types', () => {
      const page = {
        ...generateTestPage(),
        paragraphs: [
          { text: 'Regular text', type: 'regular', wordCount: 10 },
          { text: 'Chapter Title', type: 'title', title: 'Chapter 1', wordCount: 5 },
          { text: 'Interesting fact', type: 'fact', title: 'Fact', wordCount: 15 }
        ]
      };
      const chapter = generateTestChapter();

      renderer.renderPage(page, chapter, { animate: false });

      expect(container.innerHTML).toContain('<p class="reading-paragraph">');
      expect(container.innerHTML).toContain('<h3 class="reading-paragraph">');
      expect(container.innerHTML).toContain('<div class="fact-box');
    });

    test('should setup navigation buttons', () => {
      const page = generateTestPage();
      const chapter = generateTestChapter();

      const mockNavigate = jest.fn();
      renderer.setNavigationCallback(mockNavigate);

      renderer.renderPage(page, chapter, { animate: false });

      const nextBtn = container.querySelector('.nav-next');
      expect(nextBtn).toBeDefined();

      // Note: In real scenario, we'd click the button and verify callback
    });

    afterEach(() => {
      renderer.destroy();
    });
  });

  // Integration tests
  describe('Full Pagination Flow', () => {
    test('should paginate, navigate, and render complete flow', async () => {
      // 1. Setup components
      const pager = new ContentPager({
        logger: mockLogger,
        config: {
          paragraphsPerPage: { min: 4, max: 6, preferred: 5 },
          pagesPerChapter: 5
        }
      });

      const container = document.createElement('div');
      const renderer = new PageRenderer(container, { logger: mockLogger });

      // 2. Paginate content
      const paragraphs = generateTestParagraphs(50);
      const pagedBook = await pager.paginate(paragraphs, 'integration-test');

      expect(pagedBook.totalPages).toBeGreaterThan(0);
      expect(pagedBook.chapters.length).toBeGreaterThan(0);

      // 3. Render first page
      const firstChapter = pagedBook.chapters[0];
      const firstPage = firstChapter.pages[0];

      await renderer.renderPage(firstPage, firstChapter, { animate: false });

      expect(container.innerHTML).toContain('page');
      expect(container.innerHTML).toContain('Chapter 1');

      // 4. Verify navigation context
      const urlNavigator = new URLNavigator(() => {}, { logger: mockLogger });
      const navContext = urlNavigator.getNavigationContext(pagedBook);

      expect(navContext.current.chapter).toBe(0);
      expect(navContext.current.page).toBe(0);
      expect(navContext.total.chapters).toBe(pagedBook.totalChapters);
      expect(navContext.total.pages).toBe(pagedBook.totalPages);

      // Cleanup
      renderer.destroy();
      urlNavigator.destroy();
    });
  });
});
