import React from "react";
import { Check, CreditCard, Info, Mail } from "lucide-react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { CONTACT_EMAIL, PLANS } from "@features/landing/data/landing.data";
import ParentPageHeader from "@features/parent/components/ParentPageHeader";
import "@features/parent/styles/Parent.css";

/**
 * L'API n'expose ni abonnement, ni moyen de paiement, ni factures : la page
 * présente les formules (mêmes données que la landing) et renvoie vers le
 * contact, sans afficher d'information de facturation inventée.
 */
const SubscriptionPage: React.FC = () => (
	<ScreenLayout>
		<div className="pa-page">
			<ParentPageHeader
				eyebrow="Espace parent"
				title="Abonnement"
				lead="Votre formule Milo, vos paiements et vos factures."
			/>

			<section className="pa-card" aria-labelledby="pa-plan-title">
				<div className="pa-card-head">
					<h2 id="pa-plan-title" className="pa-card-title">
						<CreditCard size={20} aria-hidden="true" />
						Votre formule
					</h2>
				</div>
				<p className="pa-field-note pa-field-note--block">
					<Info size={18} aria-hidden="true" />
					<span>
						La gestion de l'abonnement en ligne arrive bientôt : le changement de formule, le moyen de paiement
						et l'historique des factures ne sont pas encore accessibles depuis votre espace.
					</span>
				</p>
				<p className="pa-text">
					Pour toute question sur votre formule ou une facture, notre équipe vous répond par e-mail.
				</p>
				<a className="pa-btn pa-btn--ghost" href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Abonnement Milo")}`}>
					<Mail size={18} aria-hidden="true" />
					Contacter l'équipe Milo
				</a>
			</section>

			<section aria-labelledby="pa-plans-title" className="pa-plans-section">
				<h2 id="pa-plans-title" className="pa-section-title">
					Les formules Milo
				</h2>
				<ul className="pa-plans">
					{PLANS.map((plan) => (
						<li key={plan.name} className={`pa-plan${plan.featured ? " pa-plan--featured" : ""}`}>
							<div className="pa-plan-head">
								<h3 className="pa-plan-name">{plan.name}</h3>
								{plan.featured && <span className="pa-tag">Pour les familles</span>}
							</div>
							<p className="pa-plan-price">
								<strong>{plan.price} €</strong> par mois
							</p>
							<ul className="pa-plan-features">
								{plan.features.map((feature) => (
									<li key={feature}>
										<Check size={16} aria-hidden="true" />
										<span>{feature}</span>
									</li>
								))}
							</ul>
						</li>
					))}
				</ul>
			</section>
		</div>
	</ScreenLayout>
);

export default SubscriptionPage;
