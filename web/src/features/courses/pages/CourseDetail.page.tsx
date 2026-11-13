import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Home, Layers, Lock, Sparkles } from "lucide-react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import LessonModal from "@features/courses/components/lessonModal/LessonModal.component";
import { useCourseDetailScreen } from "@features/courses/hooks/useCourseDetailPage";
import { COURSE_ICONS, getSubjectArt, subjectDisplayTitle } from "@features/courses/utils/subjectArt";
import { ROUTES } from "@shared/constants/routes";
import type {
	ChapterWithLessons,
	CourseWithChapters,
	LessonWithStatus,
} from "@features/courses/store/course.model";
import "@features/courses/styles/Courses.css";

/// Parcours d'une matière : cours → chapitres → leçons, puis la fenêtre de la
/// leçon (cours avec Milo ou QCM). Même charte que la page des matières.

type WizardStep = "courses" | "chapters" | "lessons";

const STATUS_LABEL: Record<LessonWithStatus["status"], string> = {
	completed: "Terminée",
	"in-progress": "À découvrir",
	locked: "Verrouillée",
};

const STEP_TITLE: Record<WizardStep, [string, string]> = {
	courses: ["Choisis ton", "cours"],
	chapters: ["Choisis un", "chapitre"],
	lessons: ["Choisis une", "leçon"],
};

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;
const lessonCount = (course: CourseWithChapters) =>
	course.chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0);

/** Apparition d'une carte, l'une après l'autre */
const cardIn = (index: number, reduceMotion: boolean | null) =>
	reduceMotion
		? {}
		: {
				initial: { opacity: 0, y: 22 },
				animate: { opacity: 1, y: 0 },
				transition: { type: "spring" as const, stiffness: 150, damping: 18, delay: 0.05 + index * 0.05 },
			};

const CourseDetailScreen: React.FC = () => {
	const navigate = useNavigate();
	const reduceMotion = useReducedMotion();
	const { coursesWithChapters, subject, loading, error, handleGoBack } = useCourseDetailScreen();

	/* --- État local du parcours --- */
	const [step, setStep] = useState<WizardStep>("courses");
	const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
	const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
	const [selectedLesson, setSelectedLesson] = useState<LessonWithStatus | null>(null);

	const selectedCourse: CourseWithChapters | undefined = useMemo(
		() => coursesWithChapters.find((c) => c.id === selectedCourseId),
		[coursesWithChapters, selectedCourseId],
	);
	const selectedChapter: ChapterWithLessons | undefined = useMemo(
		() => selectedCourse?.chapters.find((ch) => ch.id === selectedChapterId),
		[selectedCourse, selectedChapterId],
	);
	const art = getSubjectArt(subject?.title);
	const subjectTitle = subjectDisplayTitle(subject?.title);

	const selectCourse = (id: number) => {
		setSelectedCourseId(id);
		setStep("chapters");
	};
	const selectChapter = (id: number) => {
		setSelectedChapterId(id);
		setStep("lessons");
	};
	const selectLesson = (lesson: LessonWithStatus) => {
		if (lesson.status === "locked") return;
		setSelectedLesson(lesson);
	};
	const goToStep = (target: WizardStep) => {
		if (target === "courses") {
			setSelectedCourseId(null);
			setSelectedChapterId(null);
		}
		if (target === "chapters") setSelectedChapterId(null);
		setStep(target);
	};

	/* --- Texte et repères de l'étape --- */
	const lead =
		step === "lessons" && selectedChapter
			? `« ${selectedChapter.title} » : ouvre une leçon pour l'apprendre avec Milo au tableau, ou pour t'entraîner avec un QCM.`
			: step === "chapters" && selectedCourse
				? `Dans « ${selectedCourse.title} », chaque chapitre rassemble quelques leçons.`
				: "Chaque cours regroupe des chapitres. Choisis-en un pour commencer.";

	const facts: { icon: React.ReactNode; label: string }[] = [];
	if (!loading && !error) {
		if (step === "courses") {
			const chapters = coursesWithChapters.reduce((sum, course) => sum + course.chapters.length, 0);
			/// (« cours » est invariable)
			facts.push({ icon: <Emoji3D name="books" />, label: `${coursesWithChapters.length} cours` });
			if (chapters > 0) facts.push({ icon: <Layers size={18} aria-hidden="true" />, label: plural(chapters, "chapitre") });
		} else if (step === "chapters" && selectedCourse) {
			facts.push({ icon: <Layers size={18} aria-hidden="true" />, label: plural(selectedCourse.chapters.length, "chapitre") });
			facts.push({ icon: <Emoji3D name="graduation_cap" />, label: plural(lessonCount(selectedCourse), "leçon") });
		} else if (step === "lessons" && selectedChapter) {
			const open = selectedChapter.lessons.filter((lesson) => lesson.status !== "locked").length;
			const locked = selectedChapter.lessons.length - open;
			facts.push({ icon: <Emoji3D name="graduation_cap" />, label: plural(selectedChapter.lessons.length, "leçon") });
			if (locked > 0) facts.push({ icon: <Emoji3D name="locked" />, label: `${locked} à débloquer` });
		}
	}

	const [titleStart, titleHl] = STEP_TITLE[step];

	return (
		<ScreenLayout>
			<div className={`co co-theme-${art.theme}`}>
				<div className="co-wrap">
					{/* ================= RETOUR + FIL D'ARIANE ================= */}
					<div className="co-top">
						<button type="button" className="co-back" onClick={handleGoBack}>
							<ArrowLeft size={19} strokeWidth={2.6} aria-hidden="true" />
							Mes matières
						</button>
						<nav className="co-crumbs" aria-label="Fil d'Ariane">
							<button type="button" className="co-crumb" onClick={() => navigate(ROUTES.COURSES)}>
								<Home size={16} aria-hidden="true" />
								<span>Matières</span>
							</button>
							<ChevronRight size={16} className="co-crumb-sep" aria-hidden="true" />
							<button
								type="button"
								className="co-crumb"
								aria-current={step === "courses" ? "page" : undefined}
								onClick={() => goToStep("courses")}
							>
								<span>{subjectTitle || "Matière"}</span>
							</button>
							{selectedCourse && (
								<>
									<ChevronRight size={16} className="co-crumb-sep" aria-hidden="true" />
									<button
										type="button"
										className="co-crumb"
										aria-current={step === "chapters" ? "page" : undefined}
										onClick={() => goToStep("chapters")}
									>
										<span>{selectedCourse.title}</span>
									</button>
								</>
							)}
							{selectedChapter && (
								<>
									<ChevronRight size={16} className="co-crumb-sep" aria-hidden="true" />
									<button type="button" className="co-crumb" aria-current="page">
										<span>{selectedChapter.title}</span>
									</button>
								</>
							)}
						</nav>
					</div>

					{/* ================= EN-TÊTE ================= */}
					<motion.section
						className="co-hero"
						initial={reduceMotion ? false : { opacity: 0, y: 26 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ type: "spring", stiffness: 140, damping: 18 }}
					>
						<div className="co-hero__copy">
							<div className="co-hero__titles">
								{subject && (
									<span className="co-eyebrow">
										<Emoji3D name={art.icon} />
										{subjectTitle}
									</span>
								)}
								<AnimatePresence mode="wait" initial={false}>
									<motion.div
										key={step}
										className="co-hero__titles"
										initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
										transition={{ duration: 0.22 }}
									>
										<h1 className="co-hero__title">
											{titleStart} <span className="co-hl">{titleHl}</span>
										</h1>
										<p className="co-hero__lead">{lead}</p>
									</motion.div>
								</AnimatePresence>
							</div>
							{facts.length > 0 && (
								<div className="co-facts">
									{facts.map((fact) => (
										<span key={fact.label} className="co-fact">
											{fact.icon}
											{fact.label}
										</span>
									))}
								</div>
							)}
						</div>
						<div className="co-hero__art" aria-hidden="true">
							<motion.img
								src="/lesson/milo-qcm.webp"
								alt=""
								className="co-hero__milo"
								draggable={false}
								initial={reduceMotion ? false : { x: 50, opacity: 0, rotate: 4 }}
								animate={{ x: 0, opacity: 1, rotate: 0 }}
								transition={{ type: "spring", stiffness: 110, damping: 14, delay: 0.2 }}
							/>
						</div>
					</motion.section>

					{/* ================= CONTENU DE L'ÉTAPE ================= */}
					{loading && (
						<div className="co-courses" aria-hidden="true">
							{[0, 1].map((i) => (
								<div key={i} className="co-skeleton co-skeleton--row" />
							))}
						</div>
					)}

					{error && !loading && (
						<div className="co-empty" role="alert">
							<Emoji3D name="locked" />
							<p>Impossible de charger ce programme pour le moment. Réessaie dans un instant.</p>
						</div>
					)}

					{!loading && !error && coursesWithChapters.length === 0 && (
						<div className="co-empty">
							<Emoji3D name="books" />
							<p>Pas encore de cours dans cette matière. Milo y travaille !</p>
						</div>
					)}

					{!loading && !error && coursesWithChapters.length > 0 && (
						<AnimatePresence mode="wait" initial={false}>
							<motion.section
								key={`${step}-${selectedCourseId ?? ""}-${selectedChapterId ?? ""}`}
								className="co-section"
								aria-label={`${titleStart} ${titleHl}`}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0, transition: { duration: 0.12 } }}
							>
								{/* ÉTAPE 1 — Cours */}
								{step === "courses" && (
									<div className="co-courses">
										{coursesWithChapters.map((course, i) => (
											<motion.button
												key={course.id}
												type="button"
												className="co-card co-course"
												onClick={() => selectCourse(course.id)}
												{...cardIn(i, reduceMotion)}
											>
												<span className="co-icon" aria-hidden="true">
													<Emoji3D name={COURSE_ICONS[i % COURSE_ICONS.length]} />
												</span>
												<span className="co-course__body">
													<span className="co-course__title">{course.title}</span>
													{course.description && <span className="co-course__desc">{course.description}</span>}
													<span className="co-course__meta">
														<span className="co-pill">
															<Layers size={15} aria-hidden="true" />
															{plural(course.chapters.length, "chapitre")}
														</span>
														<span className="co-pill">
															<Sparkles size={15} aria-hidden="true" />
															{plural(lessonCount(course), "leçon")}
														</span>
													</span>
												</span>
												<span className="co-go" aria-hidden="true">
													Voir les chapitres
													<ArrowRight size={19} strokeWidth={2.6} />
												</span>
											</motion.button>
										))}
									</div>
								)}

								{/* ÉTAPE 2 — Chapitres */}
								{step === "chapters" && selectedCourse && (
									<>
										{selectedCourse.chapters.length === 0 ? (
											<div className="co-empty">
												<Emoji3D name="books" />
												<p>Pas encore de chapitre dans ce cours.</p>
											</div>
										) : (
											<div className="co-chapters">
												{selectedCourse.chapters.map((chapter, i) => (
													<motion.button
														key={chapter.id}
														type="button"
														className="co-card co-chapter"
														onClick={() => selectChapter(chapter.id)}
														{...cardIn(i, reduceMotion)}
													>
														<span className="co-chapter__head">
															<span className="co-chapter__num">Chapitre {i + 1}</span>
															<span className="co-pill">{plural(chapter.lessons.length, "leçon")}</span>
														</span>
														<span className="co-chapter__title">{chapter.title}</span>
														<span className="co-chapter__foot">
															<ul className="co-dots" aria-hidden="true">
																{chapter.lessons.map((lesson) => (
																	<li
																		key={lesson.id}
																		className={
																			lesson.status === "locked"
																				? "is-locked"
																				: lesson.status === "completed"
																					? "is-done"
																					: ""
																		}
																	/>
																))}
															</ul>
															<span className="co-arrow" aria-hidden="true">
																<ArrowRight size={20} strokeWidth={2.6} />
															</span>
														</span>
													</motion.button>
												))}
											</div>
										)}
									</>
								)}

								{/* ÉTAPE 3 — Leçons */}
								{step === "lessons" && selectedChapter && (
									<>
										{selectedChapter.lessons.length === 0 ? (
											<div className="co-empty">
												<Emoji3D name="books" />
												<p>Pas encore de leçon dans ce chapitre.</p>
											</div>
										) : (
											<div className="co-lessons">
												{selectedChapter.lessons.map((lesson, i) => {
													const isLocked = lesson.status === "locked";
													return (
														<motion.button
															key={lesson.id}
															type="button"
															className={`co-card co-lesson is-${lesson.status}${isLocked ? " is-locked" : ""}`}
															onClick={() => selectLesson(lesson)}
															disabled={isLocked}
															aria-label={`Leçon ${i + 1} : ${lesson.title} (${STATUS_LABEL[lesson.status].toLowerCase()})`}
															{...cardIn(i, reduceMotion)}
														>
															<span className="co-lesson__num" aria-hidden="true">
																{lesson.status === "completed" ? <Check size={26} strokeWidth={3} /> : i + 1}
															</span>
															<span className="co-lesson__body">
																<span className="co-lesson__title">{lesson.title}</span>
																<span className={`co-status co-status--${lesson.status}`}>
																	{isLocked && <Lock size={13} strokeWidth={2.8} aria-hidden="true" />}
																	{STATUS_LABEL[lesson.status]}
																</span>
															</span>
															{!isLocked && (
																<span className="co-arrow" aria-hidden="true">
																	<ArrowRight size={19} strokeWidth={2.6} />
																</span>
															)}
														</motion.button>
													);
												})}
											</div>
										)}
									</>
								)}
							</motion.section>
						</AnimatePresence>
					)}
				</div>
			</div>

			<LessonModal lesson={selectedLesson} onClose={() => setSelectedLesson(null)} />
		</ScreenLayout>
	);
};

export default CourseDetailScreen;
