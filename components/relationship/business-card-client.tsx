"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BusinessCardSection } from "@/components/relationship/business-card-section"
import {
  uploadBusinessCard,
  clearBusinessCard,
} from "@/lib/actions/business-card"

interface BusinessCardClientProps {
  personId: string
  personName: string
  initialUrl: string | null
}

export function BusinessCardClient({
  personId,
  personName,
  initialUrl,
}: BusinessCardClientProps) {
  const router = useRouter()
  const [url, setUrl] = React.useState<string | null>(initialUrl)
  const [, startTransition] = React.useTransition()

  const handleChange = (dataUrl: string) => {
    // 낙관적 미리보기
    setUrl(dataUrl)
    startTransition(async () => {
      const res = await uploadBusinessCard({
        person_id: personId,
        data_url: dataUrl,
      })
      if (res.ok) {
        setUrl(res.data.url)
        router.refresh()
      } else {
        setUrl(initialUrl)
        toast.error(res.error.message)
      }
    })
  }

  const handleClear = () => {
    const prev = url
    setUrl(null)
    startTransition(async () => {
      const res = await clearBusinessCard({ person_id: personId })
      if (res.ok) {
        router.refresh()
      } else {
        setUrl(prev)
        toast.error(res.error.message)
      }
    })
  }

  return (
    <BusinessCardSection
      cardUrl={url}
      personName={personName}
      onChange={handleChange}
      onClear={handleClear}
    />
  )
}
