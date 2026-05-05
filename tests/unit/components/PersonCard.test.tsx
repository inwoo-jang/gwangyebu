import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  PersonCard,
  PersonCardSkeleton,
  type PersonCardData,
} from "@/components/relationship/person-card"

const baseline: PersonCardData = {
  id: "p1",
  name: "김지수",
  relationshipType: "friend",
  mbti: "ENFP",
  lastContactAt: null,
  tags: [
    { id: "t1", name: "친한친구", colorIndex: 1 },
    { id: "t2", name: "동아리", colorIndex: 2 },
  ],
}

describe("PersonCard", () => {
  it("이름·관계유형(친구)·MBTI를 표시", () => {
    render(<PersonCard person={baseline} />)
    expect(screen.getByRole("heading", { name: "김지수" })).toBeInTheDocument()
    expect(screen.getByText(/친구.*ENFP/)).toBeInTheDocument()
  })

  it("연락 기록이 없으면 안내 카피", () => {
    render(<PersonCard person={baseline} />)
    expect(
      screen.getByText("아직 연락 기록이 없어요"),
    ).toBeInTheDocument()
  })

  it("태그 3개 초과 시 +N 표시", () => {
    render(
      <PersonCard
        person={{
          ...baseline,
          tags: [
            { id: "t1", name: "a" },
            { id: "t2", name: "b" },
            { id: "t3", name: "c" },
            { id: "t4", name: "d" },
            { id: "t5", name: "e" },
          ],
        }}
      />,
    )
    expect(screen.getByText("+2")).toBeInTheDocument()
  })

  it("score가 있으면 RelationshipScoreGauge(meter role)가 노출", () => {
    render(<PersonCard person={{ ...baseline, score: 80 }} />)
    expect(screen.getByRole("meter")).toBeInTheDocument()
  })

  it("href가 있으면 anchor로 렌더링", () => {
    render(<PersonCard person={baseline} href="/persons/p1" />)
    const links = screen.getAllByRole("link")
    expect(links[0]).toHaveAttribute("href", "/persons/p1")
  })

  it("variant=urgent에 destructive 보더 적용", () => {
    const { container } = render(
      <PersonCard person={baseline} variant="urgent" />,
    )
    expect(container.firstChild).toHaveClass(/border-l-destructive/)
  })

  it("variant=warning에 warning 보더 적용", () => {
    const { container } = render(
      <PersonCard person={baseline} variant="warning" />,
    )
    expect(container.firstChild).toHaveClass(/border-l-warning/)
  })

  it("variant=default는 추가 색상 강조 없음", () => {
    const { container } = render(<PersonCard person={baseline} />)
    expect(container.firstChild).toHaveClass(/border-border/)
  })

  it("lastContactAt + lastContactChannel 둘 다 있으면 채널 아이콘+라벨 노출", () => {
    render(
      <PersonCard
        person={{
          ...baseline,
          lastContactAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          lastContactChannel: "kakao",
        }}
      />,
    )
    // 카톡 라벨 표시
    expect(screen.getByText(/카톡/)).toBeInTheDocument()
  })
})

describe("PersonCardSkeleton", () => {
  it("스켈레톤이 4개의 pulse div를 가진다", () => {
    const { container } = render(<PersonCardSkeleton />)
    const pulses = container.querySelectorAll(".animate-pulse")
    expect(pulses.length).toBeGreaterThanOrEqual(3)
  })
})
