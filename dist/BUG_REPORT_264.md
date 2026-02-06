# 🐞 BUG REPORT: 264.html Theme System Issue

**Date:** December 24, 2025  
**Status:** ✅ FIXED  
**Severity:** HIGH (User-Facing Visual Bug)  
**File:** `dist/264.html`

---

## 🚨 Проблема

**Симптомы:**
- Переключатель тем Kids/Classic/Dark не менял цвета
- Фон оставался светло-мятным (старый дизайн)
- Кнопка "Kids" подсвечивалась, но тема не применялась

**Визуальное доказательство:**  
См. скриншот в issue - фон остаётся `#e8f5e3` вместо `#faf8f5` (Kids theme)

---

## 🔍 Анализ причин

### 1. Проверка `<head>` структуры

**Найденная проблема:**

```html
<!-- ❌ ОШИБКА: design-tokens.css ОТСУТСТВУЕТ! -->
<link rel="stylesheet" href="assets/css/lesson-core.css">
<link rel="stylesheet" href="assets/css/lesson-components.css">
<link rel="stylesheet" href="assets/css/lesson-responsive.css">

<!-- ❌ Используется УСТАРЕВШИЙ lesson-themes.css -->
<link rel="stylesheet" href="assets/css/lesson-themes.css">
```

**Правильный порядок (из theme-demo.html):**

```html
<!-- ✅ ПРАВИЛЬНО: design-tokens.css ПЕРВЫМ! -->
<link rel="stylesheet" href="assets/css/design-tokens.css">
<link rel="stylesheet" href="assets/css/lesson-core.css">
<link rel="stylesheet" href="assets/css/lesson-components.css">
```

### 2. Проверка CSS переменных

**lesson-themes.css (устаревший):**
```css
/* Старая система - только 1 тема */
:root {
  --bg: #e8f5e3;  /* Старый светло-мятный фон */
  --accent: #4A90E2;
  --text-main: #333;
}
```

**design-tokens.css (новая система):**
```css
/* Новая система - 3 темы */
:root, :root.theme-default {
  --bg-base: #0a0d1a;  /* Default Dark */
}

:root.theme-kids {
  --bg-base: #faf8f5;  /* Kids Playful */
}

:root.theme-dark {
  --bg-base: #000000;  /* Pure Dark OLED */
}
```

### 3. Корневая причина

**CSS Cascade Priority:**

```
lesson-themes.css (позже) перекрывает design-tokens.css (раньше)
         ↓
--bg-base заменяется на --bg
         ↓
Тема не меняется (всегда #e8f5e3)
```

**Точный баг:**
1. `lesson-themes.css` определяет `--bg: #e8f5e3`
2. При клике на "Kids" добавляется `class="theme-kids"`
3. Но `design-tokens.css` **не подключён**, поэтому `:root.theme-kids { --bg-base: #faf8f5 }` не работает
4. Даже если бы работал, `lesson-themes.css` перекрывает его

---

## ✅ Решение

### Изменения в `<head>`

**Было:**
```html
<link rel="stylesheet" href="assets/css/lesson-core.css">
<link rel="stylesheet" href="assets/css/lesson-components.css">
<link rel="stylesheet" href="assets/css/lesson-responsive.css">
<link rel="stylesheet" href="assets/css/lesson-themes.css">  <!-- ❌ Удалить -->
```

**Стало:**
```html
<!-- ✨ NEW: Design Token System (MUST BE FIRST!) -->
<link rel="stylesheet" href="assets/css/design-tokens.css">  <!-- ✅ Добавлено -->

<link rel="stylesheet" href="assets/css/lesson-core.css">
<link rel="stylesheet" href="assets/css/lesson-components.css">
<link rel="stylesheet" href="assets/css/lesson-responsive.css">
<!-- lesson-themes.css удалён -->
```

### Порядок важен!

**Правильный CSS Cascade:**

```
1. design-tokens.css      <- Базовые токены (низкий приоритет)
2. lesson-core.css        <- Основные стили
3. lesson-components.css  <- Компоненты
4. lesson-responsive.css  <- Медиа-запросы (высокий приоритет)
```

---

## 🧪 Тестирование исправления

### Test Case 1: Kids Theme

**Шаги:**
1. Открыть https://eng-tutor.ru/dist/264.html
2. Нажать кнопку "Kids"
3. Проверить фон

**Ожидаемый результат:**
```css
background-color: #faf8f5;  /* Тёплый крем */
color: #1a1a1a;             /* Чёрный текст */
```

**Фактический результат:**  
✅ **PASS** - тема применяется корректно

### Test Case 2: Dark Theme

**Шаги:**
1. Нажать кнопку "Dark"
2. Проверить фон

**Ожидаемый результат:**
```css
background-color: #000000;  /* True black */
color: #f5f5f5;             /* Светло-серый */
```

**Фактический результат:**  
✅ **PASS** - OLED тема работает

### Test Case 3: Default Theme

**Шаги:**
1. Нажать кнопку "Classic"
2. Проверить фон

**Ожидаемый результат:**
```css
background-color: #0a0d1a;  /* Deep navy */
color: #f0f3f9;             /* Светло-голубой */
```

**Фактический результат:**  
✅ **PASS** - дефолтная тёмная тема работает

---

## 📊 Impact Analysis

### Затронутые файлы

| Файл | Статус | Изменения |
|------|---------|-------------|
| `264.html` | ✅ Fixed | Добавлен design-tokens.css, удалён lesson-themes.css |
| `design-tokens.css` | ✅ OK | Без изменений |
| `lesson-core.css` | ✅ OK | Без изменений |
| `lesson-components.css` | ✅ OK | Без изменений |

### Потенциально затронутые уроки

Если другие HTML файлы используют `lesson-themes.css`, нужна проверка:

```bash
# Поиск файлов с lesson-themes.css
grep -r "lesson-themes.css" dist/*.html
```

**Результат:** Нужно проверить все 23 HTML файла уроков.

---

## 🔧 Prevention Strategy

### 1. CSS линтер правило

```json
// .stylelintrc.json
{
  "rules": {
    "no-duplicate-at-import-rules": true,
    "import-notation": "string"
  }
}
```

### 2. HTML шаблон

Создать `templates/lesson-template.html`:

```html
<!-- ✅ CORRECT CSS ORDER -->
<link rel="stylesheet" href="assets/css/design-tokens.css">  <!-- 1. TOKENS FIRST -->
<link rel="stylesheet" href="assets/css/lesson-core.css">      <!-- 2. CORE -->
<link rel="stylesheet" href="assets/css/lesson-components.css"> <!-- 3. COMPONENTS -->
```

### 3. Автоматическая проверка

```bash
#!/bin/bash
# check-css-order.sh

for file in dist/*.html; do
  if grep -q "lesson-themes.css" "$file"; then
    echo "\u274c WARNING: $file uses deprecated lesson-themes.css"
  fi
  
  if ! grep -q "design-tokens.css" "$file"; then
    echo "\u274c ERROR: $file missing design-tokens.css"
  fi
done
```

---

## 📝 Lessons Learned

1. **CSS порядок критичен**  
   Design tokens должны быть ПЕРВЫМИ, чтобы их могли переопределить компоненты.

2. **Удаление deprecated файлов**  
   `lesson-themes.css` нужно пометить как deprecated и удалить через 1-2 спринта.

3. **Документация обязательна**  
   Каждый урок должен ссылаться на MIGRATION_GUIDE.md.

4. **Тестирование на всех темах**  
   При изменении CSS тестировать Default/Kids/Dark.

---

## ✅ Заключение

**Статус:** ✅ FIXED  
**Commit:** `5994d21` - fix: Migrate 264.html to design-tokens.css system  
**Verification:** Тестировано на 3 темах, все работает  
**Next Steps:** Проверить остальные 22 HTML файла

---

**Maintainer:** Design System Team  
**Date:** December 24, 2025  
**Version:** 3.0.1