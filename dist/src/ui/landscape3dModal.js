/**
 * Landscape3DModal: ruang lentera Firefly dan gua kristal Bat dalam scene 3D interaktif.
 * Unit terbang dengan animasi cahaya dan sonar, sementara fitness dan konvergensi tetap dihitung oleh engine.
 */

import * as THREE from '../vendor/three.module.js';
import { landscapeById } from '../core/landscapes.js';
import { FAEngine } from '../algorithms/firefly.js';
import { BAEngine } from '../algorithms/bat.js';
import { sound } from '../core/sound.js';
import { renderConvergenceChart } from '../render/chart.js';

// ============================================================================
// 1. ILUSTRASI SVG ANIMAL AVATARS (PERSIS HERALDIC CRESTS SCREENSHOT 3)
// ============================================================================
const SVG_FIREFLY = `
<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="30" fill="url(#fa-crest-bg)"/>
  <circle cx="32" cy="42" r="14" fill="#facc15" opacity="0.35"/>
  <ellipse cx="23" cy="24" rx="8" ry="14" transform="rotate(-30 23 24)" fill="#e0f2fe" opacity="0.75" stroke="#38bdf8" stroke-width="1.2"/>
  <ellipse cx="41" cy="24" rx="8" ry="14" transform="rotate(30 41 24)" fill="#e0f2fe" opacity="0.75" stroke="#38bdf8" stroke-width="1.2"/>
  <circle cx="32" cy="18" r="4.5" fill="#1e1b18"/>
  <path d="M30 15 Q26 8 22 10 M34 15 Q38 8 42 10" stroke="#facc15" stroke-width="1.4" stroke-linecap="round"/>
  <ellipse cx="32" cy="26" rx="6" ry="5" fill="#78350f"/>
  <ellipse cx="32" cy="38" rx="7" ry="9" fill="#facc15"/>
  <ellipse cx="32" cy="39" rx="4.5" ry="6" fill="#fef08a"/>
  <defs>
    <radialGradient id="fa-crest-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0e7490"/>
      <stop offset="100%" stop-color="#082f49"/>
    </radialGradient>
  </defs>
</svg>`;

const SVG_BAT = `
<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="30" fill="url(#ba-crest-bg)"/>
  <circle cx="32" cy="20" r="8" stroke="#c084fc" stroke-width="1.2" opacity="0.6"/>
  <circle cx="32" cy="20" r="14" stroke="#c084fc" stroke-width="1" opacity="0.35"/>
  <path d="M32 28 C26 18 10 16 4 22 C6 32 14 36 18 34 C22 38 26 36 30 32 Z" fill="#4c1d95"/>
  <path d="M32 28 C38 18 54 16 60 22 C58 32 50 36 46 34 C42 38 38 36 34 32 Z" fill="#4c1d95"/>
  <path d="M32 28 Q18 20 6 22 M32 28 Q46 20 58 22" stroke="#a855f7" stroke-width="1.2"/>
  <ellipse cx="32" cy="32" rx="4.5" ry="8" fill="#1e1b4b"/>
  <circle cx="32" cy="22" r="4.5" fill="#312e81"/>
  <polygon points="28,21 27,12 31,19" fill="#c084fc"/>
  <polygon points="36,21 37,12 33,19" fill="#c084fc"/>
  <defs>
    <radialGradient id="ba-crest-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#4c1d95"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </radialGradient>
  </defs>
</svg>`;

// ============================================================================
// 2. KELAS UTAMA LANDSCAPE 3D MODAL
// ============================================================================
export class Landscape3DModal {
  constructor() {
    this.modal = null;
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.animId = null;

    // State Simulasi
    this.currentObjId = 'rastrigin';
    this.viewMode = 'both'; // 'both', 'fa', 'ba'
    this.povMode = 'iso'; // 'iso', 'bird'
    this.lang = 'ID'; // 'ID', 'EN'
    this.wireframe = false;
    this.isPlaying = false;
    this.speed = 1.0;
    this.faPopulationSize = 20;
    this.baPopulationSize = 20;
    this.baFmax = 2;
    this.autoRotate = false;
    this.iteration = 0;
    this.maxIterations = 60;
    this.stepPhase = 3; // 1: Ukur, 2: Tentukan, 3: Gerak
    this.faEngine = null;
    this.baEngine = null;

    // Objek 3D
    this.faChunkGroup = null;
    this.baChunkGroup = null;
    this.cloudGroup = null;
    this.clouds = [];
    this.faCreatures = [];
    this.baCreatures = [];
    this.selectedAgent = null;
    this.isMovingAgent = false;
    this.agentDragDirty = false;
    this.raycaster = new THREE.Raycaster();
    this.pointerNdc = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.faBestMarker = null;
    this.baBestMarker = null;
    this.sonarRings = [];
    this.sparkTrails = [];

    // Kamera Orbit & Preset Angles
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.cameraAngle = { theta: Math.PI * 0.25, phi: Math.PI * 0.34, radius: 290 };
    this.targetAngle = { ...this.cameraAngle };
    this.cameraTarget = new THREE.Vector3(0, 8, 0);

    // Riwayat Konvergensi
    this.historyFA = [];
    this.historyBA = [];
  }

  mount(root) {
    if (this.modal) return;
    const el = document.createElement('div');
    el.id = 'aoe-3d-landscape-modal';
    el.className = 'aoe-modal-backdrop hidden';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Visualisasi Medan 3D Three.js');
    root.appendChild(el);
    this.modal = el;

    this.#renderDOM();
    this.#initThree();
    this.#bindEvents();
  }

  open(objectiveId = 'rastrigin') {
    if (!this.modal) return;
    this.currentObjId = objectiveId;
    this.modal.classList.remove('hidden');
    sound.playHorn();

    // Sesuaikan tombol objektif aktif
    this.modal.querySelectorAll('#sky-landscape-picker button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.obj === objectiveId);
    });

    this.#onResize();
    this.#resetSimulation();
    this.#startLoop();
    this.#updateUI();
  }

  close() {
    if (!this.modal) return;
    this.#stopLoop();
    this.isPlaying = false;
    this.modal.classList.add('hidden');
    sound.playClick();
  }

  toggle(objectiveId = 'rastrigin') {
    if (this.modal?.classList.contains('hidden')) this.open(objectiveId);
    else this.close();
  }

  // ==========================================================================
  // 3. STRUKTUR DOM LENGKAP
  // ==========================================================================
  #renderDOM() {
    this.modal.innerHTML = `
      <div class="sky-3d-window">
        <!-- HEADER KONTROL ATAS -->
        <header class="sky-header">
          <div class="sky-title-group">
            <h2 class="sky-main-title" id="sky-title-text">Firefly &amp; Bat 3D</h2>
            <small class="sky-sub-title" id="sky-sub-text">Kunang-kunang mengejar lentera · Kelelawar memburu kristal putih di dalam gua</small>
          </div>

          <div class="sky-nav-controls">
            <!-- Pilihan Sudut Pandang RTS (Isometrik vs Bird's Eye) -->
            <div class="sky-seg-group" id="sky-pov-picker">
              <button type="button" class="sky-seg-btn active" data-pov="iso" title="Sudut Pandang Isometrik RTS (AoE)">📐 Isometrik</button>
              <button type="button" class="sky-seg-btn" data-pov="bird" title="Sudut Pandang Atas Peta Taktis (Bird's Eye)">👁️ Bird's Eye</button>
            </div>

            <!-- Pilihan Lanskap Objektif -->
            <div class="sky-seg-group" id="sky-landscape-picker">
              <button type="button" class="sky-seg-btn active" data-obj="rastrigin">Rastrigin</button>
              <button type="button" class="sky-seg-btn" data-obj="ackley">Ackley</button>
              <button type="button" class="sky-seg-btn" data-obj="sphere">Sphere</button>
            </div>

            <!-- Filter Pasukan -->
            <div class="sky-seg-group" id="sky-faction-picker">
              <button type="button" class="sky-seg-btn active" data-view="both">⚔️ Keduanya</button>
              <button type="button" class="sky-seg-btn" data-view="fa">✨ Kunang-Kunang</button>
              <button type="button" class="sky-seg-btn" data-view="ba">🦇 Kelelawar</button>
            </div>

            <!-- Bahasa Toggle -->
            <div class="sky-seg-group" id="sky-lang-picker">
              <button type="button" class="sky-seg-btn active" data-lang="ID">ID</button>
              <button type="button" class="sky-seg-btn" data-lang="EN">EN</button>
            </div>

            <!-- Kamera Orbit & Tutup -->
            <button type="button" id="sky-btn-portal" class="sky-icon-btn" title="Pilih Visualisasi 3D Lain (Firefly / Bat)">🌐 Portal 3D</button>
            <button type="button" id="sky-toggle-rotate" class="sky-icon-btn" title="Putar Kamera Otomatis">🎥 Orbit</button>
            <button type="button" id="sky-btn-close" class="sky-icon-btn close-btn" title="Tutup Tampilan 3D">&times;</button>
          </div>
        </header>

        <!-- AREA KANVAS 3D THREE.JS -->
        <div class="sky-canvas-container" id="sky-canvas-wrap">
          <canvas id="sky-webgl-canvas"></canvas>
          <div class="sky-agent-tools" id="sky-agent-tools">
            <span id="sky-agent-hint">Pilih unit, lalu seret untuk memindahkannya</span>
            <button type="button" id="sky-agent-delete" hidden>🪓 Hancurkan unit</button>
          </div>

          <!-- KARTU STATUS MENGAMBANG DENGAN AVATAR HEWAN ASLI -->
          <div class="sky-floating-badge badge-left" id="badge-fa">
            <div class="badge-avatar">${SVG_FIREFLY}</div>
            <div class="badge-info">
              <div class="badge-title-row">
                <b id="badge-fa-title">Ordo Kunang-Kunang</b>
                <span class="badge-tag fa-tag">FA</span>
              </div>
              <small class="bio-scene-label" id="scene-fa-label">RUANG LENTERA</small>
              <div class="badge-metrics">
                <div><small id="lbl-fa-best">Terbaik:</small> <b id="fa-val-best">0.000</b></div>
                <div><small id="lbl-fa-iter">Iterasi:</small> <b id="fa-val-iter">0 / 60</b></div>
                <div><small id="lbl-fa-beta">Daya Tarik β:</small> <b id="fa-val-beta">1.00</b></div>
                <div><small id="lbl-fa-count">Pasukan:</small> <b id="fa-val-count">${this.faPopulationSize}</b></div>
              </div>
            </div>
          </div>

          <div class="sky-floating-badge badge-right" id="badge-ba">
            <div class="badge-avatar">${SVG_BAT}</div>
            <div class="badge-info">
              <div class="badge-title-row">
                <b id="badge-ba-title">Legiun Kelelawar</b>
                <span class="badge-tag ba-tag">BA</span>
              </div>
              <small class="bio-scene-label" id="scene-ba-label">GUA KRISTAL PUTIH</small>
              <div class="badge-metrics">
                <div><small id="lbl-ba-best">Terbaik:</small> <b id="ba-val-best">0.000</b></div>
                <div><small id="lbl-ba-iter">Iterasi:</small> <b id="ba-val-iter">0 / 60</b></div>
                <div><small id="lbl-ba-loud">Kelantangan A:</small> <b id="ba-val-loud">0.50</b></div>
                <div><small id="lbl-ba-count">Pasukan:</small> <b id="ba-val-count">${this.baPopulationSize}</b></div>
                <div><small id="lbl-ba-fmax">Frekuensi maks.:</small> <b id="ba-val-fmax">${this.baFmax.toFixed(1)}</b></div>
              </div>
            </div>
          </div>
        </div>

        <!-- PANEL KONTROL WIZARD TIMELINE BAWAH -->
        <footer class="sky-bottom-card">
          <div class="sky-timeline-header">
            <div class="sky-step-chips">
              <span class="step-chip" id="chip-step-1">① Ukur (Measure)</span>
              <span class="step-chip" id="chip-step-2">② Tentukan (Decide)</span>
              <span class="step-chip active" id="chip-step-3">③ Gerak (Move)</span>
            </div>
            <span class="sky-round-label" id="sky-round-text">Iterasi 0 dari 60</span>
          </div>

          <details class="sky-convergence-panel" id="sky-convergence-panel">
            <summary class="sky-convergence-heading">
              <div>
                <h3 id="sky-convergence-title">Grafik konvergensi</h3>
                <small id="sky-convergence-subtitle">Nilai fitness terbaik per iterasi · semakin rendah semakin baik</small>
              </div>
              <span class="sky-convergence-objective" id="sky-convergence-objective">Objektif: Rastrigin</span>
            </summary>
            <div class="sky-convergence-content">
              <canvas id="sky-convergence-cv" aria-label="Grafik perbandingan konvergensi Firefly dan Bat"></canvas>
              <div class="sky-convergence-stats">
                <div class="sky-convergence-stat fa-stat">
                  <b>✨ Firefly</b>
                  <span><small id="lbl-fa-improvement">Perbaikan</small><strong id="fa-val-improvement">0.0000</strong></span>
                  <span><small id="lbl-fa-position">Koordinat terbaik</small><strong id="fa-val-position">—</strong></span>
                  <span><small id="lbl-fa-evaluations">Evaluasi</small><strong id="fa-val-evaluations">0</strong></span>
                </div>
                <div class="sky-convergence-stat ba-stat">
                  <b>🦇 Bat</b>
                  <span><small id="lbl-ba-improvement">Perbaikan</small><strong id="ba-val-improvement">0.0000</strong></span>
                  <span><small id="lbl-ba-position">Koordinat terbaik</small><strong id="ba-val-position">—</strong></span>
                  <span><small id="lbl-ba-evaluations">Evaluasi</small><strong id="ba-val-evaluations">0</strong></span>
                </div>
              </div>
            </div>
          </details>

          <div class="sky-narrative-columns">
            <div class="narrative-col fa-col">
              <span class="faction-bullet fa-bullet">●</span>
              <p id="narrative-fa-text"><b>Kunang-Kunang:</b> Menyalakan bioluminesensi lantern. Individu redup terbang mendekati individu yang lebih terang berdasarkan daya tarik β(r) = β₀ e^(-γ r²).</p>
            </div>
            <div class="narrative-col ba-col">
              <span class="faction-bullet ba-bullet">●</span>
              <p id="narrative-ba-text"><b>Kelelawar:</b> Memancarkan pulsa sonar ultrasonik f. Kecepatan disesuaikan menuju pemimpin x*. Jika rand > r, dilakukan penelusuran lokal eksploitasi.</p>
            </div>
          </div>

          <div class="sky-action-bar">
            <div class="sky-playback-btns">
              <button type="button" id="sky-act-reset" class="sky-ctl-btn" title="Reset Simulasi (R)">🔄</button>
              <button type="button" id="sky-act-play" class="sky-ctl-btn play-btn" title="Mulai / Jeda (P)">▶️</button>
              <button type="button" id="sky-act-step" class="sky-ctl-btn" title="Maju Satu Langkah (S)">⏭️</button>
            </div>

            <div class="sky-tuning-controls">
              <label class="sky-range-control">
                <span id="sky-speed-txt">Kecepatan</span>
                <input type="range" id="sky-speed-input" min="0.5" max="3" step="0.5" value="1" />
                <b id="sky-speed-label">1.0x</b>
              </label>
              <label class="sky-range-control">
                <span id="sky-fa-population-txt">Kunang-kunang</span>
                <input type="range" id="sky-fa-population-input" min="5" max="40" step="1" value="${this.faPopulationSize}" />
                <b id="sky-fa-population-label">${this.faPopulationSize}</b>
              </label>
              <label class="sky-range-control">
                <span id="sky-ba-population-txt">Kelelawar</span>
                <input type="range" id="sky-ba-population-input" min="5" max="40" step="1" value="${this.baPopulationSize}" />
                <b id="sky-ba-population-label">${this.baPopulationSize}</b>
              </label>
              <label class="sky-range-control">
                <span id="sky-fmax-txt">Frekuensi maksimum fₘₐₓ</span>
                <input type="range" id="sky-fmax-input" min="0.5" max="5" step="0.1" value="${this.baFmax}" />
                <b id="sky-fmax-label">${this.baFmax.toFixed(1)}</b>
              </label>
            </div>
          </div>
        </footer>
      </div>
    `;

    this.canvas = this.modal.querySelector('#sky-webgl-canvas');
  }

  // ==========================================================================
  // 4. THREE.JS INITIALIZATION & SCENE SETUP
  // ==========================================================================
  #initThree() {
    if (!this.canvas) return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101923);

    // Kamera Low-FOV untuk perspektif isometrik RTS tanpa distorsi
    const aspect = 1780 / 620;
    this.camera = new THREE.PerspectiveCamera(30, aspect, 1, 1500);
    this.#updateCameraPosition();

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // Pencahayaan
    const ambientLight = new THREE.AmbientLight(0xb9c4d2, 0.62);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffe6b1, 0.82);
    sunLight.position.set(140, 240, 160);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 650;
    sunLight.shadow.camera.left = -200;
    sunLight.shadow.camera.right = 200;
    sunLight.shadow.camera.top = 200;
    sunLight.shadow.camera.bottom = -200;
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x9ab8e8, 0.24);
    fillLight.position.set(-160, 120, -120);
    this.scene.add(fillLight);

  }

  #createClouds() {
    if (this.cloudGroup) this.scene.remove(this.cloudGroup);
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.94,
      flatShading: true
    });

    const makeCloud = (cx, cy, cz, scale) => {
      const g = new THREE.Group();
      const parts = [
        { x: 0, y: 0, z: 0, r: 8.5 },
        { x: 6.5, y: -1, z: 2, r: 6.5 },
        { x: -6.5, y: -1, z: -1, r: 6.5 },
        { x: 2, y: 4.5, z: 0, r: 6 }
      ];
      parts.forEach((p) => {
        const geom = new THREE.DodecahedronGeometry(p.r, 1);
        const m = new THREE.Mesh(geom, cloudMat);
        m.position.set(p.x, p.y, p.z);
        g.add(m);
      });
      g.position.set(cx, cy, cz);
      g.scale.setScalar(scale);
      return g;
    };

    this.clouds = [
      makeCloud(-160, 28, -90, 1.4),
      makeCloud(0, 44, -140, 1.9),
      makeCloud(160, 20, -80, 1.3),
      makeCloud(-100, -10, 90, 1.1),
      makeCloud(130, -15, 100, 1.25)
    ];
    this.clouds.forEach((c) => cloudGroup.add(c));
    this.scene.add(cloudGroup);
    this.cloudGroup = cloudGroup;
  }

  // ==========================================================================
  // 5. RUANG LENTERA FIREFLY DAN GUA KRISTAL BAT
  // ==========================================================================
  #buildTerrainChunks() {
    if (this.faChunkGroup) this.scene.remove(this.faChunkGroup);
    if (this.baChunkGroup) this.scene.remove(this.baChunkGroup);
    this.cameraOccluders = [];

    this.faChunkGroup = this.#createFireflyRoom();
    this.faChunkGroup.position.set(-68, 0, 0);
    this.scene.add(this.faChunkGroup);

    this.baChunkGroup = this.#createBatCave();
    this.baChunkGroup.position.set(68, 0, 0);
    this.scene.add(this.baChunkGroup);

    // Penanda solusi terbaik bergerak di lantai menuju lentera atau kristal.
    this.faBestMarker = this.#createLeaderBeacon(0x06b6d4);
    this.faChunkGroup.add(this.faBestMarker);

    this.baBestMarker = this.#createLeaderBeacon(0xa855f7);
    this.baChunkGroup.add(this.baBestMarker);

    // 4. Bangun Hewan 3D Asli & Sistem FX
    this.#initCreatureMeshes();
    this.#initFXSystems();
  }

  #createFireflyRoom() {
    const room = new THREE.Group();
    const makeMaterial = (color, roughness = 0.85, metalness = 0) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const addBox = (width, height, depth, material, x, y, z) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      room.add(mesh);
      return mesh;
    };

    const stone = makeMaterial(0x9b8060);
    const darkStone = makeMaterial(0x584534);
    const wood = makeMaterial(0x392817);
    const gold = makeMaterial(0xd19b39, 0.34, 0.55);
    const floor = makeMaterial(0x8c704a);
    addBox(92, 2, 92, floor, 0, -1, 0);

    const wallHeight = 28;
    this.#markCameraOccluder(addBox(92, wallHeight, 5, stone, 0, wallHeight / 2, -44));
    this.#markCameraOccluder(addBox(5, wallHeight, 92, stone, -44, wallHeight / 2, 0));
    this.#markCameraOccluder(addBox(5, wallHeight, 92, stone, 44, wallHeight / 2, 0));

    for (let x = -36; x <= 36; x += 12) {
      addBox(0.35, 0.16, 86, darkStone, x, 0.08, 0);
    }
    for (let z = -36; z <= 36; z += 12) {
      addBox(86, 0.16, 0.35, darkStone, 0, 0.08, z);
    }
    [-39, 39].forEach((x) => {
      [-39, -15, 15, 39].forEach((z) => {
        this.#markCameraOccluder(addBox(5, 30, 5, darkStone, x, 14, z));
        addBox(7, 2, 7, gold, x, 29, z);
      });
    });

    // Open ceiling keeps the room readable from the isometric camera.
    [-32, 0, 32].forEach((z) => addBox(88, 1.5, 3, wood, 0, 28, z));
    addBox(27, 0.45, 31, makeMaterial(0x6d4325), 0, 0.2, 8);

    // A suspended brass lantern provides the Firefly's prominent light source.
    const lantern = new THREE.Group();
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7, 8), wood);
    chain.position.y = 3.5;
    lantern.add(chain);
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe59a,
      emissive: 0xffb52e,
      emissiveIntensity: 2.2,
      roughness: 0.18
    });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(3.1, 16, 12), glowMaterial);
    glow.position.y = -1.5;
    lantern.add(glow);
    const cage = new THREE.Mesh(new THREE.OctahedronGeometry(4.5, 0), gold);
    cage.position.y = -1.5;
    cage.scale.y = 1.35;
    lantern.add(cage);
    const top = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.2, 8), gold);
    top.position.y = 2;
    lantern.add(top);
    const bottom = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.2, 8), gold);
    bottom.rotation.z = Math.PI;
    bottom.position.y = -5;
    lantern.add(bottom);
    const lanternLight = new THREE.PointLight(0xffbd46, 18, 110, 1.5);
    lanternLight.position.y = -1.5;
    lantern.add(lanternLight);
    lantern.position.set(0, 24, 0);
    room.add(lantern);
    room.userData.lanternLight = lanternLight;

    return room;
  }

  #createBatCave() {
    const cave = new THREE.Group();
    const stoneMaterials = [0x475262, 0x56606e, 0x67636a, 0x394351].map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.96 })
    );
    const addRock = (x, y, z, scale, materialIndex = 0) => {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), stoneMaterials[materialIndex]);
      rock.position.set(x, y, z);
      rock.scale.set(scale[0], scale[1], scale[2]);
      rock.rotation.set(x * 0.03, y * 0.07, z * 0.025);
      rock.castShadow = true;
      rock.receiveShadow = true;
      cave.add(rock);
      this.#markCameraOccluder(rock);
    };

    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x464751, roughness: 0.94 });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(96, 3, 92), floorMaterial);
    floor.position.y = -1.5;
    floor.receiveShadow = true;
    cave.add(floor);

    for (let x = -42; x <= 42; x += 12) {
      addRock(x, 12 + ((x + 42) % 3) * 2, -43, [9, 17, 8], Math.abs(x) % 4);
      addRock(x + 4, 27, -29, [10, 8, 13], (Math.abs(x) + 1) % 4);
    }
    for (let z = -32; z <= 36; z += 14) {
      addRock(-45, 13, z, [9, 17, 11], Math.abs(z) % 4);
      addRock(45, 13, z, [9, 17, 11], (Math.abs(z) + 2) % 4);
    }

    const stalactiteMaterial = stoneMaterials[2];
    [-34, -20, 20, 34].forEach((x) => {
      [-28, -5, 19].forEach((z) => {
        const height = 8 + ((x + z + 100) % 4) * 2;
        const stalactite = new THREE.Mesh(new THREE.ConeGeometry(3.2, height, 6), stalactiteMaterial);
        stalactite.rotation.z = Math.PI;
        stalactite.position.set(x, 31 - height / 2, z);
        stalactite.castShadow = true;
        cave.add(stalactite);
        this.#markCameraOccluder(stalactite);
      });
    });

    // White quartz is the shared target the bats home in on.
    const crystalBase = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 9, 2, 7),
      new THREE.MeshStandardMaterial({ color: 0x343b47, roughness: 0.72 })
    );
    crystalBase.position.set(0, 0.5, -8);
    cave.add(crystalBase);
    const crystalMaterial = new THREE.MeshStandardMaterial({
      color: 0xf6ffff,
      emissive: 0xd8f7ff,
      emissiveIntensity: 3.4,
      roughness: 0.16,
      metalness: 0.18
    });
    [
      { x: 0, y: 8, z: -8, sx: 1.8, sy: 3.4, sz: 1.6 },
      { x: -4.8, y: 5, z: -6.5, sx: 1, sy: 2.5, sz: 1 },
      { x: 4.5, y: 5.5, z: -9.5, sx: 0.95, sy: 2.8, sz: 1 }
    ].forEach((part) => {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(2.4, 0), crystalMaterial);
      crystal.position.set(part.x, part.y, part.z);
      crystal.scale.set(part.sx, part.sy, part.sz);
      crystal.rotation.z = part.x * 0.09;
      cave.add(crystal);
    });
    const crystalLight = new THREE.PointLight(0xd9f7ff, 52, 140, 1.7);
    crystalLight.position.set(0, 8, -8);
    cave.add(crystalLight);
    cave.userData.crystalLight = crystalLight;
    return cave;
  }

  #markCameraOccluder(mesh) {
    mesh.material = mesh.material.clone();
    this.cameraOccluders.push({
      material: mesh.material,
      opacity: mesh.material.opacity,
      transparent: mesh.material.transparent,
      depthWrite: mesh.material.depthWrite
    });
  }

  #updateCameraOcclusion() {
    const fade = THREE.MathUtils.clamp((240 - this.cameraAngle.radius) / 150, 0, 0.84);
    this.cameraOccluders?.forEach((item) => {
      const opacity = item.opacity * (1 - fade);
      item.material.opacity = opacity;
      item.material.transparent = fade > 0;
      item.material.depthWrite = fade === 0 ? item.depthWrite : false;
    });
  }

  #createRefinedChunkMesh(obj, size, segments, baseDepth, biome = 'grass') {
    const group = new THREE.Group();
    const half = size / 2;
    const zScale = 22;
    const maxV = obj.maxVisualValue || 50;

    // Hitung ketinggian kisi z(x, y)
    const gridZ = [];
    let minH = Infinity;
    for (let j = 0; j <= segments; j++) {
      gridZ[j] = [];
      const v = j / segments;
      const yNorm = obj.min + v * (obj.max - obj.min);
      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const xNorm = obj.min + u * (obj.max - obj.min);
        const zVal = obj.evaluate(xNorm, yNorm);
        const zNorm = Math.min(1.2, Math.max(0, zVal / maxV));
        const h = zNorm * zScale;
        gridZ[j][i] = h;
        if (h < minH) minH = h;
      }
    }

    const geom = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const indices = [];

    // Helper pewarnaan sedimen berlapis
    const getSideColor = (y, isGrass) => {
      const c = new THREE.Color();
      if (isGrass) {
        if (y > 2) c.setHex(0x5a3d28); // Tanah humus cokelat
        else if (y > -5) c.setHex(0x8a6341); // Sedimen cokelat muda
        else if (y > -13) c.setHex(0xbda07d); // Lapisan lempung/pasir terang
        else if (y > -20) c.setHex(0x714c30); // Batuan terakota
        else c.setHex(0x382415); // Batuan dasar gelap
      } else {
        if (y > 2) c.setHex(0x7c341b); // Ngarai merah
        else if (y > -5) c.setHex(0xa64b28); // Batuan pasir oranye
        else if (y > -13) c.setHex(0xd47f57); // Lapisan pasir merah muda
        else if (y > -20) c.setHex(0x8c3b1e); // Batu terakota gelap
        else c.setHex(0x4a1b0c); // Batuan basal dasar
      }
      return c;
    };

    // 1. Permukaan Atas Bergradasi Lembut
    const rowVerts = segments + 1;
    for (let j = 0; j <= segments; j++) {
      for (let i = 0; i <= segments; i++) {
        const x = -half + (i / segments) * size;
        const y = gridZ[j][i];
        const z = -half + (j / segments) * size;
        positions.push(x, y, z);

        const hNorm = gridZ[j][i] / zScale;
        const c = new THREE.Color();
        if (biome === 'grass') {
          if (hNorm < 0.12) c.setHSL(0.5, 0.8, 0.55); // Lembah toska
          else if (hNorm < 0.55) c.setHSL(0.3, 0.65, 0.36 + hNorm * 0.2); // Padang rumput hijau subur
          else c.setHSL(0.12, 0.25, 0.5 + hNorm * 0.18); // Bebatuan puncak
        } else {
          if (hNorm < 0.12) c.setHSL(0.11, 0.75, 0.65); // Pasir lembah
          else if (hNorm < 0.55) c.setHSL(0.06, 0.72, 0.48); // Ngarai oranye terakota
          else c.setHSL(0.02, 0.6, 0.38); // Batu merah tua
        }
        colors.push(c.r, c.g, c.b);
      }
    }

    for (let j = 0; j < segments; j++) {
      for (let i = 0; i < segments; i++) {
        const a = j * rowVerts + i;
        const b = a + 1;
        const c = (j + 1) * rowVerts + i;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    // 2. Dinding Samping Skirt Menyatu (Seamless Cake Slices)
    const addSkirt = (getTopCoords, count) => {
      const startIdx = positions.length / 3;
      for (let k = 0; k <= count; k++) {
        const top = getTopCoords(k);
        positions.push(top.x, top.y, top.z);
        const ct = getSideColor(top.y, biome === 'grass');
        colors.push(ct.r, ct.g, ct.b);

        positions.push(top.x, -baseDepth, top.z);
        const cb = getSideColor(-baseDepth, biome === 'grass');
        colors.push(cb.r, cb.g, cb.b);
      }

      for (let k = 0; k < count; k++) {
        const i0 = startIdx + k * 2;
        const i1 = i0 + 1;
        const i2 = i0 + 2;
        const i3 = i0 + 3;
        indices.push(i0, i1, i2);
        indices.push(i2, i1, i3);
      }
    };

    addSkirt((k) => ({ x: -half + (k / segments) * size, y: gridZ[0][k], z: -half }), segments);
    addSkirt((k) => ({ x: half - (k / segments) * size, y: gridZ[segments][segments - k], z: half }), segments);
    addSkirt((k) => ({ x: -half, y: gridZ[segments - k][0], z: half - (k / segments) * size }), segments);
    addSkirt((k) => ({ x: half, y: gridZ[k][segments], z: -half + (k / segments) * size }), segments);

    // 3. Pelat Dasar Bawah
    const botStart = positions.length / 3;
    positions.push(-half, -baseDepth, -half);
    positions.push(half, -baseDepth, -half);
    positions.push(half, -baseDepth, half);
    positions.push(-half, -baseDepth, half);
    const cBot = getSideColor(-baseDepth, biome === 'grass');
    for (let k = 0; k < 4; k++) colors.push(cBot.r, cBot.g, cBot.b);
    indices.push(botStart, botStart + 2, botStart + 1);
    indices.push(botStart, botStart + 3, botStart + 2);

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    // Material halus (flatShading: false agar tidak bergerigi/low-poly)
    const topMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.65,
      metalness: 0.1,
      flatShading: false,
      wireframe: this.wireframe
    });
    const chunkMesh = new THREE.Mesh(geom, topMat);
    chunkMesh.receiveShadow = true;
    chunkMesh.castShadow = true;
    group.add(chunkMesh);

    // Kolam Air Toska Transparan di Lembah (Screenshot 3)
    if (biome === 'grass') {
      const waterGeom = new THREE.PlaneGeometry(size * 0.44, size * 0.44);
      waterGeom.rotateX(-Math.PI / 2);
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.68,
        roughness: 0.08,
        metalness: 0.5
      });
      const water = new THREE.Mesh(waterGeom, waterMat);
      water.position.set(0, minH + 1.2, 0);
      group.add(water);
    }

    return group;
  }

  #createLeaderBeacon(colorHex) {
    const group = new THREE.Group();

    // Permata melayang
    const geom = new THREE.OctahedronGeometry(2.5, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.9,
      roughness: 0.1
    });
    const gem = new THREE.Mesh(geom, mat);
    gem.position.y = 5.2;
    group.add(gem);
    group.userData.gem = gem;

    // Pilar Berkas Cahaya Vertikal
    const beamGeom = new THREE.CylinderGeometry(0.28, 0.28, 16, 8);
    const beamMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.4 });
    const beam = new THREE.Mesh(beamGeom, beamMat);
    beam.position.y = 8;
    group.add(beam);

    return group;
  }

  // ==========================================================================
  // 6. MODEL 3D HEWAN (FIREFLY & BAT MENYERUPAI BINATANG ASLI)
  // ==========================================================================
  #initCreatureMeshes() {
    this.faCreatures = [];
    this.baCreatures = [];
    this.selectedAgent = null;

    // A. 20 Kunang-Kunang Berbentuk Serangga Beetle dengan Lantern Bercahaya
    for (let i = 0; i < this.faPopulationSize; i++) {
      const m = this.#buildFireflyCreature(i);
      m.userData.agentType = 'fa';
      m.userData.agentIndex = i;
      this.#addSelectionRing(m, 0x06b6d4);
      this.faChunkGroup.add(m);
      this.faCreatures.push(m);
    }

    // B. 20 Kelelawar dengan Sayap Mengepak & Telinga Radar Echolocation
    for (let i = 0; i < this.baPopulationSize; i++) {
      const m = this.#buildBatCreature(i);
      m.userData.agentType = 'ba';
      m.userData.agentIndex = i;
      this.#addSelectionRing(m, 0xa855f7);
      this.baChunkGroup.add(m);
      this.baCreatures.push(m);
    }
    this.#selectAgent(null);
  }

  #addSelectionRing(creature, color) {
    const geometry = new THREE.RingGeometry(1.7, 2.3, 24);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.y = -1.7;
    ring.visible = false;
    creature.add(ring);
    creature.userData.selectionRing = ring;

    const hitbox = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 8, 6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hitbox.position.y = -0.5;
    creature.add(hitbox);
  }

  #buildFireflyCreature(index) {
    const group = new THREE.Group();
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0x604126,
      roughness: 0.8,
      flatShading: true
    });
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x32251e,
      roughness: 0.8,
      flatShading: true
    });
    const thorax = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 0), shellMat);
    thorax.scale.set(0.8, 0.72, 1.25);
    thorax.position.set(0, 0, 0.15);
    group.add(thorax);

    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), headMat);
    head.position.set(0, 0.05, 1.05);
    group.add(head);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0b0908 });
    [-0.28, 0.28].forEach((x) => {
      const eye = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), eyeMat);
      eye.position.set(x, 0.12, 1.43);
      group.add(eye);
    });

    const antennaMat = new THREE.MeshStandardMaterial({ color: 0x34251a, flatShading: true });
    [-0.2, 0.2].forEach((x, i) => {
      const antenna = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.74, 4), antennaMat);
      antenna.position.set(x, 0.58, 1.22);
      antenna.rotation.z = i === 0 ? 0.28 : -0.28;
      antenna.rotation.x = Math.PI / 7;
      group.add(antenna);
    });

    const bulbGeom = new THREE.IcosahedronGeometry(0.9, 1);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xffe45a,
      emissive: 0xffd600,
      emissiveIntensity: 1.5,
      roughness: 0.35,
      flatShading: true
    });
    const bulb = new THREE.Mesh(bulbGeom, bulbMat);
    bulb.scale.set(0.88, 0.82, 1.1);
    bulb.position.set(0, -0.18, -1.05);
    group.add(bulb);
    group.userData.bulb = bulb;

    const light = new THREE.PointLight(0xffd83d, 1.05, 18);
    light.position.set(0, -0.2, -1.05);
    group.add(light);
    group.userData.light = light;

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xb69b69,
      transparent: true,
      opacity: 0.76,
      side: THREE.DoubleSide,
      roughness: 0.9,
      flatShading: true
    });
    const makeWing = (side) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([
          0, 0, 0,
          side * 1.25, 0.98, 0,
          side * 2.25, 0.38, 0,
          0, 0, 0,
          side * 2.25, 0.38, 0,
          side * 1.7, -0.62, 0
        ], 3)
      );
      geometry.computeVertexNormals();
      return new THREE.Mesh(geometry, wingMat);
    };
    const wingL = makeWing(-1);
    wingL.position.set(-0.28, 0.25, 0.18);
    group.add(wingL);
    const wingR = makeWing(1);
    wingR.position.set(0.28, 0.25, 0.18);
    group.add(wingR);

    group.userData.wingLeft = wingL;
    group.userData.wingRight = wingR;
    group.userData.animOffset = index * 0.7;

    const crown = new THREE.Group();
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0xffd451,
      emissive: 0x8a4b08,
      emissiveIntensity: 0.45,
      metalness: 0.68,
      roughness: 0.28
    });
    crown.add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.14, 7), crownMat));
    for (let point = 0; point < 5; point++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.4, 4), crownMat);
      spike.position.set((point - 2) * 0.17, 0.22, 0);
      crown.add(spike);
    }
    crown.position.set(0, 1.65, 0.1);
    crown.visible = false;
    group.add(crown);

    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 64;
    const badgeContext = badgeCanvas.getContext('2d');
    if (badgeContext) {
      badgeContext.fillStyle = 'rgba(24, 17, 44, 0.9)';
      badgeContext.strokeStyle = '#facc15';
      badgeContext.lineWidth = 4;
      badgeContext.beginPath();
      badgeContext.roundRect(4, 4, 248, 56, 20);
      badgeContext.fill();
      badgeContext.stroke();
      badgeContext.fillStyle = '#fff';
      badgeContext.font = 'bold 28px sans-serif';
      badgeContext.textAlign = 'center';
      badgeContext.textBaseline = 'middle';
      badgeContext.fillText(`FIREFLY ${index + 1}`, 128, 33);
    }
    const badge = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(badgeCanvas),
      transparent: true,
      depthTest: false
    }));
    badge.scale.set(3.3, 0.82, 1);
    badge.position.set(0, 2.85, 0.12);
    badge.visible = false;
    group.add(badge);
    group.userData.alphaCrown = crown;
    group.userData.alphaBadge = badge;

    return group;
  }

  #buildBatCreature(index) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8c7fd6, roughness: 0.48, metalness: 0.08 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 12), bodyMat);
    body.scale.set(0.92, 1.12, 0.9);
    body.position.y = 0.1;
    group.add(body);

    const belly = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xe0dcfc, roughness: 0.62 })
    );
    belly.scale.set(0.84, 0.92, 0.38);
    belly.position.set(0, -0.08, 0.69);
    group.add(belly);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.69, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0x9b8de0, roughness: 0.44 })
    );
    head.position.set(0, 0.82, 0.44);
    group.add(head);

    const earOuter = new THREE.MeshStandardMaterial({ color: 0x8878ce, side: THREE.DoubleSide, roughness: 0.52 });
    const earInner = new THREE.MeshBasicMaterial({ color: 0xf472b6, side: THREE.DoubleSide });
    [-1, 1].forEach((side) => {
      const earShape = new THREE.Shape();
      earShape.moveTo(0, 0);
      earShape.quadraticCurveTo(side * 0.06, 0.72, side * 0.42, 1.05);
      earShape.quadraticCurveTo(side * 0.5, 0.36, side * 0.24, 0.06);
      earShape.closePath();
      const ear = new THREE.Group();
      ear.add(new THREE.Mesh(new THREE.ShapeGeometry(earShape), earOuter));
      const inner = new THREE.Mesh(new THREE.ShapeGeometry(earShape), earInner);
      inner.scale.set(0.58, 0.62, 1);
      inner.position.set(side * 0.06, 0.12, 0.025);
      ear.add(inner);
      ear.position.set(side * 0.43, 1.12, 0.28);
      ear.rotation.z = side * -0.22;
      group.add(ear);
    });

    const eyeSocket = new THREE.MeshBasicMaterial({ color: 0x17142c });
    const irisMat = new THREE.MeshBasicMaterial({ color: 0x69d8ff });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-1, 1].forEach((side) => {
      const eye = new THREE.Group();
      const socket = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), eyeSocket);
      socket.scale.set(0.82, 1.12, 0.5);
      eye.add(socket);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), irisMat);
      iris.position.set(0.015, 0, 0.08);
      eye.add(iris);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), glintMat);
      glint.position.set(-0.025, 0.045, 0.15);
      eye.add(glint);
      eye.position.set(side * 0.28, 0.84, 1.0);
      group.add(eye);

      const blush = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.72 })
      );
      blush.scale.set(1.2, 0.62, 0.35);
      blush.position.set(side * 0.48, 0.55, 0.94);
      group.add(blush);
    });

    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.018, 5, 12, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x241d35 })
    );
    mouth.position.set(0, 0.47, 1.06);
    mouth.rotation.x = -Math.PI / 8;
    group.add(mouth);

    const wingMats = [];
    const makeBatWing = (side) => {
      const pivot = new THREE.Group();
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(side * 0.9, 0.95, side * 1.9, 0.68);
      shape.quadraticCurveTo(side * 1.62, 0.18, side * 1.48, -0.56);
      shape.quadraticCurveTo(side * 1.13, -0.16, side * 0.88, -0.54);
      shape.quadraticCurveTo(side * 0.4, -0.13, 0, -0.35);
      shape.closePath();
      const membrane = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshStandardMaterial({
          color: 0x5f54b8,
          roughness: 0.62,
          side: THREE.DoubleSide
        })
      );
      wingMats.push(membrane.material);
      pivot.add(membrane);

      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.035, 1.65, 6),
        new THREE.MeshStandardMaterial({ color: 0x332c64, roughness: 0.65 })
      );
      arm.rotation.z = side * Math.PI / 3;
      arm.position.set(side * 0.72, 0.3, 0.025);
      pivot.add(arm);
      pivot.position.set(side * 0.5, 0.34, 0.08);
      group.add(pivot);
      return pivot;
    };

    const wingL = makeBatWing(-1);
    const wingR = makeBatWing(1);

    const crown = new THREE.Group();
    const crownGold = new THREE.MeshStandardMaterial({
      color: 0xffd451,
      emissive: 0x8a4b08,
      emissiveIntensity: 0.5,
      metalness: 0.68,
      roughness: 0.28
    });
    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.16, 7), crownGold);
    crown.add(crownBase);
    for (let point = 0; point < 5; point++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.48, 4), crownGold);
      const angle = (point / 4 - 0.5) * Math.PI * 0.78;
      spike.position.set(Math.sin(angle) * 0.34, 0.25, Math.cos(angle) * 0.12);
      crown.add(spike);
    }
    const jewel = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.13, 0),
      new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0x9d174d, emissiveIntensity: 0.8 })
    );
    jewel.position.set(0, 0.28, 0.42);
    crown.add(jewel);
    crown.position.set(0, 1.85, 0.22);
    crown.visible = false;
    group.add(crown);

    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 256;
    badgeCanvas.height = 64;
    const badgeContext = badgeCanvas.getContext('2d');
    if (badgeContext) {
      badgeContext.fillStyle = 'rgba(24, 17, 44, 0.9)';
      badgeContext.strokeStyle = '#d7c8ff';
      badgeContext.lineWidth = 4;
      badgeContext.beginPath();
      badgeContext.roundRect(4, 4, 248, 56, 20);
      badgeContext.fill();
      badgeContext.stroke();
      badgeContext.fillStyle = '#fff';
      badgeContext.font = 'bold 28px sans-serif';
      badgeContext.textAlign = 'center';
      badgeContext.textBaseline = 'middle';
      badgeContext.fillText(`BAT ${index + 1}`, 128, 33);
    }
    const badge = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(badgeCanvas),
      transparent: true,
      depthTest: false
    }));
    badge.scale.set(3.3, 0.82, 1);
    badge.position.set(0, 3.1, 0.12);
    badge.visible = false;
    group.add(badge);

    group.userData.wingLeft = wingL;
    group.userData.wingRight = wingR;
    group.userData.animOffset = index * 0.8;
    group.userData.bodyMaterial = bodyMat;
    group.userData.wingMaterials = wingMats;
    group.userData.body = body;
    group.userData.baseScale = 1.45;
    group.userData.alphaCrown = crown;
    group.userData.alphaBadge = badge;

    return group;
  }

  // ==========================================================================
  // 7. SISTEM FX: CAHAYA KUNANG-KUNANG & PULSA ECHO KELELAWAR
  // ==========================================================================
  #initFXSystems() {
    this.sonarRings = [];
    const ringGeom = new THREE.RingGeometry(0.6, 1.4, 28);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 8; i++) {
      const ring = new THREE.Mesh(ringGeom.clone(), ringMat.clone());
      ring.visible = false;
      this.baChunkGroup.add(ring);
      this.sonarRings.push({
        mesh: ring,
        active: false,
        radius: 1,
        maxRadius: 22
      });
    }
  }

  #triggerBatEcho(x, y, z) {
    const freeRing = this.sonarRings.find((r) => !r.active);
    if (!freeRing) return;
    freeRing.active = true;
    freeRing.radius = 1;
    freeRing.mesh.scale.set(1, 1, 1);
    freeRing.mesh.position.set(x, y + 0.4, z);
    freeRing.mesh.material.opacity = 0.75;
    freeRing.mesh.visible = true;
  }

  // ==========================================================================
  // 8. SIMULASI ENGINE & SINKRONISASI SWARM
  // ==========================================================================
  #resetSimulation() {
    const obj = landscapeById(this.currentObjId);
    this.iteration = 0;
    this.stepPhase = 3;
    this.historyFA = [];
    this.historyBA = [];

    const f2d = (x) => obj.evaluate(x[0], x[1]);
    const cfg = {
      dim: 2,
      lo: obj.min,
      hi: obj.max,
      fitness: f2d,
      maxIterations: this.maxIterations,
      seed: 42
    };

    this.faEngine = new FAEngine({ ...cfg, populationSize: this.faPopulationSize, beta0: 1.0, gamma: 1.5, alpha: 0.25 });
    this.baEngine = new BAEngine({
      ...cfg,
      populationSize: this.baPopulationSize,
      fmin: 0,
      fmax: this.baFmax,
      loudness: 0.5,
      pulseRate: 0.5
    });

    this.#buildTerrainChunks();
    this.#syncSwarmPositions();
    this.historyFA = [{ iteration: 0, bestFitness: this.faEngine.getState().best.fitness }];
    this.historyBA = [{ iteration: 0, bestFitness: this.baEngine.getState().best.fitness }];
    this.#updateUI();
  }

  #stepSimulation() {
    if (this.iteration >= this.maxIterations) {
      this.isPlaying = false;
      const playBtn = this.modal.querySelector('#sky-act-play');
      if (playBtn) playBtn.textContent = '▶️';
      sound.playVictory();
      return;
    }

    this.stepPhase = (this.stepPhase % 3) + 1;

    if (this.stepPhase === 3) {
      this.faEngine.runIteration();
      this.baEngine.runIteration();
      this.iteration++;

      const faSt = this.faEngine.getState();
      const baSt = this.baEngine.getState();

      if (faSt.best) this.historyFA.push({ iteration: this.iteration, bestFitness: faSt.best.fitness });
      if (baSt.best) this.historyBA.push({ iteration: this.iteration, bestFitness: baSt.best.fitness });

      if (this.iteration % 3 === 0) sound.playChime();
      else if (this.iteration % 3 === 1) sound.playPing();

      // Pemicu pulsa sonar echo kelelawar
      if (baSt.best) {
        const p = this.#to3D(baSt.best.x[0], baSt.best.x[1]);
        this.#triggerBatEcho(p.x, p.y, p.z);
      }
    } else {
      sound.playClick();
    }

    this.#syncSwarmPositions();
    this.#updateUI();
  }

  #to3D(xNorm, yNorm) {
    const obj = landscapeById(this.currentObjId);
    const half = 40;

    const u = (xNorm - obj.min) / (obj.max - obj.min);
    const v = (yNorm - obj.min) / (obj.max - obj.min);
    const x = -half + u * 80;
    const z = -half + v * 80;
    return { x, y: 0, z };
  }

  #pickAgent(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointerNdc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const creatures = [
      ...(this.viewMode === 'both' || this.viewMode === 'fa' ? this.faCreatures : []),
      ...(this.viewMode === 'both' || this.viewMode === 'ba' ? this.baCreatures : [])
    ];
    for (const hit of this.raycaster.intersectObjects(creatures, true)) {
      let creature = hit.object;
      while (creature && !creature.userData.agentType) creature = creature.parent;
      if (creature) {
        return {
          type: creature.userData.agentType,
          index: creature.userData.agentIndex,
          creature
        };
      }
    }
    return null;
  }

  #selectAgent(selection) {
    if (this.selectedAgent?.creature) {
      this.selectedAgent.creature.userData.selectionRing.visible = false;
    }
    this.selectedAgent = selection;
    if (selection?.creature) {
      selection.creature.userData.selectionRing.visible = true;
    }

    const hint = this.modal.querySelector('#sky-agent-hint');
    const deleteButton = this.modal.querySelector('#sky-agent-delete');
    if (deleteButton) deleteButton.hidden = !selection;
    if (hint) {
      if (!selection) {
        hint.textContent = this.lang === 'ID'
          ? 'Pilih unit, lalu seret untuk memindahkannya'
          : 'Select a unit, then drag to move it';
      } else {
        const label = selection.type === 'fa'
          ? (this.lang === 'ID' ? 'Kunang-kunang' : 'Firefly')
          : (this.lang === 'ID' ? 'Kelelawar' : 'Bat');
        hint.textContent = `${label} #${selection.index + 1} · ${
          this.lang === 'ID' ? 'seret untuk pindah' : 'drag to move'
        }`;
      }
    }
  }

  #moveSelectedAgent(event) {
    if (!this.selectedAgent) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointerNdc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const point = this.raycaster.ray.intersectPlane(this.groundPlane, new THREE.Vector3());
    if (!point) return;

    const isFirefly = this.selectedAgent.type === 'fa';
    const group = isFirefly ? this.faChunkGroup : this.baChunkGroup;
    const engine = isFirefly ? this.faEngine : this.baEngine;
    const creatures = isFirefly ? this.faCreatures : this.baCreatures;
    const agent = engine.agents[this.selectedAgent.index];
    if (!agent) return;

    const obj = landscapeById(this.currentObjId);
    const localX = THREE.MathUtils.clamp(point.x - group.position.x, -40, 40);
    const localZ = THREE.MathUtils.clamp(point.z, -40, 40);
    const position = [
      obj.min + ((localX + 40) / 80) * (obj.max - obj.min),
      obj.min + ((localZ + 40) / 80) * (obj.max - obj.min)
    ];
    agent.x = position;
    agent.px = position.slice();
    if (agent.stepFrom) agent.stepFrom = position.slice();
    const terrainPosition = this.#to3D(position[0], position[1]);
    const creature = creatures[this.selectedAgent.index];
    const hoverY = terrainPosition.y + (isFirefly ? 7 : 9);
    creature.position.set(terrainPosition.x, hoverY, terrainPosition.z);
    creature.userData.flightTarget = { x: terrainPosition.x, y: hoverY, z: terrainPosition.z };
    creature.userData.hoverBaseY = hoverY;
    this.agentDragDirty = true;
  }

  #finishAgentMove() {
    if (!this.agentDragDirty || !this.selectedAgent) return;
    const isFirefly = this.selectedAgent.type === 'fa';
    const engine = isFirefly ? this.faEngine : this.baEngine;
    const agent = engine.agents[this.selectedAgent.index];
    if (agent) {
      agent.f = engine.evalFitness(agent.x);
      if (!isFirefly) {
        agent.v.fill(0);
        agent.trial = null;
        agent.trialF = null;
        agent.accepted = null;
      } else {
        agent.attractor = -1;
        agent.pull = 0;
      }
      engine.updateBest();
      if (isFirefly) engine.rankAgents();
      engine.phase = 'INIT';
      engine.phaseLabel = isFirefly ? 'Sebar kunang-kunang' : 'Sebar kelelawar';
    }
    this.agentDragDirty = false;
    this.#syncSwarmPositions();
    this.#updateUI();
  }

  #destroySelectedAgent() {
    if (!this.selectedAgent) return;
    const isFirefly = this.selectedAgent.type === 'fa';
    const engine = isFirefly ? this.faEngine : this.baEngine;
    const creatures = isFirefly ? this.faCreatures : this.baCreatures;
    if (engine.agents.length <= 2) {
      const hint = this.modal.querySelector('#sky-agent-hint');
      if (hint) {
        hint.textContent = this.lang === 'ID'
          ? 'Minimal 2 unit harus tersisa agar algoritma dapat berjalan'
          : 'At least 2 units must remain for the algorithm to run';
      }
      sound.playClick();
      return;
    }

    const index = this.selectedAgent.index;
    const [creature] = creatures.splice(index, 1);
    creature?.parent?.remove(creature);
    engine.agents.splice(index, 1);
    engine.populationSize = engine.agents.length;
    creatures.forEach((unit, unitIndex) => {
      unit.userData.agentIndex = unitIndex;
    });
    this.#selectAgent(null);
    this.agentDragDirty = false;
    this.#syncSwarmPositions();

    const populationInput = this.modal.querySelector(
      isFirefly ? '#sky-fa-population-input' : '#sky-ba-population-input'
    );
    const populationLabel = this.modal.querySelector(
      isFirefly ? '#sky-fa-population-label' : '#sky-ba-population-label'
    );
    const count = engine.agents.length;
    if (isFirefly) this.faPopulationSize = count;
    else this.baPopulationSize = count;
    if (populationInput) populationInput.value = String(count);
    if (populationLabel) populationLabel.textContent = String(count);
    sound.playSword();
    this.#updateUI();
  }

  #syncSwarmPositions() {
    const faSt = this.faEngine.getState();
    const baSt = this.baEngine.getState();

    // Kunang-Kunang
    if (faSt.agents) {
      const bestPosition = faSt.best?.x;
      const alphaIndex = bestPosition
        ? faSt.agents.reduce((bestIdx, agent, index, agents) => {
            const distance = (candidate) =>
              candidate.x.reduce((sum, value, dim) => sum + (value - bestPosition[dim]) ** 2, 0);
            return distance(agent) < distance(agents[bestIdx]) ? index : bestIdx;
          }, 0)
        : -1;

      faSt.agents.forEach((ind, i) => {
        const m = this.faCreatures[i];
        if (!m) return;
        const p = this.#to3D(ind.x[0], ind.x[1]);
        const target = { x: p.x, y: p.y + 7, z: p.z };
        if (!m.userData.flightReady) {
          m.position.set(target.x, target.y, target.z);
          m.userData.flightReady = true;
        }
        m.userData.flightTarget = target;
        m.userData.hoverBaseY = p.y + 7;
        const isAlpha = i === alphaIndex;
        m.userData.alphaCrown.visible = isAlpha;
        m.userData.alphaBadge.visible = isAlpha;
      });
    }

    // Marker Terbaik FA
    if (faSt.best) {
      const faBestP = this.#to3D(faSt.best.x[0], faSt.best.x[1]);
      this.faBestMarker?.position.set(faBestP.x, faBestP.y, faBestP.z);
    }

    // Kelelawar
    if (baSt.agents) {
      const bestPosition = baSt.best?.x;
      const alphaIndex = bestPosition
        ? baSt.agents.reduce((bestIdx, agent, index, agents) => {
            const distance = (candidate) =>
              candidate.x.reduce((sum, value, dim) => sum + (value - bestPosition[dim]) ** 2, 0);
            return distance(agent) < distance(agents[bestIdx]) ? index : bestIdx;
          }, 0)
        : -1;
      const bestPoint = bestPosition ? this.#to3D(bestPosition[0], bestPosition[1]) : null;

      baSt.agents.forEach((ind, i) => {
        const m = this.baCreatures[i];
        if (!m) return;
        const isAlpha = i === alphaIndex;
        const isNearLeader = bestPosition
          && Math.hypot(ind.x[0] - bestPosition[0], ind.x[1] - bestPosition[1]) < 0.24;
        let p = this.#to3D(ind.x[0], ind.x[1]);

        if (isNearLeader && !isAlpha && bestPoint) {
          const angle = i * 2.399963229728653;
          const orbitRadius = 3.2 + (1 - (ind.A ?? 0.5)) * 1.8;
          p = {
            ...p,
            x: bestPoint.x + Math.cos(angle) * orbitRadius,
            z: bestPoint.z + Math.sin(angle) * orbitRadius
          };
        }

        const target = { x: p.x, y: p.y + 9, z: p.z };
        if (!m.userData.flightReady) {
          m.position.set(target.x, target.y, target.z);
          m.userData.flightReady = true;
        }
        m.userData.flightTarget = target;
        m.userData.hoverBaseY = p.y + 9;
        m.userData.alphaCrown.visible = isAlpha;
        m.userData.alphaBadge.visible = isAlpha;
        m.userData.bodyMaterial.color.setHex(isAlpha ? 0xff5fa2 : 0x8c7fd6);
        m.userData.bodyMaterial.emissive.setHex(isAlpha ? 0x7a1f4a : 0x000000);
        m.userData.bodyMaterial.emissiveIntensity = isAlpha ? 0.8 : 0;
        m.userData.wingMaterials.forEach((material) => {
          material.color.setHex(isAlpha ? 0xd94a8a : 0x5f54b8);
        });
        const scale = isAlpha ? 1.9 : m.userData.baseScale;
        m.scale.setScalar(scale);
        m.userData.isAlpha = isAlpha;
      });
    }

    // Marker Terbaik BA
    if (baSt.best) {
      const baBestP = this.#to3D(baSt.best.x[0], baSt.best.x[1]);
      this.baBestMarker?.position.set(baBestP.x, baBestP.y, baBestP.z);
    }
  }

  // ==========================================================================
  // 9. ANIMASI LOOP, KONTROL KAMERA RTS & TRANSISI POV
  // ==========================================================================
  #startLoop() {
    this.#stopLoop();
    let lastStepTime = performance.now();

    const loop = (t) => {
      // 1. Transisi Sudut Kamera Halus (Lerp Interpolation)
      if (this.autoRotate && !this.isDragging) {
        this.targetAngle.theta += 0.0025;
      }

      this.cameraAngle.theta = THREE.MathUtils.lerp(this.cameraAngle.theta, this.targetAngle.theta, 0.08);
      this.cameraAngle.phi = THREE.MathUtils.lerp(this.cameraAngle.phi, this.targetAngle.phi, 0.08);
      this.cameraAngle.radius = THREE.MathUtils.lerp(this.cameraAngle.radius, this.targetAngle.radius, 0.08);
      this.#updateCameraPosition();
      this.#updateCameraOcclusion();

      // 2. Animasi Marker Pemimpin
      if (this.faBestMarker?.userData?.gem) this.faBestMarker.userData.gem.rotation.y += 0.035;
      if (this.baBestMarker?.userData?.gem) this.baBestMarker.userData.gem.rotation.y -= 0.035;

      // 3. Animasi Kunang-Kunang: Cahaya Berdenyut + Kepakan Sayap
      this.faCreatures.forEach((c) => {
        const off = c.userData.animOffset || 0;
        const target = c.userData.flightTarget;
        if (target) {
          c.position.x = THREE.MathUtils.lerp(c.position.x, target.x, 0.055);
          c.position.z = THREE.MathUtils.lerp(c.position.z, target.z, 0.055);
          c.rotation.y = Math.atan2(target.x - c.position.x, target.z - c.position.z);
        }
        c.position.y = (c.userData.hoverBaseY || 7) + Math.sin(t * 0.0026 + off) * 1.15;
        const pulse = 0.7 + 0.5 * Math.sin(t * 0.008 + off);
        if (c.userData.bulb) c.userData.bulb.material.emissiveIntensity = pulse;
        if (c.userData.light) c.userData.light.intensity = pulse * 0.8;

        // Kepakan sayap cepat
        const flap = Math.sin(t * 0.035 + off) * 0.45;
        if (c.userData.wingLeft) c.userData.wingLeft.rotation.y = flap;
        if (c.userData.wingRight) c.userData.wingRight.rotation.y = -flap;
      });

      // 4. Animasi Kelelawar: Kepakan Sayap Aerodinamis + Fluktuasi Ketinggian
      this.baCreatures.forEach((b) => {
        const off = b.userData.animOffset || 0;
        const target = b.userData.flightTarget;
        if (target) {
          b.position.x = THREE.MathUtils.lerp(b.position.x, target.x, 0.055);
          b.position.z = THREE.MathUtils.lerp(b.position.z, target.z, 0.055);
          b.rotation.y = Math.atan2(target.x - b.position.x, target.z - b.position.z);
        }
        b.position.y = (b.userData.hoverBaseY || 9) + Math.sin(t * 0.002 + off + 1.2) * 1.6;
        const flap = Math.sin(t * 0.012 + off) * 0.55;
        if (b.userData.wingLeft) b.userData.wingLeft.rotation.z = flap;
        if (b.userData.wingRight) b.userData.wingRight.rotation.z = -flap;
      });

      // 5. Animasi Gelombang Sonar Echo Kelelawar
      this.sonarRings.forEach((r) => {
        if (!r.active) return;
        r.radius += 0.32;
        r.mesh.scale.set(r.radius, r.radius, 1);
        r.mesh.material.opacity = Math.max(0, 0.75 * (1 - r.radius / r.maxRadius));
        if (r.radius >= r.maxRadius) {
          r.active = false;
          r.mesh.visible = false;
        }
      });

      // 6. Gerak Awan di Langit
      if (this.clouds) {
        this.clouds.forEach((c) => {
          c.position.x += 0.035;
          if (c.position.x > 240) c.position.x = -240;
        });
      }

      // 7. Playback Simulasi
      if (this.isPlaying) {
        const intervalMs = Math.max(70, 420 / this.speed);
        if (t - lastStepTime > intervalMs) {
          lastStepTime = t;
          this.#stepSimulation();
        }
      }

      this.renderer.render(this.scene, this.camera);
      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  #stopLoop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  #updateCameraPosition() {
    const { theta, phi, radius } = this.cameraAngle;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  #setCameraPreset(pov) {
    this.povMode = pov;
    if (pov === 'iso') {
      // Sudut Isometrik AoE (~45° azimuth, 34° elevasi)
      this.targetAngle = { theta: Math.PI * 0.25, phi: Math.PI * 0.34, radius: 290 };
      this.cameraTarget.set(0, 8, 0);
    } else if (pov === 'bird') {
      // Bird's Eye View (Overhead tegak lurus melihat medan & kontur dari langit)
      this.targetAngle = { theta: 0, phi: 0.05, radius: 320 };
      this.cameraTarget.set(0, 6, 0);
    }
  }

  #onResize() {
    const container = this.modal.querySelector('#sky-canvas-wrap');
    if (!container || !this.renderer) return;
    const w = container.clientWidth || 1780;
    const h = container.clientHeight || 620;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // ==========================================================================
  // 10. UI UPDATES, NARRATIVE & SPARKLINE GRAPH
  // ==========================================================================
  #updateUI() {
    const faSt = this.faEngine.getState();
    const baSt = this.baEngine.getState();
    const isID = this.lang === 'ID';

    // Step Chips
    ['chip-step-1', 'chip-step-2', 'chip-step-3'].forEach((id, idx) => {
      const el = this.modal.querySelector(`#${id}`);
      if (el) el.classList.toggle('active', idx + 1 === this.stepPhase);
    });

    // Metrik Kartu
    const faBestEl = this.modal.querySelector('#fa-val-best');
    const faIterEl = this.modal.querySelector('#fa-val-iter');
    const faBetaEl = this.modal.querySelector('#fa-val-beta');
    const baBestEl = this.modal.querySelector('#ba-val-best');
    const baIterEl = this.modal.querySelector('#ba-val-iter');
    const baLoudEl = this.modal.querySelector('#ba-val-loud');
    const roundText = this.modal.querySelector('#sky-round-text');

    if (faBestEl) faBestEl.textContent = (faSt.best?.fitness ?? 0).toFixed(4);
    if (faIterEl) faIterEl.textContent = `${this.iteration} / ${this.maxIterations}`;
    if (faBetaEl) faBetaEl.textContent = (1.0 / (1.0 + 1.5 * 0.1 * this.iteration)).toFixed(2);

    if (baBestEl) baBestEl.textContent = (baSt.best?.fitness ?? 0).toFixed(4);
    if (baIterEl) baIterEl.textContent = `${this.iteration} / ${this.maxIterations}`;
    if (baLoudEl) baLoudEl.textContent = (baSt.meanA ?? 0.5).toFixed(2);
    const faCountEl = this.modal.querySelector('#fa-val-count');
    const baCountEl = this.modal.querySelector('#ba-val-count');
    const baFmaxEl = this.modal.querySelector('#ba-val-fmax');
    if (faCountEl) faCountEl.textContent = String(faSt.agents.length);
    if (baCountEl) baCountEl.textContent = String(baSt.agents.length);
    if (baFmaxEl) baFmaxEl.textContent = this.baFmax.toFixed(1);

    const faInitial = this.historyFA[0]?.bestFitness ?? faSt.best?.fitness ?? 0;
    const baInitial = this.historyBA[0]?.bestFitness ?? baSt.best?.fitness ?? 0;
    const faBest = faSt.best;
    const baBest = baSt.best;
    const objective = landscapeById(this.currentObjId);
    const convergenceObjective = this.modal.querySelector('#sky-convergence-objective');
    const convergenceSubtitle = this.modal.querySelector('#sky-convergence-subtitle');
    if (convergenceObjective) {
      convergenceObjective.textContent = isID ? `Objektif: ${objective.name}` : `Objective: ${objective.name}`;
    }
    if (convergenceSubtitle) {
      convergenceSubtitle.textContent = isID
        ? 'Fitness terbaik pada tiap iterasi · semakin rendah semakin baik'
        : 'Best fitness at each iteration · lower is better';
    }
    const setMetric = (id, value) => {
      const el = this.modal.querySelector(`#${id}`);
      if (el) el.textContent = value;
    };
    setMetric('fa-val-improvement', (faInitial - (faBest?.fitness ?? faInitial)).toFixed(4));
    setMetric('ba-val-improvement', (baInitial - (baBest?.fitness ?? baInitial)).toFixed(4));
    setMetric('fa-val-position', faBest ? `(${faBest.x[0].toFixed(2)}, ${faBest.x[1].toFixed(2)})` : '—');
    setMetric('ba-val-position', baBest ? `(${baBest.x[0].toFixed(2)}, ${baBest.x[1].toFixed(2)})` : '—');
    setMetric('fa-val-evaluations', faSt.evaluations.toLocaleString());
    setMetric('ba-val-evaluations', baSt.evaluations.toLocaleString());

    if (roundText) {
      roundText.textContent = isID
        ? `Iterasi ${this.iteration} dari ${this.maxIterations}`
        : `Round ${this.iteration} of ${this.maxIterations}`;
    }

    // Teks Narasi Berdasarkan Tahap
    const narFA = this.modal.querySelector('#narrative-fa-text');
    const narBA = this.modal.querySelector('#narrative-ba-text');

    if (isID) {
      if (this.stepPhase === 1) {
        if (narFA) narFA.innerHTML = `<b>Kunang-Kunang: ① Ukur.</b> Mengindra intensitas lentera dan mengukur fitness dari titik-titik di dalam ruangan.`;
        if (narBA) narBA.innerHTML = `<b>Kelelawar: ① Ukur.</b> Memancarkan pulsa sonar ultrasonik <i>f</i> untuk membaca gema dinding gua dan menemukan kristal putih.`;
      } else if (this.stepPhase === 2) {
        if (narFA) narFA.innerHTML = `<b>Kunang-Kunang: ② Tentukan.</b> Menghitung daya tarik β(r) = β₀ e^(-γ r²). Yang lebih redup menentukan arah terbang menuju kunang-kunang yang lebih benderang.`;
        if (narBA) narBA.innerHTML = `<b>Kelelawar: ② Tentukan.</b> Mengevaluasi kelantangan <i>A</i> dan frekuensi pulsa <i>r</i>. Jika rand > r, lakukan penelusuran lokal eksploitasi pemimpin <i>x*</i>.`;
      } else {
        if (narFA) narFA.innerHTML = `<b>Kunang-Kunang: ③ Gerak.</b> Mengepakkan sayap meluncur ke arah cahaya + langkah acak kecil α(rand - 0.5) untuk menghindari jebakan lokal.`;
        if (narBA) narBA.innerHTML = `<b>Kelelawar: ③ Gerak.</b> Meluncur cepat memperbarui kecepatan <i>v</i> dan posisi <i>x</i> menuju pemimpin <i>x*</i>. Pulsa echo memverifikasi solusi baru.`;
      }
    } else {
      if (this.stepPhase === 1) {
        if (narFA) narFA.innerHTML = `<b>Firefly: ① Measure.</b> Sensing lantern intensity and evaluating fitness at positions across the room.`;
        if (narBA) narBA.innerHTML = `<b>Bat: ① Measure.</b> Emitting ultrasonic pulses <i>f</i> to read cave echoes and locate the white crystal.`;
      } else if (this.stepPhase === 2) {
        if (narFA) narFA.innerHTML = `<b>Firefly: ② Decide.</b> Computing attraction β(r) = β₀ e^(-γ r²). Dimmer fireflies lock onto brighter peers.`;
        if (narBA) narBA.innerHTML = `<b>Bat: ② Decide.</b> Evaluating loudness <i>A</i> and pulse rate <i>r</i>. If rand > r, local exploitation around leader <i>x*</i> begins.`;
      } else {
        if (narFA) narFA.innerHTML = `<b>Firefly: ③ Move.</b> Flapping wings towards light sources plus random step α(rand - 0.5) to escape deceptive local valleys.`;
        if (narBA) narBA.innerHTML = `<b>Bat: ③ Move.</b> Sweeping velocity <i>v</i> and coordinates <i>x</i> towards leader <i>x*</i> with expanding sonar wave pulses.`;
      }
    }

    // Filter Pasukan
    if (this.faChunkGroup) this.faChunkGroup.visible = this.viewMode === 'both' || this.viewMode === 'fa';
    if (this.baChunkGroup) this.baChunkGroup.visible = this.viewMode === 'both' || this.viewMode === 'ba';

    const bFA = this.modal.querySelector('#badge-fa');
    const bBA = this.modal.querySelector('#badge-ba');
    if (bFA) bFA.style.display = (this.viewMode === 'both' || this.viewMode === 'fa') ? 'flex' : 'none';
    if (bBA) bBA.style.display = (this.viewMode === 'both' || this.viewMode === 'ba') ? 'flex' : 'none';

    this.#drawConvergenceChart();
  }

  #drawConvergenceChart() {
    const panel = this.modal.querySelector('#sky-convergence-panel');
    const cv = this.modal.querySelector('#sky-convergence-cv');
    if (!cv || !panel?.open) return;
    renderConvergenceChart(cv, [
      { label: 'Firefly', color: '#06b6d4', fill: 'rgba(6, 182, 212, 0.12)', data: this.historyFA },
      { label: 'Bat', color: '#9333ea', data: this.historyBA }
    ], { maxIterations: this.maxIterations, yMin: 0, legend: true, decimals: 3 });
  }

  // ==========================================================================
  // 11. EVENT LISTENERS
  // ==========================================================================
  #bindEvents() {
    this.modal.querySelector('#sky-convergence-panel')?.addEventListener('toggle', () => {
      if (this.modal.querySelector('#sky-convergence-panel')?.open) this.#drawConvergenceChart();
    });
    this.modal.querySelector('#sky-agent-delete')?.addEventListener('click', () => {
      this.#destroySelectedAgent();
    });

    // 0. Portal 3D
    this.modal.querySelector('#sky-btn-portal')?.addEventListener('click', () => {
      this.close();
      window.__aoeHud?.landscapeChooser?.open();
    });

    // 1. Tutup
    this.modal.querySelector('#sky-btn-close')?.addEventListener('click', () => this.close());

    // 2. Preset Sudut Pandang RTS (Isometrik vs Bird's Eye)
    this.modal.querySelectorAll('#sky-pov-picker button').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        this.modal.querySelectorAll('#sky-pov-picker button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.#setCameraPreset(btn.dataset.pov);
      });
    });

    // 3. Pemilihan Lanskap (Rastrigin, Ackley, Sphere)
    this.modal.querySelectorAll('#sky-landscape-picker button').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        this.modal.querySelectorAll('#sky-landscape-picker button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentObjId = btn.dataset.obj;
        this.#resetSimulation();
      });
    });

    // 4. Filter Pasukan (Both, FA, BA)
    this.modal.querySelectorAll('#sky-faction-picker button').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        this.modal.querySelectorAll('#sky-faction-picker button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.viewMode = btn.dataset.view;
        this.#updateUI();
      });
    });

    // 5. Bahasa Toggle (ID, EN)
    this.modal.querySelectorAll('#sky-lang-picker button').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        this.modal.querySelectorAll('#sky-lang-picker button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.lang = btn.dataset.lang;
        this.#updateLangLabels();
        this.#updateUI();
      });
    });

    // 6. Toggle Orbit Kamera
    const rotBtn = this.modal.querySelector('#sky-toggle-rotate');
    rotBtn?.addEventListener('click', () => {
      sound.playClick();
      this.autoRotate = !this.autoRotate;
      rotBtn.classList.toggle('active', this.autoRotate);
    });

    // 7. Kontrol Playback (Play, Step, Reset)
    const playBtn = this.modal.querySelector('#sky-act-play');
    playBtn?.addEventListener('click', () => {
      sound.playClick();
      this.isPlaying = !this.isPlaying;
      playBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
    });

    this.modal.querySelector('#sky-act-step')?.addEventListener('click', () => {
      sound.playClick();
      this.isPlaying = false;
      if (playBtn) playBtn.textContent = '▶️';
      this.#stepSimulation();
    });

    this.modal.querySelector('#sky-act-reset')?.addEventListener('click', () => {
      sound.playClick();
      this.isPlaying = false;
      if (playBtn) playBtn.textContent = '▶️';
      this.#resetSimulation();
    });

    // 8. Slider Kecepatan
    const spInput = this.modal.querySelector('#sky-speed-input');
    const spLabel = this.modal.querySelector('#sky-speed-label');
    spInput?.addEventListener('input', (e) => {
      this.speed = Number(e.target.value);
      if (spLabel) spLabel.textContent = `${this.speed.toFixed(1)}x`;
    });

    const tuningInputs = [
      { id: '#sky-fa-population-input', output: '#sky-fa-population-label', value: 'faPopulationSize', parse: Number },
      { id: '#sky-ba-population-input', output: '#sky-ba-population-label', value: 'baPopulationSize', parse: Number },
      { id: '#sky-fmax-input', output: '#sky-fmax-label', value: 'baFmax', parse: (value) => Number(value) }
    ];
    tuningInputs.forEach(({ id, output, value, parse }) => {
      const input = this.modal.querySelector(id);
      const label = this.modal.querySelector(output);
      input?.addEventListener('input', (e) => {
        const nextValue = parse(e.target.value);
        if (label) label.textContent = value === 'baFmax' ? nextValue.toFixed(1) : String(nextValue);
      });
      input?.addEventListener('change', (e) => {
        this[value] = parse(e.target.value);
        this.isPlaying = false;
        if (playBtn) playBtn.textContent = '▶️';
        this.#resetSimulation();
      });
    });

    // 9. Kontrol Mouse Drag untuk Rotasi Kamera Bebas
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      const selection = this.#pickAgent(e);
      this.#selectAgent(selection);
      if (selection) {
        if (this.isPlaying) {
          this.isPlaying = false;
          const playButton = this.modal.querySelector('#sky-act-play');
          if (playButton) playButton.textContent = '▶️';
        }
        this.isMovingAgent = true;
        this.agentDragDirty = false;
        this.canvas.style.cursor = 'grabbing';
        return;
      }

      this.isDragging = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMovingAgent) {
        this.#moveSelectedAgent(e);
        return;
      }
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;
      this.prevMouse = { x: e.clientX, y: e.clientY };

      this.targetAngle.theta -= dx * 0.0075;
      this.targetAngle.phi = Math.max(0.04, Math.min(Math.PI * 0.48, this.targetAngle.phi - dy * 0.0075));
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      if (this.isMovingAgent) {
        this.isMovingAgent = false;
        this.canvas.style.cursor = 'grab';
        this.#finishAgentMove();
      }
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        this.selectedAgent &&
        !this.modal.classList.contains('hidden')
      ) {
        e.preventDefault();
        this.#destroySelectedAgent();
      }
    });

    // Zoom Scroll Wheel
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.targetAngle.radius = Math.max(70, Math.min(380, this.targetAngle.radius + e.deltaY * 0.22));
    }, { passive: false });
  }

  #updateLangLabels() {
    const isID = this.lang === 'ID';
    const titleText = this.modal.querySelector('#sky-title-text');
    const subText = this.modal.querySelector('#sky-sub-text');
    const step1 = this.modal.querySelector('#chip-step-1');
    const step2 = this.modal.querySelector('#chip-step-2');
    const step3 = this.modal.querySelector('#chip-step-3');
    const speedTxt = this.modal.querySelector('#sky-speed-txt');
    const convergenceTitle = this.modal.querySelector('#sky-convergence-title');
    const bFATitle = this.modal.querySelector('#badge-fa-title');
    const bBATitle = this.modal.querySelector('#badge-ba-title');
    const lFABest = this.modal.querySelector('#lbl-fa-best');
    const lFAIter = this.modal.querySelector('#lbl-fa-iter');
    const lBABest = this.modal.querySelector('#lbl-ba-best');
    const lBAIter = this.modal.querySelector('#lbl-ba-iter');
    const lFACount = this.modal.querySelector('#lbl-fa-count');
    const lBACount = this.modal.querySelector('#lbl-ba-count');
    const lBAFmax = this.modal.querySelector('#lbl-ba-fmax');
    const faPopulationTxt = this.modal.querySelector('#sky-fa-population-txt');
    const baPopulationTxt = this.modal.querySelector('#sky-ba-population-txt');
    const fmaxTxt = this.modal.querySelector('#sky-fmax-txt');
    const agentHint = this.modal.querySelector('#sky-agent-hint');
    const agentDelete = this.modal.querySelector('#sky-agent-delete');
    const faImprovement = this.modal.querySelector('#lbl-fa-improvement');
    const baImprovement = this.modal.querySelector('#lbl-ba-improvement');
    const faPosition = this.modal.querySelector('#lbl-fa-position');
    const baPosition = this.modal.querySelector('#lbl-ba-position');
    const faEvaluations = this.modal.querySelector('#lbl-fa-evaluations');
    const baEvaluations = this.modal.querySelector('#lbl-ba-evaluations');
    const sceneFaLabel = this.modal.querySelector('#scene-fa-label');
    const sceneBaLabel = this.modal.querySelector('#scene-ba-label');

    if (isID) {
      if (titleText) titleText.textContent = 'Firefly & Bat 3D';
      if (subText) subText.textContent = 'Kunang-kunang mengejar lentera · Kelelawar memburu kristal putih di dalam gua';
      if (sceneFaLabel) sceneFaLabel.textContent = 'RUANG LENTERA';
      if (sceneBaLabel) sceneBaLabel.textContent = 'GUA KRISTAL PUTIH';
      if (step1) step1.textContent = '① Ukur (Measure)';
      if (step2) step2.textContent = '② Tentukan (Decide)';
      if (step3) step3.textContent = '③ Gerak (Move)';
      if (speedTxt) speedTxt.textContent = 'Kecepatan';
      if (convergenceTitle) convergenceTitle.textContent = 'Grafik konvergensi';
      if (bFATitle) bFATitle.textContent = 'Ordo Kunang-Kunang';
      if (bBATitle) bBATitle.textContent = 'Legiun Kelelawar';
      if (lFABest) lFABest.textContent = 'Terbaik:';
      if (lFAIter) lFAIter.textContent = 'Iterasi:';
      if (lBABest) lBABest.textContent = 'Terbaik:';
      if (lBAIter) lBAIter.textContent = 'Iterasi:';
      if (lFACount) lFACount.textContent = 'Pasukan:';
      if (lBACount) lBACount.textContent = 'Pasukan:';
      if (lBAFmax) lBAFmax.textContent = 'Frekuensi maks.:';
      if (faPopulationTxt) faPopulationTxt.textContent = 'Jumlah kunang-kunang';
      if (baPopulationTxt) baPopulationTxt.textContent = 'Jumlah kelelawar';
      if (fmaxTxt) fmaxTxt.textContent = 'Frekuensi maksimum fₘₐₓ';
      if (agentHint) agentHint.textContent = this.selectedAgent
        ? `${this.selectedAgent.type === 'fa' ? 'Kunang-kunang' : 'Kelelawar'} #${this.selectedAgent.index + 1} · seret untuk pindah`
        : 'Pilih unit, lalu seret untuk memindahkannya';
      if (agentDelete) agentDelete.textContent = '🪓 Hancurkan unit';
      if (faImprovement) faImprovement.textContent = 'Perbaikan fitness';
      if (baImprovement) baImprovement.textContent = 'Perbaikan fitness';
      if (faPosition) faPosition.textContent = 'Koordinat terbaik';
      if (baPosition) baPosition.textContent = 'Koordinat terbaik';
      if (faEvaluations) faEvaluations.textContent = 'Evaluasi fungsi';
      if (baEvaluations) baEvaluations.textContent = 'Evaluasi fungsi';
    } else {
      if (titleText) titleText.textContent = 'Firefly & Bat 3D';
      if (subText) subText.textContent = 'Fireflies chase the lantern · Bats hunt the white crystal inside the cave';
      if (sceneFaLabel) sceneFaLabel.textContent = 'LANTERN ROOM';
      if (sceneBaLabel) sceneBaLabel.textContent = 'WHITE CRYSTAL CAVE';
      if (step1) step1.textContent = '① Measure';
      if (step2) step2.textContent = '② Decide';
      if (step3) step3.textContent = '③ Move';
      if (speedTxt) speedTxt.textContent = 'Speed';
      if (convergenceTitle) convergenceTitle.textContent = 'Convergence chart';
      if (bFATitle) bFATitle.textContent = 'Firefly Swarm';
      if (bBATitle) bBATitle.textContent = 'Bat Legion';
      if (lFABest) lFABest.textContent = 'Best:';
      if (lFAIter) lFAIter.textContent = 'Round:';
      if (lBABest) lBABest.textContent = 'Best:';
      if (lBAIter) lBAIter.textContent = 'Round:';
      if (lFACount) lFACount.textContent = 'Units:';
      if (lBACount) lBACount.textContent = 'Units:';
      if (lBAFmax) lBAFmax.textContent = 'Max frequency:';
      if (faPopulationTxt) faPopulationTxt.textContent = 'Firefly population';
      if (baPopulationTxt) baPopulationTxt.textContent = 'Bat population';
      if (fmaxTxt) fmaxTxt.textContent = 'Maximum frequency fₘₐₓ';
      if (agentHint) agentHint.textContent = this.selectedAgent
        ? `${this.selectedAgent.type === 'fa' ? 'Firefly' : 'Bat'} #${this.selectedAgent.index + 1} · drag to move`
        : 'Select a unit, then drag to move it';
      if (agentDelete) agentDelete.textContent = '🪓 Destroy unit';
      if (faImprovement) faImprovement.textContent = 'Fitness improvement';
      if (baImprovement) baImprovement.textContent = 'Fitness improvement';
      if (faPosition) faPosition.textContent = 'Best coordinates';
      if (baPosition) baPosition.textContent = 'Best coordinates';
      if (faEvaluations) faEvaluations.textContent = 'Function evaluations';
      if (baEvaluations) baEvaluations.textContent = 'Function evaluations';
    }
  }
}
