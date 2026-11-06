/* ============================================================
   光芽小院 · 合成音效与背景音乐
   Web Audio 现场合成，没有任何外部音频文件。
   ============================================================ */
(function (global) {
  "use strict";

  const Sunbud = (global.Sunbud = global.Sunbud || {});

  const Audio = {
    ctx: null,
    master: null,
    sfxGain: null,
    musicGain: null,
    noiseBuffer: null,
    enabledSfx: true,
    enabledMusic: true,
    unlocked: false,
    musicPlaying: false,
    musicTimer: null,
    nextNoteTime: 0,
    step: 0,
    theme: "menu",
    lastShot: 0,
    lastBite: 0,
    _lastSfx: {},
    init: function () {
      if (this.ctx) {
        if (this.ctx.state === "suspended") {
          this.ctx.resume().catch(function () {});
        }
        return this.ctx;
      }
      const Ctor = global.AudioContext || global.webkitAudioContext;
      if (!Ctor) return null;
      try {
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.62;
        this.master.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.enabledSfx ? 0.48 : 0;
        this.sfxGain.connect(this.master);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.enabledMusic ? 0.28 : 0;
        this.musicGain.connect(this.master);

        this.noiseBuffer = this._makeNoise();
        this.unlocked = true;
        return this.ctx;
      } catch (err) {
        this.ctx = null;
        return null;
      }
    },
    unlock: function () {
      const ctx = this.init();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(function () {});
      }
    },
    setSettings: function (settings) {
      const s = settings || {};
      this.enabledMusic = s.music !== false;
      this.enabledSfx = s.sfx !== false;
      if (this.musicGain && this.ctx) {
        this.musicGain.gain.setTargetAtTime(
          this.enabledMusic ? 0.28 : 0,
          this.ctx.currentTime,
          0.08
        );
      }
      if (this.sfxGain && this.ctx) {
        this.sfxGain.gain.setTargetAtTime(
          this.enabledSfx ? 0.48 : 0,
          this.ctx.currentTime,
          0.04
        );
      }
      if (!this.enabledMusic) {
        this.stopMusic();
      } else if (this.musicPlaying) {
        this.startMusic(this.theme);
      }
    },
    _makeNoise: function () {
      const ctx = this.ctx;
      if (!ctx) return null;
      const length = Math.floor(ctx.sampleRate * 1.2);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      return buffer;
    },
    _tone: function (freq, duration, options) {
      if (!this.ctx || !this.sfxGain) return null;
      const o = options || {};
      const ctx = this.ctx;
      const now = ctx.currentTime + (o.delay || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startGain = o.vol == null ? 0.08 : o.vol;
      osc.type = o.type || "sine";
      osc.frequency.setValueAtTime(Math.max(20, freq), now);
      if (o.endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(24, o.endFreq), now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, startGain), now + (o.attack == null ? 0.012 : o.attack));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      let prev = osc;
      if (o.filter) {
        const filter = ctx.createBiquadFilter();
        filter.type = o.filter.type || "lowpass";
        filter.frequency.setValueAtTime(o.filter.freq || 1200, now);
        filter.Q.value = o.filter.q || 0.7;
        prev.connect(filter);
        prev = filter;
      }
      prev.connect(gain);
      gain.connect(o.music ? this.musicGain : this.sfxGain);
      osc.start(now);
      osc.stop(now + duration + 0.03);
      return { osc: osc, gain: gain };
    },
    _noise: function (duration, options) {
      if (!this.ctx || !this.noiseBuffer || !this.sfxGain) return;
      const o = options || {};
      const ctx = this.ctx;
      const now = ctx.currentTime + (o.delay || 0);
      const source = ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = o.type || "bandpass";
      filter.frequency.setValueAtTime(o.freq || 900, now);
      if (o.endFreq) filter.frequency.exponentialRampToValueAtTime(o.endFreq, now + duration);
      filter.Q.value = o.q || 0.6;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol || 0.045), now + (o.attack || 0.01));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      source.start(now);
      source.stop(now + duration + 0.03);
    },
    _throttle: function (name, ms) {
      const now = (global.performance && global.performance.now()) || Date.now();
      if (now - (this._lastSfx[name] || 0) < ms) return false;
      this._lastSfx[name] = now;
      return true;
    },
    play: function (name, detail) {
      if (!this.enabledSfx) return;
      const ctx = this.init();
      if (!ctx) return;
      const info = detail || {};
      switch (name) {
        case "ui":
          if (!this._throttle("ui", 55)) return;
          this._tone(520, 0.07, { type: "sine", vol: 0.035, endFreq: 650 });
          break;
        case "select":
          this._tone(440, 0.09, { type: "triangle", vol: 0.045, endFreq: 620 });
          this._tone(880, 0.07, { type: "sine", vol: 0.02, delay: 0.024 });
          break;
        case "plant":
          this._tone(240, 0.17, { type: "sine", vol: 0.08, endFreq: 330 });
          this._noise(0.1, { type: "lowpass", freq: 720, vol: 0.03 });
          this._tone(540, 0.12, { type: "triangle", vol: 0.035, delay: 0.04 });
          break;
        case "shovel":
          this._noise(0.16, { type: "bandpass", freq: 1400, endFreq: 280, vol: 0.035 });
          break;
        case "sun":
          this._tone(784, 0.16, { type: "sine", vol: 0.06, endFreq: 1046 });
          this._tone(1318, 0.22, { type: "sine", vol: 0.03, delay: 0.07 });
          break;
        case "shoot":
          if (!this._throttle("shoot", 65)) return;
          this._tone(255 + Math.random() * 35, 0.075, { type: "triangle", vol: 0.035, endFreq: 410 });
          break;
        case "frost":
          if (!this._throttle("frost", 90)) return;
          this._tone(1240, 0.1, { type: "sine", vol: 0.028, endFreq: 1720 });
          this._tone(1870, 0.11, { type: "sine", vol: 0.018, delay: 0.02 });
          break;
        case "hit":
          if (!this._throttle("hit", 50)) return;
          this._noise(0.055, { type: "bandpass", freq: 480, vol: 0.028 });
          this._tone(160, 0.06, { type: "square", vol: 0.015, endFreq: 110 });
          break;
        case "bite":
          if (!this._throttle("bite", 120)) return;
          this._noise(0.08, { type: "lowpass", freq: 330, vol: 0.035 });
          this._tone(90, 0.08, { type: "sawtooth", vol: 0.02, endFreq: 70 });
          break;
        case "freeze":
          if (!this._throttle("freeze", 160)) return;
          this._tone(1500, 0.2, { type: "sine", vol: 0.024, endFreq: 920 });
          break;
        case "explode":
          this._noise(0.44, { type: "lowpass", freq: 1800, endFreq: 160, vol: 0.11 });
          this._tone(96, 0.42, { type: "sine", vol: 0.13, endFreq: 38 });
          this._tone(180, 0.2, { type: "triangle", vol: 0.055, endFreq: 60 });
          break;
        case "water":
          if (!this._throttle("water", 80)) return;
          this._noise(0.13, { type: "bandpass", freq: 740, endFreq: 1700, vol: 0.022 });
          this._tone(410, 0.12, { type: "sine", vol: 0.028, endFreq: 740 });
          break;
        case "beam":
          if (!this._throttle("beam", 90)) return;
          this._tone(520, 0.18, { type: "triangle", vol: 0.035, endFreq: 1460 });
          this._tone(1040, 0.15, { type: "sine", vol: 0.022, endFreq: 1860 });
          this._noise(0.1, { type: "highpass", freq: 1400, vol: 0.015 });
          break;
        case "bell":
          if (!this._throttle("bell", 150)) return;
          this._tone(392, 0.7, { type: "sine", vol: 0.048, endFreq: 388 });
          this._tone(784, 0.55, { type: "sine", vol: 0.022, endFreq: 780 });
          this._tone(1176, 0.36, { type: "triangle", vol: 0.013, endFreq: 1170 });
          this._tone(196, 0.5, { type: "triangle", vol: 0.03, endFreq: 190, delay: 0.02 });
          break;
        case "puff":
          if (!this._throttle("puff", 90)) return;
          this._noise(0.17, { type: "bandpass", freq: 360, endFreq: 1200, vol: 0.026 });
          break;
        case "mower":
          this._noise(0.92, { type: "lowpass", freq: 950, endFreq: 260, vol: 0.08 });
          this._tone(76, 0.84, { type: "sawtooth", vol: 0.06, endFreq: 118 });
          this._tone(152, 0.7, { type: "square", vol: 0.018, endFreq: 230 });
          break;
        case "wave":
          this._tone(196, 0.65, { type: "triangle", vol: 0.065, endFreq: 196 });
          this._tone(294, 0.55, { type: "triangle", vol: 0.04, delay: 0.12 });
          this._tone(392, 0.6, { type: "sine", vol: 0.03, delay: 0.26 });
          break;
        case "boss":
          this._noise(0.75, { type: "lowpass", freq: 320, vol: 0.08 });
          this._tone(58, 0.8, { type: "sawtooth", vol: 0.075, endFreq: 46 });
          this._tone(87, 0.65, { type: "triangle", vol: 0.045, endFreq: 58 });
          break;
        case "win":
          [523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
            this._tone(freq, 0.5, { type: "triangle", vol: 0.055, delay: i * 0.11 });
            this._tone(freq * 2, 0.32, { type: "sine", vol: 0.016, delay: i * 0.11 });
          }, this);
          break;
        case "lose":
          [261.6, 220, 174.6, 130.8].forEach(function (freq, i) {
            this._tone(freq, 0.42, { type: "sine", vol: 0.05, delay: i * 0.15, endFreq: freq * 0.92 });
          }, this);
          break;
        case "error":
          this._tone(132, 0.11, { type: "square", vol: 0.025, endFreq: 112 });
          this._tone(120, 0.1, { type: "square", vol: 0.02, delay: 0.1 });
          break;
        case "unlock":
          [392, 523.25, 659.25, 880].forEach(function (freq, i) {
            this._tone(freq, 0.42, { type: "sine", vol: 0.038, delay: i * 0.08 });
          }, this);
          break;
        default:
          break;
      }
    },
    startMusic: function (theme) {
      if (!this.enabledMusic) return;
      this.init();
      this.theme = theme || "menu";
      this.musicPlaying = true;
      if (this.musicTimer) return;
      this.step = 0;
      this.nextNoteTime = (this.ctx ? this.ctx.currentTime : 0) + 0.35;
      const self = this;
      this.musicTimer = global.setInterval(function () { self._scheduleMusic(); }, 260);
      this._scheduleMusic();
    },
    stopMusic: function () {
      this.musicPlaying = false;
      if (this.musicTimer) {
        global.clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    },
    _scaleForTheme: function () {
      if (this.theme === "eclipse") return { root: 174.61, notes: [0, 3, 5, 7, 10, 12, 15, 12, 7, 5], tempo: 0.47, gain: 0.055 };
      if (this.theme === "dusk") return { root: 196, notes: [0, 2, 5, 7, 9, 12, 9, 7, 5, 2], tempo: 0.52, gain: 0.05 };
      if (this.theme === "morning") return { root: 261.63, notes: [0, 4, 7, 9, 11, 9, 7, 4, 7, 12], tempo: 0.44, gain: 0.05 };
      return { root: 220, notes: [0, 4, 7, 11, 12, 7, 4, 2, 7], tempo: 0.56, gain: 0.042 };
    },
    _scheduleMusic: function () {
      if (!this.ctx || !this.enabledMusic || !this.musicPlaying) return;
      const scale = this._scaleForTheme();
      const horizon = this.ctx.currentTime + 0.65;
      let guard = 0;
      while (this.nextNoteTime < horizon && guard < 5) {
        const midi = this.step % scale.notes.length;
        const semitone = scale.notes[midi];
        const freq = scale.root * Math.pow(2, semitone / 12);
        const nowDelay = Math.max(0, this.nextNoteTime - this.ctx.currentTime);
        // Sparse, gentle plucks, with a lower shadow note on every fourth beat.
        this._musicNote(freq, 0.75, scale.gain, nowDelay);
        if (this.step % 4 === 0) {
          this._musicNote(freq * 0.5, 1.15, scale.gain * 0.55, nowDelay);
        }
        if (this.theme === "eclipse" && this.step % 8 === 5) {
          this._musicNote(freq * 1.5, 0.7, scale.gain * 0.35, nowDelay + 0.2);
        }
        this.nextNoteTime += scale.tempo;
        this.step += 1;
        guard += 1;
      }
    },
    _musicNote: function (freq, duration, vol, delay) {
      if (!this.ctx || !this.musicGain) return;
      const ctx = this.ctx;
      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1500, start);
      filter.frequency.exponentialRampToValueAtTime(700, start + duration);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(vol, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    }
  };

  Sunbud.Audio = Audio;
})(window);
