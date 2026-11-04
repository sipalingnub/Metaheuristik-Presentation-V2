import fs from 'node:fs';

console.log('--- Updating Slide Navigation Buttons ---');

// 1. Update src/styles/shell.css
let shellCss = fs.readFileSync('src/styles/shell.css', 'utf8');
const oldEdgeShell = /\.edge\s*\{[\s\S]*?\.edge svg\s*\{[\s\S]*?\}/;
const newEdgeShell = `.edge {
  position: absolute;
  bottom: 24px;
  z-index: 45;
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #f1f5f9;
  cursor: pointer;
  opacity: 0.65;
  transition: opacity 0.2s ease, transform 0.15s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  padding: 0;
  outline: none;
}
.edge-prev { right: 80px; left: auto; }
.edge-next { right: 24px; }
.frame:hover .edge { opacity: 0.85; }
.edge:hover {
  opacity: 1 !important;
  color: var(--cyan, #38bdf8);
  border-color: rgba(56, 189, 248, 0.6);
  background: rgba(15, 23, 42, 0.95);
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.35);
}
.edge:active { transform: translateY(0) scale(0.94); }
.edge:disabled,
.edge.disabled {
  opacity: 0.18 !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
  border-color: rgba(255, 255, 255, 0.06) !important;
  box-shadow: none !important;
  color: #64748b !important;
}
.edge svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.15s ease;
}
.edge-prev:hover:not(:disabled) svg { transform: translateX(-1.5px); }
.edge-next:hover:not(:disabled) svg { transform: translateX(1.5px); }`;

if (oldEdgeShell.test(shellCss)) {
  shellCss = shellCss.replace(oldEdgeShell, newEdgeShell);
  fs.writeFileSync('src/styles/shell.css', shellCss, 'utf8');
  console.log('[OK] Updated src/styles/shell.css');
} else {
  console.warn('[WARN] oldEdgeShell pattern did not match in src/styles/shell.css');
}

// 2. Update src/styles/aoe.css
let aoeCss = fs.readFileSync('src/styles/aoe.css', 'utf8');
const oldEdgeAoe = /\.edge,\s*\.edge-prev,\s*\.edge-next\s*\{\s*display:\s*none\s*!important;\s*\}/;
const newEdgeAoe = `/* --------------------------------------------------------------------------
   NAVIGASI SLIDE: TOMBOL BACK & NEXT (SIMPLE & CLEAN)
   -------------------------------------------------------------------------- */
.edge {
  position: absolute !important;
  bottom: 24px !important;
  top: auto !important;
  margin-top: 0 !important;
  z-index: 45 !important;
  width: 46px !important;
  height: 46px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 50% !important;
  background: rgba(15, 23, 42, 0.72) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  color: #f1f5f9 !important;
  cursor: pointer !important;
  opacity: 0.65 !important;
  transition: opacity 0.2s ease, transform 0.15s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
  padding: 0 !important;
  outline: none !important;
}

.edge-prev {
  right: 80px !important;
  left: auto !important;
}

.edge-next {
  right: 24px !important;
}

.frame:hover .edge {
  opacity: 0.85 !important;
}

.edge:hover:not(:disabled) {
  opacity: 1 !important;
  color: #38bdf8 !important;
  border-color: rgba(56, 189, 248, 0.6) !important;
  background: rgba(15, 23, 42, 0.95) !important;
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.35) !important;
  transform: translateY(-2px) !important;
}

.edge:active:not(:disabled) {
  transform: translateY(0) scale(0.94) !important;
}

.edge:disabled,
.edge.disabled {
  opacity: 0.18 !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
  border-color: rgba(255, 255, 255, 0.06) !important;
  box-shadow: none !important;
  color: #64748b !important;
}

.edge svg {
  width: 22px !important;
  height: 22px !important;
  fill: none !important;
  stroke: currentColor !important;
  stroke-width: 2.4 !important;
  stroke-linecap: round !important;
  stroke-linejoin: round !important;
  transition: transform 0.15s ease !important;
}

.edge-prev:hover:not(:disabled) svg {
  transform: translateX(-1.5px) !important;
}

.edge-next:hover:not(:disabled) svg {
  transform: translateX(1.5px) !important;
}`;

if (oldEdgeAoe.test(aoeCss)) {
  aoeCss = aoeCss.replace(oldEdgeAoe, newEdgeAoe);
  fs.writeFileSync('src/styles/aoe.css', aoeCss, 'utf8');
  console.log('[OK] Updated src/styles/aoe.css');
} else {
  console.warn('[WARN] oldEdgeAoe pattern did not match in src/styles/aoe.css');
}

// 3. Update src/ui/presenter.js
let presenterJs = fs.readFileSync('src/ui/presenter.js', 'utf8');
const oldRefresh = `    this.counterEl.textContent = \`\${String(this.index + 1).padStart(2, '0')} / \${this.slides.length}\`;`;
const newRefresh = `    this.counterEl.textContent = \`\${String(this.index + 1).padStart(2, '0')} / \${this.slides.length}\`;

    const btnPrev = $('btn-prev');
    const btnNext = $('btn-next');
    if (btnPrev) {
      const isFirst = this.index === 0 && this.beat === 0;
      btnPrev.disabled = isFirst;
      btnPrev.classList.toggle('disabled', isFirst);
    }
    if (btnNext) {
      const isLast = this.index === this.slides.length - 1 && this.beat >= beats - 1;
      btnNext.disabled = isLast;
      btnNext.classList.toggle('disabled', isLast);
    }`;

if (presenterJs.includes(oldRefresh) && !presenterJs.includes("btnPrev.disabled = isFirst")) {
  presenterJs = presenterJs.replace(oldRefresh, newRefresh);
  fs.writeFileSync('src/ui/presenter.js', presenterJs, 'utf8');
  console.log('[OK] Updated src/ui/presenter.js');
} else {
  console.log('[INFO] src/ui/presenter.js already updated or pattern not found');
}

// 4. Update public/app.bundle.js
let bundleJs = fs.readFileSync('public/app.bundle.js', 'utf8');
const oldRefreshBundle = `this.counterEl.textContent = \`\${String(this.index + 1).padStart(2, "0")} / \${this.slides.length}\`;`;
const newRefreshBundle = `this.counterEl.textContent = \`\${String(this.index + 1).padStart(2, "0")} / \${this.slides.length}\`;
    const btnPrev = $("btn-prev");
    const btnNext = $("btn-next");
    if (btnPrev) {
      const isFirst = this.index === 0 && this.beat === 0;
      btnPrev.disabled = isFirst;
      btnPrev.classList.toggle("disabled", isFirst);
    }
    if (btnNext) {
      const isLast = this.index === this.slides.length - 1 && this.beat >= beats - 1;
      btnNext.disabled = isLast;
      btnNext.classList.toggle("disabled", isLast);
    }`;

if (bundleJs.includes(oldRefreshBundle) && !bundleJs.includes("btnPrev.disabled = isFirst")) {
  bundleJs = bundleJs.replace(oldRefreshBundle, newRefreshBundle);
  fs.writeFileSync('public/app.bundle.js', bundleJs, 'utf8');
  console.log('[OK] Updated public/app.bundle.js');
} else {
  console.log('[INFO] public/app.bundle.js already updated or pattern not found');
}

// 5. Update index.html and dist/index.html tooltips / titles
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(
  /aria-label="Sebelumnya"\s+title="[^"]*"/,
  'aria-label="Slide sebelumnya" title="Slide sebelumnya (← / Backspace)"'
);
indexHtml = indexHtml.replace(
  /aria-label="Berikutnya"\s+title="[^"]*"/,
  'aria-label="Slide berikutnya" title="Slide berikutnya (→ / Spasi)"'
);
fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log('[OK] Updated index.html');

// 6. Sync to dist/
fs.cpSync('src', 'dist/src', { recursive: true });
fs.copyFileSync('public/app.bundle.js', 'dist/public/app.bundle.js');
fs.copyFileSync('index.html', 'dist/index.html');
console.log('[OK] Synced all files to dist/');

