"use strict";
/* Tastatursteuerung des Spiels
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
const isGasKey   = k => k === "ArrowRight" || k === "ArrowUp" || k === "d" || k === "D";
const isBrakeKey = k => k === "ArrowLeft" || k === "ArrowDown" || k === "a" || k === "A";
const isBoostKey = k => k === " " || k === "Spacebar";

addEventListener("keydown", e => {
  if (e.repeat) return;
  const k = e.key;
  if (k === "+" || k === "*") { e.preventDefault(); toggleDbg(); return; }
  if (DBG.on && dbgKey(k)) { e.preventDefault(); return; }
  if (isGasKey(k))   { IN.gas = true; padR.classList.add("on"); e.preventDefault(); }
  if (isBrakeKey(k)) { IN.brake = true; padL.classList.add("on"); e.preventDefault(); }
  if (isBoostKey(k)) {
    e.preventDefault();
    if (G.state === "play") { IN.boost = true; boostBox.classList.add("on"); }
    else start();
  }
  if ((k === "r" || k === "R") && G.state !== "menu") start();
  if (k === "Enter" && G.state !== "play") start();
});
addEventListener("keyup", e => {
  const k = e.key;
  if (isGasKey(k))   { IN.gas = false; padR.classList.remove("on"); }
  if (isBrakeKey(k)) { IN.brake = false; padL.classList.remove("on"); }
  if (isBoostKey(k)) { IN.boost = false; boostBox.classList.remove("on"); }
});
addEventListener("blur", () => {
  IN.gas = IN.brake = IN.boost = false;
  padL.classList.remove("on"); padR.classList.remove("on"); boostBox.classList.remove("on");
});
