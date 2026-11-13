import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, FileText, UserPlus } from "lucide-react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { ROUTES } from "@shared/constants/routes";
import ParentPageHeader from "@features/parent/components/ParentPageHeader";
import ParentEmptyState from "@features/parent/components/ParentEmptyState";
import ChildSwitcher from "@features/parent/components/ChildSwitcher";
import { DataView } from "@features/parent/components/ChildInsights";
import ReportReader, { formatReportWeek } from "@features/parent/components/ReportReader";
import { useLinkedChildren, useWeeklyReports } from "@features/parent/store/parent.queries";
import { useActiveChild } from "@features/parent/store/parent.store";
import type { WeeklyReport } from "@features/parent/store/parent.model";
import "@features/parent/styles/Parent.css";

const ReportsPage: React.FC = () => {
	const { children, isLoading, isError, refetch } = useLinkedChildren();
	const activeChild = useActiveChild(children);
	const reports = useWeeklyReports(activeChild?.id ?? null);
	const [openReport, setOpenReport] = useState<WeeklyReport | null>(null);

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
					/>
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
						Les bilans hebdomadaires concernent les enfants liés à votre compte.
					</ParentEmptyState>
				</div>
			);
		}

		const childName = activeChild.first_name;
		return (
			<>
				<ChildSwitcher children={children} activeChild={activeChild} />
				<section className="pa-card" aria-labelledby="pa-reports-title">
					<div className="pa-card-head">
						<h2 id="pa-reports-title" className="pa-card-title">
							<FileText size={20} aria-hidden="true" />
							Bilans hebdomadaires de {childName}
						</h2>
					</div>
					<DataView
						query={reports}
						unavailable={
							<ParentEmptyState icon={FileText} title="Aucun bilan pour le moment">
								Les bilans rédigés chaque semaine par l'IA de Milo ne sont pas encore générés. Ils
								apparaîtront ici, du plus récent au plus ancien, dès leur mise en service.
							</ParentEmptyState>
						}
					>
						{(items) =>
							items.length === 0 ? (
								<ParentEmptyState icon={FileText} title="Aucun bilan pour le moment">
									Le premier bilan de {childName} sera rédigé à la fin de sa première semaine d'activité.
								</ParentEmptyState>
							) : (
								<ul className="pa-report-list">
									{items.map((report) => (
										<li key={report.id}>
											<button
												type="button"
												className="pa-report-item"
												onClick={() => setOpenReport(report)}
											>
												<span className="pa-report-week">{formatReportWeek(report)}</span>
												<span className="pa-report-excerpt">{report.text}</span>
												<span className="pa-report-cta" aria-hidden="true">
													Lire
													<ArrowRight size={16} />
												</span>
											</button>
										</li>
									))}
								</ul>
							)
						}
					</DataView>
				</section>
				{openReport && (
					<ReportReader report={openReport} childName={childName} onClose={() => setOpenReport(null)} />
				)}
			</>
		);
	};

	return (
		<ScreenLayout>
			<div className="pa-page">
				<ParentPageHeader
					eyebrow="Espace parent"
					title="Bilans"
					lead="Chaque semaine, Milo résume le travail de votre enfant : ce qui a progressé et ce qui reste à consolider."
				/>
				{renderBody()}
			</div>
		</ScreenLayout>
	);
};

export default ReportsPage;
