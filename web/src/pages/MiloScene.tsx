import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, useAnimations, Text } from '@react-three/drei';
import * as THREE from 'three';
import { FaChevronDown, FaChevronUp, FaEdit, FaTransgenderAlt} from 'react-icons/fa';
import { chatService } from '../services/chatService';

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
      <primitive object={scene} scale={[0.8, 0.8, 0.8]} position={[2, -2.3, 0]} rotation={[0, Math.PI, 0]} />
    </group>
  );
}



const Tableau: React.FC<TextPanelProps> = ({ text, isEditing }) => {
  const displayText = text || (isEditing ? "|" : "Tapez votre texte...");
  
  return (
    <group position={[0, 1, 0]} rotation={[0, 0, 0]}>
      <mesh>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="black" side={THREE.DoubleSide} />
      </mesh>
      <Text
        position={[-2.5, 1.6, 0.01]}
        fontSize={0.10}
        color="white"
        anchorX="left"
        anchorY="top"
        maxWidth={5}
      >
        {displayText}
      </Text>
    </group>
  );
};





interface TextPanelProps {
  text: string;
  isEditing: boolean;
}

const TextPanel: React.FC<TextPanelProps> = ({ text, isEditing }) => {
  const displayText = text || (isEditing ? "|" : "Tapez votre texte...");
  
  return (
    <group position={[0, -2, 3]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <planeGeometry args={[5, 3]} />
        <meshStandardMaterial color="#35261a" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2, 2.5]} />
        <meshStandardMaterial color="white" side={THREE.DoubleSide} />
      </mesh>
      <Text
        position={[-0.8, 1, 0.02]}
        fontSize={0.10}
        color="black"
        anchorX="left"
        anchorY="top"
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

interface SendButtonProps {
  onToggle: () => void;
}

const SendButton: React.FC<SendButtonProps> = ({onToggle}) => (
  <button
    onClick={onToggle}
    style={{
      position: 'fixed',
      bottom: 30,
      right: 90,
      background:'rgba(0,0,0,0.5)',
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
    <FaTransgenderAlt size={20} />
  </button>
);









const Scene3D: React.FC<{ text: string; isEditing: boolean; cameraY: number; reply: string }> = ({ 
  text, 
  isEditing, 
  cameraY,
  reply
}) => (
  <Canvas camera={{ position: [0, 0, 5], fov: 80 }}>
    <Suspense fallback={null}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      <MiloModel modelPath="/milo.glb" />
      <TextPanel text={text} isEditing={isEditing} />
      <Tableau text={reply} isEditing={isEditing} />

      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      <Environment preset="studio" />

      <CameraController targetY={cameraY} />
    </Suspense>
  </Canvas>
);

const MiloScene: React.FC = () => {
  const [cameraY, setCameraY] = useState(0);
  const [down, setDown] = useState(true);
  const [text, setText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [reply, setReply] = useState("");

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

  const handleSend = () => {
    setText(""); // Clear text after sending
    chatService.chat(text)
      .then(response => {
        setReply(response.reply || "J'ai besoin de plus d'informations pour répondre.");
      }
      )
      .catch(error => {
        console.error("Error sending text:", error);
        setReply("Une erreur s'est produite lors de l'envoi du texte.");
      }
    );
  };





  useEffect(() => {
    if (!isEditing) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === 'Backspace') {
        setText(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        setText(prev => prev + '\n');
      } else if (e.key.length === 1) {
        setText(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing]);




  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Scene3D text={text} isEditing={isEditing} cameraY={cameraY} reply={reply} />
      
      <CameraToggleButton down={down} onToggle={toggleCamera} />
      <EditButton isEditing={isEditing} onToggle={toggleEditing} />
      <SendButton onToggle={handleSend} />
    </div>
  );
};

export default MiloScene;