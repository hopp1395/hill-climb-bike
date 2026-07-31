"use strict";
/* Motorrad und Fahrer
   Teil von Hill Climb Bike – siehe index.html für die Ladereihenfolge. */
function drawWheel(p) {
  const px = sx(p.x), py = sy(p.y), r = p.r * SCALE;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(p.spin);            // spin ist bereits der Winkel in Radiant
  ctx.fillStyle = "#1b1b20";
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  ctx.strokeStyle = "#3a3a44"; ctx.lineWidth = 2 * SCALE;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, 7); ctx.stroke();
  // 3 Speichen: bei bis zu ~9 Umdrehungen/s bleibt die Speichenfrequenz unter
  // der halben Bildrate, sonst scheint sich das Rad rückwärts zu drehen.
  ctx.strokeStyle = "#8a8f9c"; ctx.lineWidth = 2 * SCALE;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6); ctx.stroke();
  }
  ctx.fillStyle = "#c8ccd6";
  ctx.beginPath(); ctx.arc(0, 0, r * 0.16, 0, 7); ctx.fill();
  ctx.restore();
}

function drawBike() {
  const mx = (rear.x + front.x) / 2, my = (rear.y + front.y) / 2;
  const ang = Math.atan2(front.y - rear.y, front.x - rear.x);
  const hb = CFG.WHEELBASE / 2;

  // Im Finale löst sich das Bike auf, während das Sternbild hervortritt
  const sicht = 1 - sternAnteil();
  if (sicht < 0.004) return;

  // Schatten
  const gy = groundUnder(mx, my);
  ctx.globalAlpha = Math.max(0, 0.3 - (my - gy) / 500) * sicht;
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.ellipse(sx(mx), sy(gy), 34 * SCALE, 7 * SCALE, 0, 0, 7); ctx.fill();
  ctx.globalAlpha = sicht;

  drawWheel(rear); drawWheel(front);

  ctx.save();
  ctx.translate(sx(mx), sy(my));
  ctx.rotate(-ang);                 // lokal: +x vorwärts, -y oben
  ctx.scale(SCALE, SCALE);

  // Einfedern senkt den Aufbau zu den Rädern hin; federt vorn mehr ein als
  // hinten, taucht die Nase. Die Naben bleiben, wo die Physik sie hat.
  const sr = rear.sag, sf = front.sag;
  const sm = (sr + sf) / 2, nick = Math.atan2(sf - sr, 2 * hb);
  const anbau = (x, y) => {          // Punkt am Aufbau -> Nabensystem
    const c = Math.cos(nick), s = Math.sin(nick);
    return [x * c - y * s, x * s + y * c + sm];
  };
  const hint = anbau(-hb + 18, -9), vorn = anbau(hb - 3, -8);
  ctx.strokeStyle = "#3a4150"; ctx.lineWidth = 4; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-hb, 0); ctx.lineTo(hint[0], hint[1]);      // Schwinge
  ctx.moveTo(hb, 0);  ctx.lineTo(vorn[0], vorn[1]);      // Gabelholm
  ctx.stroke();
  ctx.strokeStyle = "#8a93a6"; ctx.lineWidth = 2.2;      // Federbein als Wendel
  ctx.beginPath();
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const x = -hb + 4 + (hint[0] + hb - 4) * t, y = hint[1] * t;
    const q = (i % 2 ? 1 : -1) * 2.6;
    i ? ctx.lineTo(x + q, y + q * 0.4) : ctx.moveTo(x, y);
  }
  ctx.stroke();

  ctx.translate(0, sm);              // ab hier taucht der Aufbau mit ein
  ctx.rotate(nick);

  // Boost-Flamme hinter dem Hinterrad
  if (G.boosting) {
    const L = 34 * (1 + Math.sin(G.time * 42) * 0.2);
    const fg = ctx.createLinearGradient(-36, 0, -36 - L, 0);
    fg.addColorStop(0, "rgba(255,255,255,.95)");
    fg.addColorStop(0.35, "rgba(120,220,255,.8)");
    fg.addColorStop(1, "rgba(139,125,255,0)");
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(-36, -13); ctx.lineTo(-36 - L, -6); ctx.lineTo(-36, 1); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.beginPath();
    ctx.moveTo(-36, -9); ctx.lineTo(-36 - L * 0.45, -6); ctx.lineTo(-36, -3); ctx.closePath();
    ctx.fill();
  }

  // Rahmen
  ctx.strokeStyle = "#2f3644"; ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-hb, 0); ctx.lineTo(-8, -14); ctx.lineTo(10, -12);
  ctx.moveTo(-8, -14); ctx.lineTo(0, 0);
  ctx.moveTo(10, -12); ctx.lineTo(hb, 0);
  ctx.stroke();

  // Motorblock
  ctx.fillStyle = "#5a6478";
  ctx.beginPath(); ctx.roundRect(-14, -12, 22, 13, 3); ctx.fill();

  // Tank + Sitz
  ctx.fillStyle = "#e63946";
  ctx.beginPath(); ctx.moveTo(-16, -16); ctx.lineTo(4, -20); ctx.lineTo(12, -14);
  ctx.lineTo(-6, -12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#22252e";
  ctx.beginPath(); ctx.roundRect(-26, -19, 14, 5, 2); ctx.fill();

  // Lenker
  ctx.strokeStyle = "#2f3644"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(12, -14); ctx.lineTo(20, -26); ctx.stroke();
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(21, -27, 3, 0, 7); ctx.fill();

  // Fahrer
  ctx.strokeStyle = "#2b6cb0"; ctx.lineWidth = 7; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-16, -20); ctx.lineTo(-3, -36); ctx.stroke();   // Rumpf
  ctx.strokeStyle = "#1a4e86"; ctx.lineWidth = 5.5;
  ctx.beginPath(); ctx.moveTo(-14, -22); ctx.lineTo(-4, -14); ctx.lineTo(-2, -6); ctx.stroke(); // Bein
  ctx.beginPath(); ctx.moveTo(-4, -34); ctx.lineTo(18, -25); ctx.stroke();    // Arm

  // Kopf: Foto des gewählten Fahrers, rund beschnitten. HY ist reine Optik –
  // der Crash hängt weiter an CFG.HEAD_H, damit sich nichts am Spiel ändert.
  const ch = CHARS[charIdx];
  const HR = 19, HY = CFG.HEAD_H + 11;
  if (ch && ch.ok) {
    const cr = faceCrop(ch.img);
    ctx.save();
    ctx.beginPath(); ctx.arc(0, -HY, HR, 0, 7); ctx.clip();
    ctx.drawImage(ch.img, cr.x, cr.y, cr.s, cr.s, -HR, -HY - HR, HR * 2, HR * 2);
    ctx.restore();
    ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, -HY, HR, 0, 7); ctx.stroke();
  } else {
    ctx.fillStyle = "#ffd166";
    ctx.beginPath(); ctx.arc(0, -HY, HR * 0.8, 0, 7); ctx.fill();             // Helm
    ctx.fillStyle = "#2f3644";
    ctx.beginPath(); ctx.arc(0, -HY, HR * 0.8, -0.5, 1.3); ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
