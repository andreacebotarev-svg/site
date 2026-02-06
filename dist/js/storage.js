/**
 * LocalStorage Manager
 * Handles session data and statistics
 */

const STORAGE_KEY = 'phonics_trainer';

export class Storage {
  static get() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : this.getDefault();
    } catch {
      return this.getDefault();
    }
  }
  
  static set(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }
  
  static getDefault() {
    return {
      totalScore: 0,
      totalWords: 0,
      totalLessons: 0,
      totalPlaytime: 0,
      lessons: {} // lessonId: { score, stars, completedWords, totalWords }
    };
  }
  
  static updateLesson(lessonId, score, completedWords, totalWords) {
    const data = this.get();
    
    // Calculate stars (0-3)
    const percentage = (completedWords / totalWords) * 100;
    let stars = 0;
    if (percentage >= 100) stars = 3;
    else if (percentage >= 80) stars = 2;
    else if (percentage >= 60) stars = 1;
    
    // Update lesson data
    const lessonData = data.lessons[lessonId] || {};
    const isFirstTime = !lessonData.completedWords;
    
    data.lessons[lessonId] = {
      score: Math.max(lessonData.score || 0, score),
      stars: Math.max(lessonData.stars || 0, stars),
      completedWords,
      totalWords,
      lastPlayed: Date.now()
    };
    
    // Update totals
    data.totalScore += score;
    data.totalWords += completedWords;
    if (isFirstTime && completedWords === totalWords) {
      data.totalLessons++;
    }
    
    this.set(data);
    return data;
  }
  
  static getLessonData(lessonId) {
    const data = this.get();
    return data.lessons[lessonId] || null;
  }
}
