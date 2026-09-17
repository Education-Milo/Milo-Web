import React from "react";
import {
	Activity,
	BookOpenText,
	Bot,
	ClipboardCheck,
	FileText,
	HelpCircle,
	PencilLine,
	ScanLine,
	Sparkles,
	Swords,
	UserPlus,
} from "lucide-react";
import { useActivities } from "@features/stats/store/stats.queries";
import {
	describeActivity,
	formatDuration,
	formatRelativeDate,
} from "@features/stats/utils/stats.format";

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
	lesson_read: <BookOpenText size={16} />,
	lesson_question: <HelpCircle size={16} />,
	qcm_generated: <Sparkles size={16} />,
	qcm_completed: <ClipboardCheck size={16} />,
	exercise_completed: <PencilLine size={16} />,
	duel_finished: <Swords size={16} />,
	course_scanned: <ScanLine size={16} />,
	report_card_scanned: <FileText size={16} />,
	free_chat: <Bot size={16} />,
	friend_accepted: <UserPlus size={16} />,
};

const ActivityFeed: React.FC = () => {
	const { data: activities = [], isLoading, isError } = useActivities(7, 20);

	return (
		<section className="st-card st-feed">
			<header className="st-card-header">
				<div className="st-card-title-wrap">
					<div className="st-card-icon"><Activity size={18} /></div>
					<div>
						<h2 className="st-card-title">Activité récente</h2>
						<p className="st-card-subtitle">Les 7 derniers jours</p>
					</div>
				</div>
			</header>
			<div className="st-card-body">
				{isLoading && <p className="st-empty-inline">Chargement...</p>}
				{isError && <p className="st-empty-inline">Impossible de charger ton activité.</p>}
				{!isLoading && !isError && activities.length === 0 && (
					<p className="st-empty-inline">Rien cette semaine. À toi de jouer !</p>
				)}
				<ul className="st-feed-list">
					{activities.map((a) => (
						<li key={a.id} className="st-feed-row">
							<div className={`st-feed-icon st-feed-icon--${a.activity_type}`}>
								{ACTIVITY_ICONS[a.activity_type] ?? <Activity size={16} />}
							</div>
							<div className="st-feed-body">
								<span className="st-feed-label">{describeActivity(a)}</span>
								<span className="st-feed-meta">
									{formatRelativeDate(a.created_at)}
									{a.duration_seconds > 0 ? ` · ${formatDuration(a.duration_seconds)}` : ""}
								</span>
							</div>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
};

export default ActivityFeed;
