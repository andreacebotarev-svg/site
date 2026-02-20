/**
 * PAST SIMPLE GENERATOR
 * =====================
 * Covers: affirmative (+), negative (-), question (?)
 * Task types: gap, choice, find_error (error)
 *
 * Grammar rules:
 *   (+) Subject + V2                       → "She went to school yesterday."
 *   (-) Subject + didn't + V1 (base)       → "She didn't go to school yesterday."
 *   (?) Did + Subject + V1 (base)?         → "Did she go to school yesterday?"
 *
 * Common student errors this generator tests:
 *   1. Using base form instead of V2 in (+)        → "She go yesterday" ✗
 *   2. Double marking in (-): didn't + V2           → "She didn't went" ✗
 *   3. Double marking in (?): Did + V2              → "Did she went?" ✗
 *   4. Using Present tense aux (does/doesn't/do)    → "Does she go yesterday?" ✗
 *   5. Confusing V2 and V3                          → "She gone yesterday" ✗
 */

import { VERBS, SUBJECTS, getRandom, getAux } from '../utils/verbs.js';
import { shuffleOptions, getTimeMarker, buildResult, buildErrorResult } from '../utils/helpers.js';

const TENSE_ID = 'past-simple';

export function generatePastSimple(sentenceType, taskType) {
    const subject = getRandom(SUBJECTS);
    const verb = getRandom(VERBS);
    const timeMarker = getTimeMarker(TENSE_ID);

    if (sentenceType === 'question') {
        return generateQuestion(subject, verb, timeMarker, taskType);
    }

    const isNegative = sentenceType === 'negative';

    if (taskType === 'gap')    return generateGap(subject, verb, isNegative, timeMarker);
    if (taskType === 'choice') return generateChoice(subject, verb, isNegative, timeMarker);
    if (taskType === 'error')  return generateError(subject, verb, isNegative, timeMarker);

    // Fallback
    return generateGap(subject, verb, isNegative, timeMarker);
}


/* ═══════════════════════════════════════════
   GAP FILL — вставь пропущенное слово
   ═══════════════════════════════════════════ */

function generateGap(subject, verb, isNegative, timeMarker) {
    const meta = { tense: TENSE_ID, sentenceType: isNegative ? 'negative' : 'affirmative', taskType: 'gap' };

    if (isNegative) {
        // "She ___ go to school yesterday."  → didn't
        return buildResult('gap',
            `${subject.text} ___ ${verb.base} ${timeMarker}.`,
            shuffleOptions(["didn't", "doesn't", "wasn't"]),
            "didn't",
            meta
        );
    }

    // Affirmative: "She ___ (go) to school yesterday."  → went
    return buildResult('gap',
        `${subject.text} ___ (${verb.base}) ${timeMarker}.`,
        shuffleOptions([verb.v2, verb.base, verb.ing]),
        verb.v2,
        meta
    );
}


/* ═══════════════════════════════════════════
   CHOICE — выбери правильный вариант
   ═══════════════════════════════════════════ */

function generateChoice(subject, verb, isNegative, timeMarker) {
    const meta = { tense: TENSE_ID, sentenceType: isNegative ? 'negative' : 'affirmative', taskType: 'choice' };

    if (isNegative) {
        const correct = `${subject.text} didn't ${verb.base} ${timeMarker}.`;
        const wrong1  = `${subject.text} doesn't ${verb.base} ${timeMarker}.`;   // Present aux error
        const wrong2  = `${subject.text} didn't ${verb.v2} ${timeMarker}.`;      // Double marking error

        return buildResult('choice',
            'Choose the correct Past Simple negative:',
            shuffleOptions([correct, wrong1, wrong2]),
            correct,
            meta
        );
    }

    // Affirmative
    const correct = `${subject.text} ${verb.v2} ${timeMarker}.`;
    const wrong1  = `${subject.text} ${verb.base} ${timeMarker}.`;   // Base form error
    const wrong2  = `${subject.text} ${verb.v3} ${timeMarker}.`;     // V3 confusion

    return buildResult('choice',
        'Choose the correct Past Simple sentence:',
        shuffleOptions([correct, wrong1, wrong2]),
        correct,
        meta
    );
}


/* ═══════════════════════════════════════════
   FIND ERROR — найди ошибку
   ═══════════════════════════════════════════ */

function generateError(subject, verb, isNegative, timeMarker) {
    const meta = { tense: TENSE_ID, sentenceType: isNegative ? 'negative' : 'affirmative', taskType: 'error' };

    if (isNegative) {
        // Two error types for negatives:
        const errorType = Math.random() > 0.5 ? 'aux' : 'verb';

        if (errorType === 'aux') {
            // Error: "She doesn't go yesterday." — present aux instead of past
            return buildErrorResult([
                { text: subject.text, correct: false },
                { text: "doesn't", correct: true },  // ← ERROR: should be "didn't"
                { text: verb.base, correct: false },
                { text: timeMarker + ".", correct: false }
            ], meta);
        }

        // Error: "She didn't went yesterday." — double marking
        return buildErrorResult([
            { text: subject.text, correct: false },
            { text: "didn't", correct: false },
            { text: verb.v2, correct: true },         // ← ERROR: should be base form
            { text: timeMarker + ".", correct: false }
        ], meta);
    }

    // Affirmative error: "She go yesterday." — base form instead of V2
    return buildErrorResult([
        { text: subject.text, correct: false },
        { text: verb.base, correct: true },           // ← ERROR: should be V2
        { text: timeMarker + ".", correct: false }
    ], meta);
}


/* ═══════════════════════════════════════════
   QUESTIONS (?)
   ═══════════════════════════════════════════ */

function generateQuestion(subject, verb, timeMarker, taskType) {
    const meta = { tense: TENSE_ID, sentenceType: 'question', taskType };
    const subj = subject.text.toLowerCase();
    const fullQ = `Did ${subj} ${verb.base} ${timeMarker}?`;

    if (taskType === 'gap') {
        // "___ she go to school yesterday?"  → Did
        return buildResult('gap',
            `___ ${subj} ${verb.base} ${timeMarker}?`,
            shuffleOptions(["Did", "Does", "Was"]),
            "Did",
            meta
        );
    }

    if (taskType === 'choice') {
        const wrong1 = `Does ${subj} ${verb.base} ${timeMarker}?`;      // Present aux
        const wrong2 = `Did ${subj} ${verb.v2} ${timeMarker}?`;         // Double marking

        return buildResult('choice',
            'Choose the correct Past Simple question:',
            shuffleOptions([fullQ, wrong1, wrong2]),
            fullQ,
            meta
        );
    }

    if (taskType === 'error') {
        const errorType = Math.random() > 0.5 ? 'aux' : 'verb';

        if (errorType === 'aux') {
            // Error: "Does she go yesterday?" — present aux
            return buildErrorResult([
                { text: "Does", correct: true },      // ← ERROR: should be "Did"
                { text: subj, correct: false },
                { text: verb.base, correct: false },
                { text: timeMarker + "?", correct: false }
            ], meta);
        }

        // Error: "Did she went yesterday?" — double marking
        return buildErrorResult([
            { text: "Did", correct: false },
            { text: subj, correct: false },
            { text: verb.v2, correct: true },         // ← ERROR: should be base form
            { text: timeMarker + "?", correct: false }
        ], meta);
    }

    // Fallback
    return buildResult('gap',
        `___ ${subj} ${verb.base} ${timeMarker}?`,
        shuffleOptions(["Did", "Does", "Was"]),
        "Did",
        meta
    );
}
