import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, useAnimations, Text } from '@react-three/drei';
import * as THREE from 'three';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface MiloModelProps {
  modelPath: string;
}

function MiloModel({ modelPath }: MiloModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, group);

  React.useEffect(() => {
    if (actions) {
      Object.values(actions).forEach((action) => {
        action?.reset().play().setLoop(THREE.LoopRepeat, Infinity);
      });
    }
  }, [actions]);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={group}>
      <primitive object={scene} scale={[0.8, 0.8, 0.8]} position={[0, -1.3, 0]} rotation={[0, Math.PI, 0]} />
    </group>
  );
}

const TextPanel: React.FC = () => {
  return (
    <group position={[0, -2, 3]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Rectangle (plan) */}
      <mesh>
        <planeGeometry args={[3, 1.5]} />
        <meshStandardMaterial color="#2a2a2a" side={THREE.DoubleSide} />
      </mesh>

      {/* Texte en 3D au-dessus du plan */}
      <Text
        position={[0, 0, 0.01]} // Léger décalage pour éviter le clipping
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Go Milo 👋
      </Text>
    </group>
  );
};













const CameraController: React.FC<{ targetY: number }> = ({ targetY }) => {
  const { camera } = useThree();
  const lookAtVec = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    // On garde la position fixe
    const current = lookAtVec.current;
    current.y = THREE.MathUtils.lerp(current.y, targetY, 0.05);
    camera.lookAt(current);
  });

  return null;
};



const MiloScene: React.FC = () => {
  const [cameraY, setCameraY] = useState(0);
  const [down, setDown] = useState(true);

  const toggleCamera = () => {
    setDown(!down);
    setCameraY(down ? -3 : 0);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          <MiloModel modelPath="/milo.glb" />
          <TextPanel />

          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
          <Environment preset="studio" />

          <CameraController targetY={cameraY} />
        </Suspense>
      </Canvas>

      <button
        onClick={toggleCamera}
        style={{
          position: 'fixed',
          bottom: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.5)',
          border: 'none',
          color: 'white',
          borderRadius: '50%',
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        {down ? <FaChevronDown size={24} /> : <FaChevronUp size={24} />}
      </button>
    </div>
  );
};

export default MiloScene;
