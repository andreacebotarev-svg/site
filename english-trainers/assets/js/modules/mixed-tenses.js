// Get Trainer from global scope (mixed architecture compatibility)
const Trainer = window.Trainer || globalThis.Trainer;
if (!Trainer) {
  throw new Error('Trainer is not loaded. Ensure trainer-core.js is included before mixed-tenses module.');
}
import { LEVELS, TENSES, TASK_TYPES } from '../generators/mixed/strategies.js';
// Импортируем генератор-агрегатор
import { generateMixedQuestion } from '../generators/mixed/index.js';

export default class MixedTrainer extends Trainer {
    constructor(startLevelOrConfig = 1) {
        super({
            name: 'Mixed Tenses Trainer',
            maxLives: 3,
            streakBonus: 10
        });

        if (typeof startLevelOrConfig === 'object' && startLevelOrConfig.custom) {
            // Custom mode — config built from checkbox UI
            this.initCustom(startLevelOrConfig);
        } else {
            this.initLevel(startLevelOrConfig);
        }
    }

    initCustom(customConfig) {
        this.currentLevelId = 'custom';
        this.config = {
            id: 'custom',
            title: customConfig.title || 'Custom Workout',
            description: customConfig.description || 'Your personal tense mix',
            quota: { ...customConfig.quota },
            allowedTypes: customConfig.allowedTypes || ['affirmative', 'negative', 'question'],
            allowedTasks: customConfig.allowedTasks || [TASK_TYPES.GAP, TASK_TYPES.CHOICE, TASK_TYPES.FIND_ERROR],
            nextLevel: 'win'
        };
        this.quota = { ...this.config.quota };
        console.log('[MixedTrainer] Custom mode started', this.quota);
    }

    initLevel(levelId) {
        this.currentLevelId = levelId;
        this.config = LEVELS[levelId];

        // Клонируем квоты, чтобы уменьшать их в процессе игры
        if (this.config.mode === 'strict_count') {
             this.quota = { ...this.config.totalQuota };
        } else {
             this.quota = { ...this.config.quota };
        }

        console.log(`[MixedTrainer] Started Level ${levelId}`, this.quota);
    }

    async generateQuestion() {
        // 1. Проверка завершения уровня
        if (this.isLevelComplete()) {
            return this.handleLevelComplete();
        }

        // 2. Определение параметров следующего вопроса
        const params = this.getNextParams();

        // 3. Генерация данных вопроса
        const questionData = generateMixedQuestion(params.tense, params.type, params.task);

        // 4. Уменьшаем квоту
        this.decrementQuota(params);

        return questionData;
    }

    /**
     * Умный выбор следующего вопроса для балансировки
     */
    getNextParams() {
        let targetTense, targetType;

        if (this.config.mode === 'strict_count') {
            // Для ЗАЧЕТА: выбираем тип предложения (affirmative/negative/question), которого осталось больше
            const availableTypes = Object.keys(this.quota).filter(t => this.quota[t] > 0);
            targetType = this.randomChoice(availableTypes);
            // Время выбираем случайно из всех доступных
            targetTense = this.randomChoice(Object.values(TENSES));
        } else {
            // Для ОБЫЧНЫХ уровней: выбираем Время, которого осталось больше
            const availableTenses = Object.keys(this.quota).filter(t => this.quota[t] > 0);
            targetTense = this.randomChoice(availableTenses);

            // Тип предложения выбираем на основе весов или случайно из разрешенных
            if (this.config.typeWeights) {
                targetType = this.weightedRandom(this.config.typeWeights);
            } else {
                targetType = this.randomChoice(this.config.allowedTypes);
            }
        }

        return {
            tense: targetTense,
            type: targetType,
            task: this.randomChoice(this.config.allowedTasks)
        };
    }

    decrementQuota(params) {
        if (this.config.mode === 'strict_count') {
            this.quota[params.type]--;
        } else {
            this.quota[params.tense]--;
        }
    }

    isLevelComplete() {
        return Object.values(this.quota).every(count => count <= 0);
    }

    handleLevelComplete() {
        // Если есть следующий уровень - переходим
        if (this.config.nextLevel && this.config.nextLevel !== 'win') {
            // Здесь можно вызвать эффект салюта через EffectsManager
            console.log(`Level ${this.currentLevelId} Complete! Next level...`);
            this.initLevel(this.config.nextLevel);
            return this.generateQuestion();
        }

        // Финиш
        return {
            finished: true,
            stats: this.getStats() // Статистика из родительского класса
        };
    }

    getStats() {
        return {
            totalQuestions: this.state.questionsAnswered,
            correctAnswers: this.state.correctAnswers,
            accuracy: this.state.questionsAnswered > 0 ?
                Math.round((this.state.correctAnswers / this.state.questionsAnswered) * 100) : 0,
            currentStreak: this.state.streak,
            bestStreak: this.state.maxStreak,
            score: this.state.score
        };
    }

    // Helpers
    randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    weightedRandom(weights) {
        // Простая реализация взвешенного рандома
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        const rand = Math.random() * total;
        let sum = 0;
        for (const [key, value] of Object.entries(weights)) {
            sum += value;
            if (rand < sum) return key;
        }
        return Object.keys(weights)[0];
    }
}
