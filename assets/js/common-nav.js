/**
 * Common Navigation for All Tools
 * Adds a persistent "Return to Site" button to sub-applications.
 */
(function() {
    // Check if button already exists or we are inside an iframe (modal)
    if (document.querySelector('.global-back-btn') || window.parent !== window) return;

    // Create button element
    const btn = document.createElement('a');
    
    // Determine path back to root based on current location depth
    // Most tools are 1 level deep (reader/, trainer/, aihelper/, dist/)
    // trainers/ are 1 level deep too.
    // If we are in deep subfolder, we might need adjustment, but standard is ../index.html
    const currentPath = window.location.pathname;
    let backPath = '../index.html'; 
    
    // Special handling if needed, but ../index.html works for:
    // /reader/index.html
    // /trainer/index.html
    // /aihelper/index.html
    // /dist/264.html
    // /english-trainers/present-simple.html

    btn.href = backPath;
    btn.className = 'global-back-btn';
    btn.innerHTML = '⬅ Вернуться на сайт с заявкой';
    
    // Styles
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '99999', // Super high z-index
        padding: '12px 24px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        color: '#111',
        textDecoration: 'none',
        borderRadius: '50px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        fontWeight: '600',
        fontSize: '16px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backdropFilter: 'blur(10px)',
        '-webkit-backdrop-filter': 'blur(10px)',
        border: '1px solid rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        minHeight: '44px', 
        minWidth: '44px'
    });

    // Hover effect (desktop)
    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateX(-50%) translateY(-2px)';
        btn.style.boxShadow = '0 6px 25px rgba(0,0,0,0.35)';
        btn.style.backgroundColor = '#fff';
    });
    
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateX(-50%)';
        btn.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        btn.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    });

    // Mobile specific adjustments
    if (window.innerWidth <= 480) {
        btn.style.bottom = '20px'; // Keep it accessible above bottom bars
        btn.style.padding = '10px 20px';
        btn.style.fontSize = '14px';
        btn.style.width = 'max-content';
        // Ensure it doesn't cover critical bottom areas in some apps
        // but typically 20px is safe.
    }

    // Add to body
    document.body.appendChild(btn);
})();
