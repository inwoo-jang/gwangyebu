import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}", "**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "tests/e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      // Next.js의 `import "server-only"`는 Vitest jsdom 환경에서 실 모듈이 없으므로
      // 빈 stub으로 대체해 서버 전용 모듈도 단위 테스트 가능하게 한다.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
})
