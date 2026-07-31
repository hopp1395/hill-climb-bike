"use strict";
/* Fahrer, Level, Fähigkeiten und ihre Karten im Menü
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* =========================================================================
   FAHRER – Bilder aus dem Ordner charaktere/, dazu Level und Fähigkeiten.
   Jeder Fahrer hat einen Bonus, der über 5 Level wächst, und ab Level 5
   zusätzlich eine Spezialfähigkeit. Bezahlt wird mit Coins (100 Punkte = 1).
   Neuen Fahrer hinzufügen: Bild ablegen und hier einen Eintrag ergänzen.
   ========================================================================= */
const CHAR_DIR = "charaktere/";
const MAXLV = 5;
const LV_COST = [1, 2, 4, 6];        // Coins für Level 2, 3, 4, 5

const up = v => "+" + Math.round((v - 1) * 100) + " %";
const dn = v => "−" + Math.round((1 - v) * 100) + " %";

const CHARS = [
  { name: "Alex", file: "Alex_head_512.png",
    buff: { icon: "🐐", title: "Bergziege", stat: "snowGrip",
            lv: [1.04, 1.08, 1.12, 1.16, 1.19],
            text: v => up(v) + " Grip im Schnee" },
    ult: { key: "krallen", icon: "🧗", title: "Krallen",
           text: "Rollt an steilen Hängen nicht mehr zurück." } },

  { name: "Domi", file: "Domi_head_512.png",
    buff: { icon: "⚡", title: "Turbo", stat: "acc",
            lv: [1.04, 1.08, 1.11, 1.15, 1.18],
            text: v => up(v) + " Motorleistung" },
    ult: { key: "kickstart", icon: "🔌", title: "Kickstart",
           text: "Die Boost-Leiste lädt doppelt so schnell nach." } },

  { name: "Jan", file: "Jan.png",
    buff: { icon: "⛽", title: "Sparfuchs", stat: "fuel",
            lv: [0.94, 0.88, 0.81, 0.75, 0.68],
            text: v => dn(v) + " Spritverbrauch" },
    ult: { key: "kanisterjaeger", icon: "🛢", title: "Kanisterjäger",
           text: "Jeder Kanister gibt die Hälfte mehr Sprit." } },

  { name: "Maxi", file: "Maxi_head_512.png",
    buff: { icon: "🌀", title: "Luftakrobat", stat: "torqueAir",
            lv: [1.12, 1.23, 1.34, 1.45, 1.55],
            text: v => up(v) + " Drehmoment in der Luft" },
    ult: { key: "stuntfahrer", icon: "🎪", title: "Stuntfahrer",
           text: "Doppelte Punkte für jeden Flip." } },

  { name: "Nilo", file: "Nilo.png",
    buff: { icon: "💨", title: "Rückenwind", stat: "maxSpd",
            lv: [1.05, 1.09, 1.13, 1.18, 1.22],
            text: v => up(v) + " Höchstgeschwindigkeit" },
    ult: { key: "zweiterAtem", icon: "🌬", title: "Zweiter Atem",
           text: "Der Boost hält halb so lange durch – also 50 % länger." } },

  { name: "Phuc-Le", file: "Phuc-Le.png",
    buff: { icon: "🍀", title: "Glückspilz", stat: "score",
            lv: [1.02, 1.04, 1.06, 1.08, 1.10],
            text: v => up(v) + " Punkte" },
    ult: { key: "schutzengel", icon: "🛡", title: "Schutzengel",
           text: "Übersteht einen Sturz pro Runde und fährt weiter." } },

  /* Anna kommt ans Ende der Liste: Level und Freischaltungen liegen als Feld
     nach Index im Speicher, ein Einschieben würde alte Spielstände verschieben. */
  { name: "Anna", file: "Anna.jpeg",
    buff: { icon: "👁", title: "Falkenauge", stat: "warn",
            lv: [1.15, 1.30, 1.45, 1.60, 1.75],
            text: v => up(v) + " Vorwarnzeit bei Gefahren" },
    ult: { key: "vogelscheuche", icon: "🦅", title: "Vogelscheuche",
           text: "Adler greifen sie nicht mehr an." } },
];

const UNLOCK_COST = 10;
let charIdx = 0;                 // wer gefahren wird (immer freigeschaltet)
let viewIdx = 0;                 // wessen Karte gerade angezeigt wird
let coins = 0;
let levels = CHARS.map(() => 1);
let unlocked = CHARS.map((c, i) => i === 0);     // Alex ist von Anfang an dabei
try {
  coins = Math.max(0, parseInt(localStorage.getItem("hcb.coins") || "0", 10) || 0);
  const raw = JSON.parse(localStorage.getItem("hcb.levels") || "[]");
  if (Array.isArray(raw)) {
    raw.forEach((v, i) => {
      if (i < levels.length) levels[i] = Math.min(MAXLV, Math.max(1, parseInt(v, 10) || 1));
    });
  }
  const un = JSON.parse(localStorage.getItem("hcb.unlocked") || "[]");
  if (Array.isArray(un)) un.forEach((v, i) => { if (i > 0 && i < unlocked.length) unlocked[i] = !!v; });
  const s = localStorage.getItem("hcb.char");
  if (s !== null) {
    const i = Math.min(CHARS.length - 1, Math.max(0, parseInt(s, 10) || 0));
    if (unlocked[i]) charIdx = i;
  }
} catch (e) {}
viewIdx = charIdx;

function saveProgress() {
  try {
    localStorage.setItem("hcb.coins", String(coins));
    localStorage.setItem("hcb.levels", JSON.stringify(levels));
    localStorage.setItem("hcb.unlocked", JSON.stringify(unlocked));
    localStorage.setItem("hcb.char", String(charIdx));
  } catch (e) {}
}

// Aktive Boni der gewählten Figur (1 = neutral), wird in reset() gesetzt.
const MOD = { acc: 1, snowGrip: 1, fuel: 1, torqueAir: 1, flip: 1, maxSpd: 1, score: 1,
              warn: 1, lives: 0, ult: "" };
function applyBuffs() {
  MOD.acc = MOD.snowGrip = MOD.fuel = MOD.torqueAir = MOD.flip = MOD.maxSpd = MOD.score = 1;
  MOD.warn = 1;
  MOD.lives = 0; MOD.ult = "";
  const c = CHARS[charIdx];
  if (!c) return;
  const lv = levels[charIdx];
  MOD[c.buff.stat] = c.buff.lv[lv - 1];
  if (lv >= MAXLV) {
    MOD.ult = c.ult.key;
    if (MOD.ult === "stuntfahrer") MOD.flip = 2;
    if (MOD.ult === "schutzengel") MOD.lives = 1;
  }
  G.lives = MOD.lives + G_REGEL.leben;   // der leichte Grad gibt zwei dazu
}

// Quadratischer Ausschnitt ums Gesicht – funktioniert für freigestellte
// Köpfe (512²) wie für Hochkant-Fotos.
function faceCrop(img) {
  const w = img.naturalWidth, h = img.naturalHeight;
  const s = Math.min(w, h) * 0.82;
  const cy = Math.min(h - s / 2, Math.max(s / 2, h * 0.44));
  return { s, x: w / 2 - s / 2, y: cy - s / 2 };
}

/* Schneidet das Gesicht in einen beliebigen runden Rahmen – die Kartenreihe im
   Untermenü und die Fahrerzeile in der Hauptansicht sind verschieden groß. */
function malAvatar(pic, c) {
  if (!pic || !c.ok || !c.img) return;
  const cr = faceCrop(c.img), k = (pic.clientWidth || 50) / cr.s;
  pic.textContent = "";
  pic.style.backgroundImage = 'url("' + CHAR_DIR + encodeURIComponent(c.file) + '")';
  pic.style.backgroundSize = (c.img.naturalWidth * k) + "px " + (c.img.naturalHeight * k) + "px";
  pic.style.backgroundPosition = (-cr.x * k) + "px " + (-cr.y * k) + "px";
}

function paintAvatar(c) {
  if (!c.el || !c.ok) return;
  malAvatar(c.el.querySelector(".pic"), c);
  if (c === CHARS[charIdx]) malAvatar(document.getElementById("zPic"), c);
}

function selectChar(i) {
  viewIdx = i;
  if (unlocked[i]) {                 // Gesperrte kann man nur ansehen, nicht fahren
    charIdx = i;
    try { localStorage.setItem("hcb.char", String(i)); } catch (e) {}
    applyBuffs();
  }
  CHARS.forEach((c, k) => {
    if (!c.el) return;
    c.el.classList.toggle("sel", k === charIdx);
    c.el.classList.toggle("view", k === viewIdx && k !== charIdx);
    c.el.classList.toggle("locked", !unlocked[k]);
  });
  renderCard();
}

function el2(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}

// Karte des gewählten Fahrers: Bonus, Level-Leiste, Upgrade, Max-Fähigkeit
/* Die Hauptansicht zeigt vom Fahrer nur eine Zeile: Bild, Name, laufender Buff
   und Coinstand. Wer mehr will, tippt sie an und landet im Untermenü. */
function renderFahrerZeile() {
  const nm = document.getElementById("zName");
  if (!nm) return;
  const c = CHARS[charIdx], b = c.buff, lv = levels[charIdx];
  nm.textContent = c.name;
  document.getElementById("zBuff").textContent =
    b.icon + " " + b.title + " · Level " + lv + " / " + MAXLV;
  document.getElementById("zCoins").textContent = coins;
  const pic = document.getElementById("zPic");
  if (pic && !c.ok) pic.textContent = c.name[0];      // Fallback ohne Bild
  malAvatar(pic, c);
}

function renderCard() {
  renderFahrerZeile();
  const box = document.getElementById("buff");
  if (!box) return;
  const i = viewIdx, c = CHARS[i], lv = levels[i], b = c.buff, frei = unlocked[i];
  const cnt = document.getElementById("coinCount");
  if (cnt) cnt.textContent = coins;

  box.innerHTML = "";
  box.classList.toggle("locked", !frei);

  const top = el2("div", "bTop");
  top.append(el2("b", null, b.icon + " " + b.title),
             el2("span", "bLv", frei ? "Level " + lv + " / " + MAXLV : "🔒 " + c.name + " gesperrt"));
  box.append(top);

  const pips = el2("div", "pips");
  for (let k = 0; k < MAXLV; k++) pips.append(el2("div", "pip" + (frei && k < lv ? " on" : "")));
  box.append(pips);

  box.append(el2("div", "bDesc", frei
    ? b.text(b.lv[lv - 1]) + (lv < MAXLV ? "  →  " + b.text(b.lv[lv]) + " auf Level " + (lv + 1) : "")
    : "Startet mit " + b.text(b.lv[0]) + ", ausbaubar bis " + b.text(b.lv[MAXLV - 1]) + "."));

  const btn = el2("button", null);
  btn.id = "upBtn";
  if (!frei) {
    btn.textContent = "Freischalten · " + UNLOCK_COST + " 🪙";
    btn.disabled = coins < UNLOCK_COST;
    btn.addEventListener("click", ev => {
      ev.stopPropagation();
      if (coins < UNLOCK_COST || unlocked[i]) return;
      coins -= UNLOCK_COST;
      unlocked[i] = true;
      saveProgress();
      selectChar(i);                 // gleich übernehmen
    });
  } else if (lv >= MAXLV) {
    btn.textContent = "Voll ausgebaut";
    btn.disabled = true;
  } else {
    const cost = LV_COST[lv - 1];
    btn.textContent = "Upgrade · " + cost + " 🪙";
    btn.disabled = coins < cost;
    btn.addEventListener("click", ev => {
      ev.stopPropagation();
      if (coins < cost || levels[i] >= MAXLV) return;
      coins -= cost;
      levels[i]++;
      saveProgress();
      applyBuffs();
      renderCard();
    });
  }
  box.append(btn);

  const u = c.ult;
  const ult = el2("div", "bUlt" + (frei && lv >= MAXLV ? " on" : ""));
  ult.append(el2("b", null, u.icon + " " + u.title),
             el2("span", null, " — " + u.text +
                 (frei && lv >= MAXLV ? "" : "  (ab Level " + MAXLV + ")")));
  box.append(ult);
}

(function buildChars() {
  const box = document.getElementById("chars");
  CHARS.forEach((c, i) => {
    const d = document.createElement("div");
    d.className = "char";
    const pic = document.createElement("div");
    pic.className = "pic";
    pic.textContent = c.name[0];            // Fallback, bis das Bild da ist
    const nm = document.createElement("div");
    nm.className = "nm";
    nm.textContent = c.name;
    const lock = document.createElement("div");
    lock.className = "lock";
    lock.textContent = "🔒";
    d.append(pic, nm, lock);
    d.addEventListener("click", () => selectChar(i));
    box.appendChild(d);
    c.el = d;

    const im = new Image();
    im.onload = () => { c.ok = im.naturalWidth > 0; paintAvatar(c); };
    im.onerror = () => { c.ok = false; };    // fehlt die Datei -> gelber Helm
    im.src = CHAR_DIR + encodeURIComponent(c.file);
    c.img = im;
  });
  // Avatargröße hängt an der Media-Query -> nach Größenänderung neu zuschneiden
  addEventListener("resize", () => CHARS.forEach(paintAvatar));
  selectChar(charIdx);
})();
