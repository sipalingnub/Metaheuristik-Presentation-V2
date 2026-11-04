/**
 * Landscape3DChooserModal: Portal pemilih visualisasi 3D.
 * Menyediakan 3 pilihan visualisasi sebelum masuk ke dunia 3D:
 * 1. Firefly Algorithm 3D (https://raraa17.github.io/firefly-algorithm/)
 * 2. Dunia Baty 3D (https://ninduyi.github.io/tes/)
 * 3. Medan Komparasi 3D (Bawaan)
 */

import { sound } from '../core/sound.js';

export const PORTALS = [
  {
    id: 'firefly',
    title: 'Firefly Algorithm 3D',
    icon: '💡',
    glowClass: 'halo-firefly',
    url: 'https://raraa17.github.io/firefly-algorithm/',
    btnText: 'Buka Simulasi',
    isExternal: true
  },
  {
    id: 'bat',
    title: 'Dunia Baty 3D',
    icon: '🦇',
    glowClass: 'halo-bat',
    url: 'https://ninduyi.github.io/tes/',
    btnText: 'Buka Dunia Baty',
    isExternal: true
  },
  {
    id: 'builtin',
    title: 'Medan Komparasi 3D',
    icon: '🏔️',
    glowClass: 'halo-builtin',
    url: null,
    btnText: 'Masuk Medan 3D',
    isExternal: false
  }
];

export class Landscape3DChooserModal {
  /**
   * @param {Object} options
   * @param {() => void} [options.onSelectBuiltIn]
   */
  constructor(options = {}) {
    this.modal = null;
    this.onSelectBuiltIn = options.onSelectBuiltIn || (() => {});
  }

  mount(root) {
    if (this.modal) return;
    const el = document.createElement('div');
    el.id = 'aoe-3d-chooser-modal';
    el.className = 'aoe-modal-backdrop hidden';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Portal Pemilih Visualisasi 3D');
    root.appendChild(el);
    this.modal = el;
    this.#render();
    this.#bind();
  }

  open() {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    sound.playHorn();
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.add('hidden');
    sound.playClick();
  }

  toggle() {
    if (this.modal?.classList.contains('hidden')) {
      this.open();
    } else {
      this.close();
    }
  }

  #render() {
    this.modal.innerHTML = `
      <div class="aoe-chooser-window">
        <header class="aoe-chooser-header">
          <div class="aoe-chooser-title-wrap">
            <span class="aoe-chooser-icon">🏔️</span>
            <div>
              <h2 class="aoe-chooser-title">PILIH VISUALISASI 3D</h2>
            </div>
          </div>
          <button type="button" class="aoe-stone-btn close-btn" id="btn-close-3d-chooser" title="Tutup (ESC)">&times;</button>
        </header>

        <div class="aoe-chooser-body">
          <div class="aoe-3d-grid">
            ${PORTALS.map((portal) => `
              <div class="aoe-3d-card card-${portal.id}" data-portal-id="${portal.id}" tabindex="0" role="button" aria-label="${portal.title}">
                <div class="card-icon-halo ${portal.glowClass}">
                  <span class="card-icon">${portal.icon}</span>
                </div>
                <h3 class="card-title">${portal.title}</h3>
                <div class="card-action-wrap">
                  ${portal.isExternal ? `
                    <a href="${portal.url}" class="card-action-btn btn-action-${portal.id}" tabindex="-1">
                      <span>${portal.btnText}</span>
                      <svg viewBox="0 0 24 24" class="ext-icon" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </a>
                  ` : `
                    <button type="button" class="card-action-btn btn-action-${portal.id}" tabindex="-1">
                      <span>${portal.btnText}</span>
                      <span class="play-arrow" aria-hidden="true">▶</span>
                    </button>
                  `}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <footer class="aoe-chooser-footer">
          <div class="footer-tip">
            <kbd>ESC</kbd> untuk menutup
          </div>
        </footer>
      </div>
    `;
  }

  #bind() {
    const closeBtn = this.modal.querySelector('#btn-close-3d-chooser');
    closeBtn?.addEventListener('click', () => this.close());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    const cards = this.modal.querySelectorAll('.aoe-3d-card');
    cards.forEach((card) => {
      const portalId = card.getAttribute('data-portal-id');
      const portal = PORTALS.find((p) => p.id === portalId);
      if (!portal) return;

      const triggerPortal = (event) => {
        if (event.target.closest('a')) {
          sound.playClick();
          return;
        }

        sound.playClick();
        if (portal.isExternal) {
          window.location.href = portal.url;
        } else {
          this.close();
          this.onSelectBuiltIn();
        }
      };

      card.addEventListener('click', triggerPortal);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerPortal(e);
        }
      });
    });
  }
}
