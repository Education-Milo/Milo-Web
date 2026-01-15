import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, useAnimations, Text } from '@react-three/drei';
import * as THREE from 'three';
import { FaChevronDown, FaChevronUp, FaEdit, FaTransgenderAlt} from 'react-icons/fa';

interface MiloModelProps {
  modelPath: string;
  activeAnimation: string;
  showHat: boolean;
  showGlasses: boolean;
}

function MiloModel({ modelPath, activeAnimation, showHat, showGlasses }: MiloModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, group);

  React.useEffect(() => {
    console.log('Available animations:', Object.keys(actions || {}));
    if (actions) {
      // Stop all animations first
      Object.values(actions).forEach(action => action?.stop());
      
      // Play selected animation
      if (activeAnimation && actions[activeAnimation]) {
        actions[activeAnimation].reset().play().setLoop(THREE.LoopRepeat, Infinity);
      }
    }
  }, [actions, activeAnimation]);

  // Toggle accessories visibility
  React.useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.name === 'Hat') {
          child.visible = showHat;
        }
        if (child.name === 'Glasses') {
          child.visible = showGlasses;
        }
      });
    }
  }, [scene, showHat, showGlasses]);

  return (
    <group ref={group}>
      <primitive object={scene} scale={[0.45, 0.45, 0.45]} position={[2.2, -2.3, 1.4]} rotation={[0, -0.4, 0]} />
    </group>
  );
}

function Classroom({ modelPath }: { modelPath: string }) {
  const { scene } = useGLTF(modelPath);
  
  return (
    <primitive object={scene} scale={[1, 1, 1]} position={[-2, -2.5, 6.95]} rotation={[0, 0, 0]} />
  );
}

const Tableau: React.FC<TextPanelProps> = ({ text, isEditing }) => {
  const displayText = text || (isEditing ? "|" : "Tapez votre texte...");
  
  return (
    <group position={[0, 0, 0.5]} rotation={[0, 0, 0]}>
      
      <Text
        position={[-3.8, 1.6, 0.01]}
        fontSize={0.15}
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
  const scale = 0.55; // Changez cette valeur pour scaler (1 = normal, 1.5 = 150%)
  
  return (
    <group position={[0, -0.65, 4.2]} rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2.5, 2.5]} />
        <meshStandardMaterial color="white" side={THREE.DoubleSide} />
      </mesh>
      <Text
        position={[-1, 1, 0.02]}
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

const AnimationControls: React.FC<{ 
  activeAnimation: string; 
  onAnimationChange: (animation: string) => void;
  showHat: boolean;
  onHatToggle: () => void;
  showGlasses: boolean;
  onGlassesToggle: () => void;
}> = ({ 
  activeAnimation, 
  onAnimationChange,
  showHat,
  onHatToggle,
  showGlasses,
  onGlassesToggle
}) => (
  <div style={{
    position: 'fixed',
    top: 30,
    left: 30,
    background: 'rgba(0,0,0,0.7)',
    padding: '20px',
    borderRadius: '8px',
    color: 'white',
    zIndex: 10,
  }}>
    <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Animations</h3>
    <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
      <input
        type="radio"
        name="animation"
        value="Idle"
        checked={activeAnimation === 'Idle'}
        onChange={(e) => onAnimationChange(e.target.value)}
        style={{ marginRight: '10px', cursor: 'pointer' }}
      />
      Idle
    </label>
    <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
      <input
        type="radio"
        name="animation"
        value="IdleFoot"
        checked={activeAnimation === 'IdleFoot'}
        onChange={(e) => onAnimationChange(e.target.value)}
        style={{ marginRight: '10px', cursor: 'pointer' }}
      />
      IdleFoot
    </label>
    <label style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', cursor: 'pointer' }}>
      <input
        type="radio"
        name="animation"
        value="Explaining"
        checked={activeAnimation === 'Explaining'}
        onChange={(e) => onAnimationChange(e.target.value)}
        style={{ marginRight: '10px', cursor: 'pointer' }}
      />
      Explaining
    </label>
    
    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.2)', margin: '15px 0' }} />
    
    <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Accessoires</h3>
    <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={showHat}
        onChange={onHatToggle}
        style={{ marginRight: '10px', cursor: 'pointer' }}
      />
      Afficher le chapeau
    </label>
    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={showGlasses}
        onChange={onGlassesToggle}
        style={{ marginRight: '10px', cursor: 'pointer' }}
      />
      Afficher les lunettes
    </label>
  </div>
);

const Scene3D: React.FC<{ 
  text: string; 
  isEditing: boolean; 
  cameraY: number; 
  reply: string; 
  activeAnimation: string;
  showHat: boolean;
  showGlasses: boolean;
}> = ({ 
  text, 
  isEditing, 
  cameraY,
  reply,
  activeAnimation,
  showHat,
  showGlasses
}) => (
  <Canvas 
    camera={{ position: [0, 0, 5], fov: 80 }}
    shadows
  >
    <Suspense fallback={null}>
      {/* Éclairage ambiant */}
      <ambientLight intensity={0.5} color="#ffffff" />
      
      {/* Lumière directionnelle principale avec ombres */}
      <directionalLight 
        position={[8, 10, 5]} 
        intensity={1.2}
        color="#f5f5f0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Lumière chaude (côté droit) */}
      <pointLight 
        position={[10, 5, 5]} 
        intensity={0.7}
        color="#ffe8cc"
        castShadow
      />
      
      {/* Lumière froide (côté gauche) */}
      <pointLight 
        position={[-10, 5, 3]} 
        intensity={0.5}
        color="#d4e6ff"
        castShadow
      />
      
      {/* Lumière de remplissage (bas) */}
      <pointLight 
        position={[0, -3, 5]} 
        intensity={0.4}
        color="#ffffff"
      />

      <Classroom modelPath="/classroom.glb" />
      <MiloModel modelPath="/MiloV1.glb" activeAnimation={activeAnimation} showHat={showHat} showGlasses={showGlasses} />
      <TextPanel text={text} isEditing={isEditing} />
      <Tableau text={reply} isEditing={isEditing} />

      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      <Environment preset="park" />

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
  const [activeAnimation, setActiveAnimation] = useState("Idle");
  const [showHat, setShowHat] = useState(true);
  const [showGlasses, setShowGlasses] = useState(true);

  const toggleCamera = () => {
    setDown(!down);
    setCameraY(down ? -3 : 0);
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const toggleHat = () => {
    setShowHat(!showHat);
  };

  const toggleGlasses = () => {
    setShowGlasses(!showGlasses);
  };

  const handleSend = () => {
    const messageToSend = text;
    setText("");
    setReply("Envoi en cours...");
    
    // Simulate chat service call
    setTimeout(() => {
      setReply(`Vous avez dit: "${messageToSend}"`);
    }, 1000);
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
      <Scene3D 
        text={text} 
        isEditing={isEditing} 
        cameraY={cameraY} 
        reply={reply} 
        activeAnimation={activeAnimation}
        showHat={showHat}
        showGlasses={showGlasses}
      />
      
      <AnimationControls 
        activeAnimation={activeAnimation} 
        onAnimationChange={setActiveAnimation}
        showHat={showHat}
        onHatToggle={toggleHat}
        showGlasses={showGlasses}
        onGlassesToggle={toggleGlasses}
      />
      <CameraToggleButton down={down} onToggle={toggleCamera} />
      <EditButton isEditing={isEditing} onToggle={toggleEditing} />
      <SendButton onToggle={handleSend} />
    </div>
  );
};

export default MiloScene;