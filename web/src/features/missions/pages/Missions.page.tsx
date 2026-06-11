import React from "react";
import { useNavigate } from "react-router-dom";
import MissionItem from "@features/missions/components/missionItem/MissionItem.component";
import BadgeItem from "@features/missions/components/badgeItem/BadgeItem.component";
import { useDailyMissions } from "@features/missions/store/dailyMissions.store";
import type {
	MonthlyBadge,
	MonthlyChallenge,
} from "@shared/types/missions";
import { ROUTES } from "@shared/constants/routes";
import "@shared/styles/layout.css";
import "@shared/styles/animations.css";
import "@shared/styles/scrollbar.css";
import "@features/missions/styles/MissionsScreen.css";
import ScreenLayout from "@shared/components/ScreenLayout.component";

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
	const dailyMissionDelayStart = 0.3;
	const badgeDelayStart = 0.5;
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
		<>
			<ScreenLayout>
				<div className="missions-page-container">
					<div className="missions-top-row">
						<section className="section-card monthly-challenge-card">
							<div className="monthly-challenge-top-content">
								<div className="monthly-challenge-header">
									<h3>{MONTHLY_CHALLENGE.title}</h3>
								</div>
								<div className="monthly-challenge-body">
									<p>
										Termine {MONTHLY_CHALLENGE.questsTotal} quêtes ce mois-ci
										pour gagner un badge exclusif !
									</p>
									<div className="mission-progress-container">
										<div className="mission-progress-bar">
											<div
												className="mission-progress-fill"
												style={{
													width: `${(MONTHLY_CHALLENGE.questsCurrent / MONTHLY_CHALLENGE.questsTotal) * 100}%`,
												}}
											></div>
										</div>
										<span>
											{MONTHLY_CHALLENGE.questsCurrent}/
											{MONTHLY_CHALLENGE.questsTotal}
										</span>
									</div>
								</div>
							</div>
							<div className="monthly-challenge-bottom-content">
								<span className="monthly-challenge-days-left-text">
									📅 {MONTHLY_CHALLENGE.daysLeft} jours restants
								</span>
								<div className="monthly-challenge-fox-img">
									<img src="/miloBook.webp" alt="Milo reading a book" />
								</div>
							</div>
						</section>

						<section className="section-card daily-missions-card">
							<div className="section-header">
								<h2 className="section-title">🎯 Missions du jour</h2>
								<div className="missions-timer">⏳ 8 HEURES</div>
							</div>
							<div className="daily-missions-list">
								{dailyMissions.map((mission, index) => (
									<MissionItem
										key={mission.id}
										mission={mission}
										animationDelay={`${dailyMissionDelayStart + index * 0.05}s`}
										onClick={() => navigate(ROUTES.COURSES)}
										actionLabel="Faire un QCM"
									/>
								))}
							</div>
						</section>
					</div>

					<section className="section-card badge-calendar-card">
						<div className="section-header">
							<h2 className="section-title">🏆 Badges Mensuels</h2>
						</div>
						<div className="badge-calendar-content">
							{sortedYears.map((year) => (
								<div key={year} className="badge-year-section">
									<h3 className="badge-year-title">Badges {year}</h3>
									<div className="badge-grid">
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
					</section>
				</div>
			</ScreenLayout>
		</>
	);
};

export default MissionsScreen;
