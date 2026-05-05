---
name: ai-relationship-analysis
description: 인물 데이터(연락 이력, 경조사, 선물, 메모)를 입력받아 관계 건강도 점수와 액션 추천을 생성하는 AI 파이프라인을 설계한다. "관계 건강도", "관계 분석", "친밀도 점수" 요청에 사용.
---

# 관계 건강도 분석 스킬

## 입력 → 출력 계약

**입력**: `PersonContext`
```ts
{
  person: { name, nickname, mbti, birthday, relationshipType, knownSince }
  recentContacts: Array<{ contactedAt, channel, note }>  // 최근 90일
  events: Array<{ type, date, note }>                    // 경조사 1년
  gifts: Array<{ direction, item, occasion, date, amount }>
  notes: Array<{ body, createdAt }>
  daysSinceLastContact: number
}
```

**출력**: `RelationshipScore`
```ts
{
  score: number,               // 0~100
  band: "강" | "보통" | "주의" | "위험",
  factors: Array<{
    label: string,             // "최근 연락 빈도"
    weight: number,            // -30 ~ +30
    evidence: string           // "지난 90일간 연락 3회"
  }>,
  suggestions: Array<{
    type: "contact" | "event" | "gift" | "note",
    message: string,           // 한국어 제안
    urgency: "low" | "med" | "high"
  }>,
  generatedAt: string,
  provider: string,
  model: string
}
```

## 프롬프트 구조 (`prompts/relationship-analysis.md`)

```
[SYSTEM]
당신은 사용자의 인간관계 건강도를 분석하는 어시스턴트입니다.
다음 원칙으로 점수를 산출하세요:
1. 최근 연락 빈도 (40%)
2. 양방향성 (선물/경조사 주고받음, 30%)
3. 관계 맥락 (관계 유형 대비 적정 빈도, 20%)
4. 개인 정보 풍부도 (10%)

판단을 단정하지 말고, 사용자가 행동할 수 있는 부드러운 제안으로 표현하세요.
출력은 반드시 지정된 JSON 스키마를 따르세요.

[USER]
{인물 컨텍스트 JSON}
```

## 파이프라인

1. `buildContext(personId)` — DB에서 인물 + 연관 데이터 조회
2. `getProvider().complete({ system, messages, jsonSchema })`
3. zod로 응답 검증 → 실패 시 1회 재시도(stricter prompt)
4. `relationship_scores` 테이블에 저장 (provider, model, generated_at 포함)
5. 24시간 캐시 (동일 person + 데이터 변경 없으면 재호출 X)

## 비용 가드

- 사용자당 일 분석 횟수 제한 (기본 50회)
- 입력 토큰 큰 경우 최근 N건으로 자동 트리밍
- 프롬프트 캐싱(Anthropic) 활용 — 시스템 프롬프트는 캐시
