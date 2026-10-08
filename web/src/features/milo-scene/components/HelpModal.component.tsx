import React from "react";
import ClassSheet from "@features/milo-scene/components/ClassSheet.component";

interface HelpModalProps {
	isOpen: boolean;
	onClose: () => void;
}

/// Icônes 3D de la charte servies depuis /public/landing/emoji
const STEPS: { emoji: string; title: string; text: string }[] = [
	{ emoji: "books", title: "Lis le tableau", text: "Milo écrit la leçon au tableau, partie par partie. Trop lent ? Clique sur « Tout afficher »." },
	{
		emoji: "light_bulb",
		title: "Passe ta souris sur une phrase",
		text: "Milo peut la ré-expliquer, te donner un exemple, t'inventer un exercice ou te la lire.",
	},
	{ emoji: "speech_balloon", title: "Écris sur ta feuille", text: "Clique sur la feuille posée sur ton bureau pour poser une question à Milo. Il te répond au tableau !" },
	{
		emoji: "card_index_dividers",
		title: "Garde tes notes",
		text: "Clique sur « Noter » : la phrase se colle sur le post-it jaune de ton bureau. Ouvre-le pour relire tes notes ou réviser avec Milo.",
	},
	{ emoji: "bullseye", title: "Teste-toi", text: "Le quiz de la leçon vérifie que tu as tout compris, et te fait gagner de l'XP." },
];

const SHORTCUTS: [string, string][] = [
	["→", "Partie suivante"],
	["←", "Partie précédente"],
	["Entrée", "Ouvrir les actions d'une phrase"],
	["Échap", "Fermer"],
];

/// « Comment ça marche ? » : les quatre gestes de la salle de classe.
const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => (
	<ClassSheet
		isOpen={isOpen}
		onClose={onClose}
		variant="center"
		eyebrow="La salle de classe"
		title="Comment ça marche ?"
		icon={<img src="/landing/emoji/light_bulb.webp" alt="" />}
		footer={
			<button type="button" className="cls-btn cls-btn--primary" onClick={onClose}>
				C'est parti !
			</button>
		}
	>
		<ol className="cls-help-steps">
			{STEPS.map((step, i) => (
				<li key={step.title}>
					<img src={`/landing/emoji/${step.emoji}.webp`} alt="" aria-hidden="true" />
					<div>
						<b>
							{i + 1}. {step.title}
						</b>
						<p>{step.text}</p>
					</div>
				</li>
			))}
		</ol>
		<div className="cls-help-keys">
			<span className="cls-eyebrow">Raccourcis clavier</span>
			<ul>
				{SHORTCUTS.map(([key, label]) => (
					<li key={key}>
						<kbd>{key}</kbd>
						<span>{label}</span>
					</li>
				))}
			</ul>
		</div>
	</ClassSheet>
);

export default HelpModal;
