"use strict";
/* Zustand einer Runde, Gebietsgrenzen, Kanister und die Geisteraufnahme
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
const G = {
  state: "menu",           // menu | play | over
  score: 0, maxY: 0, fuel: 100, lives: 0,
  boost: 100, boosting: false, boostIdle: 0,
  reason: "", best: 0,
  airTime: 0, spinAcc: 0, touch: 0, lastAng: 0,
  // laufende Nummer: art = null | "wheelie" | "stoppie", t = Dauer,
  // punkte = bisher angesammelt, aus = wie lange die Haltung gerade weg ist.
  // halt/wert/hArt halten die fertige Zahl noch kurz im Bild – eine Nummer
  // dauert oft nur zwei Zehntel, sonst wäre sie nicht zu lesen.
  trick: { art: null, t: 0, punkte: 0, aus: 0, halt: 0, wert: 0, hArt: null },
  time: 0, zone: 0,           // wie viele Gebietsgrenzen in diesem Lauf schon überfahren
  weltall: null,              // s seit dem Absprung ins All (null = noch am Berg)
  abspann: null,              // s seit dem Beginn des Rückblicks (null = läuft nicht)
  heli: null,                 // läuft gerade ein Mitflug? {t, x0, y0, zx, zy}
  geschafft: false,           // Lauf mit dem Absprung beendet, nicht mit einem Crash
};

// Die Gebiete oberhalb des Schnees, in der Reihenfolge, in der man sie erreicht
// wird von setzeGrad neu gesetzt, weil die Höhen vom Schwierigkeitsgrad abhängen
let ZONES = [
  { y: CFG.ICELINE,   icon: "❄️", name: "Eiszone" },
  { y: CFG.LAVALINE,  icon: "🌋", name: "Vulkanzone" },
  { y: CFG.SPACELINE, icon: "✨", name: "Sternenzone" },
  { y: CFG.GIPFEL,    icon: "🚀", name: "Schwerelos" },
];
const cans = new Map();    // index -> eingesammelt?

/* ---- Geisterrennen -------------------------------------------------------
   Vom besten Lauf wird alle GEIST_DT Sekunden die x-Position mitgeschrieben;
   der Index im Feld ist damit die Zeit. Beim nächsten Lauf fährt dieser Geist
   noch einmal mit.

   Die Welt wird pro Runde neu gewürfelt, die alte Strecke gibt es also nicht
   mehr. Der Geist wird deshalb auf das AKTUELLE Gelände gesetzt: er behält
   sein Tempo, fährt aber den Boden, der jetzt da ist. Damit ist es ein Rennen
   gegen die eigene Bestzeit und keine Wiederholung einer Aufnahme. */
const GEIST_DT = 0.1;
const GEIST = { spur: null, t: 0, auf: [], next: 0 };

function geistKey() { return "hcb.geist" + (GRAD === "normal" ? "" : "." + GRAD); }
function ladeGeist() {
  try {
    const r = JSON.parse(localStorage.getItem(geistKey()) || "null");
    GEIST.spur = Array.isArray(r) && r.length > 4 ? r : null;
  } catch (e) { GEIST.spur = null; }
}
function speichereGeist() {
  if (GEIST.auf.length < 5) return;
  try { localStorage.setItem(geistKey(), JSON.stringify(GEIST.auf)); } catch (e) {}
}
// Position des Geistes zur aktuellen Laufzeit, oder null wenn er durch ist
function geistX() {
  const sp = GEIST.spur;
  if (!sp || !istGeistrennen()) return null;   // nur im Rennmodus
  const i = GEIST.t / GEIST_DT;
  if (i >= sp.length - 1) return null;
  const i0 = Math.floor(i), f = i - i0;
  return sp[i0] + (sp[i0 + 1] - sp[i0]) * f;
}

function canPos(k) {
  const x = k * CFG.CAN_SPACING + 500 + hash(k * 3.7) * 400;
  return { x, y: terrainY(x) + 20 };
}
