# 🔥 Firebase 설정 가이드

Firebase를 활성화하면 **실제 SNS처럼 작동**합니다!

## 현재 상태

- ✅ Firebase SDK 설치 완료
- ✅ Firestore 서비스 구현 완료 (게시물, 댓글, 좋아요)
- ✅ Storage 서비스 구현 완료 (코드 준비됨, Blaze 플랜 필요 시 활성화 가능)
- ✅ PostContext Firebase 통합 완료
- ⚙️ **현재 모드: Firestore + Base64 이미지 (Storage 비활성화)**
- ⏳ Firebase 프로젝트 생성 필요 (사용자가 직접)

## Firebase 없이 실행하면?

Firebase config가 없으면 **자동으로 localStorage 모드로 실행**됩니다.
- 브라우저마다 독립적인 데이터
- 용량 제한 (5-10MB)
- 데이터 공유 불가

## Firebase로 업그레이드하면?

- ✨ 모든 사용자가 같은 피드 공유
- ✨ 실시간 업데이트 (누가 게시물 올리면 즉시 보임)
- ✨ 이미지 Base64로 Firestore 저장 (문서당 ~800KB 제한)
- ✨ 데이터 영구 보존
- ✨ 여러 기기에서 접속 가능

**💡 Tip**: Blaze 플랜 업그레이드 시 Storage를 활성화하면 무제한 이미지 저장 가능

---

## 📝 Firebase 프로젝트 생성 (5분)

### 1. Firebase Console 접속
https://console.firebase.google.com

### 2. 프로젝트 만들기
1. **"프로젝트 추가"** 버튼 클릭
2. 프로젝트 이름: `petphotos` 입력
3. Google Analytics: **사용 안 함** 선택 (선택사항)
4. **"프로젝트 만들기"** 클릭

### 3. 웹 앱 등록
1. 프로젝트 생성 후 홈 화면에서 **웹 아이콘 `</>`** 클릭
2. 앱 닉네임: `Pet Photos Web` 입력
3. **"앱 등록"** 클릭
4. **Firebase SDK 구성 코드가 나타남** → 복사해두기

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "petphotos-xxxxx.firebaseapp.com",
  projectId: "petphotos-xxxxx",
  storageBucket: "petphotos-xxxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:xxxxx"
};
```

### 4. Firestore Database 생성
1. 왼쪽 메뉴 > **"Firestore Database"** 클릭
2. **"데이터베이스 만들기"** 클릭
3. 위치: **"asia-northeast3 (Seoul)"** 선택
4. 보안 규칙: **"테스트 모드에서 시작"** 선택
5. **"만들기"** 클릭

### 5. Storage 생성
1. 왼쪽 메뉴 > **"Storage"** 클릭
2. **"시작하기"** 클릭
3. 보안 규칙: **"테스트 모드에서 시작"** 선택
4. 위치: **"asia-northeast3 (Seoul)"** 선택
5. **"완료"** 클릭

---

## ⚙️ 프로젝트에 Firebase Config 적용

### 파일 수정: `src/config/firebase.config.js`

3단계에서 복사한 firebaseConfig 값들을 붙여넣으세요:

```javascript
const firebaseConfig = {
  apiKey: "여기에_실제_값_붙여넣기",
  authDomain: "여기에_실제_값_붙여넣기",
  projectId: "여기에_실제_값_붙여넣기",
  storageBucket: "여기에_실제_값_붙여넣기",
  messagingSenderId: "여기에_실제_값_붙여넣기",
  appId: "여기에_실제_값_붙여넣기"
};
```

파일 저장 후 개발 서버가 자동으로 재시작됩니다.

---

## ✅ Firebase 활성화 확인

브라우저 콘솔에서 다음 메시지 확인:

```
✅ Firebase enabled (Firestore only, images stored as Base64)
```

이 메시지가 보이면 성공! 🎉

**참고**: Storage는 Blaze 플랜이 필요하므로 현재 비활성화되어 있습니다. 이미지는 Base64 형식으로 Firestore에 직접 저장됩니다.

---

## 🔒 보안 규칙 설정 (프로덕션 배포 전 필수)

테스트 모드는 30일만 유효합니다. 프로덕션 배포 전에 반드시 보안 규칙을 설정하세요.

### Firestore 규칙 (읽기는 모두, 쓰기는 인증된 사용자만)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 게시물
    match /posts/{postId} {
      allow read: if true;  // 누구나 읽기 가능
      allow create: if request.auth != null;  // 인증된 사용자만 생성
      allow update, delete: if request.auth != null
        && request.auth.uid == resource.data.authorId;  // 작성자만 수정/삭제
    }

    // 사용자
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Storage 규칙 (이미지 업로드는 인증된 사용자만)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/{imageId} {
      allow read: if true;  // 누구나 읽기 가능
      allow write: if request.auth != null;  // 인증된 사용자만 업로드
    }
  }
}
```

---

## 🎯 다음 단계

Firebase 인증(Authentication)을 추가하면 실제 회원가입/로그인이 가능합니다:
- Google 로그인
- 이메일/비밀번호 로그인
- 익명 로그인

필요하면 말씀해주세요!

---

## 🆘 문제 해결

### "📦 Using localStorage mode" 메시지가 계속 나옴
→ `src/config/firebase.config.js` 파일의 firebaseConfig 값을 확인하세요.
→ "YOUR_API_KEY" 같은 플레이스홀더가 남아있으면 안됩니다.

### "Firebase: Error (auth/api-key-not-valid)"
→ Firebase Console에서 API Key를 다시 확인하세요.
→ 프로젝트 설정 > 일반 > 내 앱 > SDK 설정 및 구성

### Firestore에 데이터가 안 들어감
→ Firebase Console > Firestore Database에서 데이터베이스가 생성되었는지 확인
→ 보안 규칙이 테스트 모드인지 확인

### Storage CORS 에러 (해결됨)
**현재 Storage는 비활성화 상태**입니다. Blaze 플랜이 필요하므로 Base64로 Firestore에 저장합니다.

만약 Blaze 플랜을 업그레이드했다면:
1. `src/contexts/PostContext.js` 파일 열기
2. 12-13번 줄의 주석 해제:
   ```javascript
   storageService = require('../services/storage.service');
   ```
3. Firebase Console > Storage에서 버킷 생성 확인
4. 보안 규칙을 테스트 모드로 설정
