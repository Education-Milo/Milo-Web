import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, CircleHelp, Maximize2, SendHorizontal, Volume2 } from "lucide-react";
import ClassroomScene3D from "@features/milo-scene/components/ClassroomScene3D.component";
import ClassroomFlat from "@features/milo-scene/components/ClassroomFlat.component";
import ClassroomLoading from "@features/milo-scene/components/ClassroomLoading.component";
import ChalkTitle from "@features/milo-scene/components/ChalkTitle.component";
import { useDayNight } from "@features/milo-scene/hooks/useDayNight";
import type { MiloAnimation } from "@features/milo-scene/hooks/useMiloScene";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { INTEREST_SUGGESTIONS } from "@features/interests/hooks/useInterests";
import { isWebGLAvailable } from "@shared/utils/webgl";
import { useUserStore } from "@shared/store/user/user.store";
import { showToast } from "@shared/store/toast/toast.store";
import { AI_LIMITS, INTERESTS_LIMIT_MESSAGE, getErrorStatus } from "@shared/lib/aiRequests";
import { getSubjectVisuals } from "@shared/constants/courses";
import { ROUTES } from "@shared/constants/routes";
import {
	CLASS_SLIDES,
	DEMO_LESSON,
	INTEREST_SAVED_LINE,
	PASSAGE_ACTIONS,
	TOUR_STEPS,
	type ClassFocus,
	type ClassSlide,
} from "@features/onboarding/data/onboarding.data";
import { useOnboardingStore } from "@features/onboarding/store/onboarding.store";
import { useTargetRect } from "@features/onboarding/hooks/useTargetRect";
import "@features/milo-scene/styles/Classroom.css";
import "@features/onboarding/styles/Onboarding.css";

/// Vitesse de la machine à écrire de la bulle (caractères par seconde)
const TYPE_CPS = 45;
/// Filet de sécurité si l'entrée de Milo ne se termine jamais
const ENTRANCE_FALLBACK_MS = 8000;
const SPOT_PAD = 10;

const LOADING_LINES = [
	"Milo prépare ta place…",
	"Il écrit ton prénom au tableau…",
	"Il taille ses craies…",
	"Presque prêt !",
];

/// Élément de la salle mis en lumière pour chaque écran
const FOCUS_SELECTOR: Record<Exclude<ClassFocus, null>, string> = {
	board: ".cls-chalkboard",
	sheet: ".cls-paper",
	notes: ".cls-postit",
	toolbar: ".ob-mock .cls-top",
};

/* ============================================================
   TABLEAU — reprend le vrai tableau de la classe
   ============================================================ */
const DemoLessonBoard: React.FC<{ activeSentence?: number }> = ({ activeSentence }) => (
	<div className="cls-board-view ob-board-lesson">
		<header className="cls-board-head">
			<div className="cls-board-titles">
				<span className="cls-chalk-eyebrow">Partie 1 sur {DEMO_LESSON.parts}</span>
				<ChalkTitle text={DEMO_LESSON.title} />
			</div>
			<div className="cls-board-head-tools">
				<span className="cls-btn cls-btn--chalk cls-btn--sm">
					<Volume2 size={18} aria-hidden="true" /> Écouter
				</span>
				<span className="cls-btn cls-btn--chalk cls-btn--sm cls-btn--icon">
					<Maximize2 size={30} strokeWidth={2.6} aria-hidden="true" />
				</span>
			</div>
		</header>
		<div className="cls-board-scroll">
			<div className="cls-board-content is-interactive">
				{DEMO_LESSON.sentences.map((sentence, i) => (
					<p key={sentence} className="cls-board-block cls-board-block--paragraph">
						<span className={`cls-sentence${activeSentence === i ? " is-active" : ""}`}>{sentence}</span>
						{activeSentence === i && (
							<motion.span
								className="cls-passage-toolbar ob-passage-toolbar"
								initial={{ opacity: 0, y: 8, scale: 0.95 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								transition={{ delay: 0.5, type: "spring", stiffness: 380, damping: 22 }}
							>
								<span className="cls-passage-actions">
									{PASSAGE_ACTIONS.map((a) => (
										<span key={a.label} className="cls-passage-action">
											{a.icon ? (
												<img className="cls-passage-emoji" src={`/landing/emoji/${a.icon}.webp`} alt="" />
											) : (
												<span className="cls-passage-icon">
													<Volume2 size={14} strokeWidth={2.6} />
												</span>
											)}
											<span>{a.label}</span>
										</span>
									))}
								</span>
							</motion.span>
						)}
					</p>
				))}
			</div>
		</div>
		<footer className="cls-board-nav">
			<span className="cls-btn cls-btn--chalk cls-btn--sm cls-btn--icon">
				<ArrowLeft size={20} />
			</span>
			<ol className="cls-steps cls-steps--chalk">
				{Array.from({ length: DEMO_LESSON.parts }, (_, i) => (
					<li key={i}>
						<span className={`cls-step ${i === 0 ? "is-current" : "is-locked"}`}>
							<span />
						</span>
					</li>
				))}
			</ol>
			<span className="cls-board-nav-count">1 / {DEMO_LESSON.parts}</span>
			<span className="cls-btn cls-btn--primary cls-btn--sm cls-btn--next">
				<span>Partie suivante</span>
				<ArrowRight size={20} aria-hidden="true" />
			</span>
		</footer>
	</div>
);

/** Flèche tracée à la craie vers l'objet que Milo montre */
const ChalkPointer: React.FC<{ direction: "down" | "up" | "down-right"; label: string }> = ({ direction, label }) => (
	<div className={`ob-chalk-pointer is-${direction}`}>
		<svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
			<path d="M60 10 C 40 45, 80 70, 60 100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 12" />
			<path d="M42 84 L60 104 L78 84" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
		<span>{label}</span>
	</div>
);

const BoardContent: React.FC<{ slide: ClassSlide; name: string; savedInterest: string | null }> = ({
	slide,
	name,
	savedInterest,
}) => {
	const reduceMotion = useReducedMotion();
	const pop = (i: number) =>
		reduceMotion
			? { initial: { opacity: 0 }, animate: { opacity: 1 } }
			: {
					initial: { opacity: 0, y: 24, scale: 0.85, rotate: -3 },
					animate: { opacity: 1, y: 0, scale: 1, rotate: 0 },
					transition: { delay: 0.35 + i * 0.12, type: "spring" as const, stiffness: 380, damping: 18 },
				};

	if (slide.board === "lesson") return <DemoLessonBoard key="lesson" />;
	if (slide.board === "passage") return <DemoLessonBoard key="passage" activeSentence={1} />;

	return (
		<div className="ob-board" key={slide.id}>
			<ChalkTitle text={slide.title} highlight={slide.highlight} className="cls-board-title ob-board-title" />

			{slide.board === "welcome" && (
				<div className="ob-board-center">
					<motion.div className="ob-board-hero" {...pop(0)}>
						<Emoji3D name="fox" className="ob-board-hero-icon" />
						<Emoji3D name="sparkles" className="ob-board-hero-spark" />
					</motion.div>
					<motion.p className="ob-chalk-line" {...pop(1)}>
						Nouvel élève : <span className="ob-chalk-hl">{name}</span>
					</motion.p>
				</div>
			)}

			{slide.board === "sheet" && (
				<div className="ob-board-center">
					<motion.p className="ob-chalk-line" {...pop(0)}>
						1. Clique sur la feuille · 2. Écris · 3. Envoie
					</motion.p>
					<motion.div {...pop(1)}>
						<ChalkPointer direction="down" label="ta feuille, sur le bureau" />
					</motion.div>
				</div>
			)}

			{slide.board === "interest" && (
				<div className="ob-board-center">
					<motion.div className="ob-chalk-card ob-chalk-card--wide" {...pop(0)}>
						<Emoji3D name={savedInterest ? "party_popper" : "bullseye"} />
						<span>
							Centre d'intérêt de {name} : <span className="ob-chalk-hl">{savedInterest ?? "…"}</span>
						</span>
					</motion.div>
				</div>
			)}

			{slide.board === "notes" && (
				<div className="ob-board-center">
					<motion.p className="ob-chalk-line" {...pop(0)}>
						« Noter » sur une phrase : elle se colle sur le post-it
					</motion.p>
					<motion.div {...pop(1)}>
						<ChalkPointer direction="down-right" label="le post-it jaune" />
					</motion.div>
				</div>
			)}

			{slide.board === "toolbar" && (
				<div className="ob-board-center">
					<motion.div {...pop(0)}>
						<ChalkPointer direction="up" label="tes outils, tout en haut" />
					</motion.div>
				</div>
			)}

			{slide.board === "map" && (
				<div className="ob-board-map">
					<svg className="ob-map-path" viewBox="0 0 900 140" preserveAspectRatio="none" aria-hidden="true">
						<path d="M40 70 C 180 0, 260 140, 450 70 S 720 0, 860 70" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="4 16" strokeLinecap="round" />
					</svg>
					{TOUR_STEPS.map((s, i) => (
						<motion.div key={s.id} className="ob-map-stop" {...pop(i)}>
							<span className="ob-map-num">{i + 1}</span>
							<Emoji3D name={s.icon} />
							<span className="ob-map-label">{s.title}</span>
						</motion.div>
					))}
				</div>
			)}
		</div>
	);
};

/* ============================================================
   OBJETS DU BUREAU
   ============================================================ */
const SheetIdle: React.FC = () => (
	<div className="ob-sheet">
		<p className="ob-sheet-title">Écris à Milo ici</p>
		<span className="ob-sheet-lines" />
	</div>
);

interface InterestSheetProps {
	saved: string | null;
	saving: boolean;
	onSubmit: (value: string) => void;
}

/** Feuille prise en main : l'élève écrit son premier centre d'intérêt */
const InterestSheet: React.FC<InterestSheetProps> = ({ saved, saving, onSubmit }) => {
	const [value, setValue] = useState("");
	if (saved) {
		return (
			<div className="ob-sheet ob-sheet--done">
				<span className="ob-sheet-check">
					<Check size={64} strokeWidth={3} aria-hidden="true" />
				</span>
				<p className="ob-sheet-title">Envoyé à Milo&nbsp;!</p>
				<p className="ob-sheet-saved">{saved}</p>
			</div>
		);
	}
	return (
		<form
			className="ob-sheet ob-sheet--form"
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit(value);
			}}
		>
			<label className="ob-sheet-title" htmlFor="ob-interest">
				Ce que j'adore :
			</label>
			<input
				id="ob-interest"
				className="ob-sheet-input"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				maxLength={AI_LIMITS.INTEREST_NAME}
				placeholder="Ex. le foot, les mangas…"
				autoComplete="off"
			/>
			<div className="ob-sheet-chips">
				{INTEREST_SUGGESTIONS.map((s) => (
					<button
						key={s}
						type="button"
						className="ob-sheet-chip"
						onMouseDown={(e) => e.preventDefault()}
						onClick={() => setValue(s)}
					>
						{s}
					</button>
				))}
			</div>
			<button
				type="submit"
				className="ob-sheet-send"
				disabled={!value.trim() || saving}
				onMouseDown={(e) => e.preventDefault()}
			>
				{saving ? "Envoi…" : "Envoyer à Milo"} <SendHorizontal size={40} aria-hidden="true" />
			</button>
		</form>
	);
};

const NotesDecor: React.FC<{ held: boolean }> = ({ held }) => (
	<div className={`ob-postit${held ? " is-held" : ""}`}>
		<strong>Mes notes</strong>
		{held ? (
			<ul>
				<li>Une fraction = une partie d'un tout</li>
				<li>Dénominateur : en bas, le nombre de parts</li>
			</ul>
		) : (
			<span>Tes phrases notées atterrissent ici</span>
		)}
	</div>
);

/* ============================================================
   BARRE DU HAUT — maquette fidèle, non cliquable
   ============================================================ */
const MockTopBar: React.FC = () => (
	<div className="cls-ui ob-mock" inert aria-hidden="true">
		<header className="cls-top">
			<span className="cls-btn cls-btn--secondary cls-btn--sm">
				<ArrowLeft size={18} aria-hidden="true" />
				<span className="cls-hide-sm">Quitter</span>
			</span>
			<div className="cls-top-id">
				<span className="cls-top-emoji">{getSubjectVisuals(DEMO_LESSON.subject).emoji}</span>
				<div className="cls-top-titles">
					<span className="cls-top-sub">{DEMO_LESSON.subject}</span>
					<span className="cls-top-title">{DEMO_LESSON.title}</span>
				</div>
			</div>
			<nav className="cls-top-actions">
				<span className="cls-btn cls-btn--secondary cls-btn--sm">
					<img className="cls-btn-emoji" src="/landing/emoji/bullseye.webp" alt="" />
					<span className="cls-label-long">Quiz de la leçon</span>
					<span className="cls-label-short">Quiz</span>
				</span>
				<span className="cls-btn cls-btn--secondary cls-btn--sm">
					<img className="cls-btn-emoji" src="/landing/emoji/books.webp" alt="" />
					<span className="cls-label-long">Changer de leçon</span>
					<span className="cls-label-short">Leçons</span>
				</span>
				<span className="cls-btn cls-btn--secondary cls-btn--sm">
					<img className="cls-btn-emoji" src="/landing/emoji/card_index_dividers.webp" alt="" />
					<span>Mes notes</span>
				</span>
				<span className="cls-icon-btn cls-icon-btn--solid">
					<CircleHelp size={20} />
				</span>
			</nav>
		</header>
	</div>
);

/* ============================================================
   VOILE — masque SVG troué (un box-shadow géant ne s'affiche pas
   toujours au-dessus de la scène WebGL)
   ============================================================ */
const roundedRect = (x: number, y: number, w: number, h: number, r: number) =>
	`M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
	`H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

const SpotVeil: React.FC<{ rect: { top: number; left: number; width: number; height: number } }> = ({ rect }) => {
	const x = rect.left - SPOT_PAD;
	const y = rect.top - SPOT_PAD;
	const w = rect.width + SPOT_PAD * 2;
	const h = rect.height + SPOT_PAD * 2;
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	return (
		<>
			<svg className="ob-class-veil" width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`} aria-hidden="true">
				<path fillRule="evenodd" d={`M0 0H${vw}V${vh}H0Z ${roundedRect(x, y, w, h, 24)}`} />
			</svg>
			<div className="ob-class-ring" aria-hidden="true" style={{ top: y, left: x, width: w, height: h }} />
		</>
	);
};

/* ============================================================
   PAGE
   ============================================================ */
const OnboardingClassroomPage: React.FC = () => {
	const navigate = useNavigate();
	const reduceMotion = useReducedMotion();
	const user = useUserStore((s) => s.user);
	const addUserInterest = useUserStore((s) => s.addUserInterest);
	const name = `${user?.first_name ?? ""}`.trim() || user?.username || "toi";
	const { phase, isTest, startClassroom, startTour, skip } = useOnboardingStore();
	const dayNight = useDayNight();

	// Arrivée directe sur /bienvenue (inscription, rechargement) : on passe en phase classe
	useEffect(() => {
		if (phase !== "classroom") startClassroom({ userId: user?.id ?? null });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// ── Chargement et entrée de Milo ──
	const [hasWebGL] = useState(isWebGLAvailable);
	const [sceneReady, setSceneReady] = useState(!hasWebGL);
	const [introDone, setIntroDone] = useState(!hasWebGL);
	const [entered, setEntered] = useState(!hasWebGL);
	const [skipSignal, setSkipSignal] = useState(0);
	const [overlayGone, setOverlayGone] = useState(!hasWebGL);
	const markReady = useCallback(() => setSceneReady(true), []);
	const markIntroDone = useCallback(() => setIntroDone(true), []);
	const markEntered = useCallback(() => setEntered(true), []);

	useEffect(() => {
		if (!sceneReady) return;
		const t = setTimeout(() => setOverlayGone(true), 700);
		return () => clearTimeout(t);
	}, [sceneReady]);

	useEffect(() => {
		if (!sceneReady || entered) return;
		const fallback = setTimeout(markEntered, ENTRANCE_FALLBACK_MS);
		return () => clearTimeout(fallback);
	}, [sceneReady, entered, markEntered]);

	// ── Centre d'intérêt écrit sur la feuille ──
	const [savedInterest, setSavedInterest] = useState<string | null>(null);
	const [savingInterest, setSavingInterest] = useState(false);
	const submitInterest = useCallback(
		async (raw: string) => {
			const value = raw.trim().slice(0, AI_LIMITS.INTEREST_NAME);
			if (!value || savingInterest) return;
			setSavingInterest(true);
			try {
				// Test admin : rien n'est enregistré sur le compte
				if (!isTest) await addUserInterest(value);
				setSavedInterest(value);
			} catch (error) {
				showToast(
					getErrorStatus(error) === 409
						? INTERESTS_LIMIT_MESSAGE
						: "Milo n'a pas pu noter ça. Réessaie, ou passe cette étape.",
					"error",
				);
			} finally {
				setSavingInterest(false);
			}
		},
		[isTest, addUserInterest, savingInterest],
	);

	// ── Écrans et machine à écrire ──
	const [index, setIndex] = useState(0);
	const slide = CLASS_SLIDES[index];
	const isLast = index === CLASS_SLIDES.length - 1;
	const isInterest = slide.board === "interest";
	const waitingInterest = isInterest && !savedInterest;
	const line = useMemo(() => {
		const source = isInterest && savedInterest ? INTEREST_SAVED_LINE : slide.line;
		return source
			.replace("{name}", name)
			.replace("{interest}", savedInterest ?? "")
			.replace("{count}", String(TOUR_STEPS.length));
	}, [slide, name, isInterest, savedInterest]);
	const [typed, setTyped] = useState(0);
	const typing = entered && typed < line.length;

	useEffect(() => setTyped(reduceMotion ? line.length : 0), [line, reduceMotion]);

	useEffect(() => {
		if (!typing) return;
		const id = window.setInterval(() => setTyped((n) => Math.min(line.length, n + 1)), 1000 / TYPE_CPS);
		return () => window.clearInterval(id);
	}, [typing, line.length]);

	const animation: MiloAnimation = typing ? "Explaining" : "Idle";

	// ── Mise en lumière de ce que Milo montre ──
	const rect = useTargetRect(entered && slide.focus ? FOCUS_SELECTOR[slide.focus] : null, { allowInert: true });

	const goToTour = useCallback(() => {
		startTour({ step: 0 });
		navigate(TOUR_STEPS[0].route, { replace: true });
	}, [startTour, navigate]);

	const later = useCallback(() => {
		const wasTest = isTest;
		skip();
		navigate(wasTest ? ROUTES.ADMIN.ONBOARDING : ROUTES.HOME, { replace: true });
	}, [isTest, skip, navigate]);

	const advance = useCallback(() => {
		if (!entered) {
			setSkipSignal((n) => n + 1);
			return;
		}
		if (typing) {
			setTyped(line.length);
			return;
		}
		if (waitingInterest) return;
		if (isLast) goToTour();
		else setIndex((i) => i + 1);
	}, [entered, typing, line.length, waitingInterest, isLast, goToTour]);

	const skipStep = useCallback(() => setIndex((i) => Math.min(i + 1, CLASS_SLIDES.length - 1)), []);
	const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

	// Clavier : → / Entrée / Espace avancent, ← recule, Échap passe l'entrée de Milo.
	// Rien quand l'élève écrit sur la feuille.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.altKey || e.ctrlKey || e.metaKey) return;
			const target = e.target as HTMLElement;
			if (target.closest("input, textarea")) return;
			const onButton = Boolean(target.closest("button, a"));
			if (e.key === "ArrowRight" || (!onButton && (e.key === "Enter" || e.key === " "))) {
				e.preventDefault();
				advance();
			} else if (e.key === "ArrowLeft") {
				e.preventDefault();
				back();
			} else if (e.key === "Escape" && !entered) {
				setSkipSignal((n) => n + 1);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [advance, back, entered]);

	// Un focus dans la feuille 3D peut faire défiler son conteneur HTML, ce qui
	// l'éjecte de l'écran : tant qu'un objet est en main, on remet ce défilement à zéro
	useEffect(() => {
		if (!slide.hold) return;
		let raf = 0;
		const keepInPlace = () => {
			let el = document.querySelector<HTMLElement>(".cls-paper, .cls-postit")?.parentElement ?? null;
			while (el && el !== document.body) {
				if (el.scrollLeft) el.scrollLeft = 0;
				if (el.scrollTop) el.scrollTop = 0;
				el = el.parentElement;
			}
			raf = requestAnimationFrame(keepInPlace);
		};
		keepInPlace();
		return () => cancelAnimationFrame(raf);
	}, [slide.hold]);

	// La feuille vient devant l'élève : le curseur se place dans le champ
	useEffect(() => {
		if (!isInterest || savedInterest || typing) return;
		const t = setTimeout(() => document.getElementById("ob-interest")?.focus({ preventScroll: true }), 300);
		return () => clearTimeout(t);
	}, [isInterest, savedInterest, typing]);

	const board = <BoardContent slide={slide} name={name} savedInterest={savedInterest} />;
	const heldSheet = slide.hold === "sheet";
	const heldNotes = slide.hold === "notes";
	const sheet = isInterest ? (
		<InterestSheet saved={savedInterest} saving={savingInterest} onSubmit={submitInterest} />
	) : (
		<SheetIdle />
	);
	const notes = <NotesDecor held={heldNotes} />;
	const noop = () => {};

	const primaryLabel = typing
		? "Lire tout"
		: waitingInterest
			? "Écris sur ta feuille"
			: isLast
				? "Visiter l'école"
				: "Suivant";

	return (
		<div className="cls-root ob-class">
			{hasWebGL ? (
				<ClassroomScene3D
					activeAnimation={animation}
					introRunning={sceneReady}
					introDone={introDone}
					onIntroDone={markIntroDone}
					onLanded={markEntered}
					skipSignal={skipSignal}
					reducedMotion={Boolean(reduceMotion)}
					onReady={markReady}
					isEditing={heldSheet}
					onSheetClick={noop}
					isNotesOpen={heldNotes}
					onNotesClick={noop}
					notesBump={0}
					boardVisible={entered}
					board={board}
					sheet={sheet}
					notes={notes}
					nightTarget={dayNight.nightTarget}
				/>
			) : (
				<ClassroomFlat board={board} sheet={sheet} notes={notes} isEditing={heldSheet} isNotesOpen={heldNotes} onNotesClick={noop} />
			)}

			{entered && <MockTopBar />}

			{/* Voile troué autour de ce que Milo montre */}
			{rect && <SpotVeil rect={rect} />}

			{hasWebGL && !overlayGone && (
				<ClassroomLoading done={sceneReady} title="Bienvenue chez Milo !" highlight="Milo" messages={LOADING_LINES} />
			)}

			{/* Intro de Milo en cours : on peut la passer */}
			{sceneReady && !entered && (
				<button type="button" className="ob-btn ob-btn--ghost ob-btn--sm ob-skip-intro" onClick={() => setSkipSignal((n) => n + 1)}>
					Passer l'entrée <kbd>Échap</kbd>
				</button>
			)}

			{/* ── Bulle de Milo : en haut quand il montre le bureau, pour ne rien cacher ── */}
			<AnimatePresence>
				{entered && (
					<motion.section
						key="bubble"
						className={`ob-bubble is-${slide.bubble}`}
						aria-live="polite"
						aria-label="Milo te parle"
						initial={{ opacity: 0, scale: 0.94 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ type: "spring", stiffness: 260, damping: 26 }}
						onClick={() => typing && setTyped(line.length)}
					>
						<span className="ob-bubble-avatar" aria-hidden="true">
							<img src="/landing/emoji/fox.webp" alt="" />
						</span>
						<div className="ob-bubble-main">
							<div className="ob-bubble-head">
								<span className="ob-bubble-name">Milo</span>
								<div
									className="ob-quest-bar"
									role="progressbar"
									aria-valuemin={1}
									aria-valuemax={CLASS_SLIDES.length}
									aria-valuenow={index + 1}
									aria-label="Progression de la visite de la classe"
								>
									<motion.span
										className="ob-quest-fill"
										animate={{ width: `${((index + 1) / CLASS_SLIDES.length) * 100}%` }}
										transition={{ type: "spring", stiffness: 200, damping: 24 }}
									/>
								</div>
							</div>

							<p className="ob-bubble-text">
								<span className="sr-only">{line}</span>
								<span aria-hidden="true">
									{line.slice(0, typed)}
									<span className="ob-bubble-ghost">{line.slice(typed)}</span>
								</span>
							</p>

							<div className="ob-bubble-actions">
								<button type="button" className="ob-link" onClick={later}>
									{isLast ? "Plus tard" : "Passer l'introduction"}
								</button>
								<span className="ob-bubble-spacer" />
								{index > 0 && (
									<button type="button" className="ob-btn ob-btn--ghost ob-btn--sm" onClick={back}>
										<ArrowLeft size={16} aria-hidden="true" /> Retour
									</button>
								)}
								{waitingInterest && !typing && (
									<button type="button" className="ob-btn ob-btn--ghost ob-btn--sm" onClick={skipStep}>
										Pas d'idée
									</button>
								)}
								<button
									type="button"
									className="ob-btn ob-btn--primary ob-btn--sm"
									onClick={advance}
									disabled={waitingInterest && !typing}
								>
									{primaryLabel}
									{!waitingInterest && <ArrowRight size={18} aria-hidden="true" />}
								</button>
							</div>
						</div>
					</motion.section>
				)}
			</AnimatePresence>
		</div>
	);
};

export default OnboardingClassroomPage;
