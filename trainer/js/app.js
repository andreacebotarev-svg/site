// Main application entry point
import { router } from './router.js';
import { renderLessonSelect, renderLessonTrainer, renderResults } from './pages.js';
import { storage } from './storage.js';

// Initialize application
function init() {
  console.log('🚀 English Reading Trainer initialized');
  console.log('📊 User stats:', storage.getStats());
  
  // Setup routes
  router
    .on('/', renderLessonSelect)
    .on('/lesson/:id', renderLessonTrainer)
    .on('/results', renderResults);
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // ESC to go back
    if (e.key === 'Escape') {
      const currentPath = router.getCurrent();
      if (currentPath !== '/') {
        router.back();
      }
    }
  });
  
  // Prevent default drag behavior
  document.addEventListener('dragstart', (e) => e.preventDefault());
  
  // Add touch feedback for mobile
  if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
  }
  
  // Handle visibility change (pause/resume)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('⏸ App paused');
    } else {
      console.log('▶️ App resumed');
    }
  });
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}