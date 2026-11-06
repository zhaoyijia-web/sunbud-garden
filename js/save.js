/* ============================================================
   光芽小院 · 本地存档
   只使用 localStorage；不可用时自动退回内存存档。
   ============================================================ */
(function (global) {
  "use strict";

  const Sunbud = (global.Sunbud = global.Sunbud || {});
  const KEY = "sunbud.garden.save.v1";
  const VERSION = 3;
  const MAX_LEVEL = 6;
  const RUN_KEY_PREFIX = "sunbud.garden.run.v1.";
  const RUN_VERSION = 1;

  let memoryRuns = Object.create(null);

  function makeDefault() {
    return {
      version: VERSION,
      unlocked: 1,
      stars: {},
      completed: {},
      best: {},
      lastLevel: 1,
      plays: 0,
      wins: 0,
      // Background music is intentionally opt-in so the garden opens quietly.
      settings: { music: false, sfx: true },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  let memoryOnly = false;
  let memoryData = null;

  function clampInt(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(n)));
  }

  function normalize(raw) {
    const base = makeDefault();
    if (!raw || typeof raw !== "object") return base;

    base.unlocked = clampInt(raw.unlocked, 1, MAX_LEVEL, 1);
    base.lastLevel = clampInt(raw.lastLevel, 1, MAX_LEVEL, 1);
    base.plays = clampInt(raw.plays, 0, 999999, 0);
    base.wins = clampInt(raw.wins, 0, 999999, 0);
    base.createdAt = Number.isFinite(Number(raw.createdAt)) ? Number(raw.createdAt) : base.createdAt;
    base.updatedAt = Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : Date.now();

    const rawVersion = Number(raw.version) || 1;
    if (raw.settings && typeof raw.settings === "object") {
      // Background music was on by default in old builds. Keep it off when
      // migrating to v3; players can still opt back in from Settings.
      base.settings.music = rawVersion >= 3 ? raw.settings.music === true : false;
      base.settings.sfx = raw.settings.sfx !== false;
    }

    if (raw.stars && typeof raw.stars === "object") {
      for (let id = 1; id <= MAX_LEVEL; id += 1) {
        const stars = clampInt(raw.stars[id], 0, 3, 0);
        if (stars > 0) base.stars[id] = stars;
      }
    }
    if (raw.completed && typeof raw.completed === "object") {
      for (let id = 1; id <= MAX_LEVEL; id += 1) {
        if (raw.completed[id]) base.completed[id] = true;
      }
    }
    if (raw.best && typeof raw.best === "object") {
      for (let id = 1; id <= MAX_LEVEL; id += 1) {
        const entry = raw.best[id];
        if (!entry || typeof entry !== "object") continue;
        base.best[id] = {
          mowers: clampInt(entry.mowers, 0, 5, 0),
          seconds: clampInt(entry.seconds, 0, 999999, 0),
          kills: clampInt(entry.kills, 0, 999999, 0)
        };
      }
    }

    // Repair old saves and open the new chapter after the original finale.
    const highestStarLevel = Math.max(
      0,
      ...Object.keys(base.stars).map(function (key) { return Number(key) || 0; })
    );
    if (highestStarLevel > 0) {
      base.unlocked = Math.max(base.unlocked, Math.min(MAX_LEVEL, highestStarLevel + 1));
    }
    for (let id = 1; id <= MAX_LEVEL; id += 1) {
      if (base.completed[id]) base.unlocked = Math.max(base.unlocked, Math.min(MAX_LEVEL, id + 1));
    }

    return base;
  }

  function getStorage() {
    if (memoryOnly) return null;
    try {
      const storage = global.localStorage;
      const probe = "__sunbud_probe__";
      storage.setItem(probe, "1");
      storage.removeItem(probe);
      return storage;
    } catch (err) {
      memoryOnly = true;
      return null;
    }
  }

  function read() {
    if (memoryData) {
      const previousVersion = Number(memoryData.version) || 1;
      const normalized = normalize(memoryData);
      if (previousVersion < VERSION) {
        memoryData = normalized;
        if (getStorage()) {
          try { getStorage().setItem(KEY, JSON.stringify(normalized)); } catch (err) { memoryOnly = true; }
        }
      }
      return normalized;
    }
    const storage = getStorage();
    if (!storage) return normalize(memoryData);
    try {
      const raw = storage.getItem(KEY);
      const previous = raw ? JSON.parse(raw) : makeDefault();
      const previousVersion = Number(previous.version) || 1;
      memoryData = previous;
      const normalized = normalize(memoryData);
      if (previousVersion < VERSION) {
        normalized.version = VERSION;
        memoryData = normalized;
        storage.setItem(KEY, JSON.stringify(normalized));
      }
      return normalized;
    } catch (err) {
      memoryData = makeDefault();
      return normalize(memoryData);
    }
  }

  function write(data) {
    const normalized = normalize(data);
    normalized.updatedAt = Date.now();
    memoryData = normalized;
    const storage = getStorage();
    if (storage) {
      try {
        storage.setItem(KEY, JSON.stringify(normalized));
      } catch (err) {
        memoryOnly = true;
      }
    }
    return normalized;
  }

  /* ------------------------------------------------------------
     Per-level paused runs
     Each level has its own key so a snapshot never bloats the main save.
     ------------------------------------------------------------ */
  function validLevelId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id >= 1 && id <= MAX_LEVEL ? id : null;
  }

  function runKey(levelId) {
    return RUN_KEY_PREFIX + levelId;
  }

  function normalizeRun(raw, levelId) {
    if (!raw || typeof raw !== "object") return null;
    if (Number(raw.version) !== RUN_VERSION) return null;
    if (Number(raw.levelId) !== levelId) return null;
    if (!raw.state || typeof raw.state !== "object") return null;
    const summary = raw.summary && typeof raw.summary === "object" ? raw.summary : {};
    return {
      version: RUN_VERSION,
      levelId: levelId,
      savedAt: Number.isFinite(Number(raw.savedAt)) ? Number(raw.savedAt) : Date.now(),
      summary: {
        wave: clampInt(summary.wave, 0, 99, 0),
        waveTotal: clampInt(summary.waveTotal, 0, 99, 0),
        label: typeof summary.label === "string" ? summary.label.slice(0, 32) : "",
        sun: clampInt(summary.sun, 0, 999999, 0),
        kills: clampInt(summary.kills, 0, 999999, 0),
        seconds: clampInt(summary.seconds, 0, 9999999, 0),
        phase: typeof summary.phase === "string" ? summary.phase.slice(0, 20) : ""
      },
      state: raw.state
    };
  }

  function readRun(levelId) {
    const id = validLevelId(levelId);
    if (!id) return null;
    if (memoryRuns[id]) return normalizeRun(memoryRuns[id], id);
    const storage = getStorage();
    if (!storage) return null;
    try {
      const raw = storage.getItem(runKey(id));
      if (!raw) return null;
      const run = normalizeRun(JSON.parse(raw), id);
      if (!run) storage.removeItem(runKey(id));
      return run;
    } catch (err) {
      try { storage.removeItem(runKey(id)); } catch (removeErr) { /* ignore */ }
      return null;
    }
  }

  function hasRun(levelId) {
    const id = validLevelId(levelId);
    if (!id) return false;
    if (memoryRuns[id]) return true;
    const storage = getStorage();
    if (!storage) return false;
    try {
      return storage.getItem(runKey(id)) !== null;
    } catch (err) {
      return false;
    }
  }

  function writeRun(levelId, run) {
    const id = validLevelId(levelId);
    if (!id) return false;
    const normalized = normalizeRun(Object.assign({}, run, {
      version: RUN_VERSION,
      levelId: id,
      savedAt: Date.now()
    }), id);
    if (!normalized) return false;
    const storage = getStorage();
    memoryRuns[id] = normalized;
    if (!storage) return false;
    try {
      storage.setItem(runKey(id), JSON.stringify(normalized));
      return true;
    } catch (err) {
      return false;
    }
  }

  function clearRun(levelId) {
    const id = validLevelId(levelId);
    if (!id) return;
    delete memoryRuns[id];
    const storage = getStorage();
    if (!storage) return;
    try { storage.removeItem(runKey(id)); } catch (err) { /* ignore */ }
  }

  function clearAllRuns() {
    const storage = getStorage();
    for (let id = 1; id <= MAX_LEVEL; id += 1) {
      delete memoryRuns[id];
      if (!storage) continue;
      try { storage.removeItem(runKey(id)); } catch (err) { /* ignore */ }
    }
  }

  const Save = {
    get: read,
    getSettings: function () {
      return read().settings;
    },
    isPersistent: function () {
      getStorage();
      return !memoryOnly;
    },
    saveSettings: function (patch) {
      const data = read();
      data.settings = Object.assign({}, data.settings, patch || {});
      return write(data);
    },
    beginLevel: function (levelId) {
      const data = read();
      data.lastLevel = clampInt(levelId, 1, MAX_LEVEL, 1);
      data.plays += 1;
      return write(data);
    },
    completeLevel: function (levelId, stars, stats) {
      const data = read();
      const id = clampInt(levelId, 1, MAX_LEVEL, 1);
      const safeStars = clampInt(stars, 1, 3, 1);
      const prevStars = clampInt(data.stars[id], 0, 3, 0);
      const next = Math.max(prevStars, safeStars);

      data.stars[id] = next;
      data.completed[id] = true;
      data.wins += 1;
      data.unlocked = Math.max(data.unlocked, Math.min(MAX_LEVEL, id + 1));
      data.lastLevel = Math.min(MAX_LEVEL, id + 1);

      const entry = stats && typeof stats === "object" ? stats : {};
      const previousBest = data.best[id] || {};
      data.best[id] = {
        mowers: Math.max(
          clampInt(previousBest.mowers, 0, 5, 0),
          clampInt(entry.mowers, 0, 5, 0)
        ),
        seconds: previousBest.seconds > 0
          ? Math.min(previousBest.seconds, clampInt(entry.seconds, 0, 999999, 999999))
          : clampInt(entry.seconds, 0, 999999, 0),
        kills: Math.max(
          clampInt(previousBest.kills, 0, 999999, 0),
          clampInt(entry.kills, 0, 999999, 0)
        )
      };
      if (!data.best[id].seconds) data.best[id].seconds = clampInt(entry.seconds, 0, 999999, 0);
      clearRun(id);

      return write(data);
    },
    reset: function () {
      memoryData = makeDefault();
      const storage = getStorage();
      if (storage) {
        try { storage.removeItem(KEY); } catch (err) { memoryOnly = true; }
      }
      clearAllRuns();
      return memoryData;
    },
    totalStars: function () {
      const data = read();
      return Array.from({ length: MAX_LEVEL }, function (_, index) {
        return Number(data.stars[index + 1]) || 0;
      }).reduce(function (sum, stars) { return sum + stars; }, 0);
    },
    nextLevel: function () {
      const data = read();
      for (let id = 1; id <= MAX_LEVEL; id += 1) {
        if (!data.completed[id] && data.unlocked >= id) return id;
      }
      return Math.min(MAX_LEVEL, data.unlocked);
    },
    starsForMowers: function (remaining) {
      if (remaining >= 5) return 3;
      if (remaining >= 3) return 2;
      return 1;
    },
    getRun: readRun,
    hasRun: hasRun,
    saveRun: writeRun,
    clearRun: clearRun,
    clearAllRuns: clearAllRuns
  };

  Sunbud.Save = Save;
})(window);
