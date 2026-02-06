/**
 * Конфигурация уровней для Mixed Trainer.
 * Определяет правила игры. Здесь мы настраиваем квоты вопросов и типы заданий.
 */

export const TENSES = {
    PS: 'present-simple',
    PC: 'present-continuous',
    PP: 'present-perfect'
};

export const TASK_TYPES = {
    GAP: 'gap',          // Вставь пропущенное слово
    CHOICE: 'choice',    // Выбери правильный вариант
    FIND_ERROR: 'error'  // Найди ошибку в предложении
};

export const LEVELS = {
    // УРОВЕНЬ 1: Проверка знаний (Только утверждения)
    1: {
        id: 1,
        title: "Level 1: Basics",
        description: "Only affirmative sentences (+)",
        quota: { // Сколько вопросов каждого типа нужно задать
            [TENSES.PS]: 5,
            [TENSES.PC]: 5,
            [TENSES.PP]: 5
        },
        allowedTypes: ['affirmative'],
        allowedTasks: [TASK_TYPES.GAP, TASK_TYPES.CHOICE], // На 1 уровне без поиска ошибок, чтобы не путать
        nextLevel: 2
    },

    // УРОВЕНЬ 2: Утверждения + Отрицания
    2: {
        id: 2,
        title: "Level 2: Negation",
        description: "Affirmative (+) and Negative (-) sentences",
        quota: {
            [TENSES.PS]: 5,
            [TENSES.PC]: 5,
            [TENSES.PP]: 5
        },
        allowedTypes: ['affirmative', 'negative'],
        allowedTasks: [TASK_TYPES.GAP, TASK_TYPES.CHOICE, TASK_TYPES.FIND_ERROR],
        nextLevel: 3
    },

    // УРОВЕНЬ 3: Полный микс (+ / - / ?)
    3: {
        id: 3,
        title: "Level 3: Master",
        description: "All sentence types (+, -, ?)",
        quota: {
            [TENSES.PS]: 5,
            [TENSES.PC]: 5,
            [TENSES.PP]: 5
        },
        allowedTypes: ['affirmative', 'negative', 'question'],
        allowedTasks: [TASK_TYPES.GAP, TASK_TYPES.CHOICE, TASK_TYPES.FIND_ERROR],
        nextLevel: 'win' // Конец базового цикла
    },

    // ХАРДКОР: Преимущественно вопросы и отрицания
    'hard': {
        id: 'hard',
        title: "Hardcore Mode",
        description: "Focus on Questions (?) and Negatives (-)",
        infinite: true, // Нет фиксированной квоты, бесконечный режим или пока не надоест
        quota: {
            [TENSES.PS]: 10, // Пакеты по 10, потом сброс
            [TENSES.PC]: 10,
            [TENSES.PP]: 10
        },
        // Веса для рандомайзера типов предложений
        typeWeights: {
            affirmative: 0.1, // 10%
            negative: 0.45,   // 45%
            question: 0.45    // 45%
        },
        allowedTasks: [TASK_TYPES.GAP, TASK_TYPES.FIND_ERROR] // Только сложные задания
    },

    // ЗАЧЕТ: 60 вопросов (20+, 20-, 20?)
    'exam': {
        id: 'exam',
        title: "FINAL EXAM",
        description: "60 Questions: 20(+), 20(-), 20(?)",
        mode: 'strict_count', // Особый режим подсчета
        totalQuota: {
            affirmative: 20,
            negative: 20,
            question: 20
        },
        // В экзамене времена миксуются случайно, главное соблюсти типы предложений
        allowedTasks: [TASK_TYPES.GAP, TASK_TYPES.CHOICE, TASK_TYPES.FIND_ERROR]
    }
};
