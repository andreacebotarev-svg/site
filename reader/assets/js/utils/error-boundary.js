/**
 * Global Error Boundary
 * Catches and displays unhandled errors gracefully
 */
export class ErrorBoundary {
  static init() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      ErrorBoundary.showError('An unexpected error occurred. Please refresh the page.');
      event.preventDefault();
    });
    
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      console.error('Unhandled error:', event.error);
      ErrorBoundary.showError('An unexpected error occurred. Please refresh the page.');
    });
  }
  
  static showError(message) {
    // Remove existing error toast if any
    const existing = document.querySelector('.global-error-toast');
    if (existing) {
      existing.remove();
    }
    
    // Create error toast
    const toast = document.createElement('div');
    toast.className = 'global-error-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }
  
  static wrapAsync(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        console.error('Error in async function:', error);
        this.showError(error.message || 'An error occurred');
        throw error;
      }
    };
  }
}

