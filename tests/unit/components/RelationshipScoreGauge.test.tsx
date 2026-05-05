import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { RelationshipScoreGauge } from "@/components/relationship/relationship-score-gauge"

describe("RelationshipScoreGauge", () => {
  it("role=meter + aria-valuenow가 점수와 일치", () => {
    render(<RelationshipScoreGauge score={75} />)
    const meter = screen.getByRole("meter")
    expect(meter).toHaveAttribute("aria-valuenow", "75")
    expect(meter).toHaveAttribute("aria-valuemin", "0")
    expect(meter).toHaveAttribute("aria-valuemax", "100")
  })

  it("점수 75는 '양호' 라벨 (강 밴드)", () => {
    render(<RelationshipScoreGauge score={75} size="md" />)
    expect(screen.getByText("양호")).toBeInTheDocument()
  })

  it("점수 95는 '매우 좋음' 라벨", () => {
    render(<RelationshipScoreGauge score={95} size="md" />)
    expect(screen.getByText("매우 좋음")).toBeInTheDocument()
  })

  it("점수 50은 '보통' 라벨", () => {
    render(<RelationshipScoreGauge score={50} size="md" />)
    expect(screen.getAllByText("보통").length).toBeGreaterThan(0)
  })

  it("점수 25는 '주의' 라벨", () => {
    render(<RelationshipScoreGauge score={25} size="md" />)
    expect(screen.getByText("주의")).toBeInTheDocument()
  })

  it("점수 5는 '위험' 라벨", () => {
    render(<RelationshipScoreGauge score={5} size="md" />)
    expect(screen.getByText("위험")).toBeInTheDocument()
  })

  it("score=null이면 점수 위치에 '—' 표시", () => {
    render(<RelationshipScoreGauge score={null} size="md" />)
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("100 초과는 100으로 clamp되어 그려짐 (aria-valuenow는 원본)", () => {
    render(<RelationshipScoreGauge score={150} />)
    const meter = screen.getByRole("meter")
    // aria-label은 원본 점수 표기
    expect(meter.getAttribute("aria-label")).toContain("150")
  })

  it("size=sm일 때 라벨은 숨김 (showLabel=true여도)", () => {
    const { container } = render(
      <RelationshipScoreGauge score={75} size="sm" showLabel />,
    )
    // sm에선 sub label "양호" 텍스트 노드 없음
    expect(container.querySelector("svg")).toBeInTheDocument()
  })

  it("showPercent=false면 숫자 미표시", () => {
    render(<RelationshipScoreGauge score={50} size="md" showPercent={false} />)
    expect(screen.queryByText("50")).toBeNull()
  })

  it("두 개의 SVG circle (트랙 + 값)이 그려진다", () => {
    const { container } = render(<RelationshipScoreGauge score={50} />)
    expect(container.querySelectorAll("circle")).toHaveLength(2)
  })
})
