"use strict";
/* Das Gelände selbst und seine Schatten
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
function drawTerrain() {
  const pts = [];
  for (let px = -20; px <= W + 20; px += 5) {
    const wx = wxAt(px);
    // Unter einer Holzschanze wird der Berg in seiner gewachsenen Form
    // gezeichnet – die Rampe steht als Gerüst darauf, gefahren wird oben.
    pts.push([px, sy(terrainY(wx) - jumpRise(wx, true))]);
  }

  const body = new Path2D();
  body.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) body.lineTo(pts[i][0], pts[i][1]);
  body.lineTo(W + 20, H + 40); body.lineTo(-20, H + 40); body.closePath();

  // Alles über der Oberfläche – darauf wird der Bewuchs geklippt, damit von
  // ihm nichts im Berg zu sehen ist. Der Schatten liegt dagegen auf dem Boden
  // und wird deshalb ungeklippt gezeichnet, nachdem der Boden steht.
  const drueber = new Path2D();
  drueber.moveTo(-20, -40); drueber.lineTo(W + 20, -40);
  for (let i = pts.length - 1; i >= 0; i--) drueber.lineTo(pts[i][0], pts[i][1]);
  drueber.closePath();

  ctx.fillStyle = heightGrad(RAMP_BODY); ctx.fill(body);

  // Tiefe: nach unten hin abdunkeln
  const sh = ctx.createLinearGradient(0, H * 0.5, 0, H);
  sh.addColorStop(0, "rgba(0,0,0,0)");
  sh.addColorStop(1, "rgba(10,14,26,.2)");
  ctx.fillStyle = sh; ctx.fill(body);

  const surf = new Path2D();
  surf.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) surf.lineTo(pts[i][0], pts[i][1]);

  // Innenzeichnung. Auf den Körper geklippt, damit nichts über die Kante in
  // den Himmel ragt – ein dicker Strich auf der Oberfläche liegt sonst halb
  // darüber.
  ctx.save();
  ctx.clip(body);
  ctx.lineJoin = "round";
  ctx.strokeStyle = heightGrad(RAMP_DECK);    // Schnee-/Eisauflage
  ctx.lineWidth = 26 * SCALE; ctx.stroke(surf);
  // Risse: im Fels Spalten, im Gletscher blaue Klüfte, im Schnee nichts
  const xl = wxAt(-30), xr = wxAt(W + 30), RST = 190;
  ctx.lineCap = "round";
  for (let k = Math.floor(xl / RST); k <= Math.ceil(xr / RST); k++) {
    if (hash(k * 2.9 + 1.7) > 0.62) continue;
    const wx = (k + hash(k * 1.3) * 0.7) * RST;
    const wy = terrainY(wx) - jumpRise(wx, true);
    const eis = iceAt(wy), lava = lavaAt(wy), raum = spaceAt(wy);
    const fels = 1 - smooth((wy - CFG.SNOWLINE) / CFG.SNOW_FADE);
    const a = fels * 0.3 + eis * 0.42 + lava * 0.9 + raum * 0.34;
    if (a < 0.04) continue;
    const len = (26 + hash(k * 7.7) * 46) * SCALE, X = sx(wx), Y = sy(wy) + 7 * SCALE;
    const ziel = X + len * (hash(k * 5.1) - 0.5) * 0.8, unten = Y + len;
    let col = lerp3([54, 40, 30], [58, 140, 186], eis);
    col = lerp3(col, [255, 116, 40], lava);        // Lava-Ader
    col = lerp3(col, [176, 194, 226], raum);       // Staubriss
    ctx.strokeStyle = rgba(col, a);
    ctx.lineWidth = (1.8 + eis + lava * 2.4) * SCALE;
    ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(ziel, unten); ctx.stroke();
    if (lava > 0.05) {                             // heller Kern, der glüht
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = rgba([255, 226, 150], 0.55 * lava);
      ctx.lineWidth = 1.2 * SCALE;
      ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(ziel, unten); ctx.stroke();
      ctx.restore();
    }
  }
  drawFrozen();                     // Eingefrorene liegen im geklippten Körper
  ctx.restore();

  // Kante: Gras unten, Schnee darüber, Eis ganz oben
  ctx.strokeStyle = heightGrad(RAMP_EDGE);
  ctx.lineWidth = 7 * SCALE; ctx.lineJoin = "round"; ctx.stroke(surf);

  ctx.save();
  ctx.clip(body);                   // Schatten liegen auf dem Boden
  bewuchs(true);
  drawLeute(true);
  ctx.restore();
  ctx.save();
  ctx.clip(drueber);
  bewuchs(false);                   // die Objekte selbst, oberhalb der Kante
  ctx.restore();
  TERRAIN_BODY = body;              // Dorf und Geysire klippen ihre Schatten daran
}
let TERRAIN_BODY = null;

/* Bewuchs auf der Fahrbahn. Jede Höhenstufe hat ihr eigenes Gewächs, und
   welches erscheint, entscheidet dieselbe Zonenmischung wie bei den Farben –
   an den Übergängen stehen die Sorten also eine Weile nebeneinander.
   Alles steht senkrecht zur Oberfläche, wächst also aus dem Hang heraus, und
   kommt aus hash(): kein gespeicherter Zustand, beim Zurückfahren identisch. */
// Wie weit ein Schatten je Höheneinheit nach links reicht. 0,9 entspricht
// einer Sonne knapp 50° über dem Horizont – sie steht im Bild oben rechts.
const SCHATTEN_LANG = 0.9;

/* Schattenband auf dem Boden. Es beginnt an der Standfläche des Objekts,
   läuft nach links von der Sonne weg und wird zur Spitze hin schmaler. Es
   folgt dabei dem Gelände, liegt also auch über Wellen und Kanten sauber auf –
   ein Oval würde dort abheben.
   xm/halb/hoehe in Weltpixeln. */
function schattenBand(xm, halb, hoehe, alpha) {
  const x1 = xm + halb, x0 = xm - halb, xt = x0 - hoehe * SCHATTEN_LANG;
  const dicke = 0.34 * halb + 5;
  ctx.fillStyle = "rgba(22,24,34," + alpha + ")";
  ctx.beginPath();
  // Oberkante direkt an der Geländelinie, Unterkante darunter in den Hang
  // hinein. In der Seitenansicht ist der Boden die Fläche unter der Linie –
  // oberhalb würde der Clip auf den Berg alles wegschneiden.
  for (let x = x1; x >= xt; x -= 9) ctx.lineTo(sx(x), sy(terrainY(x)) + 1 * SCALE);
  for (let x = xt; x <= x1; x += 9) {
    const t = x >= x0 ? 1 : (x - xt) / Math.max(1, x0 - xt);   // 0 an der Spitze
    ctx.lineTo(sx(x), sy(terrainY(x)) + (1 + dicke * (0.22 + 0.78 * t)) * SCALE);
  }
  ctx.closePath(); ctx.fill();
}
