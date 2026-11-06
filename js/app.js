/* ============================================================
   光芽小院 · 页面与菜单编排
   菜单动画、关卡选择、弹窗、声音设置、存档 UI。
   ============================================================ */
(function (global) {
  "use strict";

  const Sunbud = (global.Sunbud = global.Sunbud || {});
  const Data = Sunbud.DATA;
  const Save = Sunbud.Save;
  const Audio = Sunbud.Audio;
  const Art = Sunbud.Art;

  const LEVELS = Data.levels;

  class App {
    constructor() {
      this.menuScreen = document.getElementById("menuScreen");
      this.gameScreen = document.getElementById("gameScreen");
      this.menuCanvas = document.getElementById("menuCanvas");
      this.menuCtx = this.menuCanvas.getContext("2d");
      this.levelList = document.getElementById("levelList");
      this.startBtn = document.getElementById("startBtn");
      this.startBtnLabel = document.getElementById("startBtnLabel");
      this.saveMetaText = document.getElementById("saveMetaText");
      this.howBtn = document.getElementById("howBtn");
      this.menuHowBtn = document.getElementById("menuHowBtn");
      this.menuSettingsBtn = document.getElementById("menuSettingsBtn");
      this.menuSoundBtn = document.getElementById("menuSoundBtn");
      this.howModal = document.getElementById("howModal");
      this.settingsModal = document.getElementById("settingsModal");
      this.resumeModal = document.getElementById("resumeModal");
      this.resumeTitle = document.getElementById("resumeTitle");
      this.resumeCopy = document.getElementById("resumeCopy");
      this.resumeWave = document.getElementById("resumeWave");
      this.resumeSun = document.getElementById("resumeSun");
      this.resumeKills = document.getElementById("resumeKills");
      this.resumeTime = document.getElementById("resumeTime");
      this.resumeContinueBtn = document.getElementById("resumeContinueBtn");
      this.resumeRestartBtn = document.getElementById("resumeRestartBtn");
      this.resumeCancelBtn = document.getElementById("resumeCancelBtn");
      this.musicToggle = document.getElementById("musicToggle");
      this.sfxToggle = document.getElementById("sfxToggle");
      this.resetProgressBtn = document.getElementById("resetProgressBtn");
      this.storageState = document.getElementById("storageState");
      this.toastStack = document.getElementById("toastStack");

      this.menuVisible = true;
      this.menuRaf = null;
      this.menuLastFrame = 0;
      this.activeModal = null;
      this.lastFocused = null;
      this.resetArmed = false;
      this.resetTimer = null;
      this.currentLevelId = null;
      this.pendingResumeLevel = null;
      this.reduceMotion = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.audioUnlocked = false;

      Audio.setSettings(Save.getSettings());

      this.game = new Sunbud.Game({
        onExit: (() => this.showMenu()).bind(this),
        onLevelStart: (level) => {
          this.currentLevelId = level.id;
          Save.beginLevel(level.id);
          this.refreshMenuState();
        },
        onLevelComplete: (level, result) => {
          Save.completeLevel(level.id, result.stars, {
            mowers: result.mowers,
            seconds: Math.round(result.seconds),
            kills: result.kills
          });
          this.refreshMenuState();
        },
        onRunSaved: (saved, level) => {
          if (saved) {
            this.showToast("已保存第 " + level.id + " 关的进度，下次可以接着守护");
          } else {
            this.showToast("本局进度未能写入本地存储，请检查浏览器设置");
          }
        }
      });

      this.bindEvents();
      this.bindModals();
      this.refreshMenuState(true);
      this.updateAudioUI();
      this.showMenuVisual(true);
      global.SunbudApp = this;
    }

    /* -------------------------------------------------------
       Menu
       ------------------------------------------------------- */

    bindEvents() {
      this.startBtn.addEventListener("click", () => {
        this.ensureAudio();
        Audio.play("ui");
        const save = Save.get();
        this.startLevel(Save.nextLevel(), save);
      });

      this.levelList.addEventListener("click", (event) => {
        const card = event.target.closest(".level-card");
        if (!card) return;
        const id = Number(card.dataset.level);
        const save = Save.get();
        const level = Data.getLevel(id);
        if (!level) return;
        if (id > save.unlocked) {
          Audio.play("error");
          const previous = Data.getLevel(id - 1);
          this.showToast("「" + (previous ? previous.name : "前一关") + "」守住后，这片花园才会亮起。");
          return;
        }
        this.ensureAudio();
        Audio.play("ui");
        this.startLevel(id, save);
      });

      this.resumeContinueBtn.addEventListener("click", () => {
        const levelId = this.pendingResumeLevel;
        const level = Data.getLevel(levelId);
        const run = levelId ? Save.getRun(levelId) : null;
        this.closeModal("resumeModal");
        this.pendingResumeLevel = null;
        Audio.play("ui");
        if (!level) return;
        if (!run) {
          this.showToast("之前的对局已失效，将重新开始");
          this.startLevel(level.id, Save.get(), { skipResume: true });
          return;
        }
        this.startLevel(level.id, Save.get(), { skipResume: true, run: run });
      });

      this.resumeRestartBtn.addEventListener("click", () => {
        const levelId = this.pendingResumeLevel;
        const level = Data.getLevel(levelId);
        if (levelId) Save.clearRun(levelId);
        this.closeModal("resumeModal");
        this.pendingResumeLevel = null;
        Audio.play("ui");
        if (level) this.startLevel(level.id, Save.get(), { skipResume: true });
      });

      this.resumeCancelBtn.addEventListener("click", () => {
        this.closeModal("resumeModal");
        this.pendingResumeLevel = null;
        Audio.play("ui");
      });

      this.howBtn.addEventListener("click", () => {
        this.ensureAudio();
        Audio.play("ui");
        this.openModal("howModal");
      });

      this.menuHowBtn.addEventListener("click", () => {
        this.ensureAudio();
        Audio.play("ui");
        this.openModal("howModal");
      });

      this.menuSettingsBtn.addEventListener("click", () => {
        this.ensureAudio();
        Audio.play("ui");
        this.openModal("settingsModal");
      });

      this.menuSoundBtn.addEventListener("click", () => {
        this.ensureAudio();
        const settings = Save.getSettings();
        const turnOn = !(settings.music || settings.sfx);
        Save.saveSettings({ music: turnOn, sfx: turnOn });
        Audio.setSettings({ music: turnOn, sfx: turnOn });
        if (turnOn) {
          Audio.unlock();
          Audio.startMusic(this.menuVisible ? "menu" : this.game.level ? this.game.level.theme : "menu");
          Audio.play("ui");
        }
        this.updateAudioUI();
        this.showToast(turnOn ? "声音已打开" : "声音已关闭");
      });

      this.musicToggle.addEventListener("click", () => {
        this.ensureAudio();
        const settings = Save.getSettings();
        const value = !settings.music;
        Save.saveSettings({ music: value });
        Audio.setSettings(Save.getSettings());
        if (value) {
          Audio.startMusic(this.menuVisible ? "menu" : "menu");
          Audio.play("ui");
        }
        this.updateAudioUI();
      });

      this.sfxToggle.addEventListener("click", () => {
        this.ensureAudio();
        const settings = Save.getSettings();
        const value = !settings.sfx;
        Save.saveSettings({ sfx: value });
        Audio.setSettings(Save.getSettings());
        if (value) Audio.play("ui");
        this.updateAudioUI();
      });

      this.resetProgressBtn.addEventListener("click", () => {
        this.ensureAudio();
        if (!this.resetArmed) {
          this.resetArmed = true;
          this.resetProgressBtn.textContent = "再点一次确认";
          this.resetProgressBtn.classList.add("armed");
          if (this.resetTimer) global.clearTimeout(this.resetTimer);
          this.resetTimer = global.setTimeout(() => {
            this.resetArmed = false;
            this.resetProgressBtn.textContent = "清除进度";
            this.resetProgressBtn.classList.remove("armed");
          }, 4500);
          return;
        }
        if (this.resetTimer) global.clearTimeout(this.resetTimer);
        this.resetArmed = false;
        this.resetProgressBtn.textContent = "清除进度";
        this.resetProgressBtn.classList.remove("armed");
        Save.reset();
        Audio.setSettings(Save.getSettings());
        if (this.audioUnlocked && Save.getSettings().music) Audio.startMusic("menu");
        this.refreshMenuState(true);
        this.updateAudioUI();
        this.updateStorageLabel();
        this.closeModal("settingsModal");
        this.showToast("花园重新变成了一张白纸。");
      });

      const unlockOnFirstGesture = () => {
        this.ensureAudio();
      };
      document.addEventListener("pointerdown", unlockOnFirstGesture, { passive: true });
      document.addEventListener("keydown", unlockOnFirstGesture);
    }

    ensureAudio() {
      if (this.audioUnlocked) return;
      this.audioUnlocked = true;
      Audio.unlock();
      Audio.setSettings(Save.getSettings());
      if (this.menuVisible && Save.getSettings().music) {
        Audio.startMusic("menu");
      }
    }

    startLevel(levelId, saveOverride, options) {
      const save = saveOverride || Save.get();
      const level = Data.getLevel(levelId);
      if (!level) return;
      if (level.id > save.unlocked) {
        this.showToast("这片花园还没有被点亮。");
        return;
      }
      const opts = options || {};
      this.ensureAudio();
      if (!opts.skipResume) {
        const run = Save.getRun(level.id);
        if (run) {
          this.showResumeChoice(level, run);
          return;
        }
      }
      this.launchLevel(level, opts.run || null);
    }

    showResumeChoice(level, run) {
      this.pendingResumeLevel = level.id;
      const summary = run.summary || {};
      const label = summary.label || "花园中段";
      this.resumeTitle.textContent = "继续「" + level.name + "」";
      this.resumeCopy.textContent =
        "上一次停在了" + label + "，植物、阳光和草坪上的夜霉都还在原地。";
      this.resumeWave.textContent = label;
      this.resumeSun.textContent = String(Math.max(0, Math.floor(Number(summary.sun) || 0)));
      this.resumeKills.textContent = String(Math.max(0, Math.floor(Number(summary.kills) || 0)));
      this.resumeTime.textContent = this.formatRunTime(summary.seconds);
      this.openModal("resumeModal");
      global.setTimeout(() => {
        if (this.activeModal === "resumeModal") this.resumeContinueBtn.focus({ preventScroll: true });
      }, 50);
    }

    formatRunTime(seconds) {
      const total = Math.max(0, Math.floor(Number(seconds) || 0));
      const mins = Math.floor(total / 60);
      const secs = total % 60;
      return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
    }

    launchLevel(level, resumeRun) {
      this.closeAllModals(false);
      this.currentLevelId = level.id;
      this.menuVisible = false;
      this.stopMenuVisual();
      this.menuScreen.classList.add("hidden");
      this.gameScreen.classList.remove("hidden");
      document.body.classList.add("in-game");
      global.scrollTo({ top: 0, left: 0, behavior: "auto" });
      this.menuScreen.setAttribute("aria-hidden", "true");
      this.gameScreen.setAttribute("aria-hidden", "false");
      document.title = "光芽小院 · 第 " + level.id + " 关 " + level.name;
      this.game.start(level.id);
      if (resumeRun) {
        const restored = this.game.restoreRun(resumeRun);
        if (!restored) this.showToast("保存的对局已失效，已开始新的对局");
      }
      global.requestAnimationFrame(() => this.game.resize());
    }

    showMenu() {
      this.menuVisible = true;
      this.currentLevelId = null;
      this.gameScreen.classList.add("hidden");
      this.menuScreen.classList.remove("hidden");
      document.body.classList.remove("in-game");
      global.scrollTo({ top: 0, left: 0, behavior: "auto" });
      this.menuScreen.setAttribute("aria-hidden", "false");
      this.gameScreen.setAttribute("aria-hidden", "true");
      document.title = "光芽小院 · Sunbud Garden";
      this.refreshMenuState();
      this.showMenuVisual(false);
      if (this.audioUnlocked && Save.getSettings().music) Audio.startMusic("menu");
      global.setTimeout(() => {
        if (this.menuVisible) this.startBtn.focus({ preventScroll: true });
      }, 60);
    }

    refreshMenuState(full) {
      const save = Save.get();
      const maxLevels = LEVELS.length;
      const stars = LEVELS.map((level) => Number(save.stars[level.id]) || 0);
      const totalStars = stars.reduce((a, b) => a + b, 0);
      const maxStars = maxLevels * 3;
      const completedCount = Object.keys(save.completed || {}).filter((key) => save.completed[key]).length;
      const nextLevel = Save.nextLevel();
      const nextData = Data.getLevel(nextLevel);
      const allDone = completedCount >= maxLevels;

      if (allDone) {
        this.startBtnLabel.textContent = "重温花园";
      } else if (save.plays === 0 && completedCount === 0) {
        this.startBtnLabel.textContent = "开始守护";
      } else {
        this.startBtnLabel.textContent = "继续第 " + nextLevel + " 关";
      }

      if (save.plays === 0 && completedCount === 0) {
        this.saveMetaText.textContent = "新的花园，正等着第一颗种子。";
      } else if (allDone) {
        this.saveMetaText.textContent = "六段光景都已守住 · 星光 " + totalStars + " / " + maxStars;
      } else {
        this.saveMetaText.textContent =
          "已点亮 " + save.unlocked + " / " + maxLevels + " 片花园 · 星光 " + totalStars + " / " + maxStars;
      }
      this.startBtn.setAttribute("aria-label", this.startBtnLabel.textContent + (nextData ? "：" + nextData.name : ""));

      this.renderLevelCards(save, stars);
      if (full) this.updateStorageLabel();
    }

    renderLevelCards(save, stars) {
      const cards = LEVELS.map((level) => {
        const locked = level.id > save.unlocked;
        const completed = !!save.completed[level.id];
        const hasRun = !locked && !completed && Save.hasRun(level.id);
        const starCount = stars[level.id - 1] || 0;
        const starMarkup = [1, 2, 3]
          .map((n) => '<span class="' + (n <= starCount ? "lit" : "dim") + '">★</span>')
          .join("");
        const stateText = locked ? "尚未点亮" : completed ? "已守住" : hasRun ? "可继续" : "进入花园";
        const stateClass = locked ? "locked-state" : completed ? "done" : hasRun ? "saved" : "ready";
        const stateIcon = locked
          ? '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.2" y="7.1" width="9.6" height="7" rx="2"/><path d="M5.3 7V5.2a2.7 2.7 0 0 1 5.4 0V7"/></svg>'
          : hasRun
            ? '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.1 3.3 12.2 8l-7.1 4.7z"/></svg>'
            : '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.5c0-4 2.2-6.9 5-8.5-0.4 4.2-2.2 7-5 8.5Z"/><path d="M8 13.5C6.7 10.8 4.4 9.2 2 9.1c0.6 3.2 2.4 4.8 6 4.4Z"/></svg>';
        const lockedRibbon = locked
          ? '<span class="lock-ribbon" aria-hidden="true"><svg viewBox="0 0 16 16"><rect x="3" y="7" width="10" height="7" rx="2"/><path d="M5.2 7V5a2.8 2.8 0 0 1 5.6 0v2"/></svg></span>'
          : "";
        return (
          '<button class="level-card' + (locked ? " locked" : "") + (hasRun ? " has-run" : "") + '" type="button" data-level="' + level.id + '"' +
          ' aria-disabled="' + (locked ? "true" : "false") + '"' +
          ' aria-label="第 ' + level.id + " 关 " + level.name + "，" + (locked ? "尚未解锁" : completed ? "已通关" : hasRun ? "有未完成对局，可继续" : "可以进入") + '">' +
          '<span class="level-thumb-wrap">' +
          '<canvas class="level-thumb" width="680" height="248" data-level="' + level.id + '" aria-hidden="true"></canvas>' +
          '<span class="level-topline"><span class="level-number">LEVEL ' + level.code + "</span>" +
          '<span class="level-stars" aria-hidden="true">' + (locked ? "" : starMarkup) + "</span></span>" +
          lockedRibbon +
          "</span>" +
          '<span class="level-card-body">' +
          '<span class="level-card-copy"><strong class="level-title">' + level.name + "</strong>" +
          '<span class="level-text">' + level.desc + "</span></span>" +
          '<span class="level-state ' + stateClass + '">' + stateIcon + stateText + "</span>" +
          "</span>" +
          "</button>"
        );
      });
      this.levelList.innerHTML = cards.join("");
      this.levelList.querySelectorAll(".level-thumb").forEach((canvas) => {
        const level = Data.getLevel(Number(canvas.dataset.level));
        if (level) Art.drawLevelThumb(canvas, level);
      });
    }

    updateAudioUI() {
      const settings = Save.getSettings();
      this.menuSoundBtn.classList.toggle("muted", !settings.music && !settings.sfx);
      this.menuSoundBtn.setAttribute("aria-label", settings.music || settings.sfx ? "关闭全部声音" : "打开全部声音");
      this.musicToggle.setAttribute("aria-checked", settings.music ? "true" : "false");
      this.sfxToggle.setAttribute("aria-checked", settings.sfx ? "true" : "false");
    }

    updateStorageLabel() {
      if (Save.isPersistent()) {
        this.storageState.textContent = "已连接本地存档";
      } else {
        this.storageState.textContent = "本地存档不可用，关闭页面后进度会丢失";
      }
    }

    showMenuVisual(instant) {
      this.menuVisible = true;
      if (this.menuRaf != null) {
        global.cancelAnimationFrame(this.menuRaf);
        this.menuRaf = null;
      }
      if (instant) {
        this.drawMenuFrame(10);
        if (this.reduceMotion) return;
      }
      this.menuLastFrame = 0;
      const tick = (timestamp) => {
        if (!this.menuVisible) {
          this.menuRaf = null;
          return;
        }
        this.menuRaf = global.requestAnimationFrame(tick);
        if (this.reduceMotion && this.menuLastFrame) return;
        if (timestamp - this.menuLastFrame < 1000 / 30) return;
        this.menuLastFrame = timestamp;
        this.drawMenuFrame(timestamp / 1000);
      };
      this.menuRaf = global.requestAnimationFrame(tick);
    }

    stopMenuVisual() {
      if (this.menuRaf != null) global.cancelAnimationFrame(this.menuRaf);
      this.menuRaf = null;
    }

    drawMenuFrame(time) {
      this.menuCtx.setTransform(1, 0, 0, 1, 0, 0);
      this.menuCtx.clearRect(0, 0, this.menuCanvas.width, this.menuCanvas.height);
      Art.drawMenuScene(this.menuCtx, time);
    }

    /* -------------------------------------------------------
       Modals
       ------------------------------------------------------- */

    bindModals() {
      document.querySelectorAll(".modal-layer").forEach((layer) => {
        layer.addEventListener("click", (event) => {
          if (event.target === layer) this.closeModal(layer.id);
        });
      });
      document.querySelectorAll("[data-close]").forEach((button) => {
        button.addEventListener("click", () => {
          this.closeModal(button.dataset.close);
          Audio.play("ui");
        });
      });
      document.addEventListener("keydown", (event) => {
        if (!this.activeModal) return;
        if (event.key === "Escape") {
          event.preventDefault();
          this.closeModal(this.activeModal);
          return;
        }
        if (event.key === "Tab") this.trapModalFocus(event);
      });
    }

    openModal(id) {
      const layer = document.getElementById(id);
      if (!layer) return;
      this.closeAllModals(true);
      this.lastFocused = document.activeElement;
      this.activeModal = id;
      layer.classList.remove("hidden");
      layer.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      if (id === "settingsModal") {
        this.updateAudioUI();
        this.updateStorageLabel();
        this.resetArmed = false;
        this.resetProgressBtn.textContent = "清除进度";
        this.resetProgressBtn.classList.remove("armed");
      }
      global.setTimeout(() => {
        const target = layer.querySelector(".modal-close") || layer.querySelector("button");
        if (target) target.focus({ preventScroll: true });
      }, 40);
    }

    closeModal(id) {
      const layer = document.getElementById(id);
      if (!layer || layer.classList.contains("hidden")) return;
      layer.classList.add("hidden");
      layer.setAttribute("aria-hidden", "true");
      if (this.activeModal === id) this.activeModal = null;
      if (id === "resumeModal") this.pendingResumeLevel = null;
      if (!document.querySelector(".modal-layer:not(.hidden)")) {
        document.body.classList.remove("modal-open");
      }
      if (this.lastFocused && typeof this.lastFocused.focus === "function" && document.contains(this.lastFocused)) {
        this.lastFocused.focus({ preventScroll: true });
      }
      this.lastFocused = null;
    }

    closeAllModals(silent) {
      document.querySelectorAll(".modal-layer:not(.hidden)").forEach((layer) => {
        layer.classList.add("hidden");
        layer.setAttribute("aria-hidden", "true");
      });
      this.activeModal = null;
      if (!silent) document.body.classList.remove("modal-open");
      if (!silent && this.lastFocused && typeof this.lastFocused.focus === "function") {
        this.lastFocused.focus({ preventScroll: true });
        this.lastFocused = null;
      }
    }

    trapModalFocus(event) {
      const layer = document.getElementById(this.activeModal);
      if (!layer) return;
      const focusable = Array.from(layer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter((el) => !el.disabled && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    /* -------------------------------------------------------
       Toasts
       ------------------------------------------------------- */

    showToast(text) {
      if (!text) return;
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.textContent = text;
      this.toastStack.appendChild(toast);
      while (this.toastStack.children.length > 3) {
        this.toastStack.removeChild(this.toastStack.firstElementChild);
      }
      global.setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 3050);
    }
  }

  function boot() {
    if (!global.Sunbud) return;
    new App();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window);
