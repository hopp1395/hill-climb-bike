"use strict";
/* Sternenhimmel, Sternbild und die Implosion im Meer
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* ---- Tiefer Himmel: Galaxien, Schwarze Löcher, helle Einzelsterne --------
   Gehört zur Sternenzone und blendet mit ihr ein. Liegt hinter den Bergen,
   zieht mit sehr wenig Parallaxe mit und wiederholt sich in einem Band.  */
const DEEP_W = 9000;
const DEEP = Array.from({ length: 7 }, (_, i) => ({
  x: hash(i * 3.7 + 11) * DEEP_W,
  f: 0.06 + hash(i * 9.1 + 3) * 0.5,        // Höhe im Bild (0 = oben)
  s: 0.65 + hash(i * 5.3 + 2) * 0.85,
  rot: hash(i * 2.9 + 7) * Math.PI,
  loch: i % 3 === 1,
  ton: hash(i * 6.7 + 4),
}));
const HELLE = Array.from({ length: 14 }, (_, i) => ({
  x: hash(i * 4.3 + 21) * DEEP_W,
  f: 0.04 + hash(i * 7.9 + 6) * 0.62,
  s: 0.7 + hash(i * 2.1 + 8) * 1.1,
  ph: hash(i * 8.3) * 6.28,
}));

function drawDeepSky() {
  const raum = spaceAt(cam.y);
  if (raum < 0.03) return;
  const par = 0.05, t = performance.now() / 1000;
  const bandX = e => {
    const dx = ((e.x - cam.x * par) % DEEP_W + DEEP_W) % DEEP_W - DEEP_W * 0.5;
    return W * CAMX + dx * SCALE;
  };
  for (const d of DEEP) {
    const px = bandX(d), py = H * d.f, s = d.s * Math.max(0.7, SCALE);
    if (px < -220 || px > W + 220) continue;
    if (d.loch) {
      const R = 24 * s;
      ctx.save();
      ctx.translate(px, py);
      ctx.globalCompositeOperation = "lighter";
      const gl = ctx.createRadialGradient(0, 0, R, 0, 0, R * 2.1);
      gl.addColorStop(0, rgba([255, 172, 96], 0.3 * raum));
      gl.addColorStop(1, rgba([255, 140, 70], 0));
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(0, 0, R * 2.1, 0, 7); ctx.fill();
      ctx.rotate(d.rot * 0.3);
      ctx.scale(1, 0.26);                      // Scheibe fast von der Kante
      ctx.strokeStyle = rgba([255, 236, 196], raum);
      ctx.lineWidth = 2.6 * s;
      ctx.beginPath(); ctx.arc(0, 0, R * 1.7, 0, 7); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = rgba([2, 2, 6], Math.min(1, 1.3 * raum));
      ctx.beginPath(); ctx.arc(px, py, R, 0, 7); ctx.fill();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = rgba([255, 246, 220], 0.75 * raum);   // Photonenring
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath(); ctx.arc(px, py, R * 1.06, 0, 7); ctx.stroke();
      ctx.translate(px, py); ctx.rotate(d.rot * 0.3); ctx.scale(1, 0.26);
      ctx.strokeStyle = rgba([255, 240, 205], raum);          // vordere Hälfte
      ctx.lineWidth = 2.6 * s;
      ctx.beginPath(); ctx.arc(0, 0, R * 1.7, 0, Math.PI); ctx.stroke();
      ctx.restore();
    } else {
      const R = 62 * s;
      const kern = lerp3([255, 236, 208], [214, 206, 255], d.ton);
      const rand = lerp3([120, 96, 220], [70, 140, 220], d.ton);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(d.rot);
      ctx.globalCompositeOperation = "lighter";
      ctx.scale(1, 0.42);                      // schräg stehende Scheibe
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, R);
      g.addColorStop(0, rgba(kern, 0.75 * raum));
      g.addColorStop(0.22, rgba(rand, 0.32 * raum));
      g.addColorStop(1, rgba(rand, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
      ctx.strokeStyle = rgba(rand, 0.22 * raum);   // zwei Spiralarme
      ctx.lineWidth = 6 * s;
      for (let a = 0; a < 2; a++) {
        ctx.beginPath();
        for (let th = 0; th < Math.PI * 1.7; th += 0.22) {
          const rr = 9 * s + th * R * 0.3, A = th + a * Math.PI;
          const X = Math.cos(A) * rr, Y = Math.sin(A) * rr;
          th ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  // Helle Einzelsterne mit Kreuzstrahl, langsam pulsierend
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const e of HELLE) {
    const px = bandX(e), py = H * e.f;
    if (px < -20 || px > W + 20) continue;
    const s = e.s * Math.max(0.7, SCALE) * (0.75 + 0.25 * Math.sin(t * 1.4 + e.ph));
    const a = 0.9 * raum;
    ctx.fillStyle = rgba([255, 255, 255], a);
    ctx.beginPath(); ctx.arc(px, py, 1.7 * s, 0, 7); ctx.fill();
    ctx.strokeStyle = rgba([200, 224, 255], 0.5 * a);
    ctx.lineWidth = 1.1 * s;
    ctx.beginPath();
    ctx.moveTo(px - 7 * s, py); ctx.lineTo(px + 7 * s, py);
    ctx.moveTo(px, py - 7 * s); ctx.lineTo(px, py + 7 * s);
    ctx.stroke();
  }
  ctx.restore();
}

/* ---- Weltraum-Finale ----------------------------------------------------
   Nach dem Absprung wird aus Fahrer und Bike ein Sternbild: an den Eckpunkten
   treten Sterne hervor, das Bike verblasst, die Figur richtet sich auf und
   steht am Ende still am Himmel. Die Punkte liegen im selben lokalen System
   wie drawBike – Ursprung in der Radmitte, +x vorwärts, -y oben.        */
/* Die Punkte folgen den Koordinaten, die drawBike wirklich zeichnet: Naben bei
   ±WHEELBASE/2, Felgen im Radradius, darüber Motor, Tank, Sitz, Lenker und der
   Fahrer bis zum Kopf auf HEAD_H+11. So ist die Silhouette dieselbe wie die,
   mit der man den ganzen Berg hochgefahren ist. */
const [STERNBILD, STERNLINIEN] = (() => {
  const P = [], L = [];
  const setz = (x, y, gr) => (P.push({ x, y, gr }), P.length - 1);
  const hb = CFG.WHEELBASE / 2, rr = CFG.WHEEL_R;
  const rad = cx => {                       // Nabe, fünf Felgensterne, zwei Speichen
    const nabe = setz(cx, 0, 1.0), felge = [];
    for (let i = 0; i < 5; i++) {
      const w = -Math.PI / 2 + i * 6.2832 / 5;
      felge.push(setz(cx + Math.cos(w) * rr, Math.sin(w) * rr, 0.75));
    }
    for (let i = 0; i < 5; i++) L.push([felge[i], felge[(i + 1) % 5]]);
    L.push([nabe, felge[0]], [nabe, felge[2]]);
    return nabe;
  };
  const hinten = rad(-hb), vorne = rad(hb);
  const motor  = setz(-6, -7, 0.9),  sitz  = setz(-19, -17, 0.9);
  const tank   = setz(2, -18, 0.9),  rvorn = setz(12, -14, 0.8);
  const lenker = setz(21, -27, 1.1), hand  = setz(18, -25, 0.85);
  const huefte = setz(-16, -20, 0.9), schulter = setz(-3, -36, 1.15);
  const kopf   = setz(0, -(CFG.HEAD_H + 11), 1.8);
  const knie   = setz(-4, -14, 0.8), fuss = setz(-2, -6, 0.8);
  L.push([hinten, motor], [motor, sitz], [sitz, tank], [motor, tank],
         [tank, rvorn], [rvorn, lenker], [rvorn, vorne], [lenker, hand],
         [sitz, huefte], [huefte, schulter], [schulter, kopf], [schulter, hand],
         [huefte, knie], [knie, fuss], [fuss, motor]);
  return [P, L];
})();

// 0 bis 1: wie weit die Verwandlung fortgeschritten ist
function sternAnteil() {
  if (G.weltall === null) return 0;
  return smooth((G.weltall - 0.7) / Math.max(0.1, CFG.WELTALL_ZEIT - 2.4));
}

/* Meer-Finale: kein Sternbild, sondern der Druck. Auf 1000 m hält nichts mehr
   stand – Ringe laufen von aussen auf das Bike zu, es wird zusammengedrückt,
   und am Ende bleibt ein Blitz und eine Wolke aus Blasen und Splittern. */
function drawImplosion() {
  const p = sternAnteil();
  if (p < 0.004) return;
  const cx = sx(bikeX()), cy = sy((rear.y + front.y) / 2);
  const t = performance.now() / 1000;
  const s = Math.max(0.6, SCALE);

  // Druckringe, die zusammenlaufen
  if (p < 0.86) {
    ctx.lineCap = "round";
    for (let i = 0; i < 4; i++) {
      const f = ((p * 1.5 + i * 0.25) % 1);
      const r = (240 - 210 * f) * s;
      const a = Math.min(1, p * 2) * (1 - f) * 0.55;
      ctx.strokeStyle = rgba([190, 240, 255], a);
      ctx.lineWidth = (1.5 + 3 * f) * s;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
    }
  }

  // kurz vor dem Ende zieht sich das Wasser sichtbar zusammen
  if (p > 0.55) {
    const q = (p - 0.55) / 0.45;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120 * s * (1 - q * 0.7));
    g.addColorStop(0, rgba([10, 20, 36], 0.75 * q));
    g.addColorStop(1, rgba([10, 20, 36], 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, 120 * s * (1 - q * 0.7), 0, 7); ctx.fill();
  }

  // der Knall: heller Kern, dann Blasen und Splitter nach aussen
  if (p > 0.86) {
    const q = (p - 0.86) / 0.14;
    const r = 26 * s * (1 - q) + 6 * s;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3.5);
    g.addColorStop(0, rgba([255, 255, 255], 1 - q * 0.4));
    g.addColorStop(0.3, rgba([190, 240, 255], 0.6 * (1 - q)));
    g.addColorStop(1, rgba([120, 200, 255], 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r * 3.5, 0, 7); ctx.fill();

    for (let i = 0; i < 26; i++) {
      const w = i * 0.965 + t * 0.4;
      const d = (30 + (i % 6) * 26) * q * s * (0.7 + hash(i * 2.3) * 0.8);
      const X = cx + Math.cos(w) * d, Y = cy + Math.sin(w) * d * 0.85 - q * 30 * s;
      const rr = (2 + hash(i * 4.7) * 3.4) * s * (1 - q * 0.4);
      ctx.fillStyle = i % 3 === 0 ? rgba([60, 70, 90], 0.8 * (1 - q))
                                  : rgba([214, 240, 255], 0.6 * (1 - q));
      ctx.beginPath(); ctx.arc(X, Y, rr, 0, 7); ctx.fill();
    }
  }
}

function drawSternbild() {
  const p = sternAnteil();
  if (p < 0.004) return;
  const mx = (rear.x + front.x) / 2, my = (rear.y + front.y) / 2;
  const ang = Math.atan2(front.y - rear.y, front.x - rear.x);
  const t = performance.now() / 1000;
  ctx.save();
  ctx.translate(sx(mx), sy(my));
  ctx.rotate(-ang * (1 - p));                 // richtet sich langsam auf
  const z = SCALE * (1 + p * 1.3);            // und wächst zum Bildmittelpunkt an
  ctx.scale(z, z);
  ctx.strokeStyle = rgba([182, 208, 255], 0.45 * p);
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const [a, b] of STERNLINIEN) {
    ctx.moveTo(STERNBILD[a].x, STERNBILD[a].y);
    ctx.lineTo(STERNBILD[b].x, STERNBILD[b].y);
  }
  ctx.stroke();
  for (let i = 0; i < STERNBILD.length; i++) {
    const s = STERNBILD[i];
    // versetzt aufleuchten, damit die Sterne nicht im Gleichtakt erscheinen
    const an = smooth((p - (i / STERNBILD.length) * 0.45) / 0.5);
    if (an < 0.01) continue;
    const funkel = 0.78 + 0.22 * Math.sin(t * 2.6 + i * 1.9);
    const r = s.gr * 1.9 * an * funkel;
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3.6);
    g.addColorStop(0, rgba([255, 255, 255], an));
    g.addColorStop(0.3, rgba([186, 212, 255], 0.42 * an));
    g.addColorStop(1, rgba([120, 150, 255], 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(s.x, s.y, r * 3.6, 0, 7); ctx.fill();
    ctx.fillStyle = rgba([255, 255, 255], an);
    ctx.beginPath(); ctx.arc(s.x, s.y, r * 0.5, 0, 7); ctx.fill();
  }
  ctx.restore();
}
