# Google Search Console (구글 웹마스터 도구) 등록 가이드

## 1. 준비사항

- 사이트 URL: `https://peto.vercel.app`
- Google 계정 필요

## 2. Google Search Console 등록하기

### 2-1. Search Console 접속
1. https://search.google.com/search-console 접속
2. Google 계정으로 로그인

### 2-2. 속성 추가
1. 좌측 상단 "속성 추가" 클릭
2. **"URL 접두어"** 선택 (도메인 방식은 DNS 설정 필요)
3. URL 입력: `https://peto.vercel.app`
4. "계속" 클릭

### 2-3. 소유권 확인
여러 방법 중 하나를 선택:

#### 방법 1: HTML 파일 업로드 (권장)
1. Google이 제공하는 HTML 파일 다운로드
2. `/Users/carawoo/PetPhotosApp/public/` 폴더에 파일 복사
3. Git 커밋 & 푸시하여 Vercel 재배포
4. Search Console에서 "확인" 클릭

#### 방법 2: HTML 태그
1. Google이 제공하는 메타 태그 복사
2. `App.js` 또는 `index.html`의 `<head>` 태그 안에 추가
3. Git 커밋 & 푸시하여 Vercel 재배포
4. Search Console에서 "확인" 클릭

## 3. 사이트맵 제출하기

### 3-1. 사이트맵 URL
소유권 확인 후 제출할 사이트맵 URL:

```
https://peto.vercel.app/sitemap.xml
```

### 3-2. 제출 방법
1. Google Search Console 좌측 메뉴에서 **"색인 생성" > "Sitemaps"** 클릭
2. "새 사이트맵 추가" 입력란에 입력: `sitemap.xml`
3. "제출" 버튼 클릭

### 3-3. 확인
- 제출 후 "성공" 상태가 되면 완료
- 처음에는 "가져올 수 없음" 상태일 수 있으니 몇 분 후 새로고침
- 완전히 색인되기까지 며칠~몇 주 소요될 수 있음

## 4. robots.txt 확인

robots.txt도 자동으로 배포됩니다:
```
https://peto.vercel.app/robots.txt
```

브라우저에서 위 URL로 접속하여 정상 동작 확인 가능

## 5. 배포 후 확인사항

다음 URL들이 정상적으로 접근 가능한지 확인:
- ✅ https://peto.vercel.app/sitemap.xml
- ✅ https://peto.vercel.app/robots.txt

## 6. 주의사항

⚠️ **중요**: 사이트맵과 robots.txt 파일이 적용되려면 반드시 Git 커밋 후 Vercel에 푸시해야 합니다!

```bash
git add .
git commit -m "feat: Google Search Console 사이트맵 추가"
git push
```

푸시 후 Vercel이 자동으로 재배포하고, 그 후에 위 URL들이 정상 동작합니다.

## 7. 도메인이 다를 경우

만약 실제 배포 도메인이 다르다면:

1. `public/sitemap.xml`의 URL 수정
2. `public/robots.txt`의 Sitemap URL 수정
3. 위 가이드의 모든 URL을 실제 도메인으로 변경

---

## 빠른 복사용 텍스트

### Google Search Console에 제출할 사이트맵:
```
sitemap.xml
```

또는 전체 URL:
```
https://peto.vercel.app/sitemap.xml
```
