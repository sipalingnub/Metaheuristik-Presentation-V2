/**
 * Canvas RTS arena. Villagers use Firefly attraction for foraging; knights
 * use Bat-style sonar, loudness, pulse rate, and velocity for combat.
 */

import { sound } from '../core/sound.js';

const MAP_WIDTH = 1800;
const MAP_HEIGHT = 1050;
const RESOURCE_CAPACITY = 10;
const MAX_POPULATION = 60;

export class AoESandboxModal {
  constructor(onHome = null) {
    this.modal = null;
    this.onHome = onHome;
    this.frameId = 0;
    this.lastFrameTime = 0;
    this.fogCanvas = document.createElement('canvas');
    this.fogCanvas.width = MAP_WIDTH;
    this.fogCanvas.height = MAP_HEIGHT;
    this.fogContext = this.fogCanvas.getContext('2d');
    this.world = this.#createWorld();
  }

  mount(root) {
    if (this.modal) return;
    const modal = document.createElement('div');
    modal.id = 'aoe-sandbox-modal';
    modal.className = 'aoe-modal-backdrop hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Arena RTS Firefly');
    root.appendChild(modal);
    this.modal = modal;
    this.#render();
    this.#bind();
  }

  open() {
    if (!this.modal) return;
    this.modal.classList.remove('hidden');
    this.#render();
    this.#startLoop();
    sound.playHorn();
  }

  close() {
    if (!this.modal) return;
    this.#stopLoop();
    this.modal.classList.add('hidden');
    sound.playClick();
  }

  toggle() {
    if (this.modal?.classList.contains('hidden')) this.open();
    else this.close();
  }

  #createWorld() {
    const world = {
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      gold: 300,
      wood: 200,
      time: 0,
      paused: false,
      gameOver: '',
      nextWave: 18,
      nextId: 1,
      wave: 0,
      knownEnemyId: null,
      knownEnemyUntil: 0,
      camera: { x: 0, y: 0, zoom: 1, initialized: false },
      townCenter: { x: 390, y: 520, hp: 1000, maxHp: 1000 },
      villagers: [],
      knights: [],
      enemies: [],
      nodes: [],
      floatingText: [],
      sonarPulses: [],
      sonarReveals: []
    };
    [
      ['wood', 150, 200, 150],
      ['wood', 220, 800, 130],
      ['wood', 650, 200, 170],
      ['wood', 835, 800, 160],
      ['wood', 1200, 170, 140],
      ['wood', 1330, 850, 150],
      ['gold', 170, 505, 180],
      ['gold', 590, 445, 160],
      ['gold', 1050, 500, 220],
      ['gold', 1240, 690, 180]
    ].forEach(([type, x, y, amount], index) => {
      world.nodes.push({
        id: index + 1,
        type,
        x,
        y,
        amount,
        maxAmount: amount
      });
    });

    for (let i = 0; i < 4; i++) {
      world.villagers.push(this.#newUnit(world, 'villager', world.townCenter.x + 70 + i * 19, world.townCenter.y + 46));
    }
    for (let i = 0; i < 2; i++) {
      world.knights.push(this.#newUnit(world, 'knight', world.townCenter.x + 44, world.townCenter.y - 60 + i * 34));
    }
    return world;
  }

  #newUnit(world, type, x, y) {
    return {
      id: world.nextId++,
      type,
      x,
      y,
      hp: type === 'enemy' ? 3 : 10,
      maxHp: type === 'enemy' ? 3 : 10,
      cargo: { gold: 0, wood: 0 },
      targetId: null,
      action: 'idle',
      cooldown: 0,
      wander: 0,
      vx: 0,
      vy: 0,
      frequency: 0.2 + Math.random() * 0.8,
      loudness: 0.9,
      pulseRate: 0.15,
      sonarCooldown: 0.4 + Math.random() * 1.8,
      patrolTarget: null,
      patrolTime: 0
    };
  }

  #render() {
    this.modal.innerHTML = `
      <div class="aoe-sandbox-window aoe-rts-game-window rts-firefly-window">
        <header class="aoe-tech-header rts-firefly-header">
          <div class="aoe-tech-title-wrap">
            <span class="aoe-crest" aria-hidden="true">🏰</span>
            <div>
              <h2>AGE OF CLOUD · FIRE FLY RTS</h2>
              <p id="rts-status" aria-live="polite">Kumpulkan sumber daya, latih pasukan, dan hancurkan kamp lawan.</p>
            </div>
          </div>
          <div class="rts-firefly-header-actions">
            <div class="rts-resource-pill"><span>🪙</span><b id="rts-gold">300</b></div>
            <div class="rts-resource-pill"><span>🪵</span><b id="rts-wood">200</b></div>
            <button type="button" class="aoe-stone-btn rts-home-btn" data-rts-action="home">🏠 Home</button>
            <button type="button" id="aoe-sandbox-close" class="aoe-stone-btn close-btn" title="Tutup arena" aria-label="Tutup arena">&times;</button>
          </div>
        </header>

        <section class="rts-firefly-stats" aria-label="Status pasukan">
          <div><small>PENDUDUK</small><b id="rts-population">4</b></div>
          <div><small>KNIGHT</small><b id="rts-knight-count">2</b></div>
          <div><small>VISI PASUKAN</small><b id="rts-wave">KABUT</b></div>
          <div><small>GEMA TERDETEKSI</small><b id="rts-enemy-hp">0</b></div>
        </section>

        <main class="rts-firefly-layout">
          <section class="rts-firefly-map-panel" aria-label="Peta perang RTS">
            <div class="rts-firefly-map-heading">
              <b>MEDAN KERAJAAN</b>
              <span>Kabut perang · seret untuk jelajah · scroll untuk zoom</span>
              <div>
                <button type="button" data-rts-action="zoom-out" aria-label="Perkecil peta">−</button>
                <button type="button" data-rts-action="zoom-in" aria-label="Perbesar peta">+</button>
                <button type="button" data-rts-action="center" aria-label="Pusatkan peta">⌖</button>
              </div>
            </div>
            <canvas id="rts-game-canvas" aria-label="Peta RTS dengan fog of war, ekonomi Firefly, dan knight Bat dengan sonar"></canvas>
            <div class="rts-firefly-map-legend">
              <span><i class="legend-villager"></i> Villager</span>
              <span><i class="legend-knight"></i> Knight</span>
              <span><i class="legend-gold"></i> Tambang emas</span>
              <span><i class="legend-wood"></i> Hutan</span>
              <span><i class="legend-enemy"></i> Musuh</span>
            </div>
          </section>

          <aside class="rts-firefly-command">
            <section class="rts-firefly-resource-card">
              <header><span>📦 PERSEDIAAN</span><small>biaya unit</small></header>
              <div class="rts-firefly-resource-row"><span>🪙 Emas</span><b id="rts-gold-side">300</b></div>
              <div class="rts-firefly-resource-row"><span>🪵 Kayu</span><b id="rts-wood-side">200</b></div>
            </section>

            <section class="rts-firefly-recruit">
              <header>🏰 PUSAT KOTA</header>
              <p>Latih pasukan dari Town Center.</p>
              <button type="button" data-rts-action="spawn-villager">
                <span class="recruit-avatar villager-avatar">●</span>
                <span><b>Spawn Villager</b><small>Firefly forager</small></span>
                <strong>50 🪙</strong>
              </button>
              <button type="button" data-rts-action="spawn-knight">
                <span class="recruit-avatar knight-avatar">■</span>
                <span><b>Spawn Knight</b><small>Firefly hunter</small></span>
                <strong>100 🪙 · 50 🪵</strong>
              </button>
            </section>

            <section class="rts-firefly-ai-card">
              <header>✨ EKONOMI · FIREFLY ALGORITHM</header>
              <b>Tarikan cahaya untuk mencari resource</b>
              <p>Villager memilih node terang yang terlihat. Node kaya dan dekat menarik lebih kuat; node habis kehilangan daya tarik.</p>
              <code>score = intensity × e<sup>−γr²</sup></code>
              <small>Villager kembali ke Town Center saat membawa 10 resource.</small>
            </section>

            <section class="rts-firefly-ai-card rts-bat-ai-card">
              <header>🦇 MILITER · BAT ALGORITHM</header>
              <b id="rts-bat-phase">Eksplorasi · loudness tinggi</b>
              <p>Sonar mengungkap musuh dalam kabut. Knight mengeksplorasi saat belum ada gema, lalu berkumpul dan menyerbu target yang ditemukan.</p>
              <code id="rts-bat-formula">A tinggi · pulse lambat · radius sonar besar</code>
              <small>Target musuh ditemukan: <b id="rts-known-target">belum ada</b></small>
            </section>

            <section class="rts-firefly-enemy-card">
              <header>🚩 MUSUH DARI KABUT</header>
              <b id="rts-enemy-status">Musuh belum terdeteksi</b>
              <div class="rts-enemy-health"><i id="rts-enemy-health-bar"></i></div>
              <small id="rts-enemy-hint">Musuh tersembunyi di balik kabut perang.</small>
            </section>
          </aside>
        </main>

        <footer class="rts-firefly-footer">
          <p>Firefly mencari resource yang terlihat. Bat memakai sonar untuk mengungkap musuh dan mengumpulkan knight pada target.</p>
          <div>
            <button type="button" class="aoe-stone-btn" data-rts-action="pause">⏸ Jeda</button>
            <button type="button" class="aoe-stone-btn" data-rts-action="reset">↻ Mulai Ulang</button>
          </div>
        </footer>
      </div>
    `;
    this.canvas = this.modal.querySelector('#rts-game-canvas');
    this.ctx = this.canvas?.getContext('2d');
    this.#bindCanvas();
    this.#resizeCanvas();
    const pauseButton = this.modal.querySelector('[data-rts-action="pause"]');
    if (pauseButton) pauseButton.textContent = this.world.paused ? '▶ Lanjutkan' : '⏸ Jeda';
    this.#updateHud();
  }

  #bind() {
    this.modal.addEventListener('click', (event) => {
      if (event.target.closest('#aoe-sandbox-close') || event.target === this.modal) {
        this.close();
        return;
      }

      const action = event.target.closest('[data-rts-action]')?.dataset.rtsAction;
      if (!action) {
        if (event.target.closest('[data-game-act="home"]')) {
          this.close();
          this.onHome?.();
        }
        return;
      }

      if (action === 'home') {
        this.close();
        this.onHome?.();
      } else if (action === 'spawn-villager') {
        this.#spawnUnit('villager');
      } else if (action === 'spawn-knight') {
        this.#spawnUnit('knight');
      } else if (action === 'pause') {
        this.world.paused = !this.world.paused;
        const button = this.modal.querySelector('[data-rts-action="pause"]');
        if (button) button.textContent = this.world.paused ? '▶ Lanjutkan' : '⏸ Jeda';
        this.#setStatus(this.world.paused ? 'Simulasi dijeda.' : 'Simulasi dilanjutkan.');
      } else if (action === 'reset') {
        this.world = this.#createWorld();
        this.#updateHud();
        this.#setStatus('Kerajaan baru siap. Kumpulkan sumber daya dan lindungi Town Center.');
        sound.playClick();
      } else if (action === 'zoom-in' || action === 'zoom-out') {
        this.#zoomCamera(action === 'zoom-in' ? 1.15 : 1 / 1.15);
      } else if (action === 'center') {
        this.#centerCamera();
      }
    });
  }

  #bindCanvas() {
    if (!this.canvas) return;
    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      this.canvas.setPointerCapture(event.pointerId);
      this.drag = {
        x: event.clientX,
        y: event.clientY,
        cameraX: this.world.camera.x,
        cameraY: this.world.camera.y
      };
      this.canvas.classList.add('is-panning');
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.drag) return;
      const bounds = this.canvas.getBoundingClientRect();
      const scale = this.world.camera.zoom;
      this.world.camera.x = this.drag.cameraX - (event.clientX - this.drag.x) / scale;
      this.world.camera.y = this.drag.cameraY - (event.clientY - this.drag.y) / scale;
      this.#clampCamera(bounds.width, bounds.height);
    });
    const finishDrag = () => {
      this.drag = null;
      this.canvas.classList.remove('is-panning');
    };
    this.canvas.addEventListener('pointerup', finishDrag);
    this.canvas.addEventListener('pointercancel', finishDrag);
    this.canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      const bounds = this.canvas.getBoundingClientRect();
      const anchor = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      this.#zoomCamera(event.deltaY < 0 ? 1.12 : 1 / 1.12, anchor);
    }, { passive: false });
  }

  #resizeCanvas() {
    if (!this.canvas || !this.ctx) return;
    const bounds = this.canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(bounds.width * dpr);
    const height = Math.round(bounds.height * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    if (!this.world.camera.initialized) {
      this.world.camera.initialized = true;
      this.#centerCamera();
    } else {
      this.#clampCamera(bounds.width, bounds.height);
    }
  }

  #zoomCamera(factor, anchor) {
    const bounds = this.canvas?.getBoundingClientRect();
    if (!bounds) return;
    const camera = this.world.camera;
    const point = anchor || { x: bounds.width / 2, y: bounds.height / 2 };
    const mapX = camera.x + point.x / camera.zoom;
    const mapY = camera.y + point.y / camera.zoom;
    camera.zoom = Math.max(0.62, Math.min(1.9, camera.zoom * factor));
    camera.x = mapX - point.x / camera.zoom;
    camera.y = mapY - point.y / camera.zoom;
    this.#clampCamera(bounds.width, bounds.height);
  }

  #centerCamera() {
    const bounds = this.canvas?.getBoundingClientRect();
    if (!bounds) return;
    this.world.camera.x = this.world.townCenter.x - bounds.width / this.world.camera.zoom * 0.42;
    this.world.camera.y = this.world.townCenter.y - bounds.height / this.world.camera.zoom / 2;
    this.#clampCamera(bounds.width, bounds.height);
  }

  #clampCamera(viewWidth, viewHeight) {
    const camera = this.world.camera;
    camera.x = Math.max(0, Math.min(MAP_WIDTH - viewWidth / camera.zoom, camera.x));
    camera.y = Math.max(0, Math.min(MAP_HEIGHT - viewHeight / camera.zoom, camera.y));
  }

  #spawnUnit(type) {
    const world = this.world;
    if (type === 'villager') {
      if (world.gold < 50) return this.#setStatus('Emas tidak cukup. Villager membutuhkan 50 emas.');
      if (world.villagers.length + world.knights.length >= 60) return this.#setStatus('Batas populasi 60 unit telah tercapai.');
      world.gold -= 50;
    } else {
      if (world.gold < 100 || world.wood < 50) return this.#setStatus('Knight membutuhkan 100 emas dan 50 kayu.');
      if (world.villagers.length + world.knights.length >= 60) return this.#setStatus('Batas populasi 60 unit telah tercapai.');
      world.gold -= 100;
      world.wood -= 50;
    }

    const count = world.villagers.length + world.knights.length;
    const angle = count * 2.399963229728653;
    const radius = 74 + (count % 3) * 12;
    const unit = this.#newUnit(world, type, world.townCenter.x + Math.cos(angle) * radius, world.townCenter.y + Math.sin(angle) * radius);
    world[type === 'villager' ? 'villagers' : 'knights'].push(unit);
    this.#setStatus(type === 'villager' ? 'Villager bergabung dan mulai mencari sumber daya.' : 'Knight dilatih dan mulai berburu target musuh.');
    sound.playSword();
    this.#updateHud();
  }

  #startLoop() {
    this.#stopLoop();
    this.lastFrameTime = 0;
    const frame = (timestamp) => {
      const elapsed = this.lastFrameTime ? Math.min((timestamp - this.lastFrameTime) / 1000, 0.05) : 0;
      this.lastFrameTime = timestamp;
      this.#resizeCanvas();
      if (!this.world.paused) this.#updateWorld(elapsed);
      this.#drawWorld(timestamp);
      this.frameId = requestAnimationFrame(frame);
    };
    this.frameId = requestAnimationFrame(frame);
  }

  #stopLoop() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.lastFrameTime = 0;
  }

  #updateWorld(dt) {
    const world = this.world;
    world.time += dt;
    if (world.time >= world.nextWave) {
      this.#spawnEnemyWave();
      world.nextWave = world.time + 34 + Math.random() * 12;
    }

    const crew = [...world.villagers, ...world.knights];
    for (const villager of world.villagers) this.#updateVillager(villager, dt, crew);
    for (const knight of world.knights) this.#updateKnight(knight, dt, crew);
    this.#updateSonar(dt);
    for (const enemy of world.enemies) this.#updateEnemy(enemy, dt, crew);

    world.knights = world.knights.filter((knight) => knight.hp > 0);
    world.enemies = world.enemies.filter((enemy) => enemy.hp > 0);
    if (world.knownEnemyId && !world.enemies.some((enemy) => enemy.id === world.knownEnemyId)) {
      world.knownEnemyId = null;
      world.knownEnemyUntil = 0;
    }
    if (world.time > world.knownEnemyUntil) {
      world.knownEnemyId = null;
    }
    world.floatingText = world.floatingText.filter((text) => {
      text.life -= dt;
      text.y -= 24 * dt;
      return text.life > 0;
    });
    this.#updateHud();
  }

  #updateVillager(unit, dt, crew) {
    const world = this.world;
    const carried = unit.cargo.gold + unit.cargo.wood;
    if (carried >= RESOURCE_CAPACITY) {
      unit.action = 'return';
      unit.targetId = 'town-center';
      const reached = this.#moveUnit(unit, world.townCenter, dt, 90, crew);
      if (reached) {
        world.gold += unit.cargo.gold;
        world.wood += unit.cargo.wood;
        this.#addFloat(world.townCenter.x, world.townCenter.y - 58, `+${unit.cargo.gold} gold · +${unit.cargo.wood} wood`, '#fff1a8');
        unit.cargo = { gold: 0, wood: 0 };
        unit.targetId = null;
      }
      return;
    }

    const node = this.#selectResourceTarget(unit);
    if (!node) {
      unit.action = 'idle';
      return;
    }
    unit.targetId = node.id;
    unit.action = 'forage';
    if (!this.#moveUnit(unit, node, dt, 82, crew, 25)) return;
    unit.cooldown -= dt;
    if (unit.cooldown > 0) return;
    unit.cooldown = 0.58;
    const amount = Math.min(1, node.amount, RESOURCE_CAPACITY - carried);
    node.amount -= amount;
    unit.cargo[node.type] += amount;
    const floatX = node.x + ((unit.id % 5) - 2) * 27;
    this.#addFloat(floatX, node.y - 26, `+${amount} ${node.type === 'gold' ? 'gold' : 'wood'}`, node.type === 'gold' ? '#ffe27a' : '#c9f49c');
    if (node.amount <= 0) {
      node.amount = 0;
      unit.targetId = null;
    }
  }

  #selectResourceTarget(unit) {
    const world = this.world;
    const candidates = world.nodes.filter((node) => node.amount > 0 && this.#isVisible(node.x, node.y));
    let best = null;
    let bestScore = -1;
    for (const node of candidates) {
      const distance = Math.hypot(node.x - unit.x, node.y - unit.y);
      const intensity = node.amount / node.maxAmount;
      const beta = Math.exp(-2.2 * (distance / 520) ** 2);
      const crowd = world.villagers.filter((other) =>
        other !== unit && other.targetId === node.id && Math.hypot(other.x - node.x, other.y - node.y) < 115
      ).length;
      const score = intensity * beta / (1 + crowd * 0.32);
      if (score > bestScore) {
        bestScore = score;
        best = node;
      }
    }
    return best;
  }

  #updateKnight(unit, dt, crew) {
    const world = this.world;
    const target = world.knownEnemyId && world.time <= world.knownEnemyUntil
      ? world.enemies.find((enemy) => enemy.id === world.knownEnemyId)
      : null;

    unit.sonarCooldown -= dt;
    if (unit.sonarCooldown <= 0) this.#emitSonar(unit);

    if (!target) {
      unit.action = 'explore';
      unit.targetId = null;
      unit.loudness = Math.min(1, unit.loudness + dt * 0.18);
      unit.pulseRate = Math.max(0.12, unit.pulseRate - dt * 0.16);
      unit.patrolTime -= dt;
      if (!unit.patrolTarget || unit.patrolTime <= 0 || Math.hypot(unit.patrolTarget.x - unit.x, unit.patrolTarget.y - unit.y) < 38) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 180 + Math.random() * 260;
        unit.patrolTarget = {
          x: Math.max(60, Math.min(MAP_WIDTH - 60, world.townCenter.x + Math.cos(angle) * radius)),
          y: Math.max(60, Math.min(MAP_HEIGHT - 60, world.townCenter.y + Math.sin(angle) * radius))
        };
        unit.patrolTime = 4 + Math.random() * 5;
      }
      this.#steerKnight(unit, unit.patrolTarget, dt, 88, crew);
      return;
    }

    unit.action = 'attack';
    unit.targetId = target.id;
    unit.loudness = Math.max(0.22, unit.loudness - dt * 0.22);
    unit.pulseRate = Math.min(0.92, unit.pulseRate + dt * 0.36);
    const distance = Math.hypot(target.x - unit.x, target.y - unit.y);
    if (distance > 34) {
      const flank = (unit.id % 2 ? 1 : -1) * 22;
      this.#steerKnight(unit, { x: target.x + flank, y: target.y + flank * 0.5 }, dt, 116 + unit.frequency * 24, crew);
      return;
    }

    unit.cooldown -= dt;
    if (unit.cooldown > 0) return;
    const attackRate = 0.95 - unit.pulseRate * 0.55;
    unit.cooldown = Math.max(0.28, attackRate);
    target.hp = Math.max(0, target.hp - 1);
    target.revealedUntil = world.time + 8;
    this.#addFloat(target.x + ((unit.id % 3) - 1) * 15, target.y - 22, '-1 HP', '#ff8b79');
    this.#addFloat(unit.x, unit.y - 24, `A ${unit.loudness.toFixed(1)} · r ${unit.pulseRate.toFixed(1)}`, '#e5f4ff');
    if (target.hp <= 0) {
      world.gold += target.intensity > 1 ? 35 : 12;
      this.#addFloat(target.x, target.y - 42, `+${target.intensity > 1 ? 35 : 12} Gold`, '#ffe27a');
      world.knownEnemyId = null;
      world.knownEnemyUntil = 0;
      this.#setStatus('Target musuh dikalahkan. Knight menyebar kembali dan memulai eksplorasi.');
    }
  }

  #updateEnemy(enemy, dt, crew) {
    const friendlyUnits = [...this.world.knights, ...this.world.villagers].filter((unit) => unit.hp > 0);
    const target = friendlyUnits.length
      ? friendlyUnits.reduce((nearest, unit) =>
          Math.hypot(unit.x - enemy.x, unit.y - enemy.y) < Math.hypot(nearest.x - enemy.x, nearest.y - enemy.y)
            ? unit
            : nearest
        )
      : { ...this.world.townCenter, id: 'town-center', type: 'structure' };
    const distance = Math.hypot(target.x - enemy.x, target.y - enemy.y);
    if (distance > 30) {
      this.#moveUnit(enemy, target, dt, 62, [...crew, ...this.world.enemies], 28);
      return;
    }
    enemy.cooldown -= dt;
    if (enemy.cooldown > 0) return;
    enemy.cooldown = 1.4;
    target.hp = Math.max(0, target.hp - 1);
    this.#addFloat(target.x + ((enemy.id % 3) - 1) * 12, target.y - 20, '-1 HP', '#ff9589');
    if (target.hp === 0 && target.type === 'knight') {
      this.world.knights = this.world.knights.filter((knight) => knight !== target);
      this.#setStatus('Seorang knight gugur. Rekrut knight baru untuk menjaga perbatasan.');
    } else if (target.hp === 0 && target.type === 'villager') {
      this.world.villagers = this.world.villagers.filter((villager) => villager !== target);
      this.#setStatus('Seorang villager gugur dalam serangan minion.');
    } else if (target.hp === 0 && target.type === 'structure') {
      this.#setStatus('Town Center hancur. Bangun kembali kekuatan sebelum gelombang berikutnya.');
    }
  }

  #steerKnight(unit, target, dt, speed, crew) {
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const distance = Math.hypot(dx, dy) || 1;
    let desiredX = dx / distance;
    let desiredY = dy / distance;
    for (const other of crew) {
      if (other === unit || other.hp <= 0 || other.type !== 'knight') continue;
      const awayX = unit.x - other.x;
      const awayY = unit.y - other.y;
      const separation = Math.hypot(awayX, awayY);
      if (separation > 0 && separation < 38) {
        const push = (38 - separation) / 38;
        desiredX += (awayX / separation) * push * 0.9;
        desiredY += (awayY / separation) * push * 0.9;
      }
    }

    const magnitude = Math.hypot(desiredX, desiredY) || 1;
    desiredX /= magnitude;
    desiredY /= magnitude;
    unit.frequency = Math.max(0.05, Math.min(1, unit.frequency + (Math.random() - 0.5) * 0.08));
    const inertia = 0.45 + unit.loudness * 0.32;
    unit.vx = unit.vx * inertia + desiredX * (1 - inertia) * unit.frequency;
    unit.vy = unit.vy * inertia + desiredY * (1 - inertia) * unit.frequency;
    const velocity = Math.hypot(unit.vx, unit.vy) || 1;
    unit.x = Math.max(26, Math.min(MAP_WIDTH - 26, unit.x + (unit.vx / velocity) * speed * dt));
    unit.y = Math.max(26, Math.min(MAP_HEIGHT - 26, unit.y + (unit.vy / velocity) * speed * dt));
  }

  #emitSonar(knight) {
    const radius = 115 + knight.loudness * 190;
    const interval = 0.45 + (1 - knight.pulseRate) * 2.45;
    knight.sonarCooldown = interval;
    this.world.sonarPulses.push({
      x: knight.x,
      y: knight.y,
      radius: 3,
      maxRadius: radius,
      speed: radius / 1.25,
      alpha: 0.72,
      sourceId: knight.id,
      detected: new Set()
    });
  }

  #updateSonar(dt) {
    const world = this.world;
    world.sonarPulses = world.sonarPulses.filter((pulse) => {
      const previousRadius = pulse.radius;
      pulse.radius = Math.min(pulse.maxRadius, pulse.radius + pulse.speed * dt);
      pulse.alpha = 0.72 * (1 - pulse.radius / pulse.maxRadius);
      for (const enemy of world.enemies) {
        if (pulse.detected.has(enemy.id)) continue;
        const distance = Math.hypot(enemy.x - pulse.x, enemy.y - pulse.y);
        if (distance >= previousRadius - 16 && distance <= pulse.radius + 16) {
          pulse.detected.add(enemy.id);
          enemy.revealedUntil = world.time + 8;
          world.sonarReveals.push({ x: enemy.x, y: enemy.y, radius: 155, expiresAt: world.time + 5 });
          const captain = enemy.intensity > 1;
          const currentTarget = world.enemies.find((candidate) => candidate.id === world.knownEnemyId);
          const sonarSource = world.knights.find((knight) => knight.id === pulse.sourceId);
          const targetIsBetter = !currentTarget
            || world.time > world.knownEnemyUntil
            || enemy.intensity > currentTarget.intensity
            || (enemy.intensity === currentTarget.intensity
              && sonarSource
              && Math.hypot(enemy.x - sonarSource.x, enemy.y - sonarSource.y)
                < Math.hypot(currentTarget.x - sonarSource.x, currentTarget.y - sonarSource.y));
          if (targetIsBetter) {
            world.knownEnemyId = enemy.id;
            world.knownEnemyUntil = world.time + 8;
          }
          this.#addFloat(enemy.x, enemy.y - 25, captain ? 'CAPTAIN PING!' : 'ECHO PING!', '#edf8ff');
          this.#setStatus(`${captain ? 'Captain' : 'Musuh'} ditemukan sonar Bat. Pasukan knight berkumpul dan menyerbu!`);
          sound.playPing();
        }
      }
      return pulse.radius < pulse.maxRadius;
    });
    world.sonarReveals = world.sonarReveals.filter((reveal) => reveal.expiresAt > world.time);
  }

  #isVisible(x, y) {
    const world = this.world;
    if (Math.hypot(x - world.townCenter.x, y - world.townCenter.y) < 235) return true;
    return [...world.villagers, ...world.knights].some((unit) => {
      const radius = unit.type === 'knight' ? 142 : 112;
      return unit.hp > 0 && Math.hypot(x - unit.x, y - unit.y) < radius;
    });
  }

  #moveUnit(unit, target, dt, speed, crew, arriveDistance = 18) {
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= arriveDistance) return true;

    let vx = dx / distance;
    let vy = dy / distance;
    for (const other of crew) {
      if (other === unit || other.hp <= 0) continue;
      const awayX = unit.x - other.x;
      const awayY = unit.y - other.y;
      const separation = Math.hypot(awayX, awayY);
      if (separation > 0 && separation < 24) {
        const push = (24 - separation) / 24;
        vx += awayX / separation * push * 0.8;
        vy += awayY / separation * push * 0.8;
      }
    }
    const magnitude = Math.hypot(vx, vy) || 1;
    const variation = 1 + Math.sin(this.world.time * 2 + unit.id) * 0.035;
    unit.x = Math.max(26, Math.min(MAP_WIDTH - 26, unit.x + (vx / magnitude) * speed * dt * variation));
    unit.y = Math.max(26, Math.min(MAP_HEIGHT - 26, unit.y + (vy / magnitude) * speed * dt * variation));
    return false;
  }

  #spawnEnemyWave() {
    const world = this.world;
    const wave = ++world.wave;
    const count = Math.min(6, 2 + Math.floor(wave / 2));
    const campEdge = Math.random() < 0.5;
    for (let i = 0; i < count; i++) {
      let x = 0;
      let y = 0;
      for (let attempt = 0; attempt < 20; attempt++) {
        x = campEdge
          ? (Math.random() < 0.5 ? 920 + Math.random() * 760 : 75 + Math.random() * 680)
          : 75 + Math.random() * (MAP_WIDTH - 150);
        y = 75 + Math.random() * (MAP_HEIGHT - 150);
        if (!this.#isVisible(x, y)) break;
      }
      const enemy = this.#newUnit(
        world,
        'enemy',
        Math.max(70, Math.min(MAP_WIDTH - 70, x)),
        Math.max(70, Math.min(MAP_HEIGHT - 70, y))
      );
      enemy.maxHp = i === 0 ? 5 + wave : 3;
      enemy.hp = enemy.maxHp;
      enemy.intensity = i === 0 ? 2.2 : 1;
      world.enemies.push(enemy);
    }
    this.#setStatus(`Gelombang ${wave} muncul dari kabut. Knight, pancarkan sonar untuk menemukan mereka!`);
    sound.playPing();
  }

  #addFloat(x, y, text, color) {
    this.world.floatingText.push({ x, y, text, color, life: 1.1 });
  }

  #setStatus(text) {
    const status = this.modal?.querySelector('#rts-status');
    if (status) status.textContent = text;
  }

  #updateHud() {
    if (!this.modal) return;
    const world = this.world;
    const gold = Math.floor(world.gold);
    const wood = Math.floor(world.wood);
    const population = world.villagers.length + world.knights.length;
    const wave = world.wave;
    const knownEnemy = world.enemies.find((enemy) => enemy.id === world.knownEnemyId);
    const detectedCount = world.enemies.filter((enemy) =>
      enemy.revealedUntil > world.time || this.#isVisible(enemy.x, enemy.y)
    ).length;
    const hpPercent = knownEnemy ? Math.ceil((knownEnemy.hp / knownEnemy.maxHp) * 100) : 0;
    const set = (id, value) => {
      const el = this.modal.querySelector(`#${id}`);
      if (el) el.textContent = String(value);
    };
    set('rts-gold', gold);
    set('rts-gold-side', gold);
    set('rts-wood', wood);
    set('rts-wood-side', wood);
    set('rts-population', population);
    set('rts-knight-count', world.knights.length);
    set('rts-wave', wave || 'KABUT');
    set('rts-enemy-hp', detectedCount);
    set('rts-enemy-status', knownEnemy ? (knownEnemy.intensity > 1 ? 'Captain terdeteksi' : 'Musuh terdeteksi') : 'Musuh belum terdeteksi');
    set('rts-enemy-hint', world.knownEnemyId
      ? `${detectedCount} musuh terlihat · sonar Bat mengunci gema`
      : 'Musuh tersembunyi di balik kabut perang.');
    set('rts-known-target', world.knownEnemyId ? 'gema terdeteksi' : 'belum ada');
    const attacking = world.knights.some((knight) => knight.action === 'attack');
    set('rts-bat-phase', attacking ? 'Serbu · loudness turun' : 'Eksplorasi · loudness tinggi');
    set('rts-bat-formula', attacking
      ? 'A rendah · pulse cepat · radius sonar kecil'
      : 'A tinggi · pulse lambat · radius sonar besar');
    const health = this.modal.querySelector('#rts-enemy-health-bar');
    if (health) health.style.width = `${hpPercent}%`;
    this.modal.querySelectorAll('[data-rts-action="spawn-villager"], [data-rts-action="spawn-knight"]').forEach((button) => {
      const isVillager = button.dataset.rtsAction === 'spawn-villager';
      button.disabled = population >= 60 || (isVillager ? gold < 50 : gold < 100 || wood < 50);
    });
  }

  #drawWorld(timestamp) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const camera = this.world.camera;
    const zoom = camera.zoom;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -camera.x * dpr * zoom, -camera.y * dpr * zoom);
    this.#drawTerrain(ctx);
    this.#drawStructures(ctx);
    this.#drawResources(ctx);
    this.#drawUnits(ctx, timestamp);
    this.#drawFloatingText(ctx);
    this.#drawFog(ctx);
    this.#drawSonar(ctx);
  }

  #drawTerrain(ctx) {
    ctx.fillStyle = '#244f27';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    for (let y = 0; y < MAP_HEIGHT; y += 52) {
      for (let x = 0; x < MAP_WIDTH; x += 52) {
        const shade = ((x / 52 + y / 52) % 3);
        ctx.fillStyle = shade === 0 ? 'rgba(126, 158, 70, .12)' : 'rgba(8, 39, 20, .09)';
        ctx.fillRect(x, y, 52, 52);
        ctx.fillStyle = 'rgba(206, 210, 135, .12)';
        ctx.fillRect(x + 10 + shade * 5, y + 14, 3, 3);
      }
    }
    ctx.strokeStyle = 'rgba(226, 205, 143, .38)';
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.moveTo(0, 532);
    ctx.bezierCurveTo(470, 450, 1060, 600, MAP_WIDTH, 485);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(74, 54, 31, .75)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(239, 226, 172, .65)';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('PADANG RUMPUT KERAJAAN', 700, 80);
  }

  #drawStructures(ctx) {
    const town = this.world.townCenter;
    ctx.fillStyle = 'rgba(15, 22, 12, .38)';
    ctx.fillRect(town.x - 66, town.y - 40, 138, 108);
    ctx.fillStyle = '#72502b';
    ctx.fillRect(town.x - 70, town.y - 48, 132, 102);
    ctx.fillStyle = '#b28a48';
    ctx.fillRect(town.x - 62, town.y - 41, 116, 87);
    ctx.fillStyle = '#5b3b22';
    ctx.fillRect(town.x - 36, town.y - 15, 66, 60);
    ctx.fillStyle = '#281d15';
    ctx.fillRect(town.x - 12, town.y + 12, 24, 33);
    ctx.fillStyle = '#633d25';
    ctx.fillRect(town.x - 84, town.y - 65, 20, 42);
    ctx.fillRect(town.x + 49, town.y - 65, 20, 42);
    ctx.fillStyle = '#f2d371';
    ctx.fillRect(town.x - 82, town.y - 70, 16, 8);
    ctx.fillRect(town.x + 51, town.y - 70, 16, 8);
    this.#drawHealthBar(ctx, town.x - 50, town.y + 70, 100, town.hp / town.maxHp, '#84db67');
    this.#drawLabel(ctx, 'TOWN CENTER', town.x, town.y - 83, '#fff0bd');

  }

  #drawResources(ctx) {
    for (const node of this.world.nodes) {
      const intensity = node.amount / node.maxAmount;
      if (node.type === 'gold') {
        if (!node.amount) continue;
        const size = 21 + intensity * 12;
        ctx.fillStyle = `rgba(248, 191, 55, ${0.38 + intensity * 0.3})`;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI / 3 * i - Math.PI / 6;
          const x = node.x + Math.cos(angle) * size;
          const y = node.y + Math.sin(angle) * size;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f7cb4e';
        ctx.fill();
        ctx.strokeStyle = '#ffe99a';
        ctx.lineWidth = 3;
        ctx.stroke();
        this.#drawLabel(ctx, `GOLD · ${Math.ceil(node.amount)}`, node.x, node.y + size + 22, '#fff0aa');
      } else {
        const alpha = Math.max(0.22, intensity);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#563a22';
        ctx.fillRect(node.x - 5, node.y + 10, 10, 34);
        [[-22, 0, 23], [0, -13, 27], [24, 2, 20], [-1, 18, 19]].forEach(([dx, dy, radius]) => {
          ctx.fillStyle = '#2c692f';
          ctx.beginPath();
          ctx.arc(node.x + dx, node.y + dy, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#5a9a3e';
          ctx.beginPath();
          ctx.arc(node.x + dx - 5, node.y + dy - 7, radius * 0.55, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        if (node.amount > 0) this.#drawLabel(ctx, `WOOD · ${Math.ceil(node.amount)}`, node.x, node.y + 54, '#d7efbe');
      }
    }
  }

  #drawUnits(ctx, timestamp) {
    const { villagers, knights, enemies } = this.world;
    const time = timestamp * 0.003;
    for (const unit of villagers) {
      if (unit.hp <= 0) continue;
      if (unit.targetId) {
        const target = this.world.nodes.find((node) => node.id === unit.targetId);
        if (target) {
          ctx.strokeStyle = 'rgba(131, 224, 255, .18)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 8]);
          ctx.beginPath();
          ctx.moveTo(unit.x, unit.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      const bob = Math.sin(time + unit.id) * 2;
      ctx.fillStyle = 'rgba(4, 17, 26, .38)';
      ctx.beginPath();
      ctx.ellipse(unit.x, unit.y + 11, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#34a9ef';
      ctx.beginPath();
      ctx.arc(unit.x, unit.y + bob, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#bdeeff';
      ctx.lineWidth = 3;
      ctx.stroke();
      if (unit.cargo.gold + unit.cargo.wood > 0) {
        ctx.fillStyle = unit.cargo.gold ? '#ffda52' : '#83c85b';
        ctx.fillRect(unit.x + 9, unit.y - 14 + bob, 7, 7);
      }
    }

    for (const unit of knights) {
      if (unit.hp <= 0) continue;
      ctx.save();
      ctx.translate(unit.x, unit.y);
      ctx.rotate(Math.sin(time * 0.6 + unit.id) * 0.04);
      ctx.fillStyle = 'rgba(4, 17, 26, .38)';
      ctx.fillRect(-13, 4, 28, 22);
      ctx.fillStyle = '#c4d2d7';
      ctx.fillRect(-12, -12, 24, 24);
      ctx.fillStyle = '#7f9298';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.fillStyle = '#e6f0ed';
      ctx.fillRect(-9, -11, 7, 4);
      ctx.fillStyle = '#f5d274';
      ctx.fillRect(9, -16, 4, 21);
      ctx.restore();
      if (unit.hp < unit.maxHp) this.#drawHealthBar(ctx, unit.x - 13, unit.y + 19, 26, unit.hp / unit.maxHp, '#83d566');
    }

    for (const enemy of enemies) {
      if (enemy.revealedUntil <= this.world.time && !this.#isVisible(enemy.x, enemy.y)) continue;
      ctx.fillStyle = '#bd4439';
      ctx.fillRect(enemy.x - 11, enemy.y - 11, 22, 22);
      ctx.strokeStyle = '#ffb29c';
      ctx.lineWidth = 3;
      ctx.strokeRect(enemy.x - 11, enemy.y - 11, 22, 22);
      this.#drawHealthBar(ctx, enemy.x - 13, enemy.y + 15, 26, enemy.hp / enemy.maxHp, '#ed6856');
    }
  }

  #drawFloatingText(ctx) {
    for (const text of this.world.floatingText) {
      ctx.globalAlpha = Math.min(1, text.life * 1.5);
      ctx.fillStyle = text.color;
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#102014';
      ctx.shadowBlur = 4;
      ctx.fillText(text.text, text.x, text.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  #drawFog(ctx) {
    const world = this.world;
    const fog = this.fogContext;
    if (!fog) return;
    fog.save();
    fog.setTransform(1, 0, 0, 1, 0, 0);
    fog.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    fog.globalCompositeOperation = 'source-over';
    fog.fillStyle = 'rgba(0, 0, 0, 0.965)';
    fog.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    fog.globalCompositeOperation = 'destination-out';

    const reveal = (x, y, radius) => {
      const gradient = fog.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,0.96)');
      gradient.addColorStop(0.56, 'rgba(0,0,0,0.82)');
      gradient.addColorStop(0.84, 'rgba(0,0,0,0.42)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      fog.fillStyle = gradient;
      fog.beginPath();
      fog.arc(x, y, radius, 0, Math.PI * 2);
      fog.fill();
    };

    reveal(world.townCenter.x, world.townCenter.y, 265);
    for (const unit of [...world.villagers, ...world.knights]) {
      if (unit.hp <= 0) continue;
      reveal(unit.x, unit.y, unit.type === 'knight' ? 170 : 145);
    }
    for (const scan of world.sonarReveals) reveal(scan.x, scan.y, scan.radius);
    fog.restore();
    ctx.drawImage(this.fogCanvas, 0, 0);
  }

  #drawSonar(ctx) {
    ctx.save();
    for (const pulse of this.world.sonarPulses) {
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(235, 247, 255, ${Math.max(0.08, pulse.alpha)})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    for (const scan of this.world.sonarReveals) {
      const remaining = Math.max(0, (scan.expiresAt - this.world.time) / 5);
      ctx.beginPath();
      ctx.arc(scan.x, scan.y, scan.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(197, 235, 255, ${remaining * 0.38})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  #drawHealthBar(ctx, x, y, width, ratio, color) {
    ctx.fillStyle = 'rgba(10, 15, 10, .85)';
    ctx.fillRect(x, y, width, 7);
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, Math.max(0, (width - 2) * ratio), 5);
  }

  #drawLabel(ctx, text, x, y, color) {
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    const width = ctx.measureText(text).width + 16;
    ctx.fillStyle = 'rgba(15, 23, 16, .78)';
    ctx.fillRect(x - width / 2, y - 15, width, 21);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
}
