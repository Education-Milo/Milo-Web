import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useDialogKeys, usePresence } from "@features/home/hooks/usePresence";
import "@features/home/styles/HomeOverlays.css";

/// Le courrier : une enveloppe s'envole de la boîte aux lettres jusqu'au
/// milieu de l'écran, son rabat s'ouvre, une lettre en sort… et on la lit en
/// grand. Un clic pendant l'animation la passe.

/// Durée de l'arrivée de la lettre (vol, ouverture, sortie de la lettre)
const INTRO_MS = 2300;

export interface NewsItem {
	id: number;
	date: string;
	emoji: string;
	title: string;
	text: string;
}

interface NewsLetterOverlayProps {
	open: boolean;
	onClose: () => void;
	news: NewsItem[];
	firstName: string;
}

const NewsLetterOverlay: React.FC<NewsLetterOverlayProps> = ({ open, onClose, news, firstName }) => {
	const { mounted, closing } = usePresence(open, 340);
	const titleId = useId();
	const layerRef = useRef<HTMLDivElement>(null);
	const reducedMotion = Boolean(useReducedMotion());
	/// Passer l'animation (clic pendant l'arrivée) ; lettre prête à lire
	const [skip, setSkip] = useState(false);
	const [ready, setReady] = useState(false);
	useDialogKeys(open, onClose, layerRef);

	useEffect(() => {
		if (!open) return;
		setSkip(false);
		setReady(reducedMotion);
		if (reducedMotion) return;
		const id = window.setTimeout(() => setReady(true), INTRO_MS);
		return () => window.clearTimeout(id);
	}, [open, reducedMotion]);

	/// Pendant l'arrivée, un clic la passe ; ensuite, un clic à côté range la lettre
	const handleOutside = () => {
		if (ready) onClose();
		else {
			setSkip(true);
			setReady(true);
		}
	};

	/// L'enveloppe part de la boîte aux lettres : la scène a écrit sa position
	/// à l'écran (--mail-x / --mail-y) sur la page ; on en déduit le départ
	useLayoutEffect(() => {
		const layer = layerRef.current;
		if (!open || !layer) return;
		const host = layer.parentElement;
		if (!host) return;
		const style = getComputedStyle(host);
		const mailX = parseFloat(style.getPropertyValue("--mail-x"));
		const mailY = parseFloat(style.getPropertyValue("--mail-y"));
		const fromX = Number.isFinite(mailX) ? mailX - host.clientWidth / 2 : host.clientWidth * 0.3;
		const fromY = Number.isFinite(mailY) ? mailY - host.clientHeight / 2 : 0;
		layer.style.setProperty("--from-x", `${fromX}px`);
		layer.style.setProperty("--from-y", `${fromY}px`);
	}, [open, mounted]);

	if (!mounted) return null;

	return (
		<div
			ref={layerRef}
			tabIndex={-1}
			className={`courrier-layer${closing ? " is-closing" : ""}${skip ? " is-skip" : ""}`}
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
		>
			<div className="courrier-backdrop" onClick={handleOutside} aria-hidden="true" />

			{/* L'enveloppe : vole jusqu'au centre, s'ouvre, laisse sortir la lettre */}
			<div className="courrier-flight" onClick={handleOutside} aria-hidden="true">
				<div className="courrier-envelope">
					<div className="courrier-env-back" />
					<div className="courrier-peek">
						<span />
						<span />
						<span />
					</div>
					<div className="courrier-env-pocket" />
					<div className="courrier-env-flap">
						<img src="/fox_emoji.png" alt="" className="courrier-seal" />
					</div>
				</div>
			</div>

			{/* La lettre, en grand */}
			<article className="courrier-sheet">
				<header className="courrier-head">
					<div>
						<p className="courrier-to">Pour {firstName}</p>
						<h2 id={titleId} className="courrier-title">
							Les nouvelles de Milo
						</h2>
					</div>
					<div className="courrier-stamp" aria-hidden="true">
						<img src="/fox_emoji.png" alt="" />
					</div>
					<span className="courrier-postmark" aria-hidden="true">
						MILO · POSTE
					</span>
				</header>

				<ul className="courrier-list">
					{news.map((item, i) => (
						<li key={item.id} className="courrier-item" style={{ "--i": i } as React.CSSProperties}>
							<span className="courrier-item-emoji" aria-hidden="true">
								{item.emoji}
							</span>
							<div className="courrier-item-body">
								<span className="courrier-item-date">{item.date}</span>
								<h3 className="courrier-item-title">{item.title}</h3>
								<p className="courrier-item-text">{item.text}</p>
							</div>
						</li>
					))}
				</ul>

				<footer className="courrier-foot">
					<span className="courrier-sign">À très vite, Milo 🦊</span>
					<button type="button" className="courrier-close" onClick={onClose}>
						<X size={18} strokeWidth={3} aria-hidden="true" />
						<span>Ranger la lettre</span>
					</button>
				</footer>
			</article>
		</div>
	);
};

export default NewsLetterOverlay;
