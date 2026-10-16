/**
 * IEEE Fast-Desk Attendance System — Application Core
 * Fast, accurate, mistake-free event check-in with bilingual name support.
 */

(function () {
  'use strict';

  // Constants & Storage Keys
  const STORAGE_KEY = 'ieee_attendance_records_2026_10_14_v1';
  const SOUND_KEY = 'ieee_attendance_sound_enabled';
  const VIEW_KEY = 'ieee_attendance_view_mode';

  // Application State
  const state = {
    attendees: [],
    searchQuery: '',
    activeFilter: 'all', // 'all' | 'present' | 'absent' | 'walkin' | 'volunteer'
    activeSort: 'default',
    viewMode: localStorage.getItem(VIEW_KEY) || 'grid', // 'grid' | 'table'
    soundEnabled: localStorage.getItem(SOUND_KEY) !== 'false',
    undoAction: null, // { attendeeId, previousAttended, previousTime, attendeeName }
    undoTimer: null
  };

  // DOM Elements Cache
  const elements = {
    // Analytics KPIs
    kpiTotal: document.getElementById('kpiTotal'),
    kpiAttended: document.getElementById('kpiAttended'),
    kpiRate: document.getElementById('kpiRate'),
    kpiProgressBar: document.getElementById('kpiProgressBar'),
    kpiBarTrack: document.getElementById('kpiBarTrack'),
    kpiRemaining: document.getElementById('kpiRemaining'),
    kpiWalkIns: document.getElementById('kpiWalkIns'),
    kpiVolunteers: document.getElementById('kpiVolunteers'),

    // Tab counts
    countAll: document.getElementById('countAll'),
    countPresent: document.getElementById('countPresent'),
    countAbsent: document.getElementById('countAbsent'),
    countWalkin: document.getElementById('countWalkin'),
    countVolunteer: document.getElementById('countVolunteer'),

    // Search & Filters
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    filterTabs: document.querySelectorAll('.ftab'),
    sortSelect: document.getElementById('sortSelect'),
    visibleCount: document.getElementById('visibleCount'),
    activeFilterBadge: document.getElementById('activeFilterBadge'),

    // Views
    viewGridBtn: document.getElementById('viewGridBtn'),
    viewTableBtn: document.getElementById('viewTableBtn'),
    gridContainer: document.getElementById('attendeesListContainer'),
    tableContainer: document.getElementById('attendeesTableContainer'),
    tableBody: document.getElementById('attendeesTableBody'),
    emptyState: document.getElementById('emptyState'),
    emptyQueryText: document.getElementById('emptyQueryText'),
    emptyClearBtn: document.getElementById('emptyClearBtn'),
    emptyAddWalkInBtn: document.getElementById('emptyAddWalkInBtn'),

    // Modals
    walkInModal: document.getElementById('walkInModal'),
    walkInForm: document.getElementById('walkInForm'),
    walkInFirst: document.getElementById('walkInFirst'),
    walkInMiddle: document.getElementById('walkInMiddle'),
    walkInLast: document.getElementById('walkInLast'),
    walkInNotes: document.getElementById('walkInNotes'),
    walkInAutoCheckIn: document.getElementById('walkInAutoCheckIn'),
    openWalkInBtn: document.getElementById('openWalkInBtn'),
    closeWalkInBtn: document.getElementById('closeWalkInBtn'),
    cancelWalkInBtn: document.getElementById('cancelWalkInBtn'),

    shortcutsModal: document.getElementById('shortcutsModal'),
    helpShortcutsBtn: document.getElementById('helpShortcutsBtn'),
    closeShortcutsBtn: document.getElementById('closeShortcutsBtn'),
    dismissShortcutsBtn: document.getElementById('dismissShortcutsBtn'),

    // Toast
    undoToast: document.getElementById('undoToast'),
    toastText: document.getElementById('toastText'),
    toastIcon: document.getElementById('toastIcon'),
    toastUndoBtn: document.getElementById('toastUndoBtn'),
    toastCloseBtn: document.getElementById('toastCloseBtn'),
    toastCountdownBar: document.getElementById('toastCountdownBar'),

    // Header utilities
    clockTime: document.getElementById('clockTime'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundLabel: document.getElementById('soundLabel'),

    // Export & Dropdown
    exportMenuBtn: document.getElementById('exportMenuBtn'),
    exportDropdown: document.getElementById('exportDropdown'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    printReportBtn: document.getElementById('printReportBtn'),
    importCsvBtn: document.getElementById('importCsvBtn'),
    resetDataBtn: document.getElementById('resetDataBtn'),
    csvFileInput: document.getElementById('csvFileInput')
  };

  /* ==========================================================================
     Text Normalization & Bilingual Search Engine
     ========================================================================== */

  /* ==========================================================================
     Text Normalization & Bilingual Transliteration Search Engine
     ========================================================================== */

  // Common Arabic-English Name Correspondence Dictionary
  const NAME_MAP = {
    'ali': ['علي'],
    'ahmed': ['احمد'],
    'ahmad': ['احمد'],
    'mohammed': ['محمد'],
    'mohamed': ['محمد'],
    'muhammad': ['محمد'],
    'muhamad': ['محمد'],
    'mhamad': ['محمد'],
    'mahmoud': ['محمود'],
    'mahmood': ['محمود'],
    'mustafa': ['مصطفي', 'مصطفى'],
    'moustafa': ['مصطفي', 'مصطفى'],
    'murtadha': ['مرتضي', 'مرتضى'],
    'murtada': ['مرتضي', 'مرتضى'],
    'murtaza': ['مرتضي', 'مرتضى'],
    'mujtaba': ['مجتبي', 'مجتبى'],
    'mojtaba': ['مجتبي', 'مجتبى'],
    'hassan': ['حسن'],
    'hasan': ['حسن'],
    'hussein': ['حسين'],
    'hussain': ['حسين'],
    'husein': ['حسين'],
    'hasnain': ['حسنين'],
    'hasaneen': ['حسنين'],
    'hassanain': ['حسنين'],
    'fatima': ['فاطمه', 'فاطمة'],
    'fatimah': ['فاطمه', 'فاطمة'],
    'fatma': ['فاطمه', 'فاطمة'],
    'zainab': ['زينب'],
    'zeinab': ['زينب'],
    'zaynab': ['زينب'],
    'maryam': ['مريم'],
    'mariam': ['مريم'],
    'zahra': ['زهراء', 'زهره'],
    'zahraa': ['زهراء', 'زهره'],
    'taha': ['طه'],
    'ziad': ['زياد'],
    'zeyad': ['زياد'],
    'bariq': ['بارق'],
    'muhannad': ['مهند'],
    'mohanad': ['مهند'],
    'wafa': ['وفاء'],
    'wafaa': ['وفاء'],
    'jumaa': ['جمعه', 'جمعة'],
    'jomaa': ['جمعه', 'جمعة'],
    'raghad': ['رغد'],
    'diaa': ['ضياء'],
    'diyaa': ['ضياء'],
    'dhia': ['ضياء'],
    'dhiaa': ['ضياء'],
    'rashid': ['رشيد'],
    'rashed': ['راشد', 'رشيد'],
    'yaser': ['ياسر'],
    'yasser': ['ياسر'],
    'ammar': ['عمار'],
    'abdul': ['عبد'],
    'abd': ['عبد'],
    'abdel': ['عبد'],
    'hakam': ['حكم'],
    'al-hakam': ['الحكم'],
    'al hakam': ['الحكم'],
    'motaz': ['معتز'],
    'moataz': ['معتز'],
    'muataz': ['معتز'],
    'basim': ['باسم'],
    'bassem': ['باسم'],
    'khalid': ['خالد'],
    'khaled': ['خالد'],
    'ayham': ['ايهم'],
    'jabar': ['جبار'],
    'jabbar': ['جبار'],
    'dawood': ['داود', 'داوود'],
    'dawoud': ['داود', 'داوود'],
    'aqeel': ['عقيل'],
    'aqil': ['عقيل'],
    'mays': ['ميس'],
    'mais': ['ميس'],
    'fouad': ['فؤاد', 'فواد'],
    'fuad': ['فؤاد', 'فواد'],
    'basit': ['باسط'],
    'sohail': ['سهيل'],
    'suhail': ['سهيل'],
    'satie': ['ساطع'],
    'batool': ['بتول'],
    'batul': ['بتول'],
    'defaa': ['دفاع'],
    'najah': ['نجاح'],
    'karrar': ['كرار'],
    'abbas': ['عباس'],
    'haidar': ['حيدر'],
    'haider': ['حيدر'],
    'haydar': ['حيدر'],
    'jaafar': ['جعفر'],
    'jafar': ['جعفر'],
    'mahdi': ['مهدي'],
    'mehdi': ['مهدي'],
    'sajjad': ['سجاد'],
    'sajad': ['سجاد'],
    'baqir': ['باقر'],
    'baqer': ['باقر'],
    'sadiq': ['صادق'],
    'sadeq': ['صادق'],
    'alsadiq': ['الصادق'],
    'kadhim': ['كاظم'],
    'kadhem': ['كاظم'],
    'kazem': ['كاظم'],
    'jawad': ['جواد'],
    'hadi': ['هادي'],
    'yousef': ['يوسف'],
    'youssef': ['يوسف'],
    'yusuf': ['يوسف'],
    'ayman': ['ايمن'],
    'bilal': ['بلال'],
    'hamza': ['حمزه', 'حمزة'],
    'waleed': ['وليد'],
    'walid': ['وليد'],
    'saif': ['سيف'],
    'sayf': ['سيف'],
    'amjad': ['امجد'],
    'anwar': ['انور'],
    'laith': ['ليث'],
    'layth': ['ليث'],
    'marwan': ['مروان'],
    'munir': ['منير'],
    'muneer': ['منير'],
    'nabeel': ['نبيل'],
    'nabil': ['نبيل'],
    'nasser': ['ناصر'],
    'nasir': ['ناصر'],
    'othman': ['عثمان'],
    'osman': ['عثمان'],
    'qasim': ['قاسم'],
    'kasim': ['قاسم'],
    'raheem': ['رحيم'],
    'rahim': ['رحيم'],
    'riad': ['رياض'],
    'riyadh': ['رياض'],
    'saad': ['سعد'],
    'salah': ['صلاح'],
    'saleh': ['صالح'],
    'salman': ['سلمان'],
    'samir': ['سمير'],
    'sameer': ['سمير'],
    'sami': ['سامي'],
    'tariq': ['طارق'],
    'tareq': ['طارق'],
    'yahya': ['يحيي', 'يحيى'],
    'younis': ['يونس'],
    'yunus': ['يونس'],
    'noor': ['نور'],
    'nour': ['نور'],
    'huda': ['هدي', 'هدى'],
    'aya': ['ايه', 'اية'],
    'ayah': ['ايه', 'اية'],
    'dina': ['دينا'],
    'reem': ['ريم'],
    'sarah': ['ساره', 'سارة'],
    'sara': ['ساره', 'سارة'],
    'shams': ['شمس'],
    'shahad': ['شهد'],
    'marwah': ['مروه', 'مروة'],
    'marwa': ['مروه', 'مروة'],
    'duaa': ['دعاء'],
    'zain': ['زين'],
    'zein': ['زين'],
    'farah': ['فرح'],
    'rana': ['رنا'],
    'rasha': ['رشا'],
    'heba': ['هبه', 'هبة'],
    'asmaa': ['اسماء'],
    'asma': ['اسماء'],
    'alaa': ['علاء'],
    'ala': ['علاء'],
    'israa': ['اسراء'],
    'manar': ['منار'],
    'rawan': ['روان'],
    'tabarak': ['تبارك'],
    'banin': ['بنين'],
    'baneen': ['بنين'],
    'dhuha': ['ضحي', 'ضحى'],
    'duha': ['ضحي', 'ضحى'],
    'teba': ['طيبه', 'طيبة'],
    'tiba': ['طيبه', 'طيبة'],
    'thaer': ['ثائر'],
    'thamer': ['ثامر'],
    'fahdi': ['فهدي'],
    'al-fahdi': ['الفهدي'],
    'alfahdi': ['الفهدي'],
    'dalal': ['دلال'],
    'yaseen': ['ياسين'],
    'yasin': ['ياسين'],
    'yassien': ['ياسين'],
    'oun': ['عون'],
    'almamoori': ['المعموري'],
    'mamoori': ['المعموري'],
    'haitham': ['هيثم'],
    'radhwan': ['رضوان'],
    'muntadher': ['منتظر'],
    'dhuhaibawi': ['الذهيباوي', 'الضهيباوي']
  };

  // Reverse Arabic to English lookup
  const AR_TO_EN_MAP = {};
  for (const [en, arList] of Object.entries(NAME_MAP)) {
    for (const ar of arList) {
      if (!AR_TO_EN_MAP[ar]) AR_TO_EN_MAP[ar] = [];
      if (!AR_TO_EN_MAP[ar].includes(en)) AR_TO_EN_MAP[ar].push(en);
    }
  }

  /**
   * Normalizes Arabic strings by stripping diacritics and unifying letters.
   */
  function normalizeArabic(text) {
    if (!text) return '';
    return text
      .toString()
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, '') // remove tashkeel
      .replace(/[إأآاٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[ىي]/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/[ـ]/g, '') // remove kashida/tatweel
      .toLowerCase()
      .trim();
  }

  /**
   * Normalizes English/Latin strings by removing punctuation, extra spaces, and lowercase.
   */
  function normalizeEnglish(text) {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .replace(/[-_.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Letter-level phonetic translation for any Arabic word to Latin/English.
   */
  function phoneticArToEn(text) {
    const norm = normalizeArabic(text);
    const map = {
      'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h',
      'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's',
      'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
      'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm',
      'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y'
    };
    let result = '';
    for (let i = 0; i < norm.length; i++) {
      const c = norm[i];
      result += map[c] || c;
    }
    return result;
  }

  /**
   * Letter-level phonetic translation for any English/Latin word to Arabic.
   */
  function phoneticEnToAr(text) {
    let s = text.toLowerCase()
      .replace(/kh/g, 'خ')
      .replace(/sh/g, 'ش')
      .replace(/th/g, 'ث')
      .replace(/dh/g, 'ذ')
      .replace(/gh/g, 'غ')
      .replace(/ee/g, 'ي')
      .replace(/oo/g, 'و')
      .replace(/ou/g, 'و');
    const map = {
      'a': 'ا', 'b': 'ب', 'c': 'ك', 'd': 'د', 'e': 'ي', 'f': 'ف',
      'g': 'ج', 'h': 'ه', 'i': 'ي', 'j': 'ج', 'k': 'ك', 'l': 'ل',
      'm': 'م', 'n': 'ن', 'o': 'و', 'p': 'ب', 'q': 'ق', 'r': 'ر',
      's': 'س', 't': 'ت', 'u': 'و', 'v': 'ف', 'w': 'و', 'x': 'كس',
      'y': 'ي', 'z': 'ز'
    };
    let result = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      result += map[c] || c;
    }
    return normalizeArabic(result);
  }

  /**
   * Retrieves all cross-script transliteration variants for a word or query token.
   */
  function getTransliterations(word) {
    if (!word) return [];
    const normAr = normalizeArabic(word);
    const normEn = normalizeEnglish(word);
    const results = new Set();

    // If word is English/Latin
    if (/^[a-zA-Z\s-]+$/.test(word)) {
      const clean = normEn.toLowerCase();
      if (NAME_MAP[clean]) {
        NAME_MAP[clean].forEach(ar => results.add(normalizeArabic(ar)));
      }
      if (clean.length >= 2) {
        results.add(phoneticEnToAr(clean));
      }
    }

    // If word is Arabic
    if (/[\u0600-\u06FF]/.test(word)) {
      if (AR_TO_EN_MAP[normAr]) {
        AR_TO_EN_MAP[normAr].forEach(en => results.add(normalizeEnglish(en)));
      }
      if (normAr.length >= 2) {
        results.add(phoneticArToEn(normAr));
      }
    }

    return [...results];
  }

  /**
   * Generates a composite normalized and transliterated search index for an attendee.
   */
  function getSearchableIndex(attendee) {
    const rawParts = [
      attendee.fullName || '',
      attendee.firstName || '',
      attendee.middleName || '',
      attendee.lastName || '',
      attendee.id || '',
      attendee.notes || ''
    ].join(' ');

    const nameTokens = (attendee.fullName || '').split(/[\s-]+/).filter(Boolean);
    const transTokens = [];
    nameTokens.forEach(t => {
      transTokens.push(...getTransliterations(t));
    });

    return {
      raw: rawParts.toLowerCase(),
      normalizedAr: normalizeArabic(rawParts),
      normalizedEn: normalizeEnglish(rawParts),
      transliterated: transTokens.join(' ').toLowerCase()
    };
  }

  /**
   * Tests if an attendee matches the search query using bilingual cross-script transliteration.
   */
  function matchesSearch(attendee, query) {
    if (!query) return true;
    const tokens = query.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return true;

    if (!attendee._searchIndex) {
      attendee._searchIndex = getSearchableIndex(attendee);
    }

    const { raw, normalizedAr, normalizedEn, transliterated } = attendee._searchIndex;

    // Every token in the search query must match somewhere in the attendee record
    return tokens.every(token => {
      const cleanToken = token.toLowerCase();
      const normArToken = normalizeArabic(token);
      const normEnToken = normalizeEnglish(token);

      // Direct matches
      if (raw.includes(cleanToken)) return true;
      if (normArToken && normalizedAr.includes(normArToken)) return true;
      if (normEnToken && normalizedEn.includes(normEnToken)) return true;

      // Match against pre-indexed attendee transliterations
      if (cleanToken && transliterated.includes(cleanToken)) return true;
      if (normArToken && transliterated.includes(normArToken)) return true;
      if (normEnToken && transliterated.includes(normEnToken)) return true;

      // Match transliterated query token against attendee name
      const qTrans = getTransliterations(token);
      for (let i = 0; i < qTrans.length; i++) {
        const t = qTrans[i];
        if (t && (normalizedAr.includes(t) || normalizedEn.includes(t) || raw.includes(t))) {
          return true;
        }
      }

      return false;
    });
  }

  /* ==========================================================================
     Audio Synthesis (Web Audio API)
     ========================================================================== */
  function playAudioFeedback(type = 'checkin') {
    if (!state.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'checkin') {
        const now = ctx.currentTime;
        // Two-tone rising major chord
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.16);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.07); // A5
        gain2.gain.setValueAtTime(0.18, now + 0.07);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.07);
        osc2.stop(now + 0.32);
      } else if (type === 'undo') {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4 falling to E4
        osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch (err) {
      console.warn('Audio synthesis note:', err);
    }
  }

  /* ==========================================================================
     State Initialization & Persistence
     ========================================================================== */

  function loadInitialData() {
    const initialList = (window.INITIAL_ATTENDEES && Array.isArray(window.INITIAL_ATTENDEES))
      ? window.INITIAL_ATTENDEES
      : [];

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedMap = new Map(parsed.map(a => [a.id, a]));
          const hasMissingInitial = initialList.some(initItem => !savedMap.has(initItem.id));

          if (!hasMissingInitial) {
            state.attendees = parsed;
            updateAnalytics();
            return;
          } else {
            // If saved has fewer items or is missing newly added initial attendees/volunteers, merge
            const merged = initialList.map(initItem => {
              return savedMap.has(initItem.id) ? savedMap.get(initItem.id) : JSON.parse(JSON.stringify(initItem));
            });
            // Also append any walk-ins that were in parsed
            parsed.filter(a => a.isWalkIn).forEach(w => {
              if (!merged.some(m => m.id === w.id)) merged.unshift(w);
            });
            state.attendees = merged;
            saveData();
            return;
          }
        }
      } catch (e) {
        console.error('Failed to parse saved attendees from localStorage:', e);
      }
    }

    // Default to clean copy of initialList
    state.attendees = JSON.parse(JSON.stringify(initialList));
    saveData();
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.attendees));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
    updateAnalytics();
  }

  /* ==========================================================================
     Analytics & KPI Calculations
     ========================================================================== */

  function updateAnalytics() {
    const total = state.attendees.length;
    const attended = state.attendees.filter(a => a.attended).length;
    const remaining = total - attended;
    const walkIns = state.attendees.filter(a => a.isWalkIn).length;
    const volunteers = state.attendees.filter(a => a.isVolunteer).length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

    if (elements.kpiTotal) elements.kpiTotal.textContent = total;
    if (elements.kpiAttended) elements.kpiAttended.textContent = attended;
    if (elements.kpiRemaining) elements.kpiRemaining.textContent = remaining;
    if (elements.kpiWalkIns) elements.kpiWalkIns.textContent = walkIns;
    if (elements.kpiVolunteers) elements.kpiVolunteers.textContent = volunteers;
    if (elements.kpiRate) elements.kpiRate.textContent = `${rate}%`;
    if (elements.kpiProgressBar) elements.kpiProgressBar.style.width = `${rate}%`;
    if (elements.kpiBarTrack) {
      elements.kpiBarTrack.setAttribute('aria-valuenow', rate);
    }

    // Tab counts
    if (elements.countAll) elements.countAll.textContent = total;
    if (elements.countPresent) elements.countPresent.textContent = attended;
    if (elements.countAbsent) elements.countAbsent.textContent = remaining;
    if (elements.countWalkin) elements.countWalkin.textContent = walkIns;
    if (elements.countVolunteer) elements.countVolunteer.textContent = volunteers;
  }

  /* ==========================================================================
     Filtering, Sorting & Filtering Computation
     ========================================================================== */

  function getProcessedAttendees() {
    let list = state.attendees.filter(attendee => {
      // Filter by status tab
      if (state.activeFilter === 'present' && !attendee.attended) return false;
      if (state.activeFilter === 'absent' && attendee.attended) return false;
      if (state.activeFilter === 'walkin' && !attendee.isWalkIn) return false;
      if (state.activeFilter === 'volunteer' && !attendee.isVolunteer) return false;

      // Filter by search query
      if (state.searchQuery && !matchesSearch(attendee, state.searchQuery)) {
        return false;
      }

      return true;
    });

    // Sorting
    switch (state.activeSort) {
      case 'name-asc':
        list.sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' }));
        break;
      case 'name-desc':
        list.sort((a, b) => b.fullName.localeCompare(a.fullName, undefined, { sensitivity: 'base' }));
        break;
      case 'status-first':
        list.sort((a, b) => {
          if (a.attended === b.attended) return 0;
          return a.attended ? -1 : 1;
        });
        break;
      case 'recent-time':
        list.sort((a, b) => {
          if (a.checkInTimestamp && b.checkInTimestamp) {
            return b.checkInTimestamp - a.checkInTimestamp;
          }
          if (a.checkInTimestamp) return -1;
          if (b.checkInTimestamp) return 1;
          return 0;
        });
        break;
      case 'default':
      default:
        list.sort((a, b) => (a.originalIndex || 9999) - (b.originalIndex || 9999));
        break;
    }

    return list;
  }

  /* ==========================================================================
     Rendering: Cards & Table Views
     ========================================================================== */

  function render() {
    updateAnalytics();

    const list = getProcessedAttendees();
    elements.visibleCount.textContent = list.length;

    const filterNames = {
      all: 'All Attendees',
      present: 'Checked In',
      absent: 'Pending',
      walkin: 'Walk-Ins',
      volunteer: 'Event Volunteers'
    };
    elements.activeFilterBadge.textContent = filterNames[state.activeFilter] || 'All';

    if (list.length === 0) {
      elements.gridContainer.hidden = true;
      elements.tableContainer.hidden = true;
      elements.emptyState.hidden = false;

      if (state.searchQuery) {
        elements.emptyQueryText.innerHTML = `No match for "<strong>${escapeHtml(state.searchQuery)}</strong>" in the current filter.`;
        elements.emptyAddWalkInBtn.hidden = false;
      } else {
        elements.emptyQueryText.textContent = 'No attendees in this view.';
        elements.emptyAddWalkInBtn.hidden = true;
      }
      return;
    }

    elements.emptyState.hidden = true;

    // Keep view toggle buttons in sync
    elements.viewGridBtn.classList.toggle('active', state.viewMode === 'grid');
    elements.viewTableBtn.classList.toggle('active', state.viewMode === 'table');

    if (state.viewMode === 'grid') {
      elements.tableContainer.hidden = true;
      elements.gridContainer.hidden = false;
      elements.tableBody.innerHTML = '';
      renderGrid(list);
    } else {
      elements.gridContainer.hidden = true;
      elements.tableContainer.hidden = false;
      elements.gridContainer.innerHTML = '';
      renderTable(list);
    }
  }

  /**
   * Renders the cards grid view.
   */
  function renderGrid(attendees) {
    elements.gridContainer.innerHTML = '';
    const fragment = document.createDocumentFragment();

    attendees.forEach((attendee, idx) => {
      const card = document.createElement('article');
      const cls = ['attendee-card'];
      if (attendee.attended) cls.push('is-attended');
      if (attendee.isWalkIn) cls.push('is-walkin');
      if (attendee.isVolunteer) cls.push('is-volunteer');
      card.className = cls.join(' ');
      card.id = `card-${attendee.id}`;
      // Stagger animation delay
      card.style.animationDelay = `${Math.min(idx * 0.03, 0.45)}s`;

      const isAr = attendee.language === 'ar';
      const textDir = isAr ? 'rtl' : 'ltr';
      const langLabel = isAr ? 'AR' : 'EN';
      const langClass = isAr ? 'ar' : 'en';

      const checkedSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;

      const volunteerBadge = attendee.isVolunteer
        ? `<span class="badge-volunteer"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Volunteer</span>`
        : '';

      const volunteerRolePill = (attendee.isVolunteer && attendee.volunteerRole)
        ? `<div class="volunteer-role-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>${escapeHtml(attendee.volunteerRole)}</span></div>`
        : '';

      card.innerHTML = `
        <div class="card-top">
          <div class="card-badges">
            <span class="badge-id">${escapeHtml(attendee.id)}</span>
            <span class="badge-lang ${langClass}">${langLabel}</span>
            ${attendee.isWalkIn ? '<span class="badge-walkin">Walk-In</span>' : ''}
            ${volunteerBadge}
          </div>
          <div class="status-pill">
            <span class="status-dot"></span>
            <span>${attendee.attended ? 'Present' : 'Pending'}</span>
          </div>
        </div>

        <div class="card-name-block">
          <h3 class="attendee-name" dir="${textDir}">${highlightMatch(attendee.fullName, state.searchQuery)}</h3>
          <div class="name-parts">
            <span class="name-tag"><strong>F:</strong>${escapeHtml(attendee.firstName || '—')}</span>
            ${attendee.middleName ? `<span class="name-tag"><strong>M:</strong>${escapeHtml(attendee.middleName)}</span>` : ''}
            <span class="name-tag"><strong>L:</strong>${escapeHtml(attendee.lastName || '—')}</span>
          </div>
          ${volunteerRolePill}
          ${attendee.notes && !attendee.isVolunteer ? `<p class="card-notes">${escapeHtml(attendee.notes)}</p>` : ''}
        </div>

        <div class="card-foot">
          <div>
            ${attendee.attended && attendee.checkInTime
              ? `<span class="checkin-time">${escapeHtml(attendee.checkInTime)}</span>`
              : `<span class="no-checkin-label">Not checked in</span>`
            }
          </div>
          <button
            type="button"
            class="checkin-btn"
            data-id="${attendee.id}"
            aria-label="${attendee.attended ? 'Revert to absent' : 'Check in'}"
          >
            ${attendee.attended
              ? `${checkedSvg}<span class="btn-txt-normal">Attended</span><span class="btn-txt-revert">Revert</span>`
              : `${checkedSvg}<span>Check In</span>`
            }
          </button>
        </div>
      `;

      fragment.appendChild(card);
    });

    elements.gridContainer.appendChild(fragment);
  }

  /**
   * Renders the compact table view.
   */
  function renderTable(attendees) {
    elements.tableBody.innerHTML = '';
    const fragment = document.createDocumentFragment();

    attendees.forEach(attendee => {
      const tr = document.createElement('tr');
      const trCls = [];
      if (attendee.attended) trCls.push('is-attended');
      if (attendee.isVolunteer) trCls.push('is-volunteer');
      tr.className = trCls.join(' ');
      tr.id = `row-${attendee.id}`;

      const isAr = attendee.language === 'ar';
      const textDir = isAr ? 'rtl' : 'ltr';

      const volunteerBadge = attendee.isVolunteer
        ? `<span class="badge-volunteer"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Volunteer</span>`
        : (attendee.isWalkIn
            ? '<span class="badge-walkin">Walk-In</span>'
            : `<span class="badge-lang ${isAr ? 'ar' : 'en'}">${isAr ? 'AR' : 'EN'}</span>`
          );

      tr.innerHTML = `
        <td><span class="badge-id">${escapeHtml(attendee.id)}</span></td>
        <td>
          <div class="tbl-name" dir="${textDir}">${highlightMatch(attendee.fullName, state.searchQuery)}</div>
          ${attendee.volunteerRole ? `<div style="font-size:0.75rem;color:var(--c-blue);font-weight:600;margin-top:0.2rem">★ ${escapeHtml(attendee.volunteerRole)}</div>` : ''}
          ${attendee.notes && !attendee.isVolunteer ? `<div style="font-size:0.73rem;color:var(--c-text-3);margin-top:0.15rem">${escapeHtml(attendee.notes)}</div>` : ''}
        </td>
        <td style="font-size:0.78rem;color:var(--c-text-3)">
          ${escapeHtml(attendee.firstName || '')}${attendee.middleName ? ` · <em>${escapeHtml(attendee.middleName)}</em>` : ''}${attendee.lastName ? ` · ${escapeHtml(attendee.lastName)}` : ''}
        </td>
        <td>
          ${volunteerBadge}
        </td>
        <td>
          ${attendee.attended
            ? `<span style="font-weight:700;color:var(--c-ok)">Present</span> <span style="font-family:var(--f-mono);font-size:0.72rem;color:var(--c-text-3)">${escapeHtml(attendee.checkInTime || '')}</span>`
            : `<span style="color:var(--c-text-3)">Pending</span>`
          }
        </td>
        <td style="text-align:center">
          <button
            type="button"
            class="checkin-btn"
            data-id="${attendee.id}"
            style="min-width:84px;padding:0.32rem 0.6rem;font-size:0.77rem"
          >${attendee.attended ? 'Attended' : 'Check In'}</button>
        </td>
      `;

      fragment.appendChild(tr);
    });

    elements.tableBody.appendChild(fragment);
  }

  /* ==========================================================================
     Check-In Action & Mistake-Prevention Undo System
     ========================================================================== */

  function toggleAttendance(attendeeId) {
    const attendee = state.attendees.find(a => a.id === attendeeId);
    if (!attendee) return;

    const previousAttended = attendee.attended;
    const previousTime = attendee.checkInTime;
    const previousTimestamp = attendee.checkInTimestamp;

    if (!attendee.attended) {
      // Mark as Present
      const now = new Date();
      attendee.attended = true;
      attendee.checkInTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      attendee.checkInTimestamp = now.getTime();

      playAudioFeedback('checkin');
      showUndoToast({
        type: 'checkin',
        attendeeId: attendee.id,
        attendeeName: attendee.fullName,
        message: `Checked in <strong>${escapeHtml(attendee.fullName)}</strong> at ${attendee.checkInTime}`,
        icon: '✅',
        previousState: { attended: previousAttended, checkInTime: previousTime, checkInTimestamp: previousTimestamp }
      });
    } else {
      // Uncheck / Mark Absent
      attendee.attended = false;
      attendee.checkInTime = null;
      attendee.checkInTimestamp = null;

      showUndoToast({
        type: 'uncheck',
        attendeeId: attendee.id,
        attendeeName: attendee.fullName,
        message: `Marked <strong>${escapeHtml(attendee.fullName)}</strong> as absent`,
        icon: '↩️',
        previousState: { attended: previousAttended, checkInTime: previousTime, checkInTimestamp: previousTimestamp }
      });
    }

    saveData();
    updateAttendeeDOM(attendee.id);
  }

  /**
   * Performs an efficient, targeted in-place DOM update on a single attendee's card/row.
   * Prevents full-list re-renders, layout shifts, and entrance re-animations on check-in.
   */
  function updateAttendeeDOM(attendeeId) {
    const attendee = state.attendees.find(a => a.id === attendeeId);
    if (!attendee) return;

    // If an active filter excludes this attendee, re-render the filtered view
    if (
      (state.activeFilter === 'present' && !attendee.attended) ||
      (state.activeFilter === 'absent' && attendee.attended) ||
      (state.activeFilter === 'walkin' && !attendee.isWalkIn) ||
      (state.activeFilter === 'volunteer' && !attendee.isVolunteer)
    ) {
      render();
      return;
    }

    const card = document.getElementById(`card-${attendee.id}`);
    const row = document.getElementById(`row-${attendee.id}`);

    // If neither element exists in DOM (e.g. view mode mismatch or unrendered), fall back to full render
    if (!card && !row) {
      render();
      return;
    }

    // Update Card in-place
    if (card) {
      card.classList.toggle('is-attended', attendee.attended);

      const statusPillText = card.querySelector('.status-pill span:last-child');
      if (statusPillText) {
        statusPillText.textContent = attendee.attended ? 'Present' : 'Pending';
      }

      const footTime = card.querySelector('.card-foot > div:first-child');
      if (footTime) {
        footTime.innerHTML = attendee.attended && attendee.checkInTime
          ? `<span class="checkin-time">${escapeHtml(attendee.checkInTime)}</span>`
          : `<span class="no-checkin-label">Not checked in</span>`;
      }

      const btn = card.querySelector('.checkin-btn');
      if (btn) {
        const checkedSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;
        btn.setAttribute('aria-label', attendee.attended ? 'Revert to absent' : 'Check in');
        btn.innerHTML = attendee.attended
          ? `${checkedSvg}<span class="btn-txt-normal">Attended</span><span class="btn-txt-revert">Revert</span>`
          : `${checkedSvg}<span>Check In</span>`;
      }
    }

    // Update Table Row in-place
    if (row) {
      row.classList.toggle('is-attended', attendee.attended);

      if (row.cells && row.cells[4]) {
        row.cells[4].innerHTML = attendee.attended
          ? `<span style="font-weight:700;color:var(--c-ok)">Present</span> <span style="font-family:var(--f-mono);font-size:0.72rem;color:var(--c-text-3)">${escapeHtml(attendee.checkInTime || '')}</span>`
          : `<span style="color:var(--c-text-3)">Pending</span>`;
      }

      const tblBtn = row.querySelector('.checkin-btn');
      if (tblBtn) {
        tblBtn.textContent = attendee.attended ? 'Attended' : 'Check In';
      }
    }

    // Immediately sync analytics counters and progress bar
    updateAnalytics();
  }

  function showUndoToast(actionInfo) {
    state.undoAction = actionInfo;
    elements.toastText.innerHTML = actionInfo.message;

    // Update toast icon style — check-in = green, undo/revert = neutral
    if (elements.toastIcon) {
      elements.toastIcon.className = actionInfo.type === 'checkin' ? 'toast-icon-wrap' : 'toast-icon-wrap undo-icon';
    }

    elements.undoToast.hidden = false;

    // Reset countdown animation
    elements.toastCountdownBar.style.transition = 'none';
    elements.toastCountdownBar.style.width = '100%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        elements.toastCountdownBar.style.transition = 'width 5s linear';
        elements.toastCountdownBar.style.width = '0%';
      });
    });

    if (state.undoTimer) clearTimeout(state.undoTimer);
    state.undoTimer = setTimeout(dismissUndoToast, 5000);
  }

  function dismissUndoToast() {
    elements.undoToast.hidden = true;
    state.undoAction = null;
    if (state.undoTimer) {
      clearTimeout(state.undoTimer);
      state.undoTimer = null;
    }
  }

  function executeUndo() {
    if (!state.undoAction) return;

    const { attendeeId, previousState, attendeeName } = state.undoAction;
    const attendee = state.attendees.find(a => a.id === attendeeId);

    if (attendee && previousState) {
      attendee.attended = previousState.attended;
      attendee.checkInTime = previousState.checkInTime;
      attendee.checkInTimestamp = previousState.checkInTimestamp;

      playAudioFeedback('undo');
      saveData();
      updateAttendeeDOM(attendee.id);
    }

    dismissUndoToast();
  }

  /* ==========================================================================
     Walk-In Registration Engine
     ========================================================================== */

  function openWalkInDialog(prefillName = '') {
    elements.walkInFirst.value = prefillName;
    elements.walkInMiddle.value = '';
    elements.walkInLast.value = '';
    elements.walkInNotes.value = '';
    elements.walkInAutoCheckIn.checked = true;

    if (typeof elements.walkInModal.showModal === 'function') {
      elements.walkInModal.showModal();
    } else {
      elements.walkInModal.setAttribute('open', '');
    }

    if (prefillName) {
      elements.walkInLast.focus();
    } else {
      elements.walkInFirst.focus();
    }
  }

  function closeWalkInDialog() {
    if (typeof elements.walkInModal.close === 'function') {
      elements.walkInModal.close();
    } else {
      elements.walkInModal.removeAttribute('open');
    }
  }

  function handleWalkInSubmit(e) {
    e.preventDefault();

    const firstName = elements.walkInFirst.value.trim();
    const middleName = elements.walkInMiddle.value.trim();
    const lastName = elements.walkInLast.value.trim();
    const notes = elements.walkInNotes.value.trim();
    const autoCheck = elements.walkInAutoCheckIn.checked;

    if (!firstName || !lastName) {
      alert('Please provide both First Name and Last Name.');
      return;
    }

    const nameParts = [firstName, middleName, lastName].filter(Boolean);
    const fullName = nameParts.join(' ').replace(/\s+/g, ' ');
    const isArabic = /[\u0600-\u06FF]/.test(fullName);

    // Generate unique walk-in ID
    const walkInCount = state.attendees.filter(a => a.isWalkIn).length + 1;
    const walkInId = `W-${String(walkInCount).padStart(3, '0')}`;

    const now = new Date();
    const newAttendee = {
      id: walkInId,
      originalIndex: 1000 + walkInCount,
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      fullName: fullName,
      language: isArabic ? 'ar' : 'en',
      notes: notes,
      isWalkIn: true,
      attended: autoCheck,
      checkInTime: autoCheck ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null,
      checkInTimestamp: autoCheck ? now.getTime() : null
    };

    // Prepend to attendees
    state.attendees.unshift(newAttendee);
    saveData();

    if (autoCheck) {
      playAudioFeedback('checkin');
      showUndoToast({
        type: 'checkin',
        attendeeId: newAttendee.id,
        attendeeName: newAttendee.fullName,
        message: `Registered & checked in walk-in <strong>${escapeHtml(newAttendee.fullName)}</strong>`,
        icon: '⚡',
        previousState: { attended: false, checkInTime: null, checkInTimestamp: null }
      });
    }

    closeWalkInDialog();

    // Clear search so the newly registered attendee is visible
    state.searchQuery = '';
    elements.searchInput.value = '';
    elements.clearSearchBtn.style.display = 'none';

    render();

    // Highlight new card briefly
    setTimeout(() => {
      const cardEl = document.getElementById(`card-${newAttendee.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cardEl.style.transition = 'box-shadow 0.3s ease';
        cardEl.style.boxShadow = '0 0 0 4px #00629B';
        setTimeout(() => {
          cardEl.style.boxShadow = '';
        }, 1500);
      }
    }, 100);
  }

  /* ==========================================================================
     Export, Print & CSV Import Utilities
     ========================================================================== */

  /**
   * Generates and downloads an Excel-compatible CSV file with UTF-8 BOM.
   */
  function exportAttendanceCsv() {
    const headers = [
      'ID',
      'Name (First)',
      'Name (Middle)',
      'Name (Last)',
      'Full Name',
      'Language',
      'Status',
      'Check-In Time',
      'Type',
      'Volunteer Role',
      'Notes'
    ];

    const rows = state.attendees.map(a => [
      a.id,
      a.firstName || '',
      a.middleName || '',
      a.lastName || '',
      a.fullName || '',
      a.language.toUpperCase(),
      a.attended ? 'Present' : 'Absent',
      a.checkInTime || '',
      a.isVolunteer ? 'Volunteer' : (a.isWalkIn ? 'Walk-In' : 'Registered Attendee'),
      a.volunteerRole || '',
      a.notes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel opens Arabic without mangling
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `IEEE-Attendance-Report-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    elements.exportDropdown.classList.remove('show');
    elements.exportMenuBtn.setAttribute('aria-expanded', 'false');
  }

  function printAttendanceReport() {
    elements.exportDropdown.classList.remove('show');
    elements.exportMenuBtn.setAttribute('aria-expanded', 'false');
    window.print();
  }

  function resetToOriginalData() {
    elements.exportDropdown.classList.remove('show');
    elements.exportMenuBtn.setAttribute('aria-expanded', 'false');
    const confirmed = confirm(
      'Are you sure you want to reset all attendance records back to the original CSV file?\n\n' +
      'This will clear all current check-in timestamps and remove walk-ins. We recommend exporting a CSV backup first!'
    );

    if (confirmed) {
      localStorage.removeItem(STORAGE_KEY);
      if (window.INITIAL_ATTENDEES && Array.isArray(window.INITIAL_ATTENDEES)) {
        state.attendees = JSON.parse(JSON.stringify(window.INITIAL_ATTENDEES));
      } else {
        state.attendees = [];
      }
      saveData();
      render();
      alert('Attendance system reset to original 181 registrant roster.');
    }
  }

  function handleCustomCsvImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          alert('CSV file does not contain enough records.');
          return;
        }

        const newAttendees = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = parseCsvLine(lines[i]);
          const first = parts[0] || '';
          const middle = parts[1] || '';
          const last = parts[2] || '';

          const nameParts = [first, middle, last].filter(Boolean);
          const fullName = nameParts.join(' ').replace(/\s+/g, ' ');
          if (!fullName) continue;

          const isAr = /[\u0600-\u06FF]/.test(fullName);

          newAttendees.push({
            id: 'imp-' + String(i).padStart(3, '0'),
            originalIndex: i,
            firstName: first,
            middleName: middle,
            lastName: last,
            fullName: fullName,
            language: isAr ? 'ar' : 'en',
            isWalkIn: false,
            attended: false,
            checkInTime: null
          });
        }

        if (newAttendees.length === 0) {
          alert('Could not find valid attendee names in this CSV.');
          return;
        }

        if (confirm(`Successfully parsed ${newAttendees.length} attendees from CSV. Would you like to load this new list?`)) {
          state.attendees = newAttendees;
          saveData();
          render();
        }
      } catch (err) {
        alert('Failed to parse uploaded CSV: ' + err.message);
      }
      e.target.value = '';
    };
    reader.readAsText(file, 'utf-8');
  }

  function parseCsvLine(line) {
    const parts = [];
    let entry = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuote = !inQuote;
      } else if (c === ',' && !inQuote) {
        parts.push(entry.trim());
        entry = '';
      } else {
        entry += c;
      }
    }
    parts.push(entry.trim());
    return parts.map(p => {
      if (p.startsWith('"') && p.endsWith('"')) {
        return p.slice(1, -1).replace(/""/g, '"').trim();
      }
      return p.trim();
    });
  }

  /* ==========================================================================
     Helper Utilities
     ========================================================================== */

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightMatch(text, query) {
    if (!text) return '';
    const safeText = escapeHtml(text);
    if (!query || !query.trim()) return safeText;

    const rawTokens = query.trim().split(/\s+/).filter(Boolean);
    if (rawTokens.length === 0) return safeText;

    const tokensToHighlight = new Set();
    rawTokens.forEach(t => {
      tokensToHighlight.add(t);
      getTransliterations(t).forEach(tr => {
        if (tr && tr.length >= 2) tokensToHighlight.add(tr);
      });
    });

    const escapedTokens = [...tokensToHighlight].map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (escapedTokens.length === 0) return safeText;

    const regex = new RegExp(`(${escapedTokens.join('|')})`, 'gi');
    return safeText.replace(regex, '<mark style="background-color: #FEF08A; color: #1E293B; border-radius: 2px; padding: 0 2px;">$1</mark>');
  }

  function updateClock() {
    const now = new Date();
    elements.clockTime.textContent = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /* ==========================================================================
     Event Listeners & Hotkeys
     ========================================================================== */

  function bindEvents() {
    // Search input
    elements.searchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value;
      elements.clearSearchBtn.hidden = !state.searchQuery;
      render();
    });

    elements.clearSearchBtn.addEventListener('click', () => {
      state.searchQuery = '';
      elements.searchInput.value = '';
      elements.clearSearchBtn.hidden = true;
      elements.searchInput.focus();
      render();
    });

    // Filter tabs (new class: .ftab)
    elements.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        elements.filterTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        state.activeFilter = tab.getAttribute('data-filter');
        render();
      });
    });

    // KPI Card clicks trigger corresponding filter tab
    const kpiFilterMap = [
      { id: 'kpiBlockTotal', filter: 'all' },
      { id: 'kpiBlockAttended', filter: 'present' },
      { id: 'kpiBlockRemaining', filter: 'absent' },
      { id: 'kpiBlockWalkin', filter: 'walkin' },
      { id: 'kpiBlockVolunteer', filter: 'volunteer' }
    ];
    kpiFilterMap.forEach(item => {
      const blockEl = document.getElementById(item.id);
      if (blockEl) {
        blockEl.style.cursor = 'pointer';
        blockEl.addEventListener('click', () => {
          elements.filterTabs.forEach(t => {
            const match = t.getAttribute('data-filter') === item.filter;
            t.classList.toggle('active', match);
            t.setAttribute('aria-selected', match ? 'true' : 'false');
          });
          state.activeFilter = item.filter;
          render();
        });
      }
    });

    // Sort select
    elements.sortSelect.addEventListener('change', e => {
      state.activeSort = e.target.value;
      render();
    });

    // View toggles
    elements.viewGridBtn.addEventListener('click', () => {
      state.viewMode = 'grid';
      localStorage.setItem(VIEW_KEY, 'grid');
      elements.viewGridBtn.classList.add('active');
      elements.viewTableBtn.classList.remove('active');
      render();
    });

    elements.viewTableBtn.addEventListener('click', () => {
      state.viewMode = 'table';
      localStorage.setItem(VIEW_KEY, 'table');
      elements.viewTableBtn.classList.add('active');
      elements.viewGridBtn.classList.remove('active');
      render();
    });

    // Checkin button clicks (Event delegation for performance)
    document.addEventListener('click', e => {
      const btn = e.target.closest('.checkin-btn');
      if (btn) {
        const id = btn.getAttribute('data-id');
        if (id) {
          toggleAttendance(id);
        }
      }
    });

    // Walk-In modal triggers
    elements.openWalkInBtn.addEventListener('click', () => openWalkInDialog());
    elements.closeWalkInBtn.addEventListener('click', closeWalkInDialog);
    elements.cancelWalkInBtn.addEventListener('click', closeWalkInDialog);
    elements.walkInForm.addEventListener('submit', handleWalkInSubmit);

    // Empty state quick action
    elements.emptyClearBtn.addEventListener('click', () => {
      state.searchQuery = '';
      elements.searchInput.value = '';
      elements.clearSearchBtn.hidden = true;
      state.activeFilter = 'all';
      elements.filterTabs.forEach(t => {
        const isAll = t.getAttribute('data-filter') === 'all';
        t.classList.toggle('active', isAll);
        t.setAttribute('aria-selected', isAll ? 'true' : 'false');
      });
      render();
    });

    elements.emptyAddWalkInBtn.addEventListener('click', () => {
      openWalkInDialog(state.searchQuery);
    });

    // Undo toast
    elements.toastUndoBtn.addEventListener('click', executeUndo);
    elements.toastCloseBtn.addEventListener('click', dismissUndoToast);

    // Audio toggle
    elements.soundToggleBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem(SOUND_KEY, state.soundEnabled);
      elements.soundLabel.textContent = state.soundEnabled ? 'Sound' : 'Muted';
      elements.soundToggleBtn.style.opacity = state.soundEnabled ? '1' : '0.5';
    });

    // Shortcuts modal
    elements.helpShortcutsBtn.addEventListener('click', () => {
      if (typeof elements.shortcutsModal.showModal === 'function') {
        elements.shortcutsModal.showModal();
      } else {
        elements.shortcutsModal.setAttribute('open', '');
      }
    });
    elements.closeShortcutsBtn.addEventListener('click', () => elements.shortcutsModal.close());
    elements.dismissShortcutsBtn.addEventListener('click', () => elements.shortcutsModal.close());

    // Export Dropdown menu
    elements.exportMenuBtn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = elements.exportDropdown.classList.toggle('show');
      elements.exportMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.dropdown-wrap')) {
        elements.exportDropdown.classList.remove('show');
        elements.exportMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    elements.exportCsvBtn.addEventListener('click', exportAttendanceCsv);
    elements.printReportBtn.addEventListener('click', printAttendanceReport);
    elements.resetDataBtn.addEventListener('click', resetToOriginalData);
    elements.importCsvBtn.addEventListener('click', () => elements.csvFileInput.click());
    elements.csvFileInput.addEventListener('change', handleCustomCsvImport);

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', e => {
      // Don't intercept when modal is typing or other inputs are active (except specific hotkeys)
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

      if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        elements.searchInput.focus();
        elements.searchInput.select();
        return;
      }

      if (e.key === 'Escape') {
        if (elements.walkInModal.open) {
          closeWalkInDialog();
          return;
        }
        if (elements.shortcutsModal.open) {
          elements.shortcutsModal.close();
          return;
        }
        if (state.searchQuery) {
          state.searchQuery = '';
          elements.searchInput.value = '';
          elements.clearSearchBtn.style.display = 'none';
          render();
        }
        return;
      }

      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        openWalkInDialog();
        return;
      }

      if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        exportAttendanceCsv();
        return;
      }

      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        printAttendanceReport();
        return;
      }

      if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
        if (!isInputActive && state.undoAction) {
          e.preventDefault();
          executeUndo();
          return;
        }
      }
    });
  }

  /* ==========================================================================
     Application Bootstrapper
     ========================================================================== */

  function init() {
    loadInitialData();
    bindEvents();

    // Initial sound state
    elements.soundLabel.textContent = state.soundEnabled ? 'Sound' : 'Muted';
    elements.soundToggleBtn.style.opacity = state.soundEnabled ? '1' : '0.5';

    // Initial view button state
    if (state.viewMode === 'table') {
      elements.viewTableBtn.classList.add('active');
      elements.viewGridBtn.classList.remove('active');
    }

    // Start clock
    updateClock();
    setInterval(updateClock, 1000);

    // Initial render
    render();
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
