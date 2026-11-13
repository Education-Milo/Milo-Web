import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import CountUp from "@shared/components/quiz/CountUp.component";
import ConfettiBurst from "@shared/components/quiz/ConfettiBurst.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { showToast } from "@shared/store/toast/toast.store";
import { useUserStore } from "@shared/store/user/user.store";
import { ROUTES } from "@shared/constants/routes";
import type { MonthlyBadge } from "@shared/types/missions";
import { splitMissions, useDailyMissions, useRerollMission } from "@features/missions/store/missions.queries";
import { useMissionsReset } from "@features/missions/hooks/useMissionsReset";
import ProgressRing from "@features/missions/components/ProgressRing.component";
import MissionCard from "@features/missions/components/MissionCard.component";
import AllBadgesModal from "@features/missions/components/AllBadgesModal.component";
import BadgeModal from "@features/missions/components/BadgeModal.component";
import {
	badgeImage,
	getMonthlyBadges,
	getMonthlyChallenge,
	monthWithPreposition,
} from "@features/missions/utils/monthlyBadges";
import "@shared/styles/Quiz.css";
import "@features/missions/styles/Missions.css";

const getRerollErrorMessage = (error: unknown) => {
	if (isAxiosError(error)) {
		if (error.response?.status === 409) {
			return "Tu as déjà changé une mission aujourd'hui, ou aucune autre mission n'est disponible.";
		}
		if (error.response?.status === 400) return "Cette mission ne peut pas être changée.";
	}
	return "Impossible de changer la mission pour le moment.";
};

/** Apparition des blocs de la page, l'un après l'autre */
const reveal = (delay = 0) => ({
	initial: { opacity: 0, y: 26 },
	whileInView: { opacity: 1, y: 0 },
	viewport: { once: true, amount: 0.2 },
	transition: { type: "spring" as const, stiffness: 140, damping: 18, delay },
});

const MissionsScreen: React.FC = () => {
	const navigate = useNavigate();
	const reduceMotion = useReducedMotion();
	const firstName = useUserStore((state) => state.user?.first_name);
	const { data, isLoading, isError, dataUpdatedAt } = useDailyMissions();
	const reroll = useRerollMission();
	const { label: resetLabel } = useMissionsReset(data?.reset_in_seconds, dataUpdatedAt);
	const [openBadge, setOpenBadge] = useState<MonthlyBadge | null>(null);
	const [showAllBadges, setShowAllBadges] = useState(false);

	const challenge = useMemo(() => getMonthlyChallenge(), []);
	const badges = useMemo(() => getMonthlyBadges(), []);
	const monthIndex = new Date().getMonth();
	const year = new Date().getFullYear();
	const earned = badges.filter((b) => b.status === "earned").length;
	const questsLeft = Math.max(challenge.questsTotal - challenge.questsCurrent, 0);

	const { regular, bonus } = splitMissions(data?.missions);
	const completed = data?.completed ?? 0;
	const total = data?.total ?? regular.length;
	const allDone = total > 0 && completed >= total;
	const canReroll = Boolean(data?.reroll_available);

	const handleReroll = (missionId: number) =>
		reroll.mutate(missionId, {
			onSuccess: (mission) => showToast(`Nouvelle mission : ${mission.title}`, "success"),
			onError: (error) => showToast(getRerollErrorMessage(error), "error"),
		});

	const heroLine = allDone
		? "Tout est bouclé pour aujourd'hui. Reviens demain pour de nouvelles missions !"
		: `${firstName ? `${firstName}, ` : ""}chaque mission rapporte de l'XP et des miloros, et te rapproche du badge du mois.`;

	return (
		<ScreenLayout>
			<div className="mp">
				<div className="mp-wrap">
					{/* ================= EN-TÊTE ================= */}
					<motion.section className="mp-hero" {...(reduceMotion ? {} : reveal(0))}>
						<div className="mp-hero__copy">
							<div className="mp-hero__titles">
								<h1 className="mp-hero__title">
									Tes <span className="mp-hl">missions</span> du jour
								</h1>
								<p className="mp-hero__lead">{heroLine}</p>
							</div>
							<div className="mp-hero__meta">
								<div className="mp-hero__progress">
									<ProgressRing value={completed} total={total || 1} size={92} stroke={10}>
										<span className="mp-ring__value">
											<CountUp value={completed} delay={0.4} />
											<small>/{total}</small>
										</span>
									</ProgressRing>
									<div className="mp-hero__progress-copy">
										<p className="mp-hero__progress-title">
											{allDone ? "Tout est bouclé !" : `${completed} mission${completed > 1 ? "s" : ""} sur ${total} terminée${completed > 1 ? "s" : ""}`}
										</p>
										<p className="mp-hero__progress-sub">
											{allDone ? "Reviens demain pour de nouvelles missions." : `Encore ${total - completed} pour boucler ta journée.`}
										</p>
									</div>
								</div>
								<div className="mp-hero__facts">
									{resetLabel && (
										<span className="mp-fact">
											<Clock size={18} aria-hidden="true" />
											{resetLabel.replace("Reset", "Nouvelles missions")}
										</span>
									)}
									<span className="mp-fact">
										<CalendarDays size={18} aria-hidden="true" />
										{challenge.daysLeft} jour{challenge.daysLeft > 1 ? "s" : ""} pour le badge
									</span>
								</div>
							</div>
						</div>

						<div className="mp-hero__art" aria-hidden="true">
							<motion.img
								src="/missions/milo-archer.webp"
								alt=""
								className="mp-hero__archer"
								draggable={false}
								initial={reduceMotion ? false : { x: -50, opacity: 0, rotate: -4 }}
								animate={{ x: 0, opacity: 1, rotate: 0 }}
								transition={{ type: "spring", stiffness: 110, damping: 14, delay: 0.25 }}
							/>
							{allDone && <ConfettiBurst count={42} originX={78} originY={45} spread={240} delay={1.2} />}
						</div>
					</motion.section>

					{/* Titre au-dessus des deux colonnes : missions et badges démarrent à la même hauteur */}
					<header className="mp-section__head mp-layout__head">
						<h2 id="mp-daily-title" className="mp-h2">Missions du jour</h2>
						<p className="mp-section__sub">
							Clique sur « C'est parti » pour t'y mettre. Tu peux changer une mission par jour.
						</p>
					</header>
					<div className="mp-layout">
						{/* ================= MISSIONS DU JOUR ================= */}
						<section className="mp-main" aria-label="Missions du jour">
							{isLoading && (
								<div className="mp-list">
									{[0, 1, 2].map((i) => (
										<div key={i} className="mp-mission mp-mission--skeleton" aria-hidden="true" />
									))}
								</div>
							)}
							{isError && (
								<div className="mp-empty">
									<Emoji3D name="locked" />
									<p>Impossible de charger tes missions pour le moment. Réessaie dans un instant.</p>
								</div>
							)}
							{!isLoading && !isError && (
								<div className="mp-list">
									{regular.map((mission, i) => (
										<MissionCard
											key={mission.id}
											mission={mission}
											index={i}
											onStart={() => navigate(ROUTES.COURSES)}
											onReroll={canReroll ? () => handleReroll(mission.id) : undefined}
											isRerolling={reroll.isPending && reroll.variables === mission.id}
										/>
									))}
									{bonus && (
										<div className="mp-bonus">
											<MissionCard mission={bonus} index={regular.length} featured onStart={() => navigate(ROUTES.COURSES)} />
										</div>
									)}
								</div>
							)}
						</section>

						{/* ================= COLONNE BADGES ================= */}
						<aside className="mp-aside" aria-label="Badges">
							{/* Badge du mois */}
							<motion.section className="mp-month" aria-labelledby="mp-month-title" {...(reduceMotion ? {} : reveal(0.1))}>
								<span className="mp-month__dots" aria-hidden="true" />
								<motion.button
									type="button"
									className="mp-month__badge"
									onClick={() => setOpenBadge(badges[monthIndex])}
									aria-label={`Voir le badge ${monthWithPreposition(monthIndex)}`}
									whileHover={reduceMotion ? undefined : { scale: 1.06, rotate: -4 }}
									whileTap={reduceMotion ? undefined : { scale: 0.96 }}
								>
									<img src={badgeImage(monthIndex)} alt="" draggable={false} />
								</motion.button>
								<div className="mp-month__copy">
									<div className="mp-month__titles">
										<h2 id="mp-month-title" className="mp-month__title">{challenge.title}</h2>
										<p className="mp-month__text">
											{challenge.questsTotal} quêtes pour le décrocher.
										</p>
									</div>
									<div className="mp-month__progress">
										<div className="mp-bar mp-bar--light">
											<motion.div
												className="mp-bar__fill mp-bar__fill--light"
												initial={{ width: reduceMotion ? `${(challenge.questsCurrent / challenge.questsTotal) * 100}%` : "0%" }}
												animate={{ width: `${(challenge.questsCurrent / challenge.questsTotal) * 100}%` }}
												transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
											/>
										</div>
										<span className="mp-month__count">
											<CountUp value={challenge.questsCurrent} delay={0.5} />/{challenge.questsTotal}
										</span>
									</div>
									<p className="mp-month__left">
										Encore <b>{questsLeft} quêtes</b> en <b>{challenge.daysLeft} jours</b>.
									</p>
								</div>
							</motion.section>

							{/* Collection : aperçu + « Voir tout » */}
							<motion.section className="mp-collection" aria-labelledby="mp-collection-title" {...(reduceMotion ? {} : reveal(0.18))}>
								<header className="mp-collection__head">
									<div className="mp-collection__titles">
										<h2 id="mp-collection-title" className="mp-collection__title">Ta collection</h2>
										<p className="mp-collection__sub">{year} · un badge par mois</p>
									</div>
									<span className="mp-collection-count">
										<CountUp value={earned} />
										<small>/12</small>
									</span>
								</header>
								<ul className="mp-mini-badges">
									{badges.map((badge) => (
										<li key={badge.id}>
											<button
												type="button"
												className={`mp-mini-badge is-${badge.status}`}
												onClick={() => setOpenBadge(badge)}
												aria-label={`Badge ${badge.month}`}
												title={badge.month}
											>
												<img src={badge.imageUrl ?? ""} alt="" draggable={false} width={320} height={300} />
											</button>
										</li>
									))}
								</ul>
								<button type="button" className="mp-btn mp-btn--ghost" onClick={() => setShowAllBadges(true)}>
									Voir tous les badges
									<ArrowRight size={19} strokeWidth={2.6} aria-hidden="true" />
								</button>
							</motion.section>
						</aside>
					</div>
				</div>

				<AllBadgesModal
					isOpen={showAllBadges}
					badges={badges}
					earned={earned}
					year={year}
					onClose={() => setShowAllBadges(false)}
					onOpenBadge={setOpenBadge}
				/>
				<BadgeModal badge={openBadge} onClose={() => setOpenBadge(null)} questsLeft={questsLeft} />
			</div>
		</ScreenLayout>
	);
};

export default MissionsScreen;
