# PWA Icons

현재 placeholder SVG 아이콘이 들어 있습니다. 실제 출시 전 디자이너가 아래 PNG 에셋으로 교체해야 합니다.

## 필요한 에셋

- `icon-192.png` (192x192) — Android 홈 화면
- `icon-512.png` (512x512) — Android 스플래시/스토어
- `maskable-512.png` (512x512, safe area 제외) — Android adaptive
- `apple-touch-icon.png` (180x180) — iOS 홈 화면
- `favicon.ico` — 웹 브라우저 탭

## 교체 후 작업

1. `public/manifest.json` 의 icons 배열에서 `type` 을 `image/png` 로 변경
2. `app/layout.tsx` 의 `metadata.icons` 의 url/type 업데이트
