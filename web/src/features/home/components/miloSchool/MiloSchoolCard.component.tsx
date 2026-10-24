import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, Mail, MessageCircle, Target } from "lucide-react";
import { ROUTES } from "@shared/constants/routes";
import { nightMixAt } from "@features/milo-scene/hooks/useDayNight";
import {
	ENTRY_MS,
	createMiloSchoolBridge,
	schoolScene,
	type MiloSchoolPart,
	type MissionsSummary,
} from "@features/home/components/miloSchool/miloSchool.bridge";
import {
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

type Mode = "idle" | "invite" | "poke" | "enter";
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
	const [bridge] = useState(createMiloSchoolBridge);

	const cardRef = useRef<HTMLElement>(null);
	const ctaRef = useRef<HTMLButtonElement>(null);

	/// Retour sur l'accueil : la scène 3D est restée prête, elle s'affiche aussitôt
	const [loaded, setLoaded] = useState(() => schoolScene.ready);
	const [visible, setVisible] = useState(true);
	const [wide, setWide] = useState(true);
	const [night, setNight] = useState(() => nightMixAt(new Date()));

	const [mode, setMode] = useState<Mode>("idle");
	const [line, setLine] = useState(() => greetingLine(context));
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
		const cta = ctaRef.current;
		if (!card || !cta) return;
		/// Bas d'écran occupé par le bouton : la scène se cadre au-dessus.
		/// Écran large ou étroit : la scène recadre, l'interface suit.
		const measure = () => {
			bridge.bottomPx = Math.max(0, card.clientHeight - cta.offsetTop + 6);
			const isWide = card.clientWidth / Math.max(card.clientHeight, 1) >= WIDE_ASPECT;
			bridge.wide = isWide;
			setWide(isWide);
		};
		const resize = new ResizeObserver(measure);
		resize.observe(card);
		resize.observe(cta);
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

	/// Milo salue l'élève qui revient
	useEffect(() => {
		if (schoolScene.ready && !reducedMotion) bridge.reactions.push("Hello");
	}, [bridge, reducedMotion]);

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
		if (bridge.phase === "entering") return;
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
		if (bridge.phase === "entering") return;
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
					gaze={!entering}
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
			<nav className="ecl-quick" aria-label="Missions et actualités">
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

			<button
				ref={ctaRef}
				type="button"
				className="ecl-cta"
				aria-label={`Discuter avec Milo, ${firstName}`}
				onPointerEnter={() => hoverDoor("button", true)}
				onPointerLeave={() => hoverDoor("button", false)}
				onFocus={() => hoverDoor("button", true)}
				onBlur={() => hoverDoor("button", false)}
				onClick={enterClassroom}
				disabled={entering}
			>
				<span className="ecl-cta-icon" aria-hidden="true">
					<MessageCircle size={22} strokeWidth={2.6} />
				</span>
				<span className="ecl-cta-label">Discuter avec Milo</span>
				<span className="ecl-cta-go" aria-hidden="true">
					<ArrowRight size={20} strokeWidth={2.8} />
				</span>
			</button>
		</section>
	);
};

export default MiloSchoolCard;
