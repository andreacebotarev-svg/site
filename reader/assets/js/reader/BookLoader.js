/**
 * BookLoader - Responsible for loading book metadata and content
 * Handles book fetching, parsing, and state management
 */
export class BookLoader {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.bookService = options.bookService || null;

    this.currentBook = null;
    this.currentContent = null;

    this.options = {
      enableCaching: true,
      enableProgress: true,
      ...options
    };
  }

  /**
   * Load book by ID
   */
  async loadBook(bookId) {
    if (!bookId) {
      throw new Error('Book ID is required');
    }

    if (!this.bookService) {
      const { bookService } = await import('../services/book-service.js');
      this.bookService = bookService;
    }

    try {
      this.logger.info('Loading book metadata', { bookId });

      // Load book metadata
      const book = await this.bookService.getBook(bookId);

      if (!book) {
        throw new Error(`Book not found: ${bookId}`);
      }

      this.currentBook = book;
      this.logger.info('Book metadata loaded', {
        bookId,
        title: book.title,
        format: book.format
      });

      return book;
    } catch (error) {
      this.logger.error('Failed to load book metadata', error, { bookId });
      throw error;
    }
  }

  /**
   * Load book content
   */
  async loadBookContent(bookId) {
    if (!bookId) {
      throw new Error('Book ID is required');
    }

    if (!this.currentBook || this.currentBook.id !== bookId) {
      await this.loadBook(bookId);
    }

    try {
      this.logger.info('Loading book content', { bookId });

      // Load and parse content
      const content = await this.bookService.loadBookContent(bookId);

      this.currentContent = content;
      this.logger.info('Book content loaded', {
        bookId,
        sections: content.sections?.length || 0,
        hasHtml: !!content.html
      });

      return content;
    } catch (error) {
      this.logger.error('Failed to load book content', error, { bookId });
      throw error;
    }
  }

  /**
   * Load book with both metadata and content
   */
  async loadCompleteBook(bookId) {
    const book = await this.loadBook(bookId);
    const content = await this.loadBookContent(bookId);

    return {
      book,
      content
    };
  }

  /**
   * Check if book is available locally
   */
  async isBookAvailableLocally(bookId) {
    try {
      if (!this.bookService) {
        const { bookService } = await import('../services/book-service.js');
        this.bookService = bookService;
      }

      const book = await this.bookService.getBook(bookId);
      return !!book;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current book metadata
   */
  getCurrentBook() {
    return this.currentBook;
  }

  /**
   * Get current book content
   */
  getCurrentContent() {
    return this.currentContent;
  }

  /**
   * Clear current book data
   */
  clear() {
    this.currentBook = null;
    this.currentContent = null;
    this.logger.debug('Book data cleared');
  }

  /**
   * Get book statistics
   */
  getBookStats(bookId = null) {
    const book = bookId ? this.currentBook : this.currentBook;

    if (!book) return null;

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      format: book.format,
      size: book.size,
      wordCount: book.wordCount,
      source: book.source,
      uploadedAt: book.uploadedAt
    };
  }

  /**
   * Get content statistics
   */
  getContentStats(content = null) {
    const targetContent = content || this.currentContent;

    if (!targetContent) return null;

    return {
      hasHtml: !!targetContent.html,
      sectionsCount: targetContent.sections?.length || 0,
      hasMetadata: !!targetContent.metadata,
      wordCount: targetContent.metadata?.wordCount || 0
    };
  }

  /**
   * Preload book for faster access (cache warming)
   */
  async preloadBook(bookId) {
    try {
      this.logger.debug('Preloading book', { bookId });

      // Load metadata first
      await this.loadBook(bookId);

      // Optionally preload content in background
      if (this.options.enableCaching) {
        setTimeout(async () => {
          try {
            await this.loadBookContent(bookId);
            this.logger.debug('Book preloaded successfully', { bookId });
          } catch (error) {
            this.logger.warn('Failed to preload book content', error, { bookId });
          }
        }, 100);
      }

      return true;
    } catch (error) {
      this.logger.warn('Failed to preload book', error, { bookId });
      return false;
    }
  }

  /**
   * Destroy loader and cleanup
   */
  destroy() {
    this.clear();
    this.bookService = null;
    this.logger.info('BookLoader destroyed');
  }
}
