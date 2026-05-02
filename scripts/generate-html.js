const fs = require('fs');
const path = require('path');

const html = /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Cycle Calendar</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --menstrual: #e8756a;
      --follicular: #6dbf8c;
      --ovulatory: #f5c842;
      --luteal: #9b8ec4;
      --pms: #c47b9b;
      --pink: #c2567a;
      --pink-light: #f9e5ee;
      --border: #f0dde8;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #fdf6f9;
      color: #333;
      user-select: none;
    }

    /* ── TOP BAR ── */
    #topbar {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      padding: 12px 20px;
      background: #fff;
      border-bottom: 1px solid var(--border);
      gap: 10px;
    }
    .top-left { display: flex; align-items: center; min-width: 0; }
    .top-right { display: flex; align-items: center; justify-content: flex-end; }

    #person-select {
      max-width: 220px;
      border: 1px solid #e2b4c8;
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 0.85rem;
      color: #333;
      background: #fff;
    }

    #cycle-title {
      text-align: center;
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--pink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: min(68vw, 580px);
    }

    #add-cycle-btn {
      position: relative;
      width: 34px; height: 34px;
      border: 1px solid #e2b4c8;
      border-radius: 50%;
      background: #fff;
      color: var(--pink);
      font-size: 1.3rem;
      line-height: 1;
      cursor: pointer;
    }
    #add-cycle-btn:hover { background: var(--pink-light); }
    #add-cycle-btn::after {
      content: attr(data-tooltip);
      position: absolute;
      right: 0; top: calc(100% + 8px);
      background: #2c2c34; color: #fff;
      padding: 6px 8px; border-radius: 6px;
      font-size: 0.7rem; white-space: nowrap;
      opacity: 0; pointer-events: none;
      transform: translateY(-4px);
      transition: opacity 0.15s, transform 0.15s;
    }
    #add-cycle-btn:hover::after { opacity: 1; transform: translateY(0); }

    /* ── STATUS BAR ── */
    #statusbar {
      display: flex; justify-content: center;
      padding: 8px 20px;
      background: #fff8fb;
      border-bottom: 1px solid var(--border);
    }
    #next-badge {
      font-size: 0.82rem; font-weight: 600;
      padding: 6px 14px; border-radius: 20px;
      background: var(--pink-light); color: var(--pink);
    }

    /* ── LEGEND ── */
    #legend {
      display: flex; gap: 14px; flex-wrap: wrap; justify-content: center;
      padding: 6px 20px; font-size: 0.76rem;
      background: #fff8fb; border-bottom: 1px solid var(--border);
    }
    .legend-dot {
      display: inline-block;
      width: 11px; height: 11px;
      border-radius: 50%; margin-right: 4px; vertical-align: middle;
    }
    .dot-menstrual { background: var(--menstrual); }
    .dot-follicular { background: var(--follicular); }
    .dot-ovulatory { background: var(--ovulatory); }
    .dot-luteal { background: var(--luteal); }
    .dot-pms { background: var(--pms); }
    .dot-today { background: #000; }

    /* ── CALENDAR ── */
    #cal-wrap { padding: 16px 20px 20px; position: relative; }

    .month-nav {
      display: flex; align-items: center; justify-content: center;
      gap: 20px; margin-bottom: 10px;
    }
    .month-nav button {
      background: none; border: 1px solid #e2b4c8;
      border-radius: 8px; padding: 3px 12px;
      font-size: 1rem; cursor: pointer; color: var(--pink);
    }
    .month-nav button:hover { background: var(--pink-light); }
    .month-nav span { font-weight: 700; font-size: 1rem; color: var(--pink); }

    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 5px;
    }
    .dow {
      text-align: center; font-size: 0.72rem;
      font-weight: 700; color: #aaa; padding-bottom: 4px;
    }

    .day-cell {
      border-radius: 10px; min-height: 68px;
      padding: 5px 7px;
      background: #fff; border: 1px solid var(--border);
      position: relative; transition: transform 0.1s;
      cursor: pointer;
    }
    .day-cell:hover { transform: scale(1.03); }
    .day-cell.empty { background: transparent; border: none; cursor: default; }
    .day-cell.empty:hover { transform: none; }

    .day-num { font-size: 0.8rem; font-weight: 600; color: #555; }

    /* Phase colour stripe at top */
    .day-cell::before {
      content: ''; display: block;
      height: 6px; border-radius: 3px; margin-bottom: 4px;
      background: #efefef;
    }
    .day-cell.phase-menstrual::before { background: var(--menstrual); }
    .day-cell.phase-follicular::before { background: var(--follicular); }
    .day-cell.phase-ovulatory::before { background: var(--ovulatory); }
    .day-cell.phase-luteal::before { background: var(--luteal); }
    .day-cell.phase-pms::before { background: var(--pms); }

    .phase-label {
      font-size: 0.62rem; font-weight: 600; margin-top: 2px;
    }
    .phase-menstrual .phase-label { color: var(--menstrual); }
    .phase-follicular .phase-label { color: #3d9e6a; }
    .phase-ovulatory .phase-label { color: #b89a00; }
    .phase-luteal .phase-label { color: #7060a8; }
    .phase-pms .phase-label { color: var(--pms); }

    /* Today — thick black border */
    .day-cell.is-today {
      border: 3px solid #111 !important;
      box-shadow: 0 0 0 2px rgba(0,0,0,0.12);
    }
    .day-cell.is-today .day-num { color: #111; font-weight: 800; }

    /* Empty state */
    #empty-state {
      position: absolute; inset: 62px 20px 20px;
      border: 2px dashed #e8bfd0; border-radius: 14px;
      background: rgba(255,255,255,0.8);
      display: none; align-items: center; justify-content: center;
      color: #8d5c6e; font-size: 0.92rem; text-align: center; padding: 18px;
    }
    #empty-state.show { display: flex; }

    /* ── DAY DETAIL OVERLAY ── */
    #detail-overlay {
      display: none;
      position: fixed; inset: 0;
      background: rgba(30,15,22,0.55);
      z-index: 20;
      align-items: center; justify-content: center;
      padding: 20px;
    }
    #detail-overlay.open { display: flex; }

    #detail-panel {
      width: min(94vw, 460px);
      max-height: 80vh;
      background: #fff; border-radius: 16px;
      border: 1px solid var(--border);
      box-shadow: 0 24px 48px rgba(60,20,40,0.22);
      display: flex; flex-direction: column;
      overflow: hidden;
    }

    #detail-header {
      padding: 16px 20px 12px;
      border-bottom: 1px solid var(--border);
      position: relative;
    }
    #detail-phase-bar {
      height: 6px; border-radius: 3px; margin-bottom: 10px;
    }
    #detail-title { font-size: 1.1rem; font-weight: 700; color: #222; }
    #detail-subtitle { font-size: 0.8rem; color: #888; margin-top: 2px; }
    #detail-close {
      position: absolute; top: 14px; right: 16px;
      background: none; border: none; font-size: 1.3rem;
      color: #aaa; cursor: pointer; line-height: 1;
    }
    #detail-close:hover { color: #555; }

    #detail-body { overflow-y: auto; padding: 16px 20px 20px; flex: 1; }

    .detail-blurb {
      font-size: 0.92rem; color: #444; line-height: 1.55;
      margin-bottom: 14px; font-style: italic;
    }

    .detail-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 10px; margin-bottom: 14px;
    }
    .detail-card {
      background: #fdf6f9; border-radius: 10px;
      border: 1px solid var(--border);
      padding: 10px 12px;
    }
    .detail-card-label {
      font-size: 0.66rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: #a07080; margin-bottom: 3px;
    }
    .detail-card-value { font-size: 0.88rem; color: #333; font-weight: 600; }

    .detail-section-title {
      font-size: 0.73rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: #a07080;
      margin-bottom: 6px; margin-top: 12px;
    }
    .detail-partner-tip {
      background: #fff5f9; border-left: 3px solid var(--pink);
      border-radius: 0 8px 8px 0; padding: 10px 14px;
      font-size: 0.88rem; color: #444; line-height: 1.5;
    }

    /* ── MODALS (shared) ── */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(47,26,34,0.48);
      display: none; align-items: center; justify-content: center;
      padding: 20px; z-index: 30;
    }
    .modal-backdrop.open { display: flex; }

    .modal {
      width: min(94vw, 430px); background: #fff;
      border-radius: 14px; border: 1px solid var(--border);
      padding: 18px;
      box-shadow: 0 22px 40px rgba(79,31,49,0.2);
    }
    .modal h2 { font-size: 1.1rem; color: var(--pink); margin-bottom: 6px; }
    .modal p { font-size: 0.86rem; color: #6f6067; margin-bottom: 14px; }
    .modal label { display: block; font-size: 0.8rem; color: #705662; margin-bottom: 5px; }
    .modal input[type="text"],
    .modal input[type="date"] {
      width: 100%; border: 1px solid #e2b4c8;
      border-radius: 8px; padding: 8px 10px;
      font-size: 0.92rem; margin-bottom: 12px;
    }

    .radio-group {
      display: flex; gap: 12px; margin-bottom: 14px;
    }
    .radio-option {
      flex: 1; border: 2px solid #e2b4c8; border-radius: 10px;
      padding: 10px 12px; cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .radio-option input { display: none; }
    .radio-option.selected {
      border-color: var(--pink); background: var(--pink-light);
    }
    .radio-option-title { font-size: 0.88rem; font-weight: 700; color: #444; }
    .radio-option-desc { font-size: 0.73rem; color: #888; margin-top: 2px; }
    .radio-option.selected .radio-option-title { color: var(--pink); }

    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 2px; }
    .btn-secondary, .btn-primary {
      border: none; border-radius: 8px; padding: 8px 14px;
      font-size: 0.85rem; cursor: pointer;
    }
    .btn-secondary { background: #efe4ea; color: #6e5e66; }
    .btn-primary { background: var(--pink); color: #fff; }
    .btn-primary:hover { background: #a8405f; }
    .btn-secondary:hover { background: #e6d8df; }

    #modal-error { color: #ba345d; font-size: 0.78rem; min-height: 1em; margin-bottom: 6px; }
  </style>
</head>
<body>

<div id="topbar">
  <div class="top-left">
    <select id="person-select" aria-label="Select a tracked cycle"></select>
  </div>
  <h1 id="cycle-title">Cycle Calendar</h1>
  <div class="top-right">
    <button id="add-cycle-btn" data-tooltip="Add a cycle to track" aria-label="Add a cycle to track">+</button>
  </div>
</div>

<div id="statusbar">
  <div id="next-badge">Add a cycle to track</div>
</div>

<div id="legend">
  <span><span class="legend-dot dot-menstrual"></span>Menstrual</span>
  <span><span class="legend-dot dot-follicular"></span>Follicular</span>
  <span><span class="legend-dot dot-ovulatory"></span>Ovulatory</span>
  <span><span class="legend-dot dot-luteal"></span>Luteal</span>
  <span><span class="legend-dot dot-pms"></span>PMS</span>
  <span><span class="legend-dot dot-today"></span>Today</span>
</div>

<div id="cal-wrap">
  <div class="month-nav">
    <button id="prev-month">&#8592;</button>
    <span id="month-label"></span>
    <button id="next-month">&#8594;</button>
  </div>
  <div class="cal-grid" id="cal-grid"></div>
  <div id="empty-state">No cycle selected yet. Click the + button to add a cycle to track.</div>
</div>

<!-- Day detail overlay -->
<div id="detail-overlay" role="dialog" aria-modal="true">
  <div id="detail-panel">
    <div id="detail-header">
      <div id="detail-phase-bar"></div>
      <div id="detail-title"></div>
      <div id="detail-subtitle"></div>
      <button id="detail-close" aria-label="Close">&#x2715;</button>
    </div>
    <div id="detail-body">
      <div class="detail-blurb" id="detail-blurb"></div>
      <div class="detail-grid" id="detail-grid"></div>
      <div class="detail-section-title">Partner tip</div>
      <div class="detail-partner-tip" id="detail-partner"></div>
    </div>
  </div>
</div>

<!-- Add cycle modal -->
<div id="cycle-modal" class="modal-backdrop" role="dialog" aria-modal="true">
  <div class="modal">
    <h2>Add cycle to track</h2>
    <p>Enter the person and the first day of their current or most recent cycle.</p>

    <label for="person-name">Person name</label>
    <input type="text" id="person-name" maxlength="50" placeholder="e.g. My girlfriend" />

    <label>Cycle type</label>
    <div class="radio-group">
      <label class="radio-option selected" id="opt-natural">
        <input type="radio" name="cycle-type" value="natural" checked />
        <div class="radio-option-title">Natural</div>
        <div class="radio-option-desc">Not on the pill</div>
      </label>
      <label class="radio-option" id="opt-pill">
        <input type="radio" name="cycle-type" value="pill" />
        <div class="radio-option-title">On the pill</div>
        <div class="radio-option-desc">Taking oral contraceptives</div>
      </label>
    </div>

    <label for="cycle-start" id="cycle-start-label">First day of most recent cycle</label>
    <input type="date" id="cycle-start" />

    <div id="modal-error"></div>
    <div class="modal-actions">
      <button id="cancel-cycle-btn" class="btn-secondary" type="button">Cancel</button>
      <button id="save-cycle-btn" class="btn-primary" type="button">Save</button>
    </div>
  </div>
</div>

<script>
  // ── Phase data ──────────────────────────────────────────────────────
  // 28-day table from the cycle reference sheet.
  // Each entry: [naturalEnergy, pillEnergy, naturalSexDrive, pillSexDrive, food, movement, partnerTip, blurb]
  const DAY_DATA = [
    /*1*/  ['Very Low','Low','Low','Low','Iron-rich warm foods','Rest','Be nurturing','Full reset — your body is shedding and renewing. Rest is medicine right now.'],
    /*2*/  ['Very Low','Low','Low','Low','Magnesium-rich foods','Light walk','Gentle support','Peak symptoms today. Go slow, honour the heaviness.'],
    /*3*/  ['Low','Low','Low','Low','Protein + iron','Light yoga','Low pressure','Recovery begins. A little movement helps but don\'t push.'],
    /*4*/  ['Low','Low','Low','Low','Balanced meals','Light','Give space','Energy slowly returns. Warmth and comfort are welcome.'],
    /*5*/  ['Low-Med','Med','Low','Low','Fresh whole foods','Walk','Encourage','Transition phase — the fog is lifting.'],
    /*6*/  ['Medium','Medium','Rising','Moderate','Protein-focused','Moderate','Engage lightly','Stabilizing. A good day to re-enter the world.'],
    /*7*/  ['Medium','Medium','Rising','Moderate','Balanced meals','Moderate','Be social','Back online — social energy is returning.'],
    /*8*/  ['Medium','Medium','Rising','Moderate','Clean whole foods','Moderate','Plan together','Momentum builds. Good time to make plans.'],
    /*9*/  ['Medium','Medium','Rising','Moderate','Focus foods','Workout','Support goals','Clarity rising — sharp thinking, great for goals.'],
    /*10*/ ['High','Medium-High','High','Moderate','Fuel up','Workout','Be playful','Confidence building. Physical and mental energy aligning.'],
    /*11*/ ['High','Medium-High','High','Moderate','Balanced meals','Workout','Engage','Social energy is high — outgoing and warm.'],
    /*12*/ ['High','High','High','Moderate','Complex carbs','Intense','Encourage','High performance day. Push for what you want.'],
    /*13*/ ['High','High','High','Moderate','Fuel up','Intense','Be fun','Aligned energy — one of the best days of the cycle.'],
    /*14*/ ['Very High','Medium-High','Peak','Moderate','Light fresh foods','Intense','Flirt','Peak attraction and charisma. Ovulation day.'],
    /*15*/ ['High','High','High','Moderate','Balanced meals','Workout','Be active','Strong energy continues post-ovulation.'],
    /*16*/ ['High','High','High','Moderate','Balanced meals','Workout','Stay engaged','Sustained momentum — make the most of it.'],
    /*17*/ ['Medium','Medium','Moderate','Moderate','Balanced meals','Moderate','Be steady','Balanced productivity. Good for focused work.'],
    /*18*/ ['Medium','Medium','Moderate','Moderate','Balanced meals','Moderate','Support','Grounded energy — reliable and calm.'],
    /*19*/ ['Medium','Medium','Moderate','Moderate','Comfort foods','Moderate','Be patient','Emotional depth increases. Great for meaningful talks.'],
    /*20*/ ['Medium-Low','Low','Moderate','Low','Magnesium-rich foods','Light','Check in','Fatigue starts creeping in. Be gentle with expectations.'],
    /*21*/ ['Low','Low','Low','Low','Comfort foods','Light','Be calm','Slow down. The body is winding toward rest.'],
    /*22*/ ['Low','Low','Low','Low','Balanced meals','Light','Reduce stress','Energy dipping. Avoid over-scheduling today.'],
    /*23*/ ['Low','Low','Low','Low','Comfort foods','Light','Support','Sensitive mood — a kind word goes a long way.'],
    /*24*/ ['Low','Low','Low','Low','Cravings-friendly','Light','Reassure','Body needs comfort. Cravings are real and valid.'],
    /*25*/ ['Low','Low','Low','Low','Comfort foods','Rest','Avoid conflict','Low tolerance for stress. Keep things quiet.'],
    /*26*/ ['Very Low','Low','Low','Low','Warm nourishing food','Rest','Be gentle','Fatigue is strong. Warmth and rest are everything.'],
    /*27*/ ['Very Low','Low','Low','Low','Comfort foods','Rest','Give space','Reset incoming. Space and quiet are gifts right now.'],
    /*28*/ ['Very Low','Low','Low','Low','Nourishing foods','Rest','Be soft','Full reset. The cycle ends and begins again.'],
  ];

  // Natural cycle phases (day 1-28)
  const NATURAL_PHASES = [
    'menstrual','menstrual','menstrual','menstrual','menstrual', // 1-5
    'follicular','follicular','follicular','follicular','follicular','follicular','follicular','follicular', // 6-13
    'ovulatory', // 14
    'luteal','luteal','luteal','luteal','luteal','luteal','luteal', // 15-21
    'pms','pms','pms','pms','pms','pms','pms' // 22-28
  ];

  // Pill cycle phases (day 1-28)
  // Days 1-21: on pill → follicular(1-13), ovulatory(14), luteal(15-21)
  // Days 22-28: off pill → pms(22-23), menstrual starts day 24 (day 3 of off week)
  const PILL_PHASES = [
    'follicular','follicular','follicular','follicular','follicular','follicular','follicular',
    'follicular','follicular','follicular','follicular','follicular','follicular', // 1-13
    'ovulatory', // 14
    'luteal','luteal','luteal','luteal','luteal','luteal','luteal', // 15-21
    'pms','pms', // 22-23
    'menstrual','menstrual','menstrual','menstrual','menstrual' // 24-28
  ];

  const PHASE_COLORS = {
    menstrual: '#e8756a',
    follicular: '#6dbf8c',
    ovulatory: '#f5c842',
    luteal: '#9b8ec4',
    pms: '#c47b9b',
    unknown: '#efefef'
  };

  const PHASE_LABELS = {
    menstrual: 'Menstrual',
    follicular: 'Follicular',
    ovulatory: 'Ovulatory',
    luteal: 'Luteal',
    pms: 'PMS',
    unknown: ''
  };

  const CYCLE_LEN = 28;
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DOW_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // ── Persistence ─────────────────────────────────────────────────────
  const CYCLES_KEY = 'cyclesV2';
  const ACTIVE_CYCLE_KEY = 'activeCycleId';

  let cycles = [];
  let activeCycleId = null;
  let viewYear, viewMonth;
  let modalForced = false;

  function loadCycles() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CYCLES_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter(c => c && c.id && c.name && c.startDate) : [];
    } catch { return []; }
  }

  function saveCycles() { localStorage.setItem(CYCLES_KEY, JSON.stringify(cycles)); }
  function loadActiveId() { return localStorage.getItem(ACTIVE_CYCLE_KEY) || null; }
  function saveActiveId(id) {
    if (!id) localStorage.removeItem(ACTIVE_CYCLE_KEY);
    else localStorage.setItem(ACTIVE_CYCLE_KEY, id);
  }

  function getActiveCycle() {
    return cycles.find(c => c.id === activeCycleId) || null;
  }

  function syncActiveId() {
    if (!cycles.length) { activeCycleId = null; saveActiveId(null); return; }
    if (!cycles.some(c => c.id === activeCycleId)) {
      activeCycleId = cycles[0].id; saveActiveId(activeCycleId);
    }
  }

  // ── Cycle math ──────────────────────────────────────────────────────
  function today() {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function toDateStr(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth()+1).padStart(2,'0') + '-' +
      String(d.getDate()).padStart(2,'0');
  }

  function parseDate(str) {
    if (!str) return null;
    const [y,m,d] = str.split('-').map(Number);
    return new Date(y, m-1, d);
  }

  function cycleDay(targetDate, startStr, type) {
    const start = parseDate(startStr);
    if (!start) return null;
    const diff = Math.round((targetDate - start) / 86400000);
    // Normalise to 0-based index within cycle
    const idx = ((diff % CYCLE_LEN) + CYCLE_LEN) % CYCLE_LEN;
    return idx + 1; // 1-based
  }

  function phaseFor(targetDate, cycle) {
    const day = cycleDay(targetDate, cycle.startDate, cycle.type);
    if (!day) return 'unknown';
    const phases = cycle.type === 'pill' ? PILL_PHASES : NATURAL_PHASES;
    return phases[day - 1] || 'unknown';
  }

  // ── Badge ────────────────────────────────────────────────────────────
  function updateBadge(cycle) {
    const badge = document.getElementById('next-badge');
    if (!cycle) { badge.textContent = 'Add a cycle to track'; return; }
    const t = today();
    const currentPhase = phaseFor(t, cycle);
    let next = new Date(t);
    for (let i = 0; i < 28; i++) {
      next.setDate(next.getDate() + 1);
      if (phaseFor(next, cycle) !== currentPhase) break;
    }
    const daysAway = Math.round((next - t) / 86400000);
    const nextPhase = phaseFor(next, cycle);
    const when = daysAway === 1 ? 'tomorrow' : 'in ' + daysAway + ' days';
    badge.textContent = cycle.name + ': ' + PHASE_LABELS[nextPhase] + ' starts ' + when + ' (' + toDateStr(next) + ')';
  }

  // ── Calendar render ──────────────────────────────────────────────────
  function renderCalendar() {
    const active = getActiveCycle();
    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    DOW_LABELS.forEach(d => {
      const el = document.createElement('div');
      el.className = 'dow'; el.textContent = d;
      grid.appendChild(el);
    });

    const firstDay = new Date(viewYear, viewMonth, 1);
    const startDow = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayStr = toDateStr(today());

    for (let i = 0; i < startDow; i++) {
      const blank = document.createElement('div');
      blank.className = 'day-cell empty'; grid.appendChild(blank);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      const dateStr = toDateStr(dateObj);
      const phase = active ? phaseFor(dateObj, active) : 'unknown';

      const cell = document.createElement('div');
      cell.className = 'day-cell phase-' + phase;
      if (dateStr === todayStr) cell.classList.add('is-today');

      const numEl = document.createElement('div');
      numEl.className = 'day-num'; numEl.textContent = d;
      cell.appendChild(numEl);

      if (active && phase !== 'unknown') {
        const lbl = document.createElement('div');
        lbl.className = 'phase-label';
        lbl.textContent = PHASE_LABELS[phase];
        cell.appendChild(lbl);
      }

      if (active) {
        cell.addEventListener('click', () => openDetail(dateObj, active));
      }

      grid.appendChild(cell);
    }

    document.getElementById('month-label').textContent = MONTHS[viewMonth] + ' ' + viewYear;
  }

  // ── Top bar / select ─────────────────────────────────────────────────
  function renderSelect() {
    const sel = document.getElementById('person-select');
    sel.innerHTML = '';
    if (!cycles.length) {
      const o = document.createElement('option');
      o.textContent = 'No cycles tracked yet'; o.value = '';
      sel.appendChild(o); sel.disabled = true; return;
    }
    cycles.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.name;
      if (c.id === activeCycleId) o.selected = true;
      sel.appendChild(o);
    });
    sel.disabled = false;
  }

  function cycleLabel(name) {
    if (!name) return 'Cycle Calendar';
    const t = name.trim();
    return t.endsWith('s') ? t + "' Cycle" : t + "'s Cycle";
  }

  function refreshView() {
    syncActiveId();
    renderSelect();
    const active = getActiveCycle();
    document.getElementById('cycle-title').textContent = active ? cycleLabel(active.name) : 'Cycle Calendar';
    updateBadge(active);
    renderCalendar();
    document.getElementById('empty-state').classList.toggle('show', !cycles.length);
  }

  // ── Day detail ────────────────────────────────────────────────────────
  function openDetail(dateObj, cycle) {
    const day = cycleDay(dateObj, cycle.startDate, cycle.type);
    if (!day) return;
    const phases = cycle.type === 'pill' ? PILL_PHASES : NATURAL_PHASES;
    const phase = phases[day - 1];
    const data = DAY_DATA[day - 1];
    const isPill = cycle.type === 'pill';

    // energy index: 0=naturalEnergy, 1=pillEnergy
    const energy = isPill ? data[1] : data[0];
    const sexDrive = isPill ? data[3] : data[2];
    const food = data[4];
    const movement = data[5];
    const partnerTip = data[6];
    const blurb = data[7];

    const color = PHASE_COLORS[phase] || '#ccc';
    document.getElementById('detail-phase-bar').style.background = color;
    document.getElementById('detail-title').textContent =
      'Day ' + day + ' — ' + PHASE_LABELS[phase];
    document.getElementById('detail-subtitle').textContent =
      cycle.name + ' · ' + MONTHS[dateObj.getMonth()] + ' ' + dateObj.getDate() + ', ' + dateObj.getFullYear();
    document.getElementById('detail-blurb').textContent = blurb;
    document.getElementById('detail-partner').textContent = partnerTip;

    const gridEl = document.getElementById('detail-grid');
    gridEl.innerHTML = '';
    [
      ['Energy', energy],
      ['Sex drive', sexDrive],
      ['Food focus', food],
      ['Movement', movement],
    ].forEach(([label, value]) => {
      const card = document.createElement('div');
      card.className = 'detail-card';
      card.innerHTML = '<div class="detail-card-label">' + label + '</div>' +
        '<div class="detail-card-value">' + value + '</div>';
      gridEl.appendChild(card);
    });

    document.getElementById('detail-overlay').classList.add('open');
  }

  function closeDetail() {
    document.getElementById('detail-overlay').classList.remove('open');
  }

  // ── Add-cycle modal ──────────────────────────────────────────────────
  function openModal(force) {
    modalForced = !!force;
    document.getElementById('cycle-modal').classList.add('open');
    document.getElementById('cancel-cycle-btn').style.display = force ? 'none' : 'inline-block';
    document.getElementById('modal-error').textContent = '';
    document.getElementById('person-name').focus();
  }

  function closeModal() {
    if (modalForced) return;
    document.getElementById('cycle-modal').classList.remove('open');
    document.getElementById('modal-error').textContent = '';
  }

  function saveCycleFromModal() {
    const name = document.getElementById('person-name').value.trim();
    const startDate = document.getElementById('cycle-start').value;
    const type = document.querySelector('input[name="cycle-type"]:checked').value;
    const errEl = document.getElementById('modal-error');

    if (!name) { errEl.textContent = 'Enter a name before saving.'; return; }
    if (!startDate) { errEl.textContent = 'Select a start date before saving.'; return; }

    const cycle = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2,8),
      name, startDate, type
    };
    cycles.push(cycle);
    saveCycles();
    activeCycleId = cycle.id;
    saveActiveId(activeCycleId);

    document.getElementById('person-name').value = '';
    document.getElementById('cycle-start').value = '';
    document.getElementById('cycle-modal').classList.remove('open');
    modalForced = false;
    refreshView();
  }

  // ── Init ──────────────────────────────────────────────────────────────
  const t = today();
  viewYear = t.getFullYear(); viewMonth = t.getMonth();
  cycles = loadCycles();
  activeCycleId = loadActiveId();
  syncActiveId();

  // Radio toggle
  document.querySelectorAll('.radio-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.radio-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
      const isPill = opt.querySelector('input').value === 'pill';
      document.getElementById('cycle-start-label').textContent =
        isPill ? 'First pill day of most recent pack' : 'First day of most recent cycle';
    });
  });

  document.getElementById('prev-month').addEventListener('click', () => {
    if (viewMonth === 0) { viewMonth = 11; viewYear--; } else viewMonth--;
    refreshView();
  });
  document.getElementById('next-month').addEventListener('click', () => {
    if (viewMonth === 11) { viewMonth = 0; viewYear++; } else viewMonth++;
    refreshView();
  });
  document.getElementById('person-select').addEventListener('change', e => {
    activeCycleId = e.target.value; saveActiveId(activeCycleId); refreshView();
  });
  document.getElementById('add-cycle-btn').addEventListener('click', () => openModal(false));
  document.getElementById('cancel-cycle-btn').addEventListener('click', closeModal);
  document.getElementById('save-cycle-btn').addEventListener('click', saveCycleFromModal);
  document.getElementById('cycle-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('cycle-modal') && !modalForced) closeModal();
  });
  document.getElementById('detail-close').addEventListener('click', closeDetail);
  document.getElementById('detail-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('detail-overlay')) closeDetail();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (document.getElementById('detail-overlay').classList.contains('open')) closeDetail();
      else if (document.getElementById('cycle-modal').classList.contains('open') && !modalForced) closeModal();
    }
  });

  refreshView();
  if (!cycles.length) openModal(true);
</script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '..', 'index.html'), html, 'utf8');
console.log('index.html written successfully');
