"use strict";
/* Ablauf einer Runde: Start, Tod, Mitflug und der Takt von update()
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
function reset() {
  SEED = Math.random() * 100;
  buildTerrain();
  applyBuffs();
  const x0 = 80, y0 = terrainY(x0) + CFG.WHEEL_R;
  rear.x = x0; rear.y = y0;
  front.x = x0 + CFG.WHEELBASE; front.y = terrainY(x0 + CFG.WHEELBASE) + CFG.WHEEL_R;
  rear.px = rear.x; rear.py = rear.y;
  front.px = front.x; front.py = front.y;
  body.px = body.x = 0; body.py = body.y = 0; seatBody();
  rear.spin = front.spin = rear.spinV = front.spinV = 0;
  rear.grounded = front.grounded = false;
  federReset();
  G.score = 0; G.maxY = y0; G.fuel = 100; G.reason = ""; G.time = 0; G.zone = 0;
  G.weltall = null; G.abspann = null; G.geschafft = false;
  G.heli = null;
  for (const h of HELIS) h.genutzt = false;
  // Berg und Zwischenbild des Abspanns gehören zur alten Welt – die ist weg
  PROFIL = null; ABKARTE = null;
  G.boost = 100; G.boosting = false; G.boostIdle = 0;
  G.airTime = 0; G.spinAcc = 0; G.touch = 0; trickAus(); G.trick.halt = 0;
  G.lastAng = Math.atan2(front.y - rear.y, front.x - rear.x);
  cans.clear();
  weatherReset();
  gefReset();
  GEIST.auf = []; GEIST.t = 0; GEIST.next = 0;
  ladeGeist();
  GRAVK = 1;
  cam.x = rear.x; cam.y = rear.y;
  IN.gas = IN.brake = IN.boost = false;
}

// Nach einem abgefangenen Sturz aufrecht neu absetzen
// Becken unter dieser Stelle (oder null)
function poolAt(x) {
  for (const r of RAVINES) if (r.lava && x > r.x1 && x < r.x2) return r;
  return null;
}

// Berührt das Bike gerade Lava? Liefert den Grund fürs Aus, sonst null.
function lavaTreffer() {
  for (const p of [rear, front]) {
    const r = poolAt(p.x);
    if (r && p.y - p.r < r.lavaY) return "🌋 In die Lava!";
  }
  const mx = bikeX(), my = (rear.y + front.y) / 2;
  for (const g of GEYSERS) {
    if (Math.abs(mx - g.x) > CFG.GEY_R + 10) continue;
    const s = geyserAt(g, G.time);
    if (s.hoehe > 0.05 && my - CFG.WHEEL_R < g.y + g.H * s.hoehe) return "🌋 Vom Geysir erwischt!";
  }
  return null;
}

// Stelle vor dem nächsten Hindernis, an der man wieder losfahren kann
function safeX(x) {
  for (let i = 0; i < 60; i++) {
    const r = poolAt(x) || RAVINES.find(v => v.lava && x > v.x1 - 120 && x < v.x2 + 120);
    const g = GEYSERS.find(v => Math.abs(x - v.x) < CFG.GEY_R + 90);
    if (!r && !g) return x;
    // weit genug vor die Schanze, dass wieder Anlauf möglich ist – direkt an
    // der Rampe abgesetzt rollt man ohne Tempo gleich wieder hinein
    x = r ? r.x1 - 650 : g.x - CFG.GEY_R - 140;
  }
  return x;
}


function respawn() {
  trickAus();
  const x = Math.max(60, safeX(rear.x - 40));
  rear.x = x; rear.y = terrainY(x) + CFG.WHEEL_R + 3;
  front.x = x + CFG.WHEELBASE; front.y = terrainY(x + CFG.WHEELBASE) + CFG.WHEEL_R + 3;
  rear.px = rear.x; rear.py = rear.y;
  front.px = front.x; front.py = front.y;
  body.px = body.x = 0; body.py = body.y = 0; seatBody();
  G.spinAcc = 0; G.airTime = 0; G.touch = 0;
  G.lastAng = Math.atan2(front.y - rear.y, front.x - rear.x);
  federReset();
}

function gameOver(reason) {
  if (G.state !== "play") return;
  G.state = "over";
  G.reason = reason;
  // Die stehengebliebene Trick-Zahl läuft nur im Spiel ab – sonst klebte sie
  // über dem Abschlussbild.
  trickAus(); G.trick.halt = 0;
  const sc = Math.floor(G.score);
  if (sc > G.best) {
    G.best = sc;
    try { localStorage.setItem(bestKey(), String(sc)); } catch (e) {}
    speichereGeist();        // der beste Lauf wird zum neuen Geist
  }
  G.earned = Math.floor(sc / 100);          // je 100 Punkte ein Coin
  if (G.earned > 0) { coins += G.earned; saveProgress(); }
  showOverlay(true);
}

/* Trifft das Bike im Flug die Kabine? Nur in der Luft – wer über den Boden
   rollt, soll nicht von unten eingesammelt werden. */
function heliFangen() {
  if (rear.grounded || front.grounded) return;
  const bx = (rear.x + front.x) / 2, by = (rear.y + front.y) / 2;
  for (const h of HELIS) {
    if (h.genutzt) continue;
    if (Math.abs(bx - h.x) > CFG.HELI_R) continue;
    if (Math.abs(by - h.y) > CFG.HELI_R * 0.85) continue;
    h.genutzt = true;
    /* Absetzpunkt: die erste Stelle weiter vorn, deren BODEN HELI_GEWINN Meter
       über dem Boden unter dem Fangpunkt liegt. Vom Bike aus gerechnet käme zu
       wenig heraus – gefangen wird ja in der Luft, abgesetzt aber am Boden.
       Danach noch ein flaches Fleckchen suchen, sonst rutscht man beim
       Aufsetzen sofort den Hang hinunter. */
    const ziel = terrainY(bx) + CFG.HELI_GEWINN * CFG.PPM;
    let zx = h.x + 900;
    for (let i = Math.ceil(h.x / TSTEP); i < TFIELD.length; i++)
      if (TFIELD[i] >= ziel) { zx = i * TSTEP; break; }
    // das FLACHSTE Fleckchen im Fenster nehmen, nicht das erste unter einer
    // Schwelle: fand die Suche nichts, blieb sonst der ursprüngliche Steilhang
    // stehen und man rutschte sofort wieder hinunter.
    let bx2 = zx, bs = Math.abs(slopeAt(zx));
    for (let k = 1; k <= 60 && bs > 0.18; k++) {
      const x = zx + k * TSTEP, s = Math.abs(slopeAt(x));
      if (s < bs) { bs = s; bx2 = x; }
    }
    zx = bx2;
    G.heli = { t: 0, x0: bx, y0: by, hx: h.x, hy: h.y,
               zx, zy: terrainY(zx) + CFG.WHEEL_R + 6 };
    G.airTime = 0; G.spinAcc = 0; trickAus();   // der Mitflug ist kein Salto
    toast("🚁 Mitflug! +" + CFG.HELI_GEWINN + " m");
    return;
  }
}

/* Der Heli zieht das Bike in einem Bogen nach oben und setzt es ab. Die
   Partikel werden direkt gesetzt und die Vorpositionen mitgeführt, sonst
   liest Verlet die Versetzung als Geschwindigkeit und das Bike schießt beim
   Absetzen davon. */
function heliFlug(dt) {
  const f = G.heli;
  f.t += dt;
  const u = Math.min(1, f.t / CFG.HELI_ZEIT);
  const e = smooth(u);
  const bx = f.x0 + (f.zx - f.x0) * e;
  // erst steigen, dann absetzen: der Bogen führt über den Absetzpunkt hinaus
  const bogen = Math.sin(Math.PI * u) * 260;
  const by = f.y0 + (f.zy - f.y0) * e + bogen;
  const hb = CFG.WHEELBASE / 2;
  rear.x = bx - hb; rear.y = by; front.x = bx + hb; front.y = by;
  rear.px = rear.x; rear.py = rear.y; front.px = front.x; front.py = front.y;
  seatBody(); body.px = body.x; body.py = body.y;
  rear.grounded = front.grounded = false;
  rear.sag = front.sag = rear.sagV = front.sagV = 0;
  G.lastAng = Math.atan2(front.y - rear.y, front.x - rear.x);
  if (fortschritt(by) > fortschritt(G.maxY)) {   // zählt schon während des Flugs
    G.score += (fortschritt(by) - fortschritt(G.maxY)) / CFG.PPM
             * (1 + fortschritt(G.maxY) / (CFG.PPM * 100)) * MOD.score;
    G.maxY = by;
  }
  const k = Math.min(1, dt * 4.5);          // Kamera wie sonst hinterher
  cam.x += (bx - cam.x) * k;
  cam.y += (by + 50 - cam.y) * k;
  if (u >= 1) { G.heli = null; federReset(); }
}

function update(dt) {
  if (G.state !== "play") return;
  G.time += dt;

  // Boost: verbraucht sich schnell, lädt nach kurzer Pause wieder auf
  G.boosting = IN.boost && G.boost > 0;
  if (G.boosting) {
    const drain = CFG.BOOST_DRAIN * (MOD.ult === "zweiterAtem" ? 0.66 : 1);
    G.boost = Math.max(0, G.boost - drain * dt);
    G.boostIdle = 0;
  } else {
    G.boostIdle += dt;
    if (G.boostIdle > CFG.BOOST_DELAY) {
      const chg = CFG.BOOST_CHARGE * (MOD.ult === "kickstart" ? 2 : 1);
      G.boost = Math.min(100, G.boost + chg * dt);
    }
  }
  if (DBG.boost) G.boost = 100;      // Testmodus: Leiste bleibt voll

  // Mitflug: solange der Heli trägt, ruht die Physik und das Bike wird an
  // seiner Kufe entlang zum Absetzpunkt gezogen.
  if (G.heli !== null) { heliFlug(dt); return; }

  // Wetter vor der Physik: Grip, Wind und Gravitation gelten für diesen Schritt.
  // Ein Blitz kann die Runde hier schon beenden.
  // Geisterspur mitschreiben – fester Takt, damit der Index die Zeit ist.
  // Nur im Rennmodus, sonst überschriebe ein normaler Lauf den Gegner.
  if (istGeistrennen()) {
    GEIST.t += dt;
    while (GEIST.t >= GEIST.next) {
      GEIST.auf.push(Math.round(bikeX()));
      GEIST.next += GEIST_DT;
    }
  }

  updateWeather(dt);
  if (G.state !== "play") return;
  updateGefahren(dt);
  if (G.state !== "play") return;

  const SUB = 2, h = dt / SUB;
  for (let i = 0; i < SUB; i++) step(h);
  federung(dt);
  heliFangen();

  const mx = (rear.x + front.x) / 2, my = (rear.y + front.y) / 2;
  const b = bodyDir();

  // Höhe & Punkte: höhere Meter sind mehr wert
  if (fortschritt(my) > fortschritt(G.maxY)) {
    const dm = (fortschritt(my) - fortschritt(G.maxY)) / CFG.PPM;
    G.score += dm * (1 + fortschritt(G.maxY) / (CFG.PPM * 100)) * MOD.score;
    G.maxY = my;
    // Gebietswechsel melden. Es zählt der weiteste erreichte Übergang, damit
    // beim Auf und Ab an einer Grenze nicht dauernd dieselbe Meldung kommt.
    while (G.zone < ZONES.length && fortschritt(my) > fortschritt(ZONES[G.zone].y)) {
      const z = ZONES[G.zone++];
      toast(z.icon + " " + z.name + " · " +
            Math.round(fortschritt(z.y) / CFG.PPM) + " m");
    }
  }

  // Flips. Ein kurzes Aufsetzen mitten im Sprung – ein Rad streift eine Kuppe,
  // das Bike hüpft weiter – darf die Zählung nicht beenden: sonst wird die
  // Drehung davor und danach nie zusammengerechnet und der Bonus fällt aus.
  // Gemessen ging so jeder sechste Flip verloren. Erst wenn das Bike LAND_GRACE
  // Sekunden am Boden bleibt, gilt der Sprung als beendet.
  // Gezählt wird der tatsächlich zurückgelegte Winkel, nicht das Integral einer
  // geschätzten Drehrate: letzteres lag um ein paar Prozent daneben, und genau
  // daran scheiterten die knappen Flips bei 1,00–1,03 Umdrehungen.
  const winkel = Math.atan2(front.y - rear.y, front.x - rear.x);
  let dW = winkel - G.lastAng;
  while (dW > Math.PI) dW -= Math.PI * 2;
  while (dW < -Math.PI) dW += Math.PI * 2;
  G.lastAng = winkel;

  const air = !rear.grounded && !front.grounded;
  if (air) {
    G.airTime += dt;
    G.spinAcc += dW;
    G.touch = 0;
  } else if (G.airTime > 0) {
    G.touch += dt;
    G.spinAcc += dW;                      // Drehung während des Streifens zählt mit
    if (G.touch >= CFG.LAND_GRACE) {
      const umdr = Math.abs(G.spinAcc) / (Math.PI * 2);
      const flips = umdr >= CFG.FLIP_MIN ? Math.floor(umdr - CFG.FLIP_MIN) + 1 : 0;
      if (flips > 0 && G.airTime > 0.4) {
        const bonus = Math.round(20 * flips * flips * MOD.flip * MOD.score);  // Höhe bleibt die Hauptquelle
        G.score += bonus;
        toast((G.spinAcc > 0 ? "Backflip" : "Frontflip") + (flips > 1 ? " ×" + flips : "") + "  +" + bonus);
      }
      G.spinAcc = 0; G.airTime = 0; G.touch = 0;
    }
  }

  updateTrick(dt);

  // Sprit – Boost schluckt doppelt (und gibt auch ohne Gas Schub). Im
  // Weltraum-Finale läuft er nicht weiter, sonst reißt ein leerer Tank den
  // Abspann mittendrin ab.
  const gasOn = IN.gas || G.boosting;
  if (G.weltall === null && !DBG.tank)
    G.fuel -= (CFG.FUEL_IDLE + (gasOn ? CFG.FUEL_GAS : 0))
            * (G.boosting ? CFG.BOOST_FUEL : 1) * MOD.fuel * dt;
  if (DBG.tank) G.fuel = 100;
  const k0 = Math.max(0, Math.floor((mx - 1500) / CFG.CAN_SPACING));
  for (let k = k0; k <= k0 + 4; k++) {
    if (cans.get(k)) continue;
    const c = canPos(k);
    if (Math.hypot(c.x - mx, c.y - my) < 44) {
      cans.set(k, true);
      const menge = Math.round(CFG.FUEL_CAN * (MOD.ult === "kanisterjaeger" ? 1.5 : 1));
      G.fuel = Math.min(100, G.fuel + menge);
      toast("+" + menge + "% Sprit");
    }
  }
  if (G.fuel <= 0) { G.fuel = 0; gameOver("Kein Sprit mehr!"); return; }

  // Weltraum-Finale: ab dem Gipfel schwebt man schwerelos weiter, während sich
  // Fahrer und Bike in ein Sternbild verwandeln – danach ist der Lauf zu Ende,
  // aber gewonnen.
  if (G.abspann !== null) {
    // Rückblick: die Physik ruht, nur noch die Uhr läuft
    G.abspann += dt;
    if (G.abspann >= CFG.ABSPANN_ZEIT) {
      G.geschafft = true;
      gameOver(istMeer() ? "💥 Vom Druck zerquetscht!" : "✨ Ein neues Sternbild!");
    }
    return;
  }
  if (G.weltall !== null) {
    G.weltall += dt;
    if (G.weltall >= (istMeer() ? CFG.WELTALL_ZEIT * 0.6 : CFG.WELTALL_ZEIT)) {
      G.abspann = 0;
      el("hud").classList.add("weg");            // Anzeigen aus dem Bild nehmen
      el("pads").classList.add("hidden");
      boostBox.classList.add("hidden");
      return;
    }
  /* Am Berg springt man über die Gipfelhöhe hinaus, im Meer steht man auf dem
     Grund und kommt nie darunter – dort zählt daher schon das Aufsetzen, mit
     der Radhöhe als Spielraum. */
  } else if (fortschritt(my) >= CFG.GIPFEL - (istMeer() ? CFG.WHEEL_R * 3 : 0)) {
    G.weltall = 0;
    trickAus();          // eine laufende Nummer geht im Finale unter
  }

  // Crash: Kopf berührt den Boden
  const hx = mx + b.ux * CFG.HEAD_H, hy = my + b.uy * CFG.HEAD_H;
  if (hy < groundUnder(hx, my) && !DBG.god) {
    if (G.lives > 0) { G.lives--; respawn(); toast("🛡 Schutzengel!"); }
    else { gameOver("Aua – Kopfaufschlag!"); return; }
  }

  // Lava: Becken und Geysirsäule. Beides ist sofort aus – deshalb setzt der
  // Schutzengel hier vor das Hindernis zurück und nicht mitten hinein.
  if (!DBG.god) {
    const grund = lavaTreffer();
    if (grund) {
      if (G.lives > 0) { G.lives--; respawn(); toast("🛡 Schutzengel!"); }
      else { gameOver(grund); return; }
    }
  }

  // Kamera
  const vx = (rear.x - rear.px) / h;
  const tX = mx + Math.max(-120, Math.min(240, vx * 0.28));
  const tY = my + 50;
  const k = Math.min(1, dt * 4.5);
  cam.x += (tX - cam.x) * k;
  cam.y += (tY - cam.y) * k;
}
