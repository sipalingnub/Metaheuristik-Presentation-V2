/**
 * Bab Masalah dan Metaheuristik: judul, permasalahan penjadwalan tugas cloud, dan lanskap pencarian.
 * Semua scene di sini adalah ilustrasi; angka makespan berasal dari data penjadwalan yang sama dengan simulasi.
 */

import { clamp01, easeBack, easeInOut, easeOut, lerp, seg } from '../render/motion.js';
import {
  COLORS,
  arcPoint,
  drawArrow,
  drawBackdrop,
  drawBat,
  drawFirefly,
  drawGlow,
  drawPill,
  drawStar,
  drawText,
  hexToRgba
} from '../render/sprites.js';
import { drawSchedule, layoutOf, taskColor } from '../render/cloudRenderer.js';
import { DEFAULT_VMS, generateTasks, idealMakespan, roundRobin } from '../algorithms/cloudScheduling.js';
import { mountStory } from './frame.js';
import { hash01 } from '../render/ambient.js';
import { CH } from './chapters.js';

const TASKS = generateTasks(16, 2026);
const VMS = DEFAULT_VMS;
const RR = roundRobin(TASKS, VMS);
const IDEAL = idealMakespan(TASKS, VMS);
const RR_LAYOUT = layoutOf(RR);
const TOTAL_COMBOS = Math.pow(VMS.length, TASKS.length);

const fmtInt = (n) => n.toLocaleString('id-ID');

/* ---------- Judul ---------- */

function drawTitleScene(ctx, { t }) {
  drawBackdrop(ctx, t, 'blue');

  // Kunang-kunang melayang di seluruh layar
  for (let i = 0; i < 28; i++) {
    const cx = 100 + hash01(i + 3) * 1720;
    const cy = 100 + hash01(i + 40) * 880;
    const x = cx + Math.sin(t * (0.4 + hash01(i) * 0.5) + i) * (50 + hash01(i + 9) * 70);
    const y = cy + Math.cos(t * (0.35 + hash01(i + 5) * 0.4) + i * 2) * (40 + hash01(i + 11) * 60);
    const blink = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.8 + hash01(i + 17)) + i));
    drawFirefly(ctx, x, y, 12 + hash01(i + 21) * 9, { glow: blink, t });
  }

  // Kelelawar melintas dari kanan ke kiri
  for (let i = 0; i < 6; i++) {
    const speed = 90 + i * 22;
    const x = 2100 - ((t * speed + i * 420) % 2500);
    const y = 130 + i * 110 + Math.sin(t * 1.3 + i * 2) * 40;
    drawBat(ctx, x, y, 22 + (i % 3) * 5, { flap: t * 11 + i, angle: Math.sin(t + i) * 0.08 });
  }
}

const judulSlide = {
  id: 'judul',
  chapter: CH.masalah,
  title: 'Judul',
  notes: `
    <p>Sapa audiens. Mulai dari pertanyaan sehari-hari: kalau ada banyak pekerjaan dan beberapa komputer yang kecepatannya beda, pekerjaan mana ditaruh di komputer mana?</p>
    <p>Hari ini kita bandingkan dua jawaban dari alam: kunang-kunang (Firefly Algorithm) dan kelelawar (Bat Algorithm). Keduanya diuji pada beban kerja dan fungsi tujuan yang sama.</p>`,
  mount(container, ctx) {
    const cleanup = mountStory(container, ctx, {
      tag: '',
      beats: [{
        title: 'Firefly Algorithm vs Bat Algorithm',
        html: '<span class="c-fa">Firefly Algorithm</span><span class="c-vs">vs</span><span class="c-ba">Bat Algorithm</span>',
        sub: ''
      }],
      draw: drawTitleScene
    });

    container.classList.add('hero');
    return cleanup;
  }
};

/* ---------- Masalah ---------- */

const QUEUE_GAP = 9;
const TOTAL_QUEUE_W = TASKS.reduce((sum, task, i) => sum + task.mi * 0.2 + (i < TASKS.length - 1 ? QUEUE_GAP : 0), 0);
const QUEUE_START_X = Math.round((1920 - TOTAL_QUEUE_W) / 2);
const QUEUE_Y = 295;
const SCHED_RECT = { x: 180, y: 480, w: 1630, h: 460 };

function drawProblemScene(ctx, { t, bt, beat }) {
  drawBackdrop(ctx, t, 'blue');
  const tMax = RR.makespan * 1.12;
  const dim = 1;

  ctx.save();
  ctx.globalAlpha = dim;
  if (beat === 0) {
    // Antrean tugas: lebar chip sebanding panjang tugas (MI), diposisikan di tengah panggung
    let x = QUEUE_START_X;
    TASKS.forEach((task, i) => {
      const w = task.mi * 0.2;
      const bob = Math.sin(t * 1.6 + i) * 6;
      const enter = seg(bt, i * 0.07, 0.6, easeBack);
      ctx.save();
      ctx.globalAlpha *= clamp01(enter * 2);
      ctx.fillStyle = taskColor(task.id);
      ctx.beginPath();
      ctx.roundRect(x, QUEUE_Y + bob - (1 - enter) * 70, w, 62, 12);
      ctx.fill();
      drawText(ctx, task.name, x + w / 2, QUEUE_Y + 31 + bob - (1 - enter) * 70, { size: 26, color: COLORS.night, align: 'center', weight: 800 });
      drawText(ctx, `${task.mi} MI`, x + w / 2, QUEUE_Y + 90 + bob - (1 - enter) * 70, { size: 19, color: COLORS.muted, align: 'center', weight: 600, mono: true });
      ctx.restore();
      x += w + QUEUE_GAP;
    });
    drawSchedule(ctx, SCHED_RECT, TASKS, VMS, new Map(), { tMax, laneColor: COLORS.blue });
    VMS.forEach((vm, j) => {
      const laneH = (SCHED_RECT.h - 14 * 3) / 4;
      const y = SCHED_RECT.y + j * (laneH + 14);
      const pulse = 0.5 + 0.5 * Math.sin(t * 2 + j);
      drawText(ctx, `${(vm.mips / VMS[0].mips).toFixed(1)}× lebih cepat`, 1760, y + laneH / 2, {
        size: 28,
        color: COLORS.blueLight,
        align: 'right',
        alpha: 0.45 + 0.4 * pulse,
        weight: 700
      });
    });
  } else if (beat === 1) {
    drawSchedule(ctx, SCHED_RECT, TASKS, VMS, RR_LAYOUT, {
      tMax,
      laneColor: COLORS.blue,
      queue: { x: QUEUE_START_X, y: QUEUE_Y },
      appear: (idx) => clamp01((bt - 0.3 - 0.26 * idx) / 0.85),
      makespan: bt > 5.6 ? RR.makespan : null,
      ideal: bt > 6.4 ? IDEAL : null
    });
  }
  ctx.restore();

  const trackX = SCHED_RECT.x + 168;
  const trackW = SCHED_RECT.w - 168;
  const msX = trackX + (RR.makespan / tMax) * trackW;
  const idX = trackX + (IDEAL / tMax) * trackW;

  if (beat === 1) {
    if (bt > 5.6) {
      drawPill(ctx, `makespan Round-Robin ${RR.makespan.toFixed(1)} s`, msX - 20, SCHED_RECT.y - 40, {
        fill: COLORS.gold,
        size: 25,
        alpha: seg(bt, 5.6, 0.5, easeOut)
      });
    }
    if (bt > 6.4) {
      drawPill(ctx, `batas bawah ideal ${IDEAL.toFixed(1)} s`, idX - 6, SCHED_RECT.y + SCHED_RECT.h + 46, {
        fill: COLORS.lime,
        size: 25,
        alpha: seg(bt, 6.4, 0.5, easeOut)
      });
    }
  }

  if (beat === 2) drawBranchingTree(ctx, bt);
}

/* Pohon percabangan: tiap tugas membuka empat pilihan VM, jadi jumlah jadwal tumbuh empat kali lipat per tugas. */

const TREE = { x0: 190, dx: 235, top: 360, bottom: 960, levels: 4 };
const TREE_COLORS = [COLORS.cyan, COLORS.purple, COLORS.pink, COLORS.gold];
const MS_PER_CHECK = 1; // anggapan: satu jadwal dicek dalam 1 milidetik
const DAYS_ALL = (TOTAL_COMBOS * MS_PER_CHECK) / 86_400_000;

function treeNode(level, i) {
  const n = 4 ** level;
  return { x: TREE.x0 + level * TREE.dx, y: level === 0 ? (TREE.top + TREE.bottom) / 2 : TREE.top + ((i + 0.5) * (TREE.bottom - TREE.top)) / n };
}

function drawBranchingTree(ctx, bt) {
  for (let level = 1; level <= TREE.levels; level++) {
    const p = seg(bt, 0.2 + (level - 1) * 0.85, 0.85, easeOut);
    if (p <= 0) continue;
    const n = 4 ** level;
    const small = level >= 4;
    for (let i = 0; i < n; i++) {
      const from = treeNode(level - 1, Math.floor(i / 4));
      const to = treeNode(level, i);
      const ex = from.x + (to.x - from.x) * p;
      const ey = from.y + (to.y - from.y) * p;
      ctx.strokeStyle = hexToRgba(TREE_COLORS[i % 4], small ? 0.34 : 0.62);
      ctx.lineWidth = small ? 1 : level === 3 ? 1.6 : 2.6;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      if (!small && p > 0.9) {
        ctx.fillStyle = TREE_COLORS[i % 4];
        ctx.beginPath();
        ctx.arc(to.x, to.y, level === 1 ? 9 : level === 2 ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    drawText(ctx, `tugas ${level}`, TREE.x0 + level * TREE.dx, TREE.top - 34, { size: 24, color: COLORS.muted, align: 'center', weight: 700, alpha: p });
    drawText(ctx, fmtInt(n), TREE.x0 + level * TREE.dx, TREE.bottom + 44, { size: 32, color: COLORS.gold, align: 'center', mono: true, weight: 700, alpha: p });
  }
  const root = treeNode(0, 0);
  drawGlow(ctx, root.x, root.y, 46, 'rgba(251,191,36,0.5)');
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(root.x, root.y, 14, 0, Math.PI * 2);
  ctx.fill();
  drawText(ctx, 'mulai', root.x, TREE.top - 34, { size: 24, color: COLORS.muted, align: 'center', weight: 700 });
  drawText(ctx, 'jadwal', root.x, TREE.bottom + 44, { size: 24, color: COLORS.muted, align: 'center', weight: 700 });

  // Lanjutan ke tugas 16
  const dotsA = seg(bt, 4.0, 0.7, easeOut);
  if (dotsA > 0) {
    const lastX = TREE.x0 + TREE.levels * TREE.dx;
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = hexToRgba(COLORS.ink, 0.35 + 0.65 * Math.abs(Math.sin(bt * 2 + k)));
      ctx.beginPath();
      ctx.arc(lastX + 70 + k * 26, 660, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    drawText(ctx, 'sampai tugas 16', lastX + 108, 710, { size: 25, color: COLORS.muted, align: 'center', weight: 700, alpha: dotsA });
  }

  // Stopwatch: berapa lama kalau semua jadwal dicek satu per satu
  const cx = 1560;
  const cy = 600;
  const r = 150;
  const clockA = seg(bt, 4.4, 0.6, easeOut);
  if (clockA > 0) {
    ctx.save();
    ctx.globalAlpha *= clockA;
    ctx.lineWidth = 22;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    const sweep = seg(bt, 4.8, 3.2, easeInOut);
    ctx.strokeStyle = COLORS.coral;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sweep * 0.92);
    ctx.stroke();
    ctx.restore();
    const days = Math.round(DAYS_ALL * sweep);
    drawText(ctx, `±${days}`, cx, cy - 12, { size: 84, color: COLORS.coral, align: 'center', mono: true, weight: 800, alpha: clockA });
    drawText(ctx, 'hari nonstop', cx, cy + 52, { size: 30, color: COLORS.ink, align: 'center', weight: 700, alpha: clockA });
    drawText(ctx, 'kalau tiap jadwal dicek 1 milidetik', cx, cy + r + 62, { size: 25, color: COLORS.muted, align: 'center', weight: 600, alpha: clockA });
    drawText(ctx, `(tugas 16 ≈ ${(TOTAL_COMBOS / 1e9).toFixed(1).replace('.', ',')} miliar jadwal)`, cx, cy + r + 98, { size: 22, color: COLORS.muted, align: 'center', weight: 600, alpha: clockA });
  }
  const pillA = seg(bt, 8.2, 0.7, easeOut);
  if (pillA > 0) {
    drawPill(ctx, 'FA dan BA di deck ini: sekitar 1.100 evaluasi', cx, 900, { fill: COLORS.lime, size: 28, alpha: pillA });
  }
}

const masalahSlide = {
  id: 'masalah',
  chapter: CH.masalah,
  title: 'Masalah penjadwalan',
  beats: 3,
  notes: `
    <p><b>Beat 1.</b> Ada 16 tugas dengan panjang berbeda (satuan MI, juta instruksi) dan 4 VM dengan kecepatan berbeda (85 sampai 175 MIPS). Waktu eksekusi satu tugas = MI dibagi MIPS.</p>
    <p><b>Beat 2.</b> Cara paling sederhana adalah Round-Robin: tugas dibagi bergiliran. Adil dari sisi jumlah, tapi tidak adil dari sisi waktu. VM paling lambat menerima jatah sama banyak, sehingga selesai paling akhir. Waktu selesai VM terakhir itulah <b>makespan</b>. Garis hijau adalah batas bawah ideal bila seluruh instruksi terbagi sempurna sesuai kecepatan VM.</p>
    <p><b>Beat 3.</b> Pohon percabangan: tiap tugas membuka empat pilihan VM, jadi jumlah jadwal naik empat kali lipat per tugas (4, 16, 64, 256, dan seterusnya sampai tugas ke-16, sekitar 4,3 miliar). Bila satu jadwal dicek dalam satu milidetik, mengecek semuanya butuh hampir 50 hari nonstop. Pengaturan bawaan FA dan BA di deck ini hanya memakai sekitar 1.100 evaluasi (28 individu × 40 iterasi, ditambah evaluasi awal). Jadi kita butuh cara mencari yang cerdas. Itu pintu masuk ke metaheuristik.</p>`,
  mount(container, ctx) {
    return mountStory(container, ctx, {
      tag: '1 · Latar belakang',
      beats: [
        { title: '16 tugas, 4 VM yang kecepatannya beda', sub: 'Tugas mana ditaruh di VM mana?' },
        { title: 'Bagi rata belum tentu adil', sub: 'VM terlambat menentukan waktu selesai seluruh pekerjaan.' },
        { title: 'Terlalu banyak untuk dicoba satu per satu', sub: 'Butuh pencari yang cerdas, bukan pencoba semua.' }
      ],
      draw: drawProblemScene
    });
  }
};

/* ---------- Lanskap pencarian ---------- */

const LX0 = 180;
const LX1 = 1770;
const L_BASE = 950;
const L_H = 470;

function height(u) {
  const g = (c, w) => Math.exp(-(((u - c) / w) ** 2));
  const raw = 1 - 0.5 * g(0.17, 0.065) - 0.42 * g(0.47, 0.075) - 0.9 * g(0.8, 0.06) + 0.05 * Math.sin(u * 30);
  return Math.max(0.04, raw * 0.82);
}

const toX = (u) => LX0 + u * (LX1 - LX0);
const toY = (u) => L_BASE - height(u) * L_H;

function slope(u) {
  return (height(u + 0.002) - height(u - 0.002)) / 0.004;
}

function descend(u0, steps = 600) {
  const path = [u0];
  let u = u0;
  for (let k = 0; k < steps; k++) {
    u = Math.min(0.99, Math.max(0.01, u - 0.0009 * slope(u) * 6));
    path.push(u);
  }
  return path;
}

function findMin(from, to) {
  let best = from;
  for (let u = from; u <= to; u += 0.001) if (height(u) < height(best)) best = u;
  return best;
}

const U_LOCAL_A = findMin(0.05, 0.3);
const U_LOCAL_B = findMin(0.35, 0.6);
const U_GLOBAL = findMin(0.65, 0.95);
const HIKER_PATH = descend(0.36);
const SWARM = Array.from({ length: 14 }, (_, i) => {
  const u0 = 0.04 + hash01(i + 70) * 0.92;
  const path = descend(u0, 240);
  return { u0, uLoc: path[path.length - 1], uFin: U_GLOBAL + (hash01(i + 120) - 0.5) * 0.05, delay: 0.12 * i };
});

function drawTerrain(ctx, t, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  const fill = ctx.createLinearGradient(0, L_BASE - L_H, 0, L_BASE);
  fill.addColorStop(0, 'rgba(139, 92, 246, 0.55)');
  fill.addColorStop(0.5, 'rgba(59, 130, 246, 0.4)');
  fill.addColorStop(1, 'rgba(34, 211, 238, 0.12)');
  ctx.beginPath();
  ctx.moveTo(LX0, L_BASE + 40);
  for (let u = 0; u <= 1.0001; u += 0.004) ctx.lineTo(toX(u), toY(u));
  ctx.lineTo(LX1, L_BASE + 40);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  for (let u = 0; u <= 1.0001; u += 0.004) {
    if (u === 0) ctx.moveTo(toX(u), toY(u));
    else ctx.lineTo(toX(u), toY(u));
  }
  ctx.strokeStyle = COLORS.cyanLight;
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
  drawText(ctx, 'jadwal yang dicoba →', LX1, L_BASE + 36, { size: 24, color: COLORS.muted, align: 'right', weight: 600 });
  drawText(ctx, 'waktu selesai ↑', LX0, L_BASE - L_H - 32, { size: 24, color: COLORS.muted, weight: 600 });
}

function drawBall(ctx, u, color = COLORS.gold, r = 22, lift = 0) {
  const x = toX(u);
  const y = toY(u) - r - lift;
  drawGlow(ctx, x, y, r * 2.6, hexToRgba(color, 0.5));
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawLandscapeScene(ctx, { t, bt, beat }) {
  drawBackdrop(ctx, t, 'purple');
  drawTerrain(ctx, t);

  // Penanda optimum
  drawStar(ctx, toX(U_GLOBAL), toY(U_GLOBAL) - 220, 26);
  drawPill(ctx, 'terbaik sejagat', toX(U_GLOBAL), toY(U_GLOBAL) - 290, { size: 26, fill: 'rgba(5,13,38,0.88)', color: COLORS.gold });
  [U_LOCAL_A, U_LOCAL_B].forEach((u) => {
    drawPill(ctx, 'lembah dangkal', toX(u), toY(u) + 54, { size: 22, fill: 'rgba(251,113,133,0.9)', color: COLORS.night });
  });

  if (beat === 0) {
    const idx = Math.min(HIKER_PATH.length - 1, Math.floor(bt * 70));
    const u = HIKER_PATH[idx];
    drawBall(ctx, u, COLORS.gold, 24);
    if (idx >= HIKER_PATH.length - 1 || bt > 6) {
      const a = seg(bt, 3.2, 0.6, easeOut);
      drawPill(ctx, 'Terjebak! Semua arah naik, padahal ada lembah lebih dalam', toX(u), toY(u) - 120, {
        fill: COLORS.coral,
        size: 28,
        alpha: a
      });
    } else {
      drawText(ctx, 'satu pencari, selalu turun', toX(0.36), toY(0.36) - 110, { size: 28, align: 'center', color: COLORS.ink });
    }
  }

  if (beat === 1) {
    SWARM.forEach((a, i) => {
      const settle = seg(bt, 0.0, 1.8, easeInOut);
      let u = lerp(a.u0, a.uLoc, settle);
      let lift = 0;
      const hopStart = 3.0 + a.delay;
      if (bt > hopStart) {
        const p = seg(bt, hopStart, 1.3, easeInOut);
        u = lerp(a.uLoc, a.uFin, p);
        lift = Math.sin(Math.PI * p) * 220;
      }
      const isScout = i === 0;
      drawBall(ctx, u, isScout ? COLORS.gold : COLORS.cyan, 16, lift);
    });
    // Pencari yang sudah menemukan lembah terdalam "menyala" dan memanggil yang lain
    const a1 = seg(bt, 2.0, 0.6, easeOut);
    SWARM.slice(1, 9).forEach((a) => {
      const from = { x: toX(a.uLoc), y: toY(a.uLoc) - 40 };
      const to = { x: toX(U_GLOBAL), y: toY(U_GLOBAL) - 80 };
      if (bt < 4.5) drawArrow(ctx, from, to, { bend: 160, color: hexToRgba(COLORS.gold, 0.45), width: 3, dashed: true, progress: a1, alpha: 0.9 - seg(bt, 3.4, 1.0) * 0.9 });
    });
    if (bt > 1.8 && bt < 3.4) {
      drawPill(ctx, 'berbagi informasi: "di sini lebih dalam!"', toX(0.62), toY(0.62) - 330, { fill: COLORS.gold, size: 28 });
    }
  }

  if (beat === 2) {
    const phase = (bt % 8) / 8;
    const explore = phase < 0.5;
    const k = explore ? phase / 0.5 : (phase - 0.5) / 0.5;
    // Jelajah: lompatan lebar; Telusuri: langkah kecil di dekat yang terbaik
    const hops = explore ? 5 : 7;
    for (let h = 0; h < hops; h++) {
      const prog = clamp01(k * hops - h);
      if (prog <= 0) continue;
      const a = explore ? 0.12 + hash01(h + 200) * 0.76 : U_GLOBAL - 0.07 + (hash01(h + 300) - 0.5) * 0.08 + h * 0.01;
      const b = explore ? 0.12 + hash01(h + 201) * 0.76 : U_GLOBAL - 0.07 + (hash01(h + 301) - 0.5) * 0.08 + (h + 1) * 0.01;
      const from = { x: toX(a), y: toY(a) - 30 };
      const to = { x: toX(b), y: toY(b) - 30 };
      drawArrow(ctx, from, to, {
        bend: explore ? 180 : 40,
        color: explore ? COLORS.blueLight : COLORS.gold,
        width: explore ? 5 : 4,
        progress: prog,
        dashed: !explore
      });
    }
    // Penggeser jelajah → telusuri
    const sx = 520;
    const sw = 880;
    const sy = 400;
    ctx.fillStyle = 'rgba(242,247,255,0.14)';
    ctx.beginPath();
    ctx.roundRect(sx, sy - 9, sw, 18, 9);
    ctx.fill();
    const mark = explore ? lerp(0.05, 0.45, k) : lerp(0.55, 0.95, k);
    ctx.fillStyle = explore ? COLORS.blue : COLORS.gold;
    ctx.beginPath();
    ctx.arc(sx + sw * mark, sy, 20, 0, Math.PI * 2);
    ctx.fill();
    drawText(ctx, 'jelajah', sx, sy - 40, { size: 32, color: COLORS.blueLight });
    drawText(ctx, 'telusuri', sx + sw, sy - 40, { size: 32, color: COLORS.gold, align: 'right' });
    drawText(ctx, explore ? 'Awal: lompat jauh, cari lembah baru' : 'Akhir: langkah kecil, rapikan hasil', 960, sy + 52, {
      size: 32,
      align: 'center',
      color: explore ? COLORS.blueLight : COLORS.gold
    });
  }
}

const lanskapSlide = {
  id: 'lanskap',
  chapter: CH.metaheuristik,
  title: 'Lanskap pencarian',
  beats: 3,
  notes: `
    <p><b>Beat 1.</b> Bayangkan setiap jadwal sebagai satu titik di pegunungan, dengan tinggi = waktu selesai. Pencari tunggal yang hanya mau turun akan berhenti di lembah terdekat. Itu optimum lokal. Lembah yang lebih dalam tidak pernah ia lihat.</p>
    <p><b>Beat 2.</b> Metaheuristik memakai banyak pencari sekaligus dan membuat mereka saling memberi kabar. Satu pencari yang beruntung menemukan lembah dalam, lalu yang lain ikut bergerak ke sana.</p>
    <p><b>Beat 3.</b> Kuncinya keseimbangan. Di awal kita jelajah luas supaya tidak terjebak. Di akhir kita telusuri teliti supaya hasilnya rapi. Firefly dan Bat mengatur keseimbangan ini dengan cara berbeda, dan itu inti perbandingan kita.</p>`,
  mount(container, ctx) {
    return mountStory(container, ctx, {
      tag: '2 · Konsep dasar metaheuristik',
      beats: [
        { title: 'Satu pencari mudah terjebak', sub: 'Ia hanya turun ke lembah terdekat.' },
        { title: 'Banyak pencari yang saling memberi kabar', sub: 'Satu menemukan lembah dalam, semua ikut.' },
        { title: 'Jelajah dulu, telusuri kemudian', sub: 'Keseimbangan inilah yang diatur Firefly dan Bat.' }
      ],
      draw: drawLandscapeScene
    });
  }
};

export const pembukaSlides = [judulSlide, masalahSlide, lanskapSlide];
export { TASKS, VMS, RR, IDEAL };
