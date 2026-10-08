import React from "react";
import { Link } from "react-router-dom";
import LegalLayout from "@features/legal/components/LegalLayout.component";
import type { LegalSection } from "@features/legal/components/LegalLayout.component";
import { LEGAL_INFO } from "@features/legal/data/legal.info";
import { PLANS } from "@features/landing/data/landing.data";

const { publisher, contactEmail } = LEGAL_INFO;

const Mail: React.FC = () => <a href={`mailto:${contactEmail}`}>{contactEmail}</a>;

const SECTIONS: LegalSection[] = [
	{
		id: "statut",
		title: "Où en sont les abonnements",
		content: (
			<>
				<p className="lg-note lg-note--green">
					<strong>Aujourd'hui, aucun abonnement n'est vendu et aucun paiement n'est demandé.</strong> Milo est un
					projet étudiant de fin d'études à {publisher.school}, sans entreprise derrière : il ne peut pas être
					commercialisé en l'état.
				</p>
				<p>
					Les formules présentées sur le site et ci-dessous décrivent le modèle envisagé si Milo devient un
					service payant. Ces conditions seraient alors complétées (identité du vendeur, prestataire de paiement,
					médiateur de la consommation), et tu en serais informé avant toute souscription.
				</p>
			</>
		),
	},
	{
		id: "champ",
		title: "Champ d'application",
		content: (
			<p>
				Ces conditions générales de vente (CGV) s'appliqueront aux abonnements Milo souscrits par un adulte,
				depuis l'espace parent. Elles complètent les <Link to="/cgu">conditions générales d'utilisation</Link>.
				Souscrire un abonnement vaudra acceptation de ces CGV.
			</p>
		),
	},
	{
		id: "offres",
		title: "Les formules envisagées",
		content: (
			<>
				<div className="lg-table-wrap">
					<table className="lg-table">
						<thead>
							<tr>
								<th scope="col">Formule</th>
								<th scope="col">Prix</th>
								<th scope="col">Ce qui est inclus</th>
							</tr>
						</thead>
						<tbody>
							{PLANS.map((plan) => (
								<tr key={plan.name}>
									<td>
										<strong>{plan.name}</strong>
									</td>
									<td>{plan.price} € par mois</td>
									<td>{plan.features.join(" · ")}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<p>
					Ces prix sont indicatifs, en euros toutes taxes comprises. Le prix applicable sera celui affiché au
					moment de la souscription. Toute évolution de prix sera annoncée avant de s'appliquer, et tu pourras
					résilier si elle ne te convient pas.
				</p>
			</>
		),
	},
	{
		id: "essai",
		title: "Essai gratuit",
		content: (
			<p>
				Chaque nouvelle famille peut essayer gratuitement toutes les fonctionnalités de Milo pendant{" "}
				<strong>7 jours</strong>. Les conditions de passage à l'abonnement payant sont rappelées avant toute
				souscription : aucun paiement n'est demandé sans ton accord.
			</p>
		),
	},
	{
		id: "paiement",
		title: "Commande et paiement",
		content: (
			<>
				<p>
					L'abonnement sera payé chaque mois, au début de la période. Le paiement sera confié à un prestataire
					spécialisé, nommé ici à l'ouverture des abonnements : Milo ne verra ni ne conservera tes coordonnées
					bancaires.
				</p>
				<p>
					Tes factures seront disponibles dans l'espace parent. En cas d'échec de paiement, l'accès aux fonctions
					payantes pourra être suspendu jusqu'à régularisation.
				</p>
			</>
		),
	},
	{
		id: "resiliation",
		title: "Durée et résiliation",
		content: (
			<>
				<p>
					L'abonnement est <strong>sans engagement</strong> : il se renouvelle chaque mois et tu peux le résilier
					à tout moment depuis l'espace parent, ou en écrivant à <Mail />.
				</p>
				<p>
					La résiliation prend effet à la fin du mois déjà payé : tu gardes l'accès jusque-là, et aucun nouveau
					paiement n'est prélevé.
				</p>
				<p className="lg-note">
					L'abonnement ne peut pas être mis en pause pendant les vacances : quelques minutes de révision par
					jour aident justement à ne rien oublier. Tu restes libre de le résilier et de te réabonner plus tard.
				</p>
			</>
		),
	},
	{
		id: "retractation",
		title: "Droit de rétractation",
		content: (
			<>
				<p>
					Tu disposes de <strong>14 jours</strong> à compter de la souscription pour te rétracter, sans avoir à te
					justifier (article L221-18 du Code de la consommation). Il suffit de nous l'écrire à <Mail />.
				</p>
				<p>
					Si tu as demandé à utiliser Milo pendant ce délai, la somme correspondant à la période déjà utilisée
					reste due (article L221-25). Le reste t'est remboursé dans les 14 jours, avec le moyen de paiement
					utilisé pour la souscription.
				</p>
			</>
		),
	},
	{
		id: "garanties",
		title: "Garanties",
		content: (
			<p>
				Milo bénéficie de la garantie légale de conformité des contenus et services numériques (articles L224-25-12
				et suivants du Code de la consommation). Si un problème t'empêche d'utiliser le service comme prévu,
				écris à <Mail /> pour que nous le corrigions.
			</p>
		),
	},
	{
		id: "mediation",
		title: "Réclamations et médiation",
		content: (
			<>
				<p>Pour toute réclamation, contacte d'abord le service client à <Mail />.</p>
				<p>
					Si le désaccord persiste, tu pourras recourir gratuitement à un médiateur de la consommation, dont les
					coordonnées seront indiquées ici à l'ouverture des abonnements.
				</p>
			</>
		),
	},
	{
		id: "droit",
		title: "Droit applicable",
		content: (
			<p>
				Ces CGV sont soumises au droit français. À défaut d'accord amiable ou de médiation, le litige peut être
				porté devant le tribunal compétent selon les règles du Code de la consommation.
			</p>
		),
	},
];

const SalesPage: React.FC = () => (
	<LegalLayout
		slug="cgv"
		floats={["coin", "gem_stone"]}
		title={
			<>
				Conditions générales <span className="lp-hl">de vente</span>
			</>
		}
		lead="Tout sur les abonnements Milo : formules, essai gratuit, paiement et résiliation."
		summary={[
			"Aujourd'hui, Milo est un projet étudiant : aucun abonnement n'est vendu, rien n'est payant.",
			"Si Milo devient payant, les abonnements seront souscrits par un parent.",
			"7 jours d'essai gratuit pour découvrir toutes les fonctionnalités.",
			"Sans engagement : résiliable à tout moment, effet à la fin du mois payé.",
			"14 jours pour changer d'avis après la souscription.",
		]}
		sections={SECTIONS}
	/>
);

export default SalesPage;
