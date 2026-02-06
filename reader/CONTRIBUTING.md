# 🤝 Contributing to Reader

Welcome! This document outlines how to contribute to the Reader project.

## 🚀 Quick Start for Contributors

### Prerequisites
- Node.js 16+ for testing
- Git for version control
- Modern browser for testing

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/your-repo/reader.git
cd reader

# Install dependencies
npm install

# Start development server
npx serve . -p 8000

# Open browser
open http://localhost:8000
```

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** following established patterns

3. **Test your changes**
   ```bash
   npm test
   npm run test:coverage
   ```

4. **Run manual tests**
   - Upload FB2 files with different encodings
   - Test drag & drop functionality
   - Verify responsive design
   - Check accessibility with screen readers

5. **Commit with conventional format**
   ```bash
   git commit -m "feat: Add new component functionality"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🏗️ Architecture Guidelines

### Component-Based Architecture

All UI components follow a consistent pattern:

```javascript
export class ComponentName {
  constructor(container, options = {}) {
    this.container = container;
    this.options = { ...defaultOptions, ...options };
    this.state = initialState;
    this.render();
    this.attachEvents();
  }

  render() {
    // Render initial HTML
    this.container.innerHTML = this.generateHTML();
  }

  attachEvents() {
    // Attach event listeners
    // Use event delegation where possible
  }

  // Public API methods
  updateState(newState) {
    this.state = { ...this.state, ...newState };
    this.render(); // Re-render on state change
  }

  destroy() {
    // Cleanup event listeners
    // Remove DOM references
  }
}
```

### CSS Architecture

- **Base styles**: Variables, reset, typography
- **Component styles**: Scoped to component classes
- **Utility classes**: Reusable layout helpers
- **No inline styles**: All styles in separate CSS files

### Error Handling

```javascript
// Always use try-catch for async operations
try {
  const result = await riskyOperation();
  this.handleSuccess(result);
} catch (error) {
  this.logger.error('Operation failed', error);
  this.handleError(error);
}

// Provide user-friendly error messages
const userMessage = error.code === 'NETWORK_ERROR'
  ? 'Please check your internet connection'
  : 'An unexpected error occurred';

// Use toast notifications for errors
toastManager.error(userMessage, {
  title: 'Error',
  actions: [{ label: 'Retry', onClick: () => retry() }]
});
```

## 🧪 Testing Guidelines

### Unit Tests

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentUnderTest } from '../ComponentUnderTest.js';

describe('ComponentUnderTest', () => {
  let component;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    component = new ComponentUnderTest(container);
  });

  afterEach(() => {
    component.destroy();
  });

  it('should render initial state', () => {
    expect(container.querySelector('.component-class')).toBeTruthy();
  });

  it('should handle user interactions', () => {
    const button = container.querySelector('.button');
    button.click();

    expect(component.state.clicked).toBe(true);
  });
});
```

### Test Coverage Requirements

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >90%
- **Lines**: >80%

### Manual Testing Checklist

- [ ] Upload FB2 files (utf-8, windows-1251, koi8-r)
- [ ] Upload EPUB files (2.0, 3.0)
- [ ] Upload TXT files
- [ ] Drag & drop multiple files
- [ ] Test on mobile devices
- [ ] Test with screen readers
- [ ] Test offline functionality
- [ ] Test theme switching
- [ ] Test error scenarios (network failure, invalid files)

## 📝 Code Standards

### JavaScript

```javascript
// ✅ Good: Clear naming, early returns, async/await
async function loadBookContent(bookId) {
  if (!bookId) return null;

  try {
    const cached = await getFromCache(bookId);
    if (cached) return cached;

    const content = await fetchBookContent(bookId);
    await saveToCache(bookId, content);
    return content;
  } catch (error) {
    logger.error('Failed to load book content', error);
    throw new Error('Book content unavailable');
  }
}

// ❌ Bad: Nested callbacks, unclear naming
function loadBookContent(bookId, callback) {
  if (bookId) {
    getFromCache(bookId, (cached) => {
      if (cached) {
        callback(null, cached);
      } else {
        fetchBookContent(bookId, (err, content) => {
          if (err) callback(err);
          else saveToCache(bookId, content, () => callback(null, content));
        });
      }
    });
  }
}
```

### CSS

```css
/* ✅ Good: Component-scoped, custom properties */
.book-card {
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  background: var(--card-bg);
  border-radius: 16px;
  padding: var(--space-4);
  box-shadow: var(--card-shadow);
  transition: transform 0.2s, box-shadow 0.2s;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-shadow), 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* ❌ Bad: Inline styles, magic numbers */
.book-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}
```

## 🔧 Development Tools

### Recommended VS Code Extensions

- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **GitLens**: Git integration
- **Live Server**: Local development server

### Browser DevTools

- **Performance**: Monitor memory usage and loading times
- **Accessibility**: Audit accessibility compliance
- **Application**: Inspect service worker and storage

## 📋 Pull Request Process

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing done

## Checklist
- [ ] Code follows established patterns
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No linting errors
- [ ] Performance impact assessed
```

### Review Process

1. **Automated checks**: Tests must pass
2. **Code review**: At least one maintainer review
3. **Manual testing**: Reviewer verifies functionality
4. **Merge**: Squash and merge with descriptive commit message

## 🐛 Reporting Issues

### Bug Reports

Please include:
- Browser and version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if applicable

### Feature Requests

Please include:
- Use case description
- Proposed implementation
- Alternative solutions considered
- Impact assessment

## 📚 Resources

- [MDN Web Docs](https://developer.mozilla.org/)
- [Web.dev](https://web.dev/)
- [JavaScript Info](https://javascript.info/)
- [CSS Tricks](https://css-tricks.com/)

## 💬 Communication

- **Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Pull Requests**: For code contributions

Thank you for contributing to Reader! 🎉
