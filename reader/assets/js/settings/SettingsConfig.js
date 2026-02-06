/**
 * @fileoverview Settings Configuration - Single Source of Truth
 * @module SettingsConfig
 */

export const SettingsConfig = {
  groups: [
    {
      id: 'general',
      title: 'General',
      settings: ['language']
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      settings: ['autoPlayAudio', 'cardOrder']
    },
    {
      id: 'appearance',
      title: 'Appearance',
      settings: ['theme', 'eyeComfort', 'blueLightFilter']
    },
    {
      id: 'reading',
      title: 'Reading Comfort',
      settings: ['readingWidth', 'fontFamily', 'fontSmoothing']
    }
  ],

  settings: {
    language: {
      label: 'Language',
      description: 'Interface language',
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
      label: 'Auto-play Audio',
      description: 'Automatically play pronunciation audio',
      type: 'toggle',
      defaultValue: false
    },
    cardOrder: {
      label: 'Flashcard Order',
      description: 'How flashcards are presented',
      type: 'select',
      defaultValue: 'random',
      options: {
        'random': 'Random',
        'due-date': 'By Due Date',
        'alphabetical': 'Alphabetical'
      }
    },
    theme: {
      label: 'Theme',
      description: 'Application appearance',
      type: 'select',
      defaultValue: 'auto',
      options: {
        light: 'Light',
        dark: 'Dark',
        auto: 'Auto (System)'
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
