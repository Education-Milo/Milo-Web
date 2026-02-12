import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, useAnimations, Text } from '@react-three/drei';
import * as THREE from 'three';
import { FiSend, FiSettings, FiX, FiHelpCircle } from 'react-icons/fi';
import HelpModal from '../components/HelpClass';
import '../styles/MiloScene.css';

/* ============================
   3D Models
   ============================ */

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

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        // Only Milo casts shadows (perf)
        child.castShadow = true;
        child.receiveShadow = false;
      }
    });
  }, [scene]);

  useEffect(() => {
    if (!actions) return;
    Object.values(actions).forEach(action => action?.stop());
    if (activeAnimation && actions[activeAnimation]) {
      actions[activeAnimation]!.reset().play().setLoop(THREE.LoopRepeat, Infinity);
    }
  }, [actions, activeAnimation]);

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (child.name === 'Hat') child.visible = showHat;
      if (child.name === 'Glasses') child.visible = showGlasses;
    });
  }, [scene, showHat, showGlasses]);

  return (
    <group ref={group}>
      <primitive object={scene} scale={[0.45, 0.45, 0.45]} position={[2.2, -2.3, 1.4]} rotation={[0, -0.4, 0]} />
    </group>
  );
}

function Classroom({ modelPath }: { modelPath: string }) {
  const { scene } = useGLTF(modelPath);

  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        // Classroom only receives shadows, never casts (huge perf gain)
        child.castShadow = false;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <primitive object={scene} scale={[1, 1, 1]} position={[-2, -2.5, 6.95]} rotation={[0, 0, 0]} />
  );
}

/* ============================
   3D Text Elements
   ============================ */

interface TextPanelProps {
  text: string;
  isEditing: boolean;
}

const Tableau: React.FC<TextPanelProps> = ({ text, isEditing }) => {
  const displayText = text || (isEditing ? '|' : '');
  return (
    <group position={[0, 0, 0.5]}>
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

/* --- Interactive Sheet (Feuille) --- */

const Feuille: React.FC<TextPanelProps & { onPanelClick: () => void }> = ({
  text,
  isEditing,
  onPanelClick,
}) => {
  const displayText = text || (isEditing ? '|' : 'Cliquez pour ecrire...');
  const [isHovered, setIsHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const glowOpacity = useRef(0);

  useFrame((_, delta) => {
    // Smooth glow transition
    const target = isHovered ? 1 : 0;
    glowOpacity.current = THREE.MathUtils.lerp(glowOpacity.current, target, delta * 8);
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = glowOpacity.current * 0.55;
    }
  });

  // Disable raycasting on non-interactive meshes
  const noRaycast = useCallback(() => null, []);

  return (
    <group
      position={[0, -0.65, 4.2]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={0.55}
    >

      {/* Glow border (visible on hover) – not raycastable */}
      <mesh ref={glowRef} position={[0, 0, -0.005]} raycast={noRaycast}>
        <planeGeometry args={[2.7, 2.7]} />
        <meshBasicMaterial color="#60b0ff" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Sheet surface – main interactive target */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0.01]}
        onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setIsHovered(false); document.body.style.cursor = 'auto'; }}
        onClick={(e) => { e.stopPropagation(); onPanelClick(); }}
      >
        <planeGeometry args={[2.5, 2.5]} />
        <meshStandardMaterial
          color={isHovered ? '#c4c4c4' : 'white'}
          side={THREE.DoubleSide}
          emissive={isHovered ? '#aaccff' : '#000000'}
          emissiveIntensity={isHovered ? 0.15 : 0}
        />
      </mesh>

      {/* Text – not raycastable so it doesn't block the sheet */}
      <Text
        position={[-1, 1, 0.02]}
        fontSize={0.12}
        color="black"
        anchorX="left"
        anchorY="top"
        maxWidth={2.3}
        lineHeight={1.4}
        raycast={noRaycast}
      >
        {displayText}
      </Text>
    </group>
  );
};

/* ============================
   Optimized Lighting - Bright Afternoon
   ============================ */

const ClassroomLighting: React.FC = () => {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    if (!sunRef.current) return;
    const light = sunRef.current;
    // Optimized shadow map: 512px, tight frustum for sharper shadows
    light.shadow.mapSize.set(512, 512);
    light.shadow.camera.near = 2;
    light.shadow.camera.far = 22;
    light.shadow.camera.left = -7;
    light.shadow.camera.right = 7;
    light.shadow.camera.top = 7;
    light.shadow.camera.bottom = -7;
    light.shadow.bias = -0.0025;
    light.shadow.normalBias = 0.04;
    light.shadow.camera.updateProjectionMatrix();
  }, []);

  return (
    <>
      {/* Soft ambient – bright enough to see the room */}
      <ambientLight intensity={0.7} color="#cdcbc8" />

      {/* Hemisphere: sky + soft ground bounce */}
      <hemisphereLight args={['#ffffff', '#d9c7a7', 0.4]} />

      {/* Main sun – neutral warm white, primary shadow caster */}
      <directionalLight
        ref={sunRef}
        position={[10, 12, 4]}
        intensity={2.4}
        color="#fffffe"
        castShadow
      />

      {/* Gentle fill from opposite side (no shadow) */}
      <directionalLight
        position={[-5, 6, 6]}
        intensity={0.5}
        color="#fdfbf9"
      />
    </>
  );
};

/* ============================
   Camera Controller
   ============================ */

const CameraController: React.FC<{ targetY: number }> = ({ targetY }) => {
  const { camera } = useThree();
  const lookAtVec = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    const cur = lookAtVec.current;
    cur.y = THREE.MathUtils.lerp(cur.y, targetY, 0.05);
    camera.lookAt(cur);
  });

  return null;
};

/* ============================
   Intro Camera Animation
   ============================ */

const IntroCamera: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { camera } = useThree();
  const progress = useRef(0);
  const done = useRef(false);

  // Start position: far back and slightly high
  const startPos = useRef(new THREE.Vector3(0, 2, 12));
  const endPos = useRef(new THREE.Vector3(0, 0, 5));
  const startLookAt = useRef(new THREE.Vector3(0, 1, 0));
  const endLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_, delta) => {
    if (done.current) return;
    progress.current = Math.min(progress.current + delta * 0.4, 1);
    const t = 1 - Math.pow(1 - progress.current, 3); // ease-out cubic

    camera.position.lerpVectors(startPos.current, endPos.current, t);
    const lookAt = new THREE.Vector3().lerpVectors(startLookAt.current, endLookAt.current, t);
    camera.lookAt(lookAt);

    if (progress.current >= 1) {
      done.current = true;
      onDone();
    }
  });

  return null;
};

/* ============================
   Main 3D Scene
   ============================ */

const Scene3D: React.FC<{
  cameraY: number;
  reply: string;
  activeAnimation: string;
  showHat: boolean;
  showGlasses: boolean;
  text: string;
  isEditing: boolean;
  onPanelClick: () => void;
  introActive: boolean;
  onIntroDone: () => void;
}> = ({
  cameraY,
  reply,
  activeAnimation,
  showHat,
  showGlasses,
  text,
  isEditing,
  onPanelClick,
  introActive,
  onIntroDone,
}) => (
  <Canvas
    camera={{ position: [0, 2, 12], fov: 80 }}
    shadows="basic"
    gl={{
      antialias: false,
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 0.95,
      outputColorSpace: THREE.SRGBColorSpace,
      powerPreference: 'high-performance',
    }}
    dpr={[1, 1.5]}
    performance={{ min: 0.5 }}
  >
    <Suspense fallback={null}>
      <ClassroomLighting />

      <Classroom modelPath="/classroom.glb" />
      <MiloModel
        modelPath="/MiloV1.glb"
        activeAnimation={activeAnimation}
        showHat={showHat}
        showGlasses={showGlasses}
      />
      <Feuille text={text} isEditing={isEditing} onPanelClick={onPanelClick} />
      <Tableau text={reply} isEditing={isEditing} />

      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      <Environment preset="park" background={false} environmentIntensity={0.3} />

      {introActive ? (
        <IntroCamera onDone={onIntroDone} />
      ) : (
        <CameraController targetY={cameraY} />
      )}
    </Suspense>
  </Canvas>
);

/* ============================
   UI Components
   ============================ */

const ANIMATIONS = ['Idle', 'IdleFoot', 'Explaining'] as const;

const AnimationControls: React.FC<{
  activeAnimation: string;
  onAnimationChange: (anim: string) => void;
  showHat: boolean;
  onHatToggle: () => void;
  showGlasses: boolean;
  onGlassesToggle: () => void;
  visible: boolean;
  onClose: () => void;
}> = ({
  activeAnimation,
  onAnimationChange,
  showHat,
  onHatToggle,
  showGlasses,
  onGlassesToggle,
  visible,
  onClose,
}) => (
  <div className={`controls-panel glass-panel ${!visible ? 'collapsed' : ''}`}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <h3 style={{ margin: 0 }}>Animations</h3>
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', padding: 4, display: 'flex', transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
      >
        <FiX size={16} />
      </button>
    </div>

    {ANIMATIONS.map(anim => (
      <label
        key={anim}
        className={`control-label ${activeAnimation === anim ? 'active' : ''}`}
        onClick={() => onAnimationChange(anim)}
      >
        <div className={`custom-radio ${activeAnimation === anim ? 'selected' : ''}`}>
          <div className="custom-radio-dot" />
        </div>
        {anim}
      </label>
    ))}

    <hr />
    <h3>Accessoires</h3>

    <label className="control-label" onClick={onHatToggle}>
      <div className={`toggle-switch ${showHat ? 'on' : ''}`}>
        <div className="toggle-knob" />
      </div>
      Chapeau
    </label>

    <label className="control-label" onClick={onGlassesToggle}>
      <div className={`toggle-switch ${showGlasses ? 'on' : ''}`}>
        <div className="toggle-knob" />
      </div>
      Lunettes
    </label>
  </div>
);

const TypingIndicator: React.FC = () => (
  <div className="typing-indicator">
    <div className="typing-dot" />
    <div className="typing-dot" />
    <div className="typing-dot" />
  </div>
);

const ReplyBubble: React.FC<{ text: string; isLoading: boolean }> = ({ text, isLoading }) => {
  if (!text && !isLoading) return null;
  return (
    <div className={`reply-bubble glass-panel ${!text && !isLoading ? 'hidden' : ''}`}>
      {isLoading ? <TypingIndicator /> : text}
    </div>
  );
};

const ChatInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  disabled: boolean;
}> = ({ value, onChange, onSend, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && value.trim()) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat-input-area">
      <div className="chat-input-wrapper glass-panel">
        <input
          ref={inputRef}
          className="chat-input"
          type="text"
          placeholder="Posez une question a Milo..."
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button
          className="chat-send-btn"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label="Envoyer"
        >
          <FiSend size={16} />
        </button>
      </div>
    </div>
  );
};

const LoadingOverlay: React.FC = () => (
  <div className="scene-loading-overlay">
    <div className="loading-spinner" />
    <span className="loading-text">Chargement de la scene...</span>
  </div>
);

/* ============================
   Intro Overlay
   ============================ */

const IntroOverlay: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className="intro-overlay">
      <div className="intro-content">
        <h1 className="intro-title">Bienvenue dans la classe de Milo !</h1>
        <p className="intro-subtitle">Ton meilleur ami pour apprendre !</p>
      </div>
    </div>
  );
};

/* ============================
   Main Component
   ============================ */

const MiloScene: React.FC = () => {
  const [cameraY, setCameraY] = useState(0);
  const [, setDown] = useState(true);
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAnimation, setActiveAnimation] = useState('Idle');
  const [showHat, setShowHat] = useState(true);
  const [showGlasses, setShowGlasses] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [introActive, setIntroActive] = useState(true);
  const [showIntroText, setShowIntroText] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSceneReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Fade out intro text after camera finishes
  const handleIntroDone = useCallback(() => {
    setTimeout(() => {
      setShowIntroText(false);
      setIntroActive(false);
    }, 1500);
  }, []);

  const handlePanelClick = useCallback(() => {
    setDown(prev => {
      setCameraY(prev ? -3 : 0);
      return !prev;
    });
    setIsEditing(prev => !prev);
  }, []);

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    const msg = text;
    setText('');
    setReply('');
    setIsLoading(true);

    // Milo starts explaining
    setActiveAnimation('Explaining');

    // Camera back up & exit edit mode
    setDown(true);
    setCameraY(0);
    setIsEditing(false);

    // After 3s of explaining, show result and go back to Idle
    setTimeout(() => {
      setIsLoading(false);
      setReply(`Vous avez dit : "${msg}"`);
    }, 2000);

    // Milo stops explaining after 4s
    setTimeout(() => {
      setActiveAnimation('Idle');
    }, 4000);
  }, [text]);

  // Keyboard handler when editing the sheet
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
  }, [isEditing, handleSend]);

  return (
    <div className="milo-scene-root">
      {!sceneReady && <LoadingOverlay />}

      <Scene3D
        cameraY={cameraY}
        reply={reply}
        activeAnimation={activeAnimation}
        showHat={showHat}
        showGlasses={showGlasses}
        text={text}
        isEditing={isEditing}
        onPanelClick={handlePanelClick}
        introActive={introActive}
        onIntroDone={handleIntroDone}
      />

      {/* Intro overlay text */}
      <IntroOverlay visible={showIntroText && sceneReady} />

      {/* Reply bubble */}
      <ReplyBubble text={reply} isLoading={isLoading} />

      {/* Controls panel */}
      <AnimationControls
        activeAnimation={activeAnimation}
        onAnimationChange={setActiveAnimation}
        showHat={showHat}
        onHatToggle={() => setShowHat(h => !h)}
        showGlasses={showGlasses}
        onGlassesToggle={() => setShowGlasses(g => !g)}
        visible={showControls}
        onClose={() => setShowControls(false)}
      />

      {!showControls && (
        <button
          className="panel-toggle-btn"
          onClick={() => setShowControls(true)}
          aria-label="Ouvrir les parametres"
        >
          <FiSettings size={18} />
        </button>
      )}

      <button
        className="help-btn"
        onClick={() => setShowHelp(true)}
        aria-label="Aide"
      >
        <FiHelpCircle size={22} />
      </button>

      <ChatInput
        value={text}
        onChange={setText}
        onSend={handleSend}
        disabled={isLoading}
      />

      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        imageUrl="/help.webp"
      />
    </div>
  );
};

export default MiloScene;
