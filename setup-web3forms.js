#!/usr/bin/env node

/**
 * Web3Forms API 키 설정 자동화 스크립트
 *
 * 사용법:
 * node setup-web3forms.js <ACCESS_KEY>
 *
 * 예시:
 * node setup-web3forms.js abcd1234-5678-90ef-ghij-klmnopqrstuv
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length !== 1) {
  console.error('\n❌ 사용법이 잘못되었습니다.\n');
  console.log('사용법:');
  console.log('  node setup-web3forms.js <ACCESS_KEY>\n');
  console.log('예시:');
  console.log('  node setup-web3forms.js abcd1234-5678-90ef-ghij-klmnopqrstuv\n');
  console.log('Web3Forms API 키 받기:');
  console.log('  1. https://web3forms.com 접속');
  console.log('  2. carawoo96@gmail.com 입력');
  console.log('  3. "Get Access Key" 클릭');
  console.log('  4. 받은 키를 복사해서 사용\n');
  console.log('자세한 내용은 WEB3FORMS_SETUP.md를 참고하세요.\n');
  process.exit(1);
}

const [accessKey] = args;

// API 키 형식 검증 (UUID 형식)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(accessKey)) {
  console.error('\n❌ 잘못된 API 키 형식입니다.');
  console.log('Web3Forms API 키는 UUID 형식이어야 합니다.');
  console.log('예: abcd1234-5678-90ef-ghij-klmnopqrstuv\n');
  process.exit(1);
}

console.log('\n🔧 Web3Forms 설정 시작...\n');
console.log(`Access Key: ${accessKey}\n`);

// LoginScreen.js 파일 읽기
const loginScreenPath = path.join(__dirname, 'src', 'screens', 'LoginScreen.js');

try {
  let content = fs.readFileSync(loginScreenPath, 'utf8');

  // YOUR_WEB3FORMS_ACCESS_KEY를 실제 값으로 교체
  const before = "access_key: 'YOUR_WEB3FORMS_ACCESS_KEY'";
  const after = `access_key: '${accessKey}'`;

  if (!content.includes(before)) {
    console.error('❌ YOUR_WEB3FORMS_ACCESS_KEY를 찾을 수 없습니다.');
    console.log('이미 설정되었거나 파일이 수정되었을 수 있습니다.\n');
    process.exit(1);
  }

  content = content.replace(before, after);

  // 파일 저장
  fs.writeFileSync(loginScreenPath, content, 'utf8');

  console.log('✅ LoginScreen.js 업데이트 완료!\n');
  console.log('📧 이메일 수신: carawoo96@gmail.com\n');
  console.log('다음 단계:');
  console.log('  1. npm run web:build (빌드)');
  console.log('  2. 로컬 테스트:');
  console.log('     node /tmp/test-server.js');
  console.log('     open http://localhost:8080');
  console.log('  3. 배포:');
  console.log('     npx vercel --prod --force\n');
  console.log('🧪 테스트:');
  console.log('  - "비밀번호를 잊으셨나요?" 클릭');
  console.log('  - 닉네임과 연락처 입력');
  console.log('  - "이메일 전송하기" 클릭');
  console.log('  - carawoo96@gmail.com 확인!\n');

} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
}
