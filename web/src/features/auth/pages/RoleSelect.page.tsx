import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
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
			<div className="auth-mesh"></div>

			<AuthHeader rightLinkTo="/login" rightLinkLabel="Déjà un compte ?" />

			<main className="auth-main">
				<StepProgress steps={STEPS} currentStep={0} />

				<motion.div
					className="role-select-intro"
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
				>
					<div className="badge-talk">
						<Sparkles size={14} /> Bienvenue
					</div>
					<h1>
						Comment vas-tu <span>utiliser Milo ?</span>
					</h1>
					<p>Choisis ton profil pour qu'on prépare ton espace sur mesure.</p>
				</motion.div>

				<div className="role-cards-grid">
					{ROLES.map((role, index) => (
						<motion.div
							key={role.slug}
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 * index, duration: 0.4 }}
						>
							<RoleCard
								role={role}
								onSelect={() => navigate(`/register/${role.slug}`)}
							/>
						</motion.div>
					))}
				</div>
			</main>
		</div>
	);
};

export default RoleSelectPage;
