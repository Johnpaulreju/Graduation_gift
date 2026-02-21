import * as THREE from "three";

/**
 * Generates a star-burst sprite texture with glow + spike rays.
 * Returns a THREE.CanvasTexture suitable for SpriteMaterial or PointsMaterial.
 */
export function makeStarTexture(size = 128): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  // Radial glow
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.7)");
  g.addColorStop(0.55, "rgba(180,220,255,0.25)");
  g.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Star spikes
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2;

  const spikes = 6;
  for (let i = 0; i < spikes; i++) {
    ctx.rotate(Math.PI / spikes);
    ctx.beginPath();
    ctx.moveTo(-size * 0.28, 0);
    ctx.lineTo(size * 0.28, 0);
    ctx.stroke();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}
