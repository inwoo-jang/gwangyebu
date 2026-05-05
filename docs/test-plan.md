# 관계부 테스트 계획 (Test Plan)

> 작성자: QA Engineer Agent
> 최종 갱신: 2026-05-04
> 버전: v0.1
> 대상 독자: frontend-engineer, backend-engineer, ai-engineer, devops, PM

본 문서는 PRD/feature-spec 인수조건을 검증하기 위한 **테스트 전략·환경·도구·CI 통합·한계**를 정리한다. 세부 테스트 케이스 목록은 `docs/test-cases.md`, 실제 구현은 `tests/` 하위에 있다.

---

## 1. 테스트 피라미드

| 레이어 | 도구 | 비율(목표) | 위치 | 실행 트리거 |
|--------|------|-----------|------|-----------|
| 단위 (Unit) | Vitest + RTL | **70%** | `tests/unit/**` | 모든 PR (`npm test`) |
| 통합 (Integration) | Vitest + Supabase mock | **20%** | `tests/unit/{queries,actions}/**` | 모든 PR |
| E2E | Playwright | **10%** | `tests/e2e/**` | manual / main push |

- 단위는 빠른 피드백 (LCP < 200ms 빌드 + 1초 내 테스트 실행).
- E2E는 핵심 시나리오만 — auth, persons CRUD, contact-log, reminders, search, ai-analysis, settings, navigation, empty-states, accessibility.
- 컴포넌트 테스트는 한국어 라벨(`getByText("인물 추가")`)로 검색 → 실제 사용자 경험 추적.

---

## 2. 테스트 환경

### 2-1. 로컬 개발

| 항목 | 값 |
|------|----|
| Node | 20.x |
| 패키지 매니저 | npm (lockfile 기준) |
| 단위 테스트 | `npm test` (vitest run) |
| 단위 watch | `npm run test:watch` |
| E2E | `npm run test:e2e` |
| E2E UI | `npm run test:e2e:ui` |
| 타입체크 | `npm run typecheck` |

### 2-2. Supabase

- **단위 테스트**: `vi.mock("@/lib/supabase/server")`로 mock 클라이언트.
- **E2E**: `process.env.E2E_DB="local"`이고 `supabase start` 가동 시 실제 사용. 미가동이면 `test.skip`로 graceful skip.
- **Admin 시드**: `tests/e2e/_helpers/seed.ts` — service_role 키로 인물 5명 + 연락 로그 3건 + 리마인더 2개 시드.

### 2-3. AI

- **항상 mock**. 실 LLM 호출 금지.
- 단위: `vi.mock("@/lib/ai")` 또는 provider 클라이언트 직접 mock (기존 `tests/unit/ai/`).
- E2E: `page.route("**/api/ai/**")` 로 결정적 fixture (`tests/e2e/_helpers/ai-mock.ts`).
- 별도 통합 테스트 (실 키): 환경변수 `RUN_LIVE_AI=1` 일 때만 (현재 미구현, M2).

### 2-4. 시간

- 단위: `vi.useFakeTimers({ now: new Date("2026-05-04T09:00:00+09:00") })`.
- E2E: Playwright `timezoneId: "Asia/Seoul"`, `locale: "ko-KR"`.

### 2-5. Viewport

- 기본: **Pixel 5** (393×851), **iPhone 13** (390×844).
- 일부 케이스는 **Desktop** (1280×800)로 분기 검증 (BottomNav 숨김 등).
- Playwright projects에서 자동 분기.

---

## 3. 테스트 데이터 시드 전략

### 3-1. E2E 시드

`tests/e2e/_helpers/seed.ts`

```
beforeEach():
  if !E2E_DB: test.skip
  cleanup(userId)            // 인물·로그·리마인더·태그 삭제
  insertFixtures():
    - persons: 김지수(친구·ENFP), 박민준(동료), 최수아(가족)
    - contacts_log: 김지수에 3건
    - reminders: 박민준 followup 내일
    - tags: ['친한친구', '회사', '가족']
```

### 3-2. 단위 시드

- 각 컴포넌트 테스트는 inline fixture (`tests/e2e/_helpers/fixtures.ts`도 공용).
- 액션 테스트는 mock 응답을 직접 작성 (vi.fn()).

### 3-3. 인증 시드

`tests/e2e/_helpers/auth.ts` — Playwright `storageState`로 로그인 세션 저장.
- 환경변수 `E2E_TEST_USER_TOKEN` (Supabase service_role로 발행한 임의 사용자 access_token) 가 있으면 사용.
- 없으면 `test.skip(!hasAuth, "auth storageState 미설정")`.

---

## 4. 커버리지 목표

| 레이어 | 라인 커버리지 | 분기 커버리지 |
|--------|-------------|-------------|
| `lib/format/**` | **95%+** (순수 함수) | 90% |
| `lib/ai/**` | **80%+** | 75% |
| `lib/queries/**` | 60% (쿼리 빌더 단위) | 50% |
| `lib/actions/**` | 70% (validation·권한) | 65% |
| `components/**` | 60% (visible variants + 카피) | 55% |
| 전체 | 65% | 60% |

> 측정: vitest `--coverage` 옵션 (현재 CI에 추가 안 함, M2 목표).

---

## 5. CI 통합

`.github/workflows/ci.yml`:

| Job | 트리거 | 실행 항목 |
|-----|------|---------|
| `quality` | 모든 PR + push | typecheck → lint → vitest unit |
| `build` | quality 성공 | next build |
| `e2e` | `workflow_dispatch` 또는 main push | playwright (현재 supabase 로컬 없이 일부 SKIP) |

**E2E job 한계**: GitHub Actions에서 supabase local 띄우는 `supabase/setup-cli` + `supabase start` 단계는 추후 추가 (M2). 현재 `E2E_DB` 미세팅이라 시드 의존 spec은 SKIP.

---

## 6. 도구 / 라이브러리

| 도구 | 버전 | 용도 |
|------|------|------|
| Vitest | ^2.1 | 단위/통합 |
| @testing-library/react | ^16.1 | 컴포넌트 렌더링 |
| @testing-library/jest-dom | ^6.6 | DOM matcher |
| jsdom | ^25 | DOM 환경 |
| Playwright | ^1.49 | E2E |
| axe-core | (transitive) | 접근성 자동 검사 (e2e에서 fetch + 인젝션) |
| zod | ^3.24 | validators 단위 검증 |

---

## 7. 셀렉터·로케이터 정책

1. **getByRole** 우선 — `button`, `link`, `heading`, `textbox`, `dialog`, `alert`, `status`, `meter`, `navigation`.
2. **getByLabel** — 폼 필드 (`이름`, `MBTI`, `메모`).
3. **getByText** — 정적 카피 (`인물 추가`, `로그인 링크 받기`).
4. **getByPlaceholder** — 폼 hint (`이름·태그·MBTI로 검색`).
5. **data-testid** — 위 4종으로 잡기 어려운 경우만, `data-testid="..."` 명시.

---

## 8. Mock / Stub 정책

### Supabase
- 단위는 `vi.mock` (서버 클라이언트 + auth-guard).
- E2E는 가능하면 실 supabase local. 미가동 시 spec 자동 skip.

### AI
- 항상 mock. 실 호출은 별도 통합 테스트에서만 (현재 없음).
- E2E `page.route("**/api/ai/**")`로 200/429/500 결정적 응답.

### 시간
- 단위: `vi.useFakeTimers({ shouldAdvanceTime: true, now: ... })`.
- E2E: `Asia/Seoul` timezone fixture.

### 외부 (OAuth, Web Push)
- E2E 직접 검증 불가 → 로그인 페이지 렌더링·버튼 존재만 확인.

---

## 9. 결정적(Deterministic) 보장

- 모든 random 시드는 fixture에 고정.
- 테스트 간 격리: `afterEach(cleanup)` (RTL), Playwright `test.beforeEach` 시드 리셋.
- 시간 의존 카피(`3일 전`)는 `vi.setSystemTime` 사용.

---

## 10. 알려진 한계 + 다음 단계

### 현재 한계 (M1 시점)

1. **OAuth 실 흐름 검증 불가** — 카카오/구글 OAuth는 Playwright에서 외부 도메인 navigation까지만 확인. 실제 콜백·세션 발급은 mock auth (storageState 직접 주입) 또는 supabase service_role로 우회.
2. **Supabase local in CI** — GitHub Actions에서 supabase CLI 컨테이너 부팅이 무거워 현재 미적용. E2E는 manual `workflow_dispatch` 또는 로컬 개발자 PC에서만.
3. **Web Push 발송** — Service Worker 등록까지만 단위로, 실제 push 발송은 별도 통합 테스트 (M2).
4. **카카오톡/인스타/캘린더 연동** — M3 기능, 현재 테스트 없음.
5. **AI 실 호출** — `RUN_LIVE_AI=1` + 실제 키가 있을 때만 별도 spec 실행 (M2 추가 예정).
6. **Visual regression** — 스냅샷/픽셀 비교는 미도입. M2에서 Percy/Chromatic 검토.
7. **부하/성능 테스트** — k6/Lighthouse CI 미도입. 인수조건의 P95 < 1초 등은 수동 측정.

### 다음 단계 (M2 이후)

- Supabase local in CI (docker-compose 또는 supabase/setup-cli action).
- Lighthouse CI로 성능 회귀 모니터링.
- Coverage 리포트 → Codecov 업로드.
- Visual regression (Chromatic).
- 카카오 OAuth E2E (검수 통과 후).
- Live AI 통합 테스트 (별도 nightly job).
- 실 푸시 발송 통합 (FCM/Web Push staging).
- a11y axe 결과를 PR comment로 자동 게시.
