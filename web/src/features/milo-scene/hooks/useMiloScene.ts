import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLessonParts, sendChatMessage } from "@features/milo-scene/store/chat.queries";
import type { LessonPart } from "@features/milo-scene/store/chat.model";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LessonPhase =
	| "loading"       // Chargement du cours depuis le back
	| "reading"       // Affichage de la partie en cours (typewriter)
	| "waiting"       // Partie affichée — on attend le choix de l'utilisateur
	| "questioning"   // L'utilisateur pose une question
	| "answering"     // Milo répond à la question
	| "finished";     // Toutes les parties sont terminées

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useMiloScene = (lessonId: number) => {
	const navigate = useNavigate();

	// ── Lesson state ──────────────────────────────────────────────────────────
	const [parts, setParts] = useState<LessonPart[]>([]);
	const [currentPartIndex, setCurrentPartIndex] = useState(0);
	const [phase, setPhase] = useState<LessonPhase>("loading");
	const [displayedText, setDisplayedText] = useState("");

	// ── Chat state ────────────────────────────────────────────────────────────
	const [question, setQuestion] = useState("");
	const [reply, setReply] = useState("");
	const [conversationId, setConversationId] = useState<string | null>(null);

	// ── 3D state ──────────────────────────────────────────────────────────────
	const [activeAnimation, setActiveAnimation] = useState("Idle");
	const [cameraY, setCameraY] = useState(0);
	const [isEditing, setIsEditing] = useState(false);
	const [showHat, setShowHat] = useState(true);
	const [showGlasses, setShowGlasses] = useState(true);
	const [showControls, setShowControls] = useState(true);
	const [showHelp, setShowHelp] = useState(false);
	const [sceneReady, setSceneReady] = useState(false);
	const [introActive, setIntroActive] = useState(true);
	const [showIntroText, setShowIntroText] = useState(true);

	// ─── Init scène ──────────────────────────────────────────────────────────
	useEffect(() => {
		const t = setTimeout(() => setSceneReady(true), 800);
		return () => clearTimeout(t);
	}, []);

	// ─── Chargement du cours ─────────────────────────────────────────────────
	useEffect(() => {
		const controller = new AbortController();

		const load = async () => {
			try {
				setPhase("loading");
				const lessonParts = await fetchLessonParts(lessonId, "", controller.signal);
				setParts(lessonParts);
				setCurrentPartIndex(0);
				setPhase("reading");
			} catch (err: any) {
				if (err.name === 'CanceledError') return;
            	console.error("Erreur :", err);
			}
		};

		load();
		return () => { controller.abort(); }; // Nettoyage
	}, [lessonId]);

	// ─── Typewriter : affiche le texte de la partie courante caractère par caractère
	useEffect(() => {
		if (phase !== "reading" || parts.length === 0) return;

		const currentPart = parts[currentPartIndex];
		if (!currentPart) return;

		setDisplayedText("");
		setActiveAnimation("Explaining");

		let i = 0;
		const interval = setInterval(() => {
			i++;
			setDisplayedText(currentPart.content.slice(0, i));
			if (i >= currentPart.content.length) {
				clearInterval(interval);
				setActiveAnimation("Idle");
				setPhase("waiting");
			}
		}, 18); // vitesse d'écriture en ms

		return () => clearInterval(interval);
	}, [phase, currentPartIndex, parts]);

	// ─── Passer à la partie suivante ─────────────────────────────────────────
	const handleNextPart = useCallback(() => {
		const nextIndex = currentPartIndex + 1;
		if (nextIndex >= parts.length) {
			setPhase("finished");
			setActiveAnimation("Idle");
		} else {
			setCurrentPartIndex(nextIndex);
			setReply("");
			setPhase("reading");
		}
	}, [currentPartIndex, parts.length]);

	// ─── Ouvrir le mode question ──────────────────────────────────────────────
	const handleAskQuestion = useCallback(() => {
		setPhase("questioning");
		setCameraY(-3);
		setIsEditing(true);
	}, []);

	// ─── Envoyer une question à Milo ──────────────────────────────────────────
	const handleSendQuestion = useCallback(async () => {
		if (!question.trim()) return;

		const currentPart = parts[currentPartIndex];
		if (!currentPart) return;

		setPhase("answering");
		setActiveAnimation("Thinking");
		setCameraY(0);
		setIsEditing(false);

		try {
			const response = await sendChatMessage(currentPart.content, question, conversationId || undefined);
			setConversationId(response.conversation_id);
			setReply(response.reply);
			setActiveAnimation("Explaining");
			setTimeout(() => {
				setActiveAnimation("Idle");
				setPhase("waiting");
			}, 4000);
		} catch (err) {
			console.error("Erreur envoi question :", err);
			setReply("Désolé, une erreur est survenue. Réessaie !");
			setPhase("waiting");
			setActiveAnimation("Idle");
		}

		setQuestion("");
	}, [question, parts, currentPartIndex, conversationId]);

	// ─── Clic sur la feuille 3D ───────────────────────────────────────────────
	const handlePanelClick = useCallback(() => {
		if (phase !== "waiting" && phase !== "questioning") return;
		const isOpen = isEditing;
		setCameraY(isOpen ? 0 : -3);
		setIsEditing(!isOpen);
		if (!isOpen) setPhase("questioning");
		else setPhase("waiting");
	}, [isEditing, phase]);

	// ─── Fin de l'intro caméra ────────────────────────────────────────────────
	const handleIntroDone = useCallback(() => {
		setTimeout(() => {
			setShowIntroText(false);
			setIntroActive(false);
		}, 1500);
	}, []);

	// ─── Retour aux leçons ────────────────────────────────────────────────────
	const handleBackToLessons = useCallback(() => {
		navigate(-1);
	}, [navigate]);

	// ─── Données dérivées ─────────────────────────────────────────────────────
	const currentPart = parts[currentPartIndex] ?? null;
	const isLastPart = currentPartIndex === parts.length - 1;
	const progressPercent =
		parts.length > 0
			? Math.round(((currentPartIndex + 1) / parts.length) * 100)
			: 0;

	return {
		// Lesson
		phase,
		parts,
		currentPart,
		currentPartIndex,
		displayedText,
		isLastPart,
		progressPercent,

		// Chat
		question,
		setQuestion,
		reply,
		handleSendQuestion,
		handleAskQuestion,
		handleNextPart,
		handleBackToLessons,

		// 3D / Scene
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
	};
};