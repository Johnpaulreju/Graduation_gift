/**
 * Generates 2D points that form the shape of a given text string.
 * Uses an offscreen canvas to render text, then samples filled pixels.
 */
export function makeTextPoints({
  text,
  width = 800,
  height = 300,
  font = "bold 220px 'Georgia'",
  density = 6,
  jitter = 2.5,
}: {
  text: string;
  width?: number;
  height?: number;
  font?: string;
  density?: number;
  jitter?: number;
}): Array<[number, number]> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font;
  ctx.fillText(text, width / 2, height / 2);

  const img = ctx.getImageData(0, 0, width, height).data;

  const pts: Array<[number, number]> = [];
  for (let y = 0; y < height; y += density) {
    for (let x = 0; x < width; x += density) {
      const idx = (y * width + x) * 4;
      const a = img[idx + 3]; // alpha channel
      if (a > 20) {
        const jx = (Math.random() - 0.5) * jitter;
        const jy = (Math.random() - 0.5) * jitter;
        pts.push([x + jx, y + jy]);
      }
    }
  }

  // Normalize to centered coordinate range for 3D scene
  const norm = pts.map(([x, y]) => {
    const nx = (x / width - 0.5) * 6.0;
    const ny = -(y / height - 0.5) * 2.2;
    return [nx, ny] as [number, number];
  });

  return norm;
}
