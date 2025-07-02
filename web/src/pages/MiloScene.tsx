import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, useAnimations, Text } from '@react-three/drei';
import * as THREE from 'three';
import { FaChevronDown, FaChevronUp, FaEdit } from 'react-icons/fa';

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

interface TextPanelProps {
  text: string;
  isEditing: boolean;
}

const TextPanel: React.FC<TextPanelProps> = ({ text, isEditing }) => {
  const displayText = text || (isEditing ? "|" : "Tapez votre texte...");
  
  return (
    <group position={[0, -2, 3]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <planeGeometry args={[4, 2]} />
        <meshStandardMaterial color="#2a2a2a" side={THREE.DoubleSide} />
      </mesh>
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={3.5}
      >
        {displayText}
      </Text>
    </group>
  );
};

const CameraController: React.FC<{ targetY: number }> = ({ targetY }) => {
  const { camera } = useThree();
  const lookAtVec = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const current = lookAtVec.current;
    current.y = THREE.MathUtils.lerp(current.y, targetY, 0.05);
    camera.lookAt(current);
  });

  return null;
};

interface CameraToggleButtonProps {
  down: boolean;
  onToggle: () => void;
}

const CameraToggleButton: React.FC<CameraToggleButtonProps> = ({ down, onToggle }) => (
  <button
    onClick={onToggle}
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
);

interface EditButtonProps {
  isEditing: boolean;
  onToggle: () => void;
}

const EditButton: React.FC<EditButtonProps> = ({ isEditing, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      position: 'fixed',
      bottom: 30,
      right: 30,
      background: isEditing ? 'rgba(74, 144, 226, 0.8)' : 'rgba(0,0,0,0.5)',
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
    <FaEdit size={20} />
  </button>
);

interface TextEditorProps {
  text: string;
  isEditing: boolean;
  onTextChange: (text: string) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ text, isEditing, onTextChange }) => {
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      
      if (e.key === 'Backspace') {
        onTextChange(text.slice(0, -1));
      } else if (e.key === 'Enter') {
        onTextChange(text + '\n');
      } else if (e.key.length === 1) {
        onTextChange(text + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, text, onTextChange]);

  return null;
};

const Scene3D: React.FC<{ text: string; isEditing: boolean; cameraY: number }> = ({ 
  text, 
  isEditing, 
  cameraY 
}) => (
  <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
    <Suspense fallback={null}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <MiloModel modelPath="/milo.glb" />
      <TextPanel text={text} isEditing={isEditing} />

      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      <Environment preset="studio" />

      <CameraController targetY={cameraY} />
    </Suspense>
  </Canvas>
);

const MiloScene: React.FC = () => {
  const [cameraY, setCameraY] = useState(0);
  const [down, setDown] = useState(true);
  const [text, setText] = useState("Go Milo 👋");
  const [isEditing, setIsEditing] = useState(false);

  const toggleCamera = () => {
    setDown(!down);
    setCameraY(down ? -3 : 0);
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Scene3D text={text} isEditing={isEditing} cameraY={cameraY} />
      
      <CameraToggleButton down={down} onToggle={toggleCamera} />
      <EditButton isEditing={isEditing} onToggle={toggleEditing} />
      
      <TextEditor 
        text={text} 
        isEditing={isEditing} 
        onTextChange={handleTextChange} 
      />
    </div>
  );
};

export default MiloScene;