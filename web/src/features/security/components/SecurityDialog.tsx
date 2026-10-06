import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface SecurityDialogProps {
	title: string;
	subtitle?: string;
	icon?: React.ReactNode;
	onClose: () => void;
	/** false : ni Échap, ni clic à l'extérieur, ni croix (codes non sauvegardés) */
	dismissible?: boolean;
	children: React.ReactNode;
}

/**
 * Fenêtre modale des réglages de sécurité. Rendue dans <body> : les cartes
 * qui l'ouvrent sont animées (transform) et masquent leur débordement, ce qui
 * piégerait un `position: fixed` à l'intérieur.
 */
const SecurityDialog: React.FC<SecurityDialogProps> = ({
	title,
	subtitle,
	icon,
	onClose,
	dismissible = true,
	children,
}) => {
	useEffect(() => {
		if (!dismissible) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [dismissible, onClose]);

	return createPortal(
		<div className="sec-overlay" onClick={dismissible ? onClose : undefined} role="presentation">
			<div
				className="sec-dialog"
				role="dialog"
				aria-modal="true"
				aria-labelledby="sec-dialog-title"
				onClick={(e) => e.stopPropagation()}
			>
				<header className="sec-dialog-header">
					{icon && <div className="sec-dialog-icon">{icon}</div>}
					<div className="sec-dialog-titles">
						<h2 id="sec-dialog-title">{title}</h2>
						{subtitle && <p>{subtitle}</p>}
					</div>
					{dismissible && (
						<button type="button" className="sec-icon-btn" onClick={onClose} aria-label="Fermer">
							<X size={18} />
						</button>
					)}
				</header>
				<div className="sec-dialog-body">{children}</div>
			</div>
		</div>,
		document.body,
	);
};

export default SecurityDialog;
