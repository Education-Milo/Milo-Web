import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface MiloModelProps {
  modelPath: string;
}

function MiloModel({ modelPath }: MiloModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, group);
  
  useEffect(() => {
    // Jouer toutes les animations disponibles
    if (actions) {
      Object.keys(actions).forEach((key) => {
        const action = actions[key];
        if (action) {
          action.reset();
          action.play();
          // Répéter l'animation en boucle
          action.setLoop(THREE.LoopRepeat, Infinity);
        }
      });
    }
  }, [actions]);

  // Animation de rotation douce
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });
  
  return (
    <group ref={group}>
      <primitive 
        object={scene} 
        scale={[0.8, 0.8, 0.8]} 
        position={[0, -1.3, 0]}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
}

const MiloModel3D: React.FC<MiloModelProps> = ({ modelPath }) => {
  return (
    <div style={{ width: '100%', height: '300px' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          <MiloModel modelPath={modelPath} />
          
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
            autoRotate={false}
          />
          
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default MiloModel3D;