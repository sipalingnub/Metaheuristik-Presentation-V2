import fs from 'node:fs';

let code = fs.readFileSync('public/app.bundle.js', 'utf8');

// Target snippet around TASKS2.forEach in modelFitness
const target = `  var STEP_X = [230, 640, 1060, 1500];
  function drawFitnessScene(ctx, { t, bt, beat }) {
    drawBackdrop(ctx, t, "gold");
    STEP_LABELS.forEach((label, i) => {
      const active = i === beat;
      drawPill(ctx, label, STEP_X[i], 292, {
        size: 24,
        fill: active ? COLORS.gold : "rgba(255,255,255,0.07)",
        color: active ? COLORS.night : COLORS.muted,
        alpha: active ? 1 : 0.8
      });
    });
    const showChips = beat <= 1;
    const chipW = 202;
    const chipH = 92;
    if (showChips) {
      TASKS2.forEach((task, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const x = 70 + col * (chipW + 12);
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
          drawText(ctx, VECTOR[i].toFixed(2), x + chipW / 2, y + 58 - (1 - appear) * 30, { size: 38, align: "center", mono: true, alpha: 1 - flip * 2 });
        } else {
          const a = (flip - 0.5) * 2;
          drawText(ctx, \`\\u230A\${VECTOR[i].toFixed(2)}\\u230B\`, x + chipW / 2, y + 35 - (1 - appear) * 30, { size: 22, align: "center", mono: true, color: COLORS.muted, alpha: a });
          ctx.fillStyle = LANE_COLORS[ASSIGN[i]];
          ctx.beginPath();
          ctx.roundRect(x + 36, y + 50 - (1 - appear) * 30, chipW - 72, 34, 12);
          ctx.fill();
          drawText(ctx, \`VM-\${ASSIGN[i] + 1}\`, x + chipW / 2, y + 67 - (1 - appear) * 30, { size: 24, align: "center", color: COLORS.night, weight: 800, alpha: a });
        }
        ctx.restore();
      });
      if (beat === 0) {
        drawMath(ctx, "X = (x_1, x_2, \\u2026, x_{16}),   x_i \\u2208 [0, 4)", 120, 640, { size: 46, color: COLORS.gold });
        drawText(ctx, "Satu posisi kunang-kunang atau kelelawar = satu daftar angka. Setiap angka mewakili satu tugas.", 120, 730, { size: 32, color: COLORS.muted });
        drawText(ctx, "Angka ini hanyalah koordinat. Belum ada VM.", 120, 785, { size: 32, color: COLORS.ink });
      } else {
        drawMath(ctx, "VM_i = \\u230Ax_i\\u230B + 1", 120, 640, { size: 46, color: COLORS.gold });
        drawText(ctx, "Pembulatan ke bawah mengubah koordinat menjadi nomor VM.", 120, 730, { size: 32, color: COLORS.muted });
        drawText(ctx, "Geser sedikit saja angkanya dan satu tugas bisa pindah VM.", 120, 785, { size: 32, color: COLORS.ink });
      }
      return;
    }
    const rect = { x: 100, y: 400, w: 1720, h: 420 };
    const tMax = Math.max(EVAL.makespan * 1.1, 1);
    drawSchedule(ctx, rect, TASKS2, VMS2, LAYOUT, {
      tMax,
      laneColor: COLORS.blue,
      queue: { x: 140, y: 340 },
      appear: beat === 2 ? (idx) => clamp01((bt - 0.15 * idx) / 0.8) : () => 1,
      makespan: beat === 3 ? EVAL.makespan : null
    });
    const trackX = rect.x + 168;
    const trackW = rect.w - 168;
    const laneH = (rect.h - 14 * 3) / 4;
    EVAL.vmLoads.forEach((load, j) => {
      const y = rect.y + j * (laneH + 14) + laneH / 2;
      const isMax = Math.abs(load - EVAL.makespan) < 1e-9;
      const x = trackX + load / tMax * trackW + 14;
      drawText(ctx, \`L\${j + 1} = \${load.toFixed(2)} s\`, Math.min(x, 1650), y, {
        size: 26,
        mono: true,
        color: beat === 3 && isMax ? COLORS.gold : COLORS.ink,
        alpha: beat === 2 ? seg(bt, 2.8, 0.6) : 1,
        weight: isMax && beat === 3 ? 800 : 600
      });
    });
    if (beat === 2) {
      const ex = TASKS2[2];
      const vm = VMS2[ASSIGN[2]];
      drawMath(ctx, \`t = MI / MIPS = \${ex.mi} / \${vm.mips} = \${(ex.mi / vm.mips).toFixed(2)} s   (contoh \${ex.name} di VM-\${ASSIGN[2] + 1})\`, 100, 880, { size: 34, color: COLORS.gold, alpha: seg(bt, 0.6, 0.6) });
      drawMath(ctx, "L_j = \\u03A3 t_{ij}   untuk semua tugas i di VM j", 100, 940, { size: 34, color: COLORS.ink, alpha: seg(bt, 2.4, 0.6) });
    } else {
      drawMath(ctx, "F(X) = max_j L_j + 0.001 \\xB7 \\u03C3(L)", 100, 890, { size: 44, color: COLORS.gold });
      drawText(ctx, \`makespan = \${EVAL.makespan.toFixed(2)} s di VM-\${EVAL.vmLoads.indexOf(EVAL.makespan) + 1}.   Suku \\u03C3 hanya pemecah seri (\${TIE_BREAK}), tidak mengubah urutan makespan.\`, 100, 950, {
        size: 27,
        color: COLORS.muted
      });
    }
  }`;

const replacement = `  var STEP_X = [290, 690, 1110, 1530];
  function drawFitnessScene(ctx, { t, bt, beat }) {
    drawBackdrop(ctx, t, "gold");
    STEP_LABELS.forEach((label, i) => {
      const active = i === beat;
      drawPill(ctx, label, STEP_X[i], 292, {
        size: 24,
        fill: active ? COLORS.gold : "rgba(255,255,255,0.07)",
        color: active ? COLORS.night : COLORS.muted,
        alpha: active ? 1 : 0.8
      });
    });
    const showChips = beat <= 1;
    const chipW = 194;
    const chipH = 92;
    if (showChips) {
      TASKS2.forEach((task, i) => {
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
          drawText(ctx, VECTOR[i].toFixed(2), x + chipW / 2, y + 58 - (1 - appear) * 30, { size: 38, align: "center", mono: true, alpha: 1 - flip * 2 });
        } else {
          const a = (flip - 0.5) * 2;
          drawText(ctx, \`\\u230A\${VECTOR[i].toFixed(2)}\\u230B\`, x + chipW / 2, y + 35 - (1 - appear) * 30, { size: 22, align: "center", mono: true, color: COLORS.muted, alpha: a });
          ctx.fillStyle = LANE_COLORS[ASSIGN[i]];
          ctx.beginPath();
          ctx.roundRect(x + 36, y + 50 - (1 - appear) * 30, chipW - 72, 34, 12);
          ctx.fill();
          drawText(ctx, \`VM-\${ASSIGN[i] + 1}\`, x + chipW / 2, y + 67 - (1 - appear) * 30, { size: 24, align: "center", color: COLORS.night, weight: 800, alpha: a });
        }
        ctx.restore();
      });
      if (beat === 0) {
        drawMath(ctx, "X = (x_1, x_2, \\u2026, x_{16}),   x_i \\u2208 [0, 4)", 180, 640, { size: 46, color: COLORS.gold });
        drawText(ctx, "Satu posisi kunang-kunang atau kelelawar = satu daftar angka. Setiap angka mewakili satu tugas.", 180, 730, { size: 32, color: COLORS.muted });
        drawText(ctx, "Angka ini hanyalah koordinat. Belum ada VM.", 180, 785, { size: 32, color: COLORS.ink });
      } else {
        drawMath(ctx, "VM_i = \\u230Ax_i\\u230B + 1", 180, 640, { size: 46, color: COLORS.gold });
        drawText(ctx, "Pembulatan ke bawah mengubah koordinat menjadi nomor VM.", 180, 730, { size: 32, color: COLORS.muted });
        drawText(ctx, "Geser sedikit saja angkanya dan satu tugas bisa pindah VM.", 180, 785, { size: 32, color: COLORS.ink });
      }
      return;
    }
    const rect = { x: 180, y: 400, w: 1630, h: 420 };
    const tMax = Math.max(EVAL.makespan * 1.1, 1);
    drawSchedule(ctx, rect, TASKS2, VMS2, LAYOUT, {
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
      const x = trackX + load / tMax * trackW + 14;
      drawText(ctx, \`L\${j + 1} = \${load.toFixed(2)} s\`, Math.min(x, 1650), y, {
        size: 26,
        mono: true,
        color: beat === 3 && isMax ? COLORS.gold : COLORS.ink,
        alpha: beat === 2 ? seg(bt, 2.8, 0.6) : 1,
        weight: isMax && beat === 3 ? 800 : 600
      });
    });
    if (beat === 2) {
      const ex = TASKS2[2];
      const vm = VMS2[ASSIGN[2]];
      drawMath(ctx, \`t = MI / MIPS = \${ex.mi} / \${vm.mips} = \${(ex.mi / vm.mips).toFixed(2)} s   (contoh \${ex.name} di VM-\${ASSIGN[2] + 1})\`, 180, 880, { size: 34, color: COLORS.gold, alpha: seg(bt, 0.6, 0.6) });
      drawMath(ctx, "L_j = \\u03A3 t_{ij}   untuk semua tugas i di VM j", 180, 940, { size: 34, color: COLORS.ink, alpha: seg(bt, 2.4, 0.6) });
    } else {
      drawMath(ctx, "F(X) = max_j L_j + 0.001 \\xB7 \\u03C3(L)", 180, 890, { size: 44, color: COLORS.gold });
      drawText(ctx, \`makespan = \${EVAL.makespan.toFixed(2)} s di VM-\${EVAL.vmLoads.indexOf(EVAL.makespan) + 1}.   Suku \\u03C3 hanya pemecah seri (\${TIE_BREAK}), tidak mengubah urutan makespan.\`, 180, 950, {
        size: 27,
        color: COLORS.muted
      });
    }
  }`;

const isCRLF = code.includes('\r\n');
const normalizedCode = code.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');
const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

if (!normalizedCode.includes(normalizedTarget)) {
  console.error('Target block not found in public/app.bundle.js!');
  process.exit(1);
}

let replaced = normalizedCode.replace(normalizedTarget, normalizedReplacement);
if (isCRLF) {
  replaced = replaced.replace(/\n/g, '\r\n');
}

fs.writeFileSync('public/app.bundle.js', replaced, 'utf8');
console.log('Successfully updated public/app.bundle.js!');

// Also sync to dist/
fs.copyFileSync('public/app.bundle.js', 'dist/public/app.bundle.js');
console.log('Successfully synced to dist/public/app.bundle.js!');

