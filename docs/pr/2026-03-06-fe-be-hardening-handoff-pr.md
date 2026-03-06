# 프론트-백엔드 연동 안정화 핸드오프

## 목표

- 프론트엔드 안정화 작업을 시작하기 전에 현재 FE/BE 계약과 리스크를 한 문서로 고정한다.
- 백엔드 스레드가 바로 병렬 작업을 시작할 수 있도록 충돌 가능 지점과 선행 조건을 남긴다.
- 이번 커밋은 코드 수정이 아니라 연동 조사 결과와 작업 순서 정리용이다.

## 현재 프론트엔드 관찰 결과

### 1. 인증 보호가 실제 세션이 아니라 쿠키 존재 여부에 의존한다

- `middleware.ts`와 `src/app/(app)/layout.tsx`는 `auth_session` 쿠키만 확인한다.
- 로그인/회원가입 성공 시 프론트가 `auth_session=active`를 직접 기록한다.
- 실제 사용자 정보는 `/auth/session` 응답에 의존하므로 서버 세션이 끊기면 보호 화면은 통과하지만 내부 API가 연쇄적으로 실패할 수 있다.

### 2. 조직/레포 컨텍스트가 전역 메모리 상태에 과하게 의존한다

- `src/features/shared/ui-store.ts`는 영속화가 없다.
- 이슈 상세와 일부 화면은 `orgId` 쿼리 또는 store가 비어 있으면 즉시 빈 상태 또는 에러 상태로 빠진다.
- 조직 전환 시 현재 `activeRepoId`가 새 조직의 repo 목록에 속하는지 검증하지 않는다.

### 3. 백엔드 실패 복구 경로가 약하다

- 전역 React Query는 `retry: 1`만 설정되어 있다.
- `board`, `requests`, `reports`, repo detail 등은 에러 후 재시도 경로가 거의 없다.
- 전역 `error.tsx`/`global-error.tsx`도 현재 보이지 않는다.

### 4. 공용 헤더가 장애를 정상 상태처럼 숨길 수 있다

- 알림 쿼리가 실패해도 unread 0과 "알림 없음"으로 보일 수 있다.
- 이 쿼리는 30초마다 재시도되므로, 보호 레이아웃 전체에서 잘못된 정상 시그널을 줄 수 있다.

### 5. 보드 낙관적 업데이트에 실패 롤백이 없다

- 칸반 이동은 로컬 상태를 먼저 갱신하고 실패 시 toast만 띄운다.
- 서버 reorder 실패나 version conflict가 나면 UI와 서버 상태가 어긋날 수 있다.

## 현재 백엔드 계약 메모

- 인증은 HttpOnly 쿠키 기반이고, CORS는 `credentials: true` 전제다.
- 보호 API는 base path 없이 루트 기준으로 열려 있다.
- alias 경로는 `orgId` 쿼리 또는 `x-org-id` 헤더 중 하나를 요구한다.
- 공통 에러 응답은 대체로 `{ code, message, requestId, issues? }` 형식이다.
- `GET /health`는 `{ ok, service, timestamp }`를 반환한다.
- `GET /requests` alias는 `OWNER/ADMIN` 권한이 필요하다.
- issue update/move 계열은 version conflict를 낼 수 있다.
- 일부 비동기 기능은 mock 또는 demo 성격이 강하다.

## FE 선행 작업 우선순위

1. 세션 실패와 설정 누락을 공통 에러 모델로 노출한다.
2. 조직/레포 컨텍스트 전달 규칙을 중앙화한다.
3. 공용 헤더와 주요 페이지에 재시도 동선을 추가한다.
4. 칸반 보드 실패 롤백 또는 refetch 복구를 넣는다.
5. 데모 전용 mock/experimental 흐름을 UI에서 명시한다.

## 백엔드 스레드용 handoff

- 원인/목표:
  FE가 백엔드 장애를 추적하기 어려운 상태다. 목표는 기존 응답 스키마를 유지하면서 `code`, `message`, `requestId` 일관성을 확인하고 깨진 문자열이나 운영값 불일치를 정리하는 것이다.

- 수정 범위:
  인증/예외 처리, CORS/env, org context, requests 권한/응답, healthcheck 관련 파일 중심으로 점검한다.

- 검증 결과:
  이번 문서는 정적 코드 점검 기반이다. 서버 실행, 실제 API 호출, DB/Redis 연동, 테스트 실행은 아직 하지 않았다.

- 충돌 가능 파일:
  auth service/controller, 공통 exception filter, org context interceptor, requests controller/service, reports module/service.

- 병합 선행 조건:
  `CORS_ORIGINS`와 `COOKIE_*` 운영값 확정, org context 전달 방식 하나로 통일, 인증 bootstrap 기준 엔드포인트 확정, mock 기능 노출 범위 결정.

## 검증 메모

- FE worktree 생성: 완료
- `apps/web` 의존성 설치: 완료
- `npm run lint`: 통과
- `npm run test`: sandbox의 `spawn EPERM` 제한으로 미완료

## 다음 액션

- 이 문서를 기준으로 FE는 공통 에러/세션 하드닝부터 커밋 단위를 만든다.
- BE는 CORS, 쿠키, 공통 에러 응답, requests 권한/응답 shape를 우선 점검한다.
