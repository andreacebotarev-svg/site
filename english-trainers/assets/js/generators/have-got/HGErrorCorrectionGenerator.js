/**
 * HAVE GOT: ERROR CORRECTION GENERATOR
 * Найти и исправить ошибку в have/has got
 */

class HGErrorCorrectionGenerator {
  constructor(config = {}) {
    this.subjects = config.subjects || [];
    this.possessions = config.possessions || [];
  }

  generate() {
    const subjectObj = this._pick(this.subjects);
    const possession = this._pick(this.possessions);
    const correctVerb = subjectObj.verb;
    const wrongVerb = correctVerb === 'have' ? 'has' : 'have';

    const sentence = `${this._capitalize(subjectObj.pronoun)} <span class="error-highlight">${wrongVerb}</span> got ${possession}.`;

    const options = [
      `Заменить '${wrongVerb}' на '${correctVerb}'`,
      `Заменить '${subjectObj.pronoun}' на другое подлежащее`,
      `Убрать 'got'`,
      'Ошибки нет'
    ];

    const shuffled = this._shuffle(options);

    return {
      question: `
        <div style="margin-bottom: 1rem;">Найди и исправь ошибку:</div>
        <div class="error-sentence">${sentence}</div>
      `,
      options: shuffled,
      correctIndex: shuffled.indexOf(options[0]),
      metadata: {
        type: 'hg-error',
        subject: subjectObj.pronoun,
        possession,
        correctVerb,
        wrongVerb,
        isPlural: subjectObj.isPlural,
        explanation: subjectObj.isPlural
          ? `I/you/we/they use <strong>have</strong> got`
          : `He/she/it uses <strong>has</strong> got`,
        generatedFrom: 'HGErrorCorrectionGenerator'
      }
    };
  }

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  _shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

if (typeof window !== 'undefined') {
  window.HGErrorCorrectionGenerator = HGErrorCorrectionGenerator;
}
