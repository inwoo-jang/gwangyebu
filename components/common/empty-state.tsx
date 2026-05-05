import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode | string
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
    variant?: "default" | "outline" | "ghost"
  }
  secondaryAction?: { label: string; onClick: () => void; href?: string }
  size?: "sm" | "md" | "lg"
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
}: EmptyStateProps) {
  const padding =
    size === "sm" ? "py-8" : size === "lg" ? "py-16" : "py-12"

  return (
    <div
      role="status"
      className={cn(
        "mx-auto flex max-w-xs flex-col items-center justify-center text-center",
        padding,
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 text-4xl" aria-hidden>
          {icon}
        </div>
      ) : null}
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-6 flex flex-col gap-2">
        {action ? (
          action.href ? (
            <Button asChild variant={action.variant ?? "default"}>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button
              variant={action.variant ?? "default"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )
        ) : null}
        {secondaryAction ? (
          secondaryAction.href ? (
            <Button asChild variant="ghost">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          ) : (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )
        ) : null}
      </div>
    </div>
  )
}
