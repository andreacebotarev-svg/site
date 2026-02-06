/**
 * PRESENT SIMPLE: FILL-IN GENERATOR
 * Подставить do/does или verb form
 */

class PSFillInGenerator {
  constructor(config = {}) {
    this.verbs = config.verbs || [];
    this.subjects3sg = config.subjects3sg || ['he', 'she', 'it', 'the cat', 'John', 'my friend'];
    this.allSubjects = ['I', 'you', 'he', 'she', 'it', 'we', 'they'];

    // Шаблоны
    this.verbTemplates = [
      '{{subject}} ____ every day',
      '{{subject}} ____ in the morning',
      '{{subject}} always ____',
      '{{subject}} ____ very well',
      '{{subject}} often ____ at home'
    ];

    this.auxTemplates = [
      '____ {{subject}} {{verb}} regularly?',
      'Where ____ {{subject}} {{verb}}?',
      '____ {{subject}} often {{verb}}?',
      'How often ____ {{subject}} {{verb}}?'
    ];
  }

  generate(difficulty = 'verb') {
    if (difficulty === 'aux') return this._generateAux();
    return this._generateVerbForm();
  }

  _generateVerbForm() {
    const verb = this._pick(this.verbs);
    const subject = this._pick(this.allSubjects);
    const is3sg = this.subjects3sg.includes(subject);

    const template = this._pick(this.verbTemplates);
    const sentence = template
      .replace('{{subject}}', this._capitalize(subject))
      .replace('____', '<span class="blank">____</span>');

    const correctVerb = is3sg ? verb.thirdPerson : verb.base;
    const options = this._shuffle([verb.base, verb.thirdPerson]);

    return {
      question: sentence,
      options,
      correctIndex: options.indexOf(correctVerb),
      metadata: {
        type: 'ps-fill-verb',
        subject,
        verb: verb.base,
        correctVerb,
        is3sg,
        generatedFrom: 'PSFillInGenerator'
      }
    };
  }

  _generateAux() {
    const verb = this._pick(this.verbs);
    const subject = this._pick(['you', 'he', 'she', 'it', 'we', 'they']);
    const is3sg = this.subjects3sg.includes(subject);

    const template = this._pick(this.auxTemplates);
    const sentence = template
      .replace('{{subject}}', subject)
      .replace('{{verb}}', verb.base)
      .replace('____', '<span class="blank">____</span>');

    const correctAux = is3sg ? 'Does' : 'Do';
    const options = this._shuffle(['Do', 'Does']);

    return {
      question: sentence,
      options,
      correctIndex: options.indexOf(correctAux),
      metadata: {
        type: 'ps-fill-aux',
        subject,
        verb: verb.base,
        correctAux,
        is3sg,
        generatedFrom: 'PSFillInGenerator'
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
  window.PSFillInGenerator = PSFillInGenerator;
}
