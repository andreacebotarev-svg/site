import { VERBS, SUBJECTS, getRandom, getAux } from '../utils/verbs.js';

export function generatePresentPerfect(sentenceType, taskType) {
    const subject = getRandom(SUBJECTS);
    const verb = getRandom(VERBS);
    const isNegative = sentenceType === 'negative';
    const isQuestion = sentenceType === 'question';

    const aux = getAux('PP', subject.type, isNegative);

    // --- ВОПРОСЫ (?) ---
    if (isQuestion) {
        const qAux = getAux('PP', subject.type, false); // Have/Has
        const fullQ = `${qAux} ${subject.text.toLowerCase()} ${verb.v3} already?`;

        if (taskType === 'gap') {
            return {
                type: 'gap',
                question: `___ ${subject.text.toLowerCase()} ${verb.v3} yet?`,
                options: shuffleOptions([qAux, getWrongAux(qAux), "Did"]),
                correct: qAux
            };
        }

        if (taskType === 'choice') {
            return {
                type: 'choice',
                question: "Choose correct Present Perfect:",
                options: shuffleOptions([
                    fullQ,
                    `${qAux} ${subject.text.toLowerCase()} ${verb.v2} already?`, // Error V2
                    `Did ${subject.text.toLowerCase()} ${verb.base} already?` // Error PS
                ]),
                correct: fullQ
            };
        }

        if (taskType === 'error') {
            const options = [
                { text: qAux, correct: false },
                { text: subject.text.toLowerCase(), correct: false },
                { text: verb.v2, correct: true }, // Error (used V2 instead of V3)
                { text: "yet?", correct: false }
            ];

            // ✅ FIX: Assemble full sentence from options
            const fullSentence = options.map(opt => opt.text).join(' ');

            return {
                type: 'find_error',
                question: fullSentence, // ✅ NOW CONTAINS FULL SENTENCE!
                options
            };
        }
    }

    // --- УТВЕРЖДЕНИЯ И ОТРИЦАНИЯ (+/-) ---
    const fullSentence = `${subject.text} ${aux} ${verb.v3} already.`;

    if (taskType === 'gap') {
        const hideAux = Math.random() > 0.5;
        if (hideAux) {
             return {
                type: 'gap',
                question: `${subject.text} ___ ${verb.v3} already.`,
                options: shuffleOptions([aux, getWrongAux(aux), "had"]),
                correct: aux
            };
        } else {
             return {
                type: 'gap',
                question: `${subject.text} ${aux} ___ already.`,
                options: shuffleOptions([verb.v3, verb.v2, verb.ing]), // done / did / doing
                correct: verb.v3
            };
        }
    }

    if (taskType === 'choice') {
        return {
            type: 'choice',
            question: "Choose correct sentence:",
            options: shuffleOptions([
                fullSentence,
                `${subject.text} ${aux} ${verb.base} already.`, // Wrong verb form
                `${subject.text} ${getWrongAux(aux)} ${verb.v3} already.` // Wrong aux
            ]),
            correct: fullSentence
        };
    }

    if (taskType === 'error') {
        const errorMode = Math.random() > 0.5 ? 'aux' : 'verb';

        if (errorMode === 'aux') {
            const options = [
                { text: subject.text, correct: false },
                { text: getWrongAux(aux), correct: true }, // Error!
                { text: verb.v3, correct: false },
                { text: "just now.", correct: false }
            ];

            // ✅ FIX: Assemble full sentence from options
            const fullSentence = options.map(opt => opt.text).join(' ');

            return {
                type: 'find_error',
                question: fullSentence, // ✅ NOW CONTAINS FULL SENTENCE!
                options
            };
        } else {
            const options = [
                { text: subject.text, correct: false },
                { text: aux, correct: false },
                { text: verb.v2, correct: true }, // Error (V2 instead of V3)
                { text: "already.", correct: false }
            ];

            // ✅ FIX: Assemble full sentence from options
            const fullSentence = options.map(opt => opt.text).join(' ');

            return {
                type: 'find_error',
                question: fullSentence, // ✅ NOW CONTAINS FULL SENTENCE!
                options
            };
        }
    }
}

function getWrongAux(correctAux) {
    const map = {
        "have": "has", "has": "have",
        "haven't": "hasn't", "hasn't": "haven't"
    };
    return map[correctAux] || "has";
}

function shuffleOptions(array) {
    return array.sort(() => Math.random() - 0.5);
}
