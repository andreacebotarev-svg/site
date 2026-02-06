/**
 * URL Canonicalizer - Manages canonical URL state for Reader application
 * Ensures consistent URL parameters for sharing, bookmarking, and navigation
 *
 * Features:
 * - Automatic paginationV4 parameter addition
 * - Book ID synchronization between hash and query params
 * - history.replaceState() for seamless URL updates
 * - No page reloads or history pollution
 */

import { logger } from '../utils/logger.js';

const canonicalizerLogger = logger.createChild('URLCanonicalizer');

/**
 * Canonicalize reader URL by ensuring required query parameters
 * @param {Object} options
 * @param {string} options.bookIdFromRoute - Book ID from route params (e.g., from #/reader/<id>)
 * @returns {Object} - Current URL state after canonicalization
 */
export function canonicalizeReaderURL(options = {}) {
  const { bookIdFromRoute } = options;

  try {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    let hasChanges = false;

    // 1) paginationV4: Always ensure it exists (default to v4.0)
    if (!searchParams.has('paginationV4')) {
      searchParams.set('paginationV4', 'true'); // v4.0 by default for new users
      hasChanges = true;
      canonicalizerLogger.debug('Added missing paginationV4 parameter');
    }

    // 2) bookId: Sync from route to query params (for deep linking)
    if (bookIdFromRoute && !searchParams.get('bookId')) {
      searchParams.set('bookId', String(bookIdFromRoute));
      hasChanges = true;
      canonicalizerLogger.debug('Synced bookId from route to query params', { bookIdFromRoute });
    }

    // 3) Apply changes without page reload or history pollution
    if (hasChanges) {
      const newUrl = url.toString();
      history.replaceState(null, '', newUrl);
      canonicalizerLogger.info('URL canonicalized', {
        newUrl: newUrl.replace(window.location.origin, ''),
        changes: hasChanges
      });
    }

    // Return current state
    return {
      paginationV4: searchParams.get('paginationV4'),
      bookId: searchParams.get('bookId'),
      chapter: searchParams.get('chapter'),
      page: searchParams.get('page')
    };

  } catch (error) {
    canonicalizerLogger.error('URL canonicalization failed', error);
    return {
      paginationV4: null,
      bookId: null,
      chapter: null,
      page: null
    };
  }
}

/**
 * Check if current URL needs canonicalization
 * @returns {boolean}
 */
export function needsCanonicalization() {
  try {
    const searchParams = new URLSearchParams(window.location.search);

    // Check if paginationV4 is missing
    if (!searchParams.has('paginationV4')) {
      return true;
    }

    // Could add more checks here in the future
    // e.g., validate parameter values, check for deprecated params

    return false;
  } catch (error) {
    canonicalizerLogger.error('Canonicalization check failed', error);
    return false;
  }
}

/**
 * Clean up URL when leaving reader (optional)
 * Remove chapter/page params but keep paginationV4 and bookId
 */
export function cleanupReaderURL() {
  try {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;

    // Remove navigation-specific params
    searchParams.delete('chapter');
    searchParams.delete('page');

    // Keep paginationV4 and bookId for future visits
    history.replaceState(null, '', url.toString());

    canonicalizerLogger.debug('Reader URL cleaned up');
  } catch (error) {
    canonicalizerLogger.error('URL cleanup failed', error);
  }
}

/**
 * Get current URL state without canonicalization
 * @returns {Object}
 */
export function getCurrentURLState() {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      paginationV4: searchParams.get('paginationV4'),
      bookId: searchParams.get('bookId'),
      chapter: searchParams.get('chapter'),
      page: searchParams.get('page')
    };
  } catch (error) {
    canonicalizerLogger.error('Failed to get URL state', error);
    return {
      paginationV4: null,
      bookId: null,
      chapter: null,
      page: null
    };
  }
}

/**
 * Validate URL parameters
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateURLParams() {
  const errors = [];
  const state = getCurrentURLState();

  try {
    // Validate paginationV4
    if (state.paginationV4 && !['true', 'false'].includes(state.paginationV4)) {
      errors.push(`Invalid paginationV4 value: ${state.paginationV4}`);
    }

    // Validate bookId (if present)
    if (state.bookId && typeof state.bookId !== 'string') {
      errors.push(`Invalid bookId type: ${typeof state.bookId}`);
    }

    // Validate chapter (if present)
    if (state.chapter !== null) {
      const chapterNum = parseInt(state.chapter, 10);
      if (isNaN(chapterNum) || chapterNum < 0) {
        errors.push(`Invalid chapter value: ${state.chapter}`);
      }
    }

    // Validate page (if present)
    if (state.page !== null) {
      const pageNum = parseInt(state.page, 10);
      if (isNaN(pageNum) || pageNum < 0) {
        errors.push(`Invalid page value: ${state.page}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation failed: ${error.message}`]
    };
  }
}
