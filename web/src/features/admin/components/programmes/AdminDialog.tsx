import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface AdminDialogProps {
	title: string;
	subtitle?: string;
	icon?: React.ReactNode;
	onClose: () => void;
	/** false pendant une requête : ni Échap ni clic extérieur */
	dismissible?: boolean;
	wide?: boolean;
	children: React.ReactNode;
}

/** Fenêtre modale du panel admin, rendue dans <body>. */
const AdminDialog: React.FC<AdminDialogProps> = ({ title, subtitle, icon, onClose, dismissible = true, wide = false, children }) => {
	useEffect(() => {
		if (!dismissible) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [dismissible, onClose]);

	return createPortal(
		<div className="ad-overlay" onClick={dismissible ? onClose : undefined} role="presentation">
			<div
				className={`ad-modal ${wide ? "ad-modal--wide" : ""}`}
				role="dialog"
				aria-modal="true"
				aria-labelledby="ad-dialog-title"
				onClick={(e) => e.stopPropagation()}
			>
				<header className="ad-modal-header">
					<div className="ad-card-title-wrap">
						{icon && <div className="ad-card-icon">{icon}</div>}
						<div>
							<h2 id="ad-dialog-title" className="ad-card-title">{title}</h2>
							{subtitle && <p className="ad-card-subtitle">{subtitle}</p>}
						</div>
					</div>
					{dismissible && (
						<button type="button" className="ad-modal-close" onClick={onClose} aria-label="Fermer">
							<X size={18} />
						</button>
					)}
				</header>
				<div className="ad-modal-body">{children}</div>
			</div>
		</div>,
		document.body,
	);
};

export default AdminDialog;
