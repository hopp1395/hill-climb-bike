"use strict";
/* Gelände: Höhenfeld, Hindernisse, Schluchten, Rampen, Finale.
   Deterministisch und endlos, und mit der Distanz wird es steiler.
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }
function vnoise(x) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}
const smooth = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

// Schwierigkeit: 0..1 über die ersten ~11000 px, danach flacher weiter steigend –
// so wird es immer schwerer, ohne dass die Berge ins Absurde wachsen.
function diffAt(x) {
  const t = Math.max(0, x) / 11000;
  // Deckel bei 3,67 (erreicht bei x = 60000): die Grundsteigung ist dort 0,60
  // und käme sonst in die Nähe des Steigungsdeckels 0,776 – das Gelände würde
  // zur einzigen geraden Rampe, weil für Täler kein Spielraum mehr bleibt.
  // Ab da wird es nicht mehr steiler, aber die Strecke geht weiter: gemessen
  // bleiben Median 33° und Täler erhalten, es ist also weiter fahrbar.
  // Im leichten Grad wächst der Verlauf gedämpft – dasselbe Gelände, nur zahmer
  return Math.min(3.67, t <= 1 ? t : 1 + (t - 1) * 0.6) * G_REGEL.diff;
}

// Pro Runde neu gewürfelt: gleicher Schwierigkeitsverlauf, andere Berge.
let SEED = 0;

// Kurze Wellen statt Riesenberge: ein einzelner Tal->Gipfel-Anstieg bleibt bei
// ~20 m, die Steilheit kommt aus der Frequenz, nicht aus der Höhe.
function rawTerrain(x) {
  const s = smooth((x - 140) / 1200);         // flacher Start
  const d = diffAt(x);
  let h = x * (0.09 + 0.14 * d);              // Grundsteigung
  h += Math.sin(x * 0.0036 + SEED * 1.7) * (70 + 110 * d);
  h += Math.sin(x * 0.0075 + 1.7 + SEED * 3.1) * (35 + 55 * d);
  h += (vnoise(x * 0.0040 + 3.1 + SEED * 13) - 0.5) * (60 + 110 * d);
  h += (vnoise(x * 0.011 + 11.7 + SEED * 29) - 0.5) * (18 + 36 * d);
  return h * s;
}

// Das rohe Profil wird einmal pro Runde in ein Höhenfeld gegossen. Statt
// steile Stellen hart abzuschneiden (das ergab lange, schnurgerade Rampen)
// wird die Steigung weich zusammengedrückt: bis 65 % der Grenze bleibt alles
// wie gewürfelt, darüber läuft es asymptotisch gegen die Grenze, ohne sie je
// zu erreichen. Unterschiedlich steile Hänge bleiben dadurch unterschiedlich.
const TSTEP = 5;
// Lang genug, dass der Gipfeldeckel von 1000 m auch erreicht wird: ab x=60000
// steigt das Gelände nur noch rund 4,4 m je 1000 px, weil die Steigungsbremse
// die großen Ausschläge oben stärker staucht als unten.
const TFIELD = new Float32Array(35000);
const TEND = (TFIELD.length - 1) * TSTEP;
const DETAIL_ROOM = 0.2;                      // Anteil des Steigungsbudgets für die Feinwelle

function softSlope(s, cap) {
  const k = cap * 0.65;
  return s <= k ? s : k + (cap - k) * Math.tanh((s - k) / (cap - k));
}

// Feine Welle obendrauf – bricht auch die steilsten Passagen auf.
// Steigungsanteil = 9 * 0.021 = 0.189, passt exakt ins reservierte Budget.
function detail(x) {
  return Math.sin(x * 0.021 + SEED * 5.3) * 9;
}

/* ---- Sonderstellen: Steilwände und Schluchten mit Brücke ----------------
   Die Steigungsbremse oben hält alles fahrbar. Diese beiden Features werden
   danach obendrauf gesetzt und dürfen die Grenze bewusst reißen:
   - WALLS: kurze, sehr steile Stufen -> nur mit Boost zu schaffen.
   - RAVINES: tiefe Kerben; darüber spannt sich eine Brücke.             */
let WALLS = [], RAVINES = [], RSLOTS = [], JUMPS = [], JSLOTS = [], PSLOTS = [];

function planFeatures() {
  WALLS = []; RAVINES = []; RSLOTS = []; JUMPS = []; JSLOTS = []; PSLOTS = [];
  for (let k = 0; ; k++) {
    const x0 = 6500 + k * 7000 + hash(k * 13.7 + SEED) * 2500;
    if (x0 > TEND - 2500) break;
    // target = gewünschte Endsteilheit (tan). 1.80-2.05 sind 61-64°: sicher
    // über der Grenze ohne Boost (55,6°), aber flach genug, dass das Bike
    // beim Boosten nicht nach hinten wegkippt. Die Höhe H wird in
    // buildTerrain aus dem tatsächlichen Gefälle an der Stelle berechnet.
    const L = 260 + hash(k * 5.1 + SEED) * 140;
    WALLS.push({ x0, L, H: 0, target: 1.80 + hash(k * 9.9 + SEED) * 0.25 });
  }
  /* Im Meer bleibt es bei den Steilwänden – gespiegelt werden daraus
     Abbruchkanten, und die trägt der Abstieg gut. Sie sind ausserdem nötig:
     ihre Stufen summieren sich, ohne sie kommt die Strecke nur auf 699 statt
     1000 m und es gäbe gar keinen Graben. Schluchten, Schanzen und Lavabecken
     fallen dagegen weg – eine gespiegelte Schlucht wäre ein Hügel und die
     Brücke spannte über nichts. */
  if (istMeer()) return;
  // Nur grobe Suchfenster – die genaue Stelle sucht buildTerrain, sobald das
  // Gelände steht: die Brücke soll da liegen, wo der Berg flach ist.
  for (let k = 0; ; k++) {
    const x = 8500 + k * 7000 + hash(k * 3.3 + SEED + 40) * 1500;
    if (x > TEND - 3000) break;
    RSLOTS.push({ x, w: 420 + hash(k * 7.7 + SEED) * 260,
                  D: 420 + hash(k * 11.1 + SEED) * 380 });
  }
  // Sprungschanzen: auch hier nur das Suchfenster. Die Rampe braucht Gefälle
  // dahinter, sonst landet man sofort wieder – die Stelle sucht buildTerrain.
  for (let k = 0; ; k++) {
    const x = 3000 + k * 2800 + hash(k * 17.3 + SEED + 70) * 1100;
    if (x > TEND - 1600) break;
    JSLOTS.push({ x, L: 210 + hash(k * 4.9 + SEED) * 80,
                  target: 0.85 + hash(k * 6.3 + SEED) * 0.12 });
  }
  // Lavabecken. Sie sind Kerben wie die Schluchten, nur mit Lava gefüllt, und
  // kommen in zwei Sorten: breit mit Brücke, oder schmal mit Schanze davor.
  // Welche Stelle es wird, entscheidet buildTerrain – nur dort, wo der Berg
  // wirklich in der Vulkanzone liegt.
  for (let k = 0; ; k++) {
    const x = 9000 + k * 3400 + hash(k * 8.9 + SEED + 90) * 1500;
    if (x > TEND - 3000) break;
    const bruecke = hash(k * 2.7 + SEED + 5) > 0.5;
    PSLOTS.push({ x, bruecke,
                  w: bruecke ? 420 + hash(k * 6.1 + SEED) * 240
                             : 120 + hash(k * 6.1 + SEED) * 50,
                  // flach halten: ein schmales, tiefes Loch sieht aus wie ein
                  // Schacht, nicht wie ein Becken
                  D: bruecke ? 420 + hash(k * 3.9 + SEED) * 320
                             : 115 + hash(k * 3.9 + SEED) * 70 });
  }
}

function wallRise(x) {
  let h = 0;
  for (const w of WALLS) {
    if (x <= w.x0) continue;
    h += x >= w.x0 + w.L ? w.H : w.H * smooth((x - w.x0) / w.L);
  }
  return h;
}

/* Sprungschanze: h = H*t² steigt bis zur Kante immer steiler an, danach fällt
   der Boden über JDROP Pixel weg. Genau diese Kante macht die Flugzeit – über
   eine runde Kuppe rollt man, ohne abzuheben. */
const JDROP = 70;

function jumpRise(x, nurHolz) {
  let h = 0;
  for (const j of JUMPS) {
    if (nurHolz && !j.holz) continue;
    if (x <= j.x0 || x >= j.x0 + j.L + JDROP) continue;
    const t = (x - j.x0) / j.L;
    h += t < 1 ? j.H * t * t : j.H * (1 - smooth((x - j.x0 - j.L) / JDROP));
  }
  return h;
}

// liste: welche Kerben ausgehoben werden – die Becken kommen später dran als
// die Schluchten, sonst würde beim zweiten Durchgang doppelt gegraben
function ravineDepth(x, liste) {
  let d = 0;
  for (const r of (liste || RAVINES)) {
    const t = (x - r.x1) / (r.x2 - r.x1);
    if (t <= 0 || t >= 1) continue;
    d += r.D * Math.min(1, Math.sin(Math.PI * t) * 2.2);   // steile Flanken, flacher Grund
  }
  return d;
}

// Breite des Randstreifens, in dem der Auflagepunkt des Decks gesucht wird.
const BOFF = 24;

// Auslauf an einem Deckende: c(d) = k*d*(1-|d|/E)^2 addiert am Ende genau die
// fehlende Steigung k und ist nach E Pixeln wieder null. Das Deck liegt damit
// tangential auf dem Hang auf, in der Mitte bleibt es gerade. Die Steigung des
// Decks bleibt dabei zwischen s0-k/3 und s0+k, wird also nie steiler als der
// Hang, auf den es trifft.
function deckEase(d, k, E) {
  if (k === 0 || Math.abs(d) >= E) return [0, 0];
  const u = Math.abs(d) / E;
  return [k * d * (1 - u) * (1 - u), k * (1 - u) * (1 - 3 * u)];
}

function deckAt(r, x) {
  const a = deckEase(x - r.bx1, r.k1, r.E), b = deckEase(x - r.bx2, r.k2, r.E);
  return { y: r.y1 + r.s0 * (x - r.bx1) + a[0] + b[0], s: r.s0 + a[1] + b[1] };
}

// Brückendeck an dieser Stelle (oder null)
function bridgeAt(x) {
  for (const r of RAVINES) {
    // Becken zum Drüberspringen haben keine Auflager. Ohne diese Abfrage wären
    // ihre undefinierten Ränder in jedem Vergleich false und die Schleife gäbe
    // für JEDE Stelle ein NaN-Deck zurück – echte Brücken dahinter fänden dann
    // nie jemand.
    if (!r.bruecke) continue;
    if (x < r.bx1 || x > r.bx2) continue;
    return deckAt(r, x);
  }
  return null;
}

// Oberfläche unter yRef – die Brücke trägt nur von oben
function groundUnder(x, yRef) {
  const t = terrainY(x), b = bridgeAt(x);
  return (b && yRef >= b.y - 4 && b.y > t) ? b.y : t;
}

function buildTerrain() {
  planFeatures();
  const room = 1 - DETAIL_ROOM;
  const capUp = CFG.SLOPE_CAP * room * TSTEP;
  const capDn = CFG.SLOPE_CAP_DOWN * room * TSTEP;
  let raw = rawTerrain(0), y = raw;
  TFIELD[0] = y + detail(0);
  for (let i = 1; i < TFIELD.length; i++) {
    const x = i * TSTEP;
    const r = rawTerrain(x);
    let ds = r - raw;                         // Rohsteigung dieses Schrittes
    ds = ds >= 0 ? softSlope(ds, capUp) : -softSlope(-ds, capDn);
    raw = r;
    y += ds;
    TFIELD[i] = y + detail(x);
  }

  // Brückenplatz suchen: im Fenster die Stelle mit den flachsten Kanten. Nur
  // dort passt eine waagerechte Brücke ohne Absatz an den Berg. Bewertet wird
  // die Deckneigung (doppelt, die sieht man am stärksten) und das Gefälle
  // direkt vor und hinter der Schlucht.
  for (const sl of RSLOTS) {
    let best = null;
    for (let x1 = sl.x - 1400; x1 <= sl.x + 1400; x1 += 60) {
      const x2 = x1 + sl.w;
      if (x1 < 1500 || x2 > TEND - 600) continue;
      if (WALLS.some(v => v.x0 < x2 + 900 && v.x0 + v.L > x1 - 900)) continue;
      const deck = (terrainY(x2) - terrainY(x1)) / sl.w;
      const sc = Math.max(Math.abs(deck) * 2,
                          Math.abs(slopeAt(x1 - 25)), Math.abs(slopeAt(x2 + 25)));
      if (!best || sc < best.sc) best = { x1, x2, sc };
    }
    if (best && best.sc < 0.55)
      RAVINES.push({ x1: best.x1, x2: best.x2, D: sl.D, y1: 0, y2: 0, bruecke: true });
  }
  if (RAVINES.length) {
    for (let i = 0; i < TFIELD.length; i++) TFIELD[i] -= ravineDepth(i * TSTEP);
  }

  // Steilwände: Höhe so wählen, dass zusammen mit dem vorhandenen Gefälle
  // die Zielsteilheit herauskommt (Smoothstep-Flanke ist 1,5× der Schnitt).
  for (const w of WALLS) {
    const i0 = Math.min(TFIELD.length - 1, Math.round(w.x0 / TSTEP));
    const i1 = Math.min(TFIELD.length - 1, Math.round((w.x0 + w.L) / TSTEP));
    const base = i1 > i0 ? (TFIELD[i1] - TFIELD[i0]) / ((i1 - i0) * TSTEP) : 0;
    w.H = Math.max(60, w.L * (w.target - base) / 1.5);
  }
  for (let i = 0; i < TFIELD.length; i++) TFIELD[i] += wallRise(i * TSTEP);

  // Lavabecken erst jetzt suchen: jede Steilwand hebt alles hinter sich
  // dauerhaft an, vorher stünde die Höhenprüfung um Tausende Pixel daneben und
  // die Becken lägen in der falschen Zone.
  const neueBecken = [];
  for (const sl of PSLOTS) {
    let best = null;
    for (let x1 = sl.x - 2400; x1 <= sl.x + 2400; x1 += 40) {
      const x2 = x1 + sl.w;
      if (x1 < 2000 || x2 > TEND - 900) continue;
      const h = terrainY(x1);
      // Erst ab LAVALINE + ZONE_FADE ist das Gestein wirklich vulkanisch – ein
      // Lavabecken mitten im Gletscher sähe verkehrt aus.
      if (h < CFG.LAVALINE + CFG.ZONE_FADE || h > CFG.SPACELINE - 300) continue;
      if (WALLS.some(v => v.x0 < x2 + 900 && v.x0 + v.L > x1 - 900)) continue;
      if (RAVINES.some(r => r.x1 < x2 + 1200 && r.x2 > x1 - 1200)) continue;
      const deck = (terrainY(x2) - terrainY(x1)) / sl.w;
      let sc = Math.max(Math.abs(deck) * 2,
                        Math.abs(slopeAt(x1 - 25)), Math.abs(slopeAt(x2 + 25)));
      if (!sl.bruecke) {
        // Ohne Brücke muss gesprungen werden, und dafür braucht es Tempo: der
        // Anlauf davor darf nicht bergauf gehen, sonst kommt das Bike mit 300
        // statt 800 px/s an der Schanze an und fällt zwangsläufig hinein.
        const anlauf = (terrainY(x1 - 60) - terrainY(x1 - 560)) / 500;
        if (anlauf > -0.02) continue;           // muss bergab sein
        // Landeseite darf nicht höher liegen als die Absprungkante, sonst
        // fehlt genau der Meter, der über die Lava trägt
        if (terrainY(x2 + 60) > terrainY(x1)) continue;
        if ((terrainY(x2 + 320) - terrainY(x2)) / 320 > 0.45) continue;
        sc = Math.max(sc, anlauf + 0.3);
      }
      if (!best || sc < best.sc) best = { x1, x2, sc };
    }
    if (best && best.sc < (sl.bruecke ? 0.55 : 0.75)) {
      const becken = { x1: best.x1, x2: best.x2, D: sl.D, y1: 0, y2: 0,
                       bruecke: sl.bruecke, lava: true };
      RAVINES.push(becken); neueBecken.push(becken);
    }
  }
  // nur die Becken ausheben – die Schluchten sind schon gegraben
  if (neueBecken.length) {
    for (let i = 0; i < TFIELD.length; i++)
      TFIELD[i] -= ravineDepth(i * TSTEP, neueBecken);
  }

  // Sprungschanzen platzieren: gesucht wird die Stelle mit dem meisten Gefälle
  // hinter der Kante. Erst der tiefere Landeplatz bringt die Flugzeit, aus der
  // Rampe allein käme nur ein knapper halber Salto heraus.
  for (const sl of JSLOTS) {
    let best = null;
    for (let x0 = sl.x - 1500; x0 <= sl.x + 1500; x0 += 40) {
      const kante = x0 + sl.L;
      if (x0 < 2000 || kante + 900 > TEND) continue;
      if (WALLS.some(w => w.x0 < kante + 500 && w.x0 + w.L > x0 - 500)) continue;
      if (RAVINES.some(r => r.x1 < kante + 500 && r.x2 > x0 - 500)) continue;
      if (JUMPS.some(j => Math.abs(j.x0 - x0) < 2200)) continue;
      // Im Fels darf die Rampe etwas über den Steigungsdeckel: die Grenze aus
      // dem Stand liegt dort bei 55,6° (nass 46,6°). Im Schnee sind es nur
      // 45,2°, also bleibt sie oben beim Deckel. So gibt es keine Schanze,
      // die man ohne Anlauf nicht hochkäme.
      const schnee = smooth((terrainY(x0) - CFG.SNOWLINE) / CFG.SNOW_FADE);
      const tgt = sl.target + 0.08 * (1 - schnee);
      // Die höchste Rampe, die an KEINER Stelle über diese Steigung kommt.
      // Nur die Kante zu prüfen reicht nicht: auf einer Kuppe liegt die
      // steilste Stelle mitten in der Rampe, und dort bliebe man hängen.
      let H = 1e9;
      for (let t = 0.15; t < 1.02; t += 0.05)
        H = Math.min(H, (tgt - slopeAt(x0 + t * sl.L)) * sl.L / (2 * t));
      if (H < 35) continue;
      H = Math.min(H, 200);
      // Flugzeit kommt aus drei Dingen: Anlauf davor (Tempo), Rampenhöhe
      // (Absprungwinkel) und Abfall dahinter (tieferer Landeplatz).
      const fall = terrainY(kante) - terrainY(kante + 700);
      if (fall < 110) continue;                     // ohne tieferen Landeplatz keine Flugzeit
      const anlauf = terrainY(x0 - 700) - terrainY(x0);
      const sc = fall + 2 * H + 1.5 * anlauf;
      if (!best || sc > best.sc) best = { x0, H, fall, sc };
    }
    // Etwa die Hälfte der Schanzen wird als Holzkonstruktion gezeichnet –
    // reine Optik, gefahren wird auf derselben Geländekante.
    if (best) JUMPS.push({ x0: best.x0, L: sl.L, H: best.H,
                           holz: hash(best.x0 * 0.013 + SEED * 3.7) > 0.45 });
  }
  // Vor jedes Becken ohne Brücke kommt eine Schanze. Sie steht fest an der
  // Kante statt an der besten Stelle – ohne sie käme man nicht hinüber.
  for (const r of RAVINES) {
    if (!r.lava || r.bruecke) continue;
    const L = 210, x0 = r.x1 - 60 - L;
    let H = 1e9;                        // wie bei den anderen Schanzen gedeckelt
    for (let t = 0.15; t < 1.02; t += 0.05)
      H = Math.min(H, (0.95 - slopeAt(x0 + t * L)) * L / (2 * t));
    r.rampe = { x0, L, H: Math.max(45, Math.min(H, 200)) };
    JUMPS.push({ x0, L, H: r.rampe.H, holz: true });
  }
  for (let i = 0; i < TFIELD.length; i++) TFIELD[i] += jumpRise(i * TSTEP);

  bauFinale();
  /* Meer: das fertige Höhenfeld samt Finale an der Startlinie spiegeln. Aus dem
     Anstieg wird ein Abstieg, aus der Gipfelrampe der Weg in den Graben, und
     der tiefste Punkt liegt genau dort, wo sonst der Gipfel lag. */
  if (istMeer()) {
    for (let i = 0; i < TFIELD.length; i++) TFIELD[i] = -TFIELD[i];
    if (FINALE) { FINALE.bahn = -FINALE.bahn; FINALE.gespiegelt = true; }
  }
  bauHelis();

  // Deck einmessen: Höhe dort ablesen, wo es aufliegt (außerhalb der
  // Abbruchkante), und die Geländesteigung davor/dahinter merken. Damit legt
  // bridgeAt() die Deckenden tangential ans Gelände – der Berg selbst bleibt
  // unangetastet, es entsteht also keine neue Steilstelle.
  // Auflager sind die höchsten Bodenstellen im Randstreifen neben der Schlucht.
  // Dort liegt das Deck auf, und zwischen Auflager und Abbruchkante kann kein
  // Bodenbuckel mehr darüber hinausragen. Das Maximum ist außerdem von sich aus
  // unempfindlich gegen die schon abgegrabenen Rasterpunkte an der Kante.
  const anchor = (from, to) => {
    let bx = from, by = terrainY(from);
    for (let x = from + 2; x <= to; x += 2) {
      const y = terrainY(x);
      if (y > by) { by = y; bx = x; }
    }
    return bx;
  };
  for (const r of RAVINES) {
    if (!r.bruecke) continue;              // Becken zum Drüberspringen
    r.bx1 = anchor(r.x1 - BOFF, r.x1 - 4);
    r.bx2 = anchor(r.x2 + 4, r.x2 + BOFF);
    r.y1 = terrainY(r.bx1); r.y2 = terrainY(r.bx2);
    r.s0 = (r.y2 - r.y1) / (r.bx2 - r.bx1);
    r.k1 = (r.y1 - terrainY(r.bx1 - 12)) / 12 - r.s0;
    r.k2 = (terrainY(r.bx2 + 12) - r.y2) / 12 - r.s0;
    r.E = Math.min(150, (r.bx2 - r.bx1) * 0.3);
    // Zwischen Auflager und Abbruchkante den Boden auf Deckhöhe kappen. Das
    // sind wenige Pixel und nur dort, wo er sonst über das Deck ragen würde.
    for (const [a, b] of [[r.bx1, r.x1], [r.x2, r.bx2]]) {
      for (let i = Math.ceil(a / TSTEP); i * TSTEP <= b; i++)
        TFIELD[i] = Math.min(TFIELD[i], deckAt(r, i * TSTEP).y);
    }
  }

  // Lavaspiegel erst jetzt setzen, wenn der Boden endgültig steht: er liegt
  // über der tiefsten Stelle der Kerbe, aber unter der niedrigeren der beiden
  // Kanten – sonst liefe die Lava über den Rand.
  for (const r of RAVINES) {
    if (!r.lava) continue;
    let tief = Infinity;
    for (let x = r.x1; x <= r.x2; x += 8) tief = Math.min(tief, terrainY(x));
    const rand = Math.min(terrainY(r.x1), terrainY(r.x2));
    // gut halb voll, aber immer deutlich unter der niedrigeren Kante
    r.lavaY = Math.min(rand - 40, tief + r.D * 0.55);
  }
  planGeysers();
}

/* ---- Das Finale ---------------------------------------------------------
   Sobald das Gelände die Höhe der Anlaufbahn erreicht, wird von Hand weiter-
   gebaut statt gewürfelt: eben, dann eine gerade Rampe auf 1000 m, dahinter
   fällt der Berg weg. Alles danach überschreibt das Höhenfeld vollständig –
   nur so ist die Bahn wirklich eben und der Gipfel wirklich auf 1000 m.   */
/* ---- Mitflug-Helikopter --------------------------------------------------
   Höchstens einer je Gebiet, im Sternengebiet gar keiner. Er hängt hinter und
   über der stärksten Schanze des Gebiets: erwischt man ihn im Flug, trägt er
   einen HELI_GEWINN Meter höher. Wer die Kante zu langsam oder mit falschem
   Winkel verlässt, fliegt darunter durch – genau das soll er auch.        */
let HELIS = [];
function bauHelis() {
  HELIS = [];
  if (!G_REGEL.heli) return;               // im leichten Grad gibt es keine
  const gebiete = [[0, CFG.SNOWLINE], [CFG.SNOWLINE, CFG.ICELINE],
                   [CFG.ICELINE, CFG.LAVALINE], [CFG.LAVALINE, CFG.SPACELINE]];
  for (const [unten, oben] of gebiete) {
    let best = null;
    for (const j of JUMPS) {
      const kante = j.x0 + j.L, y = terrainY(kante);
      if (y < unten || y >= oben) continue;
      if (FINALE && kante > FINALE.xBahn) continue;      // nicht in die Schlussbahn
      // die Schanze mit dem meisten Auftrieb: hohe Rampe plus tiefer Landeplatz
      const sc = j.H * 2 + (y - terrainY(kante + 700));
      if (!best || sc > best.sc) best = { kante, y, sc };
    }
    if (!best) continue;
    HELIS.push({ x: best.kante + CFG.HELI_DX, y: best.y + CFG.HELI_DY,
                 genutzt: false, ph: hash(best.kante * 0.0071) * 6.28 });
  }
}

let FINALE = null;
function bauFinale() {
  const bahn = CFG.GIPFEL - CFG.FINAL_RISE;
  let i0 = -1;
  for (let i = 0; i < TFIELD.length; i++)
    if (TFIELD[i] >= bahn) { i0 = i; break; }
  if (i0 < 0) { FINALE = null; return; }          // Strecke bleibt darunter

  // Steigung wächst linear von s0 auf s1. Die Fläche unter dieser Geraden ist
  // der Höhengewinn, also ist die Rampe so lang wie Höhe / mittlere Steigung.
  const s0 = CFG.FINAL_SLOPE0, s1 = CFG.FINAL_SLOPE1;
  const xBahn = i0 * TSTEP;
  const xBerg = xBahn + CFG.FINAL_FLAT;
  /* Oben eine flache Schanzenlippe: die letzten FINAL_LIP Pixel steigen nur
     noch sanft an, statt direkt aus der steilsten Stelle abzuheben. So hat man
     kurz vor dem Absprung ein Stück ruhigen Boden, kann das Bike gerade legen
     und geht kontrolliert in die Luft. Der Gipfel liegt weiterhin genau auf
     GIPFEL, nur die Höhe verteilt sich anders. */
  const Lk = CFG.FINAL_LIP, sk = CFG.FINAL_LIP_SLOPE;
  const Rk = Lk * sk;                              // Höhe, die die Lippe bringt
  const Lm = (CFG.FINAL_RISE - Rk) / ((s0 + s1) / 2);   // Rest für die Rampe
  const xLippe = xBerg + Lm;
  const xGipfel = xLippe + Lk;
  const L = Lm + Lk;
  FINALE = { xBahn, xBerg, xLippe, xGipfel, bahn, L, s0, s1 };
  for (let i = i0; i < TFIELD.length; i++) {
    const x = i * TSTEP;
    if (x <= xBerg) { TFIELD[i] = bahn; continue; }
    if (x <= xLippe) {
      const u = (x - xBerg) / Lm;
      TFIELD[i] = bahn + Lm * (s0 * u + (s1 - s0) * u * u / 2);
      continue;
    }
    if (x <= xGipfel) {
      TFIELD[i] = bahn + (CFG.FINAL_RISE - Rk) + (x - xLippe) * sk;
      continue;
    }
    TFIELD[i] = Math.max(bahn, CFG.GIPFEL - (x - xGipfel) * CFG.FINAL_DROP);
  }
  // Sonderstellen, die in den überschriebenen Teil fielen, gibt es nicht mehr
  WALLS = WALLS.filter(w => w.x0 + w.L < xBahn);
  JUMPS = JUMPS.filter(j => j.x0 + j.L + JDROP < xBahn);
  RAVINES = RAVINES.filter(r => r.x2 < xBahn);
}

/* ---- Lavageysire --------------------------------------------------------
   Stehen in der Vulkanzone auf flachem Boden und brechen im festen Takt aus:
   erst Blubbern als Vorwarnung, dann die Säule. Wer beim Ausbruch drin steht,
   ist weg – also durchfahren, solange Ruhe ist.                          */
let GEYSERS = [];
function planGeysers() {
  GEYSERS = [];
  for (let k = 0; ; k++) {
    const mitte = 10000 + k * 3000 + hash(k * 5.3 + SEED + 120) * 1200;
    if (mitte > TEND - 1200) break;
    let best = null;
    for (let x = mitte - 900; x <= mitte + 900; x += 40) {
      const h = terrainY(x);
      if (h < CFG.LAVALINE + CFG.ZONE_FADE || h > CFG.SPACELINE - 200) continue;
      if (RAVINES.some(r => x > r.x1 - 260 && x < r.x2 + 260)) continue;
      if (WALLS.some(w => x > w.x0 - 300 && x < w.x0 + w.L + 300)) continue;
      if (JUMPS.some(j => x > j.x0 - 300 && x < j.x0 + j.L + 400)) continue;
      const steil = Math.abs(slopeAt(x));
      if (!best || steil < best.steil) best = { x, steil };
    }
    // Flacher als vorher: ein Krater am Steilhang sieht aus wie angeklebt
    if (best && best.steil < 0.3)
      GEYSERS.push({ x: best.x, y: terrainY(best.x),
                     H: 210 + hash(best.x * 0.017 + SEED) * 150,
                     periode: CFG.GEY_PERIODE[0]
                            + hash(best.x * 0.031 + SEED) * (CFG.GEY_PERIODE[1] - CFG.GEY_PERIODE[0]),
                     phase: hash(best.x * 0.011 + SEED) * 10 });
  }
}

// Zustand eines Geysirs zum Zeitpunkt t: 0 = Ruhe, sonst Anteil der Säule
function geyserAt(g, t) {
  const p = ((t + g.phase) % g.periode + g.periode) % g.periode;
  const warn = g.periode - CFG.GEY_WARN - CFG.GEY_DAUER;
  if (p < warn) return { warnung: 0, hoehe: 0 };
  if (p < warn + CFG.GEY_WARN) return { warnung: (p - warn) / CFG.GEY_WARN, hoehe: 0 };
  const q = (p - warn - CFG.GEY_WARN) / CFG.GEY_DAUER;      // 0..1 im Ausbruch
  return { warnung: 1, hoehe: Math.sin(Math.PI * Math.min(1, q)) };
}

function terrainY(x) {
  if (x <= 0) return TFIELD[0];
  if (x >= TEND) return TFIELD[TFIELD.length - 1];
  const t = x / TSTEP, i = t | 0;
  return TFIELD[i] + (TFIELD[i + 1] - TFIELD[i]) * (t - i);
}
function slopeAt(x) { return (terrainY(x + 2) - terrainY(x - 2)) / 4; }

function gripAt(x, y) {
  const snow = smooth((y - CFG.SNOWLINE) / CFG.SNOW_FADE);
  const g = 1 - (1 - Math.min(1, CFG.GRIP_SNOW * MOD.snowGrip)) * snow;
  // Regen nässt nur den freien Fels – oben liegt ohnehin Schnee
  return g * (1 - CFG.WEA_RAIN_GRIP * WEA.wet * (1 - snow));
}
