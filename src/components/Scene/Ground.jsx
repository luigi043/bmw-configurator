import { ContactShadows } from '@react-three/drei';

/**
 * A reflective studio floor with soft contact shadows grounding the car.
 * ContactShadows are far cheaper than full shadow maps for the floor.
 */
export default function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial color="#0c0d10" metalness={0.6} roughness={0.55} />
      </mesh>
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.65}
        scale={12}
        blur={2.4}
        far={4}
        resolution={1024}
        color="#000000"
      />
    </>
  );
}
