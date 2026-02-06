/**
 * PRESENT SIMPLE TRAINER V2
 * Dynamic question generation via 5 generator classes
 */

class PresentSimpleTrainer extends Trainer {
  constructor(config = {}) {
    super({
      name: 'Present Simple Trainer',
      maxLives: 3,
      ...config
    });

    // Third-person singular subjects
    this.thirdPersonSingular = ['he', 'she', 'it', 'the cat', 'John', 'my friend'];

    // Verb database
    this.verbs = [
      { base: 'work', thirdPerson: 'works' },
      { base: 'play', thirdPerson: 'plays' },
      { base: 'study', thirdPerson: 'studies' },
      { base: 'go', thirdPerson: 'goes' },
      { base: 'watch', thirdPerson: 'watches' },
      { base: 'have', thirdPerson: 'has' },
      { base: 'do', thirdPerson: 'does' },
      { base: 'teach', thirdPerson: 'teaches' },
      { base: 'fix', thirdPerson: 'fixes' },
      { base: 'wash', thirdPerson: 'washes' },
      { base: 'try', thirdPerson: 'tries' },
      { base: 'fly', thirdPerson: 'flies' },
      { base: 'catch', thirdPerson: 'catches' },
      { base: 'miss', thirdPerson: 'misses' },
      { base: 'read', thirdPerson: 'reads' },
      { base: 'write', thirdPerson: 'writes' },
      { base: 'live', thirdPerson: 'lives' },
      { base: 'like', thirdPerson: 'likes' }
    ];

    // Initialize generators
    const genConfig = {
      verbs: this.verbs,
      subjects3sg: this.thirdPersonSingular
    };

    this.generators = {
      recognition: new PSRecognitionGenerator(genConfig),
      'fill-in': new PSFillInGenerator(genConfig),
      'error-correction': new PSErrorCorrectionGenerator(genConfig),
      transformation: new PSTransformationGenerator(genConfig),
      context: new PSContextGenerator(genConfig)
    };

    // Question type weights
    this.typeWeights = {
      easy: { recognition: 0.6, 'fill-in': 0.4 },
      medium: { 'fill-in': 0.5, 'error-correction': 0.3, recognition: 0.2 },
      hard: { transformation: 0.4, context: 0.2, 'error-correction': 0.25, 'fill-in': 0.15 }
    };

    this._currentDifficulty = 'easy';
  }

  generateQuestion() {
    this._updateDifficulty();

    const questionType = this._selectQuestionType();
    const generator = this.generators[questionType];

    if (questionType === 'fill-in') {
      const fillMode = this._currentDifficulty === 'easy' ? 'verb' : 'aux';
      return generator.generate(fillMode);
    }

    return generator.generate();
  }

  _selectQuestionType() {
    const weights = this.typeWeights[this._currentDifficulty] || this.typeWeights.easy;
    const types = Object.keys(weights);
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    
    let random = Math.random() * totalWeight;
    for (const type of types) {
      random -= weights[type];
      if (random <= 0) return type;
    }
    
    return types[0];
  }

  _updateDifficulty() {
    const { questionsAnswered, correctAnswers } = this.state;
    
    if (questionsAnswered < 5) {
      this._currentDifficulty = 'easy';
    } else if (questionsAnswered < 12) {
      const accuracy = correctAnswers / questionsAnswered;
      this._currentDifficulty = accuracy >= 0.75 ? 'medium' : 'easy';
    } else {
      const accuracy = correctAnswers / questionsAnswered;
      if (accuracy >= 0.85) this._currentDifficulty = 'hard';
      else if (accuracy >= 0.7) this._currentDifficulty = 'medium';
      else this._currentDifficulty = 'easy';
    }
  }

  getFeedback(isCorrect) {
    if (isCorrect) {
      return ['Правильно! 🎯', 'Отлично! ⭐', 'Верно! 💯', 'Супер! 🔥'][Math.floor(Math.random() * 4)];
    }

    const meta = this.state.currentQuestion.metadata;
    
    // Use explanation from generator
    if (meta.explanation) {
      return `
        <div>Неправильно. Правильный ответ: <strong>${meta.correctVerb || meta.correctAux}</strong></div>
        <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">
          💡 ${meta.explanation}
        </div>
      `;
    }

    // Fallback
    let tip = '';
    if (meta.is3sg) {
      tip = 'С he/she/it нужно окончание <strong>-s/-es</strong> или <strong>does</strong>';
    } else {
      tip = 'С I/you/we/they используй <strong>базовую форму</strong> и <strong>do</strong>';
    }

    return `
      <div>Неправильно. Попробуй ещё раз!</div>
      <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">
        💡 Подсказка: ${tip}
      </div>
    `;
  }
}

if (typeof window !== 'undefined') {
  window.PresentSimpleTrainer = PresentSimpleTrainer;
}
