// =============================================
// storage.js — Gestión de sesión e historial
// =============================================

const Storage = {
  K: {
    SESSION:  'sd_session',
    HISTORY:  'sd_history',
    SETTINGS: 'sd_settings',
    PENDING:  'sd_pending_exam',
    RESULT:   'sd_last_result',
  },

  setSession(data) {
    localStorage.setItem(this.K.SESSION, JSON.stringify({ ...data, ts: Date.now() }));
  },
  getSession() {
    try {
      const s = JSON.parse(localStorage.getItem(this.K.SESSION));
      if (!s) return null;
      if (Date.now() - s.ts > 8 * 3600 * 1000) { this.clearSession(); return null; }
      return s;
    } catch { return null; }
  },
  clearSession() { localStorage.removeItem(this.K.SESSION); },

  setPending(modeId) { sessionStorage.setItem(this.K.PENDING, modeId); },
  getPending()       { return sessionStorage.getItem(this.K.PENDING); },
  clearPending()     { sessionStorage.removeItem(this.K.PENDING); },

  setResult(r) { sessionStorage.setItem(this.K.RESULT, JSON.stringify(r)); },
  getResult() {
    try { return JSON.parse(sessionStorage.getItem(this.K.RESULT)); }
    catch { return null; }
  },
  clearResult() { sessionStorage.removeItem(this.K.RESULT); },

  addResult(r) {
    const h = this.getHistory();
    h.unshift({
      id: Date.now(),
      date: new Date().toLocaleDateString('es-BO', { day:'2-digit', month:'short', year:'numeric' }),
      time: new Date().toLocaleTimeString('es-BO', { hour:'2-digit', minute:'2-digit' }),
      ...r,
    });
    localStorage.setItem(this.K.HISTORY, JSON.stringify(h.slice(0, 30)));
  },
  getHistory() {
    try { return JSON.parse(localStorage.getItem(this.K.HISTORY)) || []; }
    catch { return []; }
  },
  clearHistory() { localStorage.removeItem(this.K.HISTORY); },

  getSettings() {
    try {
      return { darkMode:false, sound:true, showAnswers:true,
        ...JSON.parse(localStorage.getItem(this.K.SETTINGS)) };
    } catch { return { darkMode:false, sound:true, showAnswers:true }; }
  },
  saveSettings(s) { localStorage.setItem(this.K.SETTINGS, JSON.stringify(s)); },

  getStats() {
    const h = this.getHistory();
    if (!h.length) return { totalExams:0, avgScore:0, bestScore:0 };
    return {
      totalExams: h.length,
      avgScore:   Math.round(h.reduce((a,b)=>a+b.percentage,0)/h.length),
      bestScore:  Math.max(...h.map(x=>x.percentage)),
    };
  },
  getRanking() {
    return this.getHistory().sort((a,b)=>b.percentage-a.percentage).slice(0,10);
  },
};

// ─────────────────────────────────────────────
// HELPERS GLOBALES
// ─────────────────────────────────────────────
function formatTime(sec) {
  if (!sec && sec !== 0) return '--';
  const m = Math.floor(sec/60), s = sec%60;
  return `${m}:${String(s).padStart(2,'0')}`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function applyTheme() {
  const s = Storage.getSettings();
  document.documentElement.setAttribute('data-theme', s.darkMode?'dark':'light');
  const btn = document.getElementById('btn-dark');
  if (btn) btn.textContent = s.darkMode ? '☀️' : '🌙';
}

function toggleTheme() {
  const s = Storage.getSettings();
  s.darkMode = !s.darkMode;
  Storage.saveSettings(s);
  applyTheme();
}

function showToast(msg, ms=2800) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(()=>t.classList.remove('show'), ms);
}

function showModal(title, desc, icon, onOk, onCancel) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-desc').textContent  = desc;
  document.getElementById('modal-icon').textContent  = icon;
  overlay.classList.add('show');

  const clone = id => {
    const o=document.getElementById(id), n=o.cloneNode(true);
    o.parentNode.replaceChild(n,o); return n;
  };
  const close = ()=>overlay.classList.remove('show');
  const ok     = clone('modal-ok');
  const cancel = clone('modal-cancel');
  ok.addEventListener('click', ()=>{ close(); if(onOk) onOk(); });
  cancel.addEventListener('click', ()=>{ close(); if(onCancel) onCancel(); });
  cancel.style.display = (onCancel===null) ? 'none' : 'flex';
  if(onCancel===null) ok.textContent = 'Entendido';
}

function requireAuth(to='login.html') {
  if (!Storage.getSession()) { window.location.href=to; return false; }
  return true;
}

function hideLoader() {
  const l = document.getElementById('loader');
  if (l) { l.classList.add('out'); setTimeout(()=>l.remove(), 500); }
}

// ─────────────────────────────────────────────
// MODOS — estructura oficial según bibliografía
// ─────────────────────────────────────────────
const MODES = {
  // ── EXAMEN REAL OFICIAL 2026 ──────────────────────────────────────────
  // Según Frente MARCHA: 90 preguntas, 60% pedagógico, 30% normativa, 10% encuesta
  ascenso_real: {
    id:          'ascenso_real',
    name:        'Examen Ascenso Real 2026',
    icon:        '🎯',
    desc:        '90 preguntas · Reglas oficiales del Ministerio · 2 horas',
    color:       '#CC0000',
    questions:   90,
    minutes:     120,
    isOfficial:  true,
    distribution: {
      textos_pedagogicos: 0.40,   // 36 preguntas — Aspectos pedagógicos 60% total
      normativa_basica:   0.20,   // 18 preguntas — de los 60% pedagógicos
      administrativos:    0.30,   // 27 preguntas — Normativa básica 30%
      encuesta:           0.10,   //  9 preguntas — Encuesta 10%
    },
    info: [
      '60% Aspectos pedagógicos',
      '30% Normativa básica',
      '10% Encuesta educativa',
      '📅 18 de julio — Examen presencial',
    ],
  },

  // ── PRÁCTICA POR SECCIÓN ──────────────────────────────────────────────
  solo_pedagogico: {
    id:          'solo_pedagogico',
    name:        'Solo Textos Pedagógicos',
    icon:        '📚',
    desc:        '40 preguntas · Sacristán, UNESCO, neuroaprendizaje, estilos · 50 min',
    color:       '#0064CC',
    questions:   40,
    minutes:     50,
    distribution: { textos_pedagogicos: 1 },
  },

  solo_normativa: {
    id:          'solo_normativa',
    name:        'Solo Normativa Básica',
    icon:        '⚖️',
    desc:        '30 preguntas · DS 4688, Ley 348, Ley 223, protocolos · 40 min',
    color:       '#009650',
    questions:   30,
    minutes:     40,
    distribution: { normativa_basica: 1 },
  },

  solo_administrativos: {
    id:          'solo_administrativos',
    name:        'Solo Administrativos',
    icon:        '🗂️',
    desc:        '20 preguntas · reglamentos, convivencia, resolución de problemas · 25 min',
    color:       '#7B2FBE',
    questions:   20,
    minutes:     25,
    distribution: { administrativos: 1 },
  },

  solo_encuesta: {
    id:          'solo_encuesta',
    name:        'Solo Encuesta Educativa',
    icon:        '📋',
    desc:        '15 preguntas · contexto docente, TIC, formación continua · 20 min',
    color:       '#E07800',
    questions:   15,
    minutes:     20,
    distribution: { encuesta: 1 },
  },

  aleatorio: {
    id:          'aleatorio',
    name:        'Simulador Aleatorio',
    icon:        '🎲',
    desc:        '50 preguntas · mezcla completa de todas las categorías · 60 min',
    color:       '#E07800',
    questions:   50,
    minutes:     60,
    distribution: {
      textos_pedagogicos: 0.40,
      normativa_basica:   0.25,
      administrativos:    0.20,
      encuesta:           0.15,
    },
  },

  dificil: {
    id:          'dificil',
    name:        'Modo Difícil',
    icon:        '🔥',
    desc:        '30 preguntas · análisis crítico y alta complejidad · 45 min',
    color:       '#CC0000',
    questions:   30,
    minutes:     45,
    distribution: { dificil: 1 },
  },
};
