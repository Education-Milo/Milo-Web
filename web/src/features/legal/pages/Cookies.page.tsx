import React from "react";
import { Link } from "react-router-dom";
import LegalLayout from "@features/legal/components/LegalLayout.component";
import type { LegalSection } from "@features/legal/components/LegalLayout.component";

/// Liste tenue à jour à la main : chaque clé ajoutée dans le code
/// (cookie, localStorage, sessionStorage) doit figurer ici.
const STORAGE_ROWS: { name: string; kind: string; purpose: string; duration: string }[] = [
	{
		name: "milo_refresh",
		kind: "Cookie protégé (httpOnly), posé par l'API",
		purpose: "Te garder connecté de façon sécurisée",
		duration: "14 jours, prolongés à chaque utilisation ; effacé à la déconnexion",
	},
	{
		name: "milo_device",
		kind: "Cookie protégé (httpOnly), posé par l'API",
		purpose: "Reconnaître un appareil de confiance pour ne pas redemander le code de double authentification",
		duration: "30 jours",
	},
	{
		name: "auth-storage",
		kind: "Stockage local",
		purpose: "État technique de la connexion",
		duration: "Vidé à la déconnexion",
	},
	{
		name: "milo_session",
		kind: "Stockage local",
		purpose: "Savoir qu'une session existe, sans aucun secret, pour éviter une vérification inutile",
		duration: "Jusqu'à la déconnexion",
	},
	{
		name: "milo-wheel-slots:<compte>",
		kind: "Stockage local",
		purpose: "Mémoriser ta roue de cosmétiques dans Mon Milo",
		duration: "Jusqu'à ce que tu vides les données du site",
	},
	{
		name: "milo.beta-feedback.draft.v1",
		kind: "Stockage local",
		purpose: "Garder le brouillon d'un retour bêta en cours de rédaction",
		duration: "Jusqu'à l'envoi du retour",
	},
	{
		name: "milo_demo_session",
		kind: "Stockage de session (onglet)",
		purpose: "Mode démonstration réservé à l'équipe Milo",
		duration: "Jusqu'à la fermeture de l'onglet",
	},
];

const SECTIONS: LegalSection[] = [
	{
		id: "definition",
		title: "Cookies et stockage local, c'est quoi ?",
		content: (
			<p>
				Un <strong>cookie</strong> est un petit fichier qu'un site dépose dans ton navigateur. Le{" "}
				<strong>stockage local</strong> fonctionne de la même façon, mais reste dans ton navigateur sans être
				envoyé au serveur. Milo utilise les deux, uniquement pour fonctionner : te garder connecté, sécuriser ton
				compte et retenir quelques préférences.
			</p>
		),
	},
	{
		id: "liste",
		title: "Ce que Milo enregistre",
		content: (
			<>
				<div className="lg-table-wrap">
					<table className="lg-table">
						<thead>
							<tr>
								<th scope="col">Nom</th>
								<th scope="col">Type</th>
								<th scope="col">À quoi ça sert</th>
								<th scope="col">Durée</th>
							</tr>
						</thead>
						<tbody>
							{STORAGE_ROWS.map((row) => (
								<tr key={row.name}>
									<td>
										<code>{row.name}</code>
									</td>
									<td>{row.kind}</td>
									<td>{row.purpose}</td>
									<td>{row.duration}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<p>
					Tous sont <strong>strictement nécessaires</strong> au service : la loi les dispense de consentement,
					c'est pourquoi Milo n'affiche pas de bandeau cookies.
				</p>
			</>
		),
	},
	{
		id: "jamais",
		title: "Ce que Milo n'utilise pas",
		content: (
			<ul>
				<li>Aucun cookie publicitaire.</li>
				<li>Aucun outil de mesure d'audience tiers : les statistiques d'usage restent sur nos serveurs.</li>
				<li>Aucun bouton de réseau social qui te suivrait d'un site à l'autre.</li>
			</ul>
		),
	},
	{
		id: "tiers",
		title: "Services tiers",
		content: (
			<p>
				Les polices de caractères de Milo sont chargées depuis Google Fonts. Ce service ne dépose pas de cookie,
				mais reçoit l'adresse IP de ton navigateur au chargement des pages. Le détail des prestataires est dans
				la <Link to="/confidentialite#destinataires">politique de confidentialité</Link>.
			</p>
		),
	},
	{
		id: "gerer",
		title: "Les supprimer",
		content: (
			<>
				<p>
					Te déconnecter efface déjà ta session. Tu peux aussi supprimer à tout moment les cookies et le
					stockage local de Milo depuis les réglages de ton navigateur (rubrique « Confidentialité » ou « Données
					des sites »).
				</p>
				<p className="lg-note">Si tu les bloques complètement, tu ne pourras plus rester connecté à Milo.</p>
			</>
		),
	},
];

const CookiesPage: React.FC = () => (
	<LegalLayout
		slug="cookies"
		floats={["locked", "sparkles"]}
		title={
			<>
				Cookies et <span className="lp-hl">stockage local</span>
			</>
		}
		lead="Ce que Milo garde dans ton navigateur, et pourquoi il n'y a pas de bandeau cookies."
		summary={[
			"Milo n'utilise que des cookies indispensables : connexion et sécurité.",
			"Aucun cookie publicitaire, aucun traceur de mesure d'audience.",
			"Te déconnecter efface ta session ; ton navigateur peut tout supprimer.",
		]}
		sections={SECTIONS}
	/>
);

export default CookiesPage;
