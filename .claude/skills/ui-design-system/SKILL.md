---
name: ui-design-system
description: shadcn/ui + Tailwind CSS 기반 디자인 시스템(컬러/타이포/spacing/radius/shadow)과 컴포넌트 컨벤션을 정의한다. "디자인 시스템", "토큰", "테마" 요청에 사용.
---

# 디자인 시스템 스킬

## 컬러 토큰 (shadcn 컨벤션, OKLCH)

```css
/* light */
--background: oklch(0.99 0 0);
--foreground: oklch(0.18 0.02 270);
--primary: oklch(0.55 0.15 25);   /* 따뜻한 톤 */
--primary-foreground: oklch(0.99 0 0);
--muted: oklch(0.96 0.01 270);
--accent: oklch(0.92 0.03 60);
--destructive: oklch(0.55 0.22 25);
--border: oklch(0.9 0.01 270);
--ring: oklch(0.55 0.15 25);
--radius: 0.625rem;
```

다크모드는 동일 변수의 dark 변형.

## 타이포그래피

- 한글: Pretendard Variable (font-display: swap)
- 영문 보조: Inter
- 스케일: text-xs(12) / sm(14) / base(16) / lg(18) / xl(20) / 2xl(24) / 3xl(30)

## Spacing & Radius

- spacing: Tailwind 기본 (4px 단위)
- radius: sm(0.4rem), md(0.625rem), lg(1rem), full
- shadow: shadcn 기본 + soft(0 1px 3px rgba(0,0,0,0.06))

## 컴포넌트 사용 규칙

- shadcn/ui 우선 (Button, Card, Dialog, Sheet, Tabs, Form, Input, Select, Calendar, Drawer)
- 새 컴포넌트는 shadcn 스타일 컨벤션 따름 (`cn()`, `cva` 패턴)
- 모바일 우선 — 터치 타겟 44px 이상
- 다크모드 기본 지원
- 한국어 폭 고려 (영문 대비 더 넓을 수 있음)
