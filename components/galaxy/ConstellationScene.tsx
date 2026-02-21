"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import { makeTextPoints } from "@/lib/textPoints";
import { makeStarTexture } from "@/lib/starTexture";
import { getDevicePerf, PERF_SETTINGS } from "@/lib/devicePerf";

export interface ConstellationMemory {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
}

/* ── Nearest-neighbor edges for constellation lines ── */
function computeEdges(points: THREE.Vector3[], k = 2): [number, number][] {
  const edges: [number, number][] = [];
  const seen = new Set<string>();

  for (let i = 0; i < points.length; i++) {
    const dists: Array<{ j: number; d: number }> = [];
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      dists.push({ j, d: points[i].distanceToSquared(points[j]) });
    }
    dists.sort((a, b) => a.d - b.d);
    for (let n = 0; n < k; n++) {
      const j = dists[n]?.j;
      if (j == null) continue;
      const key = Math.min(i, j) + "-" + Math.max(i, j);
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([i, j]);
      }
    }
  }
  return edges;
}

/* ── Pick well-distributed subset using farthest-point sampling ── */
function farthestPointSample(
  points: THREE.Vector3[],
  count: number
): number[] {
  if (points.length <= count) return points.map((_, i) => i);

  const selected: number[] = [];
  const minDists = new Float32Array(points.length).fill(Infinity);

  // Start with the first point
  selected.push(0);

  for (let s = 1; s < count; s++) {
    // Update min distances from the last selected point
    const last = points[selected[selected.length - 1]];
    for (let i = 0; i < points.length; i++) {
      const d = points[i].distanceToSquared(last);
      if (d < minDists[i]) minDists[i] = d;
    }

    // Pick the point with the largest min distance
    let bestIdx = 0;
    let bestDist = -1;
    for (let i = 0; i < points.length; i++) {
      if (selected.includes(i)) continue;
      if (minDists[i] > bestDist) {
        bestDist = minDists[i];
        bestIdx = i;
      }
    }
    selected.push(bestIdx);
  }

  return selected;
}

/* ── Interactive star sprite (clickable, gold, pulsing, halo) ── */
function InteractiveStar({
  position,
  texture,
  index,
  onPick,
}: {
  position: THREE.Vector3;
  texture: THREE.CanvasTexture;
  index: number;
  onPick: (index: number, screen: { x: number; y: number }) => void;
}) {
  const spriteRef = useRef<THREE.Sprite>(null!);
  const haloRef = useRef<THREE.Sprite>(null!);
  const [hovered, setHovered] = useState(false);
  const { camera, gl } = useThree();

  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    if (!spriteRef.current) return;
    const t = clock.getElapsedTime();

    // Breathing pulse — slow, distinct from twinkle
    const breath = 0.28 + Math.sin(t * 0.8 + phase) * 0.06;
    const s = hovered ? 0.44 : breath;
    spriteRef.current.scale.setScalar(s);

    const mat = spriteRef.current.material as THREE.SpriteMaterial;
    mat.opacity = hovered ? 1 : 0.75 + Math.sin(t * 0.8 + phase) * 0.15;

    // Halo ring pulses inversely — expands when star contracts
    if (haloRef.current) {
      const haloScale = hovered ? 0.7 : 0.5 + Math.sin(t * 0.8 + phase + Math.PI) * 0.08;
      haloRef.current.scale.setScalar(haloScale);
      const haloMat = haloRef.current.material as THREE.SpriteMaterial;
      haloMat.opacity = hovered ? 0.3 : 0.12 + Math.sin(t * 0.8 + phase) * 0.05;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const wp = new THREE.Vector3();
    spriteRef.current.getWorldPosition(wp);
    const projected = wp.clone().project(camera);
    const rect = gl.domElement.getBoundingClientRect();
    const sx = ((projected.x + 1) / 2) * rect.width + rect.left;
    const sy = ((-projected.y + 1) / 2) * rect.height + rect.top;
    onPick(index, { x: sx, y: sy });
  };

  return (
    <group position={position}>
      {/* Outer halo — soft gold ring */}
      <sprite ref={haloRef} scale={[0.5, 0.5, 0.5]}>
        <spriteMaterial
          map={texture}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#D4AF37"
          opacity={0.12}
        />
      </sprite>

      {/* Star core — warm gold */}
      <sprite
        ref={spriteRef}
        onClick={handleClick}
        onPointerEnter={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <spriteMaterial
          map={texture}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#FFD980"
          opacity={0.9}
        />
      </sprite>
    </group>
  );
}

/* ── Non-interactive dim constellation dot (part of the letter shape) ── */
function DimStar({
  position,
  texture,
}: {
  position: THREE.Vector3;
  texture: THREE.CanvasTexture;
}) {
  const spriteRef = useRef<THREE.Sprite>(null!);

  const twinkle = useMemo(
    () => ({
      base: 0.25 + Math.random() * 0.15,
      amp: 0.1 + Math.random() * 0.1,
      speed: 0.5 + Math.random() * 1.0,
      phase: Math.random() * Math.PI * 2,
    }),
    []
  );

  useFrame(({ clock }) => {
    if (!spriteRef.current) return;
    const t = clock.getElapsedTime();
    const mat = spriteRef.current.material as THREE.SpriteMaterial;
    mat.opacity =
      twinkle.base + Math.sin(t * twinkle.speed + twinkle.phase) * twinkle.amp;
  });

  return (
    <sprite ref={spriteRef} position={position} scale={[0.12, 0.12, 0.12]}>
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#aabbdd"
        opacity={0.3}
      />
    </sprite>
  );
}

/* ── Constellation lines ── */
function ConstellationLines({
  points,
  edges,
}: {
  points: THREE.Vector3[];
  edges: [number, number][];
}) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    for (const [i, j] of edges) {
      positions.push(points[i].x, points[i].y, points[i].z);
      positions.push(points[j].x, points[j].y, points[j].z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    return geo;
  }, [points, edges]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.08}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

/* ── Parallax camera rig ── */
function ParallaxRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null!);
  const { pointer } = useThree();

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      pointer.x * 0.08,
      0.04
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -pointer.y * 0.06,
      0.04
    );
    const now = Date.now();
    group.current.position.x = Math.sin(now * 0.00004) * 0.1;
    group.current.position.y = Math.cos(now * 0.00003) * 0.08;
  });

  return <group ref={group}>{children}</group>;
}

/* ── Inner scene ── */
function ConstellationInner({
  name,
  memories,
  onPick,
  isMobile = false,
}: {
  name: string;
  memories: ConstellationMemory[];
  onPick: (index: number, screen: { x: number; y: number }) => void;
  isMobile?: boolean;
}) {
  const [starTexture, setStarTexture] = useState<THREE.CanvasTexture | null>(
    null
  );
  const [allPoints, setAllPoints] = useState<THREE.Vector3[]>([]);
  const [edges, setEdges] = useState<[number, number][]>([]);
  const [interactiveIndices, setInteractiveIndices] = useState<number[]>([]);
  const [yOffset, setYOffset] = useState(-0.3);

  // Push constellation lower on mobile so it clears the header
  useEffect(() => {
    const update = () => {
      setYOffset(window.innerWidth < 768 ? -1.2 : -0.3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const tex = makeStarTexture(128);
    setStarTexture(tex);

    // Generate ALL text points — these form the visible constellation shape
    const allPts = makeTextPoints({
      text: name,
      font: "bold 220px 'Georgia'",
      density: 8,
      jitter: 2.0,
    }) as Array<[number, number]>;

    // Convert all points to Vector3
    const vec3s = allPts.map(
      ([x, y]) =>
        new THREE.Vector3(x, y, -3.0 + (Math.random() - 0.5) * 0.4)
    );

    // Compute edges across ALL points — this makes the letters readable
    const allEdges = computeEdges(vec3s, 2);

    // Pick a well-distributed subset for interactive memory stars
    // Uses farthest-point sampling so they're spread evenly across the text
    const memoryCount = Math.min(memories.length, vec3s.length);
    const selectedIndices = farthestPointSample(vec3s, memoryCount);

    setAllPoints(vec3s);
    setEdges(allEdges);
    setInteractiveIndices(selectedIndices);
  }, [name, memories.length]);

  const perf = useMemo(() => PERF_SETTINGS[getDevicePerf()], []);

  if (!starTexture || allPoints.length === 0) return null;

  return (
    <>
      {/* Background star layers */}
      <Stars
        radius={60}
        depth={45}
        count={perf.stars}
        factor={2.5}
        saturation={0}
        fade
        speed={0.2}
      />
      <Sparkles
        count={perf.sparkles}
        scale={[12, 8, 8]}
        size={1.5}
        speed={0.3}
        opacity={0.2}
      />

      <ambientLight intensity={0.5} />

      <ParallaxRig>
        <group position={[0, yOffset, 0]}>
          {/* Constellation lines — connects ALL points, forming readable letters */}
          <ConstellationLines points={allPoints} edges={edges} />

          {/* Dim stars — ALL text points, forming the letter shapes */}
          {allPoints.map((pos, i) => {
            // Skip positions that are interactive — they get the bigger star
            if (interactiveIndices.includes(i)) return null;
            return <DimStar key={`dim-${i}`} position={pos} texture={starTexture} />;
          })}

          {/* Interactive memory stars — brighter, larger, clickable */}
          {interactiveIndices.map((ptIndex, memoryIndex) => (
            <InteractiveStar
              key={`star-${memoryIndex}`}
              position={allPoints[ptIndex]}
              texture={starTexture}
              index={memoryIndex}
              onPick={onPick}
            />
          ))}
        </group>
      </ParallaxRig>

      {/* Bloom for glow — skip on low-end devices */}
      {perf.enablePostProcessing && (
        <EffectComposer>
          <Bloom intensity={perf.bloomIntensity} luminanceThreshold={0.15} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}

/* ── Exported Canvas wrapper ── */
export default function ConstellationScene({
  name,
  memories,
  onPick,
  isMobile = false,
}: {
  name: string;
  memories: ConstellationMemory[];
  onPick: (index: number, screen: { x: number; y: number }) => void;
  isMobile?: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, isMobile ? 3.2 : 2.6], fov: isMobile ? 65 : 55 }}
      dpr={[1, isMobile ? 1.5 : 2]}
      gl={{ antialias: !isMobile, alpha: true, ...(isMobile ? { powerPreference: "low-power" } : {}) }}
    >
      <color attach="background" args={["#05060F"]} />
      <ConstellationInner name={name} memories={memories} onPick={onPick} isMobile={isMobile} />
    </Canvas>
  );
}
