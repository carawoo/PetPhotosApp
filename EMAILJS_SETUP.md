# EmailJS 설정 가이드

비밀번호 찾기 기능에서 자동으로 이메일을 전송하려면 EmailJS 서비스를 설정해야 합니다.

## 1. EmailJS 계정 생성

1. https://www.emailjs.com/ 접속
2. "Sign Up" 클릭하여 무료 계정 생성
3. 이메일 인증 완료

## 2. 이메일 서비스 연결

1. EmailJS 대시보드에서 "Email Services" 클릭
2. "Add New Service" 클릭
3. "Gmail" 선택
4. Gmail 계정(carawoo96@gmail.com)으로 로그인 및 권한 승인
5. Service ID를 복사 (예: `service_abc123`)

## 3. 이메일 템플릿 생성

1. "Email Templates" 클릭
2. "Create New Template" 클릭
3. 템플릿 설정:

**Template Name**: Password Reset Request

**Subject**:
```
[Peto] 비밀번호 재설정 요청
```

**Content**:
```
비밀번호 재설정 요청이 도착했습니다.

닉네임: {{nickname}}
가입 시 등록한 연락처: {{contact_info}}

위 정보로 사용자의 비밀번호를 재설정해주세요.

---
이 이메일은 Peto 앱에서 자동으로 전송되었습니다.
```

4. "Save" 클릭
5. Template ID를 복사 (예: `template_xyz789`)

## 4. Public Key 확인

1. "Account" → "General" 클릭
2. "Public Key" 확인 및 복사 (예: `AbCdEfGhIjKlMnOp`)

## 5. 코드에 키 적용

### 방법 1: 자동 설정 스크립트 사용 (추천)

터미널에서 아래 명령어 실행:

```bash
node setup-emailjs.js <SERVICE_ID> <TEMPLATE_ID> <PUBLIC_KEY>
```

**예시:**
```bash
node setup-emailjs.js service_abc123 template_xyz789 AbCdEfGhIjKlMnOp
```

### 방법 2: 수동으로 파일 수정

`src/screens/LoginScreen.js` 파일의 100-155줄 부근에서 아래 부분을 찾아 수정:

```javascript
await emailjs.send(
  'YOUR_SERVICE_ID',  // ← 여기에 Service ID 입력
  'YOUR_TEMPLATE_ID', // ← 여기에 Template ID 입력
  templateParams,
  'YOUR_PUBLIC_KEY'   // ← 여기에 Public Key 입력
);
```

**예시:**
```javascript
await emailjs.send(
  'service_abc123',
  'template_xyz789',
  templateParams,
  'AbCdEfGhIjKlMnOp'
);
```

## 6. 빌드 및 배포

```bash
# 빌드
npm run web:build

# 로컬 테스트 (선택사항)
node /tmp/test-server.js

# Vercel 배포
npx vercel --prod --force
```

## 7. 테스트

1. 사이트 접속 후 로그인 화면
2. "비밀번호를 잊으셨나요?" 클릭
3. 닉네임과 연락처 입력
4. "이메일 전송하기" 클릭
5. carawoo96@gmail.com으로 이메일이 도착하는지 확인

## 무료 플랜 제한사항

- 월 200통까지 무료
- 초과 시 유료 플랜 필요 (월 $9부터)
- 현재 사용량은 EmailJS 대시보드에서 확인 가능

## 주의사항

⚠️ **보안**: Public Key는 클라이언트 코드에 포함되어 공개됩니다. 하지만 EmailJS의 템플릿과 서비스 설정에서 발신 이메일을 제한할 수 있으므로 안전합니다.

⚠️ **스팸 방지**: EmailJS 대시보드에서 rate limiting을 설정하여 남용을 방지할 수 있습니다.

## 문제 해결

### 이메일이 도착하지 않는 경우

1. Gmail 스팸함 확인
2. EmailJS 대시보드에서 "Email History" 확인
3. Service ID, Template ID, Public Key가 정확한지 확인
4. 브라우저 콘솔에서 에러 메시지 확인

### CORS 에러가 발생하는 경우

- EmailJS는 기본적으로 CORS를 지원하므로 문제가 없어야 합니다
- 만약 발생한다면 EmailJS 대시보드 → Account → Security에서 도메인 추가
