/**
 * Reader View - Orchestrates book reading experience
 * Supports both legacy pagination (v3.x) and new mathematical pagination (v4.0)
 * Coordinates between ContentRenderer, WordHighlighter, BookLoader, and PaginationController
 */
import { logger } from '../utils/logger.js';
import { ContentRenderer } from '../reader/ContentRenderer.js';
import { WordHighlighter } from '../reader/WordHighlighter.js';
import { BookLoader } from '../reader/BookLoader.js';
import { PaginationController } from '../reader/PaginationController.js';
import { ReaderUIController } from '../reader/ReaderUIController.js';
import { WordPopover } from '../ui/components/WordPopover.js';
import { vocabularyStorage } from '../vocabulary/vocabulary-storage.enhanced.js';
import { ReadingStateManager } from '../reader/ReadingStateManager.js';

const readerLogger = logger.createChild('ReaderView');

export class ReaderView {
  constructor(container, params = []) {
    this.container = container;
    this.bookId = params[0] || null;

    // Initialize components (v4.0 only)
    this.contentRenderer = new ContentRenderer({ logger: readerLogger });
    this.wordHighlighter = new WordHighlighter({
      logger: readerLogger,
      vocabularyStorage
    });
    // Create pagination components
    this.paginationController = new PaginationController({
      logger: readerLogger,
      usePaginationV4: true, // Always use v4.0
      vocabularyStorage,
      getWordPopover: () => this.wordPopover // Lazy getter for wordPopover
    });

    // Create UI controller
    this.uiController = new ReaderUIController({ logger: readerLogger });

    // Create additional v4.0 components (injected into pagination controller)
    this.bookLoader = new BookLoader({ logger: readerLogger });
    this.paginationEngine = null; // Will be created lazily
    this.stateManager = null; // Will be created lazily

    // Initialize word popover
    this.wordPopover = null;

    // Book data
    this.currentBook = null;
    this.currentContent = null;

    // Setup components
    this.uiController.initialize(container);
    this.paginationController.initialize(container);

    readerLogger.info('ReaderView initialized', {
      paginationVersion: '4.0',
      bookId: this.bookId
    });
  }


  async render() {
    // Clear previous state but keep components alive
    this.clear();

    // Re-initialize components with current container (important for v4.0)
    this.paginationController.initialize(this.container);

    if (!this.bookId) {
      this.uiController.showNoBookSelected();
      return;
    }

    try {
      // Make globally accessible for debugging
      window.readerView = this;

      // Show loading state
      this.uiController.showLoading('Loading book...');

      // Load book data
      const bookData = await this.bookLoader.loadCompleteBook(this.bookId);

      // Hide loading
      this.uiController.hideLoading();

      // Store book data
      this.currentBook = bookData.book;
      this.currentContent = bookData.content;

      // Initialize word popover if needed (after content is loaded)
      if (!this.wordPopover) {
        const overlayRoot = document.getElementById('overlay-root');
        if (overlayRoot) {
          // Передаём vocabularyStorage через options
          this.wordPopover = new WordPopover(overlayRoot, {
            vocabularyStorage: vocabularyStorage
          });
        }
      }

      // ✅ ШАГ 1: Настроить ленивую загрузку word system
      this.setupLazyWordSystemLoader();

      // Render content using v4.0 pagination
      await this.renderBookContent(bookData);

    } catch (error) {
      readerLogger.error('Failed to render book', error);
      this.uiController.showError(error, {
        showRetry: true,
        retryAction: () => this.render()
      });
    }
  }

  /**
   * ✅ ШАГ 1: Setup lazy word system loader
   * Запускает загрузку только при первом клике на слово
   */
  setupLazyWordSystemLoader() {
    // Проверка: уже загружено или уже есть listener
    if (window._wordSystemReady || window._lazyLoaderInstalled) {
      readerLogger.debug('Word system already ready or loader already installed');
      return;
    }

    // Флаг: listener установлен (avoid duplicates)
    window._lazyLoaderInstalled = true;

    readerLogger.info('Installing lazy word system loader');

    // Глобальный click listener (capture phase для раннего перехвата)
    const handleFirstWordClick = async (e) => {
      // Проверка: это клик на интерактивное слово?
      if (!e.target.classList.contains('interactive-word')) {
        return;
      }

      // Проверка: уже загружено?
      if (window._wordSystemReady) {
        return;
      }

      // Блокируем повторные вызовы
      if (window._wordSystemLoading) {
        readerLogger.debug('Word system already loading, ignoring duplicate click');
        return;
      }

      window._wordSystemLoading = true;
      readerLogger.info('First word click detected, starting word system loader');

      // Показать toast уведомление
      const toast = this.showLoadingToast();

      try {
        // Импортировать WordSystemLoader динамически
        const { WordSystemLoader } = await import('../utils/WordSystemLoader.js');

        // Запустить прелоадер (20 секунд)
        await WordSystemLoader.start(20000);

        // Успех!
        window._wordSystemReady = true;
        window._wordSystemLoading = false;

        // Убрать toast
        toast.remove();

        readerLogger.info('Word system loaded successfully');

        // Теперь можно кликнуть снова - попытка показать поповер для того же слова
        if (this.wordPopover && e.target) {
          const rect = e.target.getBoundingClientRect();
          const text = e.target.textContent.trim();
          this.wordPopover.show(e.target, rect, text);
        }

      } catch (error) {
        readerLogger.error('Failed to load word system', error);
        window._wordSystemLoading = false;

        toast.remove();
      }
    };

    // Добавляем listener (capture: true для раннего перехвата)
    document.addEventListener('click', handleFirstWordClick, { capture: true });

    // Cleanup при destroy
    this._lazyLoaderCleanup = () => {
      document.removeEventListener('click', handleFirstWordClick, { capture: true });
      window._lazyLoaderInstalled = false;
    };
  }

  /**
   * Показать toast уведомление "Словарь загружается..."
   */
  showLoadingToast() {
    const toast = document.createElement('div');
    toast.id = 'word-system-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--color-info, #2196F3);
      color: white;
      padding: 14px 20px;
      border-radius: 12px;
      z-index: 10001;
      box-shadow: 0 4px 16px rgba(33, 150, 243, 0.3);
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideIn 0.3s ease;
    `;
    toast.innerHTML = `
      <span style="font-size: 18px;">⏳</span>
      <span>Словарь загружается (20 сек)...</span>
    `;
    document.body.appendChild(toast);
    return toast;
  }


  /**
   * Render book content using clean v4.0 architecture
   * Implements the "Golden Algorithm" for reading session initialization
   */
  async renderBookContent(bookData) {
    readerLogger.debug('renderBookContent called', {
      bookId: this.bookId,
      bookTitle: bookData.book?.title,
      paginationVersion: '4.0',
      url: window.location.href
    });

    try {
      readerLogger.info('Rendering book with Pagination v4.0', {
        bookId: this.bookId,
        contentType: bookData.content?.type,
        url: window.location.href,
        urlParams: Object.fromEntries(new URLSearchParams(window.location.search))
      });

      // 1. Загрузили книгу - extract paragraphs for pagination
      let paragraphs = [];

        // Check if content has new blocks format (from BookService.parseContent)
      if (bookData.content?.blocks) {
        readerLogger.info('Using new blocks format for pagination (DIRECT blocks→paragraphs)', {
          blockCount: bookData.content.blocks.length,
          bookId: this.bookId,
          hasImages: bookData.content.blocks.some(block => block.kind === 'img')
        });

        // Log image blocks for debugging
        const imageBlocks = bookData.content.blocks.filter(block => block.kind === 'img');
        if (imageBlocks.length > 0) {
          readerLogger.info('Found image blocks:', imageBlocks.map(block => ({
            originalSrc: block.originalSrc,
            src: block.src,
            alt: block.alt
          })));
        }

        // ✅ DIRECT: blocks -> paragraphs (NO HTML round-trip)

        // 🔍 DIAGNOSTIC: Check for blocks with html but no text (will be filtered out)
        const badParas = bookData.content.blocks.filter(b =>
          b.kind === 'p' &&
          !((b.text || '').trim()) &&
          (b.html || '').trim()
        ).slice(0, 5);

        if (badParas.length > 0) {
          console.warn('🚨 [ReaderView] Found blocks with html but no text - will be filtered out:', badParas);
        }

        paragraphs = this.mapBlocksToParagraphs(bookData.content.blocks, this.bookId);

        readerLogger.debug('Paragraphs extracted from blocks', {
          count: paragraphs.length
        });

      }
      // Fallback to old formats for backward compatibility
      else if (bookData.content?.sections) {
        readerLogger.info('Using old sections format for pagination', {
          sectionsCount: bookData.content.sections.length,
          bookId: this.bookId
        });
        paragraphs = this.extractParagraphsFromSections(bookData.content.sections);

        // Log pagination data
        readerLogger.debug('Pagination data from sections', {
          totalParagraphs: paragraphs.length,
          imageParagraphs: paragraphs.filter(p => p.type === 'image').length,
          textParagraphs: paragraphs.filter(p => p.type !== 'image').length,
          sampleParagraphs: paragraphs.slice(0, 3).map(p => ({
            type: p.type,
            textLength: p.text?.length || 0,
            hasHtml: !!p.html,
            wordCount: p.wordCount
          }))
        });
      } else if (bookData.content?.html) {
        paragraphs = this.extractParagraphsFromHTML(bookData.content.html);
      }

      if (paragraphs.length === 0) {
        throw new Error('No readable content found in book');
      }

      // 2. Рассчитали страницы (тяжелая операция, делаем 1 раз)
      // Setup UI with basic book info first
      const contentHtml = `
        <div class="reader-viewer">
          <div class="book-content reader-text" id="reading-content">
            <!-- Content will be rendered by pagination system -->
          </div>
        </div>
      `;
      this.uiController.renderBookContent(bookData, contentHtml);

      // Initialize word highlighter for PageRenderer
      const readingContent = this.container.querySelector('#reading-content');
      if (readingContent) {
        this.wordHighlighter.initialize(this.container, this.wordPopover);

        // Initialize pagination with paragraphs
        await this.paginationController.setupPagination(readingContent, this.bookId, {
          paragraphs,
          useV4: true
        });
      }

      readerLogger.info('Book content rendered with Pagination v4.0', {
        bookId: this.bookId,
        paragraphs: paragraphs.length,
        paginationVersion: '4.0'
      });

    } catch (error) {
      readerLogger.error('Failed to render book content', error);
      this.uiController.showError(error);
    }
  }


  /**
   * Extract paragraphs from structured sections (for v4.0)
   */
  extractParagraphsFromSections(sections) {
    const paragraphs = [];

    const processSection = (section) => {
      // Add section title if present
      if (section.title) {
        paragraphs.push({
          text: section.title,
          type: 'title',
          title: section.title,
          wordCount: section.title.split(/\s+/).length
        });
      }

      // Process content blocks
      if (section.blocks) {
        section.blocks.forEach(block => {
          if (block.kind === 'p' && block.text) {
            paragraphs.push({
              text: block.text,
              type: 'regular',
              html: block.html,
              wordCount: block.text.split(/\s+/).length
            });
          } else if (block.kind === 'img') {
            // Include images in pagination as special paragraph type
            paragraphs.push({
              text: block.alt || '[Image]', // Alt text as fallback
              type: 'image',
              html: block.html || `<img src="${block.src}" alt="${block.alt || ''}" />`,
              src: block.src,
              alt: block.alt,
              wordCount: 0 // Images don't count as words
            });
          }
        });
      }

      // Process subsections recursively
      if (section.sections) {
        section.sections.forEach(processSection);
      }
    };

    sections.forEach(processSection);
    return paragraphs;
  }

  /**
   * ✅ blocks -> paragraphs (NO HTML round-trip)
   * Цель: сохранить структуру, не склеивать абзацы через <br>, не ломать интерактивность.
   */
  mapBlocksToParagraphs(blocks, bookId) {
    const paragraphs = [];

    for (const block of blocks) {
      if (!block) continue;

      // 1) Картинки
      if (block.kind === 'img') {
        // Важно: PageRenderer уже умеет type:'image' и html с <img>
        const imagePath = block.originalSrc || block.src || '';
        const src = imagePath ? `/book-images/${bookId}/${imagePath}` : '';

        paragraphs.push({
          type: 'image',
          text: block.alt || '[Image]',
          alt: block.alt || '',
          src,
          html: src
            ? `<img src="${src}" alt="${this.escapeHtml(block.alt || '')}" class="epub-image" loading="lazy" />`
            : `<div class="image-placeholder">[Image not available]</div>`,
          wordCount: 0
        });
        continue;
      }

      // 2) Текстовые блоки
      // Сейчас ваш ContentRenderer по факту обрабатывает 'p' и внутри может иметь block.type === 'fact' | 'list'
      if (block.kind === 'p') {
        const t = (block.text || '').trim();
        const html = block.html || (t ? this.escapeHtml(t) : '');

        // list/fact (если парсер BookService так помечает)
        if (block.type === 'list') {
          const items = (block.text || '').split('\n').map(s => s.trim()).filter(Boolean);
          const listHtml = `<li>${items.map(i => this.escapeHtml(i)).join('</li><li>')}</li>`;
          paragraphs.push({
            type: 'list',
            text: t || '[List]',
            html: listHtml,
            wordCount: 0
          });
          continue;
        }

        if (block.type === 'fact') {
          paragraphs.push({
            type: 'fact',
            title: block.title || '',
            text: t,
            html: html,           // PageRenderer fact-box добавит обвязку сам
            wordCount: t ? t.split(/\s+/).length : 0
          });
          continue;
        }

        // обычный параграф
        if (t || html) {
          paragraphs.push({
            type: 'regular',
            text: t,
            html,
            wordCount: t ? t.split(/\s+/).length : 0
          });
        }
        continue;
      }

      // 3) Если когда-то появятся новые kinds — не теряем контент
      // Фоллбек: пытаемся сохранить текст, чтобы не было "потери блоков"
      const fallbackText = (block.text || '').trim();
      if (fallbackText) {
        paragraphs.push({
          type: 'regular',
          text: fallbackText,
          html: this.escapeHtml(fallbackText),
          wordCount: fallbackText.split(/\s+/).length
        });
      }
    }

    return paragraphs;
  }

  /**
   * Escape HTML for security
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
  }

  /**
   * 🚑 FIX: Advanced Sanitizer
   * Превращает "грязный" HTML с <br> и метаданными в чистый список параграфов.
   */
  sanitizeHTMLContent(rawHTML) {
    // 1. Убираем старые артефакты merged-break, если они есть
    let clean = rawHTML.replace(/<span class="merged-break"><\/span>/g, '<br>');

    // 2. Превращаем двойные переносы <br><br> в разрыв параграфа
    clean = clean.replace(/(<br\s*\/?>\s*){2,}/gi, '</p><p>');

    // 3. Превращаем одиночные <br> в разрыв параграфа (для книг типа Алисы, где верстка через <br>)
    // ВАЖНО: Это меняет поведение для стихов, но спасает прозу.
    clean = clean.replace(/<br\s*\/?>/gi, '</p><p>');

    // 4. Оборачиваем "висячий" текст (без тегов p/div) в параграфы
    // (браузер сделает это сам при innerHTML, но лучше помочь ему с метаданными)

    return clean;
  }

  /**
   * Extract paragraphs from HTML content (fallback for v4.0)
   */
  /**
   * Extract paragraphs with smart merging of short blocks
   * 🚨 REFACTORED: Added pre-sanitization step
   */
  extractParagraphsFromHTML(html) {
    // console.log('📄 [ReaderView] extractParagraphsFromHTML called (Sanitized Version)', ...);


    // 🚨 STEP 1: SANITIZE & SPLIT
    // Сначала чистим HTML и разбиваем <br> на параграфы
    const sanitizedHtml = this.sanitizeHTMLContent(html);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizedHtml;

    // console.log('📄 [ReaderView] Parsed HTML structure', ...);


    const paragraphs = [];
    // 🚨 FIX: Ищем ВСЕ значимые блочные элементы
    // Добавляем blockquote, aside, ul, figure в селектор
    const elements = tempDiv.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, img, figure, aside, blockquote, ul, ol');

    // console.log('📄 [ReaderView] Found elements for pagination', ...);


    // Configuration for merging
    const MERGE_CONFIG = {
      targetWordCount: 120, // Aim for ~120 words per merged paragraph
      maxWordCount: 5000    // Limit to prevent text clipping
    };

    let buffer = null;

    const flushBuffer = () => {
      if (buffer) {
        // Logging reduced for performance
        paragraphs.push(buffer);
        buffer = null;
      }
    };

    elements.forEach(element => {
      const tagName = element.tagName.toLowerCase();
      const text = element.textContent.trim();

      // 🚨 FIX: Игнорируем пустые элементы, возникшие из-за сплита
      if (!text && tagName !== 'img' && tagName !== 'figure') return;

      // Читаем тип из data-атрибута (если есть) или выводим из тега
      const kind = element.dataset.kind || this.mapTagToKind(tagName);

      // 🚨 FIX: Блокировка слияния для Метаданных
      // Если строка похожа на "Title: ..." или "Author: ...", мы НЕ должны сливать её с текстом.
      // Это предотвращает создание "Мега-Абзаца" в начале книги.
      const isMetadata = /^(Title|Author|Release date|Language|Credits):/i.test(text);

      // 1. Handle Images (Always flush buffer, never merge)
      if (tagName === 'img') {
        flushBuffer();
        const alt = element.getAttribute('alt') || '';
        const dataImageId = element.getAttribute('data-image-id');

        paragraphs.push({
          text: alt || '[Image]',
          type: 'image',
          html: element.outerHTML,
          wordCount: 0, // Images don't count towards density
          src: element.src,
          imageId: dataImageId,
          alt: alt
        });
        return;
      }

      // 2. Handle Headers (Always flush buffer)
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        flushBuffer();
        const text = element.textContent.trim();
        if (text) {
          paragraphs.push({
            text: text,
            type: 'title',
            html: element.innerHTML,
            wordCount: text.split(/\s+/).length
          });
        }
        return;
      }

      // 2.5. Handle Metadata (Title, Author, etc.)
      if (isMetadata) {
        flushBuffer(); // Всегда сбрасываем буфер перед метой

        // Для меты создаем отдельный "fact" параграф, но без слияния
        paragraphs.push({
          text: text,
          type: 'fact', // Используем 'fact' для красивого отображения меты
          html: element.innerHTML,
          wordCount: text.split(/\s+/).length
        });
        return;
      }

      // 2.6. Handle Semantic Types (Title, Fact, Quote, List, Image)
      if (['title', 'fact', 'image', 'quote', 'list'].includes(kind)) {
         flushBuffer(); // Всегда сбрасываем буфер перед спец-блоками

         paragraphs.push({
             text: text,
             type: kind, // Передаем правильный тип в PageRenderer!
             html: element.outerHTML, // Берем весь блок целиком
             wordCount: text.split(/\s+/).length,
             // Доп. поля для картинок
             src: element.querySelector('img')?.src || element.src,
             alt: element.getAttribute('alt')
         });
         return;
      }

      // 3. Handle Regular Text (P, LI)
      const wordCount = text.split(/\s+/).length;
      const isRegular = tagName === 'p' || tagName === 'li';

      if (isRegular) {
        // Check if we should merge into buffer
        if (buffer && buffer.type === 'regular' &&
           (buffer.wordCount + wordCount <= MERGE_CONFIG.maxWordCount)) {

          // console.log('📄 [ReaderView] Merging paragraphs', ...);


          // MERGE ACTION
          buffer.text += ' ' + text;
          buffer.html += `<br><span class="merged-break"></span>` + element.innerHTML;
          buffer.wordCount += wordCount;

          // If buffer is now "big enough", flush it
          if (buffer.wordCount >= MERGE_CONFIG.targetWordCount) {
            flushBuffer();
          }
        } else {
          // Start new buffer
          flushBuffer();
          buffer = {
            text: text,
            type: 'regular',
            html: element.innerHTML,
            wordCount: wordCount
          };
        }
      } else {
        // Fallback for unknown tags
        flushBuffer();
      }
    });

    // Final flush
    flushBuffer();

    readerLogger.debug(`Extracted ${paragraphs.length} paragraphs from HTML`);
    return paragraphs;
  }

  /**
   * Clear view state (for reuse) - preserve component instances
   */
  clear() {
    // Clear UI state without destroying components
    this.uiController?.clear();

    // Clear word highlighter state but keep instance
    if (this.wordHighlighter) {
      // Reset word highlighter for new content
      this.wordHighlighter.destroy();
    }

    // Clear pagination state but keep controller instance
    // DON'T destroy paginationController here - it needs to be reused
    if (this.paginationController?.isUsingV4?.()) {
      // For v4.0, clear paginated state
      this.paginationController.pagedBook = null;
      this.paginationController.currentMode = 'scroll';
    }

    // Clear book data but keep component references
    this.currentBook = null;
    this.currentContent = null;

    readerLogger.debug('ReaderView cleared (components preserved)');
  }

  /**
   * Destroy view and cleanup all resources
   */
  destroy() {
    // ✅ ШАГ 5: Cleanup lazy loader listener
    if (this._lazyLoaderCleanup) {
      this._lazyLoaderCleanup();
      this._lazyLoaderCleanup = null;
    }

    // Destroy all components
    this.contentRenderer?.destroy();
    this.wordHighlighter?.destroy();
    this.paginationController?.destroy();
    this.bookLoader?.clear();
    this.uiController?.destroy();

    // ✅ FIX: Destroy wordPopover to prevent memory leaks
    if (this.wordPopover) {
      this.wordPopover.destroy();
    }

    // Clear book data
    this.currentBook = null;
    this.currentContent = null;

    // Clear references
    this.wordPopover = null;
    this.container = null;

    readerLogger.info('ReaderView destroyed', {
      paginationVersion: '4.0'
    });
  }

  /**
   * Map HTML tag to semantic kind
   */
  mapTagToKind(tagName) {
    if (['h1','h2','h3','h4'].includes(tagName)) return 'title';
    if (['img','figure'].includes(tagName)) return 'image';
    if (['aside'].includes(tagName)) return 'fact';
    if (['blockquote'].includes(tagName)) return 'quote';
    if (['ul','ol','li'].includes(tagName)) return 'list';
    return 'regular';
  }

  /**
   * Get reading statistics
   */
  getStats() {
    const paginationStats = this.paginationController?.getStats() || {};

    return {
      bookId: this.bookId,
      paginationVersion: paginationStats.version || '4.0',
      usePaginationV4: true,
      currentBook: this.currentBook ? {
        title: this.currentBook.title,
        author: this.currentBook.author,
        id: this.currentBook.id
      } : null,
      pagination: paginationStats,
      content: this.bookLoader?.getContentStats(),
      ui: this.uiController?.getState()
    };
  }
}