import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Flame, RefreshCcw } from "lucide-react";
import type { DailyMission } from "@shared/types/missions";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import { DIFFICULTY_LABEL, DIFFICULTY_LEVEL, getMissionIcon } from "@features/missions/utils/missionIcons";

interface MissionCardProps {
	mission: DailyMission;
	index: number;
	onStart: () => void;
	onReroll?: () => void;
	isRerolling?: boolean;
	/** Mission bonus : grande carte sur l'aplat feu */
	featured?: boolean;
}

/**
 * Une mission du jour : icône 3D, progression qui se remplit, récompenses,
 * et l'action. Terminée, un tampon « Mission accomplie » vient s'y poser.
 */
const MissionCard: React.FC<MissionCardProps> = ({ mission, index, onStart, onReroll, isRerolling = false, featured = false }) => {
	const reduceMotion = useReducedMotion();
	const done = mission.is_completed;
	const progress = Math.min(mission.progress, mission.target);
	const ratio = mission.target > 0 ? progress / mission.target : 0;
	const level = DIFFICULTY_LEVEL[mission.difficulty];

	return (
		<motion.article
			className={`mp-mission${done ? " is-done" : ""}${featured ? " is-featured" : ""}`}
			initial={reduceMotion ? false : { opacity: 0, y: 28, rotate: index % 2 ? 1.5 : -1.5 }}
			whileInView={{ opacity: 1, y: 0, rotate: 0 }}
			viewport={{ once: true, amount: 0.3 }}
			transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.08 * index }}
		>
			{/* Carte horizontale : icône | titre + progression | récompenses + action */}
			<motion.span
				className="mp-mission__icon"
				whileHover={reduceMotion ? undefined : { rotate: [0, -12, 10, 0], scale: 1.08 }}
				transition={{ duration: 0.5 }}
			>
				<Emoji3D name={featured ? "party_popper" : getMissionIcon(mission)} />
			</motion.span>

			<div className="mp-mission__body">
				<div className="mp-mission__titles">
					<h3 className="mp-mission__title">
						{mission.title}
						{!featured && (
							<span className="mp-mission__level" title={`Difficulté : ${DIFFICULTY_LABEL[mission.difficulty]}`}>
								<span className="mp-sr-only">Difficulté : {DIFFICULTY_LABEL[mission.difficulty]}</span>
								{[1, 2, 3].map((n) => (
									<Flame key={n} size={17} className={n <= level ? "is-on" : ""} aria-hidden="true" />
								))}
							</span>
						)}
					</h3>
					{mission.description && <p className="mp-mission__desc">{mission.description}</p>}
				</div>

				<div className="mp-mission__progress" aria-label={`Progression : ${progress} sur ${mission.target}`}>
					<div className="mp-bar">
						<motion.div
							className="mp-bar__fill"
							initial={{ width: reduceMotion ? `${ratio * 100}%` : "0%" }}
							whileInView={{ width: `${ratio * 100}%` }}
							viewport={{ once: true }}
							transition={{ duration: 1, delay: 0.25 + 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
						/>
					</div>
					<span className="mp-mission__count">
						{progress}/{mission.target}
					</span>
				</div>
			</div>

			<div className="mp-mission__side">
				<div className="mp-mission__rewards">
					<span className="mp-reward">
						<Emoji3D name="high_voltage" />+{mission.reward_xp} XP
					</span>
					<span className="mp-reward">
						<Emoji3D name="coin" />+{mission.reward_coins}
					</span>
				</div>

				<div className="mp-mission__actions">
					{done ? (
						<span className="mp-mission__done">
							<Check size={20} strokeWidth={3} aria-hidden="true" /> Mission accomplie
						</span>
					) : (
						<>
							<button type="button" className="mp-btn mp-btn--primary" onClick={onStart}>
								C'est parti
								<ArrowRight size={19} strokeWidth={2.6} aria-hidden="true" />
							</button>
							{onReroll && (
								<button
									type="button"
									className="mp-icon-btn"
									onClick={onReroll}
									disabled={isRerolling}
									aria-label="Changer cette mission"
									title="Changer cette mission (une fois par jour)"
								>
									<RefreshCcw size={19} className={isRerolling ? "mp-spin" : ""} aria-hidden="true" />
								</button>
							)}
						</>
					)}
				</div>
			</div>

			{/* Tampon posé quand la mission est terminée */}
			{done && (
				<motion.span
					className="mp-stamp"
					aria-hidden="true"
					initial={reduceMotion ? false : { scale: 2.2, opacity: 0, rotate: -30 }}
					whileInView={{ scale: 1, opacity: 1, rotate: -12 }}
					viewport={{ once: true }}
					transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.4 + 0.08 * index }}
				>
					<Check size={22} strokeWidth={3.4} />
				</motion.span>
			)}
		</motion.article>
	);
};

export default MissionCard;
