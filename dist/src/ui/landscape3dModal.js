/**
 * Landscape3DModal: Visualisasi Medan 3D Interaktif (Three.js) Bergaya Age of Empires & Sky Optimizers.
 * Menampilkan dua potongan blok bumi (geological strata cake chunks) dengan topografi halus (non-low-poly),
 * model 3D Firefly (bercahaya dinamis + kepak sayap) dan Bat (sayap mengepak + pulsa sonar echo),
 * serta perspektif Isometrik ala AoE dan Bird's Eye tactical view.
 */

import * as THREE from '../vendor/three.module.js';
import { landscapeById } from '../core/landscapes.js';
import { FAEngine } from '../algorithms/firefly.js';
import { BAEngine } from '../algorithms/bat.js';
import { sound } from '../core/sound.js';

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
    this.faBestMarker = null;
    this.baBestMarker = null;
    this.sonarRings = [];
    this.sparkTrails = [];

    // Kamera Orbit & Preset Angles
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.cameraAngle = { theta: Math.PI * 0.25, phi: Math.PI * 0.34, radius: 245 };
    this.targetAngle = { ...this.cameraAngle };
    this.cameraTarget = new THREE.Vector3(0, -4, 0);

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
            <h2 class="sky-main-title" id="sky-title-text">Sky Optimizers 3D</h2>
            <small class="sky-sub-title" id="sky-sub-text">Dua Cara Menemukan Lembah Terendah: Ordo Kunang-Kunang vs Legiun Kelelawar</small>
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
            <button type="button" id="sky-toggle-rotate" class="sky-icon-btn" title="Putar Kamera Otomatis">🎥 Orbit</button>
            <button type="button" id="sky-btn-close" class="sky-icon-btn close-btn" title="Tutup Tampilan 3D">&times;</button>
          </div>
        </header>

        <!-- AREA KANVAS 3D THREE.JS -->
        <div class="sky-canvas-container" id="sky-canvas-wrap">
          <canvas id="sky-webgl-canvas"></canvas>

          <!-- KARTU STATUS MENGAMBANG DENGAN AVATAR HEWAN ASLI -->
          <div class="sky-floating-badge badge-left" id="badge-fa">
            <div class="badge-avatar">${SVG_FIREFLY}</div>
            <div class="badge-info">
              <div class="badge-title-row">
                <b id="badge-fa-title">Ordo Kunang-Kunang</b>
                <span class="badge-tag fa-tag">FA</span>
              </div>
              <div class="badge-metrics">
                <div><small id="lbl-fa-best">Terbaik:</small> <b id="fa-val-best">0.000</b></div>
                <div><small id="lbl-fa-iter">Iterasi:</small> <b id="fa-val-iter">0 / 60</b></div>
                <div><small id="lbl-fa-beta">Daya Tarik β:</small> <b id="fa-val-beta">1.00</b></div>
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
              <div class="badge-metrics">
                <div><small id="lbl-ba-best">Terbaik:</small> <b id="ba-val-best">0.000</b></div>
                <div><small id="lbl-ba-iter">Iterasi:</small> <b id="ba-val-iter">0 / 60</b></div>
                <div><small id="lbl-ba-loud">Kelantangan A:</small> <b id="ba-val-loud">0.50</b></div>
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

            <div class="sky-speed-slider">
              <small id="sky-speed-txt">Kecepatan:</small>
              <input type="range" id="sky-speed-input" min="0.5" max="3" step="0.5" value="1" />
              <b id="sky-speed-label">1.0x</b>
            </div>

            <div class="sky-sparkline-wrap">
              <small id="sky-spark-txt">Konvergensi:</small>
              <canvas id="sky-sparkline-cv" width="220" height="34"></canvas>
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
    this.scene.background = new THREE.Color(0xf6f1e8); // Latar hangat pastel lembut khas Screenshot 3

    // Kamera Low-FOV untuk perspektif isometrik RTS tanpa distorsi
    const aspect = 1780 / 620;
    this.camera = new THREE.PerspectiveCamera(30, aspect, 1, 1500);
    this.#updateCameraPosition();

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Pencahayaan
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.82);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7e6, 1.25);
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

    const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.45);
    fillLight.position.set(-160, 120, -120);
    this.scene.add(fillLight);

    // Awan Melayang 3D di Latar
    this.#createClouds();
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
  // 5. PEMBUATAN MEDAN HALUS & KUE BATUAN SEDIMEN (NON-LOW-POLY)
  // ==========================================================================
  #buildTerrainChunks() {
    if (this.faChunkGroup) this.scene.remove(this.faChunkGroup);
    if (this.baChunkGroup) this.scene.remove(this.baChunkGroup);

    const obj = landscapeById(this.currentObjId);
    const size = 80;
    const segments = 84; // Resolusi tinggi dan halus, tidak kaku/low-poly
    const baseDepth = 26;

    // 1. Chunk Padang Rumput Hijau (Firefly - Sisi Kiri)
    this.faChunkGroup = this.#createRefinedChunkMesh(obj, size, segments, baseDepth, 'grass');
    this.faChunkGroup.position.set(-68, 0, 0);
    this.scene.add(this.faChunkGroup);

    // 2. Chunk Ngarai Batu Terakota (Bat - Sisi Kanan)
    this.baChunkGroup = this.#createRefinedChunkMesh(obj, size, segments, baseDepth, 'canyon');
    this.baChunkGroup.position.set(68, 0, 0);
    this.scene.add(this.baChunkGroup);

    // 3. Marker Pemimpin Terbaik
    this.faBestMarker = this.#createLeaderBeacon(0x06b6d4);
    this.faChunkGroup.add(this.faBestMarker);

    this.baBestMarker = this.#createLeaderBeacon(0xa855f7);
    this.baChunkGroup.add(this.baBestMarker);

    // 4. Bangun Hewan 3D Asli & Sistem FX
    this.#initCreatureMeshes();
    this.#initFXSystems();
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

    // A. 20 Kunang-Kunang Berbentuk Serangga Beetle dengan Lantern Bercahaya
    for (let i = 0; i < 20; i++) {
      const m = this.#buildFireflyCreature(i);
      this.faChunkGroup.add(m);
      this.faCreatures.push(m);
    }

    // B. 20 Kelelawar dengan Sayap Mengepak & Telinga Radar Echolocation
    for (let i = 0; i < 20; i++) {
      const m = this.#buildBatCreature(i);
      this.baChunkGroup.add(m);
      this.baCreatures.push(m);
    }
  }

  #buildFireflyCreature(index) {
    const group = new THREE.Group();

    // 1. Kepala & Antena
    const headGeom = new THREE.SphereGeometry(0.55, 10, 10);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.3 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.set(0, 0, 1.05);
    group.add(head);

    const antMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    [-0.24, 0.24].forEach((xOff) => {
      const antGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.75, 6);
      antGeom.rotateX(Math.PI / 4);
      const ant = new THREE.Mesh(antGeom, antMat);
      ant.position.set(xOff, 0.35, 1.35);
      group.add(ant);
    });

    // 2. Badan / Thorax Chitin
    const thoraxGeom = new THREE.CapsuleGeometry(0.65, 0.5, 8, 8);
    thoraxGeom.rotateX(Math.PI / 2);
    const thoraxMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4, metalness: 0.2 });
    const thorax = new THREE.Mesh(thoraxGeom, thoraxMat);
    thorax.position.set(0, 0, 0.3);
    group.add(thorax);

    // 3. Abdomen Lantern (Bioluminesensi Bercahaya Terang)
    const bulbGeom = new THREE.SphereGeometry(0.85, 14, 14);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 1.25,
      roughness: 0.2
    });
    const bulb = new THREE.Mesh(bulbGeom, bulbMat);
    bulb.position.set(0, -0.1, -0.9);
    group.add(bulb);
    group.userData.bulb = bulb;

    // Sumber Cahaya Nyata yang Menyinari Tanah di Bawahnya
    const light = new THREE.PointLight(0xfacc15, 0.75, 14);
    light.position.set(0, -0.2, -0.9);
    group.add(light);
    group.userData.light = light;

    // 4. Sayap Transparan yang Mengepak
    const wingGeom = new THREE.PlaneGeometry(1.5, 0.7);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.68,
      side: THREE.DoubleSide,
      roughness: 0.2
    });

    const wingL = new THREE.Mesh(wingGeom, wingMat);
    wingL.position.set(-0.7, 0.3, 0.1);
    wingL.rotation.x = -Math.PI / 2;
    group.add(wingL);

    const wingR = new THREE.Mesh(wingGeom, wingMat);
    wingR.position.set(0.7, 0.3, 0.1);
    wingR.rotation.x = -Math.PI / 2;
    group.add(wingR);

    group.userData.wingLeft = wingL;
    group.userData.wingRight = wingR;
    group.userData.animOffset = index * 0.7;

    return group;
  }

  #buildBatCreature(index) {
    const group = new THREE.Group();

    // 1. Badan Aerodinamis Berbulu Ungu Gelap
    const bodyGeom = new THREE.CapsuleGeometry(0.75, 1.1, 8, 8);
    bodyGeom.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.7, metalness: 0.1 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    group.add(body);

    // 2. Kepala dengan Moncong & Mata
    const headGeom = new THREE.SphereGeometry(0.62, 10, 10);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.6 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.set(0, 0.15, 1.0);
    group.add(head);

    const snoutGeom = new THREE.ConeGeometry(0.28, 0.45, 6);
    snoutGeom.rotateX(Math.PI / 2);
    const snout = new THREE.Mesh(snoutGeom, headMat);
    snout.position.set(0, 0.05, 1.5);
    group.add(snout);

    // Telinga Kelelawar Meruncing (Radar Echolocation)
    const earMat = new THREE.MeshStandardMaterial({ color: 0xc084fc, roughness: 0.5 });
    [-0.32, 0.32].forEach((xOff, i) => {
      const earGeom = new THREE.ConeGeometry(0.3, 0.9, 4);
      earGeom.scale(0.5, 1, 1);
      const ear = new THREE.Mesh(earGeom, earMat);
      ear.position.set(xOff, 0.65, 0.9);
      ear.rotation.z = i === 0 ? 0.25 : -0.25;
      group.add(ear);
    });

    // 3. Sayap Berselaput Mengepak (Articulated Bat Wings)
    const makeBatWing = (isLeft) => {
      const wGroup = new THREE.Group();
      const geom = new THREE.BufferGeometry();
      const s = isLeft ? -1 : 1;
      const verts = new Float32Array([
        0, 0, 0.3,
        s * 2.2, 0.2, 0.8,
        s * 1.6, -0.1, -0.6,

        s * 2.2, 0.2, 0.8,
        s * 3.6, 0.1, 0.2,
        s * 2.9, -0.1, -0.9,

        s * 2.2, 0.2, 0.8,
        s * 2.9, -0.1, -0.9,
        s * 1.6, -0.1, -0.6
      ]);
      geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geom.computeVertexNormals();

      const wMat = new THREE.MeshStandardMaterial({
        color: 0x4c1d95,
        roughness: 0.55,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geom, wMat);
      wGroup.add(mesh);
      return wGroup;
    };

    const wingL = makeBatWing(true);
    wingL.position.set(-0.5, 0.1, 0.2);
    group.add(wingL);

    const wingR = makeBatWing(false);
    wingR.position.set(0.5, 0.1, 0.2);
    group.add(wingR);

    group.userData.wingLeft = wingL;
    group.userData.wingRight = wingR;
    group.userData.animOffset = index * 0.8;

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
      populationSize: 20,
      maxIterations: this.maxIterations,
      seed: 42
    };

    this.faEngine = new FAEngine({ ...cfg, beta0: 1.0, gamma: 1.5, alpha: 0.25 });
    this.baEngine = new BAEngine({ ...cfg, fMin: 0, fMax: 2, loudness0: 0.5, pulseRate0: 0.5 });

    this.#buildTerrainChunks();
    this.#syncSwarmPositions();
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

      if (faSt.best) this.historyFA.push(faSt.best.fitness);
      if (baSt.best) this.historyBA.push(baSt.best.fitness);

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
    const zScale = 22;
    const maxV = obj.maxVisualValue || 50;

    const u = (xNorm - obj.min) / (obj.max - obj.min);
    const v = (yNorm - obj.min) / (obj.max - obj.min);
    const x = -half + u * 80;
    const z = -half + v * 80;
    const zVal = obj.evaluate(xNorm, yNorm);
    const zNorm = Math.min(1.2, Math.max(0, zVal / maxV));
    const y = zNorm * zScale;
    return { x, y, z };
  }

  #syncSwarmPositions() {
    const faSt = this.faEngine.getState();
    const baSt = this.baEngine.getState();

    // Kunang-Kunang
    if (faSt.agents) {
      faSt.agents.forEach((ind, i) => {
        const m = this.faCreatures[i];
        if (!m) return;
        const p = this.#to3D(ind.x[0], ind.x[1]);
        m.position.set(p.x, p.y + 2.0, p.z);
      });
    }

    // Marker Terbaik FA
    if (faSt.best) {
      const faBestP = this.#to3D(faSt.best.x[0], faSt.best.x[1]);
      this.faBestMarker?.position.set(faBestP.x, faBestP.y, faBestP.z);
    }

    // Kelelawar
    if (baSt.agents) {
      baSt.agents.forEach((ind, i) => {
        const m = this.baCreatures[i];
        if (!m) return;
        const p = this.#to3D(ind.x[0], ind.x[1]);
        m.position.set(p.x, p.y + 2.6, p.z);
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

      // 2. Animasi Marker Pemimpin
      if (this.faBestMarker?.userData?.gem) this.faBestMarker.userData.gem.rotation.y += 0.035;
      if (this.baBestMarker?.userData?.gem) this.baBestMarker.userData.gem.rotation.y -= 0.035;

      // 3. Animasi Kunang-Kunang: Cahaya Berdenyut + Kepakan Sayap
      this.faCreatures.forEach((c) => {
        const off = c.userData.animOffset || 0;
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
      this.targetAngle = { theta: Math.PI * 0.25, phi: Math.PI * 0.34, radius: 245 };
      this.cameraTarget.set(0, -4, 0);
    } else if (pov === 'bird') {
      // Bird's Eye View (Overhead tegak lurus melihat medan & kontur dari langit)
      this.targetAngle = { theta: 0, phi: 0.05, radius: 260 };
      this.cameraTarget.set(0, 0, 0);
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
        if (narFA) narFA.innerHTML = `<b>Kunang-Kunang: ① Ukur.</b> Menghitung intensitas cahaya lantern <i>I</i> = fitness pada ketinggian medan. Lembah terendah tampak paling terang.`;
        if (narBA) narBA.innerHTML = `<b>Kelelawar: ① Ukur.</b> Memancarkan pulsa sonar ultrasonik frekuensi <i>f</i>. Mengukur pantulan gema echo dari kontur medan terdekat.`;
      } else if (this.stepPhase === 2) {
        if (narFA) narFA.innerHTML = `<b>Kunang-Kunang: ② Tentukan.</b> Menghitung daya tarik β(r) = β₀ e^(-γ r²). Yang lebih redup menentukan arah terbang menuju kunang-kunang yang lebih benderang.`;
        if (narBA) narBA.innerHTML = `<b>Kelelawar: ② Tentukan.</b> Mengevaluasi kelantangan <i>A</i> dan frekuensi pulsa <i>r</i>. Jika rand > r, lakukan penelusuran lokal eksploitasi pemimpin <i>x*</i>.`;
      } else {
        if (narFA) narFA.innerHTML = `<b>Kunang-Kunang: ③ Gerak.</b> Mengepakkan sayap meluncur ke arah cahaya + langkah acak kecil α(rand - 0.5) untuk menghindari jebakan lokal.`;
        if (narBA) narBA.innerHTML = `<b>Kelelawar: ③ Gerak.</b> Meluncur cepat memperbarui kecepatan <i>v</i> dan posisi <i>x</i> menuju pemimpin <i>x*</i>. Pulsa echo memverifikasi solusi baru.`;
      }
    } else {
      if (this.stepPhase === 1) {
        if (narFA) narFA.innerHTML = `<b>Firefly: ① Measure.</b> Measuring lantern brightness <i>I</i> = fitness across terrain. Deeper valleys glow brighter.`;
        if (narBA) narBA.innerHTML = `<b>Bat: ① Measure.</b> Emitting ultrasonic sonar pulses <i>f</i>. Reading acoustic echoes bouncing off topography.`;
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

    this.#drawSparkline();
  }

  #drawSparkline() {
    const cv = this.modal.querySelector('#sky-sparkline-cv');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const w = cv.width;
    const h = cv.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0, 0, w, h);

    if (this.historyFA.length < 2) return;

    const maxVal = Math.max(...this.historyFA, ...this.historyBA, 1);
    const n = this.maxIterations;

    // FA (Cyan)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    this.historyFA.forEach((val, i) => {
      const x = (i / n) * w;
      const y = h - (val / maxVal) * (h - 6) - 3;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // BA (Ungu)
    ctx.strokeStyle = '#9333ea';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    this.historyBA.forEach((val, i) => {
      const x = (i / n) * w;
      const y = h - (val / maxVal) * (h - 6) - 3;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // ==========================================================================
  // 11. EVENT LISTENERS
  // ==========================================================================
  #bindEvents() {
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

    // 9. Kontrol Mouse Drag untuk Rotasi Kamera Bebas
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;
      this.prevMouse = { x: e.clientX, y: e.clientY };

      this.targetAngle.theta -= dx * 0.0075;
      this.targetAngle.phi = Math.max(0.04, Math.min(Math.PI * 0.48, this.targetAngle.phi - dy * 0.0075));
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Zoom Scroll Wheel
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.targetAngle.radius = Math.max(120, Math.min(380, this.targetAngle.radius + e.deltaY * 0.22));
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
    const sparkTxt = this.modal.querySelector('#sky-spark-txt');
    const bFATitle = this.modal.querySelector('#badge-fa-title');
    const bBATitle = this.modal.querySelector('#badge-ba-title');
    const lFABest = this.modal.querySelector('#lbl-fa-best');
    const lFAIter = this.modal.querySelector('#lbl-fa-iter');
    const lBABest = this.modal.querySelector('#lbl-ba-best');
    const lBAIter = this.modal.querySelector('#lbl-ba-iter');

    if (isID) {
      if (titleText) titleText.textContent = 'Sky Optimizers 3D';
      if (subText) subText.textContent = 'Dua Cara Menemukan Lembah Terendah: Ordo Kunang-Kunang vs Legiun Kelelawar';
      if (step1) step1.textContent = '① Ukur (Measure)';
      if (step2) step2.textContent = '② Tentukan (Decide)';
      if (step3) step3.textContent = '③ Gerak (Move)';
      if (speedTxt) speedTxt.textContent = 'Kecepatan:';
      if (sparkTxt) sparkTxt.textContent = 'Konvergensi:';
      if (bFATitle) bFATitle.textContent = 'Ordo Kunang-Kunang';
      if (bBATitle) bBATitle.textContent = 'Legiun Kelelawar';
      if (lFABest) lFABest.textContent = 'Terbaik:';
      if (lFAIter) lFAIter.textContent = 'Iterasi:';
      if (lBABest) lBABest.textContent = 'Terbaik:';
      if (lBAIter) lBAIter.textContent = 'Iterasi:';
    } else {
      if (titleText) titleText.textContent = 'Sky Optimizers 3D';
      if (subText) subText.textContent = 'Two Ways to Find the Lowest Valley: Firefly Swarm vs Bat Legion';
      if (step1) step1.textContent = '① Measure';
      if (step2) step2.textContent = '② Decide';
      if (step3) step3.textContent = '③ Move';
      if (speedTxt) speedTxt.textContent = 'Speed:';
      if (sparkTxt) sparkTxt.textContent = 'Convergence:';
      if (bFATitle) bFATitle.textContent = 'Firefly Swarm';
      if (bBATitle) bBATitle.textContent = 'Bat Legion';
      if (lFABest) lFABest.textContent = 'Best:';
      if (lFAIter) lFAIter.textContent = 'Round:';
      if (lBABest) lBABest.textContent = 'Best:';
      if (lBAIter) lBAIter.textContent = 'Round:';
    }
  }
}
