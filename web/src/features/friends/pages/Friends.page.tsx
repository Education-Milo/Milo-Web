import React from "react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Users, UserPlus, Search, Star, Clock } from "lucide-react";
import FriendCard from "@features/friends/components/FriendCard.component";
import AddFriendModal from "@features/friends/components/AddFriendModal.component";
import {
	useFriends,
	type FriendsTab,
} from "@features/friends/hooks/useFriends";
import "@features/friends/styles/Friends.css";

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.1, delayChildren: 0.1 },
	},
};

const itemVariants = {
	hidden: { y: 20, opacity: 0, scale: 0.95 },
	visible: {
		y: 0,
		opacity: 1,
		scale: 1,
		transition: { type: "spring", stiffness: 120, damping: 14 },
	},
};

const TABS: FriendsTab[] = ["Tous", "En attente", "Meilleurs amis"];

const FriendsPage: React.FC = () => {
	const {
		friends,
		filteredFriends,
		pendingFriends,
		searchQuery,
		setSearchQuery,
		activeTab,
		setActiveTab,
		isAddModalOpen,
		setIsAddModalOpen,
		toggleBestFriend,
		acceptFriend,
		deleteFriend,
		isLoading,
	} = useFriends();

	return (
		<ScreenLayout>
			<div className="friends-viewport">
				<div className="friends-bg-glow" />

				<main className="friends-content-area">
					{/* EN-TÊTE */}
					<motion.header
						className="friends-pimped-header"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<div className="header-left">
							<h1 className="page-title">
								<Users className="sparkle-icon" /> Mes Amis
							</h1>
							<p className="page-subtitle">
								Joue et progresse avec tes amis Milo !
							</p>
						</div>

						<div className="header-actions">
							<motion.button
								className="btn-add-pimped"
								onClick={() => setIsAddModalOpen(true)}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<UserPlus size={18} /> <span>Ajouter</span>
							</motion.button>
							<div className="friends-score-pimped">
								<Users className="icon-crown-animated" size={22} />
								<span className="score-val">{friends.length}</span>
							</div>
						</div>
					</motion.header>

					{/* RECHERCHE ET FILTRES */}
					<motion.div
						className="friends-controls"
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ delay: 0.2 }}
					>
						<div className="friends-search-box">
							<div className="search-icon-wrapper">
								<Search size={18} className="search-icon" />
							</div>
							<input
								type="text"
								placeholder="Rechercher un ami..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="friends-search-input"
							/>
						</div>

						<div className="friends-tabs">
							{TABS.map((tab) => (
								<button
									key={tab}
									className={`friends-tab ${activeTab === tab ? "active" : ""}`}
									onClick={() => setActiveTab(tab)}
								>
									{tab === "Meilleurs amis" && (
										<Star size={14} className="tab-icon" />
									)}
									{tab}
									{/* Badge sur "En attente" si des demandes existent */}
									{tab === "En attente" && pendingFriends.length > 0 && (
										<span className="tab-badge">{pendingFriends.length}</span>
									)}
									{activeTab === tab && (
										<motion.div
											layoutId="friendsTabIndicator"
											className="friends-tab-indicator"
											transition={{
												type: "spring",
												stiffness: 300,
												damping: 30,
											}}
										/>
									)}
								</button>
							))}
						</div>
					</motion.div>

					{/* LISTE */}
					<div className="friends-grid-container">
						{isLoading ? (
							<div className="friends-loading">
								<div className="friends-loading-spinner" />
								<p>Chargement de tes amis...</p>
							</div>
						) : (
							<LayoutGroup>
								<motion.div
									className="friends-grid"
									variants={containerVariants}
									initial="hidden"
									animate="visible"
								>
									<AnimatePresence mode="popLayout">
										{filteredFriends.map((friend) => (
											<FriendCard
												key={friend.id}
												friend={friend}
												onToggleBestFriend={toggleBestFriend}
												onAccept={acceptFriend}
												onDelete={deleteFriend}
												isPending={activeTab === "En attente"}
												variants={itemVariants}
											/>
										))}
									</AnimatePresence>

									{filteredFriends.length === 0 && !isLoading && (
										<motion.div
											className="friends-empty-state"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
										>
											{activeTab === "En attente" ? (
												<>
													<Clock size={48} className="empty-icon" />
													<p>Aucune demande d'ami en attente.</p>
												</>
											) : (
												<>
													<Users size={48} className="empty-icon" />
													<p>Aucun ami trouvé.</p>
												</>
											)}
										</motion.div>
									)}
								</motion.div>
							</LayoutGroup>
						)}
					</div>
				</main>

				{/* MODAL AJOUTER UN AMI */}
				<AnimatePresence>
					{isAddModalOpen && (
						<AddFriendModal onClose={() => setIsAddModalOpen(false)} />
					)}
				</AnimatePresence>
			</div>
		</ScreenLayout>
	);
};

export default FriendsPage;
