/**
 * LESSON STORAGE MODULE - Dual System v2.0
 * Handles Global Master Storage, Lesson-scoped Legacy Storage, and Performance Caching
 */

class LessonStorage {
  static GLOBAL_KEY = 'vocabulary-global';
  static MIGRATION_KEY = 'vocabulary-migration-done';
  static _cache = null;

  constructor(lessonId) {
    this.lessonId = lessonId;
    this.storageKey = `lesson-${lessonId}-words`;
    this.statusKey = `lesson-${lessonId}-word-statuses`;
    
    // Automatically check for migration on init
    this._checkMigration();
  }

  /**
   * Check if migration from legacy storage is needed
   * @private
   */
  _checkMigration() {
    if (!localStorage.getItem(LessonStorage.MIGRATION_KEY)) {
      this.migrateFromLegacy();
    }
  }

  /**
   * Check if a word is saved globally (uses performance cache)
   * @param {string} word - Word to check
   * @returns {boolean}
   */
  isWordSavedGlobally(word) {
    if (!word) return false;
    const wordKey = word.toLowerCase();
    
    // 1. Check in-memory cache first (O(1))
    if (LessonStorage._cache && LessonStorage._cache.expiry > Date.now()) {
      return LessonStorage._cache.words.has(wordKey);
    }

    // 2. Cache miss or expired - rebuild from localStorage
    const globalData = this._getGlobalData();
    LessonStorage._cache = {
      words: new Set(Object.keys(globalData)),
      expiry: Date.now() + (5 * 60 * 1000) // 5 minute TTL
    };

    return LessonStorage._cache.words.has(wordKey);
  }

  /**
   * Add a word to saved words (Dual Writing)
   * @param {Object} wordData - {word, definition, phonetic}
   * @returns {boolean} Success status
   */
  addWord(wordData) {
    if (!wordData || !wordData.word) return false;
    
    const wordKey = wordData.word.toLowerCase();
    const now = Date.now();

    // --- 1. GLOBAL MASTER STORAGE ---
    const global = this._getGlobalData();
    if (global[wordKey]) {
      // Update existing entry
      global[wordKey].lastReviewed = now;
      if (!global[wordKey].lessons.includes(this.lessonId)) {
        global[wordKey].lessons.push(this.lessonId);
      }
      if (!global[wordKey].metadata) global[wordKey].metadata = { reviewCount: 0, masteryLevel: 0 };
      global[wordKey].metadata.reviewCount++;
    } else {
      // Create new global entry
      global[wordKey] = {
        word: wordData.word,
        definition: wordData.definition,
        phonetic: wordData.phonetic || '',
        firstSaved: now,
        lastReviewed: now,
        lessons: [this.lessonId],
        status: 'to-learn',
        metadata: {
          reviewCount: 1,
          masteryLevel: 0
        }
      };
    }
    this._saveGlobalData(global);

    // --- 2. LEGACY SCOPED STORAGE (Backward Compatibility) ---
    const legacy = this.loadWords();
    if (!legacy.some(w => w.word.toLowerCase() === wordKey)) {
      legacy.push({
        word: wordData.word,
        definition: wordData.definition,
        phonetic: wordData.phonetic || '',
        timestamp: now
      });
      localStorage.setItem(this.storageKey, JSON.stringify(legacy));
    }

    // Invalidate cache
    LessonStorage._cache = null;
    return true;
  }

  /**
   * Remove a word from both global and legacy storage
   * @param {string} word - Word to remove
   * @returns {boolean} Success status
   */
  removeWord(word) {
    if (!word) return false;
    const wordKey = word.toLowerCase();

    // 1. Remove from Global Master
    const global = this._getGlobalData();
    if (global[wordKey]) {
      delete global[wordKey];
      this._saveGlobalData(global);
    }

    // 2. Remove from Legacy Scoped
    let legacy = this.loadWords();
    const initialLength = legacy.length;
    legacy = legacy.filter(w => w.word.toLowerCase() !== wordKey);
    
    if (legacy.length !== initialLength) {
      localStorage.setItem(this.storageKey, JSON.stringify(legacy));
    }

    // Invalidate cache
    LessonStorage._cache = null;
    return true;
  }

  /**
   * Load words for the CURRENT lesson (from legacy storage)
   * @returns {Array} Array of word objects
   */
  loadWords() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading legacy words:', e);
      return [];
    }
  }

  /**
   * Load ALL words from global storage
   * @returns {Array} Sorted by last interaction
   */
  loadAllGlobalWords() {
    const global = this._getGlobalData();
    return Object.values(global).sort((a, b) => b.lastReviewed - a.lastReviewed);
  }

  /**
   * Check if word is saved (Proxy to global check)
   */
  isWordSaved(word) {
    return this.isWordSavedGlobally(word);
  }

  /**
   * Clear all saved words (Both Legacy and Global)
   */
  clearAll() {
    // 1. Clear Legacy
    localStorage.removeItem(this.storageKey);
    
    // 2. Clear Global
    localStorage.removeItem(LessonStorage.GLOBAL_KEY);
    
    // 3. Invalidate cache
    LessonStorage._cache = null;
  }

  /**
   * Migrate all legacy lesson-scoped data to global storage
   */
  migrateFromLegacy() {
    console.log('🔄 Starting Storage Migration to Dual System...');
    const global = this._getGlobalData();
    let migratedCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const match = key.match(/^lesson-(.*)-words$/);
      if (!match) continue;

      const lessonId = match[1];
      try {
        const words = JSON.parse(localStorage.getItem(key) || '[]');
        words.forEach(w => {
          const wordKey = w.word.toLowerCase();
          if (!global[wordKey]) {
            global[wordKey] = {
              word: w.word,
              definition: w.definition,
              phonetic: w.phonetic || '',
              firstSaved: w.timestamp || Date.now(),
              lastReviewed: w.timestamp || Date.now(),
              lessons: [lessonId],
              status: 'to-learn',
              metadata: { reviewCount: 1, masteryLevel: 0 }
            };
            migratedCount++;
          } else if (!global[wordKey].lessons.includes(lessonId)) {
            global[wordKey].lessons.push(lessonId);
          }
        });
      } catch (e) {
        console.error(`Migration error for key ${key}:`, e);
      }
    }

    this._saveGlobalData(global);
    localStorage.setItem(LessonStorage.MIGRATION_KEY, 'true');
    console.log(`✅ Migration complete: ${migratedCount} unique words unified.`);
  }

  // ========================================
  // KANBAN & STATUS LOGIC
  // ========================================

  /**
   * Get word status (Priority: Global > Lesson-scoped)
   */
  getWordStatus(word) {
    if (!word) return 'to-learn';
    const wordKey = word.toLowerCase();
    
    // Try global storage first
    const global = this._getGlobalData();
    if (global[wordKey] && global[wordKey].status) {
      return global[wordKey].status;
    }

    // Fallback to legacy status key
    try {
      const statuses = JSON.parse(localStorage.getItem(this.statusKey) || '{}');
      return statuses[wordKey] || 'to-learn';
    } catch (e) {
      return 'to-learn';
    }
  }

  /**
   * Update word status (Dual Updating)
   */
  updateWordStatus(word, status) {
    if (!word) return false;
    const wordKey = word.toLowerCase();
    const validStatuses = ['to-learn', 'learning', 'known', 'favorites'];
    const newStatus = validStatuses.includes(status) ? status : 'to-learn';

    // 1. Update Global
    const global = this._getGlobalData();
    if (global[wordKey]) {
      global[wordKey].status = newStatus;
      global[wordKey].lastReviewed = Date.now();
      this._saveGlobalData(global);
    }

    // 2. Update Legacy
    try {
      const statuses = JSON.parse(localStorage.getItem(this.statusKey) || '{}');
      statuses[wordKey] = newStatus;
      localStorage.setItem(this.statusKey, JSON.stringify(statuses));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get words grouped by status for Kanban (uses Global Metadata)
   */
  getWordsByStatus(vocabularyWords) {
    const grouped = {
      'to-learn': [],
      'learning': [],
      'known': [],
      'favorites': []
    };

    if (!vocabularyWords || !Array.isArray(vocabularyWords)) return grouped;

    vocabularyWords.forEach(word => {
      const wordEn = word.en;
      if (!wordEn) return;

      const status = this.getWordStatus(wordEn);
      const isSaved = this.isWordSavedGlobally(wordEn);

      const wordObject = {
        ...word,
        isFavorite: isSaved || status === 'favorites'
      };

      if (grouped[status]) {
        grouped[status].push(wordObject);
      }

      // If it's saved but not in favorites column, add it to favorites column too
      if (isSaved && status !== 'favorites') {
        grouped['favorites'].push({ ...wordObject, isFavorite: true });
      }
    });

    return grouped;
  }

  /**
   * Reset all statuses for CURRENT lesson
   */
  clearAllStatuses() {
    localStorage.removeItem(this.statusKey);
    // Note: Global statuses are preserved
    return true;
  }

  // ========================================
  // INTERNAL HELPERS
  // ========================================

  _getGlobalData() {
    try {
      const data = localStorage.getItem(LessonStorage.GLOBAL_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  _saveGlobalData(data) {
    try {
      localStorage.setItem(LessonStorage.GLOBAL_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving global storage:', e);
    }
  }

  getCount() {
    return this.loadWords().length;
  }
}
