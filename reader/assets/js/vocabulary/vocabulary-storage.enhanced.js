/**
 * @fileoverview Enhanced Vocabulary Storage with indexing, caching, and optimization
 * @module EnhancedVocabularyStorage
 */

import { logger } from '../utils/logger.js';
import { globalState } from '../core/state-manager.js';

/**
 * @typedef {Object} Word
 * @property {string} id - Unique identifier
 * @property {string} word - The word
 * @property {string} [definition] - Definition
 * @property {string} [phonetic] - Phonetic transcription
 * @property {string} [translation] - Translation
 * @property {string} [context] - Usage context
 * @property {number} timestamp - Creation timestamp
 * @property {number} addedAt - When added
 * @property {number} repetitions - Number of reviews
 * @property {number} easeFactor - SM-2 ease factor
 * @property {number} interval - Review interval in days
 * @property {number} nextReview - Next review timestamp
 * @property {number} [lastReviewed] - Last review timestamp
 * @property {string[]} [tags] - Tags for organization
 * @property {number} [difficulty] - User-assigned difficulty (1-5)
 */

/**
 * Enhanced Vocabulary Storage with performance optimization
 * @class EnhancedVocabularyStorage
 */
export class EnhancedVocabularyStorage {
  constructor() {
    this.storageKey = 'reader_vocabulary';
    this.indexKey = 'reader_vocabulary_index';
    this.logger = logger.createChild('VocabularyStorage');

    // Единый нормализатор слов для всего проекта
    this._normalizeWord = (text) => text.toLowerCase().trim().replace(/[^\w\s'-]/g, '');
    
    // In-memory cache
    this.words = [];
    this.index = {
      byWord: new Map(),
      byTag: new Map(),
      byDueDate: new Map()
    };
    
    // Performance tracking
    this.stats = {
      hits: 0,
      misses: 0,
      writes: 0,
      readTime: 0,
      writeTime: 0
    };
    
    // Load data
    this.load();
    
    // Subscribe to state changes
    globalState.subscribe((state) => {
      // Sync with global state if needed
    }, ['vocabulary']);
    
    this.logger.info('Vocabulary storage initialized', { 
      words: this.words.length 
    });
  }
  
  /**
   * Load vocabulary from storage
   */
  load() {
    const startTime = performance.now();

    try {
      const data = localStorage.getItem(this.storageKey);
      this.words = data ? JSON.parse(data) : [];

      // Ensure array is extensible (fix for frozen/sealed arrays)
      if (!Object.isExtensible(this.words)) {
        this.logger.warn('Words array is not extensible, creating new array');
        this.words = [...this.words];
      }

      // Clear indices first to prevent stale data
      this.index = {
        byWord: new Map(),
        byTag: new Map(),
        byDueDate: new Map()
      };

      // Build indices
      this._buildIndices();
      
      // Update global state
      this._syncToState();
      
      const duration = performance.now() - startTime;
      this.stats.readTime += duration;
      
      this.logger.debug('Loaded vocabulary', { 
        count: this.words.length,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return this.words;
    } catch (error) {
      this.logger.error('Failed to load vocabulary', error);
      return [];
    }
  }
  
  /**
   * Save vocabulary to storage
   */
  save() {
    const startTime = performance.now();
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.words));
      this.stats.writes++;
      
      const duration = performance.now() - startTime;
      this.stats.writeTime += duration;
      
      this.logger.debug('Saved vocabulary', { 
        count: this.words.length,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return true;
    } catch (error) {
      this.logger.error('Failed to save vocabulary', error);
      return false;
    }
  }
  
  /**
   * Add word with validation and deduplication
   * @param {Partial<Word>} wordData - Word data
   * @returns {Word} Added word
   */
  addWord(wordData) {
    // Critical fix: Ensure words array is always extensible
    if (!Object.isExtensible(this.words)) {
      this.logger.warn('Words array is not extensible at addWord start, fixing...');
      this.words = [...this.words];
    }

    // Validate required fields
    if (!wordData.word || typeof wordData.word !== 'string') {
      throw new Error('Word is required and must be a string');
    }

    const normalizedWord = this._normalizeWord(wordData.word);
    
    // Check if word already exists
    const existingIndex = this.index.byWord.get(normalizedWord);
    
    const wordEntry = {
      id: existingIndex !== undefined ? this.words[existingIndex].id : this._generateId(),
      word: normalizedWord,
      definition: wordData.definition || '',
      phonetic: wordData.phonetic || '',
      translation: wordData.translation || '',
      context: wordData.context || '',
      timestamp: wordData.timestamp || Date.now(),
      addedAt: existingIndex !== undefined ? this.words[existingIndex].addedAt : Date.now(),
      repetitions: existingIndex !== undefined ? this.words[existingIndex].repetitions : 0,
      easeFactor: existingIndex !== undefined ? this.words[existingIndex].easeFactor : 2.5,
      interval: existingIndex !== undefined ? this.words[existingIndex].interval : 0,
      nextReview: existingIndex !== undefined ? this.words[existingIndex].nextReview : Date.now(),
      lastReviewed: existingIndex !== undefined ? this.words[existingIndex].lastReviewed : null,
      tags: wordData.tags || [],
      difficulty: wordData.difficulty || 3
    };
    
    if (existingIndex !== undefined) {
      // Update existing word
      this.words[existingIndex] = wordEntry;
      this.logger.debug('Updated word', { word: normalizedWord });
    } else {
      // Ensure array is extensible before adding
      if (!Object.isExtensible(this.words)) {
        this.logger.warn('Words array became non-extensible, recreating array', {
          wasFrozen: Object.isFrozen(this.words),
          wasSealed: Object.isSealed(this.words),
          length: this.words.length
        });
        this.words = [...this.words];
        this.logger.info('Words array recreated, now extensible:', Object.isExtensible(this.words));
      }

      // Add new word
      this.words.push(wordEntry);
      this.logger.info('Added word', { word: normalizedWord, totalWords: this.words.length });
    }
    
    // Update indices
    this._updateIndices(wordEntry);
    
    // Save and sync
    this.save();
    this._syncToState();
    
    return wordEntry;
  }
  
  /**
   * Remove word by ID
   * @param {string} wordId - Word ID
   */
  removeWord(wordId) {
    const index = this.words.findIndex(w => w.id === wordId);
    
    if (index === -1) {
      this.logger.warn('Word not found for removal', { wordId });
      return false;
    }
    
    const word = this.words[index];
    this.words.splice(index, 1);
    
    // Update indices
    this._rebuildIndices();
    
    this.save();
    this._syncToState();
    
    this.logger.info('Removed word', { word: word.word });
    return true;
  }

  /**
   * Update word fields explicitly
   * @param {string} wordId - Word ID
   * @param {Object} updates - Fields to update
   * @returns {boolean} Success
   */
  updateWord(wordId, updates) {
    const index = this.words.findIndex(w => w.id === wordId);
    if (index === -1) {
      this.logger.warn('Word not found for update', { wordId });
      return false;
    }

    // Merge updates
    this.words[index] = { 
      ...this.words[index], 
      ...updates,
      // Ensure specific fields are preserved if not explicitly updated
      // but 'updates' takes precedence
    };

    // Update indices
    this._updateIndices(this.words[index], index);

    this.save();
    this._syncToState();
    
    this.logger.debug('Updated word fields', { wordId, fields: Object.keys(updates) });
    return true;
  }
  
  /**
   * Get word by ID with caching
   * @param {string} wordId - Word ID
   * @returns {Word|undefined} Word
   */
  getWord(wordId) {
    const word = this.words.find(w => w.id === wordId);
    
    if (word) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    
    return word;
  }
  
  /**
   * Get all words
   * @returns {Word[]} All words
   */
  getAllWords() {
    return [...this.words];
  }

  /**
   * Check if word is saved in vocabulary
   * @param {string} word - Word to check
   * @returns {boolean} True if word is saved
   */
  isWordSaved(word) {
    if (!word || typeof word !== 'string') return false;
    const normalizedWord = this._normalizeWord(word);

    const hasInIndex = this.index.byWord.has(normalizedWord);
    const wordIndex = this.index.byWord.get(normalizedWord);
    const wordInArray = wordIndex !== undefined ? this.words[wordIndex] : null;

    console.log(`isWordSaved("${word}") -> normalized: "${normalizedWord}", hasInIndex: ${hasInIndex}, wordIndex: ${wordIndex}, wordInArray:`, wordInArray);

    return hasInIndex;
  }
  
  /**
   * Get words due for review
   * @param {number} [timestamp] - Current timestamp (defaults to now)
   * @returns {Word[]} Due words
   */
  getDueWords(timestamp = Date.now()) {
    return this.words.filter(w => w.nextReview <= timestamp);
  }
  
  /**
   * Search words by query
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @returns {Word[]} Matching words
   */
  search(query, options = {}) {
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return [];
    
    return this.words.filter(word => {
      const matchWord = word.word.includes(normalizedQuery);
      const matchDefinition = options.includeDefinitions && 
        word.definition.toLowerCase().includes(normalizedQuery);
      const matchTranslation = options.includeTranslations && 
        word.translation.toLowerCase().includes(normalizedQuery);
      
      return matchWord || matchDefinition || matchTranslation;
    });
  }
  
  /**
   * Get words by tag
   * @param {string} tag - Tag name
   * @returns {Word[]} Words with tag
   */
  getWordsByTag(tag) {
    const wordIds = this.index.byTag.get(tag) || [];
    return wordIds.map(id => this.getWord(id)).filter(Boolean);
  }
  
  /**
   * Update word review using SM-2 algorithm
   * @param {string} wordId - Word ID
   * @param {number} quality - Quality rating (0-3)
   * @returns {Word|null} Updated word
   */
  updateWordReview(wordId, quality) {
    const wordIndex = this.words.findIndex(w => w.id === wordId);
    if (wordIndex === -1) {
      this.logger.warn('Word not found for review update', { wordId });
      return null;
    }

    const word = this.words[wordIndex];

    // SM-2 Algorithm implementation
    const { repetitions, easeFactor, interval } = this._calculateSM2(
      word.repetitions,
      word.easeFactor,
      word.interval,
      quality
    );

    // Create updated word object (avoiding potential frozen object issues)
    const updatedWord = {
      ...word,
      repetitions,
      easeFactor,
      interval,
      nextReview: Date.now() + (interval * 24 * 60 * 60 * 1000),
      lastReviewed: Date.now()
    };

    // Replace the word in the array
    this.words[wordIndex] = updatedWord;

    // Update indices
    this._updateIndices(updatedWord);

    this.save();
    this._syncToState();

    this.logger.debug('Updated word review', {
      word: updatedWord.word,
      quality,
      nextInterval: `${interval}d`
    });

    return updatedWord;
  }
  
  /**
   * Batch update multiple words
   * @param {Function} updater - Update function
   */
  batchUpdate(updater) {
    this.words = this.words.map(updater);
    this._rebuildIndices();
    this.save();
    this._syncToState();
    
    this.logger.info('Batch update completed', { count: this.words.length });
  }
  
  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const now = Date.now();
    const due = this.getDueWords(now);
    const mastered = this.words.filter(w => w.repetitions >= 5);
    const avgEase = this.words.reduce((sum, w) => sum + w.easeFactor, 0) / this.words.length || 2.5;
    
    return {
      total: this.words.length,
      due: due.length,
      mastered: mastered.length,
      avgEaseFactor: avgEase.toFixed(2),
      performance: {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate: `${((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 || 0).toFixed(1)}%`,
        writes: this.stats.writes,
        avgReadTime: `${(this.stats.readTime / (this.stats.hits + this.stats.misses || 1)).toFixed(2)}ms`,
        avgWriteTime: `${(this.stats.writeTime / (this.stats.writes || 1)).toFixed(2)}ms`
      }
    };
  }
  
  /**
   * Export vocabulary as JSON
   * @returns {string} JSON string
   */
  export() {
    return JSON.stringify(this.words, null, 2);
  }
  
  /**
   * Import vocabulary from JSON
   * @param {string} data - JSON string
   * @returns {boolean} Success
   */
  import(data) {
    try {
      const words = JSON.parse(data);
      if (!Array.isArray(words)) {
        throw new Error('Invalid format: expected array');
      }
      
      this.words = words;
      this._rebuildIndices();
      this.save();
      this._syncToState();
      
      this.logger.info('Imported vocabulary', { count: words.length });
      return true;
    } catch (error) {
      this.logger.error('Import failed', error);
      return false;
    }
  }
  
  /**
   * Clear all vocabulary
   */
  clear() {
    this.words = [];
    this.index = {
      byWord: new Map(),
      byTag: new Map(),
      byDueDate: new Map()
    };
    this.save();
    this._syncToState();
    
    this.logger.info('Vocabulary cleared');
  }
  
  // Private methods
  
  /**
   * SM-2 Algorithm implementation
   * @private
   */
  _calculateSM2(repetitions, easeFactor, interval, quality) {
    // Quality: 0=again, 1=hard, 2=good, 3=easy
    
    if (quality < 2) {
      // Failed or hard - reset
      repetitions = 0;
      interval = 0;
    } else {
      repetitions += 1;
      
      // Calculate new ease factor
      let newEF = easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
      newEF = Math.max(1.3, newEF);
      
      easeFactor = newEF;
      
      // Calculate interval
      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    }
    
    return { repetitions, easeFactor, interval };
  }
  
  /**
   * Calculate SM-2 algorithm for spaced repetition
   * @public
   */
  calculateSM2(repetitions, easeFactor, interval, quality) {
    return this._calculateSM2(repetitions, easeFactor, interval, quality);
  }

  /**
   * Build all indices
   * @private
   */
  _buildIndices() {
    this.index = {
      byWord: new Map(),
      byTag: new Map(),
      byDueDate: new Map()
    };
    
    this.words.forEach((word, index) => {
      this._updateIndices(word, index);
    });
  }
  
  /**
   * Rebuild indices
   * @private
   */
  _rebuildIndices() {
    this._buildIndices();
  }
  
  /**
   * Update indices for a word
   * @private
   */
  _updateIndices(word, index) {
    const wordIndex = index !== undefined ? index : this.words.findIndex(w => w.id === word.id);
    
    // By word
    this.index.byWord.set(word.word, wordIndex);
    
    // By tags
    if (word.tags) {
      word.tags.forEach(tag => {
        if (!this.index.byTag.has(tag)) {
          this.index.byTag.set(tag, []);
        }
        const tagWords = this.index.byTag.get(tag);
        if (!tagWords.includes(word.id)) {
          tagWords.push(word.id);
        }
      });
    }
  }
  
  /**
   * Sync to global state
   * @private
   */
  _syncToState() {
    globalState.setState(state => ({
      ...state,
      vocabulary: {
        words: [...this.words], // Send copy to prevent freezing of internal array
        dueCount: this.getDueWords().length,
        totalCount: this.words.length
      }
    }), 'VOCABULARY_SYNC');
  }
  
  /**
   * Generate unique ID
   * @private
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const vocabularyStorage = new EnhancedVocabularyStorage();

