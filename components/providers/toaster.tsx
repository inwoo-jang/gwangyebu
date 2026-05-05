"use client"

import { Toaster as SonnerToaster } from "sonner"
import { useTheme } from "next-themes"

export function Toaster() {
  const { resolvedTheme } = useTheme()
  return (
    <SonnerToaster
      position="top-center"
      richColors
      theme={(resolvedTheme === "dark" ? "dark" : "light") as "dark" | "light"}
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border bg-card text-card-foreground shadow-soft-lg",
        },
      }}
    />
  )
}
