import { VERBS, getRandom } from '../utils/verbs.js';

/**
 * Present Simple Generator (Standalone, No Window Dependencies)
 * Supports: affirmative, negative, question
 * Task types: gap, choice, find_error
 */

const subjects3sg = ['he', 'she', 'it', 'the cat', 'John', 'my friend', 'Tom', 'Mary'];
const subjectsPlural = ['they', 'we', 'you', 'the students', 'my friends', 'people'];
const subjectsI = ['I'];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Compute 3rd person singular form (adds -s, -es, or -ies)
 */
function getThirdPersonForm(base) {
  // Special cases
  if (base === 'go') return 'goes';
  if (base === 'do') return 'does';
  if (base === 'have') return 'has';
  
  // -s, -ss, -sh, -ch, -x, -z → add -es
  if (/[sxz]$|[cs]h$/.test(base)) {
    return base + 'es';
  }
  
  // consonant + y → -ies
  if (/[^aeiou]y$/.test(base)) {
    return base.slice(0, -1) + 'ies';
  }
  
  // Default: add -s
  return base + 's';
}

export function generatePS(sentenceType, taskType) {
  const verb = randomChoice(VERBS);
  const thirdPersonForm = getThirdPersonForm(verb.base);
  
  if (taskType === 'gap') {
    return generateGapTask(verb, thirdPersonForm, sentenceType);
  } else if (taskType === 'choice') {
    return generateChoiceTask(verb, thirdPersonForm, sentenceType);
  } else if (taskType === 'error') {
    return generateErrorTask(verb, thirdPersonForm, sentenceType);
  }
  
  // Fallback
  return generateGapTask(verb, thirdPersonForm, sentenceType);
}

function generateGapTask(verb, thirdPersonForm, sentenceType) {
  let question, options, correct;
  
  if (sentenceType === 'affirmative') {
    const subject = randomChoice(subjects3sg);
    question = `${subject.charAt(0).toUpperCase() + subject.slice(1)} ___ (${verb.base}) every day.`;
    options = [thirdPersonForm, verb.base, verb.ing];
    correct = thirdPersonForm;
  } else if (sentenceType === 'negative') {
    const useThirdPerson = Math.random() > 0.5;
    if (useThirdPerson) {
      const subject = randomChoice(subjects3sg);
      question = `${subject.charAt(0).toUpperCase() + subject.slice(1)} ___ ${verb.base}.`;
      options = ["doesn't", "don't", "isn't"];
      correct = "doesn't";
    } else {
      const subject = randomChoice(subjectsPlural);
      question = `${subject.charAt(0).toUpperCase() + subject.slice(1)} ___ ${verb.base}.`;
      options = ["don't", "doesn't", "aren't"];
      correct = "don't";
    }
  } else if (sentenceType === 'question') {
    const useThirdPerson = Math.random() > 0.5;
    if (useThirdPerson) {
      const subject = randomChoice(subjects3sg);
      question = `___ ${subject} ${verb.base}?`;
      options = ["Does", "Do", "Is"];
      correct = "Does";
    } else {
      const subject = randomChoice([...subjectsPlural, ...subjectsI]);
      question = `___ ${subject} ${verb.base}?`;
      options = ["Do", "Does", "Are"];
      correct = "Do";
    }
  }
  
  return {
    type: 'gap',
    question,
    options,
    correct,
    metadata: { tense: 'present-simple', sentenceType, taskType: 'gap' }
  };
}

function generateChoiceTask(verb, thirdPersonForm, sentenceType) {
  let question, options, correct;
  
  if (sentenceType === 'affirmative') {
    const subject = randomChoice(subjects3sg);
    question = `Choose the correct sentence:`;
    options = [
      `${subject.charAt(0).toUpperCase() + subject.slice(1)} ${verb.base} every day`,
      `${subject.charAt(0).toUpperCase() + subject.slice(1)} ${thirdPersonForm} every day`,
      `${subject.charAt(0).toUpperCase() + subject.slice(1)} ${verb.ing} every day`
    ];
    correct = options[1];
  } else if (sentenceType === 'negative') {
    const useThirdPerson = Math.random() > 0.5;
    question = `Choose the correct negative sentence:`;
    if (useThirdPerson) {
      const subject = randomChoice(subjects3sg);
      options = [
        `${subject.charAt(0).toUpperCase() + subject.slice(1)} don't ${verb.base}`,
        `${subject.charAt(0).toUpperCase() + subject.slice(1)} doesn't ${verb.base}`,
        `${subject.charAt(0).toUpperCase() + subject.slice(1)} doesn't ${thirdPersonForm}`
      ];
      correct = options[1];
    } else {
      const subject = randomChoice(subjectsPlural);
      options = [
        `${subject.charAt(0).toUpperCase() + subject.slice(1)} doesn't ${verb.base}`,
        `${subject.charAt(0).toUpperCase() + subject.slice(1)} don't ${verb.base}`,
        `${subject.charAt(0).toUpperCase() + subject.slice(1)} don't ${thirdPersonForm}`
      ];
      correct = options[1];
    }
  } else if (sentenceType === 'question') {
    const useThirdPerson = Math.random() > 0.5;
    question = `Choose the correct question:`;
    if (useThirdPerson) {
      const subject = randomChoice(subjects3sg);
      options = [
        `Do ${subject} ${verb.base}?`,
        `Does ${subject} ${verb.base}?`,
        `Does ${subject} ${thirdPersonForm}?`
      ];
      correct = options[1];
    } else {
      const subject = randomChoice(subjectsPlural);
      options = [
        `Does ${subject} ${verb.base}?`,
        `Do ${subject} ${verb.base}?`,
        `Do ${subject} ${thirdPersonForm}?`
      ];
      correct = options[1];
    }
  }
  
  return {
    type: 'choice',
    question,
    options,
    correct,
    metadata: { tense: 'present-simple', sentenceType, taskType: 'choice' }
  };
}

function generateErrorTask(verb, thirdPersonForm, sentenceType) {
  let options;

  if (sentenceType === 'affirmative') {
    const subject = randomChoice(subjects3sg);
    options = [
      { text: subject.charAt(0).toUpperCase() + subject.slice(1), correct: false },
      { text: verb.base, correct: true }, // ERROR: uses base instead of thirdPersonForm
      { text: 'every day.', correct: false }
    ];
  } else if (sentenceType === 'negative') {
    const subject = randomChoice(subjects3sg);
    options = [
      { text: subject.charAt(0).toUpperCase() + subject.slice(1), correct: false },
      { text: "don't", correct: true }, // ERROR: uses don't instead of doesn't for 3sg
      { text: verb.base + '.', correct: false }
    ];
  } else if (sentenceType === 'question') {
    const subject = randomChoice(subjects3sg);
    options = [
      { text: 'Do', correct: true }, // ERROR: uses Do instead of Does for 3sg
      { text: subject, correct: false },
      { text: verb.base + '?', correct: false }
    ];
  }

  // ✅ FIX: Assemble full sentence from options
  const fullSentence = options.map(opt => opt.text).join(' ');

  return {
    type: 'find_error',
    question: fullSentence, // ✅ NOW CONTAINS FULL SENTENCE!
    options,
    metadata: { tense: 'present-simple', sentenceType, taskType: 'error' }
  };
}