"use strict";
/* Geist, Gefahren und Helikopter
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* ---- Gefahren zeichnen -------------------------------------------------- */
/* Der Geist als durchscheinende Silhouette. Er fährt auf dem Boden, der jetzt
   da ist – gezeichnet wird er im selben lokalen System wie das Bike. */
function drawGeist() {
  const gx = geistX();
  if (gx === null) return;
  const px = sx(gx);
  if (px < -140 || px > W + 140) return;
  const gy = terrainY(gx) + CFG.WHEEL_R;
  const ang = Math.atan(slopeAt(gx));
  const hb = CFG.WHEELBASE / 2;
  ctx.save();
  ctx.translate(px, sy(gy));
  ctx.rotate(-ang);
  ctx.scale(SCALE, SCALE);
  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = "#cfe8ff"; ctx.lineWidth = 2.6; ctx.lineCap = "round";
  ctx.beginPath();                                  // Räder
  ctx.arc(-hb, 0, CFG.WHEEL_R, 0, 7);
  ctx.moveTo(hb + CFG.WHEEL_R, 0); ctx.arc(hb, 0, CFG.WHEEL_R, 0, 7);
  ctx.stroke();
  ctx.beginPath();                                  // Rahmen und Lenker
  ctx.moveTo(-hb, 0); ctx.lineTo(-8, -14); ctx.lineTo(10, -12); ctx.lineTo(hb, 0);
  ctx.moveTo(10, -12); ctx.lineTo(20, -26);
  ctx.stroke();
  ctx.lineWidth = 5;                                // Fahrer
  ctx.beginPath();
  ctx.moveTo(-16, -20); ctx.lineTo(-3, -36);
  ctx.moveTo(-4, -34); ctx.lineTo(18, -25);
  ctx.stroke();
  ctx.fillStyle = "#cfe8ff";
  ctx.beginPath(); ctx.arc(0, -(CFG.HEAD_H + 11), 12, 0, 7); ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawGefahren() {
  const t = performance.now() / 1000;

  // Adler
  const a = GEF.adler;
  if (a) {
    const px = sx(a.x), py = sy(a.y), s = SCALE * 1.9;
    if (a.phase === "tot") {
      const f = 1 - a.t / 0.9;                       // Federwolke
      ctx.fillStyle = rgba([90, 68, 52], 0.5 * f);
      for (let i = 0; i < 7; i++) {
        const w = i * 1.4 + a.t * 2, r = (14 + i * 5) * (1 + a.t * 1.6) * s;
        ctx.beginPath();
        ctx.ellipse(px + Math.cos(w) * r, py + Math.sin(w) * r * 0.6 + a.t * 40 * s,
                    4 * s, 2 * s, w, 0, 7);
        ctx.fill();
      }
    } else {
      const sturz = a.phase === "sturz";
      const schlag = sturz ? 0.25 : Math.sin(t * 9 + a.ph);   // im Sturz angelegt
      ctx.save();
      ctx.translate(px, py);
      if (sturz) ctx.rotate(Math.atan2(-a.vy, a.vx));
      ctx.scale(s, s);
      ctx.fillStyle = "#4a3c30";
      ctx.beginPath();                                        // Flügel
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-11, -5 - schlag * 7, -22, -1 - schlag * 11);
      ctx.quadraticCurveTo(-12, 3, 0, 4);
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(11, -5 - schlag * 7, 22, -1 - schlag * 11);
      ctx.quadraticCurveTo(12, 3, 0, 4);
      ctx.fill();
      ctx.fillStyle = "#3b2f26";
      ctx.beginPath(); ctx.ellipse(2, 1, 8, 4, 0, 0, 7); ctx.fill();   // Rumpf
      ctx.fillStyle = "#e8e2d6";
      ctx.beginPath(); ctx.arc(9, 0, 3.4, 0, 7); ctx.fill();           // heller Kopf
      ctx.fillStyle = "#f2b23c";
      ctx.beginPath();                                                 // Schnabel
      ctx.moveTo(12, -1); ctx.lineTo(16, 0.4); ctx.lineTo(12, 1.8); ctx.closePath(); ctx.fill();
      ctx.restore();
      if (!sturz) {                       // Warnzeichen, solange er noch kreist
        const w = 0.35 + 0.35 * Math.sin(t * 9);
        ctx.strokeStyle = rgba([255, 120, 90], w);
        ctx.lineWidth = 2 * SCALE;
        ctx.beginPath(); ctx.arc(px, py, 34 * SCALE, 0, 7); ctx.stroke();
      }
    }
  }

  // Entführer
  const u = GEF.ufo;
  if (u) {
    const gy = groundUnder(u.x, 1e9);
    // Die Untertasse hängt hoch über dem Boden und läge sonst über dem Bildrand.
    // Sie wird deshalb am oberen Rand gehalten – man muss sehen, wer einen holt.
    const px = sx(u.x), oben = Math.max(24 * SCALE, sy(gy + 900)), unten2 = sy(gy);
    const auf = u.phase === "warn" ? smooth(u.t / warnZeit(CFG.UFO_WARN)) : 1;
    const b = u.phase === "fang" ? Math.max(0, 1 - u.t / 0.75) : auf;
    const br = CFG.UFO_HIT * SCALE * (0.35 + auf * 0.65);
    const g = ctx.createLinearGradient(px, oben, px, unten2);
    g.addColorStop(0, rgba([170, 255, 210], 0.55 * b));
    g.addColorStop(1, rgba([120, 255, 190], 0.05 * b));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(px - br * 0.35, oben); ctx.lineTo(px + br * 0.35, oben);
    ctx.lineTo(px + br, unten2); ctx.lineTo(px - br, unten2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba([190, 255, 220], 0.5 * b);   // Ring am Boden
    ctx.lineWidth = 2.5 * SCALE;
    ctx.beginPath(); ctx.ellipse(px, unten2, br, br * 0.3, 0, 0, 7); ctx.stroke();
    const s = SCALE * 2.4;                              // Untertasse
    ctx.save();
    ctx.translate(px, oben + 6 * s);
    ctx.scale(s, s);
    ctx.fillStyle = "#8fb0c8";
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#b9e4ff";
    ctx.beginPath(); ctx.ellipse(0, -5, 12, 8, 0, Math.PI, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = rgba([150, 255, 200], 0.5 + 0.5 * Math.sin(t * 8));
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.arc(i * 9, 2, 2, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  // Komet
  const k = GEF.komet;
  if (k) {
    const px = sx(k.x), py = sy(k.y);
    if (k.phase === "warn") {
      const f = k.t / warnZeit(CFG.KOMET_WARN);
      const r = CFG.KOMET_HIT * SCALE;
      ctx.strokeStyle = rgba([255, 150, 90], 0.35 + 0.45 * Math.abs(Math.sin(k.t * 9)));
      ctx.lineWidth = 2.6 * SCALE;
      ctx.beginPath(); ctx.ellipse(px, py, r, r * 0.34, 0, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(px, py, r * (1 - f), r * 0.34 * (1 - f), 0, 0, 7); ctx.stroke();
      // der Brocken kommt von oben rechts angeflogen
      const d = (1 - f) * 900 * SCALE;
      const kx = px + d * 0.55, ky = py - d;
      const gl = ctx.createLinearGradient(kx, ky, kx + 120 * SCALE, ky - 110 * SCALE);
      gl.addColorStop(0, "rgba(255,240,210,.95)");
      gl.addColorStop(1, "rgba(255,150,90,0)");
      ctx.strokeStyle = gl; ctx.lineWidth = 5 * SCALE; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx + 120 * SCALE, ky - 110 * SCALE); ctx.stroke();
      ctx.fillStyle = "#fff4dc";
      ctx.beginPath(); ctx.arc(kx, ky, 7 * SCALE, 0, 7); ctx.fill();
    } else {
      const f = 1 - k.t / 1.1;
      const r = CFG.KOMET_HIT * SCALE * (1 + (1 - f) * 2.2);
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, rgba([255, 245, 220], 0.9 * f));
      g.addColorStop(0.4, rgba([255, 150, 70], 0.5 * f));
      g.addColorStop(1, rgba([200, 60, 40], 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
    }
  }
}

/* Mitflug-Heli. Er schwebt an seiner Stelle und wippt leicht; während er trägt,
   folgt er dem Bike und hängt es unter die Kufen. */
function heliBild(px, py, s, t) {
  const dreh = t * 26;
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(s, s);
  ctx.strokeStyle = "#2c3446"; ctx.lineWidth = 3; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-14, 15); ctx.lineTo(20, 15);      // Kufen
  ctx.moveTo(-8, 8); ctx.lineTo(-11, 15); ctx.moveTo(10, 8); ctx.lineTo(13, 15);
  ctx.stroke();
  ctx.fillStyle = "#3f6b46";                                     // Heckausleger
  ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-40, -2);
  ctx.lineTo(-40, 3); ctx.lineTo(-6, 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#4f8256";                                     // Kabine
  ctx.beginPath(); ctx.ellipse(4, 0, 20, 13, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "rgba(150,205,240,.85)";                       // Kanzel
  ctx.beginPath(); ctx.ellipse(11, -2, 9, 8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#2c3446";                                     // Heckrotor
  ctx.save(); ctx.translate(-40, 0); ctx.rotate(dreh * 1.7);
  ctx.fillRect(-1.4, -9, 2.8, 18); ctx.restore();
  ctx.strokeStyle = "#2c3446"; ctx.lineWidth = 2.6;              // Mast
  ctx.beginPath(); ctx.moveTo(2, -12); ctx.lineTo(2, -18); ctx.stroke();
  const b = Math.abs(Math.cos(dreh)) * 34 + 6;                   // Hauptrotor
  ctx.strokeStyle = "rgba(210,222,238,.9)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(2 - b, -18); ctx.lineTo(2 + b, -18); ctx.stroke();
  ctx.restore();
}

function drawHelis() {
  const t = performance.now() / 1000;
  const s = SCALE * 2.2;
  if (G.heli !== null) {                    // trägt gerade: hängt über dem Bike
    const bx = (rear.x + front.x) / 2, by = (rear.y + front.y) / 2;
    heliBild(sx(bx), sy(by + 64), s, t);
    ctx.strokeStyle = "rgba(44,52,70,.9)"; ctx.lineWidth = 2.6 * SCALE;
    ctx.beginPath();
    ctx.moveTo(sx(bx), sy(by + 32)); ctx.lineTo(sx(bx), sy(by + 8));
    ctx.stroke();
    return;
  }
  for (const h of HELIS) {
    if (h.genutzt) continue;
    const px = sx(h.x);
    if (px < -160 || px > W + 160) continue;
    const wippe = Math.sin(t * 1.5 + h.ph) * 7;
    heliBild(px, sy(h.y) + wippe * SCALE, s, t);
  }
}
