import * as React from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const chipVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium transition-colors",
  {
    variants: {
      size: {
        sm: "h-6 px-2 text-xs",
        md: "h-7 px-2.5 text-sm",
      },
      variant: {
        default: "",
        selected: "bg-primary text-primary-foreground",
        outline: "border border-input bg-transparent text-foreground",
        removable: "",
      },
    },
    defaultVariants: { size: "md", variant: "default" },
  },
)

const colorBg: Record<number, string> = {
  1: "bg-tag-1/15 text-tag-1 border border-tag-1/30",
  2: "bg-tag-2/15 text-tag-2 border border-tag-2/30",
  3: "bg-tag-3/15 text-tag-3 border border-tag-3/30",
  4: "bg-tag-4/15 text-tag-4 border border-tag-4/30",
  5: "bg-tag-5/15 text-tag-5 border border-tag-5/30",
  6: "bg-tag-6/15 text-tag-6 border border-tag-6/30",
  7: "bg-tag-7/15 text-tag-7 border border-tag-7/30",
  8: "bg-tag-8/15 text-tag-8 border border-tag-8/30",
}

interface TagChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">,
    VariantProps<typeof chipVariants> {
  tag: { id?: string; name: string; colorIndex?: number }
  onClick?: () => void
  onRemove?: () => void
}

export const TagChip = React.forwardRef<HTMLButtonElement, TagChipProps>(
  (
    { tag, size, variant, onClick, onRemove, className, ...props },
    ref,
  ) => {
    const colorIndex = ((tag.colorIndex ?? 1) - 1) % 8 + 1
    const colorClass =
      variant === "selected" || variant === "outline"
        ? ""
        : colorBg[colorIndex] ?? colorBg[1]

    const Tag = onClick || onRemove ? "button" : "span"
    const content = (
      <>
        <span className="truncate">{tag.name}</span>
        {variant === "removable" && onRemove ? (
          <span
            role="button"
            aria-label={`${tag.name} 태그 제거`}
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onRemove()
              }
            }}
            className="-mr-1 ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-foreground/10"
          >
            <X className="h-3 w-3" />
          </span>
        ) : null}
      </>
    )

    if (Tag === "span") {
      return (
        <span
          className={cn(chipVariants({ size, variant }), colorClass, className)}
        >
          {content}
        </span>
      )
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={cn(chipVariants({ size, variant }), colorClass, className)}
        {...props}
      >
        {content}
      </button>
    )
  },
)
TagChip.displayName = "TagChip"
