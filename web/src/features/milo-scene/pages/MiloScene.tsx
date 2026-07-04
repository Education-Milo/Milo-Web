import React, {
	Suspense,
	useRef,
	useState,
	useEffect,
	useCallback,
	useMemo,
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
	FiArrowUp,
	FiChevronRight,
	FiMessageCircle,
	FiCheckCircle,
	FiEdit3,
	FiRefreshCw,
	FiMaximize2,
	FiChevronLeft,
} from "react-icons/fi";
import { useLocation, useParams } from "react-router-dom";
import HelpModal from "@features/milo-scene/components/HelpModal.component";
import { useMiloScene } from "@features/milo-scene/hooks/useMiloScene";
import "@features/milo-scene/styles/MiloScene.css";
import { useMiloInventoryStore } from "@features/my-milo/store/miloInventory.store";
import { MILO_ITEMS } from "@features/my-milo/data/miloItems.data";
import {
	useMiloFreeChatStore,
	type MiloFreeChatSession,
} from "@features/milo-scene/store/freeChat.store";

/* ============================
   3D Models — inchangés
   ============================ */

interface MiloModelProps {
	modelPath: string;
	activeAnimation: string;
}

function MiloModel({ modelPath, activeAnimation }: MiloModelProps) {
	const group = useRef<THREE.Group>(null);
	const { scene, animations } = useGLTF(modelPath);
	const { actions } = useAnimations(animations, group);
	const prevAnimation = useRef<string | null>(null);

	const equippedItemIds = useMiloInventoryStore((state) => state.equippedItemIds);

	const equippedMeshNames = useMemo(() => {
		return equippedItemIds
			.map((id) => MILO_ITEMS.find((i) => i.id === id)?.meshName)
			.filter(Boolean) as string[];
	}, [equippedItemIds]);

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
		const knownMeshNames = MILO_ITEMS.map((i) => i.meshName).filter(Boolean) as string[];
		
		scene.traverse((child) => {
			if (knownMeshNames.includes(child.name)) {
				child.visible = equippedMeshNames.includes(child.name);
			}
		});
	}, [scene, equippedMeshNames]);

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
	text: string;
	isEditing: boolean;
	onPanelClick: () => void;
	introActive: boolean;
	onIntroDone: () => void;
	displayedText: string;
}> = ({ cameraY, reply, activeAnimation, text, isEditing, onPanelClick, introActive, onIntroDone, displayedText }) => (
	<Canvas shadows camera={{ position: [0, 0, 5], fov: 60 }} className="three-canvas">
		<Suspense fallback={null}>
			<ClassroomLighting />
			<Environment preset="park" />
			<Classroom modelPath="/classroom.glb" />
			<MiloModel modelPath="/MiloV9.glb" activeAnimation={activeAnimation} />
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

const ANIMATIONS = ["Idle", "Thinking", "Explaining", "Wrong", "Disapointed"] as const;
const BOARD_FULL_TEXT_MIN_LENGTH = 650;
const BOARD_PAGE_CHARS_PER_LINE = 54;
const BOARD_PAGE_VISIBLE_LINES = 9;

const AnimationControls: React.FC<{
	activeAnimation: string;
	onAnimationChange: (anim: string) => void;
	visible: boolean;
	onClose: () => void;
}> = ({ activeAnimation, onAnimationChange, visible, onClose }) => (
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
	isFreeChatMode: boolean;
	isOpenQuestionMode: boolean;
	openQuestionPhase: string;
	openQuestionInputMode: "answer" | "help";
	onNext: () => void;
	onAskQuestion: () => void;
	onOpenQuestionModeChange: (mode: "answer" | "help") => void;
	onBackToLessons: () => void;
	onStartQcm: () => void;
	onStartOpenQuestion: () => void;
	onOpenQuestionNewQuestion: () => void;
}> = ({
	phase,
	isLastPart,
	isFreeChatMode,
	isOpenQuestionMode,
	openQuestionPhase,
	openQuestionInputMode,
	onNext,
	onAskQuestion,
	onOpenQuestionModeChange,
	onBackToLessons,
	onStartQcm,
	onStartOpenQuestion,
	onOpenQuestionNewQuestion,
}) => {
	if (phase === "loading") {
		return (
			<div className="lesson-actions glass-panel">
				<span className="lesson-loading-text">
					{isFreeChatMode
						? "Milo prépare la discussion..."
						: isOpenQuestionMode
							? "Milo prépare une question..."
						: "Milo prépare ton cours..."}
				</span>
			</div>
		);
	}

	if (isOpenQuestionMode && phase === "answering") {
		return (
			<div className="lesson-actions glass-panel">
				<span className="lesson-loading-text">
					{openQuestionPhase === "helping"
						? "Milo prépare une aide..."
						: "Milo corrige ta réponse..."}
				</span>
			</div>
		);
	}

	if (phase === "finished") {
		return (
			<div className="lesson-actions glass-panel lesson-finished">
				<p>
					{isFreeChatMode
						? "Discussion terminée."
						: isOpenQuestionMode
							? "Tu peux continuer la discussion ou revenir aux cours."
						: "🎉 Bravo ! Tu as terminé cette leçon !"}
				</p>
				{isFreeChatMode || isOpenQuestionMode ? (
					<button className="lesson-btn lesson-btn--primary" onClick={onBackToLessons}>
						<FiArrowLeft size={16} />
						Retour
					</button>
				) : (
					<div className="lesson-finished-choices">
						<button className="lesson-btn lesson-btn--primary" onClick={onStartQcm}>
							<FiCheckCircle size={16} />
							Faire un QCM
						</button>
						<button className="lesson-btn lesson-btn--secondary" onClick={onStartOpenQuestion}>
							<FiEdit3 size={16} />
							Question ouverte
						</button>
						<button className="lesson-btn lesson-btn--secondary" onClick={onBackToLessons}>
							<FiArrowLeft size={16} />
							Choisir un nouveau cours
						</button>
					</div>
				)}
			</div>
		);
	}

	if (phase === "waiting") {
		if (isOpenQuestionMode) {
			if (openQuestionPhase === "feedback") {
				return (
					<div className="lesson-actions glass-panel">
						<button className="lesson-btn lesson-btn--primary" onClick={onOpenQuestionNewQuestion}>
							<FiRefreshCw size={16} />
							<span>Nouvelle question</span>
						</button>
						<button className="lesson-btn lesson-btn--secondary" onClick={onBackToLessons}>
							<FiArrowLeft size={16} />
							<span>Retour au cours</span>
						</button>
					</div>
				);
			}

			return (
				<div className="lesson-actions glass-panel">
					<button
						className={`lesson-btn lesson-btn--secondary ${openQuestionInputMode === "answer" ? "lesson-btn--active" : ""}`}
						onClick={() => onOpenQuestionModeChange("answer")}
					>
						<FiEdit3 size={16} />
						<span>Répondre</span>
					</button>
					<button
						className={`lesson-btn lesson-btn--secondary ${openQuestionInputMode === "help" ? "lesson-btn--active" : ""}`}
						onClick={() => onOpenQuestionModeChange("help")}
					>
						<FiHelpCircle size={16} />
						<span>Demander de l'aide</span>
					</button>
				</div>
			);
		}

		return (
			<div className="lesson-actions glass-panel">
				<button className="lesson-btn lesson-btn--secondary" onClick={onAskQuestion}>
					<FiMessageCircle size={16} />
					<span>J'ai une question</span>
				</button>
				<button className="lesson-btn lesson-btn--primary" onClick={onNext}>
					<span>
						{isFreeChatMode
							? "Terminer la discussion"
							: isLastPart
								? "Terminer le cours"
								: "Partie suivante"}
					</span>
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
	placeholder?: string;
}> = ({ value, onChange, onSend, disabled, placeholder = "Pose une question à Milo..." }) => {
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
					placeholder={placeholder}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					autoFocus
					disabled={disabled}
				/>
				<button className="chat-send-btn" onClick={onSend} disabled={disabled || !value.trim()} aria-label="Envoyer">
					<FiSend size={16} />
				</button>
			</div>
		</div>
	);
};

const getBoardLineCount = (line: string) =>
	Math.max(1, Math.ceil(line.length / BOARD_PAGE_CHARS_PER_LINE));

const splitLongBoardLine = (line: string) => {
	const chunks: string[] = [];
	const maxChars = BOARD_PAGE_CHARS_PER_LINE * BOARD_PAGE_VISIBLE_LINES;

	for (let index = 0; index < line.length; index += maxChars) {
		chunks.push(line.slice(index, index + maxChars));
	}

	return chunks.length ? chunks : [line];
};

const splitBoardTextIntoPages = (text: string) => {
	if (!text.trim()) return [text];

	const pages: string[] = [];
	let currentLines: string[] = [];
	let currentLineCount = 0;

	const pushPage = () => {
		pages.push(currentLines.join("\n").trim());
		currentLines = [];
		currentLineCount = 0;
	};

	text.split("\n").forEach((line) => {
		const lineCount = getBoardLineCount(line);

		if (lineCount > BOARD_PAGE_VISIBLE_LINES) {
			if (currentLines.length) pushPage();
			splitLongBoardLine(line).forEach((chunk) => {
				currentLines = [chunk];
				currentLineCount = getBoardLineCount(chunk);
				pushPage();
			});
			return;
		}

		if (
			currentLines.length &&
			currentLineCount + lineCount > BOARD_PAGE_VISIBLE_LINES
		) {
			pushPage();
		}

		currentLines.push(line);
		currentLineCount += lineCount;
	});

	if (currentLines.length) pushPage();

	return pages.length ? pages : [text];
};

const BoardPaginationControls: React.FC<{
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
	if (totalPages <= 1) return null;

	return (
		<div className="board-pagination-controls glass-panel" aria-label="Pages du tableau">
			<button
				type="button"
				onClick={() => onPageChange(currentPage - 1)}
				disabled={currentPage === 0}
				aria-label="Page precedente du tableau"
				title="Page precedente"
			>
				<FiChevronLeft size={18} />
			</button>
			<span>
				{currentPage + 1} / {totalPages}
			</span>
			<button
				type="button"
				onClick={() => onPageChange(currentPage + 1)}
				disabled={currentPage >= totalPages - 1}
				aria-label="Page suivante du tableau"
				title="Page suivante"
			>
				<FiChevronRight size={18} />
			</button>
		</div>
	);
};

const LoadingOverlay: React.FC = () => (
	<div className="scene-loading-overlay">
		<video className="loading-video" src="/loading.webm" autoPlay loop muted playsInline />
		<span className="loading-text">Chargement de la scène...</span>
	</div>
);

const BoardFullTextModal: React.FC<{
	text: string;
	isOpen: boolean;
	onClose: () => void;
}> = ({ text, isOpen, onClose }) => {
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			document.body.style.overflow = "auto";
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div className="board-modal-overlay" onClick={onClose}>
			<div
				className="board-modal-content glass-panel"
				onClick={(event) => event.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="board-modal-title"
			>
				<div className="board-modal-header">
					<h2 id="board-modal-title">Tableau</h2>
					<button className="board-modal-close" onClick={onClose} aria-label="Fermer">
						<FiX size={20} />
					</button>
				</div>
				<div className="board-modal-scroll">
					<p>{text}</p>
				</div>
			</div>
		</div>
	);
};

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
	const location = useLocation();
	const isOpenQuestionRoute = location.pathname.includes("/question-ouverte");
	const storedFreeChatSession = useMiloFreeChatStore((state) => state.session);
	const routedFreeChatSession = (
		location.state as { freeChatSession?: MiloFreeChatSession } | null
	)?.freeChatSession;
	const freeChatSession = routedFreeChatSession ?? storedFreeChatSession;
	const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
	const [boardPageIndex, setBoardPageIndex] = useState(0);

	const {
		// Lesson
		phase,
		displayedText,
		isLastPart,
		progressPercent,
		parts,
		currentPartIndex,
		isFreeChatMode,
		isOpenQuestionMode,
		openQuestionPhase,
		openQuestionInputMode,
		handleOpenQuestionInputModeChange,
		handleOpenQuestionReviewBoard,

		// Chat
		question,
		setQuestion,
		reply,
		handleSendQuestion,
		handleAskQuestion,
		handleNextPart,
		handleBackToLessons,
		handleStartQcm,
		handleStartOpenQuestion,
		handleOpenQuestionNewQuestion,

		// 3D
		activeAnimation,
		setActiveAnimation,
		cameraY,
		isEditing,
		handlePanelClick,
		handleIntroDone,
		showControls,
		setShowControls,
		showHelp,
		setShowHelp,
		sceneReady,
		introActive,
		showIntroText,
	} = useMiloScene(lessonId ? Number(lessonId) : undefined, freeChatSession, isOpenQuestionRoute);

	const isOpenQuestionBusy =
		openQuestionPhase === "submitted" || openQuestionPhase === "helping";
	const showOpenQuestionInput =
		isOpenQuestionMode &&
		((openQuestionPhase === "answering" && isEditing) || isOpenQuestionBusy);
	const showRegularChatInput =
		!isOpenQuestionMode && (phase === "questioning" || phase === "answering");
	const showReviewBoardButton =
		isOpenQuestionMode && isEditing && openQuestionPhase === "answering";
	const boardFullText = isOpenQuestionMode ? displayedText : reply || displayedText;
	const boardPages = useMemo(() => splitBoardTextIntoPages(boardFullText), [boardFullText]);
	const boardPageText = boardPages[boardPageIndex] ?? boardPages[0] ?? "";
	const showBoardFullTextButton =
		phase !== "loading" && boardFullText.trim().length > BOARD_FULL_TEXT_MIN_LENGTH;
	const handleBoardPageChange = useCallback(
		(page: number) => {
			setBoardPageIndex(Math.min(boardPages.length - 1, Math.max(0, page)));
		},
		[boardPages.length],
	);
	const chatPlaceholder = isOpenQuestionMode
		? isOpenQuestionBusy
			? "Milo prépare..."
			: openQuestionInputMode === "help"
				? "Demande un indice ou une précision..."
				: "Écris ta réponse..."
		: "Pose une question à Milo...";

	useEffect(() => {
		setBoardPageIndex(0);
	}, [boardFullText]);

	useEffect(() => {
		setBoardPageIndex((current) => Math.min(current, boardPages.length - 1));
	}, [boardPages.length]);

	return (
		<div className="milo-scene-root">
			{!sceneReady && <LoadingOverlay />}

			<Scene3D
				cameraY={cameraY}
				reply=""
				activeAnimation={activeAnimation}
				text={question}
				isEditing={isEditing}
				onPanelClick={handlePanelClick}
				introActive={introActive}
				onIntroDone={handleIntroDone}
				displayedText={boardPageText}
			/>

			<IntroOverlay visible={showIntroText && sceneReady} />

			{showBoardFullTextButton && (
				<button
					className="board-full-text-btn glass-panel"
					onClick={() => setIsBoardModalOpen(true)}
					aria-label="Lire tout le tableau"
					title="Lire tout le tableau"
				>
					<FiMaximize2 size={18} />
					<span>Lire tout</span>
				</button>
			)}

			<BoardPaginationControls
				currentPage={boardPageIndex}
				totalPages={boardPages.length}
				onPageChange={handleBoardPageChange}
			/>

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
				isFreeChatMode={isFreeChatMode}
				isOpenQuestionMode={isOpenQuestionMode}
				openQuestionPhase={openQuestionPhase}
				openQuestionInputMode={openQuestionInputMode}
				onNext={handleNextPart}
				onAskQuestion={handleAskQuestion}
				onOpenQuestionModeChange={handleOpenQuestionInputModeChange}
				onBackToLessons={handleBackToLessons}
				onStartQcm={handleStartQcm}
				onStartOpenQuestion={handleStartOpenQuestion}
				onOpenQuestionNewQuestion={handleOpenQuestionNewQuestion}
			/>

			{/* Input question / réponse */}
			{(showRegularChatInput || showOpenQuestionInput) && (
				<ChatInput
					value={question}
					onChange={setQuestion}
					onSend={handleSendQuestion}
					disabled={phase === "answering"}
					placeholder={chatPlaceholder}
				/>
			)}

			{showReviewBoardButton && (
				<button
					className="review-board-btn glass-panel"
					onClick={handleOpenQuestionReviewBoard}
					aria-label="Revoir le tableau"
					title="Revoir le tableau"
				>
					<FiArrowUp size={18} />
				</button>
			)}

			{/* Animation controls disabled for now. */}
			{false && (
				<AnimationControls
					activeAnimation={activeAnimation}
					onAnimationChange={setActiveAnimation}
					visible={showControls}
					onClose={() => setShowControls(false)}
				/>
			)}

			{false && !showControls && (
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
			<BoardFullTextModal
				text={boardFullText}
				isOpen={isBoardModalOpen}
				onClose={() => setIsBoardModalOpen(false)}
			/>
		</div>
	);
};

export default MiloScene;
