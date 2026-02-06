module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Code quality
    'no-unused-vars': 'warn',
    'no-console': 'off', // Allow console for debugging
    'no-debugger': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',

    // Style
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    'comma-dangle': ['error', 'never'],
    'no-trailing-spaces': 'error',
    'eol-last': 'error',

    // Best practices
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'strict': ['error', 'global'],

    // ES6+
    'prefer-template': 'error',
    'template-curly-spacing': ['error', 'never'],
    'arrow-spacing': 'error',
    'arrow-parens': ['error', 'as-needed'],

    // Promises
    'no-async-promise-executor': 'error',
    'require-await': 'warn',

    // Accessibility (where applicable)
    'no-alert': 'warn' // Discourage alert() usage
  },
  globals: {
    // Browser APIs
    'window': 'readonly',
    'document': 'readonly',
    'navigator': 'readonly',
    'console': 'readonly',
    'fetch': 'readonly',
    'indexedDB': 'readonly',
    'performance': 'readonly',
    'requestAnimationFrame': 'readonly',

    // Web APIs
    'Blob': 'readonly',
    'File': 'readonly',
    'FileReader': 'readonly',
    'DOMParser': 'readonly',
    'URL': 'readonly',
    'Worker': 'readonly',

    // Libraries (when loaded dynamically)
    'JSZip': 'readonly'
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js',
    'service-worker.js' // Service workers often need different rules
  ]
};
