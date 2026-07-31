"use strict";
/* Die Schleife
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
reset();
showOverlay(false);

let last = performance.now(), acc = 0;
const FIXED = 1 / 60;

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;          // Tab war im Hintergrund
  acc += dt;
  let guard = 0;
  while (acc >= FIXED && guard++ < 6) { update(FIXED); acc -= FIXED; }
  draw();
  updateHUD();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
