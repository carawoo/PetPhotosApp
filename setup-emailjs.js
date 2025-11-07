#!/usr/bin/env node

/**
 * EmailJS 설정 자동화 스크립트
 *
 * 사용법:
 * node setup-emailjs.js <SERVICE_ID> <TEMPLATE_ID> <PUBLIC_KEY>
 *
 * 예시:
 * node setup-emailjs.js service_abc123 template_xyz789 AbCdEfGhIjKlMnOp
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length !== 3) {
  console.error('\n❌ 사용법이 잘못되었습니다.\n');
  console.log('사용법:');
  console.log('  node setup-emailjs.js <SERVICE_ID> <TEMPLATE_ID> <PUBLIC_KEY>\n');
  console.log('예시:');
  console.log('  node setup-emailjs.js service_abc123 template_xyz789 AbCdEfGhIjKlMnOp\n');
  console.log('자세한 내용은 EMAILJS_SETUP.md를 참고하세요.\n');
  process.exit(1);
}

const [serviceId, templateId, publicKey] = args;

console.log('\n📧 EmailJS 설정 시작...\n');
console.log(`Service ID: ${serviceId}`);
console.log(`Template ID: ${templateId}`);
console.log(`Public Key: ${publicKey}\n`);

// LoginScreen.js 파일 읽기
const loginScreenPath = path.join(__dirname, 'src', 'screens', 'LoginScreen.js');

try {
  let content = fs.readFileSync(loginScreenPath, 'utf8');

  // YOUR_SERVICE_ID, YOUR_TEMPLATE_ID, YOUR_PUBLIC_KEY를 실제 값으로 교체
  content = content.replace(
    /await emailjs\.send\(\s*'YOUR_SERVICE_ID',\s*\/\/ EmailJS Service ID\s*'YOUR_TEMPLATE_ID',\s*\/\/ EmailJS Template ID\s*templateParams,\s*'YOUR_PUBLIC_KEY'\s*\/\/ EmailJS Public Key\s*\);/,
    `await emailjs.send(\n        '${serviceId}',  // EmailJS Service ID\n        '${templateId}', // EmailJS Template ID\n        templateParams,\n        '${publicKey}'   // EmailJS Public Key\n      );`
  );

  // 파일 저장
  fs.writeFileSync(loginScreenPath, content, 'utf8');

  console.log('✅ LoginScreen.js 업데이트 완료!\n');
  console.log('다음 단계:');
  console.log('  1. npm run web:build (빌드)');
  console.log('  2. node /tmp/test-server.js (로컬 테스트)');
  console.log('  3. npx vercel --prod --force (배포)\n');

} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
}
