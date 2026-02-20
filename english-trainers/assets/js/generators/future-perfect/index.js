/**
 * FUTURE PERFECT GENERATOR
 * =========================
 * Covers: affirmative (+), negative (-), question (?)
 * Task types: gap, choice, find_error (error)
 *
 * Grammar rules:
 *   (+) Subject + will have + V3            → "She will have finished by tomorrow."
 *   (-) Subject + won't have + V3           → "She won't have finished by tomorrow."
 *   (?) Will + Subject + have + V3?         → "Will she have finished by tomorrow?"
 *
 * "will" is universal — no subject agreement.
 * After "will have" the verb MUST be V3 (past participle).
 *
 * Common student errors this generator tests:
 *   1. V2 instead of V3: "She will have went" ✗  (should be gone)
 *   2. Base form instead of V3: "She will have go" ✗
 *   3. Missing "have": "She will finished" ✗
 *   4. Present Perfect aux: "She has gone by tomorrow" ✗
 */

import { VERBS, SUBJECTS, getRandom } from '../utils/verbs.js';
import { shuffleOptions, getTimeMarker, buildResult, buildErrorResult } from '../utils/helpers.js';

const TENSE_ID = 'future-perfect';

export function generateFuturePerfect(sentenceType, taskType) {
    const subject = getRandom(SUBJECTS);
    const verb = getRandom(VERBS);
    const timeMarker = getTimeMarker(TENSE_ID);
    const isNegative = sentenceType === 'negative';

    if (sentenceType === 'question') {
        return generateQuestion(subject, verb, timeMarker, taskType);
    }

    const aux = isNegative ? "won't have" : "will have";

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
        // "She ___ finished by tomorrow."  → will have / won't have
        const wrongAux = isNegative ? "hasn't" : "has";
        return buildResult('gap',
            `${subject.text} ___ ${verb.v3} ${timeMarker}.`,
            shuffleOptions([aux, wrongAux, isNegative ? "didn't" : "had"]),
            aux,
            meta
        );
    }

    // "She will have ___ by tomorrow."  → finished (V3)
    return buildResult('gap',
        `${subject.text} ${aux} ___ ${timeMarker}.`,
        shuffleOptions([verb.v3, verb.v2, verb.base]),
        verb.v3,
        meta
    );
}


/* ═══════════════════════════════════════════
   CHOICE
   ═══════════════════════════════════════════ */

function generateChoice(subject, verb, aux, isNegative, timeMarker) {
    const meta = { tense: TENSE_ID, sentenceType: isNegative ? 'negative' : 'affirmative', taskType: 'choice' };

    const correct = `${subject.text} ${aux} ${verb.v3} ${timeMarker}.`;
    const wrong1  = `${subject.text} ${aux} ${verb.v2} ${timeMarker}.`;            // V2 instead of V3
    const wrong2  = `${subject.text} ${aux} ${verb.base} ${timeMarker}.`;          // Base instead of V3

    return buildResult('choice',
        `Choose the correct Future Perfect ${isNegative ? 'negative' : 'sentence'}:`,
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
        // Error: "She will have went by tomorrow." — V2 instead of V3
        return buildErrorResult([
            { text: subject.text, correct: false },
            { text: aux, correct: false },
            { text: verb.v2, correct: true },          // ← ERROR: should be V3
            { text: timeMarker + ".", correct: false }
        ], meta);
    }

    // Error: wrong tense — "She has gone by tomorrow." — Present Perfect instead of Future
    const wrongAux = isNegative ? "hasn't" : "has";
    return buildErrorResult([
        { text: subject.text, correct: false },
        { text: wrongAux, correct: true },             // ← ERROR: should be will have / won't have
        { text: verb.v3, correct: false },
        { text: timeMarker + ".", correct: false }
    ], meta);
}


/* ═══════════════════════════════════════════
   QUESTIONS
   ═══════════════════════════════════════════ */

function generateQuestion(subject, verb, timeMarker, taskType) {
    const meta = { tense: TENSE_ID, sentenceType: 'question', taskType };
    const subj = subject.text.toLowerCase();
    const fullQ = `Will ${subj} have ${verb.v3} ${timeMarker}?`;

    if (taskType === 'gap') {
        // "___ she have finished by tomorrow?"  → Will
        return buildResult('gap',
            `___ ${subj} have ${verb.v3} ${timeMarker}?`,
            shuffleOptions(["Will", "Has", "Did"]),
            "Will",
            meta
        );
    }

    if (taskType === 'choice') {
        const wrong1 = `Has ${subj} ${verb.v3} ${timeMarker}?`;                  // Present Perfect
        const wrong2 = `Will ${subj} have ${verb.v2} ${timeMarker}?`;            // V2 instead of V3

        return buildResult('choice',
            'Choose the correct Future Perfect question:',
            shuffleOptions([fullQ, wrong1, wrong2]),
            fullQ,
            meta
        );
    }

    if (taskType === 'error') {
        const errorType = Math.random() > 0.5 ? 'aux' : 'verb';

        if (errorType === 'aux') {
            // Error: "Has she gone by tomorrow?" — Present Perfect aux
            return buildErrorResult([
                { text: "Has", correct: true },        // ← ERROR: should be "Will"
                { text: subj, correct: false },
                { text: "have " + verb.v3, correct: false },
                { text: timeMarker + "?", correct: false }
            ], meta);
        }

        // Error: "Will she have went by tomorrow?" — V2 instead of V3
        return buildErrorResult([
            { text: "Will", correct: false },
            { text: subj, correct: false },
            { text: "have " + verb.v2, correct: true },  // ← ERROR: should be V3
            { text: timeMarker + "?", correct: false }
        ], meta);
    }

    return buildResult('gap',
        `___ ${subj} have ${verb.v3} ${timeMarker}?`,
        shuffleOptions(["Will", "Has", "Did"]),
        "Will",
        meta
    );
}
