/**
 * @fileoverview Settings Configuration - Single Source of Truth
 * @module SettingsConfig
 */

export const SettingsConfig = {
  groups: [
    {
      id: 'general',
      title: 'Общие',
      settings: ['language']
    },
    {
      id: 'flashcards',
      title: 'Карточки',
      settings: ['autoPlayAudio', 'cardOrder']
    },
    {
      id: 'appearance',
      title: 'Внешний вид',
      settings: ['theme', 'eyeComfort', 'blueLightFilter']
    },
    {
      id: 'reading',
      title: 'Комфортное чтение',
      settings: ['readingWidth', 'fontFamily', 'fontSmoothing']
    }
  ],

  settings: {
    language: {
      label: 'Язык',
      description: 'Язык интерфейса',
      type: 'select',
      defaultValue: 'en',
      options: {
        en: 'English',
        ru: 'Русский',
        es: 'Español',
        fr: 'Français',
        de: 'Deutsch'
      }
    },
    autoPlayAudio: {
      label: 'Автовоспроизведение аудио',
      description: 'Автоматически проигрывать произношение',
      type: 'toggle',
      defaultValue: false
    },
    cardOrder: {
      label: 'Порядок карточек',
      description: 'Очередность показа карточек',
      type: 'select',
      defaultValue: 'random',
      options: {
        'random': 'Случайно',
        'due-date': 'По дате повторения',
        'alphabetical': 'По алфавиту'
      }
    },
    theme: {
      label: 'Тема',
      description: 'Внешний вид приложения',
      type: 'select',
      defaultValue: 'auto',
      options: {
        light: 'Светлая',
        dark: 'Темная',
        auto: 'Авто (как в системе)'
      }
    },
    eyeComfort: {
      label: 'Eye Comfort Mode',
      description: 'Reduce eye strain during long reading sessions',
      type: 'select',
      defaultValue: 'off',
      options: {
        'off': 'Disabled',
        'warm': 'Warm (Daytime)',
        'evening': 'Evening Mode'
      }
    },
    blueLightFilter: {
      label: 'Blue Light Filter',
      description: 'Integrate with system Night Shift/Night Light',
      type: 'select',
      defaultValue: 'auto',
      options: {
        'auto': 'Auto (System)',
        'manual': 'Manual Control',
        'off': 'Disabled'
      }
    },
    readingWidth: {
      label: 'Reading Width',
      description: 'Optimal line length for reading comfort',
      type: 'select',
      defaultValue: 'optimal',
      options: {
        'narrow': 'Narrow (600px)',
        'optimal': 'Optimal (672px)',
        'wide': 'Wide (800px)'
      }
    },
    fontSmoothing: {
      label: 'Font Smoothing',
      description: 'Anti-aliasing for better readability',
      type: 'select',
      defaultValue: 'auto',
      options: {
        'auto': 'Auto (System)',
        'subpixel': 'Subpixel',
        'grayscale': 'Grayscale'
      }
    },
    fontFamily: {
      label: 'Reading Font',
      description: 'Font family for book content',
      type: 'select',
      defaultValue: 'serif-georgia',
      options: {
        'serif-georgia': 'Georgia (Serif)',
        'serif-times': 'Times New Roman (Serif)',
        'serif-garamond': 'Garamond (Serif)',
        'serif-baskerville': 'Baskerville (Serif)',
        'serif-crimson': 'Crimson Text (Serif)',
        'sans-arial': 'Arial (Sans-serif)',
        'sans-verdana': 'Verdana (Sans-serif)',
        'sans-tahoma': 'Tahoma (Sans-serif)',
        'sans-helvetica': 'Helvetica (Sans-serif)',
        'mono-courier': 'Courier New (Monospace)',
        'mono-consolas': 'Consolas (Monospace)',
        'mono-menlo': 'Menlo (Monospace)'
      }
    }
  },

  getDefaults() {
    const defaults = {};
    Object.entries(this.settings).forEach(([key, config]) => {
      defaults[key] = config.defaultValue;
    });
    return defaults;
  }
};
