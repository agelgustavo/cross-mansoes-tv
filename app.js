/* Cross Mansões TV — controlador de interface v2.0.0
 * Sem dependências no runtime. Renderização determinística e navegação delegada.
 * Os dados são independentes dos componentes de apresentação.
 */
(() => {
  'use strict';
  const VERSION = '2.1.0';
  const app = document.getElementById('app');
  if (!app) throw new Error('Root #app ausente');
  const TYPES = {
    crossfit: { label: 'CROSSFIT', accent: '#ef303b' },
    hybrid: { label: 'HYBRID RUN', accent: '#2f9bf2' }
  };
  const state = {
    screen: 'calendar', date: '', program: '', month: new Date().getMonth(),
    year: new Date().getFullYear(), days: {}, slide: 0, workout: null,
    error: '', focusedDate: '', requestId: 0
  };
  let selected = null;

  function encode(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function dateKey(date) { return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; }
  function dateLabel(key) { return new Date(key + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); }
  function cleanPrograms(value) { return Array.isArray(value) ? value.filter(x => Object.prototype.hasOwnProperty.call(TYPES, x)) : []; }
  function pagesFromWorkout(workout) {
    if (!workout) return [];
    const result = [];
    for (const [field, label] of [['warmup', 'AQUECIMENTO'], ['skill', 'SKILL / STRENGTH'], ['wod', 'WOD'], ['adaptations', 'ADAPTAÇÕES']]) {
      const value = workout[field];
      let text = Array.isArray(value) ? value.join('\n') : typeof value === 'string' ? value : value && value.text || '';
      text = String(text).replace(/\n\s*---PAGE---\s*\n/g, '\n\n').trim();
      if (!text) continue;
      result.push({ label, kind: field, text });
    }
    return result;
  }
  async function fetchJSON(path) {
    const url = `${path}${path.includes('?') ? '&' : '?'}_=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status} em ${path}`);
    return response.json();
  }
  function readSavedIndex() {
    try { return JSON.parse(localStorage.getItem('mansoes-tv-index-v2') || '{}'); }
    catch { return {}; }
  }
  function persistIndex(value) {
    try { localStorage.setItem('mansoes-tv-index-v2', JSON.stringify(value)); }
    catch { /* armazenamento opcional */ }
  }
  async function loadIndex() {
    try {
      const response = await fetchJSON('./data/index.json');
      const clean = {};
      for (const [date, programs] of Object.entries(response.days || {})) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) clean[date] = cleanPrograms(programs);
      }
      state.days = clean;
      state.error = '';
      persistIndex(clean);
    } catch (err) {
      console.error('[Cross Mansões TV] Índice indisponível:', err);
      state.days = readSavedIndex();
      state.error = 'Falha ao atualizar treinos. Verifique a conexão.';
    }
    if (state.screen === 'calendar') render();
  }

  function tickClock() {
    const clock = document.getElementById('clock');
    if (!clock) return;
    try {
      clock.textContent = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date());
    } catch {
      const now = new Date();
      clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
  }
  function shell(inner, footer = '') {
    const type = TYPES[state.program];
    document.documentElement.style.setProperty('--accent', type ? type.accent : '#ef303b');
    document.body.classList.toggle('hybrid-mode', state.program === 'hybrid');
    return `<header class="tv-header">
      <div class="brand"><img src="./assets/gorilla-icon.jpg" alt="Gorila Mansões" class="brand-icon"><span>CROSS <b>MANSÕES</b><small>CROSSTRAINING</small></span></div>
      <div class="top-meta"><span class="screen-state">${encode(state.screen === 'calendar' ? 'CALENDÁRIO' : state.date ? dateLabel(state.date) : '')}</span><div id="clock" aria-label="Relógio de Brasília">--:--</div></div>
    </header>${inner}<footer class="footer"><div class="footer-left">${encode(state.error || footer || '← → Navegar · OK Selecionar · Voltar Calendário')}</div>
      <div class="nav"><span class="version">v${VERSION}</span><button type="button" data-action="home">⌂ Calendário</button><button type="button" data-action="refresh">↻ Atualizar</button></div></footer>`;
  }
  function calendar() {
    const first = new Date(state.year, state.month, 1);
    const offset = (first.getDay() + 6) % 7;
    const title = first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const weekdays = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
    let grid = weekdays.map(d => `<div class="weekday">${d}</div>`).join('');
    for (let i = 0; i < 42; i++) {
      const day = new Date(state.year, state.month, 1 - offset + i);
      const key = dateKey(day);
      const programs = state.days[key] || [];
      const isToday = key === dateKey(new Date());
      grid += `<button type="button" class="day${day.getMonth() !== state.month ? ' outside' : ''}${isToday ? ' today' : ''}" data-action="day" data-date="${key}" aria-label="${key}, ${programs.length} modalidades">
        <span class="n">${day.getDate()}</span><span class="dots">${programs.includes('crossfit') ? '<i class="dot red"></i>' : ''}${programs.includes('hybrid') ? '<i class="dot blue"></i>' : ''}</span>${programs.length ? '<span class="published">TREINO</span>' : '<span class="emptyhint">Sem treino</span>'}</button>`;
    }
    return `<div class="toolbar"><button type="button" data-action="month" data-step="-1" aria-label="Mês anterior">◀</button><strong>${encode(title)}</strong><button type="button" data-action="month" data-step="1" aria-label="Próximo mês">▶</button></div>
      <main class="calendar" aria-label="Calendário de treinos">${grid}</main>`;
  }
  function programChooser() {
    const programs = state.days[state.date] || [];
    return `<main class="panel"><div class="eyebrow">${encode(dateLabel(state.date))}</div><h1>ESCOLHA A MODALIDADE</h1>
      <div class="choices">${programs.map(p => `<button type="button" data-action="open" data-program="${p}" class="choice ${p === 'crossfit' ? 'redtxt' : 'bluetxt'}">${TYPES[p].label}<small>OK PARA ABRIR →</small></button>`).join('')}</div></main>`;
  }
  function textRows(text) {
    return text.split('\n').map(x => x.trim()).filter(Boolean).map(line => {
      const q = line.match(/^[-•]?\s*(\d[\d.,]*(?:\s*m|\s*\")?)\s+(.+)$/i);
      if (q) return `<div class="workout-row"><b>${encode(q[1])}</b><span>${encode(q[2])}</span></div>`;
      if (/^(SCORE|TIME CAP|DURAÇÃO|REST|DESCANSO|EVERY |FOR TIME|TABATA|TEAMS OF |BODY BUILDER|OPTIONAL|PREPARAÇÃO|\d+\s*(ROUNDS|SETS))/i.test(line)) {
        return `<div class="workout-section">${encode(line)}</div>`;
      }
      return `<div class="workout-note">${encode(line)}</div>`;
    }).join('');
  }
  function adaptationCards(text) {
    const blocks = text.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
    return `<div class="adaptation-grid">${blocks.map(block => {
      const [heading, ...rows] = block.split('\n').map(x => x.trim()).filter(Boolean);
      return `<section class="adaptation-card"><h2>${encode(heading)}</h2>${rows.map(row => {
        const parts = row.split(/\s*\|\s*(?=(?:RX\+?|INT|SC|INI)\s*:)/).filter(Boolean);
        return parts.map(part => {
          const match = part.match(/^(RX\+|RX|INT|SC|INI):\s*(.*)$/);
          return match ? `<div class="category"><strong>${encode(match[1])}</strong><span>${encode(match[2])}</span></div>` : `<div class="workout-note">${encode(part)}</div>`;
        }).join('');
      }).join('')}</section>`;
    }).join('')}</div>`;
  }
  function slideScreen() {
    if (!state.workout) return `<main class="panel"><h1>${state.error ? 'NÃO FOI POSSÍVEL CARREGAR' : 'SEM TREINO PUBLICADO'}</h1><p class="notice">${encode(state.error || 'Não há treino publicado nesta data.')}</p></main>`;
    const pages = pagesFromWorkout(state.workout);
    if (!pages.length) return '<main class="panel"><h1>SEM PÁGINAS</h1></main>';
    state.slide = Math.max(0, Math.min(state.slide, pages.length - 1));
    const slide = pages[state.slide];
    return `<div class="slidehead"><span class="eyebrow">${encode(slide.label)}</span><span class="count">${state.slide + 1} / ${pages.length}</span></div>
      <main class="slide"><div class="slide-title">${encode(state.workout.title || TYPES[state.program].label)}</div>
      <div class="content-area ${slide.kind === 'adaptations' ? 'adapt-mode' : ''}">${slide.kind === 'adaptations' ? adaptationCards(slide.text) : textRows(slide.text)}</div>
      <img class="watermark" src="./assets/gorilla.svg" alt=""></main>
      <nav class="slide-nav"><button type="button" data-action="previous">◀ ANTERIOR</button><span>${encode(TYPES[state.program].label)}</span><button type="button" data-action="next">PRÓXIMA ▶</button></nav>`;
  }
  function render() {
    const body = state.screen === 'calendar' ? calendar() : state.screen === 'program' ? programChooser() : slideScreen();
    app.innerHTML = shell(body, 'Setas: navegar · OK: selecionar · Voltar: calendário');
    tickClock();
    // O foco é preservado sempre que possível; nunca é requisito para clicar com mouse/touch.
    if (selected) {
      const selector = selected.action === 'day' ? `[data-action="day"][data-date="${selected.value}"]` :
        selected.action === 'open' ? `[data-action="open"][data-program="${selected.value}"]` : `[data-action="${selected.action}"]`;
      const el = app.querySelector(selector);
      if (el) { try { el.focus({ preventScroll: true }); } catch { el.focus(); } }
    }
  }
  function home() { state.screen = 'calendar'; state.program = ''; state.workout = null; state.error = ''; selected = null; render(); }
  async function openProgram(program) {
    if (!Object.prototype.hasOwnProperty.call(TYPES, program)) return;
    const id = ++state.requestId;
    state.program = program;
    state.screen = 'slides';
    state.slide = 0;
    state.workout = null;
    state.error = 'Carregando treino...';
    render();
    try {
      const data = await fetchJSON(`./data/${state.date}.json`);
      if (id !== state.requestId) return;
      state.workout = data.programs?.[program] || null;
      state.error = state.workout ? '' : 'Treino desta modalidade ainda não publicado.';
    } catch (err) {
      if (id !== state.requestId) return;
      state.error = `Falha ao carregar treino: ${err.message}`;
      console.error('[Cross Mansões TV]', err);
    }
    render();
  }
  function openDay(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    state.date = date;
    state.error = '';
    selected = null;
    const programs = state.days[date] || [];
    if (programs.length > 1) { state.screen = 'program'; render(); }
    else if (programs.length === 1) { openProgram(programs[0]); }
    else { state.screen = 'slides'; state.program = ''; state.workout = null; render(); }
  }
  function action(button) {
    if (!button) return;
    const type = button.dataset.action;
    if (type === 'day') openDay(button.dataset.date);
    else if (type === 'open') openProgram(button.dataset.program);
    else if (type === 'home') home();
    else if (type === 'month') {
      const next = new Date(state.year, state.month + Number(button.dataset.step), 1);
      state.year = next.getFullYear(); state.month = next.getMonth(); selected = null; render();
    } else if (type === 'previous' || type === 'next') {
      const pages = pagesFromWorkout(state.workout);
      state.slide = Math.max(0, Math.min(pages.length - 1, state.slide + (type === 'next' ? 1 : -1)));
      selected = { action: type }; render();
    } else if (type === 'refresh') {
      state.error = ''; loadIndex();
    }
  }
  function focusButton(button) {
    if (!button) return;
    selected = { action: button.dataset.action, value: button.dataset.date || button.dataset.program || '' };
    try { button.focus({ preventScroll: true }); } catch { button.focus(); }
  }
  function keyboard(event) {
    const k = event.key;
    const nav = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Backspace', 'Escape', 'BrowserBack'];
    if (!nav.includes(k)) return;
    event.preventDefault();
    if (['Backspace', 'Escape', 'BrowserBack'].includes(k)) { home(); return; }
    const buttons = [...app.querySelectorAll('button[data-action]')];
    if (!buttons.length) return;
    let current = app.contains(document.activeElement) ? document.activeElement : null;
    if (k === 'Enter' || k === ' ') { action(current?.dataset?.action ? current : buttons[0]); return; }
    if (state.screen === 'slides' && ['ArrowRight', 'ArrowLeft'].includes(k)) {
      const target = buttons.find(b => b.dataset.action === (k === 'ArrowRight' ? 'next' : 'previous'));
      action(target); return;
    }
    let nextIndex = Math.max(0, buttons.indexOf(current));
    if (state.screen === 'calendar' && current?.dataset.action === 'day') {
      const days = buttons.filter(b => b.dataset.action === 'day');
      const i = days.indexOf(current);
      const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[k];
      const target = days[Math.max(0, Math.min(days.length - 1, i + offset))];
      focusButton(target); return;
    }
    nextIndex = (nextIndex + (k === 'ArrowUp' || k === 'ArrowLeft' ? -1 : 1) + buttons.length) % buttons.length;
    focusButton(buttons[nextIndex]);
  }
  // Delegação única: funciona mesmo que os botões sejam substituídos na renderização.
  app.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button || !app.contains(button)) return;
    selected = { action: button.dataset.action, value: button.dataset.date || button.dataset.program || '' };
    action(button);
  });
  document.addEventListener('keydown', keyboard);
  setInterval(tickClock, 15_000);
  window.addEventListener('online', loadIndex);
  // Desativação do cache offline antigo para não manter versões quebradas na TCL.
  try {
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(items => items.forEach(item => item.unregister())).catch(console.warn);
    if ('caches' in window) caches.keys().then(items => items.filter(x => x.startsWith('cross-mansoes')).forEach(x => caches.delete(x))).catch(console.warn);
  } catch (e) { console.warn('[Cross Mansões TV] Limpeza do cache', e); }
  state.days = readSavedIndex();
  render();
  loadIndex();
})();
