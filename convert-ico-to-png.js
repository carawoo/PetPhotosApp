const icoToPng = require('ico-to-png');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const icoPath = '/Users/carawoo/Downloads/1.ico';
const publicDir = path.join(__dirname, 'public');
const assetsDir = path.join(__dirname, 'assets');
const distDir = path.join(__dirname, 'dist');

const sizes = [16, 32, 192, 512];

async function convertIcoToPng() {
  try {
    const icoBuffer = fs.readFileSync(icoPath);

    // First convert ICO to PNG (this will give us the largest size available in the ICO)
    const basePngBuffer = await icoToPng(icoBuffer, 512);

    // Now resize to different sizes and save
    for (const size of sizes) {
      const resizedBuffer = await sharp(basePngBuffer)
        .resize(size, size)
        .png()
        .toBuffer();

      // Save to public directory
      const publicPath = path.join(publicDir, `favicon-${size}x${size}.png`);
      fs.writeFileSync(publicPath, resizedBuffer);
      console.log(`Created ${publicPath}`);

      // Save to dist directory
      const distPath = path.join(distDir, `favicon-${size}x${size}.png`);
      fs.writeFileSync(distPath, resizedBuffer);
      console.log(`Created ${distPath}`);
    }

    // Also create generic favicon.png files (512x512)
    const mainPngBuffer = await sharp(basePngBuffer)
      .resize(512, 512)
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(publicDir, 'favicon.png'), mainPngBuffer);
    console.log(`Created ${path.join(publicDir, 'favicon.png')}`);

    fs.writeFileSync(path.join(assetsDir, 'favicon.png'), mainPngBuffer);
    console.log(`Created ${path.join(assetsDir, 'favicon.png')}`);

    fs.writeFileSync(path.join(distDir, 'favicon.png'), mainPngBuffer);
    console.log(`Created ${path.join(distDir, 'favicon.png')}`);

    console.log('\n✓ All favicon files have been created successfully!');
  } catch (error) {
    console.error('Error converting ICO to PNG:', error);
  }
}

convertIcoToPng();
