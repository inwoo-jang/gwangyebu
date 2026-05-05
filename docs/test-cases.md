# 인수조건 → 테스트 매핑 (Test Cases)

> 작성자: QA Engineer Agent
> 최종 갱신: 2026-05-04
> 버전: v0.1
> 참조: `docs/feature-spec.md` (AC ID 정의)

각 인수조건 ID(AC-*)별로 어떤 테스트(파일·케이스명)가 검증하는지 매핑한다. 표시는 다음 약어를 사용:

- **U** = Vitest 단위 (`tests/unit/**`)
- **E** = Playwright E2E (`tests/e2e/**`)
- **M** = 수동 검증 (자동화 어려움)
- **DEFERRED** = M2/M3에서 자동화 (현재 SKIP 또는 미작성)

---

## F-AUTH (인증)

| AC ID | 시나리오 | 종류 | 파일·케이스 |
|-------|--------|------|-----------|
| AC-AUTH-1 | 가입·인증 메일 발송 | M | OAuth/이메일 실 흐름은 supabase 환경 필요 — `tests/e2e/auth.spec.ts > 로그인 폼 렌더`만 자동화 |
| AC-AUTH-2 | 중복 가입 차단 | DEFERRED | supabase mock 로직 작성 필요 (M2) |
| AC-AUTH-3 | 구글 OAuth 첫 로그인 | E | `tests/e2e/auth.spec.ts > Google 버튼 노출` (외부 navigate는 검증 안 함) |
| AC-AUTH-4 | 세션 만료 → 로그인 리다이렉트 | E | `tests/e2e/auth.spec.ts > 보호 라우트 미인증 시 로그인으로 리다이렉트` |
| AC-AUTH-5 | 로그아웃 | E | `tests/e2e/settings.spec.ts > 로그아웃 폼 노출` |

---

## F-PERSON (인물 CRUD)

| AC ID | 시나리오 | 종류 | 파일·케이스 |
|-------|--------|------|-----------|
| AC-PER-1 | 인물 생성 | E + U | `tests/e2e/persons.spec.ts > 인물 생성 폼`, `tests/unit/actions/persons.test.ts > createPerson 검증` |
| AC-PER-2 | 사진 업로드 5MB 제한 | DEFERRED | M2 (Storage upload mock 필요) |
| AC-PER-3 | 페이지네이션 | U | `tests/unit/queries/persons.test.ts > limit/offset 적용` |
| AC-PER-4 | 인물 수정 | E + U | `tests/e2e/persons.spec.ts > 인물 편집`, `tests/unit/actions/persons.test.ts > updatePerson partial` |
| AC-PER-5 | 소프트 삭제 | U | `tests/unit/actions/persons.test.ts > deletePerson은 deleted_at 세팅` |
| AC-PER-6 | 휴지통 복원 | DEFERRED | M2 |
| AC-PER-7 | 관계유형 변경 시 리마인더 | DEFERRED | M2 |

---

## F-TAG (태그)

| AC ID | 시나리오 | 종류 | 파일·케이스 |
|-------|--------|------|-----------|
| AC-TAG-1 | 태그 생성 | E | `tests/e2e/persons.spec.ts > 태그 입력 UI` |
| AC-TAG-2 | 중복 방지 | DEFERRED | M2 (서버 액션 unique 제약) |
| AC-TAG-3 | 이름 변경 | DEFERRED | M2 |
| AC-TAG-4 | 삭제 시 인물 보존 | DEFERRED | M2 |
| AC-TAG-5 | 관계유형 enum 고정 | U | `tests/unit/components/PersonCard.test.tsx > relationshipType 라벨 매핑` |
| 색상 매핑 | colorIndex 자동 배정 | U | `tests/unit/format/tag.test.ts` 전부 |

---

## F-CONTACT-LOG (연락 이력)

| AC ID | 시나리오 | 종류 | 파일·케이스 |
|-------|--------|------|-----------|
| AC-CL-1 | 연락 기록 저장 | E | `tests/e2e/contact-log.spec.ts > 연락 기록 다이얼로그` |
| AC-CL-2 | 빠른 기록 (1탭) | DEFERRED | 컨텍스트 메뉴 미구현, M2 |
| AC-CL-3 | 수정 | DEFERRED | 편집 UI 미구현 |
| AC-CL-4 | 삭제 | DEFERRED | 스와이프 UI 미구현 |
| AC-CL-5 | 정렬·페이징 | M | 수동 |

---

## F-REMINDER (리마인더)

| AC ID | 시나리오 | 종류 | 파일·케이스 |
|-------|--------|------|-----------|
| AC-RM-1 | 자동 생성 | DEFERRED | 서버 cron, M2 |
| AC-RM-2 | 수동 생성 | E | `tests/e2e/reminders.spec.ts > 리마인더 생성 폼 노출` |
| AC-RM-3 | Web Push 발송 | M | 외부 발송 |
| AC-RM-4 | 완료 토글 | E | `tests/e2e/reminders.spec.ts > 완료 버튼` |
| AC-RM-5 | 연기 | E | `tests/e2e/reminders.spec.ts > 내일로 연기 버튼` |
| AC-RM-6 | 생일 반복 | DEFERRED | M2 |
| AC-RM-7 | 그룹핑 (오늘/이번주) | E | `tests/e2e/reminders.spec.ts > 빈 상태 카피` |

---

## F-EVENT / F-GIFT (P1, M2)

| AC ID | 시나리오 | 종류 | 파일·케이스 |
|-------|--------|------|-----------|
| AC-EV-* | 경조사 | DEFERRED | M2 |
| AC-GF-* | 선물 | DEFERRED | M2 |

---

## F-NOTE / F-MESSAGE

| AC ID | 시나리오 | 종류 | 파일·케이스 |
|-------|--------|------|-----------|
| AC-NT-1 | 노트 생성 | DEFERRED | E2E (서버 의존) |
| AC-NT-2 | pinned 정렬 | DEFERRED | M2 |
| AC-NT-3 | 검색 포함 | DEFERRED | M2 |
| AC-MS-* | 메시지 (M2) | DEFERRED | M2 |

---

## F-AI-BASIC (관계 분석)

| AC ID | 시나리오 | 종류 | 파일·케이스 |
|-------|--------|------|-----------|
| AC-AI-1 | 주간 분석 cron | M | 서버 cron, M2 nightly |
| AC-AI-2 | 수동 트리거 | E | `tests/e2e/ai-analysis.spec.ts > 분석 시작 버튼 (mocked)` |
| AC-AI-3 | 프로바이더 선택 | E + U | `tests/e2e/settings.spec.ts > AI 프로바이더 select`, `tests/unit/ai/providers.test.ts` |
| AC-AI-4 | 추천 사유 한국어 | U | `tests/unit/ai/relationship-analysis.test.ts` (기존) |
| AC-AI-5 | 피드백 반영 | DEFERRED | M2 |
| AC-AI-6 | 인물 5명 미만 안내 | DEFERRED | M2 |
| AC-AI-7 | quota | E | `tests/e2e/ai-analysis.spec.ts > 429 quota 응답 처리` |
| AC-AI-8 | JSON 스키마 위반 재시도 | U | `tests/unit/ai/relationship-analysis.test.ts` (기존) |
| AC-AI-9 | 개인정보·프롬프트 7일 | DEFERRED | M2 (운영) |
| 점수 → 밴드 | bandFor 매핑 | U | `tests/unit/format/score.test.ts` 전부 |

---

## F-SEARCH

| AC ID | 시나리오 | 종류 | 파일·케이스 |
|-------|--------|------|-----------|
| AC-SR-1 | 텍스트 검색 디바운스 | E | `tests/e2e/search.spec.ts > 검색바 입력` |
| AC-SR-2 | 초성 검색 | DEFERRED | trigram 인덱스 미구현, M2 |
| AC-SR-3 | 필터 조합 AND | E | `tests/e2e/search.spec.ts > 관계유형 필터` |
| AC-SR-4 | 정렬 옵션 | DEFERRED | M2 |
| AC-SR-5 | 최근 검색어 5개 | DEFERRED | M2 |
| AC-SR-6 | 오프라인 부분 동작 | DEFERRED | M2 |
| 빈 결과 | 빈 상태 카피 | E | `tests/e2e/search.spec.ts > 결과 0건 안내`, `tests/e2e/empty-states.spec.ts` |

---

## F-SETTINGS

| AC ID | 시나리오 | 종류 | 파일·케이스 |
|-------|--------|------|-----------|
| AC-ST-1 | 카테고리별 알림 토글 | E | `tests/e2e/settings.spec.ts > 알림 스위치 노출` |
| AC-ST-2 | 프로바이더 변경 | E | `tests/e2e/settings.spec.ts > AI 프로바이더 select` |
| AC-ST-3 | 사용량 표시 | DEFERRED | M2 |
| AC-ST-4 | JSON Export 즉시 | E | `tests/e2e/settings.spec.ts > JSON 다운로드 버튼` |
| AC-ST-5 | Export 이력 | DEFERRED | M2 (감사 로그) |
| AC-ST-6 | Import (P1) | DEFERRED | M2 |
| AC-ST-7 | 회원 탈퇴 30일 유예 | DEFERRED | M2 |

---

## 비기능 (공통)

| 항목 | 검증 | 종류 | 파일·케이스 |
|------|------|------|-----------|
| 접근성 | WCAG 2.1 AA, axe-core | E | `tests/e2e/accessibility.spec.ts` (홈, 로그인, 검색, 리마인더, 설정) |
| 한국어 라벨 | 컴포넌트 카피 | U | 전 컴포넌트 테스트 |
| 모바일 viewport | Pixel 5 / iPhone 13 | E | playwright projects 설정으로 자동 |
| 다크모드 | system 추종 토글 | DEFERRED | M2 (visual) |
| 오프라인 | IndexedDB 큐 | DEFERRED | M2 |

---

## 빈 상태 / 네비게이션

| 항목 | 종류 | 파일·케이스 |
|------|------|-----------|
| 인물 빈 상태 | E | `tests/e2e/empty-states.spec.ts > 인물 0명 카피` |
| 리마인더 빈 상태 | E | `tests/e2e/empty-states.spec.ts > 리마인더 0건 카피` |
| 검색 빈 상태 | E | `tests/e2e/empty-states.spec.ts > 검색 0건 카피` |
| BottomNav 5탭 | E | `tests/e2e/navigation.spec.ts > 모바일에서 nav 노출` |
| 데스크톱은 BottomNav 숨김 | E | `tests/e2e/navigation.spec.ts > 데스크톱에서 nav lg:hidden` |
