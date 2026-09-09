import React from "react";
import { useNavigate } from "react-router-dom";
import { AuthHeader } from "@features/auth/components/AuthHeader.component";
import { StepProgress } from "@features/auth/components/StepProgress.component";
import { RoleCard } from "@features/auth/components/RoleCard.component";
import { ROLES } from "@features/auth/constants/roles.constants";
import "@features/auth/styles/AuthShared.css";
import "@features/auth/styles/RoleSelect.css";

const STEPS = [
	{ id: "role", label: "Ton rôle" },
	{ id: "infos", label: "Tes informations" },
];

const RoleSelectPage: React.FC = () => {
	const navigate = useNavigate();

	return (
		<div className="auth-page-root">
			<AuthHeader rightLinkTo="/login" rightLinkLabel="Déjà un compte ?" />

			<main className="auth-main">
				<StepProgress steps={STEPS} currentStep={0} />

				<div className="role-select-intro">
					<h1>
						Comment vas-tu <span>utiliser Milo ?</span>
					</h1>
					<p>Choisis ton profil pour continuer.</p>
				</div>

				<div className="role-cards-grid">
					{ROLES.map((role) => (
						<RoleCard
							key={role.slug}
							role={role}
							onSelect={() => navigate(`/register/${role.slug}`)}
						/>
					))}
				</div>
			</main>
		</div>
	);
};

export default RoleSelectPage;
