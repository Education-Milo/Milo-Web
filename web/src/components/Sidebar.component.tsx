import React from "react";
import { LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import type { UserProfile } from "@shared/store/user/user.model";
import { ROUTES } from "@shared/constants/routes";
import "@styles/SideBar.css";

interface SidebarProps {
	onLogout: () => void;
	userProfile: UserProfile | any;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, userProfile }) => {
	const navigate = useNavigate();
	const location = useLocation();

	const isParent = userProfile?.role === "Parent";

	const studentNavItems = [
		{ label: "Accueil", path: ROUTES.HOME, icon: "🏠" },
		{ label: "Cours", path: ROUTES.COURSES, icon: "📚", badge: 3 },
		{ label: "Missions", path: ROUTES.MISSIONS, icon: "✅" },
		{ label: "Duels", path: ROUTES.DUELS, icon: "⚔️" },
	];

	const progressItems = [
		{ label: "Succès", path: "/achievements", icon: "🏆", disabled: true },
		{ label: "Statistiques", path: "/stats", icon: "📊", disabled: true },
		{ label: "Objectifs", path: "/goals", icon: "🎯", disabled: true },
	];

	const socialItems = [
		{ label: "Amis", path: "/friends", icon: "👥", disabled: true },
		{ label: "Classements", path: "/leaderboard", icon: "🌟", disabled: true },
	];

	const parentNavItems = [
		{ label: "Tableau de bord", path: "/parent/dashboard", icon: "📊" },
		{ label: "Abonnement", path: "/parent/subscription", icon: "💳" },
		{
			label: "Comptes liés",
			path: "/parent/children",
			icon: "👨‍👩‍👧‍👦",
			disabled: true,
		},
		{ label: "Paramètres", path: "/settings", icon: "⚙️", disabled: true },
	];

	const activeNavItems = isParent ? parentNavItems : studentNavItems;

	const isActive = (path: string) => location.pathname === path;

	const renderNavItem = (item: any) => {
		const isDisabled = item.disabled;

		return (
			<div
				key={item.path}
				className={`nav-item ${isActive(item.path) ? "active" : ""} ${isDisabled ? "item-disabled" : ""}`}
				onClick={() => !isDisabled && navigate(item.path)}
			>
				<div className="nav-item-content">
					<span className="nav-item-icon">{item.icon}</span>
					<span>{item.label}</span>
				</div>
				{item.badge && !isDisabled && (
					<span className="nav-item-badge">{item.badge}</span>
				)}
				{isDisabled && <span className="coming-soon-tag">Bientôt</span>}
			</div>
		);
	};

	return (
		<aside className="sidebar">
			<div className="sidebar-logo">
				<img src="/milo-logo2.png" alt="Milo Logo" className="logo" />
			</div>

			<nav className="sidebar-nav">
				<div className="nav-group">
					<div className="nav-group-title">Principal</div>
					{activeNavItems.map(renderNavItem)}
				</div>

				{!isParent && (
					<>
						<div className="nav-group">
							<div className="nav-group-title">Progression</div>
							{progressItems.map(renderNavItem)}
						</div>

						<div className="nav-group">
							<div className="nav-group-title">Social</div>
							{socialItems.map(renderNavItem)}
						</div>
					</>
				)}
			</nav>

			<div className="sidebar-footer">
				<div className="user-profile" onClick={() => navigate("/profile")}>
					<div className="user-avatar">👤</div>
					<div className="user-info">
						<h4>{userProfile?.first_name || "Utilisateur"}</h4>
						<p>
							{isParent ? "Parent" : `Classe ${userProfile?.classe || "1"}`}
						</p>
					</div>
				</div>
				<button
					className="logout-button"
					onClick={onLogout}
					title="Se déconnecter"
				>
					<LogOut size={18} />
					<span>Se déconnecter</span>
				</button>
			</div>
		</aside>
	);
};

export default Sidebar;
