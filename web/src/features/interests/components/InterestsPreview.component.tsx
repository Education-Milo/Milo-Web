import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useUserStore } from "@shared/store/user/user.store";
import "@features/interests/styles/InterestsEditor.css";

/// À côté de l'éditeur (écran large) : à quoi servent les centres d'intérêt.
/// Milo cite tour à tour ceux de l'élève et montre où il les glisse.

const CYCLE_MS = 3600;

const USES = [
	{ emoji: "/landing/emoji/bar_chart.webp", label: "Des problèmes de maths" },
	{ emoji: "/landing/emoji/books.webp", label: "Des textes à lire" },
	{ emoji: "/landing/emoji/globe.webp", label: "Des questions d'histoire-géo" },
];

const InterestsPreview: React.FC = () => {
	const interests = useUserStore((state) => state.user?.Interests);
	const reduceMotion = useReducedMotion();
	const names = (interests ?? []).map((interest) => interest.name);
	const [tick, setTick] = useState(0);

	/// Plusieurs centres d'intérêt : Milo les cite l'un après l'autre
	useEffect(() => {
		if (names.length < 2 || reduceMotion) return;
		const id = window.setInterval(() => setTick((t) => t + 1), CYCLE_MS);
		return () => window.clearInterval(id);
	}, [names.length, reduceMotion]);

	/// (le plus récent d'abord : on voit tout de suite celui qu'on vient d'ajouter)
	const current = names.length > 0 ? names[names.length - 1 - (tick % names.length)] : null;

	return (
		<aside className="ip" aria-label="À quoi servent tes centres d'intérêt">
			<div className="ip-bubble" aria-live="polite">
				<AnimatePresence mode="wait" initial={false}>
					<motion.p
						key={current ?? "none"}
						className="ip-bubble-text"
						initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
						transition={{ duration: 0.25 }}
					>
						{current ? (
							<>
								Tu aimes <b className="ip-hl">{current}</b> ? Je m'en sers pour t'inventer des exercices rien
								que pour toi !
							</>
						) : (
							<>Dis-moi ce que tu aimes : je glisserai tes passions dans tes exercices !</>
						)}
					</motion.p>
				</AnimatePresence>
			</div>

			<ul className="ip-uses">
				{USES.map((use) => (
					<li key={use.label} className="ip-use">
						<img src={use.emoji} alt="" aria-hidden="true" draggable={false} />
						{use.label}
					</li>
				))}
			</ul>

			<img className="ip-milo" src="/landing/milo/milo-charte.webp" alt="" aria-hidden="true" draggable={false} />
		</aside>
	);
};

export default InterestsPreview;
