/**
 * @fileoverview Enhanced Router with middleware, guards, and advanced features
 * @module EnhancedRouter
 */

import { logger } from '../utils/logger.js';
import { globalState } from './state-manager.js';

/**
 * @typedef {Object} Route
 * @property {string} path - Route path
 * @property {Function} ViewClass - View constructor
 * @property {Function} [beforeEnter] - Route guard
 * @property {Object} [meta] - Route metadata
 */

/**
 * @typedef {Object} NavigationContext
 * @property {string} from - Previous route
 * @property {string} to - Target route
 * @property {Object} params - Route parameters
 * @property {Object} query - Query parameters
 */

/**
 * Enhanced Router with middleware, guards, lazy loading, and prefetching
 * @class EnhancedRouter
 */
export class EnhancedRouter {
  /**
   * @param {Object.<string, Function|Route>} routes - Route configuration
   * @param {Object} [options] - Router options
   */
  constructor(routes = {}, options = {}) {
    this.routes = this._normalizeRoutes(routes);
    this.currentView = null;
    this.currentRoute = null;
    this.appView = document.getElementById('app-view');
    this.middlewares = [];
    this.guards = [];
    this.history = [];
    this.logger = logger.createChild('Router');
    
    this.options = {
      enablePrefetch: true,
      cacheViews: true,
      transitionDuration: 300,
      ...options
    };
    
    // View cache for performance
    this.viewCache = new Map();
    
    // Prefetch queue
    this.prefetchQueue = new Set();
    
    if (!this.appView) {
      this.logger.error('app-view element not found');
      return;
    }
    
    // Bind methods
    this.handleHashChange = this.handleHashChange.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);
    
    // Setup listeners
    window.addEventListener('hashchange', this.handleHashChange);
    document.addEventListener('click', this.handleClick);
    
    // Prefetch on hover
    if (this.options.enablePrefetch) {
      document.addEventListener('mouseover', this.handleMouseOver);
    }
    
    // Initial navigation
    this.handleHashChange();
    
    this.logger.info('Router initialized', { routes: Object.keys(this.routes) });
  }
  
  /**
   * Register middleware
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this.middlewares.push(middleware);
    this.logger.debug('Middleware registered');
  }
  
  /**
   * Register global navigation guard
   * @param {Function} guard - Guard function
   */
  beforeEach(guard) {
    this.guards.push(guard);
    this.logger.debug('Guard registered');
  }
  
  /**
   * Navigate to route programmatically
   * @param {string} path - Target path
   * @param {Object} [options] - Navigation options
   */
  push(path, options = {}) {
    window.location.hash = path;
  }
  
  /**
   * Replace current route
   * @param {string} path - Target path
   */
  replace(path) {
    window.history.replaceState(null, null, `#${path}`);
    this.handleHashChange();
  }
  
  /**
   * Go back in history
   */
  back() {
    window.history.back();
  }
  
  /**
   * Go forward in history
   */
  forward() {
    window.history.forward();
  }
  
  /**
   * Prefetch route resources
   * @param {string} route - Route name
   */
  async prefetch(route) {
    if (this.prefetchQueue.has(route)) return;
    
    this.prefetchQueue.add(route);
    
    const routeConfig = this.routes[route];
    if (!routeConfig) return;
    
    try {
      // If lazy loaded, load the module
      if (typeof routeConfig.ViewClass === 'function' && !routeConfig.ViewClass.prototype) {
        await routeConfig.ViewClass();
      }
      
      this.logger.debug('Prefetched route', { route });
    } catch (error) {
      this.logger.error('Prefetch failed', error, route);
    }
  }
  
  /**
   * Clear view cache
   */
  clearCache() {
    this.viewCache.clear();
    this.logger.info('View cache cleared');
  }
  
  // Event handlers
  
  handleClick(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      
      // Add to history
      const from = this.currentRoute || '/';
      const to = href.slice(1) || '/';
      this.history.push({ from, to, timestamp: Date.now() });
      
      window.location.hash = href;
    }
  }
  
  handleMouseOver(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const route = href.slice(1).split('/')[1] || 'library';
      
      // Debounced prefetch
      clearTimeout(this.prefetchTimeout);
      this.prefetchTimeout = setTimeout(() => {
        this.prefetch(route);
      }, 100);
    }
  }
  
  async handleHashChange() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryString] = hash.split('?');
    const route = path.split('/')[1] || 'library';
    const params = this._parseParams(path);
    const query = this._parseQuery(queryString);
    
    this.logger.debug('Navigating', { route, params, query });
    
    // Update active nav link
    this.updateActiveNav(route);
    
    // Create navigation context
    const context = {
      from: this.currentRoute,
      to: route,
      params,
      query,
      path
    };
    
    // Run global guards
    for (const guard of this.guards) {
      const result = await guard(context);
      if (result === false) {
        this.logger.warn('Navigation blocked by guard', { route });
        return;
      }
    }
    
    // Navigate
    await this.navigate(route, context);
  }
  
  // Core navigation
  
  async navigate(route, context) {
    const routeConfig = this.routes[route];
    
    if (!routeConfig) {
      this.logger.warn('No view found for route', { route });
      this.render404();
      return;
    }
    
    // Run route-specific guard
    if (routeConfig.beforeEnter) {
      const result = await routeConfig.beforeEnter(context);
      if (result === false) {
        this.logger.warn('Navigation blocked by route guard', { route });
        return;
      }
    }
    
    // Run middlewares
    for (const middleware of this.middlewares) {
      await middleware(context);
    }
    
    const startTime = performance.now();
    
    try {
      // Cleanup previous view
      if (this.currentView && typeof this.currentView.destroy === 'function') {
        await this.currentView.destroy();
      }
      
      // Add transition classes
      this.appView.classList.add('leaving');
      await this._wait(this.options.transitionDuration / 2);
      
      // Clear content
      this.appView.innerHTML = '';
      this.appView.classList.remove('leaving');
      this.appView.classList.add('entering');
      
      // Get view (from cache or create new)
      let ViewClass = routeConfig.ViewClass;
      
      // Handle lazy loading
      if (typeof ViewClass === 'function' && !ViewClass.prototype) {
        ViewClass = await ViewClass();
        routeConfig.ViewClass = ViewClass;
      }
      
      // Check cache
      let view;
      if (this.options.cacheViews && this.viewCache.has(route)) {
        view = this.viewCache.get(route);
        this.logger.debug('Using cached view', { route });
      } else {
        view = new ViewClass(this.appView, context);
        if (this.options.cacheViews) {
          this.viewCache.set(route, view);
        }
      }
      
      // Render view
      await view.render();
      
      this.currentView = view;
      this.currentRoute = route;
      
      // Update state
      await globalState.setState(state => ({
        ...state,
        ui: {
          ...state.ui,
          currentView: route
        }
      }), 'ROUTE_CHANGE');
      
      // Remove entering class
      await this._wait(50);
      this.appView.classList.remove('entering');
      
      // Announce to screen readers
      this._announceRouteChange(route);
      
      // Log performance
      const duration = performance.now() - startTime;
      this.logger.info('Navigation complete', { route, duration: `${duration.toFixed(2)}ms` });
      
    } catch (error) {
      this.logger.error('Navigation error', error, route);
      this.renderError(error);
    }
  }
  
  updateActiveNav(route) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#/${route}`) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
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
        <p style="color: var(--text-secondary); margin-bottom: var(--space-4);">${this._escapeHtml(error.message || 'Something went wrong')}</p>
        <a href="#/library" class="btn btn-primary">Go to Library</a>
      </div>
    `;
  }
  
  // Utility methods
  
  _normalizeRoutes(routes) {
    const normalized = {};
    
    for (const [key, value] of Object.entries(routes)) {
      if (typeof value === 'function') {
        normalized[key] = { ViewClass: value };
      } else {
        normalized[key] = value;
      }
    }
    
    return normalized;
  }
  
  _parseParams(path) {
    // Simple implementation - can be extended
    const parts = path.split('/').filter(Boolean);
    return { id: parts[2] };
  }
  
  _parseQuery(queryString) {
    if (!queryString) return {};
    
    return Object.fromEntries(
      queryString.split('&').map(pair => {
        const [key, value] = pair.split('=');
        return [decodeURIComponent(key), decodeURIComponent(value || '')];
      })
    );
  }
  
  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  _announceRouteChange(route) {
    // Create or update live region for screen readers
    let liveRegion = document.getElementById('route-announcer');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'route-announcer';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    
    const routeName = route.charAt(0).toUpperCase() + route.slice(1);
    liveRegion.textContent = `Navigated to ${routeName} page`;
  }
  
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  destroy() {
    window.removeEventListener('hashchange', this.handleHashChange);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('mouseover', this.handleMouseOver);
    
    if (this.currentView && typeof this.currentView.destroy === 'function') {
      this.currentView.destroy();
    }
    
    this.clearCache();
    this.logger.info('Router destroyed');
  }
}

