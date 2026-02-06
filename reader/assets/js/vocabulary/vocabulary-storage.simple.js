/**
 * @fileoverview * Simple vocabulary storage (localStorage based)
 * @module SimpleVocabularyStorage
 * @deprecated Use vocabulary-storage.enhanced.js instead. This module is kept for migration purposes only.
 */

/**
 * Word status constants - simple 3-level system
 * @enum {string}
 */
export const WORD_STATUS = {
  TO_KNOW: 'to_know',      // Новое слово, нужно начать изучение
  LEARNING: 'learning',    // В процессе изучения (показывается в flashcards)
  KNOWN: 'known'          // Выучено, mastery достигнуто
};

/**
 * @typedef {Object} SimpleWord
 * @property {string} id - Unique identifier
 * @property {string} word - The word (normalized, lowercase)
 * @property {string} translation - Russian translation
 * @property {string} phonetic - Phonetic transcription (optional)
 * @property {WORD_STATUS} status - Current learning status
 * @property {number} reviewCount - How many times reviewed
 * @property {number} addedAt - When word was added (timestamp)
 * @property {number} [lastReviewed] - Last review timestamp (optional)
 */

/**
 * Simple Vocabulary Storage with 3-status system
 * Much simpler than SM-2, focused on user experience
 * @class SimpleVocabularyStorage
 */
export class SimpleVocabularyStorage {
  constructor() {
    this.storageKey = 'reader_vocabulary_v2'; // New version to distinguish from SM-2
    this.logger = console; // Simple logging, no complex logger

    // In-memory storage
    this.words = [];

    // Simple normalization
    this._normalizeWord = (text) => text.toLowerCase().trim().replace(/[^\w\s'-]/g, '');

    // Load data
    this.load();
  }

  /**
   * Load vocabulary from localStorage
   */
  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      this.words = data ? JSON.parse(data) : [];

      // Ensure all words have required fields (migration safety)
      this.words = this.words.map(word => this._ensureValidWord(word));

      this.logger.log(`Loaded ${this.words.length} words from storage`);
      return this.words;
    } catch (error) {
      this.logger.error('Failed to load vocabulary:', error);
      this.words = [];
      return [];
    }
  }

  /**
   * Save vocabulary to localStorage
   */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.words));
      this.logger.log(`Saved ${this.words.length} words to storage`);
      return true;
    } catch (error) {
      this.logger.error('Failed to save vocabulary:', error);
      return false;
    }
  }

  /**
   * Add new word to vocabulary
   * @param {Object} wordData
   * @param {string} wordData.word - The word
   * @param {string} wordData.translation - Translation
   * @param {string} [wordData.phonetic] - Phonetic (optional)
   * @returns {SimpleWord} Added word
   */
  addWord(wordData) {
    if (!wordData.word || typeof wordData.word !== 'string') {
      throw new Error('Word is required and must be a string');
    }

    const normalizedWord = this._normalizeWord(wordData.word);

    // Check if word already exists
    const existingWord = this.words.find(w => w.word === normalizedWord);
    if (existingWord) {
      this.logger.log(`Word "${normalizedWord}" already exists, skipping`);
      return existingWord;
    }

    const word = {
      id: this._generateId(),
      word: normalizedWord,
      translation: wordData.translation || '',
      phonetic: wordData.phonetic || '',
      status: WORD_STATUS.TO_KNOW,
      reviewCount: 0,
      addedAt: Date.now(),
      lastReviewed: null
    };

    this.words.push(word);
    this.save();

    this.logger.log(`Added word "${normalizedWord}" to vocabulary`);
    return word;
  }

  /**
   * Update non-status word fields (translation/phonetic/etc)
   * @param {string} wordId
   * @param {Object} updates
   * @param {string} [updates.translation]
   * @param {string} [updates.phonetic]
   * @returns {boolean}
   */
  updateWordData(wordId, updates = {}) {
    const word = this.words.find(w => w.id === wordId);
    if (!word) return false;

    let changed = false;

    if ('translation' in updates && typeof updates.translation === 'string' && updates.translation.trim() !== '') {
      if (word.translation !== updates.translation) {
        word.translation = updates.translation;
        changed = true;
      }
    }

    if ('phonetic' in updates && typeof updates.phonetic === 'string' && updates.phonetic.trim() !== '') {
      if (word.phonetic !== updates.phonetic) {
        word.phonetic = updates.phonetic;
        changed = true;
      }
    }

    if (changed) {
      this.save();
      this.logger.log(`Updated word data for "${word.word}"`);
    }

    return changed;
  }

  /**
   * Update word fields by word text (used to "glue" API translations to existing vocab entries)
   * @param {string} wordText
   * @param {Object} updates
   * @returns {boolean}
   */
  updateWordByText(wordText, updates = {}) {
    if (!wordText || typeof wordText !== 'string') return false;
    const normalized = this._normalizeWord(wordText);
    const word = this.words.find(w => w.word === normalized);
    if (!word) return false;
    return this.updateWordData(word.id, updates);
  }

  /**
   * Update word status
   * @param {string} wordId - Word ID
   * @param {WORD_STATUS} newStatus - New status
   * @returns {boolean} Success
   */
  updateStatus(wordId, newStatus) {
    if (!Object.values(WORD_STATUS).includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const word = this.words.find(w => w.id === wordId);
    if (!word) {
      this.logger.warn(`Word ${wordId} not found for status update`);
      return false;
    }

    const oldStatus = word.status;
    word.status = newStatus;
    word.lastReviewed = Date.now();

    // If moving to LEARNING, increment review count
    if (newStatus === WORD_STATUS.LEARNING && oldStatus !== WORD_STATUS.LEARNING) {
      word.reviewCount = (word.reviewCount || 0) + 1;
    }

    this.save();
    this.logger.log(`Updated "${word.word}" status: ${oldStatus} → ${newStatus}`);
    return true;
  }

  /**
   * Get word by ID
   * @param {string} wordId
   * @returns {SimpleWord|null}
   */
  getWord(wordId) {
    return this.words.find(w => w.id === wordId) || null;
  }

  /**
   * Get all words
   * @returns {SimpleWord[]}
   */
  getAllWords() {
    return [...this.words];
  }

  /**
   * Get words by status
   * @param {WORD_STATUS} status
   * @returns {SimpleWord[]}
   */
  getWordsByStatus(status) {
    return this.words.filter(w => w.status === status);
  }

  /**
   * Check if word exists in vocabulary
   * @param {string} wordText
   * @returns {boolean}
   */
  hasWord(wordText) {
    const normalized = this._normalizeWord(wordText);
    return this.words.some(w => w.word === normalized);
  }

  /**
   * Search words by query
   * @param {string} query
   * @returns {SimpleWord[]}
   */
  search(query) {
    if (!query || query.length < 2) return [];

    const normalizedQuery = query.toLowerCase().trim();
    return this.words.filter(word =>
      word.word.includes(normalizedQuery) ||
      word.translation.toLowerCase().includes(normalizedQuery)
    );
  }

  /**
   * Remove word by ID
   * @param {string} wordId
   * @returns {boolean} Success
   */
  removeWord(wordId) {
    const index = this.words.findIndex(w => w.id === wordId);
    if (index === -1) return false;

    const word = this.words[index];
    this.words.splice(index, 1);
    this.save();

    this.logger.log(`Removed word "${word.word}" from vocabulary`);
    return true;
  }

  /**
   * Get statistics
   * @returns {Object} Stats object
   */
  getStatistics() {
    const total = this.words.length;
    const toKnow = this.words.filter(w => w.status === WORD_STATUS.TO_KNOW).length;
    const learning = this.words.filter(w => w.status === WORD_STATUS.LEARNING).length;
    const known = this.words.filter(w => w.status === WORD_STATUS.KNOWN).length;

    return {
      total,
      byStatus: {
        [WORD_STATUS.TO_KNOW]: toKnow,
        [WORD_STATUS.LEARNING]: learning,
        [WORD_STATUS.KNOWN]: known
      },
      completionRate: total > 0 ? Math.round((known / total) * 100) : 0
    };
  }

  /**
   * Clear all vocabulary
   */
  clear() {
    this.words = [];
    this.save();
    this.logger.log('Vocabulary cleared');
  }

  /**
   * Export vocabulary as JSON
   * @returns {string}
   */
  export() {
    return JSON.stringify(this.words, null, 2);
  }

  /**
   * Import vocabulary from JSON
   * @param {string} jsonData
   * @returns {boolean} Success
   */
  import(jsonData) {
    try {
      const words = JSON.parse(jsonData);
      if (!Array.isArray(words)) {
        throw new Error('Invalid format: expected array');
      }

      // Validate and ensure all words are valid
      this.words = words.map(word => this._ensureValidWord(word));
      this.save();

      this.logger.log(`Imported ${this.words.length} words`);
      return true;
    } catch (error) {
      this.logger.error('Import failed:', error);
      return false;
    }
  }

  // Private methods

  /**
   * Generate unique ID
   * @private
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure word has all required fields (for migration/backward compatibility)
   * @private
   */
  _ensureValidWord(word) {
    return {
      id: word.id || this._generateId(),
      word: this._normalizeWord(word.word || ''),
      translation: word.translation || '',
      phonetic: word.phonetic || '',
      status: word.status || WORD_STATUS.TO_KNOW,
      reviewCount: word.reviewCount || 0,
      addedAt: word.addedAt || Date.now(),
      lastReviewed: word.lastReviewed || null
    };
  }
}

// Singleton instance
export const simpleVocabularyStorage = new SimpleVocabularyStorage();
