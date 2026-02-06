/**
 * PRESENT SIMPLE: ERROR CORRECTION GENERATOR
 * Найти и исправить ошибку в форме глагола
 */

class PSErrorCorrectionGenerator {
  constructor(config = {}) {
    this.verbs = config.verbs || [];
    this.subjects3sg = config.subjects3sg || ['he', 'she', 'it', 'the cat', 'John', 'my friend'];
    this.allSubjects = ['I', 'you', 'he', 'she', 'it', 'we', 'they'];
  }

  generate() {
    const verb = this._pick(this.verbs);
    const subject = this._pick(this.allSubjects);
    const is3sg = this.subjects3sg.includes(subject);

    // Неправильная форма
    const wrongVerb = is3sg ? verb.base : verb.thirdPerson;
    const correctVerb = is3sg ? verb.thirdPerson : verb.base;

    const sentence = `${this._capitalize(subject)} <span class="error-highlight">${wrongVerb}</span> every day.`;

    const options = [
      `Заменить '${wrongVerb}' на '${correctVerb}'`,
      `Заменить '${subject}' на другое подлежащее`,
      `Добавить do/does перед '${wrongVerb}'`,
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
        type: 'ps-error',
        subject,
        verb: verb.base,
        correctVerb,
        wrongVerb,
        is3sg,
        explanation: is3sg
          ? `He/she/it uses <strong>${correctVerb}</strong> (add -s/-es)`
          : `I/you/we/they use base form <strong>${correctVerb}</strong>`,
        generatedFrom: 'PSErrorCorrectionGenerator'
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
  window.PSErrorCorrectionGenerator = PSErrorCorrectionGenerator;
}
