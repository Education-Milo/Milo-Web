import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

interface AddFriendModalProps {
	onClose: () => void;
	onAdd: (pseudo: string) => void;
}

const AddFriendModal: React.FC<AddFriendModalProps> = ({ onClose, onAdd }) => {
	const [addSearchQuery, setAddSearchQuery] = useState("");

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
				<p>Recherche un ami par son pseudo pour l'ajouter à ta liste.</p>
				
				<div className="friends-modal-search">
					<div className="search-icon-wrapper">
						<Search size={18} className="search-icon" />
					</div>
					<input
						type="text"
						placeholder="Pseudo de ton ami..."
						value={addSearchQuery}
						onChange={(e) => setAddSearchQuery(e.target.value)}
						autoFocus
					/>
				</div>

				<div className="friends-modal-actions">
					<button className="friends-btn-cancel" onClick={onClose}>
						Annuler
					</button>
					<button
						className="friends-btn-confirm"
						onClick={() => onAdd(addSearchQuery)}
						disabled={addSearchQuery.trim() === ""}
					>
						Rechercher
					</button>
				</div>
			</motion.div>
		</motion.div>
	);
};

export default AddFriendModal;
