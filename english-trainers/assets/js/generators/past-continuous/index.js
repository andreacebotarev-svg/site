/**
 * PAST CONTINUOUS GENERATOR
 * =========================
 * Covers: affirmative (+), negative (-), question (?)
 * Task types: gap, choice, find_error (error)
 *
 * Grammar rules:
 *   (+) Subject + was/were + Ving            → "She was reading at 5 o'clock yesterday."
 *   (-) Subject + wasn't/weren't + Ving      → "She wasn't reading at that moment."
 *   (?) Was/Were + Subject + Ving?            → "Was she reading at 8 pm last night?"
 *
 * Common student errors this generator tests:
 *   1. Wrong aux agreement (was/were)         → "They was playing" ✗
 *   2. Base form instead of Ving              → "She was read" ✗
 *   3. Using did/didn't instead of was/were   → "She didn't reading" ✗
 *   4. Present aux instead of past            → "She is reading yesterday" ✗
 *   5. Missing -ing                           → "They were play" ✗
 */

import { VERBS, SUBJECTS, getRandom, getAux } from '../utils/verbs.js';
import { shuffleOptions, getTimeMarker, buildResult, buildErrorResult } from '../utils/helpers.js';

const TENSE_ID = 'past-continuous';

export function generatePastContinuous(sentenceType, taskType) {
    const subject = getRandom(SUBJECTS);
    const verb = getRandom(VERBS);
    const timeMarker = getTimeMarker(TENSE_ID);
    const isNegative = sentenceType === 'negative';
    const isQuestion = sentenceType === 'question';

    const aux = getAux('PaC', subject.type, isNegative);

    if (isQuestion) {
        return generateQuestion(subject, verb, timeMarker, taskType);
    }

    if (taskType === 'gap')    return generateGap(subject, verb, aux, isNegative, timeMarker);
    if (taskType === 'choice') return generateChoice(subject, verb, aux, isNegative, timeMarker);
    if (taskType === 'error')  return generateError(subject, verb, aux, isNegative, timeMarker);

    // Fallback
    return generateGap(subject, verb, aux, isNegative, timeMarker);
}


/* ═══════════════════════════════════════════
   GAP FILL — вставь пропущенное слово
   ═══════════════════════════════════════════ */

function generateGap(subject, verb, aux, isNegative, timeMarker) {
    const meta = { tense: TENSE_ID, sentenceType: isNegative ? 'negative' : 'affirmative', taskType: 'gap' };
    const hideAux = Math.random() > 0.5;

    if (hideAux) {
        // "She ___ reading at 5 o'clock yesterday."  → was / wasn't
        return buildResult('gap',
            `${subject.text} ___ ${verb.ing} ${timeMarker}.`,
            shuffleOptions([aux, getWrongAux(aux), "did"]),
            aux,
            meta
        );
    }

    // Hide the verb form:
    // "She was ___ at 5 o'clock yesterday."  → reading
    return buildResult('gap',
        `${subject.text} ${aux} ___ ${timeMarker}.`,
        shuffleOptions([verb.ing, verb.base, verb.v2]),
        verb.ing,
        meta
    );
}


/* ═══════════════════════════════════════════
   CHOICE — выбери правильный вариант
   ═══════════════════════════════════════════ */

function generateChoice(subject, verb, aux, isNegative, timeMarker) {
    const meta = { tense: TENSE_ID, sentenceType: isNegative ? 'negative' : 'affirmative', taskType: 'choice' };

    const correct = `${subject.text} ${aux} ${verb.ing} ${timeMarker}.`;
    const wrong1  = `${subject.text} ${aux} ${verb.base} ${timeMarker}.`;          // Base form error
    const wrong2  = `${subject.text} ${getWrongAux(aux)} ${verb.ing} ${timeMarker}.`; // Wrong aux agreement

    return buildResult('choice',
        `Choose the correct Past Continuous ${isNegative ? 'negative' : 'sentence'}:`,
        shuffleOptions([correct, wrong1, wrong2]),
        correct,
        meta
    );
}


/* ═══════════════════════════════════════════
   FIND ERROR — найди ошибку
   ═══════════════════════════════════════════ */

function generateError(subject, verb, aux, isNegative, timeMarker) {
    const meta = { tense: TENSE_ID, sentenceType: isNegative ? 'negative' : 'affirmative', taskType: 'error' };
    const errorType = Math.random() > 0.5 ? 'aux' : 'verb';

    if (errorType === 'aux') {
        // Error: wrong was/were agreement — "They was playing"
        const wrongAux = getWrongAux(aux);
        return buildErrorResult([
            { text: subject.text, correct: false },
            { text: wrongAux, correct: true },       // ← ERROR: wrong agreement
            { text: verb.ing, correct: false },
            { text: timeMarker + ".", correct: false }
        ], meta);
    }

    // Error: base form instead of Ving — "She was play"
    return buildErrorResult([
        { text: subject.text, correct: false },
        { text: aux, correct: false },
        { text: verb.base, correct: true },          // ← ERROR: should be Ving
        { text: timeMarker + ".", correct: false }
    ], meta);
}


/* ═══════════════════════════════════════════
   QUESTIONS (?)
   ═══════════════════════════════════════════ */

function generateQuestion(subject, verb, timeMarker, taskType) {
    const meta = { tense: TENSE_ID, sentenceType: 'question', taskType };
    const subj = subject.text.toLowerCase();
    const qAux = getAux('PaC', subject.type, false); // was / were (positive)
    const fullQ = `${qAux} ${subj} ${verb.ing} ${timeMarker}?`;

    if (taskType === 'gap') {
        // "___ she reading at 5 o'clock?"  → Was
        return buildResult('gap',
            `___ ${subj} ${verb.ing} ${timeMarker}?`,
            shuffleOptions([qAux, getWrongAux(qAux), "Did"]),
            qAux,
            meta
        );
    }

    if (taskType === 'choice') {
        const wrong1 = `${getWrongAux(qAux)} ${subj} ${verb.ing} ${timeMarker}?`;  // Wrong agreement
        const wrong2 = `Did ${subj} ${verb.ing} ${timeMarker}?`;                    // Wrong aux entirely

        return buildResult('choice',
            'Choose the correct Past Continuous question:',
            shuffleOptions([fullQ, wrong1, wrong2]),
            fullQ,
            meta
        );
    }

    if (taskType === 'error') {
        const errorType = Math.random() > 0.5 ? 'aux' : 'verb';

        if (errorType === 'aux') {
            // Error: "Did she reading?" — wrong aux type
            return buildErrorResult([
                { text: "Did", correct: true },      // ← ERROR: should be Was/Were
                { text: subj, correct: false },
                { text: verb.ing, correct: false },
                { text: timeMarker + "?", correct: false }
            ], meta);
        }

        // Error: "Was she play?" — missing -ing
        return buildErrorResult([
            { text: qAux, correct: false },
            { text: subj, correct: false },
            { text: verb.base, correct: true },      // ← ERROR: should be Ving
            { text: timeMarker + "?", correct: false }
        ], meta);
    }

    // Fallback
    return buildResult('gap',
        `___ ${subj} ${verb.ing} ${timeMarker}?`,
        shuffleOptions([qAux, getWrongAux(qAux), "Did"]),
        qAux,
        meta
    );
}


/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

/**
 * Returns a grammatically wrong auxiliary for Past Continuous.
 * Used to generate realistic distractor options.
 */
function getWrongAux(correctAux) {
    const map = {
        "was": "were",   "were": "was",
        "wasn't": "weren't", "weren't": "wasn't"
    };
    return map[correctAux] || "was";
}
