import React from "react";
import "@features/parent/styles/Dashboard.css";
import "@features/parent/styles/temp.css";
import { useDashboard } from "@features/parent/hooks/useDashboard";
import ScreenLayout from "@shared/components/ScreenLayout.component";

const CircularProgress = ({
	value,
	max,
	color,
	icon,
	label,
	sublabel,
}: any) => {
	const radius = 35;
	const circumference = 2 * Math.PI * radius;
	const percentage = Math.min((value / max) * 100, 100);
	const strokeDashoffset = circumference - (percentage / 100) * circumference;

	return (
		<div
			className="graphical-card"
			style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}
		>
			<div className="card-decoration-icon">{icon}</div>
			<div
				style={{
					position: "relative",
					width: "90px",
					height: "90px",
					flexShrink: 0,
				}}
			>
				<svg
					width="90"
					height="90"
					viewBox="0 0 90 90"
					style={{ transform: "rotate(-90deg)" }}
				>
					<circle
						cx="45"
						cy="45"
						r={radius}
						stroke="#e2e8f0"
						strokeWidth="8"
						fill="none"
					/>
					<circle
						cx="45"
						cy="45"
						r={radius}
						stroke={color}
						strokeWidth="8"
						fill="none"
						strokeDasharray={circumference}
						strokeDashoffset={strokeDashoffset}
						strokeLinecap="round"
						style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
					/>
				</svg>
				<div
					style={{
						position: "absolute",
						top: "50%",
						left: "50%",
						transform: "translate(-50%, -50%)",
						fontSize: "1.8rem",
					}}
				>
					{icon}
				</div>
			</div>
			<div>
				<h3
					style={{
						fontSize: "1.1rem",
						marginBottom: "0.2rem",
						color: "#718096",
						fontWeight: 600,
					}}
				>
					{sublabel}
				</h3>
				<div
					style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#2d3748" }}
				>
					{label}
				</div>
				<p style={{ color: "#a0aec0", fontSize: "0.85rem" }}>
					Objectif : {max}h / semaine
				</p>
			</div>
		</div>
	);
};

// --- SIMULATEUR DE DONNÉES PAR ENFANT ---
// Plus tard, ces données viendront directement de ton useDashboard (de l'API)
const getStatsForChild = (childId: string | number) => {
	// On simule des stats différentes selon l'ID (pair ou impair)
	const idNum = typeof childId === "string" ? childId.charCodeAt(0) : childId;

	if (idNum % 2 === 0) {
		// Profil "Élève en difficulté sur les maths"
		return {
			timeSpentHours: 2,
			timeGoalHours: 5,
			exercisesDone: 15,
			exercisesGoal: 20,
			strengths: ["Français (Orthographe)", "Anglais (Vocabulaire)"],
			weaknesses: ["Fractions", "Problèmes de logique"],
			recentActivity: [
				{
					title: "Flashcards Anglais",
					score: "20 cartes • Il y a 1h",
					icon: "🃏",
					color: "#ebf8ff",
					textCol: "#3182ce",
				},
			],
		};
	} else {
		// Profil "Élève assidu sur tous les fronts" (données d'origine)
		return {
			timeSpentHours: 5.5,
			timeGoalHours: 7,
			exercisesDone: 32,
			exercisesGoal: 40,
			strengths: ["Géométrie (Triangles)", "Histoire contemporaine"],
			weaknesses: ["Multiplications complexes"],
			recentActivity: [
				{
					title: "Quizz Mathématiques",
					score: "18/20 • Il y a 2h",
					icon: "✅",
					color: "#e6fffa",
					textCol: "#38b2ac",
				},
				{
					title: "Leçon importée",
					score: "Histoire • Hier",
					icon: "📚",
					color: "#ebf8ff",
					textCol: "#3182ce",
				},
			],
		};
	}
};

const Dashboard: React.FC = () => {
	const { welcomeMessage, children, selectedChild, handleSelectChild } =
		useDashboard();

	const safeChildren = children || [];
	const activeChild =
		safeChildren.find((c) => c.id === selectedChild) || safeChildren[0];

	// On récupère les stats dynamiques de l'enfant sélectionné
	const statsData = activeChild ? getStatsForChild(activeChild.id) : null;

	return (
		<>
			<ScreenLayout>
				<div className="dashboard">
					<div className="main-column">
						<section className="welcome-section">
							<div className="welcome-content">
								<h1 className="welcome-title">
									{welcomeMessage || "Bonjour !"}
								</h1>
								<p className="welcome-subtitle">
									Voici les progrès récents de vos enfants.
								</p>

								{safeChildren.length > 0 && (
									<div
										className="quick-action-buttons"
										style={{ marginTop: "1.5rem" }}
									>
										{safeChildren.map((child) => (
											<button
												key={child.id}
												className={`quick-action-btn ${selectedChild === child.id ? "active" : ""}`}
												onClick={() => handleSelectChild(child.id)}
												style={{
													background:
														selectedChild === child.id
															? "rgba(255, 255, 255, 0.3)"
															: "rgba(255, 255, 255, 0.15)",
													backdropFilter: "blur(5px)",
												}}
											>
												<span style={{ fontSize: "1.2rem" }}>
													{child.avatar || "👤"}
												</span>
												<span style={{ fontWeight: 600 }}>{child.name}</span>
											</button>
										))}
									</div>
								)}
							</div>
						</section>

						{safeChildren.length === 0 && (
							<section
								className="section-card"
								style={{ textAlign: "center", padding: "4rem 2rem" }}
							>
								<div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🦊</div>
								<h2
									style={{
										fontSize: "1.5rem",
										color: "#2d3748",
										marginBottom: "1rem",
									}}
								>
									Commencez l'aventure Milo !
								</h2>
								<p style={{ color: "#718096", marginBottom: "2rem" }}>
									Liez un compte enfant pour voir apparaître ses statistiques
									graphiques ici.
								</p>
								<button
									className="quick-action-btn"
									style={{
										background: "#ff6b35",
										color: "white",
										border: "none",
										padding: "1rem 2rem",
									}}
								>
									+ Lier un compte enfant
								</button>
							</section>
						)}

						{activeChild && statsData && (
							<>
								<section
									className="section-card"
									style={{
										background: "transparent",
										boxShadow: "none",
										padding: 0,
									}}
								>
									<div
										className="section-header"
										style={{ marginBottom: "1.5rem" }}
									>
										<h2 className="section-title">
											📊 Activité de la semaine : {activeChild.name}
										</h2>
									</div>

									<div
										style={{
											display: "grid",
											gridTemplateColumns: "1fr 1fr",
											gap: "1.5rem",
										}}
									>
										{/* Jauge Dynamique */}
										<CircularProgress
											value={statsData.timeSpentHours}
											max={statsData.timeGoalHours}
											color={(function () {
												const ratio =
													statsData.timeSpentHours / statsData.timeGoalHours;
												if (ratio >= 0.8) return "#10b981"; // Vert (Objectif 100% atteint)
												if (ratio >= 0.5) return "#f59e0b"; // Orange (Plus de 50% fait)
												return "#ef4444"; // Rouge (Moins de 50% fait)
											})()}
											icon="⏱️"
											sublabel="Temps de révision"
											label={`${Math.floor(statsData.timeSpentHours)}h ${Math.round((statsData.timeSpentHours % 1) * 60)}min`}
										/>

										{/* Barre Dynamique */}
										<div
											className="graphical-card vibrant"
											style={{
												background: "linear-gradient(135deg, #ff9a44, #fc6076)",
											}}
										>
											<div className="card-decoration-icon">🎯</div>
											<h3
												style={{
													fontSize: "1.1rem",
													marginBottom: "0.5rem",
													fontWeight: 600,
												}}
											>
												Exercices Complétés
											</h3>

											<div
												style={{
													display: "flex",
													alignItems: "baseline",
													gap: "0.5rem",
													marginBottom: "1rem",
												}}
											>
												<span
													style={{ fontSize: "2.5rem", fontWeight: "bold" }}
												>
													{statsData.exercisesDone}
												</span>
												<span style={{ opacity: 0.8 }}>
													/ {statsData.exercisesGoal}
												</span>
											</div>

											<div
												style={{
													height: "18px",
													background: "rgba(255,255,255,0.3)",
													borderRadius: "10px",
													overflow: "hidden",
													position: "relative",
													boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
												}}
											>
												<div
													style={{
														width: `${(statsData.exercisesDone / statsData.exercisesGoal) * 100}%`,
														background: "white",
														height: "100%",
														borderRadius: "10px",
														transition: "width 1s ease-in-out",
														display: "flex",
														alignItems: "center",
														justifyContent: "flex-end",
														paddingRight: "5px",
													}}
												>
													{statsData.exercisesDone >=
														statsData.exercisesGoal && (
														<span style={{ fontSize: "0.8rem" }}>⭐</span>
													)}
												</div>
											</div>
										</div>
									</div>
								</section>

								{/* Points forts / faibles Dynamiques */}
								<section className="section-card" style={{ marginTop: "2rem" }}>
									<div className="section-header">
										<h2 className="section-title">🎯 Analyse pédagogique</h2>
									</div>
									<div style={{ display: "flex", gap: "2rem" }}>
										<div
											style={{
												flex: 1,
												padding: "1.5rem",
												background: "rgba(72, 187, 120, 0.1)",
												borderRadius: "16px",
												borderLeft: "4px solid #48bb78",
											}}
										>
											<h3 style={{ color: "#2d3748", marginBottom: "1rem" }}>
												Points forts
											</h3>
											<ul
												style={{
													color: "#4a5568",
													paddingLeft: "1.5rem",
													lineHeight: "1.8",
												}}
											>
												{statsData.strengths.map((item, index) => (
													<li key={index}>{item}</li>
												))}
											</ul>
										</div>
										<div
											style={{
												flex: 1,
												padding: "1.5rem",
												background: "rgba(239, 68, 68, 0.1)",
												borderRadius: "16px",
												borderLeft: "4px solid #ef4444",
											}}
										>
											<h3 style={{ color: "#2d3748", marginBottom: "1rem" }}>
												À renforcer
											</h3>
											<ul
												style={{
													color: "#4a5568",
													paddingLeft: "1.5rem",
													lineHeight: "1.8",
												}}
											>
												{statsData.weaknesses.map((item, index) => (
													<li key={index}>{item}</li>
												))}
											</ul>
										</div>
									</div>
								</section>
							</>
						)}
					</div>

					{/* COLONNE LATÉRALE */}
					<div className="sidebar-column">
						<section
							className="section-card graphical-card"
							style={{
								background:
									"linear-gradient(to bottom right, #ffffff, #f0f4f8)",
							}}
						>
							<div className="section-header">
								<h2
									className="section-title"
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									🏆 Ligue & Progression
								</h2>
							</div>
							{activeChild ? (
								<div
									style={{
										textAlign: "center",
										padding: "1rem 0",
										position: "relative",
									}}
								>
									<div
										style={{
											position: "absolute",
											top: "-10px",
											right: "10px",
											fontSize: "4rem",
											opacity: 0.2,
											transform: "rotate(20deg)",
										}}
									>
										🦊
									</div>

									<div
										style={{
											background: "rgba(255, 107, 53, 0.1)",
											display: "inline-block",
											padding: "0.5rem 1rem",
											borderRadius: "20px",
											color: "#ff6b35",
											fontWeight: "bold",
											marginBottom: "1rem",
										}}
									>
										Ligue {"Argent"}
									</div>

									<h3
										style={{
											fontSize: "2.5rem",
											color: "#2d3748",
											fontWeight: 800,
											marginBottom: "0",
										}}
									>
										{activeChild?.points || "0"} XP
									</h3>
									<p style={{ color: "#718096", marginBottom: "1.5rem" }}>
										Total accumulé
									</p>

									<div
										style={{
											background: "#edf2f7",
											borderRadius: "20px",
											height: "16px",
											overflow: "hidden",
											border: "2px solid #e2e8f0",
											position: "relative",
										}}
									>
										<div
											style={{
												width: `${Math.min(((activeChild.points || 0) / 3000) * 100, 100)}%`,
												background: "linear-gradient(90deg, #ff6b35, #fbb13c)",
												height: "100%",
												borderRadius: "20px",
												transition: "width 1s ease",
											}}
										></div>
									</div>
								</div>
							) : (
								<p style={{ color: "#718096", textAlign: "center" }}>
									En attente de données...
								</p>
							)}
						</section>

						<section className="section-card">
							<div className="section-header">
								<h2 className="section-title">📝 Activité récente</h2>
							</div>

							{activeChild && statsData ? (
								<>
									<div className="achievements-list">
										{statsData.recentActivity.map((activity, index) => (
											<div key={index} className="achievement-item">
												<div
													className="achievement-icon"
													style={{
														background: activity.color,
														color: activity.textCol,
													}}
												>
													{activity.icon}
												</div>
												<div className="achievement-info">
													<h4>{activity.title}</h4>
													<p>{activity.score}</p>
												</div>
											</div>
										))}
									</div>
									<button
										style={{
											width: "100%",
											marginTop: "1.5rem",
											padding: "0.75rem",
											background: "transparent",
											color: "#718096",
											border: "1px solid #e2e8f0",
											borderRadius: "12px",
											fontWeight: 600,
											cursor: "pointer",
										}}
									>
										Voir tout l'historique
									</button>
								</>
							) : (
								<p style={{ color: "#718096", textAlign: "center" }}>
									Aucune activité récente.
								</p>
							)}
						</section>
					</div>
				</div>
			</ScreenLayout>
		</>
	);
};

export default Dashboard;
