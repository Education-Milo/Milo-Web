import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Coins, Loader, Search, ShieldCheck, UserRound } from "lucide-react";
import GrantCoinsModal from "@features/admin/components/GrantCoinsModal";
import { useSearchUsers } from "@shared/store/user/user.queries";
import { useUserStore } from "@shared/store/user/user.store";
import type { UserRole } from "@shared/store/user/user.model";
import {
	ASSIGNABLE_ROLES,
	ROLE_LABELS,
	type ChangeRoleResponse,
} from "@features/admin/store/admin.model";
import {
	getAdminErrorMessage,
	useAdminUser,
	useChangeUserRole,
} from "@features/admin/store/admin.queries";

const SEARCH_DEBOUNCE_MS = 300;

const formatDate = (value: string) => {
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

const UserRoleManager: React.FC = () => {
	const me = useUserStore((state) => state.user);

	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedUsername, setSelectedUsername] = useState("");
	// Après un choix, le champ contient le pseudo complet : on ne relance pas
	// la liste de suggestions tant que l'admin ne retape pas.
	const [hasPicked, setHasPicked] = useState(false);
	const [role, setRole] = useState<UserRole | "">("");
	const [reason, setReason] = useState("");
	const [isConfirming, setIsConfirming] = useState(false);
	const [lastResult, setLastResult] = useState<ChangeRoleResponse | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	/** Popup de crédit de miloros ; `null` fermée, sinon le pseudo présélectionné ("" = libre) */
	const [grantFor, setGrantFor] = useState<string | null>(null);

	useEffect(() => {
		const timeout = setTimeout(() => setSearchQuery(searchInput.trim()), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timeout);
	}, [searchInput]);

	const { data: suggestions = [], isFetching: isSearching } = useSearchUsers(searchQuery);
	const { data: target, isLoading: isLoadingUser, isError: isUserError } =
		useAdminUser(selectedUsername);
	const changeRole = useChangeUserRole();

	// Réinitialise le formulaire quand on change de fiche
	useEffect(() => {
		setRole("");
		setReason("");
		setIsConfirming(false);
		setLastResult(null);
		setErrorMessage(null);
	}, [selectedUsername]);

	const isSelf = Boolean(target && me && String(target.id) === String(me.id));
	const isSameRole = Boolean(target && role && target.role === role);
	const canSubmit = Boolean(target && role && !isSelf && !isSameRole && !changeRole.isPending);

	const handleSelect = (username: string) => {
		setSelectedUsername(username);
		setSearchInput(username);
		setSearchQuery("");
		setHasPicked(true);
	};

	const showSuggestions = !hasPicked && searchQuery.length >= 2;

	const handleConfirm = () => {
		if (!target || !role) return;
		setErrorMessage(null);
		changeRole.mutate(
			{ userId: target.id, role, reason },
			{
				onSuccess: (data) => {
					setLastResult(data);
					setIsConfirming(false);
					setRole("");
					setReason("");
				},
				onError: (error) => {
					setErrorMessage(getAdminErrorMessage(error));
					setIsConfirming(false);
				},
			},
		);
	};

	return (
		<div className="ad-users">
			<div className="ad-toolbar ad-toolbar--end">
				<button type="button" className="ad-btn ad-btn--primary" onClick={() => setGrantFor("")}>
					<Coins size={16} /> Créditer des miloros
				</button>
			</div>

			{grantFor !== null && (
				<GrantCoinsModal initialUsername={grantFor} onClose={() => setGrantFor(null)} />
			)}

			{/* Recherche */}
			<div className="ad-search">
				<div className="ad-search-box">
					{isSearching ? <Loader size={18} className="ad-spin" /> : <Search size={18} />}
					<input
						type="text"
						placeholder="Rechercher un pseudo (2 caractères minimum)..."
						value={searchInput}
						onChange={(e) => {
							setSearchInput(e.target.value);
							setHasPicked(false);
						}}
						aria-label="Rechercher un utilisateur"
						autoComplete="off"
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

			{/* Fiche */}
			{selectedUsername && isLoadingUser && <p className="ad-muted">Chargement de la fiche...</p>}
			{selectedUsername && isUserError && !target && (
				<p className="ad-alert ad-alert--error">Impossible de charger cet utilisateur.</p>
			)}

			{target && (
				<section className="ad-card">
					<header className="ad-card-header">
						<div className="ad-avatar">
							{`${target.first_name?.[0] ?? ""}${target.last_name?.[0] ?? ""}`.toUpperCase() || "?"}
						</div>
						<div className="ad-card-identity">
							<h2 className="ad-card-title">
								{target.first_name} {target.last_name}
							</h2>
							<span className="ad-muted">@{target.username}</span>
						</div>
						<span className={`ad-role-badge ad-role-badge--${target.role}`}>
							<ShieldCheck size={14} />
							{ROLE_LABELS[target.role] ?? target.role}
						</span>
						<button
							type="button"
							className="ad-btn ad-btn--ghost ad-btn--sm"
							onClick={() => setGrantFor(target.username)}
							title="Créditer des miloros à cet utilisateur"
						>
							<Coins size={14} /> Créditer
						</button>
					</header>

					<dl className="ad-facts">
						<div>
							<dt>Email</dt>
							<dd>{target.email}</dd>
						</div>
						<div>
							<dt>Rôle actuel</dt>
							<dd>{ROLE_LABELS[target.role] ?? target.role}</dd>
						</div>
						<div>
							<dt>Classe</dt>
							<dd>{target.class_ ?? "—"}</dd>
						</div>
						<div>
							<dt>Compte créé le</dt>
							<dd>{formatDate(target.created_at)}</dd>
						</div>
						<div>
							<dt>Identifiant</dt>
							<dd>#{target.id}</dd>
						</div>
					</dl>

					{lastResult && (
						<p className="ad-alert ad-alert--success" role="status">
							<CheckCircle2 size={16} />
							<span>
								Rôle de <strong>{lastResult.username}</strong> modifié :{" "}
								{ROLE_LABELS[lastResult.previous_role] ?? lastResult.previous_role} →{" "}
								<strong>{ROLE_LABELS[lastResult.role] ?? lastResult.role}</strong>.
								Effet immédiat, sans reconnexion.
							</span>
						</p>
					)}

					{isSelf ? (
						<p className="ad-alert ad-alert--info">
							<AlertTriangle size={16} />
							<span>C'est ton propre compte : un administrateur ne peut pas modifier son propre rôle.</span>
						</p>
					) : (
						<div className="ad-role-form">
							<h3 className="ad-subtitle">Changer le rôle</h3>
							<div className="ad-role-fields">
								<label className="ad-field">
									<span>Nouveau rôle</span>
									<select
										value={role}
										onChange={(e) => {
											setRole(e.target.value as UserRole | "");
											setIsConfirming(false);
											setErrorMessage(null);
										}}
									>
										<option value="">Choisir un rôle...</option>
										{ASSIGNABLE_ROLES.map((r) => (
											<option key={r} value={r} disabled={r === target.role}>
												{ROLE_LABELS[r]}{r === target.role ? " (actuel)" : ""}
											</option>
										))}
									</select>
								</label>
								<label className="ad-field ad-field--grow">
									<span>Raison (facultatif)</span>
									<input
										type="text"
										value={reason}
										maxLength={200}
										placeholder="Ex. professeur vérifié, demande du 22/09"
										onChange={(e) => setReason(e.target.value)}
									/>
								</label>
							</div>

							{errorMessage && (
								<p className="ad-alert ad-alert--error" role="alert">
									<AlertTriangle size={16} />
									<span>{errorMessage}</span>
								</p>
							)}

							{!isConfirming ? (
								<div className="ad-actions">
									<button
										type="button"
										className="ad-btn ad-btn--primary"
										disabled={!canSubmit}
										onClick={() => setIsConfirming(true)}
									>
										Appliquer
									</button>
								</div>
							) : (
								<div className="ad-confirm" role="alertdialog" aria-label="Confirmer le changement de rôle">
									<p>
										Passer <strong>@{target.username}</strong> de{" "}
										<strong>{ROLE_LABELS[target.role]}</strong> à{" "}
										<strong>{role ? ROLE_LABELS[role] : ""}</strong> ?
										{role === "Admin" && " Ce compte aura tous les droits d'administration."}
									</p>
									<div className="ad-actions">
										<button
											type="button"
											className="ad-btn ad-btn--ghost"
											onClick={() => setIsConfirming(false)}
											disabled={changeRole.isPending}
										>
											Annuler
										</button>
										<button
											type="button"
											className="ad-btn ad-btn--danger"
											onClick={handleConfirm}
											disabled={changeRole.isPending}
										>
											{changeRole.isPending ? <Loader size={16} className="ad-spin" /> : null}
											Confirmer
										</button>
									</div>
								</div>
							)}
						</div>
					)}
				</section>
			)}
		</div>
	);
};

export default UserRoleManager;
