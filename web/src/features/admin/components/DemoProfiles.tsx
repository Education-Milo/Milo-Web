import React, { useState } from "react";
import { AlertTriangle, FlaskConical, Loader, LogIn, Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@shared/store/auth/auth.store";
import { showToast } from "@shared/store/toast/toast.store";
import type { UserRole } from "@shared/store/user/user.model";
import { DEMO_ROLES, ROLE_LABELS, type DemoAccount } from "@features/admin/store/admin.model";
import {
	getAdminErrorMessage,
	useCreateDemoAccount,
	useDeleteDemoAccount,
	useDemoAccounts,
} from "@features/admin/store/admin.queries";

const CLASSES = [
	{ value: "6eme", label: "6ème" },
	{ value: "5eme", label: "5ème" },
	{ value: "4eme", label: "4ème" },
	{ value: "3eme", label: "3ème" },
];

const DemoProfiles: React.FC = () => {
	const enterDemo = useAuthStore((state) => state.enterDemo);
	const { data: accounts = [], isLoading, isError, error } = useDemoAccounts();
	const createMutation = useCreateDemoAccount();
	const deleteMutation = useDeleteDemoAccount();

	const [role, setRole] = useState<UserRole>("Enfant");
	const [classe, setClasse] = useState("6eme");
	const [switchingId, setSwitchingId] = useState<number | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate(
			{ role, class_: role === "Enfant" ? classe : null },
			{
				onSuccess: (account) =>
					showToast(`Profil de démo « ${account.username} » créé (${ROLE_LABELS[account.role]}).`, "success"),
				onError: (err) => showToast(getAdminErrorMessage(err), "error"),
			},
		);
	};

	const handleSwitch = async (account: DemoAccount) => {
		setSwitchingId(account.id);
		try {
			// Recharge la page dans la peau du profil de démo
			await enterDemo(account.id);
		} catch (err) {
			setSwitchingId(null);
			showToast(getAdminErrorMessage(err), "error");
		}
	};

	const handleDelete = (account: DemoAccount) => {
		deleteMutation.mutate(account.id, {
			onSuccess: () => {
				showToast(`Profil « ${account.username} » supprimé.`, "success");
				setConfirmDelete(null);
			},
			onError: (err) => {
				showToast(getAdminErrorMessage(err), "error");
				setConfirmDelete(null);
			},
		});
	};

	return (
		<div className="ad-demo">
			<section className="ad-card">
				<h2 className="ad-subtitle"><FlaskConical size={16} /> Profils de démonstration</h2>
				<p className="ad-muted ad-demo-intro">
					Des comptes fictifs, jamais de vrais utilisateurs, pour parcourir l'application dans la peau d'un
					élève, d'un parent ou d'un professeur. Pendant la bascule, le panel admin n'est plus accessible :
					un bandeau en haut de l'écran permet de revenir à ton compte à tout moment.
				</p>

				<form className="ad-demo-form" onSubmit={handleCreate}>
					<label className="ad-field">
						<span>Rôle</span>
						<select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
							{DEMO_ROLES.map((r) => (
								<option key={r} value={r}>{ROLE_LABELS[r]}</option>
							))}
						</select>
					</label>
					{role === "Enfant" && (
						<label className="ad-field">
							<span>Classe</span>
							<select value={classe} onChange={(e) => setClasse(e.target.value)}>
								{CLASSES.map((c) => (
									<option key={c.value} value={c.value}>{c.label}</option>
								))}
							</select>
						</label>
					)}
					<button type="submit" className="ad-btn ad-btn--primary" disabled={createMutation.isPending}>
						{createMutation.isPending ? <Loader size={16} className="ad-spin" /> : <Plus size={16} />}
						Créer un profil
					</button>
				</form>
			</section>

			<section className="ad-card">
				<h2 className="ad-subtitle">Profils disponibles ({accounts.length})</h2>
				{isLoading && <p className="ad-muted">Chargement...</p>}
				{isError && <p className="ad-alert ad-alert--error">{getAdminErrorMessage(error)}</p>}
				{!isLoading && !isError && accounts.length === 0 && (
					<p className="ad-muted">Aucun profil de démo. Crée-en un ci-dessus.</p>
				)}
				{accounts.length > 0 && (
					<ul className="ad-demo-list">
						{accounts.map((account) => (
							<li key={account.id} className="ad-demo-row">
								<span className={`ad-role-badge ad-role-badge--${account.role}`}>{ROLE_LABELS[account.role] ?? account.role}</span>
								<div className="ad-user-cell">
									<strong>@{account.username}</strong>
									<span className="ad-muted">
										{account.class_ ? `Classe ${account.class_} · ` : ""}#{account.id}
									</span>
								</div>
								<div className="ad-demo-actions">
									{confirmDelete === account.id ? (
										<span className="ad-inline-confirm">
											<AlertTriangle size={14} />
											<span>Supprimer ?</span>
											<button
												type="button"
												className="ad-btn ad-btn--danger ad-btn--sm"
												onClick={() => handleDelete(account)}
												disabled={deleteMutation.isPending}
											>
												Oui
											</button>
											<button
												type="button"
												className="ad-btn ad-btn--ghost ad-btn--sm"
												onClick={() => setConfirmDelete(null)}
												disabled={deleteMutation.isPending}
											>
												Non
											</button>
										</span>
									) : (
										<button
											type="button"
											className="ad-btn ad-btn--ghost ad-btn--sm"
											onClick={() => setConfirmDelete(account.id)}
											disabled={switchingId !== null}
											title="Supprimer ce profil de démo"
										>
											<Trash2 size={14} /> Supprimer
										</button>
									)}
									<button
										type="button"
										className="ad-btn ad-btn--primary ad-btn--sm"
										onClick={() => void handleSwitch(account)}
										disabled={switchingId !== null}
										title={`Parcourir l'application en tant que ${ROLE_LABELS[account.role]}`}
									>
										{switchingId === account.id ? <Loader size={14} className="ad-spin" /> : <LogIn size={14} />}
										Basculer
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
};

export default DemoProfiles;
