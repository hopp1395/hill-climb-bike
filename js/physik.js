"use strict";
/* Fahrphysik: drei Verlet-Partikel als starres Dreieck
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* =========================================================================
   PHYSIK – drei Verlet-Partikel als starres Dreieck: die beiden Räder und
   die Fahrermasse über der Achslinie. Weil der Fahrer schwerer ist als die
   Räder, liegt der Schwerpunkt auf Sitzhöhe – genau darum dreht sich das
   Bike in der Luft, und beim Landen kippt es darum nach vorn oder hinten.
   w ist die inverse Masse: 1 für ein Rad, 1/BODY_M für den Fahrer.
   ========================================================================= */
// sag/sagV sind der Federweg und seine Geschwindigkeit – reine Optik
const rear  = { x: 0, y: 0, px: 0, py: 0, w: 1, r: CFG.WHEEL_R, grounded: false, tx: 1, ty: 0, nx: 0, ny: 1, spin: 0, spinV: 0, sag: 0, sagV: 0, vUp: 0, lx: 0, ly: 0 };
const front = { x: 0, y: 0, px: 0, py: 0, w: 1, r: CFG.WHEEL_R, grounded: false, tx: 1, ty: 0, nx: 0, ny: 1, spin: 0, spinV: 0, sag: 0, sagV: 0, vUp: 0, lx: 0, ly: 0 };
const body  = { x: 0, y: 0, px: 0, py: 0, w: 1 / CFG.BODY_M };
const PARTS = [rear, front, body];
// Aus Radstand, Sitzhöhe und Fahrermasse abgeleitet:
//   SEAT_DR/DF  Abstand Hinter-/Vorderrad zum Fahrer (Seiten des Dreiecks)
//   COM_H/COM_F Lage des Schwerpunkts über bzw. vor der Achsmitte
let SEAT_DR = 0, SEAT_DF = 0, MASS_SUM = 0, COM_H = 0, COM_F = 0;
function recalcMass() {
  body.w = 1 / CFG.BODY_M;
  SEAT_DR = Math.hypot(CFG.WHEELBASE / 2 + CFG.SEAT_FWD, CFG.SEAT_H);
  SEAT_DF = Math.hypot(CFG.WHEELBASE / 2 - CFG.SEAT_FWD, CFG.SEAT_H);
  MASS_SUM = 2 + CFG.BODY_M;
  COM_H = CFG.BODY_M * CFG.SEAT_H / MASS_SUM;
  COM_F = CFG.BODY_M * CFG.SEAT_FWD / MASS_SUM;
}

recalcMass();

function addVel(p, dvx, dvy, h) { p.px -= dvx * h; p.py -= dvy * h; }

// Fahrermasse aus der Radlage neu setzen (Start, Respawn, Teleport)
function seatBody() {
  const b = bodyDir();
  const vx = body.x - body.px, vy = body.y - body.py;
  body.x = (rear.x + front.x) / 2 + b.ux * CFG.SEAT_H + b.dx * CFG.SEAT_FWD;
  body.y = (rear.y + front.y) / 2 + b.uy * CFG.SEAT_H + b.dy * CFG.SEAT_FWD;
  body.px = body.x - vx; body.py = body.y - vy;
}

let GRAVK = 1;              // Wetter-Faktor auf die Gravitation, siehe step()

function integrate(p, h) {
  const d = istMeer() ? CFG.MEER_DAMP : CFG.AIR_DAMP;
  const vx = (p.x - p.px) * d, vy = (p.y - p.py) * d;
  p.px = p.x; p.py = p.y;
  p.x += vx;
  p.y += vy - CFG.GRAV * GRAVK * h * h;
}

// Starre Strecke zwischen zwei Partikeln, Korrektur nach inverser Masse
function link(a, b, len) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const f = (d - len) / d / (a.w + b.w);
  a.x += dx * f * a.w;  a.y += dy * f * a.w;
  b.x -= dx * f * b.w;  b.y -= dy * f * b.w;
}

function constrain() {
  link(rear, front, CFG.WHEELBASE);
  link(rear, body, SEAT_DR);
  link(front, body, SEAT_DF);
}

/* Sicherheitsnetz gegen aufschaukelnde Landungen. Die Constraint-Auflösung
   verschiebt Positionen, und in Verlet ist eine verschobene Position dasselbe
   wie Tempo: bei harten Landungen kann das starre Dreieck aus Rädern und
   Fahrer mehr Energie herausgeben, als hineingesteckt wurde. Gemessen sind so
   einzelne Läufe mit 24000 px/s senkrecht in den Himmel geschossen und haben
   nebenbei 56000 Punkte gutgeschrieben. 36 px pro Substep sind 4300 px/s –
   mehr als ein Sturz aus 2300 px Höhe, im normalen Fahren also unerreichbar. */
function capV(p) {
  const vx = p.x - p.px, vy = p.y - p.py, v2 = vx * vx + vy * vy;
  if (v2 <= CFG.V_MAX * CFG.V_MAX) return;
  const k = CFG.V_MAX / Math.sqrt(v2);
  p.px = p.x - vx * k; p.py = p.y - vy * k;
}

function collide(p, h, braking) {
  let gy = terrainY(p.x), sl = slopeAt(p.x);
  const br = bridgeAt(p.x);
  // Brücke trägt nur, wenn das Rad von oben kommt – von unten fällt man durch.
  // Zusätzlich muss es dicht am Deck sein: wer in einem einzigen Schritt weit
  // darunter gerutscht ist, ist durchgefallen und darf nicht zurückgerissen
  // werden (gemessen wurden Rückwürfe um 200 px).
  if (br && br.y > gy && p.py - p.r >= br.y - 4 && p.y > br.y - CFG.MAX_PEN) {
    gy = br.y; sl = br.s;
  }

  let pen = gy + p.r - p.y;
  if (pen <= 0) { p.grounded = false; return; }
  // Tiefes Eindringen nur stückweise auflösen. Sonst verzerrt ein einziger
  // großer Schub das starre Dreieck aus Rädern und Fahrer so stark, dass die
  // Constraint-Auflösung daraus Tempo macht und das Bike senkrecht wegfliegt.
  pen = Math.min(pen, CFG.MAX_PEN);

  const nl = Math.hypot(sl, 1);
  const nx = -sl / nl, ny = 1 / nl;      // Normale
  const tx = ny, ty = -nx;               // Tangente in +x

  let vx = p.x - p.px, vy = p.y - p.py;  // Verschiebung pro Substep
  p.x += nx * pen; p.y += ny * pen;

  let vn = vx * nx + vy * ny;
  let vt = vx * tx + vy * ty;
  // Aufprall in die Federung geben, bevor die Restitution ihn wegnimmt. Hier
  // steht die echte Auftreffgeschwindigkeit – über ein ganzes Bild gemittelt
  // wäre nur noch die Hälfte davon übrig.
  // Unterhalb der Schwelle passiert nichts: im Stand drückt die Schwerkraft
  // das Rad in jedem Substep ein Stück ein, und ohne Filter zittert die
  // Federung davon dauerhaft.
  const auf = -vn / h;
  if (auf > CFG.SUSP_MIN) p.sagV += (auf - CFG.SUSP_MIN) * CFG.SUSP_HIT;
  if (vn < 0) vn = -vn * CFG.REST;
  // Nasser Boden: die Bremse packt deutlich schlechter -> man rutscht weiter
  const fric = braking ? CFG.BRAKE_FRIC * (1 - CFG.WEA_RAIN_BRAKE * WEA.wet)
                       : CFG.ROLL_FRIC;
  vt *= 1 - fric;

  vx = tx * vt + nx * vn; vy = ty * vt + ny * vn;
  p.px = p.x - vx; p.py = p.y - vy;

  p.spinV = vt / p.r;            // Winkel pro Substep, trägt in der Luft weiter
  p.spin += p.spinV;
  p.grounded = true; p.nx = nx; p.ny = ny; p.tx = tx; p.ty = ty;
}

/* Federweg als gedämpfter Schwinger. Den Stoß bekommt er aus der Kollision,
   das Ausschwingen rechnet diese Funktion einmal pro Bild. */
function federReset() {
  for (const p of [rear, front]) { p.sag = 0; p.sagV = 0; }
}

function federung(dt) {
  for (const p of [rear, front]) {
    const ruhe = p.grounded ? CFG.SUSP_SAG : 0;    // in der Luft ausgefedert
    p.sagV += (-(p.sag - ruhe) * CFG.SUSP_K - p.sagV * CFG.SUSP_C) * dt;
    p.sag += p.sagV * dt;
    if (p.sag < 0) { p.sag = 0; if (p.sagV < 0) p.sagV = 0; }
    else if (p.sag > CFG.SUSP_TRAVEL) {
      p.sag = CFG.SUSP_TRAVEL; if (p.sagV > 0) p.sagV = 0;
    }
  }
}

// Rahmen hängt auf einer Kuppe auf -> rausschieben und Tempo verlieren
function bellyCollide() {
  for (const f of [0.3, 0.5, 0.7]) {
    const x = rear.x + (front.x - rear.x) * f;
    const y = rear.y + (front.y - rear.y) * f;
    const gy = groundUnder(x, y) + 7;
    if (y < gy) {
      const pen = (gy - y) * 0.5;
      rear.y += pen; front.y += pen; body.y += pen;
      rear.px += (rear.x - rear.px) * 0.18;
      front.px += (front.x - front.px) * 0.18;
    }
  }
}

function bodyDir() {
  const dx = front.x - rear.x, dy = front.y - rear.y;
  const L = Math.hypot(dx, dy) || 1;
  return { dx: dx / L, dy: dy / L, ux: -dy / L, uy: dx / L };  // Vorwärts + "Oben"
}

function angularVel(h) {                     // rad/s, positiv = Nase hoch
  const b = bodyDir();
  const rvx = (front.x - front.px) - (rear.x - rear.px);
  const rvy = (front.y - front.py) - (rear.y - rear.py);
  return ((rvx * b.ux + rvy * b.uy) / h) / CFG.WHEELBASE;
}

function applyTorque(acc, h) {               // acc>0 = Nase hoch
  if (!acc) return;
  const w = angularVel(h);
  if (Math.abs(w) > CFG.MAX_OMEGA && Math.sign(w) === Math.sign(acc)) return;
  const b = bodyDir();
  const dv = acc * h;
  addVel(front, b.ux * dv, b.uy * dv, h);
  addVel(rear, -b.ux * dv, -b.uy * dv, h);
}

function step(h) {
  const gas = IN.gas || G.boosting, brake = IN.brake;   // Boost gibt auch ohne Gas Schub
  const bAcc = G.boosting ? CFG.BOOST_ACC : 1;
  const bSpd = G.boosting ? CFG.BOOST_SPD : 1;
  const air = !rear.grounded && !front.grounded;
  GRAVK = gravFactor() * (air ? CFG.AIR_GRAV : 1);
  // Ab der Gipfelhöhe ist Schluss mit Schwerkraft – wer dort abspringt, fliegt
  // geradeaus weiter ins Weltall. Im Meer gibt es das nicht: dort ist unten
  // der Grund und kein Vakuum.
  if (!istMeer() && (rear.y + front.y) / 2 >= CFG.GIPFEL) GRAVK = 0;

  if (rear.grounded) {
    const grip = gripAt(rear.x, rear.y);
    const vt = ((rear.x - rear.px) * rear.tx + (rear.y - rear.py) * rear.ty) / h;
    // Antrieb und Bremse greifen am ganzen Aufbau an, nicht nur am Hinterrad.
    // Am Rad allein würden sie über den hohen Schwerpunkt die Nase hochhebeln
    // und das Bike an jedem Steilhang nach hinten überschlagen – gemessen 10
    // von 10 Läufen nach 6 Sekunden. Ob überhaupt Schub da ist, hängt weiter
    // am Hinterrad: Bodenkontakt und Grip werden dort abgefragt.
    if (gas && vt < CFG.MAXSPD * MOD.maxSpd * bSpd) {
      const a = CFG.ACC * MOD.acc * bAcc * grip * h / 2;
      for (const p of PARTS) addVel(p, rear.tx * a, rear.ty * a, h);
    }
    if (brake && vt > -CFG.MAXREV) {
      const a = CFG.BRAKE_ACC * grip * h / 2;
      for (const p of PARTS) addVel(p, -rear.tx * a, -rear.ty * a, h);
    }
    // Krallen: hält den Fahrer am Hang. Muss stärker sein als der Hangabtrieb
    // (bis 1390 px/s²) und wirkt nur, wenn weder Gas noch Bremse anliegt –
    // absichtliches Rückwärtsfahren für den Anlauf bleibt möglich.
    if (MOD.ult === "krallen" && !gas && !brake && vt < 0) {
      const dv = Math.min(-vt, 3000 * h) / 2;
      for (const p of PARTS) addVel(p, rear.tx * dv, rear.ty * dv, h);
    }
  }

  const tqAir = CFG.TQ_AIR * MOD.torqueAir;
  let tq = 0;
  // Am Boden hebt Gas die Nase – beim Boost nicht, sonst kippt das Bike an
  // Steilwänden nach hinten weg. Der Schub drückt, er reißt nicht hoch.
  if (gas)   tq += air ? tqAir : (G.boosting ? 0 : CFG.TQ_GROUND);
  if (brake) tq -= air ? tqAir : CFG.TQ_GROUND * 0.8;
  applyTorque(tq, h);

  // Drehung klingt in der Luft ab. Gegriffen wird direkt am Drehanteil der
  // Relativgeschwindigkeit der beiden Räder – gleich viel nach beiden Seiten,
  // der Schwerpunkt bleibt also unberührt.
  if (air && CFG.SPIN_DAMP) {
    const b = bodyDir();
    const rel = ((front.x - front.px) - (rear.x - rear.px)) * b.ux
              + ((front.y - front.py) - (rear.y - rear.py)) * b.uy;
    const dv = rel * CFG.SPIN_DAMP / 2;
    addVel(front, -b.ux * dv, -b.uy * dv, h);
    addVel(rear,   b.ux * dv,  b.uy * dv, h);
  }

  // Wind und Auftrieb greifen am ganzen Bike an – auf alle drei Massen gleich,
  // sonst hinge ihre Wirkung an der Massenverteilung.
  const aw = windAcc(air), al = liftAcc();
  if (aw || al) for (const p of PARTS) addVel(p, aw * h, al * h, h);

  for (const p of PARTS) integrate(p, h);
  for (let i = 0; i < 6; i++) constrain();
  collide(rear, h, IN.brake);
  collide(front, h, IN.brake);
  bellyCollide();
  for (const p of PARTS) capV(p);

  // Räder laufen in der Luft weiter, statt einzufrieren
  if (!rear.grounded)  { rear.spin  += rear.spinV;  rear.spinV  *= 0.999; }
  if (!front.grounded) { front.spin += front.spinV; front.spinV *= 0.999; }
}
