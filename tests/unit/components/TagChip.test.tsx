import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TagChip } from "@/components/relationship/tag-chip"

describe("TagChip", () => {
  it("이름이 표시된다", () => {
    render(<TagChip tag={{ name: "친구" }} />)
    expect(screen.getByText("친구")).toBeInTheDocument()
  })

  it("colorIndex 1 → bg-tag-1 클래스", () => {
    const { container } = render(
      <TagChip tag={{ name: "친구", colorIndex: 1 }} />,
    )
    expect(container.firstChild).toHaveClass(/bg-tag-1/)
  })

  it("colorIndex 5 → bg-tag-5 클래스", () => {
    const { container } = render(
      <TagChip tag={{ name: "X", colorIndex: 5 }} />,
    )
    expect(container.firstChild).toHaveClass(/bg-tag-5/)
  })

  it("colorIndex 9는 1로 clamp (mod 8)", () => {
    const { container } = render(
      <TagChip tag={{ name: "X", colorIndex: 9 }} />,
    )
    expect(container.firstChild).toHaveClass(/bg-tag-1/)
  })

  it("variant=selected는 primary 색", () => {
    const { container } = render(
      <TagChip
        tag={{ name: "X", colorIndex: 1 }}
        variant="selected"
        onClick={() => {}}
      />,
    )
    expect(container.firstChild).toHaveClass(/bg-primary/)
    // colorIndex 색상은 미적용
    expect(container.firstChild).not.toHaveClass(/bg-tag-1/)
  })

  it("variant=outline은 투명 배경 + border", () => {
    const { container } = render(
      <TagChip tag={{ name: "X" }} variant="outline" onClick={() => {}} />,
    )
    expect(container.firstChild).toHaveClass(/bg-transparent/)
  })

  it("onClick이 호출된다", () => {
    const onClick = vi.fn()
    render(<TagChip tag={{ name: "친구" }} onClick={onClick} />)
    fireEvent.click(screen.getByRole("button", { name: /친구/ }))
    expect(onClick).toHaveBeenCalled()
  })

  it("variant=removable + onRemove → X 버튼 노출 + 클릭 시 onRemove", () => {
    const onRemove = vi.fn()
    render(
      <TagChip
        tag={{ name: "친구" }}
        variant="removable"
        onRemove={onRemove}
      />,
    )
    const xBtn = screen.getByRole("button", { name: "친구 태그 제거" })
    fireEvent.click(xBtn)
    expect(onRemove).toHaveBeenCalled()
  })

  it("onClick/onRemove 없으면 span으로 렌더 (button 아님)", () => {
    render(<TagChip tag={{ name: "친구" }} />)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("size=sm은 h-6 / size=md는 h-7 클래스", () => {
    const { container: sm } = render(<TagChip tag={{ name: "X" }} size="sm" />)
    expect(sm.firstChild).toHaveClass(/h-6/)
    const { container: md } = render(<TagChip tag={{ name: "X" }} size="md" />)
    expect(md.firstChild).toHaveClass(/h-7/)
  })
})
