/**
 * Spoke Preview Modal (Universal)
 * Uses a transparent touch overlay to capture swipe gestures on mobile,
 * since iframes consume all touch events.
 */

const MOBILE_BREAKPOINT = 768;

function isMobile() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function openSpokePreview(url, title = 'Пример') {
  if (!url) return;

  const modal = document.getElementById('platformModal');
  const iframe = document.getElementById('platformIframe');
  const content = modal.querySelector('.platform-modal-content');

  if (!modal || !iframe) {
    console.error('Spoke modal elements not found');
    return;
  }

  // Update title
  const titleEl = document.getElementById('platformModalTitle');
  if (titleEl) titleEl.textContent = title;

  // Reset any previous transformations
  if (content) {
    content.style.transform = '';
    content.style.transition = '';
  }
  modal.style.opacity = '';

  iframe.src = url;
  iframe.setAttribute('title', title);
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closePlatformPreview() {
  const modal = document.getElementById('platformModal');
  const iframe = document.getElementById('platformIframe');
  if (!modal || !iframe) return;
  const content = modal.querySelector('.platform-modal-content');

  iframe.src = '';
  modal.style.display = 'none';
  document.body.style.overflow = '';
  modal.style.opacity = '';
  if (content) {
    content.style.transform = '';
    content.style.transition = '';
  }
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closePlatformPreview();
});

window.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('platformModal');
  if (!modal) return;

  // Close on overlay click
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closePlatformPreview();
  });

  // Delegate clicks for elements with .js-spoke class
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-spoke');
    if (!btn) return;
    if (btn.tagName === 'A') e.preventDefault();
    openSpokePreview(btn.dataset.url, btn.dataset.title);
  });

  // Handle close messages from iframes
  window.addEventListener('message', (e) => {
    if (e.data === 'closeModal') closePlatformPreview();
  });

  // ── Mobile Swipe-to-Close via touch overlay ──
  // The iframe eats ALL touch events. We place a transparent overlay
  // on top of the iframe that activates on first vertical swipe,
  // then moves the whole modal content down.

  const content = modal.querySelector('.platform-modal-content');
  const header = modal.querySelector('.ok-modal-header');
  if (!content || !header) return;

  // Create a transparent overlay that covers the iframe area
  const overlay = document.createElement('div');
  overlay.id = 'platformSwipeOverlay';
  overlay.style.cssText = `
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 10;
    display: none;
    touch-action: none;
  `;
  content.style.position = 'relative';
  content.appendChild(overlay);

  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let overlayActive = false;

  // Header drag: always works
  header.addEventListener('touchstart', (e) => {
    if (window.innerWidth > MOBILE_BREAKPOINT) return;
    startY = e.touches[0].clientY;
    isDragging = false;
  }, { passive: true });

  header.addEventListener('touchmove', (e) => {
    if (window.innerWidth > MOBILE_BREAKPOINT) return;
    currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (diff > 10) {
      isDragging = true;
      if (e.cancelable) e.preventDefault();

      // Activate overlay to block iframe touches
      overlay.style.display = 'block';
      overlayActive = true;

      content.style.transition = 'none';
      modal.style.transition = 'none';
      content.style.transform = `translateY(${diff}px)`;
      const opacity = 1 - (diff / (window.innerHeight * 0.8));
      modal.style.opacity = Math.max(0, opacity);
    }
  }, { passive: false });

  header.addEventListener('touchend', handleTouchEnd);

  // Overlay drag: catches gestures once activated, and also
  // allows starting a swipe from anywhere on the overlay
  overlay.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isDragging = false;
  }, { passive: true });

  overlay.addEventListener('touchmove', (e) => {
    currentY = e.touches[0].clientY;
    const diff = currentY - startY;

    if (diff > 5) {
      isDragging = true;
      if (e.cancelable) e.preventDefault();

      content.style.transition = 'none';
      modal.style.transition = 'none';
      content.style.transform = `translateY(${diff}px)`;
      const opacity = 1 - (diff / (window.innerHeight * 0.8));
      modal.style.opacity = Math.max(0, opacity);
    }
  }, { passive: false });

  overlay.addEventListener('touchend', handleTouchEnd);

  function handleTouchEnd() {
    if (!isDragging) {
      // Hide overlay if no drag happened (allow iframe interaction)
      if (overlayActive) {
        overlay.style.display = 'none';
        overlayActive = false;
      }
      return;
    }
    isDragging = false;

    const diff = currentY - startY;
    const threshold = 100;

    content.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    modal.style.transition = 'opacity 0.3s ease-out';

    if (diff > threshold) {
      content.style.transform = 'translateY(100vh)';
      modal.style.opacity = '0';
      setTimeout(() => {
        closePlatformPreview();
        overlay.style.display = 'none';
        overlayActive = false;
      }, 300);
    } else {
      content.style.transform = 'translateY(0)';
      modal.style.opacity = '1';
      setTimeout(() => {
        overlay.style.display = 'none';
        overlayActive = false;
      }, 300);
    }
  }

  // Also allow the modal body (outside iframe) to trigger swipe
  const modalBody = modal.querySelector('.ok-modal-body');
  if (modalBody) {
    modalBody.addEventListener('touchstart', (e) => {
      if (window.innerWidth > MOBILE_BREAKPOINT) return;
      // If the touch target is the modal body itself (not the iframe),
      // activate the overlay for swiping
      if (e.target === modalBody || e.target === overlay) {
        startY = e.touches[0].clientY;
        isDragging = false;
        overlay.style.display = 'block';
        overlayActive = true;
      }
    }, { passive: true });
  }
});