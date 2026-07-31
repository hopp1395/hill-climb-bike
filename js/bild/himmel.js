"use strict";
/* Himmel, Wolken, Vögel und die Hügelketten im Hintergrund
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
/* ---- Hintergrund-Deko: Wolken, Wald, Häuser -----------------------------
   Reine Optik in eigenen Parallax-Ebenen, ohne jeden Einfluss aufs Fahren.
   Jede Position kommt aus hash() – es wird nichts gespeichert, deshalb sieht
   eine Stelle beim Zurückfahren wieder genauso aus wie vorher.           */
const CLOUD_W = 7500;                      // Wiederholbreite des Wolkenbands
const CLOUDS = Array.from({ length: 20 }, (_, i) => {
  const n = 4 + Math.floor(hash(i * 12.9 + 6) * 3);
  const blobs = Array.from({ length: n }, (_, k) => {
    const t = n > 1 ? k / (n - 1) : 0.5;
    return { ox: (t - 0.5) * 128,
             oy: -Math.sin(Math.PI * t) * 15 * (0.6 + hash(i * 3.3 + k * 1.9) * 0.8),
             r: 20 + hash(i * 7.1 + k * 2.7) * 15 };
  });
  return {
    x: hash(i * 2.3 + 1) * CLOUD_W,
    f: hash(i * 6.1 + 4),                   // Platz im Himmelsstreifen (0 unten, 1 oben)
    s: 0.7 + hash(i * 9.7 + 8) * 0.85,
    v: 4 + hash(i * 4.3 + 2) * 10,          // Eigendrift in px/s
    w: Math.max(...blobs.map(b => Math.abs(b.ox) + b.r)),
    blobs,
  };
});

function drawClouds(alt) {
  const par = 0.09, now = performance.now() / 1000;
  const grau = Math.min(1, WEA.p);          // bei Wetter werden sie grau
  const lava = lavaAt(cam.y), raum = spaceAt(cam.y);
  let col = lerp3(lerp3([255, 255, 255], [148, 156, 176], grau), [58, 64, 94], alt);
  col = lerp3(col, [64, 46, 44], lava);                // über dem Vulkan Rauch
  const schatten = lerp3(col, [96, 116, 150], 0.42);   // Unterseite
  // In der Sternenzone ist die Luft weg – dort gibt es keine Wolken mehr.
  const a = (0.52 + 0.3 * grau - 0.14 * alt) * (1 - raum);
  if (a <= 0.02) return;
  // Höhe des Streifens aus dem Bild ableiten, nicht fest in Weltpixeln: sonst
  // liegt er bei anderer Fenstergröße neben dem sichtbaren Himmel.
  const band = (H * CAMY * 0.88) / SCALE + 110;
  for (const c of CLOUDS) {
    // waagrecht durchs Band wandern, senkrecht mit der Kamera durchrollen:
    // so ist auf jeder Höhe Bewölkung da, ohne pro Wolke Zustand zu halten
    const dx = ((c.x + now * c.v - cam.x * par) % CLOUD_W + CLOUD_W) % CLOUD_W - CLOUD_W * 0.5;
    const px = W * CAMX + dx * SCALE;
    const s = SCALE * c.s;
    if (px < -c.w * s - 20 || px > W + c.w * s + 20) continue;
    const dy = ((c.f * band - cam.y * par) % band + band) % band;
    const py = H * CAMY * 0.88 - dy * SCALE;
    const ballen = () => {
      ctx.beginPath();
      for (const b of c.blobs) {
        ctx.moveTo(px + (b.ox + b.r) * s, py + b.oy * s);
        ctx.arc(px + b.ox * s, py + b.oy * s, b.r * s, 0, 7);
      }
    };
    ballen();
    ctx.rect(px - c.w * s * 0.86, py - 3 * s, c.w * s * 1.72, 11 * s);   // flache Unterkante
    ctx.fillStyle = rgba(schatten, a); ctx.fill();
    // dieselben Ballen ein Stück höher und heller: gibt Volumen statt Fläche
    ctx.save();
    ctx.translate(0, -3.5 * s);
    ballen();
    ctx.fillStyle = rgba(col, a); ctx.fill();
    ctx.restore();
  }
}

/* Vogelschwärme über dem Tal. Sie ziehen langsam durchs Bild und schlagen mit
   den Flügeln; oberhalb der Schneegrenze sind sie weg. */
const SCHWARM = Array.from({ length: 7 }, (_, i) => ({
  x: hash(i * 5.9 + 3) * 4500,
  y: 250 + hash(i * 3.1 + 8) * 300,       // Welthöhe, nicht Bildschirmhöhe
  v: 26 + hash(i * 7.7) * 22,
  n: 3 + Math.floor(hash(i * 2.3) * 4),
  s: 0.7 + hash(i * 8.1) * 0.6,
}));
function drawVoegel() {
  const tal = 1 - smooth((cam.y - 1500) / 2400);
  if (tal < 0.04) return;
  const t = performance.now() / 1000;
  ctx.strokeStyle = rgba([44, 52, 74], 0.68 * tal);
  ctx.lineCap = "round";
  for (const f of SCHWARM) {
    // Hohe Parallaxe in beide Richtungen: die Vögel hängen in der Welt, nicht
    // am Bildschirm. Ohne Kameraanteil klebten sie im Bild fest und wanderten
    // damit scheinbar mit dem Fahrer mit – auch nach oben.
    const dx = ((f.x + t * f.v - cam.x * 0.8) % 4500 + 4500) % 4500 - 2250;
    const px = W * CAMX + dx * SCALE;
    // Senkrecht mit weniger Parallaxe als waagerecht: die Schwärme sinken beim
    // Klettern weg, aber langsam genug, um das ganze Tal über sichtbar zu sein.
    const py = H * CAMY - (f.y - cam.y * 0.45) * SCALE;
    if (py < -60 || py > H + 60) continue;
    if (px < -80 || px > W + 80) continue;
    const s = f.s * Math.max(1, SCALE) * 1.6;
    ctx.lineWidth = 1.7 * s;
    ctx.beginPath();
    for (let k = 0; k < f.n; k++) {
      const bx = px + (k - f.n / 2) * 19 * s, by = py + Math.sin(k * 2.1) * 10 * s;
      const fl = Math.sin(t * 6 + k * 1.3) * 3.2 * s;   // Flügelschlag
      ctx.moveTo(bx - 7 * s, by - fl);
      ctx.quadraticCurveTo(bx - 2.4 * s, by + 1.8 * s, bx, by);
      ctx.quadraticCurveTo(bx + 2.4 * s, by + 1.8 * s, bx + 7 * s, by - fl);
    }
    ctx.stroke();
  }
}

/* Kirche im Hintergrunddorf – alle 5200 px eine, damit im Tal immer wieder
   eine auftaucht. Sie steht auf demselben Kamm wie die Häuser. */
function drawKirche(par, amp, base, alt) {
  const tal = 1 - smooth((cam.y - 1800) / 2600);
  if (tal < 0.04) return;
  const wx0 = cam.x * par + (-80 - W * CAMX) / SCALE;
  const wx1 = cam.x * par + (W + 80 - W * CAMX) / SCALE;
  const wand = rgba(lerp3([214, 214, 208], [30, 34, 58], alt), tal);
  const dach = rgba(lerp3([92, 76, 78], [20, 22, 44], alt), tal);
  for (let k = Math.floor(wx0 / 5200); k <= Math.ceil(wx1 / 5200); k++) {
    const wx = k * 5200 + 1400;
    if (wx < wx0 - 60 || wx > wx1 + 60) continue;
    const px = W * CAMX + (wx - cam.x * par) * SCALE;
    const py = H * CAMY - (ridgeY(wx, amp, base) - cam.y * par) * SCALE;
    if (py > H + 30) continue;
    const s = SCALE * 1.15;
    ctx.fillStyle = wand;
    ctx.fillRect(px - 15 * s, py - 15 * s, 30 * s, 17 * s);      // Schiff
    ctx.fillRect(px + 5 * s, py - 34 * s, 11 * s, 36 * s);       // Turm
    ctx.fillStyle = dach;
    ctx.beginPath();                                             // Turmspitze
    ctx.moveTo(px + 3 * s, py - 34 * s);
    ctx.lineTo(px + 10.5 * s, py - 50 * s);
    ctx.lineTo(px + 18 * s, py - 34 * s);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();                                             // Satteldach
    ctx.moveTo(px - 18 * s, py - 15 * s);
    ctx.lineTo(px - 4 * s, py - 24 * s);
    ctx.lineTo(px + 10 * s, py - 15 * s);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = dach; ctx.lineWidth = 1.4 * s;             // Kreuz
    ctx.beginPath();
    ctx.moveTo(px + 10.5 * s, py - 50 * s); ctx.lineTo(px + 10.5 * s, py - 57 * s);
    ctx.moveTo(px + 7.5 * s, py - 54 * s); ctx.lineTo(px + 13.5 * s, py - 54 * s);
    ctx.stroke();
  }
}

// Silhouette einer Bergkette – Grundlage für Kamm und Bewuchs
function ridgeY(wx, amp, base) {
  return base + Math.sin(wx * 0.0009) * amp + Math.sin(wx * 0.0031 + 2.1) * amp * 0.35
              + (vnoise(wx * 0.0007 + 5) - 0.5) * amp * 1.2;
}

// Wald und Häuser stehen auf dem Kamm. Das Raster ist in Weltkoordinaten fest
// verankert, damit beim Fahren nichts wandert oder neu auslost.
function drawProps(alt, par, amp, base, o) {
  const wx0 = cam.x * par + (-40 - W * CAMX) / SCALE;
  const wx1 = cam.x * par + (W + 40 - W * CAMX) / SCALE;
  const baum = rgba(lerp3(o.baum, [16, 20, 44], alt), 1);
  // zweiter, hellerer Grünton: der Wald wirkt sonst wie ausgestanzt
  const baum2 = rgba(lerp3(lerp3(o.baum, [255, 255, 255], 0.16), [16, 20, 44], alt), 1);
  const wand = o.wand && rgba(lerp3(o.wand, [30, 34, 58], alt), 1);
  const dach = o.dach && rgba(lerp3(o.dach, [20, 22, 44], alt), 1);
  const licht = Math.min(0.85, Math.max(0, alt - 0.16) * 2.4);
  for (let k = Math.floor(wx0 / o.step); k <= Math.ceil(wx1 / o.step); k++) {
    if (hash(k * 1.37 + o.seed) > o.dens) continue;
    const wx = (k + hash(k * 2.11 + o.seed) * 0.8 - 0.4) * o.step;
    const px = W * CAMX + (wx - cam.x * par) * SCALE;
    const py = H * CAMY - (ridgeY(wx, amp, base) - cam.y * par) * SCALE;
    if (py > H + 30) continue;              // Kette liegt unter dem Bild
    const r1 = hash(k * 5.9 + o.seed), r2 = hash(k * 3.7 + o.seed);
    // Häuser nur auf halbwegs flachem Kamm – am Steilhang baut niemand
    const flach = Math.abs((ridgeY(wx + 8, amp, base) - ridgeY(wx - 8, amp, base)) / 16) < 0.3;
    if (wand && flach && r1 < 0.34) {
      const s = SCALE * (o.hsz || o.sz) * (0.85 + r2 * 0.3);
      const bw = 21 * s, bh = 14 * s, bx = px - bw / 2, by = py + 2 * s - bh;
      ctx.fillStyle = wand; ctx.fillRect(bx, by, bw, bh);
      // Öffnungen: bei größeren Häusern zwei Fenster und eine Tür. Sie werden
      // immer gezeichnet – tagsüber dunkel, abends leuchten sie.
      const oeff = bw > 26
        ? [[0.14, 0.2, 0.22, 0.3], [0.64, 0.2, 0.22, 0.3], [0.41, 0.56, 0.18, 0.44]]
        : [[0.38, 0.28, 0.24, 0.3]];
      const malen = col => {
        ctx.fillStyle = col;
        for (const [fx, fy, fw, fh] of oeff)
          ctx.fillRect(bx + bw * fx, by + bh * fy, bw * fw, bh * fh);
      };
      malen("rgba(38,42,56,.5)");
      if (licht > 0.02) malen(rgba([255, 216, 138], licht));
      ctx.fillStyle = dach;
      ctx.beginPath();
      ctx.moveTo(bx - 3 * s, by);
      ctx.lineTo(px, by - 9 * s);
      ctx.lineTo(bx + bw + 3 * s, by);
      ctx.closePath(); ctx.fill();
      if (r2 > 0.5) ctx.fillRect(bx + bw * 0.7, by - 8 * s, 3 * s, 6 * s);   // Kamin
      continue;
    }
    const s = SCALE * o.sz * (0.7 + r2 * 0.6);
    ctx.fillStyle = r2 > 0.55 ? baum2 : baum;
    if (o.laub && r1 > 0.78) {              // ein paar Laubbäume dazwischen
      ctx.fillRect(px - 1.2 * s, py - 9 * s, 2.4 * s, 11 * s);
      ctx.beginPath();                      // zwei Kugeln – weniger Lolli, mehr Krone
      ctx.arc(px - 2.5 * s, py - 12 * s, 5.5 * s, 0, 7);
      ctx.moveTo(px + 8 * s, py - 15 * s);
      ctx.arc(px + 2.5 * s, py - 15 * s, 5.5 * s, 0, 7);
      ctx.fill();
      continue;
    }
    const th = 28, hw = 8.5;                // zweistöckige Tanne
    ctx.beginPath();
    ctx.moveTo(px, py - th * s);
    ctx.lineTo(px + hw * 0.55 * s, py - th * 0.44 * s);
    ctx.lineTo(px + hw * 0.34 * s, py - th * 0.44 * s);
    ctx.lineTo(px + hw * s, py + 2 * s);
    ctx.lineTo(px - hw * s, py + 2 * s);
    ctx.lineTo(px - hw * 0.34 * s, py - th * 0.44 * s);
    ctx.lineTo(px - hw * 0.55 * s, py - th * 0.44 * s);
    ctx.closePath(); ctx.fill();
  }
}

function drawSky(alt) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix([96, 168, 232], [6, 8, 26], alt));
  g.addColorStop(0.55, mix([176, 214, 240], [22, 28, 64], alt));
  g.addColorStop(1, mix([232, 232, 226], [46, 44, 78], alt));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const lava = lavaAt(cam.y), raum = spaceAt(cam.y);
  // In der Sternenzone ist die Luft praktisch weg: der Himmel wird schwarz und
  // die Sterne stehen hart darin.
  if (raum > 0.01) {
    ctx.fillStyle = rgba([3, 4, 12], 0.88 * raum);
    ctx.fillRect(0, 0, W, H);
  }
  // Über dem Vulkan glüht der Himmel von unten
  if (lava > 0.01) {
    const lg = ctx.createLinearGradient(0, H * 0.32, 0, H);
    lg.addColorStop(0, rgba([255, 96, 30], 0));
    lg.addColorStop(1, rgba([255, 104, 34], 0.3 * lava));
    ctx.fillStyle = lg; ctx.fillRect(0, H * 0.32, W, H * 0.68);
  }

  if (alt > 0.12) {
    ctx.globalAlpha = Math.min(1, (alt - 0.12) * 1.6) * (1 + raum * 0.8);
    ctx.fillStyle = "#fff";
    ctx.beginPath();                      // alle Sterne in einem Pfad statt 160 Befehlen
    for (const s of STARS) {
      const px = ((s.x - cam.x * 0.06) % 2600 + 2600) % 2600 * (W / 2600);
      const py = (s.y - cam.y * 0.05) % 1400;
      const yy = ((py % 1400) + 1400) % 1400 * (H / 1400) * 0.7;
      ctx.rect(px, yy, s.s, s.s);
    }
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Sonne und Mond wechseln sich mit der Höhe ab, beide verschwinden im Wetter
  const klar = 1 - WEA.p * 0.85;
  const nacht = smooth((alt - 0.34) / 0.34);
  if (klar > 0.02 && nacht < 0.99) {
    const sunX = W * 0.78, sunY = H * 0.16;
    const sg = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 120);
    sg.addColorStop(0, "rgba(255,246,214," + (0.95 * klar * (1 - nacht)) + ")");
    sg.addColorStop(1, "rgba(255,240,190,0)");
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(sunX, sunY, 120, 0, 7); ctx.fill();
  }
  if (klar > 0.02 && nacht > 0.01) {
    const mx = W * 0.19, my = H * 0.19, r = 26 * Math.max(0.8, SCALE);
    const a = klar * nacht;
    const mg = ctx.createRadialGradient(mx, my, r * 0.7, mx, my, r * 4.2);
    mg.addColorStop(0, "rgba(214,228,255," + (0.3 * a) + ")");
    mg.addColorStop(1, "rgba(190,210,255,0)");
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, r * 4.2, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(238,244,255," + (0.94 * a) + ")";
    ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(196,208,232," + (0.5 * a) + ")";   // ein paar Krater
    ctx.beginPath(); ctx.arc(mx - r * 0.3, my - r * 0.25, r * 0.22, 0, 7);
    ctx.moveTo(mx + r * 0.5, my + r * 0.1);
    ctx.arc(mx + r * 0.28, my + r * 0.1, r * 0.15, 0, 7);
    ctx.moveTo(mx + r * 0.2, my + r * 0.55);
    ctx.arc(mx - r * 0.05, my + r * 0.45, r * 0.12, 0, 7);
    ctx.fill();
  }

  drawAurora(alt);
  // Kometen ohne den Wetterfaktor: sie sind das Dauerwetter der Sternenzone
  // und sollen auch bei Sturm oder Gewitter nicht ausdünnen.
  drawKometen(raum);
}
