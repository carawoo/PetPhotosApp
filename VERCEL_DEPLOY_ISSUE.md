# Vercel 배포 문제 해결 가이드

## 현재 상황
- 로컬 빌드: ✅ 정상 작동 (JavaScript 번들 생성됨)
- Git 푸시: ✅ 완료 (최신 커밋: 53f9b3b)
- Vercel 배포: ❌ 오래된 버전 (0a7e2c5) 배포 중

## 해결 방법

### 1. Vercel 대시보드에서 수동 재배포
1. https://vercel.com/0123s-projects-b35d4e61/petphotos/deployments 접속
2. 최신 커밋 `53f9b3b` 또는 `64d9cad` 찾기
3. "Redeploy" 버튼 클릭
4. "Use existing Build Cache" 체크 **해제**
5. "Redeploy" 확인

### 2. Vercel CLI로 강제 재배포
```bash
npx vercel --prod --force
```

### 3. GitHub Webhook 확인
Vercel이 GitHub 푸시를 감지하지 못할 수 있습니다:
1. Vercel 프로젝트 설정 → Git
2. "Deploy Hooks" 확인
3. 필요시 새 Deploy Hook 생성

### 4. 빌드 로그 확인
Vercel 대시보드에서 실패한 배포의 로그 확인:
- Build 탭에서 에러 메시지 확인
- 특히 `inject-meta-tags.js` 실행 여부 확인

## 참고
- 로컬 빌드 명령: `npm run web:build`
- dist/index.html에 script 태그 확인: ✅ 정상
- 빌드 시간: ~5초
