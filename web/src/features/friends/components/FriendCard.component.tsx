import React from "react";
import { motion } from "framer-motion";
import { Star, UserCheck, UserX, Flame, Clock, Zap } from "lucide-react";
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
				<span className="friend-card-avatar-text">{initials}</span>
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

				{(details?.streak !== undefined || details?.xp !== undefined) && (
					<div className="friend-stats">
						{details?.streak !== undefined && (
							<div
								className="friend-streak"
								title={`${details.streak} jour${details.streak > 1 ? "s" : ""} de suite`}
							>
								<Flame size={14} className={details.streak > 0 ? "hot" : ""} />
								<span>{details.streak}</span>
							</div>
						)}
						{details?.xp !== undefined && (
							<div className="friend-xp" title={`${details.xp} XP`}>
								<Zap size={14} />
								<span>{details.xp} XP</span>
							</div>
						)}
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
						onClick={() => onAccept(friend.id)}
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