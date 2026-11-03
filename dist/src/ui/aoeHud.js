/**
 * Master Age of Empires RTS HUD & Command Center (Harmonized & Non-Overlapping).
 * Menghubungkan pengalaman RTS dengan slide presentasi tanpa tumpang tindih visual:
 * - Bilah Sumber Daya & Era Mengambang di atas panggung (rapi dan tidak menutupi judul slide).
 * - Radar Minimap Taktis di pojok kiri bawah dengan mekanisme ping interaktif yang berfungsi nyata.
 * - Kotak Komando Taktis di pojok kanan bawah yang terintegrasi dengan aksi slide.
 * - Area tengah bawah bebas rintangan sehingga dock simulasi bawaan slide tetap 100% tampak.
 */

import { sound } from '../core/sound.js';
import { TechTreeModal } from './techTree.js';
import { AoESandboxModal } from './aoeSandbox.js';
import { DeepCodexModal } from './deepCodex.js';
import { Landscape3DModal } from './landscape3dModal.js';

export const ERAS = [
  { id: 'dark', name: 'Zaman Gelap', sub: 'Krisis Cloud & NP-Hard', icon: '🏰', firstSlide: 'masalah' },
  { id: 'feudal', name: 'Zaman Feodal', sub: 'Ordo Kunang-Kunang (FA)', icon: '💡', firstSlide: 'fa-inspirasi' },
  { id: 'castle', name: 'Zaman Kastil', sub: 'Legiun Kelelawar (BA)', icon: '🦇', firstSlide: 'ba-inspirasi' },
  { id: 'imperial', name: 'Zaman Imperial', sub: 'Perang Penjadwalan Cloud', icon: '⚔️', firstSlide: 'kasus-kode' },
  { id: 'wonder', name: 'Keajaiban Dunia', sub: 'Sintesis & Analisis Hasil', icon: '🏛️', firstSlide: 'adu' }
];

export class AoEHud {
  /**
   * @param {import('./presenter.js').Presenter} presenter
   */
  constructor(presenter) {
    this.presenter = presenter;
    this.techTree = new TechTreeModal();
    this.sandbox = new AoESandboxModal();
    this.codex = new DeepCodexModal();
    this.landscape3d = new Landscape3DModal();
    this.hudEl = null;
    this.minimapCanvas = null;
    this.minimapCtx = null;
    this.minimapPing = null;
    this.beaconEl = null;
    this.selectedEntity = null;
    this.isMuted = sound.isMuted();
  }

  mount(frameEl) {
    const el = document.createElement('div');
    el.id = 'aoe-rts-hud';
    el.className = 'aoe-hud-layer';
    frameEl.appendChild(el);
    this.hudEl = el;

    this.techTree.mount(frameEl);
    this.sandbox.mount(frameEl);
    this.codex.mount(frameEl);
    this.landscape3d.mount(frameEl);
    window.__aoeHud = this;

    this.#render();
    this.#initMinimap();
    this.#bind();
    this.update();
  }

  update() {
    if (!this.hudEl) return;
    const slide = this.presenter.slides[this.presenter.index];
    if (!slide) return;

    this.#updateEraBanner(slide);
    this.#updateResources(slide);
    if (!this.selectedEntity) {
      this.#updateDefaultEntityCard(slide);
    }
    this.#drawMinimap();
  }

  selectEntity(entity) {
    this.selectedEntity = entity;
    sound.playClick();
    this.#renderEntityCard(entity);
  }

  clearSelection() {
    this.selectedEntity = null;
    const slide = this.presenter.slides[this.presenter.index];
    if (slide) this.#updateDefaultEntityCard(slide);
  }

  #updateEraBanner(slide) {
    const ch = slide.chapter.id;
    let era = ERAS[0];
    if (['masalah', 'metaheuristik'].includes(ch)) era = ERAS[0];
    else if (['firefly'].includes(ch)) era = ERAS[1];
    else if (['bat'].includes(ch)) era = ERAS[2];
    else if (['model', 'cloud'].includes(ch)) era = ERAS[3];
    else era = ERAS[4];

    const bannerText = this.hudEl.querySelector('#aoe-active-era-text');
    const bannerIcon = this.hudEl.querySelector('#aoe-active-era-icon');

    if (bannerText) bannerText.textContent = era.name.toUpperCase();
    if (bannerIcon) bannerIcon.textContent = era.icon;

    this.hudEl.querySelectorAll('.aoe-era-dropdown-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.eraId === era.id);
    });
  }

  #updateResources(slide) {
    const ch = slide.chapter.id;
    const makeEl = this.hudEl.querySelector('#aoe-res-make');
    const algoEl = this.hudEl.querySelector('#aoe-res-algo');

    if (['firefly'].includes(ch)) {
      if (algoEl) algoEl.textContent = 'Ordo Kunang-Kunang';
      if (makeEl) makeEl.textContent = 'Eksplorasi β(r)';
    } else if (['bat'].includes(ch)) {
      if (algoEl) algoEl.textContent = 'Legiun Kelelawar';
      if (makeEl) makeEl.textContent = 'Sonar Pemimpin x*';
    } else if (['cloud', 'hasil'].includes(ch)) {
      if (algoEl) algoEl.textContent = 'FA vs BA Cloud';
      if (makeEl) makeEl.textContent = 'Ideal: 116.1s';
    } else {
      if (algoEl) algoEl.textContent = '4 Node Komputasi';
      if (makeEl) makeEl.textContent = '4,3 Miliar Jadwal';
    }
  }

  #updateDefaultEntityCard(slide) {
    const ch = slide.chapter.id;
    let title = 'Markas Komando Kerajaan';
    let subtitle = slide.title;
    let icon = ch === 'firefly' ? '✨' : ch === 'bat' ? '🦇' : '🏰';

    const card = this.hudEl.querySelector('#aoe-unit-card-content');
    if (!card) return;

    card.innerHTML = `
      <div class="aoe-mini-portrait">
        <span class="avatar-icon">${icon}</span>
      </div>
      <div class="aoe-mini-details">
        <b class="entity-name">${title}</b>
        <small class="entity-sub">${subtitle}</small>
      </div>
    `;
  }

  #renderEntityCard(entity) {
    const card = this.hudEl.querySelector('#aoe-unit-card-content');
    if (!card) return;

    card.innerHTML = `
      <div class="aoe-mini-portrait">
        <span class="avatar-icon">${entity.icon || '🛡️'}</span>
      </div>
      <div class="aoe-mini-details">
        <b class="entity-name">${entity.name}</b>
        <small class="entity-sub">${entity.role || 'Entitas Terpilih'}</small>
      </div>
    `;
  }

  #initMinimap() {
    this.minimapCanvas = this.hudEl.querySelector('#aoe-minimap-cv');
    if (this.minimapCanvas) {
      this.minimapCtx = this.minimapCanvas.getContext('2d');
      this.minimapCanvas.width = 176;
      this.minimapCanvas.height = 96;
      this.#drawMinimap();
    }
  }

  #drawMinimap() {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = 176;
    const h = 96;

    // Latar radar malam
    ctx.fillStyle = '#060d1e';
    ctx.fillRect(0, 0, w, h);

    // Kisi radar
    ctx.strokeStyle = 'rgba(74, 144, 226, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Isoline kontur lanskap
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
    for (let r = 10; r <= 36; r += 10) {
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, r * 1.5, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Posisi 4 Benteng VM
    const vmPositions = [
      { x: 34, y: 26, color: '#4f8cff', label: 'VM1' },
      { x: 142, y: 26, color: '#22d3ee', label: 'VM2' },
      { x: 34, y: 70, color: '#a78bfa', label: 'VM3' },
      { x: 142, y: 70, color: '#fbbf24', label: 'VM4' }
    ];

    vmPositions.forEach((vm) => {
      ctx.fillStyle = vm.color;
      ctx.fillRect(vm.x - 3, vm.y - 3, 7, 7);
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px "Red Hat Mono"';
      ctx.fillText(vm.label, vm.x + 5, vm.y + 3);
    });

    // Lingkaran ping taktis jika sedang aktif
    if (this.minimapPing) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(this.minimapPing.x, this.minimapPing.y, this.minimapPing.r, 0, Math.PI * 2);
      ctx.stroke();
      this.minimapPing.r += 2.2;
      if (this.minimapPing.r > 26) {
        this.minimapPing = null;
      } else {
        requestAnimationFrame(() => this.#drawMinimap());
      }
    }
  }

  /**
   * Memicu ping taktis radar yang terhubung ke dunia nyata di layar
   * @param {number} x
   * @param {number} y
   */
  triggerRadarPing(x = 88, y = 48) {
    sound.playPing();
    this.minimapPing = { x, y, r: 3 };
    this.#drawMinimap();

    // Tentukan benteng VM terdekat dari titik klik
    const vmIndex = x < 88 ? (y < 48 ? 0 : 2) : (y < 48 ? 1 : 3);
    const vmNames = ['Benteng Fajar (VM 1 · 85 MIPS)', 'Benteng Besi (VM 2 · 115 MIPS)', 'Kastil Batu (VM 3 · 145 MIPS)', 'Benteng Surya (VM 4 · 175 MIPS)'];
    const chosenName = vmNames[vmIndex];

    // Perbarui entitas terpilih
    this.selectEntity({
      name: chosenName,
      role: `Sektor Pertahanan VM ${vmIndex + 1}`,
      icon: '🏰',
      badge: 'TERDETEKSI'
    });

    // Munculkan suar taktis di layar panggung (Tactical Beacon)
    this.#showTacticalBeacon(chosenName);

    // Jika di slide kasus-kode / kasus-run, beri efek sorot ke lane VM tersebut
    const lane = document.querySelectorAll('.lane')?.[vmIndex];
    if (lane) {
      lane.style.boxShadow = '0 0 20px #fbbf24';
      setTimeout(() => {
        lane.style.boxShadow = '';
      }, 1500);
    }
  }

  #showTacticalBeacon(text) {
    if (!this.beaconEl) {
      this.beaconEl = document.createElement('div');
      this.beaconEl.className = 'aoe-tactical-beacon hidden';
      this.hudEl.appendChild(this.beaconEl);
    }
    this.beaconEl.innerHTML = `<span>📡 PING TAKTIS:</span> <b>${text}</b>`;
    this.beaconEl.classList.remove('hidden');
    this.beaconEl.classList.remove('fade-out');
    void this.beaconEl.offsetWidth;
    this.beaconEl.classList.add('pulse-in');

    setTimeout(() => {
      this.beaconEl.classList.add('fade-out');
      setTimeout(() => this.beaconEl.classList.add('hidden'), 500);
    }, 1800);
  }

  #bind() {
    // 1. Dropdown Era
    const eraBtn = this.hudEl.querySelector('#aoe-era-selector-btn');
    const eraDropdown = this.hudEl.querySelector('#aoe-era-dropdown');

    eraBtn?.addEventListener('click', () => {
      sound.playClick();
      eraDropdown?.classList.toggle('hidden');
    });

    this.hudEl.querySelectorAll('.aoe-era-dropdown-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        sound.playHorn();
        eraDropdown?.classList.add('hidden');
        const slideId = item.dataset.firstSlide;
        const targetIdx = this.presenter.slides.findIndex((s) => s.id === slideId);
        if (targetIdx >= 0) this.presenter.goTo(targetIdx, { event: e });
      });
    });

    // 2. Klik pada Minimap Canvas untuk memicu ping taktis
    this.minimapCanvas?.addEventListener('click', (e) => {
      const rect = this.minimapCanvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 176;
      const y = ((e.clientY - rect.top) / rect.height) * 96;
      this.triggerRadarPing(x, y);
    });

    // Tombol ping manual di atas minimap
    this.hudEl.querySelector('#aoe-ping-trigger')?.addEventListener('click', () => {
      this.triggerRadarPing(88, 48);
    });

    // 3. Tombol Top Bar
    this.hudEl.querySelector('#aoe-top-techtree')?.addEventListener('click', () => this.techTree.open());
    this.hudEl.querySelector('#aoe-top-sandbox')?.addEventListener('click', () => this.sandbox.open());
    this.hudEl.querySelector('#aoe-top-3d')?.addEventListener('click', () => this.landscape3d.open());
    this.hudEl.querySelector('#aoe-top-codex')?.addEventListener('click', () => {
      const slide = this.presenter.slides[this.presenter.index];
      this.codex.open(slide?.chapter?.id || 'masalah');
    });
    this.hudEl.querySelector('#aoe-top-sound')?.addEventListener('click', () => {
      const muted = sound.toggleMute();
      this.isMuted = muted;
      const icon = this.hudEl.querySelector('#aoe-sound-icon');
      if (icon) icon.textContent = muted ? '🔇' : '🔊';
    });

    // 4. Tombol Pojok Kanan Bawah
    this.hudEl.querySelector('#aoe-bottom-game')?.addEventListener('click', () => this.sandbox.open());
    this.hudEl.querySelector('#aoe-bottom-3d')?.addEventListener('click', () => this.landscape3d.open());
    this.hudEl.querySelector('#aoe-bottom-tech')?.addEventListener('click', () => this.techTree.open());
    this.hudEl.querySelector('#aoe-bottom-theory')?.addEventListener('click', () => {
      const slide = this.presenter.slides[this.presenter.index];
      this.codex.open(slide?.chapter?.id || 'masalah');
    });

    // 5. Tangkap klik entitas pada slide untuk update kartu status
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip) {
        this.selectEntity({
          name: `Kafilah ${chip.querySelector('b')?.textContent || 'Tugas'}`,
          role: 'Beban Komputasi Cloud (Task Caravan)',
          icon: '📦',
          badge: 'TUGAS'
        });
        return;
      }

      const lane = e.target.closest('.lane-name');
      if (lane) {
        this.selectEntity({
          name: `Benteng ${lane.querySelector('b')?.textContent || 'Server'}`,
          role: 'Node VM Komputasi',
          icon: '🏰',
          badge: 'VM'
        });
      }
    });
  }

  #render() {
    this.hudEl.innerHTML = `
      <!-- 1. BILAH SUMBER DAYA & ERA MENGAMBANG ATAS (SLEEK & TIDAK MENUTUPI JUDUL) -->
      <header class="aoe-floating-header">
        <!-- Dropdown Kemajuan Era -->
        <div class="aoe-era-selector-wrap">
          <button type="button" id="aoe-era-selector-btn" class="aoe-era-crest-btn" title="Klik untuk berpindah ke Zaman Peradaban lain">
            <span id="aoe-active-era-icon" class="era-icon">🏰</span>
            <b id="aoe-active-era-text">ZAMAN GELAP</b>
            <span class="era-arrow">▼</span>
          </button>

          <div id="aoe-era-dropdown" class="aoe-era-dropdown hidden">
            ${ERAS.map(
              (era, idx) => `
              <button type="button" class="aoe-era-dropdown-item" data-era-id="${era.id}" data-first-slide="${era.firstSlide}">
                <span class="item-icon">${era.icon}</span>
                <div class="item-text">
                  <b>Era ${idx + 1}: ${era.name}</b>
                  <small>${era.sub}</small>
                </div>
              </button>`
            ).join('')}
          </div>
        </div>

        <!-- Counter Sumber Daya Kerajaan -->
        <div class="aoe-resources-pill">
          <span class="res-tag" title="Total Beban Tugas">🪵 <b>16 Tugas</b></span>
          <span class="res-tag" title="Total Kecepatan Komputasi VM">🌾 <b>520 MIPS</b></span>
          <span class="res-tag gold" title="Indikator Makespan">🪙 <b id="aoe-res-make">Makespan</b></span>
          <span class="res-tag" title="Algoritma Aktif">👥 <b id="aoe-res-algo">Swarm</b></span>
        </div>

        <!-- Tombol Aksi Cepat RTS -->
        <div class="aoe-header-actions">
          <button type="button" id="aoe-top-techtree" class="aoe-hdr-btn" title="Buka Pohon Teknologi & Pengetahuan (T)">
            <span>🏛️</span><b>Tech Tree</b>
          </button>
          <button type="button" id="aoe-top-sandbox" class="aoe-hdr-btn aoe-gold-btn" title="Buka Game RTS Arena Perang Bebas (A)">
            <span>🎮</span><b>Game Arena</b>
          </button>
          <button type="button" id="aoe-top-3d" class="aoe-hdr-btn aoe-3d-btn" title="Buka Visualisasi Medan 3D Three.js: Rastrigin, Ackley, Sphere (3)">
            <span>🏔️</span><b>Medan 3D</b>
          </button>
          <button type="button" id="aoe-top-codex" class="aoe-hdr-btn" title="Buka Buku Teori & LaTeX Codex (B)">
            <span>📖</span><b>Buku Teori</b>
          </button>
          <button type="button" id="aoe-top-sound" class="aoe-hdr-btn aoe-sound-btn" title="Bisu / Bunyikan SFX Suara (M)">
            <span id="aoe-sound-icon">${this.isMuted ? '🔇' : '🔊'}</span>
          </button>
        </div>
      </header>

      <!-- 2. RADAR MINIMAP TAKTIS (POJOK KIRI BAWAH - TIDAK MENUTUPI TENGAH) -->
      <aside class="aoe-corner-minimap">
        <div class="minimap-bar">
          <span>RADAR TAKTIS</span>
          <button type="button" id="aoe-ping-trigger" class="aoe-ping-btn" title="Pancarkan gelombang radar ping">📡 PING</button>
        </div>
        <div class="minimap-frame">
          <canvas id="aoe-minimap-cv"></canvas>
        </div>
        <div id="aoe-unit-card-content" class="aoe-mini-card">
          <!-- Kartu status entitas terpilih -->
        </div>
      </aside>

      <!-- 3. KOTAK PINTASAN TAKTIS (POJOK KANAN BAWAH - TIDAK MENUTUPI TENGAH) -->
      <aside class="aoe-corner-actions">
        <button type="button" id="aoe-bottom-game" class="aoe-corner-btn gold" title="Buka Game RTS Pertahanan Cloud (A)">
          <span>🎮</span><small>Arena Game</small>
        </button>
        <button type="button" id="aoe-bottom-3d" class="aoe-corner-btn green" title="Buka Medan 3D Tiga Dimensi (3)">
          <span>🏔️</span><small>Medan 3D</small>
        </button>
        <button type="button" id="aoe-bottom-tech" class="aoe-corner-btn" title="Buka Pohon Teknologi (T)">
          <span>🏛️</span><small>Tech Tree</small>
        </button>
        <button type="button" id="aoe-bottom-theory" class="aoe-corner-btn" title="Buka Buku Teori LaTeX (B)">
          <span>📖</span><small>Buku Teori</small>
        </button>
      </aside>
    `;
  }
}
