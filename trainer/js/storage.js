// LocalStorage manager for user progress
const STORAGE_KEY = 'english_trainer_data';

class StorageManager {
  constructor() {
    this.data = this.load();
  }
  
  // Load data from localStorage
  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load storage:', error);
    }
    
    // Return default structure
    return {
      totalScore: 0,
      totalWords: 0,
      totalLessons: 0,
      totalPlaytime: 0,
      lessons: {},
      createdAt: Date.now(),
      lastPlayed: Date.now()
    };
  }
  
  // Save data to localStorage
  save() {
    try {
      this.data.lastPlayed = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      return true;
    } catch (error) {
      console.error('Failed to save storage:', error);
      return false;
    }
  }
  
  // Get lesson progress
  getLesson(lessonId) {
    return this.data.lessons[lessonId] || {
      score: 0,
      stars: 0,
      completedWords: 0,
      totalWords: 0,
      attempts: 0,
      lastPlayed: null,
      bestScore: 0
    };
  }
  
  // Update lesson progress
  updateLesson(lessonId, progress) {
    const current = this.getLesson(lessonId);
    const isFirstCompletion = current.completedWords === 0;
    
    this.data.lessons[lessonId] = {
      ...current,
      ...progress,
      attempts: current.attempts + 1,
      lastPlayed: Date.now(),
      bestScore: Math.max(current.bestScore || 0, progress.score || 0)
    };
    
    // Update totals
    if (isFirstCompletion && progress.completedWords === progress.totalWords) {
      this.data.totalLessons += 1;
    }
    
    const wordsLearned = progress.completedWords - current.completedWords;
    if (wordsLearned > 0) {
      this.data.totalWords += wordsLearned;
    }
    
    this.data.totalScore += (progress.score || 0) - (current.score || 0);
    
    this.save();
    return this.data.lessons[lessonId];
  }
  
  // Get all stats
  getStats() {
    return {
      totalScore: this.data.totalScore,
      totalWords: this.data.totalWords,
      totalLessons: this.data.totalLessons,
      totalPlaytime: this.data.totalPlaytime,
      lessonsCompleted: Object.values(this.data.lessons).filter(
        l => l.completedWords === l.totalWords
      ).length
    };
  }
  
  // Get lesson stats
  getLessonStats(lessonId) {
    const lesson = this.getLesson(lessonId);
    const accuracy = lesson.attempts > 0 
      ? Math.round((lesson.completedWords / (lesson.attempts * lesson.totalWords)) * 100)
      : 0;
    
    return {
      ...lesson,
      accuracy,
      isCompleted: lesson.completedWords === lesson.totalWords
    };
  }
  
  // Calculate stars based on score
  calculateStars(score, maxScore) {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 3;
    if (percentage >= 70) return 2;
    if (percentage >= 50) return 1;
    return 0;
  }
  
  // Reset all data
  reset() {
    this.data = {
      totalScore: 0,
      totalWords: 0,
      totalLessons: 0,
      totalPlaytime: 0,
      lessons: {},
      createdAt: Date.now(),
      lastPlayed: Date.now()
    };
    this.save();
  }
  
  // Export data
  export() {
    return JSON.stringify(this.data, null, 2);
  }
  
  // Import data
  import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.data = { ...this.load(), ...imported };
      this.save();
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const storage = new StorageManager();