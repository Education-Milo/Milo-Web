import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Bell, Flame, LogOut, Menu, X, Zap } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import type { UserProfile } from "@shared/store/user/user.model";
import { ROUTES } from "@shared/constants/routes";
import "@shared/styles/SideBar.css";

interface SidebarProps {
	onLogout: () => void;
	userProfile: UserProfile | any;
	streakDays?: number;
	/** XP total de l'utilisateur, affiché à côté de la streak. */
	xpPoints?: number;
	notificationCount?: number;
	/** Missions du jour restantes (total - completed), affiché en badge. */
	missionsRemaining?: number;
	onNotificationClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
	onLogout,
	userProfile,
	streakDays = 0,
	xpPoints = 0,
	notificationCount = 0,
	missionsRemaining = 0,
	onNotificationClick,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const [isMobileOpen, setIsMobileOpen] = useState(false);

	// Ferme le tiroir mobile à chaque changement de page.
	useEffect(() => {
		setIsMobileOpen(false);
	}, [location.pathname]);

	// Empêche le scroll du body quand le tiroir mobile est ouvert.
	useEffect(() => {
		document.body.style.overflow = isMobileOpen ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [isMobileOpen]);

	const isParent = userProfile?.role === "Parent";

	const studentNavItems = [
		{ label: "Accueil", path: ROUTES.HOME, icon: "🏠" },
		{ label: "Cours", path: ROUTES.COURSES, icon: "📚", badge: 3 },
		{ label: "Import document", path: ROUTES.OCR, icon: "📄" },
		{ label: "Missions", path: ROUTES.MISSIONS, icon: "✅", badge: missionsRemaining },
		{ label: "Duels", path: ROUTES.DUELS, icon: "⚔️" },
		{ label: "Boutique", path: "/boutique", icon: "🛍️" },
		{ label: "Mon Milo", path: "/mon-milo", icon: "🦊" },
	];

	const progressItems = [
		{ label: "Succès", path: "/achievements", icon: "🏆", disabled: true },
		{ label: "Statistiques", path: ROUTES.STATS, icon: "📊", disabled: false },
	];

	const socialItems = [
		{ label: "Amis", path: "/friends", icon: "👥", disabled: false },
		{ label: "Classements", path: "/leaderboard", icon: "🌟", disabled: true },
	];

	const parentNavItems = [
		{ label: "Tableau de bord", path: "/parent/dashboard", icon: "📊" },
		{ label: "Abonnement", path: "/parent/subscription", icon: "💳" },
		{ label: "Comptes liés", path: "/parent/children", icon: "👨‍👩‍👧‍👦", disabled: true },
		{ label: "Paramètres", path: "/settings", icon: "⚙️", disabled: true },
	];

	const activeNavItems = isParent ? parentNavItems : studentNavItems;
	const isActive = (path: string) => location.pathname === path;

	/* =========================================================
	   INDICATEUR MAGNET : on mesure la position de l'item actif
	   et on y positionne un <div> qui glisse via transition CSS
	   ========================================================= */
	const navRef = useRef<HTMLElement>(null);
	const [indicator, setIndicator] = useState<{ top: number; height: number; visible: boolean }>({
		top: 0,
		height: 0,
		visible: false,
	});

	useLayoutEffect(() => {
		const nav = navRef.current;
		if (!nav) return;
		const activeEl = nav.querySelector<HTMLElement>(".sb-nav-item.active");
		if (!activeEl) {
			setIndicator((prev) => ({ ...prev, visible: false }));
			return;
		}
		const navRect = nav.getBoundingClientRect();
		const itemRect = activeEl.getBoundingClientRect();
		setIndicator({
			top: itemRect.top - navRect.top + nav.scrollTop,
			height: itemRect.height,
			visible: true,
		});
	}, [location.pathname, isParent]);

	/* Re-mesure si la fenêtre est redimensionnée */
	useEffect(() => {
		const onResize = () => {
			const nav = navRef.current;
			if (!nav) return;
			const activeEl = nav.querySelector<HTMLElement>(".sb-nav-item.active");
			if (!activeEl) return;
			const navRect = nav.getBoundingClientRect();
			const itemRect = activeEl.getBoundingClientRect();
			setIndicator({
				top: itemRect.top - navRect.top + nav.scrollTop,
				height: itemRect.height,
				visible: true,
			});
		};
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);

	const renderNavItem = (item: any) => {
		const isDisabled = item.disabled;
		return (
			<button
				type="button"
				key={item.path}
				className={`sb-nav-item ${isActive(item.path) ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
				onClick={() => {
					if (isDisabled) return;
					navigate(item.path);
					setIsMobileOpen(false);
				}}
				disabled={isDisabled}
			>
				<span className="sb-nav-icon">{item.icon}</span>
				<span className="sb-nav-label">{item.label}</span>
				{Boolean(item.badge) && !isDisabled && (
					<span className="sb-nav-badge">{item.badge}</span>
				)}
				{isDisabled && <span className="sb-nav-tag">Bientôt</span>}
			</button>
		);
	};

	return (
		<>
			{/* --- BARRE MOBILE : logo + bouton hamburger --- */}
			<div className="sb-mobile-topbar">
				<img src="/milo-logo2.png" alt="Milo" className="sb-mobile-logo" />
				<button
					type="button"
					className="sb-mobile-toggle"
					onClick={() => setIsMobileOpen(true)}
					aria-label="Ouvrir le menu"
					aria-expanded={isMobileOpen}
				>
					<Menu size={22} />
				</button>
			</div>

			{/* --- OVERLAY : ferme le tiroir au tap en dehors --- */}
			{isMobileOpen && (
				<div
					className="sb-overlay"
					onClick={() => setIsMobileOpen(false)}
					aria-hidden="true"
				/>
			)}

			<aside className={`sb-sidebar ${isMobileOpen ? "open" : ""}`}>
				{/* --- HEADER : Logo + bouton notifications --- */}
				<div className="sb-header">
					<div className="sb-logo">
						<img src="/milo-logo2.png" alt="Milo" className="sb-logo-img" />
					</div>

					<div className="sb-header-actions">
						<button
							type="button"
							className="sb-icon-btn sb-mobile-close"
							onClick={() => setIsMobileOpen(false)}
							aria-label="Fermer le menu"
						>
							<X size={18} />
							<span className="sb-mobile-btn-label">Fermer</span>
						</button>

						<button
							type="button"
							className="sb-icon-btn"
							onClick={onNotificationClick}
							aria-label="Notifications"
						>
							<Bell size={18} />
							<span className="sb-mobile-btn-label">Notifications</span>
							{notificationCount > 0 && (
								<span className="sb-icon-btn-dot">
									{notificationCount > 9 ? "9+" : notificationCount}
								</span>
							)}
						</button>
					</div>
				</div>

					{/* --- NAV avec indicateur magnet --- */}
					<nav className="sb-nav" ref={navRef}>
						{/* L'indicateur flottant qui glisse */}
						<div
							className={`sb-nav-indicator ${indicator.visible ? "visible" : ""}`}
							style={{
								transform: `translateY(${indicator.top}px)`,
								height: `${indicator.height}px`,
							}}
							aria-hidden="true"
						/>

						<div className="sb-nav-group">
							<div className="sb-nav-group-title">Principal</div>
							{activeNavItems.map(renderNavItem)}
						</div>

						{!isParent && (
							<>
								<div className="sb-nav-group">
									<div className="sb-nav-group-title">Progression</div>
									{progressItems.map(renderNavItem)}
								</div>

								<div className="sb-nav-group">
									<div className="sb-nav-group-title">Social</div>
									{socialItems.map(renderNavItem)}
								</div>
							</>
						)}
					</nav>

					{/* --- FOOTER --- */}
					<div className="sb-footer">
						<button
							type="button"
							className="sb-user-card"
							onClick={() => navigate("/profile")}
						>
							<div className="sb-user-avatar">👤</div>
							<div className="sb-user-info">
								<h4 className="sb-user-name">
									{userProfile?.first_name || "Utilisateur"}
								</h4>
								<p className="sb-user-sub">
									{isParent ? "Parent" : `Classe ${userProfile?.classe || "1"}`}
								</p>
							</div>
							<div className="sb-user-stats">
								<div
									className="sb-streak"
									title={`${streakDays} jour${streakDays > 1 ? "s" : ""} de suite`}
								>
									<Flame size={14} />
									<span>{streakDays}</span>
								</div>
								<div className="sb-xp" title={`${xpPoints} XP`}>
									<Zap size={14} />
									<span>{xpPoints}</span>
								</div>
							</div>
						</button>

						<button
							type="button"
							className="sb-logout-btn"
							onClick={onLogout}
							title="Se déconnecter"
						>
							<LogOut size={16} />
							<span>Se déconnecter</span>
						</button>
					</div>
				</aside>
			</>
		);
};

export default Sidebar;
