import React from "react";
import { motion } from "framer-motion";
import { Star, UserCheck, UserX, Flame, Clock } from "lucide-react";
import type { FriendWithDetails } from "@features/friends/hooks/useFriendDetails";
import type { FriendEnriched } from "@features/friends/store/friend.model";

interface FriendCardProps {
	friend: FriendWithDetails | FriendEnriched;
	onToggleBestFriend: (id: number) => void;
	onAccept: (id: number) => void;
	onDelete: (id: number) => void;
	isPending?: boolean;
	variants?: any;
}

const FriendCard: React.FC<FriendCardProps> = ({
	friend,
	onToggleBestFriend,
	onAccept,
	onDelete,
	isPending = false,
	variants,
}) => {
	const initials =
		`${friend.friend_first_name[0] ?? ""}${friend.friend_last_name[0] ?? ""}`.toUpperCase();

	const isBestFriend = friend.isBestFriend;
	const otherUserId = friend.direction === "received" ? friend.user_id : friend.friend_id;

	const details = "classe" in friend ? friend as FriendWithDetails : null;

	return (
		<motion.div
			layout
			variants={variants}
			className={`friend-card ${isPending ? "friend-card--pending" : ""}`}
			whileHover={{ y: -5, scale: 1.02 }}
		>
			<div className="friend-card-bg" />

			{/* AVATAR */}
			<div className="friend-avatar-wrap">
				<span className="friend-avatar">{initials}</span>
			</div>

			{/* INFOS */}
			<div className="friend-info">
				<h3 className="friend-name">
					{friend.friend_first_name} {friend.friend_last_name}
				</h3>

				{details?.classe && (
					<span className="friend-level">Classe : {details.classe[0]}ème</span>
				)}
			</div>

				{/* Retirer la streak remplacer par l'xp parce qu'existe pas encore dans le back */}
				{details?.xp !== undefined && (
					<div className="friend-stats" >
						<div className="friend-streak">
							<Flame size={14} className={details.xp > 0 ? "hot" : ""} />
							<span>{details.xp}</span>
						</div>
					</div>
				)}

				{ details?.interests && details.interests.length > 0 ? (
					<div className="friend-interests">
						{details.interests.map((interest) => (
							<span key={interest.id} className="friend-interest-chip">
								{interest.name}
							</span>
						))}
					</div>
				) : (
					<div className="friend-interests friend-interests--empty">
						Aucun intérêt renseigné
					</div>
				)}

			{/* ACTIONS selon état */}
			{isPending && friend.direction === "received" ? (
				<div className="friend-actions friend-actions--pending">
					<button
						className="friend-btn-accept"
						onClick={() => onAccept(otherUserId)}
						title="Accepter"
					>
						<UserCheck size={18} />
						<span>Accepter</span>
					</button>
					<button
						className="friend-btn-decline"
						onClick={() => onDelete(otherUserId)}
						title="Refuser"
					>
						<UserX size={18} />
					</button>
				</div>
			) : isPending && friend.direction === "sent" ? (
				<div className="friend-actions friend-actions--pending">
					<div className="friend-btn-accept" style={{ background: '#F3F4F6', color: '#6B7280', boxShadow: 'none', cursor: 'default' }}>
						<Clock size={18} />
						<span>En attente</span>
					</div>
					<button
						className="friend-btn-decline"
						onClick={() => onDelete(otherUserId)}
						title="Annuler la demande"
					>
						<UserX size={18} />
					</button>
				</div>
			) : (
				<div className="friend-actions">
					<button
						className={`friend-btn-star ${isBestFriend ? "active" : ""}`}
						onClick={() => onToggleBestFriend(otherUserId)}
						title={isBestFriend ? "Retirer des favoris" : "Meilleur ami"}
					>
						<Star size={18} fill={isBestFriend ? "currentColor" : "none"} />
					</button>
					<button
						className="friend-btn-decline"
						onClick={() => onDelete(otherUserId)}
						title="Supprimer l'ami"
					>
						<UserX size={18} />
					</button>
				</div>
			)}
		</motion.div>
	);
};

export default FriendCard;