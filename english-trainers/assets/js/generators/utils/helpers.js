/**
 * Shared utilities for all tense generators.
 * Eliminates duplication across present-simple, present-continuous, etc.
 */

/**
 * Fisher-Yates-lite shuffle for small arrays (3-5 options).
 * Returns a NEW array (safe for immutable data).
 */
export function shuffleOptions(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Pick a random element from an array.
 */
export function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Time markers per tense — used to make sentences realistic.
 */
export const TIME_MARKERS = {
    'present-simple':               ['every day', 'usually', 'always', 'often', 'sometimes', 'every week'],
    'present-continuous':           ['now', 'right now', 'at the moment', 'currently'],
    'present-perfect':              ['already', 'just', 'yet', 'ever', 'recently'],
    'present-perfect-continuous':   ['since morning', 'for 2 hours', 'all day', 'since last week', 'for a long time'],
    'past-simple':                  ['yesterday', 'last week', 'last month', 'two days ago', 'last year'],
    'past-continuous':              ['at 5 o\'clock yesterday', 'at that moment', 'all evening yesterday', 'at 8 pm last night', 'when I came home'],
    'past-perfect':                 ['before that', 'by the time', 'by 5 o\'clock yesterday', 'before I arrived', 'before the meeting'],
    'past-perfect-continuous':      ['for 2 hours before that', 'since morning that day', 'all day before the event', 'for a long time before'],
    'future-simple':                ['tomorrow', 'next week', 'next month', 'next year', 'soon'],
    'future-continuous':            ['at 5 o\'clock tomorrow', 'this time next week', 'at noon tomorrow', 'at 8 pm tonight'],
    'future-perfect':               ['by tomorrow', 'by next week', 'by the end of the year', 'by 2030', 'by then'],
    'future-perfect-continuous':    ['for 3 hours by then', 'since morning by tomorrow', 'for a week by next Monday', 'for 2 years by 2030'],
};

/**
 * Get a random time marker appropriate for the given tense.
 */
export function getTimeMarker(tense) {
    const markers = TIME_MARKERS[tense];
    if (!markers || markers.length === 0) return '';
    return markers[Math.floor(Math.random() * markers.length)];
}

/**
 * Build a standardized question result object.
 * Ensures consistent shape across all generators.
 */
export function buildResult(type, question, options, correct, metadata) {
    return { type, question, options, correct, metadata };
}

/**
 * Build a standardized find_error result object.
 * Assembles full sentence from option segments automatically.
 */
export function buildErrorResult(options, metadata) {
    const fullSentence = options.map(opt => opt.text).join(' ');
    return {
        type: 'find_error',
        question: fullSentence,
        options,
        metadata
    };
}
