import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Info, Link2, UserPlus, Users } from "lucide-react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { ROUTES } from "@shared/constants/routes";
import { profileRoleLabel } from "@features/account/utils/profile.format";
import ParentPageHeader from "@features/parent/components/ParentPageHeader";
import ParentEmptyState from "@features/parent/components/ParentEmptyState";
import { ChildAvatar, childFullName } from "@features/parent/components/ChildSwitcher";
import { LINK_BY_CODE_AVAILABLE, useLinkedChildren } from "@features/parent/store/parent.queries";
import { useParentStore } from "@features/parent/store/parent.store";
import "@features/parent/styles/Parent.css";

const ChildrenPage: React.FC = () => {
	const navigate = useNavigate();
	const { children, isLoading, isError, refetch } = useLinkedChildren();
	const selectChild = useParentStore((state) => state.selectChild);
	const [code, setCode] = useState("");

	const openFollowUp = (childId: number) => {
		selectChild(childId);
		navigate(ROUTES.PARENT.DASHBOARD);
	};

	const renderLinked = () => {
		if (isLoading) {
			return (
				<p className="pa-muted" role="status">
					Chargement…
				</p>
			);
		}
		if (isError) {
			return (
				<ParentEmptyState
					compact
					icon={AlertCircle}
					title="Impossible de charger vos comptes liés"
					action={
						<button type="button" className="pa-btn pa-btn--ghost pa-btn--sm" onClick={() => void refetch()}>
							Réessayer
						</button>
					}
				/>
			);
		}
		if (children.length === 0) {
			return (
				<ParentEmptyState compact icon={Users} title="Aucun enfant lié pour l'instant">
					Les comptes que vous liez apparaissent ici, avec leur classe.
				</ParentEmptyState>
			);
		}
		return (
			<ul className="pa-linked-list">
				{children.map((child) => (
					<li key={child.id} className="pa-linked">
						<ChildAvatar child={child} size="md" />
						<div className="pa-linked-text">
							<p className="pa-linked-name">{childFullName(child)}</p>
							<p className="pa-linked-meta">
								{profileRoleLabel(child)} · @{child.username}
							</p>
						</div>
						<button
							type="button"
							className="pa-btn pa-btn--ghost pa-btn--sm"
							onClick={() => openFollowUp(child.id)}
						>
							Voir le suivi<span className="sr-only"> de {child.first_name}</span>
						</button>
					</li>
				))}
			</ul>
		);
	};

	return (
		<ScreenLayout>
			<div className="pa-page">
				<ParentPageHeader
					eyebrow="Espace parent"
					title="Comptes liés"
					lead="Les enfants dont vous suivez le travail sur Milo."
				/>

				<div className="pa-columns">
					<section className="pa-card" aria-labelledby="pa-linked-title">
						<div className="pa-card-head">
							<h2 id="pa-linked-title" className="pa-card-title">
								<Users size={20} aria-hidden="true" />
								Enfants suivis
							</h2>
							{children.length > 0 && (
								<span className="pa-card-hint">
									{children.length} enfant{children.length > 1 ? "s" : ""}
								</span>
							)}
						</div>
						{renderLinked()}
					</section>

					<section className="pa-card" aria-labelledby="pa-link-title">
						<div className="pa-card-head">
							<h2 id="pa-link-title" className="pa-card-title">
								<Link2 size={20} aria-hidden="true" />
								Lier un compte élève
							</h2>
						</div>
						<p className="pa-text">
							Votre enfant génère un code depuis son profil Milo. Saisissez-le ici pour rattacher son compte
							au vôtre.
						</p>
						{/* Route de liaison absente de l'API : formulaire désactivé (voir parent.queries.ts) */}
						<form className="pa-form" onSubmit={(e) => e.preventDefault()} noValidate>
							<label htmlFor="pa-link-code" className="pa-label">
								Code de liaison
							</label>
							<div className="pa-input-row">
								<input
									id="pa-link-code"
									className="pa-input"
									value={code}
									onChange={(e) => setCode(e.target.value.toUpperCase())}
									disabled={!LINK_BY_CODE_AVAILABLE}
									autoComplete="off"
									autoCapitalize="characters"
									spellCheck={false}
									maxLength={16}
									aria-describedby="pa-link-code-note"
								/>
								<button type="submit" className="pa-btn pa-btn--primary" disabled={!LINK_BY_CODE_AVAILABLE}>
									Valider
								</button>
							</div>
							<p id="pa-link-code-note" className="pa-field-note">
								<Info size={16} aria-hidden="true" />
								<span>
									La liaison par code n'est pas encore ouverte. En attendant, ajoutez votre enfant comme
									profil de votre compte famille.
								</span>
							</p>
						</form>

						<hr className="pa-divider" />

						<h3 className="pa-subtitle">Créer le profil de votre enfant</h3>
						<p className="pa-text">
							Votre compte peut réunir plusieurs profils : chaque enfant y garde sa propre progression, et
							vous pouvez protéger chaque profil par un code PIN.
						</p>
						<Link to={ROUTES.PROFILE_MANAGE} className="pa-btn pa-btn--primary">
							<UserPlus size={18} aria-hidden="true" />
							Ajouter un profil enfant
						</Link>
					</section>
				</div>
			</div>
		</ScreenLayout>
	);
};

export default ChildrenPage;
