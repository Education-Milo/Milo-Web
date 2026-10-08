import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ClassSheet from "@features/milo-scene/components/ClassSheet.component";
import ConfettiBurst from "@shared/components/quiz/ConfettiBurst.component";
import BrandTitle from "@shared/components/quiz/BrandTitle.component";
import { emojiSrc, type BrandEmoji } from "@shared/components/quiz/quiz.assets";

interface LessonFinishedModalProps {
	isOpen: boolean;
	onClose: () => void;
	studentName: string;
	onStartQuiz: () => void;
	onStartOpenQuestion: () => void;
	onChangeLesson: () => void;
	onReview: () => void;
}

/// Fin de leçon : célébration, puis la suite la plus utile mise en avant
/// (carte « feu » de la charte), les autres choix en cartes blanches.
const LessonFinishedModal: React.FC<LessonFinishedModalProps> = ({
	isOpen,
	onClose,
	studentName,
	onStartQuiz,
	onStartOpenQuestion,
	onChangeLesson,
	onReview,
}) => {
	const reduceMotion = useReducedMotion();
	const more: { emoji: BrandEmoji; title: string; text: string; onClick: () => void }[] = [
		{ emoji: "brain", title: "Question ouverte", text: "Milo te pose une question de réflexion", onClick: onStartOpenQuestion },
		{ emoji: "rocket", title: "Leçon suivante", text: "Choisis ta prochaine leçon", onClick: onChangeLesson },
		{ emoji: "books", title: "Relire la leçon", text: "Reviens sur une partie", onClick: onReview },
	];

	return (
		<ClassSheet isOpen={isOpen} onClose={onClose} variant="center" eyebrow="Leçon terminée" title="C'est gagné !">
			<div className="cls-finish">
				<ConfettiBurst count={46} spread={240} originX={50} originY={10} />
				<motion.img
					className="cls-finish-trophy"
					src={emojiSrc("trophy")}
					alt=""
					aria-hidden="true"
					initial={reduceMotion ? false : { scale: 0, rotate: -25 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.1 }}
				/>
				<BrandTitle as="p" text={`Bravo ${studentName} !`} highlight={studentName} delay={0.2} className="cls-finish-title" />
				<p className="cls-finish-lead">Tu as lu toute la leçon. On vérifie que c'est bien rentré ?</p>

				<motion.button
					type="button"
					className="cls-finish-main"
					onClick={onStartQuiz}
					initial={reduceMotion ? false : { y: 24, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.35 }}
				>
					<img src={emojiSrc("bullseye")} alt="" aria-hidden="true" />
					<span className="cls-finish-main-text">
						<b>Fais le quiz de la leçon</b>
						<span>Quelques questions, la correction tout de suite, de l'XP à gagner.</span>
					</span>
					<span className="cls-finish-main-go" aria-hidden="true">
						<ArrowRight size={22} />
					</span>
				</motion.button>

				<div className="cls-finish-more">
					{more.map((item, i) => (
						<motion.button
							key={item.title}
							type="button"
							className="cls-finish-card"
							onClick={item.onClick}
							initial={reduceMotion ? false : { y: 24, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.45 + i * 0.07 }}
						>
							<img src={emojiSrc(item.emoji)} alt="" aria-hidden="true" />
							<b>{item.title}</b>
							<span>{item.text}</span>
						</motion.button>
					))}
				</div>
			</div>
		</ClassSheet>
	);
};

export default LessonFinishedModal;
