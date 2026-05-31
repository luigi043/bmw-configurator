import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import Wheel from './Wheel.jsx';
import { useConfigurator } from '../../store/useConfigurator.js';
import { PAINTS, WHEELS, TRIMS } from '../../data/carConfig.js';

const find = (list, id) => list.find((x) => x.id === id);

// Map a paint finish to physically-based material params.
function paintMaterialProps(paint) {
  switch (paint.finish) {
    case 'metallic':
      return { metalness: 0.9, roughness: 0.26, clearcoat: 0.7, clearcoatRoughness: 0.18 };
    case 'matte':
      return { metalness: 0.1, roughness: 0.8, clearcoat: 0.05, clearcoatRoughness: 0.6 };
    case 'gloss':
    default:
      return { metalness: 0.5, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05 };
  }
}

// Build a 2D side-profile of a sport sedan and extrude it across the car's
// width. Bevelling rounds every edge so it reads as sculpted bodywork rather
// than a flat slab. Coordinates: X = length, Y = height, extrude along Z = width.
function useBodyGeometry(width) {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-2.30, 0.22);   // rear, bottom
    s.lineTo(2.30, 0.22);    // front, bottom (sill line)
    s.lineTo(2.46, 0.48);    // front bumper
    s.lineTo(2.44, 0.70);    // nose top
    s.lineTo(1.65, 0.80);    // hood
    s.lineTo(1.15, 0.84);    // cowl / base of windshield
    s.quadraticCurveTo(0.85, 1.30, 0.30, 1.40); // raked windshield -> roof front
    s.lineTo(-0.75, 1.42);   // roof
    s.quadraticCurveTo(-1.30, 1.34, -1.55, 1.02); // fastback rear glass
    s.lineTo(-2.05, 0.92);   // trunk lid
    s.lineTo(-2.46, 0.74);   // tail top
    s.lineTo(-2.44, 0.40);   // rear bumper
    s.closePath();

    const geo = new THREE.ExtrudeGeometry(s, {
      depth: width,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.10,
      bevelSegments: 5,
      curveSegments: 32,
    });
    geo.translate(0, 0, -width / 2); // centre across Z
    geo.computeVertexNormals();
    return geo;
  }, [width]);
}

// A slightly smaller, inset greenhouse profile for the tinted glass.
function useGlassGeometry(width) {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(1.05, 0.92);
    s.quadraticCurveTo(0.82, 1.26, 0.32, 1.33);
    s.lineTo(-0.72, 1.35);
    s.quadraticCurveTo(-1.22, 1.27, -1.45, 1.02);
    s.lineTo(-1.45, 0.92);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: width,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2,
      curveSegments: 24,
    });
    geo.translate(0, 0, -width / 2);
    geo.computeVertexNormals();
    return geo;
  }, [width]);
}

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
  const glassWidth = 1.64;
  const bodyGeo = useBodyGeometry(bodyWidth);
  const glassGeo = useGlassGeometry(glassWidth);

  // Entrance animation.
  useEffect(() => {
    if (!group.current) return;
    gsap.fromTo(group.current.position, { y: -1.2 }, { y: 0, duration: 1.1, ease: 'power3.out' });
  }, []);

  // Subtle idle motion.
  useFrame((state) => {
    if (!group.current) return;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.01;
  });

  const wheelY = 0.36;
  const wheelX = 0.92;     // track half-width
  const wheelZf = 1.45;    // front axle
  const wheelZr = -1.5;    // rear axle

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Bodywork */}
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        <meshPhysicalMaterial color={paint.hex} {...matProps} />
      </mesh>

      {/* Carbon roof overlay (package) — a thin shell over the greenhouse */}
      {hasCarbonRoof && (
        <mesh geometry={glassGeo} scale={[1, 1, 1.03]} position={[0, 0.06, 0]}>
          <meshPhysicalMaterial color="#15161a" metalness={0.55} roughness={0.32} clearcoat={0.8} />
        </mesh>
      )}

      {/* Tinted greenhouse glass */}
      <mesh geometry={glassGeo}>
        <meshPhysicalMaterial
          color="#0c1116"
          metalness={0.1}
          roughness={0.04}
          transmission={0.9}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Interior accent slab (visible through the glass) reflects the trim */}
      <mesh position={[-0.2, 0.92, 0]}>
        <boxGeometry args={[1.7, 0.28, 1.5]} />
        <meshStandardMaterial color={trim.accent} roughness={0.75} />
      </mesh>

      {/* Wheel arch trims (dark plastic) front + rear, both sides.
          A half-torus in the X-Y plane reads as a fender arch from the side. */}
      {[wheelZf, wheelZr].map((axleX) =>
        [bodyWidth / 2 + 0.01, -bodyWidth / 2 - 0.01].map((sideZ) => (
          <mesh key={`${axleX}-${sideZ}`} position={[axleX, wheelY, sideZ]}>
            <torusGeometry args={[0.5, 0.06, 12, 28, Math.PI]} />
            <meshStandardMaterial color="#0c0c0e" roughness={0.85} />
          </mesh>
        ))
      )}

      {/* Side mirrors */}
      {[0.62, -0.62].map((zx) => (
        <mesh key={zx} position={[1.0, 1.0, zx]} castShadow>
          <boxGeometry args={[0.16, 0.1, 0.22]} />
          <meshPhysicalMaterial color={paint.hex} {...matProps} />
        </mesh>
      ))}

      {/* Front grille / lower intake */}
      <mesh position={[2.40, 0.52, 0]}>
        <boxGeometry args={[0.12, 0.28, 1.1]} />
        <meshStandardMaterial color="#0a0a0c" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* M Sport rear spoiler (package) */}
      {hasMSport && (
        <mesh position={[-2.0, 1.0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.05, 1.5]} />
          <meshPhysicalMaterial color={hasCarbonRoof ? '#15161a' : paint.hex} {...matProps} />
        </mesh>
      )}

      {/* Headlights */}
      {[0.6, -0.6].map((z) => (
        <mesh key={`hl-${z}`} position={[2.42, 0.74, z]}>
          <boxGeometry args={[0.06, 0.12, 0.42]} />
          <meshStandardMaterial color="#dff1ff" emissive="#bfe0ff" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      ))}
      {/* Tail lights */}
      {[0.62, -0.62].map((z) => (
        <mesh key={`tl-${z}`} position={[-2.44, 0.82, z]}>
          <boxGeometry args={[0.06, 0.12, 0.46]} />
          <meshStandardMaterial color="#ff2b2b" emissive="#ff1a1a" emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
      ))}

      {/* Wheels — keyed by id so a swap remounts with the pop animation.
          The Wheel mesh spins about its local X; rotating the wrapper 90°
          about Y points the axle along Z (the car's left-right track). */}
      {[
        ['fl', wheelZf, wheelX],
        ['fr', wheelZf, -wheelX],
        ['rl', wheelZr, wheelX],
        ['rr', wheelZr, -wheelX],
      ].map(([corner, axleX, sideZ]) => (
        <group key={`${corner}-${wheel.id}`} position={[axleX, wheelY, sideZ]} rotation={[0, Math.PI / 2, 0]}>
          <Wheel wheel={wheel} position={[0, 0, 0]} />
        </group>
      ))}
    </group>
  );
}
