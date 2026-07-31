"use strict";
/* Zeigereingaben, Bedienfelder, Vollbild
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
const IN = { gas: false, brake: false, boost: false };
const padL = el("padL"), padR = el("padR"), boostBox = el("boostBox");

/* Am Handy liegen mehrere Finger gleichzeitig auf dem Glas, und sie wandern.
   Deshalb wird pro Bedienfeld gemerkt, WELCHE Zeiger es gerade halten – ein
   einzelnes Flag wäre falsch, sobald ein zweiter Finger dasselbe Feld antippt
   und wieder loslässt. Ein Feld ist gedrückt, solange sein Set nicht leer ist. */
const STEUER = [[padL, "brake"], [padR, "gas"], [boostBox, "boost"]];
const halter = new Map(STEUER.map(([, key]) => [key, new Set()]));
const zeigerAuf = new Map();   // pointerId -> key

function setzeFeld(key, an) {
  const feld = STEUER.find(s => s[1] === key);
  IN[key] = an;
  feld[0].classList.toggle("on", an);
}

function zeigerZu(key, id) {
  const alt = zeigerAuf.get(id);
  if (alt === key) return;
  if (alt !== undefined) {
    const s = halter.get(alt);
    s.delete(id);
    if (!s.size) setzeFeld(alt, false);
  }
  if (key === undefined) { zeigerAuf.delete(id); return; }
  zeigerAuf.set(id, key);
  halter.get(key).add(id);
  setzeFeld(key, true);
}

// Welches Bedienfeld liegt unter diesem Punkt? Der Knopf selbst ist ein Kind
// des Pads, darum über closest() nach oben suchen.
function feldBei(x, y) {
  const t = document.elementFromPoint(x, y);
  if (!t) return undefined;
  for (const [node, key] of STEUER) if (node.contains(t)) return key;
  return undefined;
}

addEventListener("pointerdown", e => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  const key = feldBei(e.clientX, e.clientY);
  if (key === undefined) return;
  e.preventDefault();
  zeigerZu(key, e.pointerId);
}, { passive: false });

// Zieht der Finger von der Bremse aufs Gas, soll das Gas greifen und die Bremse
// aufgehen – vorher blieb sie hängen, weil nur der Anfangsknopf zählte.
addEventListener("pointermove", e => {
  if (!zeigerAuf.has(e.pointerId)) return;
  e.preventDefault();
  zeigerZu(feldBei(e.clientX, e.clientY), e.pointerId);
}, { passive: false });

const zeigerWeg = e => zeigerZu(undefined, e.pointerId);
addEventListener("pointerup", zeigerWeg);
addEventListener("pointercancel", zeigerWeg);
// Wischt der Finger aus dem Fenster oder schiebt der Browser seine Leisten
// darüber, kommt kein pointerup mehr – sonst klemmte das Gas fest.
addEventListener("lostpointercapture", zeigerWeg);
addEventListener("contextmenu", e => {
  if (feldBei(e.clientX, e.clientY) !== undefined) e.preventDefault();
});

/* Vollbild: am Handy gewinnt man damit die Höhe der Browserleiste zurück, und
   die Leiste kann beim Wischen nicht mehr aufklappen und den Finger schlucken.
   Wenn dabei die Lage festgestellt werden darf, gleich auf quer stellen. */
const vollbildBtn = el("vollbild");
function vollbildAn() {
  const ziel = document.documentElement;
  const geht = ziel.requestFullscreen || ziel.webkitRequestFullscreen;
  if (!geht) return Promise.reject();
  return Promise.resolve(geht.call(ziel, { navigationUI: "hide" }));
}
vollbildBtn.addEventListener("click", () => {
  const drin = document.fullscreenElement || document.webkitFullscreenElement;
  if (drin) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    return;
  }
  vollbildAn().then(() => {
    // nur ein Angebot – Desktop und iOS kennen die Sperre nicht, das ist kein Fehler
    if (screen.orientation && screen.orientation.lock)
      screen.orientation.lock("landscape").catch(() => {});
  }).catch(() => {});
});
function vollbildSymbol() {
  const drin = document.fullscreenElement || document.webkitFullscreenElement;
  vollbildBtn.textContent = drin ? "⤡" : "⛶";
}
addEventListener("fullscreenchange", vollbildSymbol);
addEventListener("webkitfullscreenchange", vollbildSymbol);

el("querBtn").addEventListener("click", () => document.body.classList.add("querOk"));

// Ohne Tastatur ergibt "Leertaste" keinen Sinn – am Handy die Finger erklären.
if (matchMedia("(pointer:coarse)").matches) {
  el("boostKey").textContent = "antippen";
  document.querySelector(".tips").innerHTML =
    '<b>Rechte Hälfte</b> Gas · <b>linke Hälfte</b> Bremse · <b>Boost-Leiste</b> unten ' +
    'halten (doppelter Verbrauch)<br>' +
    'Beide Daumen gleichzeitig geht – in der Luft hebt Gas die Nase, Bremse drückt sie runter.<br>' +
    'Steile Hänge brauchen <b>Anlauf</b> · je 100 Punkte gibt es einen 🪙<br>' +
    'Mit <b>⛶</b> oben ins Vollbild, dann stört die Browserleiste nicht mehr.';
}

// Beim Verlassen des Tabs alles lösen, sonst fährt das Bike bei der Rückkehr weiter.
function alleZeigerLoesen() {
  for (const id of [...zeigerAuf.keys()]) zeigerZu(undefined, id);
}
addEventListener("blur", alleZeigerLoesen);
document.addEventListener("visibilitychange", () => { if (document.hidden) alleZeigerLoesen(); });
