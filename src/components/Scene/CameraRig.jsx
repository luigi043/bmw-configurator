import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js';

/**
 * User-controlled orbit with a cinematic GSAP intro sweep. Auto-rotate idles
 * the camera until the user grabs it. Honors prefers-reduced-motion by
 * skipping the intro animation and disabling auto-rotate.
 */
export default function CameraRig() {
  const controls = useRef();
  const { camera } = useThree();
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      camera.position.set(5.5, 2.4, 6.5);
      camera.lookAt(0, 0.7, 0);
      return;
    }
    // Cinematic fly-in from a wide, low angle.
    gsap.fromTo(
      camera.position,
      { x: 9, y: 1.2, z: 9 },
      {
        x: 5.5, y: 2.4, z: 6.5,
        duration: 1.8,
        ease: 'power3.inOut',
        onUpdate: () => camera.lookAt(0, 0.7, 0),
      }
    );
  }, [camera, reducedMotion]);

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      minDistance={4.5}
      maxDistance={11}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2.05}
      enableDamping
      dampingFactor={0.08}
      autoRotate={!reducedMotion}
      autoRotateSpeed={0.6}
      target={[0, 0.7, 0]}
    />
  );
}
