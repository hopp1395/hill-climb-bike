"use strict";
/* Figuren am Weg, ihre Plätze und ihre Sprüche
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* ---- Leute unterwegs ----------------------------------------------------
   Auf jeder Höhenstufe andere: im Tal Dorfbewohner, im Schnee und im Eis
   Wanderer mit Rucksack und Stock, am Vulkan Fachleute im Schutzanzug, in der
   Sternenzone Außerirdische. Sie gehen auf einem kurzen Stück hin und her –
   die Position kommt aus der Zeit, es wird also nichts gespeichert.       */
const LEUT_STEP = 560;

const LEUT_FARBEN = {
  dorf:   { haut: [232, 185, 141], kleid: [74, 111, 165], bein: [57, 64, 90] },
  wander: { haut: [232, 185, 141], kleid: [200, 80, 60],  bein: [58, 66, 86] },
  vulkan: { haut: [240, 217, 168], kleid: [232, 163, 60], bein: [138, 100, 40] },
  alien:  { haut: [143, 224, 122], kleid: [76, 143, 106], bein: [47, 92, 70] },
};

/* fern = {ziel, f} blendet alle Farben in Richtung der Hintergrundfarbe. Die
   Leute auf den Ketten müssen sich genauso in die Ferne einreihen wie Wald und
   Häuser dort, sonst kleben knallbunte Figuren auf einem blassen Berg. */
/* tempo (0..1) ist der Ausschlag von Beinen und Armen. Wer nur einen Meter
   Platz hat, tritt von einem Fuß auf den anderen statt auszuschreiten. */
function figur(ctx2, art, s, t, ph, tempo, fern) {
  const schritt = Math.sin(t * 3.4 + ph * 5) * tempo;    // Beinausschlag
  const wippe = Math.abs(Math.cos(t * 3.4 + ph * 5)) * 1.2 * tempo;
  const roh = LEUT_FARBEN[art];
  const c = (rgb, a) => rgba(fern ? lerp3(rgb, fern.ziel, fern.f) : rgb, a === undefined ? 1 : a);
  const F = { haut: c(roh.haut), kleid: c(roh.kleid), bein: c(roh.bein) };
  ctx2.save();
  ctx2.scale(s, s);
  ctx2.translate(0, -wippe);
  // Beine
  ctx2.strokeStyle = F.bein; ctx2.lineWidth = 3.4; ctx2.lineCap = "round";
  ctx2.beginPath();
  ctx2.moveTo(0, -13); ctx2.lineTo(schritt * 4, 0);
  ctx2.moveTo(0, -13); ctx2.lineTo(-schritt * 4, 0);
  ctx2.stroke();
  // Rumpf
  ctx2.fillStyle = F.kleid;
  ctx2.beginPath(); ctx2.roundRect(-4.5, -30, 9, 18, 3); ctx2.fill();
  // Arme
  ctx2.strokeStyle = F.kleid; ctx2.lineWidth = 3;
  ctx2.beginPath();
  ctx2.moveTo(-3, -27); ctx2.lineTo(-schritt * 3 - 4, -17);
  ctx2.moveTo(3, -27);  ctx2.lineTo(schritt * 3 + 4, -17);
  ctx2.stroke();
  if (art === "wander") {                                // Rucksack und Stock
    ctx2.fillStyle = c([63, 107, 70]);
    ctx2.beginPath(); ctx2.roundRect(-8, -28, 5, 13, 2); ctx2.fill();
    ctx2.strokeStyle = c([169, 129, 80]); ctx2.lineWidth = 1.6;
    ctx2.beginPath(); ctx2.moveTo(6, -20); ctx2.lineTo(8, 1); ctx2.stroke();
  }
  if (art === "vulkan") {                                // Messgerät am Arm
    ctx2.fillStyle = c([47, 54, 68]);
    ctx2.fillRect(schritt * 3 + 2, -20, 5, 4);
  }
  // Kopf
  ctx2.fillStyle = F.haut;
  if (art === "alien") {
    ctx2.beginPath(); ctx2.ellipse(0, -37, 6, 7.5, 0, 0, 7); ctx2.fill();
    ctx2.strokeStyle = F.haut; ctx2.lineWidth = 1.3;      // Fühler
    ctx2.beginPath();
    ctx2.moveTo(-2.5, -44); ctx2.lineTo(-4, -50);
    ctx2.moveTo(2.5, -44);  ctx2.lineTo(4, -50);
    ctx2.stroke();
    ctx2.fillStyle = c([22, 36, 28]);
    ctx2.beginPath();
    ctx2.ellipse(-2.4, -38, 1.9, 2.6, -0.3, 0, 7);
    ctx2.ellipse(2.4, -38, 1.9, 2.6, 0.3, 0, 7);
    ctx2.fill();
  } else {
    ctx2.beginPath(); ctx2.arc(0, -35, 5, 0, 7); ctx2.fill();
    if (art === "vulkan") {                              // Helm mit Visier
      ctx2.fillStyle = c([240, 196, 105]);
      ctx2.beginPath(); ctx2.arc(0, -36, 6, Math.PI, 2 * Math.PI); ctx2.fill();
      ctx2.fillStyle = c([60, 80, 110], 0.75);
      ctx2.fillRect(-5, -36, 10, 3.5);
    } else if (art === "wander") {                       // Mütze
      ctx2.fillStyle = c([200, 80, 60]);
      ctx2.beginPath(); ctx2.arc(0, -36, 5.4, Math.PI, 2 * Math.PI); ctx2.fill();
    }
  }
  ctx2.restore();
}

/* Taugt die Stelle zum Stehen und Gehen? Steilhang, Lavabecken und Geysire
   nicht. Die Steigungsgrenze wächst mit der Höhe: unten im Dorf geht niemand
   eine Böschung entlang, aber Vulkanologen und Aliens sind genau deshalb da,
   wo es steil ist – mit der starren Grenze von 0.4 blieben ab 500 m nur noch
   knapp 60 % der Plätze übrig und man begegnete oft niemandem mehr. */
function begehbar(x) {
  const grenze = 0.4 + 0.16 * smooth((terrainY(x) - CFG.ICELINE) / 7000);
  if (Math.abs(slopeAt(x)) > grenze) return false;
  if (poolAt(x)) return false;
  for (const g of GEYSERS) if (Math.abs(g.x - x) < 90) return false;
  return true;
}

/* Standort, Laufweite und Sorte hängen nur am Gelände, nicht an der Zeit –
   deshalb einmal je Rasterfeld ausrechnen und merken.

   Vorher wurde bei jedem Bild die Steigung an der AKTUELLEN Schrittposition
   geprüft. Wer im Gehen an eine steile Stelle geriet, löste sich mitten im
   Schritt auf und kam Sekunden später wieder – ohne erkennbaren Grund. Auch
   die Sorte hing an der Laufposition und konnte unterwegs umspringen. Jetzt
   wird die Laufweite so weit eingekürzt, bis die ganze Strecke begehbar ist;
   geht das nicht, steht dort von vornherein niemand. */
const LEUT_CACHE = new Map();

function leutePlatz(k) {
  if (LEUT_CACHE.has(k)) return LEUT_CACHE.get(k);
  let platz = null;
  /* Nicht auf einen festen Punkt im Raster setzen: über 80 % der Felder liegen
     am Steilhang, dort stünde dann einfach niemand. Stattdessen das Feld
     abtasten und die flachste begehbare Stelle nehmen – so wie das Gelände
     auch für Lavabecken und Schanzen nach passenden Plätzen absucht. */
  let heim = null, flachste = Infinity;
  for (let i = 0; i < 14; i++) {
    const x = (k + (i + hash(k * 2.9 + 1)) / 14) * LEUT_STEP;
    if (!begehbar(x)) continue;
    const s = Math.abs(slopeAt(x));
    if (s < flachste) { flachste = s; heim = x; }
  }
  if (heim !== null) {
    // Die ganze Strecke abtasten, nicht nur die Endpunkte: eine steile Stelle
    // mittendrin rutscht sonst durch und der Wanderer klettert eine Wand hoch.
    const streckeFrei = w => {
      for (let i = -4; i <= 4; i++) if (!begehbar(heim + (i / 4) * w)) return false;
      return true;
    };
    let weite = 60 + hash(k * 7.1) * 70;
    while (weite > 6 && !streckeFrei(weite)) weite *= 0.62;
    // Reicht es nirgends für eine Runde, bleibt die Person auf ihrem Fleck –
    // besser als gar keine, und sie gerät so auch nicht an den Steilhang.
    if (!streckeFrei(weite)) weite = 0;
    const wy = terrainY(heim) - jumpRise(heim, true);
    const eis = iceAt(wy), lava = lavaAt(wy), raum = spaceAt(wy);
    const schnee = smooth((wy - CFG.SNOWLINE + 500) / 900) * (1 - eis - lava - raum);
    platz = { heim, weite, ph: hash(k * 5.3 + 4) * 6.28,
              art: raum > 0.4 ? "alien" : lava > 0.4 ? "vulkan"
                 : (eis > 0.3 || schnee > 0.35) ? "wander" : "dorf" };
  }
  LEUT_CACHE.set(k, platz);
  return platz;
}

/* Zurufe. Alles hängt an k und der Uhr, damit kein Zustand mitgeschleppt wird
   und jede Person zuverlässig bei ihrem eigenen Spruch bleibt. */
const SPRUECHE = {
  dorf: ["NICHT SO SCHNELL DU RABAUKE!", "Das ist mein Vorgarten!", "Moin!",
         "Fahr vorsichtig, Junge!", "Der schafft das nie.", "Grüß die Ziegen!",
         "MEIN ZAUN!", "Immer diese Motorräder..."],
  wander: ["Schöne Aussicht, was?", "Da oben wird's glatt!", "Brrr, kalt heute!",
           "Gipfel ist noch weit!", "Berg heil!", "Hast du Tee dabei?"],
  vulkan: ["Nicht zu nah an die Lava!", "Messwerte im roten Bereich!",
           "Der Geysir geht gleich!", "Helm auf, bitte!", "Hier ist Sperrgebiet!",
           "Faszinierend, dieses Gestein."],
};
const ALIEN_SILBEN = ["zip", "zap", "zup"];

function spruchVon(k, art, runde) {
  if (art !== "alien") {
    const liste = SPRUECHE[art] || SPRUECHE.dorf;
    return liste[Math.floor(hash(k * 19.7 + runde * 3.1) * liste.length) % liste.length];
  }
  // Aliens können nur zip, zap und zup – daraus zwei bis vier Silben
  const n = 2 + Math.floor(hash(k * 23.3 + runde * 5.7) * 3);
  let s = "";
  for (let i = 0; i < n; i++)
    s += (i ? " " : "") + ALIEN_SILBEN[Math.floor(hash(k * 29.1 + runde * 7.3 + i * 1.7) * 3) % 3];
  return s + "?!".charAt(Math.floor(hash(k * 31.7 + runde) * 2));
}

function drawBlase(px, py, text, a) {
  const fs = Math.max(9, Math.round(11 * SCALE));
  ctx.font = "700 " + fs + "px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const bw = ctx.measureText(text).width + fs * 1.1, bh = fs * 1.75;
  const x0 = px - bw / 2, y0 = py - bh;
  ctx.fillStyle = rgba([248, 250, 255], 0.92 * a);
  ctx.strokeStyle = rgba([40, 52, 78], 0.5 * a);
  ctx.lineWidth = Math.max(1, SCALE);
  ctx.beginPath();
  ctx.roundRect(x0, y0, bw, bh, fs * 0.55);
  ctx.moveTo(px - fs * 0.32, y0 + bh - 1);      // Zipfel nach unten zur Person
  ctx.lineTo(px, y0 + bh + fs * 0.62);
  ctx.lineTo(px + fs * 0.32, y0 + bh - 1);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = rgba([26, 34, 56], a);
  ctx.fillText(text, px, y0 + bh / 2);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
}

function drawLeute(schattenLauf) {
  const xl = wxAt(-80), xr = wxAt(W + 80), t = performance.now() / 1000;
  for (let k = Math.floor(xl / LEUT_STEP); k <= Math.ceil(xr / LEUT_STEP); k++) {
    if (hash(k * 3.77 + 8.2) > 0.45) continue;
    const p = leutePlatz(k);
    if (!p) continue;
    const wx = p.heim + Math.sin(t * 0.32 + p.ph) * p.weite;
    const hin = Math.cos(t * 0.32 + p.ph) > 0 ? 1 : -1;  // Blickrichtung
    const wy = terrainY(wx) - jumpRise(wx, true);
    const s = SCALE * 1.35;
    if (schattenLauf) { schattenBand(wx, 7 * s / SCALE, 44 * s / SCALE, 0.26); continue; }
    ctx.save();
    ctx.translate(sx(wx), sy(wy));
    ctx.scale(hin, 1);                                   // spiegeln je Richtung
    figur(ctx, p.art, s, t, p.ph, Math.max(0.22, Math.min(1, p.weite / 45)));
    ctx.restore();

    // Zuruf: alle paar Sekunden, versetzt je Person, mit weichem Ein-/Ausblenden
    const takt = 9 + hash(k * 13.1 + 2) * 8;
    const u = (t + hash(k * 17.3 + 5) * takt) % takt;
    if (u < 2.8) {
      const a = Math.min(1, u / 0.35, (2.8 - u) / 0.45);
      drawBlase(sx(wx), sy(wy) - 48 * s,
                spruchVon(k, p.art, Math.floor((t + hash(k * 17.3 + 5) * takt) / takt)), a);
    }
  }
}

/* Wanderer auf den Hintergrundketten. Sie laufen mit derselben
   Parallaxe wie Wald und Häuser der jeweiligen Kette, sitzen also fest auf
   ihrem Berg statt mit der Kamera zu schwimmen. */
function kammSteigung(x, amp, base) {
  return (ridgeY(x + 8, amp, base) - ridgeY(x - 8, amp, base)) / 16;
}

function drawKammLeute(alt, par, amp, base, o) {
  const wx0 = cam.x * par + (-60 - W * CAMX) / SCALE;
  const wx1 = cam.x * par + (W + 60 - W * CAMX) / SCALE;
  const t = performance.now() / 1000;
  // je höher die Kamera, desto tiefer sinken die Ketten ins Dunkel – die Leute
  // gehen den Weg mit, sind aber immer etwas stärker eingetrübt als der Wald
  const misch = { ziel: [16, 20, 44], f: Math.min(0.9, 0.34 + alt * 0.56) };
  for (let k = Math.floor(wx0 / o.lstep); k <= Math.ceil(wx1 / o.lstep); k++) {
    if (hash(k * 8.13 + o.seed) > o.ldens) continue;
    const heim = (k + hash(k * 6.1 + o.seed) * 0.7) * o.lstep;
    let weite = 80 + hash(k * 9.7 + o.seed) * 110;
    // dieselbe Regel wie unten am Gelände: erst kürzen, dann ganz verzichten
    while (weite > 25 && (Math.abs(kammSteigung(heim - weite, amp, base)) > 0.38 ||
                          Math.abs(kammSteigung(heim + weite, amp, base)) > 0.38))
      weite *= 0.6;
    if (weite <= 25 || Math.abs(kammSteigung(heim, amp, base)) > 0.38) continue;
    const ph = hash(k * 4.4 + o.seed) * 6.28;
    const wx = heim + Math.sin(t * 0.26 + ph) * weite;
    const py = H * CAMY - (ridgeY(wx, amp, base) - cam.y * par) * SCALE;
    if (py > H + 30 || py < -50) continue;
    const px = W * CAMX + (wx - cam.x * par) * SCALE;
    ctx.save();
    ctx.translate(px, py + 2 * SCALE);
    ctx.scale(Math.cos(t * 0.26 + ph) > 0 ? 1 : -1, 1);
    figur(ctx, alt > 0.3 ? "wander" : "dorf", SCALE * o.lsz, t, ph,
          Math.max(0.3, Math.min(1, weite / 60)), misch);
    ctx.restore();
  }
}
