"use strict";
/* Anzeigen, Meldungen und das Overlay über dem Spiel
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
const el = id => document.getElementById(id);
const fuelFill = el("fuelFill"), boostFill = el("boostFill"), toastEl = el("toast");
let toastTimer = 0;

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1100);
}

function updateHUD() {
  const mx = (rear.x + front.x) / 2;
  const h = Math.max(0, fortschritt(G.maxY) / CFG.PPM);
  const spd = Math.abs((rear.x - rear.px) * 120) / CFG.PPM * 3.6;
  el("hHeight").innerHTML = Math.floor(h) + '<small> m</small>';
  el("hHeightLbl").textContent = istMeer() ? "Tiefe" : "Höhe";
  el("hScore").textContent = Math.floor(G.score);
  el("hBest").textContent = G.best;
  el("hSpeed").textContent = Math.round(spd);
  el("hLives").style.display = G.lives > 0 ? "" : "none";
  /* Abstand zum Geist in Metern Fortschritt – nicht in x, denn im Meer zählt
     die Tiefe. Positiv heißt: man liegt vorn. */
  const gx = geistX();
  const ge = el("hGeist");
  if (gx === null) ge.style.display = "none";
  else {
    const d = (fortschritt((rear.y + front.y) / 2) - fortschritt(terrainY(gx))) / CFG.PPM;
    ge.style.display = "";
    ge.textContent = "👻 " + (d >= 0 ? "+" : "−") + Math.abs(Math.round(d)) + " m";
    ge.style.color = d >= 0 ? "#7ee0a1" : "#ffb4a2";
  }
  /* Wheelie/Stoppie: die Zahl läuft mit, solange die Nummer steht, und bleibt
     danach noch kurz stehen – bei zwei Zehntel Fahrzeit wäre sie sonst weg,
     bevor man sie gelesen hat. */
  const tr = G.trick, trEl = el("trick");
  const laeuft = tr.art !== null && tr.t >= CFG.TRICK_START;
  if (laeuft || tr.halt > 0) {
    const art = laeuft ? tr.art : tr.hArt;
    const wert = laeuft ? Math.floor(tr.punkte) : tr.wert;
    // "block", nicht "": die Grundregel steht auf display:none, ein Leerstring
    // würde genau dorthin zurückfallen.
    trEl.style.display = "block";
    trEl.textContent = trickName(art) + "  +" + wert;
    trEl.classList.toggle("fertig", !laeuft);
    trEl.classList.toggle("voll", laeuft && tr.punkte >= CFG.TRICK_CAP - 0.5);
    trEl.style.opacity = laeuft ? 1 : Math.min(1, tr.halt / 0.35);
  } else trEl.style.display = "none";

  fuelFill.style.width = G.fuel + "%";
  fuelFill.classList.toggle("low", G.fuel < 25);
  boostFill.style.width = G.boost + "%";
  boostBox.classList.toggle("full", G.boost > 99);

  const wk = WKIND[WEA.kind];
  el("weaCard").style.display = wk ? "" : "none";
  if (wk) el("weaName").textContent = wk.icon + " " + wk.name;
  if (DBG.on) el("dState").textContent = dbgStatus();
  void mx;
}

function showOverlay(isOver) {
  el("overlay").classList.remove("hidden");
  el("pads").classList.add("hidden");
  boostBox.classList.add("hidden");
  el("stats").classList.toggle("show", !!isOver);
  el("panel").classList.toggle("ende", !!isOver);   // steuert die knappen Handy-Layouts
  document.querySelector(".tips").style.display = isOver ? "none" : "";   // nach dem Crash unnötig
  if (isOver) {
    el("title").innerHTML = G.reason;
    el("sub").textContent = G.geschafft
      ? (istMeer()
          ? CHARS[charIdx].name + " ist " + Math.round(CFG.GIPFEL / CFG.PPM)
            + " m tief bis auf die Grabensohle gekommen – dort hat der Druck "
            + "Bike und Anzug zusammengedrückt. Tiefer geht es nicht."
          : CHARS[charIdx].name + " hat den Gipfel auf " + Math.round(CFG.GIPFEL / CFG.PPM)
            + " m genommen, ist ins All abgesprungen und steht jetzt als Sternbild "
            + "am Himmel. Höher geht es nicht.")
      : CHARS[charIdx].name +
        " braucht mehr Anlauf aus dem Tal – und in der Luft die Nase flach halten.";
    el("panel").classList.toggle("geschafft", !!G.geschafft);
    el("sHeight").innerHTML = Math.floor(fortschritt(G.maxY) / CFG.PPM) + '<small> m</small>';
    el("sHeightLbl").textContent = istMeer() ? "Tiefe" : "Höhe";
    el("sScore").textContent = Math.floor(G.score);
    el("sCoins").textContent = "+" + (G.earned || 0);
    el("sBest").textContent = G.best;
    el("btn").textContent = "Nochmal";
  } else {
    el("title").innerHTML = 'Hill Climb <em>Bike</em>';
    el("btn").textContent = "Losfahren";
  }
  renderCard();          // Coinstand und Upgrade-Knopf aktualisieren
}

function start() {
  reset();
  G.state = "play";
  el("hud").classList.remove("weg");
  el("overlay").classList.add("hidden");
  el("pads").classList.remove("hidden");
  boostBox.classList.remove("hidden");
}
