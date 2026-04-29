import React, {
	Suspense,
	useRef,
	useState,
	useEffect,
	useCallback,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
	OrbitControls,
	Environment,
	useGLTF,
	useAnimations,
	Text,
} from "@react-three/drei";
import * as THREE from "three";
import {
	FiSend,
	FiSettings,
	FiX,
	FiHelpCircle,
	FiArrowLeft,
	FiChevronRight,
	FiMessageCircle,
} from "react-icons/fi";
import { useParams } from "react-router-dom";
import HelpModal from "@features/milo-scene/components/HelpModal.component";
import { useMiloScene } from "@features/milo-scene/hooks/useMiloScene";
import "@features/milo-scene/styles/MiloScene.css";

/* ============================
   3D Models — inchangés
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
	const prevAnimation = useRef<string | null>(null);

	useEffect(() => {
		if (!scene) return;
		scene.traverse((child) => {
			if ((child as THREE.Mesh).isMesh) {
				child.castShadow = true;
				child.receiveShadow = false;
			}
		});
	}, [scene]);

	useEffect(() => {
		if (!actions || !activeAnimation) return;
		const CROSSFADE_DURATION = 0.5;
		const nextAction = actions[activeAnimation];
		if (!nextAction) return;
		const prevName = prevAnimation.current;
		const prevAction = prevName ? actions[prevName] : null;
		nextAction.reset();
		nextAction.setLoop(THREE.LoopRepeat, Infinity);
		nextAction.play();
		if (prevAction && prevAction !== nextAction) {
			prevAction.crossFadeTo(nextAction, CROSSFADE_DURATION, true);
		} else {
			nextAction.fadeIn(CROSSFADE_DURATION);
		}
		prevAnimation.current = activeAnimation;
	}, [actions, activeAnimation]);

	useEffect(() => {
		if (!scene) return;
		scene.traverse((child) => {
			if (child.name === "Hat") child.visible = showHat;
			if (child.name === "Glasses") child.visible = showGlasses;
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
				child.castShadow = false;
				child.receiveShadow = true;
			}
		});
	}, [scene]);
	return <primitive object={scene} scale={[1, 1, 1]} position={[-2, -2.5, 6.95]} rotation={[0, 0, 0]} />;
}

interface TextPanelProps {
	text: string;
	isEditing: boolean;
}

const Tableau: React.FC<TextPanelProps> = ({ text, isEditing }) => {
	const displayText = text || (isEditing ? "|" : "");
	return (
		<group position={[0, 0, 0.5]}>
			<Text position={[-3.8, 1.6, 0.01]} fontSize={0.15} color="white" anchorX="left" anchorY="top" maxWidth={4.5} overflowWrap="break-word" clipRect={[-0.2, -2.8, 5, 0.2]}>
				{displayText}
			</Text>
		</group>
	);
};

const Feuille: React.FC<TextPanelProps & { onPanelClick: () => void }> = ({ text, isEditing, onPanelClick }) => {
	const displayText = text || (isEditing ? "|" : "Cliquez pour poser une question...");
	const [isHovered, setIsHovered] = useState(false);
	const meshRef = useRef<THREE.Mesh>(null);
	const glowRef = useRef<THREE.Mesh>(null);
	const glowOpacity = useRef(0);

	useFrame((_, delta) => {
		const target = isHovered ? 1 : 0;
		glowOpacity.current = THREE.MathUtils.lerp(glowOpacity.current, target, delta * 8);
		if (glowRef.current) {
			(glowRef.current.material as THREE.MeshBasicMaterial).opacity = glowOpacity.current * 0.55;
		}
	});

	const noRaycast = useCallback(() => null, []);

	return (
		<group position={[0, -0.65, 4.2]} rotation={[-Math.PI / 2, 0, 0]} scale={0.55}>
			<mesh ref={glowRef} position={[0, 0, -0.005]} raycast={noRaycast}>
				<planeGeometry args={[2.7, 2.7]} />
				<meshBasicMaterial color="#60b0ff" transparent opacity={0} side={THREE.DoubleSide} />
			</mesh>
			<mesh ref={meshRef} position={[0, 0, 0.01]}
				onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); document.body.style.cursor = "pointer"; }}
				onPointerOut={() => { setIsHovered(false); document.body.style.cursor = "auto"; }}
				onClick={(e) => { e.stopPropagation(); onPanelClick(); }}
			>
				<planeGeometry args={[2.5, 2.5]} />
				<meshStandardMaterial color={isHovered ? "#c4c4c4" : "white"} side={THREE.DoubleSide} emissive={isHovered ? "#aaccff" : "#000000"} emissiveIntensity={isHovered ? 0.15 : 0} />
			</mesh>
			<Text position={[-1.05, 1.05, 0.02]} fontSize={0.12} color="black" anchorX="left" anchorY="top" maxWidth={2.1} lineHeight={1.4} overflowWrap="break-word" raycast={noRaycast} clipRect={[-0.2, -2.25, 2.3, 0.2]}>
				{displayText}
			</Text>
		</group>
	);
};

const ClassroomLighting: React.FC = () => {
	const sunRef = useRef<THREE.DirectionalLight>(null);
	useEffect(() => {
		if (!sunRef.current) return;
		const light = sunRef.current;
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
			<ambientLight intensity={0.7} color="#cdcbc8" />
			<hemisphereLight args={["#ffffff", "#d9c7a7", 0.4]} />
			<directionalLight ref={sunRef} position={[10, 12, 4]} intensity={2.4} color="#fffffe" castShadow />
			<directionalLight position={[-5, 6, 6]} intensity={0.5} color="#fdfbf9" />
		</>
	);
};

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

const IntroCamera: React.FC<{ onDone: () => void }> = ({ onDone }) => {
	const { camera } = useThree();
	const progress = useRef(0);
	const done = useRef(false);
	const startPos = useRef(new THREE.Vector3(0, 2, 12));
	const endPos = useRef(new THREE.Vector3(0, 0, 5));
	const startLookAt = useRef(new THREE.Vector3(0, 1, 0));
	const endLookAt = useRef(new THREE.Vector3(0, 0, 0));

	useFrame((_, delta) => {
		if (done.current) return;
		progress.current = Math.min(progress.current + delta * 0.4, 1);
		const t = progress.current < 0.5
			? 4 * progress.current ** 3
			: 1 - Math.pow(-2 * progress.current + 2, 3) / 2;
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
	displayedText: string;
}> = ({ cameraY, reply, activeAnimation, showHat, showGlasses, text, isEditing, onPanelClick, introActive, onIntroDone,displayedText }) => (
<Canvas shadows camera={{ position: [0, 0, 5], fov: 60 }} className="three-canvas">
		<Suspense fallback={null}>
			<ClassroomLighting />
			<Environment preset="park" />
			<Classroom modelPath="/classroom.glb" />
			<MiloModel modelPath="/MiloV3.glb" activeAnimation={activeAnimation} showHat={showHat} showGlasses={showGlasses} />
            {/* MODIFICATION ICI : On affiche le cours, ou la réponse de Milo s'il y en a une */}
            <Tableau text={reply || displayedText} isEditing={false} />
            <Feuille text={text} isEditing={isEditing} onPanelClick={onPanelClick} />
			<OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.8} minAzimuthAngle={-Math.PI / 6} maxAzimuthAngle={Math.PI / 6} />
			{introActive ? <IntroCamera onDone={onIntroDone} /> : <CameraController targetY={cameraY} />}
		</Suspense>
	</Canvas>
);

/* ============================
   UI Components
   ============================ */

const ANIMATIONS = ["Idle", "Thinking", "Explaining"] as const;

const AnimationControls: React.FC<{
	activeAnimation: string;
	onAnimationChange: (anim: string) => void;
	showHat: boolean;
	onHatToggle: () => void;
	showGlasses: boolean;
	onGlassesToggle: () => void;
	visible: boolean;
	onClose: () => void;
}> = ({ activeAnimation, onAnimationChange, showHat, onHatToggle, showGlasses, onGlassesToggle, visible, onClose }) => (
	<div className={`controls-panel glass-panel ${!visible ? "collapsed" : ""}`}>
		<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
			<h3 style={{ margin: 0 }}>Animations</h3>
			<button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4, display: "flex", transition: "color 0.2s" }}
				onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
				onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
				<FiX size={16} />
			</button>
		</div>
		{ANIMATIONS.map((anim) => (
			<label key={anim} className={`control-label ${activeAnimation === anim ? "active" : ""}`} onClick={() => onAnimationChange(anim)}>
				<div className={`custom-radio ${activeAnimation === anim ? "selected" : ""}`}><div className="custom-radio-dot" /></div>
				{anim}
			</label>
		))}
		<hr />
		<h3>Accessoires</h3>
		<label className="control-label" onClick={onHatToggle}>
			<div className={`toggle-switch ${showHat ? "on" : ""}`}><div className="toggle-knob" /></div>
			Chapeau
		</label>
		<label className="control-label" onClick={onGlassesToggle}>
			<div className={`toggle-switch ${showGlasses ? "on" : ""}`}><div className="toggle-knob" /></div>
			Lunettes
		</label>
	</div>
);

/* ── Barre de progression du cours ── */
const LessonProgressBar: React.FC<{ current: number; total: number; percent: number }> = ({ current, total, percent }) => (
	<div className="lesson-progress-bar glass-panel">
		<span className="lesson-progress-label">Partie {current} / {total}</span>
		<div className="lesson-progress-track">
			<div className="lesson-progress-fill" style={{ width: `${percent}%` }} />
		</div>
	</div>
);

/* ── Panneau de cours affiché sur le tableau ── */
// const LessonPanel: React.FC<{
// 	title: string;
// 	content: string;
// 	phase: string;
// 	reply: string;
// }> = ({ title, content, phase, reply }) => (
// 	<div className="lesson-panel glass-panel">
// 		<h3 className="lesson-panel-title">{title}</h3>
// 		<p className="lesson-panel-content">{content}</p>
// 		{reply && phase === "waiting" && (
// 			<div className="lesson-reply">
// 				<span className="lesson-reply-label">🦊 Milo :</span>
// 				<p>{reply}</p>
// 			</div>
// 		)}
// 	</div>
// );

/* ── Boutons d'action en bas ── */
const LessonActions: React.FC<{
	phase: string;
	isLastPart: boolean;
	onNext: () => void;
	onAskQuestion: () => void;
	onBackToLessons: () => void;
}> = ({ phase, isLastPart, onNext, onAskQuestion, onBackToLessons }) => {
	if (phase === "loading") {
		return (
			<div className="lesson-actions glass-panel">
				<span className="lesson-loading-text">Milo prépare ton cours...</span>
			</div>
		);
	}

	if (phase === "finished") {
		return (
			<div className="lesson-actions glass-panel lesson-finished">
				<p>🎉 Bravo ! Tu as terminé cette leçon !</p>
				<button className="lesson-btn lesson-btn--primary" onClick={onBackToLessons}>
					<FiArrowLeft size={16} /> Retour aux leçons
				</button>
			</div>
		);
	}

	if (phase === "waiting") {
		return (
			<div className="lesson-actions glass-panel">
				<button className="lesson-btn lesson-btn--secondary" onClick={onAskQuestion}>
					<FiMessageCircle size={16} />
					<span>J'ai une question</span>
				</button>
				<button className="lesson-btn lesson-btn--primary" onClick={onNext}>
					<span>{isLastPart ? "Terminer le cours" : "Partie suivante"}</span>
					<FiChevronRight size={16} />
				</button>
			</div>
		);
	}

	return null;
};

/* ── Chat input pour poser une question ── */
const ChatInput: React.FC<{
	value: string;
	onChange: (val: string) => void;
	onSend: () => void;
	disabled: boolean;
}> = ({ value, onChange, onSend, disabled }) => {
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey && value.trim()) {
			e.preventDefault();
			onSend();
		}
	};
	return (
		<div className="chat-input-area">
			<div className="chat-input-wrapper glass-panel">
				<input
					className="chat-input"
					type="text"
					placeholder="Pose une question à Milo..."
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					autoFocus
				/>
				<button className="chat-send-btn" onClick={onSend} disabled={disabled || !value.trim()} aria-label="Envoyer">
					<FiSend size={16} />
				</button>
			</div>
		</div>
	);
};

const LoadingOverlay: React.FC = () => (
	<div className="scene-loading-overlay">
		<video className="loading-video" src="/loading.webm" autoPlay loop muted playsInline />
		<span className="loading-text">Chargement de la scène...</span>
	</div>
);

const IntroOverlay: React.FC<{ visible: boolean }> = ({ visible }) => {
	if (!visible) return null;
	return (
		<div className="intro-overlay">
			<div className="intro-content">
				<img src="/milo-logo-3D.png" alt="Intro" className="intro-image" />
			</div>
		</div>
	);
};

/* ============================
   Main Component
   ============================ */

const MiloScene: React.FC = () => {
	// Récupère l'id de la leçon depuis les params de route
	const { lessonId } = useParams<{ lessonId: string }>();

	const {
		// Lesson
		phase,
		displayedText,
		isLastPart,
		progressPercent,
		parts,
		currentPartIndex,

		// Chat
		question,
		setQuestion,
		reply,
		handleSendQuestion,
		handleAskQuestion,
		handleNextPart,
		handleBackToLessons,

		// 3D
		activeAnimation,
		setActiveAnimation,
		cameraY,
		isEditing,
		handlePanelClick,
		handleIntroDone,
		showHat,
		setShowHat,
		showGlasses,
		setShowGlasses,
		showControls,
		setShowControls,
		showHelp,
		setShowHelp,
		sceneReady,
		introActive,
		showIntroText,
	} = useMiloScene(Number(lessonId));

	return (
		<div className="milo-scene-root">
			{!sceneReady && <LoadingOverlay />}

			<Scene3D
				cameraY={cameraY}
				reply={reply}
				activeAnimation={activeAnimation}
				showHat={showHat}
				showGlasses={showGlasses}
				text={question}
				isEditing={isEditing}
				onPanelClick={handlePanelClick}
				introActive={introActive}
				onIntroDone={handleIntroDone}
				displayedText={displayedText}
			/>

			<IntroOverlay visible={showIntroText && sceneReady} />

			{/* Barre de progression */}
			{parts.length > 0 && phase !== "loading" && (
				<LessonProgressBar
					current={currentPartIndex + 1}
					total={parts.length}
					percent={progressPercent}
				/>
			)}

			{/* Panneau de cours */}
			{/* {currentPart && phase !== "loading" && (
				<LessonPanel
					title={currentPart.title}
					content={displayedText}
					phase={phase}
					reply={reply}
				/>
			)} */}

			{/* Actions (suite / question / fin) */}
			<LessonActions
				phase={phase}
				isLastPart={isLastPart}
				onNext={handleNextPart}
				onAskQuestion={handleAskQuestion}
				onBackToLessons={handleBackToLessons}
			/>

			{/* Input question — visible uniquement en mode questioning */}
			{(phase === "questioning" || phase === "answering") && (
				<ChatInput
					value={question}
					onChange={setQuestion}
					onSend={handleSendQuestion}
					disabled={phase === "answering"}
				/>
			)}

			{/* Controls panel */}
			<AnimationControls
				activeAnimation={activeAnimation}
				onAnimationChange={setActiveAnimation}
				showHat={showHat}
				onHatToggle={() => setShowHat((h) => !h)}
				showGlasses={showGlasses}
				onGlassesToggle={() => setShowGlasses((g) => !g)}
				visible={showControls}
				onClose={() => setShowControls(false)}
			/>

			{!showControls && (
				<button className="panel-toggle-btn" onClick={() => setShowControls(true)} aria-label="Ouvrir les paramètres">
					<FiSettings size={18} />
				</button>
			)}

			<button className="help-btn" onClick={() => setShowHelp(true)} aria-label="Aide">
				<FiHelpCircle size={22} />
			</button>

			<button className="back-btn" onClick={handleBackToLessons} aria-label="Retour">
				<FiArrowLeft size={22} />
			</button>

			<HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} imageUrl="/help.webp" />
		</div>
	);
};

export default MiloScene;