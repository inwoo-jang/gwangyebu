---
name: pwa-setup
description: Next.js 앱에 PWA(매니페스트, 서비스워커, 오프라인, 설치 프롬프트)를 설정한다. iOS/Android 모두 지원. "PWA", "설치 가능", "오프라인", "서비스워커" 요청에 사용.
---

# PWA 셋업 스킬

## 1. Manifest

`public/manifest.json`:
```json
{
  "name": "관계부",
  "short_name": "관계부",
  "description": "체계적인 인간관계 관리",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#7c3aed",
  "lang": "ko",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## 2. Layout 메타

```tsx
// app/layout.tsx
export const metadata = {
  manifest: "/manifest.json",
  themeColor: "#7c3aed",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "관계부" },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#7c3aed",
}
```

## 3. 서비스워커 (@serwist/next 권장)

```ts
// next.config.ts
import withSerwistInit from "@serwist/next"
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
})
export default withSerwist({})
```

```ts
// app/sw.ts
import { defaultCache } from "@serwist/next/worker"
import { Serwist } from "serwist"

declare const self: ServiceWorkerGlobalScope
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})
serwist.addEventListeners()
```

## 4. iOS 대응

- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `apple-touch-icon` 180x180
- iOS는 매니페스트 일부만 지원 — 설치 안내 UI는 별도

## 5. 설치 프롬프트

`beforeinstallprompt` 이벤트 캡처 → 사용자 액션 시 호출. iOS는 안내 모달로 "공유 → 홈 화면에 추가" 가이드.
