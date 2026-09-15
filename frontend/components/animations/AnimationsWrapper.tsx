"use client";
// frontend/components/animations/AnimationsWrapper.tsx
import dynamic from "next/dynamic";

const MatrixRain = dynamic(
  () => import("@/components/animations/MatrixRain"),
  { ssr: false }
);

const HolographicGrid = dynamic(
  () => import("@/components/animations/HolographicGrid"),
  { ssr: false }
);

const ParticleField = dynamic(
  () => import("@/components/animations/ParticleField"),
  { ssr: false }
);

const ScanlineEffect = dynamic(
  () => import("@/components/animations/ScanlineEffect"),
  { ssr: false }
);

export default function AnimationsWrapper() {
  return (
    <>
      <MatrixRain />
      <HolographicGrid />
      <ParticleField />
      <ScanlineEffect />
    </>
  );
}