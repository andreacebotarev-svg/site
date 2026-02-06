# Диагностика проблемы с путями к FB2 файлам

## Проблема
Изначальный файл FB2 "уехал в сторону" - файл есть в репозитории, но приложение не может его найти.

## Промпт для поиска проблемы

```
ПРОБЛЕМА: FB2 файл не загружается, хотя файл существует в репозитории.

КОНТЕКСТ:
1. Файл находится в: reader/books/alice-wonderland.fb2
2. Метаданные в: reader/books/metadata.json указывают на "file": "alice-wonderland.fb2"
3. BookService пытается загрузить через: fetch('books/${bookData.file}')
4. reader.html может находиться в разных местах (корень или подпапка)

ЗАДАЧА: Найти где именно теряется путь к файлу.

ПРОВЕРИТЬ:
1. Откуда запускается reader.html? (корень сайта или reader/ подпапка?)
2. Какой путь используется в fetch() - относительный или абсолютный?
3. Правильно ли формируется bookUrl в BookService.loadBook()?
4. Есть ли разница между путями для isServerBook и обычных книг?
5. Проверить базовый URL страницы (window.location.pathname)
6. Проверить что происходит в LibraryView.loadMetadata() - правильно ли добавляется isServerBook: true?
7. Проверить localStorage - есть ли там запись с правильным file и isServerBook?
8. Проверить Network tab - какой реальный URL запрашивается?

ГИПОТЕЗЫ:
A. Путь формируется неправильно из-за относительного пути от reader.html
B. isServerBook не устанавливается, поэтому используется неправильная логика загрузки
C. Файл в localStorage имеет неправильный путь
D. Базовый URL страницы отличается от ожидаемого
E. CORS или другие проблемы с fetch()

ИНСТРУМЕНТЫ:
- Использовать diagnostic-fb2-path.js для проверки путей
- Проверить консоль браузера на ошибки 404
- Проверить Network tab на реальные запросы
- Проверить localStorage.getItem('reader-books')
```

## Диагностический скрипт

Скопируйте и выполните в консоли браузера:

```javascript
// Диагностика путей к FB2 файлам
(async function() {
  console.log('%c=== FB2 PATH DIAGNOSTIC ===', 'font-size: 16px; font-weight: bold;');
  
  // 1. Проверка текущего расположения
  console.log('\n📍 Current Location:');
  console.log('  URL:', window.location.href);
  console.log('  Pathname:', window.location.pathname);
  console.log('  Base path:', window.location.pathname.split('/').slice(0, -1).join('/') || '/');
  
  // 2. Проверка metadata.json
  console.log('\n📚 Metadata Check:');
  try {
    const metaResponse = await fetch('books/metadata.json');
    console.log('  metadata.json status:', metaResponse.status, metaResponse.statusText);
    if (metaResponse.ok) {
      const meta = await metaResponse.json();
      console.log('  Books in metadata:', meta.books?.length || 0);
      meta.books?.forEach(book => {
        console.log(`    - ${book.id}: file="${book.file}"`);
      });
    }
  } catch (e) {
    console.error('  ❌ Failed to load metadata.json:', e.message);
  }
  
  // 3. Проверка localStorage
  console.log('\n💾 LocalStorage Check:');
  const localBooks = JSON.parse(localStorage.getItem('reader-books') || '[]');
  console.log('  Books in localStorage:', localBooks.length);
  localBooks.forEach(book => {
    console.log(`    - ${book.id}:`, {
      file: book.file,
      isServerBook: book.isServerBook,
      hasFile: !!book.file
    });
  });
  
  // 4. Проверка путей к файлам
  console.log('\n🔍 File Path Check:');
  const testFiles = ['alice-wonderland.fb2'];
  for (const file of testFiles) {
    const paths = [
      `books/${file}`,
      `./books/${file}`,
      `/books/${file}`,
      `reader/books/${file}`
    ];
    
    for (const path of paths) {
      try {
        const response = await fetch(path, { method: 'HEAD' });
        console.log(`  ${path}:`, response.ok ? '✅' : `❌ ${response.status}`);
      } catch (e) {
        console.log(`  ${path}: ❌ ${e.message}`);
      }
    }
  }
  
  // 5. Симуляция BookService.loadBook()
  console.log('\n⚙️ BookService Simulation:');
  const testBookId = 'alice-wonderland';
  const bookData = localBooks.find(b => b.id === testBookId);
  
  if (bookData) {
    console.log('  Found book:', bookData);
    let bookUrl;
    
    if (bookData.isServerBook) {
      bookUrl = `books/${bookData.file}`;
      console.log('  isServerBook=true, URL:', bookUrl);
    } else if (bookData.file) {
      bookUrl = `books/${bookData.file}`;
      console.log('  has file, URL:', bookUrl);
    } else {
      bookUrl = `books/${testBookId}.fb2`;
      console.log('  fallback, URL:', bookUrl);
    }
    
    // Проверка реального запроса
    try {
      const response = await fetch(bookUrl);
      console.log('  Fetch result:', response.ok ? '✅' : `❌ ${response.status} ${response.statusText}`);
      if (!response.ok) {
        console.log('  ❌ PROBLEM FOUND: File not accessible at', bookUrl);
        console.log('  Expected location: reader/books/alice-wonderland.fb2');
        console.log('  Current page location:', window.location.pathname);
      }
    } catch (e) {
      console.error('  ❌ Fetch error:', e.message);
    }
  } else {
    console.log('  ❌ Book not found in localStorage');
    console.log('  This means metadata.json was not loaded or book was not added');
  }
  
  // 6. Рекомендации
  console.log('\n💡 Recommendations:');
  const basePath = window.location.pathname.split('/').slice(0, -1).join('/') || '/';
  console.log('  Base path:', basePath);
  console.log('  If reader.html is in root: books/alice-wonderland.fb2 ✅');
  console.log('  If reader.html is in reader/: ../books/alice-wonderland.fb2 or books/alice-wonderland.fb2');
  
})();
```

## Возможные решения

### Проблема 1: Неправильный относительный путь
**Симптом:** 404 ошибка при fetch('books/alice-wonderland.fb2')
**Решение:** Использовать абсолютный путь или правильный относительный путь от текущей страницы

### Проблема 2: isServerBook не установлен
**Симптом:** Книга не найдена в localStorage или isServerBook: false
**Решение:** Проверить LibraryView.loadMetadata() - правильно ли добавляется флаг

### Проблема 3: Файл не в том месте
**Симптом:** Файл существует, но по другому пути
**Решение:** Проверить структуру папок и переместить файл или исправить путь

### Проблема 4: CORS или серверная конфигурация
**Симптом:** Ошибки CORS или 403
**Решение:** Настроить сервер для раздачи статических файлов из books/

