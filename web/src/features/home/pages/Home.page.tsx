import React from "react";
import "@styles/HomePage.css";
import { useHomePage } from "@features/home/hooks/useHomePage";
import ScreenLayout from "@components/ui/common/ScreenLayout.component";

const HomePage: React.FC = () => {
	const {
		welcomeMessage,
		missions,
		completedMissionsCount,
		handleMissionClick,
		handleMiloClick,
	} = useHomePage();

	return (
		<ScreenLayout>
			<div className="dashboard">
				<div className="main-column">
					{/* Section Bienvenue */}
					<section className="welcome-section">
						<div className="welcome-content">
							<h1 className="welcome-title">{welcomeMessage}</h1>
							<p className="welcome-subtitle">
								Prêt à conquérir de nouveaux défis aujourd'hui ?
							</p>
							<div className="quick-action-buttons">
								<button className="quick-action-btn">
									📚 Continuer le cours
								</button>
								<button className="quick-action-btn">
									🎯 Nouvelle mission
								</button>
							</div>
							<div className="welcome-illustration">
								<img
									src="/miloBook.webp"
									alt="Bienvenue"
									className="welcome-img"
								/>
							</div>
						</div>
					</section>

					<section
						className="section-card milo-banner-clickable"
						onClick={handleMiloClick}
					>
						<div className="milo-image-container">
							<img
								src="/discuter_milo.png"
								alt="Milo AI"
								className="milo-display-img"
							/>
						</div>
					</section>
				</div>

				<div className="sidebar-column">
					{/* Section Annonces */}
					<section className="section-card announcements-section">
						<div className="section-header">
							<h2 className="section-title">📢 Actualités</h2>
							<span className="badge-new">Nouveau</span>
						</div>

						<div className="announcements-scroll">
							{/* Annonce 1 */}
							<div className="announcement-item">
								<div className="announcement-date">Aujourd'hui</div>
								<div className="announcement-content">
									<h4>🚀 Nouvelle leçon disponible !</h4>
									<p>Découvre les secrets des fractions avec Milo.</p>
								</div>
							</div>

							{/* Annonce 2 */}
							<div className="announcement-item">
								<div className="announcement-date">28 Fév. 2024</div>
								<div className="announcement-content">
									<h4>🏆 Tournoi de Duels</h4>
									<p>
										Inscris-toi pour le tournoi de mathématiques du week-end.
									</p>
								</div>
							</div>

							{/* Annonce 3 */}
							<div className="announcement-item">
								<div className="announcement-date">25 Fév. 2024</div>
								<div className="announcement-content">
									<h4>🛠️ Maintenance prévue</h4>
									<p>L'application sera mise à jour à 2h du matin.</p>
								</div>
							</div>

							{/* Annonce 4 (Pour tester le scroll) */}
							<div className="announcement-item">
								<div className="announcement-date">20 Fév. 2024</div>
								<div className="announcement-content">
									<h4>✨ Milo s'est amélioré</h4>
									<p>L'IA parle désormais mieux l'anglais !</p>
								</div>
							</div>
						</div>
					</section>

					{/* Section Missions */}
					<section className="section-card">
						<div className="section-header">
							<h2 className="section-title">🎯 Missions du jour</h2>
							<div className="progress-indicator">
								{completedMissionsCount}/{missions.length} complétées
							</div>
						</div>

						<div className="missions-grid">
							{missions.map((mission) => (
								<div
									key={mission.id}
									className={`mission-card ${mission.status === "completed" ? "green" : "orange"}`}
									onClick={() => handleMissionClick(mission.id)}
								>
									<div className="mission-content">
										<div className="mission-info">
											<h3 className="mission-title">{mission.title}</h3>
											<p className="mission-description">
												{mission.description}
											</p>
											<span className="mission-category">
												{mission.category}
											</span>
										</div>
										<div className="mission-meta">
											<div className="mission-points">
												+{mission.points} pts
											</div>
											{mission.status === "completed" ? (
												<div className="mission-check">✅</div>
											) : (
												<div style={{ fontSize: "1.2rem", opacity: 0.7 }}>
													⏰
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</section>
				</div>
			</div>
		</ScreenLayout>
	);
};

export default HomePage;
