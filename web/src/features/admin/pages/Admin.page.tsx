import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { FlaskConical, LayoutDashboard, LifeBuoy, ScrollText, Shirt } from "lucide-react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { ROUTES } from "@shared/constants/routes";
import AuditLog from "@features/admin/components/AuditLog";
import CosmeticsManager from "@features/admin/components/CosmeticsManager";
import AdminDashboard from "@features/admin/components/AdminDashboard";
import AdminSupport from "@features/admin/components/AdminSupport";
import DemoProfiles from "@features/admin/components/DemoProfiles";
import "@features/admin/styles/Admin.css";

const SECTIONS: { path: string; title: string; subtitle: string; icon: React.ReactNode }[] = [
	{
		path: ROUTES.ADMIN.DASHBOARD,
		title: "Tableau de bord",
		subtitle: "Activité de la plateforme sur la période choisie",
		icon: <LayoutDashboard size={22} />,
	},
	{
		path: ROUTES.ADMIN.SUPPORT,
		title: "Support",
		subtitle: "Comptes, statistiques, rôles, miloros et double authentification",
		icon: <LifeBuoy size={22} />,
	},
	{
		path: ROUTES.ADMIN.AUDIT,
		title: "Journal",
		subtitle: "Toutes les actions d'administration, tracées",
		icon: <ScrollText size={22} />,
	},
	{
		path: ROUTES.ADMIN.COSMETICS,
		title: "Cosmétiques",
		subtitle: "Catalogue de la boutique",
		icon: <Shirt size={22} />,
	},
	{
		path: ROUTES.ADMIN.DEMO,
		title: "Profils de démo",
		subtitle: "Comptes fictifs pour voir l'application avec un autre rôle",
		icon: <FlaskConical size={22} />,
	},
];

/** Chemin relatif à /admin pour les routes imbriquées ("" pour le tableau de bord). */
const relative = (path: string) => path.slice(ROUTES.ADMIN.DASHBOARD.length + 1);

const AdminPage: React.FC = () => {
	const location = useLocation();
	const section = SECTIONS.find((s) => s.path === location.pathname.replace(/\/+$/, "")) ?? SECTIONS[0];

	// Même sidebar que l'application élève : l'admin y retrouve aussi le groupe « Administration »
	return (
		<ScreenLayout>
			<div className="ad-page">
				<header className="ad-header">
					<div className="ad-header-title">
						{section.icon}
						<div>
							<h1>{section.title}</h1>
							<p>{section.subtitle}</p>
						</div>
					</div>
				</header>

				<div className="ad-content">
					<Routes>
						<Route index element={<AdminDashboard />} />
						<Route path={relative(ROUTES.ADMIN.SUPPORT)} element={<AdminSupport />} />
						<Route path={relative(ROUTES.ADMIN.AUDIT)} element={<AuditLog />} />
						<Route path={relative(ROUTES.ADMIN.COSMETICS)} element={<CosmeticsManager />} />
						<Route path={relative(ROUTES.ADMIN.DEMO)} element={<DemoProfiles />} />
						<Route path="*" element={<Navigate to={ROUTES.ADMIN.DASHBOARD} replace />} />
					</Routes>
				</div>
			</div>
		</ScreenLayout>
	);
};

export default AdminPage;
