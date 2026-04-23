import React from "react";
import { BookOpen, ChevronRight, Sparkles } from "lucide-react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { useCoursesScreen } from "@features/courses/hooks/useCoursesPage";
import { SUBJECTS_CONFIG } from "@shared/constants/courses";
import type { ClassType } from "@shared/store/user/user.model";
import "@features/courses/styles/CoursesScreen.css";
import miloGreeting from "/buttonGo.webp";

const LEVELS: { value: ClassType; label: string }[] = [
	{ value: "6eme", label: "6ème" },
	{ value: "5eme", label: "5ème" },
	{ value: "4eme", label: "4ème" },
	{ value: "3eme", label: "3ème" },
];

const CoursesScreen: React.FC = () => {
	const {
		user,
		currentClass,
		setCurrentClass,
		subjects,
		loading,
		error,
		handleCourseClick,
	} = useCoursesScreen();

	return (
		<ScreenLayout>
			<div className="cs-page">
				{/* --- HERO --- */}
				<section className="cs-hero">
					<div className="cs-hero-halo" aria-hidden="true" />
					<div className="cs-hero-left">
						<img src={miloGreeting} alt="Milo" className="cs-hero-mascot" />
					</div>
					<div className="cs-hero-center">
						<div className="cs-hero-chip">
							<Sparkles size={14} />
							<span>Étape 1 / 4</span>
						</div>
						<h1 className="cs-hero-title">
							Bonjour {user?.first_name || "toi"} !
						</h1>
						<p className="cs-hero-sub">
							Choisis une matière pour commencer ton aventure avec Milo.
						</p>
					</div>
					<div className="cs-level-selector" role="tablist" aria-label="Niveau de classe">
						{LEVELS.map((level) => (
							<button
								key={level.value}
								type="button"
								role="tab"
								aria-selected={currentClass === level.value}
								className={`cs-level-chip ${currentClass === level.value ? "active" : ""}`}
								onClick={() => setCurrentClass(level.value)}
							>
								{level.label}
							</button>
						))}
					</div>
				</section>

				{/* --- TITRE SECTION --- */}
				<header className="cs-section-header">
					<div className="cs-section-title-wrap">
						<BookOpen size={20} className="cs-section-icon" />
						<h2 className="cs-section-title">Matières générales</h2>
					</div>
					<span className="cs-section-count">
						{subjects.length} matière{subjects.length > 1 ? "s" : ""}
					</span>
				</header>

				{/* --- GRILLE DE TUILES --- */}
				<main className="cs-stage">
					{loading && (
						<div className="cs-state">
							<div className="cs-loader" aria-hidden="true" />
							<p>Chargement des matières...</p>
						</div>
					)}

					{error && !loading && (
						<div className="cs-state cs-state-error">
							<p>Oups, une erreur est survenue : {error}</p>
						</div>
					)}

					{!loading && !error && subjects.length === 0 && (
						<div className="cs-state">
							<p>Aucune matière disponible pour ce niveau.</p>
						</div>
					)}

					{!loading && !error && subjects.length > 0 && (
						<div className="cs-tiles">
							{subjects.map((subject, index) => {
								const config = SUBJECTS_CONFIG[subject.id];
								if (!config) return null;

								return (
									<button
										key={subject.id}
										type="button"
										className={`cs-tile cs-theme-${config.colorTheme}`}
										onClick={() => handleCourseClick(subject.id)}
										style={{ animationDelay: `${0.05 * index}s` }}
									>
										<div className="cs-tile-bg" aria-hidden="true" />
										<div className="cs-tile-shine" aria-hidden="true" />

										<div className="cs-tile-emoji-wrap">
											<span className="cs-tile-emoji">{config.emoji}</span>
										</div>

										<div className="cs-tile-body">
											<h3 className="cs-tile-title">{config.title}</h3>
											<div className="cs-tile-cta">
												<span>Démarrer</span>
												<ChevronRight size={16} />
											</div>
										</div>
									</button>
								);
							})}
						</div>
					)}
				</main>
			</div>
		</ScreenLayout>
	);
};

export default CoursesScreen;