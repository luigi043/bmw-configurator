import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

import Wheel from './Wheel.jsx';
import { useConfigurator } from '../../store/useConfigurator.js';
import { PAINTS, WHEELS, TRIMS } from '../../data/carConfig.js';

const getById = (list, id, fallbackIndex = 0) =>
  list.find((item) => item.id === id) ?? list[fallbackIndex];

function getPaintMaterialProps(finish) {
  const presets = {
    metallic: {
      metalness: 0.9,
      roughness: 0.26,
      clearcoat: 0.7,
      clearcoatRoughness: 0.18,
    },
    matte: {
      metalness: 0.1,
      roughness: 0.8,
      clearcoat: 0.05,
      clearcoatRoughness: 0.6,
    },
    gloss: {
      metalness: 0.5,
      roughness: 0.14,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    },
  };

  return presets[finish] ?? presets.gloss;
}

function useBodyGeometry(width) {
  return useMemo(() => {
    const shape = new THREE.Shape();

    shape.moveTo(-2.3, 0.22);
    shape.lineTo(2.3, 0.22);
    shape.lineTo(2.46, 0.48);
    shape.lineTo(2.44, 0.7);
    shape.lineTo(1.65, 0.8);
    shape.lineTo(1.15, 0.84);
    shape.quadraticCurveTo(0.85, 1.3, 0.3, 1.4);
    shape.lineTo(-0.75, 1.42);
    shape.quadraticCurveTo(-1.3, 1.34, -1.55, 1.02);
    shape.lineTo(-2.05, 0.92);
    shape.lineTo(-2.46, 0.74);
    shape.lineTo(-2.44, 0.4);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: width,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.1,
      bevelSegments: 5,
      curveSegments: 32,
    });

    geometry.translate(0, 0, -width / 2);
    geometry.computeVertexNormals();

    return geometry;
  }, [width]);
}

function useGlassGeometry(width) {
  return useMemo(() => {
    const shape = new THREE.Shape();

    shape.moveTo(1.05, 0.92);
    shape.quadraticCurveTo(0.82, 1.26, 0.32, 1.33);
    shape.lineTo(-0.72, 1.35);
    shape.quadraticCurveTo(-1.22, 1.27, -1.45, 1.02);
    shape.lineTo(-1.45, 0.92);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: width,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2,
      curveSegments: 24,
    });

    geometry.translate(0, 0, -width / 2);
    geometry.computeVertexNormals();

    return geometry;
  }, [width]);
}

export default function CarModel() {
  const groupRef = useRef();

  const paintId = useConfigurator((state) => state.paintId);
  const wheelId = useConfigurator((state) => state.wheelId);
  const trimId = useConfigurator((state) => state.trimId);
  const packageIds = useConfigurator((state) => state.packageIds);

  const paint = getById(PAINTS, paintId);
  const wheel = getById(WHEELS, wheelId);
  const trim = getById(TRIMS, trimId);

  const bodyWidth = 1.78;
  const glassWidth = 1.64;

  const bodyGeometry = useBodyGeometry(bodyWidth);
  const glassGeometry = useGlassGeometry(glassWidth);

  const paintMaterial = useMemo(
    () => getPaintMaterialProps(paint.finish),
    [paint.finish]
  );

  const hasCarbonRoof = packageIds.includes('carbon-roof');
  const hasMSport = packageIds.includes('m-sport');

  const wheelY = 0.36;
  const trackHalfWidth = 0.92;
  const frontAxleX = 1.45;
  const rearAxleX = -1.5;

  const wheelPositions = [
    ['front-left', frontAxleX, trackHalfWidth],
    ['front-right', frontAxleX, -trackHalfWidth],
    ['rear-left', rearAxleX, trackHalfWidth],
    ['rear-right', rearAxleX, -trackHalfWidth],
  ];

  useEffect(() => {
    if (!groupRef.current) return;

    gsap.fromTo(
      groupRef.current.position,
      { y: -1.2 },
      {
        y: 0,
        duration: 1.1,
        ease: 'power3.out',
      }
    );
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.8) * 0.01;
  });

  return (
    <group ref={groupRef}>
      {/* Main body */}
      <mesh geometry={bodyGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial color={paint.hex} {...paintMaterial} />
      </mesh>

      {/* Carbon roof package */}
      {hasCarbonRoof && (
        <mesh
          geometry={glassGeometry}
          scale={[1, 1, 1.03]}
          position={[0, 0.06, 0]}
        >
          <meshPhysicalMaterial
            color="#15161a"
            metalness={0.55}
            roughness={0.32}
            clearcoat={0.8}
          />
        </mesh>
      )}

      {/* Glass */}
      <mesh geometry={glassGeometry}>
        <meshPhysicalMaterial
          color="#0c1116"
          metalness={0.1}
          roughness={0.04}
          transmission={0.9}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Interior accent */}
      <mesh position={[-0.2, 0.92, 0]}>
        <boxGeometry args={[1.7, 0.28, 1.5]} />
        <meshStandardMaterial color={trim.accent} roughness={0.75} />
      </mesh>

      {/* Wheel arches */}
      {[frontAxleX, rearAxleX].map((axleX) =>
        [bodyWidth / 2 + 0.01, -bodyWidth / 2 - 0.01].map((sideZ) => (
          <mesh key={`arch-${axleX}-${sideZ}`} position={[axleX, wheelY, sideZ]}>
            <torusGeometry args={[0.5, 0.06, 12, 28, Math.PI]} />
            <meshStandardMaterial color="#0c0c0e" roughness={0.85} />
          </mesh>
        ))
      )}

      {/* Side mirrors */}
      {[0.62, -0.62].map((sideZ) => (
        <mesh key={`mirror-${sideZ}`} position={[1, 1, sideZ]} castShadow>
          <boxGeometry args={[0.16, 0.1, 0.22]} />
          <meshPhysicalMaterial color={paint.hex} {...paintMaterial} />
        </mesh>
      ))}

      {/* Front grille */}
      <mesh position={[2.4, 0.52, 0]}>
        <boxGeometry args={[0.12, 0.28, 1.1]} />
        <meshStandardMaterial color="#0a0a0c" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* M Sport spoiler */}
      {hasMSport && (
        <mesh position={[-2, 1, 0]} castShadow>
          <boxGeometry args={[0.42, 0.05, 1.5]} />
          <meshPhysicalMaterial
            color={hasCarbonRoof ? '#15161a' : paint.hex}
            {...paintMaterial}
          />
        </mesh>
      )}

      {/* Headlights */}
      {[0.6, -0.6].map((sideZ) => (
        <mesh key={`headlight-${sideZ}`} position={[2.42, 0.74, sideZ]}>
          <boxGeometry args={[0.06, 0.12, 0.42]} />
          <meshStandardMaterial
            color="#dff1ff"
            emissive="#bfe0ff"
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Tail lights */}
      {[0.62, -0.62].map((sideZ) => (
        <mesh key={`taillight-${sideZ}`} position={[-2.44, 0.82, sideZ]}>
          <boxGeometry args={[0.06, 0.12, 0.46]} />
          <meshStandardMaterial
            color="#ff2b2b"
            emissive="#ff1a1a"
            emissiveIntensity={1.8}
            toneMapped={false}
          />
        </mesh>
      ))}

{/* Wheels */}
{wheelPositions.map(([corner, axleX, sideZ]) => (
  <group
    key={`${corner}-${wheel.id}`}
    position={[axleX, wheelY, sideZ]}
    rotation={[0, Math.PI / 2, 0]} 
  >
    <Wheel wheel={wheel} />
  </group>
))}
    </group>
  );
}