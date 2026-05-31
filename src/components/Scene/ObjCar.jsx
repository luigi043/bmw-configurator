import { Component, Suspense, useMemo, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
import CarModel from './CarModel.jsx';
import { useConfigurator } from '../../store/useConfigurator.js';
import { PAINTS } from '../../data/carConfig.js';

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

function ObjCarInner() {
  const root = useLoader(OBJLoader, OBJ_URL);
  const paintId = useConfigurator((s) => s.paintId);
  const paint = PAINTS.find((p) => p.id === paintId);

  // Clone once, then compute fit transform (center on ground + uniform scale).
  const { model, fit } = useMemo(() => {
    const m = root.clone(true);

    // Identify the body = largest mesh by bounding-box volume; the rest
    // (wheels/details) get a dark material. Robust to object naming.
    let biggest = null;
    let biggestVol = -1;
    m.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.computeBoundingBox();
      const s = new THREE.Vector3();
      o.geometry.boundingBox.getSize(s);
      const vol = s.x * s.y * s.z;
      if (vol > biggestVol) { biggestVol = vol; biggest = o; }
    });
    m.traverse((o) => { if (o.isMesh) o.userData.isBody = o === biggest; });

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
    return { model: m, fit };
  }, [root]);

  // Apply materials whenever the paint selection changes.
  useEffect(() => {
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      o.material = o.userData.isBody
        ? new THREE.MeshPhysicalMaterial({ color: paint.hex, clearcoat: 0.8, clearcoatRoughness: 0.1, ...paintMatProps(paint) })
        : new THREE.MeshStandardMaterial({ color: '#15161a', metalness: 0.8, roughness: 0.35 });
    });
  }, [model, paint]);

  return (
    <group scale={fit.scale} position={fit.position}>
      <primitive object={model} />
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
