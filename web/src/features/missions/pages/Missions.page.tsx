import React from "react";
import { useNavigate } from "react-router-dom";
import { Award, Clock, Sparkles, Target } from "lucide-react";
import MissionItem from "@features/missions/components/missionItem/MissionItem.component";
import BadgeItem from "@features/missions/components/badgeItem/BadgeItem.component";
import { useDailyMissions } from "@features/missions/store/dailyMissions.store";
import type { MonthlyBadge, MonthlyChallenge } from "@shared/types/missions";
import { ROUTES } from "@shared/constants/routes";
import "@features/missions/styles/MissionsScreen.css";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import miloMascot from "/buttonGo.webp";

const MONTH_NAMES = [
	"Janvier",
	"Février",
	"Mars",
	"Avril",
	"Mai",
	"Juin",
	"Juillet",
	"Août",
	"Septembre",
	"Octobre",
	"Novembre",
	"Décembre",
];
// Mois dont le nom commence par un son vocalique : "de" s'élide en "d'".
const ELIDED_MONTHS = new Set([3, 7, 9]); // Avril, Août, Octobre

const BADGE_IMAGES = [
	"badges/badge1.png",
	"badges/badge2.png",
	"badges/badge3.png",
	"badges/badge4.png",
	"badges/badge5.png",
	"badges/badge6.png",
];

const getMonthlyChallenge = (): MonthlyChallenge => {
	const today = new Date();
	const monthIndex = today.getMonth();
	const lastDayOfMonth = new Date(
		today.getFullYear(),
		monthIndex + 1,
		0,
	).getDate();
	const preposition = ELIDED_MONTHS.has(monthIndex) ? "d'" : "de ";

	return {
		title: `L'aventure ${preposition}${MONTH_NAMES[monthIndex]}`,
		daysLeft: lastDayOfMonth - today.getDate(),
		questsCurrent: 4,
		questsTotal: 35,
	};
};

const getMonthlyBadges = (): MonthlyBadge[] => {
	const today = new Date();
	const currentYear = today.getFullYear();
	const currentMonthIndex = today.getMonth();
	const yearSuffix = String(currentYear).slice(-2);

	return MONTH_NAMES.map((month, monthIndex) => {
		let status: MonthlyBadge["status"];
		if (monthIndex < currentMonthIndex) {
			// Pas d'historique réel de complétion : on alterne pour illustrer les deux états.
			status = monthIndex % 2 === 0 ? "earned" : "missed";
		} else if (monthIndex === currentMonthIndex) {
			status = "in-progress";
		} else {
			status = "locked";
		}

		return {
			id: `${yearSuffix}-${String(monthIndex + 1).padStart(2, "0")}`,
			month,
			monthIndex,
			year: currentYear,
			imageUrl:
				status === "locked"
					? null
					: BADGE_IMAGES[monthIndex % BADGE_IMAGES.length],
			status,
		};
	});
};

const MissionsScreen: React.FC = () => {
	const navigate = useNavigate();
	const dailyMissions = useDailyMissions();
	const dailyMissionDelayStart = 0.15;
	const badgeDelayStart = 0.05;

	const monthlyChallenge = getMonthlyChallenge();
	const monthlyBadges = getMonthlyBadges();

	const completedMissionsCount = dailyMissions.filter(
		(mission) => mission.progressCurrent >= mission.progressTotal,
	).length;
	const earnedBadgesCount = monthlyBadges.filter(
		(badge) => badge.status === "earned",
	).length;

	const badgesByYear = monthlyBadges.reduce(
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
							<span>Ton espace</span>
						</div>
						<h1 className="ms-hero-title">Missions &amp; Récompenses</h1>
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
						<h3 className="ms-challenge-title">{monthlyChallenge.title}</h3>
						<p className="ms-challenge-text">
							Termine {monthlyChallenge.questsTotal} quêtes ce mois-ci pour
							gagner un badge exclusif !
						</p>
						<div className="ms-progress-container">
							<div className="ms-progress-bar">
								<div
									className="ms-progress-fill"
									style={{
										width: `${(monthlyChallenge.questsCurrent / monthlyChallenge.questsTotal) * 100}%`,
									}}
								/>
							</div>
							<span>
								{monthlyChallenge.questsCurrent}/{monthlyChallenge.questsTotal}
							</span>
						</div>
						<span className="ms-challenge-days-left">
							📅 {monthlyChallenge.daysLeft} jours restants
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
