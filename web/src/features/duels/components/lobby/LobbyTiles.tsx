import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Swords, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import type { DuelHistoryEntry, DuelStatsData, Friend } from "@shared/types/duels";
import MiloAvatar from "@shared/components/MiloAvatar.component";
import CountUp from "@shared/components/quiz/CountUp.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { DUEL_RANKS, rankFor } from "@features/duels/components/lobby/duelRanks";

/* ============================================================
   TUILES DU LOBBY DES DUELS : jeu et compétition d'abord
   ============================================================ */

const friendName = (f: Friend) => `${f.firstName} ${f.lastName}`.trim() || (f.username ? `@${f.username}` : "Ami");
const friendInitials = (f: Friend) =>
	`${f.firstName[0] ?? ""}${f.lastName[0] ?? ""}` || (f.username?.slice(0, 2).toUpperCase() ?? "?");

/* ---------- Rang (Écuyer → Légende) ---------- */
export const RankTile: React.FC<{ wins: number }> = ({ wins }) => {
	const reduceMotion = useReducedMotion();
	const { index, current, next, progress, winsToNext } = rankFor(wins);

	return (
		<>
			<img src="/duels/milo-chevalier.webp" alt="" className="dz-rank__knight" draggable={false} />
			<div className="dz-rank__copy">
				<div className="dz-tile__titles">
					<h2 className="dz-rank__name">{current.name}</h2>
					<p className="dz-tile__sub">Ton rang de duelliste</p>
				</div>
				<div className="dz-rank__track" aria-label={`Rang ${index + 1} sur ${DUEL_RANKS.length}`}>
					{DUEL_RANKS.map((rank, i) => (
						<span key={rank.name} className={`dz-rank__step${i <= index ? " is-reached" : ""}${i === index ? " is-current" : ""}`} title={rank.name}>
							<Emoji3D name={rank.icon} />
						</span>
					))}
				</div>
				{next ? (
					<div className="dz-rank__progress">
						<div className="dz-bar">
							<motion.span
								className="dz-bar__fill"
								initial={{ width: reduceMotion ? `${progress * 100}%` : "0%" }}
								animate={{ width: `${progress * 100}%` }}
								transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
							/>
						</div>
						<p className="dz-rank__next">
							Encore <b>{winsToNext} victoire{winsToNext > 1 ? "s" : ""}</b> pour devenir <b>{next.name}</b>
						</p>
					</div>
				) : (
					<p className="dz-rank__next">Tu es au sommet. Défends ton titre !</p>
				)}
			</div>
		</>
	);
};

/* ---------- Défie un ami ---------- */
const ORDER: Record<Friend["status"], number> = { online: 0, "in-game": 1, offline: 2 };
const STATUS_TEXT: Record<Friend["status"], string> = { online: "En ligne", "in-game": "En partie", offline: "Hors ligne" };

export const FriendsTile: React.FC<{
	friends: Friend[];
	loading: boolean;
	onChallenge: (id: string) => void;
}> = ({ friends, loading, onChallenge }) => {
	const sorted = [...friends].sort((a, b) => ORDER[a.status] - ORDER[b.status]).slice(0, 6);
	const online = friends.filter((f) => f.status === "online").length;

	return (
		<>
			<header className="dz-tile__head dz-tile__head--row">
				<div className="dz-tile__titles">
					<h2 className="dz-tile__title">Défie un ami</h2>
					<p className="dz-tile__sub">
						{online > 0 ? `${online} ${online > 1 ? "amis prêts" : "ami prêt"} à se battre` : "Personne en ligne pour l'instant"}
					</p>
				</div>
				<Link to="/friends" className="dz-link-btn" aria-label="Ajouter des amis" title="Ajouter des amis">
					<UserPlus size={19} aria-hidden="true" />
				</Link>
			</header>
			{loading ? (
				<div className="dz-state" role="status"><span className="dz-spinner" aria-hidden="true" />Chargement…</div>
			) : friends.length === 0 ? (
				<div className="dz-empty">
					<Emoji3D name="student" />
					<p>Ajoute des amis pour les provoquer en duel.</p>
					<Link to="/friends" className="dz-btn dz-btn--ghost dz-btn--sm">Ajouter des amis</Link>
				</div>
			) : (
				<ul className="dz-challengers">
					{sorted.map((friend, i) => {
						const name = friendName(friend);
						const ready = friend.status === "online";
						return (
							<motion.li
								key={friend.id}
								className={`dz-challenger is-${friend.status}`}
								initial={{ opacity: 0, scale: 0.6 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.3 + i * 0.06 }}
							>
								<button
									type="button"
									className="dz-challenger__btn"
									onClick={() => onChallenge(friend.id)}
									disabled={!ready}
									aria-label={ready ? `Défier ${name}` : `${name} : ${STATUS_TEXT[friend.status].toLowerCase()}`}
								>
									<span className="dz-challenger__avatar">
										<MiloAvatar equippedMeshNames={friend.equippedMeshes} initials={friendInitials(friend)} />
										{ready && (
											<span className="dz-challenger__sword" aria-hidden="true">
												<Swords size={15} strokeWidth={2.8} />
											</span>
										)}
									</span>
									<span className="dz-challenger__name">{name.split(" ")[0]}</span>
									<span className="dz-challenger__status">{STATUS_TEXT[friend.status]}</span>
								</button>
							</motion.li>
						);
					})}
				</ul>
			)}
		</>
	);
};

/* ---------- Ton rival : prends ta revanche ---------- */
export const RivalTile: React.FC<{
	stats: DuelStatsData | null;
	friends: Friend[];
	onChallenge: (id: string) => void;
}> = ({ stats, friends, onChallenge }) => {
	const rival = [...(stats?.per_opponent ?? [])].sort(
		(a, b) => b.wins + b.draws + b.losses - (a.wins + a.draws + a.losses),
	)[0];

	if (!rival) {
		return (
			<>
				<header className="dz-tile__head">
					<h2 className="dz-tile__title">Ton rival</h2>
				</header>
				<div className="dz-empty">
					<Emoji3D name="crossed_swords" />
					<p>Joue quelques duels : ton grand rival apparaîtra ici.</p>
				</div>
			</>
		);
	}

	const friend = friends.find((f) => f.id === String(rival.opponent_id));
	const canChallenge = friend?.status === "online";
	const ahead = rival.wins > rival.losses;
	const tied = rival.wins === rival.losses;

	return (
		<>
			<header className="dz-tile__head">
				<h2 className="dz-tile__title">Ton rival</h2>
				<p className="dz-tile__sub">{rival.opponent_username}</p>
			</header>
			<div className="dz-rival" aria-label={`${rival.wins} victoires contre ${rival.losses} défaites`}>
				<span className="dz-rival__side">
					<span className="dz-rival__score"><CountUp value={rival.wins} delay={0.4} /></span>
					<span className="dz-rival__who">Toi</span>
				</span>
				<Emoji3D name="crossed_swords" className="dz-rival__swords" />
				<span className="dz-rival__side">
					<span className="dz-rival__score"><CountUp value={rival.losses} delay={0.4} /></span>
					<span className="dz-rival__who">{rival.opponent_username}</span>
				</span>
			</div>
			<p className="dz-rival__verdict">
				{tied ? "Égalité parfaite. À toi de faire la différence !" : ahead ? "Tu mènes ! Garde ton avance." : "Il te devance… l'heure de la revanche ?"}
			</p>
			<button
				type="button"
				className="dz-btn dz-btn--primary"
				onClick={() => friend && onChallenge(friend.id)}
				disabled={!canChallenge}
			>
				<Swords size={18} aria-hidden="true" />
				{canChallenge ? "Prendre ma revanche" : "Pas en ligne pour l'instant"}
			</button>
		</>
	);
};

/* ---------- Vitrine des derniers combats ---------- */
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
		<>
			<header className="dz-tile__head dz-tile__head--row">
				<div className="dz-tile__titles">
					<h2 className="dz-tile__title">Tes derniers combats</h2>
					<p className="dz-tile__sub">Les 5 plus récents, du plus frais au plus ancien</p>
				</div>
				<span className="dz-total-wins" aria-label={`${wins} victoires au total`}>
					<Emoji3D name="trophy" />
					<CountUp value={wins} delay={0.3} />
				</span>
			</header>
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
								<span className="dz-medal__disc"><Emoji3D name={medal.icon} /></span>
								<span className="dz-medal__score">{entry.my_score}–{entry.opponent_score}</span>
								<span className="dz-medal__vs">{medal.label} contre {entry.opponent_username}</span>
							</motion.li>
						);
					})}
				</ol>
			)}
		</>
	);
};
