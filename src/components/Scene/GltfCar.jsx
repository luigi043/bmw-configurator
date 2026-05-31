import { Component, Suspense, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import CarModel from './CarModel.jsx';
import { useConfigurator } from '../../store/useConfigurator.js';
import { PAINTS } from '../../data/carConfig.js';

/**
 * Loads a real .glb car, auto-centres + scales it onto the ground, and falls
 * back to the procedural car if the file is missing.
 *
 * Setup:
 *   1. Download the model as glTF/GLB and save it as  public/models/car.glb
 *   2. CarScene already renders <GltfCar /> (see that file).
 *
 * RECOLOR: an art car (like the XTAON livery) has its own textures, so leave
 * this false to show it as-is. Set true only for a plain model whose paint
 * material you name in PAINT_MATERIAL_NAME.
 */
const MODEL_URL = '/models/car.glb';
const TARGET_LENGTH = 4.6;   // metres along the longest axis after scaling
const ROT_Y_DEG = 0;         // spin the model if it faces the wrong way (try 90/180/-90)
const RECOLOR = false;
const PAINT_MATERIAL_NAME = 'CarPaint';

function GltfCarInner() {
  const { scene } = useGLTF(MODEL_URL);
  const paintId = useConfigurator((s) => s.paintId);
  const paint = PAINTS.find((p) => p.id === paintId);

  // Clone, apply heading, then measure for a center/scale/ground fit.
  const { model, fit } = useMemo(() => {
    const m = scene.clone(true);
    m.rotation.y = THREE.MathUtils.degToRad(ROT_Y_DEG);
    m.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(m);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    const scale = TARGET_LENGTH / Math.max(size.x, size.y, size.z);
    return {
      model: m,
      fit: { scale, position: [-center.x * scale, -box.min.y * scale, -center.z * scale] },
    };
  }, [scene]);

  useEffect(() => {
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      if (RECOLOR && o.material?.name === PAINT_MATERIAL_NAME) {
        o.material = o.material.clone();
        o.material.color = new THREE.Color(paint.hex);
        o.material.metalness = paint.finish === 'metallic' ? 0.9 : paint.finish === 'matte' ? 0.1 : 0.5;
        o.material.roughness = paint.finish === 'matte' ? 0.8 : paint.finish === 'metallic' ? 0.26 : 0.14;
        o.material.needsUpdate = true;
      }
    });
  }, [model, paint]);

  return (
    <group scale={fit.scale} position={fit.position}>
      <primitive object={model} />
    </group>
  );
}

// Renders the procedural car if the .glb fails to load.
class ModelBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) {
    // eslint-disable-next-line no-console
    console.warn(`[GltfCar] "${MODEL_URL}" not loaded — using procedural model.`, err?.message);
  }
  render() { return this.state.failed ? <CarModel /> : this.props.children; }
}

export default function GltfCar() {
  return (
    <ModelBoundary>
      <Suspense fallback={<CarModel />}>
        <GltfCarInner />
      </Suspense>
    </ModelBoundary>
  );
}

useGLTF.preload(MODEL_URL);