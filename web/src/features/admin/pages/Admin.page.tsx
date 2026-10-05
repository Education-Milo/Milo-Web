import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	FlaskConical,
	LayoutDashboard,
	LifeBuoy,
	LogOut,
	ScrollText,
	ShieldCheck,
	Shirt,
} from "lucide-react";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { useUserStore } from "@shared/store/user/user.store";
import { ROUTES } from "@shared/constants/routes";
import AuditLog from "@features/admin/components/AuditLog";
import CosmeticsManager from "@features/admin/components/CosmeticsManager";
import AdminDashboard from "@features/admin/components/AdminDashboard";
import AdminSupport from "@features/admin/components/AdminSupport";
import DemoProfiles from "@features/admin/components/DemoProfiles";
import "@features/admin/styles/Admin.css";

type AdminTab = "dashboard" | "support" | "cosmetics" | "demo" | "audit";

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
	{ id: "dashboard", label: "Tableau de bord", icon: <LayoutDashboard size={16} /> },
	{ id: "support", label: "Support", icon: <LifeBuoy size={16} /> },
	{ id: "cosmetics", label: "Cosmétiques", icon: <Shirt size={16} /> },
	{ id: "demo", label: "Profils de démo", icon: <FlaskConical size={16} /> },
	{ id: "audit", label: "Journal", icon: <ScrollText size={16} /> },
];

const AdminPage: React.FC = () => {
	const navigate = useNavigate();
	const me = useUserStore((state) => state.user);
	const logout = useAuthStore((state) => state.logout);
	const [tab, setTab] = useState<AdminTab>("dashboard");

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
						<p>Activité de la plateforme, comptes, catalogue et profils de démonstration</p>
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
				{TABS.map((t) => (
					<button
						key={t.id}
						type="button"
						role="tab"
						aria-selected={tab === t.id}
						className={`ad-tab ${tab === t.id ? "active" : ""}`}
						onClick={() => setTab(t.id)}
					>
						{t.icon} {t.label}
					</button>
				))}
			</nav>

			<main className="ad-content">
				{tab === "dashboard" && <AdminDashboard />}
				{tab === "support" && <AdminSupport />}
				{tab === "cosmetics" && <CosmeticsManager />}
				{tab === "demo" && <DemoProfiles />}
				{tab === "audit" && <AuditLog />}
			</main>
		</div>
	);
};

export default AdminPage;
