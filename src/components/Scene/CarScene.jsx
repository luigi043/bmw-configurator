import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { useState } from 'react';
import Lighting from './Lighting.jsx';
import Ground from './Ground.jsx';
import CarModel from './CarModel.jsx'; // detailed procedural car (active)
// Alternatives kept in the repo: ObjCar.jsx (uploaded OBJ) and GltfCar.jsx (.glb loader).
import CameraRig from './CameraRig.jsx';
import GltfCar from './GltfCar.jsx';
/**
 * The WebGL root. PerformanceMonitor + AdaptiveDpr automatically drop the
 * pixel ratio on weaker GPUs so the frame rate stays smooth — visuals scale
 * to the device instead of tanking performance.
 */
export default function CarScene() {
  const [dpr, setDpr] = useState(1.5);

  return (
    <div className="scene" data-testid="scene">
      <Canvas
        shadows
        dpr={dpr}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [5.5, 2.4, 6.5], fov: 38 }}
      >
        <PerformanceMonitor
          onIncline={() => setDpr(2)}
          onDecline={() => setDpr(1)}
        />
        <AdaptiveDpr pixelated />
        <color attach="background" args={['#0a0a0c']} />
        <fog attach="fog" args={['#0a0a0c', 14, 26]} />

        <Lighting />
        <CarModel />
        <GltfCar />    
        <Ground />
        <CameraRig />
      </Canvas>
    </div>
  );
}
