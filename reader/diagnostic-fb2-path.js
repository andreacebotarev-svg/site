// Диагностика путей к FB2 файлам
// Скопируйте и выполните в консоли браузера при открытом reader.html

(async function fb2PathDiagnostic() {
  console.log('%c=== FB2 PATH DIAGNOSTIC ===', 'font-size: 16px; font-weight: bold; color: #3b82f6;');
  
  const results = {
    location: {},
    metadata: {},
    localStorage: {},
    filePaths: {},
    bookService: {},
    recommendations: []
  };
  
  // 1. Проверка текущего расположения
  console.log('\n%c1. Current Location:', 'font-weight: bold; color: #10b981;');
  const pathParts = window.location.pathname.split('/').filter(p => p);
  const currentFile = pathParts[pathParts.length - 1] || 'index.html';
  const basePath = pathParts.slice(0, -1).join('/') || '';
  
  results.location = {
    href: window.location.href,
    pathname: window.location.pathname,
    basePath: basePath || '/',
    currentFile: currentFile,
    isInSubfolder: pathParts.length > 1
  };
  
  console.log('  URL:', results.location.href);
  console.log('  Pathname:', results.location.pathname);
  console.log('  Base path:', results.location.basePath || '/ (root)');
  console.log('  Current file:', results.location.currentFile);
  console.log('  In subfolder:', results.location.isInSubfolder ? '✅ Yes' : '❌ No (root)');
  
  // 2. Проверка metadata.json
  console.log('\n%c2. Metadata.json Check:', 'font-weight: bold; color: #10b981;');
  const metadataPaths = [
    'books/metadata.json',
    './books/metadata.json',
    '/books/metadata.json',
    '../books/metadata.json'
  ];
  
  let metadataFound = false;
  let metadataData = null;
  
  for (const path of metadataPaths) {
    try {
      const response = await fetch(path, { method: 'HEAD' });
      if (response.ok) {
        console.log(`  ✅ Found at: ${path}`);
        const fullResponse = await fetch(path);
        metadataData = await fullResponse.json();
        results.metadata = {
          found: true,
          path: path,
          booksCount: metadataData.books?.length || 0,
          books: metadataData.books || []
        };
        metadataFound = true;
        console.log(`  Books in metadata: ${results.metadata.booksCount}`);
        metadataData.books?.forEach(book => {
          console.log(`    - ${book.id}: file="${book.file || 'MISSING'}"`);
        });
        break;
      }
    } catch (e) {
      // Continue to next path
    }
  }
  
  if (!metadataFound) {
    results.metadata = { found: false };
    console.log('  ❌ metadata.json not found in any expected location');
    results.recommendations.push('Check if books/metadata.json exists in the correct location');
  }
  
  // 3. Проверка localStorage
  console.log('\n%c3. LocalStorage Check:', 'font-weight: bold; color: #10b981;');
  const localBooks = JSON.parse(localStorage.getItem('reader-books') || '[]');
  results.localStorage = {
    booksCount: localBooks.length,
    books: localBooks
  };
  
  console.log('  Books in localStorage:', localBooks.length);
  if (localBooks.length === 0) {
    console.log('  ⚠️ localStorage is empty - metadata.json may not have been loaded');
    results.recommendations.push('localStorage is empty - check if LibraryView.loadMetadata() is called');
  } else {
    localBooks.forEach(book => {
      const status = book.isServerBook ? '✅ Server' : '📱 Local';
      console.log(`    ${status} ${book.id}:`, {
        file: book.file || '❌ MISSING',
        isServerBook: book.isServerBook || false
      });
      
      if (!book.file) {
        results.recommendations.push(`Book ${book.id} has no 'file' property`);
      }
      if (book.id === 'alice-wonderland' && !book.isServerBook) {
        results.recommendations.push(`Book alice-wonderland should have isServerBook: true`);
      }
    });
  }
  
  // 4. Проверка путей к файлам
  console.log('\n%c4. File Path Check:', 'font-weight: bold; color: #10b981;');
  const testFiles = ['alice-wonderland.fb2'];
  const possiblePaths = [
    'books/alice-wonderland.fb2',
    './books/alice-wonderland.fb2',
    '/books/alice-wonderland.fb2',
    '../books/alice-wonderland.fb2',
    'reader/books/alice-wonderland.fb2'
  ];
  
  results.filePaths = {};
  
  for (const file of testFiles) {
    console.log(`  Testing: ${file}`);
    results.filePaths[file] = {};
    
    for (const path of possiblePaths) {
      try {
        const response = await fetch(path, { method: 'HEAD' });
        const status = response.ok ? '✅' : `❌ ${response.status}`;
        console.log(`    ${path}: ${status}`);
        results.filePaths[file][path] = response.ok;
        
        if (response.ok && !results.filePaths.workingPath) {
          results.filePaths.workingPath = path;
        }
      } catch (e) {
        console.log(`    ${path}: ❌ ${e.message}`);
        results.filePaths[file][path] = false;
      }
    }
  }
  
  // 5. Симуляция BookService.loadBook()
  console.log('\n%c5. BookService Simulation:', 'font-weight: bold; color: #10b981;');
  const testBookId = 'alice-wonderland';
  const bookData = localBooks.find(b => b.id === testBookId);
  
  if (bookData) {
    console.log('  Book found in localStorage:', bookData);
    results.bookService.bookFound = true;
    results.bookService.bookData = bookData;
    
    let bookUrl;
    let reason;
    
    if (bookData.isServerBook) {
      bookUrl = `books/${bookData.file}`;
      reason = 'isServerBook=true';
    } else if (bookData.file) {
      bookUrl = `books/${bookData.file}`;
      reason = 'has file property';
    } else {
      bookUrl = `books/${testBookId}.fb2`;
      reason = 'fallback';
    }
    
    console.log(`  URL construction: ${reason}`);
    console.log(`  Constructed URL: ${bookUrl}`);
    results.bookService.constructedUrl = bookUrl;
    results.bookService.reason = reason;
    
    // Проверка реального запроса
    try {
      const response = await fetch(bookUrl);
      results.bookService.fetchResult = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      };
      
      if (response.ok) {
        console.log('  ✅ File accessible!');
      } else {
        console.log(`  ❌ File NOT accessible: ${response.status} ${response.statusText}`);
        console.log('  ❌ PROBLEM FOUND: File cannot be loaded');
        results.recommendations.push(`File not accessible at ${bookUrl} - check file location and path construction`);
      }
    } catch (e) {
      results.bookService.fetchResult = {
        ok: false,
        error: e.message
      };
      console.error('  ❌ Fetch error:', e.message);
      results.recommendations.push(`Fetch error: ${e.message}`);
    }
  } else {
    console.log('  ❌ Book not found in localStorage');
    console.log('  This means:');
    console.log('    1. metadata.json was not loaded, OR');
    console.log('    2. LibraryView.loadMetadata() was not called, OR');
    console.log('    3. Book was not added to localStorage');
    results.bookService.bookFound = false;
    results.recommendations.push('Book not in localStorage - check metadata.json loading');
  }
  
  // 6. Проверка IndexedDB (опционально)
  console.log('\n%c6. IndexedDB Check:', 'font-weight: bold; color: #10b981;');
  try {
    // Попытка проверить через storageService если доступен
    if (window.storageService) {
      const blob = await window.storageService.getBookContent(testBookId);
      console.log('  Book in IndexedDB:', blob ? '✅ Yes' : '❌ No');
      results.bookService.inIndexedDB = !!blob;
    } else {
      console.log('  ⚠️ storageService not available in window');
    }
  } catch (e) {
    console.log('  ⚠️ Cannot check IndexedDB:', e.message);
  }
  
  // 7. Итоговые рекомендации
  console.log('\n%c=== RECOMMENDATIONS ===', 'font-size: 14px; font-weight: bold; color: #f59e0b;');
  
  if (results.recommendations.length === 0) {
    console.log('  ✅ No issues found!');
  } else {
    results.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }
  
  // Сохраняем результаты
  window.fb2PathDiagnostics = results;
  console.log('\n%cResults saved to window.fb2PathDiagnostics', 'font-style: italic; color: #6b7280;');
  
  return results;
})();


















