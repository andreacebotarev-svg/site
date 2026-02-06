/**
 * HAVE GOT: FILL-IN GENERATOR
 * Подставить have/has в предложение
 */

class HGFillInGenerator {
  constructor(config = {}) {
    this.subjects = config.subjects || [];
    this.possessions = config.possessions || [];

    this.templates = [
      '{{subject}} ____ got {{possession}}.',
      '{{subject}} ____ got {{possession}} at home.',
      '{{subject}} ____n\'t got {{possession}}.',
      '____ {{subject}} got {{possession}}?'
    ];
  }

  generate() {
    const subjectObj = this._pick(this.subjects);
    const possession = this._pick(this.possessions);
    const template = this._pick(this.templates);
    const verb = subjectObj.verb; // have or has

    // Capitalize subject if at start
    const isSubjectFirst = template.startsWith('{{subject}}');
    const displaySubject = isSubjectFirst
      ? this._capitalize(subjectObj.pronoun)
      : subjectObj.pronoun;

    const sentence = template
      .replace('{{subject}}', displaySubject)
      .replace('{{possession}}', possession)
      .replace('____', '<span class="blank">____</span>');

    const options = this._shuffle(['have', 'has', 'Have', 'Has']);
    
    // Determine correct answer based on template
    let correctAnswer = verb;
    if (template.startsWith('____')) {
      // Question: Have/Has at start
      correctAnswer = this._capitalize(verb);
    }

    return {
      question: sentence,
      options: [...new Set(options)].slice(0, 2), // Unique, max 2
      correctIndex: options.indexOf(correctAnswer),
      metadata: {
        type: 'hg-fill-in',
        subject: subjectObj.pronoun,
        possession,
        correctVerb: correctAnswer,
        isPlural: subjectObj.isPlural,
        generatedFrom: 'HGFillInGenerator'
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
  window.HGFillInGenerator = HGFillInGenerator;
}
