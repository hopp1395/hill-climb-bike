"use strict";
/* Leinwand, Auflösung und Kamera – Welt- zu Bildschirmkoordinaten
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
const cvs = document.getElementById("c");
const ctx = cvs.getContext("2d");
let W = 0, H = 0, DPR = 1, SCALE = 1;
// Bildschirmposition des Bikes. CAMY tiefer angesetzt hieße mehr Himmel; mit
// 0.55 sitzt das Bike knapp über der Mitte und man sieht mehr vom Gelände,
// auf das man zufährt – und es liegt nicht mehr hinter der Boost-Leiste.
const CAMX = 0.36, CAMY = 0.55;
const cam = { x: 0, y: 0 };

/* Am Handy ist window.innerHeight die LAYOUT-Höhe: sie schließt den Streifen
   ein, den die Browserleiste verdeckt, und ändert sich beim Ein- und Ausfahren
   der Leiste nicht. visualViewport meldet dagegen, was gerade wirklich zu sehen
   ist – danach richten sich Canvas und die unteren Knöpfe. */
function resize() {
  const vv = window.visualViewport;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = Math.round(vv ? vv.width : window.innerWidth);
  H = Math.round(vv ? vv.height : window.innerHeight);
  const versteckt = Math.max(0, window.innerHeight - H);
  const st = document.documentElement.style;
  st.setProperty("--vh", H + "px");
  st.setProperty("--versteckt", versteckt + "px");
  cvs.width = Math.round(W * DPR); cvs.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // Nenner größer = kleinerer Maßstab = mehr Welt im Bild. 900 statt 780 zeigt
  // rund 15 % mehr Strecke und Höhe, ohne dass das Bike zu klein wird.
  SCALE = Math.max(0.44, Math.min(1.0, H / 900));
}
addEventListener("resize", resize);
addEventListener("orientationchange", resize);
if (window.visualViewport) {
  // Leiste fährt ein/aus, Tastatur klappt auf, Nutzer zoomt: alles landet hier
  visualViewport.addEventListener("resize", resize);
  visualViewport.addEventListener("scroll", resize);
}
resize();

const sx = wx => W * CAMX + (wx - cam.x) * SCALE;
const sy = wy => H * CAMY - (wy - cam.y) * SCALE;   // Welt-Y zeigt nach oben
const wxAt = px => cam.x + (px - W * CAMX) / SCALE;
