import fs from 'node:fs';

// 1. Update src/styles/aoe.css
let aoeCss = fs.readFileSync('src/styles/aoe.css', 'utf8');
const cssMarker = '/* --------------------------------------------------------------------------\n   PORTAL PEMILIH VISUALISASI 3D (CHOOSER MODAL)\n   -------------------------------------------------------------------------- */';

const newCss = `/* --------------------------------------------------------------------------
   PORTAL PEMILIH VISUALISASI 3D (CHOOSER MODAL)
   -------------------------------------------------------------------------- */
.aoe-chooser-window {
  width: 1040px;
  max-width: 94vw;
  background: radial-gradient(120% 120% at 50% 0%, #151d32 0%, #0a0e1a 100%);
  border: 2px solid #8a6d1d;
  border-radius: 18px;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.95), 0 0 50px rgba(138, 109, 29, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: aoeChooserPop 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes aoeChooserPop {
  from {
    opacity: 0;
    transform: scale(0.94) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.aoe-chooser-header {
  padding: 18px 28px;
  background: linear-gradient(180deg, rgba(36, 47, 71, 0.95) 0%, rgba(20, 27, 44, 0.85) 100%);
  border-bottom: 2px solid rgba(138, 109, 29, 0.6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.aoe-chooser-title-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.aoe-chooser-icon {
  font-size: 32px;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
}

.aoe-chooser-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #f1f5f9;
  font-family: var(--font-heading, inherit);
  background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.aoe-chooser-body {
  padding: 32px 28px;
}

.aoe-3d-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.aoe-3d-card {
  position: relative;
  background: rgba(15, 23, 42, 0.75);
  border: 1.5px solid rgba(148, 163, 184, 0.15);
  border-radius: 18px;
  padding: 34px 22px 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  outline: none;
  backdrop-filter: blur(8px);
}

.aoe-3d-card:hover,
.aoe-3d-card:focus-visible {
  transform: translateY(-6px);
}

/* Card Firefly */
.aoe-3d-card.card-firefly:hover,
.aoe-3d-card.card-firefly:focus-visible {
  border-color: #06b6d4;
  background: rgba(8, 51, 68, 0.45);
  box-shadow: 0 16px 36px rgba(6, 182, 212, 0.25), 0 0 24px rgba(6, 182, 212, 0.2);
}

/* Card Bat */
.aoe-3d-card.card-bat:hover,
.aoe-3d-card.card-bat:focus-visible {
  border-color: #a855f7;
  background: rgba(59, 7, 100, 0.45);
  box-shadow: 0 16px 36px rgba(168, 85, 247, 0.25), 0 0 24px rgba(168, 85, 247, 0.2);
}

/* Card Built-in */
.aoe-3d-card.card-builtin:hover,
.aoe-3d-card.card-builtin:focus-visible {
  border-color: #eab308;
  background: rgba(66, 32, 6, 0.45);
  box-shadow: 0 16px 36px rgba(234, 179, 8, 0.25), 0 0 24px rgba(234, 179, 8, 0.2);
}

.card-icon-halo {
  width: 82px;
  height: 82px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 40px;
  margin-bottom: 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.05);
}

.halo-firefly {
  background: radial-gradient(circle, rgba(14, 116, 144, 0.8) 0%, rgba(8, 47, 73, 0.4) 100%);
  border-color: rgba(6, 182, 212, 0.4);
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.35);
}

.halo-bat {
  background: radial-gradient(circle, rgba(76, 29, 149, 0.8) 0%, rgba(30, 27, 75, 0.4) 100%);
  border-color: rgba(168, 85, 247, 0.4);
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.35);
}

.halo-builtin {
  background: radial-gradient(circle, rgba(138, 109, 29, 0.8) 0%, rgba(20, 27, 44, 0.4) 100%);
  border-color: rgba(234, 179, 8, 0.4);
  box-shadow: 0 0 20px rgba(234, 179, 8, 0.35);
}

.card-title {
  margin: 0 0 28px;
  font-size: 20px;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1.3;
}

.card-action-wrap {
  width: 100%;
  margin-top: auto;
}

.card-action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 20px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  text-decoration: none;
  box-sizing: border-box;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.ext-icon {
  width: 16px;
  height: 16px;
}

.play-arrow {
  font-size: 12px;
}

.btn-action-firefly {
  background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
  color: #ffffff;
  border-color: #22d3ee;
  box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3);
}

.btn-action-firefly:hover {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.5);
}

.btn-action-bat {
  background: linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%);
  color: #ffffff;
  border-color: #c084fc;
  box-shadow: 0 4px 14px rgba(168, 85, 247, 0.3);
}

.btn-action-bat:hover {
  background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5);
}

.btn-action-builtin {
  background: linear-gradient(135deg, #ca8a04 0%, #a16207 100%);
  color: #ffffff;
  border-color: #fde047;
  box-shadow: 0 4px 14px rgba(234, 179, 8, 0.3);
}

.btn-action-builtin:hover {
  background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
  box-shadow: 0 6px 20px rgba(234, 179, 8, 0.5);
}

.aoe-chooser-footer {
  padding: 14px 28px;
  background: rgba(10, 14, 26, 0.85);
  border-top: 1px solid rgba(138, 109, 29, 0.3);
  text-align: center;
}

.footer-tip {
  font-size: 12px;
  color: #64748b;
}

.footer-tip kbd {
  background: #1e293b;
  color: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #334155;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}

@media (max-width: 900px) {
  .aoe-3d-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
`;

// Replace from cssMarker to end of file
const normAoe = aoeCss.replace(/\r\n/g, '\n');
const normMarker = cssMarker.replace(/\r\n/g, '\n');
const markerIdx = normAoe.indexOf(normMarker);
if (markerIdx === -1) {
  console.error('CSS marker not found!');
  process.exit(1);
}
const updatedCss = normAoe.substring(0, markerIdx) + newCss;
fs.writeFileSync('src/styles/aoe.css', updatedCss, 'utf8');
console.log('Updated src/styles/aoe.css!');

// 2. Update public/app.bundle.js
let bundle = fs.readFileSync('public/app.bundle.js', 'utf8');

const OLD_MODAL_DEF_START = '  var PORTALS_DATA = [';
const OLD_MODAL_DEF_END = '  var _AoEHud_instances, updateEraBanner_fn';

const NEW_MODAL_DEF = `  var PORTALS_DATA = [
    {
      id: "firefly",
      title: "Firefly Algorithm 3D",
      icon: "\\u{1F4A1}",
      glowClass: "halo-firefly",
      url: "https://raraa17.github.io/firefly-algorithm/",
      btnText: "Buka Simulasi",
      isExternal: true
    },
    {
      id: "bat",
      title: "Dunia Baty 3D",
      icon: "\\u{1F987}",
      glowClass: "halo-bat",
      url: "https://ninduyi.github.io/tes/",
      btnText: "Buka Dunia Baty",
      isExternal: true
    },
    {
      id: "builtin",
      title: "Medan Komparasi 3D",
      icon: "\\u{1F3D4}\\uFE0F",
      glowClass: "halo-builtin",
      url: null,
      btnText: "Masuk Medan 3D",
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
                <h2 class="aoe-chooser-title">PILIH VISUALISASI 3D</h2>
              </div>
            </div>
            <button type="button" class="aoe-stone-btn close-btn" id="btn-close-3d-chooser" title="Tutup (ESC)">&times;</button>
          </header>

          <div class="aoe-chooser-body">
            <div class="aoe-3d-grid">
              \${PORTALS_DATA.map((portal) => \`
                <div class="aoe-3d-card card-\${portal.id}" data-portal-id="\${portal.id}" tabindex="0" role="button" aria-label="\${portal.title}">
                  <div class="card-icon-halo \${portal.glowClass}">
                    <span class="card-icon">\${portal.icon}</span>
                  </div>
                  <h3 class="card-title">\${portal.title}</h3>
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
              <kbd>ESC</kbd> untuk menutup
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

const normBundle = bundle.replace(/\r\n/g, '\n');
const startIdx = normBundle.indexOf(OLD_MODAL_DEF_START);
const endIdx = normBundle.indexOf(OLD_MODAL_DEF_END);

if (startIdx === -1 || endIdx === -1) {
  console.error('Bundle marker not found!', { startIdx, endIdx });
  process.exit(1);
}

const updatedBundle = normBundle.substring(0, startIdx) + NEW_MODAL_DEF + '\n' + normBundle.substring(endIdx);
fs.writeFileSync('public/app.bundle.js', updatedBundle, 'utf8');
console.log('Updated public/app.bundle.js!');

// Copy to dist
fs.copyFileSync('public/app.bundle.js', 'dist/public/app.bundle.js');
fs.cpSync('src', 'dist/src', { recursive: true });
console.log('Successfully synced dist!');

