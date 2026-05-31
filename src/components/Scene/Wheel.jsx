import { useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function Wheel({ position, wheel, flip = false }) {
  const group = useRef();
  const f = flip ? -1 : 1;

  const spokeAngles = useMemo(
    () => Array.from({ length: wheel.spokes }, (_, i) => (i / wheel.spokes) * Math.PI * 2),
    [wheel.spokes]
  );

  useEffect(() => {
    if (!group.current) return;
    gsap.fromTo(group.current.scale, { x: 0.82, y: 0.82, z: 0.82 }, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(2.4)' });
  }, [wheel.id]);

  const r = wheel.radius;

  return (
    <group ref={group} position={position} rotation={[0, 0, Math.PI / 2]}>
      {/* Tyre */}
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.12, 24, 48]} />
        <meshStandardMaterial color="#141416" roughness={0.92} />
      </mesh>
      {/* Tyre inner */}
      <mesh>
        <cylinderGeometry args={[r, r, 0.24, 40]} />
        <meshStandardMaterial color="#1d1d1f" roughness={0.95} />
      </mesh>
      {/* Brake rotor */}
      <mesh>
        <cylinderGeometry args={[r * 0.68, r * 0.68, 0.05, 36]} />
        <meshStandardMaterial color="#8a8d92" metalness={0.95} roughness={0.45} />
      </mesh>
      {/* Caliper — straddles the rotor's outer edge (radial), not the axle */}
      <mesh position={[0, 0, r * 0.6]}>
        <boxGeometry args={[0.12, 0.16, r * 0.3]} />
        <meshStandardMaterial color="#1d6fe0" metalness={0.5} roughness={0.45} />
      </mesh>
      {/* Rim outer lip */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r * 0.8, 0.07, 18, 44]} />
        <meshStandardMaterial color="#e2e5e9" metalness={1} roughness={0.12} />
      </mesh>
      {/* Rim dish */}
      <mesh>
        <cylinderGeometry args={[r * 0.78, r * 0.5, 0.28, 44]} />
        <meshStandardMaterial color="#a9adb3" metalness={0.95} roughness={0.28} />
      </mesh>
      {/* Face plate */}
      <mesh position={[0, 0.04 * f, 0]}>
        <cylinderGeometry args={[r * 0.72, r * 0.72, 0.05, 44]} />
        <meshStandardMaterial color="#bcc0c6" metalness={0.95} roughness={0.2} />
      </mesh>
      {/* Spokes */}
      {spokeAngles.map((a, i) => (
        <group key={i} rotation={[0, a, 0]}>
          <mesh position={[0, 0.07 * f, r * 0.45]}>
            <boxGeometry args={[r * 0.1, 0.07, r * 0.62]} />
            <meshStandardMaterial color="#d7dbe0" metalness={1} roughness={0.16} />
          </mesh>
        </group>
      ))}
      {/* Lug nuts */}
      {Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2).map((a, i) => (
        <group key={`lug-${i}`} rotation={[0, a, 0]}>
          <mesh position={[0, 0.1 * f, r * 0.2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.05, 6]} />
            <meshStandardMaterial color="#3a3d42" metalness={0.8} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Hub + emblem */}
      <mesh position={[0, 0.08 * f, 0]}>
        <cylinderGeometry args={[r * 0.2, r * 0.2, 0.1, 28]} />
        <meshStandardMaterial color="#26282c" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.12 * f, 0]}>
        <cylinderGeometry args={[r * 0.1, r * 0.1, 0.06, 24]} />
        <meshStandardMaterial color="#1d6fe0" emissive="#0a3a7a" emissiveIntensity={0.4} metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}