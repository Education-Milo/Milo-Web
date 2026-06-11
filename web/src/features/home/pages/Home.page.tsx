import React from "react";
import { useNavigate } from "react-router-dom";
import {
	BookOpenText,
	Bell,
	Calendar,
	CheckCircle2,
	Clock,
	Sparkles,
	Target,
} from "lucide-react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { useHomePage } from "@features/home/hooks/useHomePage";
import { useDailyMissions } from "@features/missions/store/dailyMissions.store";
import { ROUTES } from "@shared/constants/routes";
import "@features/home/styles/Home.css";

const ANNOUNCEMENTS = [
	{
		id: 1,
		date: "Aujourd'hui",
		emoji: "🚀",
		title: "Nouvelle leçon disponible !",
		text: "Découvre les secrets des fractions avec Milo.",
	},
	{
		id: 2,
		date: "28 Fév. 2024",
		emoji: "🏆",
		title: "Tournoi de Duels",
		text: "Inscris-toi pour le tournoi de mathématiques du week-end.",
	},
	{
		id: 3,
		date: "25 Fév. 2024",
		emoji: "🛠️",
		title: "Maintenance prévue",
		text: "L'application sera mise à jour à 2h du matin.",
	},
	{
		id: 4,
		date: "20 Fév. 2024",
		emoji: "✨",
		title: "Milo s'est amélioré",
		text: "L'IA parle désormais mieux l'anglais !",
	},
];

const HomePage: React.FC = () => {
	const navigate = useNavigate();
	const { welcomeMessage, handleMiloClick } = useHomePage();
	const missions = useDailyMissions();
	const completedMissionsCount = missions.filter(
		(mission) => mission.progressCurrent >= mission.progressTotal,
	).length;

	const handleMissionClick = () => {
		navigate(ROUTES.COURSES);
	};

	return (
		<ScreenLayout>
			<div className="hp-page">
				<div className="hp-grid">
					{/* =============== COLONNE PRINCIPALE =============== */}
					<div className="hp-main-col">
						{/* --- Welcome Section --- */}
						<section className="hp-welcome">
							<div className="hp-welcome-halo" aria-hidden="true" />
							<div className="hp-welcome-content">
								<div className="hp-welcome-chip">
									<Sparkles size={14} />
									<span>Bienvenue</span>
								</div>
								<h1 className="hp-welcome-title">{welcomeMessage}</h1>
								<p className="hp-welcome-sub">
									Prêt à conquérir de nouveaux défis aujourd'hui ?
								</p>

								<div className="hp-welcome-actions">
									<button type="button" className="hp-action-btn primary">
										<BookOpenText size={16} />
										<span>Continuer le cours</span>
									</button>
									<button type="button" className="hp-action-btn secondary">
										<Target size={16} />
										<span>Nouvelle mission</span>
									</button>
								</div>
							</div>

							<div className="hp-welcome-illustration" aria-hidden="true">
								<img src="/miloBook.webp" alt="" className="hp-welcome-img" />
							</div>
						</section>
						<button
							type="button"
							className="hp-milo-banner"
							onClick={handleMiloClick}
							aria-label="Discuter avec Milo"
						>
							<img
								src="/discuter_milo.jpg"
								alt="Discute avec Milo"
								className="hp-milo-banner-img"
							/>
							<div className="hp-milo-banner-shine" aria-hidden="true" />
							<div className="hp-milo-banner-shine-2" aria-hidden="true" />
						</button>
					</div>

					{/* =============== COLONNE SECONDAIRE =============== */}
					<div className="hp-side-col">
						{/* --- Actualités --- */}
						<section className="hp-card hp-announcements">
							<header className="hp-card-header">
								<div className="hp-card-title-wrap">
									<div className="hp-card-icon">
										<Bell size={18} />
									</div>
									<h2 className="hp-card-title">Actualités</h2>
								</div>
								<span className="hp-badge-new">Nouveau</span>
							</header>

							<div className="hp-announcements-scroll">
								{ANNOUNCEMENTS.map((a, i) => (
									<article
										key={a.id}
										className="hp-announcement"
										style={{ animationDelay: `${0.4 + i * 0.08}s` }}
									>
										<div className="hp-announcement-emoji">{a.emoji}</div>
										<div className="hp-announcement-body">
											<div className="hp-announcement-date">
												<Calendar size={11} />
												<span>{a.date}</span>
											</div>
											<h4 className="hp-announcement-title">{a.title}</h4>
											<p className="hp-announcement-text">{a.text}</p>
										</div>
									</article>
								))}
							</div>
						</section>

						{/* --- Missions du jour --- */}
						<section className="hp-card hp-missions">
							<header className="hp-card-header">
								<div className="hp-card-title-wrap">
									<div className="hp-card-icon">
										<Target size={18} />
									</div>
									<h2 className="hp-card-title">Missions du jour</h2>
								</div>
								<div className="hp-progress-pill">
									<span className="hp-progress-value">
										{completedMissionsCount}
									</span>
									<span className="hp-progress-sep">/</span>
									<span className="hp-progress-total">{missions.length}</span>
								</div>
							</header>

							<div className="hp-missions-list">
								{missions.map((mission, i) => {
									const isDone =
										mission.progressCurrent >= mission.progressTotal;
									return (
										<button
											type="button"
											key={mission.id}
											className={`hp-mission ${isDone ? "done" : "pending"}`}
											onClick={handleMissionClick}
											style={{ animationDelay: `${0.5 + i * 0.1}s` }}
										>
											<div className="hp-mission-icon-wrap">
												{isDone ? (
													<CheckCircle2 size={20} />
												) : (
													<Clock size={20} />
												)}
											</div>
											<div className="hp-mission-body">
												<div className="hp-mission-top">
													<h3 className="hp-mission-title">
														{mission.title}
													</h3>
													<span className="hp-mission-points">
														{isDone
															? "Terminé"
															: `+${mission.rewardPoints} pts`}
													</span>
												</div>
												<p className="hp-mission-desc">
													{isDone
														? "Mission accomplie avec brio !"
														: `${Math.min(mission.progressCurrent, mission.progressTotal)}/${mission.progressTotal} réalisé`}
												</p>
												<span className="hp-mission-category">
													QCM
												</span>
											</div>
										</button>
									);
								})}
							</div>
						</section>
					</div>
				</div>
			</div>
		</ScreenLayout>
	);
};

export default HomePage;
