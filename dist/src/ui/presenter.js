/**
 * Presenter: cangkang presentasi.
 * - Panggung 1920x1080 yang diskalakan ke jendela (satu sumber ukuran untuk DOM dan kanvas).
 * - "Spine" vertikal di kiri: satu simpul per bab, tanda kecil per slide, terisi mengikuti beat.
 * - Overview (kisi semua slide), lembar catatan dari bawah, dan lembar pintasan.
 * - Transisi antar-slide berupa fade singkat dan penanda Act saat bab berganti.
 */

import { ScriptPaper } from './script.js';
import { AoEHud } from './aoeHud.js';
import { sound } from '../core/sound.js';

const STAGE_W = 1920;
const STAGE_H = 1080;
const $ = (id) => document.getElementById(id);
const ACTS = [
  { chapters: ['masalah', 'metaheuristik'], label: 'Krisis Cloud & NP-Hard' },
  { chapters: ['firefly'], label: 'Ordo Kunang-Kunang (FA)' },
  { chapters: ['bat'], label: 'Legiun Kelelawar (BA)' },
  { chapters: ['model', 'cloud'], label: 'Perang Penjadwalan Cloud' },
  { chapters: ['hasil', 'penutup'], label: 'Sintesis & Analisis Hasil' }
];

export class Presenter {
  constructor(slides) {
    this.slides = slides;
    this.index = 0;
    this.beat = 0;
    this.current = null; // elemen slide aktif
    this.cleanup = null;
    this.hooks = null;
    this.calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.actToast = null;
    this.actToastTimer = null;

    this.frame = $('frame');
    this.slidesEl = $('slides');
    this.spineEl = $('spine');
    this.counterEl = $('counter');
    this.notes = $('presenter-notes');
    this.overview = $('overview');
    this.help = $('shortcuts-modal');
    this.paper = new ScriptPaper({
      getState: () => ({ slide: this.slides[this.index], index: this.index, total: this.slides.length, beat: this.beat }),
      scale: () => this.scale,
      goBeat: (d) => (d > 0 ? this.next() : this.prev())
    });
    this.aoeHud = new AoEHud(this);
  }

  start() {
    this.aoeHud.mount(this.frame);
    this.#buildSpine();
    this.#buildOverview();
    this.#bind();
    this.#fit();
    this.#initInteractiveMouse();
    const wanted = location.hash.replace(/^#/, '').trim().toLowerCase();
    const found = this.slides.findIndex((s) => s.id === wanted);
    this.goTo(found >= 0 ? found : 0);
  }

  /* ---------- struktur ---------- */

  /** Bab = kelompok slide berurutan dengan chapter.id sama. */
  get chapters() {
    const groups = [];
    this.slides.forEach((slide, i) => {
      const last = groups[groups.length - 1];
      if (last?.id === slide.chapter.id) last.indices.push(i);
      else groups.push({ id: slide.chapter.id, label: slide.chapter.label, indices: [i] });
    });
    return groups;
  }

  beatsOf(slide) {
    return slide.beats || 1;
  }

  #fit() {
    const k = Math.min(innerWidth / STAGE_W, innerHeight / STAGE_H);
    this.frame.style.transform = `translate(-50%, -50%) scale(${k})`;
    this.scale = k;
  }

  #buildSpine() {
    this.spineEl.innerHTML = this.chapters
      .map(
        (ch, n) => `
        <div class="spine-chapter" data-chapter="${ch.id}">
          <button type="button" class="spine-node" data-first="${ch.indices[0]}" aria-label="Bab ${n + 1}: ${ch.label}">
            <span>${n + 1}</span><em>${ch.label}</em>
          </button>
          <div class="spine-ticks">
            ${ch.indices
              .map((i) => `<button type="button" class="spine-tick" data-slide="${i}" title="${this.slides[i].title}" aria-label="Slide ${i + 1}: ${this.slides[i].title}"><i></i></button>`)
              .join('')}
          </div>
        </div>`
      )
      .join('');
    this.spineEl.addEventListener('click', (e) => {
      const tick = e.target.closest('.spine-tick');
      const node = e.target.closest('.spine-node');
      if (tick) this.goTo(Number(tick.dataset.slide));
      else if (node) this.goTo(Number(node.dataset.first));
    });
    this.spineEl.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'touch') return;
      const tick = e.target.closest('.spine-tick');
      const index = Number(tick?.dataset.slide);
      if (tick && Number.isInteger(index) && index !== this.index) this.goTo(index);
    });
    this.ticks = [...this.spineEl.querySelectorAll('.spine-tick')];
    this.spineChapters = [...this.spineEl.querySelectorAll('.spine-chapter')];
  }

  #buildOverview() {
    const chapterNo = Object.fromEntries(this.chapters.map((c, n) => [c.id, n + 1]));
    this.overview.querySelector('.overview-grid').innerHTML = this.slides
      .map(
        (s, i) => `
        <button type="button" class="ov-card" data-slide="${i}" data-chapter="${s.chapter.id}">
          <small>${String(i + 1).padStart(2, '0')} · ${chapterNo[s.chapter.id]}. ${s.chapter.label}</small>
          <strong>${s.title}</strong>
        </button>`
      )
      .join('');
    this.overview.addEventListener('click', (e) => {
      const card = e.target.closest('.ov-card');
      if (card) {
        this.#toggle(this.overview, false);
        this.goTo(Number(card.dataset.slide));
      } else if (e.target === this.overview) {
        this.#toggle(this.overview, false);
      }
    });
    this.ovCards = [...this.overview.querySelectorAll('.ov-card')];
  }

  /* ---------- peristiwa ---------- */

  #bind() {
    $('btn-prev').addEventListener('click', () => this.prev());
    $('btn-next').addEventListener('click', () => this.next());
    $('btn-script').addEventListener('click', () => this.paper.toggle());
    $('btn-notes').addEventListener('click', () => this.toggleNotes());
    $('btn-close-notes').addEventListener('click', () => this.toggleNotes(false));
    $('btn-overview').addEventListener('click', () => this.#toggle(this.overview));
    $('btn-help').addEventListener('click', () => this.#toggle(this.help));
    $('btn-close-help').addEventListener('click', () => this.#toggle(this.help, false));
    $('btn-fullscreen').addEventListener('click', () => this.toggleFullscreen());
    this.help.addEventListener('click', (e) => e.target === this.help && this.#toggle(this.help, false));

    addEventListener('keydown', (e) => this.#onKey(e));
    addEventListener('resize', () => this.#fit());
    addEventListener('hashchange', () => {
      const i = this.slides.findIndex((s) => s.id === location.hash.replace(/^#/, '').toLowerCase());
      if (i >= 0 && i !== this.index) this.goTo(i);
    });

    // Setelah diklik mouse, tombol dan slider dilepas fokusnya supaya panah dan spasi tetap memindahkan slide
    document.addEventListener('click', (e) => {
      const b = e.target.closest?.('button');
      if (b && e.detail > 0) b.blur();
    });
    document.addEventListener('change', (e) => e.target.type === 'range' && e.target.blur());
  }

  #typing(el) {
    return !!el && (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) || el.isContentEditable);
  }

  #toggle(el, force) {
    const open = typeof force === 'boolean' ? force : el.classList.contains('hidden');
    el.classList.toggle('hidden', !open);
    if (el === this.overview && open) this.#markOverview();
    return open;
  }

  #onKey(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === 'Escape') {
      this.#toggle(this.help, false);
      this.#toggle(this.overview, false);
      this.toggleNotes(false);
      this.paper.setOpen(false);
      this.aoeHud?.techTree?.close();
      this.aoeHud?.sandbox?.close();
      this.aoeHud?.codex?.close();
      this.aoeHud?.landscape3d?.close();
      if (this.#typing(e.target)) e.target.blur();
      return;
    }
    if (this.#typing(e.target)) return;

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const onButton = e.target?.tagName === 'BUTTON';
    const run = (fn) => {
      e.preventDefault();
      fn();
    };

    if (key === 'ArrowRight' || key === 'PageDown' || ((key === ' ' || key === 'Enter') && !onButton)) run(() => this.next());
    else if (key === 'ArrowLeft' || key === 'PageUp') run(() => this.prev());
    else if (key === 'Home') run(() => this.goTo(0));
    else if (key === 'End') run(() => this.goTo(this.slides.length - 1));
    else if (/^[1-9]$/.test(key) && this.chapters[Number(key) - 1]) run(() => this.goTo(this.chapters[Number(key) - 1].indices[0]));
    else if (key === 'f') run(() => this.toggleFullscreen());
    else if (key === 't') run(() => this.paper.toggle());
    else if (key === 'n') run(() => this.toggleNotes());
    else if (key === 'b') run(() => this.aoeHud?.codex?.toggle(this.slides[this.index]?.chapter?.id));
    else if (key === 'a') run(() => this.aoeHud?.sandbox?.toggle());
    else if (key === '3' || key === 'l') run(() => this.aoeHud?.landscape3d?.toggle());
    else if (key === 'm') run(() => {
      const muted = sound.toggleMute();
      const icon = document.getElementById('aoe-sound-icon');
      if (icon) icon.textContent = muted ? '🔇' : '🔊';
    });
    else if (key === 'g' || key === 'o') run(() => this.#toggle(this.overview));
    else if (key === '?' || key === 'h') run(() => this.#toggle(this.help));
    else if (key === 'p' && this.hooks?.togglePlay) run(() => this.hooks.togglePlay());
    else if (key === 's' && this.hooks?.step) run(() => this.hooks.step());
    else if (key === 'r' && this.hooks?.reset) run(() => this.hooks.reset());
  }

  /* ---------- perpindahan ---------- */

  next() {
    sound.playClick();
    if (this.beat < this.beatsOf(this.slides[this.index]) - 1) this.setBeat(this.beat + 1);
    else if (this.index < this.slides.length - 1) this.goTo(this.index + 1);
  }

  prev() {
    sound.playClick();
    if (this.beat > 0) this.setBeat(this.beat - 1);
    else if (this.index > 0) this.goTo(this.index - 1, { atEnd: true });
  }

  setBeat(beat) {
    this.beat = beat;
    this.hooks?.setBeat?.(beat);
    this.#refresh();
  }

  toggleNotes(force) {
    const open = this.#toggle(this.notes, force);
    $('btn-notes').setAttribute('aria-pressed', String(open));
  }

  toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  /**
   * @param {number} index
   * @param {{atEnd?:boolean, event?:Event}} [opts]
   */
  goTo(index, { atEnd = false } = {}) {
    if (index < 0 || index >= this.slides.length) return;
    try {
      this.cleanup?.();
    } catch (err) {
      console.error(err);
    }
    this.cleanup = null;
    this.hooks = null;

    const slide = this.slides[index];
    const previousChapter = this.current?.dataset.chapter;
    this.index = index;
    this.beat = 0;
    document.body.dataset.chapter = slide.chapter.id;

    const leaving = this.current;
    leaving?.remove();

    const el = document.createElement('section');
    el.className = this.calm ? 'slide' : 'slide slide-fade-in';
    el.id = `slide-${slide.id}`;
    el.setAttribute('aria-label', slide.title);
    el.dataset.chapter = slide.chapter.id;
    this.slidesEl.appendChild(el);
    this.current = el;

    const result = slide.mount(el, {
      reducedMotion: this.calm,
      registerHooks: (h) => (this.hooks = { ...this.hooks, ...h })
    });
    if (typeof result === 'function') this.cleanup = result;
    if (atEnd && this.beatsOf(slide) > 1) this.setBeat(this.beatsOf(slide) - 1);

    if (!leaving || previousChapter !== slide.chapter.id) {
      const actIndex = ACTS.findIndex((act) => act.chapters.includes(slide.chapter.id));
      const act = ACTS[actIndex];
      this.#showActToast(actIndex + 1, act?.label ?? slide.chapter.label);
    }
    if (!this.calm) {
      setTimeout(() => el.classList.remove('slide-fade-in'), 260);
    }

    $('notes-title').textContent = slide.title;
    $('notes-content').innerHTML = slide.notes || '';
    this.#refresh();
    try {
      history.replaceState(null, '', `#${slide.id}`);
    } catch {
      /* file:// bisa melarang riwayat */
    }
  }

  #showActToast(number, label) {
    if (!this.actToast) {
      this.actToast = document.createElement('div');
      this.actToast.className = 'act-toast';
      this.actToast.setAttribute('aria-live', 'polite');
      this.actToast.setAttribute('aria-atomic', 'true');
      this.actToast.innerHTML = '<strong></strong><span></span>';
    }

    this.actToast.querySelector('strong').textContent = `ACT ${number}:`;
    this.actToast.querySelector('span').textContent = label;
    this.actToast.classList.remove('visible');
    this.frame.appendChild(this.actToast);
    void this.actToast.offsetWidth;
    this.actToast.classList.add('visible');
    clearTimeout(this.actToastTimer);
    this.actToastTimer = setTimeout(() => this.actToast?.classList.remove('visible'), 1450);
  }

  #markOverview() {
    this.ovCards.forEach((c, i) => c.classList.toggle('current', i === this.index));
    this.ovCards[this.index]?.scrollIntoView({ block: 'center' });
  }

  #refresh() {
    const beats = this.beatsOf(this.slides[this.index]);
    const progress = (this.beat + 1) / beats;
    this.ticks.forEach((t, i) => {
      t.style.setProperty('--fill', String(i < this.index ? 1 : i === this.index ? progress : 0));
      t.classList.toggle('current', i === this.index);
    });
    const chapter = this.slides[this.index].chapter.id;
    this.spineChapters.forEach((c) => c.classList.toggle('current', c.dataset.chapter === chapter));
    this.paper?.update();
    this.aoeHud?.update();
    this.counterEl.textContent = `${String(this.index + 1).padStart(2, '0')} / ${this.slides.length}`;
  }

  #initInteractiveMouse() {
    if (!this.frame) return;

    // Canvas untuk partikel dan jejak kursor interaktif di setiap slide
    const canvas = document.createElement('canvas');
    canvas.className = 'aoe-mouse-canvas';
    canvas.width = STAGE_W;
    canvas.height = STAGE_H;
    this.frame.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles = [];
    const colors = ['#facc15', '#38bdf8', '#c084fc', '#f59e0b', '#fbbf24'];
    let mouse = { x: -100, y: -100, active: false };

    const toStageCoords = (e) => {
      const rect = this.frame.getBoundingClientRect();
      const scale = this.scale || 1;
      return {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale
      };
    };

    window.addEventListener('pointermove', (e) => {
      const pos = toStageCoords(e);
      mouse.x = pos.x;
      mouse.y = pos.y;
      mouse.active = pos.x >= 0 && pos.x <= STAGE_W && pos.y >= 0 && pos.y <= STAGE_H;

      if (!mouse.active) return;

      // Partikel jejak kursor lembut (kunang-kunang / sonar sparks)
      if (Math.random() < 0.65) {
        particles.push({
          x: mouse.x + (Math.random() - 0.5) * 12,
          y: mouse.y + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2 - 0.4,
          size: Math.random() * 2.8 + 1.2,
          alpha: 0.85,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1.0,
          decay: Math.random() * 0.03 + 0.02
        });
      }
    });

    // Pemicu RTS Waypoint Ping pada saat klik di panggung
    this.frame.addEventListener('pointerdown', (e) => {
      // Abaikan bila klik berada pada modal yang terbuka
      if (e.target.closest('.aoe-modal-backdrop') || e.target.closest('.sky-3d-backdrop')) return;

      const pos = toStageCoords(e);
      if (pos.x < 0 || pos.x > STAGE_W || pos.y < 0 || pos.y > STAGE_H) return;

      // Elemen visual RTS waypoint ping
      const ping = document.createElement('div');
      ping.className = 'aoe-rts-cursor-ping';
      ping.style.left = `${pos.x}px`;
      ping.style.top = `${pos.y}px`;
      this.frame.appendChild(ping);
      setTimeout(() => ping.remove(), 700);

      sound.playClick();

      // Partikel letupan klik (tactical spark burst)
      for (let i = 0; i < 14; i++) {
        const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.4;
        const spd = Math.random() * 3.5 + 1.5;
        particles.push({
          x: pos.x,
          y: pos.y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: Math.random() * 3.5 + 1.8,
          alpha: 1.0,
          color: i % 2 === 0 ? '#facc15' : '#38bdf8',
          life: 1.0,
          decay: Math.random() * 0.04 + 0.03
        });
      }
    });

    // Loop render partikel 60fps
    const renderParticles = () => {
      ctx.clearRect(0, 0, STAGE_W, STAGE_H);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      requestAnimationFrame(renderParticles);
    };

    renderParticles();
  }
}
