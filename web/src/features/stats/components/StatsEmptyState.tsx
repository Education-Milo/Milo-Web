import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpenText, ClipboardCheck, Swords } from "lucide-react";
import { ROUTES } from "@shared/constants/routes";

const StatsEmptyState: React.FC = () => {
	const navigate = useNavigate();

	const actions = [
		{
			icon: <BookOpenText size={26} />,
			title: "Lis un cours",
			text: "Milo t'explique une leçon pas à pas.",
			path: ROUTES.COURSES,
		},
		{
			icon: <ClipboardCheck size={26} />,
			title: "Fais un QCM",
			text: "Teste-toi sur une leçon et gagne des XP.",
			path: ROUTES.COURSES,
		},
		{
			icon: <Swords size={26} />,
			title: "Lance un duel",
			text: "Affronte un ami en direct.",
			path: ROUTES.DUELS,
		},
	];

	return (
		<section className="st-onboarding">
			<img src="/miloBook.webp" alt="" className="st-onboarding-mascot" />
			<h2 className="st-onboarding-title">Tes statistiques t'attendent</h2>
			<p className="st-onboarding-text">
				Dès que tu commences à travailler avec Milo, tes progrès s'affichent ici :
				temps passé, scores, points forts et matières à renforcer.
			</p>
			<div className="st-onboarding-actions">
				{actions.map((action) => (
					<button
						key={action.title}
						type="button"
						className="st-onboarding-card"
						onClick={() => navigate(action.path)}
					>
						<div className="st-onboarding-icon">{action.icon}</div>
						<span className="st-onboarding-card-title">{action.title}</span>
						<span className="st-onboarding-card-text">{action.text}</span>
					</button>
				))}
			</div>
		</section>
	);
};

export default StatsEmptyState;
