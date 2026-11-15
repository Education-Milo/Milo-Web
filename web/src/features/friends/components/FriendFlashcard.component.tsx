import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, Star, Swords, X } from "lucide-react";
import type { DuelDance } from "@features/duels/components/DuelMilo3D.component";
import SharedMilo3D from "@shared/components/SharedMilo3D.component";
import { useDuel } from "@features/duels/context/DuelContext";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import MiloAvatar from "@shared/components/MiloAvatar.component";
import CountUp from "@shared/components/quiz/CountUp.component";
import { showToast } from "@shared/store/toast/toast.store";
import { useUserStore } from "@shared/store/user/user.store";
import type { FriendWithDetails } from "@features/friends/hooks/useFriendDetails";
import { useFriendCard, type Presence } from "@features/friends/hooks/useFriendCard";
import { getFriendDisplayName, getFriendInitials, getOtherUserId } from "@features/friends/store/friend.model";
import "@features/friends/styles/FriendFlashcard.css";

/// Carte de joueur d'un ami, façon carte à collectionner : son Milo en 3D
/// (avec sa tenue) au recto, vos duels et ce que vous avez en commun au
/// verso. La carte arrive en tournoyant, se retourne, et les flèches passent
/// d'un ami à l'autre.

interface FriendFlashcardProps {
	friends: FriendWithDetails[];
	index: number;
	onIndexChange: (index: number) => void;
	onClose: () => void;
}

/// La scène 3D (partagée par toutes les cartes, voir SharedMilo3D) est créée
/// à la première carte ouverte : sa création fige l'écran un instant, on
/// attend donc que la carte ait fini d'arriver (ressort ~0,6 s)
const MILO_MOUNT_DELAY_MS = 650;
/// Numéros de danse : la scène persiste d'une carte à l'autre, ils doivent
/// toujours croître (une danse au numéro déjà vu serait ignorée)
let danceSeq = 0;

/// Danses jouées quand on clique sur le Milo de l'ami (comme dans l'arène des duels)
const TAUNTS = ["67", "Hello", "HatLook"];

const PRESENCE: Record<Presence, string> = {
	online: "En ligne",
	"in-game": "En duel",
	offline: "Hors ligne",
};

const norm = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

const daysSince = (iso: string | null | undefined) => {
	if (!iso) return null;
	const time = new Date(iso).getTime();
	if (Number.isNaN(time)) return null;
	return Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
};

const relativeDay = (iso: string | null) => {
	const days = daysSince(iso);
	if (days === null) return "";
	if (days === 0) return "aujourd'hui";
	if (days === 1) return "hier";
	if (days < 30) return `il y a ${days} jours`;
	return new Date(iso as string).toLocaleDateString("fr-FR", {
		day: "numeric",
		month: "short",
	});
};

const FriendFlashcard: React.FC<FriendFlashcardProps> = ({ friends, index, onIndexChange, onClose }) => {
	const reduceMotion = useReducedMotion();
	const friend = friends[index];
	const [direction, setDirection] = useState(0);
	const closeRef = useRef<HTMLButtonElement>(null);
	const returnFocus = useRef<HTMLElement | null>(null);

	/// (index courant tenu à jour sans attendre le rendu : deux flèches
	/// pressées vite avancent bien de deux amis)
	const current = useRef(index);
	useEffect(() => {
		current.current = index;
	}, [index]);
	const go = useCallback(
		(step: number) => {
			if (friends.length < 2) return;
			setDirection(step);
			current.current = (current.current + step + friends.length) % friends.length;
			onIndexChange(current.current);
		},
		[friends.length, onIndexChange],
	);

	/// Échap ferme, ← / → passent d'un ami à l'autre ; le focus revient à la
	/// carte d'ami d'origine à la fermeture
	useEffect(() => {
		returnFocus.current = document.activeElement as HTMLElement | null;
		closeRef.current?.focus({ preventScroll: true });
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
			else if (event.key === "ArrowRight") go(1);
			else if (event.key === "ArrowLeft") go(-1);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [go, onClose]);
	useEffect(() => () => returnFocus.current?.focus?.({ preventScroll: true }), []);

	if (!friend) return null;

	return createPortal(
		<motion.div
			className="fc-overlay"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<button ref={closeRef} type="button" className="fc-close" onClick={onClose} aria-label="Fermer la carte">
				<X size={24} strokeWidth={2.6} aria-hidden="true" />
			</button>

			<div className="fc-stage" onClick={(e) => e.target === e.currentTarget && onClose()}>
				{friends.length > 1 && (
					<button type="button" className="fc-nav fc-nav--prev" onClick={() => go(-1)} aria-label="Ami précédent">
						<ChevronLeft size={28} strokeWidth={2.8} aria-hidden="true" />
					</button>
				)}

				<AnimatePresence mode="popLayout" initial custom={direction}>
					<FlashcardBody
						key={friend.id}
						friend={friend}
						direction={direction}
						reduceMotion={Boolean(reduceMotion)}
						onClose={onClose}
					/>
				</AnimatePresence>

				{friends.length > 1 && (
					<button type="button" className="fc-nav fc-nav--next" onClick={() => go(1)} aria-label="Ami suivant">
						<ChevronRight size={28} strokeWidth={2.8} aria-hidden="true" />
					</button>
				)}
			</div>

			{friends.length > 1 && (
				<p className="fc-count" aria-live="polite">
					{index + 1} / {friends.length}
				</p>
			)}
		</motion.div>,
		document.body,
	);
};

/* ------------------------------------------------------------------ la carte */

const cardVariants = {
	enter: (dir: number) =>
		dir === 0 ? { opacity: 0, scale: 0.55, y: 140, rotate: -10 } : { opacity: 0, x: dir * 280, rotate: dir * 12, scale: 0.9 },
	center: { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 },
	exit: (dir: number) => ({
		opacity: 0,
		x: dir * -280,
		rotate: dir * -12,
		scale: 0.9,
	}),
};

const FlashcardBody = React.forwardRef<
	HTMLDivElement,
	{
		friend: FriendWithDetails;
		direction: number;
		reduceMotion: boolean;
		onClose: () => void;
	}
>(({ friend, direction, reduceMotion, onClose }, ref) => {
	const navigate = useNavigate();
	const { sendChallengeToUserId } = useDuel();
	const me = useUserStore((state) => state.user);
	const titleId = useId();
	const otherUserId = getOtherUserId(friend);
	const { profile, presence, headToHead, recentDuels, duelsLoading } = useFriendCard(otherUserId);

	const [flipped, setFlipped] = useState(false);
	/// Le verso n'est construit qu'au premier retournement : la carte s'ouvre plus vite
	const [backBuilt, setBackBuilt] = useState(false);
	const flip = (on: boolean) => {
		if (on) setBackBuilt(true);
		setFlipped(on);
	};
	const [dance, setDance] = useState<DuelDance | null>(null);
	const [challenging, setChallenging] = useState(false);
	const taunts = useRef(0);

	const name = getFriendDisplayName({ ...friend, username: friend.username });
	const firstName = friend.friend_first_name?.trim() || name;
	const initials = getFriendInitials({ ...friend, username: friend.username });
	const classe = friend.classe ? `${friend.classe[0]}ème` : null;
	const streak = profile?.streak ?? friend.streak ?? 0;
	const xp = profile?.xp ?? friend.xp ?? 0;
	const meshes = profile?.equipped_meshes ?? friend.equipped_meshes ?? [];
	const interests = profile?.interests ?? friend.interests ?? [];
	const mine = new Set((me?.Interests ?? []).map((i) => norm(i.name)));
	const shared = interests.filter((i) => mine.has(norm(i.name)));
	const friendDays = daysSince(friend.created_at ?? friend.createdAt);

	/* --- Milo salue en arrivant, danse quand on clique dessus --- */
	const play = useCallback((clip: string) => {
		danceSeq += 1;
		setDance({ clip, seq: danceSeq });
	}, []);
	const handleMiloReady = useCallback(() => {
		if (!reduceMotion) play("Hello");
	}, [play, reduceMotion]);
	const taunt = () => play(TAUNTS[taunts.current++ % TAUNTS.length]);

	const challenge = async () => {
		if (presence !== "online" || challenging) return;
		setChallenging(true);
		try {
			await sendChallengeToUserId(otherUserId);
			showToast(`Défi envoyé à ${firstName} !`, "success");
			onClose();
			navigate("/duels");
		} catch {
			showToast("Impossible d'envoyer le défi pour le moment.", "error");
			setChallenging(false);
		}
	};

	/* --- Face à face --- */
	const wins = headToHead?.wins ?? 0;
	const losses = headToHead?.losses ?? 0;
	const draws = headToHead?.draws ?? 0;
	const played = wins + losses + draws;
	const verdict =
		played === 0
			? `Pas encore de duel contre ${firstName} : lance le premier !`
			: wins > losses
				? "Tu mènes, garde la tête !"
				: losses > wins
					? `${firstName} mène : à toi de jouer !`
					: "Égalité parfaite, il faut vous départager !";
	const myXp = me?.xp ?? 0;
	const myStreak = me?.streak ?? 0;
	const xpMax = Math.max(myXp, xp, 1);
	const streakMax = Math.max(myStreak, streak, 1);

	return (
		<motion.div
			ref={ref}
			className="fc-card-wrap"
			custom={direction}
			variants={reduceMotion ? undefined : cardVariants}
			initial={reduceMotion ? { opacity: 0 } : "enter"}
			animate={reduceMotion ? { opacity: 1 } : "center"}
			exit={reduceMotion ? { opacity: 0 } : "exit"}
			transition={{ type: "spring", stiffness: 190, damping: 20 }}
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
		>
			<motion.div
				className="fc-flip"
				animate={{ rotateY: flipped ? 180 : 0 }}
				transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 16 }}
			>
				{/* ================= RECTO ================= */}
				<section className="fc-face fc-front" aria-hidden={flipped} inert={flipped || undefined}>
					<div className="fc-art">
						<span className="fc-art__sun" aria-hidden="true" />
						{classe && <span className="fc-chip">{classe}</span>}
						{presence && (
							<span className={`fc-presence is-${presence}`}>
								<i aria-hidden="true" />
								{PRESENCE[presence]}
							</span>
						)}
						<button type="button" className="fc-milo" onClick={taunt} aria-label={`Faire danser le Milo de ${firstName}`}>
							<span className="fc-milo__fallback" aria-hidden="true">
								<MiloAvatar equippedMeshNames={meshes} initials={initials} />
							</span>
							<SharedMilo3D
									channel="friends"
								equippedMeshNames={meshes}
								dance={dance}
								onReady={handleMiloReady}
								firstMountDelayMs={reduceMotion ? 0 : MILO_MOUNT_DELAY_MS}
							/>
						</button>
					</div>

					<div className="fc-plate">
						<h2 id={titleId} className="fc-name">
							{name}
						</h2>
						{friend.username && <p className="fc-username">@{friend.username}</p>}
					</div>

					<div className="fc-stats">
						<span className={`fc-stat${streak > 0 ? " is-hot" : " is-cold"}`}>
							<Emoji3D name="fire" />
							<b>
								<CountUp value={streak} delay={0.35} />
							</b>
							<small>jour{streak > 1 ? "s" : ""} de série</small>
						</span>
						<span className="fc-stat is-hot">
							<Emoji3D name="high_voltage" />
							<b>
								<CountUp value={xp} delay={0.45} />
							</b>
							<small>XP</small>
						</span>
						{friendDays !== null && (
							<span className="fc-stat">
								<Emoji3D name="party_popper" />
								<b>
									<CountUp value={friendDays} delay={0.55} />
								</b>
								<small>jour{friendDays > 1 ? "s" : ""} d'amitié</small>
							</span>
						)}
					</div>

					<div className="fc-actions">
						<button
							type="button"
							className="fc-btn fc-btn--primary"
							onClick={challenge}
							disabled={presence !== "online" || challenging}
							title={presence === "online" ? `Défier ${firstName}` : `${firstName} doit être en ligne pour être défié`}
						>
							<Swords size={20} strokeWidth={2.6} aria-hidden="true" />
							{presence === "in-game" ? "Déjà en duel" : presence === "online" ? "Défier" : "Hors ligne"}
						</button>
						<button type="button" className="fc-btn fc-btn--ghost" onClick={() => flip(true)}>
							<RotateCcw size={19} strokeWidth={2.6} aria-hidden="true" />
							Retourner
						</button>
					</div>
				</section>

				{/* ================= VERSO ================= */}
				<section className="fc-face fc-back" aria-hidden={!flipped} inert={!flipped || undefined}>
					<header className="fc-back__head">
						<span className="fc-back__avatar" aria-hidden="true">
							<MiloAvatar equippedMeshNames={meshes} initials={initials} />
						</span>
						<p className="fc-back__title">
							Face à <span className="fc-hl">face</span>
						</p>
					</header>

					{/* (remonté à chaque retournement : les barres se remplissent sous les yeux) */}
					{backBuilt ? (
						<div className="fc-scroll" key={flipped ? "shown" : "hidden"}>
							{/* Vos duels */}
							<div className="fc-h2h">
								<div className="fc-h2h__score" aria-label={`${wins} victoires, ${losses} défaites, ${draws} égalités`}>
									<span className="fc-h2h__side">
										<b className={wins > losses ? "is-lead" : ""}>{duelsLoading ? "–" : wins}</b>
										<small>Toi</small>
									</span>
									<Emoji3D name="crossed_swords" />
									<span className="fc-h2h__side">
										<b className={losses > wins ? "is-lead" : ""}>{duelsLoading ? "–" : losses}</b>
										<small>{firstName}</small>
									</span>
								</div>
								{draws > 0 && (
									<p className="fc-h2h__draws">
										{draws} égalité{draws > 1 ? "s" : ""}
									</p>
								)}
								{!duelsLoading && <p className="fc-h2h__verdict">{verdict}</p>}
								{recentDuels.length > 0 && (
									<ul className="fc-recent" aria-label="Vos derniers duels">
										{recentDuels.map((duel) => (
											<li key={duel.duel_id} className={`is-${duel.outcome}`}>
												<span className="fc-recent__badge">
													{duel.outcome === "win" ? "Gagné" : duel.outcome === "loss" ? "Perdu" : "Égalité"}
												</span>
												<span className="fc-recent__score">
													{duel.my_score}–{duel.opponent_score}
												</span>
												<span className="fc-recent__when">{relativeDay(duel.played_at)}</span>
											</li>
										))}
									</ul>
								)}
							</div>

							{/* Toi contre lui / elle */}
							<div className="fc-block">
								<p className="fc-block__title">Toi et {firstName}</p>
								<CompareBar label="XP" icon="high_voltage" mine={myXp} theirs={xp} max={xpMax} name={firstName} />
								<CompareBar label="Série" icon="fire" mine={myStreak} theirs={streak} max={streakMax} name={firstName} />
							</div>

							{/* Centres d'intérêt, ceux qu'on partage en premier */}
							<div className="fc-block">
								<p className="fc-block__title">
									Ses passions
									{shared.length > 0 && (
										<span className="fc-shared-count">
											<Star size={14} fill="currentColor" aria-hidden="true" />
											{shared.length} en commun
										</span>
									)}
								</p>
								{interests.length > 0 ? (
									<ul className="fc-interests">
										{[...shared, ...interests.filter((i) => !shared.includes(i))].map((interest) => {
											const isShared = shared.includes(interest);
											return (
												<li key={interest.id} className={isShared ? "is-shared" : ""}>
													{isShared && <Star size={13} fill="currentColor" aria-label="En commun" />}
													{interest.name}
												</li>
											);
										})}
									</ul>
								) : (
									<p className="fc-muted">{firstName} n'a pas encore ajouté de centre d'intérêt.</p>
								)}
							</div>
						</div>
					) : (
						<div className="fc-scroll" />
					)}

					<div className="fc-actions">
						<button type="button" className="fc-btn fc-btn--ghost fc-btn--wide" onClick={() => flip(false)}>
							<RotateCcw size={19} strokeWidth={2.6} aria-hidden="true" />
							Revoir son Milo
						</button>
					</div>
				</section>
			</motion.div>
		</motion.div>
	);
});
FlashcardBody.displayName = "FlashcardBody";

/** Deux barres face à face : toi et ton ami */
const CompareBar: React.FC<{
	label: string;
	icon: "high_voltage" | "fire";
	mine: number;
	theirs: number;
	max: number;
	name: string;
}> = ({ label, icon, mine, theirs, max, name }) => (
	<div className="fc-compare" aria-label={`${label} : toi ${mine}, ${name} ${theirs}`}>
		<span className="fc-compare__label">
			<Emoji3D name={icon} />
			{label}
		</span>
		<div className="fc-compare__rows" aria-hidden="true">
			<div className="fc-compare__row">
				<span>Toi</span>
				<span className="fc-compare__track">
					<motion.span
						className="fc-compare__fill is-me"
						initial={{ width: 0 }}
						animate={{ width: `${(mine / max) * 100}%` }}
						transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
					/>
				</span>
				<b>{mine.toLocaleString("fr-FR")}</b>
			</div>
			<div className="fc-compare__row">
				<span>{name}</span>
				<span className="fc-compare__track">
					<motion.span
						className="fc-compare__fill"
						initial={{ width: 0 }}
						animate={{ width: `${(theirs / max) * 100}%` }}
						transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
					/>
				</span>
				<b>{theirs.toLocaleString("fr-FR")}</b>
			</div>
		</div>
	</div>
);

export default FriendFlashcard;
