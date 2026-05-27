// =============================================
// sound.js — Efectos de sonido (Web Audio API)
// =============================================

const SoundFX = {
  _ctx: null,

  init() {
    try { this._ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { /* sin soporte */ }
  },

  _beep(freq, duration, gainVal, type = 'sine') {
    if (!this._ctx) return;
    const s = Storage.getSettings();
    if (!s.sound) return;
    try {
      const osc  = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = type;
      osc.connect(gain); gain.connect(this._ctx.destination);
      osc.frequency.setValueAtTime(freq, this._ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this._ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
      osc.start(); osc.stop(this._ctx.currentTime + duration);
    } catch {}
  },

  select()  { this._beep(440, 0.07, 0.05); },
  correct() { this._beep(523, 0.18, 0.08); },
  wrong()   { this._beep(196, 0.22, 0.07, 'sawtooth'); },
  finish()  {
    this._beep(523, 0.15, 0.07);
    setTimeout(() => this._beep(659, 0.15, 0.07), 160);
    setTimeout(() => this._beep(784, 0.30, 0.08), 320);
  },
  tick()    { this._beep(880, 0.04, 0.03); },
};
