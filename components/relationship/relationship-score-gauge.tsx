import * as React from "react"
import { cn } from "@/lib/utils"
import { bandFor } from "@/lib/format/score"

interface RelationshipScoreGaugeProps {
  score: number | null
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  showPercent?: boolean
  className?: string
}

const SIZES = {
  sm: { d: 40, stroke: 4, font: "text-[10px]", subFont: "text-[9px]" },
  md: { d: 80, stroke: 6, font: "text-base", subFont: "text-[10px]" },
  lg: { d: 128, stroke: 10, font: "text-2xl", subFont: "text-xs" },
}

export function RelationshipScoreGauge({
  score,
  size = "md",
  showLabel = true,
  showPercent = true,
  className,
}: RelationshipScoreGaugeProps) {
  const cfg = SIZES[size]
  const radius = (cfg.d - cfg.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const safeScore = score == null ? 0 : Math.min(100, Math.max(0, score))
  const offset = circumference * (1 - safeScore / 100)
  const info = bandFor(score)

  return (
    <div
      role="meter"
      aria-valuenow={score ?? 0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`관계 건강도 ${score ?? "미산출"}점, ${info.label}`}
      className={cn(
        "inline-flex flex-col items-center justify-center gap-1",
        className,
      )}
    >
      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: cfg.d, height: cfg.d }}
      >
        <svg
          width={cfg.d}
          height={cfg.d}
          viewBox={`0 0 ${cfg.d} ${cfg.d}`}
          className="-rotate-90"
        >
          <circle
            cx={cfg.d / 2}
            cy={cfg.d / 2}
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth={cfg.stroke}
          />
          <circle
            cx={cfg.d / 2}
            cy={cfg.d / 2}
            r={radius}
            fill="none"
            className={cn(info.ringClass, "transition-[stroke-dashoffset]")}
            strokeWidth={cfg.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showPercent ? (
            <span
              className={cn(
                "font-bold tabular-nums",
                cfg.font,
                info.toneClass,
              )}
            >
              {score == null ? "—" : score}
            </span>
          ) : null}
          {showLabel && size !== "sm" ? (
            <span
              className={cn(
                "font-medium text-muted-foreground",
                cfg.subFont,
              )}
            >
              {info.label}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
