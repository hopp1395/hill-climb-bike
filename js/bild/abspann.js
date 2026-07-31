"use strict";
/* Rückblick: der ganze Berg im Bild, mit Spur und Beschriftung
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* ---- Rückblick nach dem Gipfel ------------------------------------------
   Die Kamera fährt vom Sternbild weg, bis der ganze Berg als schlichte
   Silhouette im Bild liegt. Dann zieht sich die gefahrene Linie vom Startdorf
   bis zur Spitze, und ganz oben steht am Ende dasselbe Sternbild noch einmal –
   diesmal vollständig und in Ruhe.

   Das Höhenfeld wird einmal grob abgetastet und gemerkt: die Welt ändert sich
   nach dem Aufbau nicht mehr, und 300 terrainY-Aufrufe pro Bild wären für eine
   reine Schlussgrafik verschwendet. */
let PROFIL = null;
function bauProfil() {
  const n = 300, xe = FINALE ? FINALE.xGipfel : TEND;
  PROFIL = { xe, n, y: new Float32Array(n + 1), max: 0 };
  // im Fortschrittsmaß ablegen: im Meer wächst das Profil nach unten, die
  // Schlussgrafik soll aber in beiden Modi als Berg von links nach rechts
  // aufgebaut werden
  for (let i = 0; i <= n; i++) {
    const y = fortschritt(terrainY(xe * i / n));
    PROFIL.y[i] = y;
    if (y > PROFIL.max) PROFIL.max = y;
  }
}

/* Deko der Schlussgrafik. Feste Punkte aus hash(), damit das Bild in jedem
   Lauf gleich aufgebaut ist und nichts flimmert. */
const AB_STERNE = Array.from({ length: 120 }, (_, i) => ({
  x: hash(i * 1.7 + 3), y: hash(i * 5.1 + 8), s: 0.5 + hash(i * 3.3 + 2) * 1.3,
}));
/* Auch die Beschriftung der Schlussgrafik hing an den Höhen von "Normal" und
   zeigte im leichten Grad 100/250/500/750 m, obwohl der Gipfel dort auf 500 m
   liegt. Wird jetzt beim Gradwechsel mitgezogen. */
let AB_ZONEN = [];
function bauAbZonen() {
  // in Fortschrittsmaß wie PROFIL: positiv, auch wenn es im Meer nach unten geht
  AB_ZONEN = G_REGEL.meer ? [
    { y: CFG.SNOWLINE,  name: "Sandbank",   farbe: [226, 220, 170] },
    { y: CFG.ICELINE,   name: "Riff",       farbe: [130, 214, 186] },
    { y: CFG.LAVALINE,  name: "Dämmerzone", farbe: [128, 172, 208] },
    { y: CFG.SPACELINE, name: "Tiefsee",    farbe: [116, 138, 190] },
  ] : [
    { y: CFG.SNOWLINE,  name: "Schnee", farbe: [214, 228, 244] },
    { y: CFG.ICELINE,   name: "Eis",    farbe: [168, 214, 240] },
    { y: CFG.LAVALINE,  name: "Vulkan", farbe: [236, 152, 110] },
    { y: CFG.SPACELINE, name: "Sterne", farbe: [186, 178, 240] },
  ];
}
const AB_GALAXIEN = [
  { x: 0.16, y: 0.30, r: 1.25, dreh: 0.5,  ton: 0.15 },
  { x: 0.78, y: 0.20, r: 0.85, dreh: -0.8, ton: 0.7 },
  { x: 0.45, y: 0.13, r: 0.6,  dreh: 1.9,  ton: 0.45 },
];

/* Maße der Schlussgrafik. Der Gipfel sitzt bei 64 % der Breite, danach fällt
   der Berg gespiegelt und gestaucht zur rechten Seite ab – so wird es eine
   Bergsilhouette und kein abgeschnittener Anstieg. Oben bleibt Luft für das
   Sternbild. */
function abspannMasse() {
  const lx = 0, rx = W, gx = W * 0.64;
  const oben = H * 0.24, unten = H * 0.94;
  /* Im Meer zeigt die Achse nach unten: die Küste liegt oben, der Graben
     unten. Aus derselben Kurve wird damit ein Abgrund statt eines Bergs –
     gefüllt wird weiterhin unter der Linie, und das ist dann der Fels. */
  const py = G_REGEL.meer
    ? y => oben + (unten - oben) * Math.min(1, y / PROFIL.max)
    : y => unten - (unten - oben) * Math.min(1, y / PROFIL.max);
  return { lx, rx, gx, oben, unten, py,
           pxAuf: i => lx + (gx - lx) * (i / PROFIL.n),
           pxAb: i => gx + (rx - gx) * (1 - i / PROFIL.n),
           gy: py(PROFIL.y[PROFIL.n]),
           bei: h => Math.max(0, Math.min(1, h / PROFIL.max)) };
}

/* Himmel, Sterne, Galaxien, Berg und Dorf ändern sich während des Abspanns
   nicht – sie einmal in ein Zwischenbild zu rendern spart pro Bild rund 18 ms.
   Verworfen wird es bei neuer Fenstergröße und bei jedem neuen Lauf. */
let ABKARTE = null, ABKARTE_W = 0, ABKARTE_H = 0;

function abspannKarte() {
  if (ABKARTE && ABKARTE_W === W && ABKARTE_H === H) return ABKARTE;
  const cv = document.createElement("canvas");
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  const c = cv.getContext("2d");
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  zeichneKarte(c);
  ABKARTE = cv; ABKARTE_W = W; ABKARTE_H = H;
  return cv;
}

function drawAbspann() {
  const u = G.abspann;
  if (u === null) return;
  const ein = smooth(u / 1.2);
  if (ein < 0.004) return;
  if (!PROFIL) bauProfil();
  const M = abspannMasse();
  const { gx, gy, py, pxAuf } = M;

  // Schleier legt die Spielwelt still – am Ende deckend, sonst geistert das
  // große Sternbild aus der Schwebeszene durch die Karte
  ctx.fillStyle = rgba([7, 11, 24], ein);
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  // Auszoomen: anfangs steht der Gipfel formatfüllend im Bild, dann weicht er
  // zurück, bis der ganze Berg hineinpasst.
  const z = 1 + 11 * (1 - smooth(u / 1.7));
  ctx.translate(gx, gy); ctx.scale(z, z); ctx.translate(-gx, -gy);
  ctx.globalAlpha = ein;
  ctx.drawImage(abspannKarte(), 0, 0, W, H);
  ctx.globalAlpha = 1;
  zeichneAnimiertes(u, M, ein);
  ctx.restore();
  beschriftung(u, M);
}

/* Alles, was sich während des Abspanns nicht bewegt. Bekommt den Zielkontext
   übergeben, weil es in ein Zwischenbild gerendert wird. */
function zeichneKarte(ctx) {
  const M = abspannMasse();
  const { lx, rx, gx, oben, unten, py, pxAuf, pxAb, bei } = M;

  /* Im Meer wird dieselbe Grafik zur Wassersäule: die Achse zeigt weiter nach
     oben, dort ist aber nicht der Himmel, sondern der Graben. Statt Sternen und
     Galaxien gibt es Wasser, das nach oben hin dunkel wird, und Lichtstrahlen
     unten an der Oberfläche. */
  if (G_REGEL.meer) {
    // Achse zeigt nach unten: oben die Oberfläche, unten der Graben
    const w = ctx.createLinearGradient(0, oben, 0, unten);
    w.addColorStop(0, "#7fc4de");                    // Oberfläche
    w.addColorStop(bei(CFG.SNOWLINE), "#4e9fc0");
    w.addColorStop(bei(CFG.ICELINE), "#2f6f96");
    w.addColorStop(bei(CFG.LAVALINE), "#1a3f63");
    w.addColorStop(bei(CFG.SPACELINE), "#0d2138");
    w.addColorStop(1, "#050c18");                    // Grabensohle
    ctx.fillStyle = w;
    ctx.fillRect(lx - W, 0, W * 3, H);
    // Wasseroberfläche als welliges Band ganz oben
    ctx.strokeStyle = "rgba(224,248,255,.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = lx; x <= rx; x += 14)
      ctx.lineTo(x, oben + Math.sin(x * 0.021) * 3 + Math.sin(x * 0.008) * 4);
    ctx.stroke();
    // Lichtstrahlen von der Oberfläche nach unten
    for (let i = 0; i < 9; i++) {
      const px2 = lx + (rx - lx) * (i + 0.5) / 9 + (hash(i * 2.7) - 0.5) * 60;
      const lang = (0.12 + hash(i * 4.3) * 0.2) * (unten - oben);
      const br = 12 + hash(i * 6.1) * 22;
      const gl = ctx.createLinearGradient(0, oben, 0, oben + lang);
      gl.addColorStop(0, "rgba(200,240,255,.22)");
      gl.addColorStop(1, "rgba(190,235,255,0)");
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.moveTo(px2 - br * 0.4, oben); ctx.lineTo(px2 + br * 0.4, oben);
      ctx.lineTo(px2 + br * 1.6, oben + lang); ctx.lineTo(px2 - br * 1.6, oben + lang);
      ctx.closePath(); ctx.fill();
    }
    // ein paar Schwebeteilchen statt Sternen
    ctx.fillStyle = "rgba(206,232,255,.28)";
    for (const s2 of AB_STERNE) {
      const Y = oben + (unten - oben) * s2.y;
      ctx.beginPath(); ctx.arc(lx + s2.x * (rx - lx), Y, s2.s * 0.8, 0, 7); ctx.fill();
    }
  } else {
  /* --- Hintergrund je Schicht ------------------------------------------
     Von unten nach oben: Taghimmel über dem Tal, Dämmerung über Schnee und
     Eis, Glut über dem Vulkan, Weltall darüber. */
  const himmel = ctx.createLinearGradient(0, unten, 0, oben - H * 0.24);
  himmel.addColorStop(0, "#7fb0dd");
  himmel.addColorStop(bei(CFG.SNOWLINE), "#6b9ccd");
  himmel.addColorStop(bei(CFG.ICELINE), "#40628f");
  himmel.addColorStop(bei(CFG.LAVALINE), "#2a3358");
  himmel.addColorStop(bei(CFG.SPACELINE), "#141a33");
  himmel.addColorStop(1, "#05070f");
  ctx.fillStyle = himmel;
  ctx.fillRect(lx - W, oben - H * 0.24, W * 3, unten - oben + H * 0.24);

  // Sterne: je höher, desto mehr – unten über dem Tal ist Tag
  const yEis = py(CFG.ICELINE), yOben = oben - H * 0.23;
  for (const s of AB_STERNE) {
    const Y = yOben + (yEis - yOben) * s.y;
    const nah = 1 - (Y - yOben) / Math.max(1, yEis - yOben);   // 1 = ganz oben
    const a = Math.max(0, nah * nah) * 0.9;
    if (a < 0.03) continue;
    ctx.fillStyle = rgba([226, 236, 255], a);
    ctx.beginPath(); ctx.arc(lx + s.x * (rx - lx), Y, s.s, 0, 7); ctx.fill();
  }

  // Galaxien ganz oben im Weltall
  for (const g of AB_GALAXIEN) {
    const X = lx + g.x * (rx - lx);
    const Y = yOben + g.y * Math.max(1, py(CFG.SPACELINE) - yOben);
    const R = 54 * g.r;
    const kern = lerp3([255, 226, 190], [190, 200, 255], g.ton);
    ctx.save();
    ctx.translate(X, Y); ctx.rotate(g.dreh); ctx.scale(1, 0.42);
    const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    gl.addColorStop(0, rgba(kern, 0.85));
    gl.addColorStop(0.28, rgba(kern, 0.3));
    gl.addColorStop(1, rgba(kern, 0));
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
    ctx.strokeStyle = rgba(kern, 0.22);       // zwei angedeutete Spiralarme
    ctx.lineWidth = 3;
    for (const dir of [1, -1]) {
      ctx.beginPath();
      for (let k = 0; k <= 24; k++) {
        const w = k / 24 * 3.2, r = R * 0.16 + R * 0.8 * (k / 24);
        const px2 = Math.cos(w) * r * dir, py2 = Math.sin(w) * r * dir;
        k ? ctx.lineTo(px2, py2) : ctx.moveTo(px2, py2);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Polarlicht über dem Eisgürtel
  const yLava = py(CFG.LAVALINE);
  const al = ctx.createLinearGradient(0, py(CFG.ICELINE), 0, yLava);
  al.addColorStop(0, "rgba(120,235,190,0)");
  al.addColorStop(0.45, "rgba(120,235,190,.16)");
  al.addColorStop(1, "rgba(120,180,255,0)");
  ctx.fillStyle = al;
  ctx.fillRect(lx, yLava, rx - lx, py(CFG.ICELINE) - yLava);

  // Glut über dem Vulkangürtel
  const vg = ctx.createLinearGradient(0, yLava, 0, py(CFG.SPACELINE));
  vg.addColorStop(0, "rgba(230,110,60,0)");
  vg.addColorStop(0.5, "rgba(230,110,60,.18)");
  vg.addColorStop(1, "rgba(180,60,50,0)");
  ctx.fillStyle = vg;
  ctx.fillRect(lx, py(CFG.SPACELINE), rx - lx, yLava - py(CFG.SPACELINE));

  // Mond: nicht ganz links, dort stehen die Höhenangaben; und tief genug,
  // dass er nicht zwischen den Galaxien hängt
  const mx2 = lx + (rx - lx) * 0.36, my2 = py(CFG.SPACELINE) - 38;
  const mg = ctx.createRadialGradient(mx2, my2, 0, mx2, my2, 62);
  mg.addColorStop(0, "rgba(226,236,255,.5)");
  mg.addColorStop(0.22, "rgba(200,216,246,.16)");
  mg.addColorStop(1, "rgba(160,190,255,0)");
  ctx.fillStyle = mg;
  ctx.beginPath(); ctx.arc(mx2, my2, 62, 0, 7); ctx.fill();
  ctx.fillStyle = "rgba(238,244,255,.92)";
  ctx.beginPath(); ctx.arc(mx2, my2, 13, 0, 7); ctx.fill();
  ctx.fillStyle = "rgba(196,208,232,.45)";
  ctx.beginPath();
  ctx.arc(mx2 - 4, my2 - 3, 3, 0, 7);
  ctx.moveTo(mx2 + 7, my2 + 2); ctx.arc(mx2 + 4, my2 + 2, 2.2, 0, 7);
  ctx.fill();
  }

  /* --- Nebengipfel: geben dem Hauptberg Tiefe ---------------------------- */
  const hMax = unten - oben;
  const nebenberg = (cx, halb, hoehe, farbe, a) => {
    const p = new Path2D();
    p.moveTo(cx - halb, unten);
    for (let k = 0; k <= 56; k++) {
      const t = k / 56 * 2 - 1;
      const f = Math.max(0, 1 - Math.pow(Math.abs(t), 1.5));
      const rau = (vnoise(k * 0.7 + cx * 0.013) - 0.5) * 0.16 * f;
      p.lineTo(cx + t * halb, unten - hoehe * (f + rau));
    }
    p.lineTo(cx + halb, unten);
    p.closePath();
    ctx.fillStyle = rgba(farbe, a);
    ctx.fill(p);
    // Schneekappe: nur das obere Drittel, damit sie nicht wie ein Hut absteht
    ctx.save();
    ctx.clip(p);
    ctx.fillStyle = rgba([206, 220, 240], a * 0.5);
    ctx.fillRect(cx - halb, unten - hoehe, halb * 2, hoehe * 0.34);
    ctx.restore();
  };
  // Im Meer stünden sie auf dem Kopf im Wasser – dort gibt es sie nicht.
  if (!G_REGEL.meer) {
    nebenberg(W * 0.20, W * 0.30, hMax * 0.42, [38, 52, 84], 0.75);
    nebenberg(W * 0.90, W * 0.26, hMax * 0.36, [34, 47, 78], 0.75);
    nebenberg(W * 0.47, W * 0.24, hMax * 0.30, [44, 58, 92], 0.6);
  }

  /* --- Der Berg selbst -------------------------------------------------- */
  const berg = new Path2D();
  berg.moveTo(lx, unten);
  for (let i = 0; i <= PROFIL.n; i++) berg.lineTo(pxAuf(i), py(PROFIL.y[i]));
  for (let i = PROFIL.n; i >= 0; i--) berg.lineTo(pxAb(i), py(PROFIL.y[i]));
  berg.lineTo(rx, unten);
  berg.closePath();

  // im Meer läuft die Achse andersherum, also auch der Verlauf
  const farbverlauf = G_REGEL.meer ? ctx.createLinearGradient(0, oben, 0, unten)
                                   : ctx.createLinearGradient(0, unten, 0, oben);
  if (G_REGEL.meer) {
    farbverlauf.addColorStop(0, "#d8cf9a");                    // Ufersand
    farbverlauf.addColorStop(bei(CFG.SNOWLINE), "#8f9a6e");    // Seegras
    farbverlauf.addColorStop(bei(CFG.ICELINE), "#4a6b6b");     // Riff
    farbverlauf.addColorStop(bei(CFG.LAVALINE), "#2c3f52");
    farbverlauf.addColorStop(bei(CFG.SPACELINE), "#17233a");
    farbverlauf.addColorStop(1, "#0d1526");                    // Grabensohle
  } else {
    farbverlauf.addColorStop(0, "#2f4a35");
    farbverlauf.addColorStop(bei(CFG.SNOWLINE), "#4d6a52");
    farbverlauf.addColorStop(bei(CFG.ICELINE), "#cfd9e4");
    farbverlauf.addColorStop(bei(CFG.LAVALINE), "#8fb4d6");
    farbverlauf.addColorStop(bei(CFG.SPACELINE), "#7a4038");
    farbverlauf.addColorStop(1, "#2a2340");
  }
  ctx.fillStyle = farbverlauf;
  ctx.fill(berg);

  ctx.save();
  ctx.clip(berg);
  // Licht von oben rechts – dieselbe Sonne wie im Spiel. Die Abstiegsflanke
  // liegt im Licht, der lange Anstieg links im Schatten: das gibt dem Umriss
  // erst ein Volumen.
  const licht = ctx.createLinearGradient(gx - hMax * 0.5, oben, gx + hMax * 0.7, unten);
  licht.addColorStop(0, "rgba(10,16,34,.34)");
  licht.addColorStop(0.5, "rgba(10,16,34,0)");
  licht.addColorStop(1, "rgba(255,238,205,.20)");
  ctx.fillStyle = licht;
  ctx.fillRect(lx, oben - hMax * 0.3, rx - lx, unten - oben + hMax * 0.3);

  /* Grate: kurze Schattenkeile, die vom Kamm ein Stück den Hang hinunter
     auslaufen. Sie dürfen nur angedeutet sein – über die ganze Flanke gezogen
     sahen sie aus wie Kratzer im Bild. */
  ctx.lineCap = "round";
  const grat = (kx, ky, richtung, k) => {
    const lang = (unten - ky) * (0.16 + hash(k * 3.3 + 1) * 0.14);
    const g = ctx.createLinearGradient(kx, ky, kx + richtung * lang * 0.4, ky + lang);
    g.addColorStop(0, "rgba(18,26,48,.16)");
    g.addColorStop(1, "rgba(18,26,48,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 3 + hash(k * 5.1) * 5;
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.quadraticCurveTo(kx + richtung * lang * 0.1, ky + lang * 0.55,
                         kx + richtung * lang * 0.4, ky + lang);
    ctx.stroke();
  };
  for (let k = 0; k < 7; k++) {
    const i = Math.round(PROFIL.n * (0.2 + k * 0.11));
    grat(pxAuf(i), py(PROFIL.y[i]), -1, k);
  }
  for (let k = 0; k < 4; k++) {
    const i = Math.round(PROFIL.n * (0.3 + k * 0.17));
    grat(pxAb(i), py(PROFIL.y[i]), 1, k + 9);
  }

  // Schneegrenze: nur eine schmale, wellige Kante. Eine flächige Lasur darüber
  // hat die Gebietsfarben komplett ausgewaschen. Unter Wasser gibt es keine.
  const ys = py(G_REGEL.meer ? -1e9 : CFG.SNOWLINE);
  ctx.strokeStyle = "rgba(240,247,255,.34)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let x = lx; x <= rx; x += 16) {
    const Y = ys + Math.sin(x * 0.013) * 7 + (vnoise(x * 0.02) - 0.5) * 12;
    x === lx ? ctx.moveTo(x, Y) : ctx.lineTo(x, Y);
  }
  ctx.stroke();
  ctx.restore();

  // Kammlinie: auf der Lichtseite hell, auf der Schattenseite nur angedeutet
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = rgba([210, 226, 250], 0.3);
  ctx.beginPath();
  for (let i = 0; i <= PROFIL.n; i++) {
    const X = pxAuf(i), Y = py(PROFIL.y[i]);
    i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
  }
  ctx.stroke();
  ctx.strokeStyle = rgba([255, 243, 214], 0.6);
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = PROFIL.n; i >= 0; i--) {
    const X = pxAb(i), Y = py(PROFIL.y[i]);
    i === PROFIL.n ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
  }
  ctx.stroke();

  // Startdorf am linken Fuß: drei Dächer, mehr braucht es nicht. Im Meer liegt
  // dort die Wasserlinie – Häuser würden im Wasser schweben.
  const dy = py(PROFIL.y[0]);
  ctx.fillStyle = rgba([236, 226, 206], 0.9);
  for (let i = 0; i < (G_REGEL.meer ? 0 : 3); i++) {
    const hx = lx + W * 0.02 + i * 11, hh = 7 + (i % 2) * 3;
    ctx.fillRect(hx, dy - hh, 8, hh);
    ctx.beginPath();
    ctx.moveTo(hx - 2, dy - hh); ctx.lineTo(hx + 4, dy - hh - 6);
    ctx.lineTo(hx + 10, dy - hh); ctx.closePath(); ctx.fill();
  }

  /* Höhenlinien: machen aus dem Bild einen Rückblick statt einer bloßen
     Silhouette – man sieht, wo die Gebiete anfangen, durch die man gefahren
     ist. Gestrichelt und blass, damit sie den Berg nicht zerschneiden. */
  ctx.setLineDash([7, 9]);
  ctx.lineWidth = 1;
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  for (const z of AB_ZONEN) {
    const Y = py(z.y);
    if (Y < oben - 4 || Y > unten) continue;
    ctx.strokeStyle = rgba(z.farbe, 0.3);
    ctx.beginPath(); ctx.moveTo(lx + W * 0.11, Y); ctx.lineTo(rx, Y); ctx.stroke();
    ctx.fillStyle = rgba(z.farbe, 0.72);
    ctx.fillText(z.name + " · " + Math.round(z.y / CFG.PPM) + " m", lx + W * 0.014, Y);
  }
  ctx.setLineDash([]);
  ctx.textBaseline = "alphabetic";

  // Vignette: nimmt den Rändern Helligkeit und holt den Gipfel nach vorn
  const vig = ctx.createRadialGradient(W * 0.58, H * 0.52, H * 0.28,
                                       W * 0.58, H * 0.52, H * 0.95);
  vig.addColorStop(0, "rgba(4,7,16,0)");
  vig.addColorStop(1, "rgba(4,7,16,.55)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

/* Was sich bewegt: die wachsende Route und das Sternbild über dem Gipfel. */
function zeichneAnimiertes(u, M, ein) {
  const { gx, gy, py, pxAuf } = M;

  // Die gefahrene Linie wächst vom Dorf zur Spitze
  const lauf = smooth((u - 1.9) / 3.4);
  if (lauf > 0.002) {
    const bis = lauf * PROFIL.n;
    ctx.strokeStyle = rgba([255, 216, 130], 0.95);
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pxAuf(0), py(PROFIL.y[0]) - 2);
    let ex = pxAuf(0), ey = py(PROFIL.y[0]) - 2;
    for (let i = 1; i <= Math.floor(bis); i++) {
      ex = pxAuf(i); ey = py(PROFIL.y[i]) - 2;
      ctx.lineTo(ex, ey);
    }
    const rest = bis - Math.floor(bis);      // Zwischenschritt, sonst ruckelt es
    if (rest > 0 && Math.floor(bis) < PROFIL.n) {
      const i = Math.floor(bis);
      ex = pxAuf(i) + (pxAuf(i + 1) - pxAuf(i)) * rest;
      ey = py(PROFIL.y[i]) + (py(PROFIL.y[i + 1]) - py(PROFIL.y[i])) * rest - 2;
      ctx.lineTo(ex, ey);
    }
    ctx.stroke();

    /* Marken an den Gebietsgrenzen: sie springen an, sobald die Linie dort
       vorbeigekommen ist. So liest man ab, welche Gebiete man durchfahren
       hat, statt nur eine Kurve zu sehen. */
    for (const z of AB_ZONEN) {
      let iz = -1;
      for (let i = 1; i <= PROFIL.n; i++)
        if (PROFIL.y[i - 1] < z.y && PROFIL.y[i] >= z.y) { iz = i; break; }
      if (iz < 0 || iz > bis) continue;
      const an = Math.min(1, (bis - iz) / 6);      // kurz nach dem Passieren voll da
      const zx = pxAuf(iz), zy = py(PROFIL.y[iz]) - 2;
      ctx.fillStyle = rgba(z.farbe, 0.9 * an);
      ctx.beginPath(); ctx.arc(zx, zy, 3.4, 0, 7); ctx.fill();
      ctx.strokeStyle = rgba(z.farbe, 0.5 * an);
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(zx, zy, 7 - 3 * an, 0, 7); ctx.stroke();
      ctx.lineWidth = 2.6;
    }

    if (lauf < 0.999) {                      // vorne fährt das Bike
      const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 15);
      g.addColorStop(0, "rgba(255,238,190,.9)");
      g.addColorStop(1, "rgba(255,214,130,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(ex, ey, 15, 0, 7); ctx.fill();
      // winziges Bike: zwei Räder, Rahmen, Fahrer – in Fahrtrichtung geneigt
      const i0 = Math.max(0, Math.floor(bis) - 3);
      const neig = Math.atan2(ey - (py(PROFIL.y[i0]) - 2), ex - pxAuf(i0));
      ctx.save();
      ctx.translate(ex, ey); ctx.rotate(neig);
      ctx.strokeStyle = "rgba(30,38,60,.95)"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-4, -3.4, 2.8, 0, 7); ctx.moveTo(6.8, -3.4); ctx.arc(4, -3.4, 2.8, 0, 7);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,246,220,.95)"; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-4, -3.4); ctx.lineTo(0, -6.4); ctx.lineTo(4, -3.4);
      ctx.moveTo(0, -6.4); ctx.lineTo(-1, -10.4);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Und ganz oben das Sternbild, vollständig und in Ruhe
  const sp = smooth((u - 5.2) / 1.6);
  if (sp > 0.004) {
    const t = performance.now() / 1000;
    if (istMeer()) {
      /* Im Meer steht am Ende kein Sternbild am Himmel, sondern ein Schwarm
         Leuchtwesen über der Grabensohle. */
      for (let i = 0; i < 22; i++) {
        const w = i * 1.7 + t * 0.25;
        const r = (18 + (i % 5) * 13) * (0.8 + 0.2 * Math.sin(t + i));
        const X = gx + Math.cos(w) * r * 1.5, Y = gy - 46 + Math.sin(w) * r * 0.7;
        const a = sp * (0.45 + 0.55 * Math.abs(Math.sin(t * 1.6 + i * 0.9)));
        const g = ctx.createRadialGradient(X, Y, 0, X, Y, 11);
        g.addColorStop(0, rgba([210, 255, 240], a));
        g.addColorStop(0.35, rgba([110, 230, 220], 0.5 * a));
        g.addColorStop(1, rgba([60, 180, 210], 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(X, Y, 11, 0, 7); ctx.fill();
      }
      return;
    }
    ctx.save();
    ctx.translate(gx, gy - 74);
    const zs = 0.62 + sp * 0.18;
    ctx.scale(zs, zs);
    ctx.strokeStyle = rgba([182, 208, 255], 0.5 * sp);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const [a, b] of STERNLINIEN) {
      ctx.moveTo(STERNBILD[a].x, STERNBILD[a].y);
      ctx.lineTo(STERNBILD[b].x, STERNBILD[b].y);
    }
    ctx.stroke();
    for (let i = 0; i < STERNBILD.length; i++) {
      const s = STERNBILD[i];
      const r = s.gr * 1.9 * sp * (0.8 + 0.2 * Math.sin(t * 2.6 + i * 1.9));
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3.6);
      g.addColorStop(0, rgba([255, 255, 255], sp));
      g.addColorStop(0.3, rgba([186, 212, 255], 0.42 * sp));
      g.addColorStop(1, rgba([120, 150, 255], 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(s.x, s.y, r * 3.6, 0, 7); ctx.fill();
      ctx.fillStyle = rgba([255, 255, 255], sp);
      ctx.beginPath(); ctx.arc(s.x, s.y, r * 0.5, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
}

// Beschriftung außerhalb der Zoomfahrt, damit sie lesbar bleibt
function beschriftung(u, M) {
  const bt = smooth((u - 2.2) / 1.2);
  if (bt <= 0.01) return;
  ctx.font = "600 " + Math.round(12 * Math.max(1, SCALE)) + "px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = rgba([214, 226, 245], 0.75 * bt);
  // beide auf dieselbe Grundlinie unter die Karte: über dem Gipfel steht das
  // Sternbild, dort wäre die Zahl im Weg
  const tief = istMeer();
  /* Im Meer liegt die Küste oben und der Graben unten – die beiden Marken
     stehen deshalb nicht mehr auf einer Linie, sondern jede an ihrem Ende. */
  const start = Math.min(H - 8, M.py(PROFIL.y[0]) + (tief ? 20 : 26));
  const ziel = tief ? Math.min(H - 8, M.gy + 22) : start;
  ctx.fillText(tief ? "Küste" : "Dorf", M.lx + W * 0.045, start);
  ctx.fillText((tief ? "Grund · " : "Gipfel · ") +
               Math.round(CFG.GIPFEL / CFG.PPM) + " m", M.gx, ziel);
  ctx.textAlign = "left";
}
