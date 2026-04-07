import React, { useState, useEffect } from "react";
import "../styles/MiloScene.css";

interface HelpModalProps {
	isOpen: boolean;
	onClose: () => void;
	imageUrl: string;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, imageUrl }) => {
	const [isClosing, setIsClosing] = useState(false);
	const [imgError, setImgError] = useState(false);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
			setImgError(false);
		}
		return () => {
			document.body.style.overflow = "auto";
		};
	}, [isOpen]);

	if (!isOpen && !isClosing) return null;

	const handleClose = () => {
		setIsClosing(true);
		setTimeout(() => {
			setIsClosing(false);
			onClose();
		}, 250);
	};

	return (
		<div
			className={`help-modal-overlay ${isClosing ? "closing" : ""}`}
			onClick={handleClose}
		>
			<div className="help-modal-content" onClick={(e) => e.stopPropagation()}>
				<button
					className="help-modal-close"
					onClick={handleClose}
					aria-label="Fermer"
				>
					&times;
				</button>

				{imgError ? (
					<p className="help-modal-error">
						Image non trouvee. Placez votre fichier dans le dossier public.
					</p>
				) : (
					<img
						className="help-modal-img"
						src={imageUrl}
						alt="Instructions"
						onError={() => setImgError(true)}
					/>
				)}
			</div>
		</div>
	);
};

export default HelpModal;
