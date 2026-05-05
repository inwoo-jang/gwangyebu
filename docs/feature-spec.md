# 관계부 기능 명세서 (Feature Specification)

> 작성자: Product Planner Agent
> 최종 갱신: 2026-05-04
> 버전: v0.1
> 대상 독자: ux-designer, frontend-engineer, backend-engineer, ai-engineer, qa-engineer

본 문서는 PRD에 정의된 기능을 구현 가능 수준의 인수조건(Acceptance Criteria)·입출력·엣지 케이스로 명세한다. 인수조건은 **Given/When/Then** 형식, 우선순위는 **P0(M1)/P1(M2)/P2(M3)** 로 표기.

공통 표기:
- 모든 데이터 변경은 사용자 본인 행에만 가능 (Supabase RLS)
- 모든 시간은 UTC 저장, 표시는 KST 기본
- 모든 텍스트 입력은 한국어 기본 + 이모지 허용

---

## 1. F-AUTH — 인증 (이메일 + OAuth: 구글/카카오) [P0]

### 개요
이메일/비밀번호, 구글 OAuth, 카카오 OAuth(M2)로 가입·로그인. Supabase Auth 사용.

### 입력
- 이메일 (RFC 5322), 비밀번호 (8~64자, 숫자·영문 포함), 표시명 (1~30자)
- OAuth: 구글/카카오 동의 화면

### 출력
- 세션 토큰 (Supabase JWT, 1시간 유효 + Refresh)
- 사용자 프로필 행 (User 테이블)

### 인수조건
- **AC-AUTH-1 (회원가입)**
  - **Given** 미가입 이메일과 유효한 비밀번호, 약관 동의가 체크됨
  - **When** "가입하기" 탭
  - **Then** 인증 메일이 발송되고, 인증 완료 시 자동 로그인 + 온보딩 화면으로 이동
- **AC-AUTH-2 (중복 가입 방지)**
  - **Given** 이미 등록된 이메일
  - **When** 해당 이메일로 가입 시도
  - **Then** "이미 가입된 이메일이에요. 로그인하시겠어요?" 다이얼로그 표시
- **AC-AUTH-3 (구글 OAuth)**
  - **Given** 구글 로그인 동의
  - **When** 첫 로그인
  - **Then** User 행 생성 + 표시명/사진 자동 채움 + 온보딩 진입
- **AC-AUTH-4 (세션 만료)**
  - **Given** 세션 만료 후 보호된 페이지 접근
  - **When** 자동 갱신 실패
  - **Then** 로그인 화면으로 리다이렉트, 로그인 후 원래 URL로 복귀
- **AC-AUTH-5 (로그아웃)**
  - **Given** 로그인 상태
  - **When** 설정에서 "로그아웃" 탭
  - **Then** 토큰 폐기 + 랜딩 페이지로 이동, 로컬 캐시 삭제 옵션 안내

### 엣지 케이스
- 비밀번호 정책 미달 → 인라인 에러 + 강도 표시바
- 이메일 인증 24시간 내 미클릭 → 재발송 버튼
- OAuth 중 사용자 취소 → 토스트 "로그인이 취소되었어요"
- 카카오 OAuth (M2) 미검수 상태 → 옵션 숨김
- Brute force → 5회 실패 시 5분 잠금

### 의존성
- Supabase Auth, 구글 OAuth Console, 카카오 디벨로퍼스(M2)

---

## 2. F-PERSON — 인물 CRUD [P0]

### 개요
사용자가 자신의 인맥을 저장·조회·수정·삭제한다. 1인당 최대 1,000명 (M1 기준).

### 입력 / 필드
| 필드 | 타입 | 제약 | 필수 |
|------|------|------|------|
| name | string | 1~50자 | Y |
| photo_url | string(url) | 5MB 이하, jpg/png/webp | N |
| relationship_type | enum | family/friend/colleague/client/acquaintance/etc | N (기본 etc) |
| tags | string[] | 각 1~20자, 최대 10개 | N |
| birth_month | int | 1~12 | N |
| birth_day | int | 1~31 | N |
| birth_year | int | 1900~현재 | N |
| how_we_met | string | 0~100자 | N |
| mbti | enum | 16종 + null | N |
| food_preference | string | 0~200자 | N |
| memo | string | 0~2000자 | N |
| reminder_interval_days | int | 0~365, 0=없음 | N |
| status | enum | active / inactive | Y (기본 active) |

### 출력
- 인물 객체 + 연관 last_contact_at, next_reminder_at(계산값)

### 인수조건
- **AC-PER-1 (생성)**
  - **Given** 이름 "홍길동" 입력
  - **When** 저장
  - **Then** Person 행 생성, 홈 카드 리스트에 즉시 표시(Optimistic), DB 동기화 완료 시 ID 확정
- **AC-PER-2 (사진 업로드)**
  - **Given** 5MB 이하 jpg
  - **When** 업로드
  - **Then** Supabase Storage에 저장 + photo_url 갱신, 5MB 초과 시 에러 + 압축 제안
- **AC-PER-3 (조회)**
  - **Given** 인물 100명 보유
  - **When** 홈 진입
  - **Then** P95 1초 내 첫 화면 렌더, 페이지네이션 50건씩
- **AC-PER-4 (수정)**
  - **Given** 인물 상세 화면
  - **When** 필드 수정 후 저장
  - **Then** 변경된 필드만 PATCH, 낙관적 UI 반영
- **AC-PER-5 (삭제 — 소프트)**
  - **Given** 인물 삭제 버튼 탭
  - **When** 확인 다이얼로그 "관련 연락 기록·리마인더도 함께 삭제됩니다" 동의
  - **Then** soft-delete (deleted_at 세팅), 30일 후 hard-delete
- **AC-PER-6 (복원)**
  - **Given** 30일 이내 삭제된 인물
  - **When** 설정 > 휴지통에서 복원 탭
  - **Then** deleted_at = null, 홈에 재출현
- **AC-PER-7 (관계유형 변경)**
  - **When** relationship_type 변경
  - **Then** 자동 리마인더 주기 디폴트 갱신, 기존 활성 리마인더는 유지(사용자 동의 후 갱신 옵션)

### 엣지 케이스
- 동명이인 — 경고만, 차단 안함
- 사진 EXIF 위치 정보 — 저장 전 제거
- 메모 2000자 초과 — 입력 차단 + 카운터 표시
- 오프라인 생성 — IndexedDB 큐 → 온라인 시 sync, 충돌 시 최신 우선

---

## 3. F-TAG — 태그 / 관계유형 라벨 [P0]

### 개요
사용자 정의 태그(자유 라벨) + 시스템 enum 관계유형(가족·친구·동료·고객사·지인·기타). 검색·필터·AI 분석에 활용.

### 입력
- 태그명 (1~20자, 한글·영문·숫자·이모지)
- 색상 (선택, 기본 자동 배정 8색 팔레트 중 1)

### 출력
- Tag 객체 (사용자 단위 unique name)
- Person ↔ Tag N:M

### 인수조건
- **AC-TAG-1 (생성)**
  - **Given** 인물 폼에서 새 태그 "스타트업 동료" 입력
  - **When** 엔터
  - **Then** Tag 생성 + Person에 연결, 다른 인물 폼에서 자동 완성에 출현
- **AC-TAG-2 (중복 방지)**
  - **Given** "친구" 태그 이미 존재
  - **When** 동일 이름 입력
  - **Then** 기존 태그 자동 매칭, 신규 생성 안 함
- **AC-TAG-3 (이름 변경)**
  - **When** 설정 > 태그 관리에서 이름 변경
  - **Then** 모든 연관 인물에 즉시 반영
- **AC-TAG-4 (삭제)**
  - **When** 태그 삭제
  - **Then** Person ↔ Tag 연결만 제거, 인물은 보존, 확인 다이얼로그 표시
- **AC-TAG-5 (관계유형은 enum 고정)**
  - **Given** relationship_type
  - **When** 사용자 변경 시도
  - **Then** 6개 enum 중 선택만 허용, 자유 입력 불가

### 엣지 케이스
- 태그명 공백/이모지만 → 차단
- 한 인물당 태그 11개 이상 → "최대 10개까지" 안내
- 태그 사용 0회 — 90일 후 정리 제안 (P1)

---

## 4. F-CONTACT-LOG — 연락 이력 로그 [P0]

### 개요
인물별 연락 1건씩 기록. 채널·일시·방향·메모. last_contact_at 자동 갱신.

### 입력
| 필드 | 타입 | 제약 |
|------|------|------|
| person_id | uuid | FK Person |
| channel | enum | phone / kakao / sms / email / inperson / other |
| direction | enum | outbound / inbound / unknown |
| occurred_at | timestamptz | <= 현재 + 1시간 (미래 경고) |
| memo | string | 0~500자 |

### 출력
- ContactLog 행 + Person.last_contact_at 갱신

### 인수조건
- **AC-CL-1 (저장)**
  - **Given** 인물 상세에서 채널 "카톡", 일시 "지금"
  - **When** 저장
  - **Then** 행 생성 + Person.last_contact_at = occurred_at + 자동 리마인더 제안 모달
- **AC-CL-2 (빠른 기록)**
  - **Given** 인물 카드 길게 누름
  - **When** 컨텍스트 메뉴 "방금 연락함"
  - **Then** channel=other, direction=outbound, occurred_at=now로 1탭 저장
- **AC-CL-3 (수정)**
  - **When** 로그 항목 탭 후 편집
  - **Then** 필드 갱신, last_contact_at은 가장 최근 occurred_at 기준 재계산
- **AC-CL-4 (삭제)**
  - **When** 스와이프 삭제 + 확인
  - **Then** 행 hard-delete, last_contact_at 재계산
- **AC-CL-5 (정렬·페이징)**
  - **Given** 로그 100건+
  - **When** 인물 상세 진입
  - **Then** 최신순, 페이지당 30건, 무한 스크롤

### 엣지 케이스
- 미래 일시 → 경고 다이얼로그, 강제 진행 가능
- 5분 내 동일 채널 중복 → "방금 기록한 내용과 합칠까요?"
- 메모에 URL → 자동 링크화 + 미리보기 (P1)
- 오프라인 → 큐 적재

---

## 5. F-REMINDER — 리마인더 (생성/조회/완료) [P0]

### 개요
인물별 다음 연락 시점을 알려주는 알림. 자동(연락 후 N일) + 수동 생성. Web Push로 발송.

### 입력
| 필드 | 타입 | 제약 |
|------|------|------|
| person_id | uuid | FK |
| reminder_type | enum | followup / birthday / event / custom |
| scheduled_at | timestamptz | 미래 |
| repeat_rule | enum | none / yearly (생일·기념일) |
| channel | enum | inapp / webpush / kakao(P2) |
| status | enum | active / done / dismissed / snoozed |
| message | string | 0~200자, 비우면 자동 생성 |

### 출력
- Reminder 행 + 푸시 등록

### 인수조건
- **AC-RM-1 (자동 생성)**
  - **Given** ContactLog 저장 + Person.reminder_interval_days = 30
  - **When** 사용자가 "다음 연락 30일 후" 제안 수락
  - **Then** Reminder(scheduled_at = now+30d) 생성
- **AC-RM-2 (수동 생성)**
  - **When** 인물 상세 > 리마인더 추가 > 날짜 선택 > 저장
  - **Then** 활성 리마인더 1개 (인물당 followup 활성은 1개로 제한, 신규 생성 시 기존 dismissed 처리)
- **AC-RM-3 (Web Push 발송)**
  - **Given** scheduled_at 도래 + 권한 허용
  - **When** 서버 cron이 발송 트리거
  - **Then** Push 수신 + 알림 탭 시 인물 상세 + "연락 기록" 모달 자동 노출
- **AC-RM-4 (완료)**
  - **When** 알림에서 "기록함" 또는 인앱에서 ContactLog 저장
  - **Then** 관련 리마인더 status=done, 자동 다음 리마인더 제안
- **AC-RM-5 (연기)**
  - **When** 알림 액션 "1일 연기"
  - **Then** scheduled_at += 1d, status=snoozed (다음 발송 시 active로 복구)
- **AC-RM-6 (생일 반복)**
  - **Given** repeat_rule=yearly + birthday
  - **When** 발송 후
  - **Then** 자동 1년 후 재예약
- **AC-RM-7 (조회)**
  - **Given** 홈 진입
  - **When** "오늘/이번주" 탭
  - **Then** scheduled_at 기준 그룹핑된 리스트

### 엣지 케이스
- iOS PWA 미설치 → Push 불가, 인앱 배너로만 동작 + 안내
- 디바이스 시간 변경(해외) — 서버 timezone 기준 발송
- 인물 삭제 → 활성 리마인더도 함께 cascade dismissed
- 권한 도중 거부 — 설정 화면에서 재요청 안내
- 동일 시각 다중 알림 — 그룹 알림 (Top N + "외 X명")

---

## 6. F-EVENT — 경조사 기록 [P1, M2]

### 개요
인물별 경조사(결혼·장례·돌·생일·기념일·기타) 기록 + 참석 여부 + 지출 금액.

### 입력
| 필드 | 타입 | 제약 |
|------|------|------|
| person_id | uuid | FK |
| event_type | enum | wedding / funeral / firstbirthday / birthday / anniversary / other |
| occurred_at | date | |
| location | string | 0~100자 |
| attended | bool | |
| amount_paid | int | KRW, ≥ 0 |
| memo | string | 0~500자 |

### 인수조건
- **AC-EV-1 (생성)**: Given 인물 상세, When 경조사 추가 폼 저장, Then Event 행 + 인물 합계 갱신
- **AC-EV-2 (캘린더 동기화 OFF)**: M3 기능 OFF 상태에서는 단순 저장만
- **AC-EV-3 (생일 자동 리마인더)**: event_type=birthday + repeat=yearly이면 1년마다 알림
- **AC-EV-4 (합계)**: 인물 상세 헤더에 "내가 낸 총액" 표시
- **AC-EV-5 (수정/삭제)**: 합계 즉시 재계산

### 엣지 케이스
- 참석 못함 + 0원 — 허용 ("마음만 보냄")
- 1인당 같은 종류 다회 — 허용 (이혼/재혼 등)
- 미래 날짜 — 허용 (예정된 결혼식 등록)

---

## 7. F-GIFT — 선물 주고받음 기록 [P1, M2]

### 개요
인물별 현금/물품 선물 양방향 기록. 합계 자동 계산.

### 입력
| 필드 | 타입 | 제약 |
|------|------|------|
| person_id | uuid | FK |
| direction | enum | sent / received |
| kind | enum | cash / item |
| amount | int | cash일 때 KRW |
| item_name | string | item일 때 1~50자 |
| estimated_value | int | item일 때 KRW (선택) |
| occurred_at | date | |
| reason | string | 0~100자 (생일·답례·감사 등) |
| linked_event_id | uuid | optional, Event FK |

### 인수조건
- **AC-GF-1 (생성)**: 방향·종류 필수, 저장 시 합계 갱신
- **AC-GF-2 (경조사 연계)**: 결혼식 축의금 → Event(wedding)에 linked_event_id 연결, 양쪽에서 조회 가능
- **AC-GF-3 (합계 표시)**: 인물 상세에 "보냄/받음" 양방향 합계
- **AC-GF-4 (정산 뷰, P1.5)**: 모든 인물 합계를 통계 페이지에서 종합

### 엣지 케이스
- 물품 선물의 추정가는 선택 (정확히 모를 수 있음)
- 동일 일자 다건 허용

---

## 8. F-NOTE / F-MESSAGE — 메모 + 메시지 저장 [P0 / P1]

### 개요
- **Note (P0)**: 인물별 자유 메모 (인물 폼의 memo 필드 외, 타임스탬프형 노트)
- **Message (P1, M2)**: 카톡 캡처/텍스트 붙여넣기 저장 (Storage + DB)

### Note 입력
| 필드 | 타입 | 제약 |
|------|------|------|
| person_id | uuid | FK |
| body | string | 1~5000자 |
| pinned | bool | 기본 false |
| created_at | timestamptz | auto |

### Message 입력 (M2)
| 필드 | 타입 | 제약 |
|------|------|------|
| person_id | uuid | FK |
| source | enum | kakao / sms / email / other |
| body | string | 0~10000자 |
| image_url | string | optional, 10MB 이하 |
| occurred_at | timestamptz | |

### 인수조건 (Note)
- **AC-NT-1**: 다중 노트 생성 가능, 인물 상세 노트 탭에서 시간순 표시
- **AC-NT-2**: pinned=true 노트는 상단 고정 (최대 3개)
- **AC-NT-3**: 검색 대상에 포함

### 인수조건 (Message)
- **AC-MS-1**: 텍스트 붙여넣기 + 자동 화자 분리(가능 시) → 실패 시 단일 블록 저장
- **AC-MS-2**: 이미지 업로드 시 10MB 초과 차단 + 압축 옵션
- **AC-MS-3**: AI 분석에 컨텍스트로 활용 (M2 이후)

### 엣지 케이스
- 5000자 초과 — 차단 + 카운터
- 이미지에 민감정보 — 사용자에게 안내, 자동 처리는 안 함
- 카톡 백업 파일 import — M3 검토

---

## 9. F-AI-BASIC / F-AI-DEEP — AI 관계 건강도 분석 [P0 / P1]

### 개요
- **F-AI-BASIC (P0)**: 주 1회(월요일 09:00 KST) 자동 분석. 인물별 관계 건강도 점수(0~100) + Top 5 추천.
- **F-AI-DEEP (P1)**: 관계 변화 트렌드, 끊어야 할 관계, AI 메시지 초안.

### 입력 (LLM 컨텍스트)
- 사용자 인물 리스트 (이름 익명화 옵션, 현재는 평문)
- 각 인물의 ContactLog(최근 90일), Note, Tag, relationship_type, last_contact_at
- 사용자 피드백 히스토리 (관심 낮춤 등)

### 출력
- RelationshipScore 행 (인물당 1개, 갱신)
- Recommendation 카드 5개 (이번 주 추천)
- 추천 사유 (한국어 1~2문장)

### 점수 산식 (초안)
score = 100
- last_contact_at 경과일 가중 차감 (관계유형별 기준일 초과 시)
- direction 균형 (한쪽으로 쏠릴 때 -10)
- ContactLog 빈도 가중치 (+ 최근 30일 활발 시 보정)
- 사용자 피드백 (관심 낮춤 인물 -20)
- 0 미만 시 0, 100 초과 시 100

### 인수조건
- **AC-AI-1 (주간 분석)**
  - **Given** 인물 5명+, ContactLog 10건+
  - **When** 월요일 09:00 KST 도래
  - **Then** 모든 인물 점수 갱신 + Top 5 추천 카드 생성 + 푸시 발송
- **AC-AI-2 (수동 트리거)**
  - **When** 홈 > "지금 분석" 버튼 (주 3회 한도)
  - **Then** 즉시 분석 실행 (한도 초과 시 다음 가능 시각 안내)
- **AC-AI-3 (프로바이더 선택)**
  - **Given** 설정에서 Claude / Gemini 선택 가능
  - **When** 분석 실행
  - **Then** 선택한 프로바이더 호출, 실패 시 자동 폴백
- **AC-AI-4 (추천 사유 생성)**
  - **When** Top 5 카드 생성
  - **Then** 각 카드에 한국어 1~2문장 사유, 부드러운 톤, 강요 금지
- **AC-AI-5 (피드백 반영)**
  - **Given** 사용자가 "이 추천 별로에요" 탭
  - **When** 다음 분석
  - **Then** 해당 인물 가중치 하향, 30일 후 자연 회복
- **AC-AI-6 (인물 5명 미만)**
  - **Then** 분석 미실행 + "조금만 더 등록하면 추천 시작" 안내
- **AC-AI-7 (Quota)**
  - **Given** 사용자별 월 토큰 quota 초과
  - **When** 분석 시도
  - **Then** "이번 달 한도에 도달했어요" + 캐시된 마지막 결과 노출
- **AC-AI-8 (응답 품질)**
  - 응답이 JSON 스키마 위반 시 자동 재시도 1회 → 실패 시 규칙 기반 폴백 (마지막 연락일 정렬)
- **AC-AI-9 (개인정보)**
  - LLM 프롬프트 전송 전 옵션: 이름 마스킹 (P1)
  - 프롬프트 로그는 사용자별 7일 보관 후 삭제

### 엣지 케이스
- LLM 응답 한국어 아닌 경우 — 재시도 후 폴백
- 추천 사유에 잘못된 사실(예: 없는 경조사 언급) — 사용자 피드백 시 즉시 해당 카드 제거
- API 비용 폭증 — 사용자별 일일 토큰 quota + 모델 자동 다운그레이드 (Sonnet → Haiku)

### 의존성
- ai-provider-abstraction 스킬, ai-relationship-analysis 스킬

---

## 10. F-SEARCH — 검색 / 필터 [P0]

### 개요
이름·태그·메모·MBTI 통합 검색 + 다축 필터.

### 입력
- 검색어 (1~50자, 한글 초성 검색 지원)
- 필터: relationship_type[], tag_ids[], last_contact_range, birthday_in, status

### 출력
- Person 리스트 + 매칭 하이라이트

### 인수조건
- **AC-SR-1 (텍스트 검색)**: 디바운스 200ms, P95 < 1초
- **AC-SR-2 (초성)**: "ㅎㄱㄷ" → "홍길동" 매칭
- **AC-SR-3 (필터 조합)**: AND 결합, 결과 0건 시 어떤 필터 풀면 결과 나오는지 안내
- **AC-SR-4 (정렬)**: 관련도 → 최근 연락일 역순 (기본), 가나다, 추가일 옵션
- **AC-SR-5 (최근 검색어)**: 최대 5개 저장, 사용자가 개별 삭제 가능
- **AC-SR-6 (오프라인 검색)**: IndexedDB 캐시 기반 부분 동작

### 엣지 케이스
- 결과 0건 → 빈 상태 + "새 인물 추가" CTA
- 500명+ → 가상 스크롤 + 50건 페이지
- 특수문자만 입력 — 차단

### 검색 인덱싱
- Postgres `tsvector` (name, memo, tags) + 초성 인덱스 (별도 컬럼 또는 trigram)
- 사용자별 RLS 적용

---

## 11. F-SETTINGS — 설정 (알림 / 프로바이더 / Export) [P0]

### 개요
사용자가 알림, AI 프로바이더, 데이터 관리, 계정을 통제.

### 항목

#### 11-1. 알림 설정
- Web Push 권한 토글
- 카테고리별 on/off (리마인더 / AI 추천 / 경조사)
- 조용 시간 (예: 22:00~07:00)
- AC-ST-1: 카테고리 OFF 시 해당 푸시 미발송, 인앱 배너만

#### 11-2. AI 프로바이더 선택
- 옵션: Claude (기본) / Gemini / Auto(폴백 자동)
- 모델 티어: 기본 / 고품질 (P1)
- AC-ST-2: 변경 즉시 다음 분석부터 적용
- AC-ST-3: 사용량(토큰/이번 달) 표시

#### 11-3. 데이터 Export
- CSV (인물·연락로그·경조사·선물 각 파일) + JSON 통합
- AC-ST-4: 요청 시 즉시 ZIP 다운로드 (1만 행 이내) / 초과 시 이메일 발송
- AC-ST-5: Export 이력 로그 (보안 감사용)

#### 11-4. 데이터 Import (P1)
- CSV 인물 import (이름·관계유형·메모만)
- AC-ST-6: 중복 시 사용자에게 매칭/병합 선택 UI

#### 11-5. 계정
- 표시명/사진 변경
- 비밀번호 변경 / 이메일 변경 (재인증 필요)
- 휴지통 (소프트 삭제 인물 복원)
- 회원 탈퇴
- AC-ST-7: 탈퇴 시 30일 유예 후 hard-delete (법적 의무 데이터 제외)

#### 11-6. 약관/개인정보
- 약관·개인정보처리방침·오픈소스 라이선스 페이지

### 엣지 케이스
- Export 중 사용자 이탈 → 백그라운드 잡으로 처리, 이메일 발송
- 대용량 Export (10만 행+) → 비동기 + 만료 링크 (24시간)

---

## 공통 비기능 요구사항

| 항목 | 요구 |
|------|------|
| 성능 | LCP P95 < 2.5초, INP < 200ms |
| 접근성 | WCAG 2.1 AA, 최소 터치 타겟 44px |
| 보안 | Supabase RLS 모든 테이블, 비밀번호 bcrypt, HTTPS only |
| 개인정보 | EXIF 자동 제거, AI 프롬프트 로그 7일, 탈퇴 시 30일 유예 |
| i18n | 한국어 기본, 골격은 i18n 준비 (M3 영어) |
| 오프라인 | IndexedDB 큐 + Service Worker, 핵심 읽기 동작 |
| 다크모드 | 시스템 추종 + 수동 토글 |
| 로깅 | 사용자 액션 익명 텔레메트리 (옵트아웃 가능) |

---

## 인수조건 ID 매핑 (QA용)

| 기능 | AC ID 범위 |
|------|----------|
| F-AUTH | AC-AUTH-1 ~ 5 |
| F-PERSON | AC-PER-1 ~ 7 |
| F-TAG | AC-TAG-1 ~ 5 |
| F-CONTACT-LOG | AC-CL-1 ~ 5 |
| F-REMINDER | AC-RM-1 ~ 7 |
| F-EVENT | AC-EV-1 ~ 5 |
| F-GIFT | AC-GF-1 ~ 4 |
| F-NOTE | AC-NT-1 ~ 3 |
| F-MESSAGE | AC-MS-1 ~ 3 |
| F-AI | AC-AI-1 ~ 9 |
| F-SEARCH | AC-SR-1 ~ 6 |
| F-SETTINGS | AC-ST-1 ~ 7 |
