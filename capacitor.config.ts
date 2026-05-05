import type { CapacitorConfig } from "@capacitor/cli"

/**
 * Capacitor 설정 — 하이브리드 모드 (Vercel URL을 WebView로 로드).
 *
 * 사용 방법:
 *  - 개발 중 로컬 테스트: server.url을 http://192.168.x.x:3000 (PC IP) 로 설정 후
 *    `npm run dev`로 dev 서버 띄우고 휴대폰을 같은 네트워크에 연결
 *  - 프로덕션 빌드: server.url을 Vercel 도메인으로
 *  - 완전 오프라인 모드(네이티브 앱에 자산 동봉)는 next.config.ts의 `output: "export"`
 *    필요하지만, server actions를 못 쓰므로 비추천
 *
 * webDir의 `out/`은 오프라인/네트워크 실패 시 폴백 페이지 위치.
 */
const config: CapacitorConfig = {
  appId: "app.gwangyebu",
  appName: "관계부",
  webDir: "out",
  // ⬇︎ 배포 후 활성화 (https URL 그대로). 주석 해제 + 도메인 입력
  // server: {
  //   url: "https://app.gwangyebu.com",
  //   cleartext: false,
  //   androidScheme: "https",
  // },
  ios: {
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: false,
  },
}

export default config
