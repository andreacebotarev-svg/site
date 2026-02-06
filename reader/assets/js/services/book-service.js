/**
 * @fileoverview Book Service - Manages book data and storage
 * Handles IndexedDB operations for books, content, and images
 */

import { imageStorage } from './image-storage.js';
import { EPUBParser } from '../parsers/epub-parser.js';
import { FB2Parser } from '../parsers/fb2-parser.js';

/**
 * Book Service - Main service for book operations
 */
export class BookService {
  constructor() {
    this.db = null;
    this.dbPromise = null;
    this.logger = console;
    this.cache = new Map();
    this.contentCache = new Map();

    // Initialize parsers
    this.epubParser = new EPUBParser();
    this.fb2Parser = new FB2Parser();

    this.initializeDB();
  }

  /**
   * Legacy initDB method for backward compatibility
   * @deprecated Storage initialization is now handled by ImageStorage
   */
  async initDB() {
    console.log('[BookService] initDB is deprecated. Storage is handled by ImageStorage.');
    // Initialize legacy IndexedDB for books/content/progress if needed
    await this.initializeDB();
    return Promise.resolve();
  }

  /**
   * Initialize IndexedDB
   */
  async initializeDB() {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('ReaderDB', 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Books store
        if (!db.objectStoreNames.contains('books')) {
          const booksStore = db.createObjectStore('books', { keyPath: 'id' });
          booksStore.createIndex('title', 'title', { unique: false });
          booksStore.createIndex('author', 'author', { unique: false });
        }

        // Book content store
        if (!db.objectStoreNames.contains('bookContent')) {
          db.createObjectStore('bookContent', { keyPath: 'id' });
        }

        // Progress store
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'id' });
        }

        // Legacy imageBlobs store (kept for backward compatibility)
        if (!db.objectStoreNames.contains('imageBlobs')) {
          db.createObjectStore('imageBlobs');
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Save book to IndexedDB
   * @param {Object} book - Book object
   */
  async saveBook(book) {
    await this.initializeDB();

    // Save to database
    await this.saveToDB('books', book);

    // 🚨 CRITICAL: Clear cache so getAllBooks() returns updated list
    // Without this, new books won't appear in the library until page reload
    this.cache.delete('all');

    return true;
  }

  /**
   * Add book to library (Alias for saveBook)
   * @param {Object} book - Book object
   */
  async addBook(book) {
    return this.saveBook(book);
  }

  /**
   * Get book from IndexedDB
   * @param {string} bookId - Book ID
   * @returns {Object|null}
   */
  async getBook(bookId) {
    await this.initializeDB();
    return this.getFromDB('books', bookId);
  }

  /**
   * Get all books from IndexedDB
   * @returns {Array}
   */
  async getAllBooks() {
    await this.initializeDB();

    if (this.cache.has('all')) {
      return this.cache.get('all');
    }

    try {
      const books = await this.getAllFromDB('books');
      this.cache.set('all', books);
      return books;
    } catch (error) {
      this.logger.error('Failed to get all books:', error);
      return [];
    }
  }

  /**
   * Save book content to IndexedDB
   * @param {string} bookId - Book ID
   * @param {Object} content - Book content
   */
  async saveBookContent(bookId, content) {
    await this.initializeDB();

    console.log('💾 [BookService] Saving content to DB', {
      bookId,
      hasHtml: !!content.html,
      hasBlocks: !!content.blocks,
      hasSections: !!content.sections,
      blocksCount: content.blocks?.length,
      sectionsCount: content.sections?.length,
      htmlLength: content.html?.length
    });

    const contentData = {
      id: bookId,
      content: content,
      timestamp: Date.now()
    };
    // Clear cache to ensure fresh content is used
    this.contentCache.delete(bookId);
    return this.saveToDB('bookContent', contentData);
  }

  /**
   * Get book content from IndexedDB
   * @param {string} bookId - Book ID
   * @returns {Object|null}
   */
  async getBookContent(bookId) {
    await this.initializeDB();

    if (this.contentCache.has(bookId)) {
      const cached = this.contentCache.get(bookId);
      console.log('📖 [BookService] Retrieved content from CACHE', {
        bookId,
        hasHtml: !!cached.html,
        hasBlocks: !!cached.blocks,
        hasSections: !!cached.sections,
        blocksCount: cached.blocks?.length,
        sectionsCount: cached.sections?.length
      });
      return cached;
    }

    try {
      const contentData = await this.getFromDB('bookContent', bookId);
      if (contentData) {
        console.log('📖 [BookService] Retrieved content from DB', {
          bookId,
          hasHtml: !!contentData.content.html,
          hasBlocks: !!contentData.content.blocks,
          hasSections: !!contentData.content.sections,
          blocksCount: contentData.content.blocks?.length,
          sectionsCount: contentData.content.sections?.length,
          htmlLength: contentData.content.html?.length
        });
        this.contentCache.set(bookId, contentData.content);
        return contentData.content;
      }
      return null;
    } catch (error) {
      this.logger.error('Failed to get book content:', error);
      return null;
    }
  }

  /**
   * Load book content (Alias for getBookContent - compatibility with BookLoader)
   * @param {string} bookId - Book ID
   * @returns {Promise<Object|null>}
   */
  async loadBookContent(bookId) {
    return this.getBookContent(bookId);
  }

  /**
   * Save reading progress to IndexedDB
   * @param {string} bookId - Book ID
   * @param {Object} progress - Progress data
   */
  async saveProgress(bookId, progress) {
    await this.initializeDB();
    const progressData = {
      id: bookId,
      progress: progress,
      timestamp: Date.now()
    };
    return this.saveToDB('progress', progressData);
  }

  /**
   * Get reading progress from IndexedDB
   * @param {string} bookId - Book ID
   * @returns {Object|null}
   */
  async getProgress(bookId) {
    await this.initializeDB();
    try {
      const progressData = await this.getFromDB('progress', bookId);
      return progressData ? progressData.progress : null;
    } catch (error) {
      this.logger.error('Failed to get progress:', error);
      return null;
    }
  }

  /**
   * Save image blobs using imageStorage (OPFS or IndexedDB)
   * @param {string} bookId - Book identifier
   * @param {Map<string, Blob>} imageBlobs - Map of image path -> blob
   */
  async saveImageBlobs(bookId, imageBlobs) {
    console.warn('saveImageBlobs is deprecated, using imageStorage instead');

    // Convert Map to array of promises
    const savePromises = Array.from(imageBlobs.entries()).map(
      ([imagePath, blob]) => imageStorage.saveImage(bookId, imagePath, blob)
    );

    await Promise.all(savePromises);
    console.log(`✅ Saved ${imageBlobs.size} images for book ${bookId} via imageStorage`);
  }

  /**
   * Get image blob using imageStorage (OPFS or IndexedDB)
   * @param {string} bookId - Book identifier
   * @param {string} imagePath - Image path
   * @returns {Blob|null}
   */
  async getImageBlob(bookId, imagePath) {
    return await imageStorage.getImage(bookId, imagePath);
  }

  /**
   * Parse book content from file
   * @param {Blob} file - Book file data
   * @param {string} format - File format ('fb2', 'epub', 'txt')
   * @param {string} [bookId] - Optional book ID for EPUB image tracking
   * @returns {Promise<Object>} BookContent object with HTML and metadata
   */
  async parseContent(file, format, bookId = null) {
    // TODO: Move parsing to Web Worker to avoid UI freeze on large books (>50MB)
    // Currently blocks main thread - consider using book-parser.worker.js for heavy parsing
    // import Worker from '../workers/book-parser.worker.js?worker';

    console.log(`[BookService.parseContent] Starting: format=${format}, bookId=${bookId}`);

    try {
      let result;

      // Set bookId for EPUB parser if provided (for image tracking)
      if (bookId && this.epubParser && this.epubParser.setBookId) {
        console.log(`[BookService.parseContent] Setting EPUB parser bookId: ${bookId}`);
        this.epubParser.setBookId(bookId);
        console.log(`[BookService.parseContent] EPUB parser bookId set to: ${this.epubParser.bookId}`);
      } else {
        console.warn(`[BookService.parseContent] Cannot set bookId: epubParser=${!!this.epubParser}, bookId=${bookId}`);
      }

      switch (format.toLowerCase()) {
        case 'epub':
          result = await this.epubParser.parse(file);
          break;

        case 'fb2':
          result = await this.fb2Parser.parse(file);
          break;

        case 'txt':
          // Simple text parsing
          const text = await file.text();
          result = {
            html: `<div class="book-content">${text.replace(/\n/g, '<br>')}</div>`,
            metadata: {
              title: 'Text Document',
              author: 'Unknown',
              language: 'en'
            },
            sections: [{
              title: 'Content',
              html: `<div class="book-content">${text.replace(/\n/g, '<br>')}</div>`
            }],
            blocks: [{
              kind: 'p',
              text: text,
              type: 'regular',
              wordCount: text.split(/\s+/).length
            }]
          };
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      this.logger.info(`Parsed ${format.toUpperCase()} file successfully`);
      return result;

    } catch (error) {
      this.logger.error('Failed to parse book content:', error);
      throw new Error(`Failed to parse ${format} file: ${error.message}`);
    }
  }

  /**
   * Remove book and its images from storage
   * @param {string} bookId - Book identifier
   */
  async removeBookImages(bookId) {
    await imageStorage.deleteBook(bookId);
  }

  /**
   * Remove book from library
   * @param {string} bookId - Book ID
   * @returns {Promise<boolean>}
   */
  async removeBook(bookId) {
    try {
      // Remove from IndexedDB
      await this.deleteFromDB('books', bookId);
      await this.deleteFromDB('bookContent', bookId);
      await this.deleteFromDB('progress', bookId);

      // Remove images from storage (OPFS or IndexedDB)
      await this.removeBookImages(bookId);

      // Remove from localStorage
      const books = this.loadFromLocalStorage().filter(b => b.id !== bookId);
      this.saveToLocalStorage(books);

      // Invalidate cache
      this.cache.delete('all');
      this.cache.delete(bookId);
      this.contentCache.delete(bookId);

      this.logger.info('Book removed', { bookId });

      return true;
    } catch (error) {
      this.logger.error('Failed to remove book', { bookId, error });
      return false;
    }
  }

  /**
   * Load books from localStorage (fallback)
   * @returns {Array}
   */
  loadFromLocalStorage() {
    try {
      const booksJson = localStorage.getItem('reader-books');
      return booksJson ? JSON.parse(booksJson) : [];
    } catch (error) {
      this.logger.error('Failed to load books from localStorage:', error);
      return [];
    }
  }

  /**
   * Save books to localStorage (fallback)
   * @param {Array} books - Books array
   */
  saveToLocalStorage(books) {
    try {
      localStorage.setItem('reader-books', JSON.stringify(books));
    } catch (error) {
      this.logger.error('Failed to save books to localStorage:', error);
    }
  }

  /**
   * Save data to IndexedDB
   * @param {string} storeName - Store name
   * @param {Object} data - Data to save
   */
  async saveToDB(storeName, data) {
    await this.initializeDB();

    // 🛡️ HARDCORE FIX: Auto-fix keyPath issues for backward compatibility
    if (storeName === 'bookContent' && !data.id && data.bookId) {
      console.warn('[BookService] Auto-fixing missing ID for bookContent - using bookId as id');
      data.id = data.bookId; // Fix keyPath mismatch: IDB expects 'id', not 'bookId'
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get data from IndexedDB
   * @param {string} storeName - Store name
   * @param {string} key - Key
   * @returns {Object|null}
   */
  async getFromDB(storeName, key) {
    await this.initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all data from IndexedDB store
   * @param {string} storeName - Store name
   * @returns {Array}
   */
  async getAllFromDB(storeName) {
    await this.initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete data from IndexedDB
   * @param {string} storeName - Store name
   * @param {string} key - Key
   */
  async deleteFromDB(storeName, key) {
    await this.initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const bookService = new BookService();
