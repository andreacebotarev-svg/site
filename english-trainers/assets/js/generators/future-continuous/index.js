/**
 * FUTURE CONTINUOUS GENERATOR
 * ============================
 * Covers: affirmative (+), negative (-), question (?)
 * Task types: gap, choice, find_error (error)
 *
 * Grammar rules:
 *   (+) Subject + will be + Ving            → "She will be reading at 5 o'clock tomorrow."
 *   (-) Subject + won't be + Ving           → "She won't be reading at noon tomorrow."
 *   (?) Will + Subject + be + Ving?         → "Will she be reading this time next week?"
 *
 * "will" is universal — no subject agreement.
 *
 * Common student errors this generator tests:
 *   1. Missing "be": "She will reading" ✗
 *   2. Base form instead of Ving: "She will be read" ✗
 *   3. Using was/were instead of will be: "She was reading tomorrow" ✗
 *   4. V2 instead of Ving: "She will be wrote" ✗
 */

import { VERBS, SUBJECTS, getRandom } from '../utils/verbs.js';
import { shuffleOptions, getTimeMarker, buildResult, buildErrorResult } from '../utils/helpers.js';

const TENSE_ID = 'future-continuous';

export function generateFutureContinuous(sentenceType, taskType) {
    const subject = getRandom(SUBJECTS);
    const verb = getRandom(VERBS);
    const timeMarker = getTimeMarker(TENSE_ID);
    const isNegative = sentenceType === 'negative';

    if (sentenceType === 'question') {
        return generateQuestion(subject, verb, timeMarker, taskType);
    }

    const aux = isNegative ? "won't be" : "will be";

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
        // "She ___ reading at 5 o'clock tomorrow."  → will be / won't be
        const wrongAux = isNegative ? "wasn't" : "was";
        return buildResult('gap',
            `${subject.text} ___ ${verb.ing} ${timeMarker}.`,
            shuffleOptions([aux, wrongAux, isNegative ? "doesn't" : "will"]),
            aux,
            meta
        );
    }

    // "She will be ___ at 5 o'clock tomorrow."  → reading
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
    const wrong1  = `${subject.text} ${aux} ${verb.base} ${timeMarker}.`;         // Base instead of Ving
    const wrongAux = isNegative ? "wasn't" : "was";
    const wrong2  = `${subject.text} ${wrongAux} ${verb.ing} ${timeMarker}.`;     // Past Continuous instead

    return buildResult('choice',
        `Choose the correct Future Continuous ${isNegative ? 'negative' : 'sentence'}:`,
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
        // Error: "She will be read at noon tomorrow." — base instead of Ving
        return buildErrorResult([
            { text: subject.text, correct: false },
            { text: aux, correct: false },
            { text: verb.base, correct: true },        // ← ERROR: should be Ving
            { text: timeMarker + ".", correct: false }
        ], meta);
    }

    // Error: wrong tense — "She was reading at noon tomorrow." — past instead of future
    const wrongAux = isNegative ? "wasn't" : "was";
    return buildErrorResult([
        { text: subject.text, correct: false },
        { text: wrongAux, correct: true },             // ← ERROR: should be will be / won't be
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
    const fullQ = `Will ${subj} be ${verb.ing} ${timeMarker}?`;

    if (taskType === 'gap') {
        // "___ she be reading at 5 o'clock tomorrow?"  → Will
        return buildResult('gap',
            `___ ${subj} be ${verb.ing} ${timeMarker}?`,
            shuffleOptions(["Will", "Was", "Does"]),
            "Will",
            meta
        );
    }

    if (taskType === 'choice') {
        const wrong1 = `Was ${subj} ${verb.ing} ${timeMarker}?`;                 // Past Continuous
        const wrong2 = `Will ${subj} ${verb.base} ${timeMarker}?`;               // Future Simple

        return buildResult('choice',
            'Choose the correct Future Continuous question:',
            shuffleOptions([fullQ, wrong1, wrong2]),
            fullQ,
            meta
        );
    }

    if (taskType === 'error') {
        const errorType = Math.random() > 0.5 ? 'aux' : 'verb';

        if (errorType === 'aux') {
            // Error: "Was she be reading tomorrow?" — past aux
            return buildErrorResult([
                { text: "Was", correct: true },        // ← ERROR: should be "Will"
                { text: subj, correct: false },
                { text: "be " + verb.ing, correct: false },
                { text: timeMarker + "?", correct: false }
            ], meta);
        }

        // Error: "Will she be read tomorrow?" — base instead of Ving
        return buildErrorResult([
            { text: "Will", correct: false },
            { text: subj, correct: false },
            { text: "be " + verb.base, correct: true },  // ← ERROR: should be "be" + Ving
            { text: timeMarker + "?", correct: false }
        ], meta);
    }

    return buildResult('gap',
        `___ ${subj} be ${verb.ing} ${timeMarker}?`,
        shuffleOptions(["Will", "Was", "Does"]),
        "Will",
        meta
    );
}
