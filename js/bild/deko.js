"use strict";
/* Bewuchs, Meeresdeko, Sprungrampen, Lava und Geysire
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* ---- Bewuchs des Meeresgrundes ------------------------------------------
   Vier Sorten nach Tiefe: Seegras und Seesterne im Flachen, Korallen und
   Anemonen am Riff, Schwämme in der Dämmerzone, Röhrenwürmer mit Leuchtspitze
   im Dunkeln. Gezeichnet wird im Hangsystem P(q, l) wie beim Landbewuchs,
   damit alles senkrecht auf dem Grund steht. */
function meerDeko(ctx2, art, s, r1, r2, t, ph) {
  const c = (rgb, a) => rgba(rgb, a === undefined ? 1 : a);
  if (art === "gras") {
    ctx2.strokeStyle = c([96, 150, 92]); ctx2.lineCap = "round";
    for (let i = 0; i < 5; i++) {
      const h = (14 + r1 * 16) * (0.6 + i * 0.14);
      const w = Math.sin(t * 1.1 + ph + i) * 0.34;
      ctx2.lineWidth = 2.1 * s;
      ctx2.beginPath();
      ctx2.moveTo((i - 2) * 3.4 * s, 0);
      ctx2.quadraticCurveTo((i - 2) * 3.4 * s + w * h * 0.6 * s, -h * 0.6 * s,
                            (i - 2) * 3.4 * s + w * h * s, -h * s);
      ctx2.stroke();
    }
  } else if (art === "stern") {
    ctx2.fillStyle = c([214, 132, 96]);
    ctx2.beginPath();
    for (let i = 0; i < 10; i++) {
      const w = i * Math.PI / 5 - 1.57, r = (i % 2 ? 3 : 8) * s;
      i ? ctx2.lineTo(Math.cos(w) * r, Math.sin(w) * r * 0.5 - 2 * s)
        : ctx2.moveTo(Math.cos(w) * r, Math.sin(w) * r * 0.5 - 2 * s);
    }
    ctx2.closePath(); ctx2.fill();
  } else if (art === "koralle") {
    const farbe = r2 > 0.5 ? [226, 122, 140] : [232, 168, 92];
    ctx2.strokeStyle = c(farbe); ctx2.lineCap = "round";
    const H2 = (18 + r1 * 20) * s;
    ctx2.lineWidth = 3.4 * s;
    ctx2.beginPath(); ctx2.moveTo(0, 0); ctx2.lineTo(0, -H2 * 0.55); ctx2.stroke();
    ctx2.lineWidth = 2.6 * s;
    for (const d of [-1, 1]) {
      ctx2.beginPath();
      ctx2.moveTo(0, -H2 * 0.5);
      ctx2.quadraticCurveTo(d * H2 * 0.4, -H2 * 0.7, d * H2 * 0.34, -H2);
      ctx2.stroke();
      ctx2.beginPath();
      ctx2.moveTo(0, -H2 * 0.62);
      ctx2.quadraticCurveTo(d * H2 * 0.2, -H2 * 0.85, d * H2 * 0.08, -H2 * 1.1);
      ctx2.stroke();
    }
  } else if (art === "anemone") {
    const farbe = r2 > 0.5 ? [180, 128, 220] : [232, 140, 120];
    ctx2.fillStyle = c(farbe, 0.9);
    ctx2.beginPath(); ctx2.ellipse(0, -3 * s, 6 * s, 4 * s, 0, 0, 7); ctx2.fill();
    ctx2.strokeStyle = c(farbe, 0.75); ctx2.lineWidth = 1.6 * s; ctx2.lineCap = "round";
    for (let i = 0; i < 7; i++) {
      const w = -2.6 + i * 0.42 + Math.sin(t * 1.6 + ph + i) * 0.16;
      const l = (8 + r1 * 7) * s;
      ctx2.beginPath();
      ctx2.moveTo(0, -4 * s);
      ctx2.lineTo(Math.cos(w) * l, -4 * s + Math.sin(w) * l);
      ctx2.stroke();
    }
  } else if (art === "schwamm") {
    ctx2.fillStyle = c([132, 150, 158], 0.9);
    const H2 = (12 + r1 * 16) * s, B = (7 + r2 * 6) * s;
    ctx2.beginPath();
    ctx2.moveTo(-B * 0.6, 0);
    ctx2.quadraticCurveTo(-B, -H2 * 0.7, -B * 0.75, -H2);
    ctx2.lineTo(B * 0.75, -H2);
    ctx2.quadraticCurveTo(B, -H2 * 0.7, B * 0.6, 0);
    ctx2.closePath(); ctx2.fill();
    ctx2.fillStyle = c([40, 54, 66], 0.8);
    ctx2.beginPath(); ctx2.ellipse(0, -H2, B * 0.72, B * 0.26, 0, 0, 7); ctx2.fill();
  } else {                                   // Röhrenwurm mit Leuchtspitze
    ctx2.strokeStyle = c([148, 148, 156], 0.85); ctx2.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      const H2 = (14 + r1 * 22) * s * (0.7 + i * 0.2);
      const dx = (i - 1) * 4 * s;
      ctx2.lineWidth = 2.6 * s;
      ctx2.beginPath();
      ctx2.moveTo(dx, 0);
      ctx2.quadraticCurveTo(dx + Math.sin(t * 0.7 + ph + i) * 4 * s, -H2 * 0.6,
                            dx + Math.sin(t * 0.7 + ph + i) * 6 * s, -H2);
      ctx2.stroke();
      // Leuchtspitze aus zwei Kreisen statt eines Farbverlaufs: bei hunderten
      // Objekten im Bild kostet createRadialGradient je Segment zu viel.
      const gx2 = dx + Math.sin(t * 0.7 + ph + i) * 6 * s, gy2 = -H2;
      const puls = 0.5 + 0.5 * Math.sin(t * 2 + ph + i * 1.7);
      ctx2.fillStyle = c([80, 210, 210], 0.22 * puls);
      ctx2.beginPath(); ctx2.arc(gx2, gy2, 6 * s, 0, 7); ctx2.fill();
      ctx2.fillStyle = c([190, 255, 236], 0.9 * puls);
      ctx2.beginPath(); ctx2.arc(gx2, gy2, 2 * s, 0, 7); ctx2.fill();
    }
  }
}

function bewuchs(schattenLauf) {
  const xl = wxAt(-40), xr = wxAt(W + 40), BST = 34;
  for (let k = Math.floor(xl / BST); k <= Math.ceil(xr / BST); k++) {
    const r0 = hash(k * 1.91 + 0.7);
    // Etwas dichter angesetzt als früher: die Hanggrenzen weiter unten sieben
    // in den oberen Gebieten rund die Hälfte wieder aus.
    if (r0 > 0.85) continue;
    const wx = (k + hash(k * 4.3) * 0.8) * BST;
    const wy = terrainY(wx) - jumpRise(wx, true);

    /* Unter Wasser sind alle Gebietsanteile null, der Bewuchs bliebe also bis
       auf den Grund grünes Gras. Er dünnt hier stattdessen mit der Tiefe aus:
       Seegras im Flachen, ab der Dämmerzone blanker Fels. */
    if (istMeer()) {
      // Seegras und Korallen dünnen aus, Tiefseebewuchs bleibt bis unten
      const tief = -wy;
      const dicht = 0.45 + 0.55 * (1 - smooth((tief - CFG.ICELINE) /
                                              (CFG.SPACELINE - CFG.ICELINE)));
      if (r0 > 0.85 * dicht) continue;
      const sl2 = slopeAt(wx);
      if (Math.abs(sl2) > 1.2) continue;              // nicht an der Steilkante
      const r1m = hash(k * 6.1 + 5), r2m = hash(k * 8.9 + 3);
      const t2 = performance.now() / 1000, ph = hash(k * 3.3) * 6.28;
      // Sorte nach Tiefe, mit weichem Übergang über die Würfelzahl
      const f = Math.min(1, Math.max(0, tief / CFG.GIPFEL));
      let variante;
      if (f < 0.13)      variante = r1m < 0.72 ? "gras" : "stern";
      else if (f < 0.3)  variante = r1m < 0.45 ? "gras" : r1m < 0.8 ? "koralle" : "anemone";
      else if (f < 0.52) variante = r1m < 0.5 ? "koralle" : r1m < 0.82 ? "anemone" : "schwamm";
      else if (f < 0.75) variante = r1m < 0.55 ? "schwamm" : "wurm";
      else               variante = "wurm";
      if (schattenLauf) continue;                     // unter Wasser kein Schlagschatten
      const nl2 = Math.hypot(sl2, 1);
      const X2 = sx(wx), Y2 = sy(wy);
      const s2 = SCALE * (0.85 + hash(k * 7.3) * 0.6) * 1.25;
      ctx.save();
      ctx.translate(X2, Y2);
      ctx.rotate(Math.atan(sl2) * -1);                // steht senkrecht zum Grund
      // mit der Tiefe abdunkeln wie der Boden selbst
      ctx.globalAlpha = 0.55 + 0.45 * (1 - f);
      meerDeko(ctx, variante, s2, r1m, r2m, t2, ph);
      ctx.restore();
      ctx.globalAlpha = 1;
      continue;
    }

    // Gewichte der Stufen an dieser Stelle
    const eis = iceAt(wy), lava = lavaAt(wy), raum = spaceAt(wy);
    const oben = eis + lava + raum;
    const gruen = (1 - smooth((wy - CFG.SNOWLINE + 900) / 1100)) * (1 - oben);
    const schnee = Math.max(0, 1 - gruen - oben);
    // Nur eine Sorte je Stelle: die schwerste gewinnt, ausgelost über hash
    const wahl = hash(k * 5.7 + 2) * (gruen + schnee + eis + lava + raum);
    let art, kraft;
    if (wahl < gruen)                     { art = "gruen"; kraft = gruen; }
    else if (wahl < gruen + schnee)       { art = "schnee"; kraft = schnee; }
    else if (wahl < gruen + schnee + eis) { art = "eis"; kraft = eis; }
    else if (wahl < gruen + schnee + eis + lava) { art = "lava"; kraft = lava; }
    else                                  { art = "raum"; kraft = raum; }
    if (kraft < 0.05) continue;

    const sl = slopeAt(wx), nl = Math.hypot(sl, 1);
    const X = sx(wx), Y = sy(wy);
    const r1 = hash(k * 6.1 + 5);                  // zweite Würfelzahl je Stelle

    /* Welche Variante steht hier – und was verträgt sie?
       [höchstes Gefälle, senkrecht statt hangparallel]
       An Steilwänden wächst kein Baum und liegt keine Eisplatte; und was steht
       (Baum, Säule, Monolith), steht lotrecht und nicht rechtwinklig zum Hang. */
    let variante;
    if (art === "gruen")       variante = r0 < 0.2 ? "busch" : "gras";
    else if (art === "schnee") variante = r1 < 0.34 ? "tanne" : r1 < 0.7 ? "wehe" : "felsblock";
    else if (art === "eis")    variante = r1 < 0.4 ? "buckel" : r1 < 0.78 ? "kristall" : "flaeche";
    else if (art === "lava")   variante = r1 < 0.42 ? "block" : r1 < 0.8 ? "saeulen" : "schlot";
    else                       variante = r1 < 0.4 ? "findling" : r1 < 0.76 ? "mineral" : "monolith";
    // Was lotrecht steht, verträgt steilen Grund – ein Baum wächst auch aus
    // einer Flanke gerade nach oben. Eng wird es nur für Flachliegendes:
    // eine Schneewehe oder eine Eisplatte an einer Steilwand gibt es nicht.
    // Dritter Wert: halbe Standbreite (0 = zu klein für einen Schatten),
    // vierter: Höhe des Objekts – daraus wächst die Schattenlänge.
    const REGEL = {
      busch: [1.1, 0, 11, 22], gras: [1.4, 0, 0, 0],
      tanne: [0.95, 1, 17, 66], wehe: [0.6, 0, 0, 0], felsblock: [0.8, 0, 11, 13],
      buckel: [0.7, 0, 0, 0], kristall: [1.0, 0, 10, 23], flaeche: [0.4, 0, 0, 0],
      block: [0.85, 0, 12, 13], saeulen: [0.95, 1, 12, 28], schlot: [0.5, 0, 0, 0],
      findling: [0.85, 0, 13, 12], mineral: [0.9, 0, 10, 10], monolith: [0.95, 1, 8, 22],
    }[variante];
    if (Math.abs(sl) > REGEL[0]) continue;
    if (schattenLauf && !REGEL[2]) continue;

    // Im Tal sind Gras und Büsche in der richtigen Größe; weiter oben stehen
    // Fels, Eis und Kristall größer, sonst gehen sie im weiten Hang unter.
    const gross = { gruen: 1, schnee: 1.7, eis: 1.8, lava: 1.75, raum: 1.7 }[art];
    const s = SCALE * (0.8 + hash(k * 7.3) * 0.6) * gross;
    // Hangkoordinaten auf dem Bildschirm: q läuft längs der Oberfläche,
    // l steht senkrecht darauf – oder eben lotrecht, wenn die Sorte steht.
    const ux = REGEL[1] ? 0 : -sl / nl, uy = -1 / (REGEL[1] ? 1 : nl);
    const qx = REGEL[1] ? 1 : 1 / nl, qy = REGEL[1] ? 0 : -sl / nl;
    const P = (q, l) => [X + (qx * q + ux * l) * s, Y + (qy * q + uy * l) * s];
    const form = (punkte) => {                     // Vieleck in Hangkoordinaten
      ctx.beginPath();
      punkte.forEach(([q, l], i) => {
        const p = P(q, l);
        i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
      });
      ctx.closePath(); ctx.fill();
    };
    const hoch = (l) => P(0, l);

    if (schattenLauf) {
      // Die Sonne steht oben rechts: der Schatten zieht nach links, seine
      // Länge kommt aus der Objekthöhe. Maße von Formeinheiten in Weltpixel.
      const um = s / SCALE;
      schattenBand(wx, REGEL[2] * um, REGEL[3] * um, 0.26);
      continue;
    }

    if (art === "gruen") {
      if (r0 < 0.2) {                                // Busch
        ctx.fillStyle = rgba([62, 116, 66], 0.92 * kraft);
        ctx.beginPath();
        for (const [dx, dy, rr] of [[-7, 5, 9], [6, 7, 10], [0, 15, 9]]) {
          const p = hoch(dy);
          ctx.moveTo(p[0] + dx * s + rr * s, p[1]);
          ctx.arc(p[0] + dx * s, p[1], rr * s, 0, 7);
        }
        ctx.fill();
      } else {                                       // Grasbüschel
        ctx.strokeStyle = rgba([86, 150, 74], 0.85 * kraft);
        ctx.lineWidth = 2.4 * s; ctx.lineCap = "round";
        ctx.beginPath();
        for (const [nb, l] of [[-5, 13], [0, 18], [5, 12]]) {
          const fuss = hoch(0), spitz = hoch(l);
          ctx.moveTo(fuss[0], fuss[1]);
          ctx.lineTo(spitz[0] + nb * s, spitz[1]);
        }
        ctx.stroke();
        if (hash(k * 9.7) > 0.72) {                  // ab und zu eine Blume
          const p = hoch(17);
          ctx.fillStyle = rgba(hash(k * 2.2) > 0.5 ? [244, 214, 92] : [232, 132, 160], kraft);
          ctx.beginPath(); ctx.arc(p[0], p[1], 3.4 * s, 0, 7); ctx.fill();
        }
      }
    } else if (art === "schnee") {
      if (r1 < 0.34) {                               // Tanne mit vier Etagen
        ctx.fillStyle = rgba([62, 46, 34], 0.92 * kraft);
        form([[-3.5, -7], [3.5, -7], [3, 9], [-3, 9]]);        // Stamm
        ctx.fillStyle = rgba([40, 72, 58], 0.94 * kraft);
        form([[-17, 3], [-9, 21], [-13, 19],         // unterste Etage
              [-7, 37], [-10, 35],                   // zweite
              [-4.5, 51], [-6.5, 49],                // dritte
              [0, 66],                               // Spitze
              [6.5, 49], [4.5, 51],
              [10, 35], [7, 37],
              [13, 19], [9, 21], [17, 3]]);
        // Schnee liegt auf den Zweigspitzen, nicht als Kegel obendrauf
        ctx.fillStyle = rgba([240, 248, 253], 0.9 * kraft);
        for (const [q, l, b] of [[-17, 3, 7], [-13, 19, 5.5], [-10, 35, 4.5], [-6.5, 49, 3.5]]) {
          form([[q, l], [q + b, l + b * 1.9], [q + b * 1.5, l + b * 1.2]]);
          form([[-q, l], [-q - b, l + b * 1.9], [-q - b * 1.5, l + b * 1.2]]);
        }
        form([[-3, 57], [0, 66], [3, 57], [0, 60]]);           // Schnee auf der Spitze
      } else if (r1 < 0.7) {                         // Schneewehe
        ctx.fillStyle = rgba([240, 247, 253], 0.8 * kraft);
        const p = hoch(0);
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], 14 * s, 7 * s, Math.atan(sl), Math.PI, 2 * Math.PI);
        ctx.fill();
      } else {                                       // Felsblock mit Schneehaube
        ctx.fillStyle = rgba([104, 110, 120], 0.9 * kraft);
        form([[-9, -7], [-7, 8], [-2, 12], [5, 11], [9, 4], [8, -7]]);
        ctx.fillStyle = rgba([242, 248, 253], 0.9 * kraft);
        form([[-7.5, 8], [-2, 13.5], [5, 12], [5.5, 10], [-1.5, 11], [-6, 7]]);
      }
    } else if (art === "eis") {
      if (r1 < 0.4) {                                // Eisbuckel, glatt
        const p = hoch(0);
        const g = ctx.createLinearGradient(p[0], p[1] - 14 * s, p[0], p[1]);
        g.addColorStop(0, rgba([236, 252, 255], 0.9 * kraft));
        g.addColorStop(1, rgba([144, 202, 228], 0.85 * kraft));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], 15 * s, 11 * s, Math.atan(sl), Math.PI, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = rgba([255, 255, 255], 0.5 * kraft);   // Glanzlicht
        form([[-6, 5], [-2, 9], [1, 8], [-3, 4]]);
      } else if (r1 < 0.78) {                        // Kristallgruppe
        const g = ctx.createLinearGradient(X, Y - 24 * s, X, Y);
        g.addColorStop(0, rgba([240, 253, 255], 0.92 * kraft));
        g.addColorStop(1, rgba([138, 198, 226], 0.85 * kraft));
        ctx.fillStyle = g;
        form([[-8, -6], [-6, 11], [-3, -6]]);
        form([[-2, -6], [1, 23], [4, -6]]);
        form([[4, -6], [8, 14], [10, -6]]);
      } else {                                       // blanke Eisfläche
        ctx.fillStyle = rgba([176, 226, 244], 0.55 * kraft);
        const p = hoch(1);
        ctx.beginPath();
        ctx.ellipse(p[0], p[1], 17 * s, 3.6 * s, Math.atan(sl), 0, 7);
        ctx.fill();
      }
    } else if (art === "lava") {
      if (r1 < 0.42) {                               // Basaltblock mit glühendem Riss
        // deutlich heller als der Untergrund, sonst sieht man nur den Riss
        ctx.fillStyle = rgba([92, 74, 72], 0.96 * kraft);
        form([[-11, -7], [-9, 9], [-1, 13], [7, 10], [10, 2], [9, -7]]);
        // Lichtseite als Fläche, nicht als heller Strich – sonst sieht es aus
        // wie eine aufgemalte Klammer statt wie ein beleuchteter Stein
        ctx.fillStyle = rgba([112, 90, 86], 0.7 * kraft);
        form([[-9, 9], [-1, 13], [7, 10], [4, 5], [-1, 8], [-8, 5]]);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = rgba([255, 146, 52], 0.5 * kraft);
        ctx.lineWidth = 1.1 * s;
        const a = P(-6, 2), b = P(-1, 8), c = P(6, 5);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]);
        ctx.stroke();
        ctx.restore();
      } else if (r1 < 0.8) {                         // Basaltsäulen
        ctx.fillStyle = rgba([84, 68, 68], 0.96 * kraft);
        form([[-10, -7], [-10, 16], [-7, 19], [-4, 16], [-4, -7]]);
        form([[-3, -7], [-3, 25], [0, 28], [3, 25], [3, -7]]);
        form([[4, -7], [4, 13], [7, 16], [10, 13], [10, -7]]);
        ctx.fillStyle = rgba([126, 104, 98], 0.85 * kraft);   // Deckflächen
        form([[-10, 16], [-7, 19], [-4, 16], [-7, 14]]);
        form([[-3, 25], [0, 28], [3, 25], [0, 23]]);
        form([[4, 13], [7, 16], [10, 13], [7, 11]]);
      } else {                                       // Schlot, aus dem es qualmt
        ctx.fillStyle = rgba([88, 70, 68], 0.94 * kraft);
        form([[-8, -7], [-5, 10], [5, 10], [8, -7]]);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = rgba([255, 168, 70], 0.6 * kraft);
        const p = P(0, 10);
        ctx.beginPath(); ctx.ellipse(p[0], p[1], 5 * s, 2 * s, Math.atan(sl), 0, 7); ctx.fill();
        ctx.restore();
      }
    } else {
      if (r1 < 0.4) {                                // Findlinge, kantig
        ctx.fillStyle = rgba([74, 82, 112], 0.9 * kraft);
        form([[-12, -7], [-10, 7], [-4, 10], [-1, 4], [-2, -7]]);
        form([[1, -7], [2, 9], [8, 12], [12, 6], [11, -7]]);
        ctx.fillStyle = rgba([116, 128, 168], 0.75 * kraft);   // Lichtseite
        form([[2, 9], [8, 12], [12, 6], [9, 6], [5, 9]]);
      } else if (r1 < 0.76) {                        // Mineralbrocken mit Funkeln
        ctx.fillStyle = rgba([120, 134, 176], 0.85 * kraft);
        form([[-9, -7], [-6, 7], [0, 10], [6, 6], [8, -7]]);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = rgba([214, 232, 255], 0.7 * kraft);
        ctx.lineWidth = 1.3 * s;
        const g0 = P(-1, 9);
        ctx.beginPath();
        ctx.moveTo(g0[0] - 5 * s, g0[1]); ctx.lineTo(g0[0] + 5 * s, g0[1]);
        ctx.moveTo(g0[0], g0[1] - 5 * s); ctx.lineTo(g0[0], g0[1] + 5 * s);
        ctx.stroke();
        ctx.restore();
      } else {                                       // Monolith, leicht gekippt
        const kipp = (hash(k * 3.9) - 0.5) * 5;
        ctx.fillStyle = rgba([88, 98, 132], 0.92 * kraft);
        form([[-6, -7], [-5.5 + kipp, 22], [5.5 + kipp, 21], [6, -7]]);
        ctx.fillStyle = rgba([146, 162, 204], 0.55 * kraft);   // beleuchtete Kante
        form([[2, -7], [2.5 + kipp, 21.5], [5.5 + kipp, 21], [6, -7]]);
      }
    }
  }
}

// Holzschanzen: Bretterbelag auf der Rampe, darunter Stützen bis auf den
// gewachsenen Boden. Die Höhe der Stützen ist genau jumpRise(x) – also das,
// was die Schanze über dem Gelände liegt.
function drawJumps() {
  const xl = wxAt(-40), xr = wxAt(W + 40);
  for (const j of JUMPS) {
    if (!j.holz) continue;
    const e = j.x0 + j.L + JDROP;         // inklusive der abfallenden Rückseite
    if (e < xl || j.x0 > xr) continue;
    const s = SCALE;
    const N = Math.max(8, Math.min(40, Math.round((sx(e) - sx(j.x0)) / (11 * s))));
    const p = [], n = [], stuetze = [];
    for (let i = 0; i <= N; i++) {
      const wx = j.x0 + (e - j.x0) * i / N;
      const sl = slopeAt(wx), nl = Math.hypot(sl, 1);
      p.push([sx(wx), sy(terrainY(wx))]);
      n.push([sl / nl, 1 / nl]);            // Normale, Bildschirm-Y zeigt nach unten
      stuetze.push(jumpRise(wx) * s);       // Höhe über dem gewachsenen Boden
    }
    const laengs = (off, w, col) => {
      ctx.strokeStyle = col; ctx.lineWidth = w * s;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const X = p[i][0] + n[i][0] * off * s, Y = p[i][1] + n[i][1] * off * s;
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke();
    };

    // Stützen mit Diagonalen
    ctx.strokeStyle = "rgba(74,55,38,.9)"; ctx.lineWidth = 2.4 * s;
    for (let i = 1; i < N; i += 3) {
      if (stuetze[i] < 6 * s) continue;
      ctx.beginPath();
      ctx.moveTo(p[i][0], p[i][1]); ctx.lineTo(p[i][0], p[i][1] + stuetze[i]);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(74,55,38,.55)"; ctx.lineWidth = 1.6 * s;
    for (let i = 1; i + 3 < N; i += 6) {
      if (stuetze[i] < 10 * s) continue;
      ctx.beginPath();
      ctx.moveTo(p[i][0], p[i][1] + stuetze[i]); ctx.lineTo(p[i + 3][0], p[i + 3][1]);
      ctx.stroke();
    }
    // Belag und Bretterfugen
    laengs(-1.5, 7, "#8a6b45");
    ctx.strokeStyle = "rgba(45,32,20,.5)"; ctx.lineWidth = 1.3 * s;
    for (let i = 1; i < N; i++) {
      ctx.beginPath();
      ctx.moveTo(p[i][0] + n[i][0] * -5 * s, p[i][1] + n[i][1] * -5 * s);
      ctx.lineTo(p[i][0] + n[i][0] * 2 * s, p[i][1] + n[i][1] * 2 * s);
      ctx.stroke();
    }
    laengs(-5.2, 2, "#a8865c");            // heller Kantenstrich oben
    // Abrisskante: Stirnbrett
    const k = N, hk = Math.max(7 * s, stuetze[k]);
    ctx.strokeStyle = "#6d5334"; ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(p[k][0], p[k][1] - 5 * s); ctx.lineTo(p[k][0], p[k][1] + hk);
    ctx.stroke();
  }
}

/* Lavabecken: oben der Spiegel mit leichter Welle, unten der Boden der Kerbe.
   Über den Rändern fallen beide zusammen, deshalb die Begrenzung auf die
   tiefere der beiden Linien – sonst stünde die Fläche über dem Hang. */
function drawLava() {
  const xl = wxAt(-60), xr = wxAt(W + 60), t = performance.now() / 1000;
  for (const r of RAVINES) {
    if (!r.lava || r.x2 < xl || r.x1 > xr) continue;
    const welle = x => Math.sin(x * 0.045 + t * 1.7) * 1.8 + Math.sin(x * 0.019 - t * 1.1) * 2.4;
    ctx.beginPath();
    for (let x = r.x1; x <= r.x2; x += 6) ctx.lineTo(sx(x), sy(r.lavaY + welle(x)));
    for (let x = r.x2; x >= r.x1; x -= 6)
      ctx.lineTo(sx(x), sy(Math.min(terrainY(x) - 3, r.lavaY)));
    ctx.closePath();
    const g = ctx.createLinearGradient(0, sy(r.lavaY + 6), 0, sy(r.lavaY - 150));
    g.addColorStop(0, "#ffd889");
    g.addColorStop(0.18, "#ff8f2e");
    g.addColorStop(1, "#8d2a12");
    ctx.fillStyle = g; ctx.fill();

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "rgba(255,190,90,.5)";      // Glut auf dem Spiegel
    ctx.lineWidth = 5 * SCALE;
    ctx.beginPath();
    for (let x = r.x1 + 4; x <= r.x2 - 4; x += 6) ctx.lineTo(sx(x), sy(r.lavaY + welle(x)));
    ctx.stroke();
    // Blasen steigen auf und zerplatzen am Spiegel
    ctx.fillStyle = "rgba(255,214,140,.55)";
    ctx.beginPath();
    for (let k = 0; k < 7; k++) {
      const bx = r.x1 + ((k + 0.5) / 7) * (r.x2 - r.x1) + Math.sin(k * 2.3) * 12;
      const ph = (t * (0.5 + hash(k * 3.1 + r.x1 * 0.01) * 0.5) + hash(k * 7.7)) % 1;
      const rad = (1.5 + 3.5 * ph) * SCALE;
      ctx.moveTo(sx(bx) + rad, sy(r.lavaY + welle(bx) - 16 * (1 - ph)));
      ctx.arc(sx(bx), sy(r.lavaY + welle(bx) - 16 * (1 - ph)), rad, 0, 7);
    }
    ctx.fill();
    ctx.restore();
  }
}

/* Geysire: Krater auf dem Boden, davor Blubbern als Vorwarnung, dann die
   Säule. Die Höhe der Säule ist dieselbe Zahl, die auch über Leben und Tod
   entscheidet – was man sieht, trifft auch.                              */
function drawGeysers() {
  const xl = wxAt(-80), xr = wxAt(W + 80), t = performance.now() / 1000;
  for (const g of GEYSERS) {
    if (g.x < xl || g.x > xr) continue;
    const s = geyserAt(g, G.time), X = sx(g.x), Y = sy(terrainY(g.x));
    const R = CFG.GEY_R * SCALE;
    // Der Krater folgt der Hangneigung, sonst steht er schief im Boden. q läuft
    // längs der Oberfläche, l senkrecht darauf – wie beim übrigen Bewuchs.
    const sl = slopeAt(g.x), nl = Math.hypot(sl, 1);
    const ux = -sl / nl, uy = -1 / nl, qx = 1 / nl, qy = -sl / nl;
    const P = (q, l) => [X + (qx * q + ux * l) * SCALE, Y + (qy * q + uy * l) * SCALE];
    // Der Krater ist kein aufgesetzter Klotz, sondern ein Aufwurf aus dem
    // Boden: zwei flache Wälle links und rechts in der Gesteinsfarbe, dazwischen
    // die dunkle Öffnung. Die Ränder laufen weich in den Hang aus.
    const R0 = CFG.GEY_R;
    const kurve = (punkte) => {
      ctx.beginPath();
      punkte.forEach(([q, l], i) => {
        const p = P(q, l);
        i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
      });
      ctx.closePath(); ctx.fill();
    };
    // Farbe dicht am Gestein (#3b2f33), damit es der Boden selbst bleibt und
    // nicht wie ein aufgesetzter Klotz wirkt
    ctx.fillStyle = "#443539";                       // flacher Wall
    kurve([[-R0 * 2.6, -14], [-R0 * 1.8, 2], [-R0 * 0.9, 8], [-R0 * 0.6, 7],
           [-R0 * 1.1, 0], [-R0 * 1.7, -14]]);
    kurve([[R0 * 2.6, -14], [R0 * 1.8, 2], [R0 * 0.9, 8], [R0 * 0.6, 7],
           [R0 * 1.1, 0], [R0 * 1.7, -14]]);
    ctx.fillStyle = "#523f43";                       // schwacher Rand
    kurve([[-R0 * 1.8, 2], [-R0 * 0.9, 8], [-R0 * 0.6, 7], [-R0 * 1.6, 1]]);
    kurve([[R0 * 1.8, 2], [R0 * 0.9, 8], [R0 * 0.6, 7], [R0 * 1.6, 1]]);
    ctx.fillStyle = "#241a1e";                       // Schlund
    kurve([[-R0 * 0.62, 7], [-R0 * 0.44, -6], [R0 * 0.44, -6], [R0 * 0.62, 7]]);
    const maul = P(0, 9);                            // Austrittsöffnung
    const MX = maul[0], MY = maul[1];

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    if (s.hoehe > 0.02) {                            // Säule, steigt senkrecht
      const hh = g.H * s.hoehe * SCALE;
      const lg = ctx.createLinearGradient(0, MY, 0, MY - hh);
      lg.addColorStop(0, "rgba(255,226,150,.95)");
      lg.addColorStop(0.45, "rgba(255,140,50,.75)");
      lg.addColorStop(1, "rgba(255,90,30,0)");
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(MX - R * 0.8, MY);
      ctx.quadraticCurveTo(MX - R * 0.5, MY - hh * 0.6, MX - R * 0.15, MY - hh);
      ctx.lineTo(MX + R * 0.15, MY - hh);
      ctx.quadraticCurveTo(MX + R * 0.5, MY - hh * 0.6, MX + R * 0.8, MY);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,236,190,.8)";        // Tropfen im Flug
      ctx.beginPath();
      for (let k = 0; k < 9; k++) {
        const ph = (t * 1.6 + k * 0.37) % 1;
        const px = MX + Math.sin(k * 2.1 + t) * R * 0.7;
        const py = MY - hh * (0.25 + ph * 0.85) + ph * ph * 30 * SCALE;
        ctx.moveTo(px + 2 * SCALE, py);
        ctx.arc(px, py, (1.4 + hash(k * 5.3) * 1.6) * SCALE, 0, 7);
      }
      ctx.fill();
    } else if (s.warnung > 0) {                      // Vorwarnung: es blubbert
      const a = s.warnung * (0.5 + 0.5 * Math.sin(t * 14));
      ctx.fillStyle = "rgba(255,150,60," + (0.5 * a) + ")";
      ctx.beginPath();
      ctx.ellipse(MX, MY - 2 * SCALE, R * 0.7, (5 + 7 * s.warnung) * SCALE, 0, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }
}
