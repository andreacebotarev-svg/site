/**
 * Demonstration Mode Logic
 * Limits usage to 6 seconds and shows a blocking overlay.
 */
(function() {
    console.log('⏳ Demo Mode Initialized: 6 seconds counting down...');

    // CONFIG
    const DEMO_DURATION_MS = 6000; // 6 seconds

    // Timer
    setTimeout(() => {
        showDemoOverlay();
    }, DEMO_DURATION_MS);

    function showDemoOverlay() {
        console.log('🛑 Demo Time Expired!');

        // Create Overlay
        const overlay = document.createElement('div');
        overlay.id = 'demo-overlay';
        
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: '10000',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(8px)',
            opacity: '0',
            transition: 'opacity 0.5s ease'
        });

        // Content Container
        const content = document.createElement('div');
        Object.assign(content.style, {
            textAlign: 'center',
            padding: '2rem',
            maxWidth: '90%',
            width: '400px'
        });

        // Message
        const title = document.createElement('h2');
        title.textContent = 'Это была лишь демонстрация';
        Object.assign(title.style, {
            color: 'white',
            marginBottom: '1rem',
            fontSize: '1.8rem',
            fontWeight: '700'
        });

        const subtitle = document.createElement('p');
        subtitle.textContent = 'Чтобы получить полный доступ, вернитесь на сайт и оставьте заявку.';
        Object.assign(subtitle.style, {
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '2rem',
            lineHeight: '1.5',
            fontSize: '1.1rem'
        });

        // CTA Button
        const ctaBtn = document.createElement('a');
        ctaBtn.href = '../index.html#lead'; // Anchors to lead form if possible
        ctaBtn.textContent = 'Вернуться на сайт с заявкой';
        Object.assign(ctaBtn.style, {
            display: 'inline-block',
            padding: '16px 32px',
            backgroundColor: '#FF4757', // Accent color
            color: 'white',
            textDecoration: 'none',
            borderRadius: '50px',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            boxShadow: '0 4px 15px rgba(255, 71, 87, 0.4)',
            transition: 'transform 0.2s ease',
            cursor: 'pointer'
        });

        // Add hover effect via JS since it's inline
        ctaBtn.addEventListener('mouseenter', () => ctaBtn.style.transform = 'scale(1.05)');
        ctaBtn.addEventListener('mouseleave', () => ctaBtn.style.transform = 'scale(1)');

        // Assemble
        content.appendChild(title);
        content.appendChild(subtitle);
        content.appendChild(ctaBtn);
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        // Animate In
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });

        // Disable scrolling on body
        document.body.style.overflow = 'hidden';
    }
})();
