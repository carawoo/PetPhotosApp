# Pet Photos App - PWA 배포 가이드

## 빌드 완료! 🎉

PWA 빌드가 완료되었습니다. `dist` 폴더에 배포 가능한 파일들이 생성되었습니다.

## 무료 배포 옵션

### 1. Netlify (추천) ⭐

**가장 쉬운 방법:**

1. [Netlify](https://www.netlify.com)에 가입 (무료)
2. "Add new site" → "Deploy manually" 클릭
3. `dist` 폴더를 드래그 앤 드롭
4. 끝! 무료 URL이 생성됩니다 (예: https://your-app.netlify.app)

**또는 GitHub 연동:**
```bash
# GitHub 저장소 생성 후
git init
git add .
git commit -m "Initial commit"
git remote add origin [your-repo-url]
git push -u origin main
```
그 다음 Netlify에서 GitHub 저장소 연결하면 자동 배포됩니다.

### 2. Vercel

1. [Vercel](https://vercel.com)에 가입 (무료)
2. "New Project" 클릭
3. `dist` 폴더 업로드 또는 GitHub 연동
4. 자동으로 배포 완료

### 3. GitHub Pages

```bash
# GitHub 저장소 생성 후
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [your-repo-url]
git push -u origin main

# gh-pages 브랜치에 배포
npm install -g gh-pages
npx gh-pages -d dist
```

Repository Settings → Pages에서 gh-pages 브랜치 선택

### 4. Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# dist 폴더를 public directory로 선택
firebase deploy
```

## 재빌드 방법

코드를 수정한 후 다시 배포하려면:

```bash
# 1. 빌드
npx expo export --platform web

# 2. 배포 (Netlify 예시)
# dist 폴더를 다시 업로드하거나 GitHub push
```

## PWA 기능

사용자들이 다음과 같이 사용할 수 있습니다:

1. **모바일에서:**
   - 웹 브라우저로 앱 접속
   - "홈 화면에 추가" 버튼 클릭
   - 앱처럼 설치되어 사용 가능

2. **데스크톱에서:**
   - Chrome/Edge에서 주소창 우측 "설치" 아이콘 클릭
   - 앱처럼 사용 가능

## 다음 단계

PWA로 먼저 배포해서 사용자 반응을 확인하고,
반응이 좋으면:

1. Firebase 연동해서 실제 데이터 저장
2. 사용자 인증 추가
3. Android ($25) 또는 iOS ($99/년) 스토어 배포

## 비용 비교

| 플랫폼 | 비용 | 장점 |
|--------|------|------|
| PWA (Netlify/Vercel) | **무료** | 즉시 배포 가능 |
| Google Play Store | $25 일회성 | Android 앱스토어 |
| Apple App Store | $99/년 | iOS 앱스토어 |

## 도메인 연결 (선택사항)

무료 URL이 마음에 안 들면:
- [Namecheap](https://www.namecheap.com)에서 도메인 구매 (~$10/년)
- Netlify/Vercel에서 커스텀 도메인 연결

예: https://petphotos.com

---

궁금한 점이 있으면 언제든지 물어보세요!
