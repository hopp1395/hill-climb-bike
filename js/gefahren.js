"use strict";
/* Adler, Entführer und Komet
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* =========================================================================
   GEFAHREN – Adler, Entführer, Komet
   Jede hat ihre eigene Uhr und ist immer nur einmal gleichzeitig da. Getroffen
   wird nach demselben Muster wie beim Blitz: erst kostet es den Schutzengel,
   danach den Lauf.
   ========================================================================= */
const GEF = { adler: null, adlerNext: 0, ufo: null, ufoNext: 0,
              komet: null, kometNext: 0 };

/* Vorwarnzeit einer Gefahr. Annas Falkenauge streckt sie – und weil die
   Anzeigen ihren Fortschritt aus derselben Zahl rechnen, muss sie überall
   durch diese Funktion laufen, sonst läuft der Zielkreis dem Einschlag davon. */
const warnZeit = t => t * MOD.warn;

function gefReset() {
  GEF.adler = null; GEF.ufo = null; GEF.komet = null;
  GEF.adlerNext = rnd(CFG.ADLER_EVERY[0], CFG.ADLER_EVERY[1]);
  GEF.ufoNext = rnd(CFG.UFO_EVERY[0], CFG.UFO_EVERY[1]);
  GEF.kometNext = rnd(CFG.KOMET_EVERY[0], CFG.KOMET_EVERY[1]);
}

function getroffen(grund, toastText) {
  if (DBG.god) return;
  if (G.lives > 0) { G.lives--; respawn(); toast(toastText); }
  else gameOver(grund);
}

// Wo wird der Fahrer sein? Dasselbe Vorhalten wie beim Blitz.
function zielPunkt(lead, spread) {
  const vx = (rear.x - rear.px) * 60;
  return bikeX() + vx * lead * 0.5 + rnd(-spread, spread);
}

function starteAdler() {
  const bx = bikeX(), by = (rear.y + front.y) / 2;
  GEF.adler = { x: bx + rnd(420, 700), y: by + rnd(330, 460),
                phase: "kreist", t: 0, vx: 0, vy: 0, ph: Math.random() * 6.28 };
}

function starteUfo() {
  GEF.ufo = { x: zielPunkt(CFG.UFO_LEAD, CFG.UFO_SPREAD), t: 0, phase: "warn" };
}

function starteKomet() {
  const x = zielPunkt(CFG.KOMET_LEAD, CFG.KOMET_SPREAD);
  GEF.komet = { x, y: groundUnder(x, 1e9), t: 0, phase: "warn" };
}

function updateGefahren(dt) {
  const bx = bikeX(), by = (rear.y + front.y) / 2;
  const raum = spaceAt(cam.y);

  /* ---- Adler: kreist kurz, stößt einmal zu und geht dabei drauf ---- */
  const a = GEF.adler;
  if (a === null) {
    if (G_REGEL.adler && MOD.ult !== "vogelscheuche" && by > CFG.ADLER_VON && raum < 0.4) {
      GEF.adlerNext -= dt;
      if (GEF.adlerNext <= 0) { starteAdler(); GEF.adlerNext = rnd(CFG.ADLER_EVERY[0], CFG.ADLER_EVERY[1]); }
    }
  } else {
    a.t += dt;
    if (a.phase === "kreist") {
      // hält sich vor dem Fahrer und wippt, damit man ihn kommen sieht
      a.x += ((bx + 430) - a.x) * Math.min(1, dt * 2.2);
      a.y += ((by + 380) - a.y) * Math.min(1, dt * 2.2) + Math.sin(a.t * 6 + a.ph) * 26 * dt;
      if (a.t >= warnZeit(CFG.ADLER_WARN)) {
        const zx = bx + (rear.x - rear.px) * 60 * CFG.ADLER_LEAD * 0.5, zy = by;
        const d = Math.hypot(zx - a.x, zy - a.y) || 1;
        a.vx = (zx - a.x) / d * CFG.ADLER_SPEED;
        a.vy = (zy - a.y) / d * CFG.ADLER_SPEED;
        a.phase = "sturz"; a.t = 0;
      }
    } else if (a.phase === "sturz") {
      a.x += a.vx * dt; a.y += a.vy * dt;
      if (Math.hypot(a.x - bx, a.y - by) < CFG.ADLER_HIT) {
        a.phase = "tot"; a.t = 0;
        getroffen("🦅 Vom Adler geholt!", "🦅 Adler! Schutzengel weg");
      } else if (a.y <= groundUnder(a.x, a.y) + 6 || a.t > 2.4) {
        // Der Stoß geht immer nur einmal – danach zerschellt er am Hang
        a.phase = "tot"; a.t = 0;
      }
    } else if (a.t > 0.9) GEF.adler = null;
  }

  /* ---- Entführer: nur in der Sternenzone, Strahl wie ein Blitz ---- */
  const u = GEF.ufo;
  if (u === null) {
    if (G_REGEL.ufo && raum > 0.5) {
      GEF.ufoNext -= dt;
      if (GEF.ufoNext <= 0) { starteUfo(); GEF.ufoNext = rnd(CFG.UFO_EVERY[0], CFG.UFO_EVERY[1]); }
    }
  } else {
    u.t += dt;
    if (u.phase === "warn" && u.t >= warnZeit(CFG.UFO_WARN)) {
      u.phase = "fang"; u.t = 0;
      if (Math.abs(bx - u.x) < CFG.UFO_HIT)
        getroffen("👽 Entführt!", "👽 Fast entführt! Schutzengel weg");
    } else if (u.phase === "fang" && u.t > 0.75) GEF.ufo = null;
  }

  /* ---- Komet: immer nur einer, er schlägt wirklich ein ---- */
  const k = GEF.komet;
  if (k === null) {
    if (raum > 0.35) {
      GEF.kometNext -= dt;
      if (GEF.kometNext <= 0) { starteKomet(); GEF.kometNext = rnd(CFG.KOMET_EVERY[0], CFG.KOMET_EVERY[1]); }
    }
  } else {
    k.t += dt;
    if (k.phase === "warn" && k.t >= warnZeit(CFG.KOMET_WARN)) {
      k.phase = "einschlag"; k.t = 0;
      if (Math.abs(bx - k.x) < CFG.KOMET_HIT && by < k.y + 260)
        getroffen("☄️ Vom Kometen getroffen!", "☄️ Komet! Schutzengel weg");
    } else if (k.phase === "einschlag" && k.t > 1.1) GEF.komet = null;
  }
}
