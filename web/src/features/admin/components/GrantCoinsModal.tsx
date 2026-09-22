import React, { useEffect, useState } from "react";
import { AlertTriangle, Coins, Loader, Search, UserRound, X } from "lucide-react";
import { useSearchUsers } from "@shared/store/user/user.queries";
import { showToast } from "@shared/store/toast/toast.store";
import { ROLE_LABELS } from "@features/admin/store/admin.model";
import {
	getAdminErrorMessage,
	useAdminUser,
	useGrantCoins,
} from "@features/admin/store/admin.queries";

const SEARCH_DEBOUNCE_MS = 300;
const MAX_AMOUNT = 1_000_000;

interface GrantCoinsModalProps {
	onClose: () => void;
	/** Pseudo présélectionné (ex. depuis une fiche) */
	initialUsername?: string;
}

const GrantCoinsModal: React.FC<GrantCoinsModalProps> = ({ onClose, initialUsername = "" }) => {
	const [searchInput, setSearchInput] = useState(initialUsername);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedUsername, setSelectedUsername] = useState(initialUsername);
	const [hasPicked, setHasPicked] = useState(Boolean(initialUsername));
	const [amount, setAmount] = useState("100");
	const [amountError, setAmountError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	useEffect(() => {
		const timeout = setTimeout(() => setSearchQuery(searchInput.trim()), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timeout);
	}, [searchInput]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const { data: suggestions = [], isFetching: isSearching } = useSearchUsers(searchQuery);
	const { data: target, isLoading: isLoadingUser, isError: isUserError } =
		useAdminUser(selectedUsername);
	const grant = useGrantCoins();

	const showSuggestions = !hasPicked && searchQuery.length >= 2;
	const parsedAmount = Number(amount);
	const isAmountValid =
		amount.trim() !== "" && Number.isInteger(parsedAmount) && parsedAmount >= 1 && parsedAmount <= MAX_AMOUNT;
	const currentCoins = typeof target?.miloro_coin === "number" ? target.miloro_coin : null;

	const handleSelect = (username: string) => {
		setSelectedUsername(username);
		setSearchInput(username);
		setSearchQuery("");
		setHasPicked(true);
		setSubmitError(null);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitError(null);
		if (!isAmountValid) {
			setAmountError(`Un nombre entier entre 1 et ${MAX_AMOUNT.toLocaleString("fr-FR")}.`);
			return;
		}
		if (!target || currentCoins === null) return;
		grant.mutate(
			{ userId: target.id, username: target.username, currentCoins, amount: parsedAmount },
			{
				onSuccess: (result) => {
					showToast(
						`+${result.amount.toLocaleString("fr-FR")} miloros pour @${result.username} : ${result.previousCoins.toLocaleString("fr-FR")} → ${result.newCoins.toLocaleString("fr-FR")}.`,
						"success",
					);
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
					{/* Recherche de l'utilisateur */}
					<div className="ad-search">
						<div className="ad-search-box">
							{isSearching ? <Loader size={18} className="ad-spin" /> : <Search size={18} />}
							<input
								type="text"
								placeholder="Pseudo de l'utilisateur (2 caractères minimum)..."
								value={searchInput}
								onChange={(e) => {
									setSearchInput(e.target.value);
									setHasPicked(false);
								}}
								aria-label="Rechercher un utilisateur"
								autoComplete="off"
								autoFocus={!initialUsername}
							/>
						</div>
						{showSuggestions && suggestions.length > 0 && (
							<ul className="ad-suggestions" role="listbox">
								{suggestions.map((username) => (
									<li key={username}>
										<button type="button" onClick={() => handleSelect(username)}>
											<UserRound size={14} />
											<span>{username}</span>
										</button>
									</li>
								))}
							</ul>
						)}
						{showSuggestions && !isSearching && suggestions.length === 0 && (
							<p className="ad-muted">Aucun utilisateur ne correspond.</p>
						)}
					</div>

					{/* Cible */}
					{selectedUsername && isLoadingUser && <p className="ad-muted">Chargement de la fiche...</p>}
					{selectedUsername && isUserError && !target && (
						<p className="ad-alert ad-alert--error">Impossible de charger cet utilisateur.</p>
					)}
					{target && (
						<div className="ad-grant-target">
							<div className="ad-avatar">
								{`${target.first_name?.[0] ?? ""}${target.last_name?.[0] ?? ""}`.toUpperCase() || "?"}
							</div>
							<div className="ad-grant-target-body">
								<strong>{target.first_name} {target.last_name}</strong>
								<span className="ad-muted">@{target.username} · {ROLE_LABELS[target.role] ?? target.role}</span>
							</div>
							<div className="ad-grant-balance">
								<span className="ad-field-label">Solde actuel</span>
								<strong>{currentCoins !== null ? currentCoins.toLocaleString("fr-FR") : "—"}</strong>
							</div>
						</div>
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

					{target && currentCoins !== null && isAmountValid && (
						<p className="ad-grant-summary">
							Nouveau solde de <strong>@{target.username}</strong> :{" "}
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
							disabled={!target || currentCoins === null || !isAmountValid || grant.isPending}
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
