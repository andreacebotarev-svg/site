/**
 * GENERATOR REGISTRY
 * ==================
 * Central registry that maps tense identifiers to their generator functions.
 * 
 * WHY: Replaces the hardcoded switch(tense) in mixed/index.js.
 * Adding a new tense = one import + one register() call.
 * No need to touch any other file.
 *
 * USAGE:
 *   import { getGenerator, generateForTense } from '../registry.js';
 *   const question = generateForTense('past-simple', 'affirmative', 'gap');
 */

import { generatePS } from './present-simple/index.js';
import { generatePresentContinuous } from './present-continuous/index.js';
import { generatePresentPerfect } from './present-perfect/index.js';
import { generatePastSimple } from './past-simple/index.js';
import { generatePastContinuous } from './past-continuous/index.js';
import { generateFutureSimple } from './future-simple/index.js';
import { generateFutureContinuous } from './future-continuous/index.js';
import { generateFuturePerfect } from './future-perfect/index.js';
import { generatePastPerfect } from './past-perfect/index.js';
import { generatePresentPerfectContinuous } from './present-perfect-continuous/index.js';
import { generatePastPerfectContinuous } from './past-perfect-continuous/index.js';
import { generateFuturePerfectContinuous } from './future-perfect-continuous/index.js';

/** @type {Map<string, Function>} */
const registry = new Map();

/**
 * Register a generator function for a tense.
 * @param {string} tenseId — e.g. 'present-simple', 'future-perfect'
 * @param {Function} generatorFn — (sentenceType, taskType) => QuestionObject
 */
export function register(tenseId, generatorFn) {
    registry.set(tenseId, generatorFn);
}

/**
 * Get the generator function for a tense, or null if not registered.
 */
export function getGenerator(tenseId) {
    return registry.get(tenseId) || null;
}

/**
 * Generate a question for the given tense. Throws if tense not registered.
 * @param {string} tenseId
 * @param {string} sentenceType — 'affirmative' | 'negative' | 'question'
 * @param {string} taskType — 'gap' | 'choice' | 'error'
 * @returns {Object} Question object
 */
export function generateForTense(tenseId, sentenceType, taskType) {
    const gen = registry.get(tenseId);
    if (!gen) {
        console.error(`[Registry] No generator for tense: "${tenseId}". Available:`, [...registry.keys()]);
        throw new Error(`No generator registered for tense: ${tenseId}`);
    }
    return gen(sentenceType, taskType);
}

/**
 * Get all registered tense IDs.
 * @returns {string[]}
 */
export function getRegisteredTenses() {
    return [...registry.keys()];
}

/* ═══════════════════════════════════════════
   REGISTER ALL TENSES (12 total — COMPLETE!)
   ═══════════════════════════════════════════ */

// Present group (4)
register('present-simple',              generatePS);
register('present-continuous',          generatePresentContinuous);
register('present-perfect',             generatePresentPerfect);
register('present-perfect-continuous',  generatePresentPerfectContinuous);

// Past group (4)
register('past-simple',                 generatePastSimple);
register('past-continuous',             generatePastContinuous);
register('past-perfect',                generatePastPerfect);
register('past-perfect-continuous',     generatePastPerfectContinuous);

// Future group (4)
register('future-simple',               generateFutureSimple);
register('future-continuous',           generateFutureContinuous);
register('future-perfect',              generateFuturePerfect);
register('future-perfect-continuous',   generateFuturePerfectContinuous);
