/**
 * @fileoverview Reading Progress Service
 * @module ReadingProgress
 */

import { logger } from '../utils/logger.js';

const progressLogger = logger.createChild('ReadingProgress');

/**
 * @typedef {Object} ReadingProgress
 * @property {string} bookId - Book ID
 * @property {number} position - Current position (0-1)
 * @property {string} sectionId - Current section ID
 * @property {number} lastRead - Last read timestamp
 * @property {number} timeSpent - Total time spent reading (ms)
 */

/**
 * Reading Progress Service
 * @class ReadingProgressService
 */
export class ReadingProgressService {
  constructor() {
    this.logger = progressLogger;
    this.storageKey = 'reader_progress';
    this.progress = this.load();
    
    this.logger.info('Reading progress service initialized');
  }
  
  /**
   * Load progress from localStorage
   * @returns {Map<string, ReadingProgress>}
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return new Map();
      
      const data = JSON.parse(stored);
      return new Map(Object.entries(data));
    } catch (error) {
      this.logger.error('Failed to load progress', error);
      return new Map();
    }
  }
  
  /**
   * Save progress to localStorage
   */
  save() {
    try {
      const data = Object.fromEntries(this.progress);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      this.logger.error('Failed to save progress', error);
    }
  }
  
  /**
   * Get progress for book
   * @param {string} bookId - Book ID
   * @returns {ReadingProgress|null}
   */
  getProgress(bookId) {
    return this.progress.get(bookId) || null;
  }
  
  /**
   * Update progress
   * @param {string} bookId - Book ID
   * @param {Partial<ReadingProgress>} update - Progress update
   */
  updateProgress(bookId, update) {
    const existing = this.progress.get(bookId) || {
      bookId,
      position: 0,
      sectionId: null,
      lastRead: Date.now(),
      timeSpent: 0
    };
    
    const updated = {
      ...existing,
      ...update,
      lastRead: Date.now()
    };
    
    this.progress.set(bookId, updated);
    this.save();
    
    this.logger.debug('Progress updated', { bookId, position: updated.position });
  }
  
  /**
   * Get recently read books
   * @param {number} [limit=10] - Number of books
   * @returns {ReadingProgress[]}
   */
  getRecentlyRead(limit = 10) {
    return Array.from(this.progress.values())
      .sort((a, b) => b.lastRead - a.lastRead)
      .slice(0, limit);
  }
  
  /**
   * Clear progress for book
   * @param {string} bookId - Book ID
   */
  clearProgress(bookId) {
    this.progress.delete(bookId);
    this.save();
  }
}

// Singleton instance
export const readingProgress = new ReadingProgressService();

