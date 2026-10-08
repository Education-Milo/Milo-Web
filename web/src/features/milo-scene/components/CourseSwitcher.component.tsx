import React from "react";
import ClassSheet from "@features/milo-scene/components/ClassSheet.component";
import CoursePicker from "@features/courses/components/coursePicker/CoursePicker.component";

interface CourseSwitcherProps {
	isOpen: boolean;
	onClose: () => void;
	currentLessonId?: number;
}

/// « Changer de leçon » : le parcours des pages Cours, dans une fenêtre
/// au-dessus de la classe. Le choix final (« Cours avec Milo » ou « QCM »)
/// passe par la même fenêtre de leçon que sur les pages Cours.
const CourseSwitcher: React.FC<CourseSwitcherProps> = ({ isOpen, onClose, currentLessonId }) => (
	<ClassSheet
		isOpen={isOpen}
		onClose={onClose}
		variant="center"
		size="xl"
		eyebrow="Mes cours"
		title="Changer de leçon"
		icon={<img src="/landing/emoji/books.webp" alt="" />}
	>
		<CoursePicker currentLessonId={currentLessonId} />
	</ClassSheet>
);

export default CourseSwitcher;
