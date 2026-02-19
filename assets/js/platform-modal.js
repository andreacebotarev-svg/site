/**
 * Spoke Preview Modal (Universal)
 * Desktop: iframe modal
 * Mobile: open in new tab
 */

const MOBILE_BREAKPOINT = 768;

function isMobile() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function openSpokePreview(url, title = 'Пример') {
  if (!url) return;

  // Desktop/Mobile: modal iframe
  const modal = document.getElementById('platformModal');
  const iframe = document.getElementById('platformIframe');

  if (!modal || !iframe) {
    console.error('Spoke modal elements not found');
    return;
  }

  iframe.src = url;
  iframe.setAttribute('title', title);
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closePlatformPreview() {
  const modal = document.getElementById('platformModal');
  const iframe = document.getElementById('platformIframe');
  if (!modal || !iframe) return;

  iframe.src = '';
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && !isMobile()) closePlatformPreview();
});

window.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('platformModal');
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closePlatformPreview();
    });
  }
  
  // Delegate clicks for elements with .js-spoke class
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-spoke');
    if (!btn) return;
    // prevent default if it's a link behaving as a button, though usually we use buttons
    if (btn.tagName === 'A') e.preventDefault(); 
    
    openSpokePreview(btn.dataset.url, btn.dataset.title);
  });

  // Handle close messages from iframes
  window.addEventListener('message', (e) => {
    if (e.data === 'closeModal') closePlatformPreview();
  });
});