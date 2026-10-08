import React, { useEffect, useRef, useState } from "react";
import { ArrowDown, Check, Copy, Plus, X } from "lucide-react";
import type { MemoItem } from "@features/milo-scene/store/memo.store";
import { plainText } from "@features/milo-scene/utils/lessonText";

interface NotesPostItProps {
	isHeld: boolean;
	lessonTitle: string;
	items: MemoItem[];
	onAdd: (text: string) => void;
	onRemove: (id: string) => void;
	onRevise: () => void;
	onClose: () => void;
	/** Milo répond encore : on attend avant de lui demander de réviser */
	busy: boolean;
	/** Écran étroit : le post-it est hors champ, pas d'aperçu sur le bureau */
	hideIdle?: boolean;
}

const NOTE_MAX = 300;

/// Le post-it « Mes notes » du bureau : les passages que l'élève garde pour
/// réviser (phrases du tableau, explications de Milo, ses propres notes).
/// Posé, il affiche le nombre de notes ; pris en main, on peut les relire,
/// en ajouter, les copier, ou demander à Milo de nous interroger dessus.
const NotesPostIt: React.FC<NotesPostItProps> = ({
	isHeld,
	lessonTitle,
	items,
	onAdd,
	onRemove,
	onRevise,
	onClose,
	busy,
	hideIdle = false,
}) => {
	const [draft, setDraft] = useState("");
	const [copied, setCopied] = useState(false);
	const listRef = useRef<HTMLUListElement>(null);

	// Une nouvelle note : on la montre en bas de la liste
	useEffect(() => {
		const list = listRef.current;
		if (list) list.scrollTop = list.scrollHeight;
	}, [items.length, isHeld]);

	if (!isHeld) {
		if (hideIdle) return null;
		return (
			<div className="cls-postit-idle">
				<p className="cls-postit-idle-title">Mes notes</p>
				<span className="cls-postit-idle-count">
					{items.length === 0 ? "vide" : `${items.length} note${items.length > 1 ? "s" : ""}`}
				</span>
			</div>
		);
	}

	const add = () => {
		const text = draft.trim();
		if (!text) return;
		onAdd(text.slice(0, NOTE_MAX));
		setDraft("");
	};

	const copy = async () => {
		const text = [`Mes notes — ${lessonTitle}`, "", ...items.map((item) => `• ${plainText(item.text)}`)].join("\n");
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 1800);
		} catch {
			setCopied(false);
		}
	};

	return (
		<div
			className="cls-postit-held"
			onKeyDown={(e) => {
				if (e.key === "Escape") {
					e.preventDefault();
					onClose();
				}
			}}
		>
			<header className="cls-postit-head">
				<div>
					<p className="cls-postit-title">
						Mes <span className="cls-hl">notes</span>
					</p>
					<p className="cls-postit-sub">Ce que tu gardes pour réviser cette leçon.</p>
				</div>
				<button type="button" className="cls-paper-close" onClick={onClose}>
					<ArrowDown size={16} aria-hidden="true" />
					Reposer
				</button>
			</header>

			{items.length === 0 ? (
				<div className="cls-postit-empty">
					<img src="/landing/emoji/card_index_dividers.webp" alt="" aria-hidden="true" />
					<p>
						<b>Ton post-it est vide.</b>
						<br />
						Passe ta souris sur une phrase du tableau et clique sur <b>« Noter »</b> : elle viendra se coller ici.
					</p>
				</div>
			) : (
				<ul className="cls-postit-list" ref={listRef}>
					{items.map((item) => (
						<li key={item.id} className="cls-postit-note">
							<span className="cls-postit-note-src">{item.source}</span>
							<p>{plainText(item.text)}</p>
							<button
								type="button"
								className="cls-postit-remove"
								onClick={() => onRemove(item.id)}
								aria-label="Retirer cette note"
								title="Retirer cette note"
							>
								<X size={14} />
							</button>
						</li>
					))}
				</ul>
			)}

			<form
				className="cls-postit-add"
				onSubmit={(e) => {
					e.preventDefault();
					add();
				}}
			>
				<label htmlFor="cls-postit-input" className="cls-sr-only">
					Ajouter ma propre note
				</label>
				<input
					id="cls-postit-input"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					placeholder="Ajoute ta propre note…"
					maxLength={NOTE_MAX}
					autoComplete="off"
				/>
				<button type="submit" disabled={!draft.trim()} aria-label="Ajouter la note">
					<Plus size={18} />
				</button>
			</form>

			<footer className="cls-postit-foot">
				<button type="button" className="cls-paper-chip" onClick={copy} disabled={items.length === 0}>
					{copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
					{copied ? "Copiées !" : "Copier"}
				</button>
				<button
					type="button"
					className="cls-btn cls-btn--primary cls-btn--sm"
					onClick={onRevise}
					disabled={items.length === 0 || busy}
				>
					<img className="cls-btn-emoji" src="/landing/emoji/brain.webp" alt="" aria-hidden="true" />
					Révise avec Milo
				</button>
			</footer>
		</div>
	);
};

export default NotesPostIt;
