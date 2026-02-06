import { TENSES } from './strategies.js';
import { generatePS } from '../present-simple/index.js';
import { generatePresentContinuous } from '../present-continuous/index.js';
import { generatePresentPerfect } from '../present-perfect/index.js';

export function generateMixedQuestion(tense, type, taskType) {
    console.log(`Generating: ${tense} | ${type} | ${taskType}`);

    switch (tense) {
        case TENSES.PS:
             return generatePS(type, taskType);

        case TENSES.PC:
            return generatePresentContinuous(type, taskType);

        case TENSES.PP:
            return generatePresentPerfect(type, taskType);

        default:
            console.error("Unknown tense:", tense);
            return generatePresentContinuous(type, taskType); // Fallback
    }
}

function generatePSMock(tense, type, taskType) {
    let questionText = `[Present Simple] ${type}`;
    let answers = [];
    let correctAnswer = "";

    if (taskType === TASK_TYPES.GAP) {
        if (type === 'affirmative') {
            questionText += " She ___ to school every day.";
            answers = ["go", "goes", "going"];
            correctAnswer = "goes";
        } else if (type === 'negative') {
            questionText += " They ___ like pizza.";
            answers = ["doesn't", "don't", "isn't"];
            correctAnswer = "don't";
        } else if (type === 'question') {
            questionText += " ___ you study English?";
            answers = ["Do", "Does", "Are"];
            correctAnswer = "Do";
        }
    } else if (taskType === TASK_TYPES.CHOICE) {
        questionText = `Choose correct Present Simple (${type}):`;
        if (type === 'affirmative') {
            answers = [
                "She go to school",
                "She goes to school",
                "She going to school"
            ];
            correctAnswer = "She goes to school";
        } else if (type === 'negative') {
            answers = [
                "He doesn't likes coffee",
                "He don't like coffee",
                "He doesn't like coffee"
            ];
            correctAnswer = "He doesn't like coffee";
        } else if (type === 'question') {
            answers = [
                "Does she likes tea?",
                "Do she like tea?",
                "Does she like tea?"
            ];
            correctAnswer = "Does she like tea?";
        }
    } else if (taskType === TASK_TYPES.FIND_ERROR) {
        questionText = "Find the mistake in Present Simple:";
        if (type === 'affirmative') {
            answers = [
                { text: "She work", correct: true }, // ошибка - нет -s
                { text: "every day", correct: false },
                { text: "at school", correct: false }
            ];
        } else if (type === 'negative') {
            answers = [
                { text: "I don't", correct: false },
                { text: "likes", correct: true }, // ошибка - likes вместо like
                { text: "coffee", correct: false }
            ];
        } else if (type === 'question') {
            answers = [
                { text: "Does", correct: false },
                { text: "he", correct: false },
                { text: "works", correct: true } // ошибка - works в вопросе OK, но даем другую ошибку
            ];
        }

        return {
            type: 'find_error',
            question: questionText,
            options: answers
        };
    }

    return {
        type: 'standard',
        question: questionText,
        options: answers,
        correct: correctAnswer,
        metadata: {
            tense: tense,
            sentenceType: type,
            taskType: taskType
        }
    };
}

function generatePCMock(tense, type, taskType) {
    let questionText = `[Present Continuous] ${type}`;
    let answers = [];
    let correctAnswer = "";

    if (taskType === TASK_TYPES.GAP) {
        if (type === 'affirmative') {
            questionText += " She ___ (read) a book now.";
            answers = ["reading", "reads", "read"];
            correctAnswer = "reading";
        } else if (type === 'negative') {
            questionText += " They ___ (play) football.";
            answers = ["aren't playing", "don't play", "isn't playing"];
            correctAnswer = "aren't playing";
        } else if (type === 'question') {
            questionText += " ___ you ___ (study)?";
            answers = ["Are...studying", "Do...study", "Is...studying"];
            correctAnswer = "Are...studying";
        }
    } else if (taskType === TASK_TYPES.CHOICE) {
        questionText = `Choose correct Present Continuous (${type}):`;
        if (type === 'affirmative') {
            answers = [
                "I am reading now",
                "I read now",
                "I reading now"
            ];
            correctAnswer = "I am reading now";
        } else if (type === 'negative') {
            answers = [
                "She isn't singing",
                "She doesn't sing",
                "She not singing"
            ];
            correctAnswer = "She isn't singing";
        } else if (type === 'question') {
            answers = [
                "Is he watching TV?",
                "Does he watches TV?",
                "Is he watch TV?"
            ];
            correctAnswer = "Is he watching TV?";
        }
    } else if (taskType === TASK_TYPES.FIND_ERROR) {
        questionText = "Find the mistake in Present Continuous:";
        if (type === 'affirmative') {
            answers = [
                { text: "He is", correct: false },
                { text: "work", correct: true }, // ошибка - work вместо working
                { text: "now", correct: false }
            ];
        } else if (type === 'negative') {
            answers = [
                { text: "They", correct: false },
                { text: "don't", correct: true }, // ошибка - don't вместо aren't
                { text: "playing", correct: false }
            ];
        } else if (type === 'question') {
            answers = [
                { text: "Are", correct: false },
                { text: "she", correct: false },
                { text: "reads", correct: true } // ошибка - reads вместо reading
            ];
        }

        return {
            type: 'find_error',
            question: questionText,
            options: answers
        };
    }

    return {
        type: 'standard',
        question: questionText,
        options: answers,
        correct: correctAnswer,
        metadata: {
            tense: tense,
            sentenceType: type,
            taskType: taskType
        }
    };
}

function generatePPMock(tense, type, taskType) {
    let questionText = `[Present Perfect] ${type}`;
    let answers = [];
    let correctAnswer = "";

    if (taskType === TASK_TYPES.GAP) {
        if (type === 'affirmative') {
            questionText += " She ___ (visit) Paris.";
            answers = ["has visited", "visited", "have visited"];
            correctAnswer = "has visited";
        } else if (type === 'negative') {
            questionText += " They ___ (see) that movie.";
            answers = ["haven't seen", "don't see", "didn't see"];
            correctAnswer = "haven't seen";
        } else if (type === 'question') {
            questionText += " ___ you ___ (be) to London?";
            answers = ["Have...been", "Did...be", "Are...been"];
            correctAnswer = "Have...been";
        }
    } else if (taskType === TASK_TYPES.CHOICE) {
        questionText = `Choose correct Present Perfect (${type}):`;
        if (type === 'affirmative') {
            answers = [
                "I have finished my homework",
                "I finished my homework",
                "I finish my homework"
            ];
            correctAnswer = "I have finished my homework";
        } else if (type === 'negative') {
            answers = [
                "She hasn't eaten breakfast",
                "She didn't eat breakfast",
                "She don't eat breakfast"
            ];
            correctAnswer = "She hasn't eaten breakfast";
        } else if (type === 'question') {
            answers = [
                "Have you ever been to Paris?",
                "Did you ever be to Paris?",
                "Are you ever been to Paris?"
            ];
            correctAnswer = "Have you ever been to Paris?";
        }
    } else if (taskType === TASK_TYPES.FIND_ERROR) {
        questionText = "Find the mistake in Present Perfect:";
        if (type === 'affirmative') {
            answers = [
                { text: "She have", correct: true }, // ошибка - have вместо has
                { text: "visited", correct: false },
                { text: "London", correct: false }
            ];
        } else if (type === 'negative') {
            answers = [
                { text: "They", correct: false },
                { text: "haven't", correct: false },
                { text: "saw", correct: true } // ошибка - saw вместо seen
            ];
        } else if (type === 'question') {
            answers = [
                { text: "Has", correct: false },
                { text: "she", correct: false },
                { text: "went", correct: true } // ошибка - went вместо gone
            ];
        }

        return {
            type: 'find_error',
            question: questionText,
            options: answers
        };
    }

    return {
        type: 'standard',
        question: questionText,
        options: answers,
        correct: correctAnswer,
        metadata: {
            tense: tense,
            sentenceType: type,
            taskType: taskType
        }
    };
}

function generateFallbackQuestion(tense, type, taskType) {
    // Универсальная заглушка на случай проблем
    return {
        type: 'standard',
        question: `Mock question for ${tense} (${type}) - ${taskType}`,
        options: ["Option A", "Option B", "Option C"],
        correct: "Option A",
        metadata: {
            tense: tense,
            sentenceType: type,
            taskType: taskType
        }
    };
}
