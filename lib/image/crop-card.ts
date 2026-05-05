/**
 * 한국 명함 비율(9:5 = 1.8:1)로 이미지 자동 크롭.
 *
 * 동작:
 *  - 가로/세로 비율 비교해서 중앙을 기준으로 cover-fit 크롭
 *  - 출력은 800×444 JPEG (q=0.85) base64 dataURL — localStorage 저장 대비 가벼움
 *  - 원본이 9:5 비슷한 가로 사진이면 그대로 채워지고, 정사각/세로 사진이면 가로 핫스팟이 살아남
 */

export const CARD_ASPECT_W = 9
export const CARD_ASPECT_H = 5
const CARD_ASPECT = CARD_ASPECT_W / CARD_ASPECT_H

const TARGET_W = 800
const TARGET_H = Math.round(TARGET_W / CARD_ASPECT) // 444

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("이미지를 읽을 수 없어요"))
    img.src = src
  })
}

export async function cropImageToBusinessCard(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있어요")
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("10MB 이하 이미지만 가능해요")
  }

  const src = await readAsDataUrl(file)
  const img = await loadImage(src)

  const imgRatio = img.width / img.height
  let sx: number, sy: number, sw: number, sh: number

  if (imgRatio > CARD_ASPECT) {
    // 원본이 명함보다 가로로 더 길다 → 양옆을 잘라냄
    sh = img.height
    sw = img.height * CARD_ASPECT
    sy = 0
    sx = (img.width - sw) / 2
  } else {
    // 원본이 명함보다 세로로 더 길거나 정사각 → 위아래를 잘라냄
    sw = img.width
    sh = img.width / CARD_ASPECT
    sx = 0
    sy = (img.height - sh) / 2
  }

  const canvas = document.createElement("canvas")
  canvas.width = TARGET_W
  canvas.height = TARGET_H
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas를 사용할 수 없어요")

  // JPEG라 알파가 사라지므로 흰색 배경 깔기
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, TARGET_W, TARGET_H)
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H)

  return canvas.toDataURL("image/jpeg", 0.85)
}
