import React, { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Clock, Loader, Search, UserPlus, X } from "lucide-react";
import { useSearchUsers, useUsersByUsernames } from "@shared/store/user/user.queries";
import { useSendFriendRequest, useFriends as useFriendsQuery } from "@features/friends/store/friend.queries";
import MiloAvatar from "@shared/components/MiloAvatar.component";
import { useUserStore } from "@shared/store/user/user.store";
import "@features/friends/styles/AddFriendModal.css";

interface AddFriendModalProps {
	onClose: () => void;
}

const MIN_QUERY = 2;

/** « 5eme » → « 5ème » */
const classeLabel = (classe?: string | null) => (classe ? classe.replace("eme", "ème") : null);

/**
 * Recherche d'un ami par pseudo : chaque résultat montre le Milo de la
 * personne (avec sa tenue), sa classe et son XP, puis l'état de la relation.
 */
const AddFriendModal: React.FC<AddFriendModalProps> = ({ onClose }) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [sentFriendIds, setSentFriendIds] = useState<number[]>([]);
	const [errorFriendIds, setErrorFriendIds] = useState<number[]>([]);
	const inputId = useId();
	const titleId = useId();
	const inputRef = useRef<HTMLInputElement>(null);

	const query = searchQuery.trim();
	const { data: results = [], isLoading, isFetching } = useSearchUsers(query);
	const me = useUserStore((state) => state.user?.username);
	const visible = results.filter((username) => username !== me);
	const usersByUsername = useUsersByUsernames(visible);
	const sendRequest = useSendFriendRequest();
	const { data: allFriends = [] } = useFriendsQuery();

	// Focus dans le champ + Échap pour fermer
	useEffect(() => {
		inputRef.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const handleSend = (friendId: number) => {
		setErrorFriendIds((prev) => prev.filter((id) => id !== friendId));
		sendRequest.mutate(friendId, {
			onSuccess: () => setSentFriendIds((prev) => [...prev, friendId]),
			onError: () => setErrorFriendIds((prev) => [...prev, friendId]),
		});
	};

	const searching = query.length >= MIN_QUERY && (isLoading || isFetching);

	return (
		<motion.div
			className="af-overlay"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onClose}
		>
			<motion.div
				className="af-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				initial={{ y: 30, opacity: 0, scale: 0.96 }}
				animate={{ y: 0, opacity: 1, scale: 1 }}
				exit={{ y: 20, opacity: 0, scale: 0.97 }}
				transition={{ type: "spring", stiffness: 260, damping: 24 }}
				onClick={(e) => e.stopPropagation()}
			>
				<button type="button" className="af-close" onClick={onClose} aria-label="Fermer">
					<X size={20} aria-hidden="true" />
				</button>

				<header className="af-head">
					<img src="/landing/emoji/student.webp" alt="" className="af-head__icon" draggable={false} />
					<div className="af-head__titles">
						<h2 id={titleId} className="af-title">Ajouter un ami</h2>
						<p className="af-sub">Retrouve-le grâce à son pseudo, puis envoie-lui une demande.</p>
					</div>
				</header>

				<div className="af-search">
					<label htmlFor={inputId} className="af-label">Pseudo de ton ami</label>
					<div className="af-field">
						<Search size={20} className="af-field__icon" aria-hidden="true" />
						<input
							id={inputId}
							ref={inputRef}
							type="text"
							placeholder="Ex. : lea_du_76"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							autoComplete="off"
							spellCheck={false}
						/>
						{searching && <Loader size={20} className="af-field__spin" aria-label="Recherche en cours" />}
					</div>
				</div>

				<div className="af-results" aria-live="polite">
					{query.length < MIN_QUERY ? (
						<div className="af-empty">
							<img src="/landing/emoji/fox.webp" alt="" draggable={false} />
							<p>Tape au moins {MIN_QUERY} lettres du pseudo pour lancer la recherche.</p>
						</div>
					) : !searching && visible.length === 0 ? (
						<div className="af-empty">
							<img src="/landing/emoji/locked.webp" alt="" draggable={false} />
							<p>
								Aucun élève trouvé pour <b>« {query} »</b>. Vérifie l'orthographe du pseudo.
							</p>
						</div>
					) : (
						<ul className="af-list">
							{visible.map((username, index) => {
								const user = usersByUsername[index]?.data;
								const friendId = Number(user?.id);
								const cannotSend = sendRequest.isPending || !user || Number.isNaN(friendId);
								const isSent = sentFriendIds.includes(friendId);
								const isError = errorFriendIds.includes(friendId);
								const relation = allFriends.find((f) => f.friend_id === friendId || f.user_id === friendId);
								const isPendingSent = (relation?.status === "pending" && relation.direction === "sent") || isSent;
								const isPendingReceived = relation?.status === "pending" && relation.direction === "received";
								const isAlreadyFriend = relation?.status === "accepted";
								const classe = classeLabel(user?.class_ ?? user?.classe);

								return (
									<li key={username} className="af-item">
										<span className="af-avatar">
											<MiloAvatar
												equippedMeshNames={user?.equipped_meshes}
												initials={username.slice(0, 2).toUpperCase()}
												className="af-avatar__initials"
											/>
										</span>
										<span className="af-item__info">
											<span className="af-item__name">@{username}</span>
											<span className="af-item__meta">
												{classe && <span>{classe}</span>}
												{typeof user?.xp === "number" && <span>{user.xp.toLocaleString("fr-FR")} XP</span>}
												{!user && <span>Chargement…</span>}
											</span>
										</span>

										{isAlreadyFriend ? (
											<span className="af-status af-status--friend">
												<Check size={16} aria-hidden="true" /> Déjà ami
											</span>
										) : isPendingSent ? (
											<span className="af-status af-status--sent">
												<Clock size={16} aria-hidden="true" /> Demande envoyée
											</span>
										) : isPendingReceived ? (
											<span className="af-status af-status--received">Il t'a invité</span>
										) : (
											<button
												type="button"
												className={`af-add${isError ? " is-error" : ""}`}
												onClick={() => handleSend(friendId)}
												disabled={cannotSend}
											>
												<UserPlus size={18} aria-hidden="true" />
												{isError ? "Réessayer" : "Ajouter"}
											</button>
										)}
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</motion.div>
		</motion.div>
	);
};

export default AddFriendModal;
