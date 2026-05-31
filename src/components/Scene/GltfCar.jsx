import { Component, Suspense, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import CarModel from './CarModel.jsx';
import { useConfigurator } from '../../store/useConfigurator.js';
import { PAINTS } from '../../data/carConfig.js';

/**
 * Drop a real car here:
 *   1. Convert any LICENSED model to glTF/GLB (Blender + Sollumz, or gltf-transform).
 *   2. Save it as  public/models/car.glb
 *   3. In CarScene.jsx, render <GltfCar /> instead of <CarModel />.
 *
 * If the file is missing or fails to load, this component automatically
 * falls back to the procedural sedan — the app never hard-crashes.
 *
 * NOTE: live paint recolouring only works if the model's paint mesh/material
 * is named. Set PAINT_MATERIAL_NAME to match your model (inspect it with
 * `npx @gltf-transform/cli inspect car.glb`).
 */
const MODEL_URL = '/models/car.glb';
const PAINT_MATERIAL_NAME = 'CarPaint';

function GltfCarInner() {
  const { scene } = useGLTF(MODEL_URL);
  const paintId = useConfigurator((s) => s.paintId);
  const paint = PAINTS.find((p) => p.id === paintId);

  // Clone so HMR / multiple mounts don't mutate the cached original.
  const model = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      if (o.material?.name === PAINT_MATERIAL_NAME) {
        o.material = o.material.clone();
        o.material.color = new THREE.Color(paint.hex);
        o.material.metalness = paint.finish === 'metallic' ? 0.9 : paint.finish === 'matte' ? 0.1 : 0.5;
        o.material.roughness = paint.finish === 'matte' ? 0.8 : paint.finish === 'metallic' ? 0.26 : 0.14;
        o.material.needsUpdate = true;
      }
    });
  }, [model, paint]);

  return <primitive object={model} />;
}

// Catches a failed glTF load and renders the procedural car instead.
class ModelBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    // eslint-disable-next-line no-console
    console.warn(`[GltfCar] "${MODEL_URL}" not loaded — using procedural model.`, err?.message);
  }
  render() {
    if (this.state.failed) return <CarModel />;
    return this.props.children;
  }
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
