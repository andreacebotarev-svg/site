/**
 * FUTURE SIMPLE GENERATOR
 * ========================
 * Covers: affirmative (+), negative (-), question (?)
 * Task types: gap, choice, find_error (error)
 *
 * Grammar rules:
 *   (+) Subject + will + V1 (base)     → "She will go to school tomorrow."
 *   (-) Subject + won't + V1 (base)    → "She won't go to school tomorrow."
 *   (?) Will + Subject + V1 (base)?    → "Will she go to school tomorrow?"
 *
 * Key: "will" is UNIVERSAL — same for all subjects. No agreement.
 * After will/won't the verb is ALWAYS base form (V1).
 *
 * Common student errors this generator tests:
 *   1. Adding -s after will: "She will goes" ✗
 *   2. Using V2 after will: "She will went" ✗
 *   3. Using V3 after will: "She will gone" ✗
 *   4. Using Ving after will: "She will going" ✗
 *   5. Using past/present aux: "She did go tomorrow" ✗
 */

import { VERBS, SUBJECTS, getRandom } from '../utils/verbs.js';
import { shuffleOptions, getTimeMarker, buildResult, buildErrorResult } from '../utils/helpers.js';

const TENSE_ID = 'future-simple';

/**
 * Helper: compute 3rd person singular form for generating wrong options.
 */
function addS(base) {
    if (base === 'go') return 'goes';
    if (base === 'do') return 'does';
    if (base === 'have') return 'has';
    if (/[sxz]$|[cs]h$/.test(base)) return base + 'es';
    if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + 'ies';
    return base + 's';
}

export function generateFutureSimple(sentenceType, taskType) {
    const subject = getRandom(SUBJECTS);
    const verb = getRandom(VERBS);
    const timeMarker = getTimeMarker(TENSE_ID);

    if (sentenceType === 'question') {
        return generateQuestion(subject, verb, timeMarker, taskType);
    }

    const isNegative = sentenceType === 'negative';
    const aux = isNegative ? "won't" : "will";

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
        // "She ___ go tomorrow."  → will / won't
        return buildResult('gap',
            `${subject.text} ___ ${verb.base} ${timeMarker}.`,
            shuffleOptions([aux, isNegative ? "doesn't" : "does", isNegative ? "didn't" : "did"]),
            aux,
            meta
        );
    }

    // "She will ___ (go) tomorrow."  → go (base)
    return buildResult('gap',
        `${subject.text} ${aux} ___ ${timeMarker}.`,
        shuffleOptions([verb.base, verb.v2, verb.ing]),
        verb.base,
        meta
    );
}


/* ═══════════════════════════════════════════
   CHOICE
   ═══════════════════════════════════════════ */

function generateChoice(subject, verb, aux, isNegative, timeMarker) {
    const meta = { tense: TENSE_ID, sentenceType: isNegative ? 'negative' : 'affirmative', taskType: 'choice' };

    const correct = `${subject.text} ${aux} ${verb.base} ${timeMarker}.`;
    const wrong1  = `${subject.text} ${aux} ${verb.v2} ${timeMarker}.`;               // V2 after will
    const wrong2  = `${subject.text} ${aux} ${addS(verb.base)} ${timeMarker}.`;        // -s after will

    return buildResult('choice',
        `Choose the correct Future Simple ${isNegative ? 'negative' : 'sentence'}:`,
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
        // Error: "She will went tomorrow." — V2 instead of base
        return buildErrorResult([
            { text: subject.text, correct: false },
            { text: aux, correct: false },
            { text: verb.v2, correct: true },          // ← ERROR: should be base form
            { text: timeMarker + ".", correct: false }
        ], meta);
    }

    // Error: wrong aux — "She does go tomorrow." (present aux)
    const wrongAux = isNegative ? "doesn't" : "does";
    return buildErrorResult([
        { text: subject.text, correct: false },
        { text: wrongAux, correct: true },             // ← ERROR: should be will/won't
        { text: verb.base, correct: false },
        { text: timeMarker + ".", correct: false }
    ], meta);
}


/* ═══════════════════════════════════════════
   QUESTIONS
   ═══════════════════════════════════════════ */

function generateQuestion(subject, verb, timeMarker, taskType) {
    const meta = { tense: TENSE_ID, sentenceType: 'question', taskType };
    const subj = subject.text.toLowerCase();
    const fullQ = `Will ${subj} ${verb.base} ${timeMarker}?`;

    if (taskType === 'gap') {
        // "___ she go tomorrow?"  → Will
        return buildResult('gap',
            `___ ${subj} ${verb.base} ${timeMarker}?`,
            shuffleOptions(["Will", "Does", "Did"]),
            "Will",
            meta
        );
    }

    if (taskType === 'choice') {
        const wrong1 = `Does ${subj} ${verb.base} ${timeMarker}?`;       // Present aux
        const wrong2 = `Will ${subj} ${verb.v2} ${timeMarker}?`;         // V2 after will

        return buildResult('choice',
            'Choose the correct Future Simple question:',
            shuffleOptions([fullQ, wrong1, wrong2]),
            fullQ,
            meta
        );
    }

    if (taskType === 'error') {
        const errorType = Math.random() > 0.5 ? 'aux' : 'verb';

        if (errorType === 'aux') {
            // Error: "Does she go tomorrow?" — present aux
            return buildErrorResult([
                { text: "Does", correct: true },       // ← ERROR: should be "Will"
                { text: subj, correct: false },
                { text: verb.base, correct: false },
                { text: timeMarker + "?", correct: false }
            ], meta);
        }

        // Error: "Will she went tomorrow?" — V2
        return buildErrorResult([
            { text: "Will", correct: false },
            { text: subj, correct: false },
            { text: verb.v2, correct: true },          // ← ERROR: should be base
            { text: timeMarker + "?", correct: false }
        ], meta);
    }

    return buildResult('gap',
        `___ ${subj} ${verb.base} ${timeMarker}?`,
        shuffleOptions(["Will", "Does", "Did"]),
        "Will",
        meta
    );
}
