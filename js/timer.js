// =============================================
// timer.js — Módulo de cronómetro
// =============================================

const Timer = {
  _iv: null,
  _secs: 0,
  _total: 0,
  _running: false,

  start(minutes, onTick, onEnd) {
    this.stop();
    this._secs    = minutes * 60;
    this._total   = minutes * 60;
    this._running = true;

    // Tick inmediato
    if (onTick) onTick(this._secs, this._fmt(this._secs));

    this._iv = setInterval(() => {
      if (!this._running) return;
      this._secs--;
      if (onTick) onTick(this._secs, this._fmt(this._secs));
      if (this._secs <= 0) { this.stop(); if (onEnd) onEnd(); }
    }, 1000);
  },

  stop()   { this._running = false; clearInterval(this._iv); this._iv = null; },
  pause()  { this._running = false; },
  resume() { this._running = true; },

  elapsed()   { return this._total - this._secs; },
  remaining() { return this._secs; },
  isWarning() { return this._secs <= 300; },   // últimos 5 min
  isCritical(){ return this._secs <= 60; },    // último minuto

  _fmt(s) {
    if (s < 0) s = 0;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss= s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  },
};
