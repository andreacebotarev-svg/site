/**
 * PAST PERFECT GENERATOR
 * =======================
 * Covers: affirmative (+), negative (-), question (?)
 * Task types: gap, choice, find_error (error)
 *
 * Grammar rules:
 *   (+) Subject + had + V3              → "She had finished before that."
 *   (-) Subject + hadn't + V3           → "She hadn't finished before that."
 *   (?) Had + Subject + V3?             → "Had she finished before that?"
 *
 * "had" is universal — no subject agreement.
 * After "had" the verb MUST be V3 (past participle).
 *
 * Common student errors:
 *   1. V2 instead of V3: "She had went" ✗  (should be "gone")
 *   2. Base form after had: "She had go" ✗
 *   3. has/have instead of had: "She has gone before that" ✗ (Present Perfect!)
 *   4. V1 in questions: "Had she go?" ✗
 */

import { VERBS, SUBJECTS, getRandom } from '../utils/verbs.js';
import { shuffleOptions, getTimeMarker, buildResult, buildErrorResult } from '../utils/helpers.js';

const TENSE_ID = 'past-perfect';

export function generatePastPerfect(sentenceType, taskType) {
    const subject = getRandom(SUBJECTS);
    const verb = getRandom(VERBS);
    const timeMarker = getTimeMarker(TENSE_ID);
    const isNegative = sentenceType === 'negative';

    if (sentenceType === 'question') {
        return generateQuestion(subject, verb, timeMarker, taskType);
    }

    const aux = isNegative ? "hadn't" : "had";

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
        // "She ___ finished before that."  → had / hadn't
        const wrongAux = isNegative ? "hasn't" : "has";
        return buildResult('gap',
            `${subject.text} ___ ${verb.v3} ${timeMarker}.`,
            shuffleOptions([aux, wrongAux, "did"]),
            aux,
            meta
        );
    }

    // "She had ___ before that."  → finished (V3)
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
    const wrong1  = `${subject.text} ${aux} ${verb.v2} ${timeMarker}.`;        // V2 instead of V3
    const wrongAux = isNegative ? "hasn't" : "has";
    const wrong2  = `${subject.text} ${wrongAux} ${verb.v3} ${timeMarker}.`;   // Present Perfect instead

    return buildResult('choice',
        `Choose the correct Past Perfect ${isNegative ? 'negative' : 'sentence'}:`,
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
        // Error: "She had went before that." — V2 instead of V3
        return buildErrorResult([
            { text: subject.text, correct: false },
            { text: aux, correct: false },
            { text: verb.v2, correct: true },          // ← ERROR: should be V3
            { text: timeMarker + ".", correct: false }
        ], meta);
    }

    // Error: "She has gone before that." — Present Perfect aux
    const wrongAux = isNegative ? "hasn't" : "has";
    return buildErrorResult([
        { text: subject.text, correct: false },
        { text: wrongAux, correct: true },             // ← ERROR: should be had/hadn't
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
    const fullQ = `Had ${subj} ${verb.v3} ${timeMarker}?`;

    if (taskType === 'gap') {
        return buildResult('gap',
            `___ ${subj} ${verb.v3} ${timeMarker}?`,
            shuffleOptions(["Had", "Has", "Did"]),
            "Had",
            meta
        );
    }

    if (taskType === 'choice') {
        const wrong1 = `Has ${subj} ${verb.v3} ${timeMarker}?`;               // Present Perfect
        const wrong2 = `Had ${subj} ${verb.v2} ${timeMarker}?`;               // V2 instead of V3

        return buildResult('choice',
            'Choose the correct Past Perfect question:',
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
                { text: verb.v3, correct: false },
                { text: timeMarker + "?", correct: false }
            ], meta);
        }

        return buildErrorResult([
            { text: "Had", correct: false },
            { text: subj, correct: false },
            { text: verb.v2, correct: true },          // ← ERROR: should be V3
            { text: timeMarker + "?", correct: false }
        ], meta);
    }

    return buildResult('gap',
        `___ ${subj} ${verb.v3} ${timeMarker}?`,
        shuffleOptions(["Had", "Has", "Did"]),
        "Had",
        meta
    );
}
