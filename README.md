# oh-my-collab Frontend

🇰🇷 [한국어](#-korean) | 🇺🇸 [English](#-english)

---

## 🇰🇷 Korean

<details open>
<summary>설명 펼치기/닫기</summary>

### 개요
- Next.js(App Router) 기반 프론트엔드 전용 저장소입니다.
- 백엔드는 별도 Nest 저장소(`oh-my-collab-BE`)에서 운영합니다.
- 모든 API 호출은 `NEXT_PUBLIC_API_BASE_URL` 기준으로 수행하며 쿠키 인증(`credentials: include`)을 사용합니다.

### 필수 환경변수
```env
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
```

### 로컬 실행
```bash
npm --prefix apps/web install
cp apps/web/.env.example apps/web/.env.local
npm --prefix apps/web run dev
```

### 검증 명령
```bash
npm --prefix apps/web run lint
npm --prefix apps/web run test
npm --prefix apps/web run test:e2e
npm --prefix apps/web run build
```

### 배포 런북 (Vercel)
1. Vercel에서 프로젝트 Import 후 Root Directory를 `apps/web`로 지정
2. Environment Variable에 `NEXT_PUBLIC_API_BASE_URL` 등록
3. 커스텀 도메인 연결: `app.your-domain.com`
4. 배포 후 브라우저에서 API 호출/로그인 흐름 확인

### FE 스모크 체크리스트
- [ ] 로그인/로그아웃 동작
- [ ] 조직 선택 후 이슈 목록 표시
- [ ] 이슈 상세 진입 시 `orgId` 컨텍스트 유지
- [ ] 칸반 이동 후 상태 반영
- [ ] 협업요청/리포트 화면 렌더링
- [ ] 환경변수 누락 시 설정 에러 노출

</details>

---

## 🇺🇸 English

<details open>
<summary>Show / Hide Description</summary>

### Overview
- Frontend-only repository built with Next.js App Router.
- Backend is maintained separately in `oh-my-collab-BE` (NestJS).
- All API calls use `NEXT_PUBLIC_API_BASE_URL` with cookie auth (`credentials: include`).

### Required Environment Variable
```env
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
```

### Local Run
```bash
npm --prefix apps/web install
cp apps/web/.env.example apps/web/.env.local
npm --prefix apps/web run dev
```

### Verification Commands
```bash
npm --prefix apps/web run lint
npm --prefix apps/web run test
npm --prefix apps/web run test:e2e
npm --prefix apps/web run build
```

### Deployment Runbook (Vercel)
1. Import project on Vercel and set Root Directory to `apps/web`
2. Configure `NEXT_PUBLIC_API_BASE_URL`
3. Attach custom domain `app.your-domain.com`
4. Validate login/session and key pages after deployment

### FE Smoke Checklist
- [ ] Login/logout works
- [ ] Org selection and issue list render
- [ ] Issue detail keeps `orgId` context
- [ ] Kanban status update is reflected
- [ ] Requests/reports pages render
- [ ] Missing env shows configuration error state

</details>