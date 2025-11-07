#!/usr/bin/env node

/**
 * Vercel 배포용: /PetPhotosApp/ 경로 제거
 * GitHub Pages용 homepage 설정으로 인한 경로 prefix 제거
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');

console.log('\n🔧 Vercel용 경로 수정 중...\n');

// index.html 읽기
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// /PetPhotosApp/ 경로 제거
html = html.replace(/\/PetPhotosApp\//g, '/');

// 다시 쓰기
fs.writeFileSync(indexHtmlPath, html, 'utf8');

console.log('✅ index.html 경로 수정 완료!');
console.log('✅ /PetPhotosApp/ → / 변경됨\n');
