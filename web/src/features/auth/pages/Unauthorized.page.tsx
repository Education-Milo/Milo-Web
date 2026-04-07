import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useUserStore } from "@shared/store/user/user.store";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { ROUTES } from "@shared/constants/routes";

const UnauthorizedPage: React.FC = () => {
	const navigate = useNavigate();
	const user = useUserStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);

	const disconnect = () => {
		logout().then(() => {
			navigate(ROUTES.LOGIN);
		});
	};

	const ROLE_INFO: Record<string, { label: string; message: string }> = {
		Enfant: {
			label: "Élève",
			message:
				"Cette page est réservée aux parents, professeurs ou administrateurs.",
		},
		Parent: {
			label: "Parent",
			message:
				"Cette page est réservée aux élèves, professeurs ou administrateurs.",
		},
		Prof: {
			label: "Professeur",
			message:
				"Cette page est réservée aux élèves, parents ou administrateurs.",
		},
		Admin: {
			label: "Administrateur",
			message: "Vous n'avez pas l'autorisation d'accéder à cette page.",
		},
	};

	const { label, message } = ROLE_INFO[user?.role ?? ""] ?? {
		label: "Inconnu",
		message: "Vous n'avez pas les permissions nécessaires.",
	};

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				minHeight: "100vh",
				backgroundColor: "#f9fafb",
				padding: "1rem",
			}}
		>
			<div
				style={{
					maxWidth: "28rem",
					width: "100%",
					backgroundColor: "white",
					borderRadius: "1rem",
					boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
					padding: "2rem",
					textAlign: "center",
				}}
			>
				{/* Icône */}
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						marginBottom: "1.5rem",
					}}
				>
					<div
						style={{
							backgroundColor: "#fee2e2",
							borderRadius: "50%",
							padding: "1rem",
							display: "inline-flex",
						}}
					>
						<ShieldAlert size={48} color="#dc2626" />
					</div>
				</div>

				{/* Titre */}
				<h1
					style={{
						fontSize: "1.5rem",
						fontWeight: "bold",
						color: "#111827",
						marginBottom: "0.5rem",
					}}
				>
					Accès refusé
				</h1>

				{/* Message */}
				<p
					style={{
						color: "#6b7280",
						marginBottom: "1.5rem",
						lineHeight: "1.5",
					}}
				>
					{message}
				</p>

				<div
					style={{
						backgroundColor: "#f3f4f6",
						borderRadius: "0.5rem",
						padding: "1rem",
						marginBottom: "1.5rem",
					}}
				>
					<p
						style={{
							fontSize: "0.875rem",
							color: "#4b5563",
							margin: 0,
						}}
					>
						<strong>Votre rôle actuel :</strong> {label}
					</p>
				</div>

				{/* Boutons d'action */}
				<div
					style={{
						display: "flex",
						gap: "0.75rem",
						flexDirection: "column",
					}}
				>
					<button
						onClick={disconnect}
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "0.5rem",
							backgroundColor: "#f97316",
							color: "white",
							padding: "0.75rem 1.5rem",
							borderRadius: "0.5rem",
							border: "none",
							fontSize: "1rem",
							fontWeight: "500",
							cursor: "pointer",
							transition: "background-color 0.2s",
						}}
						onMouseEnter={(e) =>
							(e.currentTarget.style.backgroundColor = "#ea580c")
						}
						onMouseLeave={(e) =>
							(e.currentTarget.style.backgroundColor = "#f97316")
						}
					>
						🔓 Se déconnecter et changer de compte
					</button>
				</div>
			</div>
		</div>
	);
};

export default UnauthorizedPage;
