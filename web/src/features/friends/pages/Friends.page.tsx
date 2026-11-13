import React, { useState } from "react";
import { Link } from "react-router-dom";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { motion, AnimatePresence, LayoutGroup, useReducedMotion } from "framer-motion";
import { UserPlus, Search, Swords } from "lucide-react";
import FriendCard from "@features/friends/components/FriendCard.component";
import AddFriendModal from "@features/friends/components/AddFriendModal.component";
import ConfirmDeleteFriendModal from "@features/friends/components/ConfirmDeleteFriendModal.component";
import { getFriendDisplayName, getFriendInitials, getOtherUserId, type Friend } from "@features/friends/store/friend.model";
import type { FriendWithDetails } from "@features/friends/hooks/useFriendDetails";
import { useFriends, type FriendsTab } from "@features/friends/hooks/useFriends";
import MiloAvatar from "@shared/components/MiloAvatar.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import CountUp from "@shared/components/quiz/CountUp.component";
import "@features/friends/styles/Friends.css";

const TABS: { id: FriendsTab; label: string }[] = [
	{ id: "Tous", label: "Ma bande" },
	{ id: "Invitations", label: "Invitations" },
	{ id: "En attente", label: "Envoyées" },
];

const FriendsPage: React.FC = () => {
	const {
		friends,
		filteredFriends,
		pendingReceived,
		pendingSent,
		searchQuery,
		setSearchQuery,
		activeTab,
		setActiveTab,
		isAddModalOpen,
		setIsAddModalOpen,
		togglePin,
		acceptFriend,
		deleteFriend,
		isDeletingFriend,
		isLoading,
	} = useFriends();
	const reduceMotion = useReducedMotion();

	const isPendingTab = activeTab === "En attente" || activeTab === "Invitations";
	const [friendToDelete, setFriendToDelete] = useState<Friend | null>(null);

	const bestStreak = [...friends].sort((a, b) => (b.streak ?? 0) - (a.streak ?? 0))[0];

	// Supprimer un ami accepté demande confirmation ; refuser ou annuler
	// une invitation reste immédiat.
	const handleDeleteRequest = (friendUserId: number) => {
		if (isPendingTab) {
			deleteFriend(friendUserId);
			return;
		}
		const friend = friends.find((f) => getOtherUserId(f) === friendUserId);
		if (friend) setFriendToDelete(friend);
	};

	const handleConfirmDelete = () => {
		if (!friendToDelete) return;
		deleteFriend(getOtherUserId(friendToDelete));
		setFriendToDelete(null);
	};

	const squad = friends.slice(0, 5);
	const counts: Record<FriendsTab, number> = {
		Tous: friends.length,
		Invitations: pendingReceived.length,
		"En attente": pendingSent.length,
	};

	return (
		<ScreenLayout>
			<div className="fr">
				<div className="fr-top">
					{/* EN-TÊTE : ta bande */}
					<motion.section
						className="fr-hero"
						initial={reduceMotion ? false : { opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ type: "spring", stiffness: 200, damping: 20 }}
					>
						<span className="fr-hero__confetti" aria-hidden="true" />
						<div className="fr-hero__copy">
							<div className="fr-hero__titles">
								<h1 className="fr-hero__title">
									Mes <span className="fr-hl">amis</span>
								</h1>
								<p className="fr-hero__lead">Ta bande pour réviser ensemble et te lancer des défis.</p>
							</div>
							<div className="fr-hero__actions">
								<button type="button" className="fr-btn fr-btn--primary" onClick={() => setIsAddModalOpen(true)}>
									<UserPlus size={22} strokeWidth={2.6} aria-hidden="true" />
									Ajouter un ami
								</button>
								<Link to="/duels" className="fr-btn fr-btn--ghost">
									<Swords size={20} strokeWidth={2.6} aria-hidden="true" />
									Défier
								</Link>
							</div>
						</div>

						<div className="fr-squad">
							<div className="fr-squad__faces" aria-hidden="true">
								{squad.length === 0 ? (
									<span className="fr-squad__face fr-squad__face--empty">?</span>
								) : (
									squad.map((f, i) => (
										<motion.span
											key={f.id}
											className="fr-squad__face"
											style={{ zIndex: squad.length - i }}
											initial={reduceMotion ? false : { scale: 0, y: 20 }}
											animate={{ scale: 1, y: 0 }}
											transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.25 + i * 0.07 }}
										>
											<MiloAvatar equippedMeshNames={f.equipped_meshes} initials={getFriendInitials(f)} />
										</motion.span>
									))
								)}
								{friends.length > squad.length && <span className="fr-squad__more">+{friends.length - squad.length}</span>}
							</div>
							<p className="fr-squad__count">
								<CountUp value={friends.length} delay={0.3} />
								<span>{friends.length > 1 ? "amis" : "ami"}</span>
							</p>
							{bestStreak && (bestStreak.streak ?? 0) > 0 && (
								<p className="fr-squad__fact">
									<Emoji3D name="fire" />
									<span>
										Meilleure série : <b>{getFriendDisplayName(bestStreak)}</b>, {bestStreak.streak} jour{(bestStreak.streak ?? 0) > 1 ? "s" : ""}
									</span>
								</p>
							)}
						</div>
					</motion.section>
				</div>

				{/* ONGLETS ET RECHERCHE */}
				<div className="fr-controls">
					<div className="fr-tabs" role="tablist" aria-label="Filtrer mes amis">
						{TABS.map((tab) => (
							<button
								key={tab.id}
								type="button"
								role="tab"
								aria-selected={activeTab === tab.id}
								className={`fr-tab${activeTab === tab.id ? " is-active" : ""}`}
								onClick={() => setActiveTab(tab.id)}
							>
								{activeTab === tab.id && (
									<motion.span layoutId="frTab" className="fr-tab__bg" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
								)}
								<span className="fr-tab__label">{tab.label}</span>
								{counts[tab.id] > 0 && <span className="fr-tab__count">{counts[tab.id]}</span>}
							</button>
						))}
					</div>
					<label className="fr-search">
						<Search size={20} aria-hidden="true" />
						<span className="fr-sr-only">Rechercher un ami</span>
						<input
							type="search"
							placeholder="Rechercher un ami"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</label>
				</div>

				{/* LISTE */}
				{isLoading ? (
					<div className="fr-loading" role="status">
						<span className="fr-spinner" aria-hidden="true" />
						Chargement de ta bande…
					</div>
				) : (
					<LayoutGroup>
						<h2 className="sr-only">Liste de tes amis</h2>
						<motion.div className="fr-grid" layout>
							<AnimatePresence mode="popLayout">
								{filteredFriends.map((friend, i) => (
									<FriendCard
										key={friend.id}
										friend={friend}
										index={i}
										onTogglePin={togglePin}
										onAccept={acceptFriend}
										onDelete={handleDeleteRequest}
										isPending={isPendingTab}
									/>
								))}
							</AnimatePresence>
						</motion.div>
						{filteredFriends.length === 0 && (
							<motion.div className="fr-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
								{searchQuery.trim() ? (
									<>
										<Emoji3D name="bullseye" />
										<p>Personne ne correspond à « {searchQuery.trim()} ».</p>
									</>
								) : activeTab === "Invitations" ? (
									<>
										<Emoji3D name="speech_balloon" />
										<p>Aucune invitation pour l'instant.</p>
									</>
								) : activeTab === "En attente" ? (
									<>
										<Emoji3D name="spiral_calendar" />
										<p>Aucune demande en attente de réponse.</p>
									</>
								) : (
									<>
										<Emoji3D name="party_popper" />
										<p>Ta bande est encore vide. Invite ton premier ami !</p>
										<button type="button" className="fr-btn fr-btn--primary" onClick={() => setIsAddModalOpen(true)}>
											<UserPlus size={20} strokeWidth={2.6} aria-hidden="true" />
											Ajouter un ami
										</button>
									</>
								)}
							</motion.div>
						)}
					</LayoutGroup>
				)}

				<AnimatePresence>
					{isAddModalOpen && <AddFriendModal onClose={() => setIsAddModalOpen(false)} />}
				</AnimatePresence>

				<AnimatePresence>
					{friendToDelete && (
						<ConfirmDeleteFriendModal
							friend={friendToDelete as FriendWithDetails}
							onConfirm={handleConfirmDelete}
							onCancel={() => setFriendToDelete(null)}
							isPending={isDeletingFriend}
						/>
					)}
				</AnimatePresence>
			</div>
		</ScreenLayout>
	);
};

export default FriendsPage;
