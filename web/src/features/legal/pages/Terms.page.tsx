import React from "react";
import { Link } from "react-router-dom";
import LegalLayout from "@features/legal/components/LegalLayout.component";
import type { LegalSection } from "@features/legal/components/LegalLayout.component";
import { LEGAL_INFO } from "@features/legal/data/legal.info";
import { AI_LIMITS } from "@shared/lib/aiRequests";

const { publisher, contactEmail } = LEGAL_INFO;

const Mail: React.FC = () => <a href={`mailto:${contactEmail}`}>{contactEmail}</a>;

const SECTIONS: LegalSection[] = [
	{
		id: "objet",
		title: "Objet",
		content: (
			<>
				<p>
					Ces conditions générales d'utilisation (CGU) fixent les règles pour utiliser Milo, la plateforme
					d'apprentissage conçue par {publisher.name}, un projet étudiant de fin d'études à {publisher.school}.
					En créant un compte ou en utilisant Milo, tu les acceptes.
				</p>
				<p>
					Les abonnements payants sont régis en plus par les <Link to="/cgv">conditions générales de vente</Link>,
					et l'utilisation de tes données par la <Link to="/confidentialite">politique de confidentialité</Link>.
				</p>
			</>
		),
	},
	{
		id: "service",
		title: "Ce que propose Milo",
		content: (
			<>
				<p>Milo accompagne les collégiens dans leurs révisions :</p>
				<ul>
					<li>un tuteur, Milo, qui explique les leçons et aide à résoudre les exercices sans donner les réponses ;</li>
					<li>des QCM, exercices, flashcards et missions adaptés au niveau de l'élève ;</li>
					<li>l'import de cours et de bulletins en photo ;</li>
					<li>des duels entre amis, des ligues et une mascotte à personnaliser ;</li>
					<li>un espace parent pour suivre la progression.</li>
				</ul>
				<p>
					Milo nécessite une connexion internet. Nous faisons de notre mieux pour qu'il soit disponible en
					permanence, mais il peut être interrompu pour maintenance ou en cas de panne.
				</p>
			</>
		),
	},
	{
		id: "compte",
		title: "Ton compte",
		content: (
			<ul>
				<li>
					Il existe deux types de comptes : <strong>élève</strong> et <strong>parent</strong>.
				</li>
				<li>
					Un élève de moins de 15 ans crée son compte <strong>avec l'accord d'un parent</strong> (voir la{" "}
					<Link to="/confidentialite#mineurs">politique de confidentialité</Link>).
				</li>
				<li>
					Les informations données à l'inscription doivent être exactes. Un compte est personnel : une personne,
					un compte.
				</li>
				<li>
					Ton pseudo est visible par les autres élèves : il doit rester respectueux et ne pas révéler ton nom
					complet ni d'informations personnelles.
				</li>
				<li>
					Garde ton mot de passe secret. Nous te conseillons d'activer la double authentification dans ton
					profil. Si tu penses que quelqu'un utilise ton compte, déconnecte toutes tes sessions et préviens-nous.
				</li>
			</ul>
		),
	},
	{
		id: "ia",
		title: "Utiliser le tuteur IA",
		content: (
			<>
				<p>
					Milo répond grâce à une intelligence artificielle, encadrée par la <Link to="/charte">charte de l'IA</Link>.
					En l'utilisant, tu t'engages à :
				</p>
				<ul>
					<li>poser des questions en lien avec tes cours et tes devoirs ;</li>
					<li>ne pas chercher à contourner ses règles ni à lui faire dire des choses inappropriées ;</li>
					<li>garder un esprit critique : l'IA peut se tromper, vérifie avec ton cours ou ton professeur.</li>
				</ul>
				<p>
					Pour que tout le monde en profite, l'usage est limité : un message compte au plus{" "}
					{AI_LIMITS.CHAT_REQUEST.toLocaleString("fr-FR")} caractères, et le nombre de demandes par jour est
					plafonné.
				</p>
			</>
		),
	},
	{
		id: "conduite",
		title: "Règles de conduite",
		content: (
			<>
				<p>Sur Milo, il est interdit :</p>
				<ul>
					<li>de harceler, insulter, menacer ou se moquer d'un autre élève ;</li>
					<li>de publier ou d'importer un contenu violent, haineux, sexuel ou illégal ;</li>
					<li>de partager les informations personnelles de quelqu'un d'autre ;</li>
					<li>de tricher en duel ou d'utiliser plusieurs comptes ;</li>
					<li>d'utiliser des robots, de copier massivement les contenus ou de perturber le service ;</li>
					<li>de te faire passer pour quelqu'un d'autre, notamment pour l'équipe Milo.</li>
				</ul>
				<p>
					Tu vois un comportement qui ne respecte pas ces règles ? Signale-le à <Mail />.
				</p>
			</>
		),
	},
	{
		id: "contenus",
		title: "Les contenus que tu importes",
		content: (
			<p>
				Les cours, photos et bulletins que tu importes restent à toi (ou à leur auteur). Tu nous autorises
				seulement à les traiter pour te proposer des explications, quiz et fiches de révision personnalisés. Ils
				ne sont jamais montrés aux autres élèves. N'importe que des documents que tu as le droit d'utiliser, et
				qui ne contiennent pas d'informations personnelles sur d'autres personnes.
			</p>
		),
	},
	{
		id: "monnaie",
		title: "Miloros, XP et cosmétiques",
		content: (
			<p>
				Les miloros, les points d'expérience (XP), les ligues et les cosmétiques sont des éléments de jeu. Ils
				n'ont aucune valeur en argent : ils ne peuvent être ni vendus, ni échangés contre de l'argent, ni
				remboursés. Nous pouvons faire évoluer leur fonctionnement pour garder le jeu équilibré.
			</p>
		),
	},
	{
		id: "propriete",
		title: "Propriété intellectuelle",
		content: (
			<p>
				Milo, sa mascotte, ses textes, exercices, visuels et son code appartiennent à l'équipe Milo ou à leurs
				auteurs. Tu peux les utiliser pour apprendre, dans le cadre de ton compte, mais pas les copier, les
				revendre ni les diffuser ailleurs.
			</p>
		),
	},
	{
		id: "sanctions",
		title: "Suspension et suppression du compte",
		content: (
			<>
				<p>
					Si les règles ne sont pas respectées, nous pouvons retirer un contenu, limiter certaines fonctions ou
					suspendre le compte, après avoir prévenu l'utilisateur (ou son parent) sauf en cas d'urgence.
				</p>
				<p>
					Tu peux demander la suppression de ton compte à tout moment en écrivant à <Mail />. Pour un compte
					payant, pense d'abord à résilier l'abonnement (voir les <Link to="/cgv#resiliation">CGV</Link>).
				</p>
			</>
		),
	},
	{
		id: "responsabilite",
		title: "Responsabilité",
		content: (
			<p>
				Milo est un outil d'aide aux révisions : il ne remplace ni les enseignants ni le travail en classe.
				L'équipe Milo n'est pas responsable des résultats scolaires, ni des dommages liés à une mauvaise utilisation
				du service ou à une interruption indépendante de sa volonté.
			</p>
		),
	},
	{
		id: "modifications",
		title: "Modifications des CGU",
		content: (
			<p>
				Nous pouvons faire évoluer ces CGU. La date et la version en haut de la page indiquent la dernière mise à
				jour ; en cas de changement important, nous te prévenons dans l'application ou par email avant son
				entrée en vigueur.
			</p>
		),
	},
	{
		id: "droit",
		title: "Droit applicable",
		content: (
			<p>
				Ces CGU sont soumises au droit français. En cas de désaccord, écris-nous d'abord à <Mail /> pour trouver
				une solution amiable ; à défaut, les tribunaux français sont compétents.
			</p>
		),
	},
];

const TermsPage: React.FC = () => (
	<LegalLayout
		slug="cgu"
		floats={["student", "crossed_swords"]}
		title={
			<>
				Conditions générales <span className="lp-hl">d'utilisation</span>
			</>
		}
		lead="Les règles du jeu pour apprendre avec Milo, en toute sécurité et dans le respect des autres."
		summary={[
			"Un compte par personne ; moins de 15 ans : avec l'accord d'un parent.",
			"Milo t'aide à comprendre, il ne fait pas tes devoirs à ta place.",
			"Respecte les autres : pas d'insulte, pas de triche, pas de contenu choquant.",
			"Les miloros et cosmétiques sont des éléments de jeu, sans valeur en argent.",
		]}
		sections={SECTIONS}
	/>
);

export default TermsPage;
