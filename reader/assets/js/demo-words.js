/**
 * Demo Words Script
 * Run this in the browser console to add sample words for testing flashcards
 * 
 * Usage: Copy and paste this into the browser console
 */

export async function addDemoWords() {
  const { vocabularyStorage } = await import('./vocabulary/vocabulary-storage.enhanced.js');
  
  const demoWords = [
    {
      word: 'hello',
      translation: 'привет',
      definition: 'a greeting used when meeting or answering the telephone',
      phonetic: '/həˈloʊ/',
      context: 'Hello, how are you today?'
    },
    {
      word: 'beautiful',
      translation: 'красивый',
      definition: 'pleasing the senses or mind aesthetically',
      phonetic: '/ˈbjuːtɪfəl/',
      context: 'She has a beautiful smile.'
    },
    {
      word: 'wonderful',
      translation: 'замечательный',
      definition: 'inspiring delight, pleasure, or admiration',
      phonetic: '/ˈwʌndərfəl/',
      context: 'It was a wonderful day.'
    },
    {
      word: 'knowledge',
      translation: 'знание',
      definition: 'facts, information, and skills acquired through experience or education',
      phonetic: '/ˈnɑːlɪdʒ/',
      context: 'Knowledge is power.'
    },
    {
      word: 'adventure',
      translation: 'приключение',
      definition: 'an unusual and exciting experience or activity',
      phonetic: '/ədˈventʃər/',
      context: 'We went on an adventure in the mountains.'
    }
  ];
  
  demoWords.forEach(wordData => {
    vocabularyStorage.addWord({
      ...wordData,
      timestamp: Date.now()
    });
  });
  
  console.log(`✅ Added ${demoWords.length} demo words! Refresh the flashcards page to see them.`);
  return demoWords.length;
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  window.addDemoWords = addDemoWords;
}

