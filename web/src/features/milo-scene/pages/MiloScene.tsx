import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useProgress } from "@react-three/drei";
import QuizLoader from "@shared/components/quiz/QuizLoader.component";
import { useLocation, useParams } from "react-router-dom";
import {
	ArrowLeft,
	ArrowRight,
	BookOpen,
	CircleHelp,
	FastForward,
	Flag,
	Maximize2,
	MousePointerClick,
	PencilLine,
	RotateCcw,
	Square,
	Volume2,
	X,
} from "lucide-react";
import ClassroomScene3D from "@features/milo-scene/components/ClassroomScene3D.component";
import LessonBoard, { type PassageAction } from "@features/milo-scene/components/LessonBoard.component";
import MiloAnswer from "@features/milo-scene/components/MiloAnswer.component";
import SheetPaper, { type SheetMode } from "@features/milo-scene/components/SheetPaper.component";
import RichText from "@features/milo-scene/components/RichText.component";
import ChalkTitle from "@features/milo-scene/components/ChalkTitle.component";
import ClassQuiz from "@features/milo-scene/components/ClassQuiz.component";
import CourseSwitcher from "@features/milo-scene/components/CourseSwitcher.component";
import NotesPostIt from "@features/milo-scene/components/NotesPostIt.component";
import HelpModal from "@features/milo-scene/components/HelpModal.component";
import LessonFinishedModal from "@features/milo-scene/components/LessonFinishedModal.component";
import ClassSheet from "@features/milo-scene/components/ClassSheet.component";
import { useMiloScene } from "@features/milo-scene/hooks/useMiloScene";
import { useSpeech } from "@features/milo-scene/hooks/useSpeech";
import { useMemoStore, type MemoItem } from "@features/milo-scene/store/memo.store";
import { useMiloFreeChatStore, type MiloFreeChatSession } from "@features/milo-scene/store/freeChat.store";
import { flattenSentences, parseBoardText, plainText } from "@features/milo-scene/utils/lessonText";
import { useCourseStore } from "@features/courses/store/course.store";
import { useUserStore } from "@shared/store/user/user.store";
import { getSubjectVisuals } from "@shared/constants/courses";
import DistressNotice from "@shared/components/DistressNotice.component";
import { isDistressReply } from "@shared/lib/distress";
import { AI_LIMITS } from "@shared/lib/aiRequests";
import "@features/milo-scene/styles/Classroom.css";

const NARROW_QUERY = "(max-width: 899px)";
const LOADING_LINES = [
	"Milo range ses craies…",
	"Il efface le tableau…",
	"Il installe ton bureau…",
	"Presque prêt !",
]
const HINT_STORAGE_KEY = "milo-class-hint-seen";
const EMPTY_MEMOS: MemoItem[] = [];

const readFlag = (key: string) => {
	try {
		return localStorage.getItem(key) === "1";
	} catch {
		return false;
	}
};

const writeFlag = (key: string) => {
	try {
		localStorage.setItem(key, "1");
	} catch {
		/* stockage indisponible : l'astuce reviendra, ce n'est pas grave */
	}
};

const useMediaQuery = (query: string) => {
	const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
	useEffect(() => {
		const list = window.matchMedia(query);
		const onChange = () => setMatches(list.matches);
		list.addEventListener("change", onChange);
		return () => list.removeEventListener("change", onChange);
	}, [query]);
	return matches;
};

/// Écran d'attente de la charte : soleil feu, Milo, objets 3D en orbite
const LoadingOverlay: React.FC<{ done: boolean }> = ({ done }) => {
	const { progress } = useProgress();
	/// La progression peut repartir en arrière quand un nouveau fichier démarre :
	/// on n'affiche que la valeur la plus haute atteinte
	const [shown, setShown] = useState(0);
	useEffect(() => setShown((current) => Math.max(current, progress)), [progress]);
	const value = done ? 100 : Math.round(shown);

	return (
		<div className={`cls-loading${done ? " is-done" : ""}`}>
			<QuizLoader
				eyebrow="Salle de classe"
				title="On entre en classe !"
				highlight="classe"
				messages={LOADING_LINES}
			>
				<span className="cls-loading-pct" aria-live="polite">
					{value < 100 ? `Chargement de la salle · ${value} %` : "C'est prêt !"}
				</span>
			</QuizLoader>
		</div>
	);
};

const MiloScene: React.FC = () => {
	const { lessonId: lessonIdParam } = useParams<{ lessonId: string }>();
	const lessonId = lessonIdParam ? Number(lessonIdParam) : undefined;
	const hasLesson = typeof lessonId === "number" && !Number.isNaN(lessonId);
	const location = useLocation();
	const reduceMotion = useReducedMotion();
	const isOpenQuestionRoute = location.pathname.includes("/question-ouverte");
	const storedFreeChatSession = useMiloFreeChatStore((state) => state.session);
	const routedFreeChatSession = (location.state as { freeChatSession?: MiloFreeChatSession } | null)?.freeChatSession;
	const freeChatSession = routedFreeChatSession ?? storedFreeChatSession;

	const scene = useMiloScene(lessonId, freeChatSession, isOpenQuestionRoute);
	const {
		phase,
		parts,
		currentPart,
		currentPartIndex,
		maxVisitedPartIndex,
		displayedText,
		isFreeChatMode,
		isOpenQuestionMode,
		thread,
	} = scene;
	const isLessonMode = !isFreeChatMode && !isOpenQuestionMode;

	const speech = useSpeech();
	const narrow = useMediaQuery(NARROW_QUERY);
	const user = useUserStore((state) => state.user);
	const studentName = `${user?.first_name ?? ""}`.trim() || user?.username || "toi";

	// ── Leçon dans le catalogue (titre, chapitre, matière) ──
	const coursesWithChapters = useCourseStore((state) => state.coursesWithChapters);
	const subjects = useCourseStore((state) => state.subjects);
	const loadedSubjectId = useCourseStore((state) => state.loadedSubjectId);
	const lessonInfo = useMemo(() => {
		for (const course of coursesWithChapters) {
			for (const chapter of course.chapters) {
				const lesson = chapter.lessons.find((l) => l.id === lessonId);
				if (lesson) return { lesson, chapter };
			}
		}
		return null;
	}, [coursesWithChapters, lessonId]);
	const subject = subjects.find((s) => s.id === loadedSubjectId);
	const subjectEmoji = lessonInfo ? getSubjectVisuals(subject?.title).emoji : "📚";

	const lessonTitle = isFreeChatMode
		? (scene.sourceLabel ?? "Ton document")
		: (lessonInfo?.lesson.title ?? (parts.length > 1 ? parts[0].title : undefined) ?? "Ta leçon");
	const lessonSubtitle = isFreeChatMode
		? "Discussion avec Milo"
		: isOpenQuestionMode
			? "Question ouverte"
			: (lessonInfo?.chapter.title ?? subject?.title ?? "Salle de classe");

	// ── Fiche de révision ──
	const memoKey = hasLesson ? `lesson-${lessonId}` : "libre";
	const memoItems = useMemoStore((state) => state.memos[memoKey]) ?? EMPTY_MEMOS;
	const addMemo = useMemoStore((state) => state.add);
	const removeMemo = useMemoStore((state) => state.remove);
	const [notesBump, setNotesBump] = useState(0);
	/// Colle une note sur le post-it ; le post-it fait un bond sur le bureau
	const saveNote = (text: string, source: string) => {
		if (memoItems.some((m) => m.text === text)) return;
		addMemo(memoKey, { text, source });
		setNotesBump((n) => n + 1);
	};
	const savedTexts = useMemo(() => new Set(memoItems.map((m) => m.text)), [memoItems]);

	// ── État de l'interface ──
	const [boardMode, setBoardMode] = useState<"lesson" | "quiz">("lesson");
	/** Le tableau montre le cours, ou la dernière réponse de Milo */
	const [boardFocus, setBoardFocus] = useState<"lesson" | "milo">("lesson");
	const [isEditing, setIsEditing] = useState(false);
	const [sheetMode, setSheetMode] = useState<SheetMode>({ kind: isOpenQuestionRoute ? "open" : "question" });
	const [draft, setDraft] = useState("");
	const [zoomed, setZoomed] = useState(false);
	const [showSwitcher, setShowSwitcher] = useState(false);
	const [notesOpen, setNotesOpen] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const [showLeave, setShowLeave] = useState(false);
	const [showFinished, setShowFinished] = useState(false);
	const [hintSeen, setHintSeen] = useState(() => readFlag(HINT_STORAGE_KEY));
	const [dismissedDistressId, setDismissedDistressId] = useState<string | null>(null);
	const [isOverlayGone, setIsOverlayGone] = useState(false);

	// L'écran de chargement reste monté le temps de son fondu de sortie
	useEffect(() => {
		if (!scene.sceneReady) return;
		const t = setTimeout(() => setIsOverlayGone(true), 700);
		return () => clearTimeout(t);
	}, [scene.sceneReady]);

	// Nouvelle leçon (changement de leçon) : tableau et feuille propres
	useEffect(() => {
		setBoardMode("lesson");
		setBoardFocus("lesson");
		setShowFinished(false);
		setShowSwitcher(false);
		setIsEditing(false);
		setDraft("");
		setSheetMode({ kind: isOpenQuestionRoute ? "open" : "question" });
		speech.stop();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lessonId, isOpenQuestionRoute]);

	// Une leçon choisie dans « Changer de leçon » (même la leçon en cours) ferme la fenêtre
	useEffect(() => setShowSwitcher(false), [location.key]);

	// Changement de partie : on revient au cours et on coupe la lecture
	useEffect(() => {
		speech.stop();
		setBoardFocus("lesson");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPartIndex]);

	// Fin de leçon : la célébration s'ouvre d'elle-même
	useEffect(() => {
		if (phase === "finished" && isLessonMode) setShowFinished(true);
	}, [phase, isLessonMode]);

	// Chaque nouvelle demande à Milo s'affiche au tableau
	const lastMessage = thread[thread.length - 1];
	const lastMessageId = lastMessage?.id;
	useEffect(() => {
		if (lastMessage?.from === "milo") setBoardFocus("milo");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lastMessageId]);

	const latestMiloIndex = thread.map((m) => m.from).lastIndexOf("milo");
	const latestMilo = latestMiloIndex >= 0 ? thread[latestMiloIndex] : undefined;
	const latestRequest = latestMiloIndex > 0 ? thread[latestMiloIndex - 1] : undefined;
	const distressMessage =
		latestMilo && !latestMilo.pending && isDistressReply(latestMilo.text) && dismissedDistressId !== latestMilo.id
			? latestMilo
			: null;

	// ── Lecture à voix haute ──
	const partSentences = useMemo(
		() => flattenSentences(parseBoardText(currentPart?.content ?? displayedText)),
		[currentPart, displayedText],
	);
	const speakingIndex = speech.queueId === "part" && speech.activeKey !== null ? Number(speech.activeKey) : null;
	const listeningPart = speech.queueId === "part";
	const toggleListenPart = () => {
		if (listeningPart) {
			speech.stop();
			return;
		}
		if (phase === "reading") scene.skipTypewriter();
		speech.speak("part", partSentences.map((s) => ({ key: String(s.index), text: plainText(s.text) })));
	};

	const markHintSeen = () => {
		if (hintSeen) return;
		setHintSeen(true);
		writeFlag(HINT_STORAGE_KEY);
	};

	// ── Feuille ──
	const canUseSheet = phase !== "loading" && !scene.loadError;
	const stopSpeech = speech.stop;
	const openSheet = useCallback(
		(mode?: SheetMode) => {
			if (!canUseSheet) return;
			stopSpeech();
			setZoomed(false);
			setSheetMode(mode ?? { kind: isOpenQuestionMode ? "open" : "question" });
			setNotesOpen(false);
			setIsEditing(true);
		},
		[canUseSheet, stopSpeech, isOpenQuestionMode],
	);
	const closeSheet = useCallback(() => setIsEditing(false), []);

	const sendSheet = () => {
		const text = draft.trim();
		if (!text || scene.isMiloBusy) return;
		if (sheetMode.kind === "exercise") {
			void scene.answerExercise(sheetMode.messageId, sheetMode.statement, text);
		} else {
			scene.sendStudentMessage(text);
		}
		setDraft("");
		setIsEditing(false);
		setSheetMode({ kind: isOpenQuestionMode ? "open" : "question" });
	};

	const askFromSheet = (ask: () => Promise<unknown>) => {
		setIsEditing(false);
		void ask();
	};

	// ── Actions sur une phrase du tableau ──
	const handlePassageAction = (action: PassageAction, text: string) => {
		markHintSeen();
		if (action === "listen") {
			speech.speak("passage", [{ key: "passage", text }]);
			return;
		}
		if (action === "save") {
			saveNote(text, currentPart?.title ?? lessonTitle);
			return;
		}
		setZoomed(false);
		if (action === "explain") void scene.explainPassage(text);
		if (action === "example") void scene.exampleForPassage(text);
		if (action === "exercise") void scene.exerciseForPassage(text);
	};

	const openQuiz = () => {
		if (!hasLesson) return;
		speech.stop();
		setShowFinished(false);
		setIsEditing(false);
		setBoardMode("quiz");
	};

	const askWhyFromQuiz = (question: string, picked: string, correct: string) => {
		setBoardMode("lesson");
		void scene.explainQuizMistake(question, picked, correct);
	};


	const anyOverlayOpen = showSwitcher || notesOpen || showHelp || showLeave || showFinished || zoomed;

	// ── Clavier : ← → pour changer de partie ──
	useEffect(() => {
		if (!isLessonMode || boardMode !== "lesson" || anyOverlayOpen || isEditing) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
			const target = event.target as HTMLElement;
			if (target.closest("input, textarea, [role='menu'], [contenteditable='true']")) return;
			if (event.key === "ArrowRight" && phase !== "loading") {
				event.preventDefault();
				if (phase === "finished") setShowFinished(true);
				else scene.goNext();
			} else if (event.key === "ArrowLeft") {
				event.preventDefault();
				scene.goPrevious();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [isLessonMode, boardMode, anyOverlayOpen, isEditing, phase, scene]);

	// Échap repose la feuille ou le post-it, et referme le tableau agrandi
	useEffect(() => {
		if (!(isEditing || zoomed || notesOpen)) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			setIsEditing(false);
			setNotesOpen(false);
			setZoomed(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [isEditing, zoomed, notesOpen]);

	const toggleNotes = () => {
		setIsEditing(false);
		setZoomed(false);
		setNotesOpen((open) => !open);
	};

	// ── Bouton principal ──
	const isAtFrontier = currentPartIndex >= maxVisitedPartIndex;
	const isLastPart = currentPartIndex === parts.length - 1;
	const primary = (() => {
		if (phase === "reading") return { label: "Tout afficher", Icon: FastForward, onClick: scene.skipTypewriter };
		if (phase === "finished") return { label: "Et maintenant ?", Icon: Flag, onClick: () => setShowFinished(true) };
		if (isLastPart && isAtFrontier) return { label: "Terminer la leçon", Icon: Flag, onClick: scene.goNext };
		return { label: "Partie suivante", Icon: ArrowRight, onClick: scene.goNext };
	})();

	const chatMaxLength = isOpenQuestionMode
		? AI_LIMITS.STUDENT_ANSWER
		: isFreeChatMode
			? AI_LIMITS.CHAT_REQUEST
			: AI_LIMITS.LESSON_QUESTION;
	const sheetMaxLength = sheetMode.kind === "exercise" ? AI_LIMITS.STUDENT_ANSWER : chatMaxLength;

	// ════════════════════════════════════════════════════════════════════
	// Contenu du tableau : écrit sur le tableau 3D (ou en grand sur demande)
	// ════════════════════════════════════════════════════════════════════
	const renderBoard = () => {
		if (scene.loadError) {
			return (
				<div className="cls-board-state" role="alert">
					<img src="/landing/emoji/light_bulb.webp" alt="" aria-hidden="true" />
					<p>{scene.loadError}</p>
					<div className="cls-board-state-actions">
						<button type="button" className="cls-btn cls-btn--ghost-chalk" onClick={scene.handleBackToLessons}>
							Revenir aux leçons
						</button>
						<button type="button" className="cls-btn cls-btn--primary" onClick={scene.retryLoad}>
							<RotateCcw size={18} aria-hidden="true" />
							Réessayer
						</button>
					</div>
				</div>
			);
		}

		if (phase === "loading") {
			return (
				<div className="cls-board-state" role="status">
					<img className="cls-board-loading-fox" src="/landing/emoji/fox.webp" alt="" aria-hidden="true" />
					<p className="cls-board-loading">
						{isOpenQuestionMode ? "Milo prépare une " : "Milo prépare ton "}
						<span className="is-hl">{isOpenQuestionMode ? "question" : "cours"}</span>
					</p>
					<span className="cls-chalk-dots" aria-hidden="true">
						<i />
						<i />
						<i />
					</span>
				</div>
			);
		}

		if (boardMode === "quiz" && hasLesson) {
			return (
				<ClassQuiz
					lessonId={lessonId}
					lessonTitle={lessonTitle}
					onClose={() => setBoardMode("lesson")}
					onReact={scene.playReaction}
					onAskWhy={askWhyFromQuiz}
				/>
			);
		}

		if (isOpenQuestionMode) {
			const reply = latestMilo;
			return (
				<div className="cls-board-view">
					<header className="cls-board-head">
						<div className="cls-board-titles">
							<span className="cls-chalk-eyebrow">
								<i />
								Question de Milo
							</span>
							<h2 className="cls-board-title cls-board-title--question">{scene.openQuestionText}</h2>
						</div>
					</header>
					<div className="cls-board-content">
						{reply && (
							<section className="cls-board-reply">
								<span className="cls-chalk-eyebrow">
									<i />
									{reply.pending
										? "Milo réfléchit…"
										: reply.action === "openHelp"
											? "Indice de Milo"
											: "Correction de Milo"}
								</span>
								{reply.pending ? (
									<span className="cls-chalk-dots" aria-label="Milo réfléchit">
										<i />
										<i />
										<i />
									</span>
								) : (
									<RichText text={reply.text} className="cls-rich cls-rich--chalk" />
								)}
							</section>
						)}
					</div>
					<footer className="cls-board-tools">
						{scene.openQuestionPhase === "feedback" ? (
							<button
								type="button"
								className="cls-btn cls-btn--primary cls-btn--sm"
								onClick={scene.newOpenQuestion}
								disabled={scene.isMiloBusy}
							>
								<RotateCcw size={18} aria-hidden="true" />
								Une autre question
							</button>
						) : (
							<button
								type="button"
								className="cls-btn cls-btn--primary cls-btn--sm"
								onClick={() => openSheet()}
								disabled={scene.isMiloBusy}
							>
								<PencilLine size={18} aria-hidden="true" />
								Répondre sur ma feuille
							</button>
						)}
						<span className="cls-board-tools-spacer" />
						{!narrow && (
							<button type="button" className="cls-btn cls-btn--chalk cls-btn--sm" onClick={scene.handleBackToLesson}>
								<BookOpen size={18} aria-hidden="true" />
								Relire la leçon
							</button>
						)}
					</footer>
				</div>
			);
		}

		if (boardFocus === "milo" && latestMilo) {
			return (
				<MiloAnswer
					request={latestRequest}
					answer={latestMilo}
					onBack={() => {
						speech.stop();
						setBoardFocus("lesson");
					}}
					backLabel={isFreeChatMode ? "Revenir au document" : "Revenir au cours"}
					canListen={speech.supported}
					isSpeaking={speech.queueId === `msg-${latestMilo.id}`}
					onListen={() =>
						speech.speak(`msg-${latestMilo.id}`, [{ key: latestMilo.id, text: plainText(latestMilo.text) }])
					}
					onStopListening={speech.stop}
					isSaved={savedTexts.has(latestMilo.text.trim())}
					onSave={() => saveNote(latestMilo.text.trim(), "Expliqué par Milo")}
					onAnswerExercise={() => {
						if (latestMilo.exercise) {
							openSheet({ kind: "exercise", messageId: latestMilo.id, statement: latestMilo.exercise.statement });
						}
					}}
					onRevealSolution={() => {
						if (latestMilo.exercise) void scene.revealSolution(latestMilo.id, latestMilo.exercise.statement);
					}}
				/>
			);
		}

		const eyebrow = isFreeChatMode
			? "Ton document"
			: parts.length > 0
				? `Partie ${currentPartIndex + 1} sur ${parts.length}`
				: "Leçon";
		const showHint = !hintSeen && (phase === "ready" || phase === "finished");

		return (
			<div className="cls-board-view">
				<header className="cls-board-head">
					<div className="cls-board-titles">
						<span className="cls-chalk-eyebrow">
							<i />
							{eyebrow}
						</span>
						<ChalkTitle text={currentPart?.title ?? lessonTitle} />
					</div>
					<div className="cls-board-head-tools">
						{speech.supported && (
							<button
								type="button"
								className={`cls-btn cls-btn--chalk cls-btn--sm${listeningPart ? " is-on" : ""}`}
								onClick={toggleListenPart}
								aria-pressed={listeningPart}
							>
								{listeningPart ? <Square size={15} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
								{listeningPart ? "Arrêter" : "Écouter"}
							</button>
						)}
						{!zoomed && !narrow && (
							<button
								type="button"
								className="cls-btn cls-btn--chalk cls-btn--sm cls-btn--icon"
								onClick={() => setZoomed(true)}
								aria-label="Lire le tableau en grand"
								title="Lire le tableau en grand"
							>
								<Maximize2 size={20} />
							</button>
						)}
					</div>
				</header>
				<LessonBoard
					text={displayedText}
					isWriting={phase === "reading"}
					interactive={phase === "ready" || phase === "finished"}
					speakingIndex={speakingIndex}
					savedTexts={savedTexts}
					canListen={speech.supported}
					onAction={handlePassageAction}
					onSkip={scene.skipTypewriter}
					compact={narrow}
				/>
				<p id="cls-board-hint" className={`cls-board-hint${showHint ? "" : " cls-sr-only"}`}>
					<MousePointerClick size={18} aria-hidden="true" />
					{narrow ? "Touche" : "Passe ta souris sur"} une phrase : Milo peut la ré-expliquer, te donner un exemple ou
					un exercice.
				</p>

				{/* Sur ordinateur, la navigation est écrite en bas du tableau : le
				    bureau reste libre pour la feuille, le cahier et le post-it */}
				{!narrow && isLessonMode && parts.length > 0 && (
					<footer className="cls-board-nav">
						<button
							type="button"
							className="cls-btn cls-btn--chalk cls-btn--sm cls-btn--icon"
							onClick={scene.goPrevious}
							disabled={currentPartIndex === 0}
							aria-label="Partie précédente"
							title="Partie précédente"
						>
							<ArrowLeft size={20} />
						</button>
						<ol className="cls-steps cls-steps--chalk" aria-label={`Progression : ${scene.progressPercent} %`}>
							{parts.map((part, i) => {
								const visited = i <= maxVisitedPartIndex;
								const state = i === currentPartIndex ? "is-current" : visited ? "is-visited" : "is-locked";
								return (
									<li key={part.id ?? i}>
										<button
											type="button"
											className={`cls-step ${state}`}
											onClick={() => scene.goToPart(i)}
											disabled={!visited}
											aria-current={i === currentPartIndex ? "step" : undefined}
											aria-label={`Partie ${i + 1} : ${part.title}${visited ? "" : " (pas encore lue)"}`}
											title={part.title}
										>
											<span />
										</button>
									</li>
								);
							})}
						</ol>
						<span className="cls-board-nav-count">
							{currentPartIndex + 1} / {parts.length}
						</span>
						<button type="button" className="cls-btn cls-btn--primary cls-btn--sm cls-btn--next" onClick={primary.onClick}>
							<span>{primary.label}</span>
							<primary.Icon size={20} aria-hidden="true" />
						</button>
					</footer>
				)}

				{!narrow && isFreeChatMode && (
					<footer className="cls-board-nav cls-board-nav--end">
						<button type="button" className="cls-btn cls-btn--primary cls-btn--sm" onClick={scene.handleBackToLessons}>
							Terminer la discussion
							<ArrowRight size={18} aria-hidden="true" />
						</button>
					</footer>
				)}
			</div>
		);
	};

	const boardViewKey = scene.loadError
		? "error"
		: phase === "loading"
			? "loading"
			: boardMode === "quiz" && hasLesson
				? "quiz"
				: isOpenQuestionMode
					? `open-${scene.openQuestionText.length}`
					: boardFocus === "milo" && latestMilo
						? `milo-${latestMilo.id}`
						: `lesson-${currentPartIndex}`;
	/// Chaque changement de vue du tableau : on efface, puis on réécrit
	const boardNode = (
		<AnimatePresence mode="wait" initial={false}>
			<motion.div
				key={boardViewKey}
				className="cls-board-anim"
				initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(6px)" }}
				animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
				exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(6px)" }}
				transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
			>
				{renderBoard()}
			</motion.div>
		</AnimatePresence>
	);
	// Sur mobile, le tableau 3D est trop petit pour être lu : un toucher l'agrandit
	const board3D = zoomed ? null : narrow ? (
		<div className="cls-board-tap" onClickCapture={(e) => {
			e.stopPropagation();
			e.preventDefault();
			setZoomed(true);
		}}>
			{boardNode}
		</div>
	) : (
		boardNode
	);

	const sheetNode = (
		<SheetPaper
			isEditing={isEditing}
			mode={sheetMode}
			value={draft}
			onChange={setDraft}
			onSend={sendSheet}
			onClose={closeSheet}
			maxLength={sheetMaxLength}
			busy={scene.isMiloBusy}
			onSimplify={isLessonMode ? () => askFromSheet(scene.simplifyPart) : undefined}
			onSummarize={isLessonMode ? () => askFromSheet(scene.summarizePart) : undefined}
			openInputMode={scene.openQuestionInputMode}
			onOpenInputModeChange={scene.setOpenQuestionInputMode}
			hideIdle={narrow}
		/>
	);

	const uiIn = scene.sceneReady;
	const enter = (delay: number) =>
		reduceMotion
			? { initial: { opacity: 0 }, animate: { opacity: uiIn ? 1 : 0 }, transition: { duration: 0.3 } }
			: {
					initial: { opacity: 0, y: -16 },
					animate: uiIn ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 },
					transition: { duration: 0.5, delay: uiIn ? delay : 0, ease: [0.2, 0.8, 0.2, 1] as const },
				};

	const notesNode = (
		<NotesPostIt
			isHeld={notesOpen}
			lessonTitle={lessonTitle}
			items={memoItems}
			onAdd={(text) => saveNote(text, "Mes propres notes")}
			onRemove={(id) => removeMemo(memoKey, id)}
			onRevise={() => {
				setNotesOpen(false);
				setBoardMode("lesson");
				void scene.reviseNotes(memoItems.map((m) => plainText(m.text)));
			}}
			onClose={() => setNotesOpen(false)}
			busy={scene.isMiloBusy}
			hideIdle={narrow}
		/>
	);

	/// Sur ordinateur, tout se passe sur le tableau et le bureau ; la barre
	/// du bas ne sert qu'aux petits écrans
	const showBottomBar = narrow && !isEditing && !notesOpen && boardMode === "lesson" && !scene.loadError;
	const askLabel = isOpenQuestionMode ? "Répondre sur ma feuille" : "Poser une question";

	return (
		<div className={`cls-root${narrow ? " is-narrow" : ""}`}>
			{!isOverlayGone && <LoadingOverlay done={scene.sceneReady} />}

			<ClassroomScene3D
				activeAnimation={scene.activeAnimation}
				introRunning={scene.sceneReady}
				introDone={!scene.introActive}
				onIntroDone={scene.handleIntroDone}
				onReady={scene.markSceneReady}
				isEditing={isEditing}
				onSheetClick={() => openSheet()}
				isNotesOpen={notesOpen}
				onNotesClick={toggleNotes}
				notesBump={notesBump}
				boardVisible={uiIn}
				board={board3D}
				sheet={sheetNode}
				notes={notesNode}
			/>

			<div className="cls-ui">
				{/* ── Barre du haut ── */}
				<motion.header className="cls-top" {...enter(0.1)}>
					<button type="button" className="cls-btn cls-btn--secondary cls-btn--sm" onClick={() => setShowLeave(true)}>
						<ArrowLeft size={18} aria-hidden="true" />
						<span className="cls-hide-sm">Quitter</span>
						<span className="cls-sr-only cls-show-sm">Quitter la salle de classe</span>
					</button>

					<div className="cls-top-id">
						<span className="cls-top-emoji" aria-hidden="true">
							{isFreeChatMode ? "📄" : subjectEmoji}
						</span>
						<div className="cls-top-titles">
							<span className="cls-top-sub">{lessonSubtitle}</span>
							<h1 className="cls-top-title">{lessonTitle}</h1>
						</div>
					</div>

					<nav className="cls-top-actions" aria-label="Outils de la classe">
						{hasLesson && !isFreeChatMode && (
							<button
								type="button"
								className={`cls-btn cls-btn--secondary cls-btn--sm${boardMode === "quiz" ? " is-on" : ""}`}
								onClick={() => (boardMode === "quiz" ? setBoardMode("lesson") : openQuiz())}
								disabled={phase === "loading"}
								title="Teste-toi sur toute la leçon"
							>
								<img className="cls-btn-emoji" src="/landing/emoji/bullseye.webp" alt="" aria-hidden="true" />
								<span className="cls-label-long">{boardMode === "quiz" ? "Revenir au cours" : "Quiz de la leçon"}</span>
								<span className="cls-label-short">{boardMode === "quiz" ? "Cours" : "Quiz"}</span>
							</button>
						)}
						{!isFreeChatMode && (
							<button
								type="button"
								className="cls-btn cls-btn--secondary cls-btn--sm"
								onClick={() => setShowSwitcher(true)}
								title="Changer de leçon"
							>
								<img className="cls-btn-emoji" src="/landing/emoji/books.webp" alt="" aria-hidden="true" />
								<span className="cls-label-long">Changer de leçon</span>
								<span className="cls-label-short">Leçons</span>
							</button>
						)}
						<button
							type="button"
							className={`cls-btn cls-btn--secondary cls-btn--sm${notesOpen ? " is-on" : ""}${notesBump ? " cls-bump" : ""}`}
							key={`notes-${notesBump}`}
							onClick={toggleNotes}
							aria-pressed={notesOpen}
							title="Mon post-it de notes pour réviser"
						>
							<img className="cls-btn-emoji" src="/landing/emoji/card_index_dividers.webp" alt="" aria-hidden="true" />
							<span>Mes notes</span>
							{memoItems.length > 0 && <span className="cls-count">{memoItems.length}</span>}
						</button>
						<button
							type="button"
							className="cls-icon-btn cls-icon-btn--solid"
							onClick={() => setShowHelp(true)}
							aria-label="Comment ça marche ?"
							title="Comment ça marche ?"
						>
							<CircleHelp size={20} />
						</button>
					</nav>
				</motion.header>

				{/* ── Barre du bas : les gestes de la classe ── */}
				<AnimatePresence>
					{showBottomBar && uiIn && (
						<motion.nav
							key="bottom"
							className="cls-bottom"
							aria-label="Navigation dans la leçon"
							initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
							animate={{ opacity: 1, y: 0 }}
							exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
							transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
						>
							<div className="cls-bottom-group cls-bottom-group--ask">
								<button
									type="button"
									className="cls-btn cls-btn--secondary"
									onClick={() => openSheet()}
									disabled={!canUseSheet || scene.isMiloBusy}
								>
									<img className="cls-btn-emoji" src="/landing/emoji/fox.webp" alt="" aria-hidden="true" />
									<span className="cls-hide-xs">{askLabel}</span>
									<span className="cls-show-xs">{isOpenQuestionMode ? "Répondre" : "Question"}</span>
								</button>
							</div>

							<div className="cls-bottom-group cls-bottom-group--nav">
								{isLessonMode && parts.length > 0 && (
									<>
										<button
											type="button"
											className="cls-btn cls-btn--secondary cls-btn--icon"
											onClick={scene.goPrevious}
											disabled={currentPartIndex === 0 || phase === "loading"}
											aria-label="Partie précédente"
											title="Partie précédente"
										>
											<ArrowLeft size={20} />
										</button>

										<ol className="cls-steps cls-hide-xs" aria-label={`Progression : ${scene.progressPercent} %`}>
											{parts.map((part, i) => {
												const visited = i <= maxVisitedPartIndex;
												const state = i === currentPartIndex ? "is-current" : visited ? "is-visited" : "is-locked";
												return (
													<li key={part.id ?? i}>
														<button
															type="button"
															className={`cls-step ${state}`}
															onClick={() => scene.goToPart(i)}
															disabled={!visited || phase === "loading"}
															aria-current={i === currentPartIndex ? "step" : undefined}
															aria-label={`Partie ${i + 1} : ${part.title}${visited ? "" : " (pas encore lue)"}`}
															title={part.title}
														>
															<span />
														</button>
													</li>
												);
											})}
										</ol>

										<button
											type="button"
											className="cls-btn cls-btn--primary cls-btn--next"
											onClick={primary.onClick}
											disabled={phase === "loading"}
										>
											<span>{primary.label}</span>
											<primary.Icon size={20} aria-hidden="true" />
										</button>
									</>
								)}

								{isFreeChatMode && (
									<button type="button" className="cls-btn cls-btn--primary" onClick={scene.handleBackToLessons}>
										Terminer
										<ArrowRight size={18} aria-hidden="true" />
									</button>
								)}

								{isOpenQuestionMode && (
									<button type="button" className="cls-btn cls-btn--secondary" onClick={scene.handleBackToLesson}>
										<BookOpen size={18} aria-hidden="true" />
										<span className="cls-hide-xs">Relire la leçon</span>
										<span className="cls-show-xs">Leçon</span>
									</button>
								)}

							</div>
						</motion.nav>
					)}
				</AnimatePresence>
			</div>

			{/* ── Tableau en grand (lecture confortable, mobile) ── */}
			<AnimatePresence>
				{zoomed && (
					<motion.div
						className="cls-zoom"
						role="dialog"
						aria-modal="true"
						aria-label="Tableau en grand"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<motion.div
							className="cls-zoom-board"
							initial={reduceMotion ? false : { scale: 0.92, y: 20 }}
							animate={{ scale: 1, y: 0 }}
							transition={{ type: "spring", stiffness: 340, damping: 32 }}
						>
							<button
								type="button"
								className="cls-icon-btn cls-icon-btn--chalk cls-zoom-close"
								onClick={() => setZoomed(false)}
								aria-label="Revenir à la classe"
								autoFocus
							>
								<X size={22} />
							</button>
							<div className="cls-chalkboard is-flat">{boardNode}</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{distressMessage && (
				<DistressNotice text={distressMessage.text} onClose={() => setDismissedDistressId(distressMessage.id)} />
			)}

			<CourseSwitcher isOpen={showSwitcher} onClose={() => setShowSwitcher(false)} currentLessonId={lessonId} />
			<HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
			<LessonFinishedModal
				isOpen={showFinished}
				onClose={() => setShowFinished(false)}
				studentName={studentName}
				onStartQuiz={openQuiz}
				onStartOpenQuestion={scene.handleStartOpenQuestion}
				onChangeLesson={() => {
					setShowFinished(false);
					setShowSwitcher(true);
				}}
				onReview={() => {
					setShowFinished(false);
					scene.reviewLesson();
				}}
			/>
			<ClassSheet
				isOpen={showLeave}
				onClose={() => setShowLeave(false)}
				variant="center"
				title="Quitter la salle de classe ?"
				footer={
					<>
						<button type="button" className="cls-btn cls-btn--secondary" onClick={() => setShowLeave(false)}>
							Rester en classe
						</button>
						<button
							type="button"
							className="cls-btn cls-btn--danger"
							onClick={() => {
								setShowLeave(false);
								speech.stop();
								scene.handleBackToLessons();
							}}
						>
							<X size={18} aria-hidden="true" />
							Quitter
						</button>
					</>
				}
			>
				<p className="cls-sheet-text">
					Les explications de Milo ne seront pas gardées.{" "}
					{memoItems.length > 0 && "Tes notes, elles, restent sur ton post-it."}
				</p>
			</ClassSheet>
		</div>
	);
};

export default MiloScene;
