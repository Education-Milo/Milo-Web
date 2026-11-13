import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Swords, UserPlus, X } from "lucide-react";
import type { Emoji3DName } from "@features/landing/data/landing.data";
import { useEquippedMeshNames } from "@features/cosmetics/hooks/useEquippedMeshNames";
import { Link } from "react-router-dom";
import type { DuelHistoryEntry, DuelStatsData, Friend } from "@shared/types/duels";
import MiloAvatar from "@shared/components/MiloAvatar.component";
import CountUp from "@shared/components/quiz/CountUp.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { DUEL_RANKS, rankFor, rankImage } from "@features/duels/components/lobby/duelRanks";

/* ============================================================
   TUILES DU LOBBY DES DUELS : une même famille de panneaux de jeu
   (nuit violette de l'arène, bannière dorée, accents or et orange)
   ============================================================ */

/** Titre de tuile façon charte : icône 3D, Luckiest Guy, un mot en orange */
const Ribbon: React.FC<{ icon: Emoji3DName; children: React.ReactNode; id?: string }> = ({ icon, children, id }) => (
	<div className="dz-head">
		<Emoji3D name={icon} className="dz-head__icon" />
		<h2 className="dz-head__title" id={id}>{children}</h2>
	</div>
);

const friendName = (f: Friend) => `${f.firstName} ${f.lastName}`.trim() || (f.username ? `@${f.username}` : "Ami");
const friendInitials = (f: Friend) =>
	`${f.firstName[0] ?? ""}${f.lastName[0] ?? ""}` || (f.username?.slice(0, 2).toUpperCase() ?? "?");

/* ---------- Rang : badge sur rayons de soleil, barre de progression à crans ---------- */
export const RankTile: React.FC<{ wins: number; onShowAll: () => void }> = ({ wins, onShowAll }) => {
	const reduceMotion = useReducedMotion();
	const { index, current, next, progress, winsToNext } = rankFor(wins);
	// Un cran par victoire à gagner (au-delà de 12, la barre redevient continue)
	const steps = next ? next.from - current.from : 0;

	return (
		<div className="dz-panel dz-rank__inner" style={{ "--rank": current.color, "--rank-edge": current.edge } as React.CSSProperties}>
			<Ribbon icon="glowing_star">Ton <span className="dz-hl">rang</span></Ribbon>

			<button type="button" className="dz-rank__badge" onClick={onShowAll} aria-label={`Rang ${current.name} : voir tous les rangs`}>
				<span className="dz-rank__rays" aria-hidden="true" />
				<motion.img
					src={rankImage(current)}
					alt=""
					draggable={false}
					initial={reduceMotion ? false : { scale: 0.4, rotate: -25, opacity: 0 }}
					animate={{ scale: 1, rotate: 0, opacity: 1 }}
					transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.35 }}
				/>
			</button>

			<div className="dz-rank__titles">
				<p className="dz-rank__name">{current.name}</p>
				<p className="dz-rank__sub">Rang {index + 1} sur {DUEL_RANKS.length}</p>
			</div>

			{next ? (
				<div className="dz-rank__progress">
					<div
						className={`dz-rank__bar${steps > 1 && steps <= 12 ? " has-steps" : ""}`}
						style={{ "--steps": steps } as React.CSSProperties}
						role="progressbar"
						aria-valuemin={current.from}
						aria-valuemax={next.from}
						aria-valuenow={wins}
						aria-label={`Progression vers le rang ${next.name}`}
					>
						<motion.span
							className="dz-rank__fill"
							initial={{ width: reduceMotion ? `${progress * 100}%` : "0%" }}
							animate={{ width: `${progress * 100}%` }}
							transition={{ duration: 1.1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
						/>
					</div>
					<img src={rankImage(next)} alt="" className="dz-rank__next-badge" draggable={false} />
					<p className="dz-rank__next">
						Encore <b>{winsToNext} victoire{winsToNext > 1 ? "s" : ""}</b> pour passer <b>{next.name}</b>
					</p>
				</div>
			) : (
				<p className="dz-rank__next">Tu as atteint le sommet. Défends ton titre !</p>
			)}

			<button type="button" className="dz-btn dz-btn--cream dz-btn--sm" onClick={onShowAll}>
				Voir les {DUEL_RANKS.length} rangs
			</button>
		</div>
	);
};

/* ---------- Défie un ami : un bouton clair par ami, et un retour « envoyé » ---------- */
const ORDER: Record<Friend["status"], number> = { online: 0, "in-game": 1, offline: 2 };
const STATUS_TEXT: Record<Friend["status"], string> = { online: "En ligne", "in-game": "En partie", offline: "Hors ligne" };
/** Durée d'affichage de l'état « défi envoyé » (le défi expire côté serveur au bout d'1 min) */
const SENT_MS = 60_000;

export const FriendsTile: React.FC<{
	friends: Friend[];
	loading: boolean;
	onChallenge: (id: string) => Promise<void> | void;
}> = ({ friends, loading, onChallenge }) => {
	const [sent, setSent] = useState<Record<string, number>>({});
	const sorted = [...friends].sort((a, b) => ORDER[a.status] - ORDER[b.status]);
	const online = friends.filter((f) => f.status === "online").length;

	const challenge = async (id: string) => {
		setSent((prev) => ({ ...prev, [id]: Date.now() }));
		setTimeout(() => setSent((prev) => {
			const next = { ...prev };
			delete next[id];
			return next;
		}), SENT_MS);
		await onChallenge(id);
	};

	return (
		<div className="dz-panel">
			<Ribbon icon="crossed_swords">Défie un <span className="dz-hl">ami</span></Ribbon>
			<div className="dz-panel__bar">
				<p className="dz-panel__sub">
					{online > 0 ? (
						<><span className="dz-online-count">{online} en ligne</span> Clique sur « Défier » pour l'inviter</>
					) : (
						"Aucun ami en ligne pour l'instant"
					)}
				</p>
				<Link to="/friends" className="dz-icon-btn" aria-label="Ajouter des amis" title="Ajouter des amis">
					<UserPlus size={19} aria-hidden="true" />
				</Link>
			</div>
			{loading ? (
				<div className="dz-state" role="status"><span className="dz-spinner" aria-hidden="true" />Chargement…</div>
			) : friends.length === 0 ? (
				<div className="dz-empty">
					<Emoji3D name="student" />
					<p>Ajoute des amis pour les provoquer en duel.</p>
					<Link to="/friends" className="dz-btn dz-btn--ghost dz-btn--sm">Ajouter des amis</Link>
				</div>
			) : (
				<ul className="dz-friends">
					{sorted.map((friend, i) => {
						const name = friendName(friend);
						const ready = friend.status === "online";
						const isSent = Boolean(sent[friend.id]);
						return (
							<motion.li
								key={friend.id}
								className={`dz-friend is-${friend.status}${isSent ? " is-sent" : ""}`}
								initial={{ opacity: 0, x: -16 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ type: "spring", stiffness: 240, damping: 20, delay: 0.25 + i * 0.05 }}
							>
								<span className="dz-friend__avatar">
									<MiloAvatar equippedMeshNames={friend.equippedMeshes} initials={friendInitials(friend)} />
									<i className="dz-friend__dot" aria-hidden="true" />
								</span>
								<span className="dz-friend__info">
									<span className="dz-friend__name">{name}</span>
									<span className="dz-friend__status">{isSent ? "Invitation envoyée…" : STATUS_TEXT[friend.status]}</span>
								</span>
								{isSent ? (
									<span className="dz-friend__sent" role="status">
										<Check size={18} strokeWidth={3} aria-hidden="true" /> Envoyé
									</span>
								) : ready ? (
									<button
										type="button"
										className="dz-btn dz-btn--duel"
										onClick={() => void challenge(friend.id)}
										aria-label={`Défier ${name} en duel`}
									>
										<Swords size={18} strokeWidth={2.6} aria-hidden="true" />
										Défier
									</button>
								) : (
									<span className="dz-friend__off">{friend.status === "in-game" ? "En partie" : "Absent"}</span>
								)}
							</motion.li>
						);
					})}
				</ul>
			)}
		</div>
	);
};

/* ---------- Tous les rangs (pop-up) ---------- */
export const RanksModal: React.FC<{ isOpen: boolean; wins: number; onClose: () => void }> = ({ isOpen, wins, onClose }) => {
	const reduceMotion = useReducedMotion();
	const { index } = rankFor(wins);
	useEffect(() => {
		if (!isOpen) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [isOpen, onClose]);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div className="dz-modal-backdrop" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
					<motion.div
						className="dz-ranks"
						role="dialog"
						aria-modal="true"
						aria-labelledby="dz-ranks-title"
						onClick={(e) => e.stopPropagation()}
						initial={reduceMotion ? false : { y: 24, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 16, opacity: 0 }}
						transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
					>
						<header className="dz-ranks__head">
							<div className="dz-tile__titles">
								<h2 id="dz-ranks-title" className="dz-ranks__title">Les rangs de duel</h2>
								<p className="dz-tile__sub">Gagne des duels pour grimper, du Bois jusqu'à la Légende.</p>
							</div>
							<button type="button" className="dz-link-btn" onClick={onClose} aria-label="Fermer" autoFocus>
								<X size={20} aria-hidden="true" />
							</button>
						</header>
						<ol className="dz-ranks__list">
							{DUEL_RANKS.map((rank, i) => (
								<motion.li
									key={rank.id}
									className={`dz-ranks__item${i < index ? " is-done" : ""}${i === index ? " is-current" : ""}${i > index ? " is-locked" : ""}`}
									style={{ "--rank": rank.color, "--rank-edge": rank.edge } as React.CSSProperties}
									initial={reduceMotion ? false : { opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.25, delay: 0.05 + i * 0.03 }}
								>
									<img src={rankImage(rank)} alt="" width={320} height={320} draggable={false} />
									<span className="dz-ranks__name">{rank.name}</span>
									<span className="dz-ranks__req">
										{i === index ? "Ton rang" : rank.from === 0 ? "Départ" : `${rank.from} victoires`}
									</span>
								</motion.li>
							))}
						</ol>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

/* ---------- Ton rival : face-à-face et tableau des scores ---------- */
export const RivalTile: React.FC<{
	stats: DuelStatsData | null;
	friends: Friend[];
	onChallenge: (id: string) => void;
}> = ({ stats, friends, onChallenge }) => {
	const reduceMotion = useReducedMotion();
	const { equippedMeshNames } = useEquippedMeshNames();
	const rival = [...(stats?.per_opponent ?? [])].sort(
		(a, b) => b.wins + b.draws + b.losses - (a.wins + a.draws + a.losses),
	)[0];

	if (!rival) {
		return (
			<div className="dz-panel">
				<Ribbon icon="fire">Ton <span className="dz-hl">rival</span></Ribbon>
				<div className="dz-empty">
					<Emoji3D name="crossed_swords" />
					<p>Joue quelques duels : ton grand rival apparaîtra ici.</p>
				</div>
			</div>
		);
	}

	const friend = friends.find((f) => f.id === String(rival.opponent_id));
	const canChallenge = friend?.status === "online";
	const ahead = rival.wins > rival.losses;
	const tied = rival.wins === rival.losses;
	const decided = rival.wins + rival.losses;
	const share = decided ? rival.wins / decided : 0.5;

	return (
		<div className="dz-panel">
			<Ribbon icon="fire">Ton <span className="dz-hl">rival</span></Ribbon>

			<div className="dz-rival" aria-label={`${rival.wins} victoires, ${rival.losses} défaites et ${rival.draws} égalités contre ${rival.opponent_username}`}>
				<div className="dz-rival__fighters" aria-hidden="true">
					<span className={`dz-rival__fighter is-me${ahead ? " is-leading" : ""}`}>
						<span className="dz-rival__avatar"><MiloAvatar equippedMeshNames={equippedMeshNames ?? []} initials="Toi" /></span>
						<span className="dz-rival__who">Toi</span>
					</span>
					<span className="dz-rival__board">
						<span className="dz-rival__score is-me"><CountUp value={rival.wins} delay={0.4} /></span>
						<span className="dz-rival__dash">:</span>
						<span className="dz-rival__score is-foe"><CountUp value={rival.losses} delay={0.4} /></span>
					</span>
					<span className={`dz-rival__fighter is-foe${!ahead && !tied ? " is-leading" : ""}`}>
						<span className="dz-rival__avatar">
							<MiloAvatar equippedMeshNames={friend?.equippedMeshes} initials={rival.opponent_username.slice(0, 2).toUpperCase()} />
						</span>
						<span className="dz-rival__who">{rival.opponent_username}</span>
					</span>
				</div>

				{/* Bras de fer : la part des victoires de chacun */}
				<div className="dz-rival__tug" aria-hidden="true">
					<motion.span
						className="dz-rival__tug-me"
						initial={{ width: reduceMotion ? `${share * 100}%` : "50%" }}
						animate={{ width: `${share * 100}%` }}
						transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
					/>
				</div>
				{rival.draws > 0 && <p className="dz-rival__draws">+ {rival.draws} égalité{rival.draws > 1 ? "s" : ""}</p>}
			</div>

			<p className="dz-rival__verdict">
				{tied ? "Égalité parfaite. À toi de faire la différence !" : ahead ? "Tu mènes ! Garde ton avance." : "Il te devance… l'heure de la revanche ?"}
			</p>
			{canChallenge ? (
				<button type="button" className="dz-btn dz-btn--duel dz-btn--wide" onClick={() => friend && onChallenge(friend.id)}>
					<Swords size={18} strokeWidth={2.6} aria-hidden="true" />
					{tied ? "Le départager" : ahead ? "Le défier encore" : "Prendre ma revanche"}
				</button>
			) : (
				<p className="dz-rival__off">Pas en ligne pour l'instant</p>
			)}
		</div>
	);
};

/* ---------- Derniers combats : une frise de jetons ---------- */
const MEDAL: Record<string, { icon: "trophy" | "shield" | "crossed_swords"; label: string }> = {
	win: { icon: "trophy", label: "Victoire" },
	draw: { icon: "shield", label: "Égalité" },
	loss: { icon: "crossed_swords", label: "Défaite" },
};

export const ShelfTile: React.FC<{ history: DuelHistoryEntry[]; wins: number }> = ({ history, wins }) => {
	const recent = [...history]
		.sort((a, b) => new Date(b.played_at ?? 0).getTime() - new Date(a.played_at ?? 0).getTime())
		.slice(0, 5);

	return (
		<div className="dz-panel">
			<Ribbon icon="trophy">Derniers <span className="dz-hl">combats</span></Ribbon>
			<div className="dz-panel__bar">
				<p className="dz-panel__sub">Du plus récent au plus ancien</p>
				<span className="dz-total-wins" aria-label={`${wins} victoires au total`}>
					<Emoji3D name="trophy" />
					<CountUp value={wins} delay={0.3} />
					<small>victoires</small>
				</span>
			</div>
			{recent.length === 0 ? (
				<div className="dz-empty dz-empty--row">
					<Emoji3D name="trophy" />
					<p>Ta vitrine est vide. Ton premier trophée t'attend !</p>
				</div>
			) : (
				<ol className="dz-shelf">
					{recent.map((entry, i) => {
						const medal = MEDAL[entry.outcome] ?? MEDAL.draw;
						return (
							<motion.li
								key={entry.duel_id}
								className={`dz-medal is-${entry.outcome}`}
								initial={{ opacity: 0, y: -30, rotate: -20 }}
								animate={{ opacity: 1, y: 0, rotate: 0 }}
								transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.4 + i * 0.08 }}
							>
								{i === 0 && <span className="dz-medal__new">Dernier</span>}
								<span className="dz-medal__disc"><Emoji3D name={medal.icon} /></span>
								<span className="dz-medal__score">{entry.my_score}–{entry.opponent_score}</span>
								<span className="dz-medal__label">{medal.label}</span>
								<span className="dz-medal__vs">contre {entry.opponent_username}</span>
							</motion.li>
						);
					})}
				</ol>
			)}
		</div>
	);
};
