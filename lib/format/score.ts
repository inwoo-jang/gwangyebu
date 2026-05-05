/**
 * 관계 건강도 점수 → 밴드/색상 매핑.
 */

export type ScoreBand = "강" | "보통" | "주의" | "위험"

export interface BandInfo {
  band: ScoreBand
  label: string
  toneClass: string // 텍스트 컬러
  bgClass: string // 배경 (반투명)
  ringClass: string // 진행 stroke
}

export function bandFor(score: number | null | undefined): BandInfo {
  if (score == null) {
    return {
      band: "보통",
      label: "미산출",
      toneClass: "text-muted-foreground",
      bgClass: "bg-muted",
      ringClass: "stroke-muted-foreground",
    }
  }
  if (score >= 70) {
    return {
      band: "강",
      label: score >= 90 ? "매우 좋음" : "양호",
      toneClass: "text-success",
      bgClass: "bg-success/10",
      ringClass: "stroke-success",
    }
  }
  if (score >= 40) {
    return {
      band: "보통",
      label: "보통",
      toneClass: "text-warning",
      bgClass: "bg-warning/10",
      ringClass: "stroke-warning",
    }
  }
  if (score >= 20) {
    return {
      band: "주의",
      label: "주의",
      toneClass: "text-destructive",
      bgClass: "bg-destructive/10",
      ringClass: "stroke-destructive",
    }
  }
  return {
    band: "위험",
    label: "위험",
    toneClass: "text-destructive",
    bgClass: "bg-destructive/15",
    ringClass: "stroke-destructive",
  }
}

export function urgencyToneClass(urgency: "low" | "med" | "high"): string {
  switch (urgency) {
    case "high":
      return "text-destructive bg-destructive/10 border-destructive/20"
    case "med":
      return "text-warning bg-warning/10 border-warning/20"
    case "low":
    default:
      return "text-muted-foreground bg-muted border-border"
  }
}

export function urgencyLabel(urgency: "low" | "med" | "high"): string {
  switch (urgency) {
    case "high":
      return "긴급"
    case "med":
      return "보통"
    case "low":
    default:
      return "여유"
  }
}
