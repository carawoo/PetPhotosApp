# 🐾 Pet Photos App

반려동물 사진을 공유하는 소셜 네트워크 PWA (Progressive Web App)

## 주요 기능

### 📱 5개의 메인 화면

1. **피드 (Feed)** - 인스타그램 스타일
   - 게시물 피드 뷰
   - 좋아요, 댓글, 공유, 북마크
   - 반려동물 프로필

2. **숏츠 (Shorts)** - 세로 스크롤
   - 전체 화면 세로 스크롤
   - 빠른 콘텐츠 소비
   - 인터랙티브 액션 버튼

3. **카메라** - 사진 촬영
   - 전면/후면 카메라
   - 실시간 프리뷰
   - 갤러리 저장

4. **갤러리** - 사진첩 관리
   - 기기 사진 불러오기
   - 다중 선택
   - 업로드 기능

5. **프로필** - 사용자 페이지
   - 통계 (게시물, 팔로워, 팔로잉)
   - 게시물 그리드
   - 프로필 편집

## 기술 스택

- **프레임워크:** React Native + Expo
- **네비게이션:** React Navigation
- **백엔드:** Firebase (준비 중)
- **아이콘:** Expo Vector Icons
- **배포:** PWA (Web)

## 시작하기

### 개발 환경 실행

```bash
# 의존성 설치
npm install

# 웹에서 실행
npm run web

# iOS에서 실행 (Mac만 가능)
npm run ios

# Android에서 실행
npm run android
```

### PWA 빌드

```bash
# 프로덕션 빌드
npx expo export --platform web

# dist 폴더가 생성됨
```

## 배포

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.

**추천 무료 배포 옵션:**
- Netlify ⭐ (가장 쉬움)
- Vercel
- GitHub Pages
- Firebase Hosting

## 프로젝트 구조

```
PetPhotosApp/
├── src/
│   ├── screens/          # 화면 컴포넌트
│   │   ├── FeedScreen.js
│   │   ├── ShortsScreen.js
│   │   ├── CameraScreen.js
│   │   ├── GalleryScreen.js
│   │   └── ProfileScreen.js
│   ├── navigation/       # 네비게이션 설정
│   │   └── AppNavigator.js
│   ├── services/         # 백엔드 서비스
│   │   └── firebase.js
│   ├── components/       # 재사용 컴포넌트
│   ├── contexts/         # React Context
│   └── utils/            # 유틸리티 함수
├── assets/               # 이미지, 아이콘
├── App.js                # 앱 진입점
└── app.json              # Expo 설정
```

## Firebase 설정 (선택사항)

실제 데이터 저장을 원하면 Firebase를 설정하세요:

1. [Firebase Console](https://console.firebase.google.com)에서 프로젝트 생성
2. Authentication, Firestore, Storage 활성화
3. `src/services/firebase.js`에 설정 정보 입력

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## 향후 계획

- [ ] Firebase 백엔드 연동
- [ ] 사용자 인증 (로그인/회원가입)
- [ ] 실제 게시물 업로드
- [ ] 좋아요/댓글 기능 완성
- [ ] 푸시 알림
- [ ] Android/iOS 앱스토어 배포

## 라이선스

MIT License

## 문의

문제가 발생하거나 질문이 있으면 이슈를 등록해주세요.

---

Made with ❤️ for pet lovers
