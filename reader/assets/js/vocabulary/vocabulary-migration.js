/**
 * @fileoverview Vocabulary Migration Script
 * Migrates from SM-2 format to simple 3-status format
 */

import { simpleVocabularyStorage, WORD_STATUS } from './vocabulary-storage.simple.js';

/**
 * Migration utilities for converting SM-2 vocabulary to simple format
 */
export class VocabularyMigration {
  constructor() {
    this.logger = console;
  }

  /**
   * Check if migration is needed
   * @returns {boolean} True if migration is needed
   */
  isMigrationNeeded() {
    try {
      // Check if old SM-2 data exists
      const oldData = localStorage.getItem('reader_vocabulary');
      if (!oldData) {
        this.logger.log('No old vocabulary data found, migration not needed');
        return false;
      }

      // Check if new format already exists
      const newData = localStorage.getItem('reader_vocabulary_v2');
      if (newData) {
        this.logger.log('New vocabulary format already exists, migration not needed');
        return false;
      }

      const oldWords = JSON.parse(oldData);
      this.logger.log(`Found ${oldWords.length} words in old SM-2 format`);
      return oldWords.length > 0;
    } catch (error) {
      this.logger.error('Error checking migration need:', error);
      return false;
    }
  }

  /**
   * Perform migration from SM-2 to simple format
   * @returns {boolean} Success
   */
  async migrate() {
    try {
      this.logger.log('Starting vocabulary migration from SM-2 to simple format...');

      // Get old data
      const oldData = localStorage.getItem('reader_vocabulary');
      if (!oldData) {
        this.logger.log('No old data to migrate');
        return true;
      }

      const oldWords = JSON.parse(oldData);
      this.logger.log(`Migrating ${oldWords.length} words...`);

      // Convert each word
      const migratedWords = [];
      let migratedCount = 0;
      let skippedCount = 0;

      for (const oldWord of oldWords) {
        try {
          const newWord = this.convertWord(oldWord);
          if (newWord) {
            migratedWords.push(newWord);
            migratedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          this.logger.warn(`Failed to migrate word "${oldWord.word}":`, error);
          skippedCount++;
        }
      }

      // Save migrated data
      localStorage.setItem('reader_vocabulary_v2', JSON.stringify(migratedWords));

      // Backup old data
      localStorage.setItem('reader_vocabulary_backup', oldData);

      this.logger.log(`Migration completed:`);
      this.logger.log(`- Migrated: ${migratedCount} words`);
      this.logger.log(`- Skipped: ${skippedCount} words`);
      this.logger.log(`- Old data backed up to 'reader_vocabulary_backup'`);

      return true;
    } catch (error) {
      this.logger.error('Migration failed:', error);
      return false;
    }
  }

  /**
   * Convert single word from SM-2 format to simple format
   * @param {Object} oldWord - Word in SM-2 format
   * @returns {Object|null} Word in simple format or null if invalid
   */
  convertWord(oldWord) {
    // Validate required fields
    if (!oldWord.word || typeof oldWord.word !== 'string') {
      this.logger.warn('Invalid word data, skipping:', oldWord);
      return null;
    }

    // Determine new status based on SM-2 data
    let newStatus = WORD_STATUS.TO_KNOW;
    let reviewCount = 0;

    // If word has SM-2 data, analyze it
    if (oldWord.repetitions !== undefined && oldWord.easeFactor !== undefined) {
      const repetitions = oldWord.repetitions || 0;
      const easeFactor = oldWord.easeFactor || 2.5;

      if (repetitions >= 5 && easeFactor >= 2.5) {
        // Well mastered word
        newStatus = WORD_STATUS.KNOWN;
        reviewCount = repetitions;
      } else if (repetitions > 0) {
        // Word in progress
        newStatus = WORD_STATUS.LEARNING;
        reviewCount = repetitions;
      }
      // else: stays TO_KNOW (new word)
    }

    // Create new word object
    const newWord = {
      id: oldWord.id || this.generateId(),
      word: this.normalizeWord(oldWord.word),
      translation: oldWord.translation || '',
      phonetic: oldWord.phonetic || '',
      status: newStatus,
      reviewCount: reviewCount,
      addedAt: oldWord.addedAt || oldWord.timestamp || Date.now(),
      lastReviewed: oldWord.lastReviewed || null
    };

    return newWord;
  }

  /**
   * Normalize word text (same as in SimpleVocabularyStorage)
   * @param {string} text
   * @returns {string}
   */
  normalizeWord(text) {
    return text.toLowerCase().trim().replace(/[^\w\s'-]/g, '');
  }

  /**
   * Generate unique ID
   * @returns {string}
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get migration statistics
   * @returns {Object} Stats about migration
   */
  getMigrationStats() {
    try {
      const oldData = localStorage.getItem('reader_vocabulary');
      const newData = localStorage.getItem('reader_vocabulary_v2');
      const backupData = localStorage.getItem('reader_vocabulary_backup');

      const stats = {
        hasOldData: !!oldData,
        hasNewData: !!newData,
        hasBackup: !!backupData,
        oldWordCount: oldData ? JSON.parse(oldData).length : 0,
        newWordCount: newData ? JSON.parse(newData).length : 0,
        backupWordCount: backupData ? JSON.parse(backupData).length : 0
      };

      // Analyze status distribution in new data
      if (newData) {
        const words = JSON.parse(newData);
        stats.newStatusDistribution = {
          [WORD_STATUS.TO_KNOW]: words.filter(w => w.status === WORD_STATUS.TO_KNOW).length,
          [WORD_STATUS.LEARNING]: words.filter(w => w.status === WORD_STATUS.LEARNING).length,
          [WORD_STATUS.KNOWN]: words.filter(w => w.status === WORD_STATUS.KNOWN).length
        };
      }

      return stats;
    } catch (error) {
      this.logger.error('Error getting migration stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Rollback migration (restore old data)
   * @returns {boolean} Success
   */
  rollback() {
    try {
      const backupData = localStorage.getItem('reader_vocabulary_backup');
      if (!backupData) {
        this.logger.error('No backup data found for rollback');
        return false;
      }

      // Restore old data
      localStorage.setItem('reader_vocabulary', backupData);

      // Remove new data and backup
      localStorage.removeItem('reader_vocabulary_v2');
      localStorage.removeItem('reader_vocabulary_backup');

      this.logger.log('Migration rolled back successfully');
      return true;
    } catch (error) {
      this.logger.error('Rollback failed:', error);
      return false;
    }
  }

  /**
   * Clear all migration data (for testing)
   */
  clearMigrationData() {
    try {
      localStorage.removeItem('reader_vocabulary');
      localStorage.removeItem('reader_vocabulary_v2');
      localStorage.removeItem('reader_vocabulary_backup');
      this.logger.log('All migration data cleared');
    } catch (error) {
      this.logger.error('Error clearing migration data:', error);
    }
  }
}

// Create singleton instance
export const vocabularyMigration = new VocabularyMigration();

/**
 * Auto-run migration on import (if needed)
 * This will run when the module is imported
 */
if (typeof window !== 'undefined') {
  // Run migration check when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkAndRunMigration();
    });
  } else {
    checkAndRunMigration();
  }
}

async function checkAndRunMigration() {
  try {
    if (vocabularyMigration.isMigrationNeeded()) {
      console.log('🔄 Running vocabulary migration...');
      const success = await vocabularyMigration.migrate();
      if (success) {
        console.log('✅ Vocabulary migration completed successfully');
        // Reload page to use new data
        window.location.reload();
      } else {
        console.error('❌ Vocabulary migration failed');
      }
    }
  } catch (error) {
    console.error('❌ Error during migration check:', error);
  }
}

// Export migration runner for manual use
export const runMigration = () => vocabularyMigration.migrate();
export const getMigrationStats = () => vocabularyMigration.getMigrationStats();
export const rollbackMigration = () => vocabularyMigration.rollback();
