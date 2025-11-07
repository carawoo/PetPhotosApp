# Web3Forms 설정 가이드 (매우 간단!)

비밀번호 찾기 기능에서 자동으로 이메일을 carawoo96@gmail.com으로 전송하려면 Web3Forms API 키가 필요합니다.

## ⏱️ 소요 시간: 1분

## 🚀 빠른 설정

### 1단계: API 키 받기

1. https://web3forms.com 접속
2. "Get Your Access Key" 섹션에서 **carawoo96@gmail.com** 입력
3. "Get Access Key" 버튼 클릭
4. **즉시 API 키 표시됨** (예: `abcd1234-5678-90ef-ghij-klmnopqrstuv`)
5. API 키 복사

### 2단계: 자동 설정 스크립트 실행

터미널에서 아래 명령어 실행:

```bash
node setup-web3forms.js <받은_API_키>
```

**예시:**
```bash
node setup-web3forms.js abcd1234-5678-90ef-ghij-klmnopqrstuv
```

### 3단계: 빌드 및 배포

```bash
# 빌드
npm run web:build

# Vercel 배포
npx vercel --prod --force
```

## ✅ 완료!

이제 사용자가 "비밀번호 찾기"를 하면:
1. 닉네임과 연락처 입력
2. "이메일 전송하기" 클릭
3. **자동으로 carawoo96@gmail.com으로 이메일 전송**

## 📧 받는 이메일 형식

```
제목: [Peto] 비밀번호 재설정 요청

내용:
비밀번호 재설정 요청

닉네임: [사용자 입력]
가입 시 등록한 연락처: [사용자 입력]

위 정보로 비밀번호를 재설정해주세요.
```

## 💰 무료 플랜

- 월 250개 폼 제출 무료
- 계정 생성 불필요
- 신용카드 불필요
- 즉시 사용 가능

## 🔒 보안

- API 키는 클라이언트에 노출되지만 안전함
- Web3Forms에서 수신 이메일(carawoo96@gmail.com) 제한 가능
- 스팸 방지 기능 내장

## 🆚 EmailJS와 비교

| 기능 | Web3Forms | EmailJS |
|------|-----------|---------|
| 설정 시간 | 1분 | 5분 |
| 계정 필요 | ❌ | ✅ |
| 템플릿 설정 | ❌ (간단) | ✅ (복잡) |
| 무료 한도 | 250/월 | 200/월 |
| API 키 개수 | 1개 | 3개 |

## 🧪 테스트

API 키 설정 후:
1. http://localhost:8080 접속 (또는 실제 사이트)
2. "비밀번호를 잊으셨나요?" 클릭
3. 닉네임과 연락처 입력
4. "이메일 전송하기" 클릭
5. carawoo96@gmail.com 받은편지함 확인!

## ❓ 문제 해결

### "이메일 전송에 실패했습니다" 에러

- API 키가 올바르게 설정되었는지 확인
- https://web3forms.com에서 API 키가 활성화되었는지 확인
- 브라우저 콘솔에서 상세 에러 확인

### 이메일이 도착하지 않음

- Gmail 스팸함 확인
- carawoo96@gmail.com이 올바른지 확인
- Web3Forms 대시보드(https://web3forms.com/dashboard)에서 전송 기록 확인

## 📌 참고

Web3Forms는 GitHub Star 2.5k+ 의 신뢰할 수 있는 서비스입니다.
- GitHub: https://github.com/web3forms/web3forms
- Docs: https://docs.web3forms.com
