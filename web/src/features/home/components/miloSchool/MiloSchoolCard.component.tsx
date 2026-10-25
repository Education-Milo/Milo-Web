import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { Mail, MessageCircle, Target } from "lucide-react";
import { ROUTES } from "@shared/constants/routes";
import { nightMixAt } from "@features/milo-scene/hooks/useDayNight";
import {
	ENTRY_MS,
	createMiloSchoolBridge,
	inClassroom,
	schoolScene,
	type MiloSchoolPart,
	type MissionsSummary,
} from "@features/home/components/miloSchool/miloSchool.bridge";
import {
	BACK_LINE,
	ENTER_LINE,
	INVITE_LINES,
	POKE_CLIPS,
	POKE_LINES,
	greetingLine,
	idleLines,
	mailHint,
	missionsHint,
	type MiloSchoolContext,
} from "@features/home/utils/miloSchool.talk";
import MiloSchoolScene3D from "@features/home/components/miloSchool/MiloSchoolScene3D.component";
import "@features/home/styles/MiloSchool.css";

/// L'accueil de l'élève, en grand : Milo devant sa salle de classe. La porte
/// mène à la discussion, la pancarte aux missions du jour, la boîte aux
/// lettres aux actualités.


/// Rythme de la bulle
const LINE_EVERY_MS = 8000;
const TYPE_MS = 26;
/// Durée d'une chatouille avant de reprendre le fil
const POKE_MS = 3000;
/// Laisse le temps de passer du bouton à la porte sans que celle-ci claque
const CLOSE_DELAY_MS = 260;
/// Après les sauts : la porte se referme, l'écran s'illumine, on entre en classe
const NAVIGATE_AFTER_MS = ENTRY_MS + 420;
/// En dessous de ce rapport largeur / hauteur, la pancarte et la boîte aux
/// lettres sortent du cadre : elles deviennent des boutons
const WIDE_ASPECT = 1.2;
/// Marge gardée sous les pieds de Milo, en bas d'écran
const BOTTOM_MARGIN_PX = 28;
/// Milo ressort de la classe : la scène prévient quand il est arrivé ; au cas
/// où elle ne tournerait pas (onglet en arrière-plan…), on n'attend pas plus
const EXIT_FALLBACK_MS = ENTRY_MS * 3;

type Mode = "idle" | "invite" | "poke" | "enter" | "exit";
type DoorSource = "button" | "door";

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

/** Texte qui s'écrit lettre à lettre (affiché d'un coup si mouvements réduits) */
function useTypewriter(text: string, instant: boolean) {
	const [count, setCount] = useState(instant ? text.length : 0);
	useEffect(() => {
		if (instant) {
			setCount(text.length);
			return;
		}
		setCount(0);
		const id = window.setInterval(() => {
			setCount((current) => {
				if (current >= text.length) {
					window.clearInterval(id);
					return current;
				}
				return current + 1;
			});
		}, TYPE_MS);
		return () => window.clearInterval(id);
	}, [text, instant]);
	return text.slice(0, count);
}

export interface MiloSchoolCardProps extends MiloSchoolContext {
	/** Titre d'accueil (« Bonsoir, Tinky ! 🌙 ») */
	welcome: string;
	missions: MissionsSummary;
	onOpenMissions: () => void;
	onOpenNews: () => void;
}

const MiloSchoolCard: React.FC<MiloSchoolCardProps> = ({ welcome, missions, onOpenMissions, onOpenNews, ...context }) => {
	const { firstName, streak, weakSubject, pendingMissions, unreadNews = 0 } = context;
	const navigate = useNavigate();
	const reducedMotion = Boolean(useReducedMotion());
	/// L'élève revient de la classe : Milo y est encore, il va en ressortir
	const [comingBack] = useState(() => inClassroom.get() && !reducedMotion);
	const [bridge] = useState(() => {
		const created = createMiloSchoolBridge();
		if (comingBack) {
			created.phase = "exiting";
			created.doorOpen = true;
		}
		return created;
	});

	const cardRef = useRef<HTMLElement>(null);

	/// Retour sur l'accueil : la scène 3D est restée prête, elle s'affiche aussitôt
	const [loaded, setLoaded] = useState(() => schoolScene.ready);
	const [visible, setVisible] = useState(true);
	const [wide, setWide] = useState(true);
	const [night, setNight] = useState(() => nightMixAt(new Date()));

	const [mode, setMode] = useState<Mode>(comingBack ? "exit" : "idle");
	const [line, setLine] = useState(() => (comingBack ? BACK_LINE : greetingLine(context)));
	/// Élément de la scène sous la souris (le dernier signalé fait foi)
	const [hovered, setHovered] = useState<MiloSchoolPart | null>(null);
	const doorSources = useRef(new Set<DoorSource>());
	const invites = useRef(0);
	const closeTimer = useRef<number | undefined>(undefined);
	const timers = useRef<number[]>([]);

	const talk = useMemo(
		() => ({ firstName, streak, weakSubject, pendingMissions, unreadNews }),
		[firstName, streak, weakSubject, pendingMissions, unreadNews],
	);
	const lines = useMemo(() => idleLines(talk), [talk]);
	/// Au survol de la pancarte ou de la boîte aux lettres, Milo les commente ;
	/// sinon la bulle suit son fil
	const hinting = mode === "idle" && (hovered === "missions" || hovered === "mail");
	const bubbleText = hinting ? (hovered === "missions" ? missionsHint(talk) : mailHint(talk)) : line;
	const shown = useTypewriter(bubbleText, reducedMotion);

	/* ------------------------------------------------ taille, visibilité, ambiance */

	useEffect(() => {
		const card = cardRef.current;
		if (!card) return;
		/// Écran large ou étroit : la scène recadre, l'interface suit
		const measure = () => {
			bridge.bottomPx = BOTTOM_MARGIN_PX;
			const isWide = card.clientWidth / Math.max(card.clientHeight, 1) >= WIDE_ASPECT;
			bridge.wide = isWide;
			setWide(isWide);
		};
		const resize = new ResizeObserver(measure);
		resize.observe(card);
		measure();
		/// Rendu en pause quand la page n'est pas à l'écran (onglet, défilement)
		const onScreen = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.02 });
		onScreen.observe(card);
		return () => {
			resize.disconnect();
			onScreen.disconnect();
		};
	}, [bridge]);

	useEffect(() => {
		const id = window.setInterval(() => setNight(nightMixAt(new Date())), 5 * 60_000);
		return () => window.clearInterval(id);
	}, []);

	useEffect(
		() => () => {
			window.clearTimeout(closeTimer.current);
			timers.current.forEach((id) => window.clearTimeout(id));
		},
		[],
	);

	/// Milo salue l'élève qui revient (s'il sort de la classe, il saluera dehors)
	useEffect(() => {
		if (schoolScene.ready && !reducedMotion && !comingBack) bridge.reactions.push("Hello");
	}, [bridge, reducedMotion, comingBack]);

	/// Retour de la classe : une fois la scène affichée, Milo ressort en
	/// sautillant ; la scène referme la porte et le ramène à sa place
	useEffect(() => inClassroom.set(false), []);
	useEffect(() => {
		if (mode !== "exit" || !loaded) return;
		const done = () => {
			bridge.onExitDone = null;
			setMode((current) => (current === "exit" ? "idle" : current));
			setLine(greetingLine(talk));
		};
		bridge.onExitDone = done;
		const id = window.setTimeout(done, EXIT_FALLBACK_MS);
		return () => {
			window.clearTimeout(id);
			bridge.onExitDone = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- une seule fois, à la sortie de Milo
	}, [mode, loaded]);

	const setBubble = useCallback(
		(el: HTMLDivElement | null) => {
			bridge.bubble = el;
		},
		[bridge],
	);
	const setStage = useCallback(
		(el: HTMLDivElement | null) => {
			bridge.stage = el;
		},
		[bridge],
	);

	/* ------------------------------------------------ la bulle */

	/// Au repos, Milo fait la conversation
	useEffect(() => {
		if (mode !== "idle" || hinting || !loaded || reducedMotion) return;
		let index = 0;
		const id = window.setInterval(() => {
			index = (index + 1) % lines.length;
			setLine(lines[index]);
		}, LINE_EVERY_MS);
		return () => window.clearInterval(id);
	}, [mode, hinting, loaded, lines, reducedMotion]);

	/// Minuteries annulées au démontage (`later` ne lit que des refs)
	const later = (fn: () => void, ms: number) => {
		timers.current.push(window.setTimeout(fn, ms));
	};

	/* ------------------------------------------------ la porte */

	const openDoor = useCallback(() => {
		window.clearTimeout(closeTimer.current);
		if (bridge.phase === "entering" || bridge.phase === "exiting") return;
		if (bridge.phase !== "inviting") {
			bridge.phase = "inviting";
			bridge.doorOpen = true;
			setLine(INVITE_LINES[invites.current++ % INVITE_LINES.length]);
			setMode("invite");
		}
	}, [bridge]);

	const closeDoor = useCallback(() => {
		window.clearTimeout(closeTimer.current);
		closeTimer.current = window.setTimeout(() => {
			if (bridge.phase !== "inviting" || doorSources.current.size) return;
			bridge.phase = "idle";
			bridge.doorOpen = false;
			setMode("idle");
			setLine(pick(lines));
		}, CLOSE_DELAY_MS);
	}, [bridge, lines]);

	const hoverDoor = useCallback(
		(source: DoorSource, on: boolean) => {
			if (on) doorSources.current.add(source);
			else doorSources.current.delete(source);
			if (doorSources.current.size) openDoor();
			else closeDoor();
		},
		[openDoor, closeDoor],
	);

	/** Milo file en classe, la porte se referme derrière lui, et on le rejoint */
	const enterClassroom = useCallback(() => {
		if (bridge.phase === "entering" || bridge.phase === "exiting") return;
		/// Au retour sur l'accueil, Milo ressortira de la classe
		inClassroom.set(true);
		if (reducedMotion || !loaded) {
			navigate(ROUTES.MILO);
			return;
		}
		window.clearTimeout(closeTimer.current);
		bridge.phase = "entering";
		bridge.doorOpen = true;
		setLine(ENTER_LINE);
		setMode("enter");
		later(() => (bridge.doorOpen = false), ENTRY_MS + 60);
		later(() => navigate(ROUTES.MILO), NAVIGATE_AFTER_MS);
	}, [bridge, loaded, navigate, reducedMotion]);

	const poke = useCallback(() => {
		if (bridge.phase !== "idle") return;
		bridge.reactions.push(pick(POKE_CLIPS));
		setLine(pick(POKE_LINES));
		setMode("poke");
		later(() => {
			setMode((current) => (current === "poke" ? "idle" : current));
		}, POKE_MS);
	}, [bridge]);

	/// Ce que la scène 3D remonte : survol et clics
	useEffect(() => {
		bridge.onHover = (part: MiloSchoolPart | null) => {
			setHovered(part);
			hoverDoor("door", part === "door");
		};
		bridge.onPick = (part: MiloSchoolPart) => {
			if (part === "door") enterClassroom();
			else if (part === "milo") poke();
			else if (part === "missions") onOpenMissions();
			else onOpenNews();
		};
		return () => {
			bridge.onHover = null;
			bridge.onPick = null;
		};
	}, [bridge, hoverDoor, enterClassroom, poke, onOpenMissions, onOpenNews]);

	const handleReady = useCallback(() => setLoaded(true), []);

	const entering = mode === "enter";
	const exiting = mode === "exit";
	const missionsLabel =
		missions.total > 0 ? `Missions du jour, ${missions.done} sur ${missions.total} terminées` : "Missions du jour";

	return (
		<section
			ref={cardRef}
			className={[
				"ecl-card",
				loaded && "is-loaded",
				wide ? "is-wide" : "is-narrow",
				night > 0.5 && "is-night",
				mode === "invite" && "is-open",
				entering && "is-entering",
				hovered !== null && "is-pointing",
			]
				.filter(Boolean)
				.join(" ")}
			aria-label="Accueil : Milo devant sa salle de classe"
		>
			<div ref={setStage} className="ecl-stage" aria-hidden="true">
				<MiloSchoolScene3D
					bridge={bridge}
					active={visible}
					reducedMotion={reducedMotion}
					gaze={!entering && !exiting}
					night={night}
					missions={missions}
					unreadNews={unreadNews}
					onReady={handleReady}
				/>
				<div className="ecl-flash" />
			</div>

			<header className="ecl-hello">
				<h1 className="ecl-hello-title">{welcome}</h1>
				<p className="ecl-hello-sub">Prêt à conquérir de nouveaux défis aujourd'hui ?</p>
			</header>

			{/* Raccourcis : visibles sur écran étroit (la pancarte et la boîte
			    aux lettres sont hors cadre), et toujours atteignables au clavier */}
			<nav className="ecl-quick" aria-label="Discussion, missions et actualités">
				<button
					type="button"
					className="ecl-quick-btn is-main"
					onClick={enterClassroom}
					onPointerEnter={() => hoverDoor("button", true)}
					onPointerLeave={() => hoverDoor("button", false)}
					onFocus={() => hoverDoor("button", true)}
					onBlur={() => hoverDoor("button", false)}
					aria-label={`Discuter avec Milo, ${firstName}`}
				>
					<MessageCircle size={18} strokeWidth={2.6} aria-hidden="true" />
					<span>Discuter</span>
				</button>
				<button type="button" className="ecl-quick-btn" onClick={onOpenMissions} aria-label={missionsLabel}>
					<Target size={18} strokeWidth={2.6} aria-hidden="true" />
					<span>Missions</span>
					{missions.pending > 0 && <b className="ecl-quick-count">{missions.pending}</b>}
				</button>
				<button
					type="button"
					className="ecl-quick-btn"
					onClick={onOpenNews}
					aria-label={unreadNews > 0 ? `Actualités, ${unreadNews} non lues` : "Actualités"}
				>
					<Mail size={18} strokeWidth={2.6} aria-hidden="true" />
					<span>Courrier</span>
					{unreadNews > 0 && <b className="ecl-quick-count">{unreadNews}</b>}
				</button>
			</nav>

			<div
				ref={setBubble}
				className={`ecl-bubble${mode === "invite" || entering ? " is-loud" : ""}`}
				aria-hidden="true"
			>
				<span>{shown}</span>
				<span className="ecl-bubble-rest">{bubbleText.slice(shown.length)}</span>
			</div>

		</section>
	);
};

export default MiloSchoolCard;
