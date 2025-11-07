#!/usr/bin/env node

/**
 * assets/node_modules를 assets/libs로 변경
 * gh-pages가 node_modules를 무시하는 문제 해결
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const assetsNodeModules = path.join(distPath, 'assets', 'node_modules');
const assetsLibs = path.join(distPath, 'assets', 'libs');

console.log('\n🔄 assets/node_modules → assets/libs 변경 중...\n');

if (fs.existsSync(assetsNodeModules)) {
  // node_modules를 libs로 이름 변경
  fs.renameSync(assetsNodeModules, assetsLibs);
  console.log('✅ assets/node_modules → assets/libs 변경 완료!');
} else {
  console.log('ℹ️  assets/node_modules 폴더가 없습니다.');
}

console.log('\n');
