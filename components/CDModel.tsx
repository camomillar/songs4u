"use client";
import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import type { Group } from "three";

function Model({ isPlaying }: { isPlaying: boolean }) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF("/cd_with_jewel_case_bully/scene.gltf");

  useFrame((_, delta) => {
    if (!group.current) return;
    if (isPlaying) {
      // Slowly spin when playing
      group.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={group}>
      <primitive object={scene} scale={1.5} position={[0, -0.5, 0]} />
    </group>
  );
}

interface Props {
  isPlaying: boolean;
}

export default function CDModel({ isPlaying }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 1, 4], fov: 45 }}
      style={{ width: "100%", height: 320, cursor: "grab" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-3, 2, -3]} intensity={0.4} />

      <Suspense fallback={null}>
        <Model isPlaying={isPlaying} />
        <Environment preset="city" />
        <ContactShadows position={[0, -1.5, 0]} opacity={0.3} scale={6} blur={2} />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={!isPlaying}
        autoRotateSpeed={1.5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  );
}

useGLTF.preload("/cd_with_jewel_case_bully/scene.gltf");
