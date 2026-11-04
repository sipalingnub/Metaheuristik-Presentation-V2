/**
 * Master Age of Empires RTS HUD & Modals.
 * Mengelola modal interaktif (Tech Tree, Sandbox Arena, Codex, Medan 3D)
 * yang kini diakses langsung dari Navbar Terpadu di sebelah kiri.
 */

import { sound } from '../core/sound.js';
import { TechTreeModal } from './techTree.js';
import { AoESandboxModal } from './aoeSandbox.js';
import { DeepCodexModal } from './deepCodex.js';
import { Landscape3DModal } from './landscape3dModal.js';
import { Landscape3DChooserModal } from './landscape3dChooser.js';

export const ERAS = [
  { id: 'dark', name: 'Bab 1', sub: 'Krisis Cloud & NP-Hard', icon: '🏰', firstSlide: 'masalah' },
  { id: 'feudal', name: 'Bab 2', sub: 'Ordo Kunang-Kunang (FA)', icon: '💡', firstSlide: 'fa-inspirasi' },
  { id: 'castle', name: 'Bab 3', sub: 'Legiun Kelelawar (BA)', icon: '🦇', firstSlide: 'ba-inspirasi' },
  { id: 'imperial', name: 'Bab 4', sub: 'Perang Penjadwalan Cloud', icon: '⚔️', firstSlide: 'kasus-kode' },
  { id: 'wonder', name: 'Bab 5', sub: 'Sintesis & Analisis Hasil', icon: '🏛️', firstSlide: 'adu' }
];

export class AoEHud {
  /**
   * @param {import('./presenter.js').Presenter} presenter
   */
  constructor(presenter) {
    this.presenter = presenter;
    this.techTree = new TechTreeModal();
    this.sandbox = new AoESandboxModal(() => this.presenter.goTo(0));
    this.codex = new DeepCodexModal();
    this.landscape3d = new Landscape3DModal();
    this.landscapeChooser = new Landscape3DChooserModal({
      onSelectBuiltIn: (opt) => this.landscape3d.open(opt)
    });
    this.hudEl = null;
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
    this.landscapeChooser.mount(frameEl);
    window.__aoeHud = this;
  }

  update() {
    // Dipanggil saat pergantian slide bila dibutuhkan
  }
}
