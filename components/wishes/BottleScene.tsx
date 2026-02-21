"use client";

import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Html } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";

export interface Wish {
  author: string;
  message: string;
}

/* ── Shared glass material — created once, reused by all bottles ── */
const glassMaterial = new THREE.MeshStandardMaterial({
  color: "#aaddff",
  transparent: true,
  opacity: 0.35,
  roughness: 0.15,
  metalness: 0.3,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const goldMaterial = new THREE.MeshStandardMaterial({
  color: "#D4AF37",
  emissive: "#D4AF37",
  emissiveIntensity: 0.4,
  metalness: 0.8,
  roughness: 0.25,
});

const glowMaterial = new THREE.MeshBasicMaterial({
  color: "#ffffff",
  transparent: true,
  opacity: 0.5,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const auraMaterial = new THREE.MeshBasicMaterial({
  color: "#88bbff",
  transparent: true,
  opacity: 0.08,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const auraHoverMaterial = new THREE.MeshBasicMaterial({
  color: "#88bbff",
  transparent: true,
  opacity: 0.18,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

/* ── Shared geometries — created once ── */
const bodyGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.28, 12, 1, true);
const bottomGeo = new THREE.SphereGeometry(0.09, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
const neckGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.1, 10, 1, true);
const ringGeo = new THREE.TorusGeometry(0.045, 0.01, 6, 12);
const corkGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.06, 10);
const glowGeo = new THREE.SphereGeometry(0.05, 6, 6);
const auraGeo = new THREE.SphereGeometry(0.3, 8, 8);

/* ── Glass bottle mesh ── */
function Bottle({
  wish,
  position,
  index,
  onOpen,
}: {
  wish: Wish;
  position: [number, number, number];
  index: number;
  onOpen: (index: number, screen: { x: number; y: number }) => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const { camera, gl } = useThree();

  const phase = useMemo(() => (index * 1.37 + 0.5) * Math.PI, [index]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Gentle floating
    groupRef.current.position.y =
      position[1] + Math.sin(t * 0.4 + phase) * 0.12;

    // Subtle rotation
    groupRef.current.rotation.z = Math.sin(t * 0.25 + phase) * 0.1;
    groupRef.current.rotation.x = Math.sin(t * 0.3 + phase * 0.7) * 0.05;

    // Hover scale
    const targetScale = hovered ? 1.15 : 1;
    const s = groupRef.current.scale.x;
    groupRef.current.scale.setScalar(s + (targetScale - s) * 0.1);
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const wp = new THREE.Vector3();
    groupRef.current.getWorldPosition(wp);
    const projected = wp.clone().project(camera);
    const rect = gl.domElement.getBoundingClientRect();
    const sx = ((projected.x + 1) / 2) * rect.width + rect.left;
    const sy = ((-projected.y + 1) / 2) * rect.height + rect.top;
    onOpen(index, { x: sx, y: sy });
  };

  return (
    <group
      ref={groupRef}
      position={position}
      scale={3}
      onClick={handleClick}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerEnter={() => {
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      {/* Invisible larger hitbox — catches taps on mobile */}
      <mesh>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Outer glow aura */}
      <mesh geometry={auraGeo} material={hovered ? auraHoverMaterial : auraMaterial} />

      {/* Tapered body */}
      <mesh geometry={bodyGeo} material={glassMaterial} />

      {/* Bottom cap */}
      <mesh position={[0, -0.14, 0]} geometry={bottomGeo} material={glassMaterial} />

      {/* Narrow neck */}
      <mesh position={[0, 0.18, 0]} geometry={neckGeo} material={glassMaterial} />

      {/* Gold ring */}
      <mesh position={[0, 0.21, 0]} geometry={ringGeo} material={goldMaterial} />

      {/* Cork */}
      <mesh position={[0, 0.26, 0]} geometry={corkGeo} material={goldMaterial} />

      {/* Inner glow */}
      <mesh geometry={glowGeo} material={glowMaterial} />

      {/* Label */}
      <Html
        position={[0, -0.3, 0]}
        center
        distanceFactor={6}
        style={{ pointerEvents: "none" }}
      >
        <div className="whitespace-nowrap text-center">
          <p className="text-[10px] tracking-wider text-[#A7B0D6]/70">
            {wish.author}
          </p>
        </div>
      </Html>
    </group>
  );
}

/* ── Parallax rig ── */
function ParallaxRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null!);
  const { pointer } = useThree();

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      pointer.x * 0.06,
      0.03
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -pointer.y * 0.04,
      0.03
    );
    const now = Date.now();
    group.current.position.x = Math.sin(now * 0.00003) * 0.08;
    group.current.position.y = Math.cos(now * 0.000025) * 0.06;
  });

  return <group ref={group}>{children}</group>;
}

/* ── Bottle positions — U-shape: low in center, higher on edges ── */
function generatePositions(count: number): [number, number, number][] {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const positions: [number, number, number][] = [];
  const minDist = isMobile ? 1.6 : 1.8;

  const xSpread = isMobile ? 4.5 : 5.5;
  const zBase = isMobile ? 0.8 : 1.0;
  const zRange = isMobile ? 0.4 : 0.8;

  // Y range — bottom of bowl to top allowed
  const yBottom = isMobile ? -2.5 : -1.8;
  const yTopEdge = isMobile ? 1.5 : 1.2;   // how high edge bottles can go
  const yTopCenter = isMobile ? -0.4 : -0.2; // center bottles stay below header

  const seed = (i: number, s: number) => {
    const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let x: number, y: number, z: number;

    do {
      x = (seed(i + attempts * 7, 1) - 0.5) * xSpread;

      // How far from center (0..1)
      const edgeFactor = Math.min(Math.abs(x) / (xSpread * 0.5), 1);
      // Max allowed y — lerp from yTopCenter (at center) to yTopEdge (at edges)
      const yMax = yTopCenter + edgeFactor * (yTopEdge - yTopCenter);

      y = yBottom + seed(i + attempts * 7, 2) * (yMax - yBottom);
      z = -zBase - seed(i + attempts * 7, 3) * zRange;
      attempts++;
    } while (
      attempts < 100 &&
      positions.some(([px, py, pz]) => {
        const dx = x - px;
        const dy = y - py;
        const dz = z - pz;
        return Math.sqrt(dx * dx + dy * dy + dz * dz) < minDist;
      })
    );

    positions.push([x, y, z]);
  }

  return positions;
}

/* ── Exported scene ── */
export default function BottleScene({
  wishes,
  onOpen,
}: {
  wishes: Wish[];
  onOpen: (index: number, screen: { x: number; y: number }) => void;
}) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const positions = useMemo(
    () => generatePositions(wishes.length),
    [wishes.length]
  );

  return (
    <Canvas
      camera={{
        position: [0, 0, isMobile ? 4.0 : 2.6],
        fov: isMobile ? 70 : 55,
      }}
      dpr={[1, isMobile ? 1.5 : 2]}
      style={{ touchAction: "none" }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#05060F"]} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 3, 5]} intensity={0.6} color="#aaddff" />
      <pointLight position={[-3, -2, 4]} intensity={0.3} color="#D4AF37" />

      {/* Background stars — reduced count */}
      <Stars
        radius={60}
        depth={45}
        count={isMobile ? 200 : 400}
        factor={2}
        saturation={0}
        fade
        speed={0.2}
      />

      <ParallaxRig>
        {wishes.map((wish, i) => (
          <Bottle
            key={i}
            wish={wish}
            position={positions[i]}
            index={i}
            onOpen={onOpen}
          />
        ))}
      </ParallaxRig>
    </Canvas>
  );
}
