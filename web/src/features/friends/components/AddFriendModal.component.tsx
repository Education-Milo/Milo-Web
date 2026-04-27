import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus, Loader } from "lucide-react";
import {
	useSearchUsers,
	useUsersByUsernames,
} from "@shared/store/user/user.queries";
import { useSendFriendRequest } from "@features/friends/store/friend.queries";

interface AddFriendModalProps {
	onClose: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ onClose }) => {
	const [searchQuery, setSearchQuery] = useState("");

	const { data: results = [], isLoading } = useSearchUsers(searchQuery);
	const usersByUsername = useUsersByUsernames(results);
	const sendRequest = useSendFriendRequest();

	const handleSend = (friendId: number) => {
		sendRequest.mutate(friendId, {
			onSuccess: () => onClose(),
		});
	};

	return (
		<motion.div
			className="friends-overlay"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onClose}
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
				<p>Recherche un ami par son pseudo (2 caractères minimum).</p>

				<div className="friends-modal-search">
					<div className="search-icon-wrapper">
						{isLoading ? (
							<Loader size={18} className="search-icon spinning" />
						) : (
							<Search size={18} className="search-icon" />
						)}
					</div>
					<input
						type="text"
						placeholder="Pseudo de ton ami..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						autoFocus
					/>
				</div>

				{/* Résultats de recherche */}
				{results.length > 0 && (
					<ul className="friends-search-results">
						{results.map((username, index) => {
							const user = usersByUsername[index]?.data;
							const friendId = Number(user?.id);
							const cannotSend =
								sendRequest.isPending || !user || Number.isNaN(friendId);

							return (
								<li key={username} className="friends-search-result-item">
									<div className="result-avatar">
										{username?.toUpperCase()}
									</div>
									<span className="result-username">@{username}</span>
									<button
										className="friend-btn-accept"
										onClick={() => handleSend(friendId)}
										disabled={cannotSend}
										title="Envoyer une demande"
									>
										<UserPlus size={16} />
									</button>
								</li>
							);
						})}
					</ul>
				)}

				{searchQuery.length >= 2 && !isLoading && results.length === 0 && (
					<p className="friends-no-results">Aucun utilisateur trouvé.</p>
				)}

				<div className="friends-modal-actions">
					<button className="friends-btn-cancel" onClick={onClose}>
						Fermer
					</button>
				</div>
			</motion.div>
		</motion.div>
	);
};

export default AddFriendModal;
