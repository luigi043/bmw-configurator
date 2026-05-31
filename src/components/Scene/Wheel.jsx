import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * A procedurally generated wheel: tyre, rim barrel, spokes, hub, brake rotor
 * and a coloured caliper. Spoke count and radius come from the selected wheel
 * option, so changing wheels rebuilds the geometry. GSAP gives each swap a
 * quick "pop" so the change feels tactile.
 *
 * Local axle is along X; the parent rotates the group so it points across the
 * car's track.
 */
export default function Wheel({ position, wheel }) {
  const group = useRef();

  const spokeAngles = useMemo(
    () => Array.from({ length: wheel.spokes }, (_, i) => (i / wheel.spokes) * Math.PI * 2),
    [wheel.spokes]
  );

  useEffect(() => {
    if (!group.current) return;
    gsap.fromTo(
      group.current.scale,
      { x: 0.82, y: 0.82, z: 0.82 },
      { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(2.4)' }
    );
  }, [wheel.id]);

  const r = wheel.radius;

  return (
    <group ref={group} position={position} rotation={[0, 0, Math.PI / 2]}>
      {/* Tyre  */}
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
  <torusGeometry args={[r, 0.12, 24, 48]} />
  <meshStandardMaterial color="#000000" roughness={0.9} />
</mesh>
      {/* Tyre sidewall / inner */}
      <mesh>
        <cylinderGeometry args={[r, r, 0.24, 40]} />
        <meshStandardMaterial color="#dfcfcf" roughness={0.95} />
      </mesh>
      {/* Brake rotor */}
      <mesh>
        <cylinderGeometry args={[r * 0.7, r * 0.78, 0.05, 32]} />
        <meshStandardMaterial color="#ff0000" metalness={0.9} roughness={0.4} />
      </mesh>
      {/* Brake caliper (colour accent) */}
      <mesh position={[0.06, r * 0.42, 0]}>
        <boxGeometry args={[0.12, r * 0.34, 0.14]} />
        <meshStandardMaterial color="#e9d205" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Rim barrel */}
      <mesh>
        <cylinderGeometry args={[r * 0.96, r * 0.96, 0.2, 40]} />
        <meshStandardMaterial color="#f000f0" metalness={0.95} roughness={0.22} />
      </mesh>
      {/* Spokes */}
      {spokeAngles.map((a, i) => (
        <mesh key={i} rotation={[0, a, 0]}>
          <boxGeometry args={[r * 0.14, 0.18, r * 1.42]} />
          <meshStandardMaterial color="#e91728" metalness={0.95} roughness={0.18} />
        </mesh>
      ))}
      {/* Hub cap */}
      <mesh>
        <cylinderGeometry args={[r * .26, r * 0.26, 0.36, 24]} />
        <meshStandardMaterial color="#2daf5f" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}
