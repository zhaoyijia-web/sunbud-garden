/* ============================================================
   光芽小院 · 程序化美术
   所有植物、夜霉、草坪、关卡插画都用 Canvas 现场绘制。
   ============================================================ */
(function (global) {
  "use strict";

  const Sunbud = (global.Sunbud = global.Sunbud || {});
  const TAU = Math.PI * 2;

  const BOARD = Object.freeze({ width: 1440, height: 760 });
  const GRID = Object.freeze({
    x: 214,
    y: 104,
    cols: 9,
    rows: 5,
    cw: 126,
    ch: 122,
    width: 1134,
    height: 610
  });
  const MOWER_X = 166;
  const SPAWN_X = 1436;
  const HOUSE_X = 126;

  const THEMES = {
    morning: {
      skyTop: "#f8e7b8",
      skyBottom: "#d8e2b1",
      hedge: "#4f764e",
      hedgeDark: "#365a3b",
      lawnA: "#91c95b",
      lawnB: "#78b648",
      lawnEdge: "#5e8e3d",
      lawnDark: "#416a33",
      pathA: "#d7bd8c",
      pathB: "#c4a671",
      pathDark: "#8f7446",
      stone: "#b9a47c",
      flowerA: "#fff1b6",
      flowerB: "#f3a85e",
      flowerC: "#d96b6f",
      skyGlow: "rgba(255, 229, 152, 0.6)",
      vignette: "rgba(31, 58, 29, 0.19)",
      light: "rgba(255, 241, 176, 0.17)",
      text: "#f9f0d2"
    },
    dusk: {
      skyTop: "#1a3740",
      skyBottom: "#446b5c",
      hedge: "#29483c",
      hedgeDark: "#172f29",
      lawnA: "#559562",
      lawnB: "#447a50",
      lawnEdge: "#31563e",
      lawnDark: "#213d2e",
      pathA: "#9a8d70",
      pathB: "#82775f",
      pathDark: "#5a513f",
      stone: "#857c67",
      flowerA: "#ffe59d",
      flowerB: "#e0a665",
      flowerC: "#be7f83",
      skyGlow: "rgba(181, 215, 166, 0.16)",
      vignette: "rgba(7, 25, 21, 0.38)",
      light: "rgba(185, 228, 186, 0.07)",
      text: "#f4ebce"
    },
    eclipse: {
      skyTop: "#14172d",
      skyBottom: "#363451",
      hedge: "#252d35",
      hedgeDark: "#141b22",
      lawnA: "#466e53",
      lawnB: "#345743",
      lawnEdge: "#294636",
      lawnDark: "#1c3327",
      pathA: "#716d66",
      pathB: "#5e5b55",
      pathDark: "#403d3a",
      stone: "#6d6c68",
      flowerA: "#efdca4",
      flowerB: "#c0878d",
      flowerC: "#8b799e",
      skyGlow: "rgba(231, 213, 170, 0.15)",
      vignette: "rgba(4, 8, 18, 0.5)",
      light: "rgba(198, 199, 235, 0.06)",
      text: "#f3e9cc"
    },
    rain: {
      skyTop: "#67818a",
      skyBottom: "#b7c9b6",
      hedge: "#3b594b",
      hedgeDark: "#293f35",
      lawnA: "#70a96c",
      lawnB: "#5d9763",
      lawnEdge: "#456e4d",
      lawnDark: "#2f5039",
      pathA: "#979789",
      pathB: "#83877b",
      pathDark: "#5a5e55",
      stone: "#888e82",
      flowerA: "#f2e7b4",
      flowerB: "#e0ad7d",
      flowerC: "#bd7b8c",
      skyGlow: "rgba(206, 228, 216, 0.28)",
      vignette: "rgba(14, 37, 27, 0.28)",
      light: "rgba(207, 238, 219, 0.085)",
      text: "#edf3dc"
    },
    starlit: {
      skyTop: "#121f38",
      skyBottom: "#3e5b5d",
      hedge: "#28443c",
      hedgeDark: "#182e2a",
      lawnA: "#4c7a62",
      lawnB: "#3e6b57",
      lawnEdge: "#2b4a3a",
      lawnDark: "#1d362a",
      pathA: "#767c70",
      pathB: "#60685e",
      pathDark: "#42493f",
      stone: "#6e786e",
      flowerA: "#c9ead3",
      flowerB: "#d7b08c",
      flowerC: "#aa99c9",
      skyGlow: "rgba(194, 226, 207, 0.18)",
      vignette: "rgba(3, 14, 16, 0.4)",
      light: "rgba(196, 231, 213, 0.075)",
      text: "#eef4dd"
    },
    dawn: {
      skyTop: "#f5d0a2",
      skyBottom: "#ffe7b8",
      hedge: "#6d8452",
      hedgeDark: "#4b633d",
      lawnA: "#a6c868",
      lawnB: "#93b957",
      lawnEdge: "#739347",
      lawnDark: "#536d35",
      pathA: "#dfbe8c",
      pathB: "#caa874",
      pathDark: "#90764f",
      stone: "#bca477",
      flowerA: "#ffe6a8",
      flowerB: "#efa977",
      flowerC: "#d88184",
      skyGlow: "rgba(255, 216, 150, 0.5)",
      vignette: "rgba(88, 60, 28, 0.16)",
      light: "rgba(255, 235, 170, 0.16)",
      text: "#fff1d2"
    }
  };

  const OUTLINE = "rgba(38, 55, 35, 0.72)";
  const DARK = "#29432e";
  const CREAM = "#fff5d8";

  /* ---------------------------------------------------------
     Small helpers
     --------------------------------------------------------- */

  function lerp(a, b, t) { return a + (b - a) * t; }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rr(ctx, x, y, w, h, r) {
    const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function ellipsePath(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
  }

  function fillEllipse(ctx, x, y, rx, ry, fill, stroke, lw) {
    ellipsePath(ctx, x, y, rx, ry);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw || 1.5;
      ctx.stroke();
    }
  }

  function leaf(ctx, x, y, length, width, rotation, fill, vein) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(length * 0.3, -width, length * 0.76, -width * 0.9, length, 0);
    ctx.bezierCurveTo(length * 0.68, width * 0.86, length * 0.3, width, 0, 0);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, length, 0);
    grad.addColorStop(0, fill || "#4c7c3e");
    grad.addColorStop(1, vein || "#78a85a");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(47, 70, 38, 0.4)";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    if (vein) {
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.quadraticCurveTo(length * 0.5, -width * 0.15, length * 0.9, 0);
      ctx.strokeStyle = "rgba(37, 74, 39, 0.28)";
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
    ctx.restore();
  }

  function stem(ctx, points, width, color) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    if (points.length === 3) {
      ctx.quadraticCurveTo(points[1][0], points[1][1], points[2][0], points[2][1]);
    } else {
      ctx.bezierCurveTo(
        points[1][0], points[1][1],
        points[2][0], points[2][1],
        points[3][0], points[3][1]
      );
    }
    ctx.strokeStyle = color || "#4d7c3e";
    ctx.lineWidth = width || 4;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function shadow(ctx, rx, ry, alpha) {
    fillEllipse(ctx, 0, 2, rx, ry, "rgba(30, 51, 26, " + (alpha == null ? 0.18 : alpha) + ")");
  }

  function dirtMound(ctx, w, h) {
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.quadraticCurveTo(-w * 0.34, -h, 0, -h * 0.9);
    ctx.quadraticCurveTo(w * 0.36, -h * 0.95, w / 2, 0);
    ctx.closePath();
    ctx.fillStyle = "#82613f";
    ctx.fill();
    ctx.fillStyle = "rgba(74, 52, 32, 0.25)";
    ctx.beginPath();
    ctx.ellipse(0, -2, w * 0.37, 4, 0, 0, TAU);
    ctx.fill();
  }

  function face(ctx, x, y, opts) {
    const o = opts || {};
    const eyeY = y;
    const eyeGap = o.gap == null ? 12 : o.gap;
    const eyeR = o.eyeR == null ? 4.2 : o.eyeR;
    ctx.fillStyle = o.eyeColor || "#264031";
    fillEllipse(ctx, x - eyeGap, eyeY, eyeR, eyeR * 1.14, o.eyeColor || "#264031");
    fillEllipse(ctx, x + eyeGap, eyeY, eyeR, eyeR * 1.14, o.eyeColor || "#264031");
    if (!o.noHighlights) {
      fillEllipse(ctx, x - eyeGap + eyeR * 0.3, eyeY - eyeR * 0.35, eyeR * 0.32, eyeR * 0.32, "rgba(255, 255, 255, 0.72)");
      fillEllipse(ctx, x + eyeGap + eyeR * 0.3, eyeY - eyeR * 0.35, eyeR * 0.32, eyeR * 0.32, "rgba(255, 255, 255, 0.72)");
    }
    if (o.brow) {
      ctx.strokeStyle = o.stroke || "#2c4533";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - eyeGap - 5, eyeY - 8);
      ctx.lineTo(x - eyeGap + 4, eyeY - 6.5);
      ctx.moveTo(x + eyeGap + 5, eyeY - 8);
      ctx.lineTo(x + eyeGap - 4, eyeY - 6.5);
      ctx.stroke();
    }
    if (o.mouth !== false) {
      const my = eyeY + (o.mouthY == null ? 13 : o.mouthY);
      ctx.strokeStyle = o.stroke || "#2c4533";
      ctx.lineWidth = o.mouthWidth || 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      if (o.mouthOpen) {
        ctx.fillStyle = "rgba(46, 41, 29, 0.75)";
        ctx.ellipse(x, my, 4.6, 3.4, 0, 0, TAU);
        ctx.fill();
      } else {
        ctx.arc(x, my - 2, o.smile == null ? 4.2 : o.smile, 0.18, Math.PI - 0.18);
        ctx.stroke();
      }
    }
  }

  function sparkle(ctx, x, y, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 0.8 : alpha;
    ctx.fillStyle = color || "#ffe69a";
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.quadraticCurveTo(x + size * 0.18, y - size * 0.18, x + size, y);
    ctx.quadraticCurveTo(x + size * 0.18, y + size * 0.18, x, y + size);
    ctx.quadraticCurveTo(x - size * 0.18, y + size * 0.18, x - size, y);
    ctx.quadraticCurveTo(x - size * 0.18, y - size * 0.18, x, y - size);
    ctx.fill();
    ctx.restore();
  }

  function iceCrystal(ctx, x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.fillStyle = "rgba(205, 246, 248, 0.78)";
    ctx.strokeStyle = "rgba(130, 196, 211, 0.7)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.5, 0);
    ctx.lineTo(0, size * 0.82);
    ctx.lineTo(-size * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function tinyFlower(ctx, x, y, size, petal, center, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * TAU;
      fillEllipse(ctx, x + Math.cos(a) * size * 0.58, y + Math.sin(a) * size * 0.58, size * 0.45, size * 0.32, petal);
    }
    fillEllipse(ctx, x, y, size * 0.34, size * 0.34, center);
    ctx.restore();
  }

  /* ---------------------------------------------------------
     Plants
     --------------------------------------------------------- */

  function drawSunbud(ctx, t, opts) {
    const o = opts || {};
    const phase = o.phase || 0;
    const bob = o.plantAge != null && o.plantAge < 0.35 ? (1 - o.plantAge / 0.35) * 9 : Math.sin(t * 1.7 + phase) * 1.4;
    shadow(ctx, 27, 7, 0.16);
    ctx.save();
    ctx.translate(0, bob);

    stem(ctx, [[0, 0], [-6, -20], [2, -46], [-2, -57]], 5.2, "#4f7c3d");
    leaf(ctx, -2, -22, 28, 10, 2.75, "#5c8e45", "#82af5d");
    leaf(ctx, 1, -30, 24, 9, -0.5, "#5b8f43", "#86b761");

    const headX = -2;
    const headY = -65 + Math.sin(t * 1.8 + phase) * 1.2;
    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(Math.sin(t * 1.3 + phase) * 0.055);

    // Leafy collar.
    leaf(ctx, -3, 10, 24, 9, 2.82, "#456f39", "#698f4d");
    leaf(ctx, 3, 10, 22, 8, 0.25, "#456f39", "#698f4d");

    // Petals
    const petals = 13;
    const pulse = 1 + Math.max(0, Math.sin(t * 2.2 + phase)) * 0.015;
    for (let i = 0; i < petals; i += 1) {
      const a = (i / petals) * TAU + Math.sin(t * 0.8 + phase) * 0.025;
      ctx.save();
      ctx.rotate(a);
      const grad = ctx.createLinearGradient(13, 0, 38, 0);
      grad.addColorStop(0, i % 2 ? "#eaa42c" : "#f4bb38");
      grad.addColorStop(0.75, i % 2 ? "#ffd55a" : "#ffd968");
      grad.addColorStop(1, "#f1ae27");
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.bezierCurveTo(21, -9.5, 33, -8.5, 38 * pulse, 0);
      ctx.bezierCurveTo(33, 8.5, 21, 9.5, 11, 0);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(138, 91, 22, 0.27)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // Seed disk
    const disk = ctx.createRadialGradient(-5, -6, 2, 0, 0, 21);
    disk.addColorStop(0, "#a47743");
    disk.addColorStop(0.58, "#7d5b31");
    disk.addColorStop(1, "#5d4327");
    fillEllipse(ctx, 0, 0, 20, 20, disk, "rgba(76, 53, 26, 0.65)", 1.4);
    ctx.strokeStyle = "rgba(255, 220, 144, 0.22)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i += 1) {
      const a = i * 0.9;
      fillEllipse(ctx, Math.cos(a) * (7 + (i % 3) * 2.5), Math.sin(a) * (7 + (i % 2) * 2.5), 1.2, 1.2, "rgba(232, 196, 124, 0.35)");
    }
    face(ctx, 0, -3, { eyeGap: 7.5, eyeR: 3.1, eyeColor: "#2d4127", mouthY: 8, smile: 4.1, brow: false });
    fillEllipse(ctx, -10, 4, 3.2, 1.9, "rgba(219, 108, 74, 0.33)");
    fillEllipse(ctx, 10, 4, 3.2, 1.9, "rgba(219, 108, 74, 0.33)");

    if (o.glow) {
      ctx.globalAlpha = 0.62;
      ctx.strokeStyle = "#ffe48a";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 30 + Math.sin(t * 4) * 3, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
      sparkle(ctx, 27, -18, 5, "#fff0a6", 0.8);
      sparkle(ctx, -26, 9, 3.5, "#ffe184", 0.65);
    }
    ctx.restore();
    ctx.restore();
  }

  function drawPeapod(ctx, t, opts) {
    const o = opts || {};
    const phase = o.phase || 0;
    const recoil = o.recoil || 0;
    const bob = Math.sin(t * 2 + phase) * 1.3;
    shadow(ctx, 28, 7, 0.17);
    ctx.save();
    ctx.translate(0, bob);

    stem(ctx, [[0, 0], [-1, -17], [5, -31], [2, -43]], 5, "#4b773b");
    leaf(ctx, 1, -17, 26, 9, 2.9, "#578842", "#7ba557");
    leaf(ctx, 4, -23, 23, 8, -0.55, "#4f813b", "#76a052");
    dirtMound(ctx, 46, 9);

    ctx.translate(-recoil * 5, 0);
    // Pod body
    const grad = ctx.createLinearGradient(-20, -70, 38, -36);
    grad.addColorStop(0, "#88b75c");
    grad.addColorStop(0.45, "#6b9e4d");
    grad.addColorStop(1, "#4d7c3c");
    ctx.beginPath();
    ctx.moveTo(-18, -37);
    ctx.bezierCurveTo(-27, -52, -19, -72, 1, -76);
    ctx.bezierCurveTo(22, -80, 39, -68, 39, -55);
    ctx.bezierCurveTo(47, -45, 36, -33, 20, -34);
    ctx.bezierCurveTo(8, -28, -9, -29, -18, -37);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(47, 71, 34, 0.6)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Pod bump ridges
    ctx.strokeStyle = "rgba(53, 93, 42, 0.35)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(-3 + i * 12, -61 + i * 1.5, 10 - i * 1.2, -1.45, 1.1);
      ctx.stroke();
    }
    // Peas peeking on top
    fillEllipse(ctx, -2, -67, 6, 5.2, "#a7cb72", "rgba(47, 71, 34, 0.4)", 1);
    fillEllipse(ctx, 11, -68, 5.4, 4.6, "#9dc568", "rgba(47, 71, 34, 0.4)", 1);

    // Snout
    const snout = ctx.createRadialGradient(33, -54, 2, 32, -53, 15);
    snout.addColorStop(0, "#3f6d42");
    snout.addColorStop(0.72, "#4e8148");
    snout.addColorStop(1, "#3d6b40");
    ctx.beginPath();
    ctx.arc(32, -53, 13, 0, TAU);
    ctx.fillStyle = snout;
    ctx.fill();
    ctx.strokeStyle = "rgba(46, 69, 34, 0.62)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    fillEllipse(ctx, 36, -53, 5, 6.6, "#2e4b33");
    fillEllipse(ctx, 34, -55, 2, 2.3, "rgba(149, 191, 131, 0.42)");
    // Cheek eye
    fillEllipse(ctx, 15, -54, 5, 5.4, "#f7f0d0");
    fillEllipse(ctx, 17, -54, 2.6, 3, "#263d2a");
    fillEllipse(ctx, 18, -55.2, 0.9, 1.1, "#fff");
    ctx.strokeStyle = "rgba(48, 74, 40, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(17, -44, 5, 0.2, Math.PI - 0.3);
    ctx.stroke();
    fillEllipse(ctx, 26, -46, 2.6, 1.4, "rgba(210, 116, 85, 0.28)");

    // Little hands
    leaf(ctx, -8, -43, 17, 6, 2.55, "#4b7a3a", "#709851");
    if (recoil > 0.2) {
      ctx.globalAlpha = 0.6;
      fillEllipse(ctx, 43, -55, 5, 2.2, "rgba(220, 244, 161, 0.4)");
    }
    ctx.restore();
  }

  function drawFrostbell(ctx, t, opts) {
    const o = opts || {};
    const phase = o.phase || 0;
    const recoil = o.recoil || 0;
    const bob = Math.sin(t * 1.65 + phase) * 1.5;
    shadow(ctx, 26, 7, 0.16);
    ctx.save();
    ctx.translate(0, bob);

    stem(ctx, [[0, 0], [2, -23], [-7, -43], [2, -60]], 5, "#416f4c");
    leaf(ctx, -1, -19, 24, 8, 2.82, "#4d7b5a", "#72956a");
    leaf(ctx, 2, -27, 20, 7, -0.48, "#477454", "#6d9466");
    dirtMound(ctx, 42, 8);

    ctx.save();
    ctx.translate(-recoil * 4, 0);
    ctx.rotate(-0.08 + Math.sin(t * 1.5 + phase) * 0.035);
    const bellX = 12;
    const bellY = -61;
    // Frosty aura
    if (o.glow) {
      ctx.globalAlpha = 0.18;
      fillEllipse(ctx, bellX + 4, bellY + 4, 35, 31, "#bdeff3");
      ctx.globalAlpha = 1;
    }
    // Bell body
    const bg = ctx.createLinearGradient(bellX - 18, bellY - 20, bellX + 19, bellY + 22);
    bg.addColorStop(0, "#d7f3ee");
    bg.addColorStop(0.4, "#8dced3");
    bg.addColorStop(1, "#5fa9b5");
    ctx.beginPath();
    ctx.moveTo(bellX - 13, bellY - 19);
    ctx.bezierCurveTo(bellX + 10, bellY - 27, bellX + 23, bellY - 9, bellX + 21, bellY + 8);
    ctx.lineTo(bellX + 27, bellY + 15);
    ctx.lineTo(bellX + 20, bellY + 22);
    ctx.lineTo(bellX + 13, bellY + 15);
    ctx.lineTo(bellX + 5, bellY + 25);
    ctx.lineTo(bellX - 4, bellY + 15);
    ctx.lineTo(bellX - 13, bellY + 21);
    ctx.lineTo(bellX - 19, bellY + 9);
    ctx.bezierCurveTo(bellX - 26, bellY - 7, bellX - 21, bellY - 14, bellX - 13, bellY - 19);
    ctx.closePath();
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = "rgba(47, 84, 71, 0.45)";
    ctx.lineWidth = 1.7;
    ctx.stroke();

    // Icy rim highlights
    ctx.strokeStyle = "rgba(233, 255, 249, 0.72)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bellX - 17, bellY + 6);
    ctx.quadraticCurveTo(bellX, bellY + 15, bellX + 19, bellY + 4);
    ctx.stroke();

    // icicles
    for (let i = 0; i < 4; i += 1) {
      const ix = bellX - 10 + i * 8;
      const len = 5 + (i % 2) * 4;
      ctx.beginPath();
      ctx.moveTo(ix, bellY + 17);
      ctx.lineTo(ix + 2.2, bellY + 17 + len);
      ctx.lineTo(ix + 4.2, bellY + 16.5);
      ctx.closePath();
      ctx.fillStyle = "rgba(218, 251, 249, 0.82)";
      ctx.fill();
    }

    face(ctx, bellX, bellY + 1, { eyeGap: 7, eyeR: 3, eyeColor: "#3b6265", mouthY: 8, smile: 3.4, mouthOpen: !!o.fire });
    fillEllipse(ctx, bellX - 12, bellY + 6, 2.8, 1.5, "rgba(115, 174, 178, 0.4)");
    fillEllipse(ctx, bellX + 13, bellY + 6, 2.8, 1.5, "rgba(115, 174, 178, 0.4)");

    // cap leaf
    leaf(ctx, bellX - 9, bellY - 18, 17, 6.8, -2.3, "#3f7155", "#629276");
    leaf(ctx, bellX + 2, bellY - 23, 14, 5.8, -0.54, "#3a6850", "#5d8d71");
    // floating snowflakes
    for (let i = 0; i < 3; i += 1) {
      const sx = bellX + 24 + Math.sin(t * 1.3 + i * 2.1 + phase) * 7;
      const sy = bellY - 20 + i * 14 + Math.cos(t * 1.7 + i) * 4;
      ctx.globalAlpha = 0.5 + Math.sin(t * 2 + i) * 0.2;
      sparkle(ctx, sx, sy, 2.7, "#d9f6f3", 0.9);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.restore();
  }

  function drawNutshell(ctx, t, opts) {
    const o = opts || {};
    const phase = o.phase || 0;
    const hp = o.hpRatio == null ? 1 : clamp(o.hpRatio, 0, 1);
    const hurt = hp < 0.55;
    const bob = Math.sin(t * 1.3 + phase) * 0.8;
    shadow(ctx, 34, 8, 0.19);
    ctx.save();
    ctx.translate(Math.sin(t * 9 + phase) * (hurt ? 0.5 : 0), bob);

    // Little feet
    fillEllipse(ctx, -16, -2, 10, 4.5, "#7d5b39", "rgba(66, 47, 30, 0.45)", 1);
    fillEllipse(ctx, 16, -2, 10, 4.5, "#7d5b39", "rgba(66, 47, 30, 0.45)", 1);

    // Nut body
    const body = ctx.createLinearGradient(-25, -73, 28, -4);
    body.addColorStop(0, "#d2a76f");
    body.addColorStop(0.48, "#bc8a54");
    body.addColorStop(1, "#94663d");
    ctx.beginPath();
    ctx.moveTo(-28, -12);
    ctx.bezierCurveTo(-44, -31, -36, -65, -15, -76);
    ctx.bezierCurveTo(2, -84, 25, -74, 32, -55);
    ctx.bezierCurveTo(40, -34, 34, -13, 16, -6);
    ctx.bezierCurveTo(1, 0, -15, -3, -28, -12);
    ctx.closePath();
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = "rgba(80, 53, 31, 0.55)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Belly highlight
    ctx.globalAlpha = 0.36;
    fillEllipse(ctx, -3, -38, 20, 25, "#f3cf93");
    ctx.globalAlpha = 1;

    // Cap
    ctx.beginPath();
    ctx.moveTo(-37, -57);
    ctx.bezierCurveTo(-30, -83, 20, -93, 38, -65);
    ctx.bezierCurveTo(22, -53, -15, -48, -37, -57);
    ctx.closePath();
    const cap = ctx.createLinearGradient(-30, -80, 25, -55);
    cap.addColorStop(0, "#557d40");
    cap.addColorStop(1, "#355b35");
    ctx.fillStyle = cap;
    ctx.fill();
    ctx.strokeStyle = "rgba(42, 68, 36, 0.55)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = "rgba(223, 211, 151, 0.28)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-24 + i * 12, -68);
      ctx.quadraticCurveTo(-20 + i * 12, -77, -14 + i * 12, -70);
      ctx.stroke();
    }
    // Stem and beanie leaf
    stem(ctx, [[0, -86], [4, -94], [9, -101]], 2.3, "#547b3f");
    leaf(ctx, 8, -98, 15, 5.8, -0.2, "#537b40", "#7ea35e");

    // Face
    face(ctx, 0, -45, {
      eyeGap: 10,
      eyeR: 3.7,
      eyeColor: "#493a26",
      brow: hurt,
      mouthY: 10,
      smile: hurt ? 2.3 : 4.4,
      mouthOpen: hurt,
      stroke: "#533f28"
    });
    if (hurt) {
      // Crack lines
      ctx.strokeStyle = "rgba(88, 55, 31, 0.55)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(20, -64);
      ctx.lineTo(15, -56);
      ctx.lineTo(22, -48);
      ctx.lineTo(17, -40);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-22, -31);
      ctx.lineTo(-16, -25);
      ctx.lineTo(-21, -17);
      ctx.stroke();
    }
    // Hands
    ctx.strokeStyle = "#6c4c30";
    ctx.lineWidth = 2.7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-27, -38);
    ctx.quadraticCurveTo(-43, -32, -38, -22);
    ctx.moveTo(30, -34);
    ctx.quadraticCurveTo(43, -26, 39, -19);
    ctx.stroke();
    ctx.restore();
  }

  function drawPopberry(ctx, t, opts) {
    const o = opts || {};
    const phase = o.phase || 0;
    const fuse = o.fuse == null ? 0 : o.fuse;
    const shake = Math.sin(t * 23 + phase) * (1.2 + fuse * 2.2);
    shadow(ctx, 29, 7, 0.17);
    ctx.save();
    ctx.translate(shake, 0);
    dirtMound(ctx, 48, 8);

    // Stems and leaves
    stem(ctx, [[0, -2], [-2, -25], [3, -45]], 3, "#44703b");
    leaf(ctx, 0, -15, 25, 9, 2.85, "#4c7b41", "#779a5a");
    leaf(ctx, 1, -23, 22, 8, -0.55, "#47743d", "#709456");

    // Berry cluster
    const berries = [
      { x: -14, y: -29, r: 16, c1: "#d85f5c", c2: "#a83c45" },
      { x: 13, y: -29, r: 17, c1: "#ce525b", c2: "#96343f" },
      { x: -1, y: -47, r: 20, c1: "#e46f63", c2: "#b34147" }
    ];
    berries.forEach(function (b, i) {
      const bg = ctx.createRadialGradient(b.x - 5, b.y - 7, 2, b.x, b.y, b.r + 3);
      bg.addColorStop(0, b.c1);
      bg.addColorStop(0.72, b.c2);
      bg.addColorStop(1, "#7b2d38");
      fillEllipse(ctx, b.x, b.y, b.r, b.r * 0.94, bg, "rgba(88, 32, 37, 0.55)", 1.2);
      ctx.globalAlpha = 0.35;
      fillEllipse(ctx, b.x - 6, b.y - 7, b.r * 0.28, b.r * 0.2, "#ffe6bc");
      ctx.globalAlpha = 1;
      // little seeds
      for (let j = 0; j < 3; j += 1) {
        fillEllipse(ctx, b.x + Math.cos(j * 2.1 + i) * b.r * 0.55, b.y + Math.sin(j * 1.7 + i) * b.r * 0.5, 1.1, 1.4, "rgba(255, 222, 158, 0.34)");
      }
    });
    // Leafy crown
    leaf(ctx, -8, -59, 20, 7, 2.35, "#3f6b37", "#63894a");
    leaf(ctx, 8, -62, 18, 6, 0.55, "#3a6534", "#628a48");
    // Face on top berry
    ctx.strokeStyle = "#5a252c";
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-11, -53);
    ctx.lineTo(-4, -50);
    ctx.moveTo(11, -53);
    ctx.lineTo(4, -50);
    ctx.stroke();
    fillEllipse(ctx, -5, -47, 2.6, 3, "#3e2022");
    fillEllipse(ctx, 6, -47, 2.6, 3, "#3e2022");
    fillEllipse(ctx, -4, -48, 0.9, 1, "rgba(255,255,255,0.5)");
    fillEllipse(ctx, 7, -48, 0.9, 1, "rgba(255,255,255,0.5)");
    ctx.beginPath();
    ctx.arc(0, -37, 4.8, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Fuse
    ctx.beginPath();
    ctx.moveTo(0, -66);
    ctx.bezierCurveTo(-4, -77, 8, -78, 6, -87);
    ctx.strokeStyle = "#4f633c";
    ctx.lineWidth = 2;
    ctx.stroke();
    if (Math.sin(t * 18 + phase) > -0.2) {
      sparkle(ctx, 7 + Math.sin(t * 14) * 3, -91, 5.5 + fuse * 2, "#ffe07c", 0.95);
      ctx.globalAlpha = 0.5;
      fillEllipse(ctx, 8, -91, 8, 5, "rgba(255, 196, 74, 0.35)");
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawThornspud(ctx, t, opts) {
    const o = opts || {};
    const phase = o.phase || 0;
    const armed = !!o.armed;
    const arming = !!o.arming;
    const bob = armed ? Math.sin(t * 2.5 + phase) * 0.8 : 0;
    shadow(ctx, 26, 6, 0.14);
    ctx.save();
    ctx.translate(0, bob);
    dirtMound(ctx, 55, 14);

    // Potato body peeking out
    const bodyGrad = ctx.createLinearGradient(-20, -38, 20, -4);
    bodyGrad.addColorStop(0, "#c89a63");
    bodyGrad.addColorStop(0.6, "#a97b4c");
    bodyGrad.addColorStop(1, "#7d5839");
    ctx.beginPath();
    ctx.moveTo(-24, -4);
    ctx.bezierCurveTo(-32, -22, -18, -38, 2, -36);
    ctx.bezierCurveTo(22, -34, 29, -18, 22, -4);
    ctx.closePath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(70, 49, 30, 0.48)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // eyes
    ctx.strokeStyle = "#4b3a26";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    if (armed) {
      fillEllipse(ctx, -9, -20, 3.3, 3.8, "#3b3024");
      fillEllipse(ctx, 9, -20, 3.3, 3.8, "#3b3024");
      fillEllipse(ctx, -8, -21, 1, 1.2, "#fff2cd");
      fillEllipse(ctx, 10, -21, 1, 1.2, "#fff2cd");
      ctx.beginPath();
      ctx.arc(0, -11, 4, 0.12, Math.PI - 0.12);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-13, -21);
      ctx.quadraticCurveTo(-9, -18, -5, -21);
      ctx.moveTo(5, -21);
      ctx.quadraticCurveTo(9, -18, 13, -21);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -11, 2.3, 0.1, Math.PI - 0.1);
      ctx.stroke();
    }

    // leaves - droop before armed
    if (armed) {
      // thorns
      ctx.fillStyle = "#e1b45e";
      for (let i = 0; i < 7; i += 1) {
        const a = -2.7 + i * 0.44;
        const bx = Math.cos(a) * 19;
        const by = -19 + Math.sin(a) * 14;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(-3, 2);
        ctx.lineTo(0, -10 - (i % 3) * 2);
        ctx.lineTo(5, 2);
        ctx.closePath();
        ctx.fillStyle = i % 2 ? "#e0b15b" : "#f0c874";
        ctx.fill();
        ctx.strokeStyle = "rgba(96, 64, 29, 0.5)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();
      }
      leaf(ctx, -17, -26, 20, 7, 2.65, "#4d7b3d", "#7aa05a");
      leaf(ctx, 14, -24, 17, 6, -0.45, "#4a763b", "#739b58");
      // armed pulse
      ctx.globalAlpha = 0.45 + Math.sin(t * 4.5 + phase) * 0.25;
      ctx.strokeStyle = "#f2c966";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, -8, 31, 13, 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      leaf(ctx, -8, -20, 21, 7, 2.4, "#4f7c40", "#789c5b");
      leaf(ctx, 8, -22, 18, 6, 0.55, "#4b763d", "#729758");
      if (arming) {
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = "#e9ce8a";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, -7, 27, 11, 0, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  function drawTwinpod(ctx, t, opts) {
    const o = opts || {};
    const phase = o.phase || 0;
    const recoil = o.recoil || 0;
    const bob = Math.sin(t * 1.9 + phase) * 1.2;
    shadow(ctx, 31, 7, 0.17);
    ctx.save();
    ctx.translate(0, bob);
    dirtMound(ctx, 48, 8);
    stem(ctx, [[0, 0], [0, -18], [2, -35]], 5.5, "#4a753b");
    leaf(ctx, -1, -13, 29, 10, 2.78, "#537f41", "#7ba35a");
    leaf(ctx, 1, -22, 25, 9, -0.52, "#4e7a3e", "#749b56");

    // Back pod
    drawPodHead(ctx, -17, -59, -0.13, recoil * 0.7, "#5d9170", "#417252", phase + 1.2);
    // Front pod
    drawPodHead(ctx, 15, -68, 0.1, recoil, "#6f9d50", "#4e7b3b", phase);
    leaf(ctx, 3, -52, 19, 6.5, 2.28, "#447137", "#6c9252");
    ctx.restore();
  }

  function drawPodHead(ctx, x, y, rot, recoil, fillA, fillB, phase) {
    ctx.save();
    ctx.translate(x - recoil * 5, y);
    ctx.rotate(rot);
    const g = ctx.createLinearGradient(-18, -12, 26, 12);
    g.addColorStop(0, fillA);
    g.addColorStop(1, fillB);
    ctx.beginPath();
    ctx.moveTo(-18, 8);
    ctx.bezierCurveTo(-26, -10, -10, -27, 8, -25);
    ctx.bezierCurveTo(24, -23, 31, -8, 25, 5);
    ctx.bezierCurveTo(18, 17, -7, 20, -18, 8);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(43, 70, 34, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // snout
    fillEllipse(ctx, 23, -4, 8.5, 9.5, "#345c3d", "rgba(44, 71, 36, 0.55)", 1.2);
    fillEllipse(ctx, 25, -4, 4.2, 5.4, "#233c2b");
    // eye
    fillEllipse(ctx, 7, -4, 4.3, 4.6, "#f8f0d2");
    fillEllipse(ctx, 8.4, -4, 2.2, 2.6, "#253d2a");
    fillEllipse(ctx, 9.2, -5, 0.8, 1, "#fff");
    // ridge
    ctx.beginPath();
    ctx.arc(-4, -2, 11, -1.25, 1.1);
    ctx.strokeStyle = "rgba(44, 76, 36, 0.28)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawDandelion(ctx, t, opts) {
    const o = opts || {};
    const phase = o.phase || 0;
    const recoil = o.recoil || 0;
    const bob = Math.sin(t * 1.55 + phase) * 1.4;
    shadow(ctx, 33, 8, 0.17);
    ctx.save();
    ctx.translate(0, bob);
    dirtMound(ctx, 50, 9);
    stem(ctx, [[0, 0], [2, -21], [-3, -40], [3, -52]], 6.5, "#4c783b");
    leaf(ctx, -1, -15, 31, 11, 2.86, "#517e3c", "#7ba158");
    leaf(ctx, 3, -24, 28, 10, -0.5, "#4b7739", "#769d55");
    leaf(ctx, -3, -32, 20, 8, 2.55, "#446d35", "#6d924d");

    // Mortar cradle
    ctx.save();
    ctx.translate(-recoil * 6, 0);
    ctx.rotate(-0.1 + Math.sin(t * 1.4 + phase) * 0.03);
    const cx = 8;
    const cy = -66;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 21, 27, 12, -0.08, 0, TAU);
    ctx.fillStyle = "#3d673f";
    ctx.fill();
    ctx.strokeStyle = "rgba(37, 60, 31, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Dandelion fluff ball
    const glow = o.fire ? 0.55 : 0.25;
    ctx.globalAlpha = glow;
    fillEllipse(ctx, cx, cy, 37, 35, "rgba(255, 236, 171, 0.35)");
    ctx.globalAlpha = 1;
    for (let i = 0; i < 20; i += 1) {
      const a = (i / 20) * TAU + Math.sin(t * 0.65 + phase) * 0.03;
      const len = 24 + (i % 4) * 3;
      const px = cx + Math.cos(a) * 7;
      const py = cy + Math.sin(a) * 6;
      const ex = cx + Math.cos(a) * len;
      const ey = cy + Math.sin(a) * len * 0.93;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(cx + Math.cos(a) * len * 0.6, cy + Math.sin(a) * len * 0.6 - 2, ex, ey);
      ctx.strokeStyle = "rgba(255, 246, 208, 0.65)";
      ctx.lineWidth = 0.85;
      ctx.stroke();
      fillEllipse(ctx, ex, ey, 3.2, 2.6, "#fff4d0");
      fillEllipse(ctx, ex - 0.7, ey - 0.7, 1.2, 1, "rgba(255, 255, 255, 0.9)");
    }
    const core = ctx.createRadialGradient(cx - 5, cy - 4, 2, cx, cy, 20);
    core.addColorStop(0, "#f7dc8b");
    core.addColorStop(0.6, "#bd9a51");
    core.addColorStop(1, "#8e743d");
    fillEllipse(ctx, cx, cy, 18, 17, core, "rgba(95, 70, 34, 0.46)", 1.3);
    face(ctx, cx, cy - 2, { eyeGap: 6.5, eyeR: 2.7, eyeColor: "#3d3524", mouthY: 7, smile: 3.1 });
    // mortar leaves around base of bloom
    leaf(ctx, cx - 18, cy + 20, 22, 8, 2.5, "#3d653a", "#63864f");
    leaf(ctx, cx + 16, cy + 20, 22, 8, 0.55, "#3d653a", "#63864f");
    ctx.restore();
    ctx.restore();
  }

  function drawRipplily(ctx, t, opts) {
    const o = opts || {};
    const phase = o.phase || 0;
    const recoil = o.recoil || 0;
    const bob = Math.sin(t * 1.8 + phase) * 1.2;
    shadow(ctx, 32, 7, 0.15);
    ctx.save();
    ctx.translate(0, bob);

    // A wet little pond instead of a dirt mound.
    ctx.globalAlpha = 0.3;
    fillEllipse(ctx, 0, -2, 39, 10, "rgba(179, 235, 227, 0.46)");
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "rgba(214, 248, 236, 0.7)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 2; i += 1) {
      ctx.beginPath();
      ctx.ellipse(0, -2, 27 + i * 10 + Math.sin(t * 1.4 + i) * 2, 6 + i * 2, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Notched lily pads.
    function pad(x, y, rx, ry, rot, color, dark) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(1, ry / rx);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, rx, 0.28, TAU - 0.28);
      ctx.closePath();
      const pg = ctx.createLinearGradient(-rx, 0, rx, 0);
      pg.addColorStop(0, color);
      pg.addColorStop(1, dark);
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.strokeStyle = "rgba(40, 74, 52, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    pad(-22, -4, 25, 7.5, -0.09, "#6aa87a", "#42784f");
    pad(23, -2, 22, 6.5, 0.16, "#73ad7c", "#4b7c52");

    // Stems and curling leaves.
    stem(ctx, [[0, -2], [2, -24], [-5, -40], [1, -53]], 4.6, "#4b815e");
    leaf(ctx, -1, -20, 25, 8, 2.65, "#4f8656", "#78a978");
    leaf(ctx, 0, -30, 19, 6.5, -0.48, "#4a8054", "#74a37a");

    // Lotus head with a small trumpet snout.
    ctx.save();
    ctx.translate(-recoil * 5, 0);
    const hx = 2;
    const hy = -58 + Math.sin(t * 1.7 + phase) * 1.2;
    // Back petals
    for (let i = 0; i < 5; i += 1) {
      const a = -2.7 + i * 0.55;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(a);
      const pg = ctx.createLinearGradient(0, 0, 31, 0);
      pg.addColorStop(0, "#fbe2e4");
      pg.addColorStop(0.52, "#eaa4b7");
      pg.addColorStop(1, "#b86c8a");
      ctx.beginPath();
      ctx.moveTo(2, -5);
      ctx.bezierCurveTo(12, -16, 27, -11, 31, 0);
      ctx.bezierCurveTo(22, 4, 10, 5, 2, 5);
      ctx.closePath();
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.strokeStyle = "rgba(45, 86, 87, 0.32)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    // Trumpet flower
    const tg = ctx.createRadialGradient(hx - 9, hy - 7, 2, hx, hy, 22);
    tg.addColorStop(0, "#fff8f0");
    tg.addColorStop(0.5, "#f3c6ce");
    tg.addColorStop(1, "#c27c96");
    ctx.beginPath();
    ctx.ellipse(hx, hy, 21, 18, -0.07, 0, TAU);
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.strokeStyle = "rgba(47, 91, 88, 0.55)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // Lily collar petals
    for (let i = 0; i < 4; i += 1) {
      ctx.save();
      ctx.translate(hx, hy + 25);
      ctx.rotate(-1.3 + i * 0.85);
      leaf(ctx, 0, 0, 19, 7, 0, "#5f9d8c", "#9dcfae");
      ctx.restore();
    }
    // Trumpet mouth to the right
    const mx = hx + 22;
    const my = hy + 1;
    fillEllipse(ctx, mx, my, 9, 8.5, "#72505d", "rgba(83, 53, 63, 0.55)", 1.2);
    fillEllipse(ctx, mx + 2, my, 4.5, 4.6, "#3e2b36");
    fillEllipse(ctx, mx + 1, my - 1.2, 1.4, 1.5, "rgba(255, 230, 232, 0.38)");
    face(ctx, hx - 2, hy - 3, { eyeGap: 7.8, eyeR: 3.1, eyeColor: "#584248", mouthY: 10, smile: 3.8 });
    // Water droplets orbiting the flower
    for (let i = 0; i < 3; i += 1) {
      const a = t * 0.9 + i * 2.2 + phase;
      const bx = hx + Math.cos(a) * (28 + i * 3);
      const by = hy + Math.sin(a) * (16 + i * 2);
      ctx.globalAlpha = 0.6;
      fillEllipse(ctx, bx, by, 3.2, 4.2, "rgba(204, 246, 240, 0.85)");
      fillEllipse(ctx, bx - 1, by - 1.4, 1, 1.2, "rgba(255, 255, 255, 0.8)");
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.restore();
  }

  function drawPrismbloom(ctx, t, opts) {
    const o = opts || {};
    const phase = o.phase || 0;
    const recoil = o.recoil || 0;
    const bob = Math.sin(t * 1.6 + phase) * 1.1;
    shadow(ctx, 28, 7, 0.16);
    ctx.save();
    ctx.translate(0, bob);
    dirtMound(ctx, 43, 8);
    stem(ctx, [[0, 0], [1, -25], [-3, -45], [2, -59]], 5.2, "#4e795d");
    leaf(ctx, -1, -18, 27, 9, 2.75, "#4f7d59", "#79a175");
    leaf(ctx, 2, -29, 22, 8, -0.5, "#4a7755", "#759a70");

    ctx.save();
    ctx.translate(-recoil * 4, -1);
    const cx = 4;
    const cy = -73 + Math.sin(t * 1.4 + phase) * 1.2;
    // Prism petals
    const shards = [
      { x: -18, y: 12, r: -0.35, w: 17, h: 31, c1: "#a18bd0", c2: "#6b5a9c" },
      { x: 15, y: 11, r: 0.28, w: 15, h: 25, c1: "#8cd6cf", c2: "#4f9e9d" },
      { x: -9, y: -22, r: 0.1, w: 14, h: 26, c1: "#c7b1e6", c2: "#8069ad" },
      { x: 16, y: -19, r: 0.45, w: 12, h: 21, c1: "#a9e4dd", c2: "#5da7a8" }
    ];
    for (const shard of shards) {
      ctx.save();
      ctx.translate(cx + shard.x, cy + shard.y);
      ctx.rotate(shard.r + Math.sin(t * 0.9 + phase) * 0.025);
      const g = ctx.createLinearGradient(-shard.w / 2, -shard.h / 2, shard.w / 2, shard.h / 2);
      g.addColorStop(0, shard.c1);
      g.addColorStop(1, shard.c2);
      ctx.beginPath();
      ctx.moveTo(0, -shard.h / 2);
      ctx.lineTo(shard.w * 0.55, 0);
      ctx.lineTo(0, shard.h / 2);
      ctx.lineTo(-shard.w * 0.55, 0);
      ctx.closePath();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = "rgba(53, 67, 94, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "rgba(255, 247, 201, 0.7)";
      ctx.beginPath();
      ctx.moveTo(0, -shard.h / 2);
      ctx.lineTo(shard.w * 0.18, 0);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    // Faceted golden core
    const core = ctx.createRadialGradient(cx - 4, cy - 5, 1, cx, cy, 19);
    core.addColorStop(0, "#fffceb");
    core.addColorStop(0.32, "#ffe6a1");
    core.addColorStop(0.72, "#d7a844");
    core.addColorStop(1, "#8a713c");
    ctx.beginPath();
    ctx.moveTo(cx, cy - 19);
    ctx.lineTo(cx + 16, cy - 2);
    ctx.lineTo(cx + 3, cy + 18);
    ctx.lineTo(cx - 16, cy + 3);
    ctx.closePath();
    ctx.fillStyle = core;
    ctx.fill();
    ctx.strokeStyle = "rgba(68, 64, 46, 0.46)";
    ctx.lineWidth = 1.3;
    ctx.stroke();
    face(ctx, cx, cy - 3, { eyeGap: 5.8, eyeR: 2.5, eyeColor: "#4b452f", mouthY: 7, smile: 2.9 });
    // Light crown
    ctx.globalAlpha = 0.35 + Math.max(0, Math.sin(t * 2 + phase)) * 0.2;
    ctx.strokeStyle = "#f5e9b5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, TAU);
    ctx.stroke();
    sparkle(ctx, cx + 26, cy - 20, 3.8, "#fff4c2", 0.65);
    sparkle(ctx, cx - 27, cy + 8, 2.3, "#cdbcf0", 0.55);
    ctx.globalAlpha = 1;
    if (o.fire) {
      ctx.globalAlpha = 0.55;
      fillEllipse(ctx, cx + 28, cy, 34, 4.5, "rgba(227, 238, 255, 0.5)");
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.restore();
  }

  function drawDawnbell(ctx, t, opts) {
    const o = opts || {};
    const phase = o.phase || 0;
    const bob = Math.sin(t * 1.45 + phase) * 1.4;
    shadow(ctx, 36, 8, 0.18);
    ctx.save();
    ctx.translate(0, bob);
    dirtMound(ctx, 56, 9);
    stem(ctx, [[0, 0], [-2, -19], [2, -36], [0, -48]], 7, "#4e7a49");
    leaf(ctx, -2, -14, 32, 11, 2.82, "#567f41", "#81a45b");
    leaf(ctx, 3, -23, 27, 10, -0.5, "#507a3d", "#7a9d56");
    leaf(ctx, -4, -33, 19, 7, 2.5, "#48723a", "#70954f");

    const cx = 1;
    const cy = -65;
    // Halo
    const halo = ctx.createRadialGradient(cx, cy, 5, cx, cy, 48);
    halo.addColorStop(0, "rgba(255, 242, 183, 0.34)");
    halo.addColorStop(1, "rgba(255, 200, 106, 0)");
    fillEllipse(ctx, cx, cy, 48, 46, halo);

    // Crown leaves behind the bell.
    for (let i = 0; i < 5; i += 1) {
      ctx.save();
      ctx.translate(cx, cy - 32);
      ctx.rotate(-1.25 + i * 0.63);
      leaf(ctx, 0, 0, 20, 7, 0, "#52784a", "#93a96e");
      ctx.restore();
    }

    // Bell body
    const bell = ctx.createLinearGradient(cx - 30, cy - 35, cx + 29, cy + 30);
    bell.addColorStop(0, "#fff6d7");
    bell.addColorStop(0.3, "#f6d37c");
    bell.addColorStop(0.67, "#e9b44e");
    bell.addColorStop(1, "#bd8232");
    ctx.beginPath();
    ctx.moveTo(cx - 17, cy - 31);
    ctx.bezierCurveTo(cx - 30, cy - 17, cx - 30, cy + 12, cx - 33, cy + 24);
    ctx.quadraticCurveTo(cx - 31, cy + 33, cx - 17, cy + 32);
    ctx.quadraticCurveTo(cx, cy + 27, cx + 17, cy + 32);
    ctx.quadraticCurveTo(cx + 31, cy + 33, cx + 33, cy + 24);
    ctx.bezierCurveTo(cx + 30, cy + 12, cx + 30, cy - 17, cx + 17, cy - 31);
    ctx.quadraticCurveTo(cx, cy - 40, cx - 17, cy - 31);
    ctx.closePath();
    ctx.fillStyle = bell;
    ctx.fill();
    ctx.strokeStyle = "rgba(105, 66, 24, 0.55)";
    ctx.lineWidth = 1.7;
    ctx.stroke();

    // Bell bands and shine
    ctx.strokeStyle = "rgba(255, 248, 207, 0.55)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy - 15);
    ctx.quadraticCurveTo(cx, cy - 4, cx + 25, cy - 15);
    ctx.moveTo(cx - 29, cy + 8);
    ctx.quadraticCurveTo(cx, cy + 19, cx + 29, cy + 8);
    ctx.stroke();
    ctx.fillStyle = "rgba(110, 75, 30, 0.32)";
    fillEllipse(ctx, cx, cy + 29, 33, 6.5, "rgba(110, 75, 30, 0.32)");
    // Clapper
    ctx.save();
    ctx.translate(cx + Math.sin(t * 2.1 + phase) * 3, cy + 39);
    ctx.strokeStyle = "#7e633a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 4);
    ctx.stroke();
    fillEllipse(ctx, 0, 7, 6, 6, "#f0cd7c", "rgba(100, 67, 26, 0.45)", 1);
    fillEllipse(ctx, -2, 5, 2, 1.4, "rgba(255, 250, 214, 0.8)");
    ctx.restore();

    // Face on the bell
    face(ctx, cx, cy - 6, { eyeGap: 9, eyeR: 3.4, eyeColor: "#5b4828", mouthY: 13, smile: 4.2, brow: !!o.fire });
    fillEllipse(ctx, cx - 17, cy + 7, 3.1, 1.7, "rgba(195, 103, 65, 0.25)");
    fillEllipse(ctx, cx + 17, cy + 7, 3.1, 1.7, "rgba(195, 103, 65, 0.25)");
    sparkle(ctx, cx - 25, cy - 27, 3.4, "#fff5c2", 0.65);
    sparkle(ctx, cx + 27, cy - 6, 2.4, "#fff0a8", 0.5);
    if (o.fire) {
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = "#ffecab";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 4, 47 + Math.sin(t * 4) * 4, 39, 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  const PLANT_DRAWERS = {
    sunbud: drawSunbud,
    peapod: drawPeapod,
    frostbell: drawFrostbell,
    nutshell: drawNutshell,
    popberry: drawPopberry,
    thornspud: drawThornspud,
    twinpod: drawTwinpod,
    dandelion: drawDandelion,
    ripplily: drawRipplily,
    prismbloom: drawPrismbloom,
    dawnbell: drawDawnbell
  };

  function drawPlant(ctx, type, x, y, scale, time, opts) {
    const drawer = PLANT_DRAWERS[type] || PLANT_DRAWERS.sunbud;
    const s = scale == null ? 1 : scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    drawer(ctx, time || 0, opts || {});
    ctx.restore();
  }

  /* ---------------------------------------------------------
     Night-mold creatures
     --------------------------------------------------------- */

  const ENEMY_PALETTES = {
    mutterling: { body: "#526b61", belly: "#87967b", dark: "#344d45", eye: "#f5e9b4", accent: "#c8b471" },
    crateling: { body: "#5b6b58", belly: "#918d70", dark: "#3c4b3d", eye: "#f7ebbd", accent: "#b89b69" },
    canhead: { body: "#596a63", belly: "#8b927c", dark: "#394a44", eye: "#f3e9b5", accent: "#b8b3a1" },
    zippy: { body: "#44746c", belly: "#7ba08a", dark: "#2c4d4a", eye: "#f7e8a7", accent: "#d0785b" },
    herald: { body: "#4d6258", belly: "#8d9479", dark: "#32443a", eye: "#f8eab8", accent: "#b95452" },
    boss: { body: "#454157", belly: "#75687a", dark: "#2b293c", eye: "#f5cd68", accent: "#a95b63" },
    mossguard: { body: "#5b6b58", belly: "#999a78", dark: "#384b3b", eye: "#f3e7af", accent: "#89966d" },
    bellwarden: { body: "#3d4f4b", belly: "#737d68", dark: "#243532", eye: "#f5d978", accent: "#a7925a" }
  };

  function mossBlobPath(ctx, cx, cy, rx, ry, seed, wobble) {
    const points = 16;
    const w = wobble == null ? 0.035 : wobble;
    ctx.beginPath();
    for (let i = 0; i <= points; i += 1) {
      const a = (i / points) * TAU;
      const r = 1 + Math.sin(a * 3 + seed) * w + Math.sin(a * 5.3 + seed * 2.7) * w * 0.54;
      const x = cx + Math.cos(a) * rx * r;
      const y = cy + Math.sin(a) * ry * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawEnemyBaseBody(ctx, palette, t, opts, slim) {
    const phase = opts.phase || 0;
    const walkRate = opts.type === "zippy" ? 11 : 5.6;
    const walk = Math.sin(t * walkRate + phase);
    const bob = Math.abs(walk) * 2.6;
    const bodyRx = slim ? 22 : 27;
    const bodyRy = slim ? 32 : 30;

    // legs
    ctx.strokeStyle = palette.dark;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-12, -17 + bob);
    ctx.quadraticCurveTo(-17 - walk * 4, -7, -18 - walk * 7, 0);
    ctx.moveTo(12, -17 + bob);
    ctx.quadraticCurveTo(17 + walk * 4, -7, 18 + walk * 7, 0);
    ctx.stroke();
    fillEllipse(ctx, -18 - walk * 7, 0, 11, 5, palette.dark);
    fillEllipse(ctx, 18 + walk * 7, 0, 11, 5, palette.dark);

    // arms
    ctx.strokeStyle = palette.dark;
    ctx.lineWidth = 4.4;
    ctx.beginPath();
    ctx.moveTo(-19, -44 + bob);
    ctx.quadraticCurveTo(-33, -39 - walk * 3, -35, -27 - walk * 4);
    ctx.moveTo(19, -44 + bob);
    ctx.quadraticCurveTo(33, -39 + walk * 3, 35, -27 + walk * 4);
    ctx.stroke();
    fillEllipse(ctx, -35, -26 - walk * 4, 5, 6, palette.body, palette.dark, 0.8);
    fillEllipse(ctx, 35, -26 + walk * 4, 5, 6, palette.body, palette.dark, 0.8);

    // body
    ctx.save();
    ctx.translate(0, bob);
    mossBlobPath(ctx, 0, -43, bodyRx, bodyRy, phase + 0.3, 0.045);
    const bodyGrad = ctx.createLinearGradient(-bodyRx, -72, bodyRx, -8);
    bodyGrad.addColorStop(0, palette.body);
    bodyGrad.addColorStop(0.62, palette.body);
    bodyGrad.addColorStop(1, palette.dark);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(25, 42, 35, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // belly
    ctx.globalAlpha = 0.34;
    mossBlobPath(ctx, 0, -31, bodyRx * 0.7, bodyRy * 0.54, phase + 3.2, 0.03);
    ctx.fillStyle = palette.belly;
    ctx.fill();
    ctx.globalAlpha = 1;

    // mossy fringe at bottom
    ctx.strokeStyle = palette.dark;
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i += 1) {
      const x = -22 + i * 7.5;
      ctx.beginPath();
      ctx.moveTo(x, -17);
      ctx.lineTo(x - 2 + Math.sin(i) * 2, -10 - (i % 2) * 4);
      ctx.stroke();
    }
    ctx.restore();
    return { bob: bob, walk: walk };
  }

  function drawEnemyMouth(ctx, palette, t, opts) {
    const phase = opts.phase || 0;
    const eating = !!opts.eating;
    const chomp = eating ? (Math.sin(t * 13 + phase) + 1) * 0.5 : 0;
    const mouthY = -28 - chomp * 2.5;
    const open = eating ? 7 + chomp * 5 : 6;
    ctx.beginPath();
    ctx.ellipse(0, mouthY, 14 + chomp * 1.5, open, 0, 0, TAU);
    ctx.fillStyle = "#2b2a25";
    ctx.fill();
    ctx.strokeStyle = palette.dark;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // teeth
    ctx.fillStyle = "#f3e6c0";
    for (let i = 0; i < 4; i += 1) {
      const tx = -9 + i * 6;
      ctx.beginPath();
      ctx.moveTo(tx, mouthY - open + 1);
      ctx.lineTo(tx + 3.5, mouthY - open + 1);
      ctx.lineTo(tx + 2.2, mouthY - open + 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(-6, mouthY + open - 1);
    ctx.lineTo(-2, mouthY + open - 4);
    ctx.lineTo(2, mouthY + open - 1);
    ctx.lineTo(6, mouthY + open - 4);
    ctx.strokeStyle = "rgba(242, 229, 194, 0.8)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // tongue
    if (eating) {
      ctx.globalAlpha = 0.7;
      fillEllipse(ctx, 0, mouthY + open - 2, 6, 3, "#9a5c61");
      ctx.globalAlpha = 1;
    }
  }

  function drawEnemyEyes(ctx, palette, t, opts) {
    const phase = opts.phase || 0;
    const blink = Math.sin(t * 1.7 + phase) > 0.975;
    const y = -57;
    const gap = opts.type === "boss" ? 18 : 10;
    const eyeR = opts.type === "boss" ? 7 : 5.3;
    fillEllipse(ctx, -gap, y, eyeR + 1.4, eyeR + 1.5, "rgba(240, 227, 186, 0.25)");
    fillEllipse(ctx, gap, y, eyeR + 1.4, eyeR + 1.5, "rgba(240, 227, 186, 0.25)");
    if (blink) {
      ctx.strokeStyle = palette.eye;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-gap - 5, y);
      ctx.quadraticCurveTo(-gap, y + 2, -gap + 5, y);
      ctx.moveTo(gap - 5, y);
      ctx.quadraticCurveTo(gap, y + 2, gap + 5, y);
      ctx.stroke();
    } else {
      fillEllipse(ctx, -gap, y, eyeR * 0.8, eyeR, "#f5e8b8");
      fillEllipse(ctx, gap, y, eyeR * 0.8, eyeR, "#f5e8b8");
      fillEllipse(ctx, -gap + 0.8, y + 0.7, eyeR * 0.36, eyeR * 0.55, palette.dark);
      fillEllipse(ctx, gap + 0.8, y + 0.7, eyeR * 0.36, eyeR * 0.55, palette.dark);
      fillEllipse(ctx, -gap + 2, y - 1.2, 1, 1.3, "rgba(255,255,255,0.65)");
      fillEllipse(ctx, gap + 2, y - 1.2, 1, 1.3, "rgba(255,255,255,0.65)");
    }
    // angry mossy brows
    ctx.strokeStyle = palette.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-gap - 6, y - 10);
    ctx.quadraticCurveTo(-gap, y - 13, -gap + 4, y - 10);
    ctx.moveTo(gap + 6, y - 10);
    ctx.quadraticCurveTo(gap, y - 13, gap - 4, y - 10);
    ctx.stroke();
  }

  function drawSproutHat(ctx, x, y, colorA, colorB, lean) {
    ctx.strokeStyle = colorA || "#48613f";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 4, y - 10, x + (lean || 2), y - 15);
    ctx.stroke();
    leaf(ctx, x + (lean || 2), y - 15, 11, 4.5, -0.8, colorA || "#4c7046", colorB || "#77915e");
    leaf(ctx, x + (lean || 2), y - 13, 10, 4, -2.45, colorA || "#4c7046", colorB || "#77915e");
  }

  function drawCrateHelmet(ctx, palette, t, opts) {
    ctx.save();
    ctx.rotate(-0.06);
    const g = ctx.createLinearGradient(-35, -105, 34, -47);
    g.addColorStop(0, "#c4a57a");
    g.addColorStop(0.5, "#ad8a61");
    g.addColorStop(1, "#8c6d4c");
    rr(ctx, -36, -96, 72, 55, 3);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(80, 57, 35, 0.6)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // tape
    ctx.fillStyle = "rgba(226, 206, 163, 0.62)";
    ctx.fillRect(-8, -96, 15, 55);
    ctx.strokeStyle = "rgba(91, 66, 39, 0.22)";
    ctx.lineWidth = 0.7;
    ctx.strokeRect(-8, -96, 15, 55);
    // eye holes
    fillEllipse(ctx, -13, -74, 7.2, 6, "#3a3329");
    fillEllipse(ctx, 13, -74, 7.2, 6, "#3a3329");
    ctx.fillStyle = palette.eye;
    fillEllipse(ctx, -13, -73, 3.4, 3.9, "#f4e7b1");
    fillEllipse(ctx, 13, -73, 3.4, 3.9, "#f4e7b1");
    fillEllipse(ctx, -12, -72, 1.4, 1.8, "#3a3329");
    fillEllipse(ctx, 14, -72, 1.4, 1.8, "#3a3329");
    // mouth hole
    ctx.beginPath();
    ctx.ellipse(0, -58, 10, 5.5, 0, 0, TAU);
    ctx.fillStyle = "#3a3329";
    ctx.fill();
    ctx.fillStyle = "#f1e1b9";
    ctx.beginPath();
    ctx.moveTo(-6, -62);
    ctx.lineTo(-2, -56);
    ctx.lineTo(1, -62);
    ctx.closePath();
    ctx.fill();
    // printed sprout
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = "#6d7b4e";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(25, -54, 7, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(25, -48);
    ctx.quadraticCurveTo(27, -55, 23, -58);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // corner fold
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(28, -96);
    ctx.lineTo(36, -88);
    ctx.lineTo(28, -84);
    ctx.closePath();
    ctx.fillStyle = "#f0dfbc";
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawCanHelmet(ctx, t, opts, damaged) {
    ctx.save();
    ctx.rotate(0.045 + Math.sin(t * 1.2) * 0.01);
    const x = 0;
    const y = -104;
    const g = ctx.createLinearGradient(-38, y, 35, y + 56);
    g.addColorStop(0, "#d2cdb9");
    g.addColorStop(0.25, "#9fa394");
    g.addColorStop(0.55, "#c7c5b1");
    g.addColorStop(0.78, "#7d8379");
    g.addColorStop(1, "#a9aa98");
    ctx.beginPath();
    ctx.moveTo(-34, y + 10);
    ctx.lineTo(-29, y + 48);
    ctx.quadraticCurveTo(0, y + 58, 29, y + 46);
    ctx.lineTo(35, y + 8);
    ctx.quadraticCurveTo(0, y - 10, -34, y + 10);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(66, 70, 62, 0.62)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // rim
    ctx.beginPath();
    ctx.ellipse(0, y + 9, 36, 9, 0, 0, TAU);
    ctx.fillStyle = "#c1bdab";
    ctx.fill();
    ctx.strokeStyle = "rgba(86, 86, 75, 0.42)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, y + 8, 27, 5.5, 0, 0, TAU);
    ctx.fillStyle = "#70766d";
    ctx.fill();
    // handle
    ctx.beginPath();
    ctx.arc(0, y + 3, 35, Math.PI + 0.1, TAU - 0.1);
    ctx.strokeStyle = "#848a7e";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    // dents / scratches
    ctx.strokeStyle = "rgba(250, 246, 224, 0.35)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-17, y + 19);
    ctx.lineTo(-11, y + 31);
    ctx.lineTo(-17, y + 38);
    ctx.moveTo(18, y + 15);
    ctx.lineTo(14, y + 25);
    ctx.stroke();
    if (damaged) {
      ctx.strokeStyle = "rgba(60, 66, 58, 0.65)";
      ctx.beginPath();
      ctx.moveTo(10, y + 12);
      ctx.lineTo(17, y + 27);
      ctx.lineTo(10, y + 38);
      ctx.stroke();
    }
    // rivets
    for (let i = 0; i < 3; i += 1) {
      fillEllipse(ctx, -22 + i * 22, y + 44, 1.7, 1.7, "rgba(84, 89, 80, 0.68)");
    }
    ctx.restore();
  }

  function drawEnabledCreature(ctx, type, t, opts) {
    const palette = ENEMY_PALETTES[type] || ENEMY_PALETTES.mutterling;
    const o = opts || {};
    const armored = o.armored !== false;
    const base = drawEnemyBaseBody(ctx, palette, t, o, type === "zippy");
    const eatLean = o.eating ? 6 : 0;
    if (type === "zippy") {
      // scarf
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-12, -64);
      ctx.quadraticCurveTo(-30, -70 - base.walk * 3, -43, -63);
      ctx.stroke();
      fillEllipse(ctx, -44, -63, 4.5, 8, palette.accent);
      // goggles
      ctx.strokeStyle = "rgba(36, 52, 43, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-15, -66);
      ctx.quadraticCurveTo(0, -72, 14, -65);
      ctx.stroke();
      fillEllipse(ctx, -9, -60, 6.8, 5.2, "rgba(215, 238, 206, 0.65)", palette.dark, 1.2);
      fillEllipse(ctx, 8, -60, 6.8, 5.2, "rgba(215, 238, 206, 0.65)", palette.dark, 1.2);
      fillEllipse(ctx, -8, -60, 2.8, 3.4, "#2e4135");
      fillEllipse(ctx, 9, -60, 2.8, 3.4, "#2e4135");
      drawEnemyMouth(ctx, palette, t, o);
      drawSproutHat(ctx, 2, -80, "#3e6456", "#6a8f71", -1);
    } else if (type === "crateling" && armored) {
      drawEnemyMouth(ctx, palette, t, o);
      drawCrateHelmet(ctx, palette, t, o);
      drawSproutHat(ctx, 25, -96, "#586b3f", "#899361", 3);
    } else if (type === "canhead" && armored) {
      drawEnemyMouth(ctx, palette, t, o);
      drawEnemyEyes(ctx, palette, t, o);
      drawCanHelmet(ctx, t, o, o.hpRatio != null && o.hpRatio < 0.45);
      drawSproutHat(ctx, -31, -127, "#4f6b3e", "#7f9360", 2);
    } else if (type === "mossguard") {
      drawEnemyEyes(ctx, palette, t, o);
      drawEnemyMouth(ctx, palette, t, o);
      drawSproutHat(ctx, -3, -82, "#4d6842", "#829060", 2);

      // Heavy stone carapace and shoulder plates.
      const stoneGrad = ctx.createLinearGradient(-38, -91, 37, -39);
      stoneGrad.addColorStop(0, "#a4a58b");
      stoneGrad.addColorStop(0.45, "#7e8574");
      stoneGrad.addColorStop(1, "#545f53");
      ctx.beginPath();
      ctx.moveTo(-39, -60);
      ctx.lineTo(-31, -86);
      ctx.lineTo(-8, -94);
      ctx.lineTo(14, -92);
      ctx.lineTo(35, -78);
      ctx.lineTo(38, -62);
      ctx.lineTo(26, -55);
      ctx.lineTo(-25, -56);
      ctx.closePath();
      ctx.fillStyle = stoneGrad;
      ctx.fill();
      ctx.strokeStyle = "rgba(39, 53, 41, 0.62)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      // brim shadow, so the eyes stay readable beneath it
      ctx.fillStyle = "rgba(34, 47, 36, 0.32)";
      ctx.beginPath();
      ctx.ellipse(0, -61, 31, 7, 0, 0, TAU);
      ctx.fill();
      // cracks
      ctx.strokeStyle = "rgba(50, 60, 45, 0.56)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-22, -85);
      ctx.lineTo(-16, -73);
      ctx.lineTo(-23, -66);
      ctx.moveTo(13, -87);
      ctx.lineTo(7, -74);
      ctx.lineTo(16, -63);
      ctx.stroke();
      // mossy shoulder stones
      fillEllipse(ctx, -32, -47, 13, 8, "rgba(92, 110, 75, 0.92)", "rgba(43, 59, 40, 0.45)", 1);
      fillEllipse(ctx, 31, -46, 12, 7, "rgba(86, 105, 71, 0.9)", "rgba(43, 59, 40, 0.45)", 1);
      for (let i = 0; i < 5; i += 1) {
        fillEllipse(ctx, -28 + i * 14, -87 + (i % 2) * 5, 4.4 - (i % 2), 2.6, "rgba(106, 125, 80, 0.7)");
      }
      if (o.hpRatio != null && o.hpRatio < 0.45) {
        ctx.strokeStyle = "rgba(42, 51, 38, 0.65)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-7, -91);
        ctx.lineTo(0, -78);
        ctx.lineTo(-4, -66);
        ctx.stroke();
      }
    } else if (type === "herald") {
      // flag pole behind body
      ctx.save();
      ctx.translate(22, -42);
      ctx.strokeStyle = "#6f6042";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(9, -96);
      ctx.stroke();
      ctx.translate(9, -94);
      const wave = Math.sin(t * 2.6) * 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(23, -1 + wave, 38, 7);
      ctx.lineTo(33, 21);
      ctx.quadraticCurveTo(17, 15 + wave, 0, 21);
      ctx.closePath();
      ctx.fillStyle = palette.accent;
      ctx.fill();
      ctx.strokeStyle = "rgba(63, 39, 36, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
      fillEllipse(ctx, 18, 10, 4.5, 4.5, "rgba(255, 239, 194, 0.78)");
      ctx.beginPath();
      ctx.moveTo(18, 12);
      ctx.quadraticCurveTo(21, 5, 25, 8);
      ctx.strokeStyle = "rgba(255, 239, 194, 0.78)";
      ctx.stroke();
      ctx.restore();
      // cape
      ctx.beginPath();
      ctx.moveTo(-19, -62);
      ctx.quadraticCurveTo(-34, -36, -26, -8);
      ctx.lineTo(-4, -15);
      ctx.quadraticCurveTo(-8, -42, -6, -62);
      ctx.closePath();
      ctx.fillStyle = "rgba(60, 77, 59, 0.58)";
      ctx.fill();
      drawEnemyEyes(ctx, palette, t, o);
      drawEnemyMouth(ctx, palette, t, o);
      drawSproutHat(ctx, 0, -78, "#48633d", "#788b59", -2);
      // leaf crown
      leaf(ctx, -12, -72, 13, 5, -2.4, "#96744b", "#c29a61");
      leaf(ctx, 12, -72, 13, 5, -0.6, "#96744b", "#c29a61");
    } else {
      drawEnemyEyes(ctx, palette, t, o);
      drawEnemyMouth(ctx, palette, t, o);
      drawSproutHat(ctx, 0, -76, type === "zippy" ? "#3e6456" : "#4b6141", "#7b8e65", -2);
    }
  }

  function drawBoss(ctx, t, opts) {
    const o = opts || {};
    const palette = ENEMY_PALETTES.boss;
    const pulse = Math.sin(t * 1.6) * 2;
    // shadow and vines
    ctx.save();
    ctx.globalAlpha = 0.35;
    fillEllipse(ctx, 0, 3, 72, 16, "#0b1310");
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(42, 61, 45, 0.65)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-52 + i * 24, -3);
      ctx.bezierCurveTo(-66 + i * 26, -20, -74 + i * 28, -9, -82 + i * 27, -20);
      ctx.stroke();
    }
    // feet
    fillEllipse(ctx, -30, -4, 20, 9, palette.dark);
    fillEllipse(ctx, 31, -4, 20, 9, palette.dark);
    // massive body
    ctx.save();
    ctx.translate(0, pulse * 0.4);
    mossBlobPath(ctx, 0, -82, 62, 82, 4.4, 0.025);
    const body = ctx.createRadialGradient(-20, -125, 12, 0, -78, 93);
    body.addColorStop(0, "#5d546e");
    body.addColorStop(0.55, palette.body);
    body.addColorStop(1, "#292637");
    ctx.fillStyle = body;
    ctx.fill();
    ctx.strokeStyle = "rgba(16, 25, 23, 0.66)";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // pulsating belly mouth
    const mouthOpen = o.roar ? 36 : 27 + Math.sin(t * 1.9) * 3;
    const mouth = ctx.createRadialGradient(0, -62, 2, 0, -62, mouthOpen + 20);
    mouth.addColorStop(0, "#e0a854");
    mouth.addColorStop(0.3, "rgba(74, 47, 42, 0.95)");
    mouth.addColorStop(1, "rgba(26, 25, 28, 0.98)");
    ctx.beginPath();
    ctx.ellipse(0, -60, 32, mouthOpen, 0, 0, TAU);
    ctx.fillStyle = mouth;
    ctx.fill();
    ctx.strokeStyle = "rgba(34, 28, 35, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
    // teeth around maw
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * TAU;
      const tx = Math.cos(a) * 27;
      const ty = -60 + Math.sin(a) * (mouthOpen - 3);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(0, -9 + (i % 2) * 3);
      ctx.lineTo(4, 0);
      ctx.closePath();
      ctx.fillStyle = "#dacfae";
      ctx.fill();
      ctx.restore();
    }
    // tongue / inner glow
    ctx.globalAlpha = 0.8;
    fillEllipse(ctx, -4, -57, 18, 7 + Math.sin(t * 2.2) * 2, "rgba(176, 84, 83, 0.62)");
    ctx.globalAlpha = 1;

    // eyes (three)
    const eyeY = -119;
    const blink = Math.sin(t * 1.2) > 0.97;
    if (!blink) {
      fillEllipse(ctx, -29, eyeY, 12, 8.5, "#e9d9a9", "rgba(33, 29, 35, 0.7)", 1.3);
      fillEllipse(ctx, 0, eyeY - 10, 14, 9, "#f3d567", "rgba(33, 29, 35, 0.7)", 1.3);
      fillEllipse(ctx, 28, eyeY, 12, 8.5, "#e9d9a9", "rgba(33, 29, 35, 0.7)", 1.3);
      fillEllipse(ctx, -27, eyeY + 1, 3, 6, "#2a2733");
      fillEllipse(ctx, 2, eyeY - 8, 3, 6, "#2a2733");
      fillEllipse(ctx, 30, eyeY + 1, 3, 6, "#2a2733");
      fillEllipse(ctx, -26, eyeY - 1, 1, 1.5, "rgba(255,255,255,0.7)");
      fillEllipse(ctx, 3, eyeY - 10, 1, 1.5, "rgba(255,255,255,0.7)");
      fillEllipse(ctx, 31, eyeY - 1, 1, 1.5, "rgba(255,255,255,0.7)");
    } else {
      ctx.strokeStyle = "rgba(240, 214, 160, 0.65)";
      ctx.lineWidth = 2;
      [-29, 0, 28].forEach(function (x) {
        ctx.beginPath();
        ctx.arc(x, eyeY + (x === 0 ? -10 : 0), 10, 0.2, Math.PI - 0.2);
        ctx.stroke();
      });
    }

    // crescent moon mark
    ctx.save();
    ctx.translate(-38, -151);
    ctx.rotate(-0.35);
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    ctx.fillStyle = "rgba(237, 218, 166, 0.13)";
    ctx.fill();
    ctx.strokeStyle = "rgba(244, 221, 158, 0.55)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(4, -1, 12, 0.55, Math.PI * 1.55);
    ctx.strokeStyle = "rgba(244, 221, 158, 0.7)";
    ctx.stroke();
    ctx.restore();

    // crown of dead branches
    ctx.strokeStyle = "#332d2e";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (let i = 0; i < 5; i += 1) {
      const bx = -34 + i * 17;
      const by = -155 - Math.sin(i * 1.7) * 10;
      ctx.beginPath();
      ctx.moveTo(bx * 0.72, -151);
      ctx.quadraticCurveTo(bx + (i - 2) * 8, by - 18, bx + (i - 2) * 18, by - 10 - (i % 2) * 15);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bx + (i - 2) * 18, by - 10 - (i % 2) * 15, 2 + (i % 2), 0, TAU);
      ctx.fillStyle = "#332d2e";
      ctx.fill();
    }
    ctx.restore();

    // glowing spore motes
    for (let i = 0; i < 5; i += 1) {
      const a = t * 0.6 + i * 1.3;
      const r = 55 + Math.sin(t + i) * 12;
      ctx.globalAlpha = 0.25 + Math.sin(t * 2 + i) * 0.12;
      fillEllipse(ctx, Math.cos(a) * r, -100 + Math.sin(a) * r * 0.7, 2.4, 2.4, "#f0cd77");
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawBellWarden(ctx, t, opts) {
    const o = opts || {};
    const palette = ENEMY_PALETTES.bellwarden;
    const pulse = Math.sin(t * 1.4) * 2.4;

    // Root shadow and gnarled feet.
    ctx.save();
    ctx.globalAlpha = 0.34;
    fillEllipse(ctx, 0, 4, 84, 18, "#081310");
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#293a31";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-58 + i * 23, -3);
      ctx.bezierCurveTo(-73 + i * 26, -24, -88 + i * 28, -8, -98 + i * 27, -28);
      ctx.stroke();
    }
    fillEllipse(ctx, -37, -6, 23, 10, "#28342e");
    fillEllipse(ctx, 38, -6, 23, 10, "#28342e");

    // Body mass.
    ctx.save();
    ctx.translate(0, pulse * 0.3);
    mossBlobPath(ctx, 0, -83, 70, 92, 5.3, 0.032);
    const bodyGrad = ctx.createRadialGradient(-20, -137, 10, 0, -90, 105);
    bodyGrad.addColorStop(0, "#68776a");
    bodyGrad.addColorStop(0.5, "#40544c");
    bodyGrad.addColorStop(1, "#1e2e2a");
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(11, 23, 25, 0.65)";
    ctx.lineWidth = 2.3;
    ctx.stroke();

    // Vine arms.
    ctx.strokeStyle = "#2a3c32";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-51, -82);
    ctx.bezierCurveTo(-82, -76, -100, -49, -92, -20);
    ctx.moveTo(53, -82);
    ctx.bezierCurveTo(84, -71, 102, -45, 92, -18);
    ctx.stroke();
    fillEllipse(ctx, -92, -16, 9, 12, "#4a5748", "#1e2f27", 1);
    fillEllipse(ctx, 92, -14, 9, 12, "#4a5748", "#1e2f27", 1);

    // Giant verdigris bell helmet.
    const bellX = 0;
    const bellY = -154;
    const bellGrad = ctx.createLinearGradient(-70, bellY - 62, 64, bellY + 58);
    bellGrad.addColorStop(0, "#ead79a");
    bellGrad.addColorStop(0.22, "#b5aa7b");
    bellGrad.addColorStop(0.5, "#829282");
    bellGrad.addColorStop(0.75, "#b19b63");
    bellGrad.addColorStop(1, "#657263");
    ctx.beginPath();
    ctx.moveTo(bellX - 34, bellY - 55);
    ctx.bezierCurveTo(bellX - 57, bellY - 40, bellX - 64, bellY + 14, bellX - 71, bellY + 49);
    ctx.quadraticCurveTo(bellX - 64, bellY + 65, bellX - 40, bellY + 56);
    ctx.quadraticCurveTo(bellX, bellY + 45, bellX + 40, bellY + 56);
    ctx.quadraticCurveTo(bellX + 64, bellY + 65, bellX + 71, bellY + 49);
    ctx.bezierCurveTo(bellX + 64, bellY + 14, bellX + 57, bellY - 40, bellX + 34, bellY - 55);
    ctx.quadraticCurveTo(bellX, bellY - 75, bellX - 34, bellY - 55);
    ctx.closePath();
    ctx.fillStyle = bellGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(21, 34, 31, 0.64)";
    ctx.lineWidth = 2.6;
    ctx.stroke();
    // Bell rim
    ctx.beginPath();
    ctx.ellipse(bellX, bellY + 49, 72, 13, 0, 0, TAU);
    ctx.fillStyle = "rgba(96, 86, 55, 0.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(231, 212, 151, 0.58)";
    ctx.lineWidth = 1.3;
    ctx.stroke();
    // Bell ridges and runes
    ctx.strokeStyle = "rgba(236, 218, 153, 0.3)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(bellX - 49, bellY - 9);
    ctx.quadraticCurveTo(bellX, bellY + 6, bellX + 49, bellY - 9);
    ctx.moveTo(bellX - 57, bellY + 25);
    ctx.quadraticCurveTo(bellX, bellY + 40, bellX + 57, bellY + 25);
    ctx.stroke();
    // Crack and old gold leaf
    ctx.strokeStyle = "rgba(46, 51, 40, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, bellY - 47);
    ctx.lineTo(10, bellY - 24);
    ctx.lineTo(22, bellY - 5);
    ctx.lineTo(16, bellY + 18);
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#d5c27b";
    fillEllipse(ctx, -29, bellY + 7, 15, 20, "#d5c27b");
    fillEllipse(ctx, 31, bellY - 16, 10, 16, "#d5c27b");
    ctx.globalAlpha = 1;
    // Moss clumps
    for (let i = 0; i < 8; i += 1) {
      const mx = -58 + i * 16;
      const my = bellY + 48 + (i % 3) * 4;
      fillEllipse(ctx, mx, my, 7 - (i % 3), 4, "rgba(92, 124, 78, 0.72)");
    }
    // Hanging clapper / tongue
    ctx.strokeStyle = "rgba(46, 57, 46, 0.8)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(bellX, bellY + 51);
    ctx.quadraticCurveTo(bellX + 9, bellY + 67, bellX + Math.sin(t * 1.4) * 8, bellY + 83);
    ctx.stroke();
    fillEllipse(ctx, bellX + Math.sin(t * 1.4) * 8, bellY + 87, 12, 12, "#c7ad67", "rgba(46, 44, 32, 0.6)", 1.4);
    fillEllipse(ctx, bellX + Math.sin(t * 1.4) * 8 - 3, bellY + 84, 3, 2, "rgba(255, 246, 198, 0.65)");

    // Three eyes beneath the bell brim.
    const eyeY = bellY + 76;
    fillEllipse(ctx, -24, eyeY, 10, 8, "rgba(249, 228, 154, 0.22)");
    fillEllipse(ctx, 4, eyeY, 10, 8, "rgba(249, 228, 154, 0.22)");
    fillEllipse(ctx, 30, eyeY, 9, 7, "rgba(249, 228, 154, 0.22)");
    fillEllipse(ctx, -24, eyeY, 5, 7, "#f4d97d");
    fillEllipse(ctx, 4, eyeY, 5, 7, "#f4d97d");
    fillEllipse(ctx, 30, eyeY, 4.5, 6, "#f4d97d");
    fillEllipse(ctx, -23, eyeY + 1, 1.8, 4.5, "#273933");
    fillEllipse(ctx, 5, eyeY + 1, 1.8, 4.5, "#273933");
    fillEllipse(ctx, 31, eyeY + 1, 1.6, 4, "#273933");
    fillEllipse(ctx, -21, eyeY - 2, 1, 1.3, "rgba(255,255,235,0.8)");
    fillEllipse(ctx, 7, eyeY - 2, 1, 1.3, "rgba(255,255,235,0.8)");

    // A wide, bell-shaped maw in the torso.
    const mawY = -48;
    ctx.beginPath();
    ctx.ellipse(0, mawY, 29, 18 + (o.roar ? 5 : 0), 0, 0, TAU);
    ctx.fillStyle = "#1e2623";
    ctx.fill();
    ctx.strokeStyle = "rgba(212, 193, 131, 0.25)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * TAU;
      const tx = Math.cos(a) * 22;
      const ty = mawY + Math.sin(a) * 12;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(-3.4, 0);
      ctx.lineTo(0, -7 - (i % 2) * 2);
      ctx.lineTo(3.4, 0);
      ctx.closePath();
      ctx.fillStyle = "#d8cba5";
      ctx.fill();
      ctx.restore();
    }
    // Inner golden glow
    const mawGlow = ctx.createRadialGradient(0, mawY, 2, 0, mawY, 22);
    mawGlow.addColorStop(0, "rgba(255, 222, 138, 0.9)");
    mawGlow.addColorStop(0.45, "rgba(181, 118, 62, 0.3)");
    mawGlow.addColorStop(1, "rgba(40, 35, 28, 0)");
    fillEllipse(ctx, 0, mawY, 22, 13, mawGlow);
    // Moss crown on top of the bell
    for (let i = 0; i < 7; i += 1) {
      ctx.strokeStyle = "#314237";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-30 + i * 10, bellY - 60);
      ctx.quadraticCurveTo(-38 + i * 12, bellY - 80, -24 + i * 9, bellY - 91 - (i % 3) * 8);
      ctx.stroke();
      leaf(ctx, -24 + i * 9, bellY - 88 - (i % 3) * 8, 11, 4, i % 2 ? -0.4 : -2.6, "#3d5545", "#758455");
    }
    // Tiny rune sparks when roaring.
    if (o.roar) {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = "#ffe19a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, bellY, 96 + Math.sin(t * 6) * 5, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.restore();
  }

  function drawEnemy(ctx, type, x, y, scale, time, opts) {
    const o = opts || {};
    const s = (scale == null ? 1 : scale) * (o.scale || 1);
    const t = time || 0;
    const isBigBoss = type === "boss" || type === "bellwarden";
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (o.flash) ctx.filter = "brightness(1.75) saturate(0.55)";
    shadow(ctx, isBigBoss ? 72 : 30, isBigBoss ? 16 : 7, isBigBoss ? 0.25 : 0.16);

    if (type === "boss") {
      drawBoss(ctx, t, o);
    } else if (type === "bellwarden") {
      drawBellWarden(ctx, t, o);
    } else {
      drawEnabledCreature(ctx, type, t, o);
    }
    if (o.frozen) {
      ctx.globalAlpha = 0.26;
      if (isBigBoss) {
        mossBlobPath(ctx, 0, -103, 65, 92, 1.3, 0.02);
      } else {
        mossBlobPath(ctx, 0, -47, 27, 33, 1.1, 0.02);
      }
      ctx.fillStyle = "#b9eef0";
      ctx.fill();
      ctx.globalAlpha = 0.7;
      iceCrystal(ctx, isBigBoss ? -43 : -25, -7, isBigBoss ? 10 : 8, -0.25);
      iceCrystal(ctx, isBigBoss ? 40 : 22, -5, isBigBoss ? 8 : 6, 0.3);
      ctx.globalAlpha = 1;
    }
    if (o.hitFlash) {
      ctx.globalAlpha = 0.34;
      fillEllipse(ctx, 0, -40, 29, 35, "#fff4d8");
      ctx.globalAlpha = 1;
    }
    ctx.filter = "none";
    ctx.restore();
  }

  /* ---------------------------------------------------------
     Sun, mower, projectiles
     --------------------------------------------------------- */

  function drawSunToken(ctx, sun, t) {
    const s = sun.scale == null ? 1 : sun.scale;
    const life = sun.life == null ? 1 : clamp(sun.life, 0, 1);
    const pulse = 1 + Math.sin(t * 3.1 + (sun.phase || 0)) * 0.06;
    ctx.save();
    ctx.translate(sun.x, sun.y);
    ctx.scale(s * pulse, s * pulse);
    ctx.globalAlpha = life < 0.2 ? life / 0.2 : 1;

    // Long coral-gold rays. The warmer hue separates a collectible from yellow petals.
    ctx.save();
    ctx.rotate(t * 0.38 + (sun.phase || 0));
    for (let i = 0; i < 14; i += 1) {
      ctx.save();
      ctx.rotate((i / 14) * TAU);
      const longRay = i % 2 === 0;
      ctx.beginPath();
      ctx.moveTo(18, longRay ? -5 : -3.6);
      ctx.quadraticCurveTo(35, longRay ? -3.2 : -2.4, longRay ? 50 : 43, 0);
      ctx.quadraticCurveTo(35, longRay ? 3.2 : 2.4, 18, longRay ? 5 : 3.6);
      ctx.closePath();
      ctx.fillStyle = longRay ? "rgba(255, 137, 57, 0.42)" : "rgba(255, 205, 108, 0.3)";
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // A broad, creamy halo keeps the token legible over bright or dark lawns.
    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 50);
    glow.addColorStop(0, "rgba(255, 252, 224, 0.9)");
    glow.addColorStop(0.34, "rgba(255, 193, 105, 0.4)");
    glow.addColorStop(0.72, "rgba(255, 128, 55, 0.13)");
    glow.addColorStop(1, "rgba(255, 120, 48, 0)");
    fillEllipse(ctx, 0, 0, 50, 50, glow);

    // Fine rotating ring: a very readable "click me" silhouette.
    ctx.save();
    ctx.rotate(-t * 0.25 - (sun.phase || 0));
    ctx.strokeStyle = "rgba(255, 246, 202, 0.72)";
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, 32.5, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Orb body: cream-hot centre, tangerine edge, a dark ink rim for contrast.
    const orb = ctx.createRadialGradient(-8, -9, 2, 0, 0, 27);
    orb.addColorStop(0, "#fffef4");
    orb.addColorStop(0.26, "#ffe99a");
    orb.addColorStop(0.54, "#ffc458");
    orb.addColorStop(0.8, "#ff903e");
    orb.addColorStop(1, "#e9612e");
    fillEllipse(ctx, 0, 0, 26, 26, orb, "rgba(116, 54, 15, 0.68)", 1.7);

    // Cream inner rim.
    ctx.strokeStyle = "rgba(255, 253, 229, 0.58)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 22.4, Math.PI * 1.02, Math.PI * 1.72);
    ctx.stroke();

    // A pair of confident little eyes, a smile, and warm cheeks.
    fillEllipse(ctx, -7.6, -2.4, 2.6, 3.3, "rgba(105, 50, 14, 0.75)");
    fillEllipse(ctx, 7.6, -2.4, 2.6, 3.3, "rgba(105, 50, 14, 0.75)");
    fillEllipse(ctx, -6.8, -3.4, 0.8, 1.1, "rgba(255, 255, 238, 0.88)");
    fillEllipse(ctx, 8.4, -3.4, 0.8, 1.1, "rgba(255, 255, 238, 0.88)");
    ctx.strokeStyle = "rgba(105, 50, 14, 0.66)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 4.2, 5.2, 0.15, Math.PI - 0.15);
    ctx.stroke();
    fillEllipse(ctx, -15.2, 5.1, 3.4, 1.8, "rgba(207, 86, 55, 0.28)");
    fillEllipse(ctx, 15.2, 5.1, 3.4, 1.8, "rgba(207, 86, 55, 0.28)");
    sparkle(ctx, -11, -12, 4.1, "rgba(255, 255, 240, 0.92)", 0.75);
    sparkle(ctx, 20, -18, 3.2, "#fff7cf", 0.65 + Math.sin(t * 3) * 0.2);
    sparkle(ctx, -22, 11, 2.3, "#ffe2a1", 0.6);
    ctx.restore();
  }

  function drawMower(ctx, mower, t) {
    const active = mower.active;
    const shake = active ? Math.sin(t * 28) * 1.4 : 0;
    ctx.save();
    ctx.translate(mower.x + shake, mower.y + (active ? Math.sin(t * 21) * 1.1 : 0));
    shadow(ctx, 33, 7, 0.2);
    // handle
    ctx.strokeStyle = "#335b42";
    ctx.lineWidth = 3.3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-12, -15);
    ctx.quadraticCurveTo(-28, -45, -31, -63);
    ctx.stroke();
    ctx.strokeStyle = "#6d5639";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-35, -65);
    ctx.lineTo(-26, -61);
    ctx.stroke();
    // wheels
    ctx.fillStyle = "#2f3a30";
    fillEllipse(ctx, -17, -5, 9.5, 9.5, "#2f3a30", "rgba(25, 31, 24, 0.6)", 1.2);
    fillEllipse(ctx, 21, -5, 9.5, 9.5, "#2f3a30", "rgba(25, 31, 24, 0.6)", 1.2);
    ctx.strokeStyle = "rgba(214, 199, 160, 0.38)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(-17, -5, 5.4, 0, TAU);
    ctx.arc(21, -5, 5.4, 0, TAU);
    ctx.stroke();
    // body
    const g = ctx.createLinearGradient(-20, -36, 28, -8);
    g.addColorStop(0, "#ce6352");
    g.addColorStop(0.68, "#b0483e");
    g.addColorStop(1, "#8a3736");
    ctx.beginPath();
    ctx.moveTo(-25, -15);
    ctx.quadraticCurveTo(-26, -37, -6, -39);
    ctx.lineTo(19, -37);
    ctx.quadraticCurveTo(31, -34, 27, -16);
    ctx.quadraticCurveTo(2, -9, -25, -15);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(61, 43, 32, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // cream stripe
    ctx.fillStyle = "#f0d9a2";
    ctx.beginPath();
    ctx.moveTo(-23, -27);
    ctx.quadraticCurveTo(2, -32, 25, -28);
    ctx.lineTo(25, -22);
    ctx.quadraticCurveTo(0, -26, -23, -21);
    ctx.closePath();
    ctx.fill();
    // engine hood
    rr(ctx, -10, -42, 21, 12, 5);
    ctx.fillStyle = "#486444";
    ctx.fill();
    ctx.strokeStyle = "rgba(34, 48, 33, 0.5)";
    ctx.stroke();
    // clover badge
    fillEllipse(ctx, 6, -24, 4.6, 4.6, "#f0d36f");
    ctx.fillStyle = "#4e7a4c";
    for (let i = 0; i < 3; i += 1) {
      const a = -Math.PI / 2 + (i / 3) * TAU;
      fillEllipse(ctx, 6 + Math.cos(a) * 2, -24 + Math.sin(a) * 2, 1.7, 1.4, "#4e7a4c");
    }
    // blade guard
    ctx.beginPath();
    ctx.moveTo(-4, -12);
    ctx.lineTo(30, -12);
    ctx.lineTo(33, -6);
    ctx.lineTo(0, -7);
    ctx.closePath();
    ctx.fillStyle = "#6f6f5d";
    ctx.fill();
    if (active) {
      ctx.strokeStyle = "rgba(255, 230, 154, 0.5)";
      ctx.lineWidth = 1.3;
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-40 - i * 8, -18 - i * 7);
        ctx.lineTo(-52 - i * 11, -18 - i * 7);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.5;
      fillEllipse(ctx, 34, -1, 11, 4, "rgba(214, 197, 158, 0.5)");
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawProjectile(ctx, p, t) {
    const kind = p.kind || "pea";
    if (kind === "pea") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = 0.24;
      fillEllipse(ctx, -12, 0, 15, 5, p.color || "#b8d76d");
      ctx.globalAlpha = 1;
      const g = ctx.createRadialGradient(-2, -3, 1, 0, 0, 7.5);
      g.addColorStop(0, "#e8f7ac");
      g.addColorStop(0.55, "#9fc95e");
      g.addColorStop(1, "#5b8d3d");
      fillEllipse(ctx, 0, 0, 7, 6.6, g, "rgba(66, 92, 42, 0.45)", 1);
      fillEllipse(ctx, -2, -2, 2, 1.5, "rgba(255, 255, 224, 0.72)");
      ctx.restore();
    } else if (kind === "water") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = 0.28;
      fillEllipse(ctx, -11, 1, 16, 7, "rgba(150, 231, 224, 0.65)");
      ctx.globalAlpha = 1;
      const g = ctx.createRadialGradient(-2, -3, 1, 0, 0, 9);
      g.addColorStop(0, "#f4fffa");
      g.addColorStop(0.38, "#b8f1e8");
      g.addColorStop(0.78, "#67c1cc");
      g.addColorStop(1, "#3d8ca0");
      fillEllipse(ctx, 0, 0, 8.4, 7.8, g, "rgba(48, 108, 111, 0.48)", 1.1);
      fillEllipse(ctx, -2.5, -2.6, 2.3, 1.7, "rgba(255,255,255,0.82)");
      fillEllipse(ctx, -4, 5, 2.1, 1.5, "rgba(201, 249, 240, 0.6)");
      ctx.restore();
    } else if (kind === "frost") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(t * 2.4);
      ctx.globalAlpha = 0.35;
      fillEllipse(ctx, 0, 0, 16, 8, "rgba(197, 245, 246, 0.5)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#c7f2ed";
      ctx.strokeStyle = "rgba(103, 175, 184, 0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(0, -7);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      sparkle(ctx, 0, 0, 2.7, "#f0fffa", 0.8);
      ctx.restore();
    } else if (kind === "puff") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = 0.28;
      fillEllipse(ctx, -9, -2, 14, 7, "#fff3c8");
      ctx.globalAlpha = 1;
      for (let i = 0; i < 7; i += 1) {
        const a = (i / 7) * TAU + t * 1.8;
        fillEllipse(ctx, Math.cos(a) * 6, Math.sin(a) * 5, 4.2, 3.4, "rgba(255, 246, 214, 0.85)");
      }
      fillEllipse(ctx, 0, 0, 7.5, 6.5, "#f8e8b7", "rgba(148, 126, 72, 0.35)", 1);
      fillEllipse(ctx, -2, -2, 2.4, 1.8, "rgba(255, 255, 238, 0.9)");
      ctx.restore();
    }
  }

  /* ---------------------------------------------------------
     Board background
     --------------------------------------------------------- */

  const bgCache = new Map();

  function drawHedge(ctx, palette, theme, rng) {
    // Sky strip
    const sky = ctx.createLinearGradient(0, 0, 0, GRID.y + 20);
    sky.addColorStop(0, palette.skyTop);
    sky.addColorStop(1, palette.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, BOARD.width, GRID.y + 18);

    // Sun, moon or weather
    if (theme === "rain") {
      ctx.save();
      ctx.globalAlpha = 0.65;
      const cloudA = ctx.createLinearGradient(760, 0, 1320, 100);
      cloudA.addColorStop(0, "rgba(57, 78, 82, 0.56)");
      cloudA.addColorStop(0.55, "rgba(91, 112, 111, 0.5)");
      cloudA.addColorStop(1, "rgba(175, 191, 175, 0.22)");
      fillEllipse(ctx, 1150, 30, 260, 52, cloudA);
      fillEllipse(ctx, 940, 48, 175, 44, "rgba(84, 105, 106, 0.36)");
      fillEllipse(ctx, 1270, 49, 150, 38, "rgba(194, 204, 185, 0.18)");
      ctx.globalAlpha = 0.16;
      for (let i = 0; i < 26; i += 1) {
        fillEllipse(ctx, 80 + rng() * 1280, 10 + rng() * 66, 2 + rng() * 7, 0.8, "rgba(225, 240, 224, 0.9)");
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    } else if (theme === "starlit") {
      ctx.save();
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 36; i += 1) {
        const sx = 40 + rng() * 1360;
        const sy = 4 + rng() * 78;
        fillEllipse(ctx, sx, sy, 0.8 + rng() * 1.2, 0.8 + rng() * 1.2, "rgba(221, 241, 215, 0.9)");
      }
      ctx.globalAlpha = 0.22;
      fillEllipse(ctx, 1160, 38, 80, 52, "rgba(206, 236, 216, 0.5)");
      const moon = ctx.createRadialGradient(1150, 30, 3, 1160, 38, 35);
      moon.addColorStop(0, "#edf2d7");
      moon.addColorStop(1, "#a9b8a8");
      fillEllipse(ctx, 1160, 38, 30, 26, moon);
      fillEllipse(ctx, 1173, 33, 31, 27, palette.skyTop);
      ctx.globalAlpha = 1;
      ctx.restore();
    } else if (theme === "dawn") {
      ctx.save();
      ctx.globalAlpha = 0.54;
      const sun = ctx.createRadialGradient(1190, 52, 6, 1190, 52, 160);
      sun.addColorStop(0, "rgba(255, 250, 208, 0.95)");
      sun.addColorStop(0.3, "rgba(255, 222, 149, 0.42)");
      sun.addColorStop(1, "rgba(255, 190, 114, 0)");
      fillEllipse(ctx, 1190, 52, 160, 150, sun);
      ctx.globalAlpha = 0.78;
      fillEllipse(ctx, 1190, 55, 49, 49, "#ffe6a1");
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.16;
      fillEllipse(ctx, 890, 38, 155, 24, "rgba(255, 238, 201, 0.7)");
      fillEllipse(ctx, 1010, 25, 100, 18, "rgba(255, 244, 218, 0.7)");
      ctx.globalAlpha = 1;
      ctx.restore();
    } else if (theme === "eclipse") {
      const mx = 1160;
      const my = 42;
      ctx.save();
      ctx.globalAlpha = 0.22;
      fillEllipse(ctx, mx, my, 105, 70, "rgba(236, 223, 188, 0.5)");
      ctx.globalAlpha = 1;
      const moon = ctx.createRadialGradient(mx - 10, my - 10, 5, mx, my, 39);
      moon.addColorStop(0, "#f4edda");
      moon.addColorStop(1, "#b4b7b9");
      fillEllipse(ctx, mx, my, 35, 31, moon);
      fillEllipse(ctx, mx + 15, my - 3, 36, 32, palette.skyTop);
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 16; i += 1) {
        fillEllipse(ctx, 70 + rng() * 1300, 4 + rng() * 75, 0.8 + rng(), 0.8 + rng(), "rgba(246, 237, 206, 0.8)");
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    } else if (theme === "morning") {
      ctx.save();
      ctx.globalAlpha = 0.55;
      const sun = ctx.createRadialGradient(1220, 10, 4, 1220, 10, 95);
      sun.addColorStop(0, "rgba(255, 246, 193, 0.9)");
      sun.addColorStop(0.45, "rgba(255, 226, 136, 0.35)");
      sun.addColorStop(1, "rgba(255, 218, 112, 0)");
      fillEllipse(ctx, 1220, 10, 110, 110, sun);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = 0.25;
      fillEllipse(ctx, 1160, 38, 60, 42, "rgba(226, 233, 197, 0.4)");
      fillEllipse(ctx, 1174, 29, 55, 36, palette.skyTop);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Distant hill / hedge silhouettes
    ctx.fillStyle = palette.hedgeDark;
    ctx.beginPath();
    ctx.moveTo(0, GRID.y + 18);
    ctx.lineTo(0, 76);
    for (let x = 0; x <= BOARD.width; x += 28) {
      ctx.lineTo(x, 72 + Math.sin(x * 0.014) * 16 + rng() * 6);
    }
    ctx.lineTo(BOARD.width, GRID.y + 18);
    ctx.closePath();
    ctx.fill();

    // picket fence
    const fenceY = 50;
    ctx.save();
    ctx.globalAlpha = (theme === "eclipse" || theme === "starlit") ? 0.5 : theme === "rain" ? 0.64 : 0.82;
    for (let x = -10; x < BOARD.width + 20; x += 34) {
      const h = 34 + (x % 3) * 3;
      ctx.fillStyle = theme === "eclipse" ? "#6f6c60"
        : theme === "starlit" ? "#747d6f"
          : theme === "rain" ? "#aab19d"
            : theme === "dawn" ? "#efddb2"
              : theme === "dusk" ? "#9a977e" : "#e2d2ac";
      ctx.beginPath();
      ctx.moveTo(x, fenceY + h);
      ctx.lineTo(x, fenceY + 4);
      ctx.lineTo(x + 5, fenceY - 2);
      ctx.lineTo(x + 10, fenceY + 5);
      ctx.lineTo(x + 10, fenceY + h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(65, 64, 47, 0.18)";
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
    ctx.fillStyle = (theme === "eclipse" || theme === "starlit") ? "rgba(114, 108, 91, 0.55)" : theme === "rain" ? "rgba(139, 145, 125, 0.52)" : "rgba(173, 153, 110, 0.52)";
    ctx.fillRect(0, fenceY + 11, BOARD.width, 4);
    ctx.fillRect(0, fenceY + 30, BOARD.width, 4);
    ctx.restore();

    // Foreground hedge blobs
    ctx.fillStyle = palette.hedge;
    for (let i = 0; i < 25; i += 1) {
      const x = i * 62 - 20 + rng() * 25;
      const r = 33 + rng() * 24;
      fillEllipse(ctx, x, 97 + rng() * 9, r, r * 0.42, palette.hedge);
    }
    ctx.fillStyle = "rgba(255, 247, 212, 0.08)";
    for (let i = 0; i < 30; i += 1) {
      fillEllipse(ctx, rng() * BOARD.width, 86 + rng() * 13, 3 + rng() * 7, 1.5 + rng() * 3, "rgba(241, 238, 192, 0.25)");
    }

    // tiny flowers + grass line along the hedge
    for (let i = 0; i < 17; i += 1) {
      const x = 30 + rng() * (BOARD.width - 50);
      const y = 102 + rng() * 6;
      tinyFlower(ctx, x, y, 3 + rng() * 2, palette.flowerA, "#d9a83e", 0.75);
    }
  }

  function drawPath(ctx, palette, theme, rng) {
    // Left cottage edge
    const wall = ctx.createLinearGradient(0, 0, 92, 0);
    wall.addColorStop(0, "#c7b88f");
    wall.addColorStop(0.65, "#e5d7b3");
    wall.addColorStop(1, "#bca77d");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 96, 92, 620);
    ctx.strokeStyle = "rgba(92, 75, 48, 0.21)";
    ctx.lineWidth = 1;
    for (let x = 15; x < 92; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, 96);
      ctx.lineTo(x, 716);
      ctx.stroke();
    }
    // stone foundation
    const foundation = ctx.createLinearGradient(0, 680, 0, 728);
    foundation.addColorStop(0, "#8d836a");
    foundation.addColorStop(1, "#665d4b");
    ctx.fillStyle = foundation;
    ctx.fillRect(0, 680, 104, 46);
    for (let i = 0; i < 9; i += 1) {
      ctx.strokeStyle = "rgba(47, 44, 34, 0.24)";
      ctx.strokeRect(2 + (i % 4) * 26, 688 + Math.floor(i / 4) * 17, 24, 14);
    }
    // little window
    ctx.fillStyle = "rgba(50, 70, 54, 0.6)";
    rr(ctx, 20, 230, 52, 66, 4);
    ctx.fill();
    const win = ctx.createLinearGradient(20, 230, 72, 296);
    win.addColorStop(0, theme === "eclipse" ? "#b9b19d" : "#f4dfaa");
    win.addColorStop(1, theme === "eclipse" ? "#686c70" : "#c7d9a2");
    ctx.fillStyle = win;
    ctx.fillRect(25, 235, 42, 56);
    ctx.strokeStyle = "rgba(92, 78, 52, 0.48)";
    ctx.lineWidth = 2;
    ctx.strokeRect(25, 235, 42, 56);
    ctx.beginPath();
    ctx.moveTo(46, 235);
    ctx.lineTo(46, 291);
    ctx.moveTo(25, 263);
    ctx.lineTo(67, 263);
    ctx.stroke();
    ctx.fillStyle = "rgba(103, 139, 91, 0.52)";
    ctx.fillRect(16, 292, 60, 5);
    // vine beside window
    ctx.strokeStyle = "rgba(61, 107, 65, 0.6)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(76, 225);
    ctx.bezierCurveTo(66, 256, 85, 280, 72, 317);
    ctx.stroke();
    for (let i = 0; i < 4; i += 1) {
      leaf(ctx, 72 + (i % 2) * 4, 240 + i * 20, 12, 5, i % 2 ? 1.8 : -1.6, "#5d8256", "#8aa16e");
    }

    // Stone path strip
    const pathGrad = ctx.createLinearGradient(85, 0, 214, 0);
    pathGrad.addColorStop(0, palette.pathB);
    pathGrad.addColorStop(0.45, palette.pathA);
    pathGrad.addColorStop(1, palette.pathB);
    ctx.fillStyle = pathGrad;
    ctx.fillRect(92, 96, 126, 620);

    // Path stones
    for (let row = 0; row < 10; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const sw = 26 + rng() * 13;
        const sh = 17 + rng() * 10;
        const sx = 101 + col * 39 + rng() * 6;
        const sy = 111 + row * 59 + rng() * 7;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate((rng() - 0.5) * 0.17);
        rr(ctx, -sw / 2, -sh / 2, sw, sh, 7 + rng() * 4);
        ctx.fillStyle = "rgba(171, 158, 127, 0.60)";
        ctx.fill();
        ctx.strokeStyle = "rgba(79, 70, 53, 0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.strokeStyle = "rgba(240, 234, 210, 0.11)";
        ctx.beginPath();
        ctx.moveTo(-sw * 0.28, -sh * 0.22);
        ctx.quadraticCurveTo(0, -sh * 0.4, sw * 0.24, -sh * 0.14);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Moss along path
    ctx.fillStyle = "rgba(88, 120, 62, 0.33)";
    for (let i = 0; i < 35; i += 1) {
      const x = 96 + rng() * 116;
      const y = 110 + rng() * 595;
      fillEllipse(ctx, x, y, 2 + rng() * 7, 1.5 + rng() * 3, "rgba(83, 119, 62, 0.34)");
    }

    // Mower pads
    for (let row = 0; row < GRID.rows; row += 1) {
      const cy = GRID.y + row * GRID.ch + GRID.ch / 2;
      ctx.save();
      rr(ctx, 104, cy + 14, 101, 35, 8);
      ctx.fillStyle = "rgba(97, 93, 67, 0.16)";
      ctx.fill();
      ctx.strokeStyle = "rgba(239, 230, 194, 0.16)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.stroke();
      ctx.restore();
    }

    // Right path / hedge
    const rightGrad = ctx.createLinearGradient(1348, 0, 1440, 0);
    rightGrad.addColorStop(0, palette.pathB);
    rightGrad.addColorStop(1, palette.pathA);
    ctx.fillStyle = rightGrad;
    ctx.fillRect(1348, 96, 92, 620);
    for (let i = 0; i < 26; i += 1) {
      fillEllipse(ctx, 1358 + rng() * 74, 110 + rng() * 600, 2 + rng() * 6, 1 + rng() * 2.5, "rgba(74, 76, 54, 0.16)");
    }
    ctx.fillStyle = "rgba(46, 78, 47, 0.62)";
    for (let i = 0; i < 9; i += 1) {
      const x = 1360 + rng() * 70;
      const y = 104 + i * 68;
      fillEllipse(ctx, x, y, 18 + rng() * 10, 12 + rng() * 6, "rgba(52, 87, 54, 0.42)");
    }
    for (let i = 0; i < 5; i += 1) {
      tinyFlower(ctx, 1375 + rng() * 48, 150 + i * 113, 4 + rng() * 3, palette.flowerC, "#e4b64e", 0.8);
    }

    // Bottom earth border
    const bottom = ctx.createLinearGradient(0, 716, 0, 760);
    bottom.addColorStop(0, "#5e4e34");
    bottom.addColorStop(0.35, "#79613f");
    bottom.addColorStop(1, "#4b3b28");
    ctx.fillStyle = bottom;
    ctx.fillRect(0, 716, BOARD.width, 44);
    for (let i = 0; i < 34; i += 1) {
      const x = rng() * BOARD.width;
      fillEllipse(ctx, x, 728 + rng() * 22, 2 + rng() * 6, 1 + rng() * 3, "rgba(210, 190, 149, 0.12)");
    }
    ctx.strokeStyle = "rgba(242, 229, 195, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 720);
    ctx.lineTo(BOARD.width, 720);
    ctx.stroke();
  }

  function drawLawn(ctx, palette, theme, rng) {
    // border
    ctx.save();
    rr(ctx, GRID.x - 12, GRID.y - 12, GRID.width + 24, GRID.height + 24, 23);
    ctx.fillStyle = palette.lawnDark;
    ctx.fill();
    ctx.strokeStyle = "rgba(25, 44, 26, 0.34)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    rr(ctx, GRID.x - 4, GRID.y - 4, GRID.width + 8, GRID.height + 8, 18);
    ctx.clip();

    // stripes
    for (let row = 0; row < GRID.rows; row += 1) {
      const y = GRID.y + row * GRID.ch;
      const g = ctx.createLinearGradient(GRID.x, y, GRID.x + GRID.width, y + GRID.ch);
      g.addColorStop(0, row % 2 ? palette.lawnB : palette.lawnA);
      g.addColorStop(0.5, row % 2 ? palette.lawnA : palette.lawnB);
      g.addColorStop(1, row % 2 ? palette.lawnB : palette.lawnA);
      ctx.fillStyle = g;
      ctx.fillRect(GRID.x - 4, y, GRID.width + 8, GRID.ch);

      // horizontal mowing light
      ctx.globalAlpha = 0.08;
      const rowShade = ctx.createLinearGradient(0, y, 0, y + GRID.ch);
      rowShade.addColorStop(0, "rgba(255, 248, 183, 0.4)");
      rowShade.addColorStop(0.2, "transparent");
      rowShade.addColorStop(0.82, "transparent");
      rowShade.addColorStop(1, "rgba(31, 61, 29, 0.4)");
      ctx.fillStyle = rowShade;
      ctx.fillRect(GRID.x - 4, y, GRID.width + 8, GRID.ch);
      ctx.globalAlpha = 1;

      const rowEdge = ctx.createLinearGradient(0, y + GRID.ch - 10, 0, y + GRID.ch + 2);
      rowEdge.addColorStop(0, "rgba(38, 74, 32, 0)");
      rowEdge.addColorStop(1, "rgba(32, 66, 28, 0.24)");
      ctx.fillStyle = rowEdge;
      ctx.fillRect(GRID.x - 4, y + GRID.ch - 10, GRID.width + 8, 12);
      ctx.strokeStyle = "rgba(40, 78, 34, 0.22)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(GRID.x, y + GRID.ch + 1.2);
      ctx.lineTo(GRID.x + GRID.width, y + GRID.ch + 1.2);
      ctx.stroke();
    }

    // Softly mown vertical bands: together with the rows they read as 45 plots.
    for (let col = 0; col < GRID.cols; col += 1) {
      const x = GRID.x + col * GRID.cw;
      ctx.fillStyle = col % 2 === 0
        ? "rgba(250, 255, 202, 0.032)"
        : "rgba(31, 68, 28, 0.022)";
      ctx.fillRect(x, GRID.y, GRID.cw, GRID.height);
    }

    // Faint planting checker: 45 softly mown squares.
    for (let row = 0; row < GRID.rows; row += 1) {
      for (let col = 0; col < GRID.cols; col += 1) {
        const x = GRID.x + col * GRID.cw;
        const y = GRID.y + row * GRID.ch;
        ctx.fillStyle = (row + col) % 2 === 0
          ? "rgba(255, 252, 195, 0.052)"
          : "rgba(33, 72, 31, 0.044)";
        rr(ctx, x + 5, y + 5, GRID.cw - 10, GRID.ch - 10, 12);
        ctx.fill();
      }
    }

    // cell dividers
    ctx.save();
    ctx.strokeStyle = "rgba(29, 67, 27, 0.2)";
    ctx.lineWidth = 1;
    for (let col = 1; col < GRID.cols; col += 1) {
      const x = GRID.x + col * GRID.cw;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, GRID.y + 7);
      ctx.lineTo(x + 0.5, GRID.y + GRID.height - 7);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(247, 250, 200, 0.26)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 9]);
    for (let col = 1; col < GRID.cols; col += 1) {
      const x = GRID.x + col * GRID.cw + 1;
      ctx.beginPath();
      ctx.moveTo(x, GRID.y + 7);
      ctx.lineTo(x, GRID.y + GRID.height - 7);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (let row = 1; row < GRID.rows; row += 1) {
      const y = GRID.y + row * GRID.ch;
      const horiz = ctx.createLinearGradient(GRID.x, 0, GRID.x + GRID.width, 0);
      horiz.addColorStop(0, "rgba(246, 247, 194, 0)");
      horiz.addColorStop(0.18, "rgba(246, 247, 194, 0.17)");
      horiz.addColorStop(0.82, "rgba(246, 247, 194, 0.17)");
      horiz.addColorStop(1, "rgba(246, 247, 194, 0)");
      ctx.strokeStyle = horiz;
      ctx.beginPath();
      ctx.moveTo(GRID.x, y);
      ctx.lineTo(GRID.x + GRID.width, y);
      ctx.stroke();
    }
    ctx.restore();

    // A tiny clover stamped into a few squares, like garden notes.
    for (let i = 0; i < 8; i += 1) {
      const row = Math.floor(rng() * GRID.rows);
      const col = Math.floor(rng() * GRID.cols);
      const cx = GRID.x + col * GRID.cw + GRID.cw / 2;
      const cy = GRID.y + row * GRID.ch + GRID.ch / 2 + 28;
      ctx.globalAlpha = 0.12;
      for (let j = 0; j < 3; j += 1) {
        const a = -Math.PI / 2 + j * 2.1;
        fillEllipse(ctx, cx + Math.cos(a) * 5, cy + Math.sin(a) * 4, 4.2, 3, "rgba(240, 247, 183, 0.9)");
      }
      ctx.globalAlpha = 1;
    }

    // grass texture
    for (let i = 0; i < 470; i += 1) {
      const x = GRID.x + rng() * GRID.width;
      const y = GRID.y + 10 + rng() * (GRID.height - 18);
      const h = 2 + rng() * 6;
      ctx.strokeStyle = rng() > 0.6 ? "rgba(227, 243, 164, 0.22)" : "rgba(45, 88, 39, 0.18)";
      ctx.lineWidth = 0.8 + rng() * 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 1.5, y - h * 0.55, x + 3 + rng() * 2, y - h);
      ctx.stroke();
    }
    // clover patches
    for (let i = 0; i < 24; i += 1) {
      const x = GRID.x + rng() * GRID.width;
      const y = GRID.y + rng() * GRID.height;
      ctx.globalAlpha = 0.14 + rng() * 0.12;
      for (let j = 0; j < 3; j += 1) {
        const a = -Math.PI / 2 + j * 2.1;
        fillEllipse(ctx, x + Math.cos(a) * 3.2, y + Math.sin(a) * 2.7, 2.7, 2, "rgba(66, 104, 50, 0.7)");
      }
      ctx.globalAlpha = 1;
    }

    // Weather caught in the lawn itself.
    if (theme === "rain") {
      for (let i = 0; i < 7; i += 1) {
        const px = GRID.x + 80 + rng() * (GRID.width - 160);
        const py = GRID.y + 60 + rng() * (GRID.height - 100);
        const pr = 22 + rng() * 44;
        ctx.save();
        ctx.globalAlpha = 0.14 + rng() * 0.06;
        const wet = ctx.createLinearGradient(0, py - 8, 0, py + 8);
        wet.addColorStop(0, "rgba(232, 250, 241, 0.7)");
        wet.addColorStop(0.5, "rgba(151, 202, 193, 0.2)");
        wet.addColorStop(1, "rgba(91, 150, 131, 0)");
        fillEllipse(ctx, px, py, pr, 7 + rng() * 4, wet);
        ctx.strokeStyle = "rgba(237, 252, 243, 0.16)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(px, py - 1, pr * 0.62, 3.5, 0, Math.PI * 1.05, Math.PI * 1.86);
        ctx.stroke();
        ctx.restore();
      }
    } else if (theme === "starlit") {
      for (let i = 0; i < 14; i += 1) {
        const sx = GRID.x + 20 + rng() * (GRID.width - 40);
        const sy = GRID.y + 20 + rng() * (GRID.height - 40);
        ctx.globalAlpha = 0.12 + rng() * 0.2;
        sparkle(ctx, sx, sy, 1.8 + rng() * 2.3, "#d4eedc", 0.9);
      }
      ctx.globalAlpha = 1;
    } else if (theme === "dawn") {
      for (let i = 0; i < 18; i += 1) {
        const fx = GRID.x + 15 + rng() * (GRID.width - 30);
        const fy = GRID.y + 15 + rng() * (GRID.height - 30);
        ctx.globalAlpha = 0.12 + rng() * 0.18;
        fillEllipse(ctx, fx, fy, 2 + rng() * 3.2, 0.9 + rng() * 1.3, i % 2 ? "#ffe7b2" : "#f0b488");
      }
      ctx.globalAlpha = 1;
    }

    // top edge shadow cast by hedge
    const edge = ctx.createLinearGradient(0, GRID.y, 0, GRID.y + 34);
    edge.addColorStop(0, "rgba(26, 55, 27, 0.25)");
    edge.addColorStop(1, "rgba(26, 55, 27, 0)");
    ctx.fillStyle = edge;
    ctx.fillRect(GRID.x - 4, GRID.y - 4, GRID.width + 8, 36);

    ctx.restore();

    // border flowers and little mushrooms
    const flowerColors = [palette.flowerA, palette.flowerB, palette.flowerC];
    for (let i = 0; i < 15; i += 1) {
      const x = GRID.x + 15 + rng() * (GRID.width - 30);
      const y = GRID.y - 9 + rng() * 4;
      tinyFlower(ctx, x, y, 3.3 + rng() * 2.1, flowerColors[i % 3], "#e3b94e", 0.9);
    }
    for (let i = 0; i < 11; i += 1) {
      const x = GRID.x + 15 + rng() * (GRID.width - 30);
      const y = GRID.y + GRID.height + 14 + rng() * 3;
      tinyFlower(ctx, x, y, 3 + rng() * 1.6, flowerColors[(i + 1) % 3], "#e3b94e", 0.8);
    }
    // hidden seasonal fungi
    for (let i = 0; i < 6; i += 1) {
      const x = (i < 3 ? GRID.x - 30 - rng() * 28 : GRID.x + GRID.width + 26 + rng() * 34);
      const y = GRID.y + 80 + rng() * 520;
      ctx.strokeStyle = "rgba(238, 230, 200, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 5);
      ctx.stroke();
      fillEllipse(ctx, x, y - 7, 6, 3.4, theme === "eclipse" || theme === "starlit" ? "#9e94a3" : theme === "rain" ? "#d8ddc9" : "#e9dab4");
    }

    // light beams
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = palette.light;
    ctx.beginPath();
    ctx.moveTo(1180, GRID.y - 20);
    ctx.lineTo(1440, GRID.y + 100);
    ctx.lineTo(1440, GRID.y + 240);
    ctx.lineTo(1080, GRID.y - 10);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(960, GRID.y - 20);
    ctx.lineTo(1320, GRID.y + 300);
    ctx.lineTo(1260, GRID.y + 330);
    ctx.lineTo(900, GRID.y - 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // vignette
    const vig = ctx.createRadialGradient(720, 390, 270, 720, 390, 840);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, palette.vignette);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, BOARD.width, BOARD.height);
  }

  function buildBackground(theme) {
    const palette = THEMES[theme] || THEMES.morning;
    const canvas = global.document.createElement("canvas");
    canvas.width = BOARD.width;
    canvas.height = BOARD.height;
    const ctx = canvas.getContext("2d");
    const rng = mulberry32(theme === "eclipse" ? 2904 : theme === "dusk" ? 1902 : 702);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Soil shadow behind everything
    ctx.fillStyle = "#3e5433";
    ctx.fillRect(0, 0, BOARD.width, BOARD.height);

    drawHedge(ctx, palette, theme, rng);
    drawPath(ctx, palette, theme, rng);
    drawLawn(ctx, palette, theme, rng);

    // Top corner shadows
    const corner = ctx.createLinearGradient(0, 0, 0, 50);
    corner.addColorStop(0, "rgba(18, 34, 20, 0.38)");
    corner.addColorStop(1, "rgba(18, 34, 20, 0)");
    ctx.fillStyle = corner;
    ctx.fillRect(0, 0, BOARD.width, 50);

    return canvas;
  }

  function getBackground(theme) {
    const key = theme || "morning";
    if (!bgCache.has(key)) bgCache.set(key, buildBackground(key));
    return bgCache.get(key);
  }

  function drawAmbient(ctx, theme, t) {
    if (theme === "rain") {
      ctx.save();
      ctx.strokeStyle = "rgba(227, 248, 240, 0.58)";
      ctx.lineWidth = 1.25;
      ctx.lineCap = "round";
      for (let i = 0; i < 64; i += 1) {
        const speed = 360 + (i % 5) * 55;
        const x = ((i * 173 + t * 68) % 1540) - 60;
        const y = 96 + ((i * 127 + t * speed) % 650);
        const length = 10 + (i % 4) * 5;
        ctx.globalAlpha = 0.2 + (i % 5) * 0.045;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 6, y + length);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.06;
      fillEllipse(ctx, 720, 470, 680, 240, "rgba(196, 229, 214, 0.6)");
      ctx.globalAlpha = 1;
      // Tiny puddle rings.
      for (let i = 0; i < 7; i += 1) {
        const px = 260 + ((i * 289 + t * 9) % 1080);
        const py = 170 + ((i * 113) % 500);
        const phase = (t * 0.7 + i * 0.37) % 1;
        ctx.globalAlpha = (1 - phase) * 0.33;
        ctx.strokeStyle = "rgba(225, 249, 238, 0.8)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(px, py, 8 + phase * 22, 2.5 + phase * 5, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    } else if (theme === "starlit" || theme === "dusk") {
      ctx.save();
      const glowColor = theme === "starlit" ? "rgba(168, 229, 211, 0.2)" : "rgba(219, 245, 155, 0.18)";
      const dotColor = theme === "starlit" ? "#d4f1dd" : "#eaf8b8";
      const amber = theme === "starlit" ? "#ffe8a5" : "#eaf8b8";
      for (let i = 0; i < 15; i += 1) {
        const baseX = 190 + ((i * 271) % 1160);
        const baseY = 120 + ((i * 149) % 560);
        const x = baseX + Math.sin(t * 0.24 + i * 1.8) * 24;
        const y = baseY + Math.cos(t * 0.31 + i * 1.1) * 16;
        const blink = 0.35 + Math.max(0, Math.sin(t * 1.5 + i * 2.7)) * 0.65;
        ctx.globalAlpha = blink * 0.8;
        fillEllipse(ctx, x, y, 10, 10, glowColor);
        fillEllipse(ctx, x, y, 2.1, 2.1, i % 3 === 0 ? amber : dotColor);
        ctx.globalAlpha = 1;
      }
      if (theme === "starlit") {
        const sx = 220 + ((t * 38) % 1000);
        const sy = 150 + Math.sin(t * 0.4) * 35;
        ctx.globalAlpha = 0.24;
        ctx.strokeStyle = "#e7f8dc";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 16, sy + 7);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    } else if (theme === "eclipse") {
      ctx.save();
      for (let i = 0; i < 16; i += 1) {
        const x = 170 + ((i * 313) % 1190) + Math.sin(t * 0.2 + i) * 20;
        const y = 120 + ((i * 197) % 560) + Math.sin(t * 0.4 + i * 1.2) * 17;
        ctx.globalAlpha = 0.22 + Math.max(0, Math.sin(t * 0.9 + i)) * 0.28;
        fillEllipse(ctx, x, y, 3.4, 3.4, "rgba(232, 218, 177, 0.7)");
        ctx.globalAlpha = 1;
      }
      const fog = ctx.createLinearGradient(0, 500, 0, BOARD.height);
      fog.addColorStop(0, "rgba(173, 178, 193, 0)");
      fog.addColorStop(1, "rgba(173, 178, 193, 0.08)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 450, BOARD.width, 310);
      ctx.restore();
    } else if (theme === "dawn") {
      ctx.save();
      for (let i = 0; i < 18; i += 1) {
        const x = 160 + ((i * 269) % 1200) + Math.sin(t * 0.34 + i * 1.7) * 34;
        const y = 80 + ((i * 163) % 600) + Math.sin(t * 0.5 + i * 2.1) * 16;
        const a = 0.18 + Math.max(0, Math.sin(t * 0.8 + i)) * 0.28;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(x, y + Math.sin(t * 0.5 + i) * 6);
        ctx.rotate(t * 0.25 + i);
        fillEllipse(ctx, 0, 0, 3.5 + (i % 3), 1.7 + (i % 2), i % 2 ? "#ffe6bc" : "#f0bd9a");
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      for (let i = 0; i < 8; i += 1) {
        const x = 300 + ((i * 401 + t * 12) % 1050);
        const y = 220 + ((i * 113) % 380) + Math.sin(t * 0.7 + i) * 12;
        ctx.globalAlpha = 0.22 + Math.max(0, Math.sin(t + i)) * 0.2;
        sparkle(ctx, x, y, 2.2 + (i % 3), "#fff0c2", 0.8);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    } else {
      ctx.save();
      for (let i = 0; i < 18; i += 1) {
        const x = 160 + ((i * 269) % 1200) + Math.sin(t * 0.34 + i * 1.7) * 28;
        const y = 80 + ((i * 163) % 600) + Math.sin(t * 0.5 + i * 2.1) * 12;
        const a = 0.16 + Math.max(0, Math.sin(t * 0.8 + i)) * 0.22;
        ctx.globalAlpha = a;
        fillEllipse(ctx, x, y, 2.2 + (i % 3), 2.2 + (i % 3), "#fff5c7");
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    // Gentle floating leaves, always
    ctx.save();
    for (let i = 0; i < 7; i += 1) {
      const x = ((t * (7 + i * 1.2) + i * 221) % 1480) - 20;
      const y = 110 + ((i * 137 + Math.sin(t * 0.7 + i) * 25) % 590);
      ctx.globalAlpha = 0.18 + (i % 3) * 0.045;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 0.45 + i) * 0.9);
      const leafColor = theme === "eclipse" || theme === "starlit" ? "#8c9b85"
        : theme === "rain" ? "#b8d1b6"
          : theme === "dawn" ? "#f4d5a4" : "#ecedb2";
      fillEllipse(ctx, 0, 0, 5, 2.2, leafColor);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawCellHighlight(ctx, row, col, valid) {
    const x = GRID.x + col * GRID.cw;
    const y = GRID.y + row * GRID.ch;
    ctx.save();
    rr(ctx, x + 5, y + 5, GRID.cw - 10, GRID.ch - 10, 14);
    ctx.fillStyle = valid ? "rgba(255, 248, 195, 0.16)" : "rgba(162, 67, 57, 0.17)";
    ctx.fill();
    ctx.strokeStyle = valid ? "rgba(255, 253, 216, 0.7)" : "rgba(255, 192, 160, 0.65)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.restore();
  }

  function drawCellMark(ctx, row, col) {
    const cx = GRID.x + col * GRID.cw + GRID.cw / 2;
    const cy = GRID.y + row * GRID.ch + GRID.ch / 2;
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = "rgba(252, 248, 216, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------------------------------------------------------
     Menu scene, level thumbnails, intro art
     --------------------------------------------------------- */

  let menuBackdrop = null;

  function buildMenuBackdrop() {
    const canvas = global.document.createElement("canvas");
    canvas.width = 1440;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    const rng = mulberry32(8819);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 900, 800);
    sky.addColorStop(0, "#f6e6b8");
    sky.addColorStop(0.38, "#e8e5bb");
    sky.addColorStop(0.72, "#b7cfa9");
    sky.addColorStop(1, "#7aa07c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1440, 1000);

    // Sun
    const sx = 1160;
    const sy = 240;
    const glow = ctx.createRadialGradient(sx, sy, 30, sx, sy, 310);
    glow.addColorStop(0, "rgba(255, 245, 197, 0.9)");
    glow.addColorStop(0.27, "rgba(255, 228, 146, 0.4)");
    glow.addColorStop(1, "rgba(255, 218, 120, 0)");
    fillEllipse(ctx, sx, sy, 320, 320, glow);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#f3bf54";
    for (let i = 0; i < 26; i += 1) {
      ctx.save();
      ctx.rotate((i / 26) * TAU);
      ctx.beginPath();
      ctx.moveTo(110, -8);
      ctx.lineTo(180, 0);
      ctx.lineTo(110, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    const sunG = ctx.createRadialGradient(-30, -32, 5, 0, 0, 112);
    sunG.addColorStop(0, "#fffbe2");
    sunG.addColorStop(0.4, "#ffe589");
    sunG.addColorStop(0.82, "#f4b641");
    sunG.addColorStop(1, "#e39d2f");
    fillEllipse(ctx, 0, 0, 96, 96, sunG);
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = "#fff3bc";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 76, -2.5, 0.1);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();

    // Clouds
    function cloud(x, y, scale, alpha) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#fff9e9";
      fillEllipse(ctx, 0, 0, 105, 28, "#fff9e9");
      fillEllipse(ctx, -58, 3, 52, 23, "#fff9e9");
      fillEllipse(ctx, 43, -7, 60, 26, "#fff9e9");
      fillEllipse(ctx, 4, -17, 47, 30, "#fff9e9");
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    cloud(820, 180, 1, 0.42);
    cloud(620, 305, 0.55, 0.26);
    cloud(1370, 470, 0.65, 0.21);

    // Distant haze/hills
    const hills = ctx.createLinearGradient(0, 430, 0, 660);
    hills.addColorStop(0, "rgba(104, 138, 109, 0.42)");
    hills.addColorStop(1, "rgba(77, 117, 86, 0.8)");
    ctx.fillStyle = hills;
    ctx.beginPath();
    ctx.moveTo(0, 610);
    ctx.bezierCurveTo(230, 480, 420, 540, 610, 570);
    ctx.bezierCurveTo(860, 605, 1040, 470, 1270, 540);
    ctx.bezierCurveTo(1350, 565, 1410, 550, 1440, 520);
    ctx.lineTo(1440, 1000);
    ctx.lineTo(0, 1000);
    ctx.closePath();
    ctx.fill();

    // A far potting shed, softened into the hedge.
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = "#4a6b51";
    ctx.beginPath();
    ctx.moveTo(158, 496);
    ctx.lineTo(268, 438);
    ctx.lineTo(378, 496);
    ctx.lineTo(378, 610);
    ctx.lineTo(158, 610);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#f5e9c5";
    ctx.fillRect(196, 528, 54, 46);
    ctx.strokeStyle = "#f5e9c5";
    ctx.lineWidth = 1;
    ctx.strokeRect(237, 540, 35, 70);
    ctx.globalAlpha = 1;
    ctx.restore();

    // Fence
    ctx.save();
    ctx.globalAlpha = 0.72;
    for (let x = -20; x < 1460; x += 42) {
      const h = 76 + (x % 5) * 4;
      ctx.fillStyle = "#c4b58f";
      ctx.beginPath();
      ctx.moveTo(x, 610 + h);
      ctx.lineTo(x, 610);
      ctx.lineTo(x + 6, 592);
      ctx.lineTo(x + 13, 610);
      ctx.lineTo(x + 13, 610 + h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(84, 76, 50, 0.16)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(143, 128, 96, 0.42)";
    ctx.fillRect(0, 632, 1440, 6);
    ctx.fillRect(0, 674, 1440, 6);
    ctx.restore();

    // Meadow layers
    const meadow = ctx.createLinearGradient(0, 610, 0, 1000);
    meadow.addColorStop(0, "#78996d");
    meadow.addColorStop(0.38, "#5d8968");
    meadow.addColorStop(1, "#315a43");
    ctx.fillStyle = meadow;
    ctx.beginPath();
    ctx.moveTo(0, 665);
    ctx.bezierCurveTo(280, 615, 500, 705, 720, 650);
    ctx.bezierCurveTo(940, 595, 1160, 640, 1440, 604);
    ctx.lineTo(1440, 1000);
    ctx.lineTo(0, 1000);
    ctx.closePath();
    ctx.fill();

    // Path
    ctx.beginPath();
    ctx.moveTo(315, 1000);
    ctx.bezierCurveTo(420, 845, 650, 760, 808, 664);
    ctx.lineTo(952, 665);
    ctx.bezierCurveTo(760, 820, 720, 900, 690, 1000);
    ctx.closePath();
    ctx.fillStyle = "rgba(204, 187, 144, 0.42)";
    ctx.fill();
    ctx.strokeStyle = "rgba(243, 231, 193, 0.13)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Grass tufts
    for (let i = 0; i < 250; i += 1) {
      const x = rng() * 1440;
      const y = 650 + rng() * 360;
      const h = 5 + rng() * 18;
      ctx.strokeStyle = rng() > 0.45 ? "rgba(52, 93, 57, 0.38)" : "rgba(195, 213, 148, 0.25)";
      ctx.lineWidth = 1 + rng() * 1.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 2, y - h * 0.6, x + 5 + rng() * 5, y - h);
      ctx.stroke();
    }
    // meadow flowers
    for (let i = 0; i < 60; i += 1) {
      const x = 60 + rng() * 1350;
      const y = 700 + rng() * 280;
      const colors = ["#f8e6ae", "#e7b46b", "#d58b88", "#c6d9a1"];
      tinyFlower(ctx, x, y, 2.5 + rng() * 3.7, colors[i % 4], "#dfb64e", 0.7 + rng() * 0.3);
    }

    // Foreground foliage framing bottom corners
    ctx.save();
    ctx.fillStyle = "rgba(37, 73, 45, 0.86)";
    for (let i = 0; i < 12; i += 1) {
      fillEllipse(ctx, -50 + i * 26, 1040 - rng() * 60, 75, 28, "rgba(39, 74, 45, 0.76)");
      fillEllipse(ctx, 1430 - i * 30, 1020 - rng() * 70, 80, 32, "rgba(36, 69, 44, 0.78)");
    }
    ctx.restore();

    // Leaves framing top left
    ctx.save();
    ctx.globalAlpha = 0.55;
    leaf(ctx, -60, 20, 170, 70, 0.16, "#5c8053", "#88a36a");
    leaf(ctx, -25, -20, 135, 58, 0.72, "#4c7048", "#7c975f");
    ctx.globalAlpha = 1;
    ctx.restore();

    // Paper grain
    ctx.save();
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 1600; i += 1) {
      ctx.fillStyle = rng() > 0.5 ? "#fff8de" : "#3b5739";
      ctx.fillRect(rng() * 1440, rng() * 1000, 1.2, 1.2);
    }
    ctx.restore();

    return canvas;
  }

  function drawMenuScene(ctx, t) {
    if (!menuBackdrop) menuBackdrop = buildMenuBackdrop();
    ctx.clearRect(0, 0, 1440, 1000);
    ctx.drawImage(menuBackdrop, 0, 0);

    // A warm halo and raised flowerbed behind the menu characters.
    ctx.save();
    const halo = ctx.createRadialGradient(1090, 535, 20, 1090, 560, 370);
    halo.addColorStop(0, "rgba(255, 248, 203, 0.32)");
    halo.addColorStop(0.5, "rgba(249, 232, 172, 0.13)");
    halo.addColorStop(1, "rgba(249, 232, 172, 0)");
    fillEllipse(ctx, 1090, 560, 380, 250, halo);
    ctx.fillStyle = "rgba(58, 94, 61, 0.68)";
    ctx.beginPath();
    ctx.moveTo(700, 715);
    ctx.bezierCurveTo(820, 630, 1020, 660, 1160, 636);
    ctx.bezierCurveTo(1290, 615, 1374, 632, 1440, 646);
    ctx.lineTo(1440, 1000);
    ctx.lineTo(560, 1000);
    ctx.bezierCurveTo(590, 880, 642, 780, 700, 715);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Big garden characters rising from the flowerbed, above the level dock.
    ctx.save();
    drawPlant(ctx, "nutshell", 862, 688, 1.55, t, { phase: 1.8, hpRatio: 1 });
    drawPlant(ctx, "peapod", 1210, 690, 1.9, t, { phase: 0.4 });
    drawPlant(ctx, "sunbud", 1025, 690, 2.15, t, { phase: 2.1, glow: true });
    drawPlant(ctx, "frostbell", 1338, 675, 1.16, t, { phase: 0.9, glow: true });
    ctx.restore();

    // A curious mutterling peeks over the flowerbed at the far right.
    ctx.save();
    ctx.beginPath();
    ctx.rect(1260, 490, 180, 180);
    ctx.clip();
    drawEnemy(ctx, "mutterling", 1366, 675, 0.9, t * 0.7, { phase: 2.6, scale: 1.05 });
    ctx.restore();

    // Foreground foliage and flowerbed, mostly tucked behind the level dock.
    ctx.save();
    ctx.fillStyle = "rgba(45, 82, 54, 0.9)";
    for (let i = 0; i < 13; i += 1) {
      fillEllipse(ctx, 710 + i * 61, 688 + Math.sin(i) * 7, 71, 26, "rgba(45, 82, 54, 0.56)");
    }
    for (let i = 0; i < 8; i += 1) {
      const x = 1150 + i * 40;
      ctx.strokeStyle = "rgba(179, 202, 132, 0.3)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x, 694);
      ctx.quadraticCurveTo(x - 8, 640 - (i % 3) * 10, x + 7, 598 - (i % 4) * 12);
      ctx.stroke();
    }
    for (let i = 0; i < 14; i += 1) {
      tinyFlower(ctx, 760 + i * 45, 660 + (i % 4) * 5, 2.2 + (i % 3) * 1.4, i % 2 ? "#f5e2a5" : "#dfb875", "#d4a33e", 0.45);
    }
    ctx.restore();

    // Floating seeds / pollen (movement independent of backdrop)
    ctx.save();
    for (let i = 0; i < 22; i += 1) {
      const x = 120 + ((i * 137 + t * (5 + (i % 3) * 3)) % 1250);
      const y = 130 + ((i * 173 + Math.sin(t * 0.45 + i) * 28) % 700);
      const a = 0.12 + Math.max(0, Math.sin(t * 0.8 + i * 1.3)) * 0.35;
      ctx.globalAlpha = a;
      fillEllipse(ctx, x, y, 2.2 + (i % 4) * 1.2, 2.2 + (i % 4) * 1.2, "#fff5ce");
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Tiny bee/leaf-bird silhouettes
    ctx.save();
    ctx.globalAlpha = 0.25;
    const bx = 760 + Math.sin(t * 0.2) * 33;
    const by = 380 + Math.sin(t * 0.7) * 9;
    fillEllipse(ctx, bx, by, 5, 3, "#4d6343");
    ctx.strokeStyle = "#4d6343";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx + 4, by - 2);
    ctx.lineTo(bx + 8, by - 5);
    ctx.moveTo(bx + 4, by + 2);
    ctx.lineTo(bx + 8, by + 5);
    ctx.stroke();
    ctx.restore();
  }

  function drawLevelThumb(canvas, level) {
    const theme = level.theme || "morning";
    const palette = THEMES[theme];
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const rng = mulberry32(level.id * 3881 + 17);

    const sky = ctx.createLinearGradient(0, 0, W, H);
    sky.addColorStop(0, palette.skyTop);
    sky.addColorStop(0.68, palette.skyBottom);
    sky.addColorStop(1, palette.hedge);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Sun, moon or rainy clouds
    const mx = W * 0.79;
    const my = H * 0.27;
    const warm = theme === "morning" || theme === "dawn";
    const rainy = theme === "rain";
    const lightR = H * (theme === "eclipse" ? 0.22 : rainy ? 0.26 : 0.32);
    ctx.save();
    if (rainy) {
      ctx.globalAlpha = 0.6;
      fillEllipse(ctx, mx, my, W * 0.17, H * 0.07, "rgba(59, 78, 80, 0.72)");
      fillEllipse(ctx, mx - W * 0.1, my + H * 0.03, W * 0.11, H * 0.055, "rgba(71, 91, 91, 0.65)");
      fillEllipse(ctx, mx + W * 0.08, my + H * 0.02, W * 0.09, H * 0.045, "rgba(156, 176, 165, 0.28)");
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = 0.55;
      const glow = ctx.createRadialGradient(mx, my, 2, mx, my, lightR * 2.6);
      glow.addColorStop(0, warm ? "rgba(255,242,182,0.78)" : "rgba(217,239,223,0.34)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      fillEllipse(ctx, mx, my, lightR * 2.6, lightR * 2.6, glow);
      ctx.globalAlpha = 1;
      fillEllipse(ctx, mx, my, lightR, lightR, warm ? (theme === "dawn" ? "#ffe2a0" : "#fbe5a0") : "#e4e6d8");
      if (theme === "eclipse") {
        fillEllipse(ctx, mx + lightR * 0.45, my - lightR * 0.08, lightR * 1.03, lightR * 1.04, palette.skyTop);
      } else if (theme === "dusk" || theme === "starlit") {
        fillEllipse(ctx, mx + lightR * 0.42, my - 1, lightR * 0.94, lightR * 1.01, palette.skyTop);
      }
    }
    ctx.restore();

    // Sky details
    ctx.save();
    if (theme === "starlit" || theme === "eclipse") {
      for (let i = 0; i < 18; i += 1) {
        ctx.globalAlpha = 0.25 + rng() * 0.5;
        fillEllipse(ctx, rng() * W * 0.7, rng() * H * 0.36, 0.8 + rng(), 0.8 + rng(), "#f3efd7");
      }
      ctx.globalAlpha = 1;
    } else if (theme === "rain") {
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "#d7ece3";
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 26; i += 1) {
        const x = rng() * W;
        const y = rng() * H * 0.54;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 3, y + 9);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (theme === "dawn") {
      ctx.globalAlpha = 0.24;
      fillEllipse(ctx, W * 0.26, H * 0.18, W * 0.13, H * 0.035, "#fff3ca");
      fillEllipse(ctx, W * 0.36, H * 0.13, W * 0.09, H * 0.025, "#fff5d8");
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = 0.18;
      fillEllipse(ctx, W * 0.28, H * 0.2, W * 0.2, H * 0.06, "#fff8e6");
      fillEllipse(ctx, W * 0.34, H * 0.17, W * 0.15, H * 0.05, "#fff8e6");
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Hills / hedge
    ctx.fillStyle = palette.hedge;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.62);
    for (let x = 0; x <= W; x += 30) {
      ctx.lineTo(x, H * 0.57 + Math.sin(x * 0.02 + level.id) * H * 0.05);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // Fence line
    ctx.save();
    ctx.globalAlpha = 0.45;
    for (let x = 10; x < W; x += 31) {
      ctx.fillStyle = theme === "eclipse" || theme === "starlit" ? "#7a7568" : theme === "rain" ? "#b3b9a5" : theme === "dawn" ? "#f0ddb3" : "#d8c9a4";
      ctx.fillRect(x, H * 0.54, 7, H * 0.1);
      ctx.beginPath();
      ctx.moveTo(x, H * 0.54);
      ctx.lineTo(x + 3.5, H * 0.51);
      ctx.lineTo(x + 7, H * 0.54);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Lawn
    const lawnY = H * 0.69;
    const lawn = ctx.createLinearGradient(0, lawnY, 0, H);
    lawn.addColorStop(0, palette.lawnA);
    lawn.addColorStop(1, palette.lawnB);
    ctx.fillStyle = lawn;
    ctx.beginPath();
    ctx.moveTo(0, lawnY + 10);
    ctx.quadraticCurveTo(W * 0.4, lawnY - 8, W, lawnY + 12);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 5; i += 1) {
      ctx.strokeStyle = "rgba(237, 243, 177, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, lawnY + 34 + i * 18);
      ctx.lineTo(W, lawnY + 24 + i * 18);
      ctx.stroke();
    }
    ctx.save();
    ctx.strokeStyle = "rgba(44, 80, 39, 0.22)";
    for (let i = 0; i < 70; i += 1) {
      const x = rng() * W;
      const y = lawnY + 18 + rng() * (H - lawnY - 20);
      ctx.lineWidth = 0.8 + rng() * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2 + rng() * 3, y - 3 - rng() * 6);
      ctx.stroke();
    }
    ctx.restore();

    // Path stripe
    ctx.fillStyle = "rgba(219, 202, 158, 0.25)";
    ctx.beginPath();
    ctx.moveTo(0, lawnY + 5);
    ctx.lineTo(W * 0.16, lawnY + 5);
    ctx.lineTo(W * 0.02, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // Characters
    const ground = H * 0.95;
    if (level.id === 1) {
      drawPlant(ctx, "peapod", W * 0.42, ground, H / 200, 0.8, { phase: 0.7 });
      drawPlant(ctx, "sunbud", W * 0.27, ground + 2, H / 174, 0.9, { phase: 1.4, glow: true });
      drawEnemy(ctx, "mutterling", W * 0.65, ground + 3, H / 235, 0.7, { phase: 1.1 });
      drawEnemy(ctx, "mutterling", W * 0.75, ground + 1, H / 280, 0.7, { phase: 2.6 });
    } else if (level.id === 2) {
      drawPlant(ctx, "frostbell", W * 0.3, ground + 3, H / 180, 1.1, { phase: 0.2 });
      drawPlant(ctx, "thornspud", W * 0.41, ground + 4, H / 225, 0.9, { phase: 1.2, armed: true });
      drawPlant(ctx, "peapod", W * 0.52, ground, H / 220, 0.9, { phase: 2.2 });
      drawEnemy(ctx, "crateling", W * 0.7, ground + 2, H / 225, 0.8, { phase: 0.9 });
      // fireflies
      for (let i = 0; i < 10; i += 1) {
        ctx.globalAlpha = 0.45;
        fillEllipse(ctx, W * 0.12 + rng() * W * 0.74, H * 0.2 + rng() * H * 0.5, 2, 2, "#e9f6b0");
        ctx.globalAlpha = 1;
      }
    } else if (level.id === 3) {
      drawPlant(ctx, "twinpod", W * 0.28, ground, H / 190, 1.0, { phase: 1.5 });
      drawPlant(ctx, "dandelion", W * 0.4, ground + 1, H / 215, 1.0, { phase: 0.3 });
      drawPlant(ctx, "frostbell", W * 0.51, ground + 3, H / 235, 0.9, { phase: 2.2 });
      ctx.save();
      ctx.globalAlpha = 0.85;
      drawEnemy(ctx, "boss", W * 0.73, ground - 1, H / 340, 0.4, { phase: 0.7, roar: false });
      ctx.restore();
    } else if (level.id === 4) {
      drawPlant(ctx, "ripplily", W * 0.28, ground + 2, H / 205, 1.1, { phase: 0.8 });
      drawPlant(ctx, "frostbell", W * 0.4, ground, H / 220, 1.0, { phase: 1.7, glow: true });
      drawPlant(ctx, "nutshell", W * 0.51, ground + 2, H / 255, 1.0, { phase: 2.4 });
      drawEnemy(ctx, "mossguard", W * 0.68, ground + 1, H / 285, 0.9, { phase: 1.1, hpRatio: 0.8 });
      drawEnemy(ctx, "crateling", W * 0.78, ground + 3, H / 300, 0.85, { phase: 2.8 });
    } else if (level.id === 5) {
      drawPlant(ctx, "prismbloom", W * 0.3, ground + 1, H / 200, 1.15, { phase: 1.4, fire: true });
      drawPlant(ctx, "twinpod", W * 0.43, ground + 2, H / 225, 1.0, { phase: 0.3 });
      drawPlant(ctx, "ripplily", W * 0.53, ground + 3, H / 260, 0.9, { phase: 2.2 });
      drawEnemy(ctx, "canhead", W * 0.71, ground + 1, H / 280, 0.9, { phase: 2.2 });
      drawEnemy(ctx, "zippy", W * 0.82, ground + 3, H / 330, 0.9, { phase: 0.6 });
    } else {
      drawPlant(ctx, "dawnbell", W * 0.26, ground + 1, H / 220, 1.1, { phase: 1.1, fire: true });
      drawPlant(ctx, "prismbloom", W * 0.4, ground + 2, H / 245, 1.0, { phase: 0.5 });
      drawPlant(ctx, "twinpod", W * 0.51, ground + 2, H / 265, 0.9, { phase: 2.1 });
      ctx.save();
      ctx.globalAlpha = 0.9;
      drawEnemy(ctx, "bellwarden", W * 0.72, ground + 2, H / 390, 0.43, { phase: 0.7, roar: false });
      ctx.restore();
    }

    // foreground foliage
    ctx.save();
    ctx.fillStyle = "rgba(38, 72, 47, 0.65)";
    for (let i = 0; i < 9; i += 1) {
      fillEllipse(ctx, -20 + i * 78, H + 8, 61, 24, "rgba(38, 72, 47, 0.5)");
    }
    ctx.restore();

    // bottom vignette for legibility
    const bottom = ctx.createLinearGradient(0, H * 0.6, 0, H);
    bottom.addColorStop(0, "rgba(8, 23, 13, 0)");
    bottom.addColorStop(1, "rgba(8, 23, 13, 0.3)");
    ctx.fillStyle = bottom;
    ctx.fillRect(0, 0, W, H);
  }

  function drawIntroArt(canvas, level) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const theme = level.theme || "morning";
    const palette = THEMES[theme];
    ctx.clearRect(0, 0, W, H);
    const rng = mulberry32(level.id * 293 + 81);

    // gradient sky
    const sky = ctx.createLinearGradient(0, 0, W, H);
    if (theme === "morning") {
      sky.addColorStop(0, "#f5e1ad");
      sky.addColorStop(0.55, "#c5d7a8");
      sky.addColorStop(1, "#5f8a6e");
    } else if (theme === "dusk") {
      sky.addColorStop(0, "#223c44");
      sky.addColorStop(0.6, "#5d7d6b");
      sky.addColorStop(1, "#2f503e");
    } else if (theme === "rain") {
      sky.addColorStop(0, "#526e78");
      sky.addColorStop(0.55, "#89a89a");
      sky.addColorStop(1, "#3b604c");
    } else if (theme === "starlit") {
      sky.addColorStop(0, "#0e1b32");
      sky.addColorStop(0.58, "#2d494d");
      sky.addColorStop(1, "#203b30");
    } else if (theme === "dawn") {
      sky.addColorStop(0, "#f2c191");
      sky.addColorStop(0.52, "#ffdfa8");
      sky.addColorStop(1, "#829b60");
    } else {
      sky.addColorStop(0, "#171a32");
      sky.addColorStop(0.55, "#474c64");
      sky.addColorStop(1, "#274036");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Light source
    const lightX = W * 0.75;
    const lightY = H * 0.2;
    const warmLight = theme === "morning" || theme === "dawn";
    const coolLight = theme === "eclipse" || theme === "starlit";
    const glow = ctx.createRadialGradient(lightX, lightY, 2, lightX, lightY, H * 0.62);
    glow.addColorStop(0, theme === "rain" ? "rgba(213,233,220,0.32)" : warmLight ? "rgba(255,243,187,0.78)" : "rgba(221,236,214,0.38)");
    glow.addColorStop(0.4, warmLight ? "rgba(255,214,135,0.22)" : "rgba(216,232,211,0.12)");
    glow.addColorStop(1, "rgba(255,225,150,0)");
    fillEllipse(ctx, lightX, lightY, H * 0.62, H * 0.62, glow);
    if (theme === "rain") {
      ctx.save();
      ctx.globalAlpha = 0.48;
      fillEllipse(ctx, lightX - 30, lightY + 16, 160, 54, "rgba(58, 80, 83, 0.5)");
      fillEllipse(ctx, lightX + 65, lightY + 26, 105, 36, "rgba(87, 107, 103, 0.4)");
      ctx.globalAlpha = 1;
      ctx.restore();
    } else {
      fillEllipse(ctx, lightX, lightY, H * 0.14, H * 0.14, warmLight ? (theme === "dawn" ? "#ffe1a0" : "#fae8aa") : "#e5e6d5");
      if (coolLight) {
        fillEllipse(ctx, lightX + H * 0.06, lightY - H * 0.01, H * 0.14, H * 0.14, theme === "starlit" ? "#193041" : "#1e2238");
      }
    }

    // hills
    ctx.fillStyle = theme === "morning" ? "rgba(86, 122, 83, 0.75)"
      : theme === "rain" ? "rgba(58, 89, 73, 0.82)"
        : theme === "dawn" ? "rgba(104, 128, 77, 0.78)" : "rgba(49, 74, 61, 0.8)";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.55);
    ctx.bezierCurveTo(W * 0.24, H * 0.48, W * 0.5, H * 0.6, W, H * 0.48);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // greenhouse arches / fence in back
    ctx.save();
    ctx.globalAlpha = (theme === "eclipse" || theme === "starlit") ? 0.3 : theme === "rain" ? 0.4 : 0.45;
    ctx.strokeStyle = theme === "rain" ? "#c8d4bf" : "#e8dfc2";
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 4; i += 1) {
      const x = W * 0.1 + i * W * 0.17;
      ctx.beginPath();
      ctx.moveTo(x, H * 0.66);
      ctx.lineTo(x, H * 0.4);
      ctx.quadraticCurveTo(x + W * 0.065, H * 0.3, x + W * 0.13, H * 0.4);
      ctx.lineTo(x + W * 0.13, H * 0.66);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(W * 0.04, H * 0.45);
    ctx.lineTo(W * 0.8, H * 0.45);
    ctx.stroke();
    ctx.restore();

    // Atmosphere: rain, stars or petals
    ctx.save();
    if (theme === "rain") {
      ctx.strokeStyle = "rgba(220, 244, 233, 0.36)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 34; i += 1) {
        const x = rng() * W;
        const y = rng() * H * 0.7;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 4, y + 13);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.23;
      for (let i = 0; i < 4; i += 1) {
        ctx.strokeStyle = "rgba(226, 247, 237, 0.7)";
        ctx.beginPath();
        ctx.ellipse(60 + i * 150, H * 0.79 + (i % 2) * 10, 18 + i * 5, 4.5, 0, 0, TAU);
        ctx.stroke();
      }
    } else if (theme === "starlit" || theme === "eclipse") {
      for (let i = 0; i < 22; i += 1) {
        ctx.globalAlpha = 0.25 + rng() * 0.48;
        fillEllipse(ctx, rng() * W * 0.75, rng() * H * 0.43, 1 + rng(), 1 + rng(), "#f2efd6");
      }
    } else if (theme === "dawn") {
      for (let i = 0; i < 12; i += 1) {
        ctx.globalAlpha = 0.22 + rng() * 0.3;
        ctx.fillStyle = i % 2 ? "#ffe9b6" : "#f7bea0";
        ctx.beginPath();
        ctx.ellipse(rng() * W, rng() * H * 0.5, 3 + rng() * 3, 1.3 + rng(), -0.4, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // lawn foreground
    const lawn = ctx.createLinearGradient(0, H * 0.62, 0, H);
    lawn.addColorStop(0, palette.lawnA);
    lawn.addColorStop(1, palette.lawnB);
    ctx.fillStyle = lawn;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.72);
    ctx.bezierCurveTo(W * 0.35, H * 0.65, W * 0.7, H * 0.76, W, H * 0.66);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 60; i += 1) {
      const x = rng() * W;
      const y = H * 0.74 + rng() * H * 0.25;
      ctx.strokeStyle = "rgba(44, 82, 41, 0.25)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y - 4 - rng() * 4);
      ctx.stroke();
    }

    // Character group based on level
    if (level.id === 1) {
      drawPlant(ctx, "sunbud", W * 0.3, H * 0.9, H / 235, 1.4, { phase: 1.2, glow: true });
      drawPlant(ctx, "peapod", W * 0.47, H * 0.92, H / 260, 1.1, { phase: 0.4 });
      drawPlant(ctx, "nutshell", W * 0.2, H * 0.97, H / 300, 1, { phase: 2.1 });
      drawEnemy(ctx, "mutterling", W * 0.72, H * 0.89, H / 360, 0.9, { phase: 1.8 });
      drawEnemy(ctx, "mutterling", W * 0.83, H * 0.94, H / 400, 1.1, { phase: 0.3 });
    } else if (level.id === 2) {
      drawPlant(ctx, "frostbell", W * 0.26, H * 0.91, H / 245, 1.3, { phase: 0.7, glow: true });
      drawPlant(ctx, "thornspud", W * 0.4, H * 0.97, H / 280, 1.2, { phase: 1.2, armed: true });
      drawPlant(ctx, "nutshell", W * 0.56, H * 0.94, H / 330, 1, { phase: 0.2, hpRatio: 0.8 });
      drawEnemy(ctx, "crateling", W * 0.78, H * 0.9, H / 350, 0.8, { phase: 2.2 });
      drawEnemy(ctx, "zippy", W * 0.9, H * 0.97, H / 390, 1, { phase: 1.1 });
    } else if (level.id === 3) {
      drawPlant(ctx, "twinpod", W * 0.22, H * 0.92, H / 250, 1.3, { phase: 0.9 });
      drawPlant(ctx, "dandelion", W * 0.38, H * 0.94, H / 280, 1.2, { phase: 1.8 });
      drawPlant(ctx, "frostbell", W * 0.51, H * 0.93, H / 320, 1, { phase: 2.4 });
      drawEnemy(ctx, "boss", W * 0.74, H * 0.98, H / 470, 0.35, { phase: 0.6 });
    } else if (level.id === 4) {
      drawPlant(ctx, "ripplily", W * 0.25, H * 0.92, H / 260, 1.2, { phase: 0.9 });
      drawPlant(ctx, "frostbell", W * 0.38, H * 0.94, H / 300, 1.1, { phase: 1.7, glow: true });
      drawPlant(ctx, "nutshell", W * 0.49, H * 0.96, H / 330, 1, { phase: 2.4, hpRatio: 0.8 });
      drawEnemy(ctx, "mossguard", W * 0.66, H * 0.94, H / 360, 0.9, { phase: 1.3, hpRatio: 0.8 });
      drawEnemy(ctx, "crateling", W * 0.8, H * 0.98, H / 400, 1, { phase: 2.8 });
    } else if (level.id === 5) {
      drawPlant(ctx, "prismbloom", W * 0.27, H * 0.93, H / 255, 1.15, { phase: 1.4, fire: true });
      drawPlant(ctx, "twinpod", W * 0.41, H * 0.95, H / 300, 1.05, { phase: 0.3 });
      drawPlant(ctx, "ripplily", W * 0.53, H * 0.95, H / 350, 0.9, { phase: 2.2 });
      drawEnemy(ctx, "canhead", W * 0.7, H * 0.96, H / 370, 0.9, { phase: 2.2 });
      drawEnemy(ctx, "zippy", W * 0.84, H * 0.98, H / 430, 1, { phase: 0.6 });
    } else {
      drawPlant(ctx, "dawnbell", W * 0.24, H * 0.93, H / 280, 1.1, { phase: 1.1, fire: true });
      drawPlant(ctx, "prismbloom", W * 0.39, H * 0.95, H / 310, 1, { phase: 0.5 });
      drawPlant(ctx, "twinpod", W * 0.5, H * 0.96, H / 340, 0.9, { phase: 2.1 });
      ctx.save();
      ctx.globalAlpha = 0.92;
      drawEnemy(ctx, "bellwarden", W * 0.73, H * 0.99, H / 500, 0.38, { phase: 0.7, roar: false });
      ctx.restore();
    }

    // foreground grass
    ctx.save();
    ctx.fillStyle = "rgba(33, 65, 43, 0.75)";
    for (let i = 0; i < 10; i += 1) {
      fillEllipse(ctx, -18 + i * 68, H + 12, 55, 23, "rgba(33, 65, 43, 0.55)");
    }
    ctx.restore();

    // fireflies / sparks
    if (theme !== "morning" && theme !== "rain") {
      ctx.save();
      const sparkColor = theme === "starlit" ? "#c8eed7" : theme === "dawn" ? "#ffe2ae" : "#f2e8a6";
      for (let i = 0; i < 14; i += 1) {
        const x = W * 0.1 + rng() * W * 0.85;
        const y = H * 0.15 + rng() * H * 0.55;
        ctx.globalAlpha = 0.25 + rng() * 0.4;
        fillEllipse(ctx, x, y, 1.8 + rng() * 1.8, 1.8 + rng() * 1.8, sparkColor);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    // subtle grain
    ctx.save();
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 600; i += 1) {
      ctx.fillStyle = rng() > 0.5 ? "#fff5da" : "#1e3625";
      ctx.fillRect(rng() * W, rng() * H, 1, 1);
    }
    ctx.restore();
  }

  function drawResultArt(canvas, level, won) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    if (won) {
      sky.addColorStop(0, "#f6e3b0");
      sky.addColorStop(0.6, "#d8d7a3");
      sky.addColorStop(1, "#93af7e");
    } else {
      sky.addColorStop(0, "#aeb8b2");
      sky.addColorStop(0.65, "#899a8d");
      sky.addColorStop(1, "#566c5e");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // sun glow
    const cx = W * 0.52;
    const cy = H * 0.44;
    const glow = ctx.createRadialGradient(cx, cy, 3, cx, cy, W * 0.38);
    glow.addColorStop(0, won ? "rgba(255, 245, 189, 0.95)" : "rgba(230, 235, 219, 0.43)");
    glow.addColorStop(0.5, won ? "rgba(255, 217, 122, 0.33)" : "rgba(210, 218, 204, 0.12)");
    glow.addColorStop(1, "rgba(255, 223, 143, 0)");
    fillEllipse(ctx, cx, cy, W * 0.38, W * 0.38, glow);
    fillEllipse(ctx, cx, cy, W * 0.15, W * 0.15, won ? "#f6d071" : "#dfe2d1");
    if (!won) {
      fillEllipse(ctx, cx + W * 0.05, cy - 3, W * 0.14, W * 0.14, "#9eaba0");
    }

    // rolling hill
    ctx.fillStyle = won ? "rgba(92, 128, 81, 0.65)" : "rgba(77, 97, 82, 0.72)";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.7);
    ctx.quadraticCurveTo(W * 0.3, H * 0.56, W * 0.62, H * 0.72);
    ctx.quadraticCurveTo(W * 0.82, H * 0.8, W, H * 0.65);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // leaves at bottom
    ctx.save();
    ctx.globalAlpha = 0.75;
    leaf(ctx, W * 0.1, H * 0.9, W * 0.22, H * 0.12, -0.75, "#527b48", "#7e9f61");
    leaf(ctx, W * 0.32, H * 0.96, W * 0.2, H * 0.1, -1.4, "#436c40", "#6f9557");
    leaf(ctx, W * 0.9, H * 0.93, W * 0.23, H * 0.12, -2.3, "#4d7647", "#789a5e");
    ctx.restore();

    if (won) {
      // little sprout silhouette
      drawPlant(ctx, "sunbud", W * 0.5, H * 0.94, H / 290, 1.2, { phase: 1, glow: true });
      ctx.save();
      for (let i = 0; i < 9; i += 1) {
        const a = -1.9 + i * 0.23;
        sparkle(ctx, W * 0.5 + Math.cos(a) * (W * 0.23 + (i % 3) * 12), H * 0.38 + Math.sin(a) * (H * 0.2 + (i % 2) * 10), 2 + (i % 2), "#fff4c9", 0.45);
      }
      ctx.restore();
    } else {
      // dim leaf
      drawPlant(ctx, "nutshell", W * 0.5, H * 0.93, H / 250, 1.1, { phase: 1, hpRatio: 0.42 });
    }

    // grain
    ctx.save();
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 280; i += 1) {
      ctx.fillStyle = "#fff5da";
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
    ctx.restore();
  }

  function paintPlantThumb(canvas, type) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const cfg = (Sunbud.DATA && Sunbud.DATA.plants && Sunbud.DATA.plants[type]) || {};
    const typeScale = type === "twinpod" ? 1.02
      : type === "dandelion" ? 0.9
        : type === "dawnbell" ? 0.82
          : type === "prismbloom" ? 0.95
            : type === "ripplily" ? 1 : 1.06;
    const scale = typeScale * (H / 130);
    ctx.save();
    // soft soil halo
    ctx.globalAlpha = 0.4;
    fillEllipse(ctx, W * 0.5, H * 0.88, W * 0.33, H * 0.1, "rgba(80, 106, 62, 0.2)");
    ctx.globalAlpha = 1;
    drawPlant(ctx, type, W * 0.5, H * 0.88, scale, 1.4, {
      phase: (cfg.id || type).length * 0.7,
      hpRatio: 1,
      armed: type !== "thornspud",
      glow: type === "sunbud" || type === "prismbloom" || type === "dawnbell",
      fire: type === "prismbloom" || type === "dawnbell"
    });
    ctx.restore();
  }

  /* ---------------------------------------------------------
     Exports
     --------------------------------------------------------- */

  function cellCenter(row, col) {
    return {
      x: GRID.x + col * GRID.cw + GRID.cw / 2,
      y: GRID.y + row * GRID.ch + GRID.ch / 2
    };
  }

  function cellGround(row) {
    return GRID.y + row * GRID.ch + GRID.ch / 2 + 42;
  }

  function cellAt(x, y) {
    if (x < GRID.x || y < GRID.y || x >= GRID.x + GRID.width || y >= GRID.y + GRID.height) return null;
    return {
      row: Math.floor((y - GRID.y) / GRID.ch),
      col: Math.floor((x - GRID.x) / GRID.cw)
    };
  }

  Sunbud.Art = {
    BOARD: BOARD,
    GRID: GRID,
    THEMES: THEMES,
    MOWER_X: MOWER_X,
    SPAWN_X: SPAWN_X,
    HOUSE_X: HOUSE_X,
    cellCenter: cellCenter,
    cellGround: cellGround,
    cellAt: cellAt,
    drawPlant: drawPlant,
    drawEnemy: drawEnemy,
    drawSunToken: drawSunToken,
    drawMower: drawMower,
    drawProjectile: drawProjectile,
    drawBackground: function (ctx, theme) {
      const canvas = getBackground(theme);
      ctx.drawImage(canvas, 0, 0);
    },
    drawAmbient: drawAmbient,
    drawCellHighlight: drawCellHighlight,
    drawCellMark: drawCellMark,
    drawMenuScene: drawMenuScene,
    drawLevelThumb: drawLevelThumb,
    drawIntroArt: drawIntroArt,
    drawResultArt: drawResultArt,
    paintPlantThumb: paintPlantThumb,
    sparkle: sparkle
  };
})(window);
