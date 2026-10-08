import React from "react";
import { Link } from "react-router-dom";
import LegalLayout from "@features/legal/components/LegalLayout.component";
import type { LegalSection } from "@features/legal/components/LegalLayout.component";
import { LEGAL_INFO } from "@features/legal/data/legal.info";

const { publisher, hosting, contactEmail } = LEGAL_INFO;

const SECTIONS: LegalSection[] = [
	{
		id: "editeur",
		title: "Éditeur du site",
		content: (
			<>
				<p>
					Milo est un <strong>projet étudiant, non commercial</strong>, réalisé dans le cadre de l'
					{publisher.program}, le projet de fin d'études de l'école {publisher.school}. Il n'est rattaché à
					aucune société ni association : il n'a donc ni numéro SIRET ni immatriculation au registre du
					commerce.
				</p>
				<dl className="lg-facts">
					<div>
						<dt>Éditeurs</dt>
						<dd>
							L'équipe Milo, étudiants d'{publisher.school} : {publisher.members.join(", ")}
						</dd>
					</div>
					<div>
						<dt>Cadre</dt>
						<dd>
							{publisher.program},{" "}
							<a href={publisher.projectUrl} target="_blank" rel="noopener noreferrer">
								fiche du projet
							</a>
						</dd>
					</div>
					<div>
						<dt>Contact</dt>
						<dd>
							<a href={`mailto:${contactEmail}`}>{contactEmail}</a>
						</dd>
					</div>
				</dl>
			</>
		),
	},
	{
		id: "hebergement",
		title: "Hébergement",
		content: (
			<>
				<h3>Application web</h3>
				<dl className="lg-facts">
					<div>
						<dt>Hébergeur</dt>
						<dd>{hosting.web.name}</dd>
					</div>
					<div>
						<dt>Adresse</dt>
						<dd>{hosting.web.address}</dd>
					</div>
					<div>
						<dt>Site</dt>
						<dd>
							<a href={hosting.web.url} target="_blank" rel="noopener noreferrer">
								{hosting.web.url.replace("https://", "")}
							</a>
						</dd>
					</div>
				</dl>
				<h3>Serveurs et données</h3>
				<p>
					Les comptes et la progression sont stockés en France, dans le centre de données de{" "}
					{hosting.api.datacenter.replace(", France", "")}. Les emails de Milo (codes de connexion, mot de passe
					oublié) partent du même hébergeur.
				</p>
				<dl className="lg-facts">
					<div>
						<dt>Hébergeur</dt>
						<dd>{hosting.api.name}</dd>
					</div>
					<div>
						<dt>Adresse</dt>
						<dd>{hosting.api.address}</dd>
					</div>
					<div>
						<dt>Site</dt>
						<dd>
							<a href={hosting.api.url} target="_blank" rel="noopener noreferrer">
								{hosting.api.url.replace("https://", "")}
							</a>
						</dd>
					</div>
				</dl>
			</>
		),
	},
	{
		id: "propriete",
		title: "Propriété intellectuelle",
		content: (
			<>
				<p>
					Le nom Milo, la mascotte, le logo, l'univers graphique, les textes, les exercices et le code du site
					sont la création de l'équipe Milo et sont protégés par le droit d'auteur. Toute reproduction ou
					réutilisation, totale ou partielle, sans autorisation écrite de l'équipe est interdite.
				</p>
				<p>Certains éléments proviennent de tiers, sous licence libre :</p>
				<ul>
					<li>
						les icônes 3D, issues de{" "}
						<a href="https://github.com/microsoft/fluentui-emoji" target="_blank" rel="noopener noreferrer">
							Fluent Emoji
						</a>{" "}
						(Microsoft, licence MIT) ;
					</li>
					<li>les polices Fredoka et Luckiest Guy, distribuées par Google Fonts sous licence libre.</li>
				</ul>
				<p>
					Les cours et documents que tu importes dans Milo restent ta propriété (ou celle de leur auteur). Les
					conditions de leur utilisation sont décrites dans les <Link to="/cgu#contenus">CGU</Link>.
				</p>
			</>
		),
	},
	{
		id: "responsabilite",
		title: "Responsabilité",
		content: (
			<>
				<p>
					L'équipe fait de son mieux pour que Milo soit disponible et que ses contenus soient justes, mais ne peut
					garantir l'absence d'erreur ni d'interruption. Les explications de Milo sont générées en partie par une
					intelligence artificielle : elles peuvent se tromper, comme expliqué dans la{" "}
					<Link to="/charte">charte de l'IA</Link>.
				</p>
				<p>
					Le site peut contenir des liens vers des sites tiers (réseaux sociaux, numéros d'aide…). L'équipe
					n'est pas responsable de leur contenu.
				</p>
			</>
		),
	},
	{
		id: "signaler",
		title: "Signaler un contenu",
		content: (
			<p>
				Un contenu te semble illégal, choquant ou inapproprié (pseudo, réponse de Milo, document importé) ?
				Écris-nous à <a href={`mailto:${contactEmail}`}>{contactEmail}</a> ou via la{" "}
				<Link to="/contact">page Contact</Link>, en décrivant ce que tu as vu et où. Nous l'examinons et le
				retirons rapidement s'il est contraire à la loi ou à nos règles.
			</p>
		),
	},
	{
		id: "droit",
		title: "Droit applicable",
		content: (
			<p>
				Ces mentions sont régies par le droit français. En cas de litige, et après une tentative de résolution
				amiable, les tribunaux français sont compétents.
			</p>
		),
	},
];

const MentionsPage: React.FC = () => (
	<LegalLayout
		slug="mentions"
		floats={["books", "globe"]}
		title={
			<>
				Mentions <span className="lp-hl">légales</span>
			</>
		}
		lead="Qui se cache derrière Milo, où il est hébergé, et à qui s'adresser."
		summary={[
			`Milo est un projet étudiant de fin d'études ${publisher.school}, sans entreprise derrière.`,
			"L'application web est hébergée par Vercel, et tes données chez OVHcloud, en France.",
			<>
				Pour toute question ou signalement : <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
			</>,
		]}
		sections={SECTIONS}
	/>
);

export default MentionsPage;
