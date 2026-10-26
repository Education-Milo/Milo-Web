import React, { useId, useRef } from "react";
import { CheckCircle2, Clock, Star, TrendingDown, X } from "lucide-react";
import type { DailyMission } from "@shared/types/missions";
import { formatMissionReward } from "@features/missions/utils/missionIcons";
import { useDialogKeys, usePresence } from "@features/home/hooks/usePresence";
import "@features/home/styles/HomeOverlays.css";

/// La pancarte des missions, vue de près : la caméra s'est approchée du
/// panneau de bois et on y lit les missions du jour, épinglées comme des
/// petites fiches. Le panneau apparaît quand la caméra arrive devant lui.

/// Petite inclinaison des fiches, pour qu'elles aient l'air épinglées à la main
const TILTS = [-1.6, 1.1, -0.7, 1.5, -1.2];

export interface WeakSubject {
	subject: string;
	grade?: number | null;
}

interface MissionsBoardOverlayProps {
	open: boolean;
	onClose: () => void;
	missions: DailyMission[];
	done: number;
	total: number;
	/** Matières du bulletin à revoir (affichées sur un post-it) */
	weakSubjects: WeakSubject[];
	weakTitle: string;
	onMission: (mission: DailyMission) => void;
	onSubject: (subject: string) => void;
}

const MissionsBoardOverlay: React.FC<MissionsBoardOverlayProps> = ({
	open,
	onClose,
	missions,
	done,
	total,
	weakSubjects,
	weakTitle,
	onMission,
	onSubject,
}) => {
	const { mounted, closing } = usePresence(open, 320);
	const titleId = useId();
	const layerRef = useRef<HTMLDivElement>(null);
	useDialogKeys(open, onClose, layerRef);
	if (!mounted) return null;

	const allDone = total > 0 && done >= total;
	return (
		<div
			ref={layerRef}
			tabIndex={-1}
			className={`pancarte-layer${closing ? " is-closing" : ""}`}
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
		>
			<div className="pancarte-backdrop" onClick={onClose} aria-hidden="true" />
			<div className="pancarte-board">
				<div className="pancarte-roof" aria-hidden="true" />
				<div className="pancarte-frame">
					<span className="pancarte-nail is-tl" aria-hidden="true" />
					<span className="pancarte-nail is-tr" aria-hidden="true" />
					<span className="pancarte-nail is-bl" aria-hidden="true" />
					<span className="pancarte-nail is-br" aria-hidden="true" />

					<header className="pancarte-head">
						<h2 id={titleId} className="pancarte-title">
							Missions du jour
						</h2>
						<span className={`pancarte-count${allDone ? " is-done" : ""}`}>
							{allDone ? "Bravo !" : `${done} / ${total}`}
						</span>
						<button type="button" className="pancarte-close" onClick={onClose} aria-label="Retour devant l'école">
							<X size={20} strokeWidth={3} />
						</button>
					</header>

					<ul className="pancarte-notes">
						{missions.map((mission, i) => {
							const isDone = mission.is_completed;
							const ratio = Math.min(1, mission.progress / Math.max(mission.target, 1));
							return (
								<li
									key={mission.id}
									className="pancarte-note-wrap"
									style={{ "--tilt": `${TILTS[i % TILTS.length]}deg`, "--i": i } as React.CSSProperties}
								>
									<button
										type="button"
										className={`pancarte-note${isDone ? " is-done" : ""}${mission.is_bonus ? " is-bonus" : ""}`}
										onClick={() => onMission(mission)}
									>
										<span className="pancarte-pin" aria-hidden="true" />
										<span className="pancarte-note-icon" aria-hidden="true">
											{isDone ? <CheckCircle2 size={22} /> : mission.is_bonus ? <Star size={22} /> : <Clock size={22} />}
										</span>
										<span className="pancarte-note-body">
											<span className="pancarte-note-title">{mission.title}</span>
											<span className="pancarte-bar" aria-hidden="true">
												<i style={{ width: `${ratio * 100}%` }} />
											</span>
											<span className="pancarte-note-meta">
												<span>
													{isDone
														? "Mission accomplie !"
														: `${Math.min(mission.progress, mission.target)}/${mission.target} réalisé`}
												</span>
												<b>{formatMissionReward(mission)}</b>
											</span>
										</span>
										{isDone && (
											<span className="pancarte-stamp" aria-hidden="true">
												Fait !
											</span>
										)}
									</button>
								</li>
							);
						})}
						{missions.length === 0 && (
							<li className="pancarte-note-wrap" style={{ "--tilt": "-1deg", "--i": 0 } as React.CSSProperties}>
								<p className="pancarte-note is-empty">Pas de mission pour l'instant. Reviens plus tard !</p>
							</li>
						)}
					</ul>

					{weakSubjects.length > 0 && (
						<section className="pancarte-postit" aria-label={weakTitle}>
							<span className="pancarte-postit-tape" aria-hidden="true" />
							<h3 className="pancarte-postit-title">
								<TrendingDown size={16} />
								{weakTitle}
							</h3>
							<div className="pancarte-postit-list">
								{weakSubjects.map((subject) => (
									<button
										key={subject.subject}
										type="button"
										className="pancarte-subject"
										onClick={() => onSubject(subject.subject)}
									>
										<span>{subject.subject}</span>
										{typeof subject.grade === "number" && <b>{subject.grade.toFixed(1)}</b>}
									</button>
								))}
							</div>
						</section>
					)}
				</div>
				<div className="pancarte-posts" aria-hidden="true" />
			</div>
		</div>
	);
};

export default MissionsBoardOverlay;
