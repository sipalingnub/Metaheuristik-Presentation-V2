/**
 * Bab Firefly: inspirasi, karakteristik (slider interaktif), cara kerja bertahap, dan simulasi nyata.
 * Slide inspirasi dan cara kerja adalah ilustrasi; angka β di slide cara kerja dihitung dengan rumus yang sama dengan mesin.
 */

import { clamp01, easeOut, lerp, seg } from '../render/motion.js';
import {
  COLORS,
  drawArrow,
  drawBackdrop,
  drawFirefly,
  drawGlow,
  drawPill,
  drawStar,
  drawText,
  hexToRgba
} from '../render/sprites.js';
import { TopoMap } from '../render/heatmap.js';
import { FARenderer } from '../render/mapRenderers.js';
import { landscapeById } from '../core/landscapes.js';
import { FAEngine, attractiveness } from '../algorithms/firefly.js';
import { mountStory } from './frame.js';
import { hash01, drift } from '../render/ambient.js';
import { mountConsole } from './console.js';
import { mountLab, LAB_W, LAB_H } from './lab.js';
import { CH, FA_COLOR } from './chapters.js';

/* ---------- Inspirasi ---------- */

const FOOD = { x: 1480, y: 700 };
const N_FLY = 22;
const BOX = { x: 180, y: 340, w: 1640, h: 600 };

function quality(p) {
  const d = Math.hypot(p.x - FOOD.x, p.y - FOOD.y);
  return Math.exp(-((d / 520) ** 2));
}

function drawMeadow(ctx, t) {
  // Siluet bukit dan rumput di bawah
  ctx.fillStyle = '#04122c';
  ctx.beginPath();
  ctx.moveTo(0, 1080);
  for (let x = 0; x <= 1920; x += 40) ctx.lineTo(x, 985 + Math.sin(x * 0.004) * 26 + Math.sin(x * 0.011) * 10);
  ctx.lineTo(1920, 1080);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#06204a';
  ctx.lineWidth = 4;
  for (let i = 0; i < 90; i++) {
    const x = hash01(i + 600) * 1920;
    const h = 40 + hash01(i + 700) * 70;
    const sway = Math.sin(t * 1.1 + i) * 8;
    ctx.beginPath();
    ctx.moveTo(x, 1010);
    ctx.quadraticCurveTo(x + sway * 0.4, 1010 - h * 0.6, x + sway, 1010 - h);
    ctx.stroke();
  }
}

function makeInspirationDraw() {
  const phys = { active: false, flies: [] };
  return function draw(ctx, { t, bt, dt, beat }) {
    drawBackdrop(ctx, t, 'cyan');
    drawMeadow(ctx, t);

    const showFood = beat >= 1;
    if (showFood) {
      const a = beat === 1 ? seg(bt, 0, 0.8, easeOut) : 1;
      drawStar(ctx, FOOD.x, FOOD.y - 10, 30, { alpha: a });
      drawPill(ctx, 'tempat terbaik', FOOD.x - 380, FOOD.y - 10, { size: 26, fill: 'rgba(5,13,38,0.88)', color: COLORS.gold, alpha: a });
    }

    if (beat === 2 && !phys.active) {
      phys.active = true;
      phys.flies = Array.from({ length: N_FLY }, (_, i) => {
        const p = drift(i, t, BOX);
        return { x: p.x, y: p.y, vx: 0, vy: 0 };
      });
    }
    if (beat < 2) phys.active = false;

    let flies;
    if (phys.active) {
      // Mini FA: yang redup mendekat ke yang lebih terang, daya tarik meredup dengan jarak
      const step = Math.min(dt, 0.05);
      const snap = phys.flies.map((f) => ({ x: f.x, y: f.y, q: quality(f) }));
      phys.flies.forEach((f, i) => {
        let ax = 0;
        let ay = 0;
        let brighter = 0;
        let sx = 0;
        let sy = 0;
        snap.forEach((o, j) => {
          if (j === i) return;
          const d = Math.hypot(o.x - f.x, o.y - f.y) || 1;
          if (o.q > snap[i].q) {
            const r = d / 1800;
            const beta = Math.exp(-4 * r * r);
            ax += beta * (o.x - f.x);
            ay += beta * (o.y - f.y);
            brighter++;
          }
          // Jaga jarak antar kunang-kunang agar kelompok tetap terlihat sebagai banyak titik
          if (d < 90) {
            sx += ((f.x - o.x) / d) * (90 - d);
            sy += ((f.y - o.y) / d) * (90 - d);
          }
        });
        // Rata-rata tarikan (bukan jumlah) supaya tidak runtuh ke satu titik
        if (brighter > 0) {
          ax /= brighter;
          ay /= brighter;
        }
        f.vx = f.vx * 0.9 + (ax * 0.25 + sx * 0.6) * step + (hash01(i * 3 + Math.floor(t * 4)) - 0.5) * 140 * step;
        f.vy = f.vy * 0.9 + (ay * 0.25 + sy * 0.6) * step + (hash01(i * 5 + Math.floor(t * 4)) - 0.5) * 140 * step;
        f.x = Math.min(1840, Math.max(80, f.x + f.vx));
        f.y = Math.min(895, Math.max(330, f.y + f.vy));
      });
      flies = phys.flies.map((f) => ({ x: f.x, y: f.y }));

      // Garis tarikan ke tiga tetangga yang lebih terang
      flies.forEach((f, i) => {
        const qi = quality(f);
        const better = flies
          .map((o, j) => ({ o, j, q: quality(o), d: Math.hypot(o.x - f.x, o.y - f.y) }))
          .filter((c) => c.q > qi + 0.04 && c.d > 40)
          .sort((a, b) => a.d - b.d)
          .slice(0, 1);
        better.forEach((c) => {
          ctx.strokeStyle = hexToRgba(COLORS.cyanLight, 0.22);
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.moveTo(f.x, f.y);
          ctx.lineTo(c.o.x, c.o.y);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      });
    } else {
      flies = Array.from({ length: N_FLY }, (_, i) => drift(i, t, BOX));
    }

    flies.forEach((p, i) => {
      const blink = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.7 + hash01(i + 17)) + i));
      const q = quality(p);
      let glow = blink;
      if (beat >= 1) glow = lerp(blink, 0.1 + 0.9 * q, beat === 1 ? seg(bt, 0.2, 1.2) : 1);
      drawFirefly(ctx, p.x, p.y, 17, { glow, t, color: beat >= 1 && q > 0.7 ? COLORS.gold : COLORS.cyan, core: beat >= 1 && q > 0.7 ? '#fff6d6' : '#f4fdff' });
    });

    if (beat === 1) {
      const a = seg(bt, 1.0, 0.7, easeOut);
      drawPill(ctx, 'terang = solusi bagus', 460, 955, { fill: COLORS.cyan, size: 30, alpha: a });
      drawPill(ctx, 'redup = solusi kurang bagus', 880, 955, { fill: 'rgba(165,243,252,0.28)', color: COLORS.ink, size: 30, alpha: a });
    }
    if (beat === 2) {
      const a = seg(bt, 0.4, 0.7, easeOut);
      drawPill(ctx, 'yang redup terbang ke yang lebih terang', 960, 955, { fill: COLORS.cyan, size: 30, alpha: a });
    }
  };
}

const faInspirasi = {
  id: 'fa-inspirasi',
  chapter: CH.firefly,
  title: 'Firefly: inspirasi',
  beats: 3,
  notes: `
    <p><b>Beat 1.</b> Kunang-kunang menyala untuk menarik pasangan dan mangsa. Setiap kunang-kunang adalah satu kandidat jadwal.</p>
    <p><b>Beat 2.</b> Aturan pertama: cahaya adalah kualitas solusi. Semakin bagus jadwalnya (makespan makin kecil), semakin terang nyalanya.</p>
    <p><b>Beat 3.</b> Aturan kedua: kunang-kunang yang lebih redup terbang mendekati yang lebih terang. Semakin jauh jaraknya, semakin lemah tarikannya karena cahaya meredup di udara. Itulah dua aturan inti Firefly Algorithm (Yang, 2009).</p>`,
  mount(container, ctx) {
    return mountStory(container, ctx, {
      tag: '3 · Firefly Algorithm',
      beats: [
        { title: 'Kunang-kunang menyala untuk saling memanggil', sub: 'Tiap kunang-kunang adalah satu kandidat jadwal.' },
        { title: 'Makin terang, makin bagus solusinya', sub: 'Kecerahan mewakili kualitas, bukan sekadar hiasan.' },
        { title: 'Yang redup mengejar yang terang', sub: 'Makin jauh, makin lemah tarikannya.' }
      ],
      draw: makeInspirationDraw()
    });
  }
};

/* ---------- Karakteristik (interaktif) ---------- */

function drawFaCharacter(ctx, { t }, p, pointer) {
  ctx.clearRect(0, 0, LAB_W, LAB_H);
  drawBackdrop(ctx, t, 'cyan', LAB_W, LAB_H);

  // Kiri: kurva daya tarik. Kanan: peragaan gerak dua kunang-kunang.
  const px = 110;
  const py = 120;
  const pw = 820;
  const ph = 330;
  const yOf = (b) => py + ph - (b / 1.5) * ph;
  const xOf = (r) => px + r * pw;

  drawText(ctx, 'Daya tarik β menurun seiring jarak r', px, 38, { size: 32, color: COLORS.ink });
  drawText(ctx, 'Gerakkan kursor di grafik untuk memilih jarak', px, 78, { size: 22, color: COLORS.muted, weight: 600 });

  ctx.strokeStyle = 'rgba(169,187,214,0.25)';
  ctx.lineWidth = 2;
  [0, 0.5, 1, 1.5].forEach((b) => {
    ctx.beginPath();
    ctx.moveTo(px, yOf(b));
    ctx.lineTo(px + pw, yOf(b));
    ctx.stroke();
    drawText(ctx, b.toFixed(1), px - 14, yOf(b), { size: 21, color: COLORS.muted, align: 'right', mono: true, weight: 600 });
  });
  [0, 0.25, 0.5, 0.75, 1].forEach((r) => {
    drawText(ctx, r.toFixed(2), xOf(r), py + ph + 28, { size: 21, color: COLORS.muted, align: 'center', mono: true, weight: 600 });
  });
  drawText(ctx, 'jarak ternormalisasi r', px + pw / 2, py + ph + 66, { size: 23, color: COLORS.muted, align: 'center', weight: 600 });

  const curve = new Path2D();
  for (let i = 0; i <= 120; i++) {
    const r = i / 120;
    const b = attractiveness(p.beta0, p.gamma, r);
    if (i === 0) curve.moveTo(xOf(r), yOf(b));
    else curve.lineTo(xOf(r), yOf(b));
  }
  const area = new Path2D();
  area.addPath(curve);
  area.lineTo(xOf(1), yOf(0));
  area.lineTo(xOf(0), yOf(0));
  area.closePath();
  const fade = ctx.createLinearGradient(0, py, 0, py + ph);
  fade.addColorStop(0, 'rgba(34,211,238,0.5)');
  fade.addColorStop(1, 'rgba(34,211,238,0.04)');
  ctx.fillStyle = fade;
  ctx.fill(area);
  ctx.save();
  ctx.shadowColor = FA_COLOR;
  ctx.shadowBlur = 16;
  ctx.strokeStyle = FA_COLOR;
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  ctx.stroke(curve);
  ctx.restore();

  // Jarak yang dipilih: ikut kursor, atau menyapu sendiri bila kursor tidak di grafik
  const overChart = pointer.active && pointer.x > px && pointer.x < px + pw && pointer.y > py - 40 && pointer.y < py + ph + 80;
  const r = overChart ? clamp01((pointer.x - px) / pw) : 0.5 - 0.5 * Math.cos(t * 0.55);
  const beta = attractiveness(p.beta0, p.gamma, r);
  ctx.strokeStyle = hexToRgba(COLORS.gold, 0.8);
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(xOf(r), yOf(0));
  ctx.lineTo(xOf(r), yOf(beta));
  ctx.stroke();
  ctx.setLineDash([]);
  drawGlow(ctx, xOf(r), yOf(beta), 34, 'rgba(251,191,36,0.6)');
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(xOf(r), yOf(beta), 11, 0, Math.PI * 2);
  ctx.fill();
  drawPill(ctx, `r = ${r.toFixed(2)}  →  β = ${beta.toFixed(2)}`, Math.min(px + pw - 150, Math.max(px + 150, xOf(r))), yOf(beta) - 52, { size: 23, fill: COLORS.gold, mono: true });

  // Peragaan di sisi kanan
  const dx = 1010;
  const dy = 300;
  const worldW = 560;
  const left = dx + 70;
  drawText(ctx, 'Yang redup bergerak sejauh  β × jarak', dx, 38, { size: 30, color: COLORS.ink });
  const bright = { x: left, y: dy };
  const dim = { x: left + r * worldW, y: dy };
  const landing = { x: dim.x + (bright.x - dim.x) * beta, y: dy };
  drawArrow(ctx, { x: dim.x, y: dy + 62 }, { x: landing.x, y: dy + 62 }, { color: COLORS.cyanLight, width: 6, bend: 0 });
  if (p.alpha > 0.005) {
    ctx.save();
    ctx.strokeStyle = hexToRgba('#ffffff', 0.6);
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(landing.x, landing.y, 28 + p.alpha * 140, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    drawText(ctx, 'acak ± α', landing.x, landing.y - 42 - p.alpha * 140, { size: 21, color: COLORS.muted, align: 'center', weight: 600 });
  }
  ctx.save();
  ctx.globalAlpha = 0.45;
  drawFirefly(ctx, dim.x, dim.y, 24, { glow: 0.22, t });
  ctx.restore();
  drawFirefly(ctx, landing.x, landing.y, 24, { glow: 0.5, t });
  drawFirefly(ctx, bright.x, bright.y, 28, { glow: 1, t, color: COLORS.gold, core: '#fff6d6', crown: true });
  drawText(ctx, 'terang', bright.x, dy + 106, { size: 25, color: COLORS.gold, align: 'center' });
  drawText(ctx, 'redup (awal)', dim.x, dy - 58, { size: 23, color: COLORS.muted, align: 'center' });
  drawText(ctx, 'posisi baru', landing.x, dy + 150, { size: 23, color: COLORS.cyanLight, align: 'center' });
  drawText(ctx, beta > 0.8 ? 'dekat: hampir menempel' : beta > 0.35 ? 'sedang: separuh jalan' : 'jauh: nyaris tidak bergeser', dx, 520, {
    size: 30,
    color: COLORS.cyanLight
  });
}

const faKarakter = {
  id: 'fa-karakter',
  chapter: CH.firefly,
  title: 'Firefly: tiga tombol pengatur',
  notes: `
    <p>Slide ini boleh dimainkan langsung. Geser slider dan lihat kurva berubah.</p>
    <ul>
      <li><b>β₀</b>: daya tarik saat dua kunang-kunang berdekatan. Besar berarti langsung menempel.</li>
      <li><b>γ</b>: peredam jarak. γ kecil, tarikan terasa dari jauh (satu kelompok besar). γ besar, tarikan hanya terasa dari dekat (banyak kelompok kecil, lebih menjelajah).</li>
      <li><b>α</b>: lebar langkah acak. Besar berarti banyak jelajah, kecil berarti hasil rapi. Nilainya menyusut tiap iterasi dalam simulasi.</li>
    </ul>
    <p>Jarak r di sini dinormalkan ke 0 sampai 1 (lebar ruang pencarian), jadi γ berarti sama di peta 2D maupun jadwal 16 tugas.</p>`,
  mount(container, ctx) {
    return mountLab(container, ctx, {
      tag: '3 · Firefly Algorithm',
      title: 'Tiga tombol pengatur',
      color: FA_COLOR,
      intro: 'Coba geser. Kurva dan peragaan gerak langsung ikut berubah.',
      sliders: [
        { key: 'beta0', label: 'β₀ daya tarik dasar', min: 0.2, max: 1.5, step: 0.05, value: 1, desc: 'Seberapa kuat tarikan saat jarak nol.' },
        { key: 'gamma', label: 'γ peredam jarak', min: 0, max: 10, step: 0.1, value: 2, desc: 'Makin besar, makin cepat tarikan lenyap oleh jarak.' },
        { key: 'alpha', label: 'α langkah acak', min: 0, max: 0.6, step: 0.01, value: 0.25, desc: 'Lebar jelajah acak setelah terbang.' }
      ],
      draw: drawFaCharacter
    });
  }
};

/* ---------- Cara kerja ---------- */

const PANEL = { x: 660, y: 330, w: 1210, h: 660 };
const SPHERE = landscapeById('sphere');
const DEMO_GAMMA = 2;
const DEMO_SPAN = SPHERE.max - SPHERE.min;
const DEMO_FLIES = [
  { x: -3.8, y: 2.9 },
  { x: -2.2, y: -3.0 },
  { x: 3.4, y: 3.1 },
  { x: 1.6, y: -1.0 },
  { x: -0.8, y: 1.9 },
  { x: 3.2, y: -2.6 }
].map((p) => ({ ...p, f: SPHERE.evaluate(p.x, p.y) }));
const FOCUS = 0;
const BRIGHTER = DEMO_FLIES.map((f, j) => j).filter((j) => DEMO_FLIES[j].f < DEMO_FLIES[FOCUS].f);

function demoBeta(i, j) {
  const a = DEMO_FLIES[i];
  const b = DEMO_FLIES[j];
  const r = Math.hypot(a.x - b.x, a.y - b.y) / DEMO_SPAN / Math.SQRT2;
  return attractiveness(1, DEMO_GAMMA, r);
}

// Hasil gerak berurutan, persis seperti MOVE pada FAEngine
const DEMO_PATH = (() => {
  const pts = [{ x: DEMO_FLIES[FOCUS].x, y: DEMO_FLIES[FOCUS].y }];
  const cur = { ...pts[0] };
  BRIGHTER.forEach((j) => {
    const target = DEMO_FLIES[j];
    const r = Math.hypot(cur.x - target.x, cur.y - target.y) / DEMO_SPAN / Math.SQRT2;
    const beta = attractiveness(1, DEMO_GAMMA, r);
    cur.x += beta * (target.x - cur.x);
    cur.y += beta * (target.y - cur.y);
    pts.push({ x: cur.x, y: cur.y });
  });
  return pts;
})();
const DEMO_RANDOM = { x: 0.35, y: -0.25 };

function makeHowDraw() {
  let off = null;
  let vp = null;
  return function draw(ctx, { t, bt, beat }) {
    drawBackdrop(ctx, t, 'cyan');
    if (!off) {
      off = document.createElement('canvas');
      off.width = PANEL.w;
      off.height = PANEL.h;
      vp = new TopoMap().paint(off.getContext('2d'), PANEL.w, PANEL.h, SPHERE, 'fa');
    }
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 28);
    ctx.clip();
    ctx.drawImage(off, PANEL.x, PANEL.y);
    ctx.restore();
    ctx.strokeStyle = 'rgba(165,243,252,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 28);
    ctx.stroke();

    const toS = (p) => {
      const s = vp.worldToScreen(p.x, p.y);
      return { x: PANEL.x + s.x, y: PANEL.y + s.y };
    };
    const maxF = DEMO_FLIES[FOCUS].f;
    const screen = DEMO_FLIES.map(toS);

    // Garis tarikan
    if (beat >= 1) {
      BRIGHTER.forEach((j, k) => {
        const b = demoBeta(FOCUS, j);
        const a = seg(bt, 0.15 * k, 0.7, easeOut);
        const strength = beat >= 2 ? b : 0.55;
        drawArrow(ctx, screen[FOCUS], screen[j], {
          color: hexToRgba(COLORS.cyanLight, 0.35 + 0.6 * strength),
          width: beat >= 2 ? 2 + 9 * b : 4,
          progress: beat === 1 ? a : 1,
          bend: 0,
          dashed: beat === 1
        });
        if (beat >= 2) {
          const mx = lerp(screen[FOCUS].x, screen[j].x, 0.55);
          const my = lerp(screen[FOCUS].y, screen[j].y, 0.55);
          drawPill(ctx, `β ${b.toFixed(2)}`, mx, my - 26, { size: 22, fill: COLORS.night, color: COLORS.cyanLight, mono: true, alpha: seg(bt, 0.2 + 0.1 * k, 0.5) });
        }
      });
    }

    DEMO_FLIES.forEach((f, i) => {
      const glow = 0.12 + 0.88 * (1 - f.f / (maxF * 1.02));
      const best = f.f === Math.min(...DEMO_FLIES.map((d) => d.f));
      if (i === FOCUS && beat >= 3) return;
      drawFirefly(ctx, screen[i].x, screen[i].y, 24, {
        glow: beat === 0 ? lerp(0.5, glow, seg(bt, 0, 1)) : glow,
        t,
        color: best ? COLORS.gold : COLORS.cyan,
        core: best ? '#fff6d6' : '#f4fdff',
        crown: best
      });
      if (beat === 0) {
        drawPill(ctx, `f = ${f.f.toFixed(1)}`, screen[i].x, screen[i].y + 54, {
          size: 20,
          fill: 'rgba(5,13,38,0.82)',
          color: best ? COLORS.gold : COLORS.ink,
          mono: true,
          alpha: seg(bt, 0.3 + 0.1 * i, 0.5)
        });
      }
    });
    if (beat === 0) {
      drawText(ctx, 'f kecil = terang', PANEL.x + 34, PANEL.y + 42, { size: 28, color: COLORS.gold });
    }
    if (beat < 3) {
      drawText(ctx, 'i', screen[FOCUS].x, screen[FOCUS].y - 52, { size: 32, color: COLORS.cyanLight, align: 'center', mono: true });
    }

    if (beat === 3) {
      // Gerak bertahap lewat setiap yang lebih terang, lalu langkah acak
      const pts = DEMO_PATH.map(toS);
      const total = pts.length - 1;
      const prog = seg(bt, 0.2, 2.6, (x) => x) * total;
      let cur = pts[0];
      for (let k = 0; k < total; k++) {
        const local = clamp01(prog - k);
        if (local <= 0) break;
        const a = pts[k];
        const b = pts[k + 1];
        ctx.strokeStyle = hexToRgba(COLORS.cyanLight, 0.8);
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        cur = { x: lerp(a.x, b.x, local), y: lerp(a.y, b.y, local) };
        ctx.lineTo(cur.x, cur.y);
        ctx.stroke();
      }
      const afterMove = pts[total];
      const randA = seg(bt, 3.1, 0.8, easeOut);
      const walk = vp.worldToScreen(DEMO_PATH[total].x + DEMO_RANDOM.x, DEMO_PATH[total].y + DEMO_RANDOM.y);
      const wp = { x: PANEL.x + walk.x, y: PANEL.y + walk.y };
      if (randA > 0) {
        ctx.save();
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = hexToRgba('#fff', 0.6);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(afterMove.x, afterMove.y, 70 * randA, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        cur = { x: lerp(afterMove.x, wp.x, randA), y: lerp(afterMove.y, wp.y, randA) };
      }
      drawFirefly(ctx, cur.x, cur.y, 24, { glow: 0.45, t });
      drawPill(ctx, 'posisi baru = tarikan + langkah acak', PANEL.x + PANEL.w / 2, PANEL.y + PANEL.h - 40, {
        size: 26,
        fill: COLORS.cyan,
        alpha: seg(bt, 3.4, 0.6)
      });
      ctx.save();
      ctx.globalAlpha = 0.4;
      drawFirefly(ctx, screen[FOCUS].x, screen[FOCUS].y, 24, { glow: 0.12, t });
      ctx.restore();
    }
  };
}

const faCara = {
  id: 'fa-cara',
  chapter: CH.firefly,
  title: 'Firefly: cara kerja',
  beats: 4,
  notes: `
    <p>Ini satu kunang-kunang (i) yang paling redup dan enam rekannya di peta sederhana. Semua angka β dihitung dengan rumus yang sama dengan simulasi (γ = 2).</p>
    <ol>
      <li><b>Nilai kecerahan.</b> Hitung f untuk setiap posisi. f kecil berarti terang.</li>
      <li><b>Tertarik.</b> i melihat semua yang lebih terang darinya.</li>
      <li><b>Meredup oleh jarak.</b> Tarikan ke yang dekat kuat, ke yang jauh lemah. Tebal garis = nilai β.</li>
      <li><b>Bergerak.</b> i bergeser sedikit demi sedikit ke tiap yang lebih terang, lalu ditambah langkah acak kecil supaya tidak terkunci.</li>
    </ol>
    <p>Satu iterasi = tiga tahap itu untuk semua kunang-kunang. Berikutnya kita lihat langsung di simulasi.</p>`,
  mount(container, ctx) {
    return mountStory(container, ctx, {
      tag: '4 · Cara kerja Firefly',
      trail: ['Nilai kecerahan', 'Tertarik ke yang terang', 'Meredup oleh jarak', 'Bergerak + acak'],
      beats: [
        { title: 'Terang berarti bagus', sub: 'Nilai f dihitung dulu untuk setiap kunang-kunang.' },
        { title: 'Yang redup melihat yang terang', sub: 'Tiap kunang-kunang mengincar semua yang lebih terang.' },
        { title: 'Makin jauh, makin lemah', sub: 'Tebal garis menunjukkan daya tarik β.' },
        { title: 'Terbang, lalu goyang sedikit', sub: 'Tarikan menentukan arah, langkah acak menjaga jelajah.' }
      ],
      draw: makeHowDraw()
    });
  }
};

/* ---------- Simulasi ---------- */

const faRenderer = new FARenderer();

const faSim = {
  id: 'fa-sim',
  chapter: CH.firefly,
  title: 'Firefly: simulasi langsung',
  notes: `
    <p>Ini mesin Firefly yang sebenarnya, bukan animasi. Tekan Mulai (P), Langkah (S), atau Reset (R).</p>
    <ul>
      <li>Tiap iterasi punya tiga tahap: <b>Ukur kecerahan</b>, <b>Terbang ke yang lebih terang</b>, <b>Langkah acak</b>.</li>
      <li>Garis putus-putus saat terbang adalah tarikan, makin tebal makin kuat. Titik emas dengan mahkota adalah yang paling terang.</li>
      <li>Rastrigin penuh lembah palsu. Coba naikkan γ untuk melihat kunang-kunang terpecah ke beberapa kelompok, atau turunkan untuk satu kelompok besar.</li>
    </ul>
    <p>Bintang emas di peta menandai optimum global (0, 0) dengan f = 0. Hasil bergantung seed, jadi coba beberapa seed.</p>`,
  mount(container, ctx) {
    return mountConsole(container, ctx, {
      idPrefix: 'fa',
      tag: '4 · Simulasi Firefly',
      title: 'Firefly Algorithm',
      color: FA_COLOR,
      renderer: faRenderer,
      speed: 3,
      maxIterations: 30,
      phases: [
        { key: 'EVAL', label: 'Ukur kecerahan' },
        { key: 'MOVE', label: 'Terbang' },
        { key: 'WALK', label: 'Langkah acak' }
      ],
      params: [
        { key: 'populationSize', label: 'Populasi', min: 6, max: 40, step: 1, value: 20 },
        { key: 'beta0', label: 'β₀', min: 0.2, max: 1.5, step: 0.05, value: 1 },
        { key: 'gamma', label: 'γ', min: 0, max: 10, step: 0.1, value: 2 },
        { key: 'alpha', label: 'α', min: 0, max: 0.6, step: 0.01, value: 0.25 }
      ],
      createEngine: (config) => {
        const o = config.objective;
        return new FAEngine({
          dim: 2,
          lo: o.min,
          hi: o.max,
          fitness: (x) => o.evaluate(x[0], x[1]),
          populationSize: config.populationSize,
          maxIterations: config.maxIterations,
          seed: config.seed,
          beta0: config.beta0,
          gamma: config.gamma,
          alpha: config.alpha
        });
      }
    });
  }
};

export const faSlides = [faInspirasi, faKarakter, faCara, faSim];
