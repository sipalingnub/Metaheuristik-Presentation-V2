/**
 * Bingkai slide bercerita: kanvas penuh layar ditambah "plat" judul di tengah atas
 * yang berganti isi tiap beat, lengkap dengan titik penanda beat.
 * Slide cukup memberi daftar beat dan fungsi gambar kanvas.
 */

import { startCanvasLoop } from '../render/motion.js';

/**
 * @param {HTMLElement} root
 * @param {{reducedMotion:boolean, registerHooks:Function}} ctx
 * @param {{tag:string, beats:Array<{title:string, sub?:string}>, draw:Function, trail?:string[], extraHtml?:string}} spec
 *   trail: daftar tahap bernomor di sisi kiri yang menyala sesuai beat
 */
export function mountStory(root, { reducedMotion, registerHooks }, spec) {
  const { tag, beats, draw, trail, extraHtml = '' } = spec;

  root.innerHTML = `
    <canvas class="cv"></canvas>
    <header class="plate">
      ${tag ? `<span class="plate-tag"><i></i>${tag}</span>` : ''}
      <h1 class="plate-title"></h1>
      <p class="plate-sub"></p>
      <div class="plate-beats" aria-hidden="true">${beats.map(() => '<b></b>').join('')}</div>
    </header>
    ${trail ? `<ol class="trail">${trail.map((t, i) => `<li><span>${i + 1}</span>${t}</li>`).join('')}</ol>` : ''}
    ${extraHtml}
  `;

  const title = root.querySelector('.plate-title');
  const sub = root.querySelector('.plate-sub');
  const dots = [...root.querySelectorAll('.plate-beats b')];
  const steps = [...root.querySelectorAll('.trail li')];
  const loop = startCanvasLoop(root.querySelector('.cv'), draw, { calm: reducedMotion });

  function setBeat(n) {
    const beat = beats[Math.min(n, beats.length - 1)];
    if (beat.html) title.innerHTML = beat.html;
    else title.textContent = beat.title;
    sub.textContent = beat.sub || '';
    for (const el of [title, sub]) {
      el.classList.remove('rise');
      void el.offsetWidth; // reflow agar animasi muncul terulang
      el.classList.add('rise');
    }
    dots.forEach((d, i) => d.classList.toggle('on', i <= n));
    dots.forEach((d, i) => d.classList.toggle('now', i === n));
    steps.forEach((s, i) => s.classList.toggle('on', i === n));
    loop.setBeat(n);
  }

  setBeat(0);
  registerHooks?.({ setBeat });
  return () => loop.stop();
}
