import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import Wheel from './Wheel.jsx';
import { useConfigurator } from '../../store/useConfigurator.js';
import { PAINTS, WHEELS, TRIMS } from '../../data/carConfig.js';

/*
 * Orientation (matches the requested layout):
 *   - The car is modelled in a LOCAL frame where length runs along +X (front)
 *     / -X (rear) and width along ±Z.
 *   - The whole car is then rotated -90° about Y, so in WORLD space:
 *       front -> +Z, rear -> -Z, right -> +X, left -> -X, up -> +Y.
 *   - It is centred at the origin and sits on the ground (y = 0).
 * Change HEADING_DEG to spin the car to any facing in one place.
 */
const HEADING_DEG = -90;

const find = (list, id) => list.find((x) => x.id === id);

function paintMaterialProps(paint) {
  switch (paint.finish) {
    case 'metallic': return { metalness: 0.9, roughness: 0.26, clearcoat: 0.7, clearcoatRoughness: 0.18 };
    case 'matte':    return { metalness: 0.1, roughness: 0.8, clearcoat: 0.05, clearcoatRoughness: 0.6 };
    case 'gloss':
    default:         return { metalness: 0.5, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05 };
  }
}

// Extrude a (length, height) side profile across the car's width.
function useExtruded(points, width, bevel = 0.08) {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) s.lineTo(points[i][0], points[i][1]);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: width, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
      bevelSegments: 4, curveSegments: 24,
    });
    geo.translate(0, 0, -width / 2);
    geo.computeVertexNormals();
    return geo;
  }, [points, width, bevel]);
}

// Sleek sedan side profile (x = length, y = height).
const BODY_PROFILE = [
  [-2.30, 0.30], [2.30, 0.30], [2.42, 0.54], [2.40, 0.76], [1.55, 0.86],
  [1.05, 0.90], [0.55, 1.28], [-0.55, 1.32], [-1.35, 1.10], [-1.95, 0.98],
  [-2.40, 0.80], [-2.38, 0.48],
];
// Greenhouse / glass profile (slightly inset).
const GLASS_PROFILE = [
  [0.95, 0.96], [0.55, 1.24], [-0.55, 1.28], [-1.30, 1.07], [-1.30, 0.96],
];

export default function CarModel() {
  const group = useRef();
  const paintId = useConfigurator((s) => s.paintId);
  const wheelId = useConfigurator((s) => s.wheelId);
  const trimId = useConfigurator((s) => s.trimId);
  const packageIds = useConfigurator((s) => s.packageIds);

  const paint = find(PAINTS, paintId);
  const wheel = find(WHEELS, wheelId);
  const trim = find(TRIMS, trimId);

  const matProps = useMemo(() => paintMaterialProps(paint), [paint]);
  const hasCarbonRoof = packageIds.includes('carbon-roof');
  const hasMSport = packageIds.includes('m-sport');

  const bodyWidth = 1.86;
  const glassWidth = 1.7;
  const bodyGeo = useExtruded(BODY_PROFILE, bodyWidth, 0.1);
  const glassGeo = useExtruded(GLASS_PROFILE, glassWidth, 0.03);

  useEffect(() => {
    if (!group.current) return;
    gsap.fromTo(group.current.position, { y: -1.2 }, { y: 0, duration: 1.1, ease: 'power3.out' });
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.01;
  });

  // Wheel layout (local frame): axle along X positions = front/rear,
  // ±halfTrack along Z = left/right. wheelY keeps the tyre on the ground.
  const halfTrack = 0.96;
  const axleFront = 1.5;
  const axleRear = -1.55;
  const wheelY = wheel.radius + 0.12;

  const lensWhite = '#dff1ff';
  const bodyColor = paint.hex;

  return (
    <group rotation={[0, THREE.MathUtils.degToRad(HEADING_DEG), 0]}>
      <group ref={group}>
        {/* ---- Bodywork ---- */}
        <mesh geometry={bodyGeo} castShadow receiveShadow>
          <meshPhysicalMaterial color={bodyColor} {...matProps} />
        </mesh>

        {/* Rocker / sill panels (dark) down each side */}
        {[bodyWidth / 2 + 0.005, -bodyWidth / 2 - 0.005].map((z) => (
          <mesh key={`sill-${z}`} position={[0, 0.34, z]}>
            <boxGeometry args={[3.7, 0.14, 0.06]} />
            <meshStandardMaterial color="#0c0c0e" roughness={0.7} />
          </mesh>
        ))}

        {/* Carbon roof shell (package) */}
        {hasCarbonRoof && (
          <mesh geometry={glassGeo} scale={[1, 1, 1.04]} position={[0, 0.08, 0]}>
            <meshPhysicalMaterial color="#15161a" metalness={0.55} roughness={0.32} clearcoat={0.8} />
          </mesh>
        )}

        {/* ---- Greenhouse glass ---- */}
        <mesh geometry={glassGeo}>
          <meshPhysicalMaterial
            color="#0b0f14" metalness={0.1} roughness={0.04}
            transmission={0.9} transparent opacity={0.62}
          />
        </mesh>
        {/* Interior accent (visible through glass) reflects the trim */}
        <mesh position={[-0.2, 0.92, 0]}>
          <boxGeometry args={[2.0, 0.3, 1.5]} />
          <meshStandardMaterial color={trim.accent} roughness={0.75} />
        </mesh>

        {/* ---- Fender arches ---- */}
        {[axleFront, axleRear].map((axleX) =>
          [bodyWidth / 2 + 0.01, -bodyWidth / 2 - 0.01].map((z) => (
            <mesh key={`arch-${axleX}-${z}`} position={[axleX, wheelY, z]}>
              <torusGeometry args={[wheel.radius + 0.14, 0.07, 12, 28, Math.PI]} />
              <meshStandardMaterial color="#0c0c0e" roughness={0.85} />
            </mesh>
          ))
        )}

        {/* ---- Front: kidney grille + intakes ---- */}
        {[0.2, -0.2].map((z) => (
          <mesh key={`grille-${z}`} position={[2.42, 0.6, z]}>
            <boxGeometry args={[0.08, 0.34, 0.3]} />
            <meshStandardMaterial color="#101012" metalness={0.6} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[2.4, 0.4, 0]}>
          <boxGeometry args={[0.1, 0.14, 1.5]} />
          <meshStandardMaterial color="#08080a" roughness={0.7} />
        </mesh>

        {/* Headlights: housing + emissive lens */}
        {[0.66, -0.66].map((z) => (
          <group key={`hl-${z}`} position={[2.4, 0.78, z]}>
            <mesh>
              <boxGeometry args={[0.1, 0.16, 0.46]} />
              <meshStandardMaterial color="#15161a" roughness={0.4} />
            </mesh>
            <mesh position={[0.04, 0, 0]}>
              <boxGeometry args={[0.05, 0.1, 0.4]} />
              <meshStandardMaterial color={lensWhite} emissive="#cfe6ff" emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
          </group>
        ))}

        {/* ---- Rear: tail-light bar ---- */}
        <mesh position={[-2.4, 0.84, 0]}>
          <boxGeometry args={[0.06, 0.12, 1.5]} />
          <meshStandardMaterial color="#5a0e0e" emissive="#ff1a1a" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        {[0.62, -0.62].map((z) => (
          <mesh key={`tl-${z}`} position={[-2.42, 0.84, z]}>
            <boxGeometry args={[0.05, 0.14, 0.4]} />
            <meshStandardMaterial color="#ff2b2b" emissive="#ff1010" emissiveIntensity={2.0} toneMapped={false} />
          </mesh>
        ))}

        {/* M Sport rear spoiler (package) */}
        {hasMSport && (
          <mesh position={[-2.0, 1.04, 0]} castShadow>
            <boxGeometry args={[0.4, 0.05, 1.6]} />
            <meshPhysicalMaterial color={hasCarbonRoof ? '#15161a' : bodyColor} {...matProps} />
          </mesh>
        )}

        {/* ---- Side mirrors ---- */}
        {[0.98, -0.98].map((z) => (
          <group key={`mir-${z}`} position={[0.95, 0.98, z]}>
            <mesh>
              <boxGeometry args={[0.18, 0.1, 0.1]} />
              <meshPhysicalMaterial color={bodyColor} {...matProps} />
            </mesh>
          </group>
        ))}

        {/* ---- Wheels (synced; keyed for the swap pop) ---- */}
        {[
          ['fl', axleFront, halfTrack],
          ['fr', axleFront, -halfTrack],
          ['rl', axleRear, halfTrack],
          ['rr', axleRear, -halfTrack],
        ].map(([corner, axleX, z]) => (
          <group key={`${corner}-${wheel.id}`} position={[axleX, wheelY, z]} rotation={[0, Math.PI / 2, 0]}>
            <Wheel wheel={wheel} position={[0, 0, 0]} />
          </group>
        ))}
      </group>
    </group>
  );
}
