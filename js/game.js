/* ============================================================
   光芽小院 · 游戏主循环
   草坪、阳光、种植、夜霉、波次、割草机、首领与结算。
   ============================================================ */
(function (global) {
  "use strict";

  const Sunbud = (global.Sunbud = global.Sunbud || {});
  const Art = Sunbud.Art;
  const Data = Sunbud.DATA;

  const TAU = Math.PI * 2;
  const PLANT_SCALE = {
    sunbud: 0.94,
    peapod: 0.94,
    frostbell: 0.96,
    nutshell: 0.93,
    popberry: 0.94,
    thornspud: 0.92,
    twinpod: 0.88,
    dandelion: 0.9,
    ripplily: 0.99,
    prismbloom: 1.04,
    dawnbell: 0.98
  };

  const CARD_COOLDOWN_HIDDEN = 0;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeOutBack(t) {
    const c = 1.6;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  class Game {
    constructor(options) {
      const o = options || {};
      this.callbacks = {
        onExit: o.onExit || function () {},
        onLevelStart: o.onLevelStart || function () {},
        onLevelComplete: o.onLevelComplete || function () {},
        onRunSaved: o.onRunSaved || function () {}
      };
      this.audio = Sunbud.Audio;

      this.canvas = document.getElementById("gameCanvas");
      this.ctx = this.canvas.getContext("2d");
      this.boardStage = document.getElementById("boardStage");
      this.boardFrame = document.getElementById("boardFrame");
      this.gameScreen = document.getElementById("gameScreen");
      this.seedBank = document.getElementById("seedBank");
      this.sunCountEl = document.getElementById("sunCount");
      this.sunPopEl = document.getElementById("sunPop");
      this.sunBankEl = this.sunCountEl.closest(".sun-bank");
      this.shovelBtn = document.getElementById("shovelBtn");
      this.pauseBtn = document.getElementById("pauseBtn");
      this.hudLevelNo = document.getElementById("hudLevelNo");
      this.hudLevelName = document.getElementById("hudLevelName");
      this.waveCountLabel = document.getElementById("waveCountLabel");
      this.wavePips = document.getElementById("wavePips");
      this.mowerCountEl = document.getElementById("mowerCount");
      this.gameTipEl = document.getElementById("gameTip");
      this.waveBanner = document.getElementById("waveBanner");
      this.waveBannerKicker = document.getElementById("waveBannerKicker");
      this.waveBannerTitle = document.getElementById("waveBannerTitle");
      this.bossTrack = document.getElementById("bossTrack");
      this.bossHpBar = document.getElementById("bossHpBar");
      this.bossHpText = document.getElementById("bossHpText");
      this.bossNameEl = document.getElementById("bossName");
      this.coach = document.getElementById("coach");
      this.coachText = document.getElementById("coachText");
      this.coachClose = document.getElementById("coachClose");
      this.stageToast = document.getElementById("stageToast");
      this.ariaStatus = document.getElementById("ariaStatus");

      this.introOverlay = document.getElementById("introOverlay");
      this.introStamp = document.getElementById("introStamp");
      this.introKicker = document.getElementById("introKicker");
      this.introTitle = document.getElementById("introTitle");
      this.introLore = document.getElementById("introLore");
      this.introGoals = document.getElementById("introGoals");
      this.introArt = document.getElementById("introArt");
      this.introStartBtn = document.getElementById("introStartBtn");
      this.introBackBtn = document.getElementById("introBackBtn");

      this.pauseOverlay = document.getElementById("pauseOverlay");
      this.resumeBtn = document.getElementById("resumeBtn");
      this.restartBtn = document.getElementById("restartBtn");
      this.pauseMenuBtn = document.getElementById("pauseMenuBtn");

      this.resultOverlay = document.getElementById("resultOverlay");
      this.resultArt = document.getElementById("resultArt");
      this.resultKicker = document.getElementById("resultKicker");
      this.resultTitle = document.getElementById("resultTitle");
      this.resultSub = document.getElementById("resultSub");
      this.resultStars = document.getElementById("resultStars");
      this.resultTime = document.getElementById("resultTime");
      this.resultMowers = document.getElementById("resultMowers");
      this.resultKills = document.getElementById("resultKills");
      this.resultPrimary = document.getElementById("resultPrimary");
      this.resultSecondary = document.getElementById("resultSecondary");
      this.resultMenu = document.getElementById("resultMenu");

      this.reduceMotion = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

      this.canvas.setAttribute("tabindex", "0");
      this.active = false;
      this.phase = "idle";
      this.level = null;
      this.levelId = 1;
      this.time = 0;
      this.animTime = 0;
      this.sun = 0;
      this.plants = [];
      this.zombies = [];
      this.projectiles = [];
      this.suns = [];
      this.particles = [];
      this.rings = [];
      this.floatTexts = [];
      this.beams = [];
      this.mowers = [];
      this.cooldownUntil = {};
      this.selectedPlantId = null;
      this.shovelActive = false;
      this.hoverCell = null;
      this.waveIndex = -1;
      this.waveState = "prep";
      this.waveTimer = 0;
      this.waveSpawnElapsed = 0;
      this.spawnQueue = [];
      this.laneBag = [];
      this.waveBannerTimer = null;
      this.coachTimer = null;
      this.stageToastTimer = null;
      this.resultShown = false;
      this.endDelay = 0;
      this.pendingWin = null;
      this.boss = null;
      this.bossSpawned = false;
      this.kills = 0;
      this.gameClock = 0;
      this.cardEls = {};
      this.lastHudUpdate = -1;
      this.shake = 0;
      this.idCounter = 0;
      this.skySunTimer = 0;
      this.shovelWasActive = false;
      this.resultActions = null;
      this.boundLoop = this.loop.bind(this);
      this.raf = null;
      this.lastFrameAt = 0;
      this.resizeObserver = null;
      this._resizeHandler = this.resize.bind(this);
      this._keyHandler = this.handleKeydown.bind(this);

      this.bindEvents();
      this.observeResize();
    }

    /* -------------------------------------------------------
       Setup & lifecycle
       ------------------------------------------------------- */

    bindEvents() {
      this.seedBank.addEventListener("click", (event) => {
        const button = event.target.closest(".seed-card");
        if (!button) return;
        this.selectPlant(button.dataset.plant);
      });

      this.shovelBtn.addEventListener("click", () => {
        this.toggleShovel();
      });

      this.pauseBtn.addEventListener("click", () => {
        this.pauseGame();
      });

      this.introStartBtn.addEventListener("click", () => {
        this.audio.unlock();
        this.audio.play("ui");
        this.startPlay();
      });

      this.introBackBtn.addEventListener("click", () => {
        this.audio.play("ui");
        this.exitToMenu();
      });

      this.resumeBtn.addEventListener("click", () => {
        this.audio.play("ui");
        this.resumeGame();
      });

      this.restartBtn.addEventListener("click", () => {
        this.audio.play("ui");
        this.start(this.levelId);
      });

      this.pauseMenuBtn.addEventListener("click", () => {
        this.audio.play("ui");
        this.saveRunAndExit();
      });

      this.resultPrimary.addEventListener("click", () => {
        this.audio.play("ui");
        this.runResultAction("primary");
      });

      this.resultSecondary.addEventListener("click", () => {
        this.audio.play("ui");
        this.runResultAction("secondary");
      });

      this.resultMenu.addEventListener("click", () => {
        this.audio.play("ui");
        this.runResultAction("tertiary");
      });

      this.coachClose.addEventListener("click", () => {
        this.hideCoach();
      });

      this.canvas.addEventListener("pointermove", (event) => {
        if (!this.active || this.phase !== "playing") return;
        const point = this.pointerToBoard(event);
        if (!point) {
          this.hoverCell = null;
          return;
        }
        this.hoverCell = Art.cellAt(point.x, point.y);
      });

      this.canvas.addEventListener("pointerleave", () => {
        this.hoverCell = null;
      });

      this.canvas.addEventListener("pointerdown", (event) => {
        if (!this.active || this.phase !== "playing") return;
        if (event.button != null && event.button !== 0) return;
        event.preventDefault();
        const point = this.pointerToBoard(event);
        if (!point) return;
        this.handleBoardTap(point.x, point.y, event.pointerType === "touch");
      });

      this.canvas.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        if (this.phase === "playing") this.cancelSelection(true);
      });

      document.addEventListener("keydown", this._keyHandler);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.active && this.phase === "playing") {
          this.pauseGame();
        }
      });
      global.addEventListener("resize", this._resizeHandler);
    }

    observeResize() {
      if (!this.boardStage) return;
      if (typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(() => {
          if (this.active) this.resize();
        });
        this.resizeObserver.observe(this.boardStage);
      }
    }

    resize() {
      if (!this.boardStage || !this.boardFrame) return;
      const rect = this.boardStage.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      const ratio = Art.BOARD.width / Art.BOARD.height;
      const maxContentW = Math.max(280, rect.width - 12);
      const maxContentH = Math.max(150, rect.height - 12);
      let cw = maxContentW;
      let ch = cw / ratio;
      if (ch > maxContentH) {
        ch = maxContentH;
        cw = ch * ratio;
      }
      this.boardFrame.style.width = Math.floor(cw + 12) + "px";
      this.boardFrame.style.height = Math.floor(ch + 12) + "px";
    }

    start(levelId) {
      const level = Data.getLevel(levelId);
      if (!level) return;
      this.clearTransientTimers();
      this.level = level;
      this.levelId = level.id;
      // Starting a match consumes any paused snapshot for this level.
      if (Sunbud.Save && Sunbud.Save.clearRun) Sunbud.Save.clearRun(level.id);
      this.phase = "intro";
      this.active = true;
      this.time = 0;
      this.animTime = 0;
      this.gameClock = 0;
      this.sun = level.startSun;
      this.sunCollected = 0;
      this.plants = [];
      this.zombies = [];
      this.projectiles = [];
      this.suns = [];
      this.particles = [];
      this.rings = [];
      this.floatTexts = [];
      this.beams = [];
      this.mowers = [];
      for (let row = 0; row < Art.GRID.rows; row += 1) {
        this.mowers.push({
          row: row,
          x: Art.MOWER_X,
          y: Art.GRID.y + row * Art.GRID.ch + Art.GRID.ch / 2 + 33,
          triggered: false,
          active: false,
          dustTimer: 0,
          bossHit: false
        });
      }
      this.cooldownUntil = {};
      for (const type of level.loadout) this.cooldownUntil[type] = 0;
      this.selectedPlantId = null;
      this.shovelActive = false;
      this.shovelWasActive = false;
      this.hoverCell = null;
      this.waveIndex = -1;
      this.waveState = "prep";
      this.waveTimer = level.firstWaveDelay;
      this.waveSpawnElapsed = 0;
      this.spawnQueue = [];
      this.laneBag = [];
      this.resultShown = false;
      this.endDelay = 0;
      this.pendingWin = null;
      this.pendingResult = null;
      this.boss = null;
      this.bossSpawned = false;
      this.bossTrack.classList.add("hidden");
      this.bossHpBar.style.width = "100%";
      this.bossHpText.textContent = "100%";
      if (this.bossNameEl) this.bossNameEl.textContent = "首领";
      this.kills = 0;
      this.skySunTimer = 1.1;
      this.idCounter = 0;
      this.shake = 0;
      this.plantedAny = false;
      this.firstSunCollected = false;
      this.firstWaveCoached = false;
      this.stageToast.classList.remove("show");
      this.waveBanner.classList.remove("show");
      this.coach.classList.remove("show");
      this.pauseOverlay.classList.add("hidden");
      this.resultOverlay.classList.add("hidden");
      this.introOverlay.classList.remove("hidden");
      this.resultStars.classList.remove("play");
      this.resultStars.innerHTML = "";
      this.lastHudUpdate = -1;

      this.hudLevelNo.textContent = level.code;
      this.hudLevelName.textContent = level.name;
      this.waveCountLabel.textContent = "准备阶段";
      this.buildSeedBank();
      this.buildWavePips();
      this.fillIntro();
      this.updateHud(true);
      this.syncSelectionVisuals();
      this.syncToolVisuals();
      this.applyCursor();

      if (this.raf == null) {
        this.lastFrameAt = 0;
        this.raf = global.requestAnimationFrame(this.boundLoop);
      }
      this.resize();
      global.requestAnimationFrame(() => {
        this.resize();
        this.introStartBtn.focus({ preventScroll: true });
      });
      this.audio.startMusic(level.theme);
      this.announce("第 " + level.id + " 关，" + level.name + "。阅读简报后开始守护。");
    }

    /* -------------------------------------------------------
       Paused-run snapshot
       ------------------------------------------------------- */

    captureRun() {
      if (!this.active || !this.level) return null;
      if (this.phase !== "playing" && this.phase !== "paused") return null;

      const plantStates = this.plants.filter((p) => !p.dead).map((p) => ({
        id: p.id,
        type: p.type,
        row: p.row,
        col: p.col,
        x: p.x,
        y: p.y,
        hp: p.hp,
        maxHp: p.maxHp,
        bornAt: p.bornAt,
        animPhase: p.animPhase,
        attackTimer: p.attackTimer,
        recoil: p.recoil,
        flash: p.flash,
        armed: !!p.armed,
        armedAt: p.armedAt,
        fuse: p.fuse,
        produceTimer: p.produceTimer,
        glow: !!p.glow
      }));

      const zombieStates = this.zombies.filter((z) => !z.dead).map((z) => ({
        id: z.id,
        type: z.type,
        row: z.row,
        x: z.x,
        y: z.y,
        hp: z.hp,
        maxHp: z.maxHp,
        speed: z.speed,
        bite: z.bite,
        biteInterval: z.biteInterval,
        scale: z.scale,
        artScale: z.artScale,
        boss: !!z.boss,
        animPhase: z.animPhase,
        flash: z.flash,
        slowUntil: z.slowUntil,
        eatingId: z.eating && z.eating.id != null ? z.eating.id : null,
        attackTimer: z.attackTimer,
        roarTimer: z.roarTimer,
        roared66: !!z.roared66,
        roared32: !!z.roared32
      }));

      const projectileStates = this.projectiles.filter((p) => !p.dead).map((p) => {
        if (p.kind === "puff") {
          return {
            kind: p.kind,
            row: p.row,
            startX: p.startX,
            startY: p.startY,
            x: p.x,
            y: p.y,
            targetX: p.targetX,
            targetY: p.targetY,
            groundY: p.groundY,
            t: p.t,
            duration: p.duration,
            damage: p.damage,
            splashRadius: p.splashRadius
          };
        }
        return {
          kind: p.kind,
          row: p.row,
          x: p.x,
          y: p.y,
          speed: p.speed,
          damage: p.damage,
          color: p.color,
          slow: p.slow,
          slowTime: p.slowTime,
          splashDamage: p.splashDamage,
          splashRadius: p.splashRadius
        };
      });

      const sunStates = this.suns.map((sun) => ({
        id: sun.id,
        x: sun.x,
        baseX: sun.baseX,
        y: sun.y,
        startY: sun.startY,
        targetX: sun.targetX,
        targetY: sun.targetY,
        fallT: sun.fallT,
        fallDuration: sun.fallDuration,
        landed: !!sun.landed,
        ttl: sun.ttl,
        phase: sun.phase,
        scale: sun.scale,
        falling: !!sun.falling
      }));

      const mowerStates = this.mowers.map((m) => ({
        row: m.row,
        x: m.x,
        y: m.y,
        triggered: !!m.triggered,
        active: !!m.active,
        dustTimer: m.dustTimer,
        bossHit: !!m.bossHit
      }));

      const cooldownRemaining = {};
      this.level.loadout.forEach((type) => {
        cooldownRemaining[type] = Math.max(0, (this.cooldownUntil[type] || 0) - this.time);
      });

      const wave = this.waveIndex >= 0 ? this.waveIndex + 1 : 0;
      const waveTotal = this.level.waves.length;
      let label = "准备阶段";
      if (this.waveState === "between") {
        label = "第 " + Math.max(1, wave) + " 波后整备";
      } else if (this.waveState === "spawning" || this.waveState === "fighting") {
        label = "第 " + Math.max(1, wave) + " / " + waveTotal + " 波";
      }

      return {
        version: 1,
        levelId: this.levelId,
        savedAt: Date.now(),
        summary: {
          wave: wave,
          waveTotal: waveTotal,
          label: label,
          sun: Math.floor(this.sun),
          kills: this.kills,
          seconds: Math.round(this.time),
          phase: this.waveState
        },
        state: {
          time: this.time,
          gameClock: this.gameClock,
          sun: this.sun,
          sunCollected: this.sunCollected,
          kills: this.kills,
          skySunTimer: this.skySunTimer,
          idCounter: this.idCounter,
          plantedAny: !!this.plantedAny,
          firstSunCollected: !!this.firstSunCollected,
          firstWaveCoached: !!this.firstWaveCoached,
          waveIndex: this.waveIndex,
          waveState: this.waveState,
          waveTimer: this.waveTimer,
          waveSpawnElapsed: this.waveSpawnElapsed,
          spawnQueue: this.spawnQueue.map((entry) => ({ t: entry.t, type: entry.type, row: entry.row })),
          laneBag: this.laneBag.slice(),
          cooldownRemaining: cooldownRemaining,
          plants: plantStates,
          zombies: zombieStates,
          projectiles: projectileStates,
          suns: sunStates,
          mowers: mowerStates,
          bossId: this.boss && !this.boss.dead ? this.boss.id : null
        }
      };
    }

    autoSaveRun() {
      if (!this.active || !this.level) return false;
      if (this.phase !== "playing" && this.phase !== "paused") return false;
      const run = this.captureRun();
      if (!run || !Sunbud.Save || !Sunbud.Save.saveRun) return false;
      return Sunbud.Save.saveRun(this.levelId, run);
    }

    saveRunAndExit() {
      const level = this.level;
      const saved = this.autoSaveRun();
      this.exitToMenu();
      if (level && this.callbacks.onRunSaved) this.callbacks.onRunSaved(saved, level);
    }

    restoreRun(run) {
      if (!run || !run.state || Number(run.levelId) !== this.levelId) return false;
      const state = run.state;
      if (!state || typeof state !== "object") return false;
      if (!this.level) return false;

      const finite = (value, fallback) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
      };
      const positiveInt = (value, fallback) => {
        const n = Math.floor(Number(value));
        return Number.isFinite(n) && n > 0 ? n : fallback;
      };
      const rowOf = (value, fallback) => {
        const row = Math.floor(finite(value, fallback));
        return Math.max(0, Math.min(Art.GRID.rows - 1, row));
      };
      const colOf = (value, fallback) => {
        const col = Math.floor(finite(value, fallback));
        return Math.max(0, Math.min(Art.GRID.cols - 1, col));
      };
      const maxIdBefore = Math.max(0, Math.floor(finite(state.idCounter, 0)));

      this.time = Math.max(0, finite(state.time, 0));
      this.gameClock = Math.max(0, finite(state.gameClock, this.time));
      this.sun = Math.max(0, finite(state.sun, this.level.startSun));
      this.sunCollected = Math.max(0, finite(state.sunCollected, 0));
      this.kills = Math.max(0, Math.floor(finite(state.kills, 0)));
      this.skySunTimer = Math.max(0, finite(state.skySunTimer, 1.1));
      this.plantedAny = !!state.plantedAny;
      this.firstSunCollected = !!state.firstSunCollected;
      this.firstWaveCoached = !!state.firstWaveCoached;

      const waves = this.level.waves.length;
      this.waveIndex = Math.max(-1, Math.min(waves - 1, Math.floor(finite(state.waveIndex, -1))));
      const validStates = ["prep", "between", "spawning", "fighting"];
      this.waveState = validStates.indexOf(state.waveState) >= 0 ? state.waveState : "prep";
      if (this.waveIndex < 0 && this.waveState !== "prep") this.waveState = "prep";
      this.waveTimer = Math.max(0, finite(state.waveTimer, this.level.firstWaveDelay));
      this.waveSpawnElapsed = Math.max(0, finite(state.waveSpawnElapsed, 0));
      this.spawnQueue = (Array.isArray(state.spawnQueue) ? state.spawnQueue : [])
        .filter((entry) => entry && Data.enemies[entry.type] && Number.isFinite(Number(entry.t)))
        .map((entry) => ({ t: Math.max(0, Number(entry.t)), type: entry.type, row: entry.row == null ? null : rowOf(entry.row, 0) }))
        .sort((a, b) => a.t - b.t);
      this.laneBag = (Array.isArray(state.laneBag) ? state.laneBag : [])
        .map((row) => Math.floor(Number(row)))
        .filter((row) => row >= 0 && row < Art.GRID.rows);

      const usedPlantIds = new Set();
      const plants = [];
      (Array.isArray(state.plants) ? state.plants : []).forEach((raw, index) => {
        if (!raw || !Data.plants[raw.type]) return;
        const cfg = Data.plants[raw.type];
        const row = rowOf(raw.row, 0);
        const col = colOf(raw.col, 0);
        const center = Art.cellCenter(row, col);
        let id = positiveInt(raw.id, index + 1);
        while (usedPlantIds.has(id)) id += 10000;
        usedPlantIds.add(id);
        plants.push({
          id: id,
          type: raw.type,
          row: row,
          col: col,
          x: finite(raw.x, center.x),
          y: finite(raw.y, Art.cellGround(row)),
          hp: Math.max(1, finite(raw.hp, cfg.hp)),
          maxHp: Math.max(1, finite(raw.maxHp, cfg.hp)),
          bornAt: finite(raw.bornAt, this.time),
          animPhase: finite(raw.animPhase, 0),
          attackTimer: finite(raw.attackTimer, 0.3),
          recoil: finite(raw.recoil, 0),
          flash: finite(raw.flash, 0),
          dead: false,
          armed: !!raw.armed,
          armedAt: finite(raw.armedAt, 0),
          fuse: clamp(finite(raw.fuse, 0), 0, 1),
          produceTimer: finite(raw.produceTimer, cfg.produce ? cfg.produce.first : 0),
          glow: !!raw.glow
        });
      });
      this.plants = plants;

      const plantsById = new Map(this.plants.map((plant) => [plant.id, plant]));
      const usedZombieIds = new Set();
      const zombies = [];
      (Array.isArray(state.zombies) ? state.zombies : []).forEach((raw, index) => {
        if (!raw || !Data.enemies[raw.type]) return;
        const cfg = Data.enemies[raw.type];
        const row = rowOf(raw.row, 0);
        let id = positiveInt(raw.id, index + 1);
        while (usedZombieIds.has(id)) id += 10000;
        usedZombieIds.add(id);
        const hp = Math.max(1, finite(raw.hp, cfg.hp * this.level.hpMul));
        const eating = raw.eatingId != null ? plantsById.get(raw.eatingId) : null;
        zombies.push({
          id: id,
          type: raw.type,
          row: row,
          x: finite(raw.x, Art.SPAWN_X),
          y: finite(raw.y, Art.cellGround(row)),
          hp: hp,
          maxHp: Math.max(1, finite(raw.maxHp, cfg.hp * this.level.hpMul)),
          speed: finite(raw.speed, cfg.speed * this.level.speedMul),
          bite: finite(raw.bite, cfg.bite),
          biteInterval: finite(raw.biteInterval, cfg.biteInterval),
          scale: finite(raw.scale, cfg.scale),
          artScale: finite(raw.artScale, cfg.artScale || 1),
          boss: !!cfg.boss,
          animPhase: finite(raw.animPhase, 0),
          flash: finite(raw.flash, 0),
          slowUntil: finite(raw.slowUntil, 0),
          eating: eating && eating.row === row ? eating : null,
          attackTimer: finite(raw.attackTimer, 0.18),
          dead: false,
          roarTimer: finite(raw.roarTimer, 0),
          roared66: !!raw.roared66,
          roared32: !!raw.roared32
        });
      });
      this.zombies = zombies;

      const projectiles = [];
      (Array.isArray(state.projectiles) ? state.projectiles : []).forEach((raw) => {
        if (!raw || !raw.kind) return;
        if (raw.kind === "puff") {
          if (!Number.isFinite(Number(raw.t)) || !Number.isFinite(Number(raw.duration))) return;
          projectiles.push({
            kind: "puff",
            row: rowOf(raw.row, 0),
            startX: finite(raw.startX, 0),
            startY: finite(raw.startY, 0),
            x: finite(raw.x, 0),
            y: finite(raw.y, 0),
            targetX: finite(raw.targetX, 0),
            targetY: finite(raw.targetY, 0),
            groundY: finite(raw.groundY, 0),
            t: finite(raw.t, 0),
            duration: Math.max(0.05, finite(raw.duration, 0.8)),
            damage: finite(raw.damage, 0),
            splashRadius: finite(raw.splashRadius, 0),
            dead: false
          });
          return;
        }
        if (["pea", "frost", "water"].indexOf(raw.kind) < 0) return;
        projectiles.push({
          kind: raw.kind,
          row: rowOf(raw.row, 0),
          x: finite(raw.x, 0),
          y: finite(raw.y, 0),
          speed: finite(raw.speed, 400),
          damage: finite(raw.damage, 0),
          color: raw.color,
          slow: finite(raw.slow, 0),
          slowTime: finite(raw.slowTime, 0),
          splashDamage: finite(raw.splashDamage, 0),
          splashRadius: finite(raw.splashRadius, 0),
          dead: false
        });
      });
      this.projectiles = projectiles;

      this.suns = (Array.isArray(state.suns) ? state.suns : []).map((raw, index) => ({
        id: positiveInt(raw && raw.id, index + 1),
        x: finite(raw && raw.x, 0),
        baseX: finite(raw && raw.baseX, finite(raw && raw.x, 0)),
        y: finite(raw && raw.y, 0),
        startY: finite(raw && raw.startY, 0),
        targetX: finite(raw && raw.targetX, 0),
        targetY: finite(raw && raw.targetY, 0),
        fallT: clamp(finite(raw && raw.fallT, 1), 0, 1),
        fallDuration: Math.max(0.1, finite(raw && raw.fallDuration, 1)),
        landed: !!(raw && raw.landed),
        ttl: Math.max(0, finite(raw && raw.ttl, 12)),
        phase: finite(raw && raw.phase, 0),
        scale: finite(raw && raw.scale, 1.2),
        falling: !!(raw && raw.falling)
      }));

      if (Array.isArray(state.mowers) && state.mowers.length === Art.GRID.rows) {
        this.mowers = state.mowers.map((raw, row) => ({
          row: row,
          x: finite(raw && raw.x, Art.MOWER_X),
          y: finite(raw && raw.y, Art.cellGround(row) + 33),
          triggered: !!(raw && raw.triggered),
          active: !!(raw && raw.active),
          dustTimer: finite(raw && raw.dustTimer, 0),
          bossHit: !!(raw && raw.bossHit)
        }));
      }

      this.cooldownUntil = {};
      this.level.loadout.forEach((type) => {
        const remaining = Math.max(0, Math.min(120, finite(state.cooldownRemaining && state.cooldownRemaining[type], 0)));
        this.cooldownUntil[type] = this.time + remaining;
      });

      const maxEntityId = Math.max(
        0,
        ...this.plants.map((p) => p.id),
        ...this.zombies.map((z) => z.id),
        ...this.suns.map((s) => s.id)
      );
      this.idCounter = Math.max(maxIdBefore, maxEntityId);

      this.selectedPlantId = null;
      this.shovelActive = false;
      this.shovelWasActive = false;
      this.hoverCell = null;
      this.phase = "playing";
      this.introOverlay.classList.add("hidden");
      this.pauseOverlay.classList.add("hidden");
      this.resultOverlay.classList.add("hidden");
      this.resultShown = false;
      this.resultActions = null;
      this.pendingWin = null;
      this.pendingResult = null;
      this.endDelay = 0;
      this.shake = 0;
      this.lastHudUpdate = -1;
      this.coach.classList.remove("show");
      this.waveBanner.classList.remove("show");
      this.stageToast.classList.remove("show");
      this.particles = [];
      this.rings = [];
      this.floatTexts = [];
      this.beams = [];

      this.boss = this.zombies.find((z) => z.boss && !z.dead) || null;
      this.bossSpawned = !!this.boss;
      if (!this.boss) this.bossTrack.classList.add("hidden");

      this.updateHud(true);
      this.syncSelectionVisuals();
      this.syncToolVisuals();
      this.applyCursor();
      this.lastFrameAt = 0;
      this.canvas.focus({ preventScroll: true });
      const label = run.summary && run.summary.label ? run.summary.label : "花园中段";
      this.showStageToast("已继续守护 · " + label, 3600);
      this.announce("已继续之前的对局。" + label + "。");
      return true;
    }

    startPlay() {
      if (this.phase !== "intro") return;
      this.introOverlay.classList.add("hidden");
      this.phase = "playing";
      this.time = 0;
      this.gameClock = 0;
      this.lastFrameAt = 0;
      this.callbacks.onLevelStart(this.level);
      this.showCoach(this.level.tips.start || "点击落下的阳光，选择种子卡，再把植物种在草坪上。", 9000);
      this.updateHud(true);
      this.syncSelectionVisuals();
      this.applyCursor();
      this.canvas.focus({ preventScroll: true });
      this.announce("守护开始。夜霉将在 " + Math.round(this.waveTimer) + " 秒后抵达。");
    }

    exitToMenu() {
      this.active = false;
      this.phase = "idle";
      if (this.raf != null) {
        global.cancelAnimationFrame(this.raf);
        this.raf = null;
      }
      this.clearTransientTimers();
      this.introOverlay.classList.add("hidden");
      this.pauseOverlay.classList.add("hidden");
      this.resultOverlay.classList.add("hidden");
      this.coach.classList.remove("show");
      this.waveBanner.classList.remove("show");
      this.stageToast.classList.remove("show");
      this.bossTrack.classList.add("hidden");
      this.canvas.classList.remove("pointer-grab", "shovel-cursor");
      this.callbacks.onExit();
    }

    clearTransientTimers() {
      if (this.waveBannerTimer) global.clearTimeout(this.waveBannerTimer);
      if (this.coachTimer) global.clearTimeout(this.coachTimer);
      if (this.stageToastTimer) global.clearTimeout(this.stageToastTimer);
      this.waveBannerTimer = null;
      this.coachTimer = null;
      this.stageToastTimer = null;
    }

    /* -------------------------------------------------------
       Intro, HUD, cards
       ------------------------------------------------------- */

    fillIntro() {
      const level = this.level;
      this.introStamp.textContent = "LEVEL " + level.code;
      this.introKicker.textContent = level.intro.kicker;
      this.introTitle.textContent = level.intro.title;
      this.introLore.textContent = level.intro.lore;
      this.introGoals.innerHTML = "";
      level.intro.goals.forEach((goal) => {
        const li = document.createElement("li");
        li.textContent = goal;
        this.introGoals.appendChild(li);
      });
      const unlocks = (level.unlock || []).map((id) => Data.plants[id] && Data.plants[id].name).filter(Boolean);
      if (unlocks.length) {
        const li = document.createElement("li");
        li.className = "new-seed-goal";
        li.textContent = "新种子 · " + unlocks.join(" / ");
        this.introGoals.appendChild(li);
      }
      Art.drawIntroArt(this.introArt, level);
      this.introStartBtn.innerHTML = '开始守护 <span class="btn-arrow" aria-hidden="true">→</span>';
    }

    buildSeedBank() {
      this.seedBank.innerHTML = "";
      this.cardEls = {};
      this.level.loadout.forEach((type, index) => {
        const plant = Data.plants[type];
        if (!plant) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "seed-card";
        button.dataset.plant = type;
        button.setAttribute("aria-label", plant.name + "，花费 " + plant.cost + " 阳光。" + plant.desc);
        button.setAttribute("aria-pressed", "false");
        button.title = plant.name + " · " + plant.cost + " 阳光\n" + plant.desc;
        button.innerHTML =
          '<span class="seed-cost"><i class="cost-sun"></i>' + plant.cost + "</span>" +
          '<span class="seed-name">' + plant.name + "</span>" +
          '<span class="seed-key">' + (index + 1) + "</span>" +
          '<span class="cool-mask"></span>' +
          '<span class="cool-time"></span>';
        const artCanvas = document.createElement("canvas");
        artCanvas.className = "seed-art";
        artCanvas.width = 168;
        artCanvas.height = 168;
        artCanvas.setAttribute("aria-hidden", "true");
        Art.paintPlantThumb(artCanvas, type);
        button.appendChild(artCanvas);
        this.seedBank.appendChild(button);
        this.cardEls[type] = {
          button: button,
          mask: button.querySelector(".cool-mask"),
          time: button.querySelector(".cool-time")
        };
      });
    }

    buildWavePips() {
      this.wavePips.innerHTML = "";
      this.level.waves.forEach(() => {
        const pip = document.createElement("i");
        pip.className = "wave-pip";
        this.wavePips.appendChild(pip);
      });
    }

    updateHud(force) {
      if (!this.level) return;
      const now = this.phase === "playing" || this.phase === "paused" || this.phase === "ending" ? this.time : 0;
      if (!force && now - this.lastHudUpdate < 0.1) return;
      this.lastHudUpdate = now;

      this.sunCountEl.textContent = Math.floor(this.sun);
      this.sunCountEl.classList.toggle("large", this.sun >= 1000);
      const mowersLeft = this.mowers.filter((m) => !m.triggered).length;
      this.mowerCountEl.textContent = mowersLeft;
      this.mowerCountEl.parentElement.classList.toggle("empty", mowersLeft === 0);

      this.updateCards();
      this.updateWavePips();
      this.updateBossTrack();
      this.updateBottomCopy();
    }

    updateCards() {
      this.level.loadout.forEach((type) => {
        const entry = this.cardEls[type];
        if (!entry) return;
        const cfg = Data.plants[type];
        const remaining = Math.max(0, (this.cooldownUntil[type] || 0) - this.time);
        const cooling = remaining > 0.04;
        const affordable = this.sun >= cfg.cost;
        const pct = cooling ? clamp(remaining / cfg.cooldown, 0, 1) : 0;
        entry.mask.style.height = (pct * 100).toFixed(1) + "%";
        entry.time.textContent = remaining > 0 ? (remaining >= 1 ? Math.ceil(remaining) + "s" : "<1s") : "";
        entry.button.classList.toggle("cooling", cooling);
        entry.button.classList.toggle("dim", !affordable && !cooling);
        const selected = this.selectedPlantId === type;
        entry.button.classList.toggle("selected", selected);
        entry.button.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    }

    updateWavePips() {
      const pips = this.wavePips.querySelectorAll(".wave-pip");
      pips.forEach((pip, index) => {
        const isCurrent = index === this.waveIndex;
        const done = index < this.waveIndex || this.phase === "won";
        pip.classList.toggle("active", isCurrent && this.phase !== "won");
        pip.classList.toggle("done", done);
      });
    }

    updateBossTrack() {
      const boss = this.zombies.find((z) => z.boss && !z.dead);
      if (!boss) {
        this.bossTrack.classList.add("hidden");
        return;
      }
      this.bossTrack.classList.remove("hidden");
      if (this.bossNameEl) {
        const bossCfg = Data.enemies[boss.type];
        this.bossNameEl.textContent = bossCfg ? bossCfg.name : "首领";
      }
      const pct = clamp(boss.hp / boss.maxHp, 0, 1);
      this.bossHpBar.style.width = (pct * 100).toFixed(1) + "%";
      this.bossHpText.textContent = Math.ceil(pct * 100) + "%";
      this.bossTrack.setAttribute("aria-valuenow", String(Math.round(pct * 100)));
    }

    updateBottomCopy() {
      if (this.selectedPlantId) {
        const cfg = Data.plants[this.selectedPlantId];
        this.gameTipEl.textContent = "已选择「" + cfg.name + "」 · 点击草坪种下 · 右键 / Esc 取消";
      } else if (this.shovelActive) {
        this.gameTipEl.textContent = "铲子模式 · 点击一株植物将它移除";
      } else if (this.waveState === "prep") {
        this.gameTipEl.textContent = "夜霉将在 " + Math.max(0, Math.ceil(this.waveTimer)) + " 秒后抵达 · 先安排阳光与射手";
      } else if (this.waveState === "between") {
        this.gameTipEl.textContent = "本波已清 · 下一波还有 " + Math.max(0, Math.ceil(this.waveTimer)) + " 秒";
      } else if (this.boss && !this.boss.dead) {
        this.gameTipEl.textContent = "首领正在逼近 · 集中火力，守住最后一行";
      } else if (this.waveIndex >= 0) {
        this.gameTipEl.textContent = "第 " + (this.waveIndex + 1) + " 波 · 已赶走 " + this.kills + " 只夜霉";
      } else {
        this.gameTipEl.textContent = "收集阳光，选择种子卡，再点草坪种植";
      }

      if (this.waveIndex >= 0) {
        this.waveCountLabel.innerHTML = "第 <b>" + (this.waveIndex + 1) + "</b> / " + this.level.waves.length + " 波";
      } else if (this.phase === "playing" || this.phase === "paused" || this.phase === "ending") {
        this.waveCountLabel.textContent = "准备阶段";
      }
    }

    updateSunDisplay(bump, amount) {
      this.sunCountEl.textContent = Math.floor(this.sun);
      this.sunCountEl.classList.toggle("large", this.sun >= 1000);
      if (bump) {
        this.sunBankEl.classList.remove("bump");
        void this.sunBankEl.offsetWidth;
        this.sunBankEl.classList.add("bump");
        this.sunPopEl.textContent = "+" + (amount || 25);
        this.sunPopEl.classList.remove("show");
        void this.sunPopEl.offsetWidth;
        this.sunPopEl.classList.add("show");
      }
      this.updateCards();
    }

    /* -------------------------------------------------------
       Selection & inputs
       ------------------------------------------------------- */

    selectPlant(type) {
      if (!this.active || this.phase !== "playing") return;
      if (!this.level.loadout.includes(type)) return;
      const cfg = Data.plants[type];
      const remaining = Math.max(0, (this.cooldownUntil[type] || 0) - this.time);
      if (this.selectedPlantId === type) {
        this.cancelSelection(false);
        return;
      }
      if (remaining > 0.04) {
        this.shakeCard(type);
        this.showStageToast("「" + cfg.name + "」还需 " + Math.ceil(remaining) + " 秒冷却");
        this.audio.play("error");
        return;
      }
      if (this.sun < cfg.cost) {
        this.shakeCard(type);
        this.showStageToast("阳光不足 · 还差 " + Math.ceil(cfg.cost - this.sun));
        this.audio.play("error");
        return;
      }
      this.shovelActive = false;
      this.selectedPlantId = type;
      this.audio.play("select");
      this.syncSelectionVisuals();
      this.syncToolVisuals();
      this.applyCursor();
      this.updateBottomCopy();
    }

    cancelSelection(withSound) {
      const wasActive = !!this.selectedPlantId || this.shovelActive;
      this.selectedPlantId = null;
      this.shovelActive = false;
      this.syncSelectionVisuals();
      this.syncToolVisuals();
      this.applyCursor();
      this.updateBottomCopy();
      if (withSound && wasActive) this.audio.play("ui");
    }

    toggleShovel() {
      if (!this.active || this.phase !== "playing") return;
      if (this.shovelActive) {
        this.shovelActive = false;
      } else {
        this.shovelActive = true;
        this.selectedPlantId = null;
        this.audio.play("select");
      }
      this.syncSelectionVisuals();
      this.syncToolVisuals();
      this.applyCursor();
      this.updateBottomCopy();
    }

    syncSelectionVisuals() {
      Object.keys(this.cardEls).forEach((type) => {
        const entry = this.cardEls[type];
        if (!entry) return;
        const selected = this.selectedPlantId === type;
        entry.button.classList.toggle("selected", selected);
        entry.button.setAttribute("aria-pressed", selected ? "true" : "false");
      });
    }

    syncToolVisuals() {
      this.shovelBtn.classList.toggle("active", this.shovelActive);
      this.shovelBtn.setAttribute("aria-pressed", this.shovelActive ? "true" : "false");
    }

    applyCursor() {
      this.canvas.classList.toggle("pointer-grab", !!this.selectedPlantId);
      this.canvas.classList.toggle("shovel-cursor", this.shovelActive);
    }

    shakeCard(type) {
      const entry = this.cardEls[type];
      if (!entry) return;
      entry.button.classList.remove("shake");
      void entry.button.offsetWidth;
      entry.button.classList.add("shake");
    }

    pointerToBoard(event) {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const x = ((event.clientX - rect.left) / rect.width) * Art.BOARD.width;
      const y = ((event.clientY - rect.top) / rect.height) * Art.BOARD.height;
      if (x < 0 || y < 0 || x > Art.BOARD.width || y > Art.BOARD.height) return null;
      return { x: x, y: y };
    }

    handleBoardTap(x, y, isTouch) {
      // Sun always wins the click, even over a plant or a seed ghost.
      const hitRadius = isTouch ? 76 : 62;
      for (let i = this.suns.length - 1; i >= 0; i -= 1) {
        const sun = this.suns[i];
        if (Math.hypot(sun.x - x, sun.y - y) <= hitRadius) {
          this.collectSun(sun);
          return;
        }
      }

      const cell = Art.cellAt(x, y);
      if (!cell) {
        if (this.selectedPlantId || this.shovelActive) this.cancelSelection(true);
        return;
      }

      this.hoverCell = cell;
      if (this.shovelActive) {
        const plant = this.plantAt(cell.row, cell.col);
        if (!plant) {
          this.showStageToast("这里没有植物可以铲");
          this.audio.play("error");
          return;
        }
        this.removePlant(plant, true);
        return;
      }

      if (!this.selectedPlantId) return;
      this.attemptPlant(cell.row, cell.col);
    }

    attemptPlant(row, col) {
      const type = this.selectedPlantId;
      if (!type) return;
      const cfg = Data.plants[type];
      if (this.plantAt(row, col)) {
        this.showStageToast("这一格已经有植物了");
        this.shakeCard(type);
        this.audio.play("error");
        return;
      }
      const remaining = Math.max(0, (this.cooldownUntil[type] || 0) - this.time);
      if (remaining > 0.04) {
        this.showStageToast("种子还在冷却");
        this.shakeCard(type);
        return;
      }
      if (this.sun < cfg.cost) {
        this.showStageToast("阳光不足 · 还差 " + Math.ceil(cfg.cost - this.sun));
        this.shakeCard(type);
        this.audio.play("error");
        return;
      }

      const center = Art.cellCenter(row, col);
      const plant = {
        id: ++this.idCounter,
        type: type,
        row: row,
        col: col,
        x: center.x,
        y: Art.cellGround(row),
        hp: cfg.hp,
        maxHp: cfg.hp,
        bornAt: this.time,
        animPhase: Math.random() * TAU,
        attackTimer: 0.25 + Math.random() * 0.35,
        recoil: 0,
        flash: 0,
        dead: false,
        armed: false,
        armedAt: cfg.mine ? this.time + cfg.mine.armTime : 0,
        fuse: 0,
        produceTimer: cfg.produce ? cfg.produce.first : 0,
        glow: false
      };
      this.plants.push(plant);
      this.sun -= cfg.cost;
      this.cooldownUntil[type] = this.time + cfg.cooldown;
      this.selectedPlantId = null;
      this.syncSelectionVisuals();
      this.applyCursor();
      this.updateSunDisplay(false);
      this.updateHud(true);
      this.audio.play("plant");
      this.addParticles(center.x, plant.y - 8, 7, ["#6f8b49", "#c9b682", "#a4c46f"], {
        speedMin: 18,
        speedMax: 72,
        up: 55,
        gravity: 110,
        sizeMin: 2,
        sizeMax: 4.5,
        shape: "leaf",
        lifeMin: 0.35,
        lifeMax: 0.65
      });
      this.rings.push({
        x: plant.x,
        y: plant.y - 6,
        r0: 10,
        r1: 40,
        life: 0.4,
        maxLife: 0.4,
        color: "rgba(242, 234, 181, 0.55)",
        width: 1.4
      });
      this.updateBottomCopy();
      this.afterFirstPlant(type);
    }

    afterFirstPlant(type) {
      if (!this.plantedAny) {
        this.plantedAny = true;
        if (this.level.id === 1) {
          this.showCoach(type === "sunbud"
            ? "向日芽会定期结出阳光。先攒经济，再补豆荚射手，别急着把钱全花在一条行上。"
            : this.level.tips.firstPlant, 7500);
        }
      }
    }

    removePlant(plant, byShovel) {
      if (!plant || plant.dead) return;
      plant.dead = true;
      this.plants = this.plants.filter((p) => p !== plant);
      if (byShovel) {
        this.audio.play("shovel");
        this.showStageToast("已移除「" + Data.plants[plant.type].name + "」");
      }
      this.addParticles(plant.x, plant.y - 35, 9, ["#6e8f4d", "#9fbd70", "#c9b884"], {
        speedMin: 20,
        speedMax: 95,
        up: 75,
        gravity: 150,
        sizeMin: 2,
        sizeMax: 5,
        shape: "leaf",
        lifeMin: 0.45,
        lifeMax: 0.9
      });
      this.rings.push({
        x: plant.x,
        y: plant.y - 25,
        r0: 8,
        r1: 39,
        life: 0.35,
        maxLife: 0.35,
        color: "rgba(224, 220, 170, 0.35)",
        width: 1.1
      });
      this.zombies.forEach((z) => {
        if (z.eating === plant) z.eating = null;
      });
      this.updateHud(true);
    }

    plantAt(row, col) {
      return this.plants.find((p) => !p.dead && p.row === row && p.col === col) || null;
    }

    /* -------------------------------------------------------
       Sun economy
       ------------------------------------------------------- */

    spawnSkySun() {
      const x = rand(Art.GRID.x + 42, Art.GRID.x + Art.GRID.width - 42);
      const targetY = rand(Art.GRID.y + 65, Art.GRID.y + Art.GRID.height - 50);
      this.suns.push({
        id: ++this.idCounter,
        x: x,
        baseX: x,
        y: 90,
        startY: 90,
        targetX: x,
        targetY: targetY,
        fallT: 0,
        fallDuration: rand(1.2, 1.65),
        landed: false,
        ttl: 13,
        phase: Math.random() * TAU,
        scale: rand(1.24, 1.36),
        falling: true
      });
    }

    spawnProducedSun(plant) {
      const x = plant.x + rand(-12, 20);
      const targetY = plant.y - rand(50, 72);
      this.suns.push({
        id: ++this.idCounter,
        x: x,
        baseX: x,
        y: plant.y - 84,
        startY: plant.y - 84,
        targetX: x,
        targetY: targetY,
        fallT: 0,
        fallDuration: 0.55,
        landed: false,
        ttl: 12,
        phase: Math.random() * TAU,
        scale: 1.12,
        falling: true
      });
      this.addParticles(plant.x, plant.y - 82, 5, ["#ffe284", "#fff4bb"], {
        speedMin: 8,
        speedMax: 36,
        up: 30,
        gravity: -20,
        sizeMin: 1.5,
        sizeMax: 3,
        lifeMin: 0.4,
        lifeMax: 0.9,
        shape: "spark"
      });
    }

    updateSuns(dt) {
      for (let i = this.suns.length - 1; i >= 0; i -= 1) {
        const sun = this.suns[i];
        if (!sun.landed) {
          sun.fallT += dt / sun.fallDuration;
          const t = clamp(sun.fallT, 0, 1);
          sun.y = lerp(sun.startY, sun.targetY, easeOutCubic(t));
          sun.x = sun.baseX + Math.sin(t * 4.5 + sun.phase) * 12 * (1 - t);
          if (t >= 1) {
            sun.landed = true;
            sun.x = sun.targetX;
            sun.y = sun.targetY;
            sun.falling = false;
          }
        } else {
          sun.ttl -= dt;
          sun.y = sun.targetY + Math.sin(this.animTime * 2.7 + sun.phase) * 3.6;
          sun.x = sun.targetX + Math.sin(this.animTime * 1.2 + sun.phase) * 1.5;
          if (sun.ttl <= 0) this.suns.splice(i, 1);
        }
      }
    }

    collectSun(sun) {
      if (!sun || sun.collected) return;
      const value = 25;
      sun.collected = true;
      this.suns = this.suns.filter((s) => s !== sun);
      this.sun += value;
      this.sunCollected += value;
      this.audio.play("sun");
      this.updateSunDisplay(true, value);
      this.addText(sun.x, sun.y - 24, "+" + value, "#ffe184", 0.9, 15);
      this.addParticles(sun.x, sun.y, 14, ["#fff5cf", "#ffc76a", "#ff9345", "#e9612e"], {
        speedMin: 28,
        speedMax: 96,
        up: 50,
        gravity: 130,
        sizeMin: 1.8,
        sizeMax: 4.2,
        lifeMin: 0.3,
        lifeMax: 0.7,
        shape: "spark"
      });
      this.rings.push({
        x: sun.x,
        y: sun.y,
        r0: 8,
        r1: 38,
        life: 0.38,
        maxLife: 0.38,
        color: "rgba(255, 186, 100, 0.8)",
        width: 1.8
      });
      if (this.sunCollected >= 25 && !this.firstSunCollected) {
        this.firstSunCollected = true;
        if (this.level.id === 1) {
          this.showCoach(this.level.tips.firstSun, 7000);
        }
      }
      this.updateHud(true);
    }

    /* -------------------------------------------------------
       Plants
       ------------------------------------------------------- */

    updatePlants(dt) {
      for (let i = 0; i < this.plants.length; i += 1) {
        const p = this.plants[i];
        if (p.dead) continue;
        p.flash = Math.max(0, p.flash - dt);
        p.recoil = Math.max(0, p.recoil - dt * 4.4);
        const cfg = Data.plants[p.type];

        if (p.type === "sunbud") {
          p.produceTimer -= dt;
          p.glow = p.produceTimer < 1.2;
          if (p.produceTimer <= 0) {
            p.produceTimer += cfg.produce.interval;
            this.spawnProducedSun(p);
          }
          continue;
        }

        if (p.type === "popberry") {
          p.fuse = clamp(p.fuse + dt / cfg.explode.delay, 0, 1);
          if (p.fuse >= 1) {
            this.explodePopberry(p);
            p.dead = true;
            this.plants = this.plants.filter((pl) => pl !== p);
            i -= 1;
          }
          continue;
        }

        if (p.type === "thornspud") {
          if (!p.armed && this.time >= p.armedAt) {
            p.armed = true;
            this.audio.play("frost");
            this.addParticles(p.x, p.y - 20, 7, ["#e8c46b", "#f8e6a0"], {
              speedMin: 12,
              speedMax: 42,
              up: 35,
              gravity: 60,
              sizeMin: 1.5,
              sizeMax: 3.2,
              lifeMin: 0.35,
              lifeMax: 0.75,
              shape: "spark"
            });
          }
          if (p.armed) {
            const trigger = this.zombies.find((z) => !z.dead && z.row === p.row && z.x - p.x <= 80 && z.x > p.x - 30);
            if (trigger) {
              this.explodeThornspud(p);
              this.plants = this.plants.filter((pl) => pl !== p);
              i -= 1;
            }
          }
          continue;
        }

        if (p.type === "nutshell") continue;

        p.attackTimer -= dt;
        if (p.attackTimer > 0) continue;

        if (p.type === "prismbloom") {
          const targets = this.zombies.some((z) => !z.dead && z.row === p.row && z.x > p.x - 18);
          if (targets) {
            this.firePrismBloom(p);
            p.attackTimer = cfg.attack.interval;
          }
          continue;
        }

        if (p.type === "dawnbell") {
          const targets = this.zombies.some((z) => !z.dead && Math.abs(z.row - p.row) <= 1);
          if (targets) {
            this.pulseDawnBell(p);
            p.attackTimer = cfg.pulse.interval;
          }
          continue;
        }

        if (p.type === "dandelion") {
          const target = this.frontmostZombie();
          if (target) {
            this.fireDandelion(p, target);
            p.attackTimer = cfg.attack.interval;
          }
          continue;
        }

        const hasTarget = this.zombies.some((z) => !z.dead && z.row === p.row && z.x > p.x - 18);
        if (hasTarget) {
          this.fireShooter(p, cfg);
          p.attackTimer = cfg.attack.interval;
        }
      }
    }

    fireShooter(plant, cfg) {
      plant.recoil = 1;
      const scale = PLANT_SCALE[plant.type] || 1;
      const attack = cfg.attack;
      const isFrost = plant.type === "frostbell";
      if (plant.type === "twinpod") {
        const mx = plant.x + 31 * scale;
        const my = plant.y - 63 * scale;
        for (let i = 0; i < 2; i += 1) {
          this.projectiles.push({
            kind: "pea",
            row: plant.row,
            x: mx + i * 6,
            y: my + (i === 0 ? -5 : 5),
            speed: attack.projectileSpeed,
            damage: attack.damage,
            color: i === 0 ? "#b7da79" : "#90c363",
            dead: false
          });
        }
        this.audio.play("shoot");
      } else if (plant.type === "ripplily") {
        const mx = plant.x + 28 * scale;
        const my = plant.y - 57 * scale;
        this.projectiles.push({
          kind: "water",
          row: plant.row,
          x: mx,
          y: my,
          speed: attack.projectileSpeed,
          damage: attack.damage,
          splashDamage: attack.splash,
          splashRadius: attack.splashRadius,
          dead: false
        });
        this.audio.play("water");
      } else {
        const mx = plant.x + (isFrost ? 29 : 34) * scale;
        const my = plant.y - (isFrost ? 57 : 55) * scale;
        this.projectiles.push({
          kind: isFrost ? "frost" : "pea",
          row: plant.row,
          x: mx,
          y: my,
          speed: attack.projectileSpeed,
          damage: attack.damage,
          slow: attack.slow || 0,
          slowTime: attack.slowTime || 0,
          dead: false
        });
        this.audio.play(isFrost ? "frost" : "shoot");
      }
      this.addParticles(plant.x + 28 * scale, plant.y - 58 * scale, 3, isFrost ? ["#c9f4ee", "#eafff7"] : ["#cfe99a", "#e9f7b7"], {
        speedMin: 10,
        speedMax: 32,
        up: 8,
        gravity: -8,
        sizeMin: 1.2,
        sizeMax: 2.5,
        lifeMin: 0.18,
        lifeMax: 0.35,
        shape: "dot"
      });
    }

    firePrismBloom(plant) {
      const cfg = Data.plants.prismbloom;
      const scale = PLANT_SCALE.prismbloom;
      plant.recoil = 1;
      const beamY = plant.y - 61 * scale;
      this.addBeam(plant.x + 25 * scale, beamY, Art.BOARD.width - 30, beamY, "#e9d7ff", 2.8);
      const targets = this.zombies
        .filter((z) => !z.dead && z.row === plant.row && z.x > plant.x - 18)
        .sort((a, b) => a.x - b.x);
      for (const z of targets) {
        this.hitZombie(z, cfg.attack.damage, {});
      }
      this.addParticles(plant.x + 31 * scale, beamY, 9, ["#e3d6ff", "#a8e7e2", "#fff3bf"], {
        speedMin: 30,
        speedMax: 115,
        up: 15,
        gravity: 20,
        sizeMin: 1.2,
        sizeMax: 3.4,
        lifeMin: 0.22,
        lifeMax: 0.55,
        shape: "spark"
      });
      this.audio.play("beam");
      this.shake = Math.max(this.shake, 2.5);
    }

    pulseDawnBell(plant) {
      const cfg = Data.plants.dawnbell.pulse;
      plant.recoil = 1;
      for (let row = Math.max(0, plant.row - 1); row <= Math.min(Art.GRID.rows - 1, plant.row + 1); row += 1) {
        const center = Art.cellCenter(row, plant.col);
        this.rings.push({
          x: plant.x,
          y: center.y + 12,
          r0: 20,
          r1: Art.GRID.width * 0.82,
          life: 0.72,
          maxLife: 0.72,
          color: "rgba(255, 229, 164, 0.58)",
          width: 2.4
        });
      }
      for (const z of this.zombies) {
        if (z.dead || Math.abs(z.row - plant.row) > 1) continue;
        this.hitZombie(z, cfg.damage, { big: false });
        z.x += 8;
      }
      this.addText(plant.x, plant.y - 112, "钟波", "#fff0b8", 0.9, 17);
      this.addParticles(plant.x, plant.y - 70, 16, ["#fff1ba", "#efd187", "#9ac9ab"], {
        speedMin: 30,
        speedMax: 130,
        up: 55,
        gravity: 80,
        sizeMin: 1.2,
        sizeMax: 4.4,
        lifeMin: 0.35,
        lifeMax: 0.9,
        shape: "spark"
      });
      this.audio.play("bell");
      this.shake = Math.max(this.shake, 5);
    }

    fireDandelion(plant, target) {
      const scale = PLANT_SCALE.dandelion;
      const sx = plant.x + 8 * scale;
      const sy = plant.y - 88 * scale;
      const tx = clamp(target.x, Art.GRID.x + 20, Art.GRID.x + Art.GRID.width - 20);
      const ty = Art.cellGround(target.row) - 74;
      const dist = Math.hypot(tx - sx, ty - sy);
      plant.recoil = 1;
      this.projectiles.push({
        kind: "puff",
        row: target.row,
        startX: sx,
        startY: sy,
        x: sx,
        y: sy,
        targetX: tx,
        targetY: ty,
        groundY: Art.cellGround(target.row),
        t: 0,
        duration: clamp(0.54 + dist / 1300, 0.6, 1.05),
        damage: Data.plants.dandelion.attack.damage,
        splashRadius: Data.plants.dandelion.attack.splashRadius,
        dead: false
      });
      this.audio.play("puff");
      this.addParticles(sx, sy, 5, ["#fff4ce", "#e9dda9"], {
        speedMin: 12,
        speedMax: 38,
        up: 20,
        gravity: 15,
        sizeMin: 1.7,
        sizeMax: 3.8,
        lifeMin: 0.3,
        lifeMax: 0.7,
        shape: "spark"
      });
    }

    frontmostZombie() {
      let best = null;
      for (const z of this.zombies) {
        if (z.dead) continue;
        if (!best || z.x < best.x) best = z;
      }
      return best;
    }

    explodePopberry(plant) {
      const cfg = Data.plants.popberry.explode;
      this.damageArea(plant.x, plant.row, cfg.radius, cfg.damage, true);
      this.addExplosion(plant.x, plant.y - 35, 1.25, "#f3ae61", "#c95852");
      this.shake = Math.max(this.shake, 14);
      this.audio.play("explode");
      this.addText(plant.x, plant.y - 78, "噼啪！", "#ffd98a", 0.95, 17);
    }

    explodeThornspud(plant) {
      const cfg = Data.plants.thornspud.mine;
      this.damageArea(plant.x, plant.row, cfg.radius, cfg.damage, false);
      this.addExplosion(plant.x, plant.y - 16, 0.72, "#e4bf6b", "#9f7446");
      this.shake = Math.max(this.shake, 8);
      this.audio.play("explode");
    }

    damageArea(x, row, radius, damage, crossRows) {
      for (const z of this.zombies) {
        if (z.dead) continue;
        const rowDistance = Math.abs(z.row - row);
        const horizontal = Math.abs(z.x - x);
        if (crossRows ? rowDistance <= 1 && horizontal <= radius : rowDistance === 0 && horizontal <= radius) {
          this.hitZombie(z, damage, { big: true });
        }
      }
    }

    /* -------------------------------------------------------
       Projectiles
       ------------------------------------------------------- */

    updateProjectiles(dt) {
      for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
        const p = this.projectiles[i];
        if (p.dead) {
          this.projectiles.splice(i, 1);
          continue;
        }

        if (p.kind === "puff") {
          p.t += dt / p.duration;
          const t = clamp(p.t, 0, 1);
          p.x = lerp(p.startX, p.targetX, easeOutCubic(t));
          p.y = lerp(p.startY, p.targetY, t) - Math.sin(Math.PI * t) * 120;
          if (t >= 1) {
            p.x = p.targetX;
            p.y = p.targetY;
            this.impactPuff(p);
            this.projectiles.splice(i, 1);
          }
          continue;
        }

        p.x += p.speed * dt;
        if (p.x > Art.BOARD.width + 20) {
          this.projectiles.splice(i, 1);
          continue;
        }

        let hit = null;
        for (const z of this.zombies) {
          if (z.dead || z.row !== p.row) continue;
          const reach = z.boss ? 62 : 27;
          if (p.x >= z.x - reach && p.x <= z.x + reach) {
            if (!hit || z.x < hit.x) hit = z;
          }
        }
        if (hit) {
          this.hitZombie(hit, p.damage, {});
          if (p.splashDamage) {
            for (const splashTarget of this.zombies) {
              if (splashTarget === hit || splashTarget.dead) continue;
              if (Math.abs(splashTarget.row - hit.row) > 1) continue;
              if (Math.abs(splashTarget.x - p.x) > p.splashRadius) continue;
              this.hitZombie(splashTarget, p.splashDamage, {});
            }
            this.rings.push({
              x: p.x,
              y: p.y,
              r0: 10,
              r1: p.splashRadius,
              life: 0.38,
              maxLife: 0.38,
              color: "rgba(174, 239, 231, 0.68)",
              width: 1.8
            });
            this.addParticles(p.x, p.y, 7, ["#bff7ef", "#7ed7d8", "#fff2c1"], {
              speedMin: 20,
              speedMax: 85,
              up: 24,
              gravity: 70,
              sizeMin: 1.2,
              sizeMax: 3.6,
              lifeMin: 0.25,
              lifeMax: 0.6,
              shape: "dot"
            });
            this.audio.play("water");
          }
          if (p.slow) {
            hit.slowUntil = Math.max(hit.slowUntil, this.time + p.slowTime);
            this.audio.play("freeze");
            this.addParticles(p.x, p.y, 5, ["#c9f6f1", "#e9fffa", "#9ee2e4"], {
              speedMin: 10,
              speedMax: 46,
              up: 20,
              gravity: 30,
              sizeMin: 1.3,
              sizeMax: 3,
              lifeMin: 0.25,
              lifeMax: 0.55,
              shape: "spark"
            });
          }
          this.addParticles(p.x, p.y, 3, ["#d8ed9a", "#7ca953"], {
            speedMin: 8,
            speedMax: 36,
            up: 30,
            gravity: 80,
            sizeMin: 1.4,
            sizeMax: 3,
            lifeMin: 0.2,
            lifeMax: 0.4,
            shape: "dot"
          });
          this.audio.play("hit");
          this.projectiles.splice(i, 1);
        }
      }
    }

    impactPuff(p) {
      this.addExplosion(p.x, p.y, 0.6, "#f3e5ba", "#b6a46d");
      this.addParticles(p.x, p.groundY - 62, 12, ["#fff4d4", "#e7d9a9", "#f2c96e"], {
        speedMin: 24,
        speedMax: 105,
        up: 65,
        gravity: 130,
        sizeMin: 1.4,
        sizeMax: 3.6,
        lifeMin: 0.3,
        lifeMax: 0.7,
        shape: "dot"
      });
      for (const z of this.zombies) {
        if (z.dead || z.row !== p.row) continue;
        if (Math.abs(z.x - p.x) <= p.splashRadius) {
          this.hitZombie(z, p.damage, { big: false });
        }
      }
      this.audio.play("puff");
    }

    /* -------------------------------------------------------
       Zombies
       ------------------------------------------------------- */

    takeLane() {
      if (this.laneBag.length === 0) {
        this.laneBag = shuffle([0, 1, 2, 3, 4]);
      }
      return this.laneBag.pop();
    }

    spawnZombie(type, forcedRow) {
      const cfg = Data.enemies[type];
      if (!cfg) return;
      const row = forcedRow == null ? this.takeLane() : forcedRow;
      const boss = !!cfg.boss;
      const hpMul = this.level.hpMul;
      const zombie = {
        id: ++this.idCounter,
        type: type,
        row: row,
        x: Art.SPAWN_X + (boss ? 90 : rand(0, 20)),
        y: Art.cellGround(row),
        hp: cfg.hp * hpMul,
        maxHp: cfg.hp * hpMul,
        speed: cfg.speed * this.level.speedMul * rand(0.95, 1.05),
        bite: cfg.bite,
        biteInterval: cfg.biteInterval,
        scale: cfg.scale,
        artScale: cfg.artScale || 1,
        boss: boss,
        animPhase: Math.random() * TAU,
        flash: 0,
        slowUntil: 0,
        eating: null,
        attackTimer: 0.18,
        dead: false,
        roarTimer: 0,
        roared66: false,
        roared32: false
      };
      this.zombies.push(zombie);
      if (boss) {
        this.boss = zombie;
        this.bossSpawned = true;
        this.shake = Math.max(this.shake, 8);
        this.bossTrack.classList.remove("hidden");
        if (this.bossNameEl) this.bossNameEl.textContent = cfg.name;
        this.audio.play("boss");
        this.showStageToast(cfg.name + "踏入草坪");
        this.announce("首领，" + cfg.name + "出现。");
        this.showCoach(
          this.level.tips.boss || (cfg.name + "来了。把火力集中到它的行，割草机只能让它受一点伤。"),
          10000
        );
        this.rings.push({
          x: Art.SPAWN_X,
          y: zombie.y - 90,
          r0: 20,
          r1: 170,
          life: 0.8,
          maxLife: 0.8,
          color: "rgba(238, 192, 108, 0.5)",
          width: 3
        });
      }
      return zombie;
    }

    updateZombies(dt) {
      const now = this.time;
      for (const z of this.zombies) {
        if (z.dead) continue;
        z.flash = Math.max(0, z.flash - dt);
        z.roarTimer = Math.max(0, z.roarTimer - dt);

        if (z.eating && (z.eating.dead || z.eating.hp <= 0 || z.eating.row !== z.row)) {
          z.eating = null;
        }

        if (!z.eating) {
          const plant = this.findBlockingPlant(z);
          if (plant) {
            z.eating = plant;
            z.attackTimer = Math.min(z.attackTimer, 0.18);
          }
        }

        if (z.eating) {
          z.attackTimer -= dt;
          if (z.attackTimer <= 0) {
            z.attackTimer += z.biteInterval;
            this.bitePlant(z);
          }
        } else {
          let slowFactor = 1;
          if (now < z.slowUntil) {
            slowFactor = z.boss ? 0.8 : 0.46;
          }
          z.x -= z.speed * slowFactor * dt;
        }

        if (z.x <= Art.MOWER_X + 35 && !this.hasActiveMower(z.row)) {
          const mower = this.mowers.find((m) => m.row === z.row && !m.triggered);
          if (mower) this.activateMower(mower);
        }

        if (z.x <= Art.HOUSE_X) {
          const livingMower = this.mowers.find((m) => m.row === z.row && m.active);
          if (!livingMower) {
            this.beginFinish(false, z);
            return;
          }
        }
      }
      this.zombies = this.zombies.filter((z) => !z.dead);
    }

    findBlockingPlant(zombie) {
      const reach = zombie.boss ? 104 : 68;
      let best = null;
      for (const plant of this.plants) {
        if (plant.dead || plant.row !== zombie.row) continue;
        const dx = zombie.x - plant.x;
        if (dx >= -10 && dx <= reach) {
          if (!best || plant.x > best.x) best = plant;
        }
      }
      return best;
    }

    bitePlant(zombie) {
      const plant = zombie.eating;
      if (!plant || plant.dead) return;
      plant.hp -= zombie.bite;
      plant.flash = 0.16;
      zombie.attackTimer += zombie.biteInterval;
      this.addParticles(plant.x + 18, plant.y - 34, 4, ["#d2df9c", "#8faa66", "#e4d49d"], {
        speedMin: 10,
        speedMax: 50,
        up: 28,
        gravity: 120,
        sizeMin: 1.2,
        sizeMax: 3,
        lifeMin: 0.2,
        lifeMax: 0.45,
        shape: "leaf"
      });
      this.audio.play("bite");
      if (plant.hp <= 0) {
        if (plant.type === "popberry") {
          this.explodePopberry(plant);
        }
        this.removePlant(plant, false);
      }
    }

    hitZombie(zombie, damage, opts) {
      if (!zombie || zombie.dead) return;
      zombie.hp -= damage;
      zombie.flash = 0.09;
      if (opts && opts.big) {
        this.addText(zombie.x, zombie.y - (zombie.boss ? 170 : 92), String(Math.round(damage)), "#ffe6a1", 0.6, 13);
      }
      if (zombie.boss && !zombie.dead) {
        const ratio = zombie.hp / zombie.maxHp;
        if (ratio <= 0.66 && !zombie.roared66) {
          zombie.roared66 = true;
          this.bossRoar(zombie);
        } else if (ratio <= 0.32 && !zombie.roared32) {
          zombie.roared32 = true;
          this.bossRoar(zombie);
        }
      }
      if (zombie.hp <= 0) this.killZombie(zombie);
    }

    bossRoar(boss) {
      if (!boss || boss.dead) return;
      boss.roarTimer = 1.6;
      this.shake = Math.max(this.shake, 17);
      this.audio.play("boss");
      this.rings.push({
        x: boss.x,
        y: boss.y - 100,
        r0: 30,
        r1: 220,
        life: 0.7,
        maxLife: 0.7,
        color: "rgba(238, 194, 112, 0.58)",
        width: 3
      });
      this.addParticles(boss.x, boss.y - 120, 22, ["#efc46f", "#9f825b", "#6e626c"], {
        speedMin: 40,
        speedMax: 170,
        up: 100,
        gravity: 150,
        sizeMin: 1.8,
        sizeMax: 5.5,
        lifeMin: 0.4,
        lifeMax: 1,
        shape: "dot"
      });
      const roarCfg = Data.enemies[boss.type] || {};
      this.showStageToast((roarCfg.name || "首领") + "低吼，更多的夜霉翻过篱笆！");
      for (let i = 0; i < 2; i += 1) {
        const rows = [0, 1, 2, 3, 4].filter((row) => row !== boss.row);
        const row = pick(rows);
        const type = i % 2 === 0 ? "mutterling" : "zippy";
        const spawned = this.spawnZombie(type, row);
        if (spawned) spawned.x = Art.SPAWN_X + rand(0, 40);
      }
      this.announce("首领发出咆哮，召唤了新的夜霉。");
    }

    killZombie(zombie) {
      if (!zombie || zombie.dead) return;
      zombie.dead = true;
      this.kills += 1;
      if (zombie.eating) zombie.eating = null;
      if (zombie.boss) {
        const bossCfg = Data.enemies[zombie.type] || {};
        this.addExplosion(zombie.x, zombie.y - 100, 1.9, "#e7c478", "#756176");
        this.shake = Math.max(this.shake, 24);
        this.audio.play("explode");
        this.addText(zombie.x, zombie.y - 190, zombie.type === "bellwarden" ? "破晓" : "月蚀退去", "#ffecc0", 1.8, 22);
        this.showStageToast((bossCfg.name || "首领") + "倒下了，最后的光留了下来。");
        this.announce((bossCfg.name || "首领") + "被击败。");
      } else {
        this.addParticles(zombie.x, zombie.y - 42, 13, ["#708167", "#9a9b7d", "#45584d", "#d4c395"], {
          speedMin: 25,
          speedMax: 120,
          up: 80,
          gravity: 160,
          sizeMin: 1.7,
          sizeMax: 5,
          lifeMin: 0.35,
          lifeMax: 0.8,
          shape: "dot"
        });
        this.rings.push({
          x: zombie.x,
          y: zombie.y - 40,
          r0: 8,
          r1: 40,
          life: 0.33,
          maxLife: 0.33,
          color: "rgba(222, 213, 178, 0.35)",
          width: 1.2
        });
      }
    }

    /* -------------------------------------------------------
       Mowers
       ------------------------------------------------------- */

    hasActiveMower(row) {
      return this.mowers.some((m) => m.row === row && m.active);
    }

    activateMower(mower) {
      if (!mower || mower.triggered) return;
      mower.triggered = true;
      mower.active = true;
      mower.bossHit = false;
      this.audio.play("mower");
      this.shake = Math.max(this.shake, 6);
      this.showStageToast("割草机冲出工具棚！");
      this.addParticles(mower.x, mower.y - 10, 15, ["#d4c9ac", "#a89063", "#e3ddc8"], {
        speedMin: 30,
        speedMax: 120,
        up: 55,
        gravity: 130,
        sizeMin: 1.5,
        sizeMax: 4.5,
        lifeMin: 0.3,
        lifeMax: 0.7,
        shape: "dot"
      });
      this.updateHud(true);
    }

    updateMowers(dt) {
      for (const mower of this.mowers) {
        if (!mower.active) continue;
        mower.x += 1550 * dt;
        mower.dustTimer -= dt;
        if (mower.dustTimer <= 0) {
          mower.dustTimer = 0.035;
          this.addParticles(mower.x - 20, mower.y - 4, 1, ["#d8cbb0", "#a89169"], {
            speedMin: 12,
            speedMax: 60,
            up: 20,
            gravity: -15,
            sizeMin: 1.2,
            sizeMax: 3.2,
            lifeMin: 0.2,
            lifeMax: 0.5,
            shape: "dot"
          });
        }
        for (const z of this.zombies) {
          if (z.dead || z.row !== mower.row || z.x > mower.x + 35) continue;
          if (z.boss) {
            if (!mower.bossHit) {
              mower.bossHit = true;
              this.hitZombie(z, 2800, { big: true });
              this.addExplosion(z.x, z.y - 55, 0.7, "#e9ceae", "#7a6e61");
              this.shake = Math.max(this.shake, 14);
              this.showStageToast("割草机只让首领退了一小步！");
            }
          } else {
            this.killZombie(z);
          }
        }
        if (mower.x > Art.BOARD.width + 80) {
          mower.active = false;
        }
      }
    }

    /* -------------------------------------------------------
       Waves
       ------------------------------------------------------- */

    updateWaves(dt) {
      if (this.waveState === "prep" || this.waveState === "between") {
        this.waveTimer -= dt;
        if (this.waveTimer <= 0) {
          this.beginWave(this.waveIndex + 1);
        }
        return;
      }

      if (this.waveState === "spawning") {
        this.waveSpawnElapsed += dt;
        while (this.spawnQueue.length && this.spawnQueue[0].t <= this.waveSpawnElapsed) {
          const entry = this.spawnQueue.shift();
          this.spawnZombie(entry.type, entry.row);
        }
        if (this.spawnQueue.length === 0 && this.zombies.filter((z) => !z.dead).length === 0) {
          this.completeWave();
        }
      }
    }

    beginWave(index) {
      if (index < 0 || index >= this.level.waves.length) return;
      const wave = this.level.waves[index];
      this.waveIndex = index;
      this.waveState = "spawning";
      this.waveTimer = 0;
      this.waveSpawnElapsed = 0;
      this.laneBag = [];
      this.spawnQueue = this.buildSpawnQueue(wave);
      this.showWaveBanner(wave);
      this.audio.play("wave");
      if (this.level.id === 1 && index === 0 && !this.firstWaveCoached) {
        this.firstWaveCoached = true;
        this.showCoach(this.level.tips.firstWave, 8000);
      }
      this.announce(wave.title + "，第 " + (index + 1) + " 波开始。");
      this.updateHud(true);
    }

    buildSpawnQueue(wave) {
      const queue = [];
      wave.groups.forEach((group) => {
        const count = group.count || 1;
        for (let i = 0; i < count; i += 1) {
          queue.push({
            t: (group.start || 0) + i * (group.gap || 2),
            type: group.type,
            row: (Data.enemies[group.type] && Data.enemies[group.type].boss) ? (group.row == null ? 2 : group.row) : group.row
          });
        }
      });
      queue.sort((a, b) => a.t - b.t);
      return queue;
    }

    completeWave() {
      if (this.waveState === "between" || this.waveState === "finished") return;
      const alive = this.zombies.some((z) => !z.dead);
      if (alive) return;
      if (this.waveIndex >= this.level.waves.length - 1) {
        this.waveState = "finished";
        this.beginFinish(true, null);
        return;
      }
      this.waveState = "between";
      this.waveTimer = this.level.betweenWaves;
      this.showStageToast("本波已清 · 下一波还有 " + this.level.betweenWaves + " 秒");
      this.updateHud(true);
    }

    showWaveBanner(wave) {
      if (this.waveBannerTimer) global.clearTimeout(this.waveBannerTimer);
      this.waveBannerKicker.textContent = wave.kicker || "WAVE";
      this.waveBannerTitle.textContent = wave.title || "它们来了";
      this.waveBanner.classList.remove("show");
      void this.waveBanner.offsetWidth;
      this.waveBanner.classList.add("show");
      this.waveBannerTimer = global.setTimeout(() => {
        this.waveBanner.classList.remove("show");
      }, wave.boss ? 3400 : 2600);
    }

    /* -------------------------------------------------------
       Outcome & results
       ------------------------------------------------------- */

    beginFinish(won, sourceZombie) {
      if (this.phase !== "playing") return;
      this.phase = "ending";
      this.pendingWin = !!won;
      this.endDelay = won ? 1.35 : 0.8;
      this.cancelSelection(false);
      this.hideCoach();
      this.hoverCell = null;
      if (won) {
        const mowersLeft = this.mowers.filter((m) => !m.triggered).length;
        const stars = Sunbud.Save.starsForMowers(mowersLeft);
        const result = {
          won: true,
          stars: stars,
          mowers: mowersLeft,
          kills: this.kills,
          seconds: this.time,
          levelId: this.levelId
        };
        this.pendingResult = result;
        this.audio.play("win");
        this.shake = Math.max(this.shake, 5);
        this.addParticles(Art.BOARD.width / 2, 300, 30, ["#ffe29a", "#d8eab0", "#f2c373"], {
          speedMin: 60,
          speedMax: 240,
          up: 180,
          gravity: 150,
          sizeMin: 2,
          sizeMax: 6,
          lifeMin: 0.7,
          lifeMax: 1.6,
          shape: "spark"
        });
        this.announce("小院守住了。本关完成。");
        this.callbacks.onLevelComplete(this.level, result);
        this.updateHud(true);
      } else {
        this.audio.play("lose");
        this.shake = Math.max(this.shake, 10);
        this.showStageToast("夜霉越过了最后一道篱笆");
        this.announce("夜霉越过了防线。本关失败。");
        if (sourceZombie) {
          sourceZombie.eating = null;
        }
      }
    }

    updateEnding(dt) {
      this.animTime += dt;
      this.updateParticles(dt);
      this.updateRings(dt);
      this.updateFloatTexts(dt);
      this.updateBeams(dt);
      this.shake = Math.max(0, this.shake - dt * 36);
      this.endDelay -= dt;
      if (this.endDelay <= 0) {
        this.showResult();
      }
    }

    showResult() {
      if (this.resultShown) return;
      this.resultShown = true;
      const won = this.pendingWin;
      this.phase = won ? "won" : "lost";
      this.resultOverlay.classList.remove("hidden");
      this.resultOverlay.querySelector(".result-card").classList.remove("result-lost");
      const stars = won && this.pendingResult ? this.pendingResult.stars : 0;
      const mowersLeft = this.mowers.filter((m) => !m.triggered).length;
      this.resultKicker.textContent = won ? "GARDEN KEPT" : "A QUIET SETBACK";
      this.resultTitle.textContent = won ? "小院守住了" : "夜霉得逞了";
      this.resultSub.textContent = won
        ? this.level.completion + (this.levelId < Data.levels.length ? " 新的花园已经亮起。" : " 最后一缕太阳留在了院子里。")
        : "没有关系，阳光明天还会升起来。重新安排一下防线吧。";
      this.resultStars.innerHTML = "";
      for (let i = 0; i < 3; i += 1) {
        const star = document.createElement("span");
        star.className = "star" + (i < stars ? " lit" : "");
        star.textContent = "★";
        this.resultStars.appendChild(star);
      }
      this.resultTime.textContent = formatTime(this.time);
      this.resultMowers.textContent = String(mowersLeft);
      this.resultKills.textContent = String(this.kills);
      Art.drawResultArt(this.resultArt, this.level, won);

      if (won) {
        this.resultPrimary.textContent = this.levelId < Data.levels.length ? "前往下一关" : "回到花园";
        this.resultPrimary.className = "btn btn-primary";
        this.resultSecondary.textContent = "再守一次";
        this.resultSecondary.className = "btn btn-ghost";
        this.resultSecondary.classList.remove("hidden");
        this.resultMenu.textContent = "返回关卡选择";
        this.resultMenu.classList.remove("hidden");
        this.resultActions = {
          primary: this.levelId < Data.levels.length ? "next" : "exit",
          secondary: "retry",
          tertiary: "exit"
        };
      } else {
        this.resultPrimary.textContent = "再试一次";
        this.resultPrimary.className = "btn btn-primary";
        this.resultSecondary.textContent = "返回花园";
        this.resultSecondary.className = "btn btn-ghost";
        this.resultSecondary.classList.remove("hidden");
        this.resultMenu.classList.add("hidden");
        this.resultActions = { primary: "retry", secondary: "exit", tertiary: "exit" };
      }
      this.resultStars.classList.remove("play");
      void this.resultStars.offsetWidth;
      this.resultStars.classList.add("play");
      global.setTimeout(() => {
        this.resultPrimary.focus({ preventScroll: true });
      }, 50);
      this.updateHud(true);
    }

    runResultAction(key) {
      if (!this.resultActions) return;
      const action = this.resultActions[key];
      if (!action) return;
      if (action === "retry") {
        this.start(this.levelId);
      } else if (action === "next") {
        this.start(Math.min(Data.levels.length, this.levelId + 1));
      } else if (action === "exit") {
        this.exitToMenu();
      }
    }

    /* -------------------------------------------------------
       Pause & keyboard
       ------------------------------------------------------- */

    pauseGame() {
      if (!this.active || this.phase !== "playing") return;
      this.phase = "paused";
      this.pauseOverlay.classList.remove("hidden");
      this.hideCoach();
      this.updateHud(true);
      // Snapshot on pause too. If the browser closes while paused, the run is safe.
      this.autoSaveRun();
      this.audio.play("ui");
      this.announce("游戏已暂停。");
      global.setTimeout(() => {
        if (this.phase === "paused") this.resumeBtn.focus({ preventScroll: true });
      }, 40);
    }

    resumeGame() {
      if (this.phase !== "paused") return;
      this.pauseOverlay.classList.add("hidden");
      this.phase = "playing";
      if (Sunbud.Save && Sunbud.Save.clearRun) Sunbud.Save.clearRun(this.levelId);
      this.lastFrameAt = 0;
      this.audio.play("ui");
      this.canvas.focus({ preventScroll: true });
      this.announce("继续守护。");
    }

    isAppModalOpen() {
      return !!document.querySelector(".modal-layer:not(.hidden)");
    }

    handleKeydown(event) {
      if (!this.active) return;
      if (this.isAppModalOpen()) return;
      const tag = event.target && event.target.tagName ? event.target.tagName : "";
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (event.key === "Escape") {
        if (!this.introOverlay.classList.contains("hidden")) {
          this.exitToMenu();
          return;
        }
        if (!this.pauseOverlay.classList.contains("hidden")) {
          this.resumeGame();
          return;
        }
        if (!this.resultOverlay.classList.contains("hidden")) {
          return;
        }
        if (this.phase === "playing") {
          if (this.selectedPlantId || this.shovelActive) {
            this.cancelSelection(true);
          } else {
            this.pauseGame();
          }
        }
        return;
      }

      if (isTyping) return;
      if (!this.introOverlay.classList.contains("hidden") || !this.pauseOverlay.classList.contains("hidden") || !this.resultOverlay.classList.contains("hidden")) {
        return;
      }
      if (this.phase !== "playing") return;

      if (event.code === "Space") {
        if (tag === "BUTTON") return;
        event.preventDefault();
        this.pauseGame();
        return;
      }

      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        this.toggleShovel();
        return;
      }

      if (/^[1-8]$/.test(event.key)) {
        const type = this.level.loadout[Number(event.key) - 1];
        if (type) {
          event.preventDefault();
          this.selectPlant(type);
        }
      }
    }

    /* -------------------------------------------------------
       Coaching & messages
       ------------------------------------------------------- */

    showCoach(text, duration) {
      if (!text) return;
      this.coachText.textContent = text;
      this.coach.classList.remove("show");
      void this.coach.offsetWidth;
      this.coach.classList.add("show");
      if (this.coachTimer) global.clearTimeout(this.coachTimer);
      this.coachTimer = global.setTimeout(() => {
        this.coach.classList.remove("show");
      }, duration || 7000);
    }

    hideCoach() {
      if (this.coachTimer) global.clearTimeout(this.coachTimer);
      this.coachTimer = null;
      this.coach.classList.remove("show");
    }

    showStageToast(text, duration) {
      if (!text) return;
      this.stageToast.textContent = text;
      this.stageToast.classList.add("show");
      if (this.stageToastTimer) global.clearTimeout(this.stageToastTimer);
      this.stageToastTimer = global.setTimeout(() => {
        this.stageToast.classList.remove("show");
      }, duration || 2600);
    }

    announce(message) {
      if (!this.ariaStatus) return;
      this.ariaStatus.textContent = "";
      global.setTimeout(() => {
        this.ariaStatus.textContent = message;
      }, 30);
    }

    /* -------------------------------------------------------
       Effects
       ------------------------------------------------------- */

    addParticles(x, y, count, colors, options) {
      if (this.reduceMotion) count = Math.min(count, 2);
      const o = options || {};
      for (let i = 0; i < count; i += 1) {
        const angle = o.direction != null ? o.direction + rand(-0.9, 0.9) : rand(0, TAU);
        const speed = rand(o.speedMin == null ? 20 : o.speedMin, o.speedMax == null ? 80 : o.speedMax);
        const life = rand(o.lifeMin == null ? 0.3 : o.lifeMin, o.lifeMax == null ? 0.7 : o.lifeMax);
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (o.up == null ? 20 : o.up),
          gravity: o.gravity == null ? 100 : o.gravity,
          size: rand(o.sizeMin == null ? 1.5 : o.sizeMin, o.sizeMax == null ? 3.5 : o.sizeMax),
          color: pick(colors),
          life: life,
          maxLife: life,
          shape: o.shape || "dot",
          rotation: rand(0, TAU),
          spin: rand(-6, 6)
        });
      }
    }

    addText(x, y, text, color, life, size) {
      this.floatTexts.push({
        x: x,
        y: y,
        text: text,
        color: color || "#ffe6a1",
        life: life || 0.9,
        maxLife: life || 0.9,
        size: size || 14
      });
    }

    addExplosion(x, y, scale, outerColor, innerColor) {
      this.rings.push({
        x: x,
        y: y,
        r0: 16 * scale,
        r1: 130 * scale,
        life: 0.6,
        maxLife: 0.6,
        color: outerColor ? "rgba(246, 210, 142, 0.7)" : "rgba(255,255,255,0.5)",
        width: 3,
        fill: outerColor
      });
      this.rings.push({
        x: x,
        y: y,
        r0: 4,
        r1: 66 * scale,
        life: 0.45,
        maxLife: 0.45,
        color: "rgba(255, 247, 208, 0.8)",
        width: 1.6,
        fill: innerColor
      });
      this.addParticles(x, y, Math.round(16 * scale), [
        outerColor || "#f5c265",
        innerColor || "#b95048",
        "#f6e8be",
        "#6e5e4b"
      ], {
        speedMin: 40,
        speedMax: 200,
        up: 65,
        gravity: 160,
        sizeMin: 1.8,
        sizeMax: 6,
        lifeMin: 0.35,
        lifeMax: 0.9,
        shape: "dot"
      });
    }

    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i -= 1) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.spin * dt;
      }
    }

    updateRings(dt) {
      for (let i = this.rings.length - 1; i >= 0; i -= 1) {
        const ring = this.rings[i];
        ring.life -= dt;
        if (ring.life <= 0) this.rings.splice(i, 1);
      }
    }

    updateFloatTexts(dt) {
      for (let i = this.floatTexts.length - 1; i >= 0; i -= 1) {
        const item = this.floatTexts[i];
        item.life -= dt;
        item.y -= dt * 32;
        if (item.life <= 0) this.floatTexts.splice(i, 1);
      }
    }

    updateParticlesAndRings(dt) {
      this.updateParticles(dt);
      this.updateRings(dt);
      this.updateFloatTexts(dt);
      this.updateBeams(dt);
    }

    addBeam(x1, y1, x2, y2, color, width) {
      this.beams.push({
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        color: color || "#fff4c4",
        width: width || 2.4,
        life: 0.24,
        maxLife: 0.24
      });
    }

    updateBeams(dt) {
      for (let i = this.beams.length - 1; i >= 0; i -= 1) {
        this.beams[i].life -= dt;
        if (this.beams[i].life <= 0) this.beams.splice(i, 1);
      }
    }

    /* -------------------------------------------------------
       Simulation
       ------------------------------------------------------- */

    update(dt) {
      this.time += dt;
      this.gameClock += dt;
      this.shake = Math.max(0, this.shake - dt * 38);

      // Sun
      this.updateSuns(dt);
      this.skySunTimer -= dt;
      if (this.skySunTimer <= 0) {
        this.spawnSkySun();
        this.skySunTimer = rand(this.level.skySunInterval[0], this.level.skySunInterval[1]);
      }

      this.updateWaves(dt);
      if (this.phase !== "playing") return;

      this.updatePlants(dt);
      this.updateProjectiles(dt);
      this.updateZombies(dt);
      if (this.phase !== "playing") return;

      this.updateMowers(dt);
      this.zombies = this.zombies.filter((z) => !z.dead);
      this.plants = this.plants.filter((p) => !p.dead);
      this.updateParticlesAndRings(dt);

      if (this.waveState === "spawning" && this.spawnQueue.length === 0) {
        const alive = this.zombies.length > 0;
        if (alive) {
          this.waveState = "fighting";
        } else if (this.waveIndex >= 0) {
          this.completeWave();
        }
      } else if (this.waveState === "fighting" && this.zombies.length === 0) {
        this.completeWave();
      }

      this.updateHud(false);
      if (this.time - this.lastHudUpdate > 0.32) {
        this.updateHud(true);
      }
    }

    /* -------------------------------------------------------
       Rendering
       ------------------------------------------------------- */

    loop(timestamp) {
      if (!this.active) {
        this.raf = null;
        return;
      }
      if (!this.lastFrameAt) this.lastFrameAt = timestamp;
      const dt = clamp((timestamp - this.lastFrameAt) / 1000, 0, 0.05);
      this.lastFrameAt = timestamp;
      this.animTime += dt;

      if (this.phase === "playing") {
        this.update(dt);
      } else if (this.phase === "ending") {
        this.updateEnding(dt);
      } else if (this.phase === "intro" || this.phase === "paused") {
        this.shake = Math.max(0, this.shake - dt * 20);
      }

      this.render();
      this.raf = global.requestAnimationFrame(this.boundLoop);
    }

    render() {
      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, Art.BOARD.width, Art.BOARD.height);
      if (!this.level) return;

      let sx = 0;
      let sy = 0;
      if (!this.reduceMotion && this.shake > 0.1) {
        sx = rand(-this.shake, this.shake) * 0.65;
        sy = rand(-this.shake, this.shake) * 0.45;
      }
      ctx.save();
      ctx.translate(sx, sy);

      Art.drawBackground(ctx, this.level.theme);
      Art.drawAmbient(ctx, this.level.theme, this.animTime);

      const boss = this.zombies.find((z) => z.boss && !z.dead);
      if (boss) this.drawBossLane(ctx, boss);
      this.drawMowers(ctx);
      this.drawPlants(ctx);
      this.drawZombies(ctx);
      this.drawHover(ctx);
      this.drawProjectiles(ctx);
      this.drawBeams(ctx);
      this.drawEffects(ctx);
      this.drawSuns(ctx);

      ctx.restore();
    }

    drawBossLane(ctx, boss) {
      const y = Art.GRID.y + boss.row * Art.GRID.ch;
      ctx.save();
      const pulse = 0.55 + Math.sin(this.animTime * 2.4) * 0.2;
      const grad = ctx.createLinearGradient(Art.GRID.x, 0, Art.GRID.x + Art.GRID.width, 0);
      grad.addColorStop(0, "rgba(226, 174, 99, 0)");
      grad.addColorStop(0.24, "rgba(226, 174, 99, " + (0.09 * pulse).toFixed(3) + ")");
      grad.addColorStop(1, "rgba(157, 75, 78, " + (0.18 * pulse).toFixed(3) + ")");
      ctx.fillStyle = grad;
      ctx.fillRect(Art.GRID.x, y + 8, Art.GRID.width, Art.GRID.ch - 16);
      ctx.strokeStyle = "rgba(244, 208, 138, " + (0.26 * pulse).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 9]);
      ctx.strokeRect(Art.GRID.x + 4, y + 12, Art.GRID.width - 8, Art.GRID.ch - 24);
      ctx.restore();
    }

    drawHover(ctx) {
      if (!this.active || this.phase !== "playing" || !this.hoverCell) return;
      if (!this.selectedPlantId && !this.shovelActive) return;
      const cell = this.hoverCell;
      const existing = this.plantAt(cell.row, cell.col);
      const cfg = this.selectedPlantId ? Data.plants[this.selectedPlantId] : null;
      const ready = cfg ? (this.time >= (this.cooldownUntil[this.selectedPlantId] || 0) && this.sun >= cfg.cost) : true;
      const valid = this.shovelActive ? !!existing : (!existing && ready);
      Art.drawCellHighlight(ctx, cell.row, cell.col, valid);

      if (this.selectedPlantId && !existing) {
        const center = Art.cellCenter(cell.row, cell.col);
        ctx.save();
        ctx.globalAlpha = ready ? 0.7 : 0.38;
        Art.drawPlant(
          ctx,
          this.selectedPlantId,
          center.x,
          Art.cellGround(cell.row),
          (PLANT_SCALE[this.selectedPlantId] || 1) * 0.9,
          this.animTime,
          { phase: 0, glow: false, hpRatio: 1 }
        );
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = valid ? "rgba(255, 250, 204, 0.8)" : "rgba(255, 174, 150, 0.7)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(center.x, center.y + 24, 15, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }

    drawPlants(ctx) {
      const list = this.plants.slice().sort((a, b) => a.row - b.row || a.x - b.x);
      for (const p of list) {
        if (p.dead) continue;
        const age = this.time - p.bornAt;
        let pop = 1;
        if (age < 0.3) {
          pop = clamp(age / 0.3, 0, 1.08);
          if (age < 0.22) pop = 0.7 + easeOutBack(clamp(age / 0.22, 0, 1)) * 0.3;
        }
        const cfg = Data.plants[p.type];
        const opts = {
          phase: p.animPhase,
          hpRatio: clamp(p.hp / p.maxHp, 0, 1),
          recoil: p.recoil,
          glow: !!p.glow,
          armed: p.armed,
          arming: p.type === "thornspud" && !p.armed,
          fuse: p.type === "popberry" ? p.fuse : 0,
          fire: p.recoil > 0.35
        };
        Art.drawPlant(ctx, p.type, p.x, p.y, (PLANT_SCALE[p.type] || 1) * pop, this.animTime, opts);
        if (p.flash > 0) {
          ctx.save();
          ctx.globalAlpha = clamp(p.flash / 0.16, 0, 1) * 0.2;
          fillEllipseLocal(ctx, p.x, p.y - 44, 33, 42, "#fff6dd");
          ctx.restore();
        }
        // armed mine prompt
        if (p.type === "thornspud" && p.armed) {
          ctx.save();
          ctx.globalAlpha = 0.55 + Math.sin(this.animTime * 4 + p.animPhase) * 0.25;
          ctx.fillStyle = "#f4d683";
          ctx.beginPath();
          ctx.arc(p.x + 20, p.y - 46, 2.2, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    drawZombies(ctx) {
      const list = this.zombies.slice().sort((a, b) => a.row - b.row || a.x - b.x);
      for (const z of list) {
        if (z.dead) continue;
        const baseScale = z.boss ? (z.artScale || 1.03) : (z.scale || 1);
        const cfg = Data.enemies[z.type];
        const armored = cfg.armor === "crate"
          ? z.hp / z.maxHp > 0.48
          : cfg.armor === "can"
            ? z.hp / z.maxHp > 0.3
            : true;
        Art.drawEnemy(ctx, z.type, z.x, z.y, baseScale, this.animTime, {
          phase: z.animPhase,
          eating: !!z.eating,
          frozen: this.time < z.slowUntil,
          flash: z.flash > 0,
          armored: armored,
          hpRatio: z.hp / z.maxHp,
          roar: z.roarTimer > 0
        });
        if (this.time < z.slowUntil) {
          ctx.save();
          ctx.globalAlpha = 0.25 + Math.sin(this.animTime * 3 + z.animPhase) * 0.08;
          ctx.strokeStyle = "#c9eff0";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(z.x, z.y - 2, z.boss ? 70 : 27, 6, 0, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    drawProjectiles(ctx) {
      for (const p of this.projectiles) {
        if (p.kind === "puff") {
          ctx.save();
          const t = clamp(p.t, 0, 1);
          ctx.globalAlpha = 0.2 + t * 0.12;
          ctx.strokeStyle = "rgba(255, 240, 185, 0.75)";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.moveTo(p.startX, p.startY);
          ctx.quadraticCurveTo((p.startX + p.targetX) / 2, Math.min(p.startY, p.targetY) - 120, p.x, p.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = "#f0dda8";
          ctx.beginPath();
          ctx.ellipse(p.targetX, p.groundY + 1, 28 * (0.5 + t * 0.5), 7 * (0.5 + t * 0.5), 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        Art.drawProjectile(ctx, p, this.animTime);
      }
    }

    drawMowers(ctx) {
      for (const mower of this.mowers) {
        if (!mower.triggered || mower.active) {
          Art.drawMower(ctx, mower, this.animTime);
        }
      }
    }

    drawSuns(ctx) {
      for (const sun of this.suns) {
        if (!sun.landed) {
          ctx.save();
          ctx.globalAlpha = 0.35;
          ctx.strokeStyle = "rgba(255, 225, 178, 0.82)";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.ellipse(sun.targetX, sun.targetY + 28, 34, 10, 0, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }
        const oldLife = sun.life;
        sun.life = sun.landed ? clamp(sun.ttl / 2.3, 0, 1) : 1;
        Art.drawSunToken(ctx, sun, this.animTime);
        sun.life = oldLife;
      }
    }

    drawBeams(ctx) {
      for (const beam of this.beams) {
        const t = clamp(beam.life / beam.maxLife, 0, 1);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = t * 0.55;
        ctx.strokeStyle = "rgba(172, 232, 220, 0.6)";
        ctx.lineWidth = beam.width * 3.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(beam.x1, beam.y1);
        ctx.lineTo(beam.x2, beam.y2);
        ctx.stroke();
        ctx.globalAlpha = t;
        ctx.strokeStyle = beam.color;
        ctx.lineWidth = beam.width;
        ctx.stroke();
        ctx.globalAlpha = t * 0.85;
        ctx.strokeStyle = "rgba(255, 255, 244, 0.95)";
        ctx.lineWidth = Math.max(1, beam.width * 0.38);
        ctx.stroke();
        ctx.restore();
      }
    }

    drawEffects(ctx) {
      // Expanding rings
      for (const ring of this.rings) {
        const t = 1 - clamp(ring.life / ring.maxLife, 0, 1);
        const r = lerp(ring.r0, ring.r1, easeOutCubic(t));
        ctx.save();
        ctx.globalAlpha = (1 - t) * 0.8;
        if (ring.fill) {
          ctx.fillStyle = "rgba(247, 208, 135, 0.1)";
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, r, 0, TAU);
          ctx.fill();
        }
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.width * (1 - t * 0.4);
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, r, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }

      // Particles
      for (const p of this.particles) {
        const alpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === "leaf") {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.8, p.size * 0.72, 0, 0, TAU);
          ctx.fill();
        } else if (p.shape === "spark") {
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.7);
          ctx.quadraticCurveTo(p.size * 0.35, -p.size * 0.35, p.size * 1.7, 0);
          ctx.quadraticCurveTo(p.size * 0.35, p.size * 0.35, 0, p.size * 1.7);
          ctx.quadraticCurveTo(-p.size * 0.35, p.size * 0.35, -p.size * 1.7, 0);
          ctx.quadraticCurveTo(-p.size * 0.35, -p.size * 0.35, 0, -p.size * 1.7);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }

      // Floating copy
      for (const item of this.floatTexts) {
        const alpha = clamp(item.life / item.maxLife, 0, 1);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = "800 " + item.size + "px " + '"Avenir Next", "PingFang SC", sans-serif';
        ctx.textAlign = "center";
        ctx.fillStyle = item.color;
        ctx.shadowColor = "rgba(35, 50, 28, 0.5)";
        ctx.shadowBlur = 5;
        ctx.fillText(item.text, item.x, item.y);
        ctx.restore();
      }
    }
  }

  // Local canvas helper for plant hit flash (avoids touching Art's namespace).
  function fillEllipseLocal(ctx, x, y, rx, ry, fill) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  Sunbud.Game = Game;
})(window);
