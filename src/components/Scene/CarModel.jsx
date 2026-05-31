import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import Wheel from './Wheel.jsx';
import { useConfigurator } from '../../store/useConfigurator.js';
import { PAINTS, WHEELS, TRIMS } from '../../data/carConfig.js';

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

function useExtruded(points, width, bevel = 0.06) {
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

// LOWER body only — stops at the beltline (~y0.85) so the cabin is open for glass.
const BODY_PROFILE = [
  [2.30, 0.28], [2.44, 0.50], [2.42, 0.72], [1.55, 0.80], [1.05, 0.84],
  [-1.45, 0.86], [-1.95, 0.84], [-2.42, 0.74], [-2.40, 0.44], [-2.30, 0.28],
];
// Glass canopy (windshield -> roof -> rear glass), sits ON TOP of the beltline.
const GLASS_PROFILE = [
  [1.0, 0.85], [0.5, 1.18], [-0.65, 1.20], [-1.40, 0.86],
];
// Thin roof panel along the top of the canopy.
const ROOF_PROFILE = [
  [0.5, 1.18], [-0.65, 1.20], [-0.65, 1.13], [0.5, 1.11],
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

  const bodyWidth = 1.78;
  const glassWidth = 1.7;
  const roofWidth = 1.66;
  const bodyGeo = useExtruded(BODY_PROFILE, bodyWidth, 0.1);
  const glassGeo = useExtruded(GLASS_PROFILE, glassWidth, 0.02);
  const roofGeo = useExtruded(ROOF_PROFILE, roofWidth, 0.02);

  useEffect(() => {
    if (!group.current) return;
    gsap.fromTo(group.current.position, { y: -1.2 }, { y: 0, duration: 1.1, ease: 'power3.out' });
  }, []);
  useFrame((state) => {
    if (!group.current) return;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.01;
  });

  const halfTrack = 0.92;
  const axleFront = 1.5;
  const axleRear = -1.55;
  const wheelY = wheel.radius + 0.12;
  const sideZ = bodyWidth / 2;
  const roofColor = hasCarbonRoof ? '#15161a' : paint.hex;
  const bodyColor = paint.hex;

  // A- and C-pillar transforms (frame the side windows).
  const pillars = [
    { pos: [0.75, 1.015, 0], rot: 0.986, len: 0.6 },   // A-pillar
    { pos: [-1.025, 1.03, 0], rot: -1.146, len: 0.82 }, // C-pillar
  ];

  return (
    <group rotation={[0, THREE.MathUtils.degToRad(HEADING_DEG), 0]}>
      <group ref={group}>
        {/* ---- Lower bodywork (paint) ---- */}
        <mesh geometry={bodyGeo} castShadow receiveShadow>
          <meshPhysicalMaterial color={bodyColor} {...matProps} />
        </mesh>

        {/* Interior tub (visible through the glass) reflects the trim */}
        <mesh position={[-0.25, 0.68, 0]}>
          <boxGeometry args={[1.9, 0.34, 1.5]} />
          <meshStandardMaterial color={trim.accent} roughness={0.8} />
        </mesh>
        {/* Seats */}
        {[0.1, -0.5].map((x) => (
          <mesh key={`seat-${x}`} position={[x, 0.82, 0]}>
            <boxGeometry args={[0.3, 0.32, 1.0]} />
            <meshStandardMaterial color={trim.accent} roughness={0.85} />
          </mesh>
        ))}

        {/* ---- Glass canopy (now visible) ---- */}
        <mesh geometry={glassGeo}>
          <meshPhysicalMaterial
            color="#0b0f14" metalness={0.1} roughness={0.04}
            transmission={0.92} transparent opacity={0.55}
          />
        </mesh>
        {/* Roof panel */}
        <mesh geometry={roofGeo}>
          <meshPhysicalMaterial color={roofColor} {...(hasCarbonRoof ? { metalness: 0.5, roughness: 0.35, clearcoat: 0.8 } : matProps)} />
        </mesh>
        {/* A/C pillars, both sides */}
        {pillars.map((p, i) =>
          [glassWidth / 2, -glassWidth / 2].map((z) => (
            <mesh key={`pillar-${i}-${z}`} position={[p.pos[0], p.pos[1], z]} rotation={[0, 0, p.rot]}>
              <boxGeometry args={[0.06, p.len, 0.06]} />
              <meshPhysicalMaterial color={roofColor} {...matProps} />
            </mesh>
          ))
        )}

        {/* ---- Rocker / sill panels ---- */}
        {[sideZ + 0.005, -sideZ - 0.005].map((z) => (
          <mesh key={`sill-${z}`} position={[0, 0.32, z]}>
            <boxGeometry args={[3.7, 0.14, 0.06]} />
            <meshStandardMaterial color="#0c0c0e" roughness={0.7} />
          </mesh>
        ))}

        {/* ---- Door shut lines + handles (both sides) ---- */}
        {[sideZ + 0.002, -sideZ - 0.002].map((z) =>
          [0.95, -0.2, -1.2].map((x) => (
            <mesh key={`door-${x}-${z}`} position={[x, 0.6, z]}>
              <boxGeometry args={[0.015, 0.5, 0.02]} />
              <meshStandardMaterial color="#0a0a0c" roughness={0.6} />
            </mesh>
          ))
        )}
        {[sideZ + 0.015, -sideZ - 0.015].map((z) =>
          [0.45, -0.75].map((x) => (
            <mesh key={`handle-${x}-${z}`} position={[x, 0.78, z]}>
              <boxGeometry args={[0.14, 0.04, 0.03]} />
              <meshStandardMaterial color="#1a1a1d" metalness={0.6} roughness={0.4} />
            </mesh>
          ))
        )}

        {/* ---- Fender arches ---- */}
        {[axleFront, axleRear].map((axleX) =>
          [sideZ + 0.01, -sideZ - 0.01].map((z) => (
            <mesh key={`arch-${axleX}-${z}`} position={[axleX, wheelY, z]}>
              <torusGeometry args={[wheel.radius + 0.14, 0.07, 12, 28, Math.PI]} />
              <meshStandardMaterial color="#0c0c0e" roughness={0.85} />
            </mesh>
          ))
        )}

        {/* ---- Front: kidney grille + lower intake ---- */}
        {[0.18, -0.18].map((z) => (
          <mesh key={`grille-${z}`} position={[2.44, 0.56, z]}>
            <boxGeometry args={[0.06, 0.3, 0.26]} />
            <meshStandardMaterial color="#101012" metalness={0.6} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[2.42, 0.4, 0]}>
          <boxGeometry args={[0.08, 0.14, 1.4]} />
          <meshStandardMaterial color="#08080a" roughness={0.7} />
        </mesh>

        {/* ---- Headlights (proud of the nose) ---- */}
        {[0.62, -0.62].map((z) => (
          <group key={`hl-${z}`} position={[2.44, 0.62, z]}>
            <mesh>
              <boxGeometry args={[0.1, 0.14, 0.42]} />
              <meshStandardMaterial color="#15161a" roughness={0.4} />
            </mesh>
            <mesh position={[0.055, 0, 0]}>
              <boxGeometry args={[0.04, 0.1, 0.36]} />
              <meshStandardMaterial color="#dff1ff" emissive="#cfe6ff" emissiveIntensity={2.0} toneMapped={false} />
            </mesh>
          </group>
        ))}

        {/* ---- Rear: tail-light bar + units (proud of the tail) ---- */}
        <mesh position={[-2.43, 0.64, 0]}>
          <boxGeometry args={[0.05, 0.12, 1.42]} />
          <meshStandardMaterial color="#5a0e0e" emissive="#ff1a1a" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
        {[0.6, -0.6].map((z) => (
          <mesh key={`tl-${z}`} position={[-2.45, 0.64, z]}>
            <boxGeometry args={[0.04, 0.14, 0.4]} />
            <meshStandardMaterial color="#ff2b2b" emissive="#ff1010" emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
        ))}

        {/* ---- Exhaust tips ---- */}
        {[0.45, -0.45].map((z) => (
          <mesh key={`exh-${z}`} position={[-2.42, 0.3, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
            <meshStandardMaterial color="#9a9da2" metalness={0.95} roughness={0.3} />
          </mesh>
        ))}

        {/* M Sport rear spoiler (package) */}
        {hasMSport && (
          <mesh position={[-1.95, 1.0, 0]} castShadow>
            <boxGeometry args={[0.4, 0.05, 1.5]} />
            <meshPhysicalMaterial color={roofColor} {...matProps} />
          </mesh>
        )}

        {/* ---- Side mirrors ---- */}
        {[1, -1].map((side) => (
          <group key={`mir-${side}`} position={[0.85, 0.9, side * sideZ]}>
            <mesh position={[0, -0.01, side * 0.05]}>
              <boxGeometry args={[0.07, 0.04, 0.13]} />
              <meshStandardMaterial color="#0c0c0e" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.03, side * 0.15]}>
              <boxGeometry args={[0.2, 0.12, 0.1]} />
              <meshPhysicalMaterial color={bodyColor} {...matProps} />
            </mesh>
          </group>
        ))}

        {/* ---- Wheels ---- */}
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