import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, useAnimations, Text } from '@react-three/drei';
import * as THREE from 'three';
import { FaChevronDown, FaChevronUp, FaEdit, FaTransgenderAlt} from 'react-icons/fa';
import HelpModal from '../components/HelpClass';

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

const TextPanel: React.FC<TextPanelProps & { 
  onPanelClick: () => void;
  onSend: () => void;
}> = ({ text, isEditing, onPanelClick}) => {
  const displayText = text || (isEditing ? "|" : "Tapez votre texte...");
  const scale = 0.55;
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.PlaneGeometry) {
          const material = child.material as THREE.MeshStandardMaterial;
          material.emissive.setHex(isHovered ? 0xff8800 : 0x000000);
          material.emissiveIntensity = isHovered ? 0.8 : 0;
        }
      });
    }
  });
  
  return (
    <group 
      ref={groupRef}
      position={[0, -0.65, 4.2]} 
      rotation={[-Math.PI / 2, 0, 0]} 
      scale={scale}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onPointerDown={onPanelClick}
    >
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
  onPanelClick: () => void;
  onSend: () => void;
}> = ({ 
  text, 
  isEditing, 
  cameraY,
  reply,
  activeAnimation,
  showHat,
  showGlasses,
  onPanelClick,
  onSend
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
        
      />
      
      {/* Lumière chaude (côté droit) */}
      <pointLight 
        position={[10, 5, 5]} 
        intensity={0.7}
        color="#ffe8cc"
        
      />
      
      {/* Lumière froide (côté gauche) */}
      <pointLight 
        position={[-10, 5, 3]} 
        intensity={0.5}
        color="#d4e6ff"
      />
      
      {/* Lumière de remplissage (bas) */}
      <pointLight 
        position={[0, -3, 5]} 
        intensity={0.4}
        color="#ffffff"
      />

      <Classroom modelPath="/classroom.glb" />
      <MiloModel modelPath="/MiloV1.glb" activeAnimation={activeAnimation} showHat={showHat} showGlasses={showGlasses} />
      <TextPanel text={text} isEditing={isEditing} onPanelClick={onPanelClick} onSend={onSend} />
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
  const [showHelp, setShowHelp] = useState(false);
  const [helpImageUrl, setHelpImageUrl] = useState("/help.webp");

  const toggleCamera = () => {
    setDown(!down);
    setCameraY(down ? -3 : 0);
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const handlePanelClick = () => {
    toggleCamera();
    toggleEditing();
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
    
    setTimeout(() => {
      setReply(`Vous avez dit: "${messageToSend}"`);
    }, 1000);
    
    // Relève la caméra et quitte le mode édition
    setDown(true);
    setCameraY(0);
    setIsEditing(false);
  };

  useEffect(() => {
    if (!isEditing) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setText(prev => prev.slice(0, -1));
      } else if (e.key.length === 1) {
        e.preventDefault();
        setText(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, text]);

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
        onPanelClick={handlePanelClick}
        onSend={handleSend}
      />
      
      <AnimationControls 
        activeAnimation={activeAnimation} 
        onAnimationChange={setActiveAnimation}
        showHat={showHat}
        onHatToggle={toggleHat}
        showGlasses={showGlasses}
        onGlassesToggle={toggleGlasses}
      />
      
      {/* Bouton d'aide */}
      <button
        onClick={() => setShowHelp(true)}
        style={{
          position: 'fixed',
          top: 30,
          right: 30,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          border: 'none',
          fontSize: '28px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'background 0.3s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,136,0,0.8)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
      >
        ?
      </button>

      <HelpModal 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
        imageUrl={helpImageUrl}
      />
    </div>
  );
};

export default MiloScene;