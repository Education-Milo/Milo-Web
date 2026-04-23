import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	BookOpen,
	CheckCircle2,
	ChevronRight,
	GraduationCap,
	Home,
	Layers,
	Lock,
	PlayCircle,
} from "lucide-react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import LessonModal from "@features/courses/components/lessonModal/LessonModal.component";
import { useCourseDetailScreen } from "@features/courses/hooks/useCourseDetailPage";
import { SUBJECTS_CONFIG } from "@shared/constants/courses";
import { ROUTES } from "@shared/constants/routes";
import { useParams } from "react-router-dom";
import type {
	ChapterWithLessons,
	CourseWithChapters,
	LessonWithStatus,
} from "@features/courses/store/course.model";
import "@features/courses/styles/CourseDetailScreen.css";
import miloFoxImage from "/miloBook.webp";

const COURSE_EMOJIS = ["📚", "📖", "🎓", "✏️", "🧠", "🔬", "🧮", "🗺️"];
const CHAPTER_EMOJIS = ["📘", "📗", "📙", "📕", "📓", "📔", "📒", "📃"];

type WizardStep = "courses" | "chapters" | "lessons";

const STATUS_LABEL: Record<LessonWithStatus["status"], string> = {
	completed: "Terminée",
	"in-progress": "À continuer",
	locked: "Verrouillée",
};

const CourseDetailScreen: React.FC = () => {
	const navigate = useNavigate();
	const { subjectId } = useParams<{ subjectId: string }>();
	const { coursesWithChapters, loading, error, handleGoBack } =
		useCourseDetailScreen();

	/* --- État local du wizard --- */
	const [step, setStep] = useState<WizardStep>("courses");
	const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
	const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
	const [selectedLesson, setSelectedLesson] = useState<LessonWithStatus | null>(null);

	/* --- Dérivés --- */
	const subjectConfig = subjectId ? SUBJECTS_CONFIG[Number(subjectId)] : undefined;

	const selectedCourse: CourseWithChapters | undefined = useMemo(
		() => coursesWithChapters.find((c) => c.id === selectedCourseId),
		[coursesWithChapters, selectedCourseId],
	);
	const selectedChapter: ChapterWithLessons | undefined = useMemo(
		() => selectedCourse?.chapters.find((ch) => ch.id === selectedChapterId),
		[selectedCourse, selectedChapterId],
	);

	/* --- Handlers --- */
	const selectCourse = (id: number) => { setSelectedCourseId(id); setStep("chapters"); };
	const selectChapter = (id: number) => { setSelectedChapterId(id); setStep("lessons"); };
	const selectLesson = (lesson: LessonWithStatus) => {
		if (lesson.status === "locked") return;
		setSelectedLesson(lesson);
	};
	const goToStep = (target: WizardStep) => {
		if (target === "courses") { setSelectedCourseId(null); setSelectedChapterId(null); }
		if (target === "chapters") setSelectedChapterId(null);
		setStep(target);
	};
	const goToMatieres = () => navigate(ROUTES.COURSES);

	/* --- Meta de l'étape courante (titre + chip) --- */
	const stepMeta = {
		courses:  { icon: <BookOpen size={16} />,       title: "Choisis ton cours",     sub: "Sélectionne un programme pour voir ses chapitres." },
		chapters: { icon: <Layers size={16} />,         title: "Choisis un chapitre",   sub: "Explore les chapitres et leurs leçons." },
		lessons:  { icon: <GraduationCap size={16} />,  title: "Choisis une leçon",     sub: "Démarre une leçon pour apprendre ou t'entraîner." },
	}[step];

	const stepNumber = step === "courses" ? 2 : step === "chapters" ? 3 : 4;

	return (
		<ScreenLayout>
			<div className="cd-page">
				{/* --- TOPBAR : retour + breadcrumb --- */}
				<header className="cd-top">
					<button type="button" className="cd-back-btn" onClick={handleGoBack}>
						<ArrowLeft size={18} />
						<span>Mes matières</span>
					</button>

					<nav className="cd-breadcrumb" aria-label="Fil d'Ariane">
						<button type="button" className="cd-crumb" onClick={goToMatieres}>
							<Home size={14} />
							<span className="cd-crumb-label">Matières</span>
						</button>

						<ChevronRight size={14} className="cd-crumb-sep" aria-hidden="true" />

						<button
							type="button"
							className={`cd-crumb ${step === "courses" ? "current" : ""}`}
							onClick={() => goToStep("courses")}
						>
							<span className="cd-crumb-dot" aria-hidden="true" />
							<span className="cd-crumb-label">
								{subjectConfig?.title ?? "Matière"}
							</span>
						</button>

						{selectedCourse && (
							<>
								<ChevronRight size={14} className="cd-crumb-sep" aria-hidden="true" />
								<button
									type="button"
									className={`cd-crumb ${step === "chapters" ? "current" : ""}`}
									onClick={() => goToStep("chapters")}
								>
									<span className="cd-crumb-dot" aria-hidden="true" />
									<span className="cd-crumb-label">{selectedCourse.title}</span>
								</button>
							</>
						)}

						{selectedChapter && (
							<>
								<ChevronRight size={14} className="cd-crumb-sep" aria-hidden="true" />
								<button
									type="button"
									className={`cd-crumb ${step === "lessons" ? "current" : ""}`}
									onClick={() => goToStep("lessons")}
								>
									<span className="cd-crumb-dot" aria-hidden="true" />
									<span className="cd-crumb-label">{selectedChapter.title}</span>
								</button>
							</>
						)}
					</nav>
				</header>

				{/* --- HERO --- */}
				<section className="cd-hero">
					<div className="cd-hero-halo" aria-hidden="true" />
					<img src={miloFoxImage} alt="Milo" className="cd-hero-mascot" />
					<div className="cd-hero-text">
						<div className="cd-hero-chip">
							{stepMeta.icon}
							<span>Étape {stepNumber} / 4</span>
						</div>
						<h1 className="cd-hero-title">{stepMeta.title}</h1>
						<p className="cd-hero-sub">{stepMeta.sub}</p>
					</div>
				</section>

				{/* --- STAGE : contenu de l'étape --- */}
				<main className="cd-stage">
					{loading && (
						<div className="cd-state">
							<div className="cd-loader" aria-hidden="true" />
							<p>Chargement du programme...</p>
						</div>
					)}

					{error && !loading && (
						<div className="cd-state cd-state-error">
							<p>Oups, une erreur est survenue : {error}</p>
						</div>
					)}

					{!loading && !error && coursesWithChapters.length === 0 && (
						<div className="cd-state">
							<p>Aucun cours disponible pour cette matière.</p>
						</div>
					)}

					{/* ÉTAPE 1 — Cours */}
					{!loading && !error && step === "courses" && coursesWithChapters.length > 0 && (
						<div className="cd-grid">
							{coursesWithChapters.map((course, i) => (
								<button
									key={course.id}
									type="button"
									className="cd-card"
									onClick={() => selectCourse(course.id)}
									style={{ animationDelay: `${0.05 * i}s` }}
								>
									<div className="cd-card-emoji">{COURSE_EMOJIS[i % COURSE_EMOJIS.length]}</div>
									<div className="cd-card-body">
										<h3 className="cd-card-title">{course.title}</h3>
										{course.description && (
											<p className="cd-card-desc">{course.description}</p>
										)}
										<div className="cd-card-meta">
											<Layers size={12} />
											<span>{course.chapters.length} chapitre{course.chapters.length > 1 ? "s" : ""}</span>
										</div>
									</div>
									<div className="cd-card-arrow"><ChevronRight size={20} /></div>
								</button>
							))}
						</div>
					)}

					{/* ÉTAPE 2 — Chapitres */}
					{!loading && !error && step === "chapters" && selectedCourse && (
						<>
							{selectedCourse.chapters.length === 0 ? (
								<div className="cd-state"><p>Aucun chapitre pour ce cours pour le moment.</p></div>
							) : (
								<div className="cd-grid">
									{selectedCourse.chapters.map((chapter, i) => (
										<button
											key={chapter.id}
											type="button"
											className="cd-card cd-card-chapter"
											onClick={() => selectChapter(chapter.id)}
											style={{ animationDelay: `${0.05 * i}s` }}
										>
											<div className="cd-card-index">Ch. {i + 1}</div>
											<div className="cd-card-emoji cd-card-emoji-sm">
												{CHAPTER_EMOJIS[i % CHAPTER_EMOJIS.length]}
											</div>
											<div className="cd-card-body">
												<h3 className="cd-card-title">{chapter.title}</h3>
												<div className="cd-card-meta">
													<GraduationCap size={12} />
													<span>{chapter.lessons.length} leçon{chapter.lessons.length > 1 ? "s" : ""}</span>
												</div>
											</div>
											<div className="cd-card-arrow"><ChevronRight size={20} /></div>
										</button>
									))}
								</div>
							)}
						</>
					)}

					{/* ÉTAPE 3 — Leçons */}
					{!loading && !error && step === "lessons" && selectedChapter && (
						<>
							{selectedChapter.lessons.length === 0 ? (
								<div className="cd-state"><p>Aucune leçon dans ce chapitre.</p></div>
							) : (
								<div className="cd-lessons">
									{selectedChapter.lessons.map((lesson, i) => {
										const isLocked = lesson.status === "locked";
										return (
											<button
												key={lesson.id}
												type="button"
												className={`cd-lesson cd-lesson-${lesson.status} ${isLocked ? "is-locked" : ""}`}
												onClick={() => selectLesson(lesson)}
												disabled={isLocked}
												style={{ animationDelay: `${0.05 * i}s` }}
											>
												<div className="cd-lesson-top">
													<div className="cd-lesson-num">{i + 1}</div>
												</div>
												<div className="cd-lesson-status-icon">
													{lesson.status === "completed" && <CheckCircle2 size={36} />}
													{lesson.status === "in-progress" && <PlayCircle size={36} />}
													{lesson.status === "locked" && <Lock size={32} />}
												</div>
												<div className="cd-lesson-text">
													<span className="cd-lesson-title">{lesson.title}</span>
													<span className="cd-lesson-status-label">{STATUS_LABEL[lesson.status]}</span>
												</div>
												{!isLocked && <ChevronRight size={18} className="cd-lesson-arrow" />}
											</button>
										);
									})}
								</div>
							)}
						</>
					)}
				</main>
			</div>

			<LessonModal lesson={selectedLesson} onClose={() => setSelectedLesson(null)} />
		</ScreenLayout>
	);
};

export default CourseDetailScreen;