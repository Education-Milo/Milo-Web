import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Loader } from "lucide-react";
import {
	useSearchUsers,
	useUsersByUsernames,
} from "@shared/store/user/user.queries";
import {
	useSendFriendRequest,
	useFriends as useFriendsQuery,
} from "@features/friends/store/friend.queries";

interface AddFriendModalProps {
	onClose: () => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ onClose }) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [sentFriendIds, setSentFriendIds] = useState<number[]>([]);
	const [errorFriendIds, setErrorFriendIds] = useState<number[]>([]);

	const { data: results = [], isLoading } = useSearchUsers(searchQuery);
	const usersByUsername = useUsersByUsernames(results);
	const sendRequest = useSendFriendRequest();
	const { data: allFriends = [] } = useFriendsQuery();

	const handleSend = (friendId: number) => {
		setErrorFriendIds((prev) => prev.filter((id) => id !== friendId));
		sendRequest.mutate(friendId, {
			onSuccess: () => {
				setSentFriendIds((prev) => [...prev, friendId]);
			},
			onError: () => {
				setErrorFriendIds((prev) => [...prev, friendId]);
			},
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
						{isLoading && (
							<Loader size={18} className="search-icon spinning" />
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

							const isSent = sentFriendIds.includes(friendId);
							const isError = errorFriendIds.includes(friendId);

							const existingRelation = allFriends.find(
								(f) => f.friend_id === friendId || f.user_id === friendId
							);
							const isPendingSent = existingRelation?.status === "pending" && existingRelation?.direction === "sent";
							const isPendingReceived = existingRelation?.status === "pending" && existingRelation?.direction === "received";
							const isAlreadyFriend = existingRelation?.status === "accepted";

							return (
								<li key={username} className="friends-search-result-item">
									<div className="result-avatar">
										{username?.substring(0, 2).toUpperCase()}
									</div>
									<span className="result-username">@{username}</span>
									<div className="result-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
										{isError && !isPendingSent && !isAlreadyFriend && (
											<span className="friend-request-error">Erreur lors de l'envoi</span>
										)}
										{isAlreadyFriend ? (
											<span className="friend-request-sent" style={{ background: '#E0F2FE', color: '#0284C7' }}>Déjà ami</span>
										) : isPendingSent || isSent ? (
											<span className="friend-request-sent">En attente</span>
										) : isPendingReceived ? (
											<span className="friend-request-sent" style={{ background: '#FEF3C7', color: '#D97706' }}>Demande reçue</span>
										) : (
											<button
												className="friend-btn-accept"
												onClick={() => handleSend(friendId)}
												disabled={cannotSend}
												title={isError ? "Réessayer" : "Envoyer une demande"}
											>
												<UserPlus size={16} />
											</button>
										)}
									</div>
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
