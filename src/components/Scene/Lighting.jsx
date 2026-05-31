import { Environment } from '@react-three/drei';

/**
 * Studio-style three-point lighting plus an HDRI environment for realistic
 * reflections on the paint. The environment is what sells a metallic finish.
 */
export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[6, 8, 4]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-6, 4, -4]} intensity={0.8} color="#aab4ff" />
      <spotLight position={[0, 6, 6]} angle={0.5} penumbra={0.8} intensity={1.2} />
      <Environment preset="city" />
    </>
  );
}
