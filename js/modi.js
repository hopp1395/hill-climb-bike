"use strict";
/* Schwierigkeitsgrade, Sondermodi und die Kategorien der Startauswahl
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* =========================================================================
   SCHWIERIGKEITSGRADE

   Ein Grad ist ein Satz Überschreibungen auf CFG plus ein paar Schalter. Weil
   CFG an hunderten Stellen gelesen wird, wird nicht überall abgefragt, sondern
   einmal beim Umschalten der ganze Satz gesetzt – und vorher aus CFG_BASIS
   zurückgestellt, damit sich die Grade nicht gegenseitig aufaddieren.
   ========================================================================= */
const CFG_BASIS = { ...CFG };

const GRADE = {
  einfach: {
    name: "Einfach", icon: "🌿",
    text: "500 m bis zum Gipfel · keine Adler, keine Entführer, kein Heli · nur Regen und Sturm",
    cfg: {
      // Alle Abschnitte auf die halbe Höhe: Schnee 50, Eis 125, Vulkan 250,
      // Sterne 375, Gipfel 500 m.
      SNOWLINE: 1300, ICELINE: 3250, LAVALINE: 6500, SPACELINE: 9750,
      GIPFEL: 13000, FINAL_RISE: 650, FINAL_FLAT: 260, FINAL_LIP: 150,
      SLOPE_CAP: 0.78,        // flacher: 38° statt 44° als Deckel
      CAN_SPACING: 2100,      // Kanister deutlich öfter
    },
    diff: 0.55,               // der Schwierigkeitsverlauf steigt langsamer
    wetter: ["regen", "sturm"],
    adler: false, ufo: false, komet: true, heli: false,
    // Ein Extraleben. Phuc-Le kommt auf zwei, weil ihr Schutzengel oben
    // draufkommt – genau dafür ist die Fähigkeit ja da.
    leben: 1,
  },
  normal: {
    name: "Normal", icon: "🔥",
    text: "1000 m bis zum Gipfel · alle Gefahren, alles Wetter",
    cfg: {}, diff: 1, wetter: null,
    adler: true, ufo: true, komet: true, heli: true,
    leben: 0,
  },
  /* Rennen: dieselbe Strecke wie Normal, aber der beste Lauf fährt als Geist
     mit. Nur hier wird aufgezeichnet und wiedergegeben. */
  geist: {
    name: "Geisterrennen", icon: "👻", geist: true,
    text: "1000 m gegen den eigenen Bestlauf · alle Gefahren, alles Wetter",
    cfg: {}, diff: 1, wetter: null,
    adler: true, ufo: true, komet: true, heli: true,
    leben: 0,
  },
  /* Sondermodus: dieselbe Strecke, nur andersherum. Statt zum höchsten Punkt
     geht es zum tiefsten – 1000 m hinunter auf den Grund. Das Höhenfeld wird
     dafür nach dem Bauen gespiegelt; Steilwände, Schluchten, Brücken und
     Schanzen bleiben weg, weil sie gespiegelt keinen Sinn ergeben (eine
     Schlucht würde zum Hügel und die Brücke spannte über nichts). */
  meer: {
    name: "Meer", icon: "🌊", meer: true,
    text: "1000 m hinunter auf den Grund · Wasser statt Luft, kein Wetter",
    /* Verlauf und Steigungsdeckel bleiben wie bei Normal: gedämpft erreichte
       die Strecke die Zielhöhe gar nicht mehr, und ohne sie findet bauFinale
       keinen Ansatz – der Graben fehlte dann komplett. */
    cfg: { CAN_SPACING: 2600 },
    diff: 1, wetter: [],
    adler: false, ufo: false, komet: false, heli: false,
    leben: 1,
  },
};

// +1 = höher ist weiter, -1 = tiefer ist weiter. Alles, was Fortschritt misst,
// läuft darüber, damit es nur eine Stelle mit der Richtung gibt.
function fortschritt(y) { return G_REGEL.meer ? -y : y; }
function istMeer() { return !!G_REGEL.meer; }
function istGeistrennen() { return !!G_REGEL.geist; }

/* Die Auswahl im Startmenü ist zweistufig: erst die Kategorie, dann der Modus
   darin. So bleibt die Liste kurz, auch wenn später mehr Rennen oder mehr
   Sondermodi dazukommen. */
const KATEGORIEN = [
  { key: "normal",  name: "Normal",  icon: "🏔", grade: ["einfach", "normal"] },
  { key: "rennen",  name: "Rennen",  icon: "🏁", grade: ["geist"] },
  { key: "special", name: "Special", icon: "🌊", grade: ["meer"] },
];
let KAT = "normal";
function katVon(grad) {
  const k = KATEGORIEN.find(k => k.grade.includes(grad));
  return k ? k.key : "normal";
}

let GRAD = "normal";
let G_REGEL = GRADE.normal;

function setzeGrad(name) {
  if (!GRADE[name]) name = "normal";
  GRAD = name;
  G_REGEL = GRADE[name];
  Object.assign(CFG, CFG_BASIS, G_REGEL.cfg);
  // tp = fertige Knopfbeschriftung im Testmodus, damit die Artikel stimmen
  ZONES = G_REGEL.meer ? [
    { y: -CFG.ICELINE,   icon: "🪸", name: "Riff",       tp: "Runter zum Riff" },
    { y: -CFG.LAVALINE,  icon: "🌑", name: "Dämmerzone", tp: "Runter zur Dämmerzone" },
    { y: -CFG.SPACELINE, icon: "🦑", name: "Tiefsee",    tp: "Runter in die Tiefsee" },
    { y: -CFG.GIPFEL,    icon: "🕳", name: "Graben",     tp: "Runter in den Graben" },
  ] : [
    { y: CFG.ICELINE,   icon: "❄️", name: "Eiszone",    tp: "Rauf in die Eiszone" },
    { y: CFG.LAVALINE,  icon: "🌋", name: "Vulkanzone", tp: "Rauf in die Vulkanzone" },
    { y: CFG.SPACELINE, icon: "✨", name: "Sternenzone", tp: "Rauf in die Sternenzone" },
    { y: CFG.GIPFEL,    icon: "🚀", name: "Schwerelos",  tp: "Rauf ins Schwerelose" },
  ];
  bauRampen();          // Bodenfarben hängen an den Gebietshöhen
  bauAbZonen();         // ebenso die Beschriftung der Schlussgrafik
  if (typeof syncDbgNamen === "function") syncDbgNamen();   // Testmodus-Knöpfe
  ladeGeist();          // jeder Modus hat seinen eigenen Geist
  PROFIL = null; ABKARTE = null;     // Schlussgrafik gehört zur alten Welt
  try { localStorage.setItem("hcb.grad", name); } catch (e) {}
  ladeBest();
}

// Getrennte Rekorde: ein 500-m-Lauf soll den 1000-m-Rekord nicht überschreiben
function bestKey() { return GRAD === "normal" ? "hcb.best" : "hcb.best." + GRAD; }
// 1 bei Normal, 0,5 bei Einfach – überall dort, wo Abstände in Welthöhe zur
// Streckenlänge passen müssen (Farbstufen, Teleport-Abstände).
function gradSkala() { return CFG.GIPFEL / CFG_BASIS.GIPFEL; }
function ladeBest() {
  try { G.best = Math.max(0, parseInt(localStorage.getItem(bestKey()) || "0", 10) || 0); }
  catch (e) { G.best = 0; }
}
