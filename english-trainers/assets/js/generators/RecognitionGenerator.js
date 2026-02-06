/**
 * RECOGNITION QUESTION GENERATOR
 * Generates "Which sentence is correct?" questions by injecting wrong verb forms.
 */

class RecognitionGenerator {
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

    this.templates = config.templates || [
      '{{pronoun}} {{verb}} happy',
      '{{pronoun}} {{verb}} a student',
      '{{pronoun}} {{verb}} ready',
      '{{pronoun}} {{verb}} tired',
      '{{pronoun}} {{verb}} at home',
      '{{pronoun}} {{verb}} very busy',
      '{{pronoun}} {{verb}} from Spain',
      '{{pronoun}} {{verb}} here now',
      '{{pronoun}} {{verb}} always late',
      '{{pronoun}} {{verb}} never wrong'
    ];
  }

  generate() {
    // Pick random pronoun and template
    const pronouns = Object.keys(this.verbMap);
    const pronoun = pronouns[Math.floor(Math.random() * pronouns.length)];
    const template = this.templates[Math.floor(Math.random() * this.templates.length)];
    
    const correctVerb = this.verbMap[pronoun];
    const wrongVerbs = ['am', 'is', 'are'].filter(v => v !== correctVerb);
    
    // Generate correct sentence
    const correct = template
      .replace('{{pronoun}}', this._capitalize(pronoun))
      .replace('{{verb}}', correctVerb);

    // Generate wrong sentences
    const wrong = wrongVerbs.map(verb => 
      template
        .replace('{{pronoun}}', this._capitalize(pronoun))
        .replace('{{verb}}', verb)
    );

    // Add "be" form as distractor
    wrong.push(
      template
        .replace('{{pronoun}}', this._capitalize(pronoun))
        .replace('{{verb}}', 'be')
    );

    const options = this._shuffle([correct, ...wrong.slice(0, 3)]);

    return {
      question: 'Выбери <strong>правильное</strong> предложение:',
      options,
      correctIndex: options.indexOf(correct),
      metadata: { 
        type: 'recognition', 
        pronoun, 
        correctVerb,
        generatedFrom: 'RecognitionGenerator'
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
  window.RecognitionGenerator = RecognitionGenerator;
}
