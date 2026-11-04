/**
 * Bab Bat: inspirasi (ekolokasi), karakteristik (slider A dan r), cara kerja bertahap, dan simulasi nyata.
 * Slide inspirasi dan cara kerja adalah ilustrasi; angka A dan r memakai fungsi yang sama dengan mesin.
 */

import { clamp01, easeInOut, easeOut, lerp, seg } from '../render/motion.js';
import {
  COLORS,
  drawArrow,
  drawBackdrop,
  drawBat,
  drawCheck,
  drawCross,
  drawEcho,
  drawFirefly,
  drawGlow,
  drawPill,
  drawText,
  hexToRgba
} from '../render/sprites.js';
import { TopoMap } from '../render/heatmap.js';
import { BARenderer } from '../render/mapRenderers.js';
import { landscapeById } from '../core/landscapes.js';
import { BAEngine, loudnessAt, pulseRateAt } from '../algorithms/bat.js';
import { mountStory } from './frame.js';
import { hash01, drift } from '../render/ambient.js';
import { mountConsole } from './console.js';
import { mountLab, LAB_W, LAB_H } from './lab.js';
import { CH, BA_COLOR } from './chapters.js';

/* ---------- Inspirasi ---------- */

const PREY = { x: 1500, y: 690 };
const BOX = { x: 180, y: 340, w: 1640, h: 600 };

function drawPrey(ctx, t, glow = 0.5) {
  const x = PREY.x + Math.sin(t * 1.3) * 12;
  const y = PREY.y + Math.cos(t * 1.7) * 10;
  drawFirefly(ctx, x, y, 22, { glow, t, color: COLORS.pink, core: '#ffe4f1' });
  drawText(ctx, 'mangsa', x, y - 66, { size: 28, color: COLORS.pink, align: 'center' });
}

function drawMeter(ctx, x, y, w, label, value, color) {
  drawText(ctx, label, x, y - 22, { size: 26, color: COLORS.ink });
  ctx.fillStyle = 'rgba(242,247,255,0.14)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, 22, 11);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(22, w * clamp01(value)), 22, 11);
  ctx.fill();
}

function drawBatInspiration(ctx, { t, bt, beat }) {
  drawBackdrop(ctx, t, 'purple');
  // Bulan
  drawGlow(ctx, 1640, 250, 260, 'rgba(196,181,253,0.35)');
  ctx.fillStyle = '#e9e3ff';
  ctx.beginPath();
  ctx.arc(1640, 250, 64, 0, Math.PI * 2);
  ctx.fill();

  if (beat === 0) {
    for (let i = 0; i < 7; i++) {
      const p = drift(i + 30, t, BOX);
      drawEcho(ctx, p.x, p.y, (t * 0.5 + hash01(i) * 3) % 1, COLORS.purpleLight, 120);
      drawBat(ctx, p.x, p.y, 26, { flap: t * 10 + i, angle: Math.sin(t * 0.7 + i) * 0.12 });
    }
    drawPill(ctx, 'bersuara, lalu mendengar pantulannya', 960, 1010, { fill: COLORS.purple, color: '#fff', size: 30, alpha: seg(bt, 0.5, 0.7) });
    return;
  }

  drawPrey(ctx, t, 0.55 + 0.4 * Math.abs(Math.sin(t * 3)));

  if (beat === 1) {
    const T = 9;
    const tau = bt % T;
    const k = easeInOut(clamp01(tau / (T - 1.2)));
    const start = { x: 260, y: 790 };
    const end = { x: 1330, y: 710 };
    const bx = lerp(start.x, end.x, k);
    const by = lerp(start.y, end.y, k) + Math.sin(tau * 2) * 8;

    // Laju pulsa naik, kenyaringan turun saat mendekat
    const rate0 = 1.1;
    const rate1 = 7;
    const Tm = T - 1.2;
    const phase = (x) => rate0 * x + ((rate1 - rate0) * x * x) / (2 * Tm);
    const nNow = Math.floor(phase(Math.min(tau, Tm)));
    for (let n = Math.max(1, nNow - 4); n <= nNow; n++) {
      // waktu ketika pulsa ke-n dipancarkan (akar persamaan kuadrat)
      const a = (rate1 - rate0) / (2 * Tm);
      const emit = (-rate0 + Math.sqrt(rate0 * rate0 + 4 * a * n)) / (2 * a);
      const kk = easeInOut(clamp01(emit / Tm));
      const loud = 1 - 0.75 * kk;
      const ex = lerp(start.x, end.x, kk);
      const ey = lerp(start.y, end.y, kk);
      drawEcho(ctx, ex, ey, clamp01((tau - emit) / 0.9), COLORS.purpleLight, 80 + 190 * loud, loud);
    }
    drawBat(ctx, bx, by, 34, { flap: t * 12, angle: -0.1 });
    const rateNow = rate0 + (rate1 - rate0) * k;
    drawMeter(ctx, 120, 400, 520, 'Laju pulsa  r  ↑ makin sering', clamp01((rateNow - rate0) / (rate1 - rate0)) * 0.9 + 0.1, COLORS.blue);
    drawMeter(ctx, 120, 480, 520, 'Kenyaringan  A  ↓ makin pelan', 1 - 0.75 * k, COLORS.pink);
    return;
  }

  // beat 2: banyak kelompok bergerak mendekati yang paling dekat mangsa
  const conv = seg(bt, 0.2, 5.5, easeInOut);
  const bats = Array.from({ length: 8 }, (_, i) => {
    const w = drift(i + 30, t, BOX);
    const ang = (i / 8) * Math.PI * 2 + 0.4;
    const rad = 90 + (i % 3) * 55;
    const target = { x: PREY.x - 230 + Math.cos(ang) * rad, y: PREY.y + Math.sin(ang) * rad };
    return { x: lerp(w.x, target.x, conv), y: lerp(w.y, target.y, conv), d: Math.hypot(target.x - PREY.x, target.y - PREY.y) };
  });
  const leader = bats.reduce((m, b, i) => (b.d < bats[m].d ? i : m), 0);
  bats.forEach((b, i) => {
    if (i !== leader) {
      ctx.strokeStyle = hexToRgba(COLORS.gold, 0.2 * conv);
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(bats[leader].x, bats[leader].y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
  bats.forEach((b, i) => {
    drawEcho(ctx, b.x, b.y, (t * 0.7 + i * 0.3) % 1, COLORS.purpleLight, 80, 0.6);
    drawBat(ctx, b.x, b.y, 26, {
      flap: t * 11 + i,
      color: i === leader ? '#fcd34d' : COLORS.purple,
      edge: i === leader ? '#fff6d6' : COLORS.purpleLight,
      crown: i === leader,
      glow: i === leader ? 1 : 0
    });
  });
  drawPill(ctx, 'semua mengarah ke kelelawar terbaik, x*', 960, 1010, { fill: COLORS.gold, size: 30, alpha: seg(bt, 1.8, 0.7) });
}

const baInspirasi = {
  id: 'ba-inspirasi',
  chapter: CH.bat,
  title: 'Bat: inspirasi',
  beats: 3,
  notes: `
    <p><b>Beat 1.</b> Kelelawar mikro memakai ekolokasi: mengeluarkan pulsa suara, lalu mendengar pantulannya untuk menebak jarak dan lokasi mangsa.</p>
    <p><b>Beat 2.</b> Semakin dekat ke mangsa, kelelawar memancarkan pulsa lebih sering (laju pulsa r naik) dan lebih pelan (kenyaringan A turun). Dua angka inilah yang nanti jadi parameter algoritma.</p>
    <p><b>Beat 3.</b> Dalam algoritma, kelelawar terbaik saat ini (x*) jadi arah tujuan. Yang lain terbang ke sana dengan frekuensi acak, lalu menjelajah dekat x*.</p>
    <p>Catatan akademik: analogi "r naik dan A turun" berasal dari Yang (2010). Pada pseudo-code aslinya, jelajah lokal dipilih saat rand lebih besar dari r. Artinya ketika r naik, jelajah lokal justru makin jarang. Sebagian literatur menyoroti ketidakselarasan analogi ini, jadi baca sumber aslinya bila dosen bertanya.</p>`,
  mount(container, ctx) {
    return mountStory(container, ctx, {
      tag: '5 · Bat Algorithm',
      beats: [
        { title: 'Kelelawar bersuara lalu mendengar gema', sub: 'Gema memberi tahu seberapa jauh mangsa.' },
        { title: 'Makin dekat, makin sering tapi makin pelan', sub: 'Laju pulsa naik, kenyaringan turun.' },
        { title: 'Satu kelelawar terbaik jadi arah tujuan', sub: 'Yang lain mengikuti, lalu menjelajah di sekitarnya.' }
      ],
      draw: drawBatInspiration
    });
  }
};

/* ---------- Karakteristik (interaktif) ---------- */

function drawBaCharacter(ctx, { t }, p, pointer) {
  ctx.clearRect(0, 0, LAB_W, LAB_H);
  drawBackdrop(ctx, t, 'purple', LAB_W, LAB_H);

  // Kiri: kurva A dan r terhadap iterasi. Kanan: kelelawar dengan lingkaran gema.
  const px = 110;
  const py = 120;
  const pw = 820;
  const ph = 330;
  const maxT = 30;
  const maxY = Math.max(1.2, p.loudness * 1.1);
  const yOf = (v) => py + ph - (v / maxY) * ph;
  const xOf = (k) => px + (k / maxT) * pw;

  drawText(ctx, 'A turun dan r naik seiring iterasi', px, 38, { size: 32, color: COLORS.ink });
  drawText(ctx, 'Gerakkan kursor di grafik untuk memilih iterasi', px, 78, { size: 22, color: COLORS.muted, weight: 600 });

  ctx.strokeStyle = 'rgba(169,187,214,0.25)';
  ctx.lineWidth = 2;
  [0, 0.5, 1, 1.5, 2].filter((v) => v <= maxY + 0.01).forEach((v) => {
    ctx.beginPath();
    ctx.moveTo(px, yOf(v));
    ctx.lineTo(px + pw, yOf(v));
    ctx.stroke();
    drawText(ctx, v.toFixed(1), px - 14, yOf(v), { size: 21, color: COLORS.muted, align: 'right', mono: true, weight: 600 });
  });
  [0, 10, 20, 30].forEach((k) => drawText(ctx, String(k), xOf(k), py + ph + 28, { size: 21, color: COLORS.muted, align: 'center', mono: true, weight: 600 }));
  drawText(ctx, 'iterasi (jumlah penerimaan) t', px + pw / 2, py + ph + 66, { size: 23, color: COLORS.muted, align: 'center', weight: 600 });

  const curveA = new Path2D();
  const curveR = new Path2D();
  for (let k = 0; k <= maxT; k += 0.5) {
    const a = loudnessAt(p.loudness, p.alphaA, k);
    const r = pulseRateAt(p.pulseRate, p.gammaR, k);
    if (k === 0) {
      curveA.moveTo(xOf(k), yOf(a));
      curveR.moveTo(xOf(k), yOf(r));
    } else {
      curveA.lineTo(xOf(k), yOf(a));
      curveR.lineTo(xOf(k), yOf(r));
    }
  }
  ctx.save();
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  ctx.shadowBlur = 14;
  ctx.shadowColor = COLORS.pink;
  ctx.strokeStyle = COLORS.pink;
  ctx.stroke(curveA);
  ctx.shadowColor = COLORS.blue;
  ctx.strokeStyle = COLORS.blueLight;
  ctx.stroke(curveR);
  ctx.restore();
  drawPill(ctx, 'A kenyaringan', px + pw - 330, py + 62, { size: 21, fill: COLORS.pink, color: COLORS.night });
  drawPill(ctx, 'r laju pulsa', px + pw - 110, py + 62, { size: 21, fill: COLORS.blueLight, color: COLORS.night });

  const overChart = pointer.active && pointer.x > px && pointer.x < px + pw && pointer.y > py - 40 && pointer.y < py + ph + 80;
  const k = overChart ? clamp01((pointer.x - px) / pw) * maxT : (0.5 - 0.5 * Math.cos(t * 0.45)) * maxT;
  const A = loudnessAt(p.loudness, p.alphaA, k);
  const r = pulseRateAt(p.pulseRate, p.gammaR, k);
  ctx.strokeStyle = hexToRgba(COLORS.gold, 0.8);
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(xOf(k), py);
  ctx.lineTo(xOf(k), py + ph);
  ctx.stroke();
  ctx.setLineDash([]);
  [[A, COLORS.pink], [r, COLORS.blueLight]].forEach(([v, c]) => {
    drawGlow(ctx, xOf(k), yOf(v), 30, hexToRgba(c, 0.6));
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(xOf(k), yOf(v), 10, 0, Math.PI * 2);
    ctx.fill();
  });
  drawPill(ctx, `t = ${k.toFixed(0)}   A = ${A.toFixed(2)}   r = ${r.toFixed(2)}`, Math.min(px + pw - 200, Math.max(px + 200, xOf(k))), py - 6, {
    size: 21,
    fill: COLORS.gold,
    mono: true
  });

  // Peragaan: radius gema ~ A, frekuensi gema ~ r
  const dx = 1010;
  const bx = dx + 180;
  const by = 255;
  drawText(ctx, 'Kelelawar pada iterasi ini', dx, 38, { size: 30, color: COLORS.ink });
  const pulses = 0.6 + r * 4.4;
  for (let n = 0; n < 3; n++) {
    drawEcho(ctx, bx, by, (t * pulses + n / 3) % 1, COLORS.purpleLight, 50 + 120 * (A / Math.max(0.5, p.loudness)), 0.9);
  }
  drawBat(ctx, bx, by, 44, { flap: t * 12 });
  drawText(ctx, `lingkaran gema ≈ kenyaringan  (A = ${A.toFixed(2)})`, dx, 452, { size: 25, color: COLORS.pink });
  drawText(ctx, `gema lebih sering ≈ laju pulsa  (r = ${r.toFixed(2)})`, dx, 494, { size: 25, color: COLORS.blueLight });
  drawText(ctx, `Peluang jelajah lokal (rand > r): ${(clamp01(1 - r) * 100).toFixed(0)}%`, dx, 546, { size: 25, color: COLORS.gold });
  drawText(ctx, `Radius jelajah lokal ∝ A: ${(A * 10).toFixed(1)}% lebar ruang`, dx, 588, { size: 25, color: COLORS.gold });
}

const baKarakter = {
  id: 'ba-karakter',
  chapter: CH.bat,
  title: 'Bat: parameter pengatur',
  notes: `
    <p>Boleh dimainkan. Geser slider dan perhatikan dua kurva.</p>
    <ul>
      <li><b>A (kenyaringan)</b> mulai dari A₀ dan dikalikan α_A setiap kali sebuah solusi diterima. A mengatur peluang menerima percobaan (rand &lt; A) dan juga radius jelajah lokal.</li>
      <li><b>r (laju pulsa)</b> mulai dari 0 lalu naik menuju r₀ lewat r₀(1 − e^(−γt)). Aturannya: bila rand lebih besar dari r, kelelawar menjelajah lokal di dekat x*.</li>
    </ul>
    <p>Tampak jelas bahwa A menurun cepat bila α_A kecil. Setelah A kecil, hampir tidak ada percobaan yang diterima dan jelajah lokal menyempit: algoritma "mengunci" ke solusi terbaik. Ini mengontrol konvergensi, tetapi juga bisa terlalu dini bila α_A terlalu kecil.</p>
    <p>Untuk jujur secara akademik: karena jelajah lokal dipilih saat rand &gt; r, kenaikan r mengurangi jelajah lokal. Itu pembacaan literal pseudo-code Yang (2010) dan disoroti beberapa ulasan sebagai bagian yang kurang intuitif.</p>`,
  mount(container, ctx) {
    return mountLab(container, ctx, {
      tag: '5 · Bat Algorithm',
      title: 'Parameter pengatur',
      color: BA_COLOR,
      intro: 'Dua nilai berubah seiring waktu. Geser untuk melihat bentuk kurva dan gemanya.',
      sliders: [
        { key: 'loudness', label: 'A₀ kenyaringan awal', min: 0.2, max: 2, step: 0.05, value: 1, desc: 'Radius jelajah lokal dan peluang menerima mulai dari sini.' },
        { key: 'pulseRate', label: 'r₀ laju pulsa maksimum', min: 0.1, max: 1, step: 0.05, value: 0.5, desc: 'Batas atas r setelah banyak iterasi.' },
        { key: 'alphaA', label: 'α_A peluruh kenyaringan', min: 0.5, max: 0.99, step: 0.01, value: 0.9, desc: 'Makin kecil, makin cepat A turun.' },
        { key: 'gammaR', label: 'γ_r pertumbuhan laju', min: 0.05, max: 2, step: 0.05, value: 0.9, desc: 'Makin besar, makin cepat r naik.' }
      ],
      draw: drawBaCharacter
    });
  }
};

/* ---------- Cara kerja ---------- */

const PANEL = { x: 660, y: 330, w: 1210, h: 660 };
const SPHERE = landscapeById('sphere');
const A_DEMO = 0.9;
const R_DEMO = 0.3;
const BEST = { x: 0.8, y: 0.5 };
const BATS = [
  { x: -3.5, y: 2.5, name: 'i' },
  { x: 3.0, y: -3.2, name: '' },
  { x: -2.2, y: -2.5, name: 'k' },
  { x: 1.6, y: 1.0, name: 'm' }
].map((b) => ({ ...b, f: SPHERE.evaluate(b.x, b.y) }));
// Percobaan global: x + (x* − x)·freq. Bat ke-4 sudah punya kecepatan lama sehingga melewati x*.
const TRIALS = [
  { freq: 0.7, rand: 0.18, accept: 0.41 },
  { freq: 0.5, rand: 0.12, accept: 0.33 },
  { freq: 0.4, rand: 0.62, accept: 0.95 },
  { freq: 0.9, rand: 0.2, accept: 0.5, override: { x: -1.9, y: 1.8 } }
];
BATS.forEach((b, i) => {
  const tr = TRIALS[i];
  tr.global = tr.override || { x: b.x + (BEST.x - b.x) * tr.freq, y: b.y + (BEST.y - b.y) * tr.freq };
  // Bat dengan rand > r menjelajah lokal di sekitar x* (radius = A · 0.1 · lebar ruang)
  tr.local = i === 2 ? { x: BEST.x - 0.35, y: BEST.y + 0.55 } : null;
  tr.final = tr.rand > R_DEMO && tr.local ? tr.local : tr.global;
  tr.fFinal = SPHERE.evaluate(tr.final.x, tr.final.y);
  tr.better = tr.fFinal < b.f;
  tr.accepted = tr.accept < A_DEMO && tr.better;
});
const LOCAL_RADIUS = A_DEMO * 0.1 * (SPHERE.max - SPHERE.min);

// Label dibagi ke atas dan bawah bergantian agar tidak saling menimpa di sekitar x*
const PILL_DY = [58, -64, 108, -112];
const clampPillX = (x) => Math.min(PANEL.x + PANEL.w - 190, Math.max(PANEL.x + 190, x));

function makeBatHowDraw() {
  let off = null;
  let vp = null;
  return function draw(ctx, { t, bt, beat }) {
    drawBackdrop(ctx, t, 'purple');
    if (!off) {
      off = document.createElement('canvas');
      off.width = PANEL.w;
      off.height = PANEL.h;
      vp = new TopoMap().paint(off.getContext('2d'), PANEL.w, PANEL.h, SPHERE, 'ba');
    }
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 28);
    ctx.clip();
    ctx.drawImage(off, PANEL.x, PANEL.y);
    ctx.restore();
    ctx.strokeStyle = 'rgba(196,181,253,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 28);
    ctx.stroke();

    const S = (p) => {
      const s = vp.worldToScreen(p.x, p.y);
      return { x: PANEL.x + s.x, y: PANEL.y + s.y };
    };
    const best = S(BEST);
    const bats = BATS.map(S);

    // Cincin lokal
    const showLocal = beat >= 1;
    if (showLocal) {
      ctx.save();
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = hexToRgba(COLORS.pink, 0.9);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(best.x, best.y, vp.worldDistToPx(LOCAL_RADIUS) * seg(bt, 0, 0.7, easeOut), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    BATS.forEach((b, i) => {
      const tr = TRIALS[i];
      const from = bats[i];
      const g = S(tr.global);
      const l = tr.local ? S(tr.local) : null;
      const usesLocal = beat >= 1 && tr.rand > R_DEMO && l;
      const target = usesLocal ? l : g;
      const staggered = seg(bt, 0.12 * i, 0.8, easeOut);

      if (beat === 0) {
        drawEcho(ctx, from.x, from.y, (t * 0.5 + i * 0.25) % 1, COLORS.purpleLight, 80, 0.8);
        drawArrow(ctx, from, g, { color: COLORS.purpleLight, width: 5, progress: staggered, dashed: true });
        if (staggered > 0.6) {
          drawPill(ctx, `f = ${tr.freq.toFixed(1)}`, lerp(from.x, g.x, 0.5), lerp(from.y, g.y, 0.5) - 28, { size: 20, fill: COLORS.night, color: COLORS.purpleLight, mono: true });
        }
      } else if (beat === 1) {
        // percobaan global yang tidak terpilih memudar bila diganti jelajah lokal
        if (usesLocal) {
          drawCross(ctx, g.x, g.y, 9, COLORS.coral, 0.65);
          drawArrow(ctx, from, l, { color: COLORS.pink, width: 5, progress: seg(bt, 0.7 + 0.1 * i, 0.9, easeOut), dashed: true });
        } else {
          drawArrow(ctx, from, g, { color: COLORS.purpleLight, width: 5, dashed: true });
        }
        const lab = usesLocal ? `rand ${tr.rand.toFixed(2)} > r ${R_DEMO} : lokal` : `rand ${tr.rand.toFixed(2)} ≤ r : tetap`;
        drawPill(ctx, lab, clampPillX(from.x), from.y + PILL_DY[i % 4], { size: 19, fill: 'rgba(5,13,38,0.85)', color: usesLocal ? COLORS.pink : COLORS.purpleLight, mono: true, alpha: seg(bt, 1.2, 0.5) });
      } else {
        const dest = S(tr.final);
        const move = tr.accepted ? seg(bt, 0.5 + 0.15 * i, 1.0, easeInOut) : 0;
        drawArrow(ctx, from, dest, { color: hexToRgba(COLORS.purpleLight, 0.5), width: 4, dashed: true, alpha: tr.accepted ? 1 - move : 1 });
        if (tr.accepted) drawCheck(ctx, dest.x, dest.y - 28, 11, COLORS.lime, seg(bt, 1.2 + 0.15 * i, 0.4));
        else drawCross(ctx, dest.x, dest.y, 11, COLORS.coral, seg(bt, 0.9 + 0.15 * i, 0.4));
        const why = tr.accepted
          ? `rand ${tr.accept.toFixed(2)} < A, lebih baik`
          : !tr.better
          ? 'lebih buruk: ditolak'
          : `lebih baik, tapi rand ${tr.accept.toFixed(2)} > A`;
        // Nomor kecil di titik tujuan, penjelasan lengkap ditaruh di daftar sisi kanan panel
        const tint = tr.accepted ? COLORS.lime : COLORS.coral;
        const badgeA = seg(bt, 1.5 + 0.15 * i, 0.5);
        const bxp = dest.x + 26;
        const byp = dest.y - 30;
        ctx.save();
        ctx.globalAlpha *= badgeA;
        ctx.fillStyle = tint;
        ctx.beginPath();
        ctx.arc(bxp, byp, 16, 0, Math.PI * 2);
        ctx.fill();
        drawText(ctx, String(i + 1), bxp, byp, { size: 20, color: COLORS.night, align: 'center', weight: 800 });
        ctx.restore();
        const ly = PANEL.y + 56 + i * 58;
        const lx = PANEL.x + PANEL.w - 40;
        ctx.save();
        ctx.globalAlpha *= badgeA;
        ctx.font = '700 22px Manrope, sans-serif';
        const lw = ctx.measureText(why).width + 84;
        ctx.fillStyle = 'rgba(5,13,38,0.9)';
        ctx.beginPath();
        ctx.roundRect(lx - lw, ly - 24, lw, 48, 24);
        ctx.fill();
        ctx.fillStyle = tint;
        ctx.beginPath();
        ctx.arc(lx - lw + 28, ly, 15, 0, Math.PI * 2);
        ctx.fill();
        drawText(ctx, String(i + 1), lx - lw + 28, ly, { size: 19, color: COLORS.night, align: 'center', weight: 800 });
        drawText(ctx, why, lx - lw + 54, ly, { size: 22, color: tint, weight: 700 });
        ctx.restore();
      }
    });

    // Kelelawar (posisi akhir bila diterima)
    BATS.forEach((b, i) => {
      const tr = TRIALS[i];
      let pos = bats[i];
      if (beat === 2 && tr.accepted) {
        const d = S(tr.final);
        const m = seg(bt, 0.5 + 0.15 * i, 1.0, easeInOut);
        pos = { x: lerp(pos.x, d.x, m), y: lerp(pos.y, d.y, m) };
      }
      drawBat(ctx, pos.x, pos.y, 22, { flap: t * 10 + i });
    });
    drawBat(ctx, best.x, best.y, 26, { flap: t * 10, color: '#fcd34d', edge: '#fff6d6', crown: true, glow: 1 });
    drawText(ctx, 'x*', best.x + 42, best.y + 34, { size: 28, color: COLORS.gold, mono: true });

    // Pengukur A dan r setelah penerimaan
    if (beat === 2) {
      const a = seg(bt, 2.4, 0.6);
      const bx = PANEL.x + 44;
      const by = PANEL.y + PANEL.h - 140;
      ctx.save();
      ctx.globalAlpha *= 0.6 + 0.4 * a;
      ctx.fillStyle = 'rgba(5,13,38,0.95)';
      ctx.strokeStyle = 'rgba(196,181,253,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx - 20, by - 50, 470, 170, 20);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      drawText(ctx, 'Bat i setelah menerima:', bx, by - 20, { size: 26, color: COLORS.ink, alpha: a });
      drawText(ctx, `A  1.00 → ${A_DEMO.toFixed(2)}  (turun)`, bx, by + 25, { size: 26, color: COLORS.pink, mono: true, alpha: a });
      drawText(ctx, `r  0.00 → ${pulseRateAt(0.5, 0.9, 1).toFixed(2)}  (naik)`, bx, by + 70, { size: 26, color: COLORS.blueLight, mono: true, alpha: a });
    }
  };
}

const baCara = {
  id: 'ba-cara',
  chapter: CH.bat,
  title: 'Bat: cara kerja',
  beats: 3,
  notes: `
    <p>Peta kecil yang sama dengan Firefly, kali ini dengan empat kelelawar dan x* sebagai yang terbaik. Nilai rand dan hasil terima/tolak adalah contoh tetap agar mudah dijelaskan.</p>
    <ol>
      <li><b>Pulsa menuju x*.</b> Setiap kelelawar menarik frekuensi acak f. Kecepatannya bertambah (x* − x)·f, lalu posisi percobaan = posisi + kecepatan. Perhatikan kelelawar m: kecepatan lamanya membuatnya melampaui x*.</li>
      <li><b>Jelajah lokal.</b> Jika rand lebih besar dari r, percobaan global diganti titik acak di sekitar x*. Radius = A · 10% lebar ruang.</li>
      <li><b>Terima atau tolak.</b> Terima hanya bila rand &lt; A <i>dan</i> percobaan lebih baik. Ada kasus lebih baik tetapi tetap ditolak karena rand melebihi A. Bila diterima, A dikalikan α_A dan r naik.</li>
    </ol>
    <p>Dalam simulasi, urutan tiga tahap ini sama persis: Pulsa, Jelajah lokal, Terima.</p>`,
  mount(container, ctx) {
    return mountStory(container, ctx, {
      tag: '6 · Cara kerja Bat',
      trail: ['Pulsa menuju x*', 'Jelajah lokal', 'Terima atau tolak'],
      beats: [
        { title: 'Terbang menuju yang terbaik', sub: 'Frekuensi acak f menentukan seberapa jauh melangkah.' },
        { title: 'Kadang menjelajah di dekat x*', sub: 'Bila rand > r, titik percobaan diganti titik acak sekitar x*.' },
        { title: 'Hanya yang lolos yang berpindah', sub: 'Harus lebih baik dan lolos peluang kenyaringan A.' }
      ],
      draw: makeBatHowDraw()
    });
  }
};

/* ---------- Simulasi ---------- */

const baRenderer = new BARenderer();

const baSim = {
  id: 'ba-sim',
  chapter: CH.bat,
  title: 'Bat: simulasi langsung',
  notes: `
    <p>Mesin Bat sungguhan. Tombol sama: Mulai (P), Langkah (S), Reset (R).</p>
    <ul>
      <li>Tiga tahap per iterasi: <b>Pulsa</b> (belah ketupat ungu = posisi percobaan), <b>Jelajah lokal</b> (cincin merah muda di sekitar x*), <b>Terima</b> (centang hijau berpindah, silang merah ditolak).</li>
      <li>Di iterasi awal r masih 0, jadi hampir semua kelelawar menjelajah lokal. Seiring r naik, sebagian tetap memakai percobaan global.</li>
      <li>Teks di panel kanan menampilkan Ā dan r̄ yang berubah setiap iterasi.</li>
    </ul>
    <p>Anggaran evaluasi Bat sama dengan Firefly: satu evaluasi per individu per iterasi. Itu yang membuat perbandingan di slide berikutnya adil.</p>`,
  mount(container, ctx) {
    return mountConsole(container, ctx, {
      idPrefix: 'ba',
      tag: '6 · Simulasi Bat',
      title: 'Bat Algorithm',
      color: BA_COLOR,
      renderer: baRenderer,
      speed: 3,
      maxIterations: 30,
      phases: [
        { key: 'PULSE', label: 'Pulsa' },
        { key: 'LOCAL', label: 'Jelajah lokal' },
        { key: 'ACCEPT', label: 'Terima' }
      ],
      params: [
        { key: 'populationSize', label: 'Populasi', min: 6, max: 40, step: 1, value: 20 },
        { key: 'fmax', label: 'f maks', min: 0.5, max: 2.5, step: 0.1, value: 1.5 },
        { key: 'loudness', label: 'A₀', min: 0.2, max: 2, step: 0.05, value: 1 },
        { key: 'pulseRate', label: 'r₀', min: 0.1, max: 1, step: 0.05, value: 0.5 },
        { key: 'alphaA', label: 'α_A', min: 0.5, max: 0.99, step: 0.01, value: 0.9 },
        { key: 'gammaR', label: 'γ_r', min: 0.05, max: 2, step: 0.05, value: 0.9 }
      ],
      createEngine: (config) => {
        const o = config.objective;
        return new BAEngine({
          dim: 2,
          lo: o.min,
          hi: o.max,
          fitness: (x) => o.evaluate(x[0], x[1]),
          populationSize: config.populationSize,
          maxIterations: config.maxIterations,
          seed: config.seed,
          fmax: config.fmax,
          loudness: config.loudness,
          pulseRate: config.pulseRate,
          alphaA: config.alphaA,
          gammaR: config.gammaR
        });
      }
    });
  }
};

export const baSlides = [baInspirasi, baKarakter, baCara, baSim];
