import React from "react";
import { useNavigate } from "react-router-dom";
import { Award, Clock, Sparkles, Target } from "lucide-react";
import MissionItem from "@features/missions/components/missionItem/MissionItem.component";
import BadgeItem from "@features/missions/components/badgeItem/BadgeItem.component";
import { useDailyMissions } from "@features/missions/store/dailyMissions.store";
import { useUserStore } from "@shared/store/user/user.store";
import type { MonthlyBadge, MonthlyChallenge } from "@shared/types/missions";
import { ROUTES } from "@shared/constants/routes";
import "@features/missions/styles/MissionsScreen.css";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import miloMascot from "/buttonGo.webp";

const MONTHLY_CHALLENGE: MonthlyChallenge = {
	title: "L'aventure de Novembre",
	daysLeft: 26,
	questsCurrent: 4,
	questsTotal: 35,
};

const MONTHLY_BADGES: MonthlyBadge[] = [
	{
		id: "25-01",
		month: "Janvier",
		monthIndex: 0,
		year: 2025,
		imageUrl: "badges/badge1.png",
		status: "earned",
	},
	{
		id: "25-02",
		month: "Février",
		monthIndex: 1,
		year: 2025,
		imageUrl: "badges/badge2.png",
		status: "missed",
	},
	{
		id: "25-03",
		month: "Mars",
		monthIndex: 2,
		year: 2025,
		imageUrl: "badges/badge4.png",
		status: "missed",
	},
	{
		id: "25-04",
		month: "Avril",
		monthIndex: 3,
		year: 2025,
		imageUrl: "badges/badge3.png",
		status: "earned",
	},
	{
		id: "25-05",
		month: "Mai",
		monthIndex: 4,
		year: 2025,
		imageUrl: "badges/badge1.png",
		status: "earned",
	},
	{
		id: "25-06",
		month: "Juin",
		monthIndex: 5,
		year: 2025,
		imageUrl: "badges/badge3.png",
		status: "missed",
	},
	{
		id: "25-07",
		month: "Juillet",
		monthIndex: 6,
		year: 2025,
		imageUrl: "badges/badge4.png",
		status: "earned",
	},
	{
		id: "25-08",
		month: "Août",
		monthIndex: 7,
		year: 2025,
		imageUrl: "badges/badge2.png",
		status: "missed",
	},
	{
		id: "25-09",
		month: "Septembre",
		monthIndex: 8,
		year: 2025,
		imageUrl: "badges/badge5.png",
		status: "earned",
	},
	{
		id: "25-10",
		month: "Octobre",
		monthIndex: 9,
		year: 2025,
		imageUrl: "badges/badge6.png",
		status: "earned",
	},
	{
		id: "25-11",
		month: "Novembre",
		monthIndex: 10,
		year: 2025,
		imageUrl: "badges/badge6.png",
		status: "in-progress",
	},
	{
		id: "25-12",
		month: "Décembre",
		monthIndex: 11,
		year: 2025,
		imageUrl: null,
		status: "locked",
	},
];

const MissionsScreen: React.FC = () => {
	const navigate = useNavigate();
	const dailyMissions = useDailyMissions();
	const user = useUserStore((state) => state.user);
	const dailyMissionDelayStart = 0.15;
	const badgeDelayStart = 0.05;

	const completedMissionsCount = dailyMissions.filter(
		(mission) => mission.progressCurrent >= mission.progressTotal,
	).length;
	const earnedBadgesCount = MONTHLY_BADGES.filter(
		(badge) => badge.status === "earned",
	).length;

	const badgesByYear = MONTHLY_BADGES.reduce(
		(acc, badge) => {
			const year = badge.year.toString();
			acc[year] = [...(acc[year] ?? []), badge];
			return acc;
		},
		{} as Record<string, MonthlyBadge[]>,
	);
	const sortedYears = Object.keys(badgesByYear).sort(
		(a, b) => Number(b) - Number(a),
	);

	return (
		<ScreenLayout>
			<div className="ms-page">
				{/* --- HERO --- */}
				<section className="ms-hero">
					<div className="ms-hero-halo" aria-hidden="true" />
					<div className="ms-hero-left">
						<img src={miloMascot} alt="Milo" className="ms-hero-mascot" />
					</div>
					<div className="ms-hero-center">
						<div className="ms-hero-chip">
							<Sparkles size={14} />
							<span>Missions &amp; récompenses</span>
						</div>
						<h1 className="ms-hero-title">
							Salut {user?.first_name || "toi"} !
						</h1>
						<p className="ms-hero-sub">
							Complète tes missions du jour et débloque un nouveau badge
							chaque mois.
						</p>
					</div>
					<div className="ms-hero-stats">
						<div className="ms-hero-stat">
							<Target size={16} />
							<span>
								{completedMissionsCount}/{dailyMissions.length} missions
							</span>
						</div>
						<div className="ms-hero-stat">
							<Clock size={16} />
							<span>Reset dans 8h</span>
						</div>
					</div>
				</section>

				{/* --- DÉFI MENSUEL --- */}
				<section className="ms-challenge">
					<div className="ms-challenge-content">
						<h3 className="ms-challenge-title">{MONTHLY_CHALLENGE.title}</h3>
						<p className="ms-challenge-text">
							Termine {MONTHLY_CHALLENGE.questsTotal} quêtes ce mois-ci pour
							gagner un badge exclusif !
						</p>
						<div className="ms-progress-container">
							<div className="ms-progress-bar">
								<div
									className="ms-progress-fill"
									style={{
										width: `${(MONTHLY_CHALLENGE.questsCurrent / MONTHLY_CHALLENGE.questsTotal) * 100}%`,
									}}
								/>
							</div>
							<span>
								{MONTHLY_CHALLENGE.questsCurrent}/{MONTHLY_CHALLENGE.questsTotal}
							</span>
						</div>
						<span className="ms-challenge-days-left">
							📅 {MONTHLY_CHALLENGE.daysLeft} jours restants
						</span>
					</div>
					<div className="ms-challenge-fox" aria-hidden="true">
						<img src="/miloBook.webp" alt="" />
					</div>
				</section>

				{/* --- MISSIONS DU JOUR --- */}
				<header className="ms-section-header">
					<div className="ms-section-title-wrap">
						<Target size={20} className="ms-section-icon" />
						<h2 className="ms-section-title">Missions du jour</h2>
					</div>
					<span className="ms-section-count">
						{completedMissionsCount}/{dailyMissions.length} complétées
					</span>
				</header>
				<div className="ms-missions-list">
					{dailyMissions.map((mission, index) => (
						<MissionItem
							key={mission.id}
							mission={mission}
							animationDelay={`${dailyMissionDelayStart + index * 0.06}s`}
							onClick={() => navigate(ROUTES.COURSES)}
							actionLabel="Faire un QCM"
						/>
					))}
				</div>

				{/* --- BADGES MENSUELS --- */}
				<header className="ms-section-header">
					<div className="ms-section-title-wrap">
						<Award size={20} className="ms-section-icon" />
						<h2 className="ms-section-title">Badges mensuels</h2>
					</div>
					<span className="ms-section-count">
						{earnedBadgesCount} badge{earnedBadgesCount > 1 ? "s" : ""} obtenu
						{earnedBadgesCount > 1 ? "s" : ""}
					</span>
				</header>
				<div className="ms-badges">
					{sortedYears.map((year) => (
						<div key={year} className="ms-badge-year">
							<h3 className="ms-badge-year-title">Badges {year}</h3>
							<div className="ms-badge-grid">
								{badgesByYear[year]
									.sort((a, b) => a.monthIndex - b.monthIndex)
									.map((badge, index) => (
										<BadgeItem
											key={badge.id}
											badge={badge}
											animationDelay={`${badgeDelayStart + index * 0.03}s`}
										/>
									))}
							</div>
						</div>
					))}
				</div>
			</div>
		</ScreenLayout>
	);
};

export default MissionsScreen;
