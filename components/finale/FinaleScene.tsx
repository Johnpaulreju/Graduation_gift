"use client";

import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";

/* ── White star sprite texture ── */
function makeWhiteStarTexture(size = 128) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.2, "rgba(255,255,255,0.85)");
  g.addColorStop(0.55, "rgba(255,255,255,0.22)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();

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

/* ── Placed star with pop effect ── */
function PlacedStar({ position }: { position: THREE.Vector3 }) {
  const texture = useMemo(() => makeWhiteStarTexture(128), []);
  const spriteRef = useRef<THREE.Sprite>(null!);
  const startTime = useRef(Date.now());

  // Pop animation via manual scale update
  if (spriteRef.current) {
    const elapsed = (Date.now() - startTime.current) / 1000;
    const pop = elapsed < 0.3 ? 0.38 + Math.sin(elapsed * 10) * 0.08 : 0.3;
    spriteRef.current.scale.set(pop, pop, 1);
  }

  return (
    <sprite ref={spriteRef} position={position} scale={[0.38, 0.38, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={1}
        color="#ffffff"
      />
    </sprite>
  );
}

/* ── Tap layer: invisible plane that catches all taps ── */
function TapLayer({
  onPlaced,
}: {
  onPlaced: (screen: { x: number; y: number }) => void;
}) {
  const { camera, raycaster, pointer, size } = useThree();
  const planeRef = useRef<THREE.Mesh>(null!);
  const [starPos, setStarPos] = useState<THREE.Vector3 | null>(null);

  const handleTap = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (starPos) return; // only one star

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(planeRef.current, false);
    if (!hits.length) return;

    const p = hits[0].point.clone();
    setStarPos(p);

    // Project to screen coords for the bloom center
    const v = p.clone().project(camera);
    const sx = (v.x * 0.5 + 0.5) * size.width;
    const sy = (-v.y * 0.5 + 0.5) * size.height;

    onPlaced({ x: sx, y: sy });
  };

  return (
    <group onPointerDown={handleTap}>
      <mesh ref={planeRef} position={[0, 0, -3]}>
        <planeGeometry args={[14, 9]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {starPos && <PlacedStar position={starPos} />}
    </group>
  );
}

/* ── Exported scene ── */
export default function FinaleScene({
  onPlaced,
}: {
  onPlaced: (screen: { x: number; y: number }) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.6], fov: 55 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#05060F"]} />
      <ambientLight intensity={0.6} />

      <Stars
        radius={70}
        depth={55}
        count={1600}
        factor={1.6}
        saturation={0}
        fade
        speed={0.15}
      />

      <TapLayer onPlaced={onPlaced} />
    </Canvas>
  );
}
