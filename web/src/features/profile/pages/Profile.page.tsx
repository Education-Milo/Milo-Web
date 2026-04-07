import React from "react";
import "@features/profile/styles/ProfilePage.css";
import { useProfilePage } from "@features/profile/hooks/useProfilePage";
import ScreenLayout from "@shared/components/ScreenLayout.component";

const ProfilePage: React.FC = () => {
	const {
		isEditing,
		profile,
		tempProfile,
		user,
		handleInputChange,
		handleSave,
		handleCancel,
		startEditing,
		newInterest,
		setNewInterest,
		handleAdd,
		handleDelete,
	} = useProfilePage();

	return (
		<>
			<ScreenLayout>
				<div className="profile-container">
					<section className="profile-header">
						<div className="profile-header-content">
							<div className="profile-picture-section">
								<div className="profile-picture-container">
									<div className="profile-picture-placeholder">👤</div>
								</div>
							</div>
							<div className="profile-info">
								<h1 className="profile-name">
									{profile.first_name} {profile.last_name}
								</h1>
								<p className="profile-level">Niveau 1</p>
								<p className="profile-classe">
									Classe {profile.classe?.toLowerCase()}
								</p>
								<p className="profile-username">@{profile.username}</p>
							</div>

							<div className="profile-actions">
								{!isEditing ? (
									<button className="edit-btn" onClick={startEditing}>
										✏️ Modifier le profil
									</button>
								) : (
									<div className="edit-actions">
										<button className="save-btn" onClick={handleSave}>
											✅ Sauvegarder
										</button>
										<button className="cancel-btn" onClick={handleCancel}>
											❌ Annuler
										</button>
									</div>
								)}
							</div>
						</div>
					</section>
					<section className="profile-form-section">
						<div className="section-header">
							<h2 className="section-title">📝 Informations personnelles</h2>
						</div>

						<div className="profile-form">
							<div className="form-row">
								<div className="form-group">
									<label className="form-label">Prénom</label>
									<input
										type="text"
										className="form-input"
										value={tempProfile.first_name}
										onChange={(e) =>
											handleInputChange("first_name", e.target.value)
										}
										disabled={!isEditing}
									/>
								</div>
								<div className="form-group">
									<label className="form-label">Nom</label>
									<input
										type="text"
										className="form-input"
										value={tempProfile.last_name}
										onChange={(e) =>
											handleInputChange("last_name", e.target.value)
										}
										disabled={!isEditing}
									/>
								</div>
							</div>

							<div className="form-row">
								<div className="form-group">
									<label className="form-label">Email</label>
									<input
										type="email"
										className="form-input"
										value={tempProfile.email}
										onChange={(e) => handleInputChange("email", e.target.value)}
										disabled={!isEditing}
									/>
								</div>
								<div className="form-group">
									<label className="form-label">Classe</label>
									<select
										className="form-input"
										value={tempProfile.classe}
										onChange={(e) =>
											handleInputChange("classe", e.target.value)
										}
										disabled={!isEditing}
									>
										<option value="" disabled>
											Sélectionnez votre classe
										</option>
										<option value="6eme">6ème</option>
										<option value="5eme">5ème</option>
										<option value="4eme">4ème</option>
										<option value="3eme">3ème</option>
									</select>
								</div>
							</div>
						</div>
					</section>
					<section className="profile-interests-section">
						<div className="section-header">
							<h2 className="section-title">🧡 Mes centres d'intérêt</h2>
						</div>

						{/* On ajoute une classe 'disabled-overlay' si on n'est pas en mode édition */}
						<div
							className={`interests-content ${!isEditing ? "content-disabled" : ""}`}
						>
							<div className="interests-grid">
								{user?.Interests && user.Interests.length > 0 ? (
									user.Interests.map((interest) => (
										<div key={interest.id} className="interest-item-tag">
											{interest.name}
											{/* On cache ou désactive aussi la croix de suppression */}
											{isEditing && (
												<button
													className="interest-delete-btn"
													onClick={() => handleDelete(interest.id)}
													title="Supprimer"
												>
													✕
												</button>
											)}
										</div>
									))
								) : (
									<p className="no-interests">
										Aucun intérêt renseigné pour le moment.
									</p>
								)}
							</div>

							{/* Input et Bouton + désactivés si pas isEditing */}
							<div className="interest-add-container">
								<input
									type="text"
									className="interest-input"
									placeholder={
										isEditing
											? "Ajouter un centre d'intérêt..."
											: "Cliquez sur modifier pour ajouter"
									}
									value={newInterest}
									onChange={(e) => setNewInterest(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleAdd()}
									disabled={!isEditing}
								/>
								<button
									className="interest-plus-btn"
									onClick={() => handleAdd()}
									disabled={!isEditing}
								>
									+
								</button>
							</div>
							{/* Section suggestions : On peut la cacher complètement ou la griser */}
							{isEditing && (
								<div className="interest-suggestions">
									<p className="suggestions-label">Suggestions :</p>
									<div className="suggestions-flex">
										{["Jeux Vidéo", "Football", "Mangas", "Histoire"].map(
											(name) => (
												<button
													key={name}
													className="suggestion-tag"
													onClick={() => handleAdd(name)}
												>
													+ {name}
												</button>
											),
										)}
									</div>
								</div>
							)}
						</div>
					</section>
					<section className="profile-stats-section">
						<div className="section-header">
							<h2 className="section-title">📊 Statistiques</h2>
						</div>

						<div className="stats-grid">
							<div className="stat-card">
								<div className="stat-icon">🏆</div>
								<h4>Succès obtenus</h4>
								<p>{0}</p>
							</div>
							<div className="stat-card">
								<div className="stat-icon">📚</div>
								<h4>Cours terminés</h4>
								<p>{0}</p>
							</div>
							<div className="stat-card">
								<div className="stat-icon">⚡</div>
								<h4>Points totaux</h4>
								<p>{0}</p>
							</div>
							<div className="stat-card">
								<div className="stat-icon">🔥</div>
								<h4>Série actuelle</h4>
								<p>{0} jours</p>
							</div>
						</div>
					</section>
				</div>
			</ScreenLayout>
		</>
	);
};

export default ProfilePage;
