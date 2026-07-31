"use strict";
/* Testfeld auf Taste +: Wetter setzen, Gefahren rufen, teleportieren
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* =========================================================================
   TESTMODUS – Taste +. Setzt jede Wetterlage direkt, löst Blitze aus und
   springt an die Stellen, die man sonst erst erfahren muss. Die Tasten wirken
   nur, solange das Feld offen ist.
   ========================================================================= */
const DBG = { on: false, god: false, hold: false, forced: "", tank: false, boost: false };

function setWea(k) {
  DBG.hold = true; DBG.forced = k;
  if (k === "klar") {
    WEA.kind = "klar"; WEA.left = 0; WEA.p = 0; WEA.bolt = null; WEA.warnLeft = 0;
    WEA.next = 1e9;
  } else startWeather(k, 600);       // hält an, bis etwas anderes gewählt wird
  syncDbg();
}

// Aktionen, die eine laufende Runde brauchen
function needPlay() {
  if (G.state === "play") return true;
  toast("Erst losfahren");
  return false;
}

// Blitz mit Vorwarnung auf eine Stelle relativ zum Fahrer
function zapAt(off) {
  if (!needPlay()) return;
  if (WEA.kind !== "gewitter") setWea("gewitter");
  WEA.p = Math.max(WEA.p, 0.45);
  WEA.warnX = bikeX() + off;
  WEA.warnLeft = CFG.WEA_BOLT_WARN;
}

function tpTo(x) {
  if (!needPlay()) return;
  x = Math.max(120, Math.min(TEND - 400, x));
  const y = groundUnder(x, 1e9) + CFG.WHEEL_R + 4;
  rear.x = x; rear.y = y; rear.px = x; rear.py = y;
  front.x = x + CFG.WHEELBASE; front.y = groundUnder(front.x, 1e9) + CFG.WHEEL_R + 4;
  front.px = front.x; front.py = front.y;
  body.px = body.x = 0; body.py = body.y = 0; seatBody();
  rear.grounded = front.grounded = false;
  G.airTime = 0; G.spinAcc = 0; G.touch = 0; trickAus();
  G.lastAng = Math.atan2(front.y - rear.y, front.x - rear.x);
  // kein geschenkter Punkteschub durch den Sprung
  if (fortschritt(y) > fortschritt(G.maxY)) G.maxY = y;
  federReset();
  cam.x = x; cam.y = y;
}

// Direkt in den schwerelosen Teil: knapp über den Gipfel und mit Schwung die
// Rampe entlang. Über tpAbove() ginge das nicht – oberhalb der Gipfelhöhe gibt
// es kein Gelände mehr, an das man sich setzen könnte.
function tpWeltall() {
  if (!needPlay()) return;
  if (!FINALE) { toast("kein Gipfel auf dieser Strecke"); return; }
  // Im Meer gibt es keinen Absprung: dort wird einfach auf der Grabensohle
  // abgesetzt, das Finale löst beim Aufsetzen von selbst aus.
  if (istMeer()) {
    // genau auf den tiefsten Punkt: schon 40 px dahinter steigt der Grund
    // wieder an und die Zielmarke wird nicht mehr erreicht
    tpTo(FINALE.xGipfel);
    toast("🕳 Grabensohle · " + Math.round(CFG.GIPFEL / CFG.PPM) + " m");
    return;
  }
  tpTo(FINALE.xGipfel - 30);
  const w = Math.atan(CFG.FINAL_SLOPE1), v = 13;  // Kante, px pro Substep
  const vx = Math.cos(w) * v, vy = Math.sin(w) * v;
  for (const p of PARTS) {
    p.y += 70;
    p.px = p.x - vx; p.py = p.y - vy;
  }
  rear.grounded = front.grounded = false;
  G.maxY = Math.max(G.maxY, (rear.y + front.y) / 2);
  G.zone = ZONES.length;
  cam.x = bikeX(); cam.y = (rear.y + front.y) / 2;
  toast("🚀 Absprung · " + Math.round(CFG.GIPFEL / CFG.PPM) + " m");
}

// nächste Stelle aus der Liste, sonst die erste
function tpNext(list) {
  if (!list.length) { toast("nichts gefunden"); return; }
  const x = bikeX();
  tpTo(list.find(v => v > x + 200) ?? list[0]);
}

// Erste Stelle der ganzen Strecke, die über dieser Welthöhe liegt – bewusst
// vom Anfang aus gesucht und nicht ab dem Bike. Sonst käme man aus einem
// höheren Gebiet nie wieder in ein tieferes zurück, weil dort alles vor einem
// schon über der gesuchten Höhe liegt.
/* Erste Stelle, die im Fortschrittsmaß weiter liegt als angegeben. Im Meer
   heißt "weiter" tiefer, darum läuft der Vergleich über fortschritt(). */
function tpAbove(fortHoehe, fehler) {
  if (!needPlay()) return null;
  for (let x = 400; x < TEND - 400; x += 40)
    if (fortschritt(terrainY(x)) > fortHoehe) { tpTo(x); return x; }
  toast(fehler);
  return null;
}

const DBG_WEA = [["Klar", "1", "klar"], ["Regen", "2", "regen"], ["Gewitter", "3", "gewitter"],
                 ["Sturm", "4", "sturm"], ["Tornado", "5", "tornado"]];
const DBG_ACT = [
  ["Blitz auf mich", "6", () => zapAt(0)],
  ["Blitz daneben", "7", () => zapAt(300)],
  ["Adler jetzt", "a", () => { if (needPlay()) starteAdler(); }],
  ["Entführer jetzt", "f", () => { if (needPlay()) { starteUfo(); GEF.ufo.x = bikeX(); } }],
  ["Komet jetzt", "m", () => { if (needPlay()) { starteKomet();
      GEF.komet.x = bikeX(); GEF.komet.y = groundUnder(bikeX(), 1e9); } }],
  ["Sprit voll", "8", () => { G.fuel = 100; }],
  ["Boost voll", "9", () => { G.boost = 100; }],
  ["Leben +1", "0", () => { G.lives++; }],
  ["Unsterblich", "u", () => { DBG.god = !DBG.god; syncDbg(); }],
  ["Sprit unendlich", "t", () => { DBG.tank = !DBG.tank; if (DBG.tank) G.fuel = 100; syncDbg(); }],
  ["Boost unendlich", "i", () => { DBG.boost = !DBG.boost; if (DBG.boost) G.boost = 100; syncDbg(); }],
  // "s" liegt schon auf "Rauf in den Schnee", darum "o" wie Over
  ["Sterben", "o", () => { if (needPlay()) gameOver("💀 Testmodus"); }],
  ["Wetter zufällig", "z", () => { DBG.hold = false; WEA.left = Math.min(WEA.left, 1); WEA.next = 2; syncDbg(); }],
  ["Nächste Brücke", "b", () => tpNext(RAVINES.filter(r => r.bruecke && !r.lava)
                                              .map(r => r.bx1 - 300))],
  ["Nächstes Lavabecken", "l", () => tpNext(RAVINES.filter(r => r.lava)
                                                   .map(r => r.x1 - 1000))],
  ["Nächster Geysir", "g", () => tpNext(GEYSERS.map(g => g.x - 700))],
  ["Nächste Steilwand", "n", () => tpNext(WALLS.map(w => w.x0 - 320))],
  // mit Anlauf absetzen, sonst kommt man ohne Tempo an der Kante an
  ["Nächste Rampe", "j", () => tpNext(JUMPS.map(j => j.x0 - 1400))],
  ["Nächster Heli", "h", () => tpNext(HELIS.map(h => h.x - CFG.HELI_DX - 1800))],
  ["99 Coins", "c", () => { coins = 99; saveProgress(); renderCard(); toast("🪙 99 Coins"); }],
  ["Spielstand löschen", "x", () => {
    coins = 0;
    levels = CHARS.map(() => 1);
    unlocked = CHARS.map((c, i) => i === 0);
    charIdx = viewIdx = 0;
    G.best = 0;
    try { for (const k of ["best", "best.einfach", "coins", "levels", "unlocked", "char"])
            localStorage.removeItem("hcb." + k); } catch (e) {}
    applyBuffs(); renderCard(); updateHUD();
    toast("Spielstand gelöscht");
  }],
  ["Rauf in den Schnee", "s",
   () => tpAbove(CFG.SNOWLINE + 600 * gradSkala(),
                 istMeer() ? "keine Sandbank in Reichweite" : "kein Schnee in Reichweite")],
  /* Nicht direkt auf die Grenze, sondern ein Stück darüber: dort ist das Gebiet
     zu zwei Dritteln eingeblendet. Genau auf der Grenze sähe es noch aus wie
     das Gebiet darunter, und man denkt, der Knopf tut nichts.
     Nur die drei Gebiete, die auf dem Berg liegen. Der schwerelose Teil hat
     kein Gelände über sich und bekommt darum seinen eigenen Knopf.

     ZONES[i] wird erst beim Klick gelesen, nicht beim Bauen der Liste: der
     Gradwechsel legt ein neues ZONES-Array an, und die Knöpfe zielten sonst
     weiter auf die Höhen von "Normal" – im leichten Grad landete man damit im
     falschen Gebiet oder gar nicht. */
  ...[0, 1, 2].map(i => [
    // Platzhalter: die richtige Beschriftung setzt syncDbgNamen, sobald der
    // Modus feststeht. Leer ginge nicht – dann entsteht gar kein Textknoten.
    "Gebiet " + (i + 1), ["e", "v", "w"][i],
    () => {
      const z = ZONES[i];
      if (tpAbove(fortschritt(z.y) + 1200 * gradSkala(),
                  "keine " + z.name + " in Reichweite") === null) return;
      G.zone = Math.max(G.zone, i + 1);       // Meldung nicht doppelt bringen
      toast(z.icon + " " + z.name + " · " +
            Math.round(fortschritt((rear.y + front.y) / 2) / CFG.PPM) + " m");
    },
  ]),
  ["Zum Gipfel-Anlauf", "k", () => {
    if (!needPlay()) return;
    if (!FINALE) { toast("kein Gipfel auf dieser Strecke"); return; }
    tpTo(FINALE.xBahn + 60);
    G.zone = Math.max(G.zone, 3);
    toast((istMeer() ? "🕳 Grabenkante · " : "🏔 Anlaufbahn · ")
          + Math.round(fortschritt(FINALE.bahn) / CFG.PPM) + " m");
  }],
  ["Absprung ins All", "p", tpWeltall],
];

const dbgEl = el("dbg");
const dbgBtns = {};

function buildDbg() {
  const add = (tag, cls, txt, parent) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt) e.textContent = txt;
    parent.appendChild(e);
    return e;
  };
  const sect = (titel, liste) => {
    add("h3", "", titel, dbgEl);
    const g = add("div", "dGrid", "", dbgEl);
    for (const [txt, key, arg] of liste) {
      const b = add("button", "dBtn", txt, g);
      add("kbd", "", key, b);
      b.onmousedown = e => e.preventDefault();      // Fokus bleibt beim Spiel
      b.onclick = () => (typeof arg === "function" ? arg() : setWea(arg));
      dbgBtns[key] = b;
    }
  };
  /* Kopfzeile mit Schließkreuz: das offene Feld deckt den Werkzeug-Knopf oben
     zu, und "+ schließt" hilft ohne Tastatur nicht weiter. */
  const kopf = add("div", "dKopf", "", dbgEl);
  add("h3", "", "Testmodus", kopf);
  const zu = add("button", "dZu", "✕", kopf);
  zu.onmousedown = e => e.preventDefault();
  zu.onclick = toggleDbg;
  sect("Wetter", DBG_WEA);
  sect("Aktionen", DBG_ACT);
  const s = add("div", "", "", dbgEl);
  s.id = "dState";
}
buildDbg();
syncDbgNamen();      // Gebietsnamen des aktuellen Modus eintragen

/* Die Knopfbeschriftungen entstehen beim Bauen der Liste, die Gebietsnamen
   hängen aber am Modus. Nach einem Wechsel müssen sie nachgezogen werden,
   sonst steht im Meer weiter "Rauf in die Eiszone". */
function syncDbgNamen() {
  if (!dbgBtns.e) return;
  const setz = (key, txt) => {
    const b = dbgBtns[key];
    if (b && b.firstChild) b.firstChild.nodeValue = txt;
  };
  const meer = istMeer();
  ["e", "v", "w"].forEach((k, i) => { if (ZONES[i]) setz(k, ZONES[i].tp); });
  setz("s", meer ? "Runter zur Sandbank" : "Rauf in den Schnee");
  setz("k", meer ? "Zur Grabenkante" : "Zum Gipfel-Anlauf");
  setz("p", meer ? "Auf den Grund" : "Absprung ins All");
}

function syncDbg() {
  syncDbgNamen();
  for (const [, key, arg] of DBG_WEA) dbgBtns[key].classList.toggle("on", arg === WEA.kind);
  dbgBtns.u.classList.toggle("on", DBG.god);
  dbgBtns.t.classList.toggle("on", DBG.tank);
  dbgBtns.i.classList.toggle("on", DBG.boost);
  dbgBtns.z.classList.toggle("on", !DBG.hold);
}

function dbgStatus() {
  const air = !rear.grounded && !front.grounded;
  const bx = bikeX(), by = (rear.y + front.y) / 2;
  return [
    "Wetter " + WEA.kind + "  p=" + WEA.p.toFixed(2) +
      (WEA.left > 0 && WEA.left < 500 ? "  noch " + Math.ceil(WEA.left) + " s" : ""),
    "Nässe  " + WEA.wet.toFixed(2) + "   Grip " + gripAt(bx, by).toFixed(3),
    "Wind   " + Math.round(windAcc(air)) + " px/s²   Böe " + WEA.gust.toFixed(2),
    "Grav   ×" + gravFactor().toFixed(2) + (WEA.kind === "tornado"
      ? "   Trichter " + Math.round(WEA.tx - bx) + " px" : ""),
    "x " + Math.round(bx) + "   Höhe " + Math.round(by / CFG.PPM) + " m" +
      (DBG.god ? "   UNSTERBLICH" : "") + (DBG.tank ? "   TANK VOLL" : ""),
  ].join("\n");
}

function toggleDbg() {
  DBG.on = !DBG.on;
  dbgEl.classList.toggle("hidden", !DBG.on);
  el("testKnopf").classList.toggle("on", DBG.on);
  if (DBG.on) { syncDbg(); el("dState").textContent = dbgStatus(); }
}
el("testKnopf").addEventListener("click", toggleDbg);

function dbgKey(k) {
  const b = dbgBtns[k.toLowerCase()];
  if (!b) return false;
  b.click();
  return true;
}
