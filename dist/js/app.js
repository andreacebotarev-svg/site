/**
 * Main Application Entry Point
 * Pure vanilla JS - no build tools needed
 */

import { Router } from './router.js';
import { LessonSelectPage, LessonTrainerPage, ResultsPage } from './pages.js';

// Initialize router
const router = new Router();

// Register routes
router.register('/', LessonSelectPage);
router.register('/lesson/:id', LessonTrainerPage);
router.register('/results', ResultsPage);

// Start application
router.start();

console.log('🚀 English Phonics Trainer started!');
