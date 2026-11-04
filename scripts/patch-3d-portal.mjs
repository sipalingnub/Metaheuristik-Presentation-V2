import fs from 'node:fs';

let code = fs.readFileSync('public/app.bundle.js', 'utf8');

const PORTAL_CLASS_DEF = `
  var PORTALS_DATA = [
    {
      id: "firefly",
      title: "Firefly Algorithm 3D",
      author: "Simulasi Bioluminesensi Swarm (Raraa17)",
      desc: "Visualisasi 3D interaktif algoritma kunang-kunang. Mengamati dinamika pancaran intensitas cahaya, penyerapan medan, dan fenomena daya tarik visual antar agen.",
      badge: "WebGL \\xB7 Eksternal",
      badgeClass: "badge-firefly",
      icon: "\\u{1F4A1}",
      glowClass: "halo-firefly",
      highlights: [
        "Visualisasi intensitas cahaya & daya tarik \\u03B2(r)",
        "Swarm kunang-kunang bergerak 3D dinamis",
        "Kontrol simulasi & parameter interaktif"
      ],
      url: "https://raraa17.github.io/firefly-algorithm/",
      btnText: "Buka Simulasi Firefly",
      isExternal: true
    },
    {
      id: "bat",
      title: "Dunia Baty 3D",
      author: "Bat Algorithm Echolocation Swarm (Ninduyi)",
      desc: "Dunia Baty 3D \\u2014 Simulasi kawanan kelelawar dengan biosonar echolocation. Menampilkan emisi pulsa ultrasonik, radar deteksi, dan variasi kenyaringan berburu mangsa.",
      badge: "Three.js \\xB7 Eksternal",
      badgeClass: "badge-bat",
      icon: "\\u{1F987}",
      glowClass: "halo-bat",
      highlights: [
        "Biosonar radar & gelombang echolocation",
        "Dinamika frekuensi pulsa fi & kenyaringan Ai",
        "Pelacakan target mangsa dalam ruang 3D"
      ],
      url: "https://ninduyi.github.io/tes/",
      btnText: "Buka Dunia Baty 3D",
      isExternal: true
    },
    {
      id: "builtin",
      title: "Medan Komparasi 3D",
      author: "Perbandingan Head-to-Head (Bawaan)",
      desc: "Simulasi komparasi langsung Firefly vs Bat berdampingan pada medan matematis Rastrigin, Ackley, dan Sphere dengan grafik konvergensi analitik dan kamera orbit 360\\xB0.",
      badge: "Built-in \\xB7 Three.js",
      badgeClass: "badge-builtin",
      icon: "\\u{1F3D4}\\uFE0F",
      glowClass: "halo-builtin",
      highlights: [
        "Duel FA vs BA berdampingan di satu medan",
        "Uji coba fungsi Rastrigin, Ackley, Sphere",
        "Kamera Isometrik / Bird-Eye & grafik makespan"
      ],
      url: null,
      btnText: "Masuk Medan 3D Bawaan",
      isExternal: false
    }
  ];
  var Landscape3DChooserModal = class {
    constructor(options = {}) {
      this.modal = null;
      this.onSelectBuiltIn = options.onSelectBuiltIn || (() => {});
    }
    mount(root) {
      if (this.modal) return;
      const el = document.createElement("div");
      el.id = "aoe-3d-chooser-modal";
      el.className = "aoe-modal-backdrop hidden";
      el.setAttribute("role", "dialog");
      el.setAttribute("aria-label", "Portal Pemilih Visualisasi 3D");
      root.appendChild(el);
      this.modal = el;
      this.render();
      this.bind();
    }
    open() {
      if (!this.modal) return;
      this.modal.classList.remove("hidden");
      sound.playHorn();
    }
    close() {
      if (!this.modal) return;
      this.modal.classList.add("hidden");
      sound.playClick();
    }
    toggle() {
      if (this.modal?.classList.contains("hidden")) {
        this.open();
      } else {
        this.close();
      }
    }
    render() {
      this.modal.innerHTML = \`
        <div class="aoe-chooser-window">
          <header class="aoe-chooser-header">
            <div class="aoe-chooser-title-wrap">
              <span class="aoe-chooser-icon">\\u{1F3D4}\\uFE0F</span>
              <div>
                <h2 class="aoe-chooser-title">PORTAL VISUALISASI MEDAN 3D</h2>
                <p class="aoe-chooser-subtitle">Pilih dunia simulasi 3D interaktif yang ingin Anda jelajahi:</p>
              </div>
            </div>
            <button type="button" class="aoe-stone-btn close-btn" id="btn-close-3d-chooser" title="Tutup (ESC)">&times;</button>
          </header>

          <div class="aoe-chooser-body">
            <div class="aoe-3d-grid">
              \${PORTALS_DATA.map((portal) => \`
                <div class="aoe-3d-card card-\${portal.id}" data-portal-id="\${portal.id}" tabindex="0" role="button" aria-label="\${portal.title}">
                  <div class="card-badge \${portal.badgeClass}">\${portal.badge}</div>
                  <div class="card-icon-halo \${portal.glowClass}">
                    <span class="card-icon">\${portal.icon}</span>
                  </div>
                  <h3 class="card-title">\${portal.title}</h3>
                  <p class="card-author">\${portal.author}</p>
                  <p class="card-desc">\${portal.desc}</p>
                  <ul class="card-highlights">
                    \${portal.highlights.map((h) => \`<li><span class="hl-dot">\\u2726</span> \${h}</li>\`).join("")}
                  </ul>
                  <div class="card-action-wrap">
                    \${portal.isExternal ? \`
                      <a href="\${portal.url}" target="_blank" rel="noopener noreferrer" class="card-action-btn btn-action-\${portal.id}" tabindex="-1">
                        <span>\${portal.btnText}</span>
                        <svg viewBox="0 0 24 24" class="ext-icon" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </a>
                    \` : \`
                      <button type="button" class="card-action-btn btn-action-\${portal.id}" tabindex="-1">
                        <span>\${portal.btnText}</span>
                        <span class="play-arrow" aria-hidden="true">\\u25B6</span>
                      </button>
                    \`}
                  </div>
                </div>
              \`).join("")}
            </div>
          </div>

          <footer class="aoe-chooser-footer">
            <div class="footer-tip">
              <kbd>ESC</kbd> untuk menutup \\xB7 Simulasi eksternal dibuka di tab baru agar jalannya presentasi tidak terganggu.
            </div>
          </footer>
        </div>
      \`;
    }
    bind() {
      const closeBtn = this.modal.querySelector("#btn-close-3d-chooser");
      closeBtn?.addEventListener("click", () => this.close());
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) this.close();
      });
      const cards = this.modal.querySelectorAll(".aoe-3d-card");
      cards.forEach((card) => {
        const portalId = card.getAttribute("data-portal-id");
        const portal = PORTALS_DATA.find((p) => p.id === portalId);
        if (!portal) return;
        const triggerPortal = (event) => {
          if (event.target.closest("a")) {
            sound.playClick();
            return;
          }
          sound.playClick();
          if (portal.isExternal) {
            window.open(portal.url, "_blank", "noopener,noreferrer");
          } else {
            this.close();
            this.onSelectBuiltIn();
          }
        };
        card.addEventListener("click", triggerPortal);
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            triggerPortal(e);
          }
        });
      });
    }
  };
`;

const isCRLF = code.includes('\r\n');
let norm = code.replace(/\r\n/g, '\n');

// 1. Insert PORTAL_CLASS_DEF before `var _AoEHud_instances`
const targetAoE = `  var _AoEHud_instances, updateEraBanner_fn`;
if (!norm.includes(targetAoE)) {
  console.error('Target AoEHud instances not found!');
  process.exit(1);
}
norm = norm.replace(targetAoE, PORTAL_CLASS_DEF + '\n' + targetAoE);

// 2. In AoEHud constructor, instantiate landscapeChooser
const targetConstructor = `      this.landscape3d = new Landscape3DModal();`;
const replaceConstructor = `      this.landscape3d = new Landscape3DModal();\n      this.landscapeChooser = new Landscape3DChooserModal({\n        onSelectBuiltIn: (opt) => this.landscape3d.open(opt)\n      });`;
norm = norm.replace(targetConstructor, replaceConstructor);

// 3. In AoEHud.mount, mount landscapeChooser
const targetMount = `      this.landscape3d.mount(frameEl);`;
const replaceMount = `      this.landscape3d.mount(frameEl);\n      this.landscapeChooser.mount(frameEl);`;
norm = norm.replace(targetMount, replaceMount);

// 4. In Presenter, spine-3d click opens landscapeChooser
const targetSpine3D = `      } else if (e.target.closest("#spine-3d")) {\n        this.aoeHud?.landscape3d?.open();`;
const replaceSpine3D = `      } else if (e.target.closest("#spine-3d")) {\n        this.aoeHud?.landscapeChooser?.open();`;
norm = norm.replace(targetSpine3D, replaceSpine3D);

// 5. In Presenter, escape closes landscapeChooser
const targetEscape = `      this.aoeHud?.landscape3d?.close();`;
const replaceEscape = `      this.aoeHud?.landscapeChooser?.close();\n      this.aoeHud?.landscape3d?.close();`;
norm = norm.replace(targetEscape, replaceEscape);

// 6. In Presenter, shortcut key 3 / l toggles landscapeChooser
const targetKey3 = `else if (key === "3" || key === "l") run(() => this.aoeHud?.landscape3d?.toggle());`;
const replaceKey3 = `else if (key === "3" || key === "l") run(() => this.aoeHud?.landscapeChooser?.toggle());`;
norm = norm.replace(targetKey3, replaceKey3);

// 7. In console.js 3d button
const targetConsole = `$2(\`#\${id}-3d-btn\`)?.addEventListener("click", () => {\n      window.__aoeHud?.landscape3d?.open(landscape2.id);\n    });`;
const replaceConsole = `$2(\`#\${id}-3d-btn\`)?.addEventListener("click", () => {\n      window.__aoeHud?.landscapeChooser?.open();\n    });`;
norm = norm.replace(targetConsole, replaceConsole);

// 8. In Landscape3DModal header, add sky-btn-portal
const targetHeader = `<button type="button" id="sky-toggle-rotate" class="sky-icon-btn" title="Putar Kamera Otomatis">\\u{1F3A5} Orbit</button>`;
const replaceHeader = `<button type="button" id="sky-btn-portal" class="sky-icon-btn" title="Pilih Visualisasi 3D Lain (Firefly / Bat)">\\u{1F310} Portal 3D</button>\n            <button type="button" id="sky-toggle-rotate" class="sky-icon-btn" title="Putar Kamera Otomatis">\\u{1F3A5} Orbit</button>`;
norm = norm.replace(targetHeader, replaceHeader);

// 9. In Landscape3DModal bind, bind sky-btn-portal
const targetBindClose = `this.modal.querySelector("#sky-btn-close")?.addEventListener("click", () => this.close());`;
const replaceBindClose = `this.modal.querySelector("#sky-btn-portal")?.addEventListener("click", () => {\n      this.close();\n      window.__aoeHud?.landscapeChooser?.open();\n    });\n    this.modal.querySelector("#sky-btn-close")?.addEventListener("click", () => this.close());`;
norm = norm.replace(targetBindClose, replaceBindClose);

if (isCRLF) {
  norm = norm.replace(/\n/g, '\r\n');
}

fs.writeFileSync('public/app.bundle.js', norm, 'utf8');
console.log('Successfully patched public/app.bundle.js with Landscape3DChooserModal!');

// Copy to dist
fs.copyFileSync('public/app.bundle.js', 'dist/public/app.bundle.js');
console.log('Successfully synced to dist/public/app.bundle.js!');

// Copy src to dist/src
fs.cpSync('src', 'dist/src', { recursive: true });
console.log('Successfully synced src to dist/src!');

