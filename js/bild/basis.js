"use strict";
/* Zeichen-Grundlagen: Farbmischung, Höhenverläufe, Zonenanteile, Rampenformen
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
const STARS = Array.from({ length: 160 }, (_, i) => ({
  x: hash(i * 1.7) * 2600, y: hash(i * 5.3 + 9) * 1400, s: 0.6 + hash(i * 2.9) * 1.4,
}));

function mix(a, b, t) {
  return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * t) + "," +
                  Math.round(a[1] + (b[1] - a[1]) * t) + "," +
                  Math.round(a[2] + (b[2] - a[2]) * t) + ")";
}
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t,
                            a[1] + (b[1] - a[1]) * t,
                            a[2] + (b[2] - a[2]) * t];
const rgba = (c, a) => "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a + ")";

/* ---- Höhenzonen ---------------------------------------------------------
   Der Boden bekommt seine Farbe aus der Welthöhe, nicht aus der Entfernung:
   Fels -> Schnee -> Gletschereis. heightGrad() rechnet eine Liste von
   [Welthöhe, Farbe] in einen Bildschirm-Verlauf um, damit die Grenzen beim
   Scrollen an derselben Höhe bleiben.                                     */
function heightGrad(stops) {
  const yTop = stops[stops.length - 1][0], yBot = stops[0][0];
  const g = ctx.createLinearGradient(0, sy(yTop), 0, sy(yBot));
  for (const [y, c] of stops) g.addColorStop((yTop - y) / (yTop - yBot), c);
  return g;
}
/* Die Farbstufen des Bodens hängen an den Gebietshöhen – und die hängen am
   Schwierigkeitsgrad. Sie werden deshalb bei jedem Gradwechsel neu gebaut;
   vorher standen sie fest auf den Werten von "Normal", und im leichten Grad
   blieb der Boden bis weit über die Schneegrenze hinaus Fels. Auch die
   Abstände zu den Grenzen skalieren mit, sonst wären die Übergänge auf der
   halben Strecke doppelt so breit. */
let RAMP_BODY = [], RAMP_EDGE = [], RAMP_DECK = [];

function bauRampen() {
  const s = v => v * gradSkala();
  if (G_REGEL.meer) {
    /* Der Meeresgrund läuft nach unten, die Stufen also von 0 nach -GIPFEL.
       heightGrad braucht sie aufsteigend, darum die tiefste zuerst. */
    const T = d => -CFG.GIPFEL * d;
    RAMP_BODY = [
      [T(1.02), "#0d1526"],      // Grabensohle
      [T(0.75), "#17233a"],      // Tiefsee
      [T(0.45), "#2c3f52"],      // Dämmerzone
      [T(0.22), "#4a6b6b"],      // Riffgestein
      [T(0.06), "#8f9a6e"],      // bewachsener Sand
      [T(-0.02), "#d8cf9a"],     // heller Ufersand
    ];
    RAMP_EDGE = [
      [T(1.02), "#22304a"],
      [T(0.75), "#2e4668"],
      [T(0.45), "#4c7f86"],
      [T(0.22), "#63b39a"],      // Korallensaum
      [T(0.06), "#c3d089"],      // Seegras
      [T(-0.02), "#f2ecc0"],
    ];
    RAMP_DECK = [
      [T(1.02), "rgba(10,16,30,.5)"],
      [T(0.45), "rgba(30,52,74,.35)"],
      [T(0.06), "rgba(120,140,110,.3)"],
      [T(-0.02), "rgba(200,190,140,.45)"],
    ];
    return;
  }
  const SL = CFG.SNOWLINE, IL = CFG.ICELINE, VL = CFG.LAVALINE, WL = CFG.SPACELINE;
  RAMP_BODY = [
    [SL - CFG.SNOW_FADE, "#5d4a3a"],       // Fels
    [SL - s(120),        "#a9b3c2"],       // Übergang
    [SL + s(600),        "#f2f6fb"],       // Schnee
    [IL - s(700),        "#eaf5fc"],       // Firn
    [IL + s(2200),       "#8ecbe6"],       // Gletschereis
    [VL - s(400),        "#6f93a8"],       // Eis wird schmutzig
    [VL + s(2200),       "#3b2f33"],       // Vulkangestein
    [WL - s(400),        "#312a33"],
    [WL + s(2400),       "#2a2f45"],       // kalter Sternenfels
  ];
  RAMP_EDGE = [
    [SL - CFG.SNOW_FADE, "#5aa84f"],       // Gras
    [SL - s(120),        "#dfe7ee"],
    [SL + s(600),        "#ffffff"],
    [IL - s(700),        "#ffffff"],
    [IL + s(2200),       "#c6f1ff"],       // Eiskante
    [VL - s(400),        "#9fb6bd"],
    [VL + s(2200),       "#e0642a"],       // glühende Bruchkante
    [WL - s(400),        "#8a6a70"],
    [WL + s(2400),       "#cdd8ee"],       // Frostrand im Sternenlicht
  ];
  // Auflage unter der Kante: lässt Schnee und Eis dick aussehen, auf Fels nichts
  RAMP_DECK = [
    [SL - CFG.SNOW_FADE, "rgba(48,36,26,.5)"],    // Erdschicht unter dem Gras
    [SL - s(200),        "rgba(120,124,134,.2)"],
    [SL + s(900),        "rgba(255,255,255,.4)"], // Schneedecke
    [IL + s(2200),       "rgba(206,244,255,.5)"], // Eisdecke
    [VL - s(400),        "rgba(150,170,180,.3)"],
    [VL + s(2200),       "rgba(120,52,30,.45)"],  // verbackene Kruste
    [WL + s(2400),       "rgba(180,196,224,.3)"], // Staubschicht
  ];
}

/* Anteil eines Gebiets an dieser Welthöhe (0 = noch nicht, 1 = voll da). Die
   Gebiete überlagern sich nicht: jedes blendet aus, sobald das nächste kommt,
   sonst läge z. B. das Polarlicht noch über dem Vulkan. */
const bandAt = (y, von) => smooth((y - von) / CFG.ZONE_FADE);
const iceAt   = y => bandAt(y, CFG.ICELINE)  * (1 - bandAt(y, CFG.LAVALINE));
const lavaAt  = y => bandAt(y, CFG.LAVALINE) * (1 - bandAt(y, CFG.SPACELINE));
const spaceAt = y => bandAt(y, CFG.SPACELINE);
