/**
 * 🎯 Irregular Verbs Database
 * 100+ неправильных глаголов, сгруппированных по паттернам
 * 
 * Структура:
 * - PATTERNS: описание паттернов (10 секций)
 * - VERBS: массив всех глаголов с метаданными
 * - getVerbsByPattern(): получить глаголы по паттерну
 * - getVerbById(): получить глагол по ID
 */

// ============================================
// ПАТТЕРНЫ (СЕКЦИИ)
// ============================================

export const PATTERNS = {
  AAA: {
    id: 1,
    code: 'AAA',
    name: 'Одинаковые формы',
    nameEn: 'Same forms (AAA)',
    description: 'V1 = V2 = V3',
    rule: 'Эти глаголы не меняются! Все три формы одинаковые.',
    emoji: '🔄',
    example: 'cut → cut → cut',
    color: '#10b981', // green
    difficulty: 1
  },
  ABB: {
    id: 2,
    code: 'ABB',
    name: 'V2 = V3',
    nameEn: 'Past = Participle (ABB)',
    description: 'V2 и V3 одинаковые, но отличаются от V1',
    rule: 'Вторая и третья формы совпадают. Запомни одну — знаешь две!',
    emoji: '📖',
    example: 'have → had → had',
    color: '#3b82f6', // blue
    difficulty: 2
  },
  OUGHT_AUGHT: {
    id: 3,
    code: 'OUGHT_AUGHT',
    name: 'Паттерн -ought/-aught',
    nameEn: '-ought/-aught pattern',
    description: 'V2 = V3 = основа + ought/aught',
    rule: 'Эти глаголы образуют V2 и V3 добавлением -ought или -aught',
    emoji: '🎁',
    example: 'buy → bought → bought',
    color: '#8b5cf6', // purple
    difficulty: 2
  },
  EW_OWN: {
    id: 4,
    code: 'EW_OWN',
    name: 'Паттерн -ew/-own',
    nameEn: '-ew/-own pattern',
    description: 'V2 заканчивается на -ew, V3 на -own',
    rule: 'V2: гласная → ew, V3: гласная → own',
    emoji: '🌊',
    example: 'know → knew → known',
    color: '#06b6d4', // cyan
    difficulty: 2
  },
  I_A_U: {
    id: 5,
    code: 'I_A_U',
    name: 'Чередование i-a-u',
    nameEn: 'Vowel change i-a-u',
    description: 'Гласная меняется: i → a → u',
    rule: 'Запомни ритм: I-A-U (как "раз-два-три")',
    emoji: '🎵',
    example: 'sing → sang → sung',
    color: '#f59e0b', // amber
    difficulty: 2
  },
  OKE_OKEN: {
    id: 6,
    code: 'OKE_OKEN',
    name: 'Паттерн -oke/-oken',
    nameEn: '-oke/-oken pattern',
    description: 'V2: -oke, V3: -oken',
    rule: 'Основа + oke в V2, основа + oken в V3',
    emoji: '💔',
    example: 'break → broke → broken',
    color: '#ef4444', // red
    difficulty: 2
  },
  IVE_OVE_IVEN: {
    id: 7,
    code: 'IVE_OVE_IVEN',
    name: 'Паттерн -ive/-ove/-iven',
    nameEn: '-ive/-ove/-iven pattern',
    description: 'V2: -ove/-ook, V3: -iven/-aken',
    rule: 'Группа глаголов с похожими окончаниями',
    emoji: '🚗',
    example: 'drive → drove → driven',
    color: '#ec4899', // pink
    difficulty: 3
  },
  EAR_ORE_ORN: {
    id: 8,
    code: 'EAR_ORE_ORN',
    name: 'Паттерн -ear/-ore/-orn',
    nameEn: '-ear/-ore/-orn pattern',
    description: 'V1: -ear, V2: -ore, V3: -orn',
    rule: 'ear → ore → orn',
    emoji: '👕',
    example: 'wear → wore → worn',
    color: '#14b8a6', // teal
    difficulty: 2
  },
  EAT_ATE_EATEN: {
    id: 9,
    code: 'EAT_ATE_EATEN',
    name: 'Паттерн -eat/-ate/-eaten',
    nameEn: '-eat/-ate/-eaten pattern',
    description: 'eat-ate-eaten и beat-beat-beaten',
    rule: 'Маленькая группа: eat и beat',
    emoji: '🍽️',
    example: 'eat → ate → eaten',
    color: '#f97316', // orange
    difficulty: 2
  },
  ABC: {
    id: 10,
    code: 'ABC',
    name: 'Уникальные формы',
    nameEn: 'Unique forms (ABC)',
    description: 'Все три формы разные и уникальные',
    rule: 'Эти глаголы нужно запомнить! Каждый уникален.',
    emoji: '🌟',
    example: 'go → went → gone',
    color: '#6366f1', // indigo
    difficulty: 3
  }
};

// ============================================
// ГЛАГОЛЫ (100+)
// ============================================

export const VERBS = [
  // ==========================================
  // PATTERN 1: AAA (9 глаголов)
  // ==========================================
  {
    id: 1,
    v1: 'cut',
    v2: 'cut',
    v3: 'cut',
    translation: 'резать',
    transcription: '/kʌt/',
    pattern: 'AAA',
    difficulty: 1
  },
  {
    id: 2,
    v1: 'put',
    v2: 'put',
    v3: 'put',
    translation: 'класть',
    transcription: '/pʊt/',
    pattern: 'AAA',
    difficulty: 1
  },
  {
    id: 3,
    v1: 'cost',
    v2: 'cost',
    v3: 'cost',
    translation: 'стоить',
    transcription: '/kɒst/',
    pattern: 'AAA',
    difficulty: 1
  },
  {
    id: 4,
    v1: 'hit',
    v2: 'hit',
    v3: 'hit',
    translation: 'ударять',
    transcription: '/hɪt/',
    pattern: 'AAA',
    difficulty: 1
  },
  {
    id: 5,
    v1: 'hurt',
    v2: 'hurt',
    v3: 'hurt',
    translation: 'причинять боль',
    transcription: '/hɜːt/',
    pattern: 'AAA',
    difficulty: 1
  },
  {
    id: 6,
    v1: 'let',
    v2: 'let',
    v3: 'let',
    translation: 'позволять',
    transcription: '/let/',
    pattern: 'AAA',
    difficulty: 1
  },
  {
    id: 7,
    v1: 'set',
    v2: 'set',
    v3: 'set',
    translation: 'устанавливать',
    transcription: '/set/',
    pattern: 'AAA',
    difficulty: 1
  },
  {
    id: 8,
    v1: 'shut',
    v2: 'shut',
    v3: 'shut',
    translation: 'закрывать',
    transcription: '/ʃʌt/',
    pattern: 'AAA',
    difficulty: 1
  },
  {
    id: 9,
    v1: 'burst',
    v2: 'burst',
    v3: 'burst',
    translation: 'взрывать(ся)',
    transcription: '/bɜːst/',
    pattern: 'AAA',
    difficulty: 1
  },

  // ==========================================
  // PATTERN 2: ABB (36 глаголов)
  // ==========================================
  {
    id: 10,
    v1: 'have',
    v2: 'had',
    v3: 'had',
    translation: 'иметь',
    transcription: '/hæv/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 11,
    v1: 'make',
    v2: 'made',
    v3: 'made',
    translation: 'делать',
    transcription: '/meɪk/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 12,
    v1: 'pay',
    v2: 'paid',
    v3: 'paid',
    translation: 'платить',
    transcription: '/peɪ/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 13,
    v1: 'say',
    v2: 'said',
    v3: 'said',
    translation: 'говорить',
    transcription: '/seɪ/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 14,
    v1: 'lay',
    v2: 'laid',
    v3: 'laid',
    translation: 'класть',
    transcription: '/leɪ/',
    pattern: 'ABB',
    difficulty: 2
  },
  {
    id: 15,
    v1: 'hear',
    v2: 'heard',
    v3: 'heard',
    translation: 'слышать',
    transcription: '/hɪə/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 16,
    v1: 'mean',
    v2: 'meant',
    v3: 'meant',
    translation: 'значить',
    transcription: '/miːn/',
    pattern: 'ABB',
    difficulty: 2
  },
  {
    id: 17,
    v1: 'meet',
    v2: 'met',
    v3: 'met',
    translation: 'встречать',
    transcription: '/miːt/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 18,
    v1: 'keep',
    v2: 'kept',
    v3: 'kept',
    translation: 'хранить',
    transcription: '/kiːp/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 19,
    v1: 'sleep',
    v2: 'slept',
    v3: 'slept',
    translation: 'спать',
    transcription: '/sliːp/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 20,
    v1: 'feel',
    v2: 'felt',
    v3: 'felt',
    translation: 'чувствовать',
    transcription: '/fiːl/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 21,
    v1: 'deal',
    v2: 'dealt',
    v3: 'dealt',
    translation: 'иметь дело',
    transcription: '/diːl/',
    pattern: 'ABB',
    difficulty: 2
  },
  {
    id: 22,
    v1: 'leave',
    v2: 'left',
    v3: 'left',
    translation: 'уходить, оставлять',
    transcription: '/liːv/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 23,
    v1: 'lend',
    v2: 'lent',
    v3: 'lent',
    translation: 'давать взаймы',
    transcription: '/lend/',
    pattern: 'ABB',
    difficulty: 2
  },
  {
    id: 24,
    v1: 'send',
    v2: 'sent',
    v3: 'sent',
    translation: 'отправлять',
    transcription: '/send/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 25,
    v1: 'spend',
    v2: 'spent',
    v3: 'spent',
    translation: 'тратить',
    transcription: '/spend/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 26,
    v1: 'build',
    v2: 'built',
    v3: 'built',
    translation: 'строить',
    transcription: '/bɪld/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 27,
    v1: 'sit',
    v2: 'sat',
    v3: 'sat',
    translation: 'сидеть',
    transcription: '/sɪt/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 28,
    v1: 'hold',
    v2: 'held',
    v3: 'held',
    translation: 'держать',
    transcription: '/həʊld/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 29,
    v1: 'lead',
    v2: 'led',
    v3: 'led',
    translation: 'вести',
    transcription: '/liːd/',
    pattern: 'ABB',
    difficulty: 2
  },
  {
    id: 30,
    v1: 'feed',
    v2: 'fed',
    v3: 'fed',
    translation: 'кормить',
    transcription: '/fiːd/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 31,
    v1: 'lose',
    v2: 'lost',
    v3: 'lost',
    translation: 'терять',
    transcription: '/luːz/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 32,
    v1: 'sell',
    v2: 'sold',
    v3: 'sold',
    translation: 'продавать',
    transcription: '/sel/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 33,
    v1: 'tell',
    v2: 'told',
    v3: 'told',
    translation: 'рассказывать',
    transcription: '/tel/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 34,
    v1: 'find',
    v2: 'found',
    v3: 'found',
    translation: 'находить',
    transcription: '/faɪnd/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 35,
    v1: 'stick',
    v2: 'stuck',
    v3: 'stuck',
    translation: 'приклеивать',
    transcription: '/stɪk/',
    pattern: 'ABB',
    difficulty: 2
  },
  {
    id: 36,
    v1: 'dig',
    v2: 'dug',
    v3: 'dug',
    translation: 'копать',
    transcription: '/dɪɡ/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 37,
    v1: 'hang',
    v2: 'hung',
    v3: 'hung',
    translation: 'вешать',
    transcription: '/hæŋ/',
    pattern: 'ABB',
    difficulty: 2
  },
  {
    id: 38,
    v1: 'sting',
    v2: 'stung',
    v3: 'stung',
    translation: 'жалить',
    transcription: '/stɪŋ/',
    pattern: 'ABB',
    difficulty: 2
  },
  {
    id: 39,
    v1: 'win',
    v2: 'won',
    v3: 'won',
    translation: 'побеждать',
    transcription: '/wɪn/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 40,
    v1: 'shine',
    v2: 'shone',
    v3: 'shone',
    translation: 'светить',
    transcription: '/ʃaɪn/',
    pattern: 'ABB',
    difficulty: 2
  },
  {
    id: 41,
    v1: 'shoot',
    v2: 'shot',
    v3: 'shot',
    translation: 'стрелять',
    transcription: '/ʃuːt/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 42,
    v1: 'stand',
    v2: 'stood',
    v3: 'stood',
    translation: 'стоять',
    transcription: '/stænd/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 43,
    v1: 'understand',
    v2: 'understood',
    v3: 'understood',
    translation: 'понимать',
    transcription: '/ˌʌndəˈstænd/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 44,
    v1: 'get',
    v2: 'got',
    v3: 'got',
    translation: 'получать',
    transcription: '/ɡet/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 45,
    v1: 'light',
    v2: 'lit',
    v3: 'lit',
    translation: 'зажигать',
    transcription: '/laɪt/',
    pattern: 'ABB',
    difficulty: 2
  },

  // ==========================================
  // PATTERN 3: -ought/-aught (6 глаголов)
  // ==========================================
  {
    id: 46,
    v1: 'buy',
    v2: 'bought',
    v3: 'bought',
    translation: 'покупать',
    transcription: '/baɪ/',
    pattern: 'OUGHT_AUGHT',
    difficulty: 1
  },
  {
    id: 47,
    v1: 'bring',
    v2: 'brought',
    v3: 'brought',
    translation: 'приносить',
    transcription: '/brɪŋ/',
    pattern: 'OUGHT_AUGHT',
    difficulty: 1
  },
  {
    id: 48,
    v1: 'think',
    v2: 'thought',
    v3: 'thought',
    translation: 'думать',
    transcription: '/θɪŋk/',
    pattern: 'OUGHT_AUGHT',
    difficulty: 1
  },
  {
    id: 49,
    v1: 'teach',
    v2: 'taught',
    v3: 'taught',
    translation: 'учить (кого-то)',
    transcription: '/tiːtʃ/',
    pattern: 'OUGHT_AUGHT',
    difficulty: 1
  },
  {
    id: 50,
    v1: 'catch',
    v2: 'caught',
    v3: 'caught',
    translation: 'ловить',
    transcription: '/kætʃ/',
    pattern: 'OUGHT_AUGHT',
    difficulty: 1
  },
  {
    id: 51,
    v1: 'fight',
    v2: 'fought',
    v3: 'fought',
    translation: 'бороться',
    transcription: '/faɪt/',
    pattern: 'OUGHT_AUGHT',
    difficulty: 1
  },

  // ==========================================
  // PATTERN 4: -ew/-own (6 глаголов)
  // ==========================================
  {
    id: 52,
    v1: 'blow',
    v2: 'blew',
    v3: 'blown',
    translation: 'дуть',
    transcription: '/bləʊ/',
    pattern: 'EW_OWN',
    difficulty: 2
  },
  {
    id: 53,
    v1: 'fly',
    v2: 'flew',
    v3: 'flown',
    translation: 'летать',
    transcription: '/flaɪ/',
    pattern: 'EW_OWN',
    difficulty: 1
  },
  {
    id: 54,
    v1: 'grow',
    v2: 'grew',
    v3: 'grown',
    translation: 'расти',
    transcription: '/ɡrəʊ/',
    pattern: 'EW_OWN',
    difficulty: 1
  },
  {
    id: 55,
    v1: 'know',
    v2: 'knew',
    v3: 'known',
    translation: 'знать',
    transcription: '/nəʊ/',
    pattern: 'EW_OWN',
    difficulty: 1
  },
  {
    id: 56,
    v1: 'throw',
    v2: 'threw',
    v3: 'thrown',
    translation: 'бросать',
    transcription: '/θrəʊ/',
    pattern: 'EW_OWN',
    difficulty: 1
  },
  {
    id: 57,
    v1: 'draw',
    v2: 'drew',
    v3: 'drawn',
    translation: 'рисовать',
    transcription: '/drɔː/',
    pattern: 'EW_OWN',
    difficulty: 1
  },

  // ==========================================
  // PATTERN 5: i-a-u (5 глаголов)
  // ==========================================
  {
    id: 58,
    v1: 'sing',
    v2: 'sang',
    v3: 'sung',
    translation: 'петь',
    transcription: '/sɪŋ/',
    pattern: 'I_A_U',
    difficulty: 1
  },
  {
    id: 59,
    v1: 'ring',
    v2: 'rang',
    v3: 'rung',
    translation: 'звонить',
    transcription: '/rɪŋ/',
    pattern: 'I_A_U',
    difficulty: 1
  },
  {
    id: 60,
    v1: 'drink',
    v2: 'drank',
    v3: 'drunk',
    translation: 'пить',
    transcription: '/drɪŋk/',
    pattern: 'I_A_U',
    difficulty: 1
  },
  {
    id: 61,
    v1: 'swim',
    v2: 'swam',
    v3: 'swum',
    translation: 'плавать',
    transcription: '/swɪm/',
    pattern: 'I_A_U',
    difficulty: 1
  },
  {
    id: 62,
    v1: 'begin',
    v2: 'began',
    v3: 'begun',
    translation: 'начинать',
    transcription: '/bɪˈɡɪn/',
    pattern: 'I_A_U',
    difficulty: 1
  },

  // ==========================================
  // PATTERN 6: -oke/-oken (6 глаголов)
  // ==========================================
  {
    id: 63,
    v1: 'break',
    v2: 'broke',
    v3: 'broken',
    translation: 'ломать',
    transcription: '/breɪk/',
    pattern: 'OKE_OKEN',
    difficulty: 1
  },
  {
    id: 64,
    v1: 'speak',
    v2: 'spoke',
    v3: 'spoken',
    translation: 'говорить',
    transcription: '/spiːk/',
    pattern: 'OKE_OKEN',
    difficulty: 1
  },
  {
    id: 65,
    v1: 'wake',
    v2: 'woke',
    v3: 'woken',
    translation: 'просыпаться',
    transcription: '/weɪk/',
    pattern: 'OKE_OKEN',
    difficulty: 1
  },
  {
    id: 66,
    v1: 'steal',
    v2: 'stole',
    v3: 'stolen',
    translation: 'красть',
    transcription: '/stiːl/',
    pattern: 'OKE_OKEN',
    difficulty: 2
  },
  {
    id: 67,
    v1: 'choose',
    v2: 'chose',
    v3: 'chosen',
    translation: 'выбирать',
    transcription: '/tʃuːz/',
    pattern: 'OKE_OKEN',
    difficulty: 1
  },
  {
    id: 68,
    v1: 'freeze',
    v2: 'froze',
    v3: 'frozen',
    translation: 'замерзать',
    transcription: '/friːz/',
    pattern: 'OKE_OKEN',
    difficulty: 1
  },

  // ==========================================
  // PATTERN 7: -ive/-ove/-iven (8 глаголов)
  // ==========================================
  {
    id: 69,
    v1: 'drive',
    v2: 'drove',
    v3: 'driven',
    translation: 'водить',
    transcription: '/draɪv/',
    pattern: 'IVE_OVE_IVEN',
    difficulty: 1
  },
  {
    id: 70,
    v1: 'ride',
    v2: 'rode',
    v3: 'ridden',
    translation: 'ездить верхом',
    transcription: '/raɪd/',
    pattern: 'IVE_OVE_IVEN',
    difficulty: 2
  },
  {
    id: 71,
    v1: 'write',
    v2: 'wrote',
    v3: 'written',
    translation: 'писать',
    transcription: '/raɪt/',
    pattern: 'IVE_OVE_IVEN',
    difficulty: 1
  },
  {
    id: 72,
    v1: 'rise',
    v2: 'rose',
    v3: 'risen',
    translation: 'вставать, подниматься',
    transcription: '/raɪz/',
    pattern: 'IVE_OVE_IVEN',
    difficulty: 2
  },
  {
    id: 73,
    v1: 'give',
    v2: 'gave',
    v3: 'given',
    translation: 'давать',
    transcription: '/ɡɪv/',
    pattern: 'IVE_OVE_IVEN',
    difficulty: 1
  },
  {
    id: 74,
    v1: 'forgive',
    v2: 'forgave',
    v3: 'forgiven',
    translation: 'прощать',
    transcription: '/fəˈɡɪv/',
    pattern: 'IVE_OVE_IVEN',
    difficulty: 2
  },
  {
    id: 75,
    v1: 'take',
    v2: 'took',
    v3: 'taken',
    translation: 'брать',
    transcription: '/teɪk/',
    pattern: 'IVE_OVE_IVEN',
    difficulty: 1
  },
  {
    id: 76,
    v1: 'shake',
    v2: 'shook',
    v3: 'shaken',
    translation: 'трясти',
    transcription: '/ʃeɪk/',
    pattern: 'IVE_OVE_IVEN',
    difficulty: 2
  },

  // ==========================================
  // PATTERN 8: -ear/-ore/-orn (4 глагола)
  // ==========================================
  {
    id: 77,
    v1: 'wear',
    v2: 'wore',
    v3: 'worn',
    translation: 'носить (одежду)',
    transcription: '/weə/',
    pattern: 'EAR_ORE_ORN',
    difficulty: 1
  },
  {
    id: 78,
    v1: 'tear',
    v2: 'tore',
    v3: 'torn',
    translation: 'рвать',
    transcription: '/teə/',
    pattern: 'EAR_ORE_ORN',
    difficulty: 2
  },
  {
    id: 79,
    v1: 'swear',
    v2: 'swore',
    v3: 'sworn',
    translation: 'клясться',
    transcription: '/sweə/',
    pattern: 'EAR_ORE_ORN',
    difficulty: 2
  },
  {
    id: 80,
    v1: 'bear',
    v2: 'bore',
    v3: 'born',
    translation: 'рождать, нести',
    transcription: '/beə/',
    pattern: 'EAR_ORE_ORN',
    difficulty: 2
  },

  // ==========================================
  // PATTERN 9: -eat/-ate/-eaten (2 глагола)
  // ==========================================
  {
    id: 81,
    v1: 'eat',
    v2: 'ate',
    v3: 'eaten',
    translation: 'есть',
    transcription: '/iːt/',
    pattern: 'EAT_ATE_EATEN',
    difficulty: 1
  },
  {
    id: 82,
    v1: 'beat',
    v2: 'beat',
    v3: 'beaten',
    translation: 'бить',
    transcription: '/biːt/',
    pattern: 'EAT_ATE_EATEN',
    difficulty: 2
  },

  // ==========================================
  // PATTERN 10: ABC - Уникальные (18 глаголов)
  // ==========================================
  {
    id: 83,
    v1: 'be',
    v2: 'was/were',
    v3: 'been',
    translation: 'быть',
    transcription: '/biː/',
    pattern: 'ABC',
    difficulty: 1
  },
  {
    id: 84,
    v1: 'go',
    v2: 'went',
    v3: 'gone',
    translation: 'идти',
    transcription: '/ɡəʊ/',
    pattern: 'ABC',
    difficulty: 1
  },
  {
    id: 85,
    v1: 'do',
    v2: 'did',
    v3: 'done',
    translation: 'делать',
    transcription: '/duː/',
    pattern: 'ABC',
    difficulty: 1
  },
  {
    id: 86,
    v1: 'see',
    v2: 'saw',
    v3: 'seen',
    translation: 'видеть',
    transcription: '/siː/',
    pattern: 'ABC',
    difficulty: 1
  },
  {
    id: 87,
    v1: 'come',
    v2: 'came',
    v3: 'come',
    translation: 'приходить',
    transcription: '/kʌm/',
    pattern: 'ABC',
    difficulty: 1
  },
  {
    id: 88,
    v1: 'become',
    v2: 'became',
    v3: 'become',
    translation: 'становиться',
    transcription: '/bɪˈkʌm/',
    pattern: 'ABC',
    difficulty: 1
  },
  {
    id: 89,
    v1: 'run',
    v2: 'ran',
    v3: 'run',
    translation: 'бежать',
    transcription: '/rʌn/',
    pattern: 'ABC',
    difficulty: 1
  },
  {
    id: 90,
    v1: 'fall',
    v2: 'fell',
    v3: 'fallen',
    translation: 'падать',
    transcription: '/fɔːl/',
    pattern: 'ABC',
    difficulty: 1
  },
  {
    id: 91,
    v1: 'hide',
    v2: 'hid',
    v3: 'hidden',
    translation: 'прятать',
    transcription: '/haɪd/',
    pattern: 'ABC',
    difficulty: 2
  },
  {
    id: 92,
    v1: 'bite',
    v2: 'bit',
    v3: 'bitten',
    translation: 'кусать',
    transcription: '/baɪt/',
    pattern: 'ABC',
    difficulty: 2
  },
  {
    id: 93,
    v1: 'forbid',
    v2: 'forbade',
    v3: 'forbidden',
    translation: 'запрещать',
    transcription: '/fəˈbɪd/',
    pattern: 'ABC',
    difficulty: 3
  },
  {
    id: 94,
    v1: 'forget',
    v2: 'forgot',
    v3: 'forgotten',
    translation: 'забывать',
    transcription: '/fəˈɡet/',
    pattern: 'ABC',
    difficulty: 1
  },
  {
    id: 95,
    v1: 'lie',
    v2: 'lay',
    v3: 'lain',
    translation: 'лежать',
    transcription: '/laɪ/',
    pattern: 'ABC',
    difficulty: 3
  },
  {
    id: 96,
    v1: 'show',
    v2: 'showed',
    v3: 'shown',
    translation: 'показывать',
    transcription: '/ʃəʊ/',
    pattern: 'ABC',
    difficulty: 2
  },
  {
    id: 97,
    v1: 'sew',
    v2: 'sewed',
    v3: 'sewn',
    translation: 'шить',
    transcription: '/səʊ/',
    pattern: 'ABC',
    difficulty: 2
  },
  {
    id: 98,
    v1: 'sweep',
    v2: 'swept',
    v3: 'swept',
    translation: 'подметать',
    transcription: '/swiːp/',
    pattern: 'ABC',
    difficulty: 2
  },
  {
    id: 99,
    v1: 'read',
    v2: 'read',
    v3: 'read',
    translation: 'читать',
    transcription: '/riːd/ → /red/',
    pattern: 'ABC',
    difficulty: 2
  },
  {
    id: 100,
    v1: 'burn',
    v2: 'burnt',
    v3: 'burnt',
    translation: 'гореть',
    transcription: '/bɜːn/',
    pattern: 'ABB',
    difficulty: 2
  },
  {
    id: 101,
    v1: 'learn',
    v2: 'learnt',
    v3: 'learnt',
    translation: 'учить (что-то)',
    transcription: '/lɜːn/',
    pattern: 'ABB',
    difficulty: 1
  },
  {
    id: 102,
    v1: 'dream',
    v2: 'dreamt',
    v3: 'dreamt',
    translation: 'мечтать',
    transcription: '/driːm/',
    pattern: 'ABB',
    difficulty: 2
  },
  {
    id: 103,
    v1: 'smell',
    v2: 'smelt',
    v3: 'smelt',
    translation: 'нюхать',
    transcription: '/smel/',
    pattern: 'ABB',
    difficulty: 2
  },
  {
    id: 104,
    v1: 'spell',
    v2: 'spelt',
    v3: 'spelt',
    translation: 'писать по буквам',
    transcription: '/spel/',
    pattern: 'ABB',
    difficulty: 2
  }
];

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Получить глаголы по паттерну
 * @param {string} patternCode - код паттерна (AAA, ABB, etc.)
 * @returns {Array} массив глаголов
 */
export function getVerbsByPattern(patternCode) {
  return VERBS.filter(verb => verb.pattern === patternCode);
}

/**
 * Получить глагол по ID
 * @param {number} id - ID глагола
 * @returns {Object|undefined} глагол или undefined
 */
export function getVerbById(id) {
  return VERBS.find(verb => verb.id === id);
}

/**
 * Получить все паттерны с глаголами
 * @returns {Array} массив паттернов с вложенными глаголами
 */
export function getPatternsWithVerbs() {
  return Object.values(PATTERNS).map(pattern => ({
    ...pattern,
    verbs: getVerbsByPattern(pattern.code),
    verbCount: getVerbsByPattern(pattern.code).length
  }));
}

/**
 * Получить случайный глагол из паттерна
 * @param {string} patternCode - код паттерна
 * @returns {Object} случайный глагол
 */
export function getRandomVerbFromPattern(patternCode) {
  const verbs = getVerbsByPattern(patternCode);
  return verbs[Math.floor(Math.random() * verbs.length)];
}

/**
 * Получить дистракторы для режима выбора
 * @param {Object} verb - текущий глагол
 * @param {string} form - форма (v1, v2, v3)
 * @param {number} count - количество дистракторов
 * @returns {Array} массив неправильных вариантов
 */
export function getDistractors(verb, form, count = 3) {
  const distractors = new Set();
  const correctAnswer = verb[form].toLowerCase();
  
  // 1. Добавить другие формы этого же глагола
  ['v1', 'v2', 'v3'].forEach(f => {
    if (f !== form) {
      const val = verb[f].toLowerCase();
      if (val !== correctAnswer) {
        distractors.add(val);
      }
    }
  });
  
  // 2. Добавить ложный регулярный вариант
  const fakeRegular = verb.v1 + 'ed';
  if (fakeRegular !== correctAnswer) {
    distractors.add(fakeRegular);
  }
  
  // 3. Добавить формы из того же паттерна
  const patternVerbs = getVerbsByPattern(verb.pattern)
    .filter(v => v.id !== verb.id);
  
  for (const pVerb of patternVerbs) {
    if (distractors.size >= count) break;
    const val = pVerb[form].toLowerCase();
    if (val !== correctAnswer) {
      distractors.add(val);
    }
  }
  
  // 4. Если не хватает, добавить из других паттернов
  if (distractors.size < count) {
    const otherVerbs = VERBS.filter(v => v.pattern !== verb.pattern);
    for (const oVerb of otherVerbs) {
      if (distractors.size >= count) break;
      const val = oVerb[form].toLowerCase();
      if (val !== correctAnswer) {
        distractors.add(val);
      }
    }
  }
  
  return Array.from(distractors).slice(0, count);
}

/**
 * Перемешать массив (Fisher-Yates)
 * @param {Array} array - массив для перемешивания
 * @returns {Array} перемешанный массив
 */
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Статистика по базе
 */
export const STATS = {
  totalVerbs: VERBS.length,
  patterns: Object.keys(PATTERNS).length,
  verbsByDifficulty: {
    easy: VERBS.filter(v => v.difficulty === 1).length,
    medium: VERBS.filter(v => v.difficulty === 2).length,
    hard: VERBS.filter(v => v.difficulty === 3).length
  }
};

// Log stats in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('📚 Irregular Verbs DB loaded:', STATS);
}
