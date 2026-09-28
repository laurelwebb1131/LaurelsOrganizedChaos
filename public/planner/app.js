/* Laurel's Organized Chaos Planner
   Local-first planner engine + Step 2 page polish.
   Data is stored in browser localStorage. */

(() => {
  'use strict';

  const STORAGE_KEY = 'loc_planner_v1';
  const ROUTES = [
    ['dashboard', '✦', 'Dashboard'],
    ['today', '🖤', 'Today'],
    ['week', '🌙', 'This Week'],
    ['calendar', '🗓️', 'Calendar'],
    ['school', '📚', 'School'],
    ['projects', '🧪', 'Projects'],
    ['home', '🏕️', 'Home & Family'],
    ['brain', '🧠', 'Brain Dump'],
    ['goals', '🔮', 'Goals & Ideas'],
    ['scrapbook', '📸', 'Life Scrapbook'],
    ['settings', '⚙️', 'Settings']
  ];

  const PRIORITY_WEIGHT = { high: 0, normal: 1, low: 2 };
  const MOODS = ['calm', 'happy', 'focused', 'scattered', 'anxious', 'irritated', 'sad', 'overwhelmed', 'motivated', 'tired', 'mixed'];
  const ENERGY = ['low', 'medium', 'high', 'variable'];
  const STATUSES = ['inbox', 'ready', 'in-progress', 'complete', 'waiting', 'postponed', 'canceled'];
  const OPEN_STATUSES = new Set(['inbox', 'ready', 'in-progress', 'waiting', 'postponed']);

  const DASHBOARD_WIDGETS = ['now', 'planner', 'school', 'projects', 'home', 'void', 'progress'];
  const TODAY_SECTIONS = ['overview', 'anchors', 'workbench', 'review', 'void'];
  const ACCENT_THEMES = ['pink', 'purple', 'blue', 'silver', 'autumn'];
  const BACKGROUND_PRESETS = ['black-paper', 'starfield', 'purple-nebula', 'ink-notebook', 'midnight-blue'];
  const STICKER_TYPES = ['crow', 'owl', 'moon', 'star', 'candle', 'heart', 'spark', 'feather'];
  const MONTH_MOODS = {
    1: { name: 'January', phrase: 'Quiet plans. Sharp pencils. Questionable optimism.', mark: '✦', className: 'month-ice' },
    2: { name: 'February', phrase: 'Tiny month. Dramatic feelings. Proceed accordingly.', mark: '♡', className: 'month-rose' },
    3: { name: 'March', phrase: 'Open the windows. Release one unnecessary thing.', mark: '☾', className: 'month-moss' },
    4: { name: 'April', phrase: 'Rain, lists, and suspiciously ambitious ideas.', mark: '✿', className: 'month-rain' },
    5: { name: 'May', phrase: 'Grow something useful. Or weird. Preferably both.', mark: '❈', className: 'month-garden' },
    6: { name: 'June', phrase: 'Long light. Short lists. Keep room for living.', mark: '☀', className: 'month-sun' },
    7: { name: 'July', phrase: 'Hydrate. Prioritize. Refuse unnecessary suffering.', mark: '✦', className: 'month-ember' },
    8: { name: 'August', phrase: 'Half summer, half reset, entirely too warm.', mark: '☼', className: 'month-ember' },
    9: { name: 'September', phrase: 'Fresh notebook energy without the academic hostage situation.', mark: '✎', className: 'month-ink' },
    10: { name: 'October', phrase: 'Spooky stationery season.', mark: '☾', className: 'month-october' },
    11: { name: 'November', phrase: 'Keep what works. Let the rest compost.', mark: '❦', className: 'month-november' },
    12: { name: 'December', phrase: 'Finish what matters. Keep the memories.', mark: '✦', className: 'month-december' }
  };

  let state = loadState();
  let timerInterval = null;

  function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function isoDateLocal(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatDate(dateLike, opts = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) {
    if (!dateLike) return 'No date';
    const d = typeof dateLike === 'string' ? new Date(`${dateLike}T12:00:00`) : dateLike;
    return new Intl.DateTimeFormat(undefined, opts).format(d);
  }

  function formatShortDate(dateLike) {
    if (!dateLike) return '—';
    return formatDate(dateLike, { month: 'short', day: 'numeric' });
  }

  function timeToMinutes(str) {
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
  }

  function escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function statusLabel(status) {
    return ({
      'inbox': 'Inbox', 'ready': 'Ready', 'in-progress': 'In Progress', 'complete': 'Complete',
      'waiting': 'Waiting', 'postponed': 'Postponed', 'canceled': 'Canceled'
    })[status] || status;
  }

  function toast(message) {
    const region = document.getElementById('toast-region');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    region.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function defaultState() {
    const now = Date.now();
    const today = isoDateLocal();
    return {
      version: 1,
      settings: { themeIntensity: 'full', sound: true, backgroundPreset: 'black-paper', accentTheme: 'pink', customBackgroundDataUrl: '', heroPhotoDataUrl: '', sectionThemes: {} },
      tasks: [
        { id: 'task_entr150_w4', title: 'ENTR150 W4: Draft Lean Canvas Solutions', description: 'Draft three solutions, one for each customer problem.', status: 'ready', priority: 'high', category: 'college', scheduledDate: null, deadline: null, durationMinutes: 30, timerType: 'standard', nextStep: 'Open Week 3 Lean Canvas and draft the three Solutions entries first.', waitingOn: '', projectId: null, createdAt: now, completedAt: null },
        { id: 'task_entr210_w4', title: 'ENTR210 W4: Review Who Is to Blame? prompt + rubric', description: 'Establish the exact Week 4 deliverable before drafting.', status: 'ready', priority: 'high', category: 'college', scheduledDate: null, deadline: null, durationMinutes: 30, timerType: 'standard', nextStep: 'Review the Week 4 prompt and rubric and identify the required response, format, and grading criteria.', waitingOn: '', projectId: null, createdAt: now + 1, completedAt: null },
        { id: 'task_entr150_replies', title: 'ENTR150 W3: Check and complete two discussion replies', description: 'Initial post is submitted; replies were not yet confirmed complete.', status: 'ready', priority: 'normal', category: 'college', scheduledDate: null, deadline: null, durationMinutes: 30, timerType: 'standard', nextStep: 'Open the discussion and complete two substantive replies if still required.', waitingOn: '', projectId: null, createdAt: now + 2, completedAt: null },
        { id: 'task_spanish', title: 'Practice Spanish', description: 'One focused practice block.', status: 'ready', priority: 'low', category: 'personal', scheduledDate: null, deadline: null, durationMinutes: 30, timerType: 'standard', nextStep: 'Choose the current lesson or practice activity.', waitingOn: '', projectId: null, createdAt: now + 3, completedAt: null },
        { id: 'task_living_world', title: 'Continue The Living World', description: 'Continue development of the existing game.', status: 'ready', priority: 'normal', category: 'game', scheduledDate: null, deadline: null, durationMinutes: 30, timerType: 'standard', nextStep: 'Continue from the latest saved development step.', waitingOn: '', projectId: 'proj_living_world', createdAt: now + 4, completedAt: null },
        { id: 'task_loc_site', title: "Continue Laurel's Organized Chaos website", description: 'Continue the witchy scrapbook website build.', status: 'ready', priority: 'normal', category: 'business', scheduledDate: null, deadline: null, durationMinutes: 30, timerType: 'standard', nextStep: 'Resume the current website build from its saved state.', waitingOn: '', projectId: 'proj_loc', createdAt: now + 5, completedAt: null }
      ],
      dailyEntries: {
        [today]: {
          date: today, energy: 'medium', moodTags: [], currentActivity: '', nextActivity: '', currentPriorities: '', completedActivities: [], unfinishedActivities: [], smallWin: '', whatHelped: '', whatDrainedMe: '', notes: ''
        }
      },
      routineAnchors: [
        { id: 'anchor_morning', name: 'Early Morning', startTime: '05:00', endTime: '07:20', durationMinutes: null, type: 'anchor', description: "Tyler's work prep, me time, kids as they wake, and time together before he leaves.", order: 1, icon: '🌅' },
        { id: 'anchor_breakfast', name: 'Breakfast', startTime: '08:00', endTime: '09:00', durationMinutes: 60, type: 'meal', description: 'Breakfast + everyday household chores can live here.', order: 2, icon: '🥣' },
        { id: 'anchor_lunch', name: 'Lunch', startTime: '12:00', endTime: '13:00', durationMinutes: 60, type: 'meal', description: 'Lunch + everyday household chores can live here.', order: 3, icon: '🍽️' },
        { id: 'anchor_dinner', name: 'Dinner', startTime: '17:00', endTime: '18:00', durationMinutes: 60, type: 'meal', description: 'Dinner + everyday household chores can live here.', order: 4, icon: '🍲' },
        { id: 'anchor_bedtime', name: "Kids' Bedtime", startTime: '19:00', endTime: '20:00', durationMinutes: 60, type: 'bedtime', description: "Kids' bedtime routine.", order: 5, icon: '🌙' }
      ],
      schoolAssignments: [
        { id: 'school_150_w3_canvas', course: 'ENTR150', title: 'Week 3 Lean Canvas: Business Idea, Problems & Existing Alternatives', status: 'submitted', dueDate: null, submissionStatus: 'Submitted September 25, 2026', gradeOutcome: '', feedback: '', nextWritingStep: 'None unless instructor feedback requires revision.', notes: 'The Living World venture.' },
        { id: 'school_150_w3_discussion', course: 'ENTR150', title: 'Week 3 Discussion: Arnold Schwarzenegger Bricklaying Opportunity', status: 'in-progress', dueDate: null, submissionStatus: 'Initial post submitted September 27, 2026; two replies not yet confirmed complete.', gradeOutcome: '', feedback: '', nextWritingStep: 'Complete two substantive replies if they are still required and accepted.', notes: '' },
        { id: 'school_150_w4_canvas', course: 'ENTR150', title: 'Week 4 Lean Canvas: Solutions, Key Metrics, UVP & HLC', status: 'planned', dueDate: null, submissionStatus: 'Not submitted', gradeOutcome: '', feedback: '', nextWritingStep: 'Draft the three Solutions entries first.', notes: 'Do not invent a due date.' },
        { id: 'school_210_w3_ethics', course: 'ENTR210', title: 'Week 3 Code of Ethics for Redneck Solutions LLC', status: 'submitted', dueDate: null, submissionStatus: 'Submitted September 25, 2026', gradeOutcome: '', feedback: '', nextWritingStep: 'Wait for instructor grade or feedback.', notes: '' },
        { id: 'school_210_w4_blame', course: 'ENTR210', title: 'Week 4 Who Is to Blame? / Ethical Decision Making', status: 'planned', dueDate: null, submissionStatus: 'Not submitted', gradeOutcome: '', feedback: '', nextWritingStep: 'Review the prompt and rubric before drafting.', notes: 'Do not invent a due date.' }
      ],
      projects: [
        { id: 'proj_living_world', name: 'The Living World', area: 'Game', status: 'active', priority: 'normal', currentPhase: 'Existing tested application; live AI/provider and experience expansion in progress.', nextAction: 'Continue from the latest saved development step without rebuilding working features.', progressPercent: 40, notes: '' },
        { id: 'proj_loc', name: "Laurel's Organized Chaos", area: 'Brand', status: 'active', priority: 'normal', currentPhase: 'Brand relaunch + planner + website rebuild.', nextAction: 'Continue the website while using this planner as the operating hub.', progressPercent: 35, notes: '' },
        { id: 'proj_redneck', name: 'Redneck Solutions LLC', area: 'Business', status: 'active', priority: 'normal', currentPhase: 'Existing LLC/business foundation; moving toward fuller operations.', nextAction: 'Clarify current service offers and the next concrete client or launch action.', progressPercent: 25, notes: '' }
      ],
      brainDumps: [],
      ideas: [
        { id: 'idea_mommysitters', title: "The MommySitters Club", zone: 'incubate', notes: 'Mom childcare exchange circles where moms take turns watching each other’s kids.', createdAt: now }
      ],
      memories: [],
      favorites: [],
      decorations: [],
      home: { notes: '', groceries: [], householdProjects: [] },
      weeklyReviews: {},
      timer: { running: false, paused: false, endAt: null, remainingMs: 0, durationMinutes: 30, taskId: null },
      ui: { calendarMonth: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`, scrapbookFavoritesOnly: false, dashboardOrder: [...DASHBOARD_WIDGETS], dashboardEditMode: false, plannerEditMode: false, todaySectionOrder: [...TODAY_SECTIONS], scrapbookBoardMode: false, scrapbookPositions: {}, monthNotes: {} }
    };
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function stringValue(value, fallback = '') {
    return typeof value === 'string' ? value : fallback;
  }

  function finiteNumber(value, fallback = 0) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  function objectArray(value, fallback = []) {
    return Array.isArray(value) ? value.filter(isPlainObject) : fallback.map(item => ({ ...item }));
  }

  function normalizeDailyEntries(value, freshEntries) {
    const source = isPlainObject(value) ? value : freshEntries;
    const result = {};
    for (const [key, entry] of Object.entries(source)) {
      if (!isPlainObject(entry)) continue;
      result[key] = {
        date: stringValue(entry.date, key),
        energy: ENERGY.includes(entry.energy) ? entry.energy : 'medium',
        moodTags: Array.isArray(entry.moodTags) ? entry.moodTags.filter(tag => MOODS.includes(tag)) : [],
        currentActivity: stringValue(entry.currentActivity),
        nextActivity: stringValue(entry.nextActivity),
        currentPriorities: stringValue(entry.currentPriorities),
        completedActivities: Array.isArray(entry.completedActivities) ? entry.completedActivities.filter(item => typeof item === 'string') : [],
        unfinishedActivities: Array.isArray(entry.unfinishedActivities) ? entry.unfinishedActivities.filter(item => typeof item === 'string') : [],
        smallWin: stringValue(entry.smallWin),
        whatHelped: stringValue(entry.whatHelped),
        whatDrainedMe: stringValue(entry.whatDrainedMe),
        notes: stringValue(entry.notes),
      };
    }
    return Object.keys(result).length ? result : { ...freshEntries };
  }

  function normalizeWeeklyReviews(value) {
    if (!isPlainObject(value)) return {};
    const result = {};
    for (const [key, review] of Object.entries(value)) {
      if (!isPlainObject(review)) continue;
      const top3 = Array.isArray(review.top3)
        ? review.top3.slice(0, 3).map(item => stringValue(item))
        : [];
      while (top3.length < 3) top3.push('');
      result[key] = {
        weekStarting: stringValue(review.weekStarting, key),
        top3,
        schoolFocus: stringValue(review.schoolFocus),
        homeFocus: stringValue(review.homeFocus),
        projectFocus: stringValue(review.projectFocus),
        wins: stringValue(review.wins),
        carryForward: stringValue(review.carryForward),
        notes: stringValue(review.notes),
      };
    }
    return result;
  }

  function normalizeTasks(value, fallback) {
    const source = objectArray(value, fallback);
    return source.map((task, index) => ({
      ...task,
      id: stringValue(task.id, uid('task')),
      title: stringValue(task.title, `Untitled task ${index + 1}`),
      description: stringValue(task.description),
      status: STATUSES.includes(task.status) ? task.status : 'inbox',
      priority: Object.prototype.hasOwnProperty.call(PRIORITY_WEIGHT, task.priority) ? task.priority : 'normal',
      category: stringValue(task.category, 'personal'),
      scheduledDate: typeof task.scheduledDate === 'string' && task.scheduledDate ? task.scheduledDate : null,
      deadline: typeof task.deadline === 'string' && task.deadline ? task.deadline : null,
      durationMinutes: [30, 60].includes(Number(task.durationMinutes)) ? Number(task.durationMinutes) : 30,
      timerType: stringValue(task.timerType, 'standard'),
      nextStep: stringValue(task.nextStep),
      waitingOn: stringValue(task.waitingOn),
      projectId: typeof task.projectId === 'string' && task.projectId ? task.projectId : null,
      createdAt: finiteNumber(task.createdAt, Date.now() + index),
      completedAt: typeof task.completedAt === 'number' && Number.isFinite(task.completedAt) ? task.completedAt : null,
    }));
  }

  function hydrateState(parsed) {
    const fresh = defaultState();
    const source = isPlainObject(parsed) ? parsed : {};

    const settingsSource = isPlainObject(source.settings) ? source.settings : {};
    const settings = {
      ...fresh.settings,
      ...settingsSource,
      themeIntensity: settingsSource.themeIntensity === 'quiet' ? 'quiet' : 'full',
      sound: settingsSource.sound !== false,
      backgroundPreset: BACKGROUND_PRESETS.includes(settingsSource.backgroundPreset) ? settingsSource.backgroundPreset : fresh.settings.backgroundPreset,
      accentTheme: ACCENT_THEMES.includes(settingsSource.accentTheme) ? settingsSource.accentTheme : fresh.settings.accentTheme,
      customBackgroundDataUrl: stringValue(settingsSource.customBackgroundDataUrl),
      heroPhotoDataUrl: stringValue(settingsSource.heroPhotoDataUrl),
      sectionThemes: isPlainObject(settingsSource.sectionThemes) ? { ...settingsSource.sectionThemes } : {},
    };

    const homeSource = isPlainObject(source.home) ? source.home : {};
    const home = {
      ...fresh.home,
      ...homeSource,
      notes: stringValue(homeSource.notes),
      groceries: objectArray(homeSource.groceries).map((item, index) => ({
        ...item,
        id: stringValue(item.id, `grocery_${index}`),
        title: stringValue(item.title, 'Untitled item'),
        done: item.done === true,
      })),
      householdProjects: objectArray(homeSource.householdProjects),
    };

    const timerSource = isPlainObject(source.timer) ? source.timer : {};
    const timer = {
      ...fresh.timer,
      running: timerSource.running === true,
      paused: timerSource.paused === true,
      endAt: typeof timerSource.endAt === 'number' && Number.isFinite(timerSource.endAt) ? timerSource.endAt : null,
      remainingMs: Math.max(0, finiteNumber(timerSource.remainingMs, fresh.timer.remainingMs)),
      durationMinutes: [30, 60].includes(Number(timerSource.durationMinutes)) ? Number(timerSource.durationMinutes) : 30,
      taskId: typeof timerSource.taskId === 'string' && timerSource.taskId ? timerSource.taskId : null,
    };
    if (timer.running && !timer.paused && !timer.endAt) {
      timer.endAt = Date.now() + timer.remainingMs;
    }

    const uiSource = isPlainObject(source.ui) ? source.ui : {};
    const dashboardOrder = Array.isArray(uiSource.dashboardOrder)
      ? uiSource.dashboardOrder.filter(id => DASHBOARD_WIDGETS.includes(id))
      : [];
    const todaySectionOrder = Array.isArray(uiSource.todaySectionOrder)
      ? uiSource.todaySectionOrder.filter(id => TODAY_SECTIONS.includes(id))
      : [];
    const calendarMonth = typeof uiSource.calendarMonth === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(uiSource.calendarMonth)
      ? uiSource.calendarMonth
      : fresh.ui.calendarMonth;
    const ui = {
      ...fresh.ui,
      ...uiSource,
      calendarMonth,
      scrapbookFavoritesOnly: uiSource.scrapbookFavoritesOnly === true,
      dashboardOrder: [...new Set([...dashboardOrder, ...DASHBOARD_WIDGETS])],
      dashboardEditMode: uiSource.dashboardEditMode === true,
      plannerEditMode: uiSource.plannerEditMode === true,
      todaySectionOrder: [...new Set([...todaySectionOrder, ...TODAY_SECTIONS])],
      scrapbookBoardMode: uiSource.scrapbookBoardMode === true,
      scrapbookPositions: isPlainObject(uiSource.scrapbookPositions) ? { ...uiSource.scrapbookPositions } : {},
      monthNotes: isPlainObject(uiSource.monthNotes) ? { ...uiSource.monthNotes } : {},
    };

    return {
      version: 1,
      settings,
      tasks: normalizeTasks(source.tasks, fresh.tasks),
      dailyEntries: normalizeDailyEntries(source.dailyEntries, fresh.dailyEntries),
      routineAnchors: objectArray(source.routineAnchors, fresh.routineAnchors),
      schoolAssignments: objectArray(source.schoolAssignments, fresh.schoolAssignments),
      projects: objectArray(source.projects, fresh.projects),
      brainDumps: objectArray(source.brainDumps),
      ideas: objectArray(source.ideas),
      memories: objectArray(source.memories),
      favorites: objectArray(source.favorites),
      decorations: objectArray(source.decorations),
      home,
      weeklyReviews: normalizeWeeklyReviews(source.weeklyReviews),
      timer,
      ui,
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1) return defaultState();
      return hydrateState(parsed);
    } catch (err) {
      console.warn('Could not load planner data', err);
      return defaultState();
    }
  }

  function saveState({ render = false } = {}) {
    let saved = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      saved = false;
      console.error('Could not save planner data', err);
      toast('Browser storage is full. Export a backup and remove a few large photos or backgrounds.');
    }
    applyTheme();
    if (render) renderApp();
    return saved;
  }

  function ensureToday() {
    const key = isoDateLocal();
    if (!state.dailyEntries[key]) {
      state.dailyEntries[key] = { date: key, energy: 'medium', moodTags: [], currentActivity: '', nextActivity: '', currentPriorities: '', completedActivities: [], unfinishedActivities: [], smallWin: '', whatHelped: '', whatDrainedMe: '', notes: '' };
      saveState();
    }
    return state.dailyEntries[key];
  }

  function getWeekKey(date = new Date()) {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return isoDateLocal(d);
  }

  function ensureWeek() {
    const key = getWeekKey();
    if (!state.weeklyReviews[key]) {
      state.weeklyReviews[key] = { weekStarting: key, top3: ['', '', ''], schoolFocus: '', homeFocus: '', projectFocus: '', wins: '', carryForward: '', notes: '' };
      saveState();
    }
    return state.weeklyReviews[key];
  }

  function route() {
    const raw = location.hash.replace(/^#/, '') || 'cover';
    if (raw === 'cover') return 'cover';
    return ROUTES.some(r => r[0] === raw) ? raw : 'dashboard';
  }

  function setRoute(next) {
    if (location.hash === `#${next}`) renderApp();
    else location.hash = next;
  }

  function applyTheme() {
    document.body.classList.toggle('cover-mode', route() === 'cover');
    document.body.classList.toggle('quieter', state.settings.themeIntensity === 'quiet');
    document.body.dataset.background = state.settings.backgroundPreset || 'black-paper';
    const pageAccent = state.settings.sectionThemes?.[route()] || state.settings.accentTheme || 'pink';
    document.body.dataset.accent = pageAccent;
    document.body.classList.toggle('has-custom-background', Boolean(state.settings.customBackgroundDataUrl));
    if (state.settings.customBackgroundDataUrl) document.body.style.setProperty('--custom-bg-image', `url("${state.settings.customBackgroundDataUrl.replaceAll('\"','%22')}")`);
    else document.body.style.removeProperty('--custom-bg-image');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = state.settings.themeIntensity === 'quiet' ? 'Full Chaos' : 'Quieter Chaos';
  }

  function navHtml() {
    const active = route();
    return ROUTES.map(([id, icon, label]) => `
      <button class="nav-link ${id === active ? 'active' : ''}" data-route="${id}" type="button">
        <span class="nav-icon">${icon}</span><span>${label}</span>
      </button>`).join('');
  }

  function renderApp() {
    ensureToday();
    document.getElementById('main-nav').innerHTML = navHtml();
    const content = document.getElementById('main-content');
    const current = route();
    const renderers = {
      cover: renderCover, dashboard: renderDashboard, today: renderToday, week: renderWeek, calendar: renderCalendar,
      school: renderSchool, projects: renderProjects, home: renderHome, brain: renderBrain,
      goals: renderGoals, scrapbook: renderScrapbook, settings: renderSettings
    };
    if (current === 'cover') {
      content.innerHTML = `<div class="cover-page-shell">${renderCover()}</div>`;
    } else {
      content.innerHTML = `<div class="page">${renderers[current]()}</div>${renderDecorationLayer(current)}${plannerEditToolbar(current)}`;
    }
    content.focus({ preventScroll: true });
    applyTheme();
    syncTimerTicker();
  }

  function renderCover() {
    return `
      <section class="antique-cover-stage" aria-label="Laurel's Organized Chaos book cover">
        <div class="antique-book-cover">
          <div class="cover-spine" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span>
          </div>

          <div class="metal-corner corner-tl" aria-hidden="true"></div>
          <div class="metal-corner corner-tr" aria-hidden="true"></div>
          <div class="metal-corner corner-bl" aria-hidden="true"></div>
          <div class="metal-corner corner-br" aria-hidden="true"></div>

          <div class="embossed-frame frame-outer" aria-hidden="true"></div>
          <div class="embossed-frame frame-inner" aria-hidden="true"></div>

          <div class="cover-ornament ornament-top" aria-hidden="true">❦</div>
          <div class="cover-title-block">
            <span class="cover-kicker">The Private Volume of</span>
            <h1>Laurel’s<br><span>Organized Chaos</span></h1>
            <div class="cover-divider"><i></i><b>✦</b><i></i></div>
            <p>Book of Daily Order &amp; Domestic Sorcery</p>
          </div>

          <div class="cover-emblem" aria-hidden="true">
            <svg viewBox="0 0 320 320" role="presentation">
              <circle cx="160" cy="160" r="124" class="emblem-ring"/>
              <circle cx="160" cy="160" r="105" class="emblem-ring inner"/>
              <path class="emblem-moon" d="M187 73c-55 15-79 72-54 119 17 32 55 49 91 35-37 37-99 35-134-7-41-50-21-127 39-151 18-7 39-7 58 4z"/>
              <path class="emblem-crow" d="M106 210c20-26 38-41 62-44 8-22 24-38 46-38 17 0 31 7 42 20l26 5-23 13c-7 22-27 34-48 31-8 18-24 31-42 37 25 0 45 5 62 15H92c5-14 9-27 14-39z"/>
              <path class="emblem-star" d="M95 105l5 14 14 5-14 5-5 14-5-14-14-5 14-5z"/>
              <path class="emblem-star small" d="M241 86l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/>
              <path class="emblem-star tiny" d="M233 219l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>
              <path class="emblem-vine" d="M70 246c36 22 72 28 109 17 31-9 54-25 72-48M78 238c-2-15-9-25-20-32M91 246c-1-14 3-25 13-34M239 224c8-12 17-19 30-22M225 238c10-8 14-19 12-32"/>
            </svg>
          </div>

          <div class="cover-inscription">Private Book of Laurel Webb</div>

          <button class="cover-open-plaque" data-route="dashboard" type="button" aria-label="Open the Book">
            <span>Open the Book</span>
          </button>

          <div class="cover-ribbon" aria-hidden="true"></div>
          <div class="cover-clasp" aria-hidden="true"><span></span></div>
        </div>
      </section>
    `;
  }

  function currentAnchor() {
    const now = new Date();
    const min = now.getHours() * 60 + now.getMinutes();
    return state.routineAnchors.find(a => min >= timeToMinutes(a.startTime) && min < timeToMinutes(a.endTime)) || null;
  }

  function nextAnchor() {
    const now = new Date();
    const min = now.getHours() * 60 + now.getMinutes();
    const next = state.routineAnchors.find(a => timeToMinutes(a.startTime) > min);
    return next || state.routineAnchors[0];
  }

  function openTasks() {
    return state.tasks.filter(t => OPEN_STATUSES.has(t.status));
  }

  function recommendedTask() {
    return openTasks()
      .filter(t => t.durationMinutes === 30 && !['waiting', 'postponed'].includes(t.status))
      .sort((a,b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] || a.createdAt - b.createdAt)[0] || null;
  }

  function completedToday() {
    const today = isoDateLocal();
    return state.tasks.filter(t => t.status === 'complete' && t.completedAt && isoDateLocal(new Date(t.completedAt)) === today);
  }

  function sectionTitle(icon, title, sub = '') {
    return `<div class="section-title"><h2>${icon} ${escapeHtml(title)}</h2></div>${sub ? `<p class="muted small">${escapeHtml(sub)}</p>` : ''}`;
  }

  function witchArtwork(kind = 'crow') {
    if (kind === 'owl') {
      return `<svg class="witch-art witch-art-owl" viewBox="0 0 180 180" aria-hidden="true">
        <path d="M58 58 L46 30 L72 47 Q90 36 108 47 L134 30 L122 58 Q139 77 135 106 Q131 143 90 155 Q49 143 45 106 Q41 77 58 58Z" fill="none" stroke="currentColor" stroke-width="3"/>
        <circle cx="72" cy="86" r="18" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="108" cy="86" r="18" fill="none" stroke="currentColor" stroke-width="3"/>
        <circle cx="72" cy="86" r="5" fill="currentColor"/><circle cx="108" cy="86" r="5" fill="currentColor"/>
        <path d="M90 91 l-8 10 h16z M67 124 Q90 139 113 124" fill="none" stroke="currentColor" stroke-width="3"/>
      </svg>`;
    }
    if (kind === 'moon') {
      return `<svg class="witch-art witch-art-moon" viewBox="0 0 180 180" aria-hidden="true">
        <path d="M113 24 Q66 38 66 91 Q66 139 112 156 Q58 160 34 119 Q10 76 39 42 Q68 8 113 24Z" fill="none" stroke="currentColor" stroke-width="4"/>
        <path d="M132 48 l4 10 10 4-10 4-4 10-4-10-10-4 10-4z M136 105 l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="currentColor"/>
      </svg>`;
    }
    return `<svg class="witch-art witch-art-crow" viewBox="0 0 220 160" aria-hidden="true">
      <path d="M37 125 Q72 116 101 119 Q122 95 130 72 Q136 52 154 48 Q176 45 191 61 L211 65 L191 75 Q177 91 160 89 Q154 115 132 127 Q164 128 187 136 H40Z" fill="currentColor" opacity=".95"/>
      <path d="M125 83 Q93 67 67 49 Q84 82 104 101 M116 95 Q81 91 54 76 Q77 106 104 118" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
      <circle cx="166" cy="61" r="2.8" fill="#ff2aa3"/>
    </svg>`;
  }

  function dashboardWidget(id, title, icon, body, extra = '') {
    const editable = state.ui.dashboardEditMode || state.ui.plannerEditMode;
    return `<article class="dashboard-widget ${extra} ${editable ? 'layout-editing' : ''}" data-dashboard-widget="${id}" draggable="${editable ? 'true' : 'false'}">
      <div class="widget-topline">
        <div class="widget-label"><span>${icon}</span><strong>${escapeHtml(title)}</strong></div>
        ${editable ? `<div class="widget-move"><span class="drag-handle" title="Drag to move">⋮⋮</span><button class="mini-icon" data-action="move-widget-up" data-id="${id}" type="button" aria-label="Move ${escapeHtml(title)} up">↑</button><button class="mini-icon" data-action="move-widget-down" data-id="${id}" type="button" aria-label="Move ${escapeHtml(title)} down">↓</button></div>` : ''}
      </div>
      ${body}
    </article>`;
  }

  function monthMood(month) {
    return MONTH_MOODS[month] || MONTH_MOODS[1];
  }

  function renderDashboard() {
    const day = ensureToday();
    const next = nextAnchor();
    const task = recommendedTask();
    const school = state.schoolAssignments.filter(a => ['planned', 'in-progress', 'ready-to-submit'].includes(a.status)).slice(0, 3);
    const projects = state.projects.filter(p => p.status === 'active').slice(0, 3);
    const groceryCount = Array.isArray(state.home.groceries) ? state.home.groceries.filter(item => !item.done).length : 0;
    const homeNote = state.home.notes ? state.home.notes.trim() : '';
    const priority = day.currentPriorities || (task ? task.title : 'Choose the one thing that matters most.');
    const current = day.currentActivity || 'Nothing recorded yet. The page is waiting.';
    const nextActivity = day.nextActivity || (task ? task.title : 'Choose the next small thing.');
    const energyMark = ({ low: '☾', medium: '◐', high: '✦', variable: '↯' })[day.energy] || '◐';

    const widgetBodies = {
      now: dashboardWidget('now', 'Current Focus', '☾', `
        <div class="grimoire-focus-grid">
          <section class="current-focus-parchment">
            <div class="ink-heading"><span>✦</span><strong>At This Moment</strong><span>✦</span></div>
            <div class="focus-hand-line"><span class="focus-label">current</span><strong>${escapeHtml(current)}</strong></div>
            <div class="focus-hand-line"><span class="focus-label">next</span><strong>${escapeHtml(nextActivity)}</strong></div>
            <div class="focus-hand-line"><span class="focus-label">priority</span><strong>${escapeHtml(priority)}</strong></div>
            <div class="focus-marks">
              <span title="Energy">energy ${energyMark} ${escapeHtml(day.energy || 'medium')}</span>
              <span>next anchor ${next.icon} ${escapeHtml(next.name)} · ${escapeHtml(next.startTime)}</span>
            </div>
            <button class="ink-link" data-route="today" type="button">write on today's page →</button>
          </section>
          <section class="today-pull-card">
            <span class="tarot-number">TODAY'S PULL</span>
            <span class="tarot-corners">☾</span>
            <div class="pull-sigil">✦</div>
            ${task ? `
              <small>${escapeHtml(task.category || 'next thing')} · ${task.durationMinutes || 30} min</small>
              <strong>${escapeHtml(task.title)}</strong>
              <p>${escapeHtml(task.nextStep || task.description || 'Start with the smallest visible step.')}</p>
              <button class="ritual-button" data-action="start-task" data-id="${task.id}" type="button">Do the Damn Thing</button>
            ` : `
              <small>the deck is suspiciously quiet</small>
              <strong>No ready 30-minute task.</strong>
              <p>Pick something useful, tiny, or gloriously overdue.</p>
              <button class="ritual-button" data-action="quick-task" type="button">Write a New Spell</button>
            `}
            <div class="tarot-footer">☾ · ✦ · ☾</div>
          </section>
        </div>`, 'widget-wide widget-focus'),

      planner: dashboardWidget('planner', 'Open the Grimoire', '✦', `
        <div class="tarot-nav-grid grimoire-nav-grid">
          ${scrapLink('🖤', "Today's Page", 'The page currently happening.', 'today', 'I')}
          ${scrapLink('🌙', 'Week at a Glance', 'Top three, carry-forward, reality.', 'week', 'II')}
          ${scrapLink('☾', 'Moon Calendar', 'Dates with consequences.', 'calendar', 'III')}
          ${scrapLink('📚', 'Study Spells', 'Courses, assignments, due dates.', 'school', 'IV')}
          ${scrapLink('🧪', 'Works in Progress', 'Projects, experiments, ventures.', 'projects', 'V')}
          ${scrapLink('🏠', 'Household Matters', 'Home notes, groceries, routines.', 'home', 'VI')}
          ${scrapLink('🧠', 'Chaotic Thoughts', 'Catch it before it escapes.', 'brain', 'VII')}
          ${scrapLink('📸', 'Memory Pages', 'Proof life happened off-list.', 'scrapbook', 'VIII')}
        </div>`, 'widget-wide widget-grimoire-nav'),

      school: dashboardWidget('school', 'Study Spells', '📚', `
        <div class="grimoire-section-note">things currently haunting the academic desk</div>
        <div class="stacked-clippings spell-study-stack">
          ${school.length ? school.map((a, i) => `<article class="school-clipping ${a.course === 'ENTR150' ? 'clip-blue' : 'clip-purple'}" style="--tilt:${i % 2 ? '.7deg' : '-.7deg'}"><span class="tag">${a.course}</span><strong>${escapeHtml(a.title)}</strong><small>${escapeHtml(a.nextWritingStep || 'Open it and find the next visible step.')}</small></article>`).join('') : `<div class="empty-ink-note">No open school work. Suspicious, but acceptable.</div>`}
        </div>
        <button class="ink-link" data-route="school" type="button">open the study pages →</button>`, 'widget-school'),

      projects: dashboardWidget('projects', 'Works in Progress', '🧪', `
        <div class="grimoire-section-note">experiments currently bubbling on the workbench</div>
        <div class="mini-project-stack spell-project-stack">
          ${projects.length ? projects.map(p => `<button class="project-ticket alchemy-ticket" data-route="projects" type="button"><span>${escapeHtml(p.name)}</span><div class="progress"><span style="width:${Math.max(0,Math.min(100,p.progressPercent||0))}%"></span></div><small>${p.progressPercent || 0}% · ${escapeHtml(p.nextAction || 'Choose a next action.')}</small></button>`).join('') : '<div class="empty-ink-note">No active experiments.</div>'}
        </div>`, 'widget-projects'),

      home: dashboardWidget('home', 'Household Matters', '🏠', `
        <div class="household-ledger">
          <div class="ledger-flourish">❦ household ledger ❦</div>
          <div class="ledger-row"><span>next family anchor</span><strong>${next.icon} ${escapeHtml(next.name)} · ${escapeHtml(next.startTime)}</strong></div>
          <div class="ledger-row"><span>groceries waiting</span><strong>${groceryCount}</strong></div>
          <div class="ledger-row ledger-note"><span>note from home</span><strong>${escapeHtml(homeNote || 'Nothing scribbled here yet.')}</strong></div>
          <button class="ink-link" data-route="home" type="button">open household pages →</button>
        </div>`, 'widget-home'),

      void: dashboardWidget('void', 'Notes from the Void', '🧠', `
        <div class="void-paper">
          <div class="void-margin-note">put it here before your brain throws it into traffic ↘</div>
          <div class="journal-doodle">↯ ✦ ☾</div>
          <textarea id="dashboard-brain" aria-label="Quick brain dump" placeholder="scribble the thought before it escapes..."></textarea>
          <button class="ritual-button small-ritual" data-action="save-dashboard-brain" type="button">Trap It in the Book</button>
        </div>`, 'widget-wide widget-void'),

      progress: dashboardWidget('progress', 'Small Victories', '✨', `
        <div class="victory-scrap">
          <div class="victory-count"><strong>${completedToday().length}</strong><span>things crossed off today</span></div>
          <div class="victory-note">
            <span>today's proof of life</span>
            <strong>${escapeHtml(day.smallWin || 'Write down one thing that counted.')}</strong>
          </div>
          <div class="victory-footnote">${openTasks().length} open tasks still exist. They have survived worse.</div>
          <button class="ink-link" data-route="today" type="button">add a small win →</button>
        </div>`, 'widget-progress')
    };

    return `
      <div class="dashboard-grimoire">
        <section class="grimoire-title-spread">
          <div class="book-page book-page-left">
            <span class="grimoire-eyebrow">Laurel's personal book of</span>
            <h1><span>Organized</span><span>Chaos</span></h1>
            <div class="ink-divider"><span>☾</span><i></i><span>✦</span><i></i><span>☾</span></div>
            <p class="grimoire-subtitle">A Grimoire for Daily Survival, Family Chaos, Schoolwork, and Mild Domestic Sorcery.</p>
            <div class="title-spread-actions">
              <button class="ritual-button" data-route="today" type="button">Open Today's Page</button>
              <button class="ink-link title-quick-link" data-action="quick-task" type="button">＋ scribble a quick task</button>
            </div>
            <div class="margin-scribble scribble-left">magic = timers + actually writing it down</div>
            <div class="page-star star-a">✦</div>
            <div class="page-star star-b">⋆</div>
          </div>

          <div class="book-page book-page-right">
            <div class="title-moon-sketch">${witchArtwork('moon')}</div>
            <div class="title-date-note">
              <span>today's page</span>
              <strong>${formatDate(new Date(), { weekday:'long', month:'long', day:'numeric' })}</strong>
              <small>organized enough to function.<br>chaotic enough to still be mine.</small>
            </div>
            <div class="title-familiar title-crow">${witchArtwork('crow')}</div>
            <div class="title-familiar title-owl">${witchArtwork('owl')}</div>
            <div class="wax-seal" aria-hidden="true"><span>☾</span></div>
            <div class="margin-scribble scribble-right">don't forget dinner, witch.</div>
            <div class="pink-ink-arrow">↙</div>
          </div>
        </section>

        <div class="dashboard-toolbar grimoire-toolbar">
          <div>
            <strong>Arrange the pages</strong>
            <span class="muted small">${state.ui.dashboardEditMode ? 'Drag the scraps or use ↑ ↓. The book remembers.' : 'Everything below can still be rearranged.'}</span>
          </div>
          <div class="toolbar-actions">
            <button class="btn ghost small-btn handwritten-control" data-action="toggle-dashboard-edit" type="button">${state.ui.dashboardEditMode ? '✓ Close the binding table' : '✣ Rearrange the scraps'}</button>
            ${state.ui.dashboardEditMode ? `<button class="btn ghost small-btn handwritten-control" data-action="reset-dashboard-layout" type="button">Put it back</button>` : ''}
          </div>
        </div>

        <section class="dashboard-board grimoire-board ${state.ui.dashboardEditMode ? 'editing' : ''}" id="dashboard-board">
          ${state.ui.dashboardOrder.map(id => widgetBodies[id] || '').join('')}
        </section>
      </div>
    `;
  }
  function scrapLink(icon, title, text, target, number = '✦') {
    return `<button class="tarot-link" data-route="${target}" type="button"><span class="tarot-number">${number}</span><span class="tarot-corners">✦</span><span class="big-icon">${icon}</span><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span><span class="tarot-footer">☾ · ✦ · ☾</span></button>`;
  }

  function plannerSection(page, id, title, body, extra = '') {
    const editable = state.ui.plannerEditMode;
    return `<section class="planner-section ${extra} ${editable ? 'planner-section-editing' : ''}" data-page-section="${id}" data-page="${page}" draggable="${editable ? 'true' : 'false'}">
      ${editable ? `<div class="section-edit-strip"><span class="drag-handle">⋮⋮</span><strong>${escapeHtml(title)}</strong><div><button class="mini-icon" data-action="move-page-section-up" data-page="${page}" data-id="${id}" type="button">↑</button><button class="mini-icon" data-action="move-page-section-down" data-page="${page}" data-id="${id}" type="button">↓</button></div></div>` : ''}
      ${body}
    </section>`;
  }

  function renderToday() {
    const day = ensureToday();
    const active = currentAnchor();
    const next = nextAnchor();
    const tasks = openTasks().filter(t => t.durationMinutes === 30).sort((a,b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]).slice(0, 8);
    const bodies = {
      overview: plannerSection('today', 'overview', 'Today Overview', `
        <section class="today-title-spread">
          <div class="today-date-stamp"><span>${formatDate(new Date(), { weekday:'long' })}</span><strong>${new Date().getDate()}</strong><em>${formatDate(new Date(), { month:'long', year:'numeric' })}</em></div>
          <div class="today-title-note"><span class="handwritten-kicker">only today gets to be</span><h1>TODAY</h1><p>Yesterday may submit paperwork if it objects.</p></div>
          <div class="today-moon-art">${witchArtwork('moon')}</div>
        </section>
        <section class="today-overview-grid">
          <article class="mood-polaroid">
            <div class="polaroid-label">ENERGY</div>
            <div class="energy-picker">${ENERGY.map(e => `<button class="energy-btn ${day.energy === e ? 'selected' : ''}" data-action="set-energy" data-value="${e}" type="button">${escapeHtml(cap(e))}</button>`).join('')}</div>
            <div class="polaroid-label mood-label">MOOD & MAYHEM</div>
            <div class="mood-row">${MOODS.map(m => `<button class="mood-chip ${day.moodTags.includes(m) ? 'selected' : ''}" data-action="toggle-mood" data-value="${m}" type="button">${escapeHtml(m)}</button>`).join('')}</div>
          </article>
          <article class="focus-paper torn-paper">
            <span class="paper-pin">✦</span>
            <label>Current activity<input data-day-field="currentActivity" value="${escapeHtml(day.currentActivity)}" placeholder="What are you doing now?"></label>
            <label>Next activity<input data-day-field="nextActivity" value="${escapeHtml(day.nextActivity)}" placeholder="What comes next?"></label>
            <label>What actually matters today<textarea data-day-field="currentPriorities" placeholder="The priorities that deserve oxygen...">${escapeHtml(day.currentPriorities)}</textarea></label>
          </article>
          <article class="today-compass tarot-card-panel">
            <span class="tarot-number">✦</span><div class="compass-art">${witchArtwork('owl')}</div>
            <small>CURRENT ANCHOR</small><strong>${active ? `${active.icon} ${escapeHtml(active.name)}` : 'Between anchors'}</strong>
            <hr><small>NEXT ANCHOR</small><strong>${next.icon} ${escapeHtml(next.name)}</strong><span>${escapeHtml(next.startTime)}</span>
          </article>
        </section>`),
      anchors: plannerSection('today', 'anchors', 'Five Anchors', `
        ${sectionTitle('⏰', 'Five Anchors', 'Everything else can orbit them. Missed blocks do not become debt.')}
        <div class="anchor-ribbon">${state.routineAnchors.map((a, i) => `<article class="anchor-ticket ${active?.id === a.id ? 'active' : ''}" style="--ticket-tilt:${i%2 ? '.5deg' : '-.5deg'}"><div class="anchor-icon">${a.icon}</div><div class="time">${a.startTime}</div><div class="name">${escapeHtml(a.name)}</div><div class="desc">${escapeHtml(a.description)}</div>${a.durationMinutes ? `<span class="timer-stamp">${a.durationMinutes} MIN</span>` : `<span class="timer-stamp no-timer">NO SINGLE TIMER</span>`}</article>`).join('')}</div>`),
      workbench: plannerSection('today', 'workbench', 'Focus Workbench', `
        <section class="today-workbench">
          <div class="workbench-tasks">${sectionTitle('▶️', 'Pick One 30-Minute Block', 'One thing gets the spotlight. The rest can cope.')}<div class="journal-card lined-paper">${tasks.length ? tasks.map(taskRow).join('') : empty('🪦', 'No ready 30-minute tasks. Suspiciously peaceful.')}<button class="btn secondary" data-action="quick-task" type="button" style="margin-top:12px">＋ Add Task</button></div></div>
          <div class="workbench-timer">${sectionTitle('⏳', 'Timer')}${timerHtml()}</div>
        </section>`),
      review: plannerSection('today', 'review', 'Review & Small Win', `
        <div class="grid grid-2">
          <article class="card green scrapbook-card"><span class="washi washi-green"></span><h3>✓ Completed Today</h3>${completedToday().length ? completedToday().map(t => `<div class="task-row"><button class="check-btn done" data-action="reopen-task" data-id="${t.id}" type="button">✓</button><div><div class="task-title">${escapeHtml(t.title)}</div><div class="task-meta">${escapeHtml(t.category)}</div></div><span></span></div>`).join('') : `<p class="muted">Nothing checked off yet. This is information, not a moral crisis.</p>`}</article>
          <article class="card blue scrapbook-card"><span class="washi washi-blue"></span><h3>✨ Small Win</h3><textarea data-day-field="smallWin" placeholder="Something worth noticing...">${escapeHtml(day.smallWin)}</textarea><div class="form-grid two" style="margin-top:12px"><label>What helped<textarea data-day-field="whatHelped">${escapeHtml(day.whatHelped)}</textarea></label><label>What drained me<textarea data-day-field="whatDrainedMe">${escapeHtml(day.whatDrainedMe)}</textarea></label></div></article>
        </div>`),
      void: plannerSection('today', 'void', 'Notes from the Void', `${sectionTitle('🕳️', 'Notes from the Void')}<div class="journal-paper"><div class="journal-doodle">☾ ✦ ↯ ✎</div><textarea data-day-field="notes" placeholder="Random notes, observations, annoyances, things that will evaporate if not written down...">${escapeHtml(day.notes)}</textarea></div>`)
    };
    return `${state.ui.plannerEditMode ? `<div class="edit-mode-note">✂️ Edit Planner Mode: drag the section cards, use the arrows, or add stickers. Turn edit mode off when you are done.</div>` : ''}${state.ui.todaySectionOrder.map(id => bodies[id] || '').join('')}`;
  }

  function pageHeader(icon, title, subtitle) {
    return `<section class="page-banner"><div class="banner-paper"><div class="hero-kicker">${icon} Laurel's Organized Chaos</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div><div class="banner-art">${witchArtwork(title === 'Life Scrapbook' ? 'owl' : 'moon')}</div><span class="banner-tape"></span></section>`;
  }

  function taskRow(t) {
    return `<div class="task-row">
      <button class="check-btn ${t.status === 'complete' ? 'done' : ''}" data-action="complete-task" data-id="${t.id}" type="button">${t.status === 'complete' ? '✓' : ''}</button>
      <div>
        <div class="task-title">${escapeHtml(t.title)}</div>
        <div class="task-meta"><span>${escapeHtml(t.category)}</span><span>${t.durationMinutes} min</span><span>${escapeHtml(t.priority)}</span>${t.nextStep ? `<span>→ ${escapeHtml(t.nextStep)}</span>` : ''}</div>
      </div>
      <div class="task-actions"><span class="status-pill ${t.status}">${statusLabel(t.status)}</span><button class="btn blue small-btn" data-action="start-task" data-id="${t.id}" type="button">Start</button><button class="btn ghost small-btn" data-action="edit-task" data-id="${t.id}" type="button">•••</button></div>
    </div>`;
  }

  function timerRemainingMs() {
    if (!state.timer.running) return state.timer.remainingMs || state.timer.durationMinutes * 60000;
    if (state.timer.paused) return state.timer.remainingMs;
    return Math.max(0, state.timer.endAt - Date.now());
  }

  function timerHtml() {
    const task = state.tasks.find(t => t.id === state.timer.taskId);
    const remaining = timerRemainingMs();
    const secs = Math.ceil(remaining / 1000);
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    return `<article class="card timer-card purple">
      <div class="small muted">${state.timer.running ? (state.timer.paused ? 'PAUSED' : 'RUNNING') : 'READY'}</div>
      <div class="timer-time" id="timer-display">${mm}:${ss}</div>
      <div class="timer-task">${task ? escapeHtml(task.title) : 'Choose a task or start a free timer.'}</div>
      <div class="timer-controls">
        <button class="btn" data-action="timer-start-30" type="button">30 min</button>
        <button class="btn secondary" data-action="timer-start-60" type="button">60 min</button>
        ${state.timer.running ? `<button class="btn ghost" data-action="timer-pause" type="button">${state.timer.paused ? 'Resume' : 'Pause'}</button><button class="btn blue" data-action="timer-finish" type="button">Finish</button>` : ''}
        <button class="btn ghost" data-action="timer-reset" type="button">Reset</button>
      </div>
    </article>`;
  }

  function stopTimerTicker() {
    if (!timerInterval) return;
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function syncTimerTicker() {
    stopTimerTicker();
    updateTimerDisplay();
    if (state.timer.running && !state.timer.paused) {
      timerInterval = setInterval(updateTimerDisplay, 1000);
    }
  }

  function updateTimerDisplay() {
    if (!state.timer.running || state.timer.paused) return;
    const remaining = timerRemainingMs();
    const el = document.getElementById('timer-display');
    if (el) {
      const secs = Math.ceil(remaining / 1000);
      el.textContent = `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
    }
    if (remaining <= 0) {
      stopTimerTicker();
      state.timer.running = false;
      state.timer.remainingMs = 0;
      state.timer.endAt = null;
      saveState();
      if (state.settings.sound) beep();
      timerCompletionModal();
      if (route() === 'today') renderApp();
    }
  }

  function startTimer(minutes, taskId = null) {
    const duration = minutes * 60000;
    state.timer = { running: true, paused: false, endAt: Date.now() + duration, remainingMs: duration, durationMinutes: minutes, taskId: taskId || state.timer.taskId || null };
    if (state.timer.taskId) {
      const t = state.tasks.find(x => x.id === state.timer.taskId);
      if (t && ['inbox','ready','postponed'].includes(t.status)) t.status = 'in-progress';
    }
    saveState();
    toast(`${minutes}-minute timer started.`);
    renderApp();
  }

  function pauseResumeTimer() {
    if (!state.timer.running) return;
    if (state.timer.paused) {
      state.timer.endAt = Date.now() + state.timer.remainingMs;
      state.timer.paused = false;
    } else {
      state.timer.remainingMs = timerRemainingMs();
      state.timer.paused = true;
    }
    saveState({ render: true });
  }

  function resetTimer() {
    state.timer = { running: false, paused: false, endAt: null, remainingMs: 30 * 60000, durationMinutes: 30, taskId: null };
    saveState({ render: true });
  }

  function beep() {
    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) return;
      const ctx = new AudioContextCtor();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 720;
      gain.gain.setValueAtTime(.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.addEventListener('ended', () => { void ctx.close().catch(() => {}); }, { once: true });
      osc.start();
      osc.stop(ctx.currentTime + .5);
    } catch (_) {}
  }

  function timerCompletionModal() {
    const t = state.tasks.find(x => x.id === state.timer.taskId);
    openModal('Timer finished', `<div class="card"><p>${t ? `<strong>${escapeHtml(t.title)}</strong>` : 'Your timer is complete.'}</p><p class="muted">Choose what reality says next.</p><div class="grid grid-2"><button class="btn" data-action="timer-choice" data-choice="complete" type="button">✓ Complete</button><button class="btn secondary" data-action="timer-choice" data-choice="another" type="button">↻ Another 30</button><button class="btn blue" data-action="timer-choice" data-choice="switch" type="button">💾 Save & Switch</button><button class="btn ghost" data-action="timer-choice" data-choice="postpone" type="button">⏸ Postpone</button><button class="btn ghost" data-action="timer-choice" data-choice="reprioritize" type="button">🔮 Reprioritize</button></div></div>`);
  }

  function renderWeek() {
    const week = ensureWeek();
    const start = new Date(`${week.weekStarting}T12:00:00`);
    const end = new Date(start); end.setDate(end.getDate() + 6);
    const cols = ['ready','in-progress','waiting','postponed'];
    return `
      ${pageHeader('🌙', 'This Week', `${formatShortDate(week.weekStarting)} – ${formatShortDate(isoDateLocal(end))}. Top priorities first.`)}
      <div class="grid grid-3">
        <article class="card orange"><h3>📚 School Focus</h3><textarea data-week-field="schoolFocus" placeholder="What actually needs school attention?">${escapeHtml(week.schoolFocus)}</textarea></article>
        <article class="card yellow"><h3>🏕️ Home & Family</h3><textarea data-week-field="homeFocus" placeholder="What needs to stay steady?">${escapeHtml(week.homeFocus)}</textarea></article>
        <article class="card green"><h3>🧪 One Project Focus</h3><textarea data-week-field="projectFocus" placeholder="One deliberate lane...">${escapeHtml(week.projectFocus)}</textarea></article>
      </div>
      ${sectionTitle('✦', 'Top 3')}
      <div class="grid grid-3">${week.top3.map((v,i) => `<label class="card pink">${i+1}<input data-week-top="${i}" value="${escapeHtml(v)}" placeholder="Priority ${i+1}"></label>`).join('')}</div>
      ${sectionTitle('🌙', 'Week Board')}
      <div class="kanban">${cols.map(status => `<section class="kanban-col"><h3>${statusLabel(status)}</h3>${state.tasks.filter(t => t.status === status).map(t => `<article class="kanban-card"><strong>${escapeHtml(t.title)}</strong><div class="task-meta">${escapeHtml(t.category)} · ${t.durationMinutes} min</div><select data-action="move-task" data-id="${t.id}">${STATUSES.map(s => `<option value="${s}" ${s===t.status?'selected':''}>${statusLabel(s)}</option>`).join('')}</select></article>`).join('') || `<p class="muted small">Nothing here.</p>`}</section>`).join('')}</div>
      <div class="grid grid-2" style="margin-top:24px">
        <article class="card green"><h3>✨ Weekly Wins</h3><textarea data-week-field="wins" placeholder="What worked?">${escapeHtml(week.wins)}</textarea></article>
        <article class="card purple"><h3>🕯️ Deliberate Carry Forward</h3><textarea data-week-field="carryForward" placeholder="Only what still matters...">${escapeHtml(week.carryForward)}</textarea></article>
      </div>
      ${sectionTitle('🪶', 'Chaos Notes')}
      <div class="note-paper"><textarea data-week-field="notes">${escapeHtml(week.notes)}</textarea></div>
    `;
  }

  function renderCalendar() {
    const [year, month] = state.ui.calendarMonth.split('-').map(Number);
    const first = new Date(year, month - 1, 1);
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    const cells = [];
    const mood = monthMood(month);
    const monthKey = `${year}-${String(month).padStart(2,'0')}`;
    const monthTasks = state.tasks.filter(t => (t.scheduledDate || '').startsWith(monthKey) || (t.deadline || '').startsWith(monthKey));
    const deadlines = monthTasks.filter(t => (t.deadline || '').startsWith(monthKey));
    for (let i=0; i<42; i++) {
      const d = new Date(start); d.setDate(start.getDate()+i);
      const key = isoDateLocal(d);
      const dayTasks = state.tasks.filter(t => t.scheduledDate === key || t.deadline === key);
      cells.push(`<div class="calendar-cell ${d.getMonth() !== month-1 ? 'outside' : ''} ${key === isoDateLocal() ? 'today' : ''}" data-action="calendar-day" data-date="${key}" role="button" tabindex="0"><div class="calendar-num">${d.getDate()}</div>${dayTasks.slice(0,4).map(t => `<div class="cal-item ${t.deadline === key ? 'deadline' : ''}" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</div>`).join('')}${dayTasks.length>4 ? `<div class="muted small">+${dayTasks.length-4} more</div>`:''}</div>`);
    }
    return `
      <section class="month-spread ${mood.className}">
        <aside class="month-collage">
          <div class="month-mark">${mood.mark}</div>
          <span class="handwritten-kicker">monthly spread</span>
          <h1>${escapeHtml(mood.name)}<br><small>${year}</small></h1>
          <p>${escapeHtml(mood.phrase)}</p>
          <div class="month-scrap-stats"><span><strong>${monthTasks.length}</strong> scheduled / dated</span><span><strong>${deadlines.length}</strong> deadlines</span></div>
          <div class="month-art">${witchArtwork(month === 10 ? 'crow' : month === 11 ? 'owl' : 'moon')}</div>
          <label class="month-note-label">Notes for this month<textarea data-month-note="${monthKey}" placeholder="Plans, reminders, tiny prophecies...">${escapeHtml(state.ui.monthNotes[monthKey] || '')}</textarea></label>
        </aside>
        <div class="calendar-sheet">
          <div class="calendar-head"><button class="btn ghost" data-action="calendar-prev" type="button">← Previous</button><div class="calendar-heading"><span>${mood.mark}</span><h2>${formatDate(first,{month:'long',year:'numeric'})}</h2><span>${mood.mark}</span></div><button class="btn ghost" data-action="calendar-next" type="button">Next →</button></div>
          <div class="calendar-grid">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>`<div class="calendar-day-name">${x}</div>`).join('')}${cells.join('')}</div>
          <div class="calendar-legend"><span class="legend-swatch scheduled"></span> Scheduled date <span class="legend-swatch deadline"></span> Actual deadline</div>
        </div>
      </section>
    `;
  }

  function renderSchool() {
    const open = state.schoolAssignments.filter(a => ['planned','in-progress','ready-to-submit'].includes(a.status));
    const history = state.schoolAssignments.filter(a => ['submitted','graded'].includes(a.status));
    return `
      ${pageHeader('📚', 'School', 'ENTR150 + ENTR210. Open work gets a next step. Submitted work gets to sit quietly until feedback arrives.')}
      <div class="hero-actions"><button class="btn" data-action="add-assignment" type="button">＋ Add Assignment</button></div>
      ${sectionTitle('📌', 'What Needs Attention')}
      <div class="grid grid-2">${open.length ? open.map(assignmentCard).join('') : empty('📚','No open assignments.')}</div>
      ${sectionTitle('🪦', 'Submitted & Graded')}
      <div class="grid grid-2">${history.length ? history.map(assignmentCard).join('') : empty('🪦','No history yet.')}</div>
    `;
  }

  function assignmentCard(a) {
    return `<article class="card course-card ${a.course==='ENTR150'?'blue':'purple'}"><div style="display:flex;justify-content:space-between;gap:8px"><span class="tag">${a.course}</span><span class="status-pill">${escapeHtml(a.status)}</span></div><h3>${escapeHtml(a.title)}</h3><p class="muted">${escapeHtml(a.nextWritingStep || '')}</p><p class="small"><strong>Due:</strong> ${a.dueDate ? formatShortDate(a.dueDate) : 'Not confirmed'}</p><p class="small"><strong>Submission:</strong> ${escapeHtml(a.submissionStatus || '—')}</p>${a.gradeOutcome ? `<p class="small"><strong>Grade:</strong> ${escapeHtml(a.gradeOutcome)}</p>`:''}<button class="btn ghost small-btn" data-action="edit-assignment" data-id="${a.id}" type="button">Edit</button></article>`;
  }

  function renderProjects() {
    const active = state.projects.filter(p => p.status === 'active');
    const other = state.projects.filter(p => p.status !== 'active');
    return `
      ${pageHeader('🧪', 'Project Lab', 'Multiple projects may coexist. They do not all receive sirens and flashing lights.')}
      <div class="hero-actions"><button class="btn" data-action="add-project" type="button">＋ Add Project</button></div>
      ${sectionTitle('🔥', 'Active Projects')}
      <div class="grid grid-3">${active.map(p => projectCard(p, true)).join('')}</div>
      ${other.length ? `${sectionTitle('🌙','Paused / Ideas / Complete')}<div class="grid grid-3">${other.map(p=>projectCard(p,true)).join('')}</div>` : ''}
    `;
  }

  function projectCard(p, editable = true) {
    return `<article class="card project-card green"><span class="tag">${escapeHtml(p.area)}</span><h3>${escapeHtml(p.name)}</h3><p class="muted">${escapeHtml(p.currentPhase || '')}</p><p class="small"><strong>Next:</strong> ${escapeHtml(p.nextAction || '—')}</p><div class="progress"><span style="width:${Math.max(0,Math.min(100,p.progressPercent||0))}%"></span></div><div class="task-meta"><span>${p.progressPercent||0}%</span><span>${escapeHtml(p.status)}</span></div>${editable ? `<button class="btn ghost small-btn" data-action="edit-project" data-id="${p.id}" type="button">Edit</button>` : ''}</article>`;
  }

  function renderHome() {
    const groceries = state.home.groceries;
    const homeTasks = state.tasks.filter(t => t.category === 'home' && OPEN_STATUSES.has(t.status));
    return `
      ${pageHeader('🏕️', 'Home & Family', 'Family, camper life, routines, groceries, and practical reality. Not every mess deserves its own project.')}
      ${sectionTitle('🍽️','Daily Home Rhythm')}
      <div class="anchor-timeline">${state.routineAnchors.map(a=>`<article class="anchor"><div>${a.icon}</div><div class="time">${a.startTime}</div><div class="name">${escapeHtml(a.name)}</div><div class="desc">${escapeHtml(a.description)}</div></article>`).join('')}</div>
      <div class="grid grid-2" style="margin-top:24px">
        <article class="card yellow"><h3>🛒 Groceries & Supplies</h3><div id="grocery-list">${groceries.length ? groceries.map(g=>`<div class="task-row"><button class="check-btn ${g.done?'done':''}" data-action="toggle-grocery" data-id="${g.id}" type="button">${g.done?'✓':''}</button><div class="task-title">${escapeHtml(g.title)}</div><button class="btn ghost small-btn" data-action="delete-grocery" data-id="${g.id}" type="button">✕</button></div>`).join('') : `<p class="muted">The grocery list is suspiciously empty.</p>`}</div><div style="display:flex;gap:8px;margin-top:12px"><input id="grocery-input" placeholder="Add milk, paper plates, tiny household necessity..."><button class="btn" data-action="add-grocery" type="button">Add</button></div></article>
        <article class="card pink"><h3>🏕️ Home Notes</h3><textarea id="home-notes" placeholder="Family plans, camper notes, things to remember...">${escapeHtml(state.home.notes)}</textarea><p class="muted small">No sensitive health information is required here.</p></article>
      </div>
      ${sectionTitle('🧹','Separate Household Projects','Routine chores stay inside meal anchors. Only actual projects belong here.')}
      <div class="card">${homeTasks.length ? homeTasks.map(taskRow).join('') : empty('🧹','No separate household projects.')}</div>
    `;
  }

  function renderBrain() {
    return `
      ${pageHeader('🧠', 'Brain Dump', 'The panic drawer, but searchable. Dump first. Organize later.')}
      <div class="note-paper"><textarea id="brain-raw" style="min-height:260px" placeholder="What happened... what needs done... what changed... what you forgot... what is bothering you... random ideas refusing to die quietly..."></textarea><div style="display:flex;gap:8px;margin-top:10px"><button class="btn" data-action="save-brain-dump" type="button">Save Raw Dump</button></div></div>
      ${sectionTitle('🗝️','Saved Dumps')}
      <div class="grid grid-2">${state.brainDumps.length ? state.brainDumps.slice().reverse().map(d=>`<article class="card"><div class="task-meta">${new Date(d.createdAt).toLocaleString()} · ${escapeHtml(d.status)}</div><h3>${escapeHtml(d.title)}</h3><pre style="white-space:pre-wrap;font-family:inherit;color:var(--muted)">${escapeHtml(d.rawText)}</pre><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn secondary small-btn" data-action="brain-lines" data-id="${d.id}" type="button">Turn Lines into Tasks</button><button class="btn ghost small-btn" data-action="brain-processed" data-id="${d.id}" type="button">Mark Processed</button></div></article>`).join('') : empty('🧠','No saved brain dumps yet.')}</div>
    `;
  }

  function renderGoals() {
    const zones = [['act','⚡','ACT NOW'],['incubate','🌱','INCUBATE'],['later','🌙','MAYBE LATER']];
    return `
      ${pageHeader('🔮', 'Goals & Ideas', 'Capture does not equal activation. Some ideas can sit dramatically in the moonlight until further notice.')}
      <div class="hero-actions"><button class="btn" data-action="add-idea" type="button">＋ Add Idea</button></div>
      <div class="idea-zones" style="margin-top:20px">${zones.map(([zone,icon,label])=>`<section class="idea-zone"><h3>${icon} ${label}</h3>${state.ideas.filter(i=>i.zone===zone).map(i=>`<article class="idea-card"><strong>${escapeHtml(i.title)}</strong><p class="muted small">${escapeHtml(i.notes||'')}</p><select data-action="move-idea" data-id="${i.id}"><option value="act" ${zone==='act'?'selected':''}>Act Now</option><option value="incubate" ${zone==='incubate'?'selected':''}>Incubate</option><option value="later" ${zone==='later'?'selected':''}>Maybe Later</option></select><div style="margin-top:7px"><button class="btn ghost small-btn" data-action="promote-idea" data-id="${i.id}" type="button">Promote to Project</button></div></article>`).join('') || `<p class="muted small">Nothing here.</p>`}</section>`).join('')}</div>
    `;
  }

  function memoryPosition(memory, index) {
    const stored = state.ui.scrapbookPositions[memory.id];
    if (stored) return stored;
    const col = index % 4, row = Math.floor(index / 4);
    return { x: 28 + col * 240, y: 28 + row * 300, rotate: [-3, 2, -1, 3][index % 4] };
  }

  function renderScrapbook() {
    const memories = state.ui.scrapbookFavoritesOnly ? state.memories.filter(m=>m.favorite) : state.memories;
    const boardMode = state.ui.scrapbookBoardMode;
    return `
      ${pageHeader('📸', 'Life Scrapbook', 'Proof that life happened outside the task list. Not everything worth keeping is productive.')}
      <div class="hero-actions"><button class="btn" data-action="add-memory" type="button">＋ Add Memory</button><button class="btn secondary" data-action="add-favorite" type="button">＋ Add Currently</button><button class="btn ghost" data-action="toggle-favorite-filter" type="button">${state.ui.scrapbookFavoritesOnly?'Show All':'Favorites Only'}</button><button class="btn ${boardMode ? 'blue' : 'ghost'}" data-action="toggle-scrapbook-board" type="button">${boardMode ? '✓ Arrange Polaroids' : 'Arrange Polaroids'}</button></div>
      ${sectionTitle('📸','Polaroid Wall', boardMode ? 'Drag the Polaroids around the scrapbook board. Positions save automatically.' : 'Switch on Arrange Polaroids when you want to move them around.')}
      ${boardMode ? `<div class="scrapbook-board" id="scrapbook-board">${memories.length ? memories.map((m,i)=>{ const pos=memoryPosition(m,i); return `<article class="polaroid board-polaroid" data-memory-id="${m.id}" style="left:${pos.x}px;top:${pos.y}px;--polaroid-rotate:${pos.rotate||0}deg">${m.imageDataUrl?`<img src="${m.imageDataUrl}" alt="${escapeHtml(m.title)}">`:`<div class="photo-placeholder">📷 no photo</div>`}<h3>${m.favorite?'★ ':''}${escapeHtml(m.title)}</h3><p>${formatShortDate(m.date)}</p><span class="drag-caption">drag me</span></article>`}).join('') : empty('📷','No memories yet.')}</div>` : `<div class="polaroid-grid">${memories.length ? memories.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(m=>`<article class="polaroid">${m.imageDataUrl?`<img src="${m.imageDataUrl}" alt="${escapeHtml(m.title)}">`:`<div class="photo-placeholder">📷 no photo</div>`}<h3>${m.favorite?'★ ':''}${escapeHtml(m.title)}</h3><p>${formatShortDate(m.date)} · ${escapeHtml(m.category||'memory')}</p><p>${escapeHtml(m.caption||'')}</p><button class="btn ghost small-btn" style="margin-top:9px;color:#241b2a" data-action="toggle-memory-favorite" data-id="${m.id}" type="button">${m.favorite?'Unfavorite':'Favorite'}</button></article>`).join('') : empty('📷','No memories yet. The scrapbook is waiting without judgment.')}</div>`}
      ${sectionTitle('🎧','Currently Shelf')}
      <div class="grid grid-3">${state.favorites.length ? state.favorites.map(f=>`<article class="card blue"><span class="tag">${escapeHtml(f.type)}</span><h3>${escapeHtml(f.title)}</h3><p class="muted">${escapeHtml(f.status||'current')}${f.rating?` · ${f.rating}/5`:''}</p><p>${escapeHtml(f.notes||'')}</p></article>`).join('') : empty('🎧','Nothing currently occupying an unreasonable amount of attention.')}</div>
    `;
  }

  function themeOptions(selected) {
    return ACCENT_THEMES.map(x=>`<option value="${x}" ${selected===x?'selected':''}>${cap(x)}</option>`).join('');
  }

  function renderSettings() {
    return `
      ${pageHeader('⚙️', 'Settings', 'Control the chaos level, visual skin, backups, and destructive buttons that require adult supervision.')}
      <div class="settings-grid">
        <article class="card settings-card">
          <h3>🎨 Visual Skin</h3>
          <label>Planner background<select data-setting="backgroundPreset">${BACKGROUND_PRESETS.map(x=>`<option value="${x}" ${state.settings.backgroundPreset===x?'selected':''}>${x.replaceAll('-',' ')}</option>`).join('')}</select></label>
          <label>Default accent theme<select data-setting="accentTheme">${themeOptions(state.settings.accentTheme)}</select></label>
          <div class="theme-swatches">${ACCENT_THEMES.map(x=>`<button class="theme-swatch swatch-${x} ${state.settings.accentTheme===x?'selected':''}" data-action="set-accent-theme" data-value="${x}" type="button" aria-label="Use ${x} accent"></button>`).join('')}</div>
          <label class="file-drop">Custom background photo<input id="custom-background-file" type="file" accept="image/*"><span>Upload your own background</span></label>
          ${state.settings.customBackgroundDataUrl ? `<button class="btn ghost small-btn" data-action="clear-custom-background" type="button">Clear Custom Background</button>` : ''}
          <label class="file-drop">Dashboard Polaroid photo<input id="hero-photo-file" type="file" accept="image/*"><span>Choose personal hero photo</span></label>
          ${state.settings.heroPhotoDataUrl ? `<button class="btn ghost small-btn" data-action="clear-hero-photo" type="button">Clear Hero Photo</button>` : ''}
        </article>

        <article class="card settings-card">
          <h3>🃏 Page Color Themes</h3>
          <p class="muted small">Each planner room can have its own accent color without changing the whole planner.</p>
          <div class="page-theme-list">${ROUTES.map(([id,icon,label])=>`<label><span>${icon} ${escapeHtml(label)}</span><select data-section-theme="${id}"><option value="">Use default</option>${themeOptions(state.settings.sectionThemes?.[id]||'')}</select></label>`).join('')}</div>
        </article>

        <article class="card settings-card">
          <h3>🖤 Planner Behavior</h3>
          <div class="settings-row"><div><strong>Visual intensity</strong><div class="muted small">Full Chaos keeps crooked cards and stronger decoration. Quieter Chaos calms the page down.</div></div><button class="btn secondary" data-action="toggle-theme" type="button">${state.settings.themeIntensity==='full'?'Switch to Quieter Chaos':'Switch to Full Chaos'}</button></div>
          <div class="settings-row"><div><strong>Timer completion sound</strong><div class="muted small">A small beep when a timer reaches zero.</div></div><button class="toggle ${state.settings.sound?'on':''}" data-action="toggle-sound" aria-label="Toggle timer sound" type="button"></button></div>
          <div class="settings-row"><div><strong>Install planner</strong><div class="muted small">Install as an app when your browser offers it.</div></div><button class="btn blue" data-action="install-app" type="button">Install App</button></div>
        </article>

        <article class="card settings-card">
          <h3>💾 Backups</h3>
          <div class="settings-row"><div><strong>Export backup</strong><div class="muted small">Download everything as JSON.</div></div><button class="btn blue" data-action="export-json" type="button">Export JSON</button></div>
          <div class="settings-row"><div><strong>Import backup</strong><div class="muted small">Validate and restore a planner JSON backup.</div></div><label class="btn ghost" style="cursor:pointer">Import JSON<input id="import-json" type="file" accept="application/json" style="display:none"></label></div>
          <div class="settings-row"><div><strong>Reset seed data</strong><div class="muted small">This erases current local planner data and restores the starter content.</div></div><button class="btn danger" data-action="reset-data" type="button">Reset Planner</button></div>
        </article>
      </div>
      <div class="card storage-note" style="margin-top:18px"><h3>Storage</h3><p class="muted">Planner data stays in this browser using localStorage. Photos are compressed before storage. Export backups before clearing browser storage or switching devices.</p></div>
    `;
  }

  function empty(icon, text) {
    return `<div class="empty-state"><div class="emoji">${icon}</div><p>${escapeHtml(text)}</p></div>`;
  }

  function cap(s) { return s ? s[0].toUpperCase()+s.slice(1) : ''; }

  let modalReturnFocus = null;

  function openModal(title, html) {
    modalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const titleEl = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    const backdrop = document.getElementById('modal-backdrop');
    if (!titleEl || !body || !backdrop) return;
    titleEl.textContent = title;
    body.innerHTML = html;
    backdrop.classList.remove('hidden');
    backdrop.setAttribute('aria-hidden','false');
    setTimeout(() => document.getElementById('modal-close')?.focus(), 0);
  }

  function closeModal() {
    const backdrop = document.getElementById('modal-backdrop');
    const body = document.getElementById('modal-body');
    if (!backdrop || !body) return;
    backdrop.classList.add('hidden');
    backdrop.setAttribute('aria-hidden','true');
    body.innerHTML = '';
    const returnTarget = modalReturnFocus;
    modalReturnFocus = null;
    if (returnTarget?.isConnected) returnTarget.focus();
  }

  function quickTaskModal(prefill = {}) {
    openModal(prefill.id ? 'Edit Task' : 'Quick Add Task', `
      <form id="task-form" class="form-grid">
        <input type="hidden" name="id" value="${escapeHtml(prefill.id||'')}">
        <label>Task title<input name="title" required value="${escapeHtml(prefill.title||'')}" autofocus></label>
        <label>Description<textarea name="description">${escapeHtml(prefill.description||'')}</textarea></label>
        <div class="form-grid two">
          <label>Status<select name="status">${STATUSES.map(s=>`<option value="${s}" ${(prefill.status||'ready')===s?'selected':''}>${statusLabel(s)}</option>`).join('')}</select></label>
          <label>Priority<select name="priority">${['low','normal','high'].map(s=>`<option value="${s}" ${(prefill.priority||'normal')===s?'selected':''}>${cap(s)}</option>`).join('')}</select></label>
          <label>Category<select name="category">${['college','personal','game','business','home','family','project'].map(s=>`<option value="${s}" ${(prefill.category||'personal')===s?'selected':''}>${cap(s)}</option>`).join('')}</select></label>
          <label>Duration<select name="durationMinutes"><option value="30" ${(prefill.durationMinutes||30)==30?'selected':''}>30 minutes</option><option value="60" ${prefill.durationMinutes==60?'selected':''}>60 minutes</option></select></label>
          <label>Scheduled date<input name="scheduledDate" type="date" value="${escapeHtml(prefill.scheduledDate||'')}"></label>
          <label>Deadline<input name="deadline" type="date" value="${escapeHtml(prefill.deadline||'')}"></label>
        </div>
        <label>Next step<input name="nextStep" value="${escapeHtml(prefill.nextStep||'')}"></label>
        <div style="display:flex;gap:8px"><button class="btn" type="submit">Save Task</button>${prefill.id?`<button class="btn danger" data-action="delete-task" data-id="${prefill.id}" type="button">Delete</button>`:''}</div>
      </form>`);
  }

  function assignmentModal(a = {}) {
    const statuses = ['planned','in-progress','ready-to-submit','submitted','graded'];
    openModal(a.id ? 'Edit Assignment' : 'Add Assignment', `<form id="assignment-form" class="form-grid"><input type="hidden" name="id" value="${escapeHtml(a.id||'')}"><div class="form-grid two"><label>Course<select name="course"><option ${a.course==='ENTR150'?'selected':''}>ENTR150</option><option ${a.course==='ENTR210'?'selected':''}>ENTR210</option></select></label><label>Status<select name="status">${statuses.map(s=>`<option value="${s}" ${(a.status||'planned')===s?'selected':''}>${s}</option>`).join('')}</select></label></div><label>Title<input name="title" required value="${escapeHtml(a.title||'')}"></label><label>Due date<input name="dueDate" type="date" value="${escapeHtml(a.dueDate||'')}"></label><label>Submission status<input name="submissionStatus" value="${escapeHtml(a.submissionStatus||'')}"></label><label>Grade / outcome<input name="gradeOutcome" value="${escapeHtml(a.gradeOutcome||'')}"></label><label>Next writing step<textarea name="nextWritingStep">${escapeHtml(a.nextWritingStep||'')}</textarea></label><label>Feedback / notes<textarea name="feedback">${escapeHtml(a.feedback||'')}</textarea></label><button class="btn" type="submit">Save Assignment</button></form>`);
  }

  function projectModal(p = {}) {
    openModal(p.id ? 'Edit Project' : 'Add Project', `<form id="project-form" class="form-grid"><input type="hidden" name="id" value="${escapeHtml(p.id||'')}"><label>Name<input name="name" required value="${escapeHtml(p.name||'')}"></label><div class="form-grid two"><label>Area<input name="area" value="${escapeHtml(p.area||'Personal')}"></label><label>Status<select name="status">${['idea','active','paused','complete'].map(s=>`<option value="${s}" ${(p.status||'active')===s?'selected':''}>${cap(s)}</option>`).join('')}</select></label><label>Priority<select name="priority">${['low','normal','high'].map(s=>`<option value="${s}" ${(p.priority||'normal')===s?'selected':''}>${cap(s)}</option>`).join('')}</select></label><label>Progress %<input name="progressPercent" type="number" min="0" max="100" value="${p.progressPercent||0}"></label></div><label>Current phase<textarea name="currentPhase">${escapeHtml(p.currentPhase||'')}</textarea></label><label>Next action<textarea name="nextAction">${escapeHtml(p.nextAction||'')}</textarea></label><label>Notes<textarea name="notes">${escapeHtml(p.notes||'')}</textarea></label><button class="btn" type="submit">Save Project</button></form>`);
  }

  function ideaModal() {
    openModal('Add Idea', `<form id="idea-form" class="form-grid"><label>Idea<input name="title" required></label><label>Zone<select name="zone"><option value="act">Act Now</option><option value="incubate" selected>Incubate</option><option value="later">Maybe Later</option></select></label><label>Notes<textarea name="notes"></textarea></label><button class="btn" type="submit">Capture Idea</button></form>`);
  }

  function memoryModal() {
    openModal('Add Memory', `<form id="memory-form" class="form-grid"><label>Title<input name="title" required></label><div class="form-grid two"><label>Date<input name="date" type="date" required value="${isoDateLocal()}"></label><label>Category<select name="category">${['Family','Home','Adventure','Funny','Milestone','Food','Random'].map(x=>`<option>${x}</option>`).join('')}</select></label></div><label>People<input name="people"></label><label>Caption<textarea name="caption"></textarea></label><label>Photo (optional)<input name="photo" type="file" accept="image/*"></label><label><input name="favorite" type="checkbox" style="width:auto"> Favorite memory</label><button class="btn" type="submit">Save Memory</button></form>`);
  }

  function favoriteModal() {
    openModal('Add Currently', `<form id="favorite-form" class="form-grid"><label>Thing<input name="title" required></label><div class="form-grid two"><label>Type<select name="type">${['show','movie','music','book','game','food','place','product','other'].map(x=>`<option>${x}</option>`).join('')}</select></label><label>Status<select name="status"><option>current</option><option>paused</option><option>finished</option><option>loved</option><option>nope</option></select></label></div><label>Rating 1-5<input name="rating" type="number" min="1" max="5"></label><label>Notes<textarea name="notes"></textarea></label><button class="btn" type="submit">Save</button></form>`);
  }

  function brainLinesModal(dump) {
    if (!isPlainObject(dump) || typeof dump.rawText !== 'string') {
      toast('That brain dump could not be opened.');
      return;
    }
    const lines = dump.rawText.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,30);
    if (!lines.length) {
      toast('There are no non-empty lines to turn into tasks.');
      return;
    }
    openModal('Turn Lines into Tasks', `<form id="brain-lines-form" data-id="${escapeHtml(dump.id || '')}" class="form-grid"><p class="muted">Select only lines that are genuinely tasks. Raw brain dump text stays untouched.</p>${lines.map((line,i)=>`<label style="display:flex;grid-template-columns:auto 1fr;align-items:start"><input type="checkbox" name="line" value="${i}" style="width:auto;margin-top:3px"><span>${escapeHtml(line)}</span></label>`).join('')}<input type="hidden" name="linesJson" value="${escapeHtml(JSON.stringify(lines))}"><button class="btn" type="submit">Create Selected Tasks</button></form>`);
  }

  async function fileToDataUrl(file, { maxWidth = 1400, quality = .82 } = {}) {
    if (!(file instanceof File)) return '';
    if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
    if (file.size > 12 * 1024 * 1024) throw new Error('Please choose an image under 12 MB. It will be compressed for local planner storage.');

    const safeMaxWidth = Math.max(1, finiteNumber(maxWidth, 1400));
    const safeQuality = Math.max(.1, Math.min(.95, finiteNumber(quality, .82)));
    const raw = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('The selected image could not be read.'));
      reader.readAsDataURL(file);
    });

    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          if (!img.width || !img.height) throw new Error('The selected image has invalid dimensions.');
          const ratio = Math.min(1, safeMaxWidth / img.width);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * ratio));
          canvas.height = Math.max(1, Math.round(img.height * ratio));
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('This browser could not prepare the image for storage.');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', safeQuality));
        } catch (error) {
          reject(error instanceof Error ? error : new Error('The selected image could not be processed.'));
        }
      };
      img.onerror = () => reject(new Error('The selected image could not be decoded.'));
      img.src = raw;
    });
  }

  function plannerEditToolbar(current) {
    if (current === 'settings') return '';
    return `<div class="planner-edit-toolbar"><button class="btn ${state.ui.plannerEditMode ? 'blue' : 'ghost'}" data-action="toggle-planner-edit" type="button">${state.ui.plannerEditMode ? '✓ Finish Editing' : '✂️ Edit Planner'}</button>${state.ui.plannerEditMode ? `<button class="btn secondary" data-action="open-sticker-tray" type="button">＋ Sticker</button><button class="btn ghost" data-action="reset-current-layout" type="button">Reset Page</button>` : ''}</div>`;
  }

  function renderDecorationLayer(page) {
    const items = state.decorations.filter(d => d.page === page);
    if (!items.length) return '';
    return `<div class="decoration-layer ${state.ui.plannerEditMode ? 'editing' : ''}">${items.map(d=>renderDecoration(d)).join('')}</div>`;
  }

  function renderDecoration(d) {
    const art = d.type === 'crow' ? witchArtwork('crow') : d.type === 'owl' ? witchArtwork('owl') : d.type === 'moon' ? witchArtwork('moon') : ({star:'✦',candle:'🕯️',heart:'🖤',spark:'✨',feather:'🪶'})[d.type] || '✦';
    return `<div class="placed-sticker sticker-${d.type}" data-decoration-id="${d.id}" style="left:${d.x}px;top:${d.y}px;transform:rotate(${d.rotate||0}deg) scale(${d.scale||1})">${art}${state.ui.plannerEditMode ? `<div class="sticker-controls"><button data-action="rotate-decoration" data-id="${d.id}" type="button" aria-label="Rotate sticker">↻</button><button data-action="scale-decoration" data-id="${d.id}" type="button" aria-label="Resize sticker">＋</button><button data-action="delete-decoration" data-id="${d.id}" type="button" aria-label="Delete sticker">×</button></div>` : ''}</div>`;
  }

  function stickerTrayModal() {
    openModal('Sticker Drawer', `<div class="sticker-tray">${STICKER_TYPES.map(type=>`<button class="sticker-choice sticker-${type}" data-action="add-decoration" data-value="${type}" type="button">${type==='crow'?witchArtwork('crow'):type==='owl'?witchArtwork('owl'):type==='moon'?witchArtwork('moon'):({star:'✦',candle:'🕯️',heart:'🖤',spark:'✨',feather:'🪶'})[type]}<span>${cap(type)}</span></button>`).join('')}</div><p class="muted small">Add a sticker, then drag it around while Edit Planner Mode is on.</p>`);
  }

  let installPromptEvent = null;

  document.addEventListener('click', async (e) => {
    if (!(e.target instanceof Element)) return;
    const routeBtn = e.target.closest('[data-route]');
    if (routeBtn) { setRoute(routeBtn.dataset.route); closeSidebar(); return; }
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const id = el.dataset.id;

    if (action === 'toggle-planner-edit') { state.ui.plannerEditMode = !state.ui.plannerEditMode; state.ui.dashboardEditMode = state.ui.plannerEditMode; saveState({render:true}); return; }
    if (action === 'open-sticker-tray') { stickerTrayModal(); return; }
    if (action === 'add-decoration') { state.decorations.push({id:uid('sticker'),page:route(),type:el.dataset.value,x:80+Math.round(Math.random()*160),y:160+Math.round(Math.random()*180),rotate:Math.round(Math.random()*12-6),scale:1}); saveState(); closeModal(); renderApp(); toast('Sticker added. Drag it where it belongs.'); return; }
    if (action === 'delete-decoration') { state.decorations = state.decorations.filter(d=>d.id!==id); saveState({render:true}); return; }
    if (action === 'rotate-decoration') { const d=state.decorations.find(x=>x.id===id); if(d){d.rotate=((d.rotate||0)+15)%360;saveState({render:true});} return; }
    if (action === 'scale-decoration') { const d=state.decorations.find(x=>x.id===id); if(d){d.scale=(d.scale||1)>=1.6?.8:Math.round(((d.scale||1)+.2)*10)/10;saveState({render:true});} return; }
    if (action === 'reset-current-layout') { const current=route(); if(!confirm(`Reset custom layout and decorations on ${current}?`)) return; state.decorations=state.decorations.filter(d=>d.page!==current); if(current==='today')state.ui.todaySectionOrder=[...TODAY_SECTIONS]; if(current==='dashboard')state.ui.dashboardOrder=[...DASHBOARD_WIDGETS]; if(current==='scrapbook')state.ui.scrapbookPositions={}; saveState({render:true}); toast('Page layout reset.'); return; }
    if (action === 'move-page-section-up') { movePageSection(el.dataset.page,id,-1); return; }
    if (action === 'move-page-section-down') { movePageSection(el.dataset.page,id,1); return; }
    if (action === 'toggle-scrapbook-board') { state.ui.scrapbookBoardMode = !state.ui.scrapbookBoardMode; saveState({render:true}); return; }
    if (action === 'set-accent-theme') { state.settings.accentTheme = el.dataset.value; saveState({render:true}); return; }
    if (action === 'clear-custom-background') { state.settings.customBackgroundDataUrl=''; saveState({render:true}); return; }
    if (action === 'clear-hero-photo') { state.settings.heroPhotoDataUrl=''; saveState({render:true}); return; }
    if (action === 'install-app') { if (installPromptEvent) { installPromptEvent.prompt(); const result=await installPromptEvent.userChoice; if(result?.outcome==='accepted') toast('Planner installation started.'); installPromptEvent=null; } else toast('Your browser will show Install when this planner is eligible.'); return; }

    if (action === 'quick-task') quickTaskModal();
    if (action === 'edit-task') quickTaskModal(state.tasks.find(t=>t.id===id) || {});
    if (action === 'delete-task') { if (confirm('Delete this task?')) { state.tasks = state.tasks.filter(t=>t.id!==id); saveState(); closeModal(); renderApp(); } }
    if (action === 'complete-task') completeTask(id);
    if (action === 'reopen-task') { const t=state.tasks.find(x=>x.id===id); if(t){t.status='ready';t.completedAt=null;saveState({render:true});} }
    if (action === 'start-task') startTimer(30, id);
    if (action === 'set-energy') { ensureToday().energy = el.dataset.value; saveState({render:true}); }
    if (action === 'toggle-mood') { const d=ensureToday(); const m=el.dataset.value; d.moodTags = d.moodTags.includes(m) ? d.moodTags.filter(x=>x!==m) : [...d.moodTags,m]; saveState({render:true}); }
    if (action === 'timer-start-30') startTimer(30);
    if (action === 'timer-start-60') startTimer(60);
    if (action === 'timer-pause') pauseResumeTimer();
    if (action === 'timer-reset') resetTimer();
    if (action === 'timer-finish') timerCompletionModal();
    if (action === 'timer-choice') handleTimerChoice(el.dataset.choice);
    if (action === 'calendar-prev') changeCalendar(-1);
    if (action === 'calendar-next') changeCalendar(1);
    if (action === 'calendar-day') quickTaskModal({ scheduledDate: el.dataset.date, status:'ready' });
    if (action === 'add-assignment') assignmentModal();
    if (action === 'edit-assignment') assignmentModal(state.schoolAssignments.find(a=>a.id===id)||{});
    if (action === 'add-project') projectModal();
    if (action === 'edit-project') projectModal(state.projects.find(p=>p.id===id)||{});
    if (action === 'add-grocery') addGrocery();
    if (action === 'toggle-grocery') { const g=state.home.groceries.find(x=>x.id===id); if(g){g.done=!g.done;saveState({render:true});} }
    if (action === 'delete-grocery') { state.home.groceries=state.home.groceries.filter(x=>x.id!==id);saveState({render:true}); }
    if (action === 'save-brain-dump') saveBrainDump(document.getElementById('brain-raw').value);
    if (action === 'save-dashboard-brain') { const raw=document.getElementById('dashboard-brain').value; if(raw.trim()){saveBrainDump(raw); document.getElementById('dashboard-brain').value=''; toast('Thought trapped.');} }
    if (action === 'brain-lines') brainLinesModal(state.brainDumps.find(d=>d.id===id));
    if (action === 'brain-processed') { const d=state.brainDumps.find(x=>x.id===id); if(d){d.status='processed';saveState({render:true});} }
    if (action === 'add-idea') ideaModal();
    if (action === 'promote-idea') promoteIdea(id);
    if (action === 'add-memory') memoryModal();
    if (action === 'add-favorite') favoriteModal();
    if (action === 'toggle-favorite-filter') { state.ui.scrapbookFavoritesOnly=!state.ui.scrapbookFavoritesOnly;saveState({render:true}); }
    if (action === 'toggle-memory-favorite') { const m=state.memories.find(x=>x.id===id); if(m){m.favorite=!m.favorite;saveState({render:true});} }
    if (action === 'toggle-dashboard-edit') { state.ui.dashboardEditMode = !state.ui.dashboardEditMode; saveState({render:true}); }
    if (action === 'reset-dashboard-layout') { state.ui.dashboardOrder = [...DASHBOARD_WIDGETS]; saveState({render:true}); toast('Dashboard layout reset.'); }
    if (action === 'move-widget-up') moveDashboardWidget(id, -1);
    if (action === 'move-widget-down') moveDashboardWidget(id, 1);
    if (action === 'toggle-theme') { state.settings.themeIntensity = state.settings.themeIntensity==='full'?'quiet':'full'; saveState({render:true}); }
    if (action === 'toggle-sound') { state.settings.sound=!state.settings.sound;saveState({render:true}); }
    if (action === 'export-json') exportJson();
    if (action === 'reset-data') { if(confirm('Reset the planner to starter data? This erases local changes on this browser.')){state=defaultState();saveState({render:true});toast('Planner reset.');} }
  });

  document.addEventListener('change', async (e) => {
    if (!(e.target instanceof HTMLElement)) return;
    const el=e.target;
    if (el.dataset.setting) { state.settings[el.dataset.setting]=el.value; saveState({render:true}); return; }
    if (el.dataset.sectionTheme) { if(el.value) state.settings.sectionThemes[el.dataset.sectionTheme]=el.value; else delete state.settings.sectionThemes[el.dataset.sectionTheme]; saveState({render:true}); return; }
    if (el.id === 'custom-background-file' && el.files?.[0]) { try{state.settings.customBackgroundDataUrl=await fileToDataUrl(el.files[0],{maxWidth:1800,quality:.76}); saveState({render:true}); toast('Custom background saved.');}catch(err){alert(err.message);} return; }
    if (el.id === 'hero-photo-file' && el.files?.[0]) { try{state.settings.heroPhotoDataUrl=await fileToDataUrl(el.files[0],{maxWidth:900,quality:.82}); saveState({render:true}); toast('Dashboard photo saved.');}catch(err){alert(err.message);} return; }
    if (el.matches('[data-action="move-task"]')) { const t=state.tasks.find(x=>x.id===el.dataset.id); if(t){t.status=el.value;if(el.value==='complete')t.completedAt=Date.now();saveState({render:true});} }
    if (el.matches('[data-action="move-idea"]')) { const i=state.ideas.find(x=>x.id===el.dataset.id); if(i){i.zone=el.value;saveState({render:true});} }
    if (el.id === 'import-json') importJson(el.files?.[0]);
  });

  let autosaveTimeout = null;

  function scheduleAutosave() {
    clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(() => {
      autosaveTimeout = null;
      saveState();
    }, 250);
  }

  function flushAutosave() {
    if (!autosaveTimeout) return;
    clearTimeout(autosaveTimeout);
    autosaveTimeout = null;
    saveState();
  }

  document.addEventListener('input', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;

    let changed = false;
    if (el.dataset.dayField) {
      ensureToday()[el.dataset.dayField] = el.value;
      changed = true;
    }
    if (el.dataset.weekField) {
      ensureWeek()[el.dataset.weekField] = el.value;
      changed = true;
    }
    if (el.dataset.weekTop !== undefined) {
      const index = Number(el.dataset.weekTop);
      if (Number.isInteger(index) && index >= 0 && index < 3) {
        ensureWeek().top3[index] = el.value;
        changed = true;
      }
    }
    if (el.id === 'home-notes') {
      state.home.notes = el.value;
      changed = true;
    }
    if (el.dataset.monthNote) {
      state.ui.monthNotes[el.dataset.monthNote] = el.value;
      changed = true;
    }
    if (changed) scheduleAutosave();
  });

  function formString(formData, name) {
    const value = formData.get(name);
    return typeof value === 'string' ? value.trim() : '';
  }

  document.addEventListener('submit', async (e) => {
    if (!(e.target instanceof HTMLFormElement)) return;
    e.preventDefault();

    const form = e.target;
    const fd = new FormData(form);

    if (form.id === 'task-form') {
      const title = formString(fd, 'title');
      if (!title) { toast('Task title is required.'); return; }
      const id = formString(fd, 'id') || uid('task');
      const existing = state.tasks.find(t => t.id === id);
      const status = formString(fd, 'status');
      const item = {
        id,
        title,
        description: formString(fd, 'description'),
        status: STATUSES.includes(status) ? status : 'ready',
        priority: Object.prototype.hasOwnProperty.call(PRIORITY_WEIGHT, formString(fd, 'priority')) ? formString(fd, 'priority') : 'normal',
        category: formString(fd, 'category') || 'personal',
        scheduledDate: formString(fd, 'scheduledDate') || null,
        deadline: formString(fd, 'deadline') || null,
        durationMinutes: [30, 60].includes(Number(formString(fd, 'durationMinutes'))) ? Number(formString(fd, 'durationMinutes')) : 30,
        timerType: 'standard',
        nextStep: formString(fd, 'nextStep'),
        waitingOn: existing?.waitingOn || '',
        projectId: existing?.projectId || null,
        createdAt: existing?.createdAt || Date.now(),
        completedAt: status === 'complete' ? (existing?.completedAt || Date.now()) : null,
      };
      if (existing) Object.assign(existing, item);
      else state.tasks.push(item);
      saveState();
      closeModal();
      renderApp();
      toast('Task saved.');
      return;
    }

    if (form.id === 'assignment-form') {
      const title = formString(fd, 'title');
      if (!title) { toast('Assignment title is required.'); return; }
      const id = formString(fd, 'id') || uid('school');
      const existing = state.schoolAssignments.find(x => x.id === id);
      const item = {
        id,
        course: formString(fd, 'course'),
        title,
        status: formString(fd, 'status') || 'planned',
        dueDate: formString(fd, 'dueDate') || null,
        submissionStatus: formString(fd, 'submissionStatus'),
        gradeOutcome: formString(fd, 'gradeOutcome'),
        feedback: formString(fd, 'feedback'),
        nextWritingStep: formString(fd, 'nextWritingStep'),
        notes: existing?.notes || '',
      };
      if (existing) Object.assign(existing, item);
      else state.schoolAssignments.push(item);
      saveState();
      closeModal();
      renderApp();
      toast('Assignment saved.');
      return;
    }

    if (form.id === 'project-form') {
      const name = formString(fd, 'name');
      if (!name) { toast('Project name is required.'); return; }
      const id = formString(fd, 'id') || uid('proj');
      const existing = state.projects.find(x => x.id === id);
      const item = {
        id,
        name,
        area: formString(fd, 'area') || 'Personal',
        status: formString(fd, 'status') || 'active',
        priority: formString(fd, 'priority') || 'normal',
        currentPhase: formString(fd, 'currentPhase'),
        nextAction: formString(fd, 'nextAction'),
        progressPercent: Math.max(0, Math.min(100, Number(formString(fd, 'progressPercent')) || 0)),
        notes: formString(fd, 'notes'),
      };
      if (existing) Object.assign(existing, item);
      else state.projects.push(item);
      saveState();
      closeModal();
      renderApp();
      toast('Project saved.');
      return;
    }

    if (form.id === 'idea-form') {
      const title = formString(fd, 'title');
      if (!title) { toast('Idea title is required.'); return; }
      state.ideas.push({
        id: uid('idea'),
        title,
        zone: formString(fd, 'zone') || 'incubate',
        notes: formString(fd, 'notes'),
        createdAt: Date.now(),
      });
      saveState();
      closeModal();
      renderApp();
      toast('Idea captured.');
      return;
    }

    if (form.id === 'memory-form') {
      const title = formString(fd, 'title');
      if (!title) { toast('Memory title is required.'); return; }
      try {
        const photo = fd.get('photo');
        const imageDataUrl = photo instanceof File && photo.size ? await fileToDataUrl(photo) : '';
        state.memories.push({
          id: uid('memory'),
          date: formString(fd, 'date') || isoDateLocal(),
          title,
          caption: formString(fd, 'caption'),
          category: formString(fd, 'category') || 'Random',
          people: formString(fd, 'people'),
          favorite: formString(fd, 'favorite') === 'on',
          imageDataUrl,
          notes: '',
        });
        saveState();
        closeModal();
        renderApp();
        toast('Memory saved.');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'The memory could not be saved.');
      }
      return;
    }

    if (form.id === 'favorite-form') {
      const title = formString(fd, 'title');
      if (!title) { toast('A title is required.'); return; }
      const ratingValue = Number(formString(fd, 'rating'));
      state.favorites.push({
        id: uid('fav'),
        type: formString(fd, 'type') || 'other',
        title,
        status: formString(fd, 'status') || 'current',
        rating: Number.isFinite(ratingValue) && ratingValue >= 1 && ratingValue <= 5 ? ratingValue : null,
        notes: formString(fd, 'notes'),
        imageDataUrl: '',
      });
      saveState();
      closeModal();
      renderApp();
      toast('Added to Currently.');
      return;
    }

    if (form.id === 'brain-lines-form') {
      let lines;
      try {
        const parsed = JSON.parse(formString(fd, 'linesJson'));
        lines = Array.isArray(parsed) ? parsed.filter(line => typeof line === 'string') : [];
      } catch {
        lines = [];
      }
      const picks = [...new Set(fd.getAll('line').map(Number))]
        .filter(index => Number.isInteger(index) && index >= 0 && index < lines.length);
      if (!picks.length) { toast('Choose at least one valid line.'); return; }

      const createdIds = [];
      for (const index of picks) {
        const title = lines[index].trim();
        if (!title) continue;
        const id = uid('task');
        createdIds.push(id);
        state.tasks.push({
          id,
          title,
          description: 'Created from Brain Dump.',
          status: 'inbox',
          priority: 'normal',
          category: 'personal',
          scheduledDate: null,
          deadline: null,
          durationMinutes: 30,
          timerType: 'standard',
          nextStep: '',
          waitingOn: '',
          projectId: null,
          createdAt: Date.now(),
          completedAt: null,
        });
      }
      if (!createdIds.length) { toast('No valid tasks were created.'); return; }
      const dump = state.brainDumps.find(d => d.id === form.dataset.id);
      if (dump) {
        if (!Array.isArray(dump.extractedTaskIds)) dump.extractedTaskIds = [];
        dump.extractedTaskIds.push(...createdIds);
      }
      saveState();
      closeModal();
      renderApp();
      toast(`${createdIds.length} task${createdIds.length === 1 ? '' : 's'} created.`);
    }
  });

  function moveDashboardWidget(id, delta) {
    const order = [...state.ui.dashboardOrder];
    const index = order.indexOf(id);
    if (index < 0) return;
    const next = Math.max(0, Math.min(order.length - 1, index + delta));
    if (next === index) return;
    order.splice(index, 1);
    order.splice(next, 0, id);
    state.ui.dashboardOrder = order;
    saveState({render:true});
  }

  function reorderDashboardWidget(draggedId, targetId) {
    if (!draggedId || !targetId || draggedId === targetId) return;
    const order = [...state.ui.dashboardOrder];
    const from = order.indexOf(draggedId);
    const to = order.indexOf(targetId);
    if (from < 0 || to < 0) return;
    order.splice(from, 1);
    order.splice(to, 0, draggedId);
    state.ui.dashboardOrder = order;
    saveState({render:true});
  }

  function movePageSection(page, id, delta) {
    if (page !== 'today') return;
    const order=[...state.ui.todaySectionOrder];
    const index=order.indexOf(id); if(index<0)return;
    const next=Math.max(0,Math.min(order.length-1,index+delta)); if(next===index)return;
    order.splice(index,1); order.splice(next,0,id); state.ui.todaySectionOrder=order; saveState({render:true});
  }

  function reorderPageSection(page, draggedId, targetId) {
    if(page!=='today'||!draggedId||!targetId||draggedId===targetId)return;
    const order=[...state.ui.todaySectionOrder]; const from=order.indexOf(draggedId),to=order.indexOf(targetId); if(from<0||to<0)return;
    order.splice(from,1); order.splice(to,0,draggedId); state.ui.todaySectionOrder=order; saveState({render:true});
  }

  function completeTask(id) {
    const t=state.tasks.find(x=>x.id===id); if(!t)return;
    if(t.status==='complete'){t.status='ready';t.completedAt=null;}else{t.status='complete';t.completedAt=Date.now();ensureToday().completedActivities.push(t.title);}
    saveState({render:true});
  }

  function handleTimerChoice(choice) {
    const id=state.timer.taskId; const t=state.tasks.find(x=>x.id===id);
    if(choice==='complete' && t){t.status='complete';t.completedAt=Date.now();ensureToday().completedActivities.push(t.title);}
    if(choice==='another'){closeModal();startTimer(30,id);return;}
    if(choice==='postpone' && t)t.status='postponed';
    if(choice==='switch' && t)t.status='ready';
    if(choice==='reprioritize' && t)t.status='ready';
    resetTimer(); closeModal(); renderApp();
    if(choice==='reprioritize') setRoute('week');
  }

  function changeCalendar(delta) {
    let [y,m]=state.ui.calendarMonth.split('-').map(Number); m+=delta; if(m<1){m=12;y--;}if(m>12){m=1;y++;}state.ui.calendarMonth=`${y}-${String(m).padStart(2,'0')}`;saveState({render:true});
  }

  function addGrocery() {
    const input=document.getElementById('grocery-input'); const title=input?.value.trim(); if(!title)return; state.home.groceries.push({id:uid('g'),title,done:false});saveState({render:true});
  }

  function saveBrainDump(raw) {
    if(!raw.trim())return;
    const first=raw.trim().split(/\r?\n/)[0].slice(0,60) || 'Brain dump';
    state.brainDumps.push({id:uid('dump'),title:first,createdAt:Date.now(),rawText:raw,status:'unprocessed',extractedTaskIds:[]});saveState({render:true});toast('Brain dump saved exactly as entered.');
  }

  function promoteIdea(id) {
    const idea=state.ideas.find(x=>x.id===id); if(!idea)return;
    state.projects.push({id:uid('proj'),name:idea.title,area:'Idea',status:'idea',priority:'normal',currentPhase:'Captured idea promoted from Idea Garden.',nextAction:'Define the first real next step before activating.',progressPercent:0,notes:idea.notes||''});idea.zone='later';saveState({render:true});toast('Idea promoted to Projects.');
  }

  function exportJson() {
    const payload = {
      ...state,
      backupMeta: {
        schema: 'laurels-organized-chaos-planner',
        schemaVersion: 1,
        exportedAt: new Date().toISOString()
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organized-chaos-backup-${isoDateLocal()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    toast('Backup exported.');
  }

  async function importJson(file) {
    if (!file) return;
    try {
      if (file.size > 15 * 1024 * 1024) throw new Error('That backup is unusually large. Choose an Organized Chaos JSON backup under 15 MB.');
      const text = await file.text();
      const parsed = JSON.parse(text);
      const looksValid = parsed && parsed.version === 1 && Array.isArray(parsed.tasks) && parsed.dailyEntries && typeof parsed.dailyEntries === 'object';
      if (!looksValid) throw new Error('This does not look like a valid Organized Chaos planner backup.');
      const restored = hydrateState(parsed);
      if (!Array.isArray(restored.routineAnchors) || !Array.isArray(restored.projects) || !Array.isArray(restored.schoolAssignments)) {
        throw new Error('The backup is missing required planner data.');
      }
      if (!confirm('Import this backup and replace current local planner data? A temporary pre-import recovery copy will be saved in this browser first.')) return;
      const previousState = state;
      try { localStorage.setItem(STORAGE_KEY + '-pre-import', JSON.stringify(previousState)); } catch (_) {}
      state = restored;
      if (!saveState()) {
        state = previousState;
        renderApp();
        throw new Error('The backup was valid, but the browser could not store it. Your previous planner data is still active.');
      }
      renderApp();
      toast('Backup imported.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not import that backup.');
    }
  }

  function closeSidebar(){document.getElementById('sidebar').classList.remove('open');}

  let draggedDashboardWidget = null;
  document.addEventListener('dragstart', (e) => {
    if (!(e.target instanceof Element)) return;
    const widget = e.target.closest('[data-dashboard-widget]');
    if (!widget || !state.ui.dashboardEditMode) return;
    draggedDashboardWidget = widget.dataset.dashboardWidget;
    widget.classList.add('dragging');
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', draggedDashboardWidget); }
  });
  document.addEventListener('dragover', (e) => {
    if (!(e.target instanceof Element)) return;
    const widget = e.target.closest('[data-dashboard-widget]');
    if (!widget || !state.ui.dashboardEditMode || !draggedDashboardWidget) return;
    e.preventDefault();
    widget.classList.add('drag-over');
  });
  document.addEventListener('dragleave', (e) => {
    if (!(e.target instanceof Element)) return;
    e.target.closest('[data-dashboard-widget]')?.classList.remove('drag-over');
  });
  document.addEventListener('drop', (e) => {
    if (!(e.target instanceof Element)) return;
    const widget = e.target.closest('[data-dashboard-widget]');
    if (!widget || !state.ui.dashboardEditMode) return;
    e.preventDefault();
    document.querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over'));
    reorderDashboardWidget(draggedDashboardWidget, widget.dataset.dashboardWidget);
    draggedDashboardWidget = null;
  });
  document.addEventListener('dragend', () => {
    document.querySelectorAll('.dragging,.drag-over').forEach(x => x.classList.remove('dragging','drag-over'));
    draggedDashboardWidget = null;
  });

  let draggedPageSection = null;
  document.addEventListener('dragstart', (e) => {
    if (!(e.target instanceof Element)) return;
    const section=e.target.closest('[data-page-section]');
    if(!section||!state.ui.plannerEditMode)return;
    draggedPageSection={page:section.dataset.page,id:section.dataset.pageSection};
    section.classList.add('dragging');
    e.dataTransfer?.setData('text/plain', draggedPageSection.id);
  });
  document.addEventListener('dragover', (e) => {
    if (!(e.target instanceof Element)) return;
    const section=e.target.closest('[data-page-section]');
    if(!section||!state.ui.plannerEditMode||!draggedPageSection)return;
    e.preventDefault(); section.classList.add('drag-over');
  });
  document.addEventListener('drop', (e) => {
    if (!(e.target instanceof Element)) return;
    const section=e.target.closest('[data-page-section]');
    if(!section||!draggedPageSection)return;
    e.preventDefault(); reorderPageSection(section.dataset.page,draggedPageSection.id,section.dataset.pageSection); draggedPageSection=null;
  });

  let pointerDrag = null;
  document.addEventListener('pointerdown', (e) => {
    if (!(e.target instanceof Element)) return;
    if (state.ui.plannerEditMode) {
      const sticker=e.target.closest('[data-decoration-id]');
      if(sticker && !e.target.closest('[data-action]')) {
        const item=state.decorations.find(d=>d.id===sticker.dataset.decorationId); if(!item)return;
        pointerDrag={kind:'sticker',id:item.id,startX:e.clientX,startY:e.clientY,origX:item.x,origY:item.y,el:sticker}; sticker.setPointerCapture?.(e.pointerId); e.preventDefault(); return;
      }
    }
    if(state.ui.scrapbookBoardMode && route()==='scrapbook') {
      const pol=e.target.closest('[data-memory-id]');
      if(pol) { const id=pol.dataset.memoryId,pos=state.ui.scrapbookPositions[id]||{}; pointerDrag={kind:'memory',id,startX:e.clientX,startY:e.clientY,origX:pos.x ?? (parseFloat(pol.style.left)||0),origY:pos.y ?? (parseFloat(pol.style.top)||0),el:pol}; pol.setPointerCapture?.(e.pointerId); e.preventDefault(); }
    }
  });
  document.addEventListener('pointermove', (e) => {
    if(!pointerDrag)return; const dx=e.clientX-pointerDrag.startX,dy=e.clientY-pointerDrag.startY; const x=Math.max(0,pointerDrag.origX+dx),y=Math.max(0,pointerDrag.origY+dy);
    pointerDrag.el.style.left=`${x}px`; pointerDrag.el.style.top=`${y}px`; pointerDrag.x=x; pointerDrag.y=y;
  });
  document.addEventListener('pointerup', () => {
    if(!pointerDrag)return;
    if(pointerDrag.kind==='sticker'){const item=state.decorations.find(d=>d.id===pointerDrag.id); if(item){item.x=Math.round(pointerDrag.x??item.x);item.y=Math.round(pointerDrag.y??item.y);}}
    if(pointerDrag.kind==='memory'){const old=state.ui.scrapbookPositions[pointerDrag.id]||{};state.ui.scrapbookPositions[pointerDrag.id]={...old,x:Math.round(pointerDrag.x??old.x??0),y:Math.round(pointerDrag.y??old.y??0),rotate:old.rotate??0};}
    saveState(); pointerDrag=null;
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPromptEvent = e;
  });
  document.getElementById('mobile-menu')?.addEventListener('click', () => document.getElementById('sidebar')?.classList.toggle('open'));
  document.getElementById('quick-add-mobile')?.addEventListener('click', () => quickTaskModal());
  document.getElementById('floating-add')?.addEventListener('click', () => quickTaskModal());
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target instanceof HTMLElement && e.target.id === 'modal-backdrop') closeModal();
  });
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    state.settings.themeIntensity = state.settings.themeIntensity === 'full' ? 'quiet' : 'full';
    saveState({render:true});
  });

  window.addEventListener('hashchange', () => {
    flushAutosave();
    renderApp();
  });
  window.addEventListener('keydown', (e) => {
    const target = e.target instanceof Element ? e.target.closest('[data-action="calendar-day"]') : null;
    if (target && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return;
    }
    if (e.key === 'Escape') closeModal();
  });
  window.addEventListener('beforeunload', flushAutosave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAutosave();
  });
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      state = e.newValue ? hydrateState(JSON.parse(e.newValue)) : defaultState();
      renderApp();
    } catch (error) {
      console.warn('Could not sync planner data from another tab', error);
    }
  });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch((error) => console.warn('Planner service worker registration failed', error));
  }
  applyTheme();
  if(!location.hash) location.hash='cover'; else renderApp();
})();


/* ===== Step 2 page-design completion ===== */
(() => {
  'use strict';

  const PAGE_META = {
    dashboard: ['COMMAND CENTER', 'moon'],
    today: ['TODAY\'S SPREAD', 'moon'],
    week: ['WEEKLY FIELD NOTES', 'stars'],
    calendar: ['MONTHLY SPREAD', 'moon'],
    school: ['ACADEMIC DESK', 'book'],
    projects: ['PROJECT LAB', 'flask'],
    home: ['HOME BASE', 'house'],
    brain: ['THE PANIC DRAWER', 'scribble'],
    goals: ['IDEA ORACLE', 'stars'],
    scrapbook: ['LIFE ARCHIVE', 'photo'],
    settings: ['BACKSTAGE', 'gear']
  };

  const MONTH_LINES = {
    January:'clean page, suspicious optimism', February:'tiny month, dramatic stationery', March:'open a window, move one thing',
    April:'rainy lists and new ideas', May:'grow something useful or weird', June:'leave room for actual living',
    July:'hydrate before declaring an emergency', August:'half summer, half reset', September:'fresh notebook energy',
    October:'spooky stationery season', November:'keep what works, compost the rest', December:'keep the memories, finish what matters'
  };

  let scheduled = false;

  function visualRoute() {
    const raw = (location.hash || '#cover').slice(1).split('?')[0];
    if (raw === 'cover') return 'cover';
    return PAGE_META[raw] ? raw : 'dashboard';
  }

  function flourishSvg(kind) {
    const common = 'viewBox="0 0 120 120" aria-hidden="true"';
    if (kind === 'book') return `<svg ${common}><path d="M18 28c17-8 31-5 42 4v65c-11-9-25-12-42-4zM102 28c-17-8-31-5-42 4v65c11-9 25-12 42-4z"/><path d="M60 32v65M27 42h23M70 42h23M27 53h23M70 53h23"/></svg>`;
    if (kind === 'flask') return `<svg ${common}><path d="M48 17h24M54 17v33L28 91c-5 8 1 15 10 15h44c9 0 15-7 10-15L66 50V17"/><path d="M40 81c17-9 29 9 45-2M47 91h26"/></svg>`;
    if (kind === 'house') return `<svg ${common}><path d="M18 59 60 22l42 37M29 52v52h62V52M48 104V73h24v31"/><path d="M35 34v-13h16v2"/></svg>`;
    if (kind === 'scribble') return `<svg ${common}><path d="M16 73c20-54 23 39 43-19s21 53 44-12M18 90c23-21 37 11 56-13s16 9 28 1"/><circle cx="24" cy="30" r="3"/><circle cx="94" cy="93" r="3"/></svg>`;
    if (kind === 'photo') return `<svg ${common}><path d="M23 25h74v74H23zM35 72l17-18 15 14 10-9 11 13"/><circle cx="76" cy="45" r="8"/><path d="M18 31 13 94l76 9"/></svg>`;
    if (kind === 'gear') return `<svg ${common}><circle cx="60" cy="60" r="18"/><circle cx="60" cy="60" r="6"/><path d="M60 18v13M60 89v13M18 60h13M89 60h13M30 30l9 9M81 81l9 9M90 30l-9 9M39 81l-9 9"/></svg>`;
    if (kind === 'stars') return `<svg ${common}><path d="M31 19 35 31 47 35 35 39 31 51 27 39 15 35 27 31zM79 51l5 15 15 5-15 5-5 15-5-15-15-5 15-5zM88 20l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/></svg>`;
    return `<svg ${common}><path d="M78 16c-27 5-42 33-30 56 8 16 27 25 46 18-17 17-45 18-62 0C10 67 17 31 45 17c10-5 22-6 33-1z"/><path d="M88 35l3 9 9 3-9 3-3 9-3-9-9-3 9-3zM26 30l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>`;
  }

  function ensureOrnaments(page, current) {
    let tab = document.querySelector('.step2-chapter-tab');
    if (!tab) {
      tab = document.createElement('div');
      tab.className = 'step2-chapter-tab';
      document.body.appendChild(tab);
    }
    if (tab.dataset.page !== current) { tab.dataset.page = current; tab.textContent = PAGE_META[current][0]; }

    let flourish = page.querySelector('.step2-page-flourish');
    if (!flourish) {
      flourish = document.createElement('div');
      flourish.className = 'step2-page-flourish';
      page.prepend(flourish);
    }
    const kind = PAGE_META[current][1];
    if (flourish.dataset.kind !== kind) { flourish.dataset.kind = kind; flourish.innerHTML = flourishSvg(kind); }
  }

  function annotateWeek(page) {
    const grids = page.querySelectorAll('.grid.grid-3');
    if (grids[0]) grids[0].classList.add('weekly-focus-grid');
    if (grids[1]) grids[1].classList.add('week-top-three');
    const review = page.querySelector('.grid.grid-2');
    if (review) review.classList.add('weekly-review-grid');
    const board = page.querySelector('.kanban');
    if (board) board.classList.add('week-board');
  }

  function annotateCalendar(page) {
    const spread = page.querySelector('.month-spread');
    if (!spread) return;
    const collage = spread.querySelector('.month-collage');
    if (collage && !collage.querySelector('.step2-month-stamp')) {
      const title = collage.querySelector('h1')?.textContent?.trim() || '';
      const month = Object.keys(MONTH_LINES).find(name => title.includes(name));
      if (month) {
        const stamp = document.createElement('div');
        stamp.className = 'step2-month-stamp';
        stamp.innerHTML = `<span>☾</span><span>${MONTH_LINES[month]}</span>`;
        const stats = collage.querySelector('.month-scrap-stats');
        if (stats) stats.after(stamp); else collage.appendChild(stamp);
      }
    }
    const calGrid = page.querySelector('.calendar-grid');
    if (calGrid) {
      const shell = calGrid.parentElement;
      if (shell) shell.classList.add('calendar-shell');
    }
  }

  function annotateSchool(page) {
    const action = page.querySelector('.hero-actions');
    if (action && !page.querySelector('.school-desk-note')) {
      const note = document.createElement('div');
      note.className = 'school-desk-note';
      note.textContent = 'Open work gets a next step. Submitted work may sit quietly until feedback arrives.';
      action.after(note);
    }
    page.querySelectorAll('.course-card').forEach(card => card.classList.add('s2-paper-card'));
  }

  function annotateProjects(page) {
    page.querySelectorAll('.project-card').forEach(card => {
      card.classList.add('s2-project-ticket');
      const progress = card.querySelector('.progress');
      if (progress && !progress.getAttribute('aria-label')) progress.setAttribute('aria-label','Project progress');
    });
  }

  function annotateHome(page) {
    const anchor = page.querySelector('.anchor-timeline');
    if (anchor) anchor.closest('div,section')?.classList.add('home-rhythm');
    const grid = page.querySelector('.grid.grid-2');
    if (grid) grid.classList.add('home-board-grid');
  }

  function annotateBrain(page) {
    const savedTitle = [...page.querySelectorAll('.section-title')].find(x => /Saved Dumps/i.test(x.textContent || ''));
    if (savedTitle) {
      const next = savedTitle.nextElementSibling;
      if (next) next.classList.add('brain-archive');
    }
  }

  function annotateScrapbook(page) {
    page.querySelectorAll('.polaroid img').forEach(img => {
      img.loading = 'lazy';
      img.decoding = 'async';
      if (!img.getAttribute('draggable')) img.setAttribute('draggable','false');
    });
    const board = page.querySelector('.scrapbook-board');
    if (board) board.setAttribute('aria-label','Draggable memory scrapbook board');
  }

  function annotateGeneric(page) {
    page.querySelectorAll('.card').forEach((card, i) => {
      if (i % 4 === 1) card.classList.add('s2-paper-card');
    });
  }

  function detectEditing() {
    const editing = !!document.querySelector('.planner-section-editing,.decoration-layer.editing,.decor-layer.editing,.planner-edit-active');
    document.body.classList.toggle('step2-editing', editing);
  }

  function apply() {
    scheduled = false;
    const current = visualRoute();
    document.body.dataset.step2Page = current;
    if (current === 'cover') {
      document.querySelector('.step2-chapter-tab')?.remove();
      document.body.classList.remove('step2-editing');
      return;
    }
    const page = document.querySelector('#main-content .page');
    if (!page) return;
    ensureOrnaments(page, current);
    annotateGeneric(page);
    if (current === 'week') annotateWeek(page);
    if (current === 'calendar') annotateCalendar(page);
    if (current === 'school') annotateSchool(page);
    if (current === 'projects') annotateProjects(page);
    if (current === 'home') annotateHome(page);
    if (current === 'brain') annotateBrain(page);
    if (current === 'scrapbook') annotateScrapbook(page);
    detectEditing();
  }

  function queueApply() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(apply);
  }

  const observer = new MutationObserver(queueApply);
  const main = document.getElementById('main-content');
  if (main) observer.observe(main, { childList: true, subtree: true });
  window.addEventListener('hashchange', queueApply);
  window.addEventListener('resize', () => document.body.dataset.step2Viewport = innerWidth < 681 ? 'phone' : innerWidth < 901 ? 'tablet' : 'desktop');
  document.body.dataset.step2Viewport = innerWidth < 681 ? 'phone' : innerWidth < 901 ? 'tablet' : 'desktop';
  queueApply();
})();

