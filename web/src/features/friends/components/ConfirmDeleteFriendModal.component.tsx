import React from "react";
import { motion } from "framer-motion";
import { UserX, Loader } from "lucide-react";
import type { Friend } from "@features/friends/store/friend.model";

interface ConfirmDeleteFriendModalProps {
	friend: Friend;
	onConfirm: () => void;
	onCancel: () => void;
	isPending?: boolean;
}

const ConfirmDeleteFriendModal: React.FC<ConfirmDeleteFriendModalProps> = ({
	friend,
	onConfirm,
	onCancel,
	isPending = false,
}) => {
	const fullName = `${friend.friend_first_name} ${friend.friend_last_name}`.trim();

	return (
		<motion.div
			className="friends-overlay"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onCancel}
		>
			<motion.div
				className="friends-modal friends-confirm-modal"
				role="alertdialog"
				aria-labelledby="confirm-delete-friend-title"
				initial={{ scale: 0.8, y: 50, opacity: 0 }}
				animate={{ scale: 1, y: 0, opacity: 1 }}
				exit={{ scale: 0.8, opacity: 0 }}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-glow" />
				<div className="friends-confirm-icon">
					<UserX size={28} />
				</div>
				<h3 id="confirm-delete-friend-title">Supprimer cet ami ?</h3>
				<p>
					<strong>{fullName}</strong> ne fera plus partie de tes amis. Tu pourras
					lui renvoyer une demande plus tard.
				</p>
				<div className="friends-confirm-actions">
					<button
						type="button"
						className="friends-confirm-btn friends-confirm-btn--cancel"
						onClick={onCancel}
						disabled={isPending}
						autoFocus
					>
						Annuler
					</button>
					<button
						type="button"
						className="friends-confirm-btn friends-confirm-btn--danger"
						onClick={onConfirm}
						disabled={isPending}
					>
						{isPending ? <Loader size={16} className="spinning" /> : <UserX size={16} />}
						<span>Supprimer</span>
					</button>
				</div>
			</motion.div>
		</motion.div>
	);
};

export default ConfirmDeleteFriendModal;
