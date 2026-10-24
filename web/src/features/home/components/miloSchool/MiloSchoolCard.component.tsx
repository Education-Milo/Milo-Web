import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { ROUTES } from "@shared/constants/routes";
import { nightMixAt } from "@features/milo-scene/hooks/useDayNight";
import { ENTRY_MS, createMiloSchoolBridge } from "@features/home/components/miloSchool/miloSchool.bridge";
import {
	ENTER_LINE,
	INVITE_LINES,
	POKE_CLIPS,
	POKE_LINES,
	greetingLine,
	idleLines,
	type MiloSchoolContext,
} from "@features/home/utils/miloSchool.talk";
import "@features/home/styles/MiloSchool.css";

/// La 3D (three.js, le modèle de Milo, l'école) n'est chargée que quand la
/// carte approche de l'écran
const MiloSchoolScene3D = lazy(() => import("@features/home/components/miloSchool/MiloSchoolScene3D.component"));

/// Rythme de la bulle
const LINE_EVERY_MS = 8000;
const TYPE_MS = 26;
/// Durée d'une chatouille avant de reprendre le fil
const POKE_MS = 3000;
/// Laisse le temps de passer du bouton à la porte sans que celle-ci claque
const CLOSE_DELAY_MS = 260;
/// Après les sauts : la porte se referme, l'écran s'illumine, on entre en classe
const NAVIGATE_AFTER_MS = ENTRY_MS + 420;

type Mode = "idle" | "invite" | "poke" | "enter";
type HoverSource = "button" | "door";

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

const MiloSchoolCard: React.FC<MiloSchoolContext> = (context) => {
	const { firstName, streak, weakSubject, pendingMissions } = context;
	const navigate = useNavigate();
	const reducedMotion = Boolean(useReducedMotion());
	const [bridge] = useState(createMiloSchoolBridge);

	const cardRef = useRef<HTMLElement>(null);
	const ctaRef = useRef<HTMLButtonElement>(null);

	const [mounted, setMounted] = useState(false);
	const [visible, setVisible] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const [night, setNight] = useState(() => nightMixAt(new Date()));

	const [mode, setMode] = useState<Mode>("idle");
	const [line, setLine] = useState(() => greetingLine(context));
	const [doorHover, setDoorHover] = useState(false);
	const hovered = useRef(new Set<HoverSource>());
	const invites = useRef(0);
	const closeTimer = useRef<number | undefined>(undefined);
	const timers = useRef<number[]>([]);

	const talk = useMemo(
		() => ({ firstName, streak, weakSubject, pendingMissions }),
		[firstName, streak, weakSubject, pendingMissions],
	);
	const lines = useMemo(() => idleLines(talk), [talk]);
	const shown = useTypewriter(line, reducedMotion);

	/* ------------------------------------------------ visibilité et ambiance */

	useEffect(() => {
		const card = cardRef.current;
		if (!card) return;
		/// Montée de la 3D un peu avant l'arrivée à l'écran ; rendu en pause hors écran
		const near = new IntersectionObserver(([entry]) => entry.isIntersecting && setMounted(true), {
			rootMargin: "300px",
		});
		const onScreen = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
		near.observe(card);
		onScreen.observe(card);
		return () => {
			near.disconnect();
			onScreen.disconnect();
		};
	}, []);

	useEffect(() => {
		const id = window.setInterval(() => setNight(nightMixAt(new Date())), 5 * 60_000);
		return () => window.clearInterval(id);
	}, []);

	/// Bas de carte occupé par le bouton : la scène se cadre au-dessus
	useEffect(() => {
		const card = cardRef.current;
		const cta = ctaRef.current;
		if (!card || !cta) return;
		const measure = () => {
			bridge.bottomPx = Math.max(0, card.clientHeight - cta.offsetTop + 6);
		};
		const observer = new ResizeObserver(measure);
		observer.observe(card);
		observer.observe(cta);
		measure();
		return () => observer.disconnect();
	}, [bridge]);

	useEffect(
		() => () => {
			window.clearTimeout(closeTimer.current);
			timers.current.forEach((id) => window.clearTimeout(id));
		},
		[],
	);

	const setBubble = useCallback(
		(el: HTMLDivElement | null) => {
			bridge.bubble = el;
		},
		[bridge],
	);

	/* ------------------------------------------------ la bulle */

	/// Au repos, Milo fait la conversation
	useEffect(() => {
		if (mode !== "idle" || !loaded || reducedMotion) return;
		let index = 0;
		const id = window.setInterval(() => {
			index = (index + 1) % lines.length;
			setLine(lines[index]);
		}, LINE_EVERY_MS);
		return () => window.clearInterval(id);
	}, [mode, loaded, lines, reducedMotion]);

	/* ------------------------------------------------ la porte */

	/// Minuteries annulées au démontage (`later` ne lit que des refs)
	const later = (fn: () => void, ms: number) => {
		timers.current.push(window.setTimeout(fn, ms));
	};

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
			if (bridge.phase !== "inviting" || hovered.current.size) return;
			bridge.phase = "idle";
			bridge.doorOpen = false;
			setMode("idle");
			setLine(pick(lines));
		}, CLOSE_DELAY_MS);
	}, [bridge, lines]);

	const hover = useCallback(
		(source: HoverSource, on: boolean) => {
			if (on) hovered.current.add(source);
			else hovered.current.delete(source);
			if (hovered.current.size) openDoor();
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

	/// Ce que la scène 3D remonte : survol et clics sur la porte ou sur Milo
	useEffect(() => {
		bridge.onHover = (part) => {
			setDoorHover(part !== null);
			if (part === "door") hover("door", true);
			else hover("door", false);
		};
		bridge.onDoorClick = enterClassroom;
		bridge.onMiloClick = poke;
		return () => {
			bridge.onHover = null;
			bridge.onDoorClick = null;
			bridge.onMiloClick = null;
		};
	}, [bridge, hover, enterClassroom, poke]);

	const handleReady = useCallback(() => setLoaded(true), []);

	const entering = mode === "enter";
	const ariaLabel = `Discuter avec Milo, ${firstName}`;

	return (
		<section
			ref={cardRef}
			className={[
				"ms-card",
				loaded && "is-loaded",
				mode === "invite" && "is-open",
				entering && "is-entering",
				doorHover && "is-pointing",
			]
				.filter(Boolean)
				.join(" ")}
			aria-label="Discute avec Milo"
		>
			<div className="ms-stage" aria-hidden="true">
				{mounted && (
					<Suspense fallback={null}>
						<MiloSchoolScene3D
							bridge={bridge}
							active={visible}
							reducedMotion={reducedMotion}
							gaze={!entering}
							night={night}
							onReady={handleReady}
						/>
					</Suspense>
				)}
				<div className="ms-curtain">
					<img src="/fox_emoji.png" alt="" className="ms-curtain-fox" />
					<span>Milo arrive…</span>
				</div>
				<div className="ms-flash" />
			</div>

			<div ref={setBubble} className={`ms-bubble${mode === "invite" || entering ? " is-loud" : ""}`} aria-hidden="true">
				<span>{shown}</span>
				<span className="ms-bubble-rest">{line.slice(shown.length)}</span>
			</div>

			<button
				ref={ctaRef}
				type="button"
				className="ms-cta"
				aria-label={ariaLabel}
				onPointerEnter={() => hover("button", true)}
				onPointerLeave={() => hover("button", false)}
				onFocus={() => hover("button", true)}
				onBlur={() => hover("button", false)}
				onClick={enterClassroom}
				disabled={entering}
			>
				<span className="ms-cta-icon" aria-hidden="true">
					<MessageCircle size={22} strokeWidth={2.6} />
				</span>
				<span className="ms-cta-label">Discuter avec Milo</span>
				<span className="ms-cta-go" aria-hidden="true">
					<ArrowRight size={20} strokeWidth={2.8} />
				</span>
			</button>
		</section>
	);
};

export default MiloSchoolCard;
