// Hash-based router for SPA navigation
export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.beforeEach = null;
    
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }
  
  // Register route handler
  on(path, handler) {
    this.routes.set(path, handler);
    return this;
  }
  
  // Navigation guard
  beforeNavigate(callback) {
    this.beforeEach = callback;
    return this;
  }
  
  // Navigate to route
  push(path) {
    window.location.hash = path;
  }
  
  // Replace current route
  replace(path) {
    window.location.replace(`#${path}`);
  }
  
  // Go back
  back() {
    window.history.back();
  }
  
  // Parse hash path and params
  parseHash() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    const params = {};
    
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        params[key] = decodeURIComponent(value);
      });
    }
    
    return { path, params };
  }
  
  // Match dynamic routes (e.g., /lesson/:id)
  matchRoute(currentPath) {
    for (const [pattern, handler] of this.routes) {
      const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$');
      const match = currentPath.match(regex);
      
      if (match) {
        const paramNames = (pattern.match(/:[^/]+/g) || []).map(p => p.slice(1));
        const params = {};
        paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });
        return { handler, params };
      }
    }
    return null;
  }
  
  // Handle route change
  async handleRoute() {
    const { path, params: queryParams } = this.parseHash();
    
    // Check navigation guard
    if (this.beforeEach) {
      const shouldNavigate = await this.beforeEach(path, this.currentRoute);
      if (shouldNavigate === false) return;
    }
    
    const match = this.matchRoute(path);
    
    if (match) {
      this.currentRoute = path;
      await match.handler({ ...match.params, ...queryParams });
    } else {
      // Fallback to home
      this.replace('/');
    }
  }
  
  // Get current route
  getCurrent() {
    return this.parseHash().path;
  }
}

// Export singleton instance
export const router = new Router();