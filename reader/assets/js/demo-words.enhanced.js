/**
 * @fileoverview Enhanced demo data generator with realistic vocabulary
 * @module DemoWordsEnhanced
 */

import { vocabularyStorage } from './vocabulary/vocabulary-storage.enhanced.js';
import { logger } from './utils/logger.js';

const demoLogger = logger.createChild('DemoData');

/**
 * Extended vocabulary dataset with real-world examples
 */
const DEMO_VOCABULARY = [
  {
    word: 'serendipity',
    translation: 'счастливая случайность',
    definition: 'the occurrence of events by chance in a happy or beneficial way',
    phonetic: '/ˌserənˈdɪpɪti/',
    context: 'Finding this book was pure serendipity.',
    tags: ['abstract', 'positive'],
    difficulty: 4
  },
  {
    word: 'ephemeral',
    translation: 'эфемерный, мимолетный',
    definition: 'lasting for a very short time',
    phonetic: '/ɪˈfɛm(ə)r(ə)l/',
    context: 'The beauty of cherry blossoms is ephemeral.',
    tags: ['abstract', 'descriptive'],
    difficulty: 4
  },
  {
    word: 'resilience',
    translation: 'устойчивость, упругость',
    definition: 'the capacity to recover quickly from difficulties',
    phonetic: '/rɪˈzɪliəns/',
    context: 'She showed great resilience after the setback.',
    tags: ['positive', 'character'],
    difficulty: 3
  },
  {
    word: 'eloquent',
    translation: 'красноречивый',
    definition: 'fluent or persuasive in speaking or writing',
    phonetic: '/ˈɛləkwənt/',
    context: 'His speech was eloquent and moving.',
    tags: ['descriptive', 'communication'],
    difficulty: 3
  },
  {
    word: 'perseverance',
    translation: 'настойчивость, упорство',
    definition: 'persistence in doing something despite difficulty or delay',
    phonetic: '/ˌpəːsɪˈvɪər(ə)ns/',
    context: 'Success requires perseverance and dedication.',
    tags: ['character', 'positive'],
    difficulty: 3
  },
  {
    word: 'ambivalent',
    translation: 'амбивалентный, двойственный',
    definition: 'having mixed feelings or contradictory ideas about something',
    phonetic: '/amˈbɪv(ə)l(ə)nt/',
    context: 'I feel ambivalent about the decision.',
    tags: ['emotion', 'descriptive'],
    difficulty: 4
  },
  {
    word: 'innovation',
    translation: 'инновация, новшество',
    definition: 'a new method, idea, or product',
    phonetic: '/ˌɪnə(ʊ)ˈveɪʃ(ə)n/',
    context: 'Technological innovation drives progress.',
    tags: ['technology', 'business'],
    difficulty: 2
  },
  {
    word: 'perspective',
    translation: 'перспектива, точка зрения',
    definition: 'a particular attitude toward something; a point of view',
    phonetic: '/pəˈspɛktɪv/',
    context: 'Try to see it from my perspective.',
    tags: ['abstract', 'communication'],
    difficulty: 2
  },
  {
    word: 'contemplative',
    translation: 'задумчивый, созерцательный',
    definition: 'expressing or involving prolonged thought',
    phonetic: '/kənˈtɛmplətɪv/',
    context: 'She was in a contemplative mood.',
    tags: ['descriptive', 'emotion'],
    difficulty: 4
  },
  {
    word: 'synthesis',
    translation: 'синтез, объединение',
    definition: 'the combination of components to form a connected whole',
    phonetic: '/ˈsɪnθɪsɪs/',
    context: 'The book is a synthesis of various theories.',
    tags: ['abstract', 'academic'],
    difficulty: 4
  },
  {
    word: 'nurture',
    translation: 'воспитывать, взращивать',
    definition: 'care for and encourage the growth or development of',
    phonetic: '/ˈnəːtʃə/',
    context: 'Parents nurture their children with love.',
    tags: ['action', 'positive'],
    difficulty: 2
  },
  {
    word: 'paradigm',
    translation: 'парадигма, модель',
    definition: 'a typical example or pattern of something',
    phonetic: '/ˈparədʌɪm/',
    context: 'This represents a paradigm shift in thinking.',
    tags: ['abstract', 'academic'],
    difficulty: 5
  },
  {
    word: 'meticulous',
    translation: 'тщательный, дотошный',
    definition: 'showing great attention to detail; very careful and precise',
    phonetic: '/mɪˈtɪkjʊləs/',
    context: 'She keeps meticulous records.',
    tags: ['descriptive', 'positive'],
    difficulty: 4
  },
  {
    word: 'ubiquitous',
    translation: 'вездесущий, повсеместный',
    definition: 'present, appearing, or found everywhere',
    phonetic: '/juːˈbɪkwɪtəs/',
    context: 'Smartphones are ubiquitous in modern society.',
    tags: ['descriptive', 'technology'],
    difficulty: 5
  },
  {
    word: 'catalyst',
    translation: 'катализатор, стимул',
    definition: 'a person or thing that precipitates an event',
    phonetic: '/ˈkat(ə)lɪst/',
    context: 'The meeting was a catalyst for change.',
    tags: ['abstract', 'science'],
    difficulty: 3
  }
];

/**
 * Add demo words with simulated review history
 * @param {Object} [options] - Generation options
 * @param {boolean} [options.withHistory=true] - Generate review history
 * @param {number} [options.count] - Number of words to add (defaults to all)
 * @returns {Promise<number>} Number of words added
 */
export async function addDemoWords(options = {}) {
  const {
    withHistory = true,
    count = DEMO_VOCABULARY.length
  } = options;
  
  demoLogger.info('Adding demo words', { count, withHistory });
  
  const wordsToAdd = DEMO_VOCABULARY.slice(0, count);
  let added = 0;
  
  for (const wordData of wordsToAdd) {
    try {
      const word = vocabularyStorage.addWord({
        ...wordData,
        timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000 // Random time in last week
      });
      
      // Simulate review history
      if (withHistory && Math.random() > 0.3) {
        const reviewCount = Math.floor(Math.random() * 5);
        for (let i = 0; i < reviewCount; i++) {
          const quality = Math.floor(Math.random() * 4); // 0-3
          vocabularyStorage.updateWordReview(word.id, quality);
          
          // Add some delay between reviews
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      added++;
    } catch (error) {
      demoLogger.error('Failed to add demo word', error, wordData.word);
    }
  }
  
  demoLogger.info('Demo words added', { added });
  
  return added;
}

/**
 * Clear all demo data
 */
export function clearDemoWords() {
  vocabularyStorage.clear();
  demoLogger.info('Demo words cleared');
}

/**
 * Generate random review session
 * @param {number} [cardCount=5] - Number of cards to review
 */
export async function simulateReviewSession(cardCount = 5) {
  demoLogger.info('Simulating review session', { cardCount });
  
  const dueWords = vocabularyStorage.getDueWords();
  if (dueWords.length === 0) {
    demoLogger.warn('No due words to review');
    return;
  }
  
  const words = dueWords.slice(0, Math.min(cardCount, dueWords.length));
  
  for (const word of words) {
    // Simulate random quality rating
    const quality = Math.floor(Math.random() * 4);
    vocabularyStorage.updateWordReview(word.id, quality);
    demoLogger.debug('Reviewed word', { word: word.word, quality });
  }
  
  demoLogger.info('Review session complete', { reviewed: words.length });
}

/**
 * Get demo statistics
 * @returns {Object} Statistics
 */
export function getDemoStats() {
  return vocabularyStorage.getStatistics();
}

// Make available globally for testing
if (typeof window !== 'undefined') {
  window.__DEMO__ = {
    addWords: addDemoWords,
    clearWords: clearDemoWords,
    simulateSession: simulateReviewSession,
    getStats: getDemoStats,
    vocabulary: DEMO_VOCABULARY
  };
}

