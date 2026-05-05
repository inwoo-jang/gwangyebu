"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  initial?: string
}

export function SearchBar({ initial }: SearchBarProps) {
  const router = useRouter()
  const sp = useSearchParams()
  const [value, setValue] = React.useState(initial ?? sp.get("q") ?? "")

  React.useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp?.toString())
      if (value) params.set("q", value)
      else params.delete("q")
      router.replace(`/search?${params.toString()}`)
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="이름·태그·MBTI로 검색"
        className="pl-9"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="인물 검색"
      />
    </div>
  )
}
