import React, { useState } from "react";
import ScreenLayout from "@shared/components/ScreenLayout.component";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Users, UserPlus, Search, Flame, MessageCircle, Star } from "lucide-react";
import "@features/friends/styles/Friends.css";

interface Friend {
	id: number;
	name: string;
	avatar: string;
	level: string;
	streak: number;
	isOnline: boolean;
	isBestFriend: boolean;
}

const INITIAL_FRIENDS: Friend[] = [
	{ id: 1, name: "Léo", avatar: "🧑‍🦱", level: "6ème", streak: 12, isOnline: true, isBestFriend: true },
	{ id: 2, name: "Emma", avatar: "👩‍🦰", level: "5ème", streak: 3, isOnline: false, isBestFriend: false },
	{ id: 3, name: "Lucas", avatar: "👦", level: "6ème", streak: 25, isOnline: true, isBestFriend: true },
	{ id: 4, name: "Chloé", avatar: "👧", level: "4ème", streak: 0, isOnline: false, isBestFriend: false },
	{ id: 5, name: "Hugo", avatar: "👱", level: "3ème", streak: 7, isOnline: true, isBestFriend: false },
];

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
	const [friends, setFriends] = useState<Friend[]>(INITIAL_FRIENDS);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<"Tous" | "En ligne" | "Meilleurs amis">("Tous");
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [addSearchQuery, setAddSearchQuery] = useState("");

	const filteredFriends = friends.filter((friend) => {
		const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesTab =
			activeTab === "Tous" ||
			(activeTab === "En ligne" && friend.isOnline) ||
			(activeTab === "Meilleurs amis" && friend.isBestFriend);
		return matchesSearch && matchesTab;
	});

	const toggleBestFriend = (id: number) => {
		setFriends((prev) =>
			prev.map((f) => (f.id === id ? { ...f, isBestFriend: !f.isBestFriend } : f))
		);
	};

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
							<Search size={18} className="search-icon" />
							<input
								type="text"
								placeholder="Rechercher un ami..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="friends-search-input"
							/>
						</div>

						<div className="friends-tabs">
							{(["Tous", "En ligne", "Meilleurs amis"] as const).map((tab) => (
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
										<motion.div
											key={friend.id}
											layout
											variants={itemVariants}
											className="friend-card"
											whileHover={{ y: -5, scale: 1.02 }}
										>
											<div className="friend-card-bg" />
											<div className="friend-avatar-wrap">
												<span className="friend-avatar">{friend.avatar}</span>
												<div
													className={`friend-status ${
														friend.isOnline ? "online" : "offline"
													}`}
												/>
											</div>

											<div className="friend-info">
												<h3 className="friend-name">{friend.name}</h3>
												<span className="friend-level">Classe : {friend.level}</span>
											</div>

											<div className="friend-stats">
												<div className="friend-streak" title={`${friend.streak} jours de suite`}>
													<Flame size={16} className={friend.streak > 0 ? "hot" : ""} />
													<span>{friend.streak}</span>
												</div>
											</div>

											<div className="friend-actions">
												<button
													className={`friend-btn-star ${friend.isBestFriend ? "active" : ""}`}
													onClick={() => toggleBestFriend(friend.id)}
													title="Meilleur ami"
												>
													<Star size={18} fill={friend.isBestFriend ? "currentColor" : "none"} />
												</button>
												<button className="friend-btn-msg" title="Envoyer un message">
													<MessageCircle size={18} />
												</button>
											</div>
										</motion.div>
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
						<motion.div
							className="friends-overlay"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setIsAddModalOpen(false)}
						>
							<motion.div
								className="friends-modal"
								initial={{ scale: 0.8, y: 50, opacity: 0 }}
								animate={{ scale: 1, y: 0, opacity: 1 }}
								exit={{ scale: 0.8, opacity: 0 }}
								onClick={(e) => e.stopPropagation()}
							>
								<div className="modal-glow" />
								<h3>Ajouter un nouvel ami</h3>
								<p>Recherche un ami par son pseudo pour l'ajouter à ta liste.</p>
								
								<div className="friends-modal-search">
									<Search size={18} className="search-icon" />
									<input
										type="text"
										placeholder="Pseudo de ton ami..."
										value={addSearchQuery}
										onChange={(e) => setAddSearchQuery(e.target.value)}
										autoFocus
									/>
								</div>

								<div className="friends-modal-actions">
									<button
										className="friends-btn-cancel"
										onClick={() => setIsAddModalOpen(false)}
									>
										Annuler
									</button>
									<button
										className="friends-btn-confirm"
										onClick={() => {
											// Simulation d'ajout
											setIsAddModalOpen(false);
											setAddSearchQuery("");
										}}
										disabled={addSearchQuery.trim() === ""}
									>
										Rechercher
									</button>
								</div>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</ScreenLayout>
	);
};

export default FriendsPage;
