/**
 * Backwards-compat barrel: keep old path working.
 * NOTE: trainer-core and extensions must be loaded separately.
 */

// This file exists only so existing HTML pages that include
// `assets/js/trainer-base.js` do not break. All real logic
// now lives in trainer-core + related extension files.

// eslint-disable-next-line no-console
window.debugTrainer && window.debugTrainer('trainer-base.js loaded (compat shim)');
