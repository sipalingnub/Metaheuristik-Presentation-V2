/**
 * Bab Cloud: (1) coba sendiri memindahkan tugas ke VM lalu bandingkan dengan hasil FA dan BA,
 * (2) FA dan BA menjadwalkan beban kerja yang sama secara langsung.
 */

import { StepTicker } from '../core/ticker.js';
import { renderConvergenceChart } from '../render/chart.js';
import { fitCanvas } from '../render/motion.js';
import { drawSchedule, layoutOf, taskColor } from '../render/cloudRenderer.js';
import { COLORS, drawText } from '../render/sprites.js';
import {
  CloudScheduleOptimizer,
  evaluateAssignment,
  generateTasks,
  idealMakespan,
  makeVMs,
  minMin,
  roundRobin
} from '../algorithms/cloudScheduling.js';
import { ICONS, dockButton, drawerHtml, wireDrawer, setPlayLabel } from './console.js';
import { CH, FA_COLOR, BA_COLOR, FA_LIGHT, BA_LIGHT } from './chapters.js';

const TASK_SEED = 2026;

/* ---------- Coba sendiri ---------- */

const PIPELINE = ['Tugas masuk', 'Kandidat jadwal', 'Hitung makespan', 'FA atau BA menggeser', 'Kirim ke VM'];

const kasusKode = {
  id: 'kasus-kode',
  chapter: CH.cloud,
  title: 'Cloud: tugas masuk ke VM',
  notes: `
    <p>Alur lengkapnya, dari tugas masuk sampai dikirim ke VM:</p>
    <ol>
      <li>Tugas datang ke penjadwal (di sini 16 tugas independen).</li>
      <li>Penjadwal membuat banyak kandidat jadwal sekaligus. Itulah populasi kunang-kunang atau kelelawar.</li>
      <li>Setiap kandidat didekode menjadi penugasan tugas ke VM, lalu dinilai dengan makespan.</li>
      <li>FA atau BA menggeser kandidat berdasarkan nilai itu, berulang-ulang.</li>
      <li>Setelah iterasi habis, jadwal terbaik dikirim: tiap tugas dijalankan di VM pilihannya.</li>
    </ol>
    <p><b>Interaksi:</b> seret kotak tugas ke jalur VM lain untuk memindahkannya. Coba kalahkan Round-Robin dengan tangan, lalu tekan tombol Hasil FA atau Hasil BA untuk melihat jadwal yang ditemukan algoritma pada beban kerja yang sama.</p>
    <p>Penugasan manual adalah contoh bahwa ruang pencarian besar: 4 pangkat 16 kemungkinan. Algoritma mencari dengan beberapa ratus evaluasi saja.</p>`,
  mount(container, { registerHooks }) {
    const tasks = generateTasks(16, TASK_SEED);
    const vms = makeVMs(4);
    const rr = roundRobin(tasks, vms);
    const mm = minMin(tasks, vms);
    const ideal = idealMakespan(tasks, vms);
    let assignment = rr.assignment.slice();
    let moves = 0;
    let solved = null;

    const LABEL_W = 214;
    const LANE_H = 100;
    const GAP = 12;
    const TOP = 34;
    const lanesH = vms.length * LANE_H + (vms.length - 1) * GAP;

    container.innerHTML = `
      <div class="kode">
        <header class="plate plate-compact">
          <span class="plate-tag"><i></i>8 · Penerapan di cloud</span>
          <h1 class="plate-title">Tugas masuk, VM menerima, lalu?</h1>
        </header>

        <ol class="relay">${PIPELINE.map((p, i) => `<li style="--i:${i}"><span>${i + 1}</span>${p}</li>`).join('')}</ol>

        <div class="tiles">
          <div class="tile tile-big"><small>Makespan jadwalmu</small><strong id="play-make">0</strong></div>
          <div class="tile tile-verdict"><small>Penilaian</small><p id="play-verdict"></p></div>
          <div class="tile"><small>Round-Robin</small><b id="f-rr"></b></div>
          <div class="tile"><small>Min-Min</small><b id="f-mm"></b></div>
          <div class="tile"><small>Batas ideal</small><b id="f-id"></b></div>
          <div class="tile"><small>Pemindahan</small><b id="f-mv">0</b></div>
        </div>

        <div class="lanes" id="lanes" style="height:${TOP + lanesH}px">
          ${vms
            .map(
              (vm, j) => `<div class="lane" data-vm="${j}" style="top:${TOP + j * (LANE_H + GAP)}px;height:${LANE_H}px">
                <div class="lane-name" style="width:${LABEL_W - 14}px"><b>${vm.name}</b><span>${vm.mips} MIPS</span><em id="load-${j}"></em></div>
                <div class="lane-track" style="left:${LABEL_W}px"></div></div>`
            )
            .join('')}
          <div class="mark mark-ideal" id="mark-ideal"><i>ideal</i></div>
          <div class="mark mark-make" id="mark-make"><i id="mark-make-label">makespan</i></div>
          ${tasks
            .map(
              (t) => `<button type="button" class="chip" data-id="${t.id}" draggable="true" style="background:${taskColor(t.id)}" aria-label="Tugas ${t.name}, seret ke jalur VM tujuan"><b>${t.name}</b><span>${t.mi}</span></button>`
            )
            .join('')}
        </div>
        <p class="kode-hint">Seret blok tugas ke jalur VM tujuan. Lebar blok = waktu eksekusi (MI ÷ MIPS).</p>

        <div class="dock dock-kode">
          <button type="button" class="dock-btn" data-act="rr"><span>Round-Robin</span></button>
          <button type="button" class="dock-btn" data-act="random"><span>Acak</span><kbd>R</kbd></button>
          <button type="button" class="dock-btn" data-act="mm"><span>Min-Min</span></button>
          <i class="dock-sep"></i>
          <button type="button" class="dock-btn dock-fa" data-act="fa"><span>Hasil Firefly</span></button>
          <button type="button" class="dock-btn dock-ba" data-act="ba"><span>Hasil Bat</span></button>
        </div>
      </div>
    `;

    const $ = (s) => container.querySelector(s);
    const chips = [...container.querySelectorAll('.chip')];
    const lanesEl = $('#lanes');
    $('#f-rr').textContent = `${rr.makespan.toFixed(2)} s`;
    $('#f-mm').textContent = `${mm.makespan.toFixed(2)} s`;
    $('#f-id').textContent = `${ideal.toFixed(2)} s`;

    function update() {
      const ev = evaluateAssignment(assignment, tasks, vms);
      const tMax = Math.max(rr.makespan * 1.1, ev.makespan * 1.06);
      const trackW = lanesEl.clientWidth - LABEL_W - 8;
      const px = trackW / tMax;
      const layout = layoutOf(ev);
      chips.forEach((chip) => {
        const l = layout.get(Number(chip.dataset.id));
        chip.style.left = `${LABEL_W + l.start * px}px`;
        chip.style.top = `${TOP + l.lane * (LANE_H + GAP) + 7}px`;
        chip.style.width = `${Math.max(14, l.dur * px - 4)}px`;
        chip.style.height = `${LANE_H - 14}px`;
        chip.classList.toggle('narrow', l.dur * px < 62);
      });
      $('#mark-make').style.left = `${LABEL_W + ev.makespan * px}px`;
      $('#mark-ideal').style.left = `${LABEL_W + ideal * px}px`;
      $('#mark-make-label').textContent = `${ev.makespan.toFixed(1)} s`;
      $('#play-make').textContent = `${ev.makespan.toFixed(2)} s`;
      $('#f-mv').textContent = String(moves);

      const better = (1 - ev.makespan / rr.makespan) * 100;
      const verdict = $('#play-verdict');
      if (ev.makespan < mm.makespan - 1e-9) {
        verdict.textContent = `Mengalahkan Min-Min dan ${better.toFixed(0)}% lebih cepat dari Round-Robin.`;
        verdict.dataset.state = 'great';
      } else if (ev.makespan < rr.makespan - 1e-9) {
        verdict.textContent = `${better.toFixed(0)}% lebih cepat dari Round-Robin. Min-Min masih ${mm.makespan.toFixed(2)} s.`;
        verdict.dataset.state = 'good';
      } else {
        verdict.textContent = `Belum mengalahkan Round-Robin (${rr.makespan.toFixed(2)} s). Pindahkan tugas dari VM yang paling penuh.`;
        verdict.dataset.state = 'bad';
      }
      if (solved) verdict.textContent += ` (${solved})`;

      ev.vmLoads.forEach((load, j) => {
        const el = $(`#load-${j}`);
        el.textContent = `beban ${load.toFixed(1)} s`;
        el.classList.toggle('max', load === ev.makespan);
      });
    }

    function setAssignment(next, label) {
      assignment = next.slice();
      solved = label || null;
      update();
    }

    let draggedTaskId = null;
    const laneAt = (clientY) =>
      [...lanesEl.querySelectorAll('.lane')].find((lane) => {
        const rect = lane.getBoundingClientRect();
        return clientY >= rect.top && clientY <= rect.bottom;
      });
    chips.forEach((chip) => {
      chip.addEventListener('dragstart', (event) => {
        draggedTaskId = Number(chip.dataset.id);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(draggedTaskId));
        chip.classList.add('is-dragging');
      });
      chip.addEventListener('dragend', () => {
        draggedTaskId = null;
        chip.classList.remove('is-dragging');
        lanesEl.querySelectorAll('.drop-target').forEach((lane) => lane.classList.remove('drop-target'));
      });
    });

    lanesEl.addEventListener('dragover', (event) => {
      if (draggedTaskId === null) return;
      const lane = laneAt(event.clientY);
      if (!lane) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      lanesEl.querySelectorAll('.drop-target').forEach((target) => target.classList.toggle('drop-target', target === lane));
    });
    lanesEl.addEventListener('drop', (event) => {
      const lane = laneAt(event.clientY);
      if (!lane || draggedTaskId === null) return;
      event.preventDefault();
      const taskIndex = draggedTaskId - 1;
      const targetVm = Number(lane.dataset.vm);
      if (!Number.isInteger(taskIndex) || !Number.isInteger(targetVm) || assignment[taskIndex] === targetVm) return;
      assignment[taskIndex] = targetVm;
      moves++;
      solved = null;
      update();
    });

    const optimizerBest = {};
    function solveWith(kind) {
      if (!optimizerBest.state) {
        const opt = new CloudScheduleOptimizer({ n: 16, m: 4, tasks, populationSize: 28, maxIterations: 40, seed: 42 });
        optimizerBest.state = opt.run();
      }
      return kind === 'fa' ? optimizerBest.state.evalFa.assignment : optimizerBest.state.evalBa.assignment;
    }

    let randomSeed = 1;
    const randomize = () => {
      randomSeed++;
      const next = tasks.map((_, i) => Math.floor(Math.abs(Math.sin(randomSeed * 12.9898 + i * 78.233) * 43758.5453) % 1 * vms.length));
      moves++;
      setAssignment(next, 'acak');
    };

    container.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'rr') setAssignment(rr.assignment, 'Round-Robin');
        else if (act === 'mm') setAssignment(mm.assignment, 'Min-Min');
        else if (act === 'random') randomize();
        else setAssignment(solveWith(act), act === 'fa' ? 'hasil Firefly' : 'hasil Bat');
      });
    });

    registerHooks?.({ reset: randomize });
    update();
    const onResize = () => update();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }
};

/* ---------- FA dan BA menjadwalkan bersama ---------- */

const GANTT_W = 1130;
const GANTT_H = 300;

export const CLOUD_PARAMS = [
  { key: 'n', label: 'Jumlah tugas', min: 8, max: 48, step: 4, value: 16 },
  { key: 'm', label: 'Jumlah VM', min: 3, max: 8, step: 1, value: 4 },
  { key: 'populationSize', label: 'Populasi', min: 10, max: 50, step: 2, value: 28 },
  { key: 'maxIterations', label: 'Iterasi', min: 10, max: 80, step: 5, value: 40 }
];

function logicalCtx(canvas) {
  const { ctx, width, height } = fitCanvas(canvas);
  ctx.scale(width / GANTT_W, height / GANTT_H);
  ctx.clearRect(0, 0, GANTT_W, GANTT_H);
  return ctx;
}

const kasusRun = {
  id: 'kasus-run',
  chapter: CH.cloud,
  title: 'Cloud: FA dan BA menjadwalkan bersama',
  notes: `
    <p>Beban kerja, jumlah VM, populasi awal, dan fungsi objektif (makespan) <b>identik</b> untuk kedua algoritma. Yang berbeda hanya aturan geraknya. Anggaran evaluasi juga sama: satu evaluasi per individu per iterasi.</p>
    <ul>
      <li>Jalur atas Firefly, jalur bawah Bat. Blok yang bergeser antar-VM adalah jadwal terbaik saat ini, bukan seluruh populasi.</li>
      <li>Garis putus-putus emas = makespan terbaik, hijau = batas bawah ideal.</li>
      <li>Grafik di kanan: dua kurva algoritma dibandingkan Round-Robin, Min-Min, dan batas bawah. Kurva tidak pernah naik karena yang dicatat adalah nilai terbaik sejauh ini.</li>
    </ul>
    <p>Tekan <b>Parameter</b> untuk mengubah jumlah tugas, VM, populasi, dan iterasi. Hasil satu proses acak tidak cukup untuk menyimpulkan siapa lebih baik. Itu sebabnya ada eksperimen sepuluh beban kerja di slide hasil.</p>`,
  mount(container, { reducedMotion, registerHooks }) {
    const id = 'cr';
    container.innerHTML = `
      <div class="twin" style="--tone:#5eead4">
        <header class="plate plate-compact">
          <span class="plate-tag"><i></i>8 · Penerapan di cloud</span>
          <h1 class="plate-title">Beban kerja sama, dua penjadwal</h1>
        </header>

        <div class="gantt gantt-fa">
          <div class="gantt-head"><b>Firefly</b><strong id="${id}-fa-score"></strong><em id="${id}-fa-gain"></em></div>
          <canvas id="${id}-fa"></canvas>
        </div>
        <div class="gantt gantt-ba">
          <div class="gantt-head"><b>Bat</b><strong id="${id}-ba-score"></strong><em id="${id}-ba-gain"></em></div>
          <canvas id="${id}-ba"></canvas>
        </div>

        <aside class="curve-card">
          <small>Konvergensi makespan</small>
          <canvas id="${id}-chart"></canvas>
          <span class="curve-iter" id="${id}-iter"></span>
        </aside>

        <div class="dock">
          ${dockButton(`${id}-play`, ICONS.play, 'Mulai', 'dock-main')}
          ${dockButton(`${id}-step`, ICONS.step, 'Langkah')}
          ${dockButton(`${id}-reset`, ICONS.reset, 'Reset')}
          <i class="dock-sep"></i>
          ${dockButton(`${id}-params-toggle`, ICONS.gear, 'Parameter')}
        </div>
        ${drawerHtml(id, CLOUD_PARAMS, 2)}
      </div>`;

    const $ = (s) => container.querySelector(s);
    const faCanvas = $(`#${id}-fa`);
    const baCanvas = $(`#${id}-ba`);
    const chartCanvas = $(`#${id}-chart`);
    const playBtn = $(`#${id}-play`);
    const paramInputs = [...container.querySelectorAll('[data-param]')];
    const seedInput = $(`#${id}-seed`);
    const speedInput = $(`#${id}-speed`);
    wireDrawer(container, id);
    let speed = 2;

    function readConfig() {
      const cfg = { seed: Number(seedInput.value) || 42 };
      for (const input of paramInputs) cfg[input.dataset.param] = Number(input.value);
      return cfg;
    }

    let opt = null;
    let tMax = 1;
    let prevFa = null;
    let prevBa = null;
    let curFa = null;
    let curBa = null;
    let vms = null;
    let tasks = null;

    function build() {
      const cfg = readConfig();
      tasks = generateTasks(cfg.n, TASK_SEED);
      opt = new CloudScheduleOptimizer({
        n: cfg.n,
        m: cfg.m,
        tasks,
        populationSize: cfg.populationSize,
        maxIterations: cfg.maxIterations,
        seed: cfg.seed
      });
      vms = opt.vms;
      const st = opt.getState();
      tMax = Math.max(st.baselineRR.makespan, st.evalFa.makespan, st.evalBa.makespan) * 1.08;
      curFa = layoutOf(st.evalFa);
      curBa = layoutOf(st.evalBa);
      prevFa = curFa;
      prevBa = curBa;
    }

    function chartSeries(st) {
      const max = st.maxIterations;
      const flat = (v) => [
        { iteration: 0, bestFitness: v },
        { iteration: max, bestFitness: v }
      ];
      return [
        { label: 'Firefly', color: FA_COLOR, data: st.fa.history },
        { label: 'Bat', color: BA_COLOR, data: st.ba.history },
        { label: 'Round-Robin', color: COLORS.coral, data: flat(st.baselineRR.makespan), dashed: true, width: 2.4 },
        { label: 'Min-Min', color: COLORS.blueLight, data: flat(st.baselineMinMin.makespan), dashed: true, width: 2.4 },
        { label: 'ideal', color: COLORS.lime, data: flat(st.ideal), dashed: true, width: 2.4 }
      ];
    }

    function updateReadout() {
      const st = opt.getState();
      $(`#${id}-fa-score`).textContent = `${st.evalFa.makespan.toFixed(2)} s`;
      $(`#${id}-ba-score`).textContent = `${st.evalBa.makespan.toFixed(2)} s`;
      const gain = (ev) => `${((1 - ev.makespan / st.baselineRR.makespan) * 100).toFixed(1)}% lebih cepat dari Round-Robin`;
      $(`#${id}-fa-gain`).textContent = gain(st.evalFa);
      $(`#${id}-ba-gain`).textContent = gain(st.evalBa);
      $(`#${id}-iter`).textContent = `iterasi ${st.iteration}/${st.maxIterations}`;
      renderConvergenceChart(chartCanvas, chartSeries(st), {
        maxIterations: st.maxIterations,
        yMin: Math.floor(st.ideal * 0.9),
        decimals: 2
      });
    }

    const ticker = new StepTicker({
      rate: speed,
      calm: reducedMotion,
      onTick: () => {
        prevFa = curFa;
        prevBa = curBa;
        const st = opt.step();
        curFa = layoutOf(st.evalFa);
        curBa = layoutOf(st.evalBa);
        updateReadout();
        return st.done;
      },
      onFrame: (glide) => {
        const st = opt.getState();
        const rect = { x: 10, y: 28, w: GANTT_W - 20, h: GANTT_H - 48 };
        const common = { tMax, ideal: st.ideal, alpha: glide, labelW: 120, fontScale: 0.92, laneColor: COLORS.blue };
        drawSchedule(logicalCtx(faCanvas), rect, tasks, vms, curFa, { ...common, from: prevFa, makespan: st.evalFa.makespan });
        drawSchedule(logicalCtx(baCanvas), rect, tasks, vms, curBa, { ...common, from: prevBa, makespan: st.evalBa.makespan });
      }
    });
    ticker.onRunningChange = (on) => setPlayLabel(playBtn, on);

    const reset = () => {
      ticker.halt();
      build();
      updateReadout();
      ticker.settle();
      ticker.setRate(speed);
    };
    const togglePlay = () => {
      if (opt.done) reset();
      ticker.setRate(speed);
      ticker.toggle();
    };
    const step = () => {
      if (opt.done) return;
      ticker.single();
      ticker.setRate(speed);
    };

    playBtn.addEventListener('click', togglePlay);
    $(`#${id}-step`).addEventListener('click', step);
    $(`#${id}-reset`).addEventListener('click', reset);
    for (const input of paramInputs) {
      input.addEventListener('input', () => {
        $(`#${id}-v-${input.dataset.param}`).textContent = input.value;
        reset();
      });
    }
    seedInput.addEventListener('change', reset);
    speedInput.addEventListener('input', () => {
      speed = Number(speedInput.value);
      $(`#${id}-v-speed`).textContent = speedInput.value;
      ticker.setRate(speed);
    });

    registerHooks?.({ togglePlay, step, reset });
    build();
    updateReadout();
    const onResize = () => updateReadout();
    window.addEventListener('resize', onResize);
    ticker.attach();
    return () => {
      window.removeEventListener('resize', onResize);
      ticker.dispose();
    };
  }
};

export const cloudSlides = [kasusKode, kasusRun];
