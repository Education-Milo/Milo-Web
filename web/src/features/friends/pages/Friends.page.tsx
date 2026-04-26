import React from "react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Users, UserPlus, Search, Star } from "lucide-react";
import FriendCard from "../components/FriendCard.component";
import AddFriendModal from "../components/AddFriendModal.component";
import { useFriends } from "../hooks/useFriends";
import type { FriendsTab } from "../hooks/useFriends";
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

const FriendsPage: React.FC = () => {
	const {
		friends,
		filteredFriends,
		searchQuery,
		setSearchQuery,
		activeTab,
		setActiveTab,
		isAddModalOpen,
		setIsAddModalOpen,
		toggleBestFriend,
		simulateAddFriend,
	} = useFriends();

	return (
		<ScreenLayout>
			<div className="friends-viewport">
				{/* --- ARRIÈRE-PLAN ANIMÉ --- */}
				<div className="friends-bg-glow" />

				<main className="friends-content-area">
					{/* --- EN-TÊTE TYPE MON MILO --- */}
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

					{/* --- RECHERCHE ET FILTRES --- */}
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
							{(["Tous", "En ligne", "Meilleurs amis"] as FriendsTab[]).map((tab) => (
								<button
									key={tab}
									className={`friends-tab ${activeTab === tab ? "active" : ""}`}
									onClick={() => setActiveTab(tab)}
								>
									{tab === "Meilleurs amis" && <Star size={14} className="tab-icon" />}
									{tab}
									{activeTab === tab && (
										<motion.div
											layoutId="friendsTabIndicator"
											className="friends-tab-indicator"
											transition={{ type: "spring", stiffness: 300, damping: 30 }}
										/>
									)}
								</button>
							))}
						</div>
					</motion.div>

					{/* --- LISTE DES AMIS --- */}
					<div className="friends-grid-container">
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
											variants={itemVariants}
										/>
									))}
								</AnimatePresence>

								{filteredFriends.length === 0 && (
									<motion.div
										className="friends-empty-state"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
									>
										<Users size={48} className="empty-icon" />
										<p>Aucun ami trouvé pour cette recherche.</p>
									</motion.div>
								)}
							</motion.div>
						</LayoutGroup>
					</div>
				</main>

				{/* --- MODAL AJOUTER UN AMI --- */}
				<AnimatePresence>
					{isAddModalOpen && (
						<AddFriendModal
							onClose={() => setIsAddModalOpen(false)}
							onAdd={simulateAddFriend}
						/>
					)}
				</AnimatePresence>
			</div>
		</ScreenLayout>
	);
};

export default FriendsPage;
