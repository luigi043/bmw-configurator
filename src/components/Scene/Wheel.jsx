import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * A single procedurally generated wheel. The spoke count and radius come
 * from the selected wheel option, so changing wheels rebuilds the geometry.
 * GSAP gives each swap a quick "pop" so the change feels tactile.
 */
export default function Wheel({ position, wheel }) {
  const group = useRef();

  // Rebuild spokes only when the wheel definition changes.
  const spokeAngles = useMemo(
    () => Array.from({ length: wheel.spokes }, (_, i) => (i / wheel.spokes) * Math.PI * 2),
    [wheel.spokes]
  );

  useEffect(() => {
    if (!group.current) return;
    gsap.fromTo(
      group.current.scale,
      { x: 0.85, y: 0.85, z: 0.85 },
      { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(2.2)' }
    );
  }, [wheel.id]);

  const r = wheel.radius;

  return (
    <group ref={group} position={position} rotation={[0, 0, Math.PI / 2]}>
      {/* Tyre */}
      <mesh castShadow>
        <torusGeometry args={[r, 0.12, 24, 48]} />
        <meshStandardMaterial color="#1b1b1d" roughness={0.85} />
      </mesh>
      {/* Rim barrel */}
      <mesh>
        <cylinderGeometry args={[r * 0.78, r * 0.78, 0.22, 40]} />
        <meshStandardMaterial color="#cfd2d6" metalness={0.95} roughness={0.25} />
      </mesh>
      {/* Spokes */}
      {spokeAngles.map((a, i) => (
        <mesh key={i} rotation={[0, a, 0]} position={[0, 0, 0]}>
          <boxGeometry args={[r * 0.16, 0.16, r * 1.4]} />
          <meshStandardMaterial color="#e7e9ec" metalness={0.95} roughness={0.2} />
        </mesh>
      ))}
      {/* Hub cap */}
      <mesh>
        <cylinderGeometry args={[r * 0.18, r * 0.18, 0.24, 24]} />
        <meshStandardMaterial color="#2a2c30" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}
