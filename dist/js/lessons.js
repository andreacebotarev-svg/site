/**
 * Lessons Data Manager
 * Loads lesson data from JSON files
 */

import { loadJSON } from './utils.js';

const BASE_PATH = '../data';

export class LessonsManager {
  constructor() {
    this.cache = {};
  }
  
  async loadLesson(id) {
    if (this.cache[id]) {
      return this.cache[id];
    }
    
    try {
      const lesson = await loadJSON(`${BASE_PATH}/lesson_${String(id).padStart(2, '0')}.json`);
      this.cache[id] = lesson;
      return lesson;
    } catch (error) {
      console.error(`Failed to load lesson ${id}:`, error);
      throw error;
    }
  }
  
  async getAllLessons() {
    // Try to load first 10 lessons
    const lessons = [];
    
    for (let i = 1; i <= 10; i++) {
      try {
        const lesson = await this.loadLesson(i);
        lessons.push(lesson);
      } catch {
        // Stop when no more lessons
        break;
      }
    }
    
    return lessons;
  }
}

export const lessonsManager = new LessonsManager();
