/**
 * FUTURE PERFECT CONTINUOUS GENERATOR
 * =====================================
 * Covers: affirmative (+), negative (-), question (?)
 * Task types: gap, choice, find_error (error)
 *
 * Grammar rules:
 *   (+) Subject + will have been + Ving             → "She will have been working for 3 hours."
 *   (-) Subject + won't have been + Ving            → "She won't have been working for 3 hours."
 *   (?) Will + Subject + have been + Ving?          → "Will she have been working for 3 hours?"
 *
 * "will have been" is universal — no subject agreement.
 * The LONGEST auxiliary chain in English: will + have + been + Ving.
 *
 * Common student errors:
 *   1. Missing "been": "She will have working" ✗
 *   2. Base form instead of Ving: "She will have been work" ✗
 *   3. V3 instead of Ving: "She will have been written" ✗ (Future Perfect confusion)
 *   4. "had been" instead of "will have been": Past Perfect Continuous confusion
 */

import { VERBS, SUBJECTS, getRandom } from '../utils/verbs.js';
import { shuffleOptions, getTimeMarker, buildResult, buildErrorResult } from '../utils/helpers.js';

const TENSE_ID = 'future-perfect-continuous';

export function generateFuturePerfectContinuous(sentenceType, taskType) {
    const subject = getRandom(SUBJECTS);
    const verb = getRandom(VERBS);
    const timeMarker = getTimeMarker(TENSE_ID);
    const isNegative = sentenceType === 'negative';

    if (sentenceType === 'question') {
        return generateQuestion(subject, verb, timeMarker, taskType);
    }

    const aux = isNegative ? "won't have been" : "will have been";

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
        // "She ___ working for 3 hours by then."  → will have been / won't have been
        const wrongAux = isNegative ? "hadn't been" : "had been";
        return buildResult('gap',
            `${subject.text} ___ ${verb.ing} ${timeMarker}.`,
            shuffleOptions([aux, wrongAux, isNegative ? "won't be" : "will be"]),
            aux,
            meta
        );
    }

    // "She will have been ___ for 3 hours by then."  → working (Ving)
    return buildResult('gap',
        `${subject.text} ${aux} ___ ${timeMarker}.`,
        shuffleOptions([verb.ing, verb.v3, verb.base]),
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
    const wrong1  = `${subject.text} ${aux} ${verb.v3} ${timeMarker}.`;            // V3 — Future Perfect confusion
    const wrongAux = isNegative ? "hadn't been" : "had been";
    const wrong2  = `${subject.text} ${wrongAux} ${verb.ing} ${timeMarker}.`;      // Past Perfect Continuous

    return buildResult('choice',
        `Choose the correct Future Perfect Continuous ${isNegative ? 'negative' : 'sentence'}:`,
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
        // Error: "She will have been work for 3 hours." — base instead of Ving
        return buildErrorResult([
            { text: subject.text, correct: false },
            { text: aux, correct: false },
            { text: verb.base, correct: true },        // ← ERROR: should be Ving
            { text: timeMarker + ".", correct: false }
        ], meta);
    }

    // Error: "She had been working for 3 hours by then." — Past instead of Future
    const wrongAux = isNegative ? "hadn't been" : "had been";
    return buildErrorResult([
        { text: subject.text, correct: false },
        { text: wrongAux, correct: true },             // ← ERROR: should be will have been
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
    const fullQ = `Will ${subj} have been ${verb.ing} ${timeMarker}?`;

    if (taskType === 'gap') {
        return buildResult('gap',
            `___ ${subj} have been ${verb.ing} ${timeMarker}?`,
            shuffleOptions(["Will", "Had", "Has"]),
            "Will",
            meta
        );
    }

    if (taskType === 'choice') {
        const wrong1 = `Had ${subj} been ${verb.ing} ${timeMarker}?`;              // Past Perfect Continuous
        const wrong2 = `Will ${subj} have ${verb.v3} ${timeMarker}?`;              // Future Perfect (no Ving)

        return buildResult('choice',
            'Choose the correct Future Perfect Continuous question:',
            shuffleOptions([fullQ, wrong1, wrong2]),
            fullQ,
            meta
        );
    }

    if (taskType === 'error') {
        const errorType = Math.random() > 0.5 ? 'aux' : 'verb';

        if (errorType === 'aux') {
            return buildErrorResult([
                { text: "Had", correct: true },        // ← ERROR: should be "Will"
                { text: subj, correct: false },
                { text: "have been " + verb.ing, correct: false },
                { text: timeMarker + "?", correct: false }
            ], meta);
        }

        return buildErrorResult([
            { text: "Will", correct: false },
            { text: subj, correct: false },
            { text: "have been " + verb.base, correct: true },  // ← ERROR: should be Ving
            { text: timeMarker + "?", correct: false }
        ], meta);
    }

    return buildResult('gap',
        `___ ${subj} have been ${verb.ing} ${timeMarker}?`,
        shuffleOptions(["Will", "Had", "Has"]),
        "Will",
        meta
    );
}
