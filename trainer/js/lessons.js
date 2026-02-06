// Lesson data loader with caching
class LessonManager {
  constructor() {
    this.cache = new Map();
    // Fixed path for GitHub Pages
    this.baseUrl = '/data/trainer';
  }
  
  // Load lesson from JSON file
  async load(lessonId) {
    // Check cache first
    if (this.cache.has(lessonId)) {
      return this.cache.get(lessonId);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/lesson_${String(lessonId).padStart(2, '0')}.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const lesson = await response.json();
      
      // Validate lesson structure
      if (!this.validate(lesson)) {
        throw new Error('Invalid lesson structure');
      }
      
      // Cache the lesson
      this.cache.set(lessonId, lesson);
      
      return lesson;
    } catch (error) {
      console.error(`Failed to load lesson ${lessonId}:`, error);
      throw error;
    }
  }
  
  // Validate lesson structure
  validate(lesson) {
    const required = ['id', 'title', 'emoji', 'rule', 'description', 'phonemesSet', 'wordCount', 'estimatedTime', 'words'];
    
    for (const field of required) {
      if (!(field in lesson)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }
    
    // Validate words array
    if (!Array.isArray(lesson.words) || lesson.words.length === 0) {
      console.error('Words must be a non-empty array');
      return false;
    }
    
    // Validate each word
    for (const word of lesson.words) {
      if (!word.word || !word.phonemes || !word.translation) {
        console.error('Invalid word structure:', word);
        return false;
      }
    }
    
    return true;
  }
  
  // Load lesson metadata (without full word data)
  async loadMetadata(lessonId) {
    const lesson = await this.load(lessonId);
    return {
      id: lesson.id,
      title: lesson.title,
      emoji: lesson.emoji,
      rule: lesson.rule,
      description: lesson.description,
      wordCount: lesson.wordCount,
      estimatedTime: lesson.estimatedTime,
      phonemesSet: lesson.phonemesSet
    };
  }
  
  // Get list of available lessons
  async getAvailableLessons() {
    // Return a fixed list of lesson IDs to try
    const lessonIds = [1, 2, 3, 4, 5, 6, 7, 8];
    
    const lessons = [];
    for (const id of lessonIds) {
      try {
        const metadata = await this.loadMetadata(id);
        lessons.push(metadata);
      } catch (error) {
        // Lesson doesn't exist or failed to load, skip it
        console.warn(`Lesson ${id} not available:`, error.message);
        continue;
      }
    }
    
    return lessons;
  }
  
  // Clear cache
  clearCache() {
    this.cache.clear();
  }
  
  // Preload lessons
  async preload(lessonIds) {
    const promises = lessonIds.map(id => this.load(id).catch(() => null));
    await Promise.all(promises);
  }
}

// Export singleton instance
export const lessons = new LessonManager();