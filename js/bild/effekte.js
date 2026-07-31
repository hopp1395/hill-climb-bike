"use strict";
/* Kometen, Polarlicht, Eiszacken, Dunst, Kristalle, eingefrorene Tiere
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* Kometenschauer – das Dauerwetter der Sternenzone.

   Anders als Regen, Sturm oder Gewitter zieht er nicht auf und wieder ab: über
   der SPACELINE ist er immer da, darunter nie, und der normale Wetterwechsel
   rührt ihn nicht an. Jeder Komet läuft ohne Pause durch seinen eigenen
   Zyklus, damit der Strom nie abreißt; alles kommt aus hash(), also ohne
   gespeicherten Zustand und in jedem Lauf gleich.

   Gezeichnet wird in Bildschirmkoordinaten wie beim übrigen Wetter – ein
   Komet zieht am Himmel vorbei und nicht an einer Stelle der Welt. */
const KOMETEN = Array.from({ length: 13 }, (_, i) => ({
  v: 0.13 + hash(i * 3.1 + 1) * 0.2,        // Zyklen je Sekunde
  ph: hash(i * 7.7 + 2),                    // Versatz, damit sie sich verteilen
  x0: hash(i * 9.1 + 4),
  y0: hash(i * 5.3 + 3),
  L: 0.5 + hash(i * 2.7 + 5) * 1.2,         // Schweiflänge
  s: 0.55 + hash(i * 6.1 + 6) * 0.95,       // Dicke
  ton: hash(i * 4.9 + 7),                   // weiß bis eisblau
}));

function drawKometen(a) {
  if (a < 0.02) return;
  const t = performance.now() / 1000, sk = Math.max(0.7, SCALE);
  ctx.save();
  ctx.lineCap = "round";
  for (const k of KOMETEN) {
    const f = (t * k.v + k.ph) % 1;          // 0..1 Flug quer durchs Bild
    const X = (k.x0 * 0.5 + 0.72 - f * 1.55) * W;
    const Y = (k.y0 * 0.5 + f * 0.46) * H;
    if (X < -260 || X > W + 260) continue;
    const b = a * Math.min(1, f / 0.1, (1 - f) / 0.16);   // Ränder ausblenden
    if (b <= 0.01) continue;
    const L = (100 + k.L * 130) * sk;
    const tx = X + L * 0.87, ty = Y - L * 0.49;           // Schweif nach hinten
    const hell = lerp3([255, 255, 255], [150, 205, 255], k.ton);
    const gl = ctx.createLinearGradient(X, Y, tx, ty);
    gl.addColorStop(0, rgba(hell, 0.95 * b));
    gl.addColorStop(0.4, rgba(hell, 0.28 * b));
    gl.addColorStop(1, rgba(hell, 0));
    ctx.strokeStyle = gl;
    ctx.lineWidth = 2 * k.s * sk;
    ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(tx, ty); ctx.stroke();
    const r = 2.4 * k.s * sk;                             // leuchtender Kopf
    const g = ctx.createRadialGradient(X, Y, 0, X, Y, r * 3.2);
    g.addColorStop(0, rgba([255, 255, 255], b));
    g.addColorStop(0.34, rgba(hell, 0.45 * b));
    g.addColorStop(1, rgba(hell, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(X, Y, r * 3.2, 0, 7); ctx.fill();
  }
  ctx.restore();
}

/* Polarlicht – gehört zur Eiszone und blendet mit ihr ein. Drei Bänder mit
   unterschiedlichem Tempo, additiv gezeichnet, damit sie leuchten. */
function drawAurora(alt) {
  const eis = iceAt(cam.y);
  const a = eis * (1 - WEA.p * 0.7);
  if (a < 0.02) return;
  const t = performance.now() / 1000;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (let b = 0; b < 3; b++) {
    const amp = 26 + b * 14, base = H * (0.16 + b * 0.09), spd = 0.10 + b * 0.045;
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0,    "rgba(90,220,170,0)");
    g.addColorStop(0.28, "rgba(96,236,176," + (0.3 * a) + ")");
    g.addColorStop(0.6,  "rgba(126,206,255," + (0.24 * a) + ")");
    g.addColorStop(0.85, "rgba(168,136,255," + (0.14 * a) + ")");
    g.addColorStop(1,    "rgba(160,130,255,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = (30 + b * 16) * Math.max(0.7, SCALE);
    ctx.beginPath();
    for (let px = -20; px <= W + 20; px += 26) {
      const y = base + Math.sin(px * 0.0042 + t * spd * 6 + b * 2.1) * amp
                     + Math.sin(px * 0.0011 - t * spd * 3) * amp * 0.7;
      px > -20 ? ctx.lineTo(px, y) : ctx.moveTo(px, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawRidge(par, amp, base, color) {
  ctx.beginPath();
  ctx.moveTo(-10, H + 10);
  for (let px = -10; px <= W + 10; px += 12) {
    const wx = cam.x * par + (px - W * CAMX) / SCALE;
    ctx.lineTo(px, H * CAMY - (ridgeY(wx, amp, base) - cam.y * par) * SCALE);
  }
  ctx.lineTo(W + 10, H + 10);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
}

/* Eisgrat am Horizont – der Hintergrund der Eiszone. Er hängt an der Bild-
   mitte statt an einer Welthöhe: die grünen Ketten sind auf 500 m längst unter
   den Bildrand gesunken, ein Horizont muss aber bleiben. */
const tri = u => Math.abs((u - Math.floor(u)) * 2 - 1);
function drawIcePeaks() {
  const eis = iceAt(cam.y), lava = lavaAt(cam.y), raum = spaceAt(cam.y);
  // Der Grat gehört zur Eiszone. Über die ganze Vulkanzone hinweg sinkt er
  // langsam weg, und wenn die Sternenzone beginnt, ist er ganz fort – dort
  // ist man über allem und der Himmel soll frei sein.
  const weg = smooth((cam.y - CFG.LAVALINE) / (CFG.SPACELINE - CFG.LAVALINE));
  const da = Math.min(1, eis + lava) * (1 - weg) * (1 - raum);
  if (da < 0.02) return;
  // Farbe des Grats nach Gebiet: beschneit, verbrannt, oder kalt im Sternenlicht
  let oben = lerp3([214, 236, 250], [134, 74, 54], lava / Math.max(0.001, eis + lava + raum));
  let mitte = lerp3([146, 184, 216], [64, 42, 46], lava / Math.max(0.001, eis + lava + raum));
  oben = lerp3(oben, [148, 156, 192], raum);
  mitte = lerp3(mitte, [54, 58, 84], raum);
  const par = 0.15, hz = H * 0.56;
  ctx.beginPath();
  ctx.moveTo(-10, H + 10);
  for (let px = -10; px <= W + 10; px += 9) {
    const wx = cam.x * par + (px - W * CAMX) / SCALE;
    const u = wx * 0.00055;
    // Zacken statt Wellen: Dreieckswelle, Gipfelhöhe pro Zacke ausgelost
    const hp = 80 + hash(Math.floor(u) * 3.1 + 5) * 130;
    const h = (1 - tri(u)) * hp + (1 - tri(wx * 0.0018 + 0.3)) * 26
            + (vnoise(wx * 0.0012 + 7) - 0.5) * 40;
    ctx.lineTo(px, hz - h * SCALE);
  }
  ctx.lineTo(W + 10, H + 10);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, hz - 210 * SCALE, 0, hz + 170 * SCALE);
  g.addColorStop(0,    rgba(oben, 0.95 * da));     // Gipfel
  g.addColorStop(0.4,  rgba(mitte, 0.72 * da));
  g.addColorStop(1,    rgba([80, 108, 148], 0));   // unten in Dunst auslaufen
  ctx.fillStyle = g; ctx.fill();
}

// Dunst über den fernen Ketten: nimmt ihnen Kontrast, das Spielgelände davor
// bleibt scharf. Das ist der Trick, der Tiefe macht.
function drawHaze(alt) {
  // Dunst braucht Luft – in der Sternenzone gibt es keine mehr
  const klar = 1 - spaceAt(cam.y);
  if (klar < 0.02) return;
  const c = lerp3([228, 240, 251], [40, 52, 92], alt);
  const g = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.95);
  g.addColorStop(0, rgba(c, 0));
  g.addColorStop(0.5, rgba(c, 0.24 * klar));
  g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.3, W, H * 0.65);
}

// Eiskristalle in der Luft – nur in der Eiszone, treiben langsam nach unten
const DUST = Array.from({ length: 70 }, (_, i) => ({
  x: hash(i * 4.1 + 2), y: hash(i * 8.3 + 5),
  s: 0.7 + hash(i * 2.7) * 1.5, v: 0.011 + hash(i * 5.5) * 0.028,
  d: hash(i * 9.1) * 6.28,
}));
function drawIceDust() {
  const eis = iceAt(cam.y), lava = lavaAt(cam.y), raum = spaceAt(cam.y);
  // Schneezone: zwischen Schneegrenze und Eis rieselt es leicht
  const flocken = smooth((cam.y - CFG.SNOWLINE + 200) / 900) * (1 - eis - lava - raum);
  if (eis + lava + raum + flocken < 0.04) return;
  const t = performance.now() / 1000;
  const wrap = v => ((v % 1) + 1) % 1;
  if (flocken > 0.04) {                   // Flocken taumeln nach unten
    ctx.fillStyle = rgba([246, 250, 255], 0.7 * flocken);
    ctx.beginPath();
    for (const p of DUST) {
      const s = p.s * 1.2 * Math.max(1, SCALE);
      ctx.rect(wrap(p.x + Math.sin(t * 0.7 + p.d) * 0.035) * W,
               wrap(p.y + t * p.v * 0.75) * H, s, s);
    }
    ctx.fill();
  }
  if (eis > 0.04) {                       // Eiskristalle sinken
    ctx.fillStyle = rgba([228, 248, 255], 0.55 * eis);
    ctx.beginPath();                      // alle Kristalle in einem Pfad
    for (const p of DUST) {
      const s = p.s * Math.max(1, SCALE);
      ctx.rect(wrap(p.x + Math.sin(t * 0.5 + p.d) * 0.02) * W, wrap(p.y + t * p.v) * H, s, s);
    }
    ctx.fill();
  }
  // Flackernde Partikel laufen in vier Helligkeitsstufen. Eine eigene Farbe je
  // Partikel wären 70 Zustandswechsel pro Bild – so sind es vier.
  const stufen = (fmt, hell, zeichne) => {
    for (let b = 0; b < 4; b++) {
      ctx.fillStyle = fmt((b + 0.5) / 4);
      ctx.beginPath();                    // eine Stufe = ein Pfad = ein Zeichenbefehl
      for (const p of DUST) if (Math.min(3, hell(p) * 4 | 0) === b) zeichne(p);
      ctx.fill();
    }
  };
  if (lava > 0.04) {                      // Glut steigt auf und flackert
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    stufen(f => rgba([255, 150, 60], 0.55 * lava * f),
           p => 0.5 + 0.5 * Math.sin(t * 3 + p.d * 4),
           p => { const s = p.s * 1.3 * Math.max(1, SCALE);
                  ctx.rect(wrap(p.x + Math.sin(t * 0.8 + p.d) * 0.03) * W,
                           wrap(p.y - t * p.v * 1.7) * H, s, s); });
    ctx.restore();
  }
  if (raum > 0.04) {                      // Staub steht fast still und funkelt
    stufen(f => rgba([214, 226, 255], 0.55 * raum * f),
           p => Math.abs(Math.sin(t * 0.9 + p.d * 3)),
           p => { const s = p.s * Math.max(1, SCALE);
                  ctx.rect(wrap(p.x + t * 0.004) * W, wrap(p.y + t * p.v * 0.15) * H, s, s); });
  }
}

/* ---- Eingefrorene im Gletscher ------------------------------------------
   Tiere und Menschen, die ein Stück unter der Oberfläche im Eis stecken. Sie
   werden auf den Geländekörper geklippt, können also nie über die Kante
   ragen, und sind reine Optik – gefahren wird darüber hinweg.
   Die Formen sind in Einheiten gezeichnet (1 = halbe Körperlänge) und werden
   erst beim Zeichnen skaliert; so passt eine Form für jede Größe.        */
const FROZEN = [
  () => {                                   // Mammut
    ctx.beginPath(); ctx.ellipse(0, 0, 1, 0.62, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-0.34, -0.4, 0.52, 0.34, 0, 0, 7); ctx.fill();  // Schulterbuckel
    ctx.beginPath(); ctx.arc(-1.05, -0.05, 0.5, 0, 7); ctx.fill();
    for (const bx of [-0.6, -0.15, 0.42, 0.82]) ctx.fillRect(bx - 0.1, 0.42, 0.2, 0.72);
    ctx.lineCap = "round";
    ctx.lineWidth = 0.2;                    // Rüssel, hängt fast senkrecht
    ctx.beginPath(); ctx.moveTo(-1.22, 0.28);
    ctx.quadraticCurveTo(-1.56, 0.66, -1.4, 1.06); ctx.stroke();
    ctx.lineWidth = 0.13;                   // Stoßzahn, schwingt nach vorn aus
    ctx.beginPath(); ctx.moveTo(-1.38, 0.16);
    ctx.quadraticCurveTo(-2.08, 0.56, -2.12, -0.08); ctx.stroke();
  },
  () => {                                   // Mensch, mitten in der Bewegung
    ctx.beginPath(); ctx.arc(0, -1.05, 0.3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -0.3, 0.28, 0.5, 0, 0, 7); ctx.fill();
    ctx.lineCap = "round"; ctx.lineWidth = 0.17;
    ctx.beginPath();
    ctx.moveTo(-0.2, -0.55); ctx.lineTo(-0.75, -0.95);   // Arme
    ctx.moveTo(0.2, -0.55);  ctx.lineTo(0.7, -0.2);
    ctx.moveTo(-0.12, 0.16); ctx.lineTo(-0.34, 0.95);    // Beine
    ctx.moveTo(0.12, 0.16);  ctx.lineTo(0.4, 0.9);
    ctx.stroke();
  },
  () => {                                   // Fisch
    ctx.beginPath(); ctx.ellipse(0, 0, 0.88, 0.38, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0.8, 0); ctx.lineTo(1.45, -0.42);
    ctx.lineTo(1.45, 0.42); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-0.1, -0.32); ctx.lineTo(0.3, -0.72);
    ctx.lineTo(0.42, -0.3); ctx.closePath(); ctx.fill();   // Rückenflosse
  },
  () => {                                   // Vogel mit ausgebreiteten Flügeln
    ctx.beginPath(); ctx.ellipse(0, 0, 0.66, 0.27, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(-0.7, -0.16, 0.24, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-0.9, -0.2); ctx.lineTo(-1.28, -0.1);
    ctx.lineTo(-0.88, 0.0); ctx.closePath(); ctx.fill();   // Schnabel
    ctx.beginPath();                                       // Flügel und Schwanz
    ctx.moveTo(-0.2, -0.16); ctx.lineTo(0.34, -0.86); ctx.lineTo(0.5, -0.1); ctx.closePath();
    ctx.moveTo(-0.2, 0.16);  ctx.lineTo(0.3, 0.72);  ctx.lineTo(0.48, 0.08); ctx.closePath();
    ctx.moveTo(0.55, -0.14); ctx.lineTo(1.16, -0.34); ctx.lineTo(1.12, 0.24); ctx.closePath();
    ctx.fill();
  },
  () => {                                   // Urzeit-Echse
    ctx.beginPath(); ctx.ellipse(0, 0, 0.8, 0.42, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(-1.25, -0.6, 0.28, 0, 7); ctx.fill();
    ctx.lineCap = "round"; ctx.lineWidth = 0.22;
    ctx.beginPath(); ctx.moveTo(-0.7, -0.2);
    ctx.quadraticCurveTo(-1.25, -0.3, -1.25, -0.6); ctx.stroke();   // Hals
    ctx.lineWidth = 0.16;
    ctx.beginPath(); ctx.moveTo(0.75, -0.05);
    ctx.quadraticCurveTo(1.5, 0.1, 1.7, -0.5); ctx.stroke();        // Schwanz
    ctx.fillRect(-0.42, 0.3, 0.2, 0.7); ctx.fillRect(0.3, 0.3, 0.2, 0.7);
  },
];
const FROZEN_STEP = 300;

function drawFrozen() {
  const xl = wxAt(-80), xr = wxAt(W + 80);
  for (let k = Math.floor(xl / FROZEN_STEP); k <= Math.ceil(xr / FROZEN_STEP); k++) {
    if (hash(k * 6.7 + 3.1) > 0.62) continue;        // nicht an jeder Stelle einer
    const wx = (k + hash(k * 2.3) * 0.8 - 0.4) * FROZEN_STEP;
    // Dicht unter der Oberfläche: tiefer liegende wären fast immer unter dem
    // Bildrand, weil vom Boden nur ein schmaler Streifen zu sehen ist.
    const wy = terrainY(wx) - (42 + hash(k * 4.9) * 68);
    const eis = iceAt(wy);
    if (eis < 0.3) continue;                         // nur im Gletscher
    const s = (20 + hash(k * 8.1) * 13) * SCALE;
    ctx.save();
    ctx.translate(sx(wx), sy(wy));
    ctx.rotate((hash(k * 3.3) - 0.5) * 1.5);         // schief eingefroren
    ctx.scale(s, s);
    ctx.fillStyle = rgba([40, 88, 124], 0.55 * eis);
    ctx.strokeStyle = rgba([40, 88, 124], 0.55 * eis);
    FROZEN[Math.floor(hash(k * 11.3) * FROZEN.length)]();
    ctx.restore();
  }
}
