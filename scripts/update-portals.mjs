import fs from 'node:fs';

let code = fs.readFileSync('public/app.bundle.js', 'utf8');

code = code.replace(
  'author: "Simulasi Bioluminesensi Swarm (Raraa17)",',
  'author: "Simulasi Bioluminesensi Swarm",'
);
code = code.replace(
  'badge: "WebGL \\xB7 Eksternal",',
  'badge: "Eksternal",'
);
code = code.replace(
  'author: "Bat Algorithm Echolocation Swarm (Ninduyi)",',
  'author: "Bat Algorithm Echolocation Swarm",'
);
code = code.replace(
  'badge: "Three.js \\xB7 Eksternal",',
  'badge: "Eksternal",'
);
code = code.replace(
  'badge: "Built-in \\xB7 Three.js",',
  'badge: "Bawaan",'
);

fs.writeFileSync('public/app.bundle.js', code, 'utf8');
console.log('Updated public/app.bundle.js!');

fs.copyFileSync('public/app.bundle.js', 'dist/public/app.bundle.js');
console.log('Synced to dist/public/app.bundle.js!');

fs.cpSync('src', 'dist/src', { recursive: true });
console.log('Synced src to dist/src!');

