import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { EmptyState } from "@/components/common/empty-state"

describe("EmptyState", () => {
  it("title을 heading으로 노출", () => {
    render(<EmptyState title="아무것도 없어요" />)
    expect(
      screen.getByRole("heading", { name: "아무것도 없어요" }),
    ).toBeInTheDocument()
  })

  it("description이 있으면 노출", () => {
    render(<EmptyState title="t" description="설명입니다" />)
    expect(screen.getByText("설명입니다")).toBeInTheDocument()
  })

  it("icon 문자열을 그대로 렌더 (이모지)", () => {
    render(<EmptyState title="t" icon="👋" />)
    expect(screen.getByText("👋")).toBeInTheDocument()
  })

  it("action.href가 있으면 anchor", () => {
    render(<EmptyState title="t" action={{ label: "추가", href: "/persons/new" }} />)
    const link = screen.getByRole("link", { name: "추가" })
    expect(link).toHaveAttribute("href", "/persons/new")
  })

  it("action.onClick이 호출된다", () => {
    const onClick = vi.fn()
    render(<EmptyState title="t" action={{ label: "클릭", onClick }} />)
    fireEvent.click(screen.getByRole("button", { name: "클릭" }))
    expect(onClick).toHaveBeenCalled()
  })

  it("secondaryAction도 함께 노출", () => {
    render(
      <EmptyState
        title="t"
        action={{ label: "주", onClick: () => {} }}
        secondaryAction={{ label: "보조", onClick: () => {} }}
      />,
    )
    expect(screen.getByRole("button", { name: "주" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "보조" })).toBeInTheDocument()
  })

  it("size=lg 적용 시 py-16", () => {
    const { container } = render(<EmptyState title="t" size="lg" />)
    expect(container.firstChild).toHaveClass(/py-16/)
  })

  it("role=status 컨테이너", () => {
    render(<EmptyState title="t" />)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })
})
