/**
 * Viewport Height Polyfill
 * Fixes mobile viewport height issues with address bar
 */
export class ViewportHeightPolyfill {
  constructor() {
    this.updateHeight = this.updateHeight.bind(this);
    this.init();
  }
  
  init() {
    // Set initial height
    this.updateHeight();
    
    // Update on resize and orientation change
    window.addEventListener('resize', this.updateHeight);
    window.addEventListener('orientationchange', this.updateHeight);
    
    // Update on scroll (for mobile address bar)
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.updateHeight();
          ticking = false;
        });
        ticking = true;
      }
    });
  }
  
  updateHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  
  destroy() {
    window.removeEventListener('resize', this.updateHeight);
    window.removeEventListener('orientationchange', this.updateHeight);
  }
}

