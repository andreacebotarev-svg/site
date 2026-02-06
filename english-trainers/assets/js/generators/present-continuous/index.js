import { VERBS, SUBJECTS, getRandom, getAux } from '../utils/verbs.js';

export function generatePresentContinuous(sentenceType, taskType) {
    const subject = getRandom(SUBJECTS);
    const verb = getRandom(VERBS);
    const isNegative = sentenceType === 'negative';
    const isQuestion = sentenceType === 'question';

    // 1. Формируем правильные части речи
    const aux = getAux('PC', subject.type, isNegative);
    // Для вопросов "Am I", "Are you", но в утверждениях "I am"
    const displayAux = aux;

    // Строим полное правильное предложение для reference
    let fullSentence = "";
    if (isQuestion) {
        // Вопрос: Aux + Subject + Ving?
        // Note: For questions we usually don't use contractions like "isn't he?" in simple drills, but let's stick to standard patterns.
        // Let's use positive Aux for questions usually: "Is he working?"
        const questionAux = getAux('PC', subject.type, false);
        fullSentence = `${questionAux} ${subject.text.toLowerCase()} ${verb.ing} now?`;

        // Переопределяем части для генерации
        return generateQuestionStructure(subject, verb, questionAux, taskType);
    } else {
        // Утверждение/Отрицание: Subject + Aux + Ving
        fullSentence = `${subject.text} ${displayAux} ${verb.ing} now.`;
    }

    // 2. Логика по типам задач (Task Types)

    // --- GAP FILL (Вставь пропущенное) ---
    if (taskType === 'gap') {
        // Чаще всего пропускаем Aux (am/is/are) или окончание (ing - сложнее реализовать, поэтому пропускаем всё слово)
        const hideAux = Math.random() > 0.5;

        if (hideAux) {
            return {
                type: 'gap',
                question: `${subject.text} ___ ${verb.ing} now.`,
                options: shuffleOptions([displayAux, getWrongAux(displayAux), "be"]),
                correct: displayAux
            };
        } else {
            return {
                type: 'gap',
                question: `${subject.text} ${displayAux} ___ now.`,
                options: shuffleOptions([verb.ing, verb.base, verb.v3]), // working / work / worked
                correct: verb.ing
            };
        }
    }

    // --- CHOICE (Выбери правильный вариант) ---
    if (taskType === 'choice') {
        const correct = fullSentence;
        const wrong1 = `${subject.text} ${displayAux} ${verb.base} now.`; // Error: work instead of working
        const wrong2 = `${subject.text} ${getWrongAux(displayAux)} ${verb.ing} now.`; // Error: wrong aux

        return {
            type: 'choice',
            question: `Choose the correct Present Continuous sentence:`,
            options: shuffleOptions([correct, wrong1, wrong2]),
            correct: correct
        };
    }

    // --- FIND ERROR (Найди ошибку) ---
    if (taskType === 'error') {
        // Генерируем предложение с ошибкой
        // Вариант 1: Ошибка в Aux (You is...)
        // Вариант 2: Ошибка в глаголе (You are work...)

        const errorType = Math.random() > 0.5 ? 'aux' : 'verb';

        if (errorType === 'aux') {
            const wrongAux = getWrongAux(displayAux);
            // Разбиваем на сегменты. Один из них - кнопка с ошибкой.
            const options = [
                { text: subject.text, correct: false },
                { text: wrongAux, correct: true }, // <-- ЭТО ОШИБКА, юзер должен нажать сюда
                { text: verb.ing, correct: false },
                { text: "now.", correct: false }
            ];

            // ✅ FIX: Assemble full sentence from options
            const fullSentence = options.map(opt => opt.text).join(' ');

            return {
                type: 'find_error',
                question: fullSentence, // ✅ NOW CONTAINS FULL SENTENCE!
                options
            };
        } else {
            // Ошибка в глаголе (забыли ing)
            const options = [
                { text: subject.text, correct: false },
                { text: displayAux, correct: false },
                { text: verb.base, correct: true }, // <-- ОШИБКА (нужен ing)
                { text: "now.", correct: false }
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

// Хелпер для генерации вопросов
function generateQuestionStructure(subject, verb, aux, taskType) {
    const fullQ = `${aux} ${subject.text.toLowerCase()} ${verb.ing} now?`;

    if (taskType === 'gap') {
        return {
            type: 'gap',
            question: `___ ${subject.text.toLowerCase()} ${verb.ing} now?`,
            options: shuffleOptions([aux, getWrongAux(aux), "Do"]),
            correct: aux
        };
    }

    if (taskType === 'choice') {
        const wrongQ1 = `${getWrongAux(aux)} ${subject.text.toLowerCase()} ${verb.ing} now?`;
        const wrongQ2 = `Do ${subject.text.toLowerCase()} ${verb.ing} now?`;
        return {
            type: 'choice',
            question: "Choose correct question:",
            options: shuffleOptions([fullQ, wrongQ1, wrongQ2]),
            correct: fullQ
        };
    }

    if (taskType === 'error') {
        return {
            type: 'find_error',
            question: "Tap the mistake:",
            options: [
                { text: "Do", correct: true }, // Ошибка (вместо Are/Is)
                { text: subject.text.toLowerCase(), correct: false },
                { text: verb.ing, correct: false },
                { text: "now?", correct: false }
            ]
        };
    }

    // Fallback
    return { type: 'gap', question: "Error", options: [], correct: "" };
}

function getWrongAux(correctAux) {
    const map = {
        "am": "are", "is": "are", "are": "is",
        "am not": "aren't", "isn't": "aren't", "aren't": "isn't"
    };
    return map[correctAux] || "is";
}

function shuffleOptions(array) {
    return array.sort(() => Math.random() - 0.5);
}
