import React, { useEffect, useMemo, useState } from "react";
import {
	BookOpen,
	CheckCircle2,
	ChevronRight,
	GraduationCap,
	Home,
	Layers,
	Lock,
	PlayCircle,
	Sparkles,
} from "lucide-react";
import LessonModal from "@features/courses/components/lessonModal/LessonModal.component";
import { useCourseStore } from "@features/courses/store/course.store";
import { useUserStore } from "@shared/store/user/user.store";
import { getSubjectVisuals } from "@shared/constants/courses";
import type { ClassType } from "@shared/store/user/user.model";
import type { LessonWithStatus } from "@features/courses/store/course.model";
import "@features/courses/styles/CoursesScreen.css";
import "@features/courses/styles/CourseDetailScreen.css";
import miloFoxImage from "/miloBook.webp";

/// Le parcours des pages Cours (matière → cours → chapitre → leçon), dans un
/// format compact pour une fenêtre : mêmes tuiles, mêmes classes, même
/// fenêtre de choix « QCM / Cours avec Milo » à la fin.

const LEVELS: { value: ClassType; label: string }[] = [
	{ value: "6eme", label: "6ème" },
	{ value: "5eme", label: "5ème" },
	{ value: "4eme", label: "4ème" },
	{ value: "3eme", label: "3ème" },
];

const COURSE_EMOJIS = ["📚", "📖", "🎓", "✏️", "🧠", "🔬", "🧮", "🗺️"];
const CHAPTER_EMOJIS = ["📘", "📗", "📙", "📕", "📓", "📔", "📒", "📃"];

const STATUS_LABEL: Record<LessonWithStatus["status"], string> = {
	completed: "Terminée",
	"in-progress": "À continuer",
	locked: "Verrouillée",
};

type Step = "subjects" | "courses" | "chapters" | "lessons";

interface CoursePickerProps {
	/** Leçon ouverte en classe : le parcours s'ouvre directement sur son chapitre */
	currentLessonId?: number;
}

const CoursePicker: React.FC<CoursePickerProps> = ({ currentLessonId }) => {
	const user = useUserStore((state) => state.user);
	const { subjects, coursesWithChapters, loadedSubjectId, loading, error, get_subject, load_course_detail } =
		useCourseStore();
	/// Niveau de l'élève, sinon celui de la matière ouverte en classe
	const [level, setLevel] = useState<ClassType>(
		() => user?.classe ?? subjects.find((s) => s.id === loadedSubjectId)?.level ?? "6eme",
	);
	const [step, setStep] = useState<Step>("subjects");
	const [courseId, setCourseId] = useState<number | null>(null);
	const [chapterId, setChapterId] = useState<number | null>(null);
	const [selectedLesson, setSelectedLesson] = useState<LessonWithStatus | null>(null);

	// À l'ouverture : on reprend là où se trouve la leçon en cours
	useEffect(() => {
		if (subjects.length === 0) get_subject().catch(() => undefined);
		for (const course of coursesWithChapters) {
			for (const chapter of course.chapters) {
				if (chapter.lessons.some((lesson) => lesson.id === currentLessonId)) {
					setCourseId(course.id);
					setChapterId(chapter.id);
					setStep("lessons");
					return;
				}
			}
		}
		if (loadedSubjectId && coursesWithChapters.length > 0) setStep("courses");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const subject = subjects.find((s) => s.id === loadedSubjectId);
	const course = useMemo(() => coursesWithChapters.find((c) => c.id === courseId), [coursesWithChapters, courseId]);
	const chapter = useMemo(() => course?.chapters.find((c) => c.id === chapterId), [course, chapterId]);
	const levelSubjects = subjects.filter((s) => s.level === level);

	const pickSubject = (id: number) => {
		setCourseId(null);
		setChapterId(null);
		setStep("courses");
		if (id !== loadedSubjectId || coursesWithChapters.length === 0) {
			load_course_detail(id).catch(() => undefined);
		}
	};

	const goTo = (target: Step) => {
		if (target === "subjects" || target === "courses") {
			setCourseId(null);
			setChapterId(null);
		}
		if (target === "chapters") setChapterId(null);
		setStep(target);
	};

	const meta = {
		subjects: { icon: <Sparkles size={16} />, n: 1, title: "Choisis une matière", sub: "Toutes les matières de ton niveau." },
		courses: { icon: <BookOpen size={16} />, n: 2, title: "Choisis ton cours", sub: "Sélectionne un programme pour voir ses chapitres." },
		chapters: { icon: <Layers size={16} />, n: 3, title: "Choisis un chapitre", sub: "Explore les chapitres et leurs leçons." },
		lessons: { icon: <GraduationCap size={16} />, n: 4, title: "Choisis une leçon", sub: "Démarre une leçon pour apprendre ou t'entraîner." },
	}[step];

	const showLoading = loading && step !== "subjects";

	return (
		<div className="cls-picker">
			{/* Fil d'Ariane des pages Cours */}
			<nav className="cd-breadcrumb cls-picker-crumbs" aria-label="Fil d'Ariane">
				<button type="button" className={`cd-crumb ${step === "subjects" ? "current" : ""}`} onClick={() => goTo("subjects")}>
					<Home size={14} />
					<span className="cd-crumb-label">Matières</span>
				</button>
				{step !== "subjects" && (
					<>
						<ChevronRight size={14} className="cd-crumb-sep" aria-hidden="true" />
						<button type="button" className={`cd-crumb ${step === "courses" ? "current" : ""}`} onClick={() => goTo("courses")}>
							<span className="cd-crumb-dot" aria-hidden="true" />
							<span className="cd-crumb-label">{subject?.title ?? "Matière"}</span>
						</button>
					</>
				)}
				{course && (
					<>
						<ChevronRight size={14} className="cd-crumb-sep" aria-hidden="true" />
						<button type="button" className={`cd-crumb ${step === "chapters" ? "current" : ""}`} onClick={() => goTo("chapters")}>
							<span className="cd-crumb-dot" aria-hidden="true" />
							<span className="cd-crumb-label">{course.title}</span>
						</button>
					</>
				)}
				{chapter && (
					<>
						<ChevronRight size={14} className="cd-crumb-sep" aria-hidden="true" />
						<button type="button" className={`cd-crumb ${step === "lessons" ? "current" : ""}`} onClick={() => goTo("lessons")}>
							<span className="cd-crumb-dot" aria-hidden="true" />
							<span className="cd-crumb-label">{chapter.title}</span>
						</button>
					</>
				)}
			</nav>

			{/* En-tête d'étape des pages Cours */}
			<section className="cd-hero cls-picker-hero">
				<div className="cd-hero-halo" aria-hidden="true" />
				<img src={miloFoxImage} alt="" className="cd-hero-mascot" />
				<div className="cd-hero-text">
					<div className="cd-hero-chip">
						{meta.icon}
						<span>Étape {meta.n} / 4</span>
					</div>
					<h3 className="cd-hero-title">{meta.title}</h3>
					<p className="cd-hero-sub">{meta.sub}</p>
				</div>
				{step === "subjects" && (
					<div className="cs-level-selector cls-picker-levels" role="tablist" aria-label="Niveau de classe">
						{LEVELS.map((l) => (
							<button
								key={l.value}
								type="button"
								role="tab"
								aria-selected={level === l.value}
								className={`cs-level-chip ${level === l.value ? "active" : ""}`}
								onClick={() => setLevel(l.value)}
							>
								{l.label}
							</button>
						))}
					</div>
				)}
			</section>

			<div className="cls-picker-stage" key={`${step}-${courseId}-${chapterId}`}>
				{showLoading && (
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

				{/* Étape 1 — Matières */}
				{step === "subjects" && (
					<div className="cs-tiles">
						{levelSubjects.length === 0 && (
							<div className="cs-state">
								<p>{loading ? "Chargement des matières..." : "Aucune matière disponible pour ce niveau."}</p>
							</div>
						)}
						{levelSubjects.map((s, i) => {
							const config = getSubjectVisuals(s.title);
							const isLocked = config.locked === true;
							return (
								<button
									key={s.id}
									type="button"
									className={`cs-tile cs-theme-${config.colorTheme} ${isLocked ? "is-locked" : ""}`}
									onClick={() => pickSubject(s.id)}
									disabled={isLocked}
									style={{ animationDelay: `${0.05 * i}s` }}
								>
									<div className="cs-tile-bg" aria-hidden="true" />
									<div className="cs-tile-shine" aria-hidden="true" />
									<div className="cs-tile-emoji-wrap">
										<span className="cs-tile-emoji">{config.emoji}</span>
									</div>
									<div className="cs-tile-body">
										<h3 className="cs-tile-title">{s.title}</h3>
										<div className="cs-tile-cta">
											<span>{isLocked ? "Verrouillé" : s.id === loadedSubjectId ? "En cours" : "Choisir"}</span>
											<ChevronRight size={16} />
										</div>
									</div>
									{isLocked && <div className="cs-tile-lock-badge">🔒 Bientôt disponible</div>}
								</button>
							);
						})}
					</div>
				)}

				{/* Étape 2 — Cours */}
				{!showLoading && !error && step === "courses" && (
					<div className="cd-grid">
						{coursesWithChapters.map((c, i) => (
							<button
								key={c.id}
								type="button"
								className="cd-card"
								onClick={() => {
									setCourseId(c.id);
									setStep("chapters");
								}}
								style={{ animationDelay: `${0.05 * i}s` }}
							>
								<div className="cd-card-emoji">{COURSE_EMOJIS[i % COURSE_EMOJIS.length]}</div>
								<div className="cd-card-body">
									<h3 className="cd-card-title">{c.title}</h3>
									{c.description && <p className="cd-card-desc">{c.description}</p>}
									<div className="cd-card-meta">
										<Layers size={12} />
										<span>
											{c.chapters.length} chapitre{c.chapters.length > 1 ? "s" : ""}
										</span>
									</div>
								</div>
								<div className="cd-card-arrow">
									<ChevronRight size={20} />
								</div>
							</button>
						))}
					</div>
				)}

				{/* Étape 3 — Chapitres */}
				{!showLoading && !error && step === "chapters" && course && (
					<div className="cd-grid">
						{course.chapters.map((ch, i) => (
							<button
								key={ch.id}
								type="button"
								className="cd-card cd-card-chapter"
								onClick={() => {
									setChapterId(ch.id);
									setStep("lessons");
								}}
								style={{ animationDelay: `${0.05 * i}s` }}
							>
								<div className="cd-card-index">Ch. {i + 1}</div>
								<div className="cd-card-emoji cd-card-emoji-sm">{CHAPTER_EMOJIS[i % CHAPTER_EMOJIS.length]}</div>
								<div className="cd-card-body">
									<h3 className="cd-card-title">{ch.title}</h3>
									<div className="cd-card-meta">
										<GraduationCap size={12} />
										<span>
											{ch.lessons.length} leçon{ch.lessons.length > 1 ? "s" : ""}
										</span>
									</div>
								</div>
								<div className="cd-card-arrow">
									<ChevronRight size={20} />
								</div>
							</button>
						))}
					</div>
				)}

				{/* Étape 4 — Leçons */}
				{!showLoading && !error && step === "lessons" && chapter && (
					<div className="cd-lessons">
						{chapter.lessons.length === 0 && (
							<div className="cd-state">
								<p>Aucune leçon dans ce chapitre.</p>
							</div>
						)}
						{chapter.lessons.map((lesson, i) => {
							const isLocked = lesson.status === "locked";
							const isCurrent = lesson.id === currentLessonId;
							return (
								<button
									key={lesson.id}
									type="button"
									className={`cd-lesson cd-lesson-${lesson.status} ${isLocked ? "is-locked" : ""} ${isCurrent ? "cls-picker-current" : ""}`}
									onClick={() => !isLocked && setSelectedLesson(lesson)}
									disabled={isLocked}
									style={{ animationDelay: `${0.05 * i}s` }}
								>
									<div className="cd-lesson-top">
										<div className="cd-lesson-num">{i + 1}</div>
										{isCurrent && <span className="cls-picker-here">Tu es ici</span>}
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
			</div>

			<LessonModal lesson={selectedLesson} onClose={() => setSelectedLesson(null)} />
		</div>
	);
};

export default CoursePicker;
