import React from "react";
import ScreenLayout from "@components/ui/common/ScreenLayout.component";
import ChapterAccordion from "@components/ChapterAccordion/ChapterAccordion.component";
import { useCourseDetailScreen } from "@hooks/useCourseDetailPage";
import { ArrowLeft } from "lucide-react";
import "@styles/CourseDetailScreen.css";
import miloFoxImage from "/miloBook.webp";

const CHAPTER_EMOJIS = ["📘", "📗", "📙", "📕", "📓", "📔", "📒", "📃"];

const CourseDetailScreen: React.FC = () => {
	const { coursesWithChapters, loading, error, handleGoBack } =
		useCourseDetailScreen();

	return (
		<ScreenLayout>
			<div className="course-detail-layout">
				<nav className="course-detail-sidebar">
					<button className="course-sidebar-back-button" onClick={handleGoBack}>
						<ArrowLeft size={24} className="course-title-icon" />
						<h3>Mes matières</h3>
					</button>

					<ul className="course-nav-list">
						<li className="course-nav-item active">Programme</li>
						<li className="course-nav-item">QCM</li>
						<li className="course-nav-item">Quizz</li>
					</ul>
				</nav>

				<div className="course-main-column">
					{loading && (
						<div className="course-loading">Chargement du programme...</div>
					)}
					{error && <div className="course-error">{error}</div>}
					{!loading &&
						!error &&
						coursesWithChapters.map((course) => (
							<div key={course.id} className="course-section">
								<div className="course-program-header-card">
									<img
										src={miloFoxImage}
										alt="Milo le renard"
										className="milo-fox-mascot"
									/>
									<h1 className="course-program-title">{course.title}</h1>
									{course.description && (
										<p className="course-program-description">
											{course.description}
										</p>
									)}
								</div>
								<div className="course-detail-content">
									<div className="chapter-list">
										{course.chapters.map((chapter, index) => (
											<ChapterAccordion
												key={chapter.id}
												chapter={chapter}
												emoji={CHAPTER_EMOJIS[index % CHAPTER_EMOJIS.length]}
												defaultOpen={index === 0} // Premier chapitre ouvert par défaut
											/>
										))}
									</div>
								</div>
							</div>
						))}
					{!loading && !error && coursesWithChapters.length === 0 && (
						<div className="course-empty">
							Aucun cours disponible pour cette matière.
						</div>
					)}
				</div>
			</div>
		</ScreenLayout>
	);
};

export default CourseDetailScreen;
