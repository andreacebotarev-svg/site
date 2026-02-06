/**
 * Hash-based Router for SPA navigation
 */
export class Router {
  constructor(routes = {}) {
    this.routes = routes;
    this.currentView = null;
    this.currentRoute = null;
    this.appView = document.getElementById('app-view');
    
    if (!this.appView) {
      console.error('Router: app-view element not found');
      return;
    }
    
    // Bind methods
    this.handleHashChange = this.handleHashChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    
    // Setup listeners
    window.addEventListener('hashchange', this.handleHashChange);
    document.addEventListener('click', this.handleClick);
    
    // Initial navigation
    this.handleHashChange();
  }
  
  handleClick(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      window.location.hash = href;
    }
  }
  
  handleHashChange() {
    const hash = window.location.hash.slice(1) || '/';
    const parts = hash.split('/').filter(Boolean);
    const route = parts[0] || 'library';
    const params = parts.slice(1); // Get route parameters

    // Update active nav link
    this.updateActiveNav(route);

    // Navigate to route with params
    this.navigate(route, params);
  }
  
  updateActiveNav(route) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#/${route}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
  
  async navigate(route, params = []) {
    const ViewClass = this.routes[route];

    if (!ViewClass) {
      console.warn(`Router: No view found for route "${route}"`);
      this.render404();
      return;
    }
    
    // Cleanup previous view
    if (this.currentView && typeof this.currentView.destroy === 'function') {
      try {
        // Clean up reader-specific URL params when leaving reader
        if (this.currentRoute === 'reader' && route !== 'reader') {
          const { cleanupReaderURL } = await import('./url-canonicalizer.js');
          cleanupReaderURL();
        }

        await this.currentView.destroy();
      } catch (error) {
        console.error('Error destroying previous view:', error);
      }
    }
    
    // Add transition classes
    this.appView.classList.add('leaving');
    
    // Wait for transition
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Clear content
    this.appView.innerHTML = '';
    this.appView.classList.remove('leaving');
    this.appView.classList.add('entering');
    
    try {
      // Canonicalize URL for reader route (sync bookId to query params)
      if (route === 'reader' && params[0]) {
        const { canonicalizeReaderURL } = await import('./url-canonicalizer.js');
        canonicalizeReaderURL({ bookIdFromRoute: params[0] });
      }

      // Create and render new view with params
      this.currentView = new ViewClass(this.appView, params);
      await this.currentView.render();

      this.currentRoute = route;
    } catch (error) {
      console.error(`Error rendering view for route "${route}":`, error);
      this.renderError(error);
    } finally {
      // Remove entering class after a short delay
      setTimeout(() => {
        this.appView.classList.remove('entering');
      }, 50);
    }
  }
  
  render404() {
    this.appView.innerHTML = `
      <div style="padding: var(--space-6); text-align: center;">
        <h1 style="font-size: var(--fs-h1); margin-bottom: var(--space-3);">404</h1>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-4);">Page not found</p>
        <a href="#/library" class="btn btn-primary">Go to Library</a>
      </div>
    `;
  }
  
  renderError(error) {
    this.appView.innerHTML = `
      <div style="padding: var(--space-6); text-align: center;">
        <h1 style="font-size: var(--fs-h1); margin-bottom: var(--space-3); color: var(--danger-color);">Error</h1>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-4);">${error.message || 'Something went wrong'}</p>
        <a href="#/library" class="btn btn-primary">Go to Library</a>
      </div>
    `;
  }
  
  destroy() {
    window.removeEventListener('hashchange', this.handleHashChange);
    document.removeEventListener('click', this.handleClick);
    
    if (this.currentView && typeof this.currentView.destroy === 'function') {
      this.currentView.destroy();
    }
  }
}
