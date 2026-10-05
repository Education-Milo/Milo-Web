import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader } from "lucide-react";
import { useUserStore } from "@shared/store/user/user.store";
import type { UserRole } from "@shared/store/user/user.model";
import {
	ASSIGNABLE_ROLES,
	ROLE_LABELS,
	type AdminUserRow,
	type ChangeRoleResponse,
} from "@features/admin/store/admin.model";
import { getAdminErrorMessage, useChangeUserRole } from "@features/admin/store/admin.queries";

interface UserRoleFormProps {
	user: Pick<AdminUserRow, "id" | "username" | "role">;
	onChanged?: (result: ChangeRoleResponse) => void;
}

/** Changement de rôle du compte ouvert dans le support. */
const UserRoleForm: React.FC<UserRoleFormProps> = ({ user, onChanged }) => {
	const me = useUserStore((state) => state.user);
	const [role, setRole] = useState<UserRole | "">("");
	const [reason, setReason] = useState("");
	const [isConfirming, setIsConfirming] = useState(false);
	const [lastResult, setLastResult] = useState<ChangeRoleResponse | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const changeRole = useChangeUserRole();

	const isSelf = Boolean(me && String(user.id) === String(me.id));
	const canSubmit = Boolean(role && role !== user.role && !changeRole.isPending);

	const handleConfirm = () => {
		if (!role) return;
		setErrorMessage(null);
		changeRole.mutate(
			{ userId: user.id, role, reason },
			{
				onSuccess: (data) => {
					setLastResult(data);
					setIsConfirming(false);
					setRole("");
					setReason("");
					onChanged?.(data);
				},
				onError: (error) => {
					setErrorMessage(getAdminErrorMessage(error));
					setIsConfirming(false);
				},
			},
		);
	};

	return (
		<div className="ad-role-form">
			<h3 className="ad-subtitle">Changer le rôle</h3>

			{lastResult && (
				<p className="ad-alert ad-alert--success" role="status">
					<CheckCircle2 size={16} />
					<span>
						Rôle modifié : {ROLE_LABELS[lastResult.previous_role] ?? lastResult.previous_role} →{" "}
						<strong>{ROLE_LABELS[lastResult.role] ?? lastResult.role}</strong>. Effet immédiat, sans reconnexion.
					</span>
				</p>
			)}

			{isSelf ? (
				<p className="ad-alert ad-alert--info">
					<AlertTriangle size={16} />
					<span>C'est ton propre compte : un administrateur ne peut pas modifier son propre rôle.</span>
				</p>
			) : (
				<>
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
									<option key={r} value={r} disabled={r === user.role}>
										{ROLE_LABELS[r]}{r === user.role ? " (actuel)" : ""}
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
								Passer <strong>@{user.username}</strong> de <strong>{ROLE_LABELS[user.role]}</strong> à{" "}
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
				</>
			)}
		</div>
	);
};

export default UserRoleForm;
