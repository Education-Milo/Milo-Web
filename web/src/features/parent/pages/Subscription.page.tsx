import React from "react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import "@features/parent/styles/temp.css";

const SubscriptionPage: React.FC = () => {
	const currentPlan = {
		name: "Family Pack",
		type: "Mensuel",
		price: "34,90€",
		nextBilling: "15 Mars 2026",
		card: "**** **** **** 4242",
		status: "Actif",
		includes: ["1 compte parent", "Jusqu'à 4 comptes enfant"],
	};

	return (
		<>
			<ScreenLayout>
				<div className="dashboard" style={{ gridTemplateColumns: "1fr" }}>
					<section
						className="welcome-section"
						style={{ background: "linear-gradient(135deg, var(--ok), var(--ok))" }}
					>
						<div className="welcome-content">
							<h1 className="welcome-title">Gestion de l'abonnement</h1>
							<p className="welcome-subtitle">
								Gérez vos factures, votre méthode de paiement et votre forfait
								Milo.
							</p>
						</div>
					</section>
					<div className="subscription-columns">
						<section className="section-card">
							<div className="section-header">
								<h2 className="section-title">📦 Forfait Actuel</h2>
								<div
									className="progress-indicator"
									style={{
										background: "rgba(35, 135, 75, 0.1)",
										color: "var(--ok)",
									}}
								>
									{currentPlan.status}
								</div>
							</div>
							<div
								style={{
									display: "flex",
									flexWrap: "wrap",
									justifyContent: "space-between",
									alignItems: "center",
									gap: "1rem",
									marginBottom: "2rem",
									paddingBottom: "2rem",
									borderBottom: "1px solid var(--line)",
								}}
							>
								<div>
									<h3
										style={{
											fontSize: "1.8rem",
											color: "var(--milo-encre)",
											marginBottom: "0.5rem",
										}}
									>
										{currentPlan.name}{" "}
										<span
											style={{
												fontSize: "1rem",
												color: "var(--text-2)",
												fontWeight: "normal",
											}}
										>
											({currentPlan.type})
										</span>
									</h3>
									<p style={{ color: "var(--text-2)", fontSize: "1.1rem" }}>
										{currentPlan.price} / mois
									</p>
								</div>
								<button
									className="quick-action-btn"
									style={{
										background: "var(--milo-orange)",
										color: "white",
										border: "none",
									}}
								>
									Modifier le forfait
								</button>
							</div>

							<div>
								<h4 style={{ color: "var(--text-2)", marginBottom: "1rem" }}>
									Ce forfait comprend :
								</h4>
								<ul
									style={{
										color: "var(--text-2)",
										paddingLeft: "1.5rem",
										lineHeight: "1.8",
									}}
								>
									{currentPlan.includes.map((item, index) => (
										<li key={index}>{item}</li>
									))}
									<li>Accès complet aux modules interactifs de Milo</li>
									<li>Suivi et statistiques illimités</li>
								</ul>
							</div>
						</section>

						{/* Paiement et Facturation */}
						<div
							style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
						>
							<section className="section-card">
								<div className="section-header">
									<h2 className="section-title">💳 Paiement</h2>
								</div>
								<div
									style={{
										background: "var(--milo-creme)",
										padding: "1.5rem",
										borderRadius: "12px",
										border: "1px solid var(--line)",
										display: "flex",
										alignItems: "center",
										gap: "1rem",
									}}
								>
									<div style={{ fontSize: "2rem" }}>💳</div>
									<div>
										<p style={{ fontWeight: "bold", color: "var(--milo-encre)" }}>
											Visa se terminant par 4242
										</p>
										<p style={{ color: "var(--text-2)", fontSize: "0.9rem" }}>
											Expiration : 12/28
										</p>
									</div>
								</div>
								<button
									style={{
										width: "100%",
										marginTop: "1rem",
										padding: "0.75rem",
										background: "transparent",
										color: "var(--accent-text)",
										border: "2px solid rgba(255, 84, 29, 0.2)",
										borderRadius: "12px",
										fontWeight: "bold",
										cursor: "pointer",
									}}
								>
									Mettre à jour la carte
								</button>
							</section>

							<section className="section-card">
								<div className="section-header">
									<h2 className="section-title">🧾 Facturation</h2>
								</div>
								<div style={{ marginBottom: "1rem" }}>
									<p style={{ color: "var(--text-2)", fontSize: "0.9rem" }}>
										Prochain prélèvement :
									</p>
									<p
										style={{
											fontWeight: "bold",
											color: "var(--milo-encre)",
											fontSize: "1.2rem",
										}}
									>
										{currentPlan.nextBilling}
									</p>
								</div>
								<button
									style={{
										width: "100%",
										padding: "0.75rem",
										background: "rgba(241, 223, 203, 0.5)",
										color: "var(--text-2)",
										border: "none",
										borderRadius: "12px",
										fontWeight: "bold",
										cursor: "pointer",
									}}
								>
									Voir l'historique des factures
								</button>
							</section>
						</div>
					</div>
				</div>
			</ScreenLayout>
		</>
	);
};

export default SubscriptionPage;
