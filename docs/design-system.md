# 관계부 디자인 시스템 (Design System)

> 작성자: UX Designer Agent
> 최종 갱신: 2026-05-04
> 버전: v0.1
> 대상: frontend-engineer (즉시 복붙 사용 가능)

---

## 1. 디자인 원칙

| 원칙 | 설명 |
|------|------|
| 따뜻함 | 차가운 회색·파랑 대신 미세한 적/주황 언더톤. 사적인 노트 같은 느낌. |
| 신뢰감 | 채도 낮춤 + 충분한 여백. 자극적인 색 자제. |
| 모바일 우선 | 360px부터 작동. 터치 타겟 44px+. 한 손 조작 가능. |
| 차분함 | OKLCH 기반 부드러운 무채색 배경 + 강조는 primary만. |
| 한국어 친화 | Pretendard, leading 1.6+, ko-kr 줄바꿈 룰. |
| 접근성 | WCAG AA 4.5:1+ 텍스트 대비, 다크모드 기본. |

---

## 2. 컬러 토큰 (OKLCH 기반)

> 주의: 코드에는 shadcn 호환을 위해 HSL 형식으로 함께 제공한다. CSS variable에는 HSL 채널값(공백 구분)을 넣고, `hsl(var(--token))`로 사용한다.

### 2.1 컬러 의미

| 토큰 | 용도 | 라이트 OKLCH 의도 | 라이트 HSL | 다크 HSL |
|------|------|-------------------|-----------|----------|
| `background` | 페이지 배경 | 따뜻한 미백색 | `30 20% 99%` | `20 14% 6%` |
| `foreground` | 본문 텍스트 | 거의 검은 갈색 | `20 14% 12%` | `30 10% 96%` |
| `card` | 카드 배경 | 페이지보다 약간 밝거나 동일 | `0 0% 100%` | `20 14% 9%` |
| `card-foreground` | 카드 텍스트 | foreground와 동일 | `20 14% 12%` | `30 10% 96%` |
| `popover` | Popover 배경 | card와 동일 | `0 0% 100%` | `20 14% 9%` |
| `popover-foreground` | | | `20 14% 12%` | `30 10% 96%` |
| `primary` | 주 강조 (CTA) | 따뜻한 코랄 (#E96E5C 계열) | `12 75% 58%` | `12 78% 64%` |
| `primary-foreground` | primary 위 텍스트 | | `0 0% 100%` | `0 0% 100%` |
| `secondary` | 보조 배경 (chip 등) | 따뜻한 미베이지 | `30 30% 94%` | `20 8% 18%` |
| `secondary-foreground` | | | `20 14% 18%` | `30 10% 92%` |
| `muted` | 약한 배경 (대안) | secondary보다 무채색 | `30 12% 96%` | `20 6% 14%` |
| `muted-foreground` | 부가 텍스트 | | `20 8% 42%` | `30 6% 64%` |
| `accent` | hover/active 배경 | 부드러운 살구 | `28 60% 92%` | `20 14% 22%` |
| `accent-foreground` | | | `20 14% 18%` | `30 10% 92%` |
| `destructive` | 삭제·위험 | 차분한 다홍 | `0 70% 50%` | `0 65% 60%` |
| `destructive-foreground` | | | `0 0% 100%` | `0 0% 100%` |
| `success` | 양호·완료 | 차분한 세이지 그린 | `145 35% 45%` | `145 35% 55%` |
| `warning` | 주의 | 차분한 머스타드 | `38 78% 50%` | `38 80% 60%` |
| `border` | 외곽선 | foreground 7% 정도 | `30 12% 88%` | `20 8% 22%` |
| `input` | 입력 필드 외곽선 | border와 동일 | `30 12% 88%` | `20 8% 22%` |
| `ring` | 포커스 링 | primary와 동조 | `12 75% 58%` | `12 78% 64%` |

### 2.2 관계 건강도 점수 색상 (커스텀)

| 점수 | 의미 | 토큰 | 배경/foreground 권장 |
|------|------|------|----------------------|
| 90~100 | 매우 좋음 | success 진한 | `bg-success/15 text-success` |
| 70~89 | 양호 | success | `bg-success/10 text-success` |
| 40~69 | 보통 | warning | `bg-warning/10 text-warning` |
| 0~39 | 주의 | destructive | `bg-destructive/10 text-destructive` |

### 2.3 태그 자동 배정 8색 팔레트 (사용자 태그)

```
1. coral    oklch(0.75 0.10 30)
2. mustard  oklch(0.78 0.10 80)
3. sage     oklch(0.78 0.07 145)
4. teal     oklch(0.72 0.07 200)
5. periwinkle oklch(0.72 0.08 270)
6. lilac    oklch(0.78 0.08 320)
7. dusty-rose oklch(0.78 0.07 0)
8. sand     oklch(0.85 0.04 80)
```
shadcn 토큰 외 별도 `tag-1`~`tag-8` CSS variable로 노출.

---

## 3. `app/globals.css` 즉시 복붙 코드

```css
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Page surfaces — warm, slightly off-white */
    --background: 30 20% 99%;
    --foreground: 20 14% 12%;
    --card: 0 0% 100%;
    --card-foreground: 20 14% 12%;
    --popover: 0 0% 100%;
    --popover-foreground: 20 14% 12%;

    /* Primary — warm coral (sets the warm tone of the brand) */
    --primary: 12 75% 58%;
    --primary-foreground: 0 0% 100%;

    /* Secondary — soft warm beige */
    --secondary: 30 30% 94%;
    --secondary-foreground: 20 14% 18%;

    /* Muted — neutral warm gray */
    --muted: 30 12% 96%;
    --muted-foreground: 20 8% 42%;

    /* Accent — gentle peach for hover */
    --accent: 28 60% 92%;
    --accent-foreground: 20 14% 18%;

    /* Status */
    --destructive: 0 70% 50%;
    --destructive-foreground: 0 0% 100%;
    --success: 145 35% 45%;
    --success-foreground: 0 0% 100%;
    --warning: 38 78% 50%;
    --warning-foreground: 20 14% 12%;

    /* Lines & inputs */
    --border: 30 12% 88%;
    --input: 30 12% 88%;
    --ring: 12 75% 58%;

    /* Tag palette (relationship app specific) */
    --tag-1: 12 65% 70%;
    --tag-2: 38 78% 70%;
    --tag-3: 145 30% 65%;
    --tag-4: 200 30% 65%;
    --tag-5: 245 35% 72%;
    --tag-6: 295 35% 75%;
    --tag-7: 350 35% 75%;
    --tag-8: 38 30% 80%;

    /* Radius */
    --radius: 0.625rem;
  }

  .dark {
    --background: 20 14% 6%;
    --foreground: 30 10% 96%;
    --card: 20 14% 9%;
    --card-foreground: 30 10% 96%;
    --popover: 20 14% 9%;
    --popover-foreground: 30 10% 96%;

    --primary: 12 78% 64%;
    --primary-foreground: 0 0% 100%;

    --secondary: 20 8% 18%;
    --secondary-foreground: 30 10% 92%;

    --muted: 20 6% 14%;
    --muted-foreground: 30 6% 64%;

    --accent: 20 14% 22%;
    --accent-foreground: 30 10% 92%;

    --destructive: 0 65% 60%;
    --destructive-foreground: 0 0% 100%;
    --success: 145 35% 55%;
    --success-foreground: 0 0% 100%;
    --warning: 38 80% 60%;
    --warning-foreground: 20 14% 12%;

    --border: 20 8% 22%;
    --input: 20 8% 22%;
    --ring: 12 78% 64%;

    --tag-1: 12 50% 55%;
    --tag-2: 38 60% 55%;
    --tag-3: 145 25% 50%;
    --tag-4: 200 25% 50%;
    --tag-5: 245 30% 60%;
    --tag-6: 295 30% 60%;
    --tag-7: 350 30% 60%;
    --tag-8: 38 25% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  html {
    /* Korean line-breaking improvements */
    word-break: keep-all;
    overflow-wrap: anywhere;
  }

  body {
    @apply bg-background text-foreground;
    font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui,
      Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    /* Korean typography needs more line-height than Latin */
    line-height: 1.6;
    /* Mobile: avoid 16px iOS zoom on input focus */
    text-size-adjust: 100%;
  }

  /* Headings: tighter line-height, weight up */
  h1, h2, h3, h4 {
    line-height: 1.35;
    letter-spacing: -0.01em;
  }

  /* Buttons & interactive elements: minimum 44px touch target */
  button, [role="button"], a {
    touch-action: manipulation;
  }

  /* Focus ring (keyboard) */
  :focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }

  /* Safe area for iOS */
  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
  .safe-top {
    padding-top: env(safe-area-inset-top);
  }
}

/* Optional: scrollbar styling for desktop */
@media (hover: hover) {
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-muted-foreground/20 rounded-full;
  }
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/40;
  }
}
```

---

## 4. `tailwind.config.ts` 확장 (즉시 적용)

기존 설정에 다음 추가/대체:

```ts
// tailwind.config.ts (extend.colors 부분)
colors: {
  // ... 기존 ...
  success: {
    DEFAULT: "hsl(var(--success))",
    foreground: "hsl(var(--success-foreground))",
  },
  warning: {
    DEFAULT: "hsl(var(--warning))",
    foreground: "hsl(var(--warning-foreground))",
  },
  tag: {
    1: "hsl(var(--tag-1))",
    2: "hsl(var(--tag-2))",
    3: "hsl(var(--tag-3))",
    4: "hsl(var(--tag-4))",
    5: "hsl(var(--tag-5))",
    6: "hsl(var(--tag-6))",
    7: "hsl(var(--tag-7))",
    8: "hsl(var(--tag-8))",
  },
},

// extend.boxShadow 추가
boxShadow: {
  soft: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
  "soft-md": "0 4px 8px -2px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
  "soft-lg": "0 10px 24px -4px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.04)",
  fab: "0 8px 20px -4px rgb(0 0 0 / 0.18), 0 2px 6px -2px rgb(0 0 0 / 0.08)",
},

// extend.borderRadius 추가
borderRadius: {
  lg: "var(--radius)",
  md: "calc(var(--radius) - 2px)",
  sm: "calc(var(--radius) - 4px)",
  xl: "calc(var(--radius) + 4px)",
  "2xl": "calc(var(--radius) + 8px)",
},

// extend.fontSize 추가 (한국어 친화적 line-height)
fontSize: {
  xs: ["0.75rem", { lineHeight: "1.5" }],     // 12 / 18
  sm: ["0.875rem", { lineHeight: "1.55" }],    // 14 / 22
  base: ["1rem", { lineHeight: "1.6" }],       // 16 / 26
  lg: ["1.125rem", { lineHeight: "1.55" }],    // 18 / 28
  xl: ["1.25rem", { lineHeight: "1.5" }],      // 20 / 30
  "2xl": ["1.5rem", { lineHeight: "1.4" }],    // 24 / 34
  "3xl": ["1.875rem", { lineHeight: "1.35" }], // 30 / 40
  "4xl": ["2.25rem", { lineHeight: "1.3" }],
},

// extend.spacing 추가 (안전영역 / 터치 타겟)
spacing: {
  touch: "2.75rem",   // 44px 최소 터치
  "safe-bottom": "env(safe-area-inset-bottom)",
  "safe-top": "env(safe-area-inset-top)",
  nav: "4rem",        // 64px BottomNav 높이
},

// extend.animation/keyframes 추가 (모션 가이드)
keyframes: {
  // ... 기존 accordion ...
  "fade-in": {
    "0%": { opacity: "0" },
    "100%": { opacity: "1" },
  },
  "slide-up": {
    "0%": { transform: "translateY(8px)", opacity: "0" },
    "100%": { transform: "translateY(0)", opacity: "1" },
  },
  "scale-in": {
    "0%": { transform: "scale(0.96)", opacity: "0" },
    "100%": { transform: "scale(1)", opacity: "1" },
  },
},
animation: {
  // ... 기존 ...
  "fade-in": "fade-in 200ms ease-out",
  "slide-up": "slide-up 240ms cubic-bezier(0.16, 1, 0.3, 1)",
  "scale-in": "scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1)",
},
```

---

## 5. 타이포그래피

### 5.1 폰트 패밀리

| 용도 | Stack |
|------|-------|
| 본문/UI | `Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif` |
| 숫자 (옵션) | `font-feature-settings: "tnum"` (테이블/금액에서 균등 폭) |
| 코드 | `ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` |

> Pretendard Variable은 `globals.css`에서 CDN으로 로드. 100~900 가중치 가변 지원.

### 5.2 스케일 (Tailwind 클래스)

| 토큰 | 크기 | line-height | 용도 |
|------|------|-------------|------|
| `text-xs` | 12px | 1.5 | 라벨, 메타 (시간) |
| `text-sm` | 14px | 1.55 | 보조 텍스트, 칩 |
| `text-base` | 16px | 1.6 | 본문 (기본) |
| `text-lg` | 18px | 1.55 | 강조 본문 |
| `text-xl` | 20px | 1.5 | 카드 타이틀, 섹션 헤더 |
| `text-2xl` | 24px | 1.4 | 페이지 헤더 |
| `text-3xl` | 30px | 1.35 | 랜딩 헤드라인 |
| `text-4xl` | 36px | 1.3 | (데스크톱 히어로) |

### 5.3 가중치

| 가중치 | 사용 |
|--------|------|
| 400 (regular) | 본문 |
| 500 (medium) | 라벨, 칩, 카드 본문 강조 |
| 600 (semibold) | 카드 타이틀, 헤더 |
| 700 (bold) | 페이지 헤드라인, 점수 숫자 |

### 5.4 한국어 고려사항

- `word-break: keep-all` + `overflow-wrap: anywhere` (글자 단위가 아닌 어절 단위 줄바꿈)
- 영문 대비 줄간격 1.6+ 권장 (위 line-height 반영)
- 한글은 영문 대비 약 +5~10% 폭 확보 (button label 등)
- 이모지 + 한글 혼용 시 vertical-align 깨짐 → 부모에 `display: inline-flex; align-items: center; gap: 0.25rem`

---

## 6. Spacing & Sizing

### 6.1 spacing scale (Tailwind 4px 단위)
- 카드 내부 패딩: `p-4` (16px)
- 섹션 간 갭: `gap-4` ~ `gap-6` (16~24px)
- 페이지 좌우 패딩: 모바일 `px-4`, 데스크톱 `px-6`
- 헤더/하단탭 높이: `h-14` (56px) / `h-16` (64px)
- 터치 타겟: 최소 `h-11 w-11` (44px), 권장 `h-12` (48px)

### 6.2 컨테이너

| 단계 | max-w |
|------|-------|
| 모바일 콘텐츠 | 100% (no max) |
| 폼 / Dialog | `max-w-md` (28rem) |
| 본문 페이지 | `max-w-2xl` (42rem) |
| 와이드 (대시보드) | `max-w-5xl` (64rem) |

---

## 7. Radius & Shadow

### 7.1 Radius
| 토큰 | 값 | 사용 |
|------|----|------|
| `rounded-sm` | calc(var(--radius) - 4px) | 칩, 작은 input |
| `rounded-md` | calc(var(--radius) - 2px) | 보조 버튼 |
| `rounded-lg` | var(--radius) ≈ 10px | 기본 버튼·카드 |
| `rounded-xl` | calc(var(--radius) + 4px) | 큰 카드 |
| `rounded-2xl` | calc(var(--radius) + 8px) | Hero 카드 |
| `rounded-full` | 100% | Avatar, FAB, chip |

### 7.2 Shadow
| 토큰 | 사용 |
|------|------|
| `shadow-soft` | 카드 기본 |
| `shadow-soft-md` | hover, 분리감 |
| `shadow-soft-lg` | 모달, popover |
| `shadow-fab` | FAB 버튼 |

---

## 8. 모션 / 애니메이션

### 8.1 원칙
- 듀레이션: 빠르고 짧게 (150~250ms)
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out custom) — "soft snap"
- 모달/Sheet 진입: `slide-up` 240ms
- 토스트: `fade-in + slide-up` 200ms
- 카드 hover: `transition-shadow duration-200`
- 카드 탭 (모바일): `active:scale-[0.98]` (subtle haptic feel)
- `prefers-reduced-motion: reduce` 사용자에게는 모든 transform 애니메이션 OFF (transition-opacity만 유지)

### 8.2 표준 트랜지션 클래스
```html
<!-- 카드 -->
<div class="transition-all duration-200 hover:shadow-soft-md active:scale-[0.98]">

<!-- 버튼 -->
<button class="transition-colors duration-150">

<!-- 모달 -->
<div class="animate-slide-up">
```

---

## 9. 컴포넌트 사용 규칙

### 9.1 우선순위
1. shadcn/ui 기존 컴포넌트 우선 사용
2. 부족한 패턴은 shadcn 컨벤션(`cn()`, `cva`)으로 신규 작성
3. `components/ui/` 외부에 도메인 컴포넌트 배치 (예: `components/relationship/PersonCard.tsx`)

### 9.2 추가 설치 권장 (shadcn add)
- `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `toast` (sonner)
- `popover`, `command` (combobox), `calendar`, `progress`
- `alert-dialog`, `dropdown-menu`, `toggle-group`

### 9.3 모바일 우선 가이드
- 모든 인터랙션 요소 `min-h-11` (44px)
- 폼은 `Sheet side="bottom"` 풀스크린 (모바일), `Dialog` (데스크톱)
- 본문 텍스트는 16px 이상 (input은 iOS 자동 zoom 방지 위해 16px+)

### 9.4 다크모드
- 모든 색상은 CSS variable로만 지정 (`bg-background`, `text-foreground`)
- 직접 hex/oklch 사용 금지 (예외: 차트, 일러스트)
- 시스템 추종 + 수동 토글 (설정에서)

---

## 10. 접근성 (A11y)

| 항목 | 요구 |
|------|------|
| 색 대비 | 본문 4.5:1, 큰 텍스트 3:1 (AA) |
| 포커스 표시 | `:focus-visible`로 키보드만 ring 표시 |
| 터치 타겟 | 44x44 최소 (WCAG 2.5.5) |
| ARIA 라벨 | 아이콘 버튼은 `aria-label` 필수 |
| 폼 라벨 | `<Label htmlFor>` 사용, placeholder 단독 라벨 금지 |
| 알림 | 토스트는 `role="status"` 또는 `role="alert"` |
| 한국어 lang | `<html lang="ko">` 설정 |
| 모션 감소 | `prefers-reduced-motion` 존중 |

---

## 11. 한국어 폭 / 줄간격 체크리스트

- [x] `word-break: keep-all` 전역 적용
- [x] line-height 1.6 (본문)
- [x] `Pretendard Variable` 우선
- [x] 버튼 라벨: 영문 추정치 + 20% 여유
- [x] 칩(Badge): 한 글자 라벨도 `min-w-fit px-2.5`
- [x] Input placeholder: 한국어로 명확히 ("이름·태그·MBTI로 검색")
- [x] 숫자 + 단위: `<span class="font-mono tabular-nums">{n}</span>일 전`

---

## 12. 다음 단계

- 컴포넌트 명세는 `docs/component-spec.md`에서 정의
- frontend-engineer는 본 파일의 §3·§4 코드 블록을 그대로 `app/globals.css`와 `tailwind.config.ts`에 복붙해 즉시 적용
- 디자인 토큰 변경 시 본 문서 우선 업데이트 → 코드 동기화
