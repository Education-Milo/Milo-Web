import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pin, UserCheck, UserX, Clock } from "lucide-react";
import type { FriendWithDetails } from "@features/friends/hooks/useFriendDetails";
import type { FriendEnriched } from "@features/friends/store/friend.model";
import { getFriendDisplayName, getFriendInitials, getOtherUserId } from "@features/friends/store/friend.model";
import MiloAvatar from "@shared/components/MiloAvatar.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";

interface FriendCardProps {
	friend: FriendWithDetails | FriendEnriched;
	index?: number;
	onTogglePin: (id: number) => void;
	onAccept: (id: number) => void;
	onDelete: (id: number) => void;
	isPending?: boolean;
}

const MAX_INTERESTS = 3;

/**
 * Carte de joueur : bandeau coloré, Milo de l'ami en médaillon, série et XP
 * en tuiles, centres d'intérêt en pastilles. Épingler et retirer restent
 * discrets ; accepter une invitation est l'action mise en avant.
 */
const FriendCard: React.FC<FriendCardProps> = ({
	friend,
	index = 0,
	onTogglePin,
	onAccept,
	onDelete,
	isPending = false,
}) => {
	const reduceMotion = useReducedMotion();
	const details = "classe" in friend || "username" in friend ? (friend as FriendWithDetails) : null;
	const nameSource = { ...friend, username: details?.username };
	const initials = getFriendInitials(nameSource);
	const displayName = getFriendDisplayName(nameSource);
	const isReceived = isPending && friend.direction === "received";
	const isSent = isPending && friend.direction === "sent";
	const isPinned = friend.is_pinned;
	const otherUserId = getOtherUserId(friend);
	const interests = details?.interests ?? [];
	const classe = details?.classe ? `${details.classe[0]}ème` : null;

	return (
		<motion.article
			layout
			className={`fr-card${isPinned && !isPending ? " is-pinned" : ""}${isReceived ? " is-invite" : ""}${isSent ? " is-sent" : ""}`}
			initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.94 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ type: "spring", stiffness: 220, damping: 18, delay: Math.min(index, 8) * 0.04 }}
		>
			<div className="fr-card__band" aria-hidden="true" />

			{!isPending && (
				<button
					type="button"
					className={`fr-card__pin${isPinned ? " is-on" : ""}`}
					onClick={() => onTogglePin(otherUserId)}
					aria-pressed={isPinned}
					aria-label={isPinned ? `Désépingler ${displayName}` : `Épingler ${displayName} en haut de la liste`}
					title={isPinned ? "Désépingler" : "Épingler"}
				>
					<Pin size={17} fill={isPinned ? "currentColor" : "none"} aria-hidden="true" />
				</button>
			)}


			<div className="fr-card__avatar">
				<MiloAvatar equippedMeshNames={details?.equipped_meshes} initials={initials} />
			</div>

			<div className="fr-card__id">
				<h3 className="fr-card__name">{displayName}</h3>
				{isReceived ? (
					<span className="fr-card__tag fr-card__tag--invite">Veut rejoindre ta bande</span>
				) : isSent ? (
					<span className="fr-card__tag">Invitation envoyée</span>
				) : classe ? (
					<span className="fr-card__tag">{classe}</span>
				) : null}
			</div>

			{!isPending && (details?.streak !== undefined || details?.xp !== undefined) && (
				<div className="fr-card__stats">
					<span className={`fr-stat fr-stat--fire${(details?.streak ?? 0) > 0 ? " is-hot" : ""}`}>
						<Emoji3D name="fire" />
						<span className="fr-stat__value">{details?.streak ?? 0}</span>
						<span className="fr-stat__label">jour{(details?.streak ?? 0) > 1 ? "s" : ""}</span>
					</span>
					<span className="fr-stat fr-stat--xp">
						<Emoji3D name="high_voltage" />
						<span className="fr-stat__value">{(details?.xp ?? 0).toLocaleString("fr-FR")}</span>
						<span className="fr-stat__label">XP</span>
					</span>
				</div>
			)}

			{!isSent && (
				interests.length > 0 ? (
					<ul className="fr-card__interests" aria-label="Centres d'intérêt">
						{interests.slice(0, MAX_INTERESTS).map((interest) => (
							<li key={interest.id}>{interest.name}</li>
						))}
						{interests.length > MAX_INTERESTS && (
							<li className="is-more" title={interests.slice(MAX_INTERESTS).map((i) => i.name).join(", ")}>
								+{interests.length - MAX_INTERESTS}
							</li>
						)}
					</ul>
				) : (
					<p className="fr-card__no-interest">Pas encore de centres d'intérêt</p>
				)
			)}

			<div className="fr-card__foot">
				{isReceived ? (
					<>
						<button type="button" className="fr-btn fr-btn--primary fr-btn--grow" onClick={() => onAccept(friend.id)}>
							<UserCheck size={19} strokeWidth={2.6} aria-hidden="true" />
							Accepter
						</button>
						<button type="button" className="fr-icon-btn" onClick={() => onDelete(otherUserId)} aria-label={`Refuser l'invitation de ${displayName}`} title="Refuser">
							<UserX size={19} aria-hidden="true" />
						</button>
					</>
				) : isSent ? (
					<>
						<span className="fr-card__waiting">
							<Clock size={18} aria-hidden="true" /> En attente de réponse
						</span>
						<button type="button" className="fr-icon-btn" onClick={() => onDelete(otherUserId)} aria-label={`Annuler la demande à ${displayName}`} title="Annuler la demande">
							<UserX size={19} aria-hidden="true" />
						</button>
					</>
				) : (
					<button type="button" className="fr-card__remove" onClick={() => onDelete(otherUserId)} aria-label={`Retirer ${displayName} de mes amis`}>
						<UserX size={16} aria-hidden="true" /> Retirer
					</button>
				)}
			</div>
		</motion.article>
	);
};

export default FriendCard;
