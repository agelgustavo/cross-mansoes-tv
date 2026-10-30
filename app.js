(() => {
  'use strict';

  const VERSION = '5.0.0';
  const CACHE_KEY = 'mansoes-tv-index-v3';
  const app = document.getElementById('app');
  const visual = window.MansoesLayout;
  if (!visual) throw new Error('Layout visual não carregado');
  if (!app) throw new Error('Root #app ausente');

  const TYPES = {
    crossfit: { label: 'CrossFit', accent: '#ef303b', chipClass: 'red' },
    hybrid: { label: 'Hybrid Run', accent: '#2f9bf2', chipClass: 'blue' }
  };

  const SECTION_ORDER = [
    ['warmup', 'AQUECIMENTO'],
    ['skill', 'SKILL / STRENGTH'],
    ['wod', 'WOD'],
    ['adaptations', 'ADAPTAÇÕES']
  ];

  const state = {
    screen: 'calendar',
    date: '',
    program: '',
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    days: {},
    pages: [],
    slide: 0,
    workout: null,
    error: '',
    requestId: 0
  };

  let selected = null;
  const sessions = new Map();

  const encode = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  const pad = value => String(value).padStart(2, '0');
  const dateKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const todayKey = () => dateKey(new Date());
  const monthLabel = (y, m) => new Date(y, m, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const dateLabel = key => new Date(`${key}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const safePrograms = value => Array.isArray(value) ? value.filter(k => k in TYPES) : [];

  function persistIndex(index) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(index)); } catch { /* noop */ }
  }

  function readCachedIndex() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
  }

  async function fetchJSON(path) {
    const url = `${path}${path.includes('?') ? '&' : '?'}_=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function loadIndex() {
    try {
      const response = await fetchJSON('./data/index.json');
      const clean = {};
      Object.entries(response.days || {}).forEach(([date, programs]) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) clean[date] = safePrograms(programs);
      });
      state.days = clean;
      persistIndex(clean);
      if (!state.error.startsWith('Falha ao atualizar')) state.error = '';
    } catch (error) {
      console.error('[Cross Mansões TV] Falha no índice', error);
      state.days = readCachedIndex();
      state.error = 'Falha ao atualizar treinos. Exibindo última versão salva.';
    }
    if (state.screen === 'calendar' || state.screen === 'program') render();
  }

  function tickClock() {
    const dateEl = document.querySelector('.header-label');
    if(dateEl) dateEl.textContent = headerTitle();
    const el = document.getElementById('clock');
    if (!el) return;
    try {
      el.textContent = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date());
    } catch {
      const now = new Date();
      el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
  }

  function headerTitle() {
    return new Intl.DateTimeFormat('pt-BR', {timeZone:'America/Sao_Paulo', weekday:'long', day:'2-digit', month:'2-digit', year:'numeric'}).format(new Date());
  }

  function shell(inner) {
    const currentType = TYPES[state.program];
    document.documentElement.style.setProperty('--accent', currentType ? currentType.accent : '#ef303b');
    document.body.classList.toggle('hybrid-mode', state.program === 'hybrid');
    document.body.classList.toggle('poster-mode', state.screen === 'slides' && state.pages[state.slide]?.kind === 'poster');
    return `
      <header class="tv-header">
        <div class="brand-mini">
          <img src="./assets/simbolo_mansoes_vermelho.png" alt="Gorila Mansões" class="brand-icon">
          <div class="brand-copy"><span class="brand-line">Mansões Crosstraining</span><span class="brand-sub">Painel de treino</span></div>
        </div>
        <div class="header-meta">
          <span class="header-label">${encode(headerTitle())}</span>
          <div id="clock" aria-label="Horário de Brasília">--:--</div>
        </div>
      </header>
      <section class="screen-area screen-${state.screen}">${inner}</section>
      <footer class="footer">
        <div class="footer-left">${encode(state.error || '← / →: trocar página · OK: selecionar · Voltar: calendário')}</div>
        <div class="footer-right">
          <span class="version">v${VERSION}</span>
          <button type="button" data-action="home" class="btn btn-outline btn-small">⌂ Calendário</button>
          <button type="button" data-action="refresh" class="btn btn-ghost btn-small">↻ Atualizar</button>
        </div>
      </footer>`;
  }

  function programChips(programs) {
    if (!programs.length) return '<span class="emptyhint">Sem treino</span>';
    return programs.map(program => `<span class="chip ${TYPES[program].chipClass}"><i class="dot ${TYPES[program].chipClass}"></i>${TYPES[program].label}</span>`).join('');
  }

  function calendarScreen() {
    const first = new Date(state.year, state.month, 1);
    const offset = (first.getDay() + 6) % 7;
    const weekdays = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];
    const weeks = Math.ceil((offset + new Date(state.year, state.month + 1, 0).getDate()) / 7);
    const grid = [];
    for (let i = 0; i < weeks * 7; i++) {
      const day = new Date(state.year, state.month, 1 - offset + i);
      const key = dateKey(day);
      const programs = state.days[key] || [];
      const outside = day.getMonth() !== state.month ? ' outside' : '';
      const today = key === todayKey() ? ' today' : '';
      grid.push(`<button type="button" class="day${outside}${today}" data-action="day" data-date="${key}" aria-label="${key}, ${programs.map(p => TYPES[p].label).join(', ') || 'sem treino'}">
          <div class="day-top"><span class="n">${day.getDate()}</span>${programs.length ? '<span class="published">Publicado</span>' : ''}</div>
          <div class="day-programs">${programChips(programs)}</div>
        </button>`);
    }
    return `
      <section class="calendar-wrap">
        <div class="toolbar">
          <button type="button" data-action="month" data-step="-1" class="btn btn-outline">◀</button>
          <strong>${encode(monthLabel(state.year, state.month))}</strong>
          <button type="button" data-action="month" data-step="1" class="btn btn-outline">▶</button>
        </div>
        <main class="calendar" aria-label="Calendário de treinos" style="--weeks:${weeks}">
          ${weekdays.map(day => `<div class="weekday">${day}</div>`).join('')}
          ${grid.join('')}
        </main>
      </section>`;
  }

  function programChooserScreen() {
    const programs = state.days[state.date] || [];
    return `
      <main class="panel choose-panel">
        <div class="eyebrow">${encode(dateLabel(state.date))}</div>
        <h1>Escolha a modalidade</h1>
        <div class="choices">
          ${programs.map(program => `
            <button type="button" data-action="open" data-program="${program}" class="choice choice-${program}">
              <span class="choice-title">${encode(TYPES[program].label)}</span>
              <span class="choice-sub">Abrir treino</span>
            </button>`).join('')}
        </div>
      </main>`;
  }

  function buildPages(workout) {
    return Array.isArray(workout?.posters) && workout.posters.length ? workout.posters.map(p => ({...p, kind:'poster'})) : visual.makeSlides(workout);
  }

  function relabelSection(page) {
    const same = state.pages.filter(item => item.kind === page.kind);
    const index = same.indexOf(page);
    return same.length > 1 ? `${page.label} ${index+1}/${same.length}` : page.label;
  }

  function switchButton() {
    const other=state.program==='crossfit'?'hybrid':'crossfit';
    const available=(state.days[state.date]||[]).includes(other);
    return `<button type="button" data-action="switch-program" data-program="${other}" class="btn btn-outline switch-program" ${available?'':'disabled'}><span>⇄ ${encode(TYPES[other].label)}</span><small>${available?'Alternar modalidade':'Sem treino nesta data'}</small></button>`;
  }

  function slideScreen() {
    if (!state.workout) {
      return `<main class="panel error-panel"><h1>${state.error ? 'Não foi possível carregar' : 'Sem treino publicado'}</h1><p class="notice">${encode(state.error || 'Não há treino publicado nesta data.')}</p></main>`;
    }
    if (!state.pages.length) state.pages = buildPages(state.workout);
    if (!state.pages.length) return '<main class="panel error-panel"><h1>Treino sem conteúdo</h1></main>';
    state.slide = Math.max(0, Math.min(state.slide, state.pages.length-1));
    const page = state.pages[state.slide];
    const type = TYPES[state.program];
    if(page.kind === 'poster') return `<main class="poster-stage">
      <img class="workout-poster" src="${encode(page.src)}" alt="${encode(page.label + ': ' + page.text)}">
      <p class="poster-error" hidden>Não foi possível carregar a arte. Use Atualizar para tentar novamente.</p>
      </main><nav class="poster-controls" aria-label="Navegação do treino">
      <div class="page-buttons"><button data-action="previous" class="btn btn-outline">◀ Anterior</button><button data-action="next" class="btn btn-primary">Próxima ▶</button></div>
      <span class="slide-count">${state.slide+1} / ${state.pages.length}</span>
      <span class="poster-label">${encode(page.label)}</span>
      <button data-action="home" class="btn btn-outline">Calendário</button>
      <button data-action="refresh" class="btn btn-outline">Atualizar</button>
      ${switchButton()}</nav>`;
    return `<div class="slide-meta">
        <div class="slide-meta-left">
          <span class="slide-eyebrow">${encode(relabelSection(page))}</span>
          <div class="slide-title-row"><h2>${encode(state.workout.title || type.label)}</h2><span class="mode-chip ${type.chipClass}">${encode(type.label)}</span></div>
        </div>
        <div class="slide-count">${state.slide+1} / ${state.pages.length}</div>
      </div>
      <main class="board board-${page.kind} themed-board ${/zuko|appa/i.test(state.workout.title || '') ? 'has-art' : ''}"><div class="theme-art" aria-hidden="true"></div><div class="board-inner">${visual.section(page)}</div></main>
      <nav class="slide-nav"><div class="page-buttons"><button type="button" data-action="previous" class="btn btn-outline">◀ Anterior</button><button type="button" data-action="next" class="btn btn-primary">Próxima ▶</button></div>${switchButton()}</nav>`;
  }

  // Fit is verified against actual rendered dimensions, not only text length.
  function enforceFit() {
    if (state.screen !== 'slides' || !state.workout) return;
    const board = app.querySelector('.board');
    const inner = app.querySelector('.board-inner');
    if (!board || !inner) return;
    const overflows = () => inner.scrollHeight > inner.clientHeight+3 || inner.scrollWidth > inner.clientWidth+3 ||
      [...inner.querySelectorAll('.training-card,.movement-tile,.kpi-card')].some(x => x.scrollHeight > x.clientHeight+3 || x.scrollWidth > x.clientWidth+3);
    if (!overflows()) return;
    board.classList.add('fit-compact');
    if (!overflows()) return;
    board.classList.add('fit-dense');
    if (!overflows()) return;
    // Sempre tentar uma nova página antes de diminuir a fonte de adaptações.
    // Para WODs, preservar as fronteiras semânticas dos blocos.
    const page=state.pages[state.slide];
    const blocks=Array.isArray(page.blocks)?page.blocks:[];
    if(blocks.length>1){
      const middle=Math.ceil(blocks.length/2);
      const leftBlocks=blocks.slice(0,middle),rightBlocks=blocks.slice(middle);
      const common={...page};
      state.pages.splice(state.slide,1,
        {...common,blocks:leftBlocks,items:leftBlocks.flatMap(b=>b.movements),notes:[],kpis:[]},
        {...common,blocks:rightBlocks,items:rightBlocks.flatMap(b=>b.movements)});
      render();return;
    }
    if(page.items && page.items.length>1){
      const middle=Math.ceil(page.items.length/2);
      const common={...page};
      const l=page.items.slice(0,middle),r=page.items.slice(middle);
      const withBlocks=['wod','skill','accessory'].includes(page.kind);
      state.pages.splice(state.slide,1,
        {...common,items:l,blocks:withBlocks?[{label:blocks[0]?.label||'',movements:l}]:page.blocks,notes:withBlocks?[]:page.notes,kpis:withBlocks?[]:page.kpis},
        {...common,items:r,blocks:withBlocks?[{label:blocks[0]?.label||'',movements:r}]:page.blocks});
      render();return;
    }
    console.error('[Mansões TV] Bloco excede a área disponível; revise a divisão',page.kind);
    board.classList.add('fit-warning');
  }

  function render() {
    const body = state.screen === 'calendar' ? calendarScreen() : state.screen === 'program' ? programChooserScreen() : slideScreen();
    app.innerHTML = shell(body);
    tickClock();
    const poster=app.querySelector('.workout-poster');
    if(poster){
      poster.addEventListener('error',()=>{app.querySelector('.poster-error').hidden=false;});
      const next=state.pages[state.slide+1];
      if(next?.src){const preload=new Image();preload.src=next.src;}
    }
    if(state.screen === 'slides' && state.workout) requestAnimationFrame(enforceFit);
    if(state.screen==='slides' && state.pages.length && !app.querySelector(`[data-action="${selected?.action}"]`)) selected={action:'next',value:''};
    if (selected) {
      const selector = selected.action === 'day'
        ? `[data-action="day"][data-date="${selected.value}"]`
        : selected.action === 'open'
          ? `[data-action="open"][data-program="${selected.value}"]`
          : `[data-action="${selected.action}"]`;
      const node = app.querySelector(selector);
      if (node) {
        try { node.focus({ preventScroll: true }); } catch { node.focus(); }
      }
    }
  }

  function goHome() {
    state.screen = 'calendar';
    state.program = '';
    state.workout = null;
    state.pages = [];
    state.slide = 0;
    state.error = state.error.startsWith('Falha ao atualizar') ? state.error : '';
    selected = null;
    render();
  }

  async function openProgram(program) {
    if (!(program in TYPES)) return;
    if(state.workout && state.program) sessions.set(`${state.date}/${state.program}`,{workout:state.workout,pages:state.pages,slide:state.slide});
    const req = ++state.requestId;
    const saved=sessions.get(`${state.date}/${program}`);
    if(saved){state.program=program;state.screen='slides';Object.assign(state,saved);state.error='';selected={action:'next',value:''};render();return;}
    state.program = program;
    state.screen = 'slides';
    state.workout = null;
    state.pages = [];
    state.slide = 0;
    state.error = 'Carregando treino...';
    render();
    try {
      const data = await fetchJSON(`./data/${state.date}.json`);
      if (req !== state.requestId) return;
      state.workout = data.programs?.[program] || null;
      state.pages = buildPages(state.workout);
      state.error = state.workout ? '' : 'Treino desta modalidade ainda não publicado.';
    } catch (error) {
      if (req !== state.requestId) return;
      console.error('[Cross Mansões TV] Falha ao carregar treino', error);
      state.workout = null;
      state.pages = [];
      state.error = `Falha ao carregar treino: ${error.message}`;
    }
    render();
  }

  function openDay(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    state.date = date;
    state.workout = null;
    state.pages = [];
    state.slide = 0;
    const programs = state.days[date] || [];
    if (programs.length > 1) {
      state.screen = 'program';
      state.error = '';
      render();
    } else if (programs.length === 1) {
      openProgram(programs[0]);
    } else {
      state.program = '';
      state.screen = 'slides';
      state.error = '';
      render();
    }
  }

  function updateMonth(step) {
    const next = new Date(state.year, state.month + Number(step), 1);
    state.year = next.getFullYear();
    state.month = next.getMonth();
    selected = null;
    render();
  }

  function action(node) {
    if (!node || node.disabled) return;
    switch (node.dataset.action) {
      case 'switch-program':
        openProgram(node.dataset.program);
        break;
      case 'day':
        openDay(node.dataset.date);
        break;
      case 'open':
        openProgram(node.dataset.program);
        break;
      case 'home':
        goHome();
        break;
      case 'refresh':
        state.error = '';
        if(state.screen==='slides' && state.program){sessions.delete(`${state.date}/${state.program}`);state.workout=null;openProgram(state.program);}else{loadIndex();}
        break;
      case 'month':
        updateMonth(node.dataset.step);
        break;
      case 'previous':
        state.slide = Math.max(0, state.slide - 1);
        selected = { action: 'previous', value: '' };
        render();
        break;
      case 'next':
        state.slide = Math.min(state.pages.length - 1, state.slide + 1);
        selected = { action: 'next', value: '' };
        render();
        break;
    }
  }

  function focusButton(node) {
    if (!node) return;
    selected = { action: node.dataset.action, value: node.dataset.date || node.dataset.program || '' };
    try { node.focus({ preventScroll: true }); } catch { node.focus(); }
  }

  const heldKeys = new Set();
  function keyboard(event) {
    const aliases={Left:'ArrowLeft',Right:'ArrowRight',Up:'ArrowUp',Down:'ArrowDown',OK:'Enter',Select:'Enter'};
    const raw=event.key && event.key!=='Unidentified'?event.key:(event.code || event.keyIdentifier);
    const key = aliases[raw] || raw || ({37:'ArrowLeft',38:'ArrowUp',39:'ArrowRight',40:'ArrowDown',13:'Enter',461:'BrowserBack',10009:'BrowserBack'})[event.keyCode || event.which];
    const accepted = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Backspace', 'Escape', 'BrowserBack'];
    if (!accepted.includes(key)) return;
    event.preventDefault();
    event.stopPropagation();
    if(event.type==='keyup'){
      if(heldKeys.delete(key)) return;
      if(key!=='ArrowLeft' && key!=='ArrowRight') return;
    }else{
      if(heldKeys.has(key) && event.repeat) return;
      heldKeys.add(key);
    }

    if (['Backspace', 'Escape', 'BrowserBack'].includes(key)) {
      goHome();
      return;
    }

    const buttons = [...app.querySelectorAll('button[data-action]:not(:disabled)')];
    if (!buttons.length) return;

    const current = app.contains(document.activeElement) && document.activeElement.dataset?.action ? document.activeElement : null;

    if (key === 'Enter' || key === ' ') {
      action(current || buttons[0]);
      return;
    }

    if (state.screen === 'slides' && (key === 'ArrowLeft' || key === 'ArrowRight')) {
      const target = buttons.find(btn => btn.dataset.action === (key === 'ArrowRight' ? 'next' : 'previous'));
      if (target) action(target);
      return;
    }

    if (state.screen === 'calendar' && current?.dataset.action === 'day') {
      const days = buttons.filter(btn => btn.dataset.action === 'day');
      const index = days.indexOf(current);
      const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[key];
      const next = days[Math.max(0, Math.min(days.length - 1, index + delta))];
      focusButton(next);
      return;
    }

    const index = Math.max(0, buttons.indexOf(current));
    const delta = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
    focusButton(buttons[(index + delta + buttons.length) % buttons.length]);
  }

  app.addEventListener('click', event => {
    const node = event.target.closest('button[data-action]');
    if (!node || !app.contains(node)) return;
    selected = { action: node.dataset.action, value: node.dataset.date || node.dataset.program || '' };
    action(node);
  });

  window.addEventListener('keydown', keyboard, true);
  window.addEventListener('keyup', keyboard, true);
  window.addEventListener('blur',()=>heldKeys.clear());
  setInterval(tickClock, 15_000);
  window.addEventListener('online', loadIndex);

  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister())).catch(console.warn);
    }
    if ('caches' in window) {
      caches.keys().then(keys => keys.filter(key => key.startsWith('cross-mansoes')).forEach(key => caches.delete(key))).catch(console.warn);
    }
  } catch (error) {
    console.warn('[Cross Mansões TV] Limpeza de cache falhou', error);
  }

  state.days = readCachedIndex();
  render();
  loadIndex();
})();
