"use strict";
/* Wheelie und Stoppie: Erkennung, Punkte, Anzeigezustand
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* =========================================================================
   WHEELIE UND STOPPIE
   Zwei kurze Nummern: auf dem Hinterrad fahren (Nase hoch) oder auf dem
   Vorderrad (Nase runter). Anreißen lassen sie sich nur nach einem Sprung,
   und gehalten werden sie meist nur ein paar Zehntel – deshalb steigt der
   Punktesatz mit der Dauer an, statt konstant zu laufen: jedes weitere Zehntel
   ist mehr wert als das davor. Die Anzeige läuft dabei sichtbar mit;
   gutgeschrieben wird, wenn die Nummer vorbei ist.
   ========================================================================= */
function trickArt() {
  if (G.weltall !== null || G.heli) return null;
  // Genau ein Rad am Boden – in der Luft ist es ein Flip, mit beiden Rädern
  // unten fährt man einfach.
  if (rear.grounded === front.grounded) return null;
  if (Math.abs((rear.x - rear.px) * 120) < CFG.TRICK_TEMPO) return null;
  const rad = rear.grounded ? rear : front;
  let rel = Math.atan2(front.y - rear.y, front.x - rear.x) - Math.atan(slopeAt(rad.x));
  while (rel > Math.PI) rel -= Math.PI * 2;
  while (rel < -Math.PI) rel += Math.PI * 2;
  const w = Math.abs(rel);
  if (w < CFG.TRICK_WINKEL || w > CFG.TRICK_MAXW) return null;
  return rear.grounded ? (rel > 0 ? "wheelie" : null)
                       : (rel < 0 ? "stoppie" : null);
}

function updateTrick(dt) {
  const t = G.trick, art = trickArt();
  if (t.halt > 0) t.halt -= dt;
  if (art !== null && (t.art === null || t.art === art)) {
    if (t.art === null) { t.art = art; t.t = 0; t.punkte = 0; }
    t.aus = 0;
    t.t += dt;
    // Gezählt wird die ganze Nummer, auch der Anfang – die Schwelle entscheidet
    // nur, ob sie überhaupt als Nummer durchgeht.
    const satz = (t.art === "wheelie" ? CFG.TRICK_SATZ_W : CFG.TRICK_SATZ_S)
               * Math.min(CFG.TRICK_MAXSATZ, 1 + t.t / CFG.TRICK_RAMPE);
    t.punkte = Math.min(CFG.TRICK_CAP, t.punkte + satz * MOD.score * dt);
  } else if (t.art !== null) {
    // Eine Bodenwelle hebt das Rad kurz an, ohne dass die Nummer vorbei wäre.
    // Punkte gibt es in dieser Pause keine, aber sie beendet auch nichts.
    t.aus += dt;
    if (t.aus >= CFG.TRICK_GNADE || (art !== null && art !== t.art)) trickEnde();
  }
}

function trickEnde() {
  const t = G.trick, p = Math.round(t.punkte);
  // Eine Landung, die kurz auf einem Rad ausfedert, ist keine Nummer.
  if (t.t >= CFG.TRICK_START && p > 0) {
    G.score += p;
    // Die Zahl bleibt stehen, statt in eine eigene Meldung zu wandern: sie
    // steht schon im Bild und soll dort nur noch festfrieren.
    t.hArt = t.art; t.wert = p; t.halt = CFG.TRICK_HALT;
  }
  trickAus();
}

// stilles Ende – für Respawn, Mitflug und Neustart, wo nichts gutzuschreiben ist
function trickAus() {
  const t = G.trick;
  t.art = null; t.t = 0; t.punkte = 0; t.aus = 0;
}

const trickName = art => art === "wheelie" ? "🏍 Wheelie" : "🛞 Stoppie";
