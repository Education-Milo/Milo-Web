import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Swords, X } from "lucide-react";
import { useDuel } from "@features/duels/context/DuelContext";
import { fetchUserByUsername } from "@shared/store/user/user.queries";
import DuelMilo3D, { type DuelDance } from "@features/duels/components/DuelMilo3D.component";
import Emoji3D from "@features/landing/ui/Emoji3D.component";
import "@features/duels/styles/ChallengePopup.css";

const RING_R = 30;
const RING_C = 2 * Math.PI * RING_R;

/**
 * Défi reçu : même mise en scène que les rappels bien-être (scène
 * illustrée à gauche, texte et actions à droite), avec le Milo 3D de la
 * personne qui défie, dans sa tenue, qui salue en arrivant.
 */
const ChallengeNotification: React.FC = () => {
	const { pendingChallenge, acceptChallenge, declineChallenge } = useDuel();
	const reduceMotion = useReducedMotion();
	const [timeLeft, setTimeLeft] = useState(0);
	const [total, setTotal] = useState(60);
	const [dance, setDance] = useState<DuelDance | null>(null);
	const acceptRef = useRef<HTMLButtonElement>(null);

	const username = pendingChallenge?.from_username;
	// Profil public de l'adversaire : sa tenue (pour son Milo 3D), sa classe, son XP
	const { data: challenger } = useQuery({
		queryKey: ["users", "username", username],
		queryFn: () => fetchUserByUsername(username as string),
		enabled: Boolean(username),
		staleTime: 5 * 60 * 1000,
	});

	useEffect(() => {
		if (!pendingChallenge) return;
		setTotal(pendingChallenge.expires_in || 60);
		setTimeLeft(pendingChallenge.expires_in);
		const id = setInterval(() => setTimeLeft((t) => (t <= 1 ? 0 : t - 1)), 1000);
		// Il salue en arrivant
		const hello = setTimeout(() => setDance({ clip: "Hello", seq: Date.now() }), 700);
		acceptRef.current?.focus();
		return () => {
			clearInterval(id);
			clearTimeout(hello);
		};
	}, [pendingChallenge?.challenge_id]); // eslint-disable-line react-hooks/exhaustive-deps

	const urgent = timeLeft <= 10;
	const classe = challenger?.class_ ?? challenger?.classe;

	return (
		<AnimatePresence>
			{pendingChallenge && (
				<motion.div className="cp-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
					<motion.div
						className="cp-card"
						role="alertdialog"
						aria-modal="true"
						aria-labelledby="cp-title"
						aria-describedby="cp-body"
						initial={reduceMotion ? false : { y: 40, opacity: 0, scale: 0.9, rotate: -2 }}
						animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
						exit={{ y: 20, opacity: 0, scale: 0.95 }}
						transition={{ type: "spring", stiffness: 260, damping: 18 }}
					>
						<button type="button" className="cp-close" onClick={declineChallenge} aria-label="Refuser le défi">
							<X size={20} aria-hidden="true" />
						</button>

						{/* Scène : le Milo 3D de l'adversaire sous les fanions */}
						<div className="cp-scene" aria-hidden="true">
							<span className="cp-scene__dots" />
							<ul className="cp-pennants">
								{["#FFFBF6", "#F1D2B2", "#C73A0C", "#FFFFFF", "#F6EBDF", "#C73A0C", "#FFFBF6"].map((c, i) => (
									<motion.li
										key={i}
										style={{ background: c }}
										initial={reduceMotion ? false : { y: -30 }}
										animate={{ y: 0 }}
										transition={{ type: "spring", stiffness: 300, damping: 9, delay: 0.15 + i * 0.05 }}
									/>
								))}
							</ul>
							<span className="cp-scene__floor" />
							<img src="/duels/milo-chevalier.webp" alt="" className="cp-scene__fallback" draggable={false} />
							<DuelMilo3D equippedMeshNames={challenger?.equipped_meshes ?? []} state="waiting" dance={dance} facing="right" className="cp-scene__milo" />
							<motion.span
								className="cp-scene__swords"
								initial={reduceMotion ? false : { scale: 0, rotate: -160 }}
								animate={{ scale: 1, rotate: 0 }}
								transition={{ type: "spring", stiffness: 300, damping: 9, delay: 0.45 }}
							>
								<Emoji3D name="crossed_swords" />
							</motion.span>
							<span className="cp-scene__name">{username}</span>
						</div>

						{/* Texte et actions */}
						<div className="cp-content">
							<div className="cp-titles">
								<motion.h2
									id="cp-title"
									className="cp-title"
									initial={reduceMotion ? false : { scale: 1.6, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									transition={{ type: "spring", stiffness: 380, damping: 12, delay: 0.25 }}
								>
									Défi <span className="cp-hl">reçu</span> !
								</motion.h2>
								<p id="cp-body" className="cp-body">
									<b>{username}</b> te provoque en duel. 5 questions, le plus rapide gagne : tu relèves le défi ?
								</p>
							</div>

							<div className="cp-meta">
								{classe && <span className="cp-chip"><Emoji3D name="student" />{String(classe).replace("eme", "ème")}</span>}
								{typeof challenger?.xp === "number" && (
									<span className="cp-chip"><Emoji3D name="high_voltage" />{challenger.xp.toLocaleString("fr-FR")} XP</span>
								)}
								<span className={`cp-timer${urgent ? " is-urgent" : ""}`} aria-live="polite">
									<svg viewBox="0 0 72 72" aria-hidden="true">
										<circle cx="36" cy="36" r={RING_R} fill="none" stroke="#F6EBDF" strokeWidth="7" />
										<circle
											cx="36"
											cy="36"
											r={RING_R}
											fill="none"
											stroke="currentColor"
											strokeWidth="7"
											strokeLinecap="round"
											strokeDasharray={RING_C}
											strokeDashoffset={RING_C * (1 - timeLeft / Math.max(total, 1))}
											transform="rotate(-90 36 36)"
											style={{ transition: "stroke-dashoffset 1s linear" }}
										/>
									</svg>
									<span className="cp-timer__value">{timeLeft}</span>
									<span className="cp-sr-only">secondes avant que le défi expire</span>
								</span>
							</div>

							<div className="cp-actions">
								<button ref={acceptRef} type="button" className="cp-btn cp-btn--accept" onClick={acceptChallenge}>
									<Swords size={22} strokeWidth={2.6} aria-hidden="true" />
									Accepter le duel
								</button>
								<button type="button" className="cp-btn cp-btn--decline" onClick={declineChallenge}>
									Pas maintenant
								</button>
							</div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default ChallengeNotification;
