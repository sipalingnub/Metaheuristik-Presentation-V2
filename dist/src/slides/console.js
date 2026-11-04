/**
 * Konsol simulasi: peta topografi memenuhi layar, lalu elemen kendali melayang di atasnya.
 *   kiri   : kartu tahap algoritma + penjelasan tahap yang sedang jalan
 *   kanan  : nilai terbaik dan cincin iterasi, grafik konvergensi
 *   bawah  : dock berisi Mulai/Jeda, Langkah, Reset, pilihan lanskap, dan tombol Parameter
 *   kanan jauh: laci Parameter yang meluncur masuk
 */

import { landscapeById } from '../core/landscapes.js';
import { StepTicker } from '../core/ticker.js';
import { renderConvergenceChart } from '../render/chart.js';

export const OBJECTIVE_BUTTONS = [
  { id: 'rastrigin', label: 'Rastrigin' },
  { id: 'ackley', label: 'Ackley' },
  { id: 'sphere', label: 'Sphere' }
];

export const ICONS = {
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" stroke-width="3.2"/></svg>',
  step: '<svg viewBox="0 0 24 24"><path d="M5 5v14l9-7zM18 5v14" /></svg>',
  reset: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>'
};

export function formatFitness(value) {
  return value < 0.001 && value > 0 ? value.toExponential(2) : value.toFixed(3);
}

export function objectiveButtonsHtml(activeId) {
  return OBJECTIVE_BUTTONS.map(
    (o) => `<button type="button" class="seg-btn${o.id === activeId ? ' active' : ''}" data-obj="${o.id}">${o.label}</button>`
  ).join('');
}

/** Slider parameter bergaya "knob": label, nilai, dan jalur geser. */
export function paramsHtml(id, params) {
  return params
    .map(
      (p) => `
      <label class="knob" for="${id}-p-${p.key}">
        <span class="knob-top">${p.label}<b id="${id}-v-${p.key}">${p.value}</b></span>
        <input type="range" id="${id}-p-${p.key}" data-param="${p.key}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.value}" />
      </label>`
    )
    .join('');
}

/** Tombol dock: ikon + label pendek. */
export const dockButton = (id, icon, label, extra = '') =>
  `<button type="button" class="dock-btn ${extra}" id="${id}">${icon}<span>${label}</span></button>`;

/** Bagian laci Parameter yang dipakai bersama (kecepatan dan seed ikut disertakan). */
export function drawerHtml(id, params, speed) {
  return `
    <aside class="drawer hidden" id="${id}-params" aria-label="Parameter">
      <header><h3>Parameter</h3><button type="button" class="drawer-x" id="${id}-params-close" aria-label="Tutup parameter">&times;</button></header>
      <div class="drawer-body">
        ${paramsHtml(id, params)}
        <label class="knob" for="${id}-speed">
          <span class="knob-top">Kecepatan<b id="${id}-v-speed">${speed}</b></span>
          <input type="range" id="${id}-speed" min="0.5" max="14" step="0.5" value="${speed}" />
        </label>
        <label class="knob" for="${id}-seed">
          <span class="knob-top">Seed acak</span>
          <input type="number" class="num" id="${id}-seed" value="42" min="1" max="99999" />
        </label>
      </div>
    </aside>`;
}

/** Menghubungkan tombol buka/tutup laci. Mengembalikan fungsi toggle. */
export function wireDrawer(root, id) {
  const drawer = root.querySelector(`#${id}-params`);
  const opener = root.querySelector(`#${id}-params-toggle`);
  const set = (open) => {
    drawer.classList.toggle('hidden', !open);
    opener.setAttribute('aria-expanded', String(open));
  };
  opener.addEventListener('click', () => set(drawer.classList.contains('hidden')));
  root.querySelector(`#${id}-params-close`).addEventListener('click', () => set(false));
  return set;
}

export function setPlayLabel(button, playing) {
  button.querySelector('span').textContent = playing ? 'Jeda' : 'Mulai';
  button.innerHTML = (playing ? ICONS.pause : ICONS.play) + `<span>${playing ? 'Jeda' : 'Mulai'}</span>`;
  button.classList.toggle('is-playing', playing);
}

/**
 * @param {HTMLElement} root
 * @param {{reducedMotion:boolean, registerHooks:Function}} ctx
 * @param {object} spec
 * @param {string} spec.idPrefix
 * @param {string} spec.title        judul pendek di plat atas
 * @param {string} spec.tag          label bab di plat atas
 * @param {string} spec.color        warna identitas algoritma
 * @param {Function} spec.createEngine  (config) => mesin dengan step/reset/getState
 * @param {{render:Function}} spec.renderer
 * @param {Array<{key:string,label:string}>} spec.phases
 * @param {Array} spec.params        definisi slider
 */
export function mountConsole(root, { reducedMotion, registerHooks }, spec) {
  const { idPrefix: id, title, tag, color, createEngine, renderer, phases, params } = spec;
  const MAX_ITER = spec.maxIterations ?? 30;
  const START_RATE = spec.speed ?? 3;

  root.innerHTML = `
    <div class="con" style="--tone:${color}">
      <canvas class="con-map" id="${id}-canvas"></canvas>

      <header class="plate plate-compact">
        <span class="plate-tag"><i></i>${tag}</span>
        <h1 class="plate-title">${title}</h1>
      </header>

      <section class="hud hud-phases">
        <small>Tahap algoritma</small>
        <ol>${phases.map((p, i) => `<li data-phase="${p.key}"><span>${i + 1}</span>${p.label}</li>`).join('')}</ol>
        <p id="${id}-detail"></p>
      </section>

      <section class="hud hud-best">
        <div><small>Terbaik f(x)</small><strong id="${id}-best"></strong></div>
        <div class="ring" id="${id}-ring"><em id="${id}-iter"></em></div>
      </section>

      <section class="hud hud-chart"><small>Konvergensi</small><canvas id="${id}-chart"></canvas></section>

      <div class="dock">
        ${dockButton(`${id}-play`, ICONS.play, 'Mulai', 'dock-main')}
        ${dockButton(`${id}-step`, ICONS.step, 'Langkah')}
        ${dockButton(`${id}-reset`, ICONS.reset, 'Reset')}
        <i class="dock-sep"></i>
        <div class="seg" id="${id}-objectives">${objectiveButtonsHtml('rastrigin')}</div>
        <i class="dock-sep"></i>
        <button type="button" class="dock-btn dock-3d-btn" id="${id}-3d-btn" title="${id === 'ba' ? 'Buka Dunia Baty 3D' : id === 'fa' ? 'Buka Simulasi Firefly 3D' : 'Buka Medan 3D'}"><span>${id === 'ba' ? '🦇 3D' : id === 'fa' ? '💡 3D' : '🏔️ 3D'}</span></button>
        ${dockButton(`${id}-params-toggle`, ICONS.gear, 'Parameter')}
      </div>

      ${drawerHtml(id, params, START_RATE)}
    </div>`;

  const $ = (sel) => root.querySelector(sel);
  const mapCanvas = $(`#${id}-canvas`);
  const chartCanvas = $(`#${id}-chart`);
  const playBtn = $(`#${id}-play`);
  const speedInput = $(`#${id}-speed`);
  const seedInput = $(`#${id}-seed`);
  const knobs = [...root.querySelectorAll('[data-param]')];
  const phaseItems = [...root.querySelectorAll('.hud-phases li')];
  const objectiveBtns = [...root.querySelectorAll(`#${id}-objectives .seg-btn`)];
  wireDrawer(root, id);

  $(`#${id}-3d-btn`)?.addEventListener('click', () => {
    if (id === 'ba') {
      window.location.href = 'https://ninduyi.github.io/tes/';
    } else if (id === 'fa') {
      window.location.href = 'https://raraa17.github.io/firefly-algorithm/';
    } else {
      window.__aoeHud?.landscapeChooser?.open();
    }
  });

  let landscape = landscapeById('rastrigin');
  let rate = START_RATE;

  const readConfig = () => {
    const cfg = { objective: landscape, maxIterations: MAX_ITER, seed: Number(seedInput.value) || 42 };
    for (const k of knobs) cfg[k.dataset.param] = Number(k.value);
    return cfg;
  };
  let engine = createEngine(readConfig());

  function showState(state) {
    phaseItems.forEach((li) => li.classList.toggle('active', li.dataset.phase === state.phase));
    $(`#${id}-detail`).textContent = state.phaseDetail;
    $(`#${id}-best`).textContent = formatFitness(state.best.fitness);
    $(`#${id}-iter`).textContent = `${state.iteration}/${state.maxIterations}`;
    $(`#${id}-ring`).style.setProperty('--p', String(state.iteration / state.maxIterations));
    renderConvergenceChart(chartCanvas, [{ label: title, color, data: state.history }], {
      maxIterations: state.maxIterations,
      decimals: 3
    });
  }

  const ticker = new StepTicker({
    rate,
    calm: reducedMotion,
    onTick: () => {
      const state = engine.step();
      showState(state);
      return state.phase === 'DONE';
    },
    onFrame: (glide, now) => {
      renderer.render(mapCanvas, engine.getState(), landscape, { alpha: glide, timestamp: reducedMotion ? 0 : now, padding: 0.13 });
    }
  });
  ticker.onRunningChange = (on) => setPlayLabel(playBtn, on);

  const finished = () => engine.getState().phase === 'DONE';
  const reset = () => {
    engine.reset();
    showState(engine.getState());
    ticker.settle();
    ticker.setRate(rate);
  };
  const rebuild = () => {
    ticker.halt();
    engine = createEngine(readConfig());
    showState(engine.getState());
    ticker.settle();
    ticker.setRate(rate);
  };
  const toggle = () => {
    if (finished()) reset();
    ticker.setRate(rate);
    ticker.toggle();
  };
  const step = () => {
    if (finished()) return;
    ticker.single();
    ticker.setRate(rate);
  };

  playBtn.addEventListener('click', toggle);
  $(`#${id}-step`).addEventListener('click', step);
  $(`#${id}-reset`).addEventListener('click', reset);
  objectiveBtns.forEach((btn) =>
    btn.addEventListener('click', () => {
      objectiveBtns.forEach((b) => b.classList.toggle('active', b === btn));
      landscape = landscapeById(btn.dataset.obj);
      rebuild();
    })
  );
  knobs.forEach((k) =>
    k.addEventListener('input', () => {
      $(`#${id}-v-${k.dataset.param}`).textContent = k.value;
      rebuild();
    })
  );
  speedInput.addEventListener('input', () => {
    rate = Number(speedInput.value);
    $(`#${id}-v-speed`).textContent = speedInput.value;
    ticker.setRate(rate);
  });
  seedInput.addEventListener('change', rebuild);

  registerHooks?.({ togglePlay: toggle, step, reset });

  const onResize = () => showState(engine.getState());
  addEventListener('resize', onResize);
  showState(engine.getState());
  ticker.attach();

  return () => {
    removeEventListener('resize', onResize);
    ticker.dispose();
  };
}
