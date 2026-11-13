import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, UserPlus } from "lucide-react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { useUserStore } from "@shared/store/user/user.store";
import { ROUTES } from "@shared/constants/routes";
import ParentPageHeader from "@features/parent/components/ParentPageHeader";
import ParentEmptyState from "@features/parent/components/ParentEmptyState";
import ChildSwitcher from "@features/parent/components/ChildSwitcher";
import {
	LatestReportCard,
	RecentActivityCard,
	SubjectInsightsCard,
	WeeklyActivityCard,
} from "@features/parent/components/ChildInsights";
import {
	useChildActivity,
	useChildStats,
	useLinkedChildren,
	useWeeklyReports,
} from "@features/parent/store/parent.queries";
import { useActiveChild } from "@features/parent/store/parent.store";
import "@features/parent/styles/Parent.css";

const greeting = () => (new Date().getHours() < 18 ? "Bonjour" : "Bonsoir");

const Dashboard: React.FC = () => {
	const firstName = useUserStore((state) => state.user?.first_name);
	const { children, isLoading, isError, refetch } = useLinkedChildren();
	const activeChild = useActiveChild(children);
	const childId = activeChild?.id ?? null;
	const stats = useChildStats(childId);
	const activity = useChildActivity(childId);
	const reports = useWeeklyReports(childId);

	const renderBody = () => {
		if (isLoading) {
			return (
				<p className="pa-muted" role="status">
					Chargement de vos comptes liés…
				</p>
			);
		}
		if (isError) {
			return (
				<div className="pa-card">
					<ParentEmptyState
						icon={AlertCircle}
						title="Impossible de charger vos comptes liés"
						action={
							<button type="button" className="pa-btn pa-btn--ghost" onClick={() => void refetch()}>
								Réessayer
							</button>
						}
					>
						Vérifiez votre connexion puis réessayez.
					</ParentEmptyState>
				</div>
			);
		}
		if (!activeChild) {
			return (
				<div className="pa-card pa-card--welcome">
					<ParentEmptyState
						icon={UserPlus}
						title="Aucun enfant lié pour l'instant"
						action={
							<Link to={ROUTES.PARENT.CHILDREN} className="pa-btn pa-btn--primary">
								<UserPlus size={18} aria-hidden="true" />
								Lier un compte enfant
							</Link>
						}
					>
						Liez le compte Milo de votre enfant pour suivre son temps de travail, ses matières fortes et
						ses bilans hebdomadaires.
					</ParentEmptyState>
				</div>
			);
		}

		const childName = activeChild.first_name;
		return (
			<>
				<ChildSwitcher children={children} activeChild={activeChild} />
				<div className="pa-grid">
					<WeeklyActivityCard childName={childName} stats={stats} />
					<SubjectInsightsCard childName={childName} stats={stats} />
					<RecentActivityCard childName={childName} activity={activity} />
					<LatestReportCard childName={childName} reports={reports} />
				</div>
			</>
		);
	};

	return (
		<ScreenLayout>
			<div className="pa-page">
				<ParentPageHeader
					eyebrow="Espace parent"
					title={firstName ? `${greeting()}, ${firstName}` : greeting()}
					lead="Suivez le travail de vos enfants sur Milo, semaine après semaine."
				/>
				{renderBody()}
			</div>
		</ScreenLayout>
	);
};

export default Dashboard;
