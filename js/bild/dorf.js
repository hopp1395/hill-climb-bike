"use strict";
/* Startdorf, Brücken, Wandmarken und Kanister
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* ---- Startdorf ----------------------------------------------------------
   Ein paar Häuser auf den ersten Metern, damit der Lauf sichtbar aus einem Ort
   herausführt. Das Bike startet bei x=80, also steht die Hälfte davor. Reine
   Kulisse: keine Kollision, kein Einfluss aufs Fahren.
   Fest ausgelegt statt gewürfelt – es soll jedes Mal dasselbe Dorf sein.  */
const DORF = [
  // Zwischen x=20 und 250 bleibt frei – dort steht das Bike beim Start, sonst
  // sähe es aus, als parke es im Wohnzimmer.
  { x: -520, b: 172, h: 128, wand: "#e6dac4", dach: "#8d4a3a", kamin: true },
  { x: -270, b: 126, h:  98, wand: "#dfe6ea", dach: "#6b5747" },
  { x:  -70, b: 152, h: 114, wand: "#ecdfc6", dach: "#9d5340", kamin: true },
  { x:  340, b: 114, h:  88, wand: "#dde3e6", dach: "#75604e" },
  { x:  620, b: 190, h: 114, wand: "#b98a5c", dach: "#5f4636", scheune: true },
  { x:  900, b: 134, h: 106, wand: "#e8dcc4", dach: "#8d4a3a", kamin: true },
  { x: 1190, b: 120, h:  94, wand: "#e2e7ea", dach: "#7a5b4a" },
  { x: 1510, b: 162, h: 120, wand: "#ecdfc6", dach: "#9d5340", kamin: true },
  { x: 1860, b: 122, h:  96, wand: "#dfe6ea", dach: "#6b5747" },
  { x: 2160, b: 146, h: 108, wand: "#b98a5c", dach: "#5f4636", scheune: true },
];
const DORFBAUM = [210, 480, 770, 1060, 1360, 1690, 2000, 2300];
const DORF_ENDE = 2600;                    // dahinter wird nichts mehr gezeichnet

function dorfHaus(d, alt) {
  const s = SCALE, X = sx(d.x);
  const b = d.b * s, h = d.h * s;
  const links = X - b / 2;
  // Der Boden unter dem Grundriss ist selten waagerecht. Der Fußboden liegt
  // deshalb auf der höchsten Stelle darunter, und der Sockel füllt bis zum
  // Gelände auf – so steht das Haus überall auf, ohne irgendwo zu schweben.
  const x0 = d.x - d.b / 2, x1 = d.x + d.b / 2;
  const boden = [];
  for (let x = x0; x <= x1 + 0.1; x += 6) boden.push([x, terrainY(x)]);
  let flur = -Infinity;
  for (const [, g] of boden) flur = Math.max(flur, g);
  const Y = sy(flur);
  // Schlagschatten nach links, bevor Sockel und Wand darüberkommen. Auf den
  // Berg geklippt, sonst schwebt er an einer Geländekante im Himmel.
  ctx.save();
  if (TERRAIN_BODY) ctx.clip(TERRAIN_BODY);
  schattenBand(d.x, d.b / 2, d.h + d.b * 0.42, 0.3);     // Wand plus Dachhöhe
  ctx.restore();
  ctx.fillStyle = "#9a958c";                          // Sockel aus Bruchstein
  ctx.beginPath();
  ctx.moveTo(links, Y);
  for (const [x, g] of boden) ctx.lineTo(sx(x), sy(g) + 4 * s);
  ctx.lineTo(links + b, Y);
  ctx.closePath(); ctx.fill();
  if (flur - Math.min(...boden.map(p => p[1])) > 4) {  // Kante nur, wenn sichtbar
    ctx.strokeStyle = "rgba(60,54,48,.45)"; ctx.lineWidth = 1.6 * s;
    ctx.beginPath(); ctx.moveTo(links, Y); ctx.lineTo(links + b, Y); ctx.stroke();
  }
  ctx.fillStyle = d.wand;
  ctx.fillRect(links, Y - h, b, h + 1);
  // Sonne steht rechts: linke Wandseite liegt im Schatten
  ctx.fillStyle = "rgba(30,34,50,.16)";
  ctx.fillRect(links, Y - h, b * 0.3, h + 1);
  // Satteldach mit Überstand, die abgewandte Hälfte dunkler
  ctx.fillStyle = d.dach;
  ctx.beginPath();
  ctx.moveTo(links - 7 * s, Y - h);
  ctx.lineTo(X, Y - h - d.b * 0.42 * s);
  ctx.lineTo(links + b + 7 * s, Y - h);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(28,30,44,.22)";
  ctx.beginPath();
  ctx.moveTo(links - 7 * s, Y - h);
  ctx.lineTo(X, Y - h - d.b * 0.42 * s);
  ctx.lineTo(X, Y - h);
  ctx.closePath(); ctx.fill();
  if (d.kamin) {
    ctx.fillRect(links + b * 0.7, Y - h - d.b * 0.34 * s, 9 * s, 16 * s);
    // Rauch: drei Ballen, die aufsteigen und verwehen
    const t = performance.now() / 1000;
    for (let k = 0; k < 3; k++) {
      const p = (t * 0.32 + k / 3) % 1;
      ctx.fillStyle = rgba([228, 232, 238], 0.32 * (1 - p));
      ctx.beginPath();
      ctx.arc(links + b * 0.73 + p * 26 * s, Y - h - d.b * 0.36 * s - p * 46 * s,
              (3 + p * 9) * s, 0, 7);
      ctx.fill();
    }
  }
  // Öffnungen: abends leuchten sie
  const licht = Math.min(0.9, Math.max(0, alt - 0.14) * 2.4);
  const fen = licht > 0.02 ? rgba([255, 216, 138], licht) : "rgba(52,58,72,.62)";
  if (d.scheune) {                                    // Scheune: großes Tor
    ctx.fillStyle = "rgba(52,42,32,.7)";
    ctx.fillRect(X - b * 0.17, Y - h * 0.62, b * 0.34, h * 0.62);
    ctx.strokeStyle = "rgba(90,70,50,.8)"; ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(X, Y - h * 0.62); ctx.lineTo(X, Y);
    ctx.moveTo(X - b * 0.17, Y - h * 0.5); ctx.lineTo(X + b * 0.17, Y - h * 0.5);
    ctx.stroke();
  } else {
    ctx.fillStyle = fen;
    ctx.fillRect(links + b * 0.14, Y - h * 0.78, b * 0.22, h * 0.26);
    ctx.fillRect(links + b * 0.64, Y - h * 0.78, b * 0.22, h * 0.26);
    ctx.fillStyle = "rgba(74,52,36,.85)";             // Tür
    ctx.fillRect(links + b * 0.4, Y - h * 0.42, b * 0.2, h * 0.42);
  }
}

function drawDorf(alt) {
  const xl = wxAt(-260), xr = wxAt(W + 260);
  if (xr < -560 || xl > DORF_ENDE) return;            // längst vorbei
  for (const d of DORF) {
    if (d.x < xl - 220 || d.x > xr + 220) continue;
    // Am Steilhang steht kein Haus. Mit dem Sockel darf es etwas schräger
    // sein als vorher, weil der Höhenunterschied jetzt aufgefüllt wird.
    if (Math.abs(slopeAt(d.x)) > 0.45) continue;
    dorfHaus(d, alt);
  }
  // Bäume dazwischen, gleiche Form wie im Hintergrund, nur viel größer
  for (const bx of DORFBAUM) {
    if (bx < xl - 90 || bx > xr + 90) continue;
    const s = SCALE * 4.1, X = sx(bx), Y = sy(terrainY(bx));
    ctx.save();                                        // Schatten nach links
    if (TERRAIN_BODY) ctx.clip(TERRAIN_BODY);
    const um = s / SCALE;                                // Formeinheit -> Welt
    schattenBand(bx, 11 * um, 40 * um, 0.3);             // Baum ist 40 Einheiten hoch
    ctx.restore();
    ctx.fillStyle = "#3f6b46";
    ctx.fillRect(X - 2 * s, Y - 12 * s, 4 * s, 12 * s);
    ctx.beginPath();
    ctx.moveTo(X, Y - 40 * s);
    ctx.lineTo(X + 5 * s, Y - 18 * s); ctx.lineTo(X + 3 * s, Y - 18 * s);
    ctx.lineTo(X + 11 * s, Y - 2 * s); ctx.lineTo(X - 11 * s, Y - 2 * s);
    ctx.lineTo(X - 3 * s, Y - 18 * s); ctx.lineTo(X - 5 * s, Y - 18 * s);
    ctx.closePath(); ctx.fill();
  }
  // Lattenzaun am Ortsrand
  const zaun = (von, bis) => {
    if (bis < xl || von > xr) return;
    ctx.strokeStyle = "#9c7b52"; ctx.lineWidth = 2.4 * SCALE; ctx.lineCap = "round";
    ctx.beginPath();
    for (let x = von; x <= bis; x += 26) {
      const Y = sy(terrainY(x));
      ctx.moveTo(sx(x), Y); ctx.lineTo(sx(x), Y - 22 * SCALE);
    }
    for (const hoehe of [8, 17]) {
      ctx.moveTo(sx(von), sy(terrainY(von)) - hoehe * SCALE);
      for (let x = von; x <= bis; x += 26)
        ctx.lineTo(sx(x), sy(terrainY(x)) - hoehe * SCALE);
    }
    ctx.stroke();
  };
  zaun(420, 580);
  zaun(1010, 1160);
  zaun(1980, 2110);
}

function drawBridges() {
  const xl = wxAt(-40), xr = wxAt(W + 40);
  for (const r of RAVINES) {
    if (!r.bruecke || r.bx2 < xl || r.bx1 > xr) continue;
    const s = SCALE;
    // Das Deck ist an den Enden gekrümmt, also als Polygonzug zeichnen.
    // n[i] ist die Normale – Planken und Pfosten stehen senkrecht dazu.
    // Ein Stützpunkt je Planke – hält den Plankenabstand wie gehabt bei ~11 px.
    const N = Math.max(12, Math.min(80,
      Math.round(Math.abs(sx(r.bx2) - sx(r.bx1)) / (11 * s))));
    const p = [], n = [];
    for (let i = 0; i <= N; i++) {
      const wx = r.bx1 + (r.bx2 - r.bx1) * i / N, b = deckAt(r, wx);
      const nl = Math.hypot(b.s, 1);
      p.push([sx(wx), sy(b.y)]);
      n.push([b.s / nl, 1 / nl]);        // Bildschirm-Y zeigt nach unten
    }
    const line = (i, a, bb, w, col) => {
      ctx.strokeStyle = col; ctx.lineWidth = w * s;
      ctx.beginPath();
      ctx.moveTo(p[i][0] + n[i][0] * a * s, p[i][1] + n[i][1] * a * s);
      ctx.lineTo(p[i][0] + n[i][0] * bb * s, p[i][1] + n[i][1] * bb * s);
      ctx.stroke();
    };
    const along = (off, w, col) => {
      ctx.strokeStyle = col; ctx.lineWidth = w * s;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const X = p[i][0] + n[i][0] * off * s, Y = p[i][1] + n[i][1] * off * s;
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke();
    };

    const at = (k, m) => Math.round(N * k / m);
    for (let k = 1; k < 6; k++) line(at(k, 6), 0, 13, 2, "rgba(60,45,32,.85)"); // Pfosten
    along(2.5, 7, "#8a6b45");                                                  // Deck
    for (let i = 1; i < N; i++) line(i, -1, 6, 1.4, "rgba(45,32,20,.55)");     // Planken
    along(-13, 2.5, "#6d5334");                                                // Handlauf
    for (let k = 0; k <= 5; k++) line(at(k, 5), -13, 0, 2.5, "#6d5334");       // Streben
  }
}

// Am Fuß jeder Steilwand drei Pfeile: hier hilft nur der Boost
function drawWallMarks() {
  const xl = wxAt(-40), xr = wxAt(W + 40);
  for (const w of WALLS) {
    if (w.x0 + w.L < xl || w.x0 > xr) continue;
    // Fuß der Steilstelle suchen: dort, wo es erstmals über 45° geht
    let xs = w.x0 + w.L * 0.3;
    for (let x = w.x0; x < w.x0 + w.L; x += 8) {
      if (slopeAt(x) > 1) { xs = x; break; }
    }
    const mx = xs - 55;
    const px = sx(mx), py = sy(terrainY(mx));
    const pulse = 0.5 + 0.5 * Math.sin(G.time * 5);
    ctx.save();
    ctx.translate(px, py - 34 * SCALE);
    ctx.scale(SCALE, SCALE);
    ctx.strokeStyle = "rgba(120,220,255," + pulse.toFixed(2) + ")";
    ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (let k = 0; k < 3; k++) {
      const oy = -k * 12;
      ctx.beginPath();
      ctx.moveTo(-11, oy); ctx.lineTo(0, oy - 9); ctx.lineTo(11, oy);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawCans() {
  const k0 = Math.max(0, Math.floor((wxAt(0) - CFG.CAN_SPACING) / CFG.CAN_SPACING));
  for (let k = k0; k <= k0 + 6; k++) {
    if (cans.get(k)) continue;
    const c = canPos(k);
    const px = sx(c.x), py = sy(c.y);
    if (px < -60 || px > W + 60) continue;
    const bob = Math.sin(G.time * 3 + k) * 3 * SCALE;
    ctx.save();
    ctx.translate(px, py + bob);
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath(); ctx.ellipse(0, 20, 14, 4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#e63946";
    ctx.beginPath(); ctx.roundRect(-11, -16, 22, 32, 4); ctx.fill();
    ctx.fillStyle = "#ffd9a0"; ctx.fillRect(-7, -8, 14, 5);      // Etikett
    ctx.fillStyle = "#b52c38"; ctx.fillRect(-11, 2, 22, 4);
    ctx.fillStyle = "#2b2b2b"; ctx.fillRect(-4, -21, 8, 6);      // Deckel
    ctx.strokeStyle = "#2b2b2b"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(9, -14); ctx.lineTo(15, -19); ctx.stroke();  // Ausgießer
    ctx.restore();
  }
}
