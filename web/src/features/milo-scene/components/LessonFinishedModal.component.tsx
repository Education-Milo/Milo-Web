import React from "react";
import { X } from "lucide-react";
import qcmImage from "/milo-maths.png";
import openQuestionImage from "/discuter_milo.png";
import newCourseImage from "/miloBook.webp";
import "../styles/MiloScene.css";

interface LessonFinishedModalProps {
	isOpen: boolean;
	onClose: () => void;
	onStartQcm: () => void;
	onStartOpenQuestion: () => void;
	onBackToLessons: () => void;
}

const LessonFinishedModal: React.FC<LessonFinishedModalProps> = ({
	isOpen,
	onClose,
	onStartQcm,
	onStartOpenQuestion,
	onBackToLessons,
}) => {
	if (!isOpen) return null;

	return (
		<div className="lfm-overlay" onClick={onClose}>
			<div
				className="lfm-modal"
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-labelledby="lfm-title"
			>
				<button className="lfm-close" onClick={onClose} aria-label="Fermer">
					<X size={20} />
				</button>

				<div className="lfm-header">
					<span className="lfm-badge">🎉</span>
					<p className="lfm-label">Leçon terminée</p>
					<h2 id="lfm-title" className="lfm-title">
						Bravo, tu as fini cette leçon !
					</h2>
					<p className="lfm-subtitle">Comment veux-tu continuer ?</p>
				</div>

				<div className="lfm-choices">
					<button className="lfm-card qcm" onClick={onStartQcm}>
						<div className="lfm-card-arrow">→</div>
						<img src={qcmImage} alt="" className="lfm-card-image" />
						<div className="lfm-card-text">
							<span className="lfm-card-title">Faire un QCM</span>
							<span className="lfm-card-desc">Teste tes connaissances</span>
						</div>
					</button>

					<button className="lfm-card question" onClick={onStartOpenQuestion}>
						<div className="lfm-card-arrow">→</div>
						<img src={openQuestionImage} alt="" className="lfm-card-image" />
						<div className="lfm-card-text">
							<span className="lfm-card-title">Question ouverte</span>
							<span className="lfm-card-desc">Discute avec Milo</span>
						</div>
					</button>

					<button className="lfm-card new-course" onClick={onBackToLessons}>
						<div className="lfm-card-arrow">→</div>
						<img src={newCourseImage} alt="" className="lfm-card-image" />
						<div className="lfm-card-text">
							<span className="lfm-card-title">Nouveau cours</span>
							<span className="lfm-card-desc">Choisis une autre leçon</span>
						</div>
					</button>
				</div>
			</div>
		</div>
	);
};

export default LessonFinishedModal;
