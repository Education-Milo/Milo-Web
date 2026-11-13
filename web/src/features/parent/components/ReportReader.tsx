import React, { useId, useRef } from "react";
import { X } from "lucide-react";
import { useDialogFocus } from "@shared/hooks/useDialogFocus";
import type { WeeklyReport } from "@features/parent/store/parent.model";

const parseDay = (isoDay: string) => {
	const [year, month, day] = isoDay.split("-").map(Number);
	return new Date(year, (month ?? 1) - 1, day ?? 1);
};

/** "Semaine du 3 au 9 novembre 2026" */
export const formatReportWeek = (report: Pick<WeeklyReport, "week_start" | "week_end">) => {
	const start = parseDay(report.week_start);
	const end = parseDay(report.week_end);
	const sameMonth = start.getMonth() === end.getMonth();
	const startLabel = start.toLocaleDateString("fr-FR", sameMonth ? { day: "numeric" } : { day: "numeric", month: "long" });
	const endLabel = end.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
	return `Semaine du ${startLabel} au ${endLabel}`;
};

/** Paragraphes du texte généré (séparés par une ligne vide) */
const paragraphs = (text: string) =>
	text
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter(Boolean);

interface ReportReaderProps {
	report: WeeklyReport;
	childName: string;
	onClose: () => void;
}

/** Lecture d'un bilan hebdomadaire, en fenêtre modale. */
const ReportReader: React.FC<ReportReaderProps> = ({ report, childName, onClose }) => {
	const dialogRef = useRef<HTMLDivElement>(null);
	const titleId = useId();
	useDialogFocus({ open: true, containerRef: dialogRef, onEscape: onClose });

	return (
		<div className="pa-dialog-backdrop" onClick={onClose}>
			<div
				ref={dialogRef}
				className="pa-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="pa-dialog-head">
					<div>
						<p className="pa-eyebrow">Bilan de {childName}</p>
						<h2 id={titleId} className="pa-dialog-title">
							{formatReportWeek(report)}
						</h2>
					</div>
					<button type="button" className="pa-icon-btn" onClick={onClose} aria-label="Fermer le bilan">
						<X size={20} aria-hidden="true" />
					</button>
				</div>
				<div className="pa-report-body">
					{paragraphs(report.text).map((p, i) => (
						<p key={i}>{p}</p>
					))}
				</div>
				<p className="pa-report-note">Bilan rédigé par l'IA de Milo à partir de l'activité de la semaine.</p>
			</div>
		</div>
	);
};

export default ReportReader;
