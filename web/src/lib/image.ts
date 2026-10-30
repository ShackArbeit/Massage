// 簽名圖：裁掉空白 → 縮放（寬度約 600px）→ 壓縮成 PNG data URL，目標 ≤ 100KB

const TARGET_WIDTH = 600;
const MAX_HEIGHT = 300;
const MIN_WIDTH = 200;
export const SIGNATURE_MAX_DATA_URL_LENGTH = 100_000;

type Box = { x: number; y: number; w: number; h: number };

// 找出有筆跡（非白色）的範圍
function inkBounds(canvas: HTMLCanvasElement): Box | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i] < 200 || data[i + 1] < 200 || data[i + 2] < 200) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const pad = Math.round(Math.max(width, height) * 0.02);
  const x = Math.max(0, minX - pad);
  const y = Math.max(0, minY - pad);
  return { x, y, w: Math.min(width, maxX + pad) - x, h: Math.min(height, maxY + pad) - y };
}

function render(source: HTMLCanvasElement, box: Box, width: number): string {
  const scale = Math.min(width / box.w, MAX_HEIGHT / box.h, 1);
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(box.w * scale));
  out.height = Math.max(1, Math.round(box.h * scale));
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, box.x, box.y, box.w, box.h, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

export function compressSignature(source: HTMLCanvasElement): string {
  const box = inkBounds(source) ?? { x: 0, y: 0, w: source.width, h: source.height };
  let width = TARGET_WIDTH;
  for (;;) {
    const url = render(source, box, width);
    if (url.length <= SIGNATURE_MAX_DATA_URL_LENGTH || width <= MIN_WIDTH) return url;
    width = Math.round(width * 0.8);
  }
}
