import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "@features/auth/styles/AuthHeader.css";

interface AuthHeaderProps {
	onBack?: () => void;
	backLabel?: string;
	rightLinkTo?: string;
	rightLinkLabel?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
	onBack,
	backLabel = "Retour",
	rightLinkTo,
	rightLinkLabel,
}) => {
	return (
		<header className="auth-header">
			<div className="auth-header-left">
				{onBack ? (
					<button type="button" className="auth-back-link" onClick={onBack}>
						<span className="auth-back-icon">
							<ArrowLeft size={18} />
						</span>
						{backLabel}
					</button>
				) : (
					<Link to="/" className="auth-header-logo-link">
						<img src="/milo-logo2.png" alt="Milo" className="auth-header-logo" />
					</Link>
				)}
			</div>
			{rightLinkTo && rightLinkLabel && (
				<Link to={rightLinkTo} className="auth-header-right-link">
					{rightLinkLabel}
				</Link>
			)}
		</header>
	);
};
