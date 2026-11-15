import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import MiloAvatar from "@shared/components/MiloAvatar.component";
import ConfettiBurst from "@shared/components/quiz/ConfettiBurst.component";
import { canPlay } from "@shared/constants/roles";
import { useUserStore } from "@shared/store/user/user.store";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import { useDuel } from "@features/duels/context/DuelContext";
import type { DuelDance } from "@features/duels/components/DuelMilo3D.component";
import { useBuddyStore, type BuddyReaction } from "@features/milo-buddy/store/buddy.store";
import { BUDDY_DEMO, useBuddyTriggers } from "@features/milo-buddy/hooks/useBuddyTriggers";
import "@shared/styles/Quiz.css";
import "@features/milo-buddy/styles/MiloBuddy.css";

/// La bulle est présente sur tout le site : Three.js n'est téléchargé qu'à
/// la première réaction de Milo, pas avec le reste de l'application
const SharedMilo3D = lazy(() => import("@shared/components/SharedMilo3D.component"));

/// La bulle de Milo : le Milo de l'élève (avec sa tenue) surgit en bas à
/// droite quand il se passe quelque chose, joue une animation, dit un mot,
/// puis repart. Une réaction à la fois ; les suivantes attendent leur tour.
///
/// Elle n'apparaît que sur les pages « calmes » : en classe, en QCM ou en
/// plein duel, Milo est déjà à l'écran (les réactions attendent la sortie).

/// Pages où la bulle a sa place
const SHOW_ON = [
	/^\/home$/,
	/^\/courses(\/\d+)?$/,
	/^\/missions$/,
	/^\/duels$/,
	/^\/friends$/,
	/^\/personnalisation$/,
	/^\/boutique$/,
	/^\/profile$/,
	/^\/ocr$/,
];
/// L'accueil salue déjà l'élève (la bulle de son grand Milo) : pas de doublon
const GREETINGS: BuddyReaction["kind"][] = ["welcome", "back"];

/// Temps de lecture, une fois le texte écrit et l'animation finie
const HOLD_MS = 2600;
/// Au-delà, Milo repart quoi qu'il arrive (animation introuvable…)
const MAX_MS = 9000;
const TYPE_MS = 24;
/// Laisse la page s'afficher avant que Milo ne surgisse
const ENTER_DELAY_MS = 700;

/// Numéros d'animation : la scène 3D persiste, ils doivent toujours croître
let danceSeq = 0;

const MiloBuddy: React.FC = () => {
	useBuddyTriggers();
	const user = useUserStore((state) => state.user);
	const { pathname } = useLocation();
	const { screen } = useDuel();
	const queue = useBuddyStore((state) => state.queue);
	const shift = useBuddyStore((state) => state.shift);
	const current = queue[0] ?? null;
	const allowed = canPlay(user?.role) && SHOW_ON.some((re) => re.test(pathname)) && (pathname !== "/duels" || screen === "lobby");

	/// Une fois la page affichée, Milo peut surgir (pas pendant le chargement)
	const [settled, setSettled] = useState(false);
	useEffect(() => {
		setSettled(false);
		const id = window.setTimeout(() => setSettled(true), ENTER_DELAY_MS);
		return () => window.clearTimeout(id);
	}, [pathname]);

	/// Sur l'accueil, le grand Milo salue déjà : la salutation de la bulle saute
	useEffect(() => {
		if (current && pathname === "/home" && GREETINGS.includes(current.kind)) shift();
	}, [current, pathname, shift]);

	/// Démo, en développement : `miloBuddy("all-missions")` dans la console
	useEffect(() => {
		if (!import.meta.env.DEV) return;
		const w = window as unknown as { miloBuddy?: (kind: keyof typeof BUDDY_DEMO) => void };
		w.miloBuddy = (kind) => useBuddyStore.getState().push(BUDDY_DEMO[kind] ?? BUDDY_DEMO.mission);
		return () => {
			delete w.miloBuddy;
		};
	}, []);

	const show = allowed && settled && current !== null && !(pathname === "/home" && GREETINGS.includes(current.kind));

	return (
		<AnimatePresence mode="wait">
			{show && current && <BuddyBubble key={current.id} reaction={current} onDone={shift} />}
		</AnimatePresence>
	);
};

/* ------------------------------------------------------------------ une réaction */

const BuddyBubble: React.FC<{ reaction: BuddyReaction; onDone: () => void }> = ({ reaction, onDone }) => {
	const reduceMotion = Boolean(useReducedMotion());
	const navigate = useNavigate();
	const { equippedMeshNames } = useEquippedMeshNames();
	const meshes = equippedMeshNames ?? [];
	const initials = useUserStore((state) => (state.user?.first_name?.[0] ?? "M").toUpperCase());

	const [dance, setDance] = useState<DuelDance | null>(null);
	const [animDone, setAnimDone] = useState(reduceMotion);
	const [typed, setTyped] = useState(reduceMotion ? reaction.text.length : 0);
	const [hovered, setHovered] = useState(false);
	const startedAnim = useRef(false);

	const play = useCallback((clip: string) => {
		danceSeq += 1;
		startedAnim.current = false;
		setAnimDone(false);
		setDance({ clip, seq: danceSeq });
	}, []);

	/// Milo prêt : il joue l'animation de la réaction
	const handleReady = useCallback(() => {
		if (!reduceMotion) play(reaction.clip);
	}, [play, reaction.clip, reduceMotion]);
	const handleBusy = useCallback((busy: boolean) => {
		if (busy) startedAnim.current = true;
		else if (startedAnim.current) setAnimDone(true);
	}, []);

	/// Le texte s'écrit lettre à lettre
	useEffect(() => {
		if (reduceMotion) return;
		const id = window.setInterval(() => {
			setTyped((n) => {
				if (n >= reaction.text.length) {
					window.clearInterval(id);
					return n;
				}
				return n + 1;
			});
		}, TYPE_MS);
		return () => window.clearInterval(id);
	}, [reaction.text, reduceMotion]);

	/// Il repart une fois le texte écrit et l'animation finie (pas pendant qu'on le survole)
	const finished = typed >= reaction.text.length && animDone;
	useEffect(() => {
		if (!finished || hovered) return;
		const id = window.setTimeout(onDone, HOLD_MS);
		return () => window.clearTimeout(id);
	}, [finished, hovered, onDone]);
	useEffect(() => {
		if (hovered) return;
		const id = window.setTimeout(onDone, MAX_MS);
		return () => window.clearTimeout(id);
	}, [hovered, onDone]);

	const open = () => {
		if (!reaction.to) return;
		onDone();
		navigate(reaction.to);
	};

	return (
		<motion.aside
			className={`mb${reaction.big ? " is-big" : ""}`}
			aria-live="polite"
			aria-label="Milo"
			initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 160, scale: 0.8 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 160, scale: 0.85, transition: { duration: 0.35, ease: "easeIn" } }}
			transition={{ type: "spring", stiffness: 260, damping: 18 }}
			onPointerEnter={() => setHovered(true)}
			onPointerLeave={() => setHovered(false)}
		>
			<motion.div
				className="mb-bubble"
				initial={reduceMotion ? false : { opacity: 0, x: 24, scale: 0.85 }}
				animate={{ opacity: 1, x: 0, scale: 1 }}
				transition={{ type: "spring", stiffness: 300, damping: 20, delay: reduceMotion ? 0 : 0.25 }}
			>
				<button type="button" className="mb-close" onClick={onDone} aria-label="Fermer le message de Milo">
					<X size={14} strokeWidth={3} aria-hidden="true" />
				</button>
				<p className="mb-text">
					<span>{reaction.text.slice(0, typed)}</span>
					<span className="mb-text__rest" aria-hidden="true">
						{reaction.text.slice(typed)}
					</span>
				</p>
				{reaction.to && (
					<button type="button" className="mb-cta" onClick={open}>
						Voir
						<ArrowRight size={16} strokeWidth={2.8} aria-hidden="true" />
					</button>
				)}
			</motion.div>

			<button type="button" className="mb-milo" onClick={() => !reduceMotion && play("67")} aria-label="Faire danser Milo">
				<span className="mb-milo__sun" aria-hidden="true" />
				<span className="mb-milo__fallback" aria-hidden="true">
					<MiloAvatar equippedMeshNames={meshes} initials={initials} />
				</span>
				{!reduceMotion && (
					<Suspense fallback={null}>
						<SharedMilo3D
							channel="buddy"
							equippedMeshNames={meshes}
							dance={dance}
							facing="left"
							onReady={handleReady}
							onBusyChange={handleBusy}
							firstMountDelayMs={450}
						/>
					</Suspense>
				)}
			</button>
			{/* (hors du médaillon rond, qui les couperait) */}
			{reaction.big && !reduceMotion && <ConfettiBurst count={36} originX={86} originY={45} spread={230} delay={0.5} />}
		</motion.aside>
	);
};

export default MiloBuddy;
