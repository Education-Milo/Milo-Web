import React from "react";
import { useToastStore } from "@shared/store/toast/toast.store";
import "@shared/styles/Toast.css";

const ToastContainer: React.FC = () => {
	const toasts = useToastStore((state) => state.toasts);
	const dismiss = useToastStore((state) => state.dismiss);

	if (toasts.length === 0) return null;

	return (
		<div className="app-toast-stack" aria-live="polite">
			{toasts.map((toast) => (
				<div
					key={toast.id}
					className={`app-toast app-toast-${toast.variant}`}
					role="status"
					onClick={() => dismiss(toast.id)}
				>
					<span className="app-toast-msg">{toast.message}</span>
					<button
						type="button"
						className="app-toast-close"
						aria-label="Fermer"
						onClick={(e) => {
							e.stopPropagation();
							dismiss(toast.id);
						}}
					>
						✕
					</button>
				</div>
			))}
		</div>
	);
};

export default ToastContainer;
