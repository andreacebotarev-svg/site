/**
 * PRESENT PERFECT CONTINUOUS GENERATOR
 * =====================================
 * Covers: affirmative (+), negative (-), question (?)
 * Task types: gap, choice, find_error (error)
 *
 * Grammar rules:
 *   (+) Subject + have/has been + Ving      → "She has been working since morning."
 *   (-) Subject + haven't/hasn't been + Ving → "She hasn't been working since morning."
 *   (?) Have/Has + Subject + been + Ving?    → "Has she been working since morning?"
 *
 * Agreement: "has been" for 3ps, "have been" for others.
 *
 * Common student errors:
 *   1. Missing "been": "She has working" ✗
 *   2. Base form instead of Ving: "She has been work" ✗
 *   3. Wrong has/have: "She have been working" ✗
 *   4. "had been" instead of "has/have been": Past Perfect Continuous confusion
 */

import { VERBS, SUBJECTS, getRandom } from '../utils/verbs.js';
import { shuffleOptions, getTimeMarker, buildResult, buildErrorResult } from '../utils/helpers.js';

const TENSE_ID = 'present-perfect-continuous';

function getAuxPPC(subjectType, isNegative) {
    if (subjectType === '3ps') return isNegative ? "hasn't been" : "has been";
    return isNegative ? "haven't been" : "have been";
}

function getWrongAuxPPC(correctAux) {
    const map = {
        "has been": "have been",       "have been": "has been",
        "hasn't been": "haven't been", "haven't been": "hasn't been"
    };
    return map[correctAux] || "had been";
}

/** Short form for questions: Has / Have */
function getQAux(subjectType) {
    return subjectType === '3ps' ? "Has" : "Have";
}

function getWrongQAux(subjectType) {
    return subjectType === '3ps' ? "Have" : "Has";
}

export function generatePresentPerfectContinuous(sentenceType, taskType) {
    const subject = getRandom(SUBJECTS);
    const verb = getRandom(VERBS);
    const timeMarker = getTimeMarker(TENSE_ID);
    const isNegative = sentenceType === 'negative';

    if (sentenceType === 'question') {
        return generateQuestion(subject, verb, timeMarker, taskType);
    }

    const aux = getAuxPPC(subject.type, isNegative);

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
        // "She ___ working since morning."  → has been / hasn't been
        return buildResult('gap',
            `${subject.text} ___ ${verb.ing} ${timeMarker}.`,
            shuffleOptions([aux, getWrongAuxPPC(aux), "had been"]),
            aux,
            meta
        );
    }

    // "She has been ___ since morning."  → working (Ving)
    return buildResult('gap',
        `${subject.text} ${aux} ___ ${timeMarker}.`,
        shuffleOptions([verb.ing, verb.base, verb.v3]),
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
    const wrong1  = `${subject.text} ${aux} ${verb.base} ${timeMarker}.`;          // Base instead of Ving
    const wrong2  = `${subject.text} ${getWrongAuxPPC(aux)} ${verb.ing} ${timeMarker}.`; // Wrong agreement

    return buildResult('choice',
        `Choose the correct Present Perfect Continuous ${isNegative ? 'negative' : 'sentence'}:`,
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
        // Error: "She has been work since morning." — base instead of Ving
        return buildErrorResult([
            { text: subject.text, correct: false },
            { text: aux, correct: false },
            { text: verb.base, correct: true },        // ← ERROR: should be Ving
            { text: timeMarker + ".", correct: false }
        ], meta);
    }

    // Error: wrong agreement — "She have been working since morning."
    return buildErrorResult([
        { text: subject.text, correct: false },
        { text: getWrongAuxPPC(aux), correct: true },  // ← ERROR: wrong agreement
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
    const qAux = getQAux(subject.type);
    const fullQ = `${qAux} ${subj} been ${verb.ing} ${timeMarker}?`;

    if (taskType === 'gap') {
        return buildResult('gap',
            `___ ${subj} been ${verb.ing} ${timeMarker}?`,
            shuffleOptions([qAux, getWrongQAux(subject.type), "Had"]),
            qAux,
            meta
        );
    }

    if (taskType === 'choice') {
        const wrongQAux = getWrongQAux(subject.type);
        const wrong1 = `${wrongQAux} ${subj} been ${verb.ing} ${timeMarker}?`;    // Wrong agreement
        const wrong2 = `Had ${subj} been ${verb.ing} ${timeMarker}?`;              // Past Perfect Continuous

        return buildResult('choice',
            'Choose the correct Present Perfect Continuous question:',
            shuffleOptions([fullQ, wrong1, wrong2]),
            fullQ,
            meta
        );
    }

    if (taskType === 'error') {
        const errorType = Math.random() > 0.5 ? 'aux' : 'verb';

        if (errorType === 'aux') {
            const wrongQAux = getWrongQAux(subject.type);
            return buildErrorResult([
                { text: wrongQAux, correct: true },    // ← ERROR: wrong Has/Have
                { text: subj, correct: false },
                { text: "been " + verb.ing, correct: false },
                { text: timeMarker + "?", correct: false }
            ], meta);
        }

        return buildErrorResult([
            { text: qAux, correct: false },
            { text: subj, correct: false },
            { text: "been " + verb.base, correct: true },  // ← ERROR: should be Ving
            { text: timeMarker + "?", correct: false }
        ], meta);
    }

    return buildResult('gap',
        `___ ${subj} been ${verb.ing} ${timeMarker}?`,
        shuffleOptions([qAux, getWrongQAux(subject.type), "Had"]),
        qAux,
        meta
    );
}
