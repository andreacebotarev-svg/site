/**
 * FILL-IN-BLANK GENERATOR
 * Procedural sentence generation with difficulty scaling
 */

class FillInGenerator {
  constructor() {
    this.subjects = [
      { pronoun: 'I', verb: 'am' },
      { pronoun: 'you', verb: 'are' },
      { pronoun: 'he', verb: 'is' },
      { pronoun: 'she', verb: 'is' },
      { pronoun: 'it', verb: 'is' },
      { pronoun: 'we', verb: 'are' },
      { pronoun: 'they', verb: 'are' }
    ];

    // Templates by difficulty
    this.templates = {
      easy: [
        '{pronoun} ____ happy',
        '{pronoun} ____ tired',
        '{pronoun} ____ ready',
        '{pronoun} ____ a student',
        '{pronoun} ____ at home',
        '{pronoun} ____ hungry',
        '{pronoun} ____ my friend'
      ],
      medium: [
        '{pronoun} ____ not ready',
        '{pronoun} ____ always late',
        '{pronoun} ____ never wrong',
        '{pronoun} ____ very busy',
        '{pronoun} ____ not here',
        '{pronoun} ____ often tired',
        '{pronoun} ____ sometimes happy'
      ],
      hard: [
        '{pronoun} ____ about to leave',
        '{pronoun} ____ supposed to call',
        '{pronoun} ____ being careful',
        '{pronoun} ____ going to win',
        '{pronoun} ____ getting tired',
        '{pronoun} ____ running late',
        '{pronoun} ____ trying hard'
      ]
    };
  }

  generate(difficulty = 'easy') {
    const subject = this._randomItem(this.subjects);
    const templates = this.templates[difficulty] || this.templates.easy;
    const template = this._randomItem(templates);

    // Fill pronoun, leave verb blank
    const pronoun = this._capitalize(subject.pronoun);
    const sentence = template
      .replace('{pronoun}', pronoun)
      .replace('____', '<span class="blank">____</span>');

    const options = this._shuffle(['am', 'is', 'are']);

    return {
      question: sentence,
      options,
      correctIndex: options.indexOf(subject.verb),
      metadata: {
        type: 'fill-in',
        difficulty,
        pronoun: subject.pronoun,
        correctVerb: subject.verb
      }
    };
  }

  _randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _shuffle(arr) {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

if (typeof window !== 'undefined') {
  window.FillInGenerator = FillInGenerator;
}
