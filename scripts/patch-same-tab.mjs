import fs from 'node:fs';

let code = fs.readFileSync('public/app.bundle.js', 'utf8');

// 1. In chooser modal render: remove target="_blank" rel="noopener noreferrer"
code = code.replace(
  '<a href="${portal.url}" target="_blank" rel="noopener noreferrer" class="card-action-btn btn-action-${portal.id}" tabindex="-1">',
  '<a href="${portal.url}" class="card-action-btn btn-action-${portal.id}" tabindex="-1">'
);

// 2. In chooser modal bind: navigate via window.location.href
code = code.replace(
  'window.open(portal.url, "_blank", "noopener,noreferrer");',
  'window.location.href = portal.url;'
);

// 3. In console.js click listener: navigate via window.location.href
code = code.replace(
  'window.open("https://ninduyi.github.io/tes/", "_blank", "noopener,noreferrer");',
  'window.location.href = "https://ninduyi.github.io/tes/";'
);
code = code.replace(
  'window.open("https://raraa17.github.io/firefly-algorithm/", "_blank", "noopener,noreferrer");',
  'window.location.href = "https://raraa17.github.io/firefly-algorithm/";'
);

fs.writeFileSync('public/app.bundle.js', code, 'utf8');
console.log('Successfully updated public/app.bundle.js to navigate in same tab!');

fs.copyFileSync('public/app.bundle.js', 'dist/public/app.bundle.js');
fs.cpSync('src', 'dist/src', { recursive: true });
console.log('Successfully synced to dist!');

