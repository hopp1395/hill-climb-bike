"use strict";
/* Wetterlagen und ihre Kräfte auf Fahrt und Gravitation
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* =========================================================================
   WETTER – zieht im Lauf einer Runde zufällig auf und greift ins Fahren ein:
     Regen     macht den Boden rutschig – weniger Grip, kaum noch Bremse
     Gewitter  Regen plus Blitze, die mit Vorwarnung am Boden einschlagen
     Sturm     dauerhafter Gegenwind, der in Böen an- und abschwillt
     Tornado   saugt zum Trichter hin und macht in seiner Nähe leicht
   Alles läuft über WEA.p (0..1) ein und aus, damit nichts hart umspringt.
   ========================================================================= */
const WKIND = {
  regen:    { name: "Regen",    icon: "🌧️", dauer: [16, 26], gewicht: 34 },
  gewitter: { name: "Gewitter", icon: "⛈️", dauer: [15, 24], gewicht: 26 },
  sturm:    { name: "Sturm",    icon: "🌬️", dauer: [16, 26], gewicht: 28 },
  tornado:  { name: "Tornado",  icon: "🌪️", dauer: [12, 18], gewicht: 12 },
};
const WEA = {
  kind: "klar", left: 0, p: 0, wet: 0, next: 0, gust: 1, spin: 0,
  boltIn: 0, warnX: 0, warnLeft: 0, warnGes: 0, flash: 0, bolt: null, tx: 0,
};
const rnd = (a, b) => a + Math.random() * (b - a);
const bikeX = () => (rear.x + front.x) / 2;

function weatherReset() {
  WEA.kind = "klar"; WEA.left = 0; WEA.p = 0; WEA.wet = 0; WEA.gust = 1;
  WEA.boltIn = 0; WEA.warnLeft = 0; WEA.flash = 0; WEA.bolt = null;
  WEA.next = rnd(CFG.WEA_FIRST[0], CFG.WEA_FIRST[1]);
  // im Testmodus festgehaltene Lage überlebt den Neustart, sonst wäre sie weg
  if (DBG.hold && DBG.forced && DBG.forced !== "klar") startWeather(DBG.forced, 600);
}

function pickWeather() {
  // Im leichten Grad nur die harmlosen Lagen: kein Gewitter, kein Tornado.
  // Leere Liste heißt gar kein Wetter – unter Wasser regnet es nicht.
  const keys = G_REGEL.wetter || Object.keys(WKIND);
  if (!keys.length) return null;
  let sum = 0;
  for (const k of keys) sum += WKIND[k].gewicht;
  let r = Math.random() * sum;
  for (const k of keys) { r -= WKIND[k].gewicht; if (r <= 0) return k; }
  return keys[0];
}

function startWeather(kind, dauer) {
  WEA.kind = kind;
  WEA.left = dauer != null ? dauer : rnd(WKIND[kind].dauer[0], WKIND[kind].dauer[1]);
  WEA.boltIn = rnd(1.2, 2.6);
  WEA.warnLeft = 0;
  if (kind === "tornado") WEA.tx = bikeX() + rnd(1000, 1700);
  toast(WKIND[kind].icon + " " + WKIND[kind].name + " zieht auf");
}

// Wirkung des Tornados nimmt mit dem Abstand ab
function tornadoFall(d) { return smooth(1 - d / CFG.WEA_TORNADO_R); }

// Gegenwind als Beschleunigung. Wirkt auf den ganzen Aufbau, deshalb wird sie
// in step() auf beide Partikel gelegt – nicht wie der Antrieb nur aufs Hinterrad.
function windAcc(air) {
  let w = 0;
  if (WEA.kind === "sturm")         w = -CFG.WEA_WIND * WEA.p * WEA.gust;
  else if (WEA.kind === "gewitter") w = -CFG.WEA_WIND * 0.45 * WEA.p * WEA.gust;
  else if (WEA.kind === "tornado") {
    // Der Trichter zieht an, egal von welcher Seite – und er saugt gleichmäßig,
    // deshalb geht die Böe hier nur zu einem Viertel ein.
    const d = WEA.tx - bikeX();
    w = Math.sign(d) * CFG.WEA_WIND * CFG.WEA_TORNADO_PULL * WEA.p
      * tornadoFall(Math.abs(d)) * (0.75 + 0.25 * WEA.gust);
  }
  return w * (air ? 1 : CFG.WEA_WIND_GROUND);
}

function gravFactor() {
  // Unter Wasser trägt der Auftrieb: das Bike fällt langsamer und schwebt
  // nach Sprüngen länger. Der Wert ist so gewählt, dass die Kletter- und
  // Bremsgrenzen mitwachsen, statt das Fahren zu zerlegen.
  const wasser = istMeer() ? CFG.MEER_GRAV : 1;
  if (WEA.kind !== "tornado") return wasser;
  return wasser * (1 - (1 - CFG.WEA_TORNADO_GRAV) * WEA.p
                       * tornadoFall(Math.abs(WEA.tx - bikeX())));
}

// Auftrieb des Trichters. Wirkt auf beide Räder gleich, dreht das Bike also
// nicht, und verschwindet mit der Höhe – das Bike wird angehoben, nicht
// weggeschossen.
function liftAcc() {
  if (WEA.kind !== "tornado" || WEA.p <= 0) return 0;
  const bx = bikeX(), by = (rear.y + front.y) / 2;
  const f = tornadoFall(Math.abs(WEA.tx - bx));
  if (f <= 0) return 0;
  const h = by - groundUnder(bx, by) - CFG.WHEEL_R;      // Höhe über der Ruhelage
  return CFG.WEA_TORNADO_LIFT * WEA.p * f * smooth(1 - h / CFG.WEA_TORNADO_LIFT_H);
}

function blitzEin() {
  const x = WEA.warnX, y = groundUnder(x, 1e9);
  // Zickzack: das Vorzeichen wechselt von Punkt zu Punkt, die Auslenkung wird
  // nach unten hin kleiner, damit die Spitze genau auf der Einschlagstelle sitzt
  const top = y + rnd(1100, 1700), N = 12, pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, amp = 105 * (1 - t * t) * (0.35 + Math.random() * 0.65);
    pts.push([x + (i % 2 ? amp : -amp), top + (y - top) * t]);
  }
  pts[N] = [x, y];
  // eine Abzweigung ab der Mitte
  const k = 4 + Math.floor(Math.random() * 4), ast = [pts[k]];
  for (let i = 1; i <= 3; i++)
    ast.push([pts[k][0] + (i % 2 ? 1 : -1) * 70 * i * (0.5 + Math.random()) * (Math.random() < 0.5 ? -1 : 1),
              pts[k][1] - i * 130]);
  WEA.bolt = { pts, ast, t: 0.34 };
  WEA.flash = 1;
  if (!DBG.god && Math.abs(bikeX() - x) < CFG.WEA_BOLT_HIT) {
    if (G.lives > 0) { G.lives--; respawn(); toast("⚡ Blitz! Schutzengel weg"); }
    else gameOver("⚡ Vom Blitz getroffen!");
  }
}


function updateWeather(dt) {
  WEA.spin += dt;
  // Böen: zwei Sinus übereinander – unregelmäßig, aber ohne Zufallssprünge
  WEA.gust = 0.62 + 0.38 * Math.sin(G.time * 1.9) * Math.sin(G.time * 0.61 + 1.2);

  if (WEA.kind === "klar") {
    if (!DBG.hold) {
      WEA.next -= dt;
      if (WEA.next <= 0) {
        const k = pickWeather();
        if (k) startWeather(k); else WEA.next = 999;
      }
    }
  } else {
    WEA.left -= dt;
    if (WEA.left <= 0 && WEA.p < 0.02) {
      WEA.kind = "klar"; WEA.p = 0; WEA.bolt = null; WEA.warnLeft = 0;
      WEA.next = rnd(CFG.WEA_PAUSE[0], CFG.WEA_PAUSE[1]);
    }
  }
  const ziel = WEA.left > 0 ? 1 : 0;
  const rate = dt / (ziel > WEA.p ? 2.5 : 3.2);
  WEA.p += Math.max(-rate, Math.min(rate, ziel - WEA.p));

  // Nässe steigt mit dem Regen und trocknet danach langsam ab
  const regen = (WEA.kind === "regen" || WEA.kind === "gewitter") ? WEA.p : 0;
  WEA.wet += (regen - WEA.wet) * Math.min(1, dt * (regen > WEA.wet ? 0.55 : 0.17));

  // Der Trichter wandert auf den Fahrer zu und wird neu gesetzt, wenn er durch ist
  if (WEA.kind === "tornado") {
    WEA.tx += (-70 + Math.sin(G.time * 0.7) * 25) * dt;
    if (WEA.tx < bikeX() - 1500) WEA.tx = bikeX() + rnd(1400, 2200);
  }

  if (WEA.bolt) { WEA.bolt.t -= dt; if (WEA.bolt.t <= 0) WEA.bolt = null; }
  WEA.flash = Math.max(0, WEA.flash - dt * 3.4);

  if (WEA.kind === "gewitter" && WEA.p > 0.4) {
    if (WEA.warnLeft > 0) {
      WEA.warnLeft -= dt;
      if (WEA.warnLeft <= 0) { WEA.warnLeft = 0; blitzEin(); }
    } else {
      WEA.boltIn -= dt;
      if (WEA.boltIn <= 0) {
        // Der Blitz hält vor: er zielt dahin, wo der Fahrer in WEA_BOLT_WARN
        // Sekunden wäre. Ohne das Vorhalten trifft er einen Fahrenden nie,
        // mit Vorhalten weicht man durch Bremsen oder Gas aus – das ist der Reiz.
        const vx = (rear.x - rear.px) * 120;
        const vor = warnZeit(CFG.WEA_BOLT_WARN);
        WEA.warnX = bikeX() + vx * vor * CFG.WEA_BOLT_LEAD
                  + rnd(-CFG.WEA_BOLT_SPREAD, CFG.WEA_BOLT_SPREAD);
        // gemerkt, damit die Anzeige mit derselben Zeit rechnet wie der Einschlag
        WEA.warnGes = vor;
        WEA.warnLeft = vor;
        WEA.boltIn = rnd(CFG.WEA_BOLT_EVERY[0], CFG.WEA_BOLT_EVERY[1]);
      }
    }
  } else if (WEA.kind !== "gewitter") {
    WEA.warnLeft = 0;
  }
}
