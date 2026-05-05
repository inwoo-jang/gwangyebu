---
name: nextjs-component
description: Next.js 15 App Router에서 서버/클라이언트 컴포넌트를 올바르게 구현한다. 데이터 페칭, Server Action, Form, Suspense 패턴 가이드. "Next.js 컴포넌트", "서버 컴포넌트", "Server Action" 요청에 사용.
---

# Next.js 컴포넌트 패턴 스킬

## 서버 vs 클라이언트 결정 트리

1. 인터랙션(onClick, useState) 필요? → 클라이언트 (`"use client"`)
2. DB/외부 API 호출 + 즉시 렌더? → 서버 컴포넌트
3. 둘 다 필요? → 서버에서 데이터 fetch 후 클라이언트 컴포넌트에 props로 전달

## 데이터 페칭 패턴

```tsx
// app/persons/page.tsx — Server Component
import { createClient } from "@/lib/supabase/server"

export default async function PersonsPage() {
  const supabase = await createClient()
  const { data: persons } = await supabase
    .from("persons")
    .select("*")
    .order("last_contacted_at", { ascending: true })

  return <PersonList persons={persons ?? []} />
}
```

## Server Action 패턴

```tsx
// app/persons/actions.ts
"use server"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const PersonSchema = z.object({
  name: z.string().min(1).max(50),
  mbti: z.string().optional(),
})

export async function createPerson(formData: FormData) {
  const parsed = PersonSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.format() }

  const supabase = await createClient()
  const { error } = await supabase.from("persons").insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath("/persons")
  return { ok: true }
}
```

## Form 패턴 (react-hook-form + zod)

```tsx
"use client"
const form = useForm<z.infer<typeof PersonSchema>>({
  resolver: zodResolver(PersonSchema),
})
```

## 규칙

- 서버 컴포넌트가 기본 — 필요할 때만 `"use client"`
- 클라이언트 번들 크기 주시 (큰 라이브러리는 dynamic import)
- Suspense + loading.tsx로 점진적 렌더
- error.tsx로 에러 바운더리
- 메타데이터는 `generateMetadata` 함수로
