const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const originalPath = path.join(__dirname, '..', 'public', 'favicon.png');
const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function run() {
  const originalBuffer = fs.readFileSync(originalPath);

  // Save full-res original as public/logo.png and public/fin-logo.png
  fs.writeFileSync(path.join(publicDir, 'logo.png'), originalBuffer);
  fs.writeFileSync(path.join(publicDir, 'fin-logo.png'), originalBuffer);

  // PWA icons
  await sharp(originalBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));

  await sharp(originalBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'));

  await sharp(originalBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-512.png'));

  await sharp(originalBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  // Crisp favicon
  await sharp(originalBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log('Successfully generated all logo assets from original PNG logo!');
}

run().catch(console.error);
