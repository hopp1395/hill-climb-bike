"use strict";
/* Regen, Sturm, Tornado und Blitzwarnung
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* ---- Wetter zeichnen ---------------------------------------------------
   Regen und Böen laufen in Bildschirmkoordinaten (0..1), damit sie unabhängig
   von Kamera und Fenstergröße gleich dicht bleiben. */
const RAIN = Array.from({ length: 300 }, () => ({
  x: Math.random(), y: Math.random(), v: 0.75 + Math.random() * 0.6, l: 0.6 + Math.random() * 0.7,
}));
const GUST = Array.from({ length: 40 }, () => ({
  x: Math.random(), y: Math.random(), v: 0.5 + Math.random() * 0.9, l: 0.04 + Math.random() * 0.13,
}));
let weaT = 0;

function drawTornado() {
  if (WEA.kind !== "tornado" || WEA.p < 0.02) return;
  const gx = sx(WEA.tx);
  if (gx < -700 || gx > W + 700) return;
  const gy = sy(terrainY(WEA.tx)), top = -60, N = 26;
  const wob = t => Math.sin(t * 3.1 + WEA.spin * 1.7) * 34 * t * SCALE;
  const wid = t => (14 + 240 * t * t) * SCALE;
  ctx.save();
  ctx.globalAlpha = 0.72 * WEA.p;
  // Staubwolke am Fuß
  const fg = ctx.createRadialGradient(sx(WEA.tx), gy, 4, sx(WEA.tx), gy, 130 * SCALE);
  fg.addColorStop(0, "rgba(96,104,122,.75)");
  fg.addColorStop(1, "rgba(96,104,122,0)");
  ctx.fillStyle = fg;
  ctx.beginPath(); ctx.ellipse(sx(WEA.tx), gy, 130 * SCALE, 46 * SCALE, 0, 0, 7); ctx.fill();
  const g = ctx.createLinearGradient(0, top, 0, gy);
  g.addColorStop(0, "rgba(148,158,178,.95)");
  g.addColorStop(1, "rgba(56,64,82,.7)");
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = i / N, y = gy + (top - gy) * t, X = gx + wob(t) - wid(t);
    i ? ctx.lineTo(X, y) : ctx.moveTo(X, y);
  }
  for (let i = N; i >= 0; i--) {
    const t = i / N;
    ctx.lineTo(gx + wob(t) + wid(t), gy + (top - gy) * t);
  }
  ctx.closePath(); ctx.fill();
  // Spiralen als Drehrichtung
  ctx.strokeStyle = "rgba(232,240,252,.4)"; ctx.lineWidth = 2 * SCALE;
  for (let s = 0; s < 4; s++) {
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const t = i / N, y = gy + (top - gy) * t;
      const X = gx + wob(t) + Math.cos(WEA.spin * 2.6 + s * 1.57 + t * 5.4) * wid(t);
      i ? ctx.lineTo(X, y) : ctx.moveTo(X, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function strokePts(pts) {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const X = sx(pts[i][0]), Y = sy(pts[i][1]);
    i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
  }
  ctx.stroke();
}

// Vorwarnung: Zielring am Boden, Lichtsäule und Countdown-Bogen
function drawBoltWarn() {
  if (WEA.warnLeft <= 0) return;
  const wx = WEA.warnX;
  const x = Math.max(26, Math.min(W - 26, sx(wx))), y = sy(groundUnder(wx, 1e9));
  const off = Math.abs(sx(wx) - x) > 1;
  const t = 1 - WEA.warnLeft / (WEA.warnGes || CFG.WEA_BOLT_WARN);
  const puls = 0.5 + 0.5 * Math.sin(WEA.warnLeft * 30);
  ctx.save();
  ctx.textAlign = "center";
  if (!off) {
    // Lichtkegel statt Balken – nach oben schmal, damit es nicht wie ein
    // Rechteck über der Landschaft klebt
    const oben = y - 460 * SCALE;
    const g = ctx.createLinearGradient(x, oben, x, y);
    g.addColorStop(0, "rgba(255,226,130,0)");
    g.addColorStop(1, "rgba(255,214,90," + (0.12 + 0.18 * puls) + ")");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 7 * SCALE, oben); ctx.lineTo(x + 7 * SCALE, oben);
    ctx.lineTo(x + 46 * SCALE, y); ctx.lineTo(x - 46 * SCALE, y);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,214,90," + (0.55 + 0.45 * puls) + ")";
    ctx.lineWidth = 3 * SCALE;
    const r = (62 - 30 * t) * SCALE;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.4, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.52, r * 0.21, 0, -1.57, -1.57 + t * 6.283); ctx.stroke();
  }
  ctx.font = "700 " + Math.round(28 * SCALE) + "px system-ui";
  ctx.fillStyle = "rgba(255,226,120," + (0.6 + 0.4 * puls) + ")";
  ctx.fillText("⚡", x, off ? H * 0.3 : y - 48 * SCALE);
  ctx.restore();
}

function drawWeather() {
  const now = performance.now() / 1000;
  const dt = Math.min(0.05, weaT ? now - weaT : 0.016);
  weaT = now;
  const p = WEA.p;
  const wind = windAcc(!rear.grounded && !front.grounded) / CFG.WEA_WIND;
  ctx.save();

  if (p > 0.01) {
    const dunkel = { regen: 0.26, gewitter: 0.42, sturm: 0.22, tornado: 0.34 }[WEA.kind] || 0;
    ctx.fillStyle = "rgba(12,18,34," + (dunkel * p) + ")";
    ctx.fillRect(0, 0, W, H);
  }

  const regen = (WEA.kind === "regen" ? 1 : WEA.kind === "gewitter" ? 1.15 : 0) * p;
  if (regen > 0.01) {
    for (const d of RAIN) {
      d.y += d.v * dt * 1.5;
      d.x += wind * d.v * dt * 0.4;
      if (d.y > 1.05) { d.y -= 1.1; d.x = Math.random(); }
      d.x = (d.x % 1 + 1) % 1;
    }
    ctx.strokeStyle = "rgba(198,222,250,.5)";
    ctx.lineWidth = Math.max(1, 1.1 * SCALE);
    ctx.lineCap = "round";
    ctx.beginPath();
    const n = Math.round(RAIN.length * Math.min(1, regen));
    for (let i = 0; i < n; i++) {
      const d = RAIN[i], X = d.x * W, Y = d.y * H, L = 15 * d.l * d.v * SCALE;
      ctx.moveTo(X, Y); ctx.lineTo(X + wind * L * 1.2, Y + L);
    }
    ctx.stroke();
  }

  const boe = (WEA.kind === "sturm" || WEA.kind === "tornado") ? p : 0;
  if (boe > 0.01) {
    const dir = wind < 0 ? -1 : 1;
    for (const g of GUST) {
      g.x += wind * g.v * dt * 0.6;
      g.x = (g.x % 1 + 1) % 1;
    }
    ctx.strokeStyle = "rgba(255,255,255," + (0.18 * boe) + ")";
    ctx.lineWidth = Math.max(1, 2 * SCALE);
    ctx.beginPath();
    for (const g of GUST) {
      const X = g.x * W, L = g.l * W * (0.4 + Math.abs(wind));
      ctx.moveTo(X, g.y * H); ctx.lineTo(X + L * dir, g.y * H);
    }
    ctx.stroke();
  }

  drawBoltWarn();
  if (WEA.bolt) {
    const a = Math.min(1, WEA.bolt.t / 0.16);
    ctx.save();
    ctx.lineJoin = ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,246,190," + (0.45 * a) + ")";
    ctx.lineWidth = 12 * SCALE;
    strokePts(WEA.bolt.pts); strokePts(WEA.bolt.ast);
    ctx.strokeStyle = "rgba(255,255,255," + a + ")";
    ctx.lineWidth = 3.4 * SCALE; strokePts(WEA.bolt.pts);
    ctx.lineWidth = 2 * SCALE; strokePts(WEA.bolt.ast);
    ctx.restore();
  }
  if (WEA.flash > 0.01) {
    ctx.fillStyle = "rgba(255,255,255," + (WEA.flash * 0.5) + ")";
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}
