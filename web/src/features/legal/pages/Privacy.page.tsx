import React from "react";
import { Link } from "react-router-dom";
import LegalLayout from "@features/legal/components/LegalLayout.component";
import type { LegalSection } from "@features/legal/components/LegalLayout.component";
import Fill from "@features/legal/components/Fill.component";
import { LEGAL_INFO } from "@features/legal/data/legal.info";

const { publisher, hosting, contactEmail, ai, ocrProvider, retention } = LEGAL_INFO;

const Mail: React.FC = () => <a href={`mailto:${contactEmail}`}>{contactEmail}</a>;

const SECTIONS: LegalSection[] = [
	{
		id: "responsable",
		title: "Qui est responsable de tes données",
		content: (
			<>
				<p>
					Les responsables du traitement de tes données sont les étudiants qui conçoivent Milo, dans le cadre de
					leur projet de fin d'études à {publisher.school} (voir les <Link to="/mentions">mentions légales</Link>
					). Milo est un projet non commercial, sans entreprise derrière.
				</p>
				<p>
					Pour toute question sur tes données, écris à <Mail />. C'est aussi l'adresse à utiliser pour exercer tes
					droits (section « Tes droits »).
				</p>
			</>
		),
	},
	{
		id: "mineurs",
		title: "Élèves de moins de 15 ans",
		content: (
			<>
				<p>
					Milo s'adresse surtout à des collégiens, de la 6<sup>e</sup> à la 3<sup>e</sup>. En France, un
					enfant peut accepter seul l'utilisation de ses données par un service en ligne à partir de 15 ans. En
					dessous, <strong>l'accord d'un parent</strong> (ou de la personne qui exerce l'autorité parentale) est
					nécessaire : c'est pourquoi le compte d'un élève de moins de 15 ans doit être créé avec un adulte.
				</p>
				<p>
					Un parent peut à tout moment nous demander de consulter, corriger ou supprimer les données de son
					enfant, en écrivant à <Mail /> depuis l'adresse liée au compte.
				</p>
			</>
		),
	},
	{
		id: "donnees",
		title: "Les données que nous utilisons",
		content: (
			<>
				<p>Nous ne collectons que ce qui sert à faire fonctionner Milo :</p>
				<div className="lg-table-wrap">
					<table className="lg-table">
						<thead>
							<tr>
								<th scope="col">Catégorie</th>
								<th scope="col">Exemples</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Compte</td>
								<td>Prénom, nom, pseudo, adresse email, mot de passe, rôle (élève ou parent)</td>
							</tr>
							<tr>
								<td>Profil scolaire</td>
								<td>Classe, centres d'intérêt</td>
							</tr>
							<tr>
								<td>Apprentissage</td>
								<td>
									Leçons lues, QCM et exercices (scores, temps passé), missions, série de jours, XP, miloros,
									cosmétiques
								</td>
							</tr>
							<tr>
								<td>Échanges avec Milo</td>
								<td>
									Questions posées au tuteur, photos de cours ou de bulletins que tu importes (traitées puis
									non conservées)
								</td>
							</tr>
							<tr>
								<td>Social</td>
								<td>Liste d'amis, duels joués et leurs résultats, statut en ligne visible par tes amis</td>
							</tr>
							<tr>
								<td>Sécurité</td>
								<td>
									Sessions ouvertes (appareil, navigateur, adresse IP, dates), appareils de confiance, réglages de
									double authentification
								</td>
							</tr>
							<tr>
								<td>Contact</td>
								<td>Nom, email et message envoyés via le formulaire de contact</td>
							</tr>
						</tbody>
					</table>
				</div>
				<p>
					Nous ne demandons jamais de données sensibles (santé, religion, opinions…). Évite d'en écrire dans tes
					messages à Milo ou dans les documents que tu importes.
				</p>
			</>
		),
	},
	{
		id: "finalites",
		title: "Pourquoi nous les utilisons",
		content: (
			<>
				<p>Chaque utilisation repose sur une base prévue par le RGPD :</p>
				<div className="lg-table-wrap">
					<table className="lg-table">
						<thead>
							<tr>
								<th scope="col">Ce que nous faisons</th>
								<th scope="col">Base légale</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Créer ton compte, te connecter, te proposer cours, QCM, missions et duels</td>
								<td>Exécution des conditions d'utilisation</td>
							</tr>
							<tr>
								<td>Adapter les explications et exercices à ton niveau et à tes centres d'intérêt</td>
								<td>Exécution des conditions d'utilisation</td>
							</tr>
							<tr>
								<td>Afficher tes statistiques, et celles de ton enfant dans l'espace parent</td>
								<td>Exécution des conditions d'utilisation</td>
							</tr>
							<tr>
								<td>
									Protéger les comptes (double authentification, sessions), prévenir les abus, modérer les
									échanges avec l'IA et repérer les situations de détresse
								</td>
								<td>Intérêt légitime : la sécurité des élèves</td>
							</tr>
							<tr>
								<td>Mesurer l'usage de Milo pour l'améliorer (statistiques internes, sans outil tiers)</td>
								<td>Intérêt légitime</td>
							</tr>
							<tr>
								<td>Gérer les abonnements et la facturation, si Milo devient payant</td>
								<td>Exécution des conditions de vente et obligations légales</td>
							</tr>
							<tr>
								<td>Répondre à tes messages</td>
								<td>Intérêt légitime</td>
							</tr>
						</tbody>
					</table>
				</div>
			</>
		),
	},
	{
		id: "jamais",
		title: "Ce que nous ne faisons jamais",
		content: (
			<ul>
				<li>Afficher de la publicité dans Milo.</li>
				<li>Vendre ou louer tes données, à qui que ce soit.</li>
				<li>Utiliser tes données pour du profilage commercial.</li>
				<li>Permettre un chat libre entre élèves : les duels se jouent sans messagerie.</li>
				<li>Partager ton nom de famille ou ton email avec les autres élèves : ils ne voient que ton pseudo.</li>
			</ul>
		),
	},
	{
		id: "destinataires",
		title: "Qui peut y accéder",
		content: (
			<>
				<p>
					Seuls les membres de l'équipe Milo qui en ont besoin (support, modération, technique) accèdent à tes
					données. Un parent voit la progression de ses enfants. Tes amis voient ton pseudo, ton avatar et tes
					résultats de duel.
				</p>
				<p>Nous faisons aussi appel à des prestataires, qui n'utilisent tes données que pour nous :</p>
				<ul>
					<li>
						<strong>Hébergement des données et envoi des emails</strong> : {hosting.api.name}, serveurs à{" "}
						{hosting.api.datacenter} ;
					</li>
					<li>
						<strong>Hébergement de l'application web</strong> : {hosting.web.name} (États-Unis), qui reçoit
						l'adresse IP des visiteurs pour leur servir les pages ;
					</li>
					<li>
						<strong>Intelligence artificielle</strong> : {ai.provider} (États-Unis), qui reçoit les questions
						posées au tuteur et le contexte de la leçon, et vérifie les messages et les photos avec son modèle de
						modération (voir la <Link to="/charte">charte de l'IA</Link>) ;
					</li>
					<li>
						<strong>Lecture des photos de cours</strong> : {ocrProvider} (Google), qui extrait le texte des
						photos que tu importes ;
					</li>
					<li>
						<strong>Polices de caractères</strong> : Google Fonts, qui reçoit l'adresse IP du navigateur au
						chargement des pages ;
					</li>
					<li>
						<strong>Formulaire de contact</strong> : Web3Forms, qui nous transmet ton message par email.
					</li>
				</ul>
				<p>
					Quand un prestataire est situé hors de l'Union européenne, le transfert est encadré par les garanties
					prévues par le RGPD (décision d'adéquation ou clauses contractuelles types de la Commission
					européenne).
				</p>
			</>
		),
	},
	{
		id: "conservation",
		title: "Combien de temps nous les gardons",
		content: (
			<div className="lg-table-wrap">
				<table className="lg-table">
					<thead>
						<tr>
							<th scope="col">Données</th>
							<th scope="col">Durée</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Compte et profil</td>
							<td>{retention.account}</td>
						</tr>
						<tr>
							<td>Progression et statistiques</td>
							<td>{retention.activity}</td>
						</tr>
						<tr>
							<td>Échanges avec Milo et photos importées</td>
							<td>{retention.aiExchanges}</td>
						</tr>
						<tr>
							<td>Signalements de modération</td>
							<td>{retention.moderation}</td>
						</tr>
						<tr>
							<td>Sécurité (sessions, appareils, codes)</td>
							<td>{retention.securityLogs}</td>
						</tr>
						<tr>
							<td>Messages du formulaire de contact</td>
							<td>
								<Fill value={retention.contact} label="durée de conservation" />
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		),
	},
	{
		id: "securite",
		title: "Comment nous les protégeons",
		content: (
			<ul>
				<li>Toutes les connexions au site et à l'API sont chiffrées (HTTPS).</li>
				<li>
					La session est gardée dans un cookie protégé, inaccessible aux scripts de la page, et le jeton de
					connexion ne vit qu'en mémoire.
				</li>
				<li>
					Tu peux activer la double authentification, voir tes sessions ouvertes et les déconnecter à tout
					moment depuis ton profil (onglet Sécurité).
				</li>
				<li>Les accès de l'équipe sont limités à ce dont chacun a besoin.</li>
			</ul>
		),
	},
	{
		id: "droits",
		title: "Tes droits",
		content: (
			<>
				<p>Tu peux à tout moment :</p>
				<ul>
					<li>
						<strong>consulter</strong> les données que nous avons sur toi, et en recevoir une copie ;
					</li>
					<li>
						<strong>les corriger</strong> (tu peux déjà modifier ton profil toi-même) ;
					</li>
					<li>
						<strong>les faire supprimer</strong>, avec ton compte ;
					</li>
					<li>
						<strong>t'opposer</strong> à une utilisation ou demander qu'elle soit <strong>limitée</strong> ;
					</li>
					<li>
						<strong>les récupérer</strong> dans un format lisible pour les utiliser ailleurs ;
					</li>
					<li>
						définir ce que deviendront tes données <strong>après ton décès</strong>.
					</li>
				</ul>
				<p>
					Écris à <Mail /> depuis l'adresse de ton compte (ou celle d'un parent pour un élève de moins de 15
					ans). Nous répondons dans un délai d'un mois.
				</p>
				<p className="lg-note">
					Si tu penses que tes droits ne sont pas respectés, tu peux te plaindre auprès de la CNIL, l'autorité
					qui protège les données personnelles en France :{" "}
					<a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">
						cnil.fr/plaintes
					</a>
					.
				</p>
			</>
		),
	},
	{
		id: "cookies",
		title: "Cookies",
		content: (
			<p>
				Milo n'utilise ni cookie publicitaire ni outil de mesure d'audience. Le détail de ce qui est gardé dans
				ton navigateur est expliqué dans la page <Link to="/cookies">Cookies et stockage local</Link>.
			</p>
		),
	},
	{
		id: "modifications",
		title: "Modifications",
		content: (
			<p>
				Si cette politique change, nous mettons à jour la date et la version en haut de la page. En cas de
				changement important, nous te prévenons dans l'application ou par email.
			</p>
		),
	},
];

const PrivacyPage: React.FC = () => (
	<LegalLayout
		slug="confidentialite"
		floats={["shield", "sparkles"]}
		title={
			<>
				Politique de <span className="lp-hl">confidentialité</span>
			</>
		}
		lead="Quelles données Milo utilise, pourquoi, et comment tu gardes la main dessus."
		summary={[
			"Nous ne collectons que ce qui sert à apprendre avec Milo.",
			"Pas de publicité, et tes données ne sont jamais vendues.",
			"Tes données sont stockées en France, chez OVHcloud. Tes messages à Milo ne sont pas conservés.",
			"Moins de 15 ans : ton compte se crée avec l'accord d'un parent.",
			<>
				Tu peux tout consulter, corriger ou supprimer en écrivant à <Mail />.
			</>,
		]}
		sections={SECTIONS}
	/>
);

export default PrivacyPage;
