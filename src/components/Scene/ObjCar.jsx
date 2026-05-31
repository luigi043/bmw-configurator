import { Component, Suspense, useMemo, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
import CarModel from './CarModel.jsx';
import Wheel from './Wheel.jsx';
import { useConfigurator } from '../../store/useConfigurator.js';
import { PAINTS, WHEELS, TRIMS } from '../../data/carConfig.js';

// Bundled low-poly car (OBJ). No UVs, so we ignore the source textures and
// apply our own PBR materials — which is what lets paint colour change live.
const OBJ_URL = '/models/car1/car1.obj';
const TARGET_LENGTH = 4.6; // metres along the longest axis after scaling

function paintMatProps(paint) {
  switch (paint.finish) {
    case 'metallic': return { metalness: 0.9, roughness: 0.28 };
    case 'matte':    return { metalness: 0.1, roughness: 0.8 };
    default:         return { metalness: 0.5, roughness: 0.16 }; // gloss
  }
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

function ObjCarInner() {
  const root = useLoader(OBJLoader, OBJ_URL);
  const paintId = useConfigurator((s) => s.paintId);
  const wheelId = useConfigurator((s) => s.wheelId);
  const trimId = useConfigurator((s) => s.trimId);
  const packageIds = useConfigurator((s) => s.packageIds);

  const paint = PAINTS.find((p) => p.id === paintId) ?? PAINTS[0];
  const wheel = WHEELS.find((w) => w.id === wheelId) ?? WHEELS[0];
  const trim = TRIMS.find((t) => t.id === trimId) ?? TRIMS[0];

  const hasCarbonRoof = packageIds.includes('carbon-roof');
  const hasMSport = packageIds.includes('m-sport');

  const matProps = useMemo(() => paintMatProps(paint), [paint]);

  // Extrude shape for the carbon roof package
  const glassWidth = 1.64;
  const glassGeo = useGlassGeometry(glassWidth);

  // Clone once, then compute fit transform (center on ground + uniform scale).
  const { model, fit, wheelPositions } = useMemo(() => {
    const m = root.clone(true);

    // Identify the body = largest mesh by bounding-box volume; the rest
    // (wheels/details) get a dark material. Robust to object naming.
    let biggest = null;
    let biggestVol = -1;
    let cylinderMesh = null;
    m.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.computeBoundingBox();
      const s = new THREE.Vector3();
      o.geometry.boundingBox.getSize(s);
      const vol = s.x * s.y * s.z;
      if (vol > biggestVol) {
        biggestVol = vol;
        biggest = o;
      }
      if (o.name.toLowerCase().includes('cylinder')) {
        cylinderMesh = o;
      }
    });

    m.traverse((o) => {
      if (o.isMesh) {
        o.userData.isBody = o === biggest;
      }
    });

    // Fit: center X/Z, drop onto y=0, scale longest axis to TARGET_LENGTH.
    const box = new THREE.Box3().setFromObject(m);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    const scale = TARGET_LENGTH / Math.max(size.x, size.y, size.z);
    const fit = {
      scale,
      position: [
        -center.x * scale,
        -box.min.y * scale, // sit on the ground
        -center.z * scale,
      ],
    };

    // Calculate dynamic wheel positions using Cylinder bounding box
    const wheels = [];
    if (cylinderMesh) {
      const localBox = cylinderMesh.geometry.boundingBox;
      const localSize = new THREE.Vector3();
      const localCenter = new THREE.Vector3();
      localBox.getSize(localSize);
      localBox.getCenter(localCenter);

      // Scale to world coords
      const wSize = localSize.clone().multiplyScalar(scale);
      const wCenter = localCenter.clone().multiplyScalar(scale).add(new THREE.Vector3(...fit.position));

      // Calculate radius and wheel width
      const wheelRadius = wSize.y / 2;
      const wheelWidth = 0.26; // standard width of wheel
      const trackHalfWidth = (wSize.z / 2) - (wheelWidth / 2);

      // Axles
      const frontAxleX = wCenter.x + (wSize.x / 2) - wheelRadius;
      const rearAxleX = wCenter.x - (wSize.x / 2) + wheelRadius;
      const wheelY = wheelRadius;

      wheels.push(
        { corner: 'fl', position: [frontAxleX, wheelY, trackHalfWidth] },
        { corner: 'fr', position: [frontAxleX, wheelY, -trackHalfWidth] },
        { corner: 'rl', position: [rearAxleX, wheelY, trackHalfWidth] },
        { corner: 'rr', position: [rearAxleX, wheelY, -trackHalfWidth] }
      );
    } else {
      // Fallback wheel coordinates matching car1 model
      wheels.push(
        { corner: 'fl', position: [1.42, 0.35, 0.90] },
        { corner: 'fr', position: [1.42, 0.35, -0.90] },
        { corner: 'rl', position: [-1.45, 0.35, 0.90] },
        { corner: 'rr', position: [-1.45, 0.35, -0.90] }
      );
    }

    return { model: m, fit, wheelPositions: wheels };
  }, [root]);

  // Apply materials whenever the paint selection changes.
  useEffect(() => {
    model.traverse((o) => {
      if (!o.isMesh) return;
      if (o.name.toLowerCase().includes('cylinder')) {
        o.visible = false;
        return;
      }
      o.castShadow = true;
      o.receiveShadow = true;
      o.material = o.userData.isBody
        ? new THREE.MeshPhysicalMaterial({
            color: paint.hex,
            clearcoat: 0.8,
            clearcoatRoughness: 0.1,
            ...matProps,
          })
        : new THREE.MeshStandardMaterial({
            color: '#15161a',
            metalness: 0.8,
            roughness: 0.35,
          });
    });
  }, [model, paint, matProps]);

  return (
    <group>
      <group scale={fit.scale} position={fit.position}>
        <primitive object={model} />
      </group>

      {/* Render the custom wheels at the detected positions */}
      {wheelPositions.map((wp) => (
        <group
          key={`${wp.corner}-${wheel.id}`}
          position={wp.position}
          rotation={[0, Math.PI / 2, 0]}
        >
          <Wheel wheel={wheel} position={[0, 0, 0]} />
        </group>
      ))}

      {/* M Sport rear spoiler (package) */}
      {hasMSport && (
        <mesh position={[-2.0, 1.0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.05, 1.5]} />
          <meshPhysicalMaterial
            color={hasCarbonRoof ? '#15161a' : paint.hex}
            clearcoat={0.8}
            clearcoatRoughness={0.1}
            {...matProps}
          />
        </mesh>
      )}

      {/* Carbon roof overlay (package) — a thin shell over the greenhouse */}
      {hasCarbonRoof && (
        <mesh geometry={glassGeo} scale={[1, 1, 1.03]} position={[0, 0.06, 0]}>
          <meshPhysicalMaterial
            color="#15161a"
            metalness={0.55}
            roughness={0.32}
            clearcoat={0.8}
          />
        </mesh>
      )}

      {/* Interior accent slab (visible through the glass) reflects the trim */}
      <mesh position={[-0.2, 0.92, 0]}>
        <boxGeometry args={[1.7, 0.28, 1.5]} />
        <meshStandardMaterial color={trim.accent} roughness={0.75} />
      </mesh>
    </group>
  );
}

// Fall back to the procedural car if the OBJ ever fails to load.
class ModelBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) {
    // eslint-disable-next-line no-console
    console.warn(`[ObjCar] "${OBJ_URL}" failed to load — using procedural model.`, err?.message);
  }
  render() { return this.state.failed ? <CarModel /> : this.props.children; }
}

export default function ObjCar() {
  return (
    <ModelBoundary>
      <Suspense fallback={<CarModel />}>
        <ObjCarInner />
      </Suspense>
    </ModelBoundary>
  );
}
