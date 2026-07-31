"use strict";
/* Die Reihenfolge des Bildes – was liegt vor was
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
function draw() {
  if (istMeer()) { drawMeer(); return; }
  const alt = Math.min(1, Math.max(0, cam.y) / 9000);
  drawSky(alt);
  drawDeepSky();           // Galaxien und Schwarze Löcher, ganz hinten
  drawIcePeaks();          // hinter allem: Horizont der Eiszone
  drawClouds(alt);
  // Ferne Kette: nur Wald, klein und blass. Nähere Kette: größere Bäume und
  // Häuser – die dunklere Farbe holt sie optisch nach vorn.
  drawRidge(0.22, 420, 300, mix([120, 150, 185], [30, 38, 72], alt));
  // Häuser auch auf der fernen Kette: die nähere sinkt schon nach ~45 m aus dem
  // Bild, die ferne trägt das Dorf bis weit in den Aufstieg hinein.
  drawProps(alt, 0.22, 420, 300,
            { step: 78, dens: 0.5, sz: 0.62, seed: 11.3,
              baum: [96, 124, 158], wand: [150, 160, 178], dach: [118, 112, 122] });
  // ganz kleine, vereinzelte Gestalten auf dem fernen Kamm
  drawKammLeute(alt, 0.22, 420, 300, { lstep: 520, ldens: 0.34, lsz: 0.26, seed: 11.3 });
  // Dunst liegt zwischen den Ketten, nicht über beiden: sonst verliert auch der
  // Wald der vorderen Kette seinen Kontrast und wird zu grauem Brei.
  drawHaze(alt);
  drawRidge(0.45, 300, 120, mix([92, 122, 158], [22, 28, 58], alt));
  drawProps(alt, 0.45, 300, 120,
            { step: 96, dens: 0.62, sz: 1, hsz: 1.9, seed: 4.7, laub: true,
              baum: [58, 86, 114], wand: [128, 134, 142], dach: [92, 76, 78] });
  drawKammLeute(alt, 0.45, 300, 120, { lstep: 430, ldens: 0.36, lsz: 0.46, seed: 4.7 });
  drawKirche(0.45, 300, 120, alt);
  drawVoegel();           // fliegen vor den Ketten, sonst verschluckt sie der Berg
  drawTerrain();
  drawDorf(alt);          // Startdorf steht auf dem Gelände, hinter dem Bike
  drawLeute(false);       // Leute laufen vor den Häusern, nicht dahinter
  drawLava();             // in der Kerbe, also vor dem Gelände
  drawWallMarks();
  drawJumps();
  drawGeysers();
  drawBridges();
  drawCans();
  drawHelis();            // schweben über dem Gelände
  drawTornado();          // vor dem Gelände, aber hinter dem Bike
  drawGeist();            // hinter dem eigenen Bike, damit es vorn bleibt
  drawBike();
  drawGefahren();         // Adler, Fangstrahl und Komet vor dem Bike
  drawSternbild();        // Finale: tritt hervor, während das Bike verblasst
  drawIceDust();          // Kristalle in der Luft, direkt vor der Kamera
  drawWeather();
  drawAbspann();          // legt sich am Schluss über alles
}
