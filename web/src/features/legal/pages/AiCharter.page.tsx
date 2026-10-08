import React from "react";
import { Link } from "react-router-dom";
import LegalLayout from "@features/legal/components/LegalLayout.component";
import type { LegalSection } from "@features/legal/components/LegalLayout.component";
import { LEGAL_INFO } from "@features/legal/data/legal.info";
import { AI_LIMITS } from "@shared/lib/aiRequests";

const { contactEmail, ai } = LEGAL_INFO;

/// Numéros affichés par Milo quand il détecte une détresse (DistressNotice)
const HELPLINES = [
	{ number: "3114", label: "Prévention du suicide", detail: "Gratuit, 24 h/24" },
	{ number: "119", label: "Enfance en danger", detail: "Gratuit, 24 h/24" },
	{ number: "3018", label: "Harcèlement et violences en ligne", detail: "Gratuit et anonyme" },
];

const SECTIONS: LegalSection[] = [
	{
		id: "pourquoi",
		title: "Pourquoi une IA dans Milo",
		content: (
			<>
				<p>
					Milo, le renard qui t'accompagne, est un <strong>tuteur virtuel</strong>. Il s'appuie sur une
					intelligence artificielle pour t'expliquer une leçon, reformuler ce que tu n'as pas compris, te poser
					des questions et créer des exercices adaptés à ton niveau et à tes centres d'intérêt.
				</p>
				<p>
					Quand tu échanges avec Milo, tu parles toujours à une IA, jamais à un humain qui se ferait passer pour
					lui.
				</p>
			</>
		),
	},
	{
		id: "principes",
		title: "Nos engagements",
		content: (
			<ul>
				<li>
					<strong>Faire réfléchir, pas recopier.</strong> Milo te guide avec des indices et des questions
					intermédiaires : il ne donne pas la réponse aux exercices de ton professeur.
				</li>
				<li>
					<strong>Rester dans le cadre scolaire.</strong> Milo parle de tes cours et de ta façon d'apprendre. Les
					sujets hors de ce cadre sont refusés poliment.
				</li>
				<li>
					<strong>Être bienveillant.</strong> Il s'adresse à toi avec un ton encourageant, adapté à ton âge.
				</li>
				<li>
					<strong>Garder un humain dans la boucle.</strong> L'équipe Milo surveille les échanges signalés et
					améliore les règles en continu.
				</li>
				<li>
					<strong>Protéger tes données.</strong> Pas de publicité, pas de revente, et seulement les informations
					utiles à ta question.
				</li>
			</ul>
		),
	},
	{
		id: "fait",
		title: "Ce que Milo fait, et ne fait pas",
		content: (
			<div className="lg-dos">
				<div>
					<h3>Milo fait</h3>
					<ul>
						<li>expliquer une leçon ou un énoncé ;</li>
						<li>t'aider à avancer étape par étape ;</li>
						<li>créer des QCM et des fiches à partir de tes cours ;</li>
						<li>vérifier tes réponses aux exercices qu'il a créés.</li>
					</ul>
				</div>
				<div>
					<h3>Milo ne fait pas</h3>
					<ul>
						<li>tes devoirs à ta place ;</li>
						<li>de conversation hors du cadre scolaire ;</li>
						<li>d'envoi vers des sites extérieurs ;</li>
						<li>de diagnostic médical ou psychologique.</li>
					</ul>
				</div>
			</div>
		),
	},
	{
		id: "garde-fous",
		title: "Les garde-fous",
		content: (
			<>
				<ul>
					<li>
						Des <strong>filtres de sécurité</strong> empêchent Milo de produire des contenus inappropriés pour
						des collégiens. Un modèle de modération vérifie aussi les messages et les photos envoyés.
					</li>
					<li>
						Quand une demande pose problème, un <strong>signalement</strong> est ajouté au journal de
						modération consulté par l'équipe : seulement sa catégorie et sa date,{" "}
						<strong>jamais le contenu de ton message</strong>.
					</li>
					<li>
						L'usage est <strong>limité</strong> : {AI_LIMITS.CHAT_REQUEST.toLocaleString("fr-FR")} caractères
						maximum par message et un nombre de demandes par jour plafonné, pour éviter les abus.
					</li>
					<li>
						Milo est un <strong>environnement fermé</strong> : aucun lien vers internet, et pas de discussion
						libre entre élèves.
					</li>
				</ul>
				<p>
					Une réponse de Milo te semble bizarre ou inappropriée ? Signale-la à{" "}
					<a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
				</p>
			</>
		),
	},
	{
		id: "detresse",
		title: "Si tu ne vas pas bien",
		content: (
			<>
				<p>
					Si tu confies à Milo que tu es triste, en danger ou harcelé, il ne te laisse pas seul : il t'affiche
					des numéros où des adultes formés peuvent t'écouter, gratuitement.
				</p>
				<ul className="lg-helplines">
					{HELPLINES.map((line) => (
						<li key={line.number}>
							<a href={`tel:${line.number}`}>{line.number}</a>
							<strong>{line.label}</strong>
							<span>{line.detail}</span>
						</li>
					))}
				</ul>
				<p className="lg-note">
					En cas de danger immédiat, appelle le <a href="tel:112">112</a>. Et n'hésite jamais à en parler à un
					adulte de confiance : un parent, un professeur, l'infirmière ou le CPE de ton collège.
				</p>
			</>
		),
	},
	{
		id: "erreurs",
		title: "L'IA peut se tromper",
		content: (
			<p>
				Comme toute intelligence artificielle, Milo peut parfois se tromper ou mal comprendre ta question. Garde
				ton esprit critique : compare avec ton cours, et demande à ton professeur en cas de doute. Milo ne
				remplace ni les enseignants ni le travail en classe.
			</p>
		),
	},
	{
		id: "donnees",
		title: "Tes données et l'IA",
		content: (
			<>
				<p>
					Milo s'appuie sur les modèles d'<strong>{ai.provider}</strong> ({ai.models.join(", ")}), appelés
					depuis nos serveurs. Pour te répondre, il leur transmet ta question, le contenu de la leçon concernée
					et, pour personnaliser ses explications, tes centres d'intérêt. Ni ton nom, ni ton email, ni ton
					identifiant ne leur sont envoyés.
				</p>
				<p>
					Milo ne conserve pas tes messages : une fois la réponse affichée, seul le type d'activité (question
					posée, QCM généré…) est enregistré pour tes statistiques. Selon ses conditions, {ai.provider}{" "}
					n'utilise pas les données reçues par son API pour entraîner ses modèles.
				</p>
				<p>
					N'écris pas d'informations personnelles (adresse, numéro de téléphone, mots de passe) dans tes messages.
					Tout le détail se trouve dans la <Link to="/confidentialite">politique de confidentialité</Link>.
				</p>
			</>
		),
	},
	{
		id: "parents",
		title: "Pour les parents",
		content: (
			<ul>
				<li>L'espace parent vous permet de suivre l'activité et la progression de votre enfant.</li>
				<li>
					Parlez avec lui de son usage de Milo : ce qu'il y apprend, et l'importance de chercher par lui-même
					avant de demander de l'aide.
				</li>
				<li>
					Une question ou une inquiétude sur une réponse de Milo ? Écrivez-nous à{" "}
					<a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
				</li>
			</ul>
		),
	},
];

const AiCharterPage: React.FC = () => (
	<LegalLayout
		slug="charte"
		floats={["light_bulb", "shield"]}
		title={
			<>
				Charte de <span className="lp-hl">l'IA</span>
			</>
		}
		lead="Comment Milo utilise l'intelligence artificielle pour t'aider à apprendre, en toute sécurité."
		summary={[
			"Milo est un tuteur : il t'aide à comprendre, il ne fait pas tes devoirs.",
			"Il reste dans le cadre scolaire, avec des filtres et une équipe qui veille.",
			"L'IA peut se tromper : garde ton esprit critique.",
			"Si tu ne vas pas bien, Milo t'indique des numéros d'aide gratuits.",
		]}
		sections={SECTIONS}
	/>
);

export default AiCharterPage;
