# 🚀 Deployment Guide

Complete guide for deploying the Reader application with pagination and bug control features.

## 📋 Prerequisites

### System Requirements
- **Node.js**: `>= 16.0.0`
- **npm**: `>= 8.0.0`
- **Web Server**: Any static file server (nginx, Apache, etc.)
- **SSL Certificate**: Required for PWA functionality in production

### Browser Support
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## 🏗️ Build Process

### Development Setup
```bash
# Clone repository
git clone <repository-url>
cd reader

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Production Build
```bash
# Build for production (static files only)
npm run build

# The build process generates optimized static files
# No actual build step required - vanilla JS
```

## 🌐 Web Server Configuration

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self';" always;

    # Root directory
    root /var/www/reader;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker
    location /service-worker.js {
        add_header Cache-Control "no-cache";
        expires 0;
    }

    # API proxy (if using external APIs)
    location /api/ {
        proxy_pass https://api.example.com/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com

    # SSL configuration
    SSLEngine on
    SSLCertificateFile /path/to/ssl/cert.pem
    SSLCertificateKeyFile /path/to/ssl/private.key

    # Security headers
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options nosniff
    Header always set Referrer-Policy "no-referrer-when-downgrade"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self';"

    DocumentRoot /var/www/reader

    # Handle SPA routing
    <Directory "/var/www/reader">
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Cache headers
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "max-age=31536000, public, immutable"
    </FilesMatch>

    # Service worker
    <Files "service-worker.js">
        Header set Cache-Control "no-cache"
    </Files>
</VirtualHost>
```

### Netlify Deployment (_headers)
```
/*
  X-Frame-Options: SAMEORIGIN
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer-when-downgrade
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self';

/service-worker.js
  Cache-Control: no-cache

*.js
  Cache-Control: public, max-age=31536000, immutable

*.css
  Cache-Control: public, max-age=31536000, immutable

*.png
*.jpg
*.jpeg
*.gif
*.ico
*.svg
*.woff
*.woff2
*.ttf
*.eot
  Cache-Control: public, max-age=31536000, immutable
```

## 🔧 Environment Configuration

### Environment Variables
Create `.env` file for development:
```bash
# API endpoints (if used)
VITE_API_BASE_URL=https://api.example.com

# Feature flags
VITE_ENABLE_BUG_TRACKING=true
VITE_ENABLE_PAGINATION=true

# Debug settings
VITE_DEBUG_MODE=false
```

### Feature Flags
Control features through settings:
```javascript
// In settings-manager.js
const FEATURES = {
  PAGINATION: true,
  BUG_TRACKING: true,
  OFFLINE_MODE: true,
  ANALYTICS: false
};
```

## 📊 Monitoring & Analytics

### Error Tracking
The application includes built-in error tracking:
```javascript
// Access bug statistics programmatically
const debugger = window.omniDebugger;
const stats = debugger.getBugStats();

// Export bugs for analysis
debugger.downloadBugs();
```

### Performance Monitoring
```javascript
// Monitor Core Web Vitals
import { getCLS, getFID, getFCP, getLCP } from 'web-vitals';

// Track pagination performance
const pagination = readerView.paginationEngine;
const metrics = pagination.getMetrics();
```

## 🧪 Testing Deployment

### Automated Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test files
npm test -- test-pagination-basic.html
npm test -- test-omnidebugger-bugs.html
```

### Manual Testing Checklist
- [ ] Application loads without errors
- [ ] Book upload functionality works
- [ ] Reading modes switch correctly
- [ ] Pagination displays properly
- [ ] Progress saves and restores
- [ ] Bug tracking captures errors
- [ ] PWA installation works
- [ ] Offline mode functions
- [ ] Mobile responsiveness

### Performance Testing
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Pagination switching < 100ms
- [ ] Memory usage stable

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] Run full test suite: `npm test`
- [ ] Lint code: `npm run lint`
- [ ] Build production assets: `npm run build`
- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

### Deployment Steps
1. **Upload files** to web server
2. **Configure SSL certificate** for HTTPS
3. **Update DNS records** to point to server
4. **Test PWA installation** from domain
5. **Verify service worker** registration
6. **Test all features** in production environment

### Post-deployment
- [ ] Monitor error logs via OmniDebugger
- [ ] Check bug reports for issues
- [ ] Monitor performance metrics
- [ ] Update users about new features
- [ ] Plan next release cycle

## 🔒 Security Considerations

### Content Security Policy
```javascript
// CSP headers configured in web server
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self';
```

### Data Privacy
- All user data stored locally
- No external tracking by default
- Optional analytics can be enabled
- User data export functionality available

### HTTPS Requirements
- SSL certificate required for PWA
- Service worker requires secure context
- External APIs must use HTTPS

## 🐛 Troubleshooting

### Common Issues

#### Pagination Not Working
```javascript
// Check console for errors
console.log('Pagination engine:', readerView.paginationEngine);

// Verify DOM structure
console.log('Reading content:', document.querySelector('#reading-content'));
```

#### Bugs Not Saving
```javascript
// Check localStorage
console.log('Bug storage:', localStorage.getItem('omnidebugger_bugs'));

// Verify OmniDebugger initialization
console.log('Debugger:', window.omniDebugger);
```

#### PWA Not Installing
- Ensure HTTPS is enabled
- Check manifest.json is served correctly
- Verify service worker registration

### Debug Commands
```javascript
// Access debug tools
window.app.debugger.getBugStats()
window.app.debugger.downloadBugs()
window.readerView.paginationEngine.getMetrics()
```

## 📞 Support

For deployment issues:
1. Check browser console for errors
2. Review network tab for failed requests
3. Use OmniDebugger to export bug reports
4. Check server logs for HTTP errors

## 🔄 Rollback Plan

If deployment fails:
1. Revert to previous version by restoring backup
2. Clear browser cache and service worker
3. Check localStorage for corrupted data
4. Use browser incognito mode for testing
