const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const pawColor = '#FF3366';

function drawPaw(ctx, size) {
  const scale = size / 72;

  // Clear canvas with transparent background
  ctx.clearRect(0, 0, size, size);

  // Set color
  ctx.fillStyle = pawColor;

  // Scale to center and fit
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.scale(scale, scale);

  // Draw paw shape
  // Main pad (bottom large oval)
  ctx.beginPath();
  ctx.ellipse(0, 12, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Top left toe
  ctx.beginPath();
  ctx.ellipse(-12, -8, 6, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Top center toe
  ctx.beginPath();
  ctx.ellipse(0, -12, 6, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Top right toe
  ctx.beginPath();
  ctx.ellipse(12, -8, 6, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Middle pad
  ctx.beginPath();
  ctx.ellipse(0, -2, 7, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function generateFavicon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  drawPaw(ctx, size);

  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(__dirname, 'public', filename);

  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Generated: ${outputPath}`);
}

// Generate favicons
console.log('🐾 Generating paw favicons...\n');

generateFavicon(16, 'favicon-16x16.png');
generateFavicon(32, 'favicon-32x32.png');
generateFavicon(192, 'favicon-192x192.png');
generateFavicon(512, 'favicon-512x512.png');

// Also generate main favicon.png
generateFavicon(192, 'favicon.png');

console.log('\n✨ All favicons generated successfully!');
