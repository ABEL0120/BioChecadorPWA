const fs = require('fs');

const makeSvg = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" rx="${size * 0.2}" fill="#2563eb"/>
  <path d="M${size * 0.5} ${size * 0.22} L${size * 0.75} ${size * 0.32} V${size * 0.55} C${size * 0.75} ${size * 0.72} ${size * 0.5} ${size * 0.82} ${size * 0.5} ${size * 0.82} C${size * 0.5} ${size * 0.82} ${size * 0.25} ${size * 0.72} ${size * 0.25} ${size * 0.55} V${size * 0.32} Z" fill="none" stroke="#ffffff" stroke-width="${size * 0.05}" stroke-linejoin="round"/>
  <path d="M${size * 0.42} ${size * 0.51} L${size * 0.48} ${size * 0.57} L${size * 0.58} ${size * 0.45}" fill="none" stroke="#ffffff" stroke-width="${size * 0.05}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

fs.writeFileSync('public/icon-192.svg', makeSvg(192));
fs.writeFileSync('public/icon-512.svg', makeSvg(512));
fs.writeFileSync('public/pwa-192x192.png', fs.readFileSync('public/favicon.png'));
fs.writeFileSync('public/pwa-512x512.png', fs.readFileSync('public/favicon.png'));
console.log('PWA icons created successfully.');
