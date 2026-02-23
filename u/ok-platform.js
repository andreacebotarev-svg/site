/**
 * ok-platform.js — Dedicated platform modal for /u/ directory
 * Android-style swipe up/down to dismiss.
 * Uses touch-action: pan-x on the modal so the browser handles
 * horizontal scrolling natively, while we capture vertical gestures.
 */

(function () {
  'use strict';

  // ── Open / Close ──────────────────────────────────────────

  window.openSpokePreview = function (url, title) {
    if (!url) return;
    title = title || 'Пример';

    const modal   = document.getElementById('platformModal');
    const iframe  = document.getElementById('platformIframe');
    const content = modal && modal.querySelector('.platform-modal-content');
    const titleEl = document.getElementById('platformModalTitle');

    if (!modal || !iframe || !content) return;

    // Reset transforms
    content.style.transform  = '';
    content.style.transition = '';
    modal.style.opacity = '';

    if (titleEl) titleEl.textContent = title;
    iframe.src = url;
    iframe.setAttribute('title', title);
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  window.closePlatformPreview = function () {
    const modal   = document.getElementById('platformModal');
    const iframe  = document.getElementById('platformIframe');
    if (!modal || !iframe) return;
    const content = modal.querySelector('.platform-modal-content');

    iframe.src = '';
    modal.style.display = 'none';
    document.body.style.overflow = '';
    modal.style.opacity = '';
    if (content) {
      content.style.transform  = '';
      content.style.transition = '';
    }
  };

  // ── Init on DOMContentLoaded ──────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('platformModal');
    if (!modal) return;

    const content  = modal.querySelector('.platform-modal-content');
    const header   = modal.querySelector('.ok-modal-header');
    if (!content) return;

    // Close on backdrop click
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closePlatformPreview();
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePlatformPreview();
    });

    // Delegate .js-spoke clicks
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.js-spoke');
      if (!btn) return;
      if (btn.tagName === 'A') e.preventDefault();
      openSpokePreview(btn.dataset.url, btn.dataset.title);
    });

    // Handle close messages from iframes
    window.addEventListener('message', function (e) {
      if (e.data === 'closeModal') closePlatformPreview();
    });

    // ── Android-style swipe-to-dismiss ────────────────────

    // Key insight: set touch-action: pan-x on the content so the browser
    // handles horizontal scrolling natively, while we handle Y-axis manually.
    // This eliminates the OX/OY conflict that was blocking swipe.
    content.style.touchAction = 'pan-x';

    var startY     = 0;
    var currentY   = 0;
    var dragging   = false;
    var dirLocked  = false; // true once we decide vertical vs horizontal
    var isVertical = false;
    var startX     = 0;
    var currentX   = 0;

    content.addEventListener('touchstart', function (e) {
      startY     = e.touches[0].clientY;
      startX     = e.touches[0].clientX;
      currentY   = startY;
      currentX   = startX;
      dragging   = false;
      dirLocked  = false;
      isVertical = false;
    }, { passive: true });

    content.addEventListener('touchmove', function (e) {
      currentY = e.touches[0].clientY;
      currentX = e.touches[0].clientX;

      var diffY = currentY - startY;
      var diffX = currentX - startX;

      // Lock direction on first significant movement
      if (!dirLocked && (Math.abs(diffY) > 8 || Math.abs(diffX) > 8)) {
        dirLocked = true;
        isVertical = Math.abs(diffY) > Math.abs(diffX);
      }

      // If horizontal, let the browser handle it (pan-x)
      if (!isVertical) return;

      // Vertical drag — we take over
      if (Math.abs(diffY) > 10) {
        dragging = true;
        if (e.cancelable) e.preventDefault();

        content.style.transition = 'none';
        modal.style.transition   = 'none';

        content.style.transform = 'translateY(' + diffY + 'px)';
        var opacity = 1 - (Math.abs(diffY) / (window.innerHeight * 0.7));
        modal.style.opacity = Math.max(0, opacity);
      }
    }, { passive: false });

    content.addEventListener('touchend', function () {
      if (!dragging) return;
      dragging = false;

      var diffY     = currentY - startY;
      var threshold = 100;

      content.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      modal.style.transition   = 'opacity 0.3s ease-out';

      if (Math.abs(diffY) > threshold) {
        // Fly away in the direction of the swipe
        var dir = diffY > 0 ? '100vh' : '-100vh';
        content.style.transform = 'translateY(' + dir + ')';
        modal.style.opacity = '0';
        setTimeout(function () {
          closePlatformPreview();
        }, 300);
      } else {
        // Snap back
        content.style.transform = 'translateY(0)';
        modal.style.opacity = '1';
      }
    });
  });
})();
