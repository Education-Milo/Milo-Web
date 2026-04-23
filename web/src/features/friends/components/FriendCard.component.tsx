import React from "react";
import { motion } from "framer-motion";
import { Flame, MessageCircle, Star } from "lucide-react";
import { Friend } from "../types";

interface FriendCardProps {
	friend: Friend;
	onToggleBestFriend: (id: number) => void;
	variants?: any;
}

const FriendCard: React.FC<FriendCardProps> = ({ friend, onToggleBestFriend, variants }) => {
	return (
		<motion.div
			layout
			variants={variants}
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

			{friend.interests && friend.interests.length > 0 && (
				<div className="friend-interests">
					{friend.interests.map((interest, idx) => (
						<span key={idx} className="friend-interest-chip">
							{interest}
						</span>
					))}
				</div>
			)}

			<div className="friend-actions">
				<button
					className={`friend-btn-star ${friend.isBestFriend ? "active" : ""}`}
					onClick={() => onToggleBestFriend(friend.id)}
					title="Meilleur ami"
				>
					<Star size={18} fill={friend.isBestFriend ? "currentColor" : "none"} />
				</button>
				<button className="friend-btn-msg" title="Envoyer un message">
					<MessageCircle size={18} />
				</button>
			</div>
		</motion.div>
	);
};

export default FriendCard;
