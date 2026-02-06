/**
 * ERROR CORRECTION QUESTION GENERATOR
 * Generates "Find the error" questions by injecting wrong verb forms.
 */

class ErrorCorrectionGenerator {
  constructor(config = {}) {
    this.verbMap = config.verbMap || {
      'I': 'am',
      'you': 'are',
      'he': 'is',
      'she': 'is',
      'it': 'is',
      'we': 'are',
      'they': 'are'
    };

    this.templates = [
      '{{pronoun}} {{wrongVerb}} a teacher',
      '{{pronoun}} {{wrongVerb}} at home',
      '{{pronoun}} {{wrongVerb}} very happy',
      '{{pronoun}} {{wrongVerb}} my friend',
      '{{pronoun}} {{wrongVerb}} always busy',
      '{{pronoun}} {{wrongVerb}} ready now',
      '{{pronoun}} {{wrongVerb}} from Russia',
      '{{pronoun}} {{wrongVerb}} a student',
      '{{pronoun}} {{wrongVerb}} tired today',
      '{{pronoun}} {{wrongVerb}} here'
    ];

    this.errorExplanations = {
      'I': "'I' всегда использует 'am'",
      'you': "'You' всегда использует 'are' (ед. и мн. число)",
      'he': "С he/she/it используется 'is'",
      'she': "С he/she/it используется 'is'",
      'it': "С he/she/it используется 'is'",
      'we': "С we/they используется 'are'",
      'they': "С we/they используется 'are'"
    };
  }

  generate() {
    const pronouns = Object.keys(this.verbMap);
    const pronoun = pronouns[Math.floor(Math.random() * pronouns.length)];
    const correctVerb = this.verbMap[pronoun];
    const wrongVerbs = ['am', 'is', 'are'].filter(v => v !== correctVerb);
    const wrongVerb = wrongVerbs[Math.floor(Math.random() * wrongVerbs.length)];

    const template = this.templates[Math.floor(Math.random() * this.templates.length)];
    
    const sentence = template
      .replace('{{pronoun}}', this._capitalize(pronoun))
      .replace('{{wrongVerb}}', `<span class="error-highlight">${wrongVerb}</span>`);

    const options = [
      `Заменить '${wrongVerb}' на '${correctVerb}'`,
      `Заменить '${this._capitalize(pronoun)}' на другое местоимение`,
      `Добавить 'not' после '${wrongVerb}'`,
      'Ошибки нет'
    ];

    return {
      question: `<div style="margin-bottom: 1rem;">Найди и исправь ошибку:</div><div class="error-sentence">${sentence}</div>`,
      options: this._shuffle(options),
      correctIndex: this._shuffle(options).indexOf(options[0]),
      metadata: {
        type: 'error-correction',
        pronoun,
        correctVerb,
        wrongVerb,
        explanation: this.errorExplanations[pronoun],
        generatedFrom: 'ErrorCorrectionGenerator'
      }
    };
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
  window.ErrorCorrectionGenerator = ErrorCorrectionGenerator;
}
