import React, { useEffect, useState } from "react";
import { AlertTriangle, Coins, Loader, X } from "lucide-react";
import { showToast } from "@shared/store/toast/toast.store";
import { ROLE_LABELS, type AdminUserRow, type GrantCoinsResult } from "@features/admin/store/admin.model";
import {
	getAdminErrorMessage,
	useAdminUser,
	useGrantCoins,
} from "@features/admin/store/admin.queries";

const MAX_AMOUNT = 1_000_000;

interface GrantCoinsModalProps {
	/** Compte choisi au préalable dans la liste du support */
	user: Pick<AdminUserRow, "id" | "username" | "first_name" | "last_name" | "role">;
	onClose: () => void;
	onGranted?: (result: GrantCoinsResult) => void;
}

const GrantCoinsModal: React.FC<GrantCoinsModalProps> = ({ user, onClose, onGranted }) => {
	const [amount, setAmount] = useState("100");
	const [amountError, setAmountError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	// Solde relu à l'ouverture : la route fixe un total, la ligne de la liste peut dater
	const { data: fresh, isLoading: isLoadingBalance, isError: isBalanceError } = useAdminUser(user.username);
	const grant = useGrantCoins();

	const parsedAmount = Number(amount);
	const isAmountValid =
		amount.trim() !== "" && Number.isInteger(parsedAmount) && parsedAmount >= 1 && parsedAmount <= MAX_AMOUNT;
	const currentCoins = typeof fresh?.miloro_coin === "number" ? fresh.miloro_coin : null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitError(null);
		if (!isAmountValid) {
			setAmountError(`Un nombre entier entre 1 et ${MAX_AMOUNT.toLocaleString("fr-FR")}.`);
			return;
		}
		if (currentCoins === null) return;
		grant.mutate(
			{ userId: user.id, username: user.username, currentCoins, amount: parsedAmount },
			{
				onSuccess: (result) => {
					showToast(
						`+${result.amount.toLocaleString("fr-FR")} miloros pour @${result.username} : ${result.previousCoins.toLocaleString("fr-FR")} → ${result.newCoins.toLocaleString("fr-FR")}.`,
						"success",
					);
					onGranted?.(result);
					onClose();
				},
				onError: (error) => setSubmitError(getAdminErrorMessage(error)),
			},
		);
	};

	return (
		<div className="ad-overlay" onClick={onClose} role="presentation">
			<div
				className="ad-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="grant-coins-title"
				onClick={(e) => e.stopPropagation()}
			>
				<header className="ad-modal-header">
					<div className="ad-card-title-wrap">
						<div className="ad-card-icon"><Coins size={18} /></div>
						<div>
							<h2 id="grant-coins-title" className="ad-card-title">Créditer des miloros</h2>
							<p className="ad-card-subtitle">Le montant s'ajoute au solde actuel de l'élève</p>
						</div>
					</div>
					<button type="button" className="ad-modal-close" onClick={onClose} aria-label="Fermer">
						<X size={18} />
					</button>
				</header>

				<form className="ad-modal-body" onSubmit={handleSubmit} noValidate>
					{/* Cible */}
					<div className="ad-grant-target">
						<div className="ad-avatar">
							{`${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?"}
						</div>
						<div className="ad-grant-target-body">
							<strong>{user.first_name} {user.last_name}</strong>
							<span className="ad-muted">@{user.username} · {ROLE_LABELS[user.role] ?? user.role}</span>
						</div>
						<div className="ad-grant-balance">
							<span className="ad-field-label">Solde actuel</span>
							<strong>
								{currentCoins !== null
									? currentCoins.toLocaleString("fr-FR")
									: isLoadingBalance ? <Loader size={14} className="ad-spin" /> : "—"}
							</strong>
						</div>
					</div>
					{isBalanceError && currentCoins === null && (
						<p className="ad-alert ad-alert--error">Impossible de lire le solde actuel de ce compte.</p>
					)}

					{/* Montant */}
					<label className="ad-field">
						<span>Montant à ajouter (miloros)</span>
						<input
							type="number"
							inputMode="numeric"
							min={1}
							max={MAX_AMOUNT}
							step={1}
							autoFocus
							value={amount}
							onChange={(e) => {
								setAmount(e.target.value);
								setAmountError(null);
								setSubmitError(null);
							}}
							required
						/>
						{amountError && <em className="ad-field-error">{amountError}</em>}
					</label>
					<div className="ad-grant-presets" aria-label="Montants rapides">
						{[50, 100, 250, 500, 1000].map((preset) => (
							<button
								key={preset}
								type="button"
								className={`ad-btn ad-btn--ghost ad-btn--sm ${amount === String(preset) ? "is-selected" : ""}`}
								onClick={() => {
									setAmount(String(preset));
									setAmountError(null);
								}}
							>
								+{preset.toLocaleString("fr-FR")}
							</button>
						))}
					</div>

					{currentCoins !== null && isAmountValid && (
						<p className="ad-grant-summary">
							Nouveau solde de <strong>@{user.username}</strong> :{" "}
							{currentCoins.toLocaleString("fr-FR")} + {parsedAmount.toLocaleString("fr-FR")} ={" "}
							<strong>{(currentCoins + parsedAmount).toLocaleString("fr-FR")} miloros</strong>
						</p>
					)}

					{submitError && (
						<p className="ad-alert ad-alert--error" role="alert">
							<AlertTriangle size={16} />
							<span>{submitError}</span>
						</p>
					)}

					<div className="ad-actions">
						<button type="button" className="ad-btn ad-btn--ghost" onClick={onClose} disabled={grant.isPending}>
							Annuler
						</button>
						<button
							type="submit"
							className="ad-btn ad-btn--primary"
							disabled={currentCoins === null || !isAmountValid || grant.isPending}
						>
							{grant.isPending ? <Loader size={16} className="ad-spin" /> : <Coins size={16} />}
							Créditer
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default GrantCoinsModal;
