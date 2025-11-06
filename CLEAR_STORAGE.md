# ⚠️ IMPORTANT: localStorage 완전 삭제 방법

## 방법 1: 브라우저 개발자 도구 (가장 확실)

1. localhost:8082 페이지에서 **개발자 도구 열기**
   - Mac: `Cmd + Option + I`
   - Windows: `F12`

2. **Application** 탭 클릭 (또는 "애플리케이션" 탭)

3. 왼쪽 메뉴에서 **Storage > Local Storage > http://localhost:8082** 클릭

4. **오른쪽 패널에서 모든 항목을 선택하고 삭제**
   - 또는 `petPhotos_posts` 항목만 삭제

5. **페이지 새로고침** (Cmd+R 또는 F5)

---

## 방법 2: 콘솔에서 직접 실행

개발자 도구 > Console 탭에서 다음 코드를 실행:

```javascript
localStorage.clear();
location.reload();
```

---

## 방법 3: Incognito/Private 모드에서 테스트

새 시크릿 창에서 localhost:8082 접속
- Mac Chrome: `Cmd + Shift + N`
- Mac Safari: `Cmd + Shift + N`

---

## 현재 문제

localStorage에 다음과 같은 corrupted data가 남아있습니다:
- description 필드에 "."만 있는 게시물
- blob URL을 사용하는 게시물

이 데이터가 삭제되지 않으면 계속 에러가 발생합니다.

**반드시 위 방법 중 하나로 localStorage를 삭제해야 합니다!**
