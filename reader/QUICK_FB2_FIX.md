# Быстрое решение проблемы с FB2 файлами

## Проблема
FB2 файл не загружается, хотя файл есть в репозитории (`reader/books/alice-wonderland.fb2`).

## Быстрая диагностика (30 секунд)

1. Откройте `reader.html` в браузере
2. Откройте консоль (F12)
3. Скопируйте и выполните код из `diagnostic-fb2-path.js`

Или выполните в консоли:

```javascript
// Быстрая проверка
const localBooks = JSON.parse(localStorage.getItem('reader-books') || '[]');
const book = localBooks.find(b => b.id === 'alice-wonderland');
console.log('Book in localStorage:', book);
console.log('Has file:', book?.file);
console.log('Is server book:', book?.isServerBook);

// Проверка файла
fetch('books/alice-wonderland.fb2', {method: 'HEAD'})
  .then(r => console.log('File accessible:', r.ok ? '✅' : `❌ ${r.status}`))
  .catch(e => console.error('Error:', e));
```

## Типичные проблемы и решения

### Проблема 1: Книга не в localStorage
**Симптом:** `localStorage.getItem('reader-books')` возвращает пустой массив или не содержит `alice-wonderland`

**Решение:**
1. Откройте библиотеку (`index.html`)
2. Дождитесь загрузки (должен вызваться `LibraryView.loadMetadata()`)
3. Проверьте консоль на ошибки загрузки `metadata.json`

### Проблема 2: `isServerBook: false` или отсутствует
**Симптом:** Книга есть в localStorage, но `isServerBook` не установлен

**Решение:** Проверить `LibraryView.loadMetadata()` - должен добавлять `isServerBook: true` для книг из metadata.json

### Проблема 3: Неправильный путь к файлу
**Симптом:** 404 ошибка при fetch('books/alice-wonderland.fb2')

**Решение:**
- Если `reader.html` в корне: путь `books/alice-wonderland.fb2` ✅
- Если `reader.html` в `reader/`: путь должен быть `books/alice-wonderland.fb2` (относительно reader/)
- Проверить реальный путь через Network tab в DevTools

### Проблема 4: Файл не существует
**Симптом:** Файл действительно отсутствует в `reader/books/`

**Решение:** Убедиться что файл `alice-wonderland.fb2` находится в `reader/books/`

## Полная диагностика

См. `FB2_PATH_DIAGNOSTIC.md` для детального анализа всех возможных проблем.

