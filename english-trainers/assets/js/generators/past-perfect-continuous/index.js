/**
 * PAST PERFECT CONTINUOUS GENERATOR
 * ===================================
 * Covers: affirmative (+), negative (-), question (?)
 * Task types: gap, choice, find_error (error)
 *
 * Grammar rules:
 *   (+) Subject + had been + Ving           → "She had been working for 2 hours."
 *   (-) Subject + hadn't been + Ving        → "She hadn't been working for 2 hours."
 *   (?) Had + Subject + been + Ving?        → "Had she been working for 2 hours?"
 *
 * "had been" is universal — no subject agreement.
 *
 * Common student errors:
 *   1. Missing "been": "She had working" ✗
 *   2. Base form instead of Ving: "She had been work" ✗
 *   3. "has been" instead of "had been": PPC confusion
 *   4. V2 instead of Ving: "She had been worked" ✗
 */

import { VERBS, SUBJECTS, getRandom } from '../utils/verbs.js';
import { shuffleOptions, getTimeMarker, buildResult, buildErrorResult } from '../utils/helpers.js';

const TENSE_ID = 'past-perfect-continuous';

export function generatePastPerfectContinuous(sentenceType, taskType) {
    const subject = getRandom(SUBJECTS);
    const verb = getRandom(VERBS);
    const timeMarker = getTimeMarker(TENSE_ID);
    const isNegative = sentenceType === 'negative';

    if (sentenceType === 'question') {
        return generateQuestion(subject, verb, timeMarker, taskType);
    }

    const aux = isNegative ? "hadn't been" : "had been";

    if (taskType === 'gap')    return generateGap(subject, verb, aux, isNegative, timeMarker);
    if (taskType === 'choice') return generateChoice(subject, verb, aux, isNegative, timeMarker);
    if (taskType === 'error')  return generateError(subject, verb, aux, isNegative, timeMarker);

    return generateGap(subject, verb, aux, isNegative, timeMarker);
}


/* ═══════════════════════════════════════════
   GAP FILL
   ═══════════════════════════════════════════ */

function generateGap(subject, verb, aux, isNegative, timeMarker) {
    const meta = { tense: TENSE_ID, sentenceType: isNegative ? 'negative' : 'affirmative', taskType: 'gap' };
    const hideAux = Math.random() > 0.5;

    if (hideAux) {
        // "She ___ working for 2 hours."  → had been / hadn't been
        const wrongAux = isNegative ? "hasn't been" : "has been";
        return buildResult('gap',
            `${subject.text} ___ ${verb.ing} ${timeMarker}.`,
            shuffleOptions([aux, wrongAux, isNegative ? "wasn't" : "was"]),
            aux,
            meta
        );
    }

    // "She had been ___ for 2 hours."  → working (Ving)
    return buildResult('gap',
        `${subject.text} ${aux} ___ ${timeMarker}.`,
        shuffleOptions([verb.ing, verb.base, verb.v2]),
        verb.ing,
        meta
    );
}


/* ═══════════════════════════════════════════
   CHOICE
   ═══════════════════════════════════════════ */

function generateChoice(subject, verb, aux, isNegative, timeMarker) {
    const meta = { tense: TENSE_ID, sentenceType: isNegative ? 'negative' : 'affirmative', taskType: 'choice' };

    const correct = `${subject.text} ${aux} ${verb.ing} ${timeMarker}.`;
    const wrong1  = `${subject.text} ${aux} ${verb.base} ${timeMarker}.`;              // Base instead of Ving
    const wrongAux = isNegative ? "hasn't been" : "has been";
    const wrong2  = `${subject.text} ${wrongAux} ${verb.ing} ${timeMarker}.`;          // PPC instead of PaPC

    return buildResult('choice',
        `Choose the correct Past Perfect Continuous ${isNegative ? 'negative' : 'sentence'}:`,
        shuffleOptions([correct, wrong1, wrong2]),
        correct,
        meta
    );
}


/* ═══════════════════════════════════════════
   FIND ERROR
   ═══════════════════════════════════════════ */

function generateError(subject, verb, aux, isNegative, timeMarker) {
    const meta = { tense: TENSE_ID, sentenceType: isNegative ? 'negative' : 'affirmative', taskType: 'error' };
    const errorType = Math.random() > 0.5 ? 'verb' : 'aux';

    if (errorType === 'verb') {
        // Error: "She had been work for 2 hours." — base instead of Ving
        return buildErrorResult([
            { text: subject.text, correct: false },
            { text: aux, correct: false },
            { text: verb.base, correct: true },        // ← ERROR: should be Ving
            { text: timeMarker + ".", correct: false }
        ], meta);
    }

    // Error: "She has been working for 2 hours." — Present Perfect Continuous instead
    const wrongAux = isNegative ? "hasn't been" : "has been";
    return buildErrorResult([
        { text: subject.text, correct: false },
        { text: wrongAux, correct: true },             // ← ERROR: should be had been / hadn't been
        { text: verb.ing, correct: false },
        { text: timeMarker + ".", correct: false }
    ], meta);
}


/* ═══════════════════════════════════════════
   QUESTIONS
   ═══════════════════════════════════════════ */

function generateQuestion(subject, verb, timeMarker, taskType) {
    const meta = { tense: TENSE_ID, sentenceType: 'question', taskType };
    const subj = subject.text.toLowerCase();
    const fullQ = `Had ${subj} been ${verb.ing} ${timeMarker}?`;

    if (taskType === 'gap') {
        return buildResult('gap',
            `___ ${subj} been ${verb.ing} ${timeMarker}?`,
            shuffleOptions(["Had", "Has", "Was"]),
            "Had",
            meta
        );
    }

    if (taskType === 'choice') {
        const wrong1 = `Has ${subj} been ${verb.ing} ${timeMarker}?`;              // PPC
        const wrong2 = `Had ${subj} been ${verb.base} ${timeMarker}?`;             // Base instead of Ving

        return buildResult('choice',
            'Choose the correct Past Perfect Continuous question:',
            shuffleOptions([fullQ, wrong1, wrong2]),
            fullQ,
            meta
        );
    }

    if (taskType === 'error') {
        const errorType = Math.random() > 0.5 ? 'aux' : 'verb';

        if (errorType === 'aux') {
            return buildErrorResult([
                { text: "Has", correct: true },        // ← ERROR: should be "Had"
                { text: subj, correct: false },
                { text: "been " + verb.ing, correct: false },
                { text: timeMarker + "?", correct: false }
            ], meta);
        }

        return buildErrorResult([
            { text: "Had", correct: false },
            { text: subj, correct: false },
            { text: "been " + verb.base, correct: true },  // ← ERROR: should be Ving
            { text: timeMarker + "?", correct: false }
        ], meta);
    }

    return buildResult('gap',
        `___ ${subj} been ${verb.ing} ${timeMarker}?`,
        shuffleOptions(["Had", "Has", "Was"]),
        "Had",
        meta
    );
}
