const fs = require('fs');
const { PNG } = require('pngjs');

function createPngIcon(size, filename) {
  const png = new PNG({ width: size, height: size });
  const bgR = 0x25, bgG = 0x63, bgB = 0xeb;
  const fgR = 0xff, fgG = 0xff, fgB = 0xff;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const nx = (x - size / 2) / (size / 2);
      const ny = (y - size / 2) / (size / 2);

      let isShield = false;
      if (ny >= -0.6 && ny <= 0.6 && Math.abs(nx) <= (0.6 - (ny + 0.6) * 0.25)) {
        isShield = true;
      }
      if (isShield && Math.abs(nx) < 0.4 && ny > -0.4 && ny < 0.4) {
        if (Math.abs(nx) > 0.1 || ny < -0.2 || ny > 0.2) {
          isShield = true;
        }
      }

      png.data[idx] = isShield ? fgR : bgR;
      png.data[idx + 1] = isShield ? fgG : bgG;
      png.data[idx + 2] = isShield ? fgB : bgB;
      png.data[idx + 3] = 255;
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filename, buffer);
}

createPngIcon(192, 'public/pwa-192x192.png');
createPngIcon(512, 'public/pwa-512x512.png');
createPngIcon(180, 'public/apple-touch-icon.png');
createPngIcon(192, 'public/favicon.png');
