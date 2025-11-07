#!/usr/bin/env node

/**
 * GitHub Pages 경로 수정 스크립트
 * /PetPhotosApp/ 서브 경로에 맞게 asset 경로 수정
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');

console.log('\n🔧 GitHub Pages 경로 수정 중...\n');

// index.html 읽기
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// 절대 경로를 /PetPhotosApp/ 으로 시작하도록 수정
html = html.replace(/href="\//g, 'href="/PetPhotosApp/');
html = html.replace(/src="\//g, 'src="/PetPhotosApp/');
html = html.replace(/content="\//g, 'content="/PetPhotosApp/');

// 다시 쓰기
fs.writeFileSync(indexHtmlPath, html, 'utf8');

console.log('✅ index.html 경로 수정 완료!');
console.log(`✅ 모든 asset이 /PetPhotosApp/ 기준으로 로드됩니다.\n`);
