import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { useCoursesScreen } from "@features/courses/hooks/useCoursesPage";
import { getSubjectArt, levelLabel, subjectDisplayTitles } from "@features/courses/utils/subjectArt";
import type { ClassType } from "@shared/store/user/user.model";
import "@features/courses/styles/Courses.css";

/// Page Cours : les matières de la classe de l'élève. Même charte que
/// Missions, Duels et Personnalisation (voir Courses.css).

const LEVELS: { value: ClassType; label: string }[] = [
	{ value: "6eme", label: "6ème" },
	{ value: "5eme", label: "5ème" },
	{ value: "4eme", label: "4ème" },
	{ value: "3eme", label: "3ème" },
];

/** Apparition des blocs de la page, l'un après l'autre (comme sur Missions) */
const reveal = (delay = 0) => ({
	initial: { opacity: 0, y: 26 },
	animate: { opacity: 1, y: 0 },
	transition: { type: "spring" as const, stiffness: 140, damping: 18, delay },
});

const CoursesScreen: React.FC = () => {
	const { user, currentClass, setCurrentClass, subjects, loading, error, handleCourseClick } = useCoursesScreen();
	const reduceMotion = useReducedMotion();
	const firstName = user?.first_name?.trim();
	const level = levelLabel(currentClass);
	const open = subjects.filter((subject) => !getSubjectArt(subject.title).locked).length;
	const soon = subjects.length - open;
	const titles = subjectDisplayTitles(subjects);

	return (
		<ScreenLayout>
			<div className="co">
				<div className="co-wrap">
					{/* ================= EN-TÊTE ================= */}
					<motion.section className="co-hero" {...(reduceMotion ? {} : reveal(0))}>
						<div className="co-hero__copy">
							<div className="co-hero__titles">
								<h1 className="co-hero__title">
									Tes <span className="co-hl">cours</span>
									{level && ` de ${level}`}
								</h1>
								<p className="co-hero__lead">
									{firstName ? `${firstName}, choisis` : "Choisis"} une matière : Milo t'explique chaque leçon
									au tableau, puis tu t'entraînes avec un QCM.
								</p>
							</div>
							<div className="co-hero__meta">
								<div className="co-levels" role="radiogroup" aria-label="Ta classe">
									<span className="co-levels__label" aria-hidden="true">
										Ta classe
									</span>
									<div className="co-levels__rail">
										{LEVELS.map((item) => (
											<button
												key={item.value}
												type="button"
												role="radio"
												aria-checked={currentClass === item.value}
												className={`co-level${currentClass === item.value ? " is-on" : ""}`}
												onClick={() => setCurrentClass(item.value)}
											>
												{item.label}
											</button>
										))}
									</div>
								</div>
								{!loading && !error && subjects.length > 0 && (
									<div className="co-facts">
										<span className="co-fact">
											<Emoji3D name="books" />
											{open} matière{open > 1 ? "s" : ""} ouverte{open > 1 ? "s" : ""}
										</span>
										{soon > 0 && (
											<span className="co-fact">
												<Emoji3D name="locked" />
												{soon} bientôt
											</span>
										)}
									</div>
								)}
							</div>
						</div>

						<div className="co-hero__art" aria-hidden="true">
							<motion.img
								src="/lesson/milo-cours.webp"
								alt=""
								className="co-hero__milo"
								draggable={false}
								initial={reduceMotion ? false : { x: 50, opacity: 0, rotate: 4 }}
								animate={{ x: 0, opacity: 1, rotate: 0 }}
								transition={{ type: "spring", stiffness: 110, damping: 14, delay: 0.25 }}
							/>
						</div>
					</motion.section>

					{/* ================= MATIÈRES ================= */}
					<section className="co-section" aria-labelledby="co-subjects-title">
						<motion.header className="co-section__head" {...(reduceMotion ? {} : reveal(0.08))}>
							<h2 id="co-subjects-title" className="co-h2">
								Tes matières
							</h2>
							<p className="co-section__sub">Clique sur une matière pour voir ses cours, ses chapitres et ses leçons.</p>
						</motion.header>

						{loading && (
							<div className="co-subjects" aria-hidden="true">
								{[0, 1, 2].map((i) => (
									<div key={i} className="co-skeleton" />
								))}
							</div>
						)}

						{error && !loading && (
							<div className="co-empty" role="alert">
								<Emoji3D name="locked" />
								<p>Impossible de charger les matières pour le moment. Réessaie dans un instant.</p>
							</div>
						)}

						{!loading && !error && subjects.length === 0 && (
							<div className="co-empty">
								<Emoji3D name="books" />
								<p>Pas encore de matière pour la {level || "classe choisie"}. Essaie une autre classe !</p>
							</div>
						)}

						{!loading && !error && subjects.length > 0 && (
							<div className="co-subjects">
								{subjects.map((subject, index) => {
									const art = getSubjectArt(subject.title);
									const title = titles.get(subject.id) ?? subject.title;
									return (
										<motion.button
											key={subject.id}
											type="button"
											className={`co-card co-subject co-theme-${art.theme}${art.locked ? " is-locked" : ""}`}
											onClick={() => handleCourseClick(subject.id)}
											disabled={art.locked}
											aria-label={art.locked ? `${title}, bientôt disponible` : `Ouvrir ${title}`}
											{...(reduceMotion ? {} : reveal(0.12 + index * 0.06))}
										>
											<span className="co-subject__cover" aria-hidden="true">
												<Emoji3D name={art.icon} />
												<span className="co-subject__level">{levelLabel(subject.level)}</span>
											</span>
											<span className="co-subject__body">
												<span className="co-subject__titles">
													<span className="co-subject__title">{title}</span>
													<span className="co-subject__blurb">{art.blurb}</span>
												</span>
												<span className="co-subject__foot" aria-hidden="true">
													{art.locked ? (
														<span className="co-soon">
															<Lock size={16} strokeWidth={2.6} />
															Bientôt disponible
														</span>
													) : (
														<span className="co-go">
															C'est parti
															<ArrowRight size={19} strokeWidth={2.6} />
														</span>
													)}
												</span>
											</span>
										</motion.button>
									);
								})}
							</div>
						)}
					</section>
				</div>
			</div>
		</ScreenLayout>
	);
};

export default CoursesScreen;
