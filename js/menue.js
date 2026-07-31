"use strict";
/* Startauswahl: Kategorie und Modus, und das Hochfahren beim Laden
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* Untermenüs: alles mit data-auf schaltet die Ansicht des Panels um. */
function zeigeAnsicht(name) {
  el("panel").dataset.ansicht = name;
  el("overlay").scrollTop = 0;
  // Die Gesichter werden auf die Breite ihres Rahmens zugeschnitten, und die
  // steht erst fest, wenn die Karten sichtbar sind – vorher ist sie 0.
  if (name === "fahrer") CHARS.forEach(paintAvatar);
}
for (const b of document.querySelectorAll("[data-auf]"))
  b.addEventListener("click", () => zeigeAnsicht(b.dataset.auf));

/* Zweistufige Auswahl: Kategorie oben, Modus darunter. Die Wahl gilt erst für
   den nächsten Lauf und wird gemerkt; Rekord und HUD stellen sich sofort um. */
const KURZ = { einfach: "500 m · zahm", normal: "1000 m · alles",
               geist: "gegen den Bestlauf", meer: "1000 m tief" };

function renderKat() {
  const kw = el("katWahl");
  kw.innerHTML = "";
  for (const k of KATEGORIEN) {
    const b = document.createElement("button");
    b.className = "kat" + (k.key === KAT ? " on" : "");
    b.textContent = k.icon + " " + k.name;
    b.onmousedown = e => e.preventDefault();
    b.onclick = () => {
      if (G.state === "play") return;
      KAT = k.key;
      try { localStorage.setItem("hcb.kat", KAT); } catch (e) {}
      // erster Modus der Kategorie, falls der aktuelle nicht dazugehört
      if (!k.grade.includes(GRAD)) { setzeGrad(k.grade[0]); applyBuffs(); }
      renderKat(); renderGrad(); renderCard();
    };
    kw.appendChild(b);
  }
}

function renderGrad() {
  const kat = KATEGORIEN.find(k => k.key === KAT) || KATEGORIEN[0];
  const gw = el("gradWahl");
  gw.innerHTML = "";
  for (const g of kat.grade) {
    const r = GRADE[g];
    const b = document.createElement("button");
    b.className = "grad" + (g === GRAD ? " on" : "");
    b.innerHTML = "<b>" + r.icon + " " + r.name + "</b><span>" + (KURZ[g] || "") + "</span>";
    b.onmousedown = e => e.preventDefault();
    b.onclick = () => {
      if (G.state === "play") return;
      setzeGrad(g); applyBuffs();          // Leben hängen am Modus
      renderGrad(); renderCard();
    };
    gw.appendChild(b);
  }
  el("gradText").textContent = G_REGEL.text;
  updateHUD();
}

try { setzeGrad(localStorage.getItem("hcb.grad") || "normal"); } catch (e) { setzeGrad("normal"); }
try { KAT = localStorage.getItem("hcb.kat") || katVon(GRAD); } catch (e) { KAT = katVon(GRAD); }
// gespeicherte Kategorie und Modus können auseinanderlaufen – Modus gewinnt
if (!(KATEGORIEN.find(k => k.key === KAT) || {}).grade?.includes(GRAD)) KAT = katVon(GRAD);
renderKat(); renderGrad();

el("btn").addEventListener("click", start);
