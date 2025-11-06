# 게시물 작성 테스트 가이드

## 🧪 테스트 개요

이 테스트는 게시물이 정상적으로 작성되고 저장되는지 검증합니다.

- **localStorage 테스트**: 로컬 저장소에 게시물이 올바르게 저장되는지 확인
- **Firestore 테스트**: Firebase Firestore에 게시물이 올바르게 저장되는지 확인
- **통합 테스트**: 두 저장소 모두 테스트

## 📋 테스트 실행 방법

### 방법 1: 브라우저 콘솔에서 실행 (권장)

1. 앱을 **로컬에서** 실행합니다: `npm run web` (localhost:8082)
2. 브라우저 개발자 도구를 엽니다 (F12 또는 Cmd+Option+I)
3. **Console** 탭을 선택합니다
4. 아래 테스트 코드를 복사해서 콘솔에 붙여넣고 Enter를 누릅니다:

```javascript
// 테스트 함수 로드 (한 번만 실행)
import('./src/__tests__/post.test.js').then(module => {
  window.testLocalStoragePost = module.testLocalStoragePost;
  window.testFirestorePost = module.testFirestorePost;
  window.runAllPostTests = module.runAllPostTests;
  console.log('✅ 테스트 함수 로드 완료!');
});
```

5. 로드가 완료되면 아래 명령어로 테스트 실행:

```javascript
// localStorage만 테스트
testLocalStoragePost()

// Firestore만 테스트
testFirestorePost()

// 전체 테스트 (localStorage + Firestore)
runAllPostTests()
```

**참고**: 테스트는 개발 환경(localhost)에서만 사용할 수 있습니다. 프로덕션 빌드에는 포함되지 않습니다.

### 방법 2: 자동 테스트 (게시물 작성 후)

게시물을 작성하고 "게시하기" 버튼을 누르면 자동으로 검증이 실행됩니다.

## ✅ 성공 시 출력 예시

```
🧪 게시물 작성 통합 테스트 시작...

📝 localStorage 게시물 저장 테스트 시작...
✅ localStorage 테스트 성공!
   - 게시물 개수: 5 → 6
   - 최신 게시물 ID: 1736155234567

🔥 Firestore 게시물 저장 테스트 시작...
✅ Firestore에 게시물 생성 성공! ID: abc123xyz
✅ Firestore 구독 테스트 성공!
   - 게시물 ID: abc123xyz
   - 반려동물 이름: 테스트강아지
   - 생성 시간: 2025-01-06T10:30:45.123Z
⚠️  테스트 게시물은 Firebase Console에서 수동으로 삭제하세요

📊 테스트 결과 요약:
   localStorage: ✅ 성공
   Firestore: ✅ 성공

✅ 모든 테스트 통과!
```

## ❌ 실패 시 확인 사항

### localStorage 테스트 실패

- **증상**: `❌ 게시물 개수가 증가하지 않았습니다`
- **해결**: localStorage가 비활성화되어 있거나 용량 초과일 수 있습니다
  - 브라우저 설정에서 localStorage 허용 확인
  - 불필요한 데이터 삭제

### Firestore 테스트 실패

- **증상**: `❌ FirebaseError: Missing or insufficient permissions`
- **해결**: Firestore 보안 규칙 확인
  ```javascript
  // Firebase Console > Firestore Database > Rules
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /posts/{postId} {
        allow read, write: if true;
      }
    }
  }
  ```

- **증상**: `타임아웃: 게시물을 찾을 수 없습니다`
- **해결**:
  - 네트워크 연결 확인
  - Firebase 프로젝트 설정 확인 (src/config/firebase.config.js)

## 🔍 테스트 상세 내용

### testLocalStoragePost()

**검증 항목**:
- ✓ 게시물이 localStorage에 저장됨
- ✓ 게시물 개수가 정확히 1개 증가
- ✓ 최신 게시물이 배열의 첫 번째에 위치
- ✓ 게시물 데이터가 올바르게 저장됨 (petName, description, imageUrl 등)

**정리 작업**:
- 테스트 후 자동으로 테스트 게시물 삭제

### testFirestorePost()

**검증 항목**:
- ✓ Firestore에 게시물 생성 성공
- ✓ 게시물 ID가 정상적으로 반환됨
- ✓ 실시간 구독(subscription)을 통해 게시물 조회 가능
- ✓ 게시물 데이터가 올바르게 저장됨

**정리 작업**:
- ⚠️ Firestore 테스트 게시물은 Firebase Console에서 수동으로 삭제해야 합니다
- Firebase Console > Firestore Database > posts 컬렉션에서 테스트 게시물 찾아서 삭제

### runAllPostTests()

**실행 순서**:
1. localStorage 테스트 실행
2. Firestore 테스트 실행
3. 결과 요약 출력

## 📊 테스트 결과 해석

| 상태 | 의미 |
|-----|------|
| ✅ 성공 | 모든 검증 항목 통과 |
| ❌ 실패 | 하나 이상의 검증 항목 실패 |
| ⚠️ 건너뛰기 | Firestore가 비활성화되어 있음 |

## 🛠️ 고급 사용법

### 커스텀 테스트 데이터 사용

```javascript
// post.test.js 파일을 수정하여 테스트 데이터 변경 가능
const testPost = {
  petName: '내강아지',
  description: '귀여운 우리 강아지',
  imageUrl: 'data:image/...',
  userId: 'my_user_id',
  userNickname: '내닉네임',
};
```

### 여러 게시물 연속 테스트

```javascript
// 10개의 게시물을 연속으로 생성하여 테스트
for (let i = 0; i < 10; i++) {
  await testLocalStoragePost();
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

## 📝 테스트 체크리스트

게시물 작성 기능을 수정한 후 반드시 아래 항목을 확인하세요:

- [ ] `testLocalStoragePost()` 성공
- [ ] `testFirestorePost()` 성공
- [ ] 실제 UI에서 게시물 작성 후 피드에 표시됨
- [ ] 새로고침 후에도 게시물이 유지됨
- [ ] 다른 브라우저/기기에서도 게시물이 보임 (Firestore)

## 🚀 CI/CD 통합 (향후)

Jest 또는 다른 테스트 러너와 통합하여 자동화된 테스트 실행 가능:

```bash
npm test
```

## 📞 문제 해결

테스트 관련 문제가 발생하면:

1. 콘솔 로그 전체 내용 확인
2. 네트워크 탭에서 Firebase 요청 확인
3. Firebase Console에서 데이터 확인
4. src/__tests__/post.test.js 파일 검토

---

**작성일**: 2025-01-06
**작성자**: Claude Code
**버전**: 1.0.0
