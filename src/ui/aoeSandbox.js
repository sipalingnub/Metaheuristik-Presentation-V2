/**
 * Arena Game RTS: "Age of Cloud - Pertahanan Kerajaan Komputasi"
 * Mini-game strategi interaktif berbasis Age of Empires:
 * - 4 Benteng Kerajaan (Castles) dengan kapasitas MIPS yang bisa di-upgrade di Pandai Besi.
 * - 16 Kafilah Beban (Caravans) pengangkut instruksi komputasi (Gandum, Kayu, Emas, Batu).
 * - Pemain dapat menugaskan kafilah secara taktis atau merekrut Ordo Kunang-Kunang / Legiun Kelelawar.
 * - Mode Duel "Perang Akbar Dua Algoritma" (FA vs BA) dengan simulasi step-by-step bebas bug dan fanfare kemenangan.
 */

import { sound } from '../core/sound.js';
import {
  generateTasks,
  makeVMs,
  roundRobin,
  minMin,
  idealMakespan,
  evaluateAssignment,
  CloudScheduleOptimizer
} from '../algorithms/cloudScheduling.js';
import { taskColor } from '../render/cloudRenderer.js';

export class AoESandboxModal {
  constructor() {
    this.modal = null;
    this.seed = 2026;
    this.tasks = [];
    this.vms = [];
    this.userAssignment = [];
    this.gold = 150;
    this.selectedCaravan = null;
    this.simRunning = false;
    this.timerId = null;
    this.optimizer = null;
    this.duelActive = false;
    this.duelData = { faScore: 0, baScore: 0, iter: 0, maxIter: 30 };
  }

  mount(root) {
    if (this.modal) return;
    const el = document.createElement('div');
    el.id = 'aoe-sandbox-modal';
    el.className = 'aoe-modal-backdrop hidden';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Game RTS Penjadwalan Cloud');
    root.appendChild(el);
    this.modal = el;
    this.#initGameData();
    this.#render();
    this.#bind();
  }

  open() {
    if (!this.modal) return;
    this.#initGameData();
    this.modal.classList.remove('hidden');
    sound.playHorn();
    this.#render();
  }

  close() {
    if (!this.modal) return;
    this.#stopSim();
    this.modal.classList.add('hidden');
    sound.playClick();
  }

  toggle() {
    if (this.modal?.classList.contains('hidden')) this.open();
    else this.close();
  }

  #initGameData() {
    this.#stopSim();
    this.tasks = generateTasks(16, this.seed);
    this.vms = makeVMs(4);
    const rr = roundRobin(this.tasks, this.vms);
    this.userAssignment = rr.assignment.slice();
    this.ideal = idealMakespan(this.tasks, this.vms);
    this.rrRes = rr;
    this.mmRes = minMin(this.tasks, this.vms);
    this.selectedCaravan = null;
    this.duelActive = false;
  }

  #stopSim() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.simRunning = false;
  }

  #bind() {
    this.modal.addEventListener('click', (e) => {
      // 1. Tombol Tutup
      if (e.target.closest('#aoe-sandbox-close') || e.target === this.modal) {
        this.close();
        return;
      }

      // 2. Pemilihan Kafilah Tugas (Select Caravan)
      const cartBtn = e.target.closest('[data-caravan-idx]');
      if (cartBtn && !this.simRunning) {
        sound.playClick();
        const idx = Number(cartBtn.dataset.caravanIdx);
        this.selectedCaravan = this.selectedCaravan === idx ? null : idx;
        this.#updateSelectionHighlight();
        return;
      }

      // 3. Penugasan ke Benteng (Dispatch to Castle)
      const castleCard = e.target.closest('[data-castle-idx]');
      if (castleCard && this.selectedCaravan !== null && !this.simRunning) {
        const targetVm = Number(castleCard.dataset.castleIdx);
        sound.playSword();
        this.userAssignment[this.selectedCaravan] = targetVm;
        this.selectedCaravan = null;
        this.#updateDisplay();
        return;
      }

      // 4. Upgrade MIPS di Pandai Besi (Blacksmith Upgrade)
      const upgradeBtn = e.target.closest('[data-upgrade-vm]');
      if (upgradeBtn && !this.simRunning) {
        const vmIdx = Number(upgradeBtn.dataset.upgradeVm);
        if (this.gold >= 40) {
          this.gold -= 40;
          this.vms[vmIdx].mips += 25;
          sound.playSword();
          this.ideal = idealMakespan(this.tasks, this.vms);
          this.rrRes = roundRobin(this.tasks, this.vms);
          this.mmRes = minMin(this.tasks, this.vms);
          this.#updateDisplay();
        } else {
          sound.playClick();
          alert('Emas kerajaan tidak mencukupi untuk menempa benteng! Butuh 40 Emas.');
        }
        return;
      }

      // 5. Aksi Game RTS
      const actBtn = e.target.closest('[data-game-act]');
      if (actBtn) {
        const act = actBtn.dataset.gameAct;
        if (act === 'reset-rr') {
          sound.playClick();
          this.#stopSim();
          this.userAssignment = this.rrRes.assignment.slice();
          this.#updateDisplay();
        } else if (act === 'apply-mm') {
          sound.playClick();
          this.#stopSim();
          this.userAssignment = this.mmRes.assignment.slice();
          this.#updateDisplay();
        } else if (act === 'deploy-fa') {
          this.#deploySwarm('fa');
        } else if (act === 'deploy-ba') {
          this.#deploySwarm('ba');
        } else if (act === 'start-duel') {
          this.#startGrandDuel();
        } else if (act === 'new-quest') {
          sound.playClick();
          this.seed = (this.seed * 37 + 19) % 99999;
          this.gold += 50;
          this.#initGameData();
          this.#render();
        }
      }
    });
  }

  #deploySwarm(algoType) {
    this.#stopSim();
    sound.playSword();
    this.simRunning = true;
    const isFa = algoType === 'fa';

    // Buat optimizer cloud scheduling murni
    const opt = new CloudScheduleOptimizer({
      n: this.tasks.length,
      m: this.vms.length,
      tasks: this.tasks,
      vms: this.vms,
      populationSize: 24,
      maxIterations: 30,
      seed: this.seed + 7
    });

    let iter = 0;
    const banner = this.modal.querySelector('#game-status-banner');
    if (banner) {
      banner.textContent = `Batalion ${isFa ? 'Kunang-Kunang' : 'Kelelawar'} sedang menata formasi kafilah...`;
    }

    this.timerId = setInterval(() => {
      iter++;
      const st = opt.step();
      if (isFa) {
        sound.playChime();
        this.userAssignment = st.evalFa.assignment.slice();
      } else {
        sound.playPing();
        this.userAssignment = st.evalBa.assignment.slice();
      }
      this.#updateDisplay();

      if (iter >= 30 || st.done) {
        this.#stopSim();
        sound.playVictory();
        this.gold += 60;
        if (banner) {
          const finalMs = isFa ? st.evalFa.makespan : st.evalBa.makespan;
          banner.textContent = `Formasi Selesai! ${isFa ? 'Firefly' : 'Bat'} mencapai Makespan ${finalMs.toFixed(1)}s (+60 Emas diperoleh!)`;
        }
        this.#updateGold();
      }
    }, 90);
  }

  #startGrandDuel() {
    this.#stopSim();
    sound.playSword();
    this.simRunning = true;
    this.duelActive = true;

    const opt = new CloudScheduleOptimizer({
      n: this.tasks.length,
      m: this.vms.length,
      tasks: this.tasks,
      vms: this.vms,
      populationSize: 20,
      maxIterations: 30,
      seed: this.seed + 11
    });

    const duelBox = this.modal.querySelector('#aoe-duel-board');
    if (duelBox) duelBox.classList.remove('hidden');

    let iter = 0;
    this.timerId = setInterval(() => {
      iter++;
      const st = opt.step();
      const faScore = st.evalFa.makespan;
      const baScore = st.evalBa.makespan;

      const faScoreEl = this.modal.querySelector('#duel-score-fa');
      const baScoreEl = this.modal.querySelector('#duel-score-ba');
      const iterEl = this.modal.querySelector('#duel-live-iter');

      if (faScoreEl) faScoreEl.textContent = `${faScore.toFixed(1)}s`;
      if (baScoreEl) baScoreEl.textContent = `${baScore.toFixed(1)}s`;
      if (iterEl) iterEl.textContent = `Iterasi ${iter} / 30`;

      if (iter >= 30 || st.done) {
        this.#stopSim();
        sound.playVictory();
        this.gold += 100;

        let verdict = 'HASIL SERI!';
        if (faScore < baScore) {
          verdict = `🏆 KEMENANGAN ORDO KUNANG-KUNANG! (${faScore.toFixed(1)}s vs ${baScore.toFixed(1)}s)`;
          this.userAssignment = st.evalFa.assignment.slice();
        } else if (baScore < faScore) {
          verdict = `🏆 KEMENANGAN LEGIUN KELELAWAR! (${baScore.toFixed(1)}s vs ${faScore.toFixed(1)}s)`;
          this.userAssignment = st.evalBa.assignment.slice();
        } else {
          verdict = `🤝 KEDUA ALGORITMA IMBANG DI ${faScore.toFixed(1)}s!`;
        }

        const winShout = this.modal.querySelector('#duel-winner-shout');
        if (winShout) winShout.textContent = verdict;

        this.#updateDisplay();
        this.#updateGold();
      }
    }, 85);
  }

  #updateSelectionHighlight() {
    this.modal.querySelectorAll('[data-caravan-idx]').forEach((el) => {
      const idx = Number(el.dataset.caravanIdx);
      el.classList.toggle('selected-caravan', idx === this.selectedCaravan);
    });
    const hint = this.modal.querySelector('#game-status-banner');
    if (hint) {
      if (this.selectedCaravan !== null) {
        const task = this.tasks[this.selectedCaravan];
        hint.innerHTML = `⚔️ <b>Kafilah ${task.name} (${task.mi} MI) terpilih!</b> Klik salah satu benteng di atas untuk memindahkannya.`;
      } else {
        hint.textContent = 'Pilih salah satu kafilah di bawah lalu klik benteng tujuan untuk memindahkannya!';
      }
    }
  }

  #updateGold() {
    const goldEl = this.modal.querySelector('#game-gold-display');
    if (goldEl) goldEl.textContent = `${this.gold} 🪙`;
  }

  #updateDisplay() {
    const evalRes = evaluateAssignment(this.userAssignment, this.tasks, this.vms);

    // Perbarui Makespan & Batas Bawah
    const msEl = this.modal.querySelector('#game-makespan-display');
    const idealEl = this.modal.querySelector('#game-ideal-display');
    if (msEl) msEl.textContent = `${evalRes.makespan.toFixed(1)}s`;
    if (idealEl) idealEl.textContent = `${this.ideal.toFixed(1)}s`;

    // Perbarui Tampilan Masing-Masing Benteng
    this.vms.forEach((vm, j) => {
      const loadSec = evalRes.vmLoads[j];
      const pctOfMax = Math.min(100, Math.round((loadSec / evalRes.makespan) * 100));
      const mipsEl = this.modal.querySelector(`#castle-mips-${j}`);
      const loadEl = this.modal.querySelector(`#castle-load-${j}`);
      const barEl = this.modal.querySelector(`#castle-bar-${j}`);
      const listEl = this.modal.querySelector(`#castle-caravans-${j}`);

      if (mipsEl) mipsEl.textContent = `${vm.mips} MIPS`;
      if (loadEl) loadEl.textContent = `${loadSec.toFixed(1)}s (${pctOfMax}%)`;
      if (barEl) {
        barEl.style.width = `${pctOfMax}%`;
        barEl.className = 'castle-hp-bar ' + (loadSec === evalRes.makespan ? 'bottleneck' : pctOfMax > 75 ? 'balanced' : 'underload');
      }

      if (listEl) {
        listEl.innerHTML = '';
        this.tasks.forEach((t, i) => {
          if (this.userAssignment[i] === j) {
            const isSel = this.selectedCaravan === i;
            const cart = document.createElement('button');
            cart.type = 'button';
            cart.className = `rts-cart ${isSel ? 'selected-caravan' : ''}`;
            cart.dataset.caravanIdx = String(i);
            cart.style.borderColor = taskColor(t.id);
            cart.innerHTML = `
              <span class="cart-tag">${t.name}</span>
              <b class="cart-mi">${t.mi}</b>
            `;
            cart.title = `Kafilah ${t.name}: ${t.mi} MI. Klik untuk memilih!`;
            listEl.appendChild(cart);
          }
        });
      }
    });

    this.#updateGold();
  }

  #render() {
    this.modal.innerHTML = `
      <div class="aoe-sandbox-window aoe-rts-game-window">
        <!-- HEADER KERAJAAN RTS -->
        <header class="aoe-tech-header">
          <div class="aoe-tech-title-wrap">
            <span class="aoe-crest">🏰</span>
            <div>
              <h2>AGE OF CLOUD · PERTAHANAN KERAJAAN KOMPUTASI</h2>
              <p id="game-status-banner">Kendalikan kafilah tugas, perkuat benteng di pandai besi, atau kerahkan pasukan swarm!</p>
            </div>
          </div>
          <div class="rts-header-right">
            <span class="rts-gold-pill">Emas Kerajaan: <b id="game-gold-display">${this.gold} 🪙</b></span>
            <button type="button" id="aoe-sandbox-close" class="aoe-stone-btn close-btn" title="Kembali">&times;</button>
          </div>
        </header>

        <!-- STATUS BAR RTS -->
        <section class="aoe-sandbox-stats-bar">
          <div class="aoe-res-item">
            <span class="res-icon">⏱️</span>
            <div>
              <small>MAKESPAN JADWALMU</small>
              <b id="game-makespan-display" class="gold-text">--</b>
            </div>
          </div>
          <div class="aoe-res-item">
            <span class="res-icon">🎯</span>
            <div>
              <small>BATAS BAWAH TEORITIS</small>
              <b id="game-ideal-display">--</b>
            </div>
          </div>
          <div class="aoe-res-item">
            <span class="res-icon">📜</span>
            <div>
              <small>STANDAR ROUND-ROBIN</small>
              <b>${this.rrRes.makespan.toFixed(1)}s</b>
            </div>
          </div>
          <div class="aoe-res-item">
            <span class="res-icon">⚡</span>
            <div>
              <small>STANDAR MIN-MIN</small>
              <b>${this.mmRes.makespan.toFixed(1)}s</b>
            </div>
          </div>
        </section>

        <!-- DUEL BOARD MODAL AREA (JIKA AKTIF) -->
        <div id="aoe-duel-board" class="aoe-duel-arena-wrap ${this.duelActive ? '' : 'hidden'}">
          <div class="duel-contender fa-box">
            <span class="duel-faction-title">✨ ORDO KUNANG-KUNANG</span>
            <div class="duel-score-pill"><b id="duel-score-fa">--</b></div>
            <small>Dipandu cahaya tetangga β(r)</small>
          </div>
          <div class="duel-center-vs">
            <span class="vs-text">VS</span>
            <b id="duel-live-iter" class="duel-iter-badge">Iterasi 0 / 30</b>
          </div>
          <div class="duel-contender ba-box">
            <span class="duel-faction-title">🦇 LEGIUN KELELAWAR</span>
            <div class="duel-score-pill"><b id="duel-score-ba">--</b></div>
            <small>Dipandu sonar pemimpin x*</small>
          </div>
          <div id="duel-winner-shout" class="duel-banner-announcement"></div>
        </div>

        <!-- MEDAN TEMPUR 4 BENTENG KERAJAAN (4 CASTLES RTS) -->
        <div class="aoe-castles-grid">
          ${this.vms
            .map((vm, j) => {
              const castleNames = [
                'Benteng Fajar (Alpha Keep)',
                'Benteng Besi (Iron Keep)',
                'Kastil Batu (Stone Citadel)',
                'Benteng Surya (Bastion of Sun)'
              ];
              const castleIcons = ['🏰', '🏯', '🏛️', '🛡️'];
              return `
              <div class="aoe-castle-card" data-castle-idx="${j}">
                <div class="castle-card-header">
                  <span class="castle-avatar">${castleIcons[j]}</span>
                  <div class="castle-meta">
                    <b>${castleNames[j]}</b>
                    <small id="castle-mips-${j}">${vm.mips} MIPS</small>
                  </div>
                  <button type="button" class="aoe-upgrade-btn" data-upgrade-vm="${j}" title="Tempa di Pandai Besi: +25 MIPS (Biaya: 40 Emas)">
                    ⚒️ +25 MIPS <small>(40🪙)</small>
                  </button>
                </div>

                <div class="castle-hp-wrap">
                  <div class="castle-hp-label">
                    <span>Beban Waktu:</span>
                    <b id="castle-load-${j}">0s</b>
                  </div>
                  <div class="castle-hp-track">
                    <div id="castle-bar-${j}" class="castle-hp-bar"></div>
                  </div>
                </div>

                <div class="castle-caravans-area" id="castle-caravans-${j}">
                  <!-- Kafilah-kafilah tugas yang dialokasikan di sini -->
                </div>
              </div>`;
            })
            .join('')}
        </div>

        <!-- RTS FOOTER COMMAND PALETTE -->
        <footer class="aoe-sandbox-footer">
          <div class="aoe-cmd-group">
            <button type="button" class="aoe-stone-btn" data-game-act="reset-rr" title="Atur ulang beban ke Round-Robin">🔄 Round-Robin</button>
            <button type="button" class="aoe-stone-btn" data-game-act="apply-mm" title="Terapkan alokasi cerdas Min-Min">🎯 Terapkan Min-Min</button>
            <button type="button" class="aoe-stone-btn" data-game-act="new-quest" title="Acak beban tugas baru dan dapatkan emas">📜 Misi Baru (+50🪙)</button>
          </div>
          <div class="aoe-cmd-group primary-group">
            <button type="button" class="aoe-stone-btn gold-btn" data-game-act="deploy-fa">✨ Kerahkan Firefly</button>
            <button type="button" class="aoe-stone-btn purple-btn" data-game-act="deploy-ba">🦇 Kerahkan Bat</button>
            <button type="button" class="aoe-stone-btn clash-btn" data-game-act="start-duel">⚔️ PERANG AKBAR (DUEL FA VS BA)</button>
          </div>
        </footer>
      </div>
    `;

    this.#updateDisplay();
  }
}
