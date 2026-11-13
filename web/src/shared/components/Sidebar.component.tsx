import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import {
	Bell,
	ChevronRight,
	CreditCard,
	FileText,
	Flame,
	LayoutDashboard,
	Link2,
	LogOut,
	Menu,
	Users,
	X,
	Zap,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import type { UserProfile } from "@shared/store/user/user.model";
import MiloAvatar from "@shared/components/MiloAvatar.component";
import { ROUTES } from "@shared/constants/routes";
import "@shared/styles/SideBar.css";

/// Icônes 3D de la navigation, servies depuis /public/icons/nav
/// (WebP 80 px : affichées à 34 px, ×2 pour les écrans rétina).
/// « stats », réservé aux parents, garde l'ancienne icône.
const NAV_ICONS = new Set(["home", "lesson", "import", "mission", "duel", "shop", "my_milo", "success", "leaderboard", "friend"]);
const navIcon = (name: string) => (NAV_ICONS.has(name) ? `/icons/nav/${name}.webp` : `/icons/${name}_icon.webp`);

interface SidebarProps {
	onLogout: () => void;
	/** « Changer de profil » : retour à « Qui est-ce ? » sans mot de passe */
	onSwitchProfile?: () => void;
	userProfile: UserProfile | any;
	streakDays?: number;
	/** XP total de l'utilisateur, affiché à côté de la streak. */
	xpPoints?: number;
	notificationCount?: number;
	/** Missions du jour restantes (total - completed), affiché en badge. */
	missionsRemaining?: number;
	/** Skins équipés de l'utilisateur, pour son avatar Milo */
	avatarMeshNames?: string[];
	onNotificationClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
	onLogout,
	onSwitchProfile,
	userProfile,
	streakDays = 0,
	xpPoints = 0,
	notificationCount = 0,
	missionsRemaining = 0,
	avatarMeshNames,
	onNotificationClick,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const [isMobileOpen, setIsMobileOpen] = useState(false);
	const toggleRef = useRef<HTMLButtonElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);
	const wasOpen = useRef(false);

	/// Format tiroir (≤ 768 px) : menu fermé = hors écran, donc `inert`
	/// pour le sortir de l'ordre de tabulation (WCAG 2.4.7, 2.4.11)
	const [isDrawer, setIsDrawer] = useState(
		() => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
	);
	useEffect(() => {
		const mq = window.matchMedia("(max-width: 768px)");
		const onChange = () => setIsDrawer(mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);

	// Ouverture : focus sur « Fermer » ; fermeture : retour au bouton menu.
	// Échap ferme le tiroir.
	useEffect(() => {
		if (!isDrawer) return;
		if (isMobileOpen) {
			wasOpen.current = true;
			closeRef.current?.focus();
			const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsMobileOpen(false);
			window.addEventListener("keydown", onKey);
			return () => window.removeEventListener("keydown", onKey);
		}
		if (wasOpen.current) {
			wasOpen.current = false;
			// Focus resté dans le tiroir (qui devient inert) ou perdu : retour au
			// bouton menu. Après une navigation, le titre de la page le garde.
			const active = document.activeElement;
			const drawer = document.getElementById("sb-drawer");
			if (!active || active === document.body || drawer?.contains(active)) toggleRef.current?.focus();
		}
	}, [isMobileOpen, isDrawer]);

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

	/// Icônes introuvables : on retombe sur l'emoji plutôt qu'une image cassée
	const [brokenIcons, setBrokenIcons] = useState<Set<string>>(() => new Set());

	const isParent = userProfile?.role === "Parent";
	// Un admin a toute la navigation élève, plus le groupe « Administration »
	const isAdmin = userProfile?.role === "Admin";

	const studentNavItems = [
		{ label: "Accueil", tour: "home", path: ROUTES.HOME, icon: "🏠", iconSrc: navIcon("home"), hint: "Ton tableau de bord du jour" },
		{ label: "Cours", tour: "courses", path: ROUTES.COURSES, icon: "📚", iconSrc: navIcon("lesson"), hint: "Révise tes leçons avec Milo" },
		{ label: "Import document", tour: "ocr", path: ROUTES.OCR, icon: "📄", iconSrc: navIcon("import"), hint: "Photographie un cours ou un exercice" },
		{
			label: "Missions",
			path: ROUTES.MISSIONS,
			icon: "✅",
			iconSrc: navIcon("mission"),
			badge: missionsRemaining,
			hint:
				missionsRemaining > 0
					? `Encore ${missionsRemaining} mission${missionsRemaining > 1 ? "s" : ""} du jour`
					: "Tes missions du jour",
		},
		{ label: "Duels", tour: "duels", path: ROUTES.DUELS, icon: "⚔️", iconSrc: navIcon("duel"), hint: "Affronte tes amis en quiz" },
		{ label: "Boutique", tour: "shop", path: "/boutique", icon: "🛍️", iconSrc: navIcon("shop"), hint: "Dépense tes miloros" },
		{ label: "Personnalisation", tour: "personalization", path: ROUTES.PERSONALIZATION, icon: "🦊", iconSrc: navIcon("my_milo"), hint: "Tenue de Milo, roue de duel et centres d'intérêt" },
	];

	// Les statistiques vivent désormais dans le profil (ROUTES.STATS y redirige)
	const progressItems = [
		{ label: "Succès", path: "/achievements", icon: "🏆", iconSrc: navIcon("success"), disabled: true, hint: "Bientôt disponible" },
	];

	const socialItems = [
		{ label: "Amis", path: "/friends", icon: "👥", iconSrc: navIcon("friend"), disabled: false, hint: "Ajoute et retrouve tes amis" },
		{ label: "Classements", path: "/leaderboard", icon: "🌟", iconSrc: navIcon("leaderboard"), disabled: true, hint: "Bientôt disponible" },
	];

	// Espace parent : icônes au trait plutôt que les icônes 3D de l'espace élève
	const parentNavItems = [
		{ label: "Tableau de bord", path: ROUTES.PARENT.DASHBOARD, iconNode: <LayoutDashboard size={20} /> },
		{ label: "Bilans", path: ROUTES.PARENT.REPORTS, iconNode: <FileText size={20} /> },
	];

	const parentAccountItems = [
		{ label: "Comptes liés", path: ROUTES.PARENT.CHILDREN, iconNode: <Link2 size={20} /> },
		{ label: "Abonnement", path: ROUTES.PARENT.SUBSCRIPTION, iconNode: <CreditCard size={20} /> },
	];

	const adminItems = [
		{ label: "Tableau de bord", path: ROUTES.ADMIN.DASHBOARD, icon: "📊" },
		{ label: "Support", path: ROUTES.ADMIN.SUPPORT, icon: "🛟" },
		{ label: "Modération IA", path: ROUTES.ADMIN.MODERATION, icon: "🛡️" },
		{ label: "Programmes", path: ROUTES.ADMIN.PROGRAMMES, icon: "📚" },
		{ label: "Journal", path: ROUTES.ADMIN.AUDIT, icon: "📜" },
		{ label: "Cosmétiques", path: ROUTES.ADMIN.COSMETICS, icon: "👕" },
		{ label: "Bien-être", path: ROUTES.ADMIN.WELLBEING, icon: "💤", hint: "Tester les rappels de pause et de coucher" },
		{ label: "Onboarding", path: ROUTES.ADMIN.ONBOARDING, icon: "✨", hint: "Simuler l'accueil d'un nouvel élève" },
		{ label: "Profils de démo", path: ROUTES.ADMIN.DEMO, icon: "🧪" },
	];

	const activeNavItems = isParent ? parentNavItems : studentNavItems;
	const homePath = isParent ? ROUTES.PARENT.DASHBOARD : ROUTES.HOME;
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
		// La sidebar est remontée à chaque page : on ramène l'élément actif dans
		// la zone visible (ex. le groupe Administration, en bas de la liste)
		const navBox = nav.getBoundingClientRect();
		const activeBox = activeEl.getBoundingClientRect();
		if (activeBox.bottom > navBox.bottom || activeBox.top < navBox.top) {
			nav.scrollTop += activeBox.top - navBox.top - (navBox.height - activeBox.height) / 2;
		}
		const navRect = nav.getBoundingClientRect();
		const itemRect = activeEl.getBoundingClientRect();
		setIndicator({
			top: itemRect.top - navRect.top + nav.scrollTop,
			height: itemRect.height,
			visible: true,
		});
	}, [location.pathname, isParent, isAdmin]);

	/* Re-mesure si la fenêtre est redimensionnée, si la nav change de taille
	   ou quand les polices finissent de charger (sinon l'indicateur restait
	   calé sur la position mesurée avec la police de secours) */
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
		const observer = new ResizeObserver(onResize);
		// La nav garde sa hauteur : ce sont ses groupes qui changent de taille
		navRef.current?.querySelectorAll(".sb-nav-group").forEach((group) => observer.observe(group));
		void document.fonts?.ready.then(onResize);
		return () => {
			window.removeEventListener("resize", onResize);
			observer.disconnect();
		};
	}, []);

	/* =========================================================
	   INFOBULLE AU SURVOL / FOCUS : rendue en position fixe pour
	   ne pas être rognée par la zone scrollable de la navigation
	   ========================================================= */
	const tooltipId = useId();
	const [tooltip, setTooltip] = useState<{ text: string; top: number; left: number } | null>(null);
	const showTooltip = (el: HTMLElement, text?: string) => {
		if (!text) return;
		const rect = el.getBoundingClientRect();
		setTooltip({ text, top: rect.top + rect.height / 2, left: rect.right + 10 });
	};
	const hideTooltip = () => setTooltip(null);

	useEffect(() => {
		hideTooltip();
	}, [location.pathname]);

	useEffect(() => {
		if (!tooltip) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && hideTooltip();
		const nav = navRef.current;
		window.addEventListener("keydown", onKey);
		nav?.addEventListener("scroll", hideTooltip, { passive: true });
		return () => {
			window.removeEventListener("keydown", onKey);
			nav?.removeEventListener("scroll", hideTooltip);
		};
	}, [tooltip]);

	const renderNavItem = (item: any) => {
		const isDisabled = item.disabled;
		const isTooltipTarget = tooltip?.text === item.hint;
		return (
			<button
				type="button"
				key={item.path}
				// Repère de la visite guidée (onboarding)
				data-tour={item.tour}
				className={`sb-nav-item ${isActive(item.path) ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
				onClick={() => {
					if (isDisabled) return;
					navigate(item.path);
					setIsMobileOpen(false);
				}}
				onMouseEnter={(e) => showTooltip(e.currentTarget, item.hint)}
				onMouseLeave={hideTooltip}
				onFocus={(e) => showTooltip(e.currentTarget, item.hint)}
				onBlur={hideTooltip}
				aria-describedby={isTooltipTarget ? tooltipId : undefined}
				aria-current={isActive(item.path) ? "page" : undefined}
				// Les entrées « Bientôt » restent focusables pour lire l'infobulle
				aria-disabled={isDisabled || undefined}
			>
				<span className="sb-nav-icon" aria-hidden="true">
					{item.iconNode ? (
						item.iconNode
					) : item.iconSrc && !brokenIcons.has(item.iconSrc) ? (
						<img
							src={item.iconSrc}
							alt=""
							className="sb-nav-icon-img"
							width={34}
							height={34}
							decoding="async"
							draggable={false}
							onError={() => setBrokenIcons((prev) => new Set(prev).add(item.iconSrc))}
						/>
					) : (
						item.icon
					)}
				</span>
				<span className="sb-nav-label">{item.label}</span>
				{Boolean(item.badge) && !isDisabled && (
					<span className="sr-only">, {item.badge} à faire</span>
				)}
				{Boolean(item.badge) && !isDisabled && (
					<span className="sb-nav-badge" aria-hidden="true">{item.badge}</span>
				)}
				{isDisabled && <span className="sb-nav-tag">Bientôt</span>}
			</button>
		);
	};

	return (
		<>
			{/* --- BARRE MOBILE : logo + bouton hamburger --- */}
			<div className="sb-mobile-topbar">
				<button
					type="button"
					className="sb-mobile-logo-btn"
					onClick={() => navigate(homePath)}
					aria-label="Milo, retour à l'accueil"
				>
					<img src="/milo-logo.webp" alt="" className="sb-mobile-logo" width={120} height={40} />
				</button>
				<button
					ref={toggleRef}
					type="button"
					className="sb-mobile-toggle"
					onClick={() => setIsMobileOpen(true)}
					aria-label="Ouvrir le menu"
					aria-expanded={isMobileOpen}
					aria-controls="sb-drawer"
				>
					<Menu size={22} aria-hidden="true" />
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

			<aside
				id="sb-drawer"
				className={`sb-sidebar ${isMobileOpen ? "open" : ""} ${isParent ? "is-parent" : ""}`}
				aria-label="Menu principal"
				inert={isDrawer && !isMobileOpen}
			>
				{/* --- HEADER : Logo + bouton notifications --- */}
				<div className="sb-header">
					<button
						type="button"
						className="sb-logo"
						aria-label="Milo, retour à l'accueil"
						onClick={() => navigate(homePath)}
					>
						<img src="/milo-logo.webp" alt="" className="sb-logo-img" />
					</button>

					<div className="sb-header-actions">
						<button
							ref={closeRef}
							type="button"
							className="sb-icon-btn sb-mobile-close"
							onClick={() => setIsMobileOpen(false)}
							aria-label="Fermer le menu"
						>
							<X size={18} aria-hidden="true" />
							<span className="sb-mobile-btn-label" aria-hidden="true">Fermer</span>
						</button>

						<button
							type="button"
							className="sb-icon-btn"
							onClick={onNotificationClick}
							aria-label={
								notificationCount > 0
									? `Notifications, ${notificationCount} non lue${notificationCount > 1 ? "s" : ""}`
									: "Notifications"
							}
						>
							<Bell size={18} aria-hidden="true" />
							<span className="sb-mobile-btn-label" aria-hidden="true">Notifications</span>
							{notificationCount > 0 && (
								<span className="sb-icon-btn-dot" aria-hidden="true">
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
							<div className="sb-nav-group-title">{isParent ? "Suivi" : "Principal"}</div>
							{activeNavItems.map(renderNavItem)}
						</div>

						{isParent && (
							<div className="sb-nav-group">
								<div className="sb-nav-group-title">Compte</div>
								{parentAccountItems.map(renderNavItem)}
							</div>
						)}

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

						{isAdmin && (
							<div className="sb-nav-group">
								<div className="sb-nav-group-title">Administration</div>
								{adminItems.map(renderNavItem)}
							</div>
						)}
					</nav>

					{/* --- CARTE DU JOUR : rappel des missions, au-dessus du profil --- */}
					{!isParent && (
						<button
							type="button"
							className={`sb-quest ${missionsRemaining === 0 ? "is-done" : ""}`}
							onClick={() => navigate(ROUTES.MISSIONS)}
						>
							<span className="sb-quest-copy">
								<span className="sb-quest-eyebrow">Missions du jour</span>
								<span className="sb-quest-title">
									{missionsRemaining > 0
										? `Encore ${missionsRemaining} à faire`
										: "Tout est bouclé !"}
								</span>
								<span className="sb-quest-cta">
									{missionsRemaining > 0 ? "C'est parti" : "Voir mes missions"}
									<ChevronRight size={14} strokeWidth={3} />
								</span>
							</span>
							<img src="/landing/milo-reading.webp" alt="" className="sb-quest-milo" draggable={false} />
						</button>
					)}

					{/* --- FOOTER --- */}
					<div className="sb-footer">
						<button
							type="button"
							className="sb-user-card"
							onClick={() => navigate(ROUTES.PROFILE)}
						>
							<div className="sb-user-avatar">
						<MiloAvatar
							equippedMeshNames={avatarMeshNames}
							initials={`${userProfile?.first_name?.[0] ?? ""}${userProfile?.last_name?.[0] ?? ""}`.toUpperCase() || "👤"}
						/>
					</div>
							<div className="sb-user-info">
								<span className="sb-user-name">
									{userProfile?.first_name || "Utilisateur"}
								</span>
								<span className="sb-user-sub">
									{isParent
										? "Parent"
										: isAdmin && !userProfile?.classe
											? "Administrateur"
											: `Classe ${userProfile?.classe || "1"}`}
								</span>
							</div>
							{!isParent && (
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
							)}
						</button>

						<div className="sb-footer-actions">
							{/* Un profil de démonstration n'a pas de compte : pas d'autre profil */}
							{!userProfile?.is_demo && onSwitchProfile && (
								<button
									type="button"
									className="sb-logout-btn sb-switch-btn"
									onClick={onSwitchProfile}
									title="Changer de profil"
								>
									<Users size={16} />
									<span>Profils</span>
								</button>
							)}

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
					</div>
				</aside>

				{tooltip && (
					<div
						id={tooltipId}
						role="tooltip"
						className="sb-tooltip"
						style={{ top: tooltip.top, left: tooltip.left }}
					>
						{tooltip.text}
					</div>
				)}
			</>
		);
};

export default Sidebar;
