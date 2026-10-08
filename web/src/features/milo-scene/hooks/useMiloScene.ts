import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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
import { useActivityTracker } from "@shared/hooks/useActivityTracker";
import { clampText, getAiErrorMessage } from "@shared/lib/aiRequests";
import { ROUTES } from "@shared/constants/routes";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LessonPhase =
	| "loading"   // Chargement du cours depuis le back
	| "reading"   // Milo écrit la partie au tableau
	| "ready"     // Partie affichée : l'élève lit, questionne, avance
	| "finished"; // Toutes les parties sont lues

export type OpenQuestionPhase = "loading" | "answering" | "feedback";
export type OpenQuestionInputMode = "answer" | "help";

/** Ce que l'élève demande à Milo : sert à choisir la consigne et l'étiquette. */
export type MiloAction =
	| "question"   // Question libre tapée par l'élève
	| "explain"    // Ré-expliquer un passage
	| "example"    // Un exemple concret
	| "exercise"   // Un exercice sur un passage
	| "simplify"   // Ré-expliquer toute la partie
	| "summary"    // Résumer la partie
	| "answer"     // Réponse à un exercice de Milo
	| "solution"   // Correction d'un exercice
	| "quizWhy"    // Pourquoi une réponse de quiz était fausse
	| "openAnswer" // Réponse à la question ouverte
	| "openHelp"   // Indice sur la question ouverte
	| "notes";     // Réviser les notes du post-it

export type MiloAnimation = "Idle" | "Thinking" | "Explaining" | "Wrong" | "Disapointed";

export interface ThreadMessage {
	id: string;
	from: "student" | "milo";
	action: MiloAction;
	text: string;
	/** Passage du tableau concerné, affiché en citation */
	quote?: string;
	pending?: boolean;
	failed?: boolean;
	/** Exercice proposé par Milo : l'élève peut y répondre ou voir la correction */
	exercise?: { statement: string; status: "open" | "done" };
}

const QUOTE_MAX = 600;
const QUESTION_MAX = 600;
/// Milo « parle » quelques secondes après chaque réponse
const TALK_AFTER_REPLY_MS = 4000;
/// Vitesse de la craie (ms par caractère)
const TYPEWRITER_MS = 14;

const getUserDisplayName = (user: ReturnType<typeof useUserStore.getState>["user"]) => {
	if (!user) return "l'élève";
	return `${user.first_name ?? ""}`.trim() || user.username || "l'élève";
};

const buildLessonContext = (lessonParts: LessonPart[]) =>
	lessonParts
		.map((part) => `${part.title}\n${part.content}`)
		.join("\n\n")
		.trim();

const quoteOf = (text: string) => `« ${clampText(text.trim(), QUOTE_MAX)} »`;

/** Consignes envoyées à Milo, une par action. */
const PROMPTS = {
	explain: (quote: string) =>
		`Je n'ai pas bien compris ce passage du cours : ${quoteOf(quote)}. Ré-explique-le-moi autrement, plus simplement, avec des mots de collégien, en 4 phrases maximum.`,
	example: (quote: string) =>
		`Donne-moi un exemple concret, tiré de la vie de tous les jours, pour bien comprendre ce passage du cours : ${quoteOf(quote)}. Reste court.`,
	exercise: (quote: string) =>
		`Invente UN petit exercice (une seule question, adaptée à un collégien) pour vérifier que j'ai compris ce passage du cours : ${quoteOf(quote)}. Écris seulement l'énoncé, sans la réponse ni la correction, et sans phrase d'introduction.`,
	simplify: () =>
		"Je n'ai pas compris cette partie du cours. Ré-explique-la-moi plus simplement, étape par étape, avec des mots de collégien.",
	summary: () => "Résume cette partie du cours en 3 points clés très courts, faciles à retenir.",
	answer: (statement: string, answer: string) =>
		`Voici l'exercice que tu m'as donné : ${quoteOf(statement)}. Ma réponse : ${quoteOf(answer)}. Dis-moi si c'est juste. S'il y a une erreur, explique-la gentiment, puis donne la bonne réponse.`,
	solution: (statement: string) =>
		`Voici l'exercice que tu m'as donné : ${quoteOf(statement)}. Donne-moi la correction, étape par étape, simplement.`,
	notes: (notes: string[]) =>
		[
			"Voici mes notes de révision sur ce cours :",
			...notes.map((n) => `- ${clampText(n, 300)}`),
			"Pose-moi 3 petites questions pour vérifier que je les connais, une par ligne, numérotées, sans donner les réponses.",
		].join("\n"),
	quizWhy: (question: string, picked: string, correct: string) =>
		`Dans un quiz sur ce cours, la question était : ${quoteOf(question)}. J'ai répondu ${quoteOf(picked)} mais la bonne réponse était ${quoteOf(correct)}. Explique-moi simplement pourquoi.`,
};

// Le texte du cours n'est pas dans ces consignes : il part dans le champ
// `context` de /chat (chat_request est limité à 2 000 caractères).
const buildGeneratePrompt = (studentName: string) =>
	`Tu es un professeur bienveillant.
Génère UNE SEULE question ouverte de réflexion sur la notion du cours fourni en contexte.
La question doit être précise, pédagogique et adaptée à un collégien.
L'élève s'appelle "${studentName}".
Continue la conversation en cours sans saluer l'élève.
Ne commence jamais par "Bonjour", "Salut" ou "Bonjour toi".
Réponds UNIQUEMENT avec la question, sans introduction ni numérotation.`;

const buildFeedbackPrompt = (question: string, answer: string, studentName: string) =>
	`Tu es un professeur bienveillant qui corrige une réponse d'élève sur le cours fourni en contexte.

Question : "${clampText(question, QUESTION_MAX)}"
Réponse de l'élève : "${answer}"

Donne un retour constructif et encourageant en 3 parties :
1. Ce qui est bien dans la réponse
2. Ce qui pourrait être amélioré ou complété
3. Une reformulation idéale courte de la bonne réponse

Continue la conversation en cours sans saluer l'élève.
Ne commence jamais par "Bonjour", "Salut" ou "Bonjour toi".
Sois chaleureux, bref et pédagogique. L'élève s'appelle "${studentName}".`;

const buildHelpPrompt = (question: string, helpRequest: string, studentName: string) =>
	`Tu es un professeur bienveillant qui aide un élève sans donner directement toute la réponse, sur le cours fourni en contexte.

Question ouverte actuelle : "${clampText(question, QUESTION_MAX)}"
Demande de l'élève : "${helpRequest}"

L'élève s'appelle "${studentName}".
Réponds à sa demande avec une aide courte, claire et progressive.
Donne un indice, une reformulation ou une piste de réflexion, mais ne rédige pas la réponse complète à sa place.
Continue la conversation en cours sans saluer l'élève.
Ne commence jamais par "Bonjour", "Salut" ou "Bonjour toi".`;

let messageSeq = 0;
const nextMessageId = () => `m${Date.now().toString(36)}-${++messageSeq}`;

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
	const hasLesson = typeof lessonId === "number" && !Number.isNaN(lessonId);

	// Télémétrie : temps passé à lire un cours ou à discuter librement avec Milo
	useActivityTracker({
		activityType: isFreeChatMode || !hasLesson ? "free_chat" : "lesson_read",
		lessonId: !isFreeChatMode && hasLesson ? lessonId : undefined,
	});

	// ── Leçon ─────────────────────────────────────────────────────────────────
	const [parts, setParts] = useState<LessonPart[]>([]);
	const [currentPartIndex, setCurrentPartIndex] = useState(0);
	const [maxVisitedPartIndex, setMaxVisitedPartIndex] = useState(0);
	const [phase, setPhase] = useState<LessonPhase>("loading");
	/** Échec du chargement du cours (quota IA, erreur serveur…) */
	const [loadError, setLoadError] = useState<string | null>(null);
	const [displayedText, setDisplayedText] = useState("");
	const [reloadToken, setReloadToken] = useState(0);

	// ── Conversation avec Milo ────────────────────────────────────────────────
	const [thread, setThread] = useState<ThreadMessage[]>([]);
	const conversationIdRef = useRef("");

	// ── Question ouverte ──────────────────────────────────────────────────────
	const [openQuestionPhase, setOpenQuestionPhase] = useState<OpenQuestionPhase>("loading");
	const [openQuestionInputMode, setOpenQuestionInputMode] = useState<OpenQuestionInputMode>("answer");
	const [openQuestionText, setOpenQuestionText] = useState("");

	// ── Scène ─────────────────────────────────────────────────────────────────
	const [isTalking, setIsTalking] = useState(false);
	const [reaction, setReaction] = useState<MiloAnimation | null>(null);
	const talkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const reactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [sceneReady, setSceneReady] = useState(false);
	const [introActive, setIntroActive] = useState(true);

	// La scène est prête quand les modèles 3D sont chargés ET que le premier
	// frame est dessiné : c'est <ClassroomScene3D> qui le signale.
	const markSceneReady = useCallback(() => setSceneReady(true), []);

	// Filet de sécurité : si une ressource ne se charge jamais, on n'enferme pas
	// l'élève sur l'écran de chargement (les .glb pèsent plusieurs Mo).
	useEffect(() => {
		const t = setTimeout(() => setSceneReady(true), 60000);
		return () => clearTimeout(t);
	}, []);

	useEffect(
		() => () => {
			if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
			if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
		},
		[],
	);

	const talkForAWhile = useCallback(() => {
		setIsTalking(true);
		if (talkTimerRef.current) clearTimeout(talkTimerRef.current);
		talkTimerRef.current = setTimeout(() => setIsTalking(false), TALK_AFTER_REPLY_MS);
	}, []);

	/** Réaction ponctuelle de Milo (bonne / mauvaise réponse au quiz…) */
	const playReaction = useCallback((animation: MiloAnimation, durationMs = 2600) => {
		setReaction(animation);
		if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
		reactionTimerRef.current = setTimeout(() => setReaction(null), durationMs);
	}, []);

	// ─── Question ouverte : génération ───────────────────────────────────────
	const generateOpenQuestion = useCallback(
		async (lessonParts: LessonPart[]) => {
			const context = buildLessonContext(lessonParts) || "la notion";
			setOpenQuestionPhase("loading");
			setOpenQuestionInputMode("answer");
			setOpenQuestionText("");
			setDisplayedText("");

			try {
				const data = await sendOpenQuestionChatMessage({
					chatRequest: buildGeneratePrompt(studentName),
					conversationId: conversationIdRef.current,
					context,
				});
				if (data.conversationId) conversationIdRef.current = data.conversationId;
				setOpenQuestionText(data.text);
				setDisplayedText(data.text);
				setOpenQuestionPhase("answering");
				setPhase("ready");
				talkForAWhile();
			} catch (err) {
				console.error("Erreur génération question ouverte :", err);
				setLoadError(
					getAiErrorMessage(err, { fallback: "Désolé, je n'arrive pas à générer une question pour le moment." }),
				);
			}
		},
		[studentName, talkForAWhile],
	);

	// ─── Chargement du cours ─────────────────────────────────────────────────
	useEffect(() => {
		if (isFreeChatMode) return;
		if (!hasLesson) {
			setPhase("ready");
			return;
		}

		const controller = new AbortController();
		const load = async () => {
			try {
				setPhase("loading");
				setLoadError(null);
				setThread([]);
				setDisplayedText("");
				conversationIdRef.current = "";
				const lessonParts = await fetchLessonParts(lessonId, "", controller.signal);
				setParts(lessonParts);
				setCurrentPartIndex(0);
				setMaxVisitedPartIndex(0);
				if (isOpenQuestionMode) {
					await generateOpenQuestion(lessonParts);
				} else {
					setPhase("reading");
				}
			} catch (err) {
				if ((err as { name?: string })?.name === "CanceledError") return;
				console.error("Erreur :", err);
				// Pas de nouvel essai automatique (quota IA) : l'élève relance lui-même
				setLoadError(getAiErrorMessage(err, { fallback: "Milo n'arrive pas à préparer ce cours pour le moment." }));
			}
		};

		load();
		return () => controller.abort();
	}, [lessonId, hasLesson, isFreeChatMode, isOpenQuestionMode, generateOpenQuestion, reloadToken]);

	const retryLoad = useCallback(() => setReloadToken((t) => t + 1), []);

	// ─── Session OCR / chat libre ─────────────────────────────────────────────
	useEffect(() => {
		if (!freeChatSession) return;
		conversationIdRef.current = freeChatSession.conversationId;
		setParts([{ id: 1, title: freeChatSession.sourceLabel, content: freeChatSession.initialReply }]);
		setCurrentPartIndex(0);
		setMaxVisitedPartIndex(0);
		setThread([]);
		setPhase("reading");
	}, [freeChatSession]);

	// ─── Craie : la partie s'écrit au tableau caractère par caractère ─────────
	useEffect(() => {
		if (phase !== "reading" || parts.length === 0) return;
		const currentPart = parts[currentPartIndex];
		if (!currentPart) return;

		setDisplayedText("");
		let i = 0;
		const interval = setInterval(() => {
			i += 1;
			setDisplayedText(currentPart.content.slice(0, i));
			if (i >= currentPart.content.length) {
				clearInterval(interval);
				setPhase("ready");
			}
		}, TYPEWRITER_MS);

		return () => clearInterval(interval);
	}, [phase, currentPartIndex, parts]);

	/** L'élève ne veut pas attendre la craie : tout le texte d'un coup. */
	const skipTypewriter = useCallback(() => {
		if (phase !== "reading") return;
		const part = parts[currentPartIndex];
		if (part) setDisplayedText(part.content);
		setPhase("ready");
	}, [phase, parts, currentPartIndex]);

	// ─── Navigation entre les parties ────────────────────────────────────────
	const goToPart = useCallback(
		(targetIndex: number) => {
			if (targetIndex < 0 || targetIndex > maxVisitedPartIndex) return;
			const part = parts[targetIndex];
			if (!part) return;
			setCurrentPartIndex(targetIndex);
			setDisplayedText(part.content);
			setPhase("ready");
		},
		[parts, maxVisitedPartIndex],
	);

	/** Bouton principal : finir d'écrire, revoir la suivante, avancer ou terminer. */
	const goNext = useCallback(() => {
		if (phase === "reading") {
			skipTypewriter();
			return;
		}
		if (isFreeChatMode || isOpenQuestionMode) return;

		const nextIndex = currentPartIndex + 1;
		if (nextIndex <= maxVisitedPartIndex) {
			goToPart(nextIndex);
			return;
		}
		if (nextIndex >= parts.length) {
			setPhase("finished");
			return;
		}
		setCurrentPartIndex(nextIndex);
		setMaxVisitedPartIndex((current) => Math.max(current, nextIndex));
		setPhase("reading");
	}, [phase, skipTypewriter, isFreeChatMode, isOpenQuestionMode, currentPartIndex, maxVisitedPartIndex, parts.length, goToPart]);

	const goPrevious = useCallback(() => {
		if (phase === "reading") skipTypewriter();
		goToPart(currentPartIndex - 1);
	}, [phase, skipTypewriter, goToPart, currentPartIndex]);

	/** Relire la leçon depuis l'écran de fin */
	const reviewLesson = useCallback(() => goToPart(currentPartIndex), [goToPart, currentPartIndex]);

	// ─── Envoi à Milo ────────────────────────────────────────────────────────
	const currentPart = parts[currentPartIndex] ?? null;
	const lessonContext = useMemo(() => buildLessonContext(parts), [parts]);

	/** Route la consigne vers le bon endpoint selon le mode de la salle. */
	const callMilo = useCallback(
		async (prompt: string, { wholeLesson = false } = {}) => {
			if (isFreeChatMode && freeChatSession) {
				return sendFreeChatMessage(prompt, conversationIdRef.current || freeChatSession.conversationId, freeChatSession.context);
			}
			if (isOpenQuestionMode) {
				const data = await sendOpenQuestionChatMessage({
					chatRequest: prompt,
					conversationId: conversationIdRef.current,
					context: lessonContext || "la notion",
				});
				if (data.conversationId) conversationIdRef.current = data.conversationId;
				return data.text;
			}
			const context = wholeLesson ? lessonContext : (currentPart?.content ?? lessonContext);
			return sendChatMessage(context, prompt);
		},
		[isFreeChatMode, freeChatSession, isOpenQuestionMode, lessonContext, currentPart],
	);

	const isMiloBusy = thread.some((message) => message.pending);

	/**
	 * Ajoute la demande de l'élève et la réponse (en attente) de Milo au fil.
	 * `display` est ce que voit l'élève, `prompt` ce que reçoit Milo.
	 */
	const askMilo = useCallback(
		async ({
			action,
			display,
			prompt,
			quote,
			wholeLesson,
			fallback = "Désolé, je n'arrive pas à répondre pour le moment. Réessaie !",
		}: {
			action: MiloAction;
			display: string;
			prompt: string;
			quote?: string;
			wholeLesson?: boolean;
			fallback?: string;
		}) => {
			const studentMessage: ThreadMessage = { id: nextMessageId(), from: "student", action, text: display, quote };
			const miloId = nextMessageId();
			setThread((current) => [
				...current,
				studentMessage,
				{ id: miloId, from: "milo", action, text: "", pending: true },
			]);

			try {
				const reply = (await callMilo(prompt, { wholeLesson }))?.trim();
				const text = reply || fallback;
				setThread((current) =>
					current.map((message) =>
						message.id === miloId
							? {
									...message,
									text,
									pending: false,
									exercise: action === "exercise" && reply ? { statement: reply, status: "open" } : undefined,
								}
							: message,
					),
				);
				talkForAWhile();
				return text;
			} catch (err) {
				console.error("Erreur Milo :", err);
				setThread((current) =>
					current.map((message) =>
						message.id === miloId
							? { ...message, text: getAiErrorMessage(err, { fallback }), pending: false, failed: true }
							: message,
					),
				);
				return null;
			}
		},
		[callMilo, talkForAWhile],
	);

	// ── Actions sur un passage du tableau ──
	const explainPassage = useCallback(
		(quote: string) =>
			askMilo({ action: "explain", display: "Ré-explique-moi ce passage", quote, prompt: PROMPTS.explain(quote) }),
		[askMilo],
	);
	const exampleForPassage = useCallback(
		(quote: string) =>
			askMilo({ action: "example", display: "Donne-moi un exemple", quote, prompt: PROMPTS.example(quote) }),
		[askMilo],
	);
	const exerciseForPassage = useCallback(
		(quote: string) =>
			askMilo({
				action: "exercise",
				display: "Crée-moi un exercice",
				quote,
				prompt: PROMPTS.exercise(quote),
				fallback: "Je n'ai pas réussi à inventer un exercice. Réessaie dans un instant !",
			}),
		[askMilo],
	);

	// ── Raccourcis sur toute la partie ──
	const simplifyPart = useCallback(
		() => askMilo({ action: "simplify", display: "Je n'ai pas compris cette partie", prompt: PROMPTS.simplify() }),
		[askMilo],
	);
	const summarizePart = useCallback(
		() => askMilo({ action: "summary", display: "Résume-moi cette partie", prompt: PROMPTS.summary() }),
		[askMilo],
	);

	// ── Exercices de Milo ──
	const closeExercise = useCallback((messageId: string) => {
		setThread((current) =>
			current.map((message) =>
				message.id === messageId && message.exercise
					? { ...message, exercise: { ...message.exercise, status: "done" } }
					: message,
			),
		);
	}, []);

	const answerExercise = useCallback(
		(messageId: string, statement: string, answer: string) => {
			closeExercise(messageId);
			return askMilo({
				action: "answer",
				display: answer,
				quote: statement,
				prompt: PROMPTS.answer(statement, clampText(answer, QUOTE_MAX)),
			});
		},
		[askMilo, closeExercise],
	);

	const revealSolution = useCallback(
		(messageId: string, statement: string) => {
			closeExercise(messageId);
			return askMilo({ action: "solution", display: "Montre-moi la correction", quote: statement, prompt: PROMPTS.solution(statement) });
		},
		[askMilo, closeExercise],
	);

	const explainQuizMistake = useCallback(
		(question: string, picked: string, correct: string) =>
			askMilo({
				action: "quizWhy",
				display: `Pourquoi ce n'est pas « ${picked} » ?`,
				quote: question,
				prompt: PROMPTS.quizWhy(question, picked, correct),
				wholeLesson: true,
			}),
		[askMilo],
	);

	/** « Révise avec Milo » depuis le post-it : il interroge l'élève sur ses notes */
	const reviseNotes = useCallback(
		(notes: string[]) =>
			askMilo({
				action: "notes",
				display: "Fais-moi réviser mes notes",
				prompt: clampText(PROMPTS.notes(notes.slice(-12)), 1900),
				wholeLesson: true,
			}),
		[askMilo],
	);

	// ── Question libre / réponse à la question ouverte ──
	const sendStudentMessage = useCallback(
		(raw: string) => {
			const text = raw.trim();
			if (!text) return;

			if (isOpenQuestionMode && openQuestionText) {
				const isHelp = openQuestionInputMode === "help";
				void askMilo({
					action: isHelp ? "openHelp" : "openAnswer",
					display: text,
					prompt: isHelp
						? buildHelpPrompt(openQuestionText, text, studentName)
						: buildFeedbackPrompt(openQuestionText, text, studentName),
					fallback: isHelp
						? "Désolé, je n'arrive pas à donner un indice pour le moment."
						: "Désolé, je n'arrive pas à corriger ta réponse pour le moment.",
				}).then((reply) => {
					if (reply && !isHelp) setOpenQuestionPhase("feedback");
					if (isHelp) setOpenQuestionInputMode("answer");
				});
				return;
			}

			void askMilo({ action: "question", display: text, prompt: text });
		},
		[askMilo, isOpenQuestionMode, openQuestionText, openQuestionInputMode, studentName],
	);

	const newOpenQuestion = useCallback(() => {
		setThread([]);
		void generateOpenQuestion(parts);
	}, [generateOpenQuestion, parts]);

	// ─── Sorties ─────────────────────────────────────────────────────────────
	const handleBackToLessons = useCallback(() => navigate(-1), [navigate]);

	const handleBackToLesson = useCallback(() => {
		if (!hasLesson) {
			navigate(-1);
			return;
		}
		navigate(ROUTES.COURSE_MILO.replace(":lessonId", String(lessonId)), { replace: true });
	}, [hasLesson, lessonId, navigate]);

	const handleStartOpenQuestion = useCallback(() => {
		if (!hasLesson) return;
		navigate(ROUTES.COURSE_MILO_OPEN_QUESTION.replace(":lessonId", String(lessonId)));
	}, [hasLesson, lessonId, navigate]);

	const handleIntroDone = useCallback(() => setIntroActive(false), []);

	// ─── Données dérivées ─────────────────────────────────────────────────────
	const activeAnimation: MiloAnimation = reaction
		?? (phase === "loading" || isMiloBusy || (isOpenQuestionMode && openQuestionPhase === "loading")
			? "Thinking"
			: phase === "reading" || isTalking
				? "Explaining"
				: "Idle");

	// La progression reflète la partie la plus avancée, pas celle relue.
	const progressPercent =
		parts.length > 0
			? Math.round(((phase === "finished" ? parts.length : maxVisitedPartIndex + 1) / parts.length) * 100)
			: 0;

	return {
		// Leçon
		phase,
		loadError,
		retryLoad,
		parts,
		currentPart,
		currentPartIndex,
		maxVisitedPartIndex,
		displayedText,
		progressPercent,
		isLastPart: currentPartIndex === parts.length - 1,
		goNext,
		goPrevious,
		goToPart,
		skipTypewriter,
		reviewLesson,
		isFreeChatMode,
		isOpenQuestionMode,
		sourceLabel: freeChatSession?.sourceLabel,

		// Question ouverte
		openQuestionPhase,
		openQuestionInputMode,
		setOpenQuestionInputMode,
		openQuestionText,
		newOpenQuestion,

		// Milo
		thread,
		isMiloBusy,
		sendStudentMessage,
		explainPassage,
		exampleForPassage,
		exerciseForPassage,
		simplifyPart,
		summarizePart,
		answerExercise,
		revealSolution,
		explainQuizMistake,
		reviseNotes,

		// Sorties
		handleBackToLessons,
		handleBackToLesson,
		handleStartOpenQuestion,

		// Scène
		activeAnimation,
		playReaction,
		sceneReady,
		markSceneReady,
		introActive,
		handleIntroDone,
	};
};

export type MiloSceneState = ReturnType<typeof useMiloScene>;
