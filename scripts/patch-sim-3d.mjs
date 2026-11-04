import fs from 'node:fs';

let code = fs.readFileSync('public/app.bundle.js', 'utf8');

const oldBtnHtml = '<button type="button" class="dock-btn dock-3d-btn" id="${id}-3d-btn" title="Buka Medan 3D Three.js (3)"><span>\\u{1F3D4}\\uFE0F 3D</span></button>';
const newBtnHtml = '<button type="button" class="dock-btn dock-3d-btn" id="${id}-3d-btn" title="${id === \'ba\' ? \'Buka Dunia Baty 3D\' : id === \'fa\' ? \'Buka Simulasi Firefly 3D\' : \'Buka Medan 3D\'}"><span>${id === \'ba\' ? \'\\u{1F987} 3D\' : id === \'fa\' ? \'\\u{1F4A1} 3D\' : \'\\u{1F3D4}\\uFE0F 3D\'}</span></button>';

const oldClick = `$2(\`#\${id}-3d-btn\`)?.addEventListener("click", () => {
      window.__aoeHud?.landscapeChooser?.open();
    });`;

const newClick = `$2(\`#\${id}-3d-btn\`)?.addEventListener("click", () => {
      if (id === "ba") {
        window.open("https://ninduyi.github.io/tes/", "_blank", "noopener,noreferrer");
      } else if (id === "fa") {
        window.open("https://raraa17.github.io/firefly-algorithm/", "_blank", "noopener,noreferrer");
      } else {
        window.__aoeHud?.landscapeChooser?.open();
      }
    });`;

if (!code.includes(oldBtnHtml)) {
  console.error('oldBtnHtml not found in bundle!');
  process.exit(1);
}

const norm = code.replace(/\r\n/g, '\n');
const normOldClick = oldClick.replace(/\r\n/g, '\n');
const normNewClick = newClick.replace(/\r\n/g, '\n');

if (!norm.includes(normOldClick)) {
  console.error('normOldClick not found in bundle!');
  process.exit(1);
}

let updated = norm.replace(oldBtnHtml, newBtnHtml).replace(normOldClick, normNewClick);
if (code.includes('\r\n')) {
  updated = updated.replace(/\n/g, '\r\n');
}

fs.writeFileSync('public/app.bundle.js', updated, 'utf8');
console.log('Successfully patched public/app.bundle.js for fa-sim and ba-sim 3D buttons!');

fs.copyFileSync('public/app.bundle.js', 'dist/public/app.bundle.js');
fs.cpSync('src', 'dist/src', { recursive: true });
console.log('Successfully synced to dist!');

