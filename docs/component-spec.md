# 관계부 컴포넌트 명세 (Component Spec)

> 작성자: UX Designer Agent
> 최종 갱신: 2026-05-04
> 버전: v0.1
> 대상: frontend-engineer (구현 가능 수준 명세)

본 문서는 `components/relationship/` 하위에 신규 작성할 도메인 컴포넌트들의 props·변형·접근성·예시를 정의한다. 모든 컴포넌트는 shadcn/ui 컨벤션(`cn()`, `cva`)을 따르며, `forwardRef`를 지원한다.

---

## 0. 공통 컨벤션

```ts
// 모든 컴포넌트 파일 상단
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
```

- 색상은 Tailwind 토큰만 사용 (`bg-primary`, `text-muted-foreground`)
- 모든 인터랙티브 요소 `min-h-11` (44px)
- `data-[state=...]` 속성으로 상태 표현 (Radix 호환)
- 다크모드는 토큰으로 자동 지원

---

## 1. PersonCard

> 위치: `components/relationship/person-card.tsx`
> 사용처: 홈, 검색 결과, 휴지통

### 1.1 Props

```ts
interface PersonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  person: {
    id: string
    name: string
    photoUrl?: string
    relationshipType: "family" | "friend" | "colleague" | "client" | "acquaintance" | "etc"
    mbti?: string | null
    tags?: { id: string; name: string; colorIndex: number }[]
    lastContactAt?: Date | null
    lastContactChannel?: "phone" | "kakao" | "sms" | "email" | "inperson" | "other"
    score?: number | null  // 0~100, null = 미산출
  }
  variant?: "default" | "urgent" | "ai-attention" | "compact"
  href?: string  // 카드 전체 링크
  onLongPress?: () => void  // 컨텍스트 메뉴 트리거
  onQuickContact?: () => void  // "방금 연락함" 빠른 액션
}
```

### 1.2 Variants

| 변형 | 트리거 | 시각적 차이 |
|------|--------|-------------|
| `default` | 일반 | 흰 카드, 회색 외곽선 |
| `urgent` | last_contact_at > 30일 + score < 50 | 좌측 빨간 4px 보더 + ⚠ 아이콘 |
| `ai-attention` | AI 추천 카드 본체 | 좌측 primary 4px 보더 + ✨ 라벨 |
| `compact` | 검색 결과·고밀도 | 패딩 축소, 아바타 32px |

### 1.3 레이아웃 (mobile)

```
┌──────────────────────────────────────────┐
│ ┌──┐ {name}                 {score 배지}  │
│ │👤│ {relType} · {mbti}                  │
│ └──┘ {chips}                              │
│       {N일 전 · {channel}}                │
└──────────────────────────────────────────┘
```

### 1.4 Tailwind 예시

```tsx
const cardVariants = cva(
  "group flex items-start gap-3 p-4 rounded-xl border bg-card text-card-foreground transition-all duration-200 active:scale-[0.98] hover:shadow-soft-md",
  {
    variants: {
      variant: {
        default: "border-border",
        urgent: "border-l-4 border-l-destructive border-y-border border-r-border",
        "ai-attention": "border-l-4 border-l-primary border-y-border border-r-border",
        compact: "p-3 gap-2",
      },
    },
    defaultVariants: { variant: "default" },
  }
)
```

### 1.5 접근성

- 카드 전체가 링크 → `<Link>` 래핑 + `focus-visible:ring`
- 점수 배지에 `aria-label="관계 건강도 78점, 양호"`
- 빠른 액션은 별도 버튼 (`stopPropagation`)
- 길게 누름: 500ms 타이머 + 햅틱 (모바일)

### 1.6 빈/로딩 상태

- 로딩: 스켈레톤 변형 (`<PersonCardSkeleton />`) — 같은 레이아웃의 회색 박스
- 사진 로드 실패: `<AvatarFallback>` (이름 첫 글자, secondary bg)

---

## 2. ReminderItem

> 위치: `components/relationship/reminder-item.tsx`
> 사용처: 홈 위젯, 리마인더 리스트, 알림 센터

### 2.1 Props

```ts
interface ReminderItemProps {
  reminder: {
    id: string
    personId: string
    personName: string
    personPhotoUrl?: string
    type: "followup" | "birthday" | "event" | "custom"
    scheduledAt: Date
    message?: string
    status: "active" | "snoozed" | "done" | "dismissed"
    repeatRule?: "none" | "yearly"
  }
  variant?: "list" | "compact"  // list: 풀카드, compact: 홈 위젯
  onComplete?: () => void
  onSnooze?: (option: "1h" | "today" | "tomorrow" | "3d" | "1w" | "custom") => void
  onEdit?: () => void
  onDelete?: () => void
  onTap?: () => void  // 인물 상세로 이동
}
```

### 2.2 시각 표현

| type | 아이콘 | 색상 |
|------|--------|------|
| `followup` | 🔔 | warning |
| `birthday` | 🎂 | tag-1 |
| `event` | 🎉 | accent |
| `custom` | ✏ | muted |

| status | 표시 |
|--------|------|
| `active` | 정상 카드 |
| `snoozed` | "💤 연기됨 — {새 시각}" 라벨 |
| `done` | 회색 처리 + 취소선 + 우측 ✓ |
| `dismissed` | 미표시 (필터 제외) |

### 2.3 레이아웃 (list)

```
┌──────────────────────────────────────────┐
│ {🔔 dot} {scheduledTime}            [⋮]  │
│ {personName} · {relType}                 │
│ {message}                                │
│ [✓ 완료]  [⏰ 연기]                       │
└──────────────────────────────────────────┘
```

### 2.4 인터랙션

- 카드 탭 → 인물 상세
- [✓ 완료] → ContactLog mini 모달 → done
- [⏰ 연기] → Sheet (1h/오늘저녁/내일/3일/1주/직접)
- 스와이프 좌 (모바일): 완료/연기/삭제 액션 노출
- 길게 누름: ⋮ 메뉴

---

## 3. RelationshipScoreGauge

> 위치: `components/relationship/relationship-score-gauge.tsx`
> 사용처: 인물 상세, AI 추천 카드, 검색 결과 (compact)

### 3.1 Props

```ts
interface RelationshipScoreGaugeProps {
  score: number  // 0~100
  size?: "sm" | "md" | "lg"  // sm=32, md=64, lg=120
  showLabel?: boolean  // "양호" 등
  showPercent?: boolean  // 숫자 표시
  reason?: string  // hover/탭 시 툴팁
}
```

### 3.2 변형 색상 (점수 → 톤)

| 범위 | 라벨 | 토큰 |
|------|------|------|
| 90~100 | 매우 좋음 | `success` 진한 |
| 70~89 | 양호 | `success` |
| 40~69 | 보통 | `warning` |
| 0~39 | 주의 | `destructive` |

### 3.3 시각

- SVG 도넛 차트 (`stroke-dashoffset` 애니메이션)
- 라이트: 트랙 `muted` + 진행 색상
- 텍스트: 중앙에 `{score}점` + 아래 라벨
- size=sm: 단순 색 점 + 숫자 (인라인)

### 3.4 접근성

- `role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="관계 건강도"`
- 색만으로 정보 전달 금지 → 라벨 필수 또는 sr-only 보조

---

## 4. EventTimeline

> 위치: `components/relationship/event-timeline.tsx`
> 사용처: 인물 상세 타임라인 영역

### 4.1 Props

```ts
type TimelineItem =
  | { kind: "contact"; data: ContactLog }
  | { kind: "note"; data: Note }
  | { kind: "event"; data: Event }       // M2
  | { kind: "gift"; data: Gift }         // M2
  | { kind: "message"; data: Message }   // M2

interface EventTimelineProps {
  items: TimelineItem[]
  filter?: "all" | "contact" | "note" | "event" | "gift"
  onFilterChange?: (filter: string) => void
  onItemClick?: (item: TimelineItem) => void
  onItemDelete?: (item: TimelineItem) => void
  hasMore?: boolean
  onLoadMore?: () => void
}
```

### 4.2 그룹 헤더

- 같은 날: "📅 2026-04-22 (12일 전)"
- 다른 달: "2026년 3월" (월별 separator)

### 4.3 항목 렌더 (kind별)

각 kind는 별도 ItemComponent (`ContactLogItem`, `NoteItem`, `EventItem`, `GiftItem`, `MessageItem`).

### 4.4 빈 상태

```
"아직 기록이 없어요. 첫 기록을 남겨볼까요?"
[💬 연락 기록]
```

---

## 5. TagChip

> 위치: `components/relationship/tag-chip.tsx`
> 사용처: 인물 카드, 인물 상세, 폼 입력, 필터

### 5.1 Props

```ts
interface TagChipProps {
  tag: {
    id?: string
    name: string
    colorIndex?: number  // 1~8 (자동 배정)
  }
  variant?: "default" | "selected" | "removable" | "outline"
  size?: "sm" | "md"
  onClick?: () => void
  onRemove?: () => void  // removable일 때
}
```

### 5.2 변형

| 변형 | 시각 |
|------|------|
| `default` | `bg-tag-{colorIndex}/15 text-tag-{colorIndex}` (배경 부드럽게) |
| `selected` | `bg-primary text-primary-foreground` |
| `outline` | `border border-input bg-transparent text-foreground` |
| `removable` | default + ✕ 아이콘, 클릭 시 onRemove |

### 5.3 사이즈

| size | 클래스 |
|------|--------|
| `sm` | `h-6 px-2 text-xs rounded-full` |
| `md` | `h-7 px-2.5 text-sm rounded-full` |

### 5.4 RelationshipType 매핑 (특수)

```ts
const RELATIONSHIP_TYPE_LABEL = {
  family: { label: "가족", colorIndex: 1 },
  friend: { label: "친구", colorIndex: 3 },
  colleague: { label: "동료", colorIndex: 4 },
  client: { label: "고객사", colorIndex: 2 },
  acquaintance: { label: "지인", colorIndex: 5 },
  etc: { label: "기타", colorIndex: 8 },
}
```

---

## 6. BottomNav

> 위치: `components/layout/bottom-nav.tsx`
> 사용처: 모든 인증 후 화면 (모바일 한정, lg: 이상은 SideNav)

### 6.1 Props

```ts
interface BottomNavProps {
  active: "home" | "search" | "add" | "reminder" | "settings"
}
```

### 6.2 5탭 구성

| 탭 | 아이콘(lucide) | 라벨 | 라우트 |
|----|----------------|------|--------|
| 홈 | `Home` | 홈 | `/home` |
| 검색 | `Search` | 검색 | `/search` |
| 추가 | `Plus` (강조 — 가운데, primary 원형) | 추가 | (FAB 또는 Sheet) |
| 리마인더 | `Bell` | 리마인더 | `/reminders` |
| 설정 | `Settings` | 설정 | `/settings` |

### 6.3 레이아웃

```
┌──────────────────────────────────────────────┐
│  🏠     🔍     ⊕      🔔       ⚙             │
│  홈    검색  (primary) 리마인더 설정           │
└──────────────────────────────────────────────┘
                 (높이 64 + safe-bottom)
```

- `+` 가운데 탭은 56x56 원형, primary 배경, foreground 흰색, shadow-fab
- 라벨은 `text-xs`, 활성 탭은 `text-primary`, 비활성 `text-muted-foreground`
- `position: fixed; bottom: 0; backdrop-blur` + `bg-background/85`
- `lg:hidden` (데스크톱은 SideNav 사용)

### 6.4 접근성

- `role="navigation" aria-label="주 메뉴"`
- 각 탭은 `<Link aria-current={isActive ? 'page' : undefined}>`
- 가운데 + 버튼은 `<button aria-label="인물 추가">`

---

## 7. EmptyState

> 위치: `components/common/empty-state.tsx`
> 사용처: 빈 인물 리스트, 빈 검색 결과, 빈 리마인더 등

### 7.1 Props

```ts
interface EmptyStateProps {
  icon?: React.ReactNode | string  // 이모지 또는 아이콘
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
    variant?: "default" | "outline" | "ghost"
  }
  secondaryAction?: { label: string; onClick: () => void }
  size?: "sm" | "md" | "lg"
}
```

### 7.2 레이아웃

```
       {icon (h-16)}

       {title (text-lg font-semibold)}

   {description (text-sm muted-foreground)}

      [Primary action]
      [Secondary action ghost]
```

- 가운데 정렬, 세로 패딩 `py-12`
- `max-w-xs` 콘텐츠 폭
- 아이콘은 이모지 텍스트 또는 `lucide` 아이콘 (text-muted-foreground)

### 7.3 사용 예

```tsx
<EmptyState
  icon="👋"
  title="첫 사람을 추가해볼까요?"
  description="이름만 있어도 충분해요."
  action={{ label: "+ 인물 추가", href: "/p/new" }}
/>
```

---

## 8. ContactLogItem

> 위치: `components/relationship/contact-log-item.tsx`
> 사용처: EventTimeline 내부, 인물 상세 타임라인

### 8.1 Props

```ts
interface ContactLogItemProps {
  log: {
    id: string
    channel: "phone" | "kakao" | "sms" | "email" | "inperson" | "other"
    direction?: "outbound" | "inbound" | "unknown"
    occurredAt: Date
    memo?: string
  }
  onEdit?: () => void
  onDelete?: () => void
}
```

### 8.2 시각 (timeline 내부)

```
─ {channelIcon} {channelLabel} · {directionLabel}
   {memo (memo 있을 시)}
   {timeOnly}
```

| channel | 아이콘 | 라벨 |
|---------|--------|------|
| phone | 📞 | 전화 |
| kakao | 💬 | 카톡 |
| sms | ✉ | 문자 |
| email | 📧 | 이메일 |
| inperson | 👥 | 대면 |
| other | ✏ | 기타 |

| direction | 라벨 |
|-----------|------|
| outbound | 보냄 |
| inbound | 받음 |
| unknown | (생략) |

### 8.3 인터랙션

- 탭 → 편집 Sheet
- 스와이프 좌 (모바일) → 삭제 액션 노출
- 길게 누름 → 컨텍스트 메뉴

---

## 9. (보너스) AppHeader

> 위치: `components/layout/app-header.tsx`

### 9.1 Props

```ts
interface AppHeaderProps {
  title?: string
  back?: { href?: string; onClick?: () => void }  // back 버튼 노출
  actions?: React.ReactNode  // 우측 액션들
  search?: boolean  // true일 때 검색바 인라인 (홈 등)
  sticky?: boolean  // 스크롤 시 sticky (기본 true)
}
```

### 9.2 구조

```
┌──────────────────────────────────────────┐
│  ← {title}                       {actions}│
└──────────────────────────────────────────┘
```

- 높이 56px (`h-14`)
- `sticky top-0 z-40 bg-background/85 backdrop-blur border-b`
- 모바일: 스크롤 시 그림자 미세 추가 (`shadow-soft`)

---

## 10. (보너스) FAB

> 위치: `components/layout/fab.tsx`

### 10.1 Props

```ts
interface FABProps {
  icon?: React.ReactNode  // 기본 Plus
  label: string  // aria-label
  onClick?: () => void
  href?: string
  position?: "br" | "bl"  // bottom-right (기본) / bottom-left
  variant?: "primary" | "secondary"
}
```

### 10.2 시각

- 56x56 원형, `rounded-full`
- `bg-primary text-primary-foreground shadow-fab`
- 위치: `fixed right-4 bottom-[calc(theme(spacing.nav)+1rem+env(safe-area-inset-bottom))]`
- `active:scale-95 transition-transform`

---

## 11. 컴포넌트 의존성 매트릭스

| 컴포넌트 | shadcn 의존 | 추가 설치 필요 |
|----------|------------|----------------|
| PersonCard | Avatar, Badge | - |
| ReminderItem | Avatar, Badge, Sheet | - |
| RelationshipScoreGauge | (커스텀 SVG) | - |
| EventTimeline | - | - |
| TagChip | Badge (베이스) | - |
| BottomNav | - (Link 직접) | - |
| EmptyState | Button | - |
| ContactLogItem | - | - |
| AppHeader | Button | - |
| FAB | Button | - |
| (인물 폼) | Form, Input, Select, RadioGroup, Textarea | textarea, radio-group, select, switch |
| (검색 Combobox) | Command, Popover | command, popover |
| (날짜 선택) | Calendar, Popover | calendar, popover |
| (생성/수정 모달) | Sheet, Dialog | (이미 설치) |
| (확인 다이얼로그) | AlertDialog | alert-dialog |
| (토스트) | - | sonner |

---

## 12. 파일 구조 권장

```
components/
  ui/                          ← shadcn 기본
    avatar.tsx
    badge.tsx
    button.tsx
    ...
  relationship/                ← 도메인 컴포넌트
    person-card.tsx
    person-card-skeleton.tsx
    reminder-item.tsx
    relationship-score-gauge.tsx
    event-timeline.tsx
    contact-log-item.tsx
    note-item.tsx
    event-item.tsx          (M2)
    gift-item.tsx           (M2)
    tag-chip.tsx
    recommendation-card.tsx
  layout/
    app-header.tsx
    bottom-nav.tsx
    side-nav.tsx           (desktop)
    fab.tsx
  common/
    empty-state.tsx
    error-state.tsx
    loading-skeleton.tsx
```

---

## 13. 사용 예 (참고)

### 13.1 홈 인물 리스트

```tsx
<div className="space-y-3">
  {persons.map((p) => (
    <PersonCard
      key={p.id}
      person={p}
      variant={p.score < 50 && p.daysSinceContact > 30 ? "urgent" : "default"}
      href={`/p/${p.id}`}
      onQuickContact={() => quickContact(p.id)}
    />
  ))}
</div>
```

### 13.2 인물 상세 타임라인

```tsx
<EventTimeline
  items={timeline}
  filter={filter}
  onFilterChange={setFilter}
  onItemClick={(item) => openEditSheet(item)}
  onItemDelete={(item) => softDelete(item)}
  hasMore={hasMore}
  onLoadMore={loadMore}
/>
```

### 13.3 빈 상태

```tsx
<EmptyState
  icon="🔔"
  title="오늘은 알림이 없어요"
  description="인물 상세에서 리마인더를 설정해보세요."
  action={{ label: "+ 리마인더 추가", onClick: openCreateSheet }}
/>
```

---

## 14. 다음 단계

- 본 명세 기반으로 frontend-engineer가 컴포넌트 구현
- 변경 시 본 문서 우선 업데이트 → 코드 동기화
- 새 컴포넌트 추가 시 §11 의존성 매트릭스 갱신
