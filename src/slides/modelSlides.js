/*  *//**
 * Bab Model: dari posisi agen menjadi jadwal (fungsi fitness), lalu persamaan FA dan BA.
 * Matematika baru muncul setelah penonton melihat gerakannya di bab sebelumnya.
 */

import { clamp01, easeOut, lerp, seg } from '../render/motion.js';
import { COLORS, drawBackdrop, drawMath, drawPill, drawText, hexToRgba } from '../render/sprites.js';
import { drawSchedule, layoutOf, taskColor } from '../render/cloudRenderer.js';
import {
  DEFAULT_VMS,
  TIE_BREAK,
  decodeSchedule,
  evaluateSchedule,
  generateTasks,
  sharedInitialPopulation
} from '../algorithms/cloudScheduling.js';
import { mountStory } from './frame.js';
import { CH, FA_COLOR, BA_COLOR } from './chapters.js';

const TASKS = generateTasks(16, 2026);
const VMS = DEFAULT_VMS;
const VECTOR = sharedInitialPopulation(16, 4, 1, 11)[0];
const ASSIGN = decodeSchedule(VECTOR, 4);
const EVAL = evaluateSchedule(VECTOR, TASKS, VMS);
const LAYOUT = layoutOf(EVAL);
const LANE_COLORS = [COLORS.blue, COLORS.cyan, COLORS.purple, COLORS.pink];

const STEP_LABELS = ['1 · Posisi = angka', '2 · Bulatkan jadi VM', '3 · Jumlahkan waktu', '4 · Makespan = fitness'];
const STEP_X = [290, 690, 1110, 1530];

function drawFitnessScene(ctx, { t, bt, beat }) {
  drawBackdrop(ctx, t, 'gold');

  // Penunjuk tahap horizontal, digambar di kanvas agar tidak menabrak isi slide
  STEP_LABELS.forEach((label, i) => {
    const active = i === beat;
    drawPill(ctx, label, STEP_X[i], 292, {
      size: 24,
      fill: active ? COLORS.gold : 'rgba(255,255,255,0.07)',
      color: active ? COLORS.night : COLORS.muted,
      alpha: active ? 1 : 0.8
    });
  });

  // Vektor posisi: dua baris, 8 chip per baris
  const showChips = beat <= 1;
  const chipW = 194;
  const chipH = 92;
  if (showChips) {
    TASKS.forEach((task, i) => {
      const col = i % 8;
      const row = Math.floor(i / 8);
      const x = 180 + col * (chipW + 10);
      const y = 350 + row * (chipH + 22);
      const appear = seg(bt, 0.05 * i, 0.5, easeOut);
      const flip = beat === 1 ? seg(bt, 0.1 + 0.07 * i, 0.5) : 0;
      ctx.save();
      ctx.globalAlpha *= appear;
      ctx.fillStyle = hexToRgba(taskColor(task.id), 0.16);
      ctx.strokeStyle = taskColor(task.id);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x, y - (1 - appear) * 30, chipW, chipH, 16);
      ctx.fill();
      ctx.stroke();
      drawText(ctx, task.name, x + 16, y + 22 - (1 - appear) * 30, { size: 22, color: taskColor(task.id), mono: true });
      if (flip < 0.5) {
        drawText(ctx, VECTOR[i].toFixed(2), x + chipW / 2, y + 58 - (1 - appear) * 30, { size: 38, align: 'center', mono: true, alpha: 1 - flip * 2 });
      } else {
        const a = (flip - 0.5) * 2;
        drawText(ctx, `⌊${VECTOR[i].toFixed(2)}⌋`, x + chipW / 2, y + 35 - (1 - appear) * 30, { size: 22, align: 'center', mono: true, color: COLORS.muted, alpha: a });
        ctx.fillStyle = LANE_COLORS[ASSIGN[i]];
        ctx.beginPath();
        ctx.roundRect(x + 36, y + 50 - (1 - appear) * 30, chipW - 72, 34, 12);
        ctx.fill();
        drawText(ctx, `VM-${ASSIGN[i] + 1}`, x + chipW / 2, y + 67 - (1 - appear) * 30, { size: 24, align: 'center', color: COLORS.night, weight: 800, alpha: a });
      }
      ctx.restore();
    });
    if (beat === 0) {
      drawMath(ctx, 'X = (x_1, x_2, …, x_{16}),   x_i ∈ [0, 4)', 180, 640, { size: 46, color: COLORS.gold });
      drawText(ctx, 'Satu posisi kunang-kunang atau kelelawar = satu daftar angka. Setiap angka mewakili satu tugas.', 180, 730, { size: 32, color: COLORS.muted });
      drawText(ctx, 'Angka ini hanyalah koordinat. Belum ada VM.', 180, 785, { size: 32, color: COLORS.ink });
    } else {
      drawMath(ctx, 'VM_i = ⌊x_i⌋ + 1', 180, 640, { size: 46, color: COLORS.gold });
      drawText(ctx, 'Pembulatan ke bawah mengubah koordinat menjadi nomor VM.', 180, 730, { size: 32, color: COLORS.muted });
      drawText(ctx, 'Geser sedikit saja angkanya dan satu tugas bisa pindah VM.', 180, 785, { size: 32, color: COLORS.ink });
    }
    return;
  }

  const rect = { x: 180, y: 400, w: 1630, h: 420 };
  const tMax = Math.max(EVAL.makespan * 1.1, 1);
  drawSchedule(ctx, rect, TASKS, VMS, LAYOUT, {
    tMax,
    laneColor: COLORS.blue,
    queue: { x: 200, y: 340 },
    appear: beat === 2 ? (idx) => clamp01((bt - 0.15 * idx) / 0.8) : () => 1,
    makespan: beat === 3 ? EVAL.makespan : null
  });

  const trackX = rect.x + 168;
  const trackW = rect.w - 168;
  const laneH = (rect.h - 14 * 3) / 4;
  EVAL.vmLoads.forEach((load, j) => {
    const y = rect.y + j * (laneH + 14) + laneH / 2;
    const isMax = Math.abs(load - EVAL.makespan) < 1e-9;
    const x = trackX + (load / tMax) * trackW + 14;
    drawText(ctx, `L${j + 1} = ${load.toFixed(2)} s`, Math.min(x, 1650), y, {
      size: 26,
      mono: true,
      color: beat === 3 && isMax ? COLORS.gold : COLORS.ink,
      alpha: beat === 2 ? seg(bt, 2.8, 0.6) : 1,
      weight: isMax && beat === 3 ? 800 : 600
    });
  });

  if (beat === 2) {
    const ex = TASKS[2];
    const vm = VMS[ASSIGN[2]];
    drawMath(ctx, `t = MI / MIPS = ${ex.mi} / ${vm.mips} = ${(ex.mi / vm.mips).toFixed(2)} s   (contoh ${ex.name} di VM-${ASSIGN[2] + 1})`, 180, 880, { size: 34, color: COLORS.gold, alpha: seg(bt, 0.6, 0.6) });
    drawMath(ctx, 'L_j = Σ t_{ij}   untuk semua tugas i di VM j', 180, 940, { size: 34, color: COLORS.ink, alpha: seg(bt, 2.4, 0.6) });
  } else {
    drawMath(ctx, 'F(X) = max_j L_j + 0.001 · σ(L)', 180, 890, { size: 44, color: COLORS.gold });
    drawText(ctx, `makespan = ${EVAL.makespan.toFixed(2)} s di VM-${EVAL.vmLoads.indexOf(EVAL.makespan) + 1}.   Suku σ hanya pemecah seri (${TIE_BREAK}), tidak mengubah urutan makespan.`, 180, 950, {
      size: 27,
      color: COLORS.muted
    });
  }
}

const modelFitness = {
  id: 'model-fitness',
  chapter: CH.model,
  title: 'Model: posisi menjadi jadwal',
  beats: 4,
  notes: `
    <p>Sekarang rumusnya, setelah gerakannya terlihat. Masalah penjadwalan kita diskrit (tugas ke VM), tetapi FA dan BA bekerja di ruang kontinu. Jembatannya sederhana.</p>
    <ol>
      <li><b>Posisi.</b> Satu agen = vektor X dengan satu angka per tugas, masing-masing di rentang [0, m) dengan m = jumlah VM.</li>
      <li><b>Dekode.</b> Nomor VM tugas i = lantai dari x_i (ditambah satu untuk penomoran). Ini yang disebut decoding.</li>
      <li><b>Waktu.</b> Waktu eksekusi t = MI / MIPS. Beban VM j (L_j) adalah jumlah waktu semua tugas di VM itu.</li>
      <li><b>Fitness.</b> Makespan = max L_j. Suku 0,001·σ hanya pemecah seri agar jadwal dengan makespan sama tetap bisa dibedakan.</li>
    </ol>
    <p>Fungsi yang sama dipanggil oleh FA dan BA. Itulah yang membuat perbandingannya adil. Catatan: Yousif dkk. (2011) memakai aturan SPV (smallest position value) untuk memetakan posisi ke sumber daya. Di sini dipakai pembulatan sederhana, alasannya kemudahan visualisasi.</p>`,
  mount(container, ctx) {
    return mountStory(container, ctx, {
      tag: '7 · Model matematis dan fungsi fitness',
      beats: [
        { title: 'Satu posisi adalah satu daftar angka', sub: 'Satu angka untuk setiap tugas.' },
        { title: 'Dibulatkan menjadi nomor VM', sub: 'Koordinat kontinu menjadi jadwal diskrit.' },
        { title: 'Tiap VM menjumlahkan waktu kerjanya', sub: 'Waktu = panjang tugas dibagi kecepatan VM.' },
        { title: 'Yang paling terlambat menentukan nilai', sub: 'Makespan kecil berarti jadwal bagus.' }
      ],
      draw: drawFitnessScene
    });
  }
};

/* ---------- Persamaan ---------- */

const FA_EQ = [
  { tag: 'jarak', eq: 'r_{ij} = √( mean_d ((x_{id} − x_{jd}) / L)^2 )', note: 'dinormalkan oleh lebar domain L, hasil 0 sampai 1' },
  { tag: 'tarikan', eq: 'β(r) = β_0 · e^{−γ r^2}', note: 'makin jauh, makin lemah' },
  { tag: 'terbang', eq: 'x_i ← x_i + β(r_{ij}) · (x_j − x_i)', note: 'untuk setiap j dengan f(x_j) < f(x_i)' },
  { tag: 'goyang', eq: 'x_i ← x_i + α_t · (rand − 0.5) · L', note: 'α_{t+1} = δ · α_t, langkah acak menyusut' }
];

const BA_EQ = [
  { tag: 'frekuensi', eq: 'f_i = f_{min} + (f_{max} − f_{min}) · u', note: 'u acak di [0, 1]' },
  { tag: 'pulsa', eq: 'v_i ← v_i + (x* − x_i) · f_i,   x_{try} = x_i + v_i', note: 'terbang menuju x* (tanda mengikuti penjelasan, lihat catatan)' },
  { tag: 'lokal', eq: 'jika rand > r_i:  x_{try} = x* + ε · Ā · 0.1 L', note: 'ε ∈ [−1, 1], Ā = kenyaringan rata-rata' },
  { tag: 'terima', eq: 'terima bila rand < A_i dan f(x_{try}) < f(x_i)', note: 'lalu A_i ← α_A A_i,   r_i = r_0 (1 − e^{−γt})' }
];

function drawEquations(ctx, { t, bt, beat }) {
  drawBackdrop(ctx, t, 'blue');
  const cols = [
    { x: 180, w: 790, color: FA_COLOR, light: COLORS.cyanLight, title: 'Firefly', rows: FA_EQ },
    { x: 1000, w: 790, color: BA_COLOR, light: COLORS.purpleLight, title: 'Bat', rows: BA_EQ }
  ];
  cols.forEach((col) => {
    ctx.fillStyle = hexToRgba(col.color, 0.1);
    ctx.strokeStyle = hexToRgba(col.color, 0.55);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(col.x, 330, col.w, 660, 26);
    ctx.fill();
    ctx.stroke();
    drawText(ctx, col.title, col.x + 34, 380, { size: 42, color: col.light, weight: 800 });
    col.rows.forEach((row, k) => {
      const y = 450 + k * 138;
      const a = k <= beat ? seg(k === beat ? bt : 9, 0, 0.6, easeOut) : 0;
      if (a <= 0) return;
      ctx.save();
      ctx.translate(0, (1 - a) * 24);
      drawPill(ctx, row.tag, col.x + 34 + 60, y, { size: 21, fill: col.color, color: COLORS.night, alpha: a });
      drawMath(ctx, row.eq, col.x + 34, y + 44, { size: col.title === 'Bat' ? 26 : 29, color: COLORS.ink, alpha: a });
      drawMath(ctx, row.note, col.x + 34, y + 84, { size: 21, color: COLORS.muted, weight: 500, alpha: a });
      ctx.restore();
    });
  });
}

const modelPersamaan = {
  id: 'model-persamaan',
  chapter: CH.model,
  title: 'Model: persamaan FA dan BA',
  beats: 4,
  notes: `
    <p>Setiap baris persamaan sudah pernah muncul sebagai gerakan. Tekan panah kanan untuk membuka pasangan berikutnya.</p>
    <p><b>Firefly:</b> jarak yang dinormalkan, daya tarik yang meredup, terbang ke yang lebih terang, lalu goyang acak. Sumber: Yang (2009) dan penerapannya pada penjadwalan job di grid oleh Yousif dkk. (2011).</p>
    <p><b>Bat:</b> frekuensi acak, kecepatan menuju x*, jelajah lokal, lalu terima atau tolak dengan kenyaringan. Sumber: Yang (2010). Penerapan penjadwalan workflow di cloud oleh Raghavan dkk. (2015).</p>
    <p>Catatan jujur: (1) Jarak dan langkah acak pada Firefly dinormalkan oleh lebar domain agar γ dan α berarti sama pada 2D dan 16 dimensi. Itu pilihan implementasi, bukan bagian rumus asli. (2) Yang (2010) menulis kecepatan dengan (x_i − x*). Di sini dibalik menjadi (x* − x_i) agar kelelawar bergerak mendekati x*, sesuai deskripsi. Cek ke sumber asli sebelum menulis laporan.</p>`,
  mount(container, ctx) {
    return mountStory(container, ctx, {
      tag: '7 · Model matematis',
      beats: [
        { title: 'Persamaannya, sekarang masuk akal', sub: 'Jarak dan pengukuran dulu.' },
        { title: 'Daya tarik dan frekuensi', sub: 'Dua mesin pengatur arah.' },
        { title: 'Terbang dan menjelajah', sub: 'Aturan gerak masing-masing.' },
        { title: 'Goyang acak dan seleksi', sub: 'Penjaga keragaman dan pengunci hasil.' }
      ],
      draw: drawEquations
    });
  }
};

export const modelSlides = [modelFitness, modelPersamaan];
export { LAYOUT, EVAL };
