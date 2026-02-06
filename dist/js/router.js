/**
 * Simple Hash-Based Router
 */

export class Router {
  constructor() {
    this.routes = [];
    this.currentPage = null;
  }
  
  register(path, PageClass) {
    this.routes.push({ path, PageClass });
  }
  
  start() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => this.navigate());
    
    // Initial navigation
    this.navigate();
  }
  
  navigate() {
    const hash = window.location.hash.slice(1) || '/';
    
    // Find matching route
    for (const route of this.routes) {
      const params = this.match(route.path, hash);
      if (params !== null) {
        this.render(route.PageClass, params);
        return;
      }
    }
    
    // 404 - redirect to home
    window.location.hash = '/';
  }
  
  match(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    if (patternParts.length !== pathParts.length) {
      return null;
    }
    
    const params = {};
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        const paramName = patternParts[i].slice(1);
        params[paramName] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    
    return params;
  }
  
  render(PageClass, params) {
    // Cleanup previous page
    if (this.currentPage && this.currentPage.destroy) {
      this.currentPage.destroy();
    }
    
    // Render new page
    const app = document.getElementById('app');
    app.innerHTML = '';
    
    this.currentPage = new PageClass(app, params);
    this.currentPage.render();
  }
}
