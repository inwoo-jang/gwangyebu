# Supabase 로컬 개발 가이드

관계부 앱의 Supabase Postgres 스키마, RLS, Edge Function을 로컬에서 개발하기 위한 가이드.

---

## 1. CLI 설치 (macOS)

```bash
brew install supabase/tap/supabase
```

> Linux / Windows 는 [공식 가이드](https://supabase.com/docs/guides/local-development/cli/getting-started) 참고.

Docker Desktop 이 실행 중이어야 한다.

## 2. 로컬 스택 기동

```bash
npm run db:start    # 컨테이너 기동 (최초 1~2분 소요)
```

기동이 끝나면 콘솔에 출력되는 값을 `.env.local` 에 복사한다:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...      # 기동 로그의 anon key
SUPABASE_SERVICE_ROLE_KEY=...          # 기동 로그의 service_role key (서버 전용)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

대시보드: http://127.0.0.1:54323 (Supabase Studio)

## 3. 마이그레이션

본 디렉토리(`supabase/migrations/`)의 SQL 파일은 **timestamp 순서대로** 실행된다.

```bash
npm run db:reset     # 모든 마이그레이션 재실행 (DB 초기화)
npm run db:diff      # 로컬 변경을 새 마이그레이션 파일로 추출
npm run db:push      # 원격 프로젝트로 push (link 후)
```

### 마이그레이션 파일 구성 (M1)

| 파일 | 내용 |
|------|------|
| `20260504000000_extensions.sql` | pgcrypto, citext, handle_updated_at() |
| `20260504000100_enums.sql` | 도메인 enum 타입 |
| `20260504000200_persons.sql` | users 프로필 + persons |
| `20260504000300_tags.sql` | tags + person_tags |
| `20260504000400_contacts_log.sql` | 연락 이력 |
| `20260504000500_reminders.sql` | 리마인더 |
| `20260504000600_notes.sql` | 자유 메모 |
| `20260504000700_events.sql` | 경조사 (M2 예정 스키마 미리) |
| `20260504000800_gifts.sql` | 선물 |
| `20260504000900_messages.sql` | 메시지 |
| `20260504001000_relationship_scores.sql` | 점수 + 추천 + 피드백 + 사용량 |
| `20260504001100_user_settings.sql` | Web Push 구독 |
| `20260504001200_helpers.sql` | 도메인 트리거 (last_contact_at 등) |

## 4. RLS 정책

모든 `public.*` 테이블은 RLS 활성. 기본 패턴:

- 직접 소유: `auth.uid() = user_id`
- 간접 소유 (조인 테이블): trigger로 user_id 일관성 보장 + RLS는 자체 user_id 검증

`SUPABASE_SERVICE_ROLE_KEY` 는 RLS를 우회한다. **절대 클라이언트(브라우저)에 노출 금지**.

## 5. OAuth 설정 (선택)

`config.toml` 의 `[auth.external.google]`, `[auth.external.kakao]` 섹션을 활성화하고, 해당 provider의 client_id / secret을 환경변수 또는 직접 기입. 카카오 OAuth는 M2에서 정식 지원.

## 6. 트러블슈팅

| 증상 | 해결 |
|------|------|
| `port 54322 already in use` | `npm run db:stop` 또는 `supabase stop --no-backup` |
| 마이그레이션 충돌 (이미 존재) | `npm run db:reset` 으로 완전 초기화 |
| 타입 자동 생성 | `supabase gen types typescript --local > lib/supabase/database.types.ts` |

## 7. 디렉토리

- `migrations/` — SQL 마이그레이션
- `functions/` — Edge Functions (필요 시)
- `config.toml` — 로컬 환경 설정
