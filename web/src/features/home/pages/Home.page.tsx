import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import MiloSchoolCard from "@features/home/components/miloSchool/MiloSchoolCard.component";
import MissionsBoardOverlay from "@features/home/components/MissionsBoardOverlay.component";
import NewsLetterOverlay, { type NewsItem } from "@features/home/components/NewsLetterOverlay.component";
import { useSeenNews } from "@features/home/hooks/useSeenNews";
import { useHomePage } from "@features/home/hooks/useHomePage";
import { useDailyMissions } from "@features/missions/store/missions.queries";
import { useBulletinStore } from "@features/ocr/store/bulletin.store";
import { ROUTES } from "@shared/constants/routes";
import { useUserStore } from "@shared/store/user/user.store";
import "@features/home/styles/Home.css";

const ANNOUNCEMENTS: NewsItem[] = [
	{
		id: 1,
		date: "Aujourd'hui",
		emoji: "🚀",
		title: "Nouvelle leçon disponible !",
		text: "Découvre les secrets des fractions avec Milo.",
	},
	{
		id: 2,
		date: "28 Sept. 2026",
		emoji: "🏆",
		title: "Tournoi de Duels",
		text: "Inscris-toi pour le tournoi de mathématiques du week-end.",
	},
	{
		id: 3,
		date: "25 Sept. 2026",
		emoji: "🛠️",
		title: "Maintenance prévue",
		text: "L'application sera mise à jour à 2h du matin.",
	},
	{
		id: 4,
		date: "20 Sept. 2026",
		emoji: "✨",
		title: "Milo s'est amélioré",
		text: "L'IA parle désormais mieux l'anglais !",
	},
];

const ANNOUNCEMENT_IDS = ANNOUNCEMENTS.map((announcement) => announcement.id);

const HomePage: React.FC = () => {
	const navigate = useNavigate();
	const { welcomeMessage } = useHomePage();
	const user = useUserStore((state) => state.user);
	const firstName = user?.first_name?.trim() || "champion";
	const { data: dailyMissions } = useDailyMissions();
	const reportCard = useBulletinStore((state) => state.reportCard);
	const missions = dailyMissions?.missions ?? [];
	const completedMissionsCount = dailyMissions?.completed ?? 0;
	const totalMissionsCount = dailyMissions?.total ?? 0;
	const pendingMissionsCount = missions.filter((mission) => !mission.is_bonus && !mission.is_completed).length;
	const { unread: unreadNews, markAllSeen } = useSeenNews(ANNOUNCEMENT_IDS);
	const [panel, setPanel] = useState<"missions" | "news" | null>(null);
	const openMissions = useCallback(() => setPanel("missions"), []);
	const openNews = useCallback(() => {
		setPanel("news");
		markAllSeen();
	}, [markAllSeen]);
	const closePanel = useCallback(() => setPanel(null), []);

	const gradedSubjects =
		reportCard?.filter((subject) => typeof subject.grade === "number") ?? [];

	const belowClassAverageSubjects = gradedSubjects
		.filter((subject) => {
			if (typeof subject.class_average !== "number") return false;
			return (subject.grade || 0) < subject.class_average;
		})
		.sort((a, b) => (a.grade || 0) - (b.grade || 0));

	const studentAverage =
		gradedSubjects.length > 0
			? gradedSubjects.reduce((sum, subject) => sum + (subject.grade || 0), 0) /
				gradedSubjects.length
			: null;

	const belowStudentAverageSubjects =
		studentAverage === null
			? []
			: gradedSubjects
					.filter((subject) => (subject.grade || 0) < studentAverage)
					.sort((a, b) => (a.grade || 0) - (b.grade || 0));

	/// Only get worst grade
	const difficultSubjects = (
		belowClassAverageSubjects.length > 0
			? belowClassAverageSubjects
			: belowStudentAverageSubjects.length > 0
				? belowStudentAverageSubjects
				: [...gradedSubjects].sort((a, b) => (a.grade || 0) - (b.grade || 0))
	).slice(0, 3);

	const hasBelowClassAverageSubjects = belowClassAverageSubjects.length > 0;

	const handleMissionClick = () => {
		navigate(ROUTES.COURSES);
	};

	const handleSelectSubject = (subject: string) => {
		navigate(`${ROUTES.COURSES}`, { state: { subject } });
	};

	return (
		<ScreenLayout>
			{/* L'accueil, en grand : Milo devant sa salle de classe. La pancarte
			    ouvre les missions du jour, la boîte aux lettres les actualités. */}
			<div className="hp-world">
				<MiloSchoolCard
					welcome={welcomeMessage}
					firstName={firstName}
					streak={user?.streak}
					weakSubject={difficultSubjects[0]?.subject}
					pendingMissions={pendingMissionsCount}
					unreadNews={unreadNews}
					missions={{ done: completedMissionsCount, total: totalMissionsCount, pending: pendingMissionsCount }}
					onOpenMissions={openMissions}
					onOpenNews={openNews}
					focus={panel === "missions" ? "missions" : panel === "news" ? "mail" : null}
				>
					{/* La caméra s'approche de la pancarte : on y lit les missions */}
					<MissionsBoardOverlay
						open={panel === "missions"}
						onClose={closePanel}
						missions={missions}
						done={completedMissionsCount}
						total={totalMissionsCount}
						weakSubjects={reportCard && reportCard.length > 0 ? difficultSubjects : []}
						weakTitle={hasBelowClassAverageSubjects ? "Matières à revoir" : "Matières à renforcer"}
						onMission={handleMissionClick}
						onSubject={handleSelectSubject}
					/>
					{/* Une enveloppe s'envole de la boîte aux lettres, une lettre en sort */}
					<NewsLetterOverlay open={panel === "news"} onClose={closePanel} news={ANNOUNCEMENTS} firstName={firstName} />
				</MiloSchoolCard>
			</div>
		</ScreenLayout>
	);
};

export default HomePage;
