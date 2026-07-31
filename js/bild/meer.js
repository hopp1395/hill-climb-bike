"use strict";
/* Wasser, Blasen und Fische
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* ---- Meer-Modus -----------------------------------------------------------
   Eigener Bildaufbau: statt Himmel, Wolken und Bergketten gibt es Wasser, das
   mit der Tiefe dunkler wird, Lichtstrahlen unter der Oberfläche, aufsteigende
   Blasen und Fischschwärme. Das Gelände selbst zeichnet dieselbe Funktion wie
   sonst – es ist nur gespiegelt und anders eingefärbt. */
const BLASEN = Array.from({ length: 90 }, (_, i) => ({
  x: hash(i * 1.7 + 2), y: hash(i * 5.3 + 6), r: 1 + hash(i * 3.1) * 3.4,
  v: 0.05 + hash(i * 7.9) * 0.1, w: hash(i * 2.3) * 6.28,
}));
const FISCHE = Array.from({ length: 16 }, (_, i) => ({
  x: hash(i * 4.1 + 3) * 4200, y: hash(i * 6.7 + 1) * 3000 - 1500,
  s: 0.5 + hash(i * 2.9) * 0.9, v: (18 + hash(i * 8.3) * 26) * (hash(i * 5.1) > 0.5 ? 1 : -1),
  n: 3 + Math.floor(hash(i * 9.7) * 5), ph: hash(i * 3.7) * 6.28,
}));
// Einzelne große Fische dicht an der Kamera: sie ziehen sichtbar am Fahrer
// vorbei und geben dem Wasser Tiefe, ohne den Blick auf die Bahn zu nehmen.
const FISCHE_NAH = Array.from({ length: 7 }, (_, i) => ({
  x: hash(i * 3.3 + 17) * 4200, y: hash(i * 5.9 + 11) * 2600 - 1300,
  s: 0.75 + hash(i * 7.3) * 0.7, v: (26 + hash(i * 4.7) * 30) * (hash(i * 6.9) > 0.5 ? 1 : -1),
  n: 1, ph: hash(i * 8.1) * 6.28,
}));

// 0 an der Oberfläche, 1 am Grund
function meerTiefe(y) { return Math.max(0, Math.min(1, -y / CFG.GIPFEL)); }

function drawWasser() {
  const t = performance.now() / 1000;
  const oben = meerTiefe(cam.y - H * CAMY / SCALE);          // oberer Bildrand
  const unten = meerTiefe(cam.y + (H - H * CAMY) / SCALE);   // unterer Bildrand
  const farbe = d => lerp3(lerp3([86, 170, 208], [16, 62, 104], Math.min(1, d * 2)),
                           [4, 10, 26], Math.max(0, d - 0.5) * 2);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rgba(farbe(oben), 1));
  g.addColorStop(1, rgba(farbe(unten), 1));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Wasseroberfläche mit Lichtstrahlen – nur zu sehen, solange sie im Bild ist
  const yO = sy(0);
  if (yO > -300) {
    /* Über der Oberfläche liegt Himmel, kein Wasser. Am Start sieht man
       dadurch Strand, Horizont und Wolken – und dass man gleich hineinfährt.
       Sobald man abgetaucht ist, wandert das alles aus dem Bild. */
    if (yO > 0) {
      const hi = ctx.createLinearGradient(0, Math.max(0, yO - H * 0.9), 0, yO);
      hi.addColorStop(0, "#4d90d8");
      hi.addColorStop(0.65, "#8fc4ea");
      hi.addColorStop(1, "#cfe6f4");                 // dunstig am Horizont
      ctx.fillStyle = hi;
      ctx.fillRect(0, 0, W, yO);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, yO); ctx.clip();
      // Sonne oben rechts, wie im Bergmodus
      const sxx = W * 0.82, syy = yO - H * 0.62;
      const sg = ctx.createRadialGradient(sxx, syy, 0, sxx, syy, 160 * SCALE);
      sg.addColorStop(0, "rgba(255,248,214,.85)");
      sg.addColorStop(0.25, "rgba(255,240,190,.28)");
      sg.addColorStop(1, "rgba(255,236,180,0)");
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(sxx, syy, 160 * SCALE, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,252,232,.95)";
      ctx.beginPath(); ctx.arc(sxx, syy, 20 * SCALE, 0, 7); ctx.fill();
      // ferne Küste am Horizont, mit wenig Parallaxe
      ctx.fillStyle = "rgba(104,134,156,.72)";
      ctx.beginPath();
      ctx.moveTo(-40, yO);
      for (let x = -40; x <= W + 40; x += 16) {
        const wx = x / SCALE + cam.x * 0.12;
        ctx.lineTo(x, yO - (48 + Math.sin(wx * 0.0016) * 26
                               + (vnoise(wx * 0.0009) - 0.5) * 40) * SCALE);
      }
      ctx.lineTo(W + 40, yO); ctx.closePath(); ctx.fill();
      // ein paar Wolken
      ctx.fillStyle = "rgba(255,255,255,.8)";
      for (let i = 0; i < 5; i++) {
        const wx = (i * 1900 + hash(i * 3.1) * 900);
        const px2 = W * CAMX + (wx - cam.x * 0.09) % 5200 * SCALE - 900 * SCALE;
        const py2 = yO - (H * 0.30 + hash(i * 5.7) * H * 0.3);
        const s2 = (0.7 + hash(i * 2.3) * 0.8) * SCALE;
        ctx.beginPath();
        ctx.arc(px2, py2, 26 * s2, 0, 7);
        ctx.arc(px2 + 26 * s2, py2 + 5 * s2, 19 * s2, 0, 7);
        ctx.arc(px2 - 24 * s2, py2 + 6 * s2, 16 * s2, 0, 7);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(0, -200, W, Math.min(H + 200, yO + 200)); ctx.clip();
    const hell = ctx.createLinearGradient(0, yO - 40, 0, yO + 420 * SCALE);
    hell.addColorStop(0, "rgba(190,238,255,.75)");
    hell.addColorStop(1, "rgba(150,220,255,0)");
    ctx.fillStyle = hell;
    ctx.fillRect(0, yO - 40, W, 460 * SCALE);
    // Strahlen: schmale helle Keile, die langsam wandern
    for (let i = 0; i < 7; i++) {
      const px = ((i * 0.17 + t * 0.012) % 1) * (W + 300) - 150;
      const br = (26 + hash(i * 3.3) * 34) * SCALE;
      const lang = (420 + hash(i * 5.7) * 380) * SCALE;
      const neig = (hash(i * 7.1) - 0.5) * 90 * SCALE;
      const gl = ctx.createLinearGradient(px, yO, px + neig, yO + lang);
      gl.addColorStop(0, "rgba(210,245,255,.24)");
      gl.addColorStop(1, "rgba(190,235,255,0)");
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.moveTo(px - br * 0.35, yO); ctx.lineTo(px + br * 0.35, yO);
      ctx.lineTo(px + neig + br, yO + lang); ctx.lineTo(px + neig - br, yO + lang);
      ctx.closePath(); ctx.fill();
    }
    // die Oberfläche selbst als welliges Band
    ctx.strokeStyle = "rgba(224,248,255,.6)";
    ctx.lineWidth = 2.4 * SCALE;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 12)
      ctx.lineTo(x, yO + Math.sin(x * 0.02 + t * 1.6) * 4 * SCALE
                      + Math.sin(x * 0.007 - t * 0.9) * 6 * SCALE);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBlasen() {
  const t = performance.now() / 1000;
  ctx.fillStyle = "rgba(214,240,255,.34)";
  for (const b of BLASEN) {
    const y = ((b.y - t * b.v) % 1 + 1) % 1;
    const px = (b.x * W + Math.sin(t * 0.8 + b.w) * 14 * SCALE) % W;
    ctx.beginPath();
    ctx.arc(px, y * H, b.r * SCALE, 0, 7);
    ctx.fill();
  }
}

function drawFische(liste, par, groesse) {
  const t = performance.now() / 1000;
  /* Senkrecht in einem Band um die Kamera wiederholen. Fest an einer Welthöhe
     verankert wären sie nach den ersten Metern Abstieg für immer über dem
     Bildrand – gemessen war beim Abtauchen kein einziger mehr zu sehen. */
  const band = (H / SCALE) * 1.6;
  for (const f of liste) {
    const wx = f.x + t * f.v;
    const px = W * CAMX + (((wx - cam.x * par) % 4200 + 4200) % 4200 - 2100) * SCALE;
    const dy = ((f.y - cam.y * par) % band + band) % band - band * 0.5;
    const py = H * CAMY - dy * SCALE;
    if (px < -220 || px > W + 220 || py < -110 || py > H + 110) continue;
    const s = f.s * groesse * Math.max(0.6, SCALE);
    const hin = f.v > 0 ? 1 : -1;
    const tief = meerTiefe(cam.y);        // Farbe nach der Tiefe, in der man ist
    ctx.fillStyle = rgba(lerp3([120, 190, 210], [40, 80, 120], tief), 0.75);
    for (let k = 0; k < f.n; k++) {
      const ox = (k - f.n / 2) * 17 * s * hin;
      const oy = Math.sin(k * 1.9 + t * 2 + f.ph) * 9 * s;
      const wed = Math.sin(t * 7 + k * 1.3) * 3 * s;
      ctx.beginPath();
      ctx.ellipse(px + ox, py + oy, 7 * s, 3.4 * s, 0, 0, 7);
      ctx.fill();
      ctx.beginPath();                                   // Schwanzflosse
      ctx.moveTo(px + ox - 6 * s * hin, py + oy);
      ctx.lineTo(px + ox - 11 * s * hin, py + oy - 3.4 * s + wed);
      ctx.lineTo(px + ox - 11 * s * hin, py + oy + 3.4 * s + wed);
      ctx.closePath(); ctx.fill();
    }
  }
}

function drawMeer() {
  drawWasser();
  /* Blasen und Fische nur unterhalb der Oberfläche – am Start ist der obere
     Bildteil Himmel, dort haben sie nichts zu suchen. */
  ctx.save();
  const yO = sy(0);
  if (yO > 0) { ctx.beginPath(); ctx.rect(0, yO, W, H - yO); ctx.clip(); }
  drawBlasen();           // in der Wassersäule, also hinter der Fahrbahn
  drawFische(FISCHE, 0.55, 1);        // ferne Schwärme
  ctx.restore();
  drawTerrain();          // Bewuchs wird hier von selbst zu Seegras: die
                          // Gebietsanteile sind unter Wasser alle null
  drawCans();
  ctx.save();
  if (yO > 0) { ctx.beginPath(); ctx.rect(0, yO, W, H - yO); ctx.clip(); }
  drawFische(FISCHE_NAH, 0.92, 2.1);  // große Einzelfische dicht an der Kamera
  ctx.restore();
  drawGeist();
  // Beim Finale wird das Bike zusammengedrückt, nicht nur ausgeblendet
  const q = sternAnteil();
  if (q > 0.004) {
    const cx = sx(bikeX()), cy = sy((rear.y + front.y) / 2), k = 1 - q * 0.85;
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy);
    drawBike();
    ctx.restore();
  } else drawBike();
  drawImplosion();
  drawAbspann();
}
