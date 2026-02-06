/**
 * TRANSFORMATION QUESTION GENERATOR
 * Generates "Make negative/question/plural" transformation tasks.
 */

class TransformationGenerator {
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

    // Transformation types
    this.transformations = ['negative', 'question', 'plural'];

    this.templates = [
      '{{pronoun}} {{verb}} happy',
      '{{pronoun}} {{verb}} at home',
      '{{pronoun}} {{verb}} a student',
      '{{pronoun}} {{verb}} ready',
      '{{pronoun}} {{verb}} tired',
      '{{pronoun}} {{verb}} busy',
      '{{pronoun}} {{verb}} here',
      '{{pronoun}} {{verb}} late'
    ];

    // Plural conversion rules
    this.pluralMap = {
      'I': { pronoun: 'we', noun: 'students' },
      'you': { pronoun: 'you', noun: 'students' },
      'he': { pronoun: 'they', noun: 'students' },
      'she': { pronoun: 'they', noun: 'students' },
      'it': { pronoun: 'they', noun: 'things' }
    };
  }

  generate() {
    const type = this.transformations[Math.floor(Math.random() * this.transformations.length)];
    
    if (type === 'negative') {
      return this._generateNegative();
    } else if (type === 'question') {
      return this._generateQuestion();
    } else {
      return this._generatePlural();
    }
  }

  _generateNegative() {
    const pronouns = Object.keys(this.verbMap);
    const pronoun = pronouns[Math.floor(Math.random() * pronouns.length)];
    const verb = this.verbMap[pronoun];
    const template = this.templates[Math.floor(Math.random() * this.templates.length)];

    const sentence = template
      .replace('{{pronoun}}', this._capitalize(pronoun))
      .replace('{{verb}}', verb);

    const correctNegative = template
      .replace('{{pronoun}}', this._capitalize(pronoun))
      .replace('{{verb}}', `${verb} not`);

    const wrongOptions = [
      template.replace('{{pronoun}}', this._capitalize(pronoun)).replace('{{verb}}', `not ${verb}`),
      template.replace('{{pronoun}}', this._capitalize(pronoun)).replace('{{verb}}', verb) + ' not',
      'Not ' + template.replace('{{pronoun}}', pronoun).replace('{{verb}}', verb)
    ];

    const options = this._shuffle([correctNegative, ...wrongOptions.slice(0, 3)]);

    return {
      question: `
        <div style="margin-bottom: 0.5rem;">Сделай предложение <strong>отрицательным</strong>:</div>
        <div class="transformation-sentence" style="font-size: 1.1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px; margin: 1rem 0;">
          "${sentence}"
        </div>
      `,
      options,
      correctIndex: options.indexOf(correctNegative),
      metadata: {
        type: 'transformation',
        transformationType: 'negative',
        pronoun,
        verb,
        hint: "Поставь 'not' после глагола to be",
        generatedFrom: 'TransformationGenerator'
      }
    };
  }

  _generateQuestion() {
    const pronouns = ['you', 'he', 'she', 'we', 'they'];
    const pronoun = pronouns[Math.floor(Math.random() * pronouns.length)];
    const verb = this.verbMap[pronoun];
    const template = this.templates[Math.floor(Math.random() * this.templates.length)];

    const sentence = template
      .replace('{{pronoun}}', this._capitalize(pronoun))
      .replace('{{verb}}', verb);

    const correctQuestion = `${this._capitalize(verb)} ${pronoun} ${template.split('{{verb}}')[1].trim()}?`;

    const wrongOptions = [
      sentence + '?',
      `${this._capitalize(verb)} ${template.split('{{verb}}')[1].trim()} ${pronoun}?`,
      `${this._capitalize(pronoun)} ${template.split('{{verb}}')[1].trim()} ${verb}?`
    ];

    const options = this._shuffle([correctQuestion, ...wrongOptions.slice(0, 3)]);

    return {
      question: `
        <div style="margin-bottom: 0.5rem;">Сделай из предложения <strong>вопрос</strong>:</div>
        <div class="transformation-sentence" style="font-size: 1.1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px; margin: 1rem 0;">
          "${sentence}"
        </div>
      `,
      options,
      correctIndex: options.indexOf(correctQuestion),
      metadata: {
        type: 'transformation',
        transformationType: 'question',
        pronoun,
        verb,
        hint: "Поставь глагол to be перед подлежащим",
        generatedFrom: 'TransformationGenerator'
      }
    };
  }

  _generatePlural() {
    const singularPronouns = ['he', 'she', 'it'];
    const pronoun = singularPronouns[Math.floor(Math.random() * singularPronouns.length)];
    const verb = this.verbMap[pronoun];
    
    const sentence = `${this._capitalize(pronoun)} ${verb} a student`;
    const pluralPronoun = this.pluralMap[pronoun].pronoun;
    const pluralVerb = this.verbMap[pluralPronoun];
    const correct = `${this._capitalize(pluralPronoun)} ${pluralVerb} students`;

    const wrongOptions = [
      `${this._capitalize(pluralPronoun)} ${verb} students`,
      `${this._capitalize(pronoun)} ${pluralVerb} students`,
      `${this._capitalize(pluralPronoun)} ${pluralVerb} student`
    ];

    const options = this._shuffle([correct, ...wrongOptions]);

    return {
      question: `
        <div style="margin-bottom: 0.5rem;">Преобразуй во <strong>множественное число</strong>:</div>
        <div class="transformation-sentence" style="font-size: 1.1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px; margin: 1rem 0;">
          "${sentence}"
        </div>
      `,
      options,
      correctIndex: options.indexOf(correct),
      metadata: {
        type: 'transformation',
        transformationType: 'plural',
        pronoun,
        pluralPronoun,
        hint: `${this._capitalize(pronoun)} → ${pluralPronoun}, ${verb} → ${pluralVerb}, student → students`,
        generatedFrom: 'TransformationGenerator'
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
  window.TransformationGenerator = TransformationGenerator;
}
