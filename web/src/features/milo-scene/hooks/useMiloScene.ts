import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
	fetchLessonParts,
	sendChatMessage,
	sendFreeChatMessage,
	sendOpenQuestionChatMessage,
} from "@features/milo-scene/store/chat.queries";
import type { LessonPart } from "@features/milo-scene/store/chat.model";
import type { MiloFreeChatSession } from "@features/milo-scene/store/freeChat.store";
import { useUserStore } from "@shared/store/user/user.store";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LessonPhase =
	| "loading"       // Chargement du cours depuis le back
	| "reading"       // Affichage de la partie en cours (typewriter)
	| "waiting"       // Partie affichée — on attend le choix de l'utilisateur
	| "questioning"   // L'utilisateur pose une question
	| "answering"     // Milo répond à la question
	| "finished";     // Toutes les parties sont terminées

export type OpenQuestionPhase =
	| "idle"
	| "loading"
	| "answering"
	| "submitted"
	| "helping"
	| "feedback";

export type OpenQuestionInputMode = "answer" | "help";

const getUserDisplayName = (
	user: ReturnType<typeof useUserStore.getState>["user"],
) => {
	if (!user) return "l'élève";
	return `${user.first_name ?? ""}`.trim() || user.username || "l'élève";
};

const buildLessonContext = (lessonParts: LessonPart[]) =>
	lessonParts
		.map((part) => `${part.title}\n${part.content}`)
		.join("\n\n")
		.trim();

const buildGeneratePrompt = (context: string, studentName: string) =>
	`Tu es un professeur bienveillant. 
Génère UNE SEULE question ouverte de réflexion sur le thème suivant : "${context}".
La question doit être précise, pédagogique et adaptée à un collégien.
L'élève s'appelle "${studentName}".
Continue la conversation en cours sans saluer l'élève.
Ne commence jamais par "Bonjour", "Salut" ou "Bonjour toi".
Réponds UNIQUEMENT avec la question, sans introduction ni numérotation.`;

const buildFeedbackPrompt = (
	question: string,
	answer: string,
	context: string,
	studentName: string,
) =>
	`Tu es un professeur bienveillant qui corrige une réponse d'élève.

Notion : "${context}"
Question : "${question}"
Réponse de l'élève : "${answer}"

Donne un retour constructif et encourageant en 3 parties :
1. Ce qui est bien dans la réponse
2. Ce qui pourrait être amélioré ou complété
3. Une reformulation idéale courte de la bonne réponse

Continue la conversation en cours sans saluer l'élève.
Ne commence jamais par "Bonjour", "Salut" ou "Bonjour toi".
Sois chaleureux, bref et pédagogique. L'élève s'appelle "${studentName}".`;

const buildHelpPrompt = (
	question: string,
	helpRequest: string,
	context: string,
	studentName: string,
) =>
	`Tu es un professeur bienveillant qui aide un élève sans donner directement toute la réponse.

Notion : "${context}"
Question ouverte actuelle : "${question}"
Demande de l'élève : "${helpRequest}"

L'élève s'appelle "${studentName}".
Réponds à sa demande avec une aide courte, claire et progressive.
Donne un indice, une reformulation ou une piste de réflexion, mais ne rédige pas la réponse complète à sa place.
Continue la conversation en cours sans saluer l'élève.
Ne commence jamais par "Bonjour", "Salut" ou "Bonjour toi".`;

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useMiloScene = (
	lessonId?: number,
	freeChatSession?: MiloFreeChatSession | null,
	openQuestionMode = false,
) => {
	const navigate = useNavigate();
	const user = useUserStore((state) => state.user);
	const isFreeChatMode = Boolean(freeChatSession);
	const isOpenQuestionMode = openQuestionMode && !isFreeChatMode;
	const studentName = getUserDisplayName(user);

	// ── Lesson state ──────────────────────────────────────────────────────────
	const [parts, setParts] = useState<LessonPart[]>([]);
	const [currentPartIndex, setCurrentPartIndex] = useState(0);
	const [phase, setPhase] = useState<LessonPhase>("loading");
	const [displayedText, setDisplayedText] = useState("");

	// ── Chat state ────────────────────────────────────────────────────────────
	const [question, setQuestion] = useState("");
	const [reply, setReply] = useState("");

	// ── Open question state ───────────────────────────────────────────────────
	const [openQuestionPhase, setOpenQuestionPhase] =
		useState<OpenQuestionPhase>("idle");
	const [openQuestionInputMode, setOpenQuestionInputMode] =
		useState<OpenQuestionInputMode>("answer");
	const [openQuestionText, setOpenQuestionText] = useState("");
	const [openQuestionCount, setOpenQuestionCount] = useState(0);
	const [openQuestionConversationId, setOpenQuestionConversationId] =
		useState("");
	const openQuestionConversationIdRef = useRef("");
	const [openQuestionResponseKind, setOpenQuestionResponseKind] =
		useState<"help" | "feedback" | null>(null);

	// ── 3D state ──────────────────────────────────────────────────────────────
	const [activeAnimation, setActiveAnimation] = useState("Idle");
	const [cameraY, setCameraY] = useState(0);
	const [isEditing, setIsEditing] = useState(false);
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

	const generateOpenQuestion = useCallback(
		async (lessonParts: LessonPart[]) => {
			const context = buildLessonContext(lessonParts) || "la notion";

			setPhase("loading");
			setOpenQuestionPhase("loading");
			setOpenQuestionInputMode("answer");
			setQuestion("");
			setReply("");
			setOpenQuestionResponseKind(null);
			setActiveAnimation("Thinking");
			setCameraY(0);
			setIsEditing(false);

			try {
				const data = await sendOpenQuestionChatMessage({
					chatRequest: buildGeneratePrompt(context, studentName),
					conversationId: openQuestionConversationIdRef.current,
				});

				if (data.conversationId) {
					openQuestionConversationIdRef.current = data.conversationId;
					setOpenQuestionConversationId(data.conversationId);
				}

				setOpenQuestionText(data.text);
				setDisplayedText(data.text);
				setPhase("waiting");
				setOpenQuestionPhase("answering");
				setActiveAnimation("Idle");
				setCameraY(0);
				setIsEditing(false);
			} catch (err) {
				console.error("Erreur génération question ouverte :", err);
				setOpenQuestionText("");
				setReply("Désolé, je n'arrive pas à générer une question pour le moment.");
				setPhase("waiting");
				setOpenQuestionPhase("feedback");
				setActiveAnimation("Idle");
			}
		},
		[studentName],
	);

	// ─── Chargement du cours ─────────────────────────────────────────────────
	useEffect(() => {
		if (isFreeChatMode) return;
		if (!lessonId || Number.isNaN(lessonId)) {
			setPhase("waiting");
			return;
		}

		const controller = new AbortController();

		const load = async () => {
			try {
				setPhase("loading");
				const lessonParts = await fetchLessonParts(lessonId, "", controller.signal);
				setParts(lessonParts);
				setCurrentPartIndex(0);
				if (isOpenQuestionMode) {
					await generateOpenQuestion(lessonParts);
				} else {
					setPhase("reading");
				}
			} catch (err: any) {
				if (err.name === 'CanceledError') return;
            	console.error("Erreur :", err);
			}
		};

		load();
		return () => { controller.abort(); }; // Nettoyage
	}, [lessonId, isFreeChatMode, isOpenQuestionMode, generateOpenQuestion]);

	// ─── Session OCR / chat libre ─────────────────────────────────────────────
	useEffect(() => {
		if (!freeChatSession) return;

		setParts([
			{
				id: 1,
				title: freeChatSession.sourceLabel,
				content: freeChatSession.initialReply,
			},
		]);
		setCurrentPartIndex(0);
		setReply("");
		setPhase("reading");
	}, [freeChatSession]);

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
		if (isFreeChatMode || isOpenQuestionMode) {
			setPhase("finished");
			setActiveAnimation("Idle");
			return;
		}

		if (nextIndex >= parts.length) {
			setPhase("finished");
			setActiveAnimation("Idle");
		} else {
			setCurrentPartIndex(nextIndex);
			setReply("");
			setPhase("reading");
		}
	}, [currentPartIndex, parts.length, isFreeChatMode, isOpenQuestionMode]);

	// ─── Ouvrir le mode question ──────────────────────────────────────────────
	const handleAskQuestion = useCallback(() => {
		setPhase("questioning");
		setCameraY(-3);
		setIsEditing(true);
	}, []);

	const handleOpenQuestionInputModeChange = useCallback(
		(mode: OpenQuestionInputMode) => {
			setOpenQuestionInputMode(mode);
			setPhase("waiting");
			setCameraY(-3);
			setIsEditing(true);
		},
		[],
	);

	const handleOpenQuestionReviewBoard = useCallback(() => {
		setPhase("waiting");
		setCameraY(0);
		setIsEditing(false);
	}, []);

	const handleSubmitOpenQuestionInput = useCallback(async () => {
		if (!question.trim() || !openQuestionText.trim()) return;

		const inputText = question.trim();
		const context = buildLessonContext(parts) || "la notion";
		const isHelpRequest = openQuestionInputMode === "help";

		setQuestion("");
		setPhase("answering");
		setOpenQuestionPhase(isHelpRequest ? "helping" : "submitted");
		setReply("");
		setActiveAnimation("Thinking");
		setCameraY(0);
		setIsEditing(false);
		setOpenQuestionResponseKind(null);

		try {
			const data = await sendOpenQuestionChatMessage({
				chatRequest: isHelpRequest
					? buildHelpPrompt(openQuestionText, inputText, context, studentName)
					: buildFeedbackPrompt(openQuestionText, inputText, context, studentName),
				conversationId: openQuestionConversationId,
			});

			if (data.conversationId) {
				openQuestionConversationIdRef.current = data.conversationId;
				setOpenQuestionConversationId(data.conversationId);
			}

			setReply(
				data.text ||
					(isHelpRequest
						? "Je n'ai pas réussi à formuler un indice pour le moment."
						: "Je n'ai pas réussi à corriger ta réponse pour le moment."),
			);
			setOpenQuestionResponseKind(isHelpRequest ? "help" : "feedback");
			setActiveAnimation("Explaining");

			if (isHelpRequest) {
				setOpenQuestionPhase("answering");
				setOpenQuestionInputMode("answer");
				setPhase("waiting");
				setCameraY(-3);
				setIsEditing(true);
			} else {
				setOpenQuestionCount((current) => current + 1);
				setOpenQuestionPhase("feedback");
				setPhase("waiting");
			}
		} catch (err) {
			console.error("Erreur question ouverte :", err);
			setReply(
				isHelpRequest
					? "Désolé, je n'arrive pas à donner un indice pour le moment."
					: "Désolé, je n'arrive pas à corriger ta réponse pour le moment.",
			);
			setOpenQuestionResponseKind(isHelpRequest ? "help" : "feedback");
			setPhase("waiting");
			setOpenQuestionPhase(isHelpRequest ? "answering" : "feedback");
			setActiveAnimation("Idle");
		}
	}, [
		openQuestionConversationId,
		openQuestionInputMode,
		openQuestionText,
		parts,
		question,
		studentName,
	]);

	// ─── Envoyer une question à Milo ──────────────────────────────────────────
	const handleSendQuestion = useCallback(async () => {
		if (!question.trim()) return;

		if (isOpenQuestionMode) {
			await handleSubmitOpenQuestionInput();
			return;
		}

		setPhase("answering");
		setActiveAnimation("Thinking");
		setCameraY(0);
		setIsEditing(false);

		try {
			const currentPart = parts[currentPartIndex];
			if (!isFreeChatMode && !currentPart) return;
			const lessonContext = currentPart?.content ?? "";

			const response =
				isFreeChatMode && freeChatSession
					? await sendFreeChatMessage(
							question,
							freeChatSession.conversationId,
							freeChatSession.context,
						)
					: await sendChatMessage(lessonContext, question);
			setReply(response);
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
	}, [
		question,
		isOpenQuestionMode,
		parts,
		currentPartIndex,
		isFreeChatMode,
		freeChatSession,
		handleSubmitOpenQuestionInput,
	]);

	// ─── Clic sur la feuille 3D ───────────────────────────────────────────────
	const handlePanelClick = useCallback(() => {
		if (isOpenQuestionMode) return;
		if (phase !== "waiting" && phase !== "questioning") return;
		const isOpen = isEditing;
		setCameraY(isOpen ? 0 : -3);
		setIsEditing(!isOpen);
		if (!isOpen) setPhase("questioning");
		else setPhase("waiting");
	}, [isEditing, phase, isOpenQuestionMode]);

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

	// ─── Retour au détail du cours (COURSE_DETAIL) ────────────────────────────
	const handleBackToCourseDetail = useCallback(() => {
		if (!lessonId || Number.isNaN(lessonId)) {
			navigate(-1);
			return;
		}
		// ⚠️ Adapte le chemin à ta constante de route COURSE_DETAIL
		// ex: navigate(ROUTES.COURSE_DETAIL.replace(":id", String(lessonId)));
		navigate(`/course/${lessonId}`);
	}, [lessonId, navigate]);

	const handleStartQcm = useCallback(() => {
		if (!lessonId || Number.isNaN(lessonId)) return;
		navigate(`/qcm/${lessonId}`);
	}, [lessonId, navigate]);

	const handleStartOpenQuestion = useCallback(() => {
		if (!lessonId || Number.isNaN(lessonId)) return;
		navigate(`/course-milo/${lessonId}/question-ouverte`);
	}, [lessonId, navigate]);

	const handleOpenQuestionNewQuestion = useCallback(() => {
		void generateOpenQuestion(parts);
	}, [generateOpenQuestion, parts]);

	// ─── Données dérivées ─────────────────────────────────────────────────────
	const currentPart = parts[currentPartIndex] ?? null;
	const isLastPart = currentPartIndex === parts.length - 1;
	const progressPercent =
		parts.length > 0
			? Math.round(((currentPartIndex + 1) / parts.length) * 100)
			: 0;
	const openQuestionDisplayText = (() => {
		if (!isOpenQuestionMode) return displayedText;
		if (!openQuestionText && reply) return reply;
		if (!reply) return openQuestionText || displayedText;

		const label =
			openQuestionResponseKind === "feedback"
				? "Correction de Milo"
				: "Aide de Milo";
		return `${openQuestionText}\n\n${label} :\n${reply}`;
	})();

	return {
		// Lesson
		phase,
		parts,
		currentPart,
		currentPartIndex,
		displayedText: openQuestionDisplayText,
		isLastPart,
		progressPercent,
		isFreeChatMode,
		isOpenQuestionMode,
		openQuestionPhase,
		openQuestionInputMode,
		setOpenQuestionInputMode,
		handleOpenQuestionInputModeChange,
		handleOpenQuestionReviewBoard,
		openQuestionCount,
		openQuestionResponseKind,
		sourceLabel: freeChatSession?.sourceLabel,

		// Chat
		question,
		setQuestion,
		reply,
		handleSendQuestion,
		handleAskQuestion,
		handleNextPart,
		handleBackToLessons,
		handleBackToCourseDetail,
		handleStartQcm,
		handleStartOpenQuestion,
		handleOpenQuestionNewQuestion,

		// 3D / Scene
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
	};
};