import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ScrollText, ShieldCheck, Users } from "lucide-react";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { useUserStore } from "@shared/store/user/user.store";
import { ROUTES } from "@shared/constants/routes";
import UserRoleManager from "@features/admin/components/UserRoleManager";
import AuditLog from "@features/admin/components/AuditLog";
import "@features/admin/styles/Admin.css";

type AdminTab = "users" | "audit";

const AdminPage: React.FC = () => {
	const navigate = useNavigate();
	const me = useUserStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);
	const [tab, setTab] = useState<AdminTab>("users");

	const handleLogout = async () => {
		await logout();
		navigate(ROUTES.LOGIN, { replace: true });
	};

	return (
		<div className="ad-page">
			<header className="ad-header">
				<div className="ad-header-title">
					<ShieldCheck size={22} />
					<div>
						<h1>Administration</h1>
						<p>Gestion des rôles et journal des actions</p>
					</div>
				</div>
				<div className="ad-header-user">
					<span>
						{me?.first_name} {me?.last_name}
						<span className="ad-muted"> · @{me?.username}</span>
					</span>
					<button type="button" className="ad-btn ad-btn--ghost" onClick={handleLogout}>
						<LogOut size={15} /> Se déconnecter
					</button>
				</div>
			</header>

			<nav className="ad-tabs" role="tablist" aria-label="Sections">
				<button
					type="button"
					role="tab"
					aria-selected={tab === "users"}
					className={`ad-tab ${tab === "users" ? "active" : ""}`}
					onClick={() => setTab("users")}
				>
					<Users size={16} /> Utilisateurs
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={tab === "audit"}
					className={`ad-tab ${tab === "audit" ? "active" : ""}`}
					onClick={() => setTab("audit")}
				>
					<ScrollText size={16} /> Journal
				</button>
			</nav>

			<main className="ad-content">
				{tab === "users" ? <UserRoleManager /> : <AuditLog />}
			</main>
		</div>
	);
};

export default AdminPage;
